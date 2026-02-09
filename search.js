const fs = require('fs');
const path = require('path');

// Ищем все .tsx файлы в папке app
function findFiles(dir) {
  const results = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results.push(...findFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Проверяем каждый файл на наличие fetch
const files = findFiles(path.join(__dirname, 'app'));
console.log('Найдены файлы:');
files.forEach(file => {
  console.log('-', path.relative(__dirname, file));
});