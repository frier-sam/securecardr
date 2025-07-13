#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('Testing TypeScript compilation...');

exec('npm run build', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('Build failed with error:', error);
    console.error('STDERR:', stderr);
    console.log('STDOUT:', stdout);
    process.exit(1);
  } else {
    console.log('Build successful!');
    console.log('STDOUT:', stdout);
    if (stderr) {
      console.log('STDERR:', stderr);
    }
    process.exit(0);
  }
});
