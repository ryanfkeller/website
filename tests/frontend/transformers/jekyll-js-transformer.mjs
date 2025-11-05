import { Liquid } from "liquidjs";
import path from "path";
import matter from "gray-matter";
const __dirname = import.meta.dirname;
 

/**
 * Jest transformer that pre-processes CJS-under-test
 * to populate LiquidJS and frontmatter statements
 * into pure JS that can be parsed by a test script
 */

const engine = new Liquid({
    root: [
        path.resolve(__dirname, "../../_includes"),
        path.resolve(__dirname, "../../_data/**"),
    ],
    jekyllInclude: true,
})

export default {
    canInstrument: true,
    
    process(sourceText, sourcePath, options) {
        try {
            console.log(`Processing ${sourcePath}`);

            // Parse frontmatter if present
            const {content:fmContent, data:fmData} = matter(sourceText);

            // Render the liquid statements with both
            // root data and frontmatter data
            const renderedJs = engine.parseAndRenderSync(fmContent, fmData);

            console.log(`${renderedJs}`);
            // Return transformed JS
            return { code: renderedJs };
        } catch (err) {
            console.error(`Error rendering ${sourcePath}: ${err}.`);

            // Return untransformed JS 
            return { code: sourceText}
        }
    }
}