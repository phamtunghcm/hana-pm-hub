const fs = require('fs');

fetch('https://hana-pm-hub.pages.dev/api/data')
  .then(res => res.json())
  .then(liveData => {
      const newCapex = JSON.parse(fs.readFileSync('full_capex_correct.json', 'utf-8'));
      liveData.data.capex = newCapex;
      
      return fetch('https://hana-pm-hub.pages.dev/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(liveData.data)
      });
  })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
