const cloudData = [{id: 1, status: "Chưa bắt đầu"}];
const savedItemEdits = { "task_1": { status: "Hoàn thành" } };
const savedOverrides = {};

const mergeData = (cloudData, localData, type) => {
    if (!cloudData || cloudData.length === 0) return localData;
    return cloudData.map(cItem => {
        const editKey = type + "_" + cItem.id;
        const localEdits = savedItemEdits[editKey] || {};
        const localStatusOverride = savedOverrides[editKey];
        
        return {
            ...cItem,
            ...localEdits,
            status: localEdits.status || localStatusOverride || cItem.status
        };
    });
};

console.log(mergeData(cloudData, [], "task"));
