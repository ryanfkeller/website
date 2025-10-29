const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

/**
 * Hook that runs before tests to set up coverage mapping
 * This intercepts Jest's coverage collection to map temp files to originals
 */

const transformLogPath = path.join(process.cwd(), '.jekyll-transforms.json');

let transforms = new Map();

function loadTransforms() {
  if (fs.existsSync(transformLogPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(transformLogPath, 'utf8'));
      transforms = new Map(data.map(t => [t.tmpPath, t]));
    } catch (e) {
      // Transforms not ready yet
    }
  }
}

// Load initially
loadTransforms();

// Watch for new transforms (created during test execution)
let watcher;
try {
  watcher = fs.watch(transformLogPath, { persistent: false }, () => loadTransforms());
} catch (e) {
  // File doesn't exist yet, that's okay
}

// Clean up watcher after all tests
if (typeof afterAll !== 'undefined') {
  afterAll(() => {
    try {
      watcher?.close();
    } catch (e) {
      // Ignore
    }
  });
}

// Intercept coverage writes to remap temp files -> original files
let coverageData = {};
let isIntercepting = false;

Object.defineProperty(global, '__coverage__', {
  get() {
    return coverageData;
  },
  set(newCoverage) {
    // Avoid infinite loops
    if (isIntercepting) {
      coverageData = newCoverage;
      return;
    }
    
    isIntercepting = true;
    
    try {
      // Reload transforms in case new ones were added
      loadTransforms();
      
      console.log('Coverage update received with', Object.keys(newCoverage).length, 'files');
      console.log('Tracking', transforms.size, 'transforms');
      
      // Remap temp file paths to original paths
      const remapped = {};
      
      for (const [filePath, fileCoverage] of Object.entries(newCoverage)) {
        let targetPath = filePath;
        let targetCoverage = fileCoverage;
        
        // Check if this is a transformed file
        for (const [tmpPath, transform] of transforms.entries()) {
          const tmpUrl = pathToFileURL(tmpPath).href;
          
          if (filePath === tmpPath || 
              filePath === tmpUrl || 
              filePath.includes(tmpPath) ||
              filePath.includes(path.basename(tmpPath))) {
            
            targetPath = transform.originalPath;
            
            // Update the path property in the coverage object
            targetCoverage = {
              ...fileCoverage,
              path: targetPath,
            };
            
            console.log(`✓ Mapped coverage: ${path.basename(tmpPath)} -> ${path.basename(targetPath)}`);
            break;
          }
        }
        
        // Use the original path (or mapped path) as the key
        remapped[targetPath] = targetCoverage;
      }
      
      console.log('Final coverage has', Object.keys(remapped).length, 'files');
      coverageData = remapped;
    } finally {
      isIntercepting = false;
    }
  },
  configurable: true,
  enumerable: true,
});

console.log('✓ Jekyll coverage hook installed');
