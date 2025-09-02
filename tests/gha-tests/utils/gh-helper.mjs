// const { Octokit } = require("@octokit/rest");
// const { execSync } = require('child_process');
// const TEST_CONFIG = require('./test-config');
// const readline = require('readline');

import { Octokit } from "@octokit/rest";

import { execSync } from "child_process";
import TEST_CONFIG from "./test-config.mjs";
import readline from "readline";

/**
 * GitHubHelper provides methods to interact with GitHub issues, labels, projects, and workflows
 * using the GitHub CLI (`gh`). It also tracks created resources for test cleanup.
 */
class GitHubHelper {
  constructor(repoOwner, repoName, token) {
    this.octokit = new Octokit({ auth: token });
    this.owner = repoOwner;
    this.repo = repoName;
    this.createdIssues = []; // Track issues created by this instance
    this.createdLabels = []; // Track labels created by this instance

    // this.createTestProject();
  }

  /* -------------------------------------------------------------------------- */
  /*                               CLI Helpers                                  */
  /* -------------------------------------------------------------------------- */

  /** Execute a gh CLI command and return trimmed stdout */
  exec(command, options = {}) {
    try {
      const result = execSync(`gh ${command}`, {
        encoding: "utf8",
        stdio: "pipe",
        ...options,
      });
      return result.trim();
    } catch (error) {
      throw new Error(`GitHub CLI failed: ${command}\n${error.message}`);
    }
  }

  /** Execute a gh CLI command and parse the JSON response */
  execJson(command) {
    const result = this.exec(command);
    return JSON.parse(result);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Project Operations                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Ensure the test project exists; create it if missing
   * @param {string} projName
   */
  createTestProject(projName = TEST_CONFIG.TEST_PROJ) {
    const currentProjects = this.execJson(`project list --format json`);

    // Extract projects array from result
    const projArray = currentProjects.projects || [];
    const existing_test_proj = projArray.find((p) => p.title === projName);
    if (existing_test_proj) {
      console.log(`Project ${projName} already exists! Skipping generation`);
      return;
    }

    console.log(`Test project ${projName} not found. Creating it now...`);
    this.exec(
      `project create --owner "${TEST_CONFIG.REPO_OWNER}" --title "${projName}"`,
    );

    console.log(`New project ${projName} created!`);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Issue Operations                             */
  /* -------------------------------------------------------------------------- */

  /** Create a new issue, optionally with labels and project */
  async createIssue(title, body = "", labels = []) {
    const { data } = await this.octokit.issues.create({
      owner: this.owner,
      repo: this.repo,
      title,
      body,
      labels,
    });
    this.createdIssues.push(data.number);
    return data.number;
  }

  /** Fetch issue details */
  async getIssue(issueNumber) {
    try {
      const { data } = await this.octokit.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return data;
    } catch {
      return null;
    }
  }

  /* Get Issue comments */
  async getIssueComments(issueNumber) {
    const perPage = 100;
    let page = 1;
    const allComments = [];

    while (true) {
      const { data: comments } = await this.octokit.rest.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        per_page: perPage,
        page,
      });

      allComments.push(...comments);

      if (comments.length < perPage) break; // no more pages
      page += 1;
    }

    return allComments;
  }

  /** Add labels to an existing issue */
  async addLabelsToIssue(issueNumber, labels) {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      labels: labels,
    });
  }

  /** Remove all labels from an issue */
  async removeAllLabelsFromIssue(issueNumber) {
    await this.octokit.issues.removeAllLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
    });
  }

  /** Close an issue (optionally with a comment) */
  async closeIssue(issueNumber, comment = "") {
    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state: "closed",
      stateReason: comment,
    });

    // Remove from tracking since it was closed
    if (!TEST_CONFIG.CLEAN_ALL) {
      this.createdIssues = this.createdIssues.filter(
        (issue) => issue != issueNumber,
      );
    }
  }

  /** Reopen an issue (optionally with a comment) */
  async reopenIssue(issueNumber, comment = "") {
    await this.octokit.issues.update({
      owner: this.owner,
      repo: this.repo,
      issue_number: issueNumber,
      state: "open",
      stateReason: comment,
    });

    // Re add to tracking if it is not already present
    if (this.createdIssues.indexOf(issueNumber) === -1) {
      this.createdIssues.push(issueNumber);
    }
  }

  /** Find an issue by exact title */
  async findIssueByTitle(title, state = "all") {
    const issues = await this.octokit.paginate(
      this.octokit.issues.listForRepo,
      {
        owner: this.owner,
        repo: this.repo,
        state: state,
        per_page: 100,
      },
    );

    // Filter for exact title
    const exactMatch = issues.find((issue) => issue.title === title);
    return exactMatch || null;
  }

  /** Check if an issue exists by number */
  async issueExists(issueNumber) {
    try {
      await this.octokit.rest.issues.get({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
      });
      return true;
    } catch (err) {
      if (err.status === 404) return false; // Issue not found
      throw err;
    }
  }

  /** Wait for an issue with a given title to appear (polling) */
  async waitForIssue(
    title,
    timeoutMs = 30000,
    fields = ["number", "title", "state", "labels", "body"],
  ) {
    const start = Date.now();
    const pollDelay = 1000; //ms

    while (Date.now() - start < timeoutMs) {
      const issue = await this.findIssueByTitle(title);
      if (issue) return issue;

      // Wait asynchronously before next poll
      await new Promise((resolve) => setTimeout(resolve, pollDelay));
    }

    return null;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Label Operations                             */
  /* -------------------------------------------------------------------------- */

  /** Create a label */
  async createLabel(name, color = "f29513", description = "") {
    await this.octokit.rest.issues.createLabel({
      owner: this.owner,
      repo: this.repo,
      name,
      color,
      description,
    });
    this.createdLabels.push(name);
    return name;
  }

  /** Delete a label */
  async deleteLabel(name) {
    await this.octokit.rest.issues.deleteLabel({
      owner: this.owner,
      repo: this.repo,
      name,
    });

    // Remove from tracking since it was deleted
    this.createdLabels = this.createdLabels.filter((label) => label !== name);
  }

  /* -------------------------------------------------------------------------- */
  /*                                Cleanup                                     */
  /* -------------------------------------------------------------------------- */

  async cleanup() {
    await Promise.allSettled([
      // Close and clean up created issues
      ...this.createdIssues.map((issueNumber) =>
        this.closeIssue(issueNumber, "Test cleanup"),
      ),
      // Delete created labels
      ...this.createdLabels.map((labelName) => this.deleteLabel(labelName)),
    ]);
  }
}

export default GitHubHelper;
