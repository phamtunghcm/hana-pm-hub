const fs = require('fs');

fetch('https://hana-pm-hub.pages.dev/api/data')
  .then(res => res.json())
  .then(liveData => {
      const capex = liveData.data.capex;
      
      capex.push({
          id: "capex_1_101",
          group: "Dùng chung",
          title: "Máy lạnh (loại 7tr)",
          qty: 1,
          unitPrice: 7000000,
          totalPrice: 7000000,
          status: "Cần mua",
          note: "Theo yêu cầu bổ sung",
          zone: "Sảnh Lễ tân" // guessing the smaller one is for reception
      });
      
      capex.push({
          id: "capex_1_102",
          group: "Theo giường",
          title: "Ghế đẩy cho KTV",
          qty: 5,
          unitPrice: 500000,
          totalPrice: 2500000,
          status: "Cần mua",
          note: "Theo yêu cầu bổ sung",
          zone: "Phòng trị liệu chung"
      });
      
      return fetch('https://hana-pm-hub.pages.dev/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(liveData.data)
      });
  })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
