const fs = require('fs');

  const s1 = fs.readFileSync('sheet1.csv', 'utf8');
  const t1 = parseCSV(s1, 3);
  t1.forEach(t => {
    if (t['Công việc']) {
      allTasks.push({
        id: idCounter++,
        title: t['Công việc'],
        workstream: 'Ban đầu & Chuẩn bị', // fallback
        subgroup: t['Luồng công việc'] || 'Chuẩn bị',
        priority: t['Mức độ ưu tiên'] || 'Trung bình',
        status: t['Trạng thái'] || 'Chưa bắt đầu',
        pic: t['Người phụ trách'] || 'Chưa gán',
        dueDate: t['Ngày đến hạn'] || '',
        cost: ''
      });
    }
  });
}

// 2. Pháp lý (sheet2.csv)
if (fs.existsSync('sheet2.csv')) {
  const s2 = fs.readFileSync('sheet2.csv', 'utf8');
  const t2 = parseCSV(s2, 0);
  t2.forEach(t => {
    if (t['Hạng mục Công việc']) {
      allTasks.push({
        id: idCounter++,
        title: t['Hạng mục Công việc'],
        workstream: 'Pháp lý & Lập quy',
        subgroup: 'Thủ tục pháp lý',
        priority: 'Đặc biệt cao',
        status: t['Trạng thái'] || 'Chưa bắt đầu',
        pic: t['Cơ quan thụ lý / Nơi thực hiện'] || 'Pháp chế',
        dueDate: t['Thời gian dự kiến'] || '',
        cost: ''
      });
    }
  });
}

// 3. Quy chế nội bộ (sheet3.csv)
if (fs.existsSync('sheet3.csv')) {
  const s3 = fs.readFileSync('sheet3.csv', 'utf8');
  const t3 = parseCSV(s3, 0);
  t3.forEach(t => {
    if (t['Tên văn bản / Quy chế']) {
      allTasks.push({
        id: idCounter++,
        title: t['Tên văn bản / Quy chế'],
        workstream: 'Pháp lý & Lập quy',
        subgroup: 'Văn bản nội bộ',
        priority: 'Cao',
        status: t['Trạng thái'] || 'Chưa bắt đầu',
        pic: t['Phòng ban phụ trách'] || 'HR/Pháp chế',
        dueDate: t['Hạn chót dự kiến'] || '',
        cost: ''
      });
    }
  });
}

// 4. Mua sắm (capex.csv)
if (fs.existsSync('capex.csv')) {
  const s4 = fs.readFileSync('capex.csv', 'utf8');
  // Find header row for capex: STT,Nhóm,Tên vật dụng...
  const lines = s4.split('\n');
  let headerIdx = -1;
  for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('Tên vật dụng')) {
      headerIdx = i;
      break;
    }
  }
  
  if (headerIdx !== -1) {
    const t4 = parseCSV(s4, headerIdx);
    t4.forEach(t => {
      if (t['Tên vật dụng']) {
        allTasks.push({
          id: idCounter++,
          title: `Mua sắm: ${t['Tên vật dụng']} (SL: ${t['Số lượng']})`,
          workstream: 'Mua sắm & Tài chính',
          subgroup: t['Nhóm'] || 'Vật tư',
          priority: 'Cao',
          status: t['Trạng thái'] === 'Cần mua' ? 'Chưa bắt đầu' : (t['Trạng thái'] || 'Chưa bắt đầu'),
          pic: 'Mua sắm',
          dueDate: '',
          cost: t['Thành tiền'] || ''
        });
      }
    });
  }
}

if (!fs.existsSync('src/data')) fs.mkdirSync('src/data');
fs.writeFileSync('src/data/realTasks.json', JSON.stringify(allTasks, null, 2));
console.log('Saved', allTasks.length, 'tasks');
