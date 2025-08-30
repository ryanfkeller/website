/**
 * Function to return list of recently unlabeled issues
 * @param {Object} github           - github object from actions/github-script
 * @param {Object} context          - context opbject from actions/github-script
 * @returns {Array} recentUnlabels  - issues that were recently unlabeled
 */
async function getRecentlyUnlabeledIssues(github, context) {

    // Get the name of the label that was just deleted
    const deletedLabelName = context.payload.label.name;

    // Set the timeout for issue update querying
    let fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const query = `query ($owner: String!, $repo: String!, $since: DateTime!) {
      repository(owner: $owner, name: $repo) {
        issues(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}, filterBy: { since: $since }) {
          nodes {
            number
            timelineItems(itemTypes: [UNLABELED_EVENT], last: 10) {
              nodes {
                ... on UnlabeledEvent {
                  createdAt
                  label {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }`;

    const variables = {
      owner: context.repo.owner,
      repo: context.repo.repo,
      since: fiveMinutesAgo.toISOString()
    };

    try {
        // This query returns all issues that were updated within the last 5 minutes
        // and the last 10 unlabeling events for that issue,
        // but does NOT ensure that the unlabeling events were within last 5 minutes
        // or that the unlabeling was with the most recently deleted label
        const result = await github.graphql(query, variables);

        // Process query results to find issues where the unlabeling events were
        // within the last 5 minutes and were from our deleted label
        const recentUnlabels = [];
        for (const issue of result.repository.issues.nodes) {
            // Each issues returned by query
            for (const event of issue.timelineItems.nodes) {
                // Each unlabeled event of the issue
                const eventTime = new Date(event.createdAt);
                if (eventTime >= fiveMinutesAgo && event.label.name === deletedLabelName) {
                    recentUnlabels.push({
                        issueNumber: issue.number,
                        labelName: event.label.name,
                        unlabeledAt: event.createdAt
                    });
                }
            }
        }

        return recentUnlabels;
    } catch (error) {
        console.error('GraphQL query failed:', error);
        console.error('Query variables:', variables);
        console.error('Deleted label name:', deletedLabelName);
        throw error;
    }
};

module.exports = getRecentlyUnlabeledIssues