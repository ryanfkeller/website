module.exports = {
    testEnvironment: 'jsdom',
    roots: [
        '<rootDir>/frontend_integration',
        '<rootDir>/../assets/js' 
    ],

    transform: {"\\.[jt]sx?$": '<rootDir>/jsJekyllTransformer.js'}, // custom transformer for frontmatter and liquit
    transformIgnorePatterns: ['<rootDir>']                        // only transform non-test files
}