import fs from 'fs';
import path from 'path';

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) results = results.concat(getFiles(fullPath));
    else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) results.push(fullPath);
  });
  return results;
}

const files = getFiles('src');
const tables = ['admins', 'chat_messages', 'destinations', 'dining_hubs', 'emergency_hotlines', 'reviews', 'tour_guide_bookings', 'tourists'];

tables.forEach(table => {
  console.log(`\n=================== TABLE: ${table} ===================`);
  files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes(`'${table}'`) || line.includes(`"${table}"`)) {
        console.log(`[${f}:${i+1}] ${line.trim()}`);
        for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+15); j++) {
          if (lines[j].includes('insert') || lines[j].includes('select') || lines[j].includes('update') || lines[j].includes('{')) {
            console.log(`   ${j+1}: ${lines[j].trim()}`);
          }
        }
      }
    });
  });
});
