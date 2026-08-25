const fs = require('fs');

const tasks = JSON.parse(fs.readFileSync('src/data/tasks36.json'));
const docs = JSON.parse(fs.readFileSync('src/data/docs9.json'));
const legal = JSON.parse(fs.readFileSync('src/data/legal5.json'));
const capex = JSON.parse(fs.readFileSync('src/data/capex30.json'));

const body = JSON.stringify({
  tasks: tasks,
  docs: docs,
  legal: legal,
  capex: capex,
  settings: {
    logoText: 'HANA WELLNESS',
    brandName: 'HANA WELLNESS',
    subTitle: 'Dự án khai trương cơ sở đầu tiên',
    targetDate: '2026-11-02',
    reportEmail: 'phamtunghcm@gmail.com'
  },
  userPermissions: []
});

fetch('https://hana-pm-hub.pages.dev/api/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: body
}).then(res => res.json()).then(console.log).catch(console.error);
