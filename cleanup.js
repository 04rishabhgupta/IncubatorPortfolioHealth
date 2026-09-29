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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(path.join(__dirname, 'src'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  if (file.endsWith('.tsx')) {
    // Fix the weird duplicate classes I introduced
    content = content.replace(/hover:bg-\[\#144B3B\] hover:bg-\[\#144B3B\]/g, 'hover:bg-[#144B3B]');
    content = content.replace(/hover:bg-\[\#144B3B\] text-white/g, 'hover:bg-[#144B3B]');
    content = content.replace(/bg-\[\#1E4133\] text-white hover:bg-\[\#144B3B\] text-white/g, 'bg-[#1E4133] text-white hover:bg-[#144B3B]');
    
    // Some buttons were accidentally styled with text-black when they are bg-secondary (now bg-[#1E4133])
    content = content.replace(/bg-\[\#1E4133\] text-black/g, 'bg-[#1E4133] text-white');
    
    // In layout.tsx, the sidebar is bg-[#1E4133]. All text inside should be white, not black!
    // I noticed "Signed in as" was text-white/70, which is correct.
    // The main layout background is #F4F6F9.
    
    // Make sure we didn't leave text-black on tabs or active elements that should be white.
    // e.g., if active is bg-[#1E4133], text must be white.
    content = content.replace(/className="\(\`|\")flex items-center px-3 py-2 rounded-md text-sm font-medium \$\{isActive \? 'bg-white\/20' : 'hover:bg-white\/10'\}\`/g, 
                              'className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? \'bg-white text-[#1E4133]\' : \'text-white hover:bg-white/10\'}`}');
  }
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Cleaned up ${file}`);
  }
});
