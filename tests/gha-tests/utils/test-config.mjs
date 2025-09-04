// Test configuration for gha-tests
const TEST_CONFIG = {
  REPO_OWNER: process.env.GITHUB_TEST_REPO_OWNER,
  REPO_NAME: process.env.GITHUB_TEST_REPO_NAME,
  REPO_TOKEN: process.env.GITHUB_TOKEN,
};

export default TEST_CONFIG;
