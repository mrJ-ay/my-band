const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const vendorDir = path.join(rootDir, 'public', 'vendor');

fs.mkdirSync(vendorDir, { recursive: true });

const files = [
  {
    src: path.join(rootDir, 'node_modules', 'opensheetmusicdisplay', 'build', 'opensheetmusicdisplay.min.js'),
    dest: path.join(vendorDir, 'opensheetmusicdisplay.min.js')
  },
  {
    src: path.join(rootDir, 'node_modules', 'jszip', 'dist', 'jszip.min.js'),
    dest: path.join(vendorDir, 'jszip.min.js')
  },
  {
    src: path.join(rootDir, 'node_modules', 'soundfont-player', 'dist', 'soundfont-player.min.js'),
    dest: path.join(vendorDir, 'soundfont-player.min.js')
  }
];

for (const item of files) {
  if (!fs.existsSync(item.src)) {
    throw new Error(`Missing vendor source file: ${item.src}`);
  }
  fs.copyFileSync(item.src, item.dest);
  console.log(`Copied ${path.basename(item.dest)}`);
}
