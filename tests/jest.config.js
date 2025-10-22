module.exports = {
    testEnvironment: 'jsdom',
    rootDir: '../',
    roots: [
        'tests/',
        'assets/js' 
    ],
    transform: {
        "\\.(js|mjs)$": './tests/frontend/utils/jekyll-js-transformer.js',
        // "\\.html$": './tests/frontend/transformers/jekyllHtmlTransformer.js',
    },
    testMatch: "**/project.integ.test.mjs",
    transformIgnorePatterns: ['tests/'], // only transform non-test files
    coverageProvider: 'v8',              // default istanbul has trouble with DOM conditionals
    collectCoverageFrom: [
        'assets/js/**/*.(js|mjs)' // eventually we will want coverage from this whole folder
        // 'assets/js/hamburger-nav.js',
    ],
    maxWorkers: 1,
};