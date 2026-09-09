const fs = require('fs');

const liveData = JSON.parse(fs.readFileSync('live_data.json', 'utf-8')).data;
const capex = liveData.capex;

// 1. Fixed costs
const fixedItems = capex.filter(item => item.group === 'Chi phí Cố định Ban đầu' || item.id === 'capex_0_1' || item.id === 'capex_0_2');

liveData.capex = fixedItems;
console.log("Reset Capex length:", fixedItems.length);

fetch('https://hana-pm-hub.pages.dev/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(liveData)
}).then(res => res.json()).then(console.log).catch(console.error);

