const tasksData = require('./src/data/tasks36.json');
const docsData = require('./src/data/docs9.json');
const legalData = require('./src/data/legal5.json');
const capexData = require('./src/data/capex30.json');

const savedOverrides = {};
const savedItemEdits = {
  "task_1": { "status": "Hoàn thành" },
  "task_2": { "status": "Hoàn thành" }
};
const savedNewItems = [];

const mapData = (data, type) => data.map(item => {
  const editKey = type + '_' + item.id;
  const edits = savedItemEdits[editKey] || {};
  return {
    ...item,
    type,
    ...edits,
    status: edits.status || savedOverrides[editKey] || item.status
  };
});

const initialTasks = mapData(tasksData, 'task');
const initialLegal = mapData(legalData, 'legal');
const initialDocs = mapData(docsData, 'doc');
const initialCapex = mapData(capexData, 'capex');

const cloud = {
  tasks: tasksData,
  docs: docsData,
  legal: legalData,
  capex: capexData
};

const mergeData = (cloudData, localData, type) => {
   if (!cloudData || cloudData.length === 0) return localData;
   
   // Xử lý các task từ Cloud (cập nhật với localEdits nếu có)
   const merged = cloudData.map(cItem => {
      const editKey = type + "_" + cItem.id;
      const localEdits = savedItemEdits[editKey] || {};
      const localStatusOverride = savedOverrides[editKey];
      
      return {
         ...cItem,
         ...localEdits,
         status: localEdits.status || localStatusOverride || cItem.status
      };
   });

   // Thêm các task cục bộ (được tạo mới - nằm trong localData nhưng chưa có trên Cloud)
   localData.forEach(lItem => {
      if (!merged.find(m => m.id === lItem.id)) {
         merged.push(lItem);
      }
   });

   return merged;
};

const mergedTasks = mergeData(cloud.tasks, initialTasks, 'task');
console.log("Merged tasks count:", mergedTasks.length);
console.log("Merged completed:", mergedTasks.filter(t => t.status === "Hoàn thành").length);
