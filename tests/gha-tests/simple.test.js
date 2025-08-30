describe('GitHub Issue Management', () => {
  let gh;
  
  beforeEach(() => {
    gh = getGitHubHelper();
  });
  
  test('create multiple issues with timestamped label and trigger workflow', async () => {
    // Create unique timestamped label name
    const timestamp = Date.now();
    const labelName = `test-${timestamp}`;
    
    // Number of issues to create
    const numberOfIssues = 1;
    
    // Create test label
    gh.createLabel(labelName, 'ff6b35', `Test label created at ${new Date().toISOString()}`);
    
    // Create multiple issues with the label
    const createdIssues = [];
    for (let i = 1; i <= numberOfIssues; i++) {
      const issueNumber = gh.createIssue(
        `[TEST] Issue ${timestamp}-${i}`,
        `This is test issue ${i} created at ${new Date().toISOString()}`,
        [labelName]
      );
      createdIssues.push(issueNumber);
    }
    
    // Verify all issues were created correctly
    for (const issueNumber of createdIssues) {
      const issue = gh.getIssue(issueNumber);
      expect(issue.title).toContain(`[TEST] Issue`);
      expect(issue.labels.map(l => l.name)).toContain(labelName);
    }
    
    console.log(`Created ${numberOfIssues} issues with label "${labelName}"`);
    console.log(`Issue numbers: ${createdIssues.join(', ')}`);
    
    // Delete the label (this should trigger the workflow and affect all created issues)
    console.log(`Deleting label "${labelName}" - this should trigger the workflow`);
    gh.deleteLabel(labelName);
    
    // TODO: Add some checking to see if anything actually happened...
    
    // Cleanup happens automatically via afterAll
  });
});