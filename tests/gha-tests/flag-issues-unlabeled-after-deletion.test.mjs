import STATIC_ISSUE_NUMS from "../../github-actions/utils/_data/static-issue-nums.json";
import TEST_CONFIG from "./utils/test-config.mjs";
import GitHubHelper from "./utils/gh-helper.mjs";

import console from "console"; // override jest logging

/**
 * Test suite for the "Flag Issues With Deleted Labels" workflow.
 *
 * This suite validates that:
 * - Recently deleted labels are detected correctly.
 * - A notification issue is created with the correct title, body, and affected issues.
 * - Comments are correctly posted to the agenda issue.
 * - If agenda issue is missing, a missing agenda issue is created.
 * - Template variables are correctly substituted in issue bodies and comments.
 */
describe("Flag Issues With Deleted Labels Workflow Tests", () => {
  let gh;
  const notificationIssues = {};
  const agendaNoticeIssues = {};
  const numTestIssues = 5;
  const testIssues = [];
  const timestamp = new Date().toISOString();
  let agendaIssue;

  /* -------------------------------------------------------------------------- */
  /*                               Helper Functions                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Assert that the given text mentions all and only the provided issues.
   * Expects issues to appear in `- #<number>` format.
   *
   * @param {string} text - The body text to check.
   * @param {Array<Object>} issuesToMention - Array of issue objects with `number`.
   */
  const checkIssueMentions = (text, issuesToMention = []) => {
    const mentionedNumbers = Array.from(text.matchAll(/- #(\d+)/g), (m) =>
      Number(m[1]),
    );
    const toMentionNumbers = issuesToMention.map((a) => Number(a.number));

    expect(toMentionNumbers.sort()).toEqual([...mentionedNumbers].sort());
  };

  /**
   * Validate whether the notification issue for a deleted label exists,
   * and if so, that it has the correct metadata and mentions.
   *
   * @param {Object} params
   * @param {string} params.labelName - The deleted label’s name.
   * @param {boolean} params.shouldExist - Whether the issue should exist.
   * @param {Array<Object>} params.issuesToMention - Issues expected to be listed.
   */
  const checkNotificationIssue = async ({
    labelName,
    shouldExist = true,
    issuesToMention = [],
  }) => {
    notificationIssues[labelName] = await gh.waitForIssue(
      `Review Needed - Label \`${labelName}\` Deleted`,
    );
    if (shouldExist) {
      expect(notificationIssues[labelName]).not.toBeNull();
      // Check labels
      const expectedIssueLabels = [
        "Complexity: Small",
        "size: 0.5pt",
        "Feature: Administrative",
        "role: back end/devOps",
        "ready for product"
      ];

      for (const expectedIssueLabel of expectedIssueLabels) {
        expect(
          notificationIssues[labelName].labels.map((l) => l.name)).toContain(
            expectedIssueLabel
        );
      }
      
      checkIssueMentions(notificationIssues[labelName].body, issuesToMention);
    } else {
      expect(notificationIssues[labelName]).toBeNull();
    }
  };

  /**
   * Validate whether the agenda issue was updated correctly after label deletion.
   * If the agenda issue does not exist, a "missing agenda" issue should be created instead.
   *
   * @param {Object} params
   * @param {string} params.labelName - The deleted label’s name.
   * @param {boolean} params.shouldExist - Whether an agenda update is expected.
   * @param {Array<Object>} params.issuesToMention - Issues expected to be listed.
   */
  const checkAgenda = async ({
    labelName,
    shouldExist = true,
    issuesToMention = [],
  }) => {
    if (!agendaIssue || agendaIssue["state"] != "open") {
      // Agenda issue was not found or is closed
      agendaNoticeIssues[labelName] = await gh.waitForIssue(
          `Review Needed - Error Posting to Agenda Issue #${STATIC_ISSUE_NUMS.AGENDA} for Label \`${labelName}\` Deletion`,
      );
      if (shouldExist) {
        // We are supposed to notify, and there is no matching Agenda issue, so we should have made a new Agenda Missing issue
        expect(agendaNoticeIssues[labelName]).not.toBeNull();

        // Check the labels of the created Agenda Issue
        const expectedIssueLabels = [
          "Complexity: Small",
          "size: 0.5pt",
          "Feature: Administrative",
          "role: back end/devOps",
          "ready for product"
        ];
  
        for (const expectedIssueLabel of expectedIssueLabels) {
          expect(
            agendaNoticeIssues[labelName].labels.map((l) => l.name)).toContain(
              expectedIssueLabel
          );
        }
      } else {
        // We are not supposed to notify, so we should not have made an Agenda Missing issue
        expect(agendaNoticeIssues[labelName]).toBeNull();
      }
    } else {
      // An agenda issue was found. Get its comments for parsing.
      const agendaComments = await gh.getIssueComments(agendaIssue.number);
      if (shouldExist) {
        // We are supposed to notify and there is an Agenda issue, so we should have posted a comment on the Agenda
        const noticeComment = agendaComments.find(
          (c) =>
            c.body.includes(
              `Review Deleted Label: #${notificationIssues[labelName].number}`,
            ) && c.body.includes(labelName),
        );
        expect(noticeComment).toBeDefined();
        checkIssueMentions(noticeComment.body, issuesToMention);
      } else {
        // We are not supposed to notify and there is an Agenda issue, so we should make sure there is no comment
        const noticeComment = agendaComments.find((c) =>
          c.body.includes(labelName),
        );
        expect(noticeComment).not.toBeDefined();
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                              Test Hooks                                    */
  /* -------------------------------------------------------------------------- */

  beforeAll(async () => {
    // Get GH helper handle
    gh = new GitHubHelper(
      TEST_CONFIG.REPO_OWNER,
      TEST_CONFIG.REPO_NAME,
      TEST_CONFIG.REPO_TOKEN,
    );
    expect(gh).toBeDefined();

    // Get the agenda issue
    agendaIssue = await gh.getIssue(STATIC_ISSUE_NUMS.AGENDA);

    // Create pool of reusable test issues
    for (let i = 1; i <= numTestIssues; i++) {
      const issueName = `[TEST] Issue ${i}-${timestamp}`;
      const issueDesc = `This is test issue ${i} created at ${timestamp}`;
      const issueNumber = await gh.createIssue(issueName, issueDesc);

      testIssues.push({
        name: issueName,
        desc: issueDesc,
        number: issueNumber,
      });
    }

    // Validate issue creation
    expect(testIssues.length).toEqual(numTestIssues);
    for (const testIssue of testIssues) {
      const issue = await gh.getIssue(testIssue.number);
      expect(issue.title).toBe(testIssue.name);
      expect(issue.body).toBe(testIssue.desc);
    }
  });

  beforeEach(async () => {
    // Reset test issues (open + no labels)
    // Do it in parallel to speed things up a bit
    await Promise.all(
      testIssues.map(async (testIssue) => {
        await gh.reopenIssue(testIssue.number);
        await gh.removeAllLabelsFromIssue(testIssue.number);
      }),
    );

    // Make sure all prior test labels are deleted before start
    await gh.label_cleanup();
  });

  afterAll(async () => {
    await Promise.allSettled([
      // Close notification and agenda missing issues (with some safety checking)
      ...Object.values(notificationIssues)
        .filter((issue) => issue && issue.number)
        .map((issue) =>
          gh.closeIssue(issue.number, "Test cleanup - notification issue"),
        ),

      ...Object.values(agendaNoticeIssues)
        .filter((issue) => issue && issue.number)
        .map((issue) =>
          gh.closeIssue(issue.number, "Test cleanup - agenda notice issue"),
        ),
    ]);

    await gh.cleanup();
  });

  /* -------------------------------------------------------------------------- */
  /*                                   Tests                                    */
  /* -------------------------------------------------------------------------- */

  describe("nominal tests", () => {
    it("single label test", async () => {
      console.info("Running single label deletion test (duration ~30s)");

      // Create test Label
      const labelName = `test-label-A-${timestamp}`;
      const labelColor = `32a852`;
      const labelDesc = "Label A for Test";
      await gh.createLabel(labelName, labelColor, labelDesc);

      // Add label to all test issues
      for (const testIssue of testIssues) {
        await gh.addLabelsToIssue(testIssue.number, [labelName]);
      }

      // Delete the label (this should trigger the workflow and affect all created issues)
      await gh.deleteLabel(labelName);

      // Check for the newly created notification issue
      await checkNotificationIssue({
        labelName,
        shouldExist: true,
        issuesToMention: testIssues,
      });

      // Check the agenda (either for a new comment or an agenda missing issue);
      await checkAgenda({
        labelName,
        shouldExist: true,
        issuesToMention: testIssues,
      });
    });

    it("multi-label test", async () => {
      console.info(
        "Running multi-label deletion test (duration ~65s)",
      );
      // Create 4 test label names
      const testLabels = [];
      for (let i = 0; i < 4; i++) {
        const labelName = `test-label-B${i}-${timestamp}`;
        testLabels.push(labelName);
      }
      const labelColor = `56359e`;

      // Request them to be made async
      await Promise.all(
        testLabels.map((labelName) => gh.createLabel(labelName, labelColor)),
      );

      // Add labels to our issues
      // Should wind up with
      // Label 0: Issues 0, 1
      // Label 1: Issues 1, 3
      // Label 2: Issues 3, 4
      // Label 3: No issues
      expect(numTestIssues > 4).toBe(true); // make sure we have enough issues for this test
      const label0Issues = testIssues.slice(0, 2);
      const label1Issues = testIssues.slice(1, 4);
      const label2Issues = testIssues.slice(3, 5);

      // Add labels to all our issues
      await Promise.all([
        ...label0Issues.map((issue) =>
          gh.addLabelsToIssue(issue.number, [testLabels[0]]),
        ),
        ...label1Issues.map((issue) =>
          gh.addLabelsToIssue(issue.number, [testLabels[1]]),
        ),
        ...label2Issues.map((issue) =>
          gh.addLabelsToIssue(issue.number, [testLabels[2]]),
        ),
      ]);

      // Delete labels 0, 1, and 3
      await gh.deleteLabel(testLabels[0]);
      await gh.deleteLabel(testLabels[1]);
      await gh.deleteLabel(testLabels[3]);

      // Check for notification and agenda for all issues
      await Promise.all([
        checkNotificationIssue({
          labelName: testLabels[0],
          shouldExist: true,
          issuesToMention: label0Issues,
        }),
        checkNotificationIssue({
          labelName: testLabels[1],
          shouldExist: true,
          issuesToMention: label1Issues,
        }),
        checkNotificationIssue({
          labelName: testLabels[2],
          shouldExist: false,
        }),
        checkNotificationIssue({
          labelName: testLabels[3],
          shouldExist: false,
        }),
      ]);

      await Promise.all([
        checkAgenda({
          labelName: testLabels[0],
          shouldExist: true,
          issuesToMention: label0Issues,
        }),
        checkAgenda({
          labelName: testLabels[1],
          shouldExist: true,
          issuesToMention: label1Issues,
        }),
        checkAgenda({ labelName: testLabels[2], shouldExist: false }),
        checkAgenda({ labelName: testLabels[3], shouldExist: false }),
      ]);
    });
  });
});
