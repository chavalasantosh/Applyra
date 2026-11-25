(() => {
  'use strict';
  import(chrome.runtime.getURL('assets/opportunities/opportunity-view.mjs'))
    .then(({ mountOpportunityScans }) => mountOpportunityScans(document))
    .catch((error) => {
      const status = document.querySelector('#scanStatus');
      if (status) status.textContent = `Scan screen failed to load: ${error?.message || error}`;
    });
})();
