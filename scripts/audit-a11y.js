import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');

const inputMatches = [...html.matchAll(/<(input|select|textarea)\b([^>]*)>/gi)];
console.log('Total input/select/textarea tags:', inputMatches.length);
const unlabelled = [];

for (const m of inputMatches) {
  const tag = m[1];
  const attrs = m[2];
  const typeMatch = attrs.match(/type=["']([^"']+)["']/i);
  const type = typeMatch ? typeMatch[1].toLowerCase() : 'text';
  if (type === 'hidden') continue;
  
  const idMatch = attrs.match(/id=["']([^"']+)["']/i);
  const id = idMatch ? idMatch[1] : null;
  const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
  const hasAriaLabelledBy = /aria-labelledby=["'][^"']+["']/i.test(attrs);
  
  let hasLabelTag = false;
  if (id) {
    hasLabelTag = new RegExp(`<label[^>]*for=["']${id}["']`, 'i').test(html);
  }
  
  if (!hasAriaLabel && !hasAriaLabelledBy && !hasLabelTag) {
    unlabelled.push({ tag, id, attrs: attrs.trim() });
  }
}

console.log('Unlabelled inputs count:', unlabelled.length);
if (unlabelled.length > 0) {
  console.log('Unlabelled inputs:', JSON.stringify(unlabelled, null, 2));
}

const buttonMatches = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
const unlabelledButtons = [];
for (const b of buttonMatches) {
  const attrs = b[1];
  const content = b[2].replace(/<[^>]*>/g, '').trim();
  const hasAriaLabel = /aria-label=["'][^"']+["']/i.test(attrs);
  if (!content && !hasAriaLabel) {
    unlabelledButtons.push({ attrs: attrs.trim(), content });
  }
}
console.log('Unlabelled buttons count:', unlabelledButtons.length);
if (unlabelledButtons.length > 0) {
  console.log('Unlabelled buttons:', JSON.stringify(unlabelledButtons, null, 2));
}
