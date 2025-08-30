const { execSync } = require('child_process')
const GitHubHelper = require('./gh-helper');

// Global config
const TEST_CONFIG = {
    REPO_OWNER: process.env.GITHUB_TEST_REPO_OWNER,
    REPO_NAME: process.env.GITHUB_TEST_REPO_NAME,
    TEST_PROJ: "HfLA: Website Test Project"
};

let globalGH;

// Setup before all tests
beforeAll(async () => {

    // Verify GH CLI is authenticated
    try {
        execSync('gh auth status', { stdio: 'pipe' });
        console.log('SUCCESS: GitHub CLI authenticated');
    } catch (error) {
        throw new Error('WARNING: GitHub CLI not authenticated. Run: gh auth login');
    }

    // Initialize GitHub helper
    globalGH = new GitHubHelper(TEST_CONFIG.REPO_OWNER, TEST_CONFIG.REPO_NAME);

    // Verify we can access the test repo
    try {
        const repo = globalGH.execJson(`repo view ${globalGH.repo} --json name,owner`);
        console.log(`SUCCESS: Connected to the test repository: ${repo.owner.login}/${repo.name}`);
    } catch (error) {
        throw new Error(`WARNING: Cannot access repository ${globalGH.repo}. Check permissions.`);
    }

});

// Cleanup after all tests
afterAll(async () => {
    if (globalGH) {
        console.log('Cleaning up test resources...');
        await globalGH.cleanup();
        console.log('Cleanup completed');
    }
})

global.TEST_CONFIG = TEST_CONFIG;
global.getGitHubHelper = () => globalGH;