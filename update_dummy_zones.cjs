const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/capex30.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

data = data.map((item, index) => {
    // Phân bổ ngẫu nhiên hợp lý
    let zone = "Phòng Trị liệu";
    if (item.title.toLowerCase().includes("lễ tân") || item.title.toLowerCase().includes("sofa") || item.title.toLowerCase().includes("bảng hiệu")) {
        zone = "Sảnh Lễ tân";
    } else if (item.title.toLowerCase().includes("cố định") || item.group.includes("Cố định")) {
        zone = "Toàn bộ cơ sở";
    } else if (index % 3 === 0) {
        zone = "Khu vực chung";
    }
    return { ...item, zone };
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Updated dummy zones!");
