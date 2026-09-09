const fs = require('fs');

const liveData = JSON.parse(fs.readFileSync('live_data.json', 'utf-8')).data;
const capex = liveData.capex;

// 1. Fixed costs
const fixedItems = capex.filter(item => item.id === 'capex_0_1' || item.id === 'capex_0_2');

// 2. New items from CSV
const newItems = capex.filter(item => String(item.id).startsWith('capex_1_'));

// 3. Old items that are completely missing
const missingTitles = [
    'Laptop', 'Tablet', 'Đồng phục nhân viên', 'Camera wifi', 'Loa âm trần giá rẻ',
    'Bình chữa cháy bột', 'Bình chữa cháy CO2', 'Đầu báo khói', 'Đèn Exit', 'Tiêu lệnh', 'Mặt nạ phòng độc'
];

const oldItemsToKeep = [];
for (const item of capex) {
    if (!String(item.id).startsWith('capex_1_') && item.id !== 'capex_0_1' && item.id !== 'capex_0_2') {
        if (missingTitles.includes(item.title)) {
            item.zone = "Khu vực chung";
            oldItemsToKeep.push(item);
        }
    }
}

const finalCapex = [...fixedItems, ...newItems, ...oldItemsToKeep];

const seenIds = new Set();
const cleanCapex = [];
for (const item of finalCapex) {
    if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        cleanCapex.push(item);
    }
}

liveData.capex = cleanCapex;
console.log("Cleaned Capex length:", cleanCapex.length);

fetch('https://hana-pm-hub.pages.dev/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(liveData)
}).then(res => res.json()).then(console.log).catch(console.error);

