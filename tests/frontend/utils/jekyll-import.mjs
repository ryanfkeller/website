import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MagicString from 'magic-string';
import { Liquid } from 'liquidjs';
import { tmpdir } from 'os';
import { pathToFileURL } from 'url';
import crypto from 'crypto';
import { transformSync } from '@babel/core';
import babelPluginIstanbul from 'babel-plugin-istanbul';

// Track transformations in memory AND on disk
const transforms = new Map();
const transformLog = path.join(process.cwd(), '.jekyll-transforms.json');

function saveTransforms() {
  const data = Array.from(transforms.entries()).map(([tmpPath, info]) => ({
    tmpPath,
    tmpUrl: pathToFileURL(tmpPath).href,
    ...info
  }));
  fs.writeFileSync(transformLog, JSON.stringify(data, null, 2), 'utf8');
}

export async function jekyllImport(filepath, context = {}) {
  const absPath = path.resolve(filepath);
  const src = fs.readFileSync(absPath, 'utf8');
  const { content, data: frontMatter } = matter(src, { preserveNewlines: true });
  
  const engine = new Liquid({ jekyllInclude: true });
  const rendered = await engine.parseAndRender(content, {...frontMatter, ...context});
  
  const ms = new MagicString(src);
  const frontmatterEnd = src.indexOf('---', 3);
  const bodyStart = frontmatterEnd !== -1 ? frontmatterEnd + 3 : 0;
  
  // Comment out frontmatter so Node can parse the file
  if (frontmatterEnd !== -1) {
    ms.overwrite(0, bodyStart, `/*${src.slice(0, bodyStart)}*/\n`);
  }
  
  ms.overwrite(bodyStart, src.length, rendered);
  
  // Create a stable temp path
  const hash = crypto
    .createHash('md5')
    .update(absPath + JSON.stringify(context))
    .digest('hex')
    .substring(0, 8);
  
  const tmpPath = path.join(tmpdir(), `jekyll_${hash}_${path.basename(filepath)}`);
  const mapPath = `${tmpPath}.map`;
  let code = ms.toString();
  
  // Generate source map
  const sourceMap = ms.generateMap({
    source: absPath,
    file: path.basename(tmpPath),
    includeContent: true,
    hires: true,
  });
  
  // MagicString's map has a toJSON method via toString that returns JSON string
  // We need to parse it to get an object
  const sourceMapObj = JSON.parse(sourceMap.toString());
  
  // CRITICAL: Instrument for coverage if in test mode
  if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) {
    try {
      const instrumented = transformSync(code, {
        filename: absPath, // Use original path for coverage mapping
        cwd: process.cwd(),
        plugins: [
          [babelPluginIstanbul, {
            exclude: [],
            cwd: process.cwd(),
            // This is critical - it tells Istanbul to use the original filename
            extension: ['.js', '.mjs'],
          }]
        ],
        sourceMaps: 'inline', // Embed source map in instrumented code
        sourceFileName: absPath,
        inputSourceMap: sourceMapObj,
      });
      
      if (instrumented && instrumented.code) {
        code = instrumented.code;
        // The instrumented code now writes to global.__coverage__[absPath]
        console.log(`✓ Instrumented ${path.basename(absPath)} for coverage`);
      }
    } catch (e) {
      console.warn('Failed to instrument', absPath, ':', e.message);
      // Continue with uninstrumented code
    }
  }
  
  // Write separate map file
  fs.writeFileSync(mapPath, sourceMap.toString(), 'utf8');
  
  // Write code with source map reference
  const codeWithMapRef = `${code}\n//# sourceMappingURL=${path.basename(mapPath)}`;
  fs.writeFileSync(tmpPath, codeWithMapRef, 'utf8');
  
  // Store transform info
  const tmpUrl = pathToFileURL(tmpPath).href;
  transforms.set(tmpPath, {
    originalPath: absPath,
    sourceMap: sourceMapObj,
  });
  saveTransforms();
  
  return import(tmpUrl);
}

export function getTransforms() {
  return transforms;
}
