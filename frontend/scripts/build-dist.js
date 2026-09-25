const fs = require('fs');
const path = require('path');

const root = process.cwd();
const distDir = path.join(root, 'dist');

function copyItem(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyItem(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function ensureFileCopy(fileName) {
  const src = path.join(root, fileName);
  const dest = path.join(distDir, fileName);
  if (fs.existsSync(src)) {
    copyItem(src, dest);
  }
}

fs.mkdirSync(distDir, { recursive: true });

['index.html', 'style.css', 'publication.js', 'musique.js'].forEach(ensureFileCopy);

for (const folder of ['assets', 'illustrheader']) {
  const src = path.join(root, folder);
  const dest = path.join(distDir, folder);
  if (fs.existsSync(src)) {
    copyItem(src, dest);
  }
}

console.log('dist generated from current project files');
