const fs = require('fs');
const path = require('path');

const map = {
  "bg-black": "bg-background dark:bg-black",
  "bg-[#0a0a0a]": "bg-gray-50 dark:bg-[#0a0a0a]",
  "bg-[#111111]": "bg-card dark:bg-[#111111]",
  "bg-[#1a1a1a]": "bg-muted dark:bg-[#1a1a1a]",
  "bg-[#151515]": "bg-muted/60 dark:bg-[#151515]",
  "bg-[#050505]": "bg-muted/30 dark:bg-[#050505]",
  "bg-[#222222]": "bg-muted/80 dark:bg-[#222222]",
  "text-white": "text-foreground dark:text-white",
  "text-gray-400": "text-muted-foreground dark:text-gray-400",
  "text-gray-300": "text-gray-600 dark:text-gray-300",
  "text-gray-500": "text-muted-foreground dark:text-gray-500",
  "border-[#1f1f1f]": "border-border dark:border-[#1f1f1f]",
  "border-[#222222]": "border-border dark:border-[#222222]",
  "border-[#2a2a2a]": "border-border dark:border-[#2a2a2a]",
  "border-[#2b2b2b]": "border-border dark:border-[#2b2b2b]",
  "border-[#333333]": "border-border dark:border-[#333333]",
  "border-[#444444]": "border-border dark:border-[#444444]",
};

const regexStr = '(?<!dark:)(hover:|focus:|group-hover:|)?(' + Object.keys(map).map(k => k.replace(/\[/g, '\\[').replace(/\]/g, '\\]')).join('|') + ')\\b';
const regex = new RegExp(regexStr, 'g');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(regex, (match, prefix, baseClass) => {
    prefix = prefix || '';
    const replacementStr = map[baseClass];
    if (!replacementStr) return match;
    
    // replacementStr looks like "bg-card dark:bg-[#111111]"
    // split by space and add prefix
    const parts = replacementStr.split(' ');
    const newParts = parts.map(p => {
      if (p.startsWith('dark:')) {
        return 'dark:' + prefix + p.replace('dark:', '');
      } else {
        return prefix + p;
      }
    });
    return newParts.join(' ');
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

processDirectory('./frontend/app/student');
processDirectory('./frontend/components/student');

console.log("Done.");
