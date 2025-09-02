// Test configuration for gha-tests

// Global config
const TEST_CONFIG = {
  REPO_OWNER: process.env.GITHUB_TEST_REPO_OWNER,
  REPO_NAME: process.env.GITHUB_TEST_REPO_NAME,
  REPO_TOKEN: process.env.GITHUB_TOKEN,

  TEST_PROJ: "HfLA: Website Test Project",
  CLEAN_ALL: true, //gh-helper will delete created issues, tests will delete generated content where possible
};

export default TEST_CONFIG;
