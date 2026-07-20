chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0].id;
  chrome.storage.local.get(`tabStatus_${tabId}`, (result) => {
    const data = result[`tabStatus_${tabId}`];
    const container = document.getElementById("statusContainer");

    if (!data) {
      container.innerHTML = `
        <div class="status-badge neutral"><span class="dot"></span>Unknown</div>
        <p>No data yet for this page.</p>
      `;
      return;
    }

    if (data.status === "verified") {
      container.innerHTML = `
        <div class="status-badge verified"><span class="dot"></span>Verified Government Site</div>
        <p><span class="domain-name">${data.domain}</span> is a confirmed genuine government website.</p>
      `;
    } else if (data.status === "suspicious") {
      const detailText = data.detail ? ` ${data.detail}` : "";
      container.innerHTML = `
        <div class="status-badge suspicious"><span class="dot"></span>Suspicious Site</div>
        <p><span class="domain-name">${data.domain}</span> looks like a government site but is NOT verified.${detailText}</p>
      `;
    } else {
      container.innerHTML = `
        <div class="status-badge neutral"><span class="dot"></span>Not a Government Site</div>
        <p>This page is not related to government services.</p>
      `;
    }
  });
});