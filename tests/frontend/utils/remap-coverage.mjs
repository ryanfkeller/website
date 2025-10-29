import fs from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { SourceMapConsumer } from 'source-map';

/**
 * Remap V8 coverage from transformed files back to original sources
 * Run after Jest: node remap-coverage.js
 */
async function remapCoverage() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
  const transformLogPath = path.join(tmpdir(), 'jekyll-transform-log.json');
  
  if (!fs.existsSync(coveragePath)) {
    console.error('No coverage file found at:', coveragePath);
    process.exit(1);
  }
  
  if (!fs.existsSync(transformLogPath)) {
    console.log('No transform log found - skipping remapping');
    process.exit(0);
  }
  
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const transforms = JSON.parse(fs.readFileSync(transformLogPath, 'utf8'));
  
  // Build a lookup map: temp file -> original file + source map
  const transformMap = new Map();
  for (const transform of transforms) {
    transformMap.set(transform.tmpPath, {
      originalPath: transform.originalPath,
      sourceMap: transform.sourceMap,
    });
  }
  
  const remappedCoverage = {};
  
  // Process each file in coverage
  for (const [filePath, fileCoverage] of Object.entries(coverage)) {
    // Check if this is a transformed file
    let matchedTransform = null;
    for (const [tmpPath, transform] of transformMap.entries()) {
      if (filePath.includes(tmpPath) || filePath.endsWith(path.basename(tmpPath))) {
        matchedTransform = transform;
        break;
      }
    }
    
    if (!matchedTransform) {
      // Not a transformed file, keep as-is
      remappedCoverage[filePath] = fileCoverage;
      continue;
    }
    
    // Remap coverage using source map
    try {
      const consumer = await new SourceMapConsumer(matchedTransform.sourceMap);
      const remapped = remapFileCoverage(fileCoverage, consumer, matchedTransform.originalPath);
      remappedCoverage[matchedTransform.originalPath] = remapped;
      consumer.destroy();
    } catch (error) {
      console.warn(`Failed to remap ${filePath}:`, error.message);
      // Fall back to original coverage
      remappedCoverage[matchedTransform.originalPath] = fileCoverage;
    }
  }
  
  // Write remapped coverage
  fs.writeFileSync(
    coveragePath,
    JSON.stringify(remappedCoverage, null, 2),
    'utf8'
  );
  
  console.log('✓ Coverage remapped successfully');
  console.log(`Processed ${Object.keys(remappedCoverage).length} files`);
  console.log(`Remapped ${transforms.length} transformed files`);
}

/**
 * Remap a single file's coverage data using a source map
 */
function remapFileCoverage(coverage, consumer, originalPath) {
  const remapped = {
    path: originalPath,
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
    b: {},
  };
  
  // Remap statement locations
  for (const [key, location] of Object.entries(coverage.statementMap || {})) {
    const remappedLoc = remapLocation(location, consumer);
    if (remappedLoc) {
      remapped.statementMap[key] = remappedLoc;
      remapped.s[key] = coverage.s[key] || 0;
    }
  }
  
  // Remap function locations
  for (const [key, fn] of Object.entries(coverage.fnMap || {})) {
    const remappedLoc = remapLocation(fn.loc, consumer);
    if (remappedLoc) {
      remapped.fnMap[key] = {
        name: fn.name,
        decl: remapLocation(fn.decl, consumer) || remappedLoc,
        loc: remappedLoc,
        line: remappedLoc.start.line,
      };
      remapped.f[key] = coverage.f[key] || 0;
    }
  }
  
  // Remap branch locations
  for (const [key, branch] of Object.entries(coverage.branchMap || {})) {
    const remappedLocations = branch.locations.map(loc => 
      remapLocation(loc, consumer)
    ).filter(Boolean);
    
    if (remappedLocations.length > 0) {
      remapped.branchMap[key] = {
        type: branch.type,
        loc: remapLocation(branch.loc, consumer) || remappedLocations[0],
        locations: remappedLocations,
        line: remappedLocations[0].start.line,
      };
      remapped.b[key] = coverage.b[key] || [];
    }
  }
  
  return remapped;
}

/**
 * Remap a location using source map
 */
function remapLocation(location, consumer) {
  if (!location || !location.start || !location.end) {
    return null;
  }
  
  try {
    const start = consumer.originalPositionFor({
      line: location.start.line,
      column: location.start.column,
    });
    
    const end = consumer.originalPositionFor({
      line: location.end.line,
      column: location.end.column,
    });
    
    // If we can't map, return null
    if (!start.line || !end.line) {
      return null;
    }
    
    return {
      start: {
        line: start.line,
        column: start.column,
      },
      end: {
        line: end.line,
        column: end.column,
      },
    };
  } catch (error) {
    return null;
  }
}

remapCoverage().catch(error => {
  console.error('Failed to remap coverage:', error);
  process.exit(1);
});
