const { Liquid } = require('liquidjs');
const path = require('path');
const matter = require('gray-matter');

/**
 * Jest transformer that pre-processes JS-under test with...
 *  - gray-matter for frontmatter 
 *  - LiquidJS for inline Liquid statements 
 */

const engine = new Liquid({
    root: [path.resolve(__dirname, '..', '_includes')],
    jekyllInclude: true,
});

module.exports = {
    process(sourceText, sourcePath, options) {
        console.log(`Transforming ${sourcePath}`);
        try {
            // Parse the frontmatter if present
            const {content, data} = matter(sourceText);

            // Render the liquid statements
            const rendered = engine.parseAndRenderSync(content, data);
            return { code: rendered };
        } catch (err) {
            console.error(`Error rendering ${sourcePath}: ${err}. ${__dirname}`);
            return { code: sourceText };
        }
    },
};