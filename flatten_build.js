import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('Step 1: Running production build...');
execSync('npm run build:original', { stdio: 'inherit' });

const distPath = path.join(process.cwd(), 'dist');
const clientPath = path.join(distPath, 'client');

if (fs.existsSync(clientPath)) {
  console.log('Step 2: Flattening dist/client into dist...');
  
  // Move all files from dist/client to dist
  const files = fs.readdirSync(clientPath);
  for (const file of files) {
    const oldPath = path.join(clientPath, file);
    const newPath = path.join(distPath, file);
    
    if (fs.existsSync(newPath)) {
      if (fs.lstatSync(newPath).isDirectory()) {
        fs.rmSync(newPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(newPath);
      }
    }
    fs.renameSync(oldPath, newPath);
  }

  // Remove the now-empty client folder and server folder
  fs.rmSync(clientPath, { recursive: true, force: true });
  const serverPath = path.join(distPath, 'server');
  if (fs.existsSync(serverPath)) {
    fs.rmSync(serverPath, { recursive: true, force: true });
  }

  console.log('Done! Build flattened successfully.');
} else {
  console.log('Build output already flat or client folder missing.');
}
