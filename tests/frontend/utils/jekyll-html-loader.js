const { Liquid } = require('liquidjs');
const path = require('path');
const matter = require('gray-matter');
const fs = require('fs');

/**
 * Manual HTML loader that pre-processes HTML-under-test with...
 * - gray-matter for frontmatter
 * - LiquidJS for inline Liquid statements
 * - User provided page data
 */

const engine = new Liquid({
    root: [path.resolve(__dirname, '..', '..', '..', '_includes')],
    jekyllInclude: true,
});

function loadHTML(htmlPath, pageData = {}) {
    // Read the file
    const sourceText = fs.readFileSync(htmlPath, 'utf-8');

    try {
        // Parse the frontmatter if present
        const {content, data} = matter(sourceText);

        // Combine frontmatter data with user pageData
        const combinedData = {...data, page: {...pageData}}

        // Render the liquid statements with combined data
        const rendered = engine.parseAndRenderSync(content, combinedData);
        return rendered;
    } catch (error) {
        console.error(`Error rendering ${htmlPath}: ${error}`);
        return sourceText;
    }
}

module.exports = { loadHTML };