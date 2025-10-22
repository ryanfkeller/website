const { Liquid } = require('liquidjs');
const matter = require('gray-matter');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Jest transformer that pre-processes JS-under-test with...
 *  - gray-matter for frontmatter 
 *  - LiquidJS for inline Liquid statements 
 */

const engine = new Liquid({
    root: [
        path.resolve(__dirname, '..', '..', '..', '_includes'),
        // path.resolve(__dirname, '..', '..', '..', '_data'),
    ],
    jekyllInclude: true,
});

// /**
//  * Function to load .yml files 
//  */
// function loadDataFiles(dir, basePath = '') {
//     const data = {};
    
    
//     if (!fs.existsSync(dir)) {
//         // If directory doesn't exist, return {}
//         return data;
//     }
    
//     const items = fs.readdirSync(dir);
    
//     // Iterate through each file in the dir
//     for (const item of items) {
//         const fullPath = path.join(dir, item);
//         const stat = fs.statSync(fullPath);
        
//         if (stat.isDirectory()) {
//             // Is a directory, so recursively call this function again
//             data[item] = loadDataFiles(fullPath, path.join(basePath, item));
//         } else if (stat.isFile()) {
//             // Is a file, so extract .yml data
//             const ext = path.extname(item);
//             const name = path.basename(item, ext);
            
//             try {
//                 if (ext === '.json') {
//                     data[name] = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
//                 } else if (ext === '.yml' || ext === '.yaml') {
//                     const fileContent = fs.readFileSync(fullPath, 'utf-8');
//                     // Try to load as single document first
//                     try {
//                         data[name] = yaml.load(fileContent);
//                     } catch (e) {
//                         // If it fails, try loading all documents
//                         const docs = yaml.loadAll(fileContent);
//                         // If multiple documents, use array; if single, use the document
//                         data[name] = docs.length === 1 ? docs[0] : docs;
//                     }
//                 }
//             } catch (err) {
//                 console.warn(`Could not load ${fullPath}: ${err.message}`);
//             }
//         }
//     }
    
//     return data;
// }

// // Load all _data files
// const dataDir = path.resolve(__dirname, '..', '_data');
// const siteData = loadDataFiles(dataDir);

// const mockSiteData = {
//     site: {
//         data: siteData
//     }
// };

module.exports = {
    process(sourceText, sourcePath, options) {
        // console.log(`Transforming ${sourcePath}`);
        try {
            // Parse the frontmatter if present
            const {content, data} = matter(sourceText);
            
            // const liquidData = {...mockSiteData, ...data};

            // Render the liquid statements
            const rendered = engine.parseAndRenderSync(content, data);

            return { code: rendered };
        } catch (err) {
            console.error(`Error rendering JS ${sourcePath}: ${err}. ${__dirname}`);
            return { code: sourceText };
        }
    },
};