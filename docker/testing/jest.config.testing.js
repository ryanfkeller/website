/** @type {import('jest').Config} */
const config = {

  verbose: true,
  testEnvironment: 'node',
  transform: {},
  testTimeout: 60000, //ms

  projects: [
    {
      displayName: 'gha-tests',
      
      testMatch : [
        '**/tests/gha-tests/**/*.test.mjs'
      ],
    }
  ]
}

export default config;
