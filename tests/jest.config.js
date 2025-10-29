module.exports = {
    testEnvironment: 'jsdom',
    rootDir: '../',
    roots: [
        'tests/',
        'assets/js' 
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/jest-coverage-hook.js'],
    transform: {
        // "\\.mjs$": './tests/frontend/transformers/jekyll-testjs-transformer.mjs',
        // "\\.html$": './tests/frontend/transformers/jekyllHtmlTransformer.js',
    },
    testMatch: "**/vrms-events.unit.testcopy.mjs",
    transformIgnorePatterns: ['tests/'], // only transform non-test files
    // collectCoverageFrom: [
    //     'assets/js/utility/vrms-events.mjs',
    //     // 'utility/vrms-events.mjs',
    //     // 'assets/js/**/*.(js|mjs)' // eventually we will want coverage from this whole folder
    //     // 'assets/js/hamburger-nav.js',
    // ],
    maxWorkers: 1,
    coveragePathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/tests/',]
};