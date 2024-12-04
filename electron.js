const path = require('path');
const { execSync } = require('child_process');

// Always compile the preload script
execSync('tsc --project tsconfig.preload.json');

// Check if we're in development mode
if (process.env.NODE_ENV === 'development') {
  // Use ts-node for development
  require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'commonjs'
    }
  });
  require('./src/main/main.ts');
} else {
  // Use compiled code for production
  require('./dist/main/main.js');
}