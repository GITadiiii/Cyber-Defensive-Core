chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "GOVSHIELD_WARNING") {
    showWarningBanner(message.domain, message.reason);
  }
});

function showWarningBanner(domain, reason) {
  if (document.getElementById("govshield-warning-banner")) return;

  const banner = document.createElement("div");
  banner.id = "govshield-warning-banner";
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 2147483647;
    background: #c0392b;
    color: white;
    padding: 14px 20px;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  `;

  const reasonText = reason ? ` (${reason})` : "";

  banner.innerHTML = `
    <span>⚠️ <strong>Warning:</strong> "${domain}" is <strong>NOT a verified government website</strong>${reasonText}. Do not enter personal information here.</span>
    <div>
      <button id="govshield-go-back" style="margin-right:8px; background:white; color:#c0392b; border:none; padding:6px 14px; border-radius:4px; font-weight:600; cursor:pointer;">Go Back</button>
      <button id="govshield-dismiss" style="background:transparent; color:white; border:1px solid white; padding:6px 14px; border-radius:4px; cursor:pointer;">Dismiss</button>
    </div>
  `;

  document.body.prepend(banner);

  document.getElementById("govshield-go-back").addEventListener("click", () => {
    history.back();
  });

  document.getElementById("govshield-dismiss").addEventListener("click", () => {
    banner.remove();
  });
}