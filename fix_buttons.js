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
  
  // Replace buttons
  content = content.replace(/bg-secondary text-black hover:bg-secondary\/80/g, 'bg-[#1E4133] text-white hover:bg-[#144B3B]');
  
  // Fix button text where it might still be black explicitly
  // e.g. <Button className="... bg-[#1E4133] text-white hover:bg-[#144B3B] hover:bg-secondary text-black hover:bg-secondary/80/90" ...
  content = content.replace(/hover:bg-secondary text-black hover:bg-secondary\/80\/90/g, 'hover:bg-[#144B3B]');
  
  // Also any bg-[#14306B] (just in case I missed it) -> bg-[#1E4133] text-white
  content = content.replace(/bg-\[\#14306B\]/g, 'bg-[#1E4133] text-white');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Fixed colors in ${file}`);
  }
});
