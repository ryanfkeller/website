import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import MagicString from 'magic-string';
import { Liquid } from 'liquidjs';
import { tmpdir } from 'os';
import { pathToFileURL } from 'url';
import crypto from 'crypto';

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
  const code = ms.toString();
  
  // Generate source map
  const sourceMap = ms.generateMap({
    source: absPath,
    file: path.basename(tmpPath),
    includeContent: true,
    hires: true,
  });
  
  // Write separate map file
  fs.writeFileSync(mapPath, sourceMap.toString(), 'utf8');
  
  // Write code with source map reference
  const codeWithMapRef = `${code}\n//# sourceMappingURL=${path.basename(mapPath)}`;
  fs.writeFileSync(tmpPath, codeWithMapRef, 'utf8');
  
  // Store transform info
  transforms.set(tmpPath, {
    originalPath: absPath,
    sourceMap: sourceMap.toJSON(),
  });
  saveTransforms();
  
  return import(pathToFileURL(tmpPath).href);
}

export function getTransforms() {
  return transforms;
}