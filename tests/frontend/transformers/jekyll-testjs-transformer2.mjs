import { Liquid } from 'liquidjs';
import matter from 'gray-matter';
import MagicString from "magic-string"
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';



/**
 * Jest transformer that pre-processes JS-under-test with...
 *  - gray-matter for frontmatter 
 *  - LiquidJS for inline Liquid statements 
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const engine = new Liquid({
    jekyllInclude: true,
});

async function process(srcFile, context) {
    

    // Process frontmatter
    const { content, data } = matter(src);

    // Initialize magic-string for coverage map creation
    const s = new MagicString(content);

    // Find all liquid tags and replace with runtime-render calls using magic-string
    const regex = /(["'`]?)(\{\{.*?\}\}|\{%-?[\s\S]*?-?%\})(["'`]?)/g;
    let match;
    while ((match = regex.exec(content))) {
        const replacement = `__LIQUID_RUNTIME__.parseAndRender(${JSON.stringify(match[2])})`;
        s.overwrite(match.index, match.index+match[0].length, replacement);
    }

    // Reconstruct JS code with frontmatter export
    const liquidRuntimePath = path.resolve(__dirname, '../utils/__liquid_runtime__');
    const code =
        `import { runtime as __LIQUID_RUNTIME__ } from "${liquidRuntimePath}";\n` +
        `export const frontMatter = ${JSON.stringify(data)};\n` +
        `${s.toString()}\n`;

    console.log(code);

    return {
        code, 
        map: s.generateMap({hires: true, source: srcPath, includeContent: true})
    };
};

export default { process };