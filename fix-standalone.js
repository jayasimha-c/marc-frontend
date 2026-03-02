const fs = require('fs');
const path = require('path');
let fixed = 0;

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fp = path.join(dir, f);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) {
      walk(fp);
    } else if (f.endsWith('.component.ts')) {
      let content = fs.readFileSync(fp, 'utf8');
      if (!content.includes('standalone')) {
        content = content.replace('@Component({', '@Component({\n  standalone: false,');
        fs.writeFileSync(fp, content);
        console.log('Fixed: ' + fp);
        fixed++;
      }
    }
  }
}

walk(path.join(__dirname, 'src', 'app'));
console.log('Total fixed: ' + fixed);
