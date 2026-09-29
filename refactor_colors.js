const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Replace colors
  content = content.replace(/text-\[\#14306B\]/g, 'text-black');
  content = content.replace(/text-\[\#5B6B85\]/g, 'text-black/60');
  content = content.replace(/text-\[\#101C33\]/g, 'text-black/80');
  
  // Backgrounds and buttons
  content = content.replace(/bg-\[\#14306B\]/g, 'bg-secondary text-black hover:bg-secondary/80');
  content = content.replace(/border-\[\#14306B\]/g, 'border-primary');
  
  // Charts
  content = content.replace(/fill="\#14306B"/g, 'fill="#1E4133"');
  content = content.replace(/fill="\#3B82F6"/g, 'fill="#144B3B"');
  content = content.replace(/stroke="\#2563eb"/g, 'stroke="#1E4133"');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Refactored colors in ${file}`);
  }
});
