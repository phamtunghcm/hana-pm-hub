const fs = require('fs');
const content = fs.readFileSync('sheet1.csv', 'utf8');
const lines = content.split('\n');

const startIndex = 3; // 4th line is header
const headers = lines[startIndex].split(',').map(h => h.replace(/^"|"$/g, '').trim());

const MOCK_TASKS = [];
for (let i = startIndex + 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  const row = [];
  let inQuote = false;
  let curr = '';
  for(let char of lines[i]) {
    if(char === '"') inQuote = !inQuote;
    else if(char === ',' && !inQuote) {
      row.push(curr.trim());
      curr = '';
    } else {
      curr += char;
    }
  }
  row.push(curr.trim());

  if(row.length > 3) {
    const obj = {};
    headers.forEach((h, idx) => {
      if(h) obj[h] = row[idx] ? row[idx].replace(/^"|"$/g, '') : '';
    });
    
    if (obj['Công việc']) {
        MOCK_TASKS.push({
            id: obj['#'],
            title: obj['Công việc'],
            workstream: obj['Luồng công việc'],
            priority: obj['Mức độ ưu tiên'],
            status: obj['Trạng thái'],
            pic: obj['Người phụ trách'],
            dueDate: obj['Ngày đến hạn'],
        });
    }
  }
}

fs.writeFileSync('src/data/realTasks.json', JSON.stringify(MOCK_TASKS, null, 2));
console.log('Saved', MOCK_TASKS.length, 'tasks');
