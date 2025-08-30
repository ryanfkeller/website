/** @type {import('jest').Config} */
const config = {

  verbose: true,
  testEnvironment: 'node',

  projects: [
    {
      displayName: 'gha-tests',
      
      testMatch : [
        '**/tests/gha-tests/**/*.test.js'
      ],

      // Timeout in ms
      testTimeout: 30000,

      setupFilesAfterEnv: ['<rootDir>/tests/gha-tests/utils/test-setup.js']
    }
  ]
}

module.exports = config;
