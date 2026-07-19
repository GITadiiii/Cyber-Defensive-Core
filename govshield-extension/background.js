
importScripts("config.js");

console.log("GovShield extension loaded successfully!");

let verifiedDomains = [];

fetch(chrome.runtime.getURL("allowlist.json"))
  .then((res) => res.json())
  .then((data) => {
    verifiedDomains = data.verifiedDomains;
    console.log("GovShield: Loaded", verifiedDomains.length, "verified domains");
  });

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return null;
  }
}

function looksLikeGovSite(domain) {
  return domain.includes("gov") || domain.includes(".nic.in");
}

function isVerified(domain) {
  return verifiedDomains.includes(domain);
}

function normalizeHomographs(domain) {
  const confusables = {
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x",
    "0": "o", "1": "i", "3": "e", "5": "s",
  };
  let normalized = domain;
  for (const [fake, real] of Object.entries(confusables)) {
    normalized = normalized.split(fake).join(real);
  }
  return normalized;
}

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function findClosestTyposquat(domain) {
  const normalized = normalizeHomographs(domain);
  let closest = null;
  let minDistance = Infinity;

  for (const verified of verifiedDomains) {
    const distance = levenshteinDistance(normalized, verified);
    if (distance < minDistance) {
      minDistance = distance;
      closest = verified;
    }
  }

  if (minDistance > 0 && minDistance <= 3) {
    return { match: closest, distance: minDistance };
  }
  return null;
}

function updateTabStatus(tabId, status, domain, detail) {
  chrome.storage.local.set({
    [`tabStatus_${tabId}`]: { status, domain, detail },
  });
}

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) return;

  const domain = extractDomain(details.url);
  if (!domain) return;

  console.log("GovShield checking:", domain);

  if (isVerified(domain)) {
    updateTabStatus(details.tabId, "verified", domain);
    return;
  }

  if (looksLikeGovSite(domain)) {
    console.warn("GovShield: SUSPICIOUS SITE DETECTED —", domain);
    updateTabStatus(details.tabId, "suspicious", domain, "Claims to be a government site but is not verified.");
    chrome.tabs.sendMessage(details.tabId, {
      type: "GOVSHIELD_WARNING",
      domain: domain,
      reason: "not on the verified list",
    });
    return;
  }

  const typosquat = findClosestTyposquat(domain);
  if (typosquat) {
    console.warn("GovShield: TYPOSQUAT DETECTED —", domain, "looks like", typosquat.match);
    updateTabStatus(details.tabId, "suspicious", domain, `Looks very similar to ${typosquat.match} — possible impersonation.`);
    chrome.tabs.sendMessage(details.tabId, {
      type: "GOVSHIELD_WARNING",
      domain: domain,
      reason: `looks very similar to the real site ${typosquat.match}`,
    });
    return;
  }

  // Layer 3: Google Safe Browsing check for domains not caught by earlier layers
  const isThreat = await checkSafeBrowsing(details.url);
  if (isThreat) {
    console.warn("GovShield: SAFE BROWSING THREAT DETECTED —", domain);
    updateTabStatus(details.tabId, "suspicious", domain, "Flagged by Google Safe Browsing as a known phishing/malware site.");
    chrome.tabs.sendMessage(details.tabId, {
      type: "GOVSHIELD_WARNING",
      domain: domain,
      reason: "flagged by Google Safe Browsing as a known threat",
    });
    return;
  }

  updateTabStatus(details.tabId, "not-gov", domain);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`tabStatus_${tabId}`);
});
// --- Layer 4: Redirect-chain monitoring ---
chrome.webRequest.onBeforeRedirect.addListener(
  (details) => {
    
    const sourceDomain = extractDomain(details.url);
    const destDomain = extractDomain(details.redirectUrl);

    if (!sourceDomain || !destDomain) return;

    const sourceLooksGov = looksLikeGovSite(sourceDomain) || isVerified(sourceDomain);
    const destIsVerified = isVerified(destDomain);

    if (sourceLooksGov && !destIsVerified) {
      console.warn("GovShield: REDIRECT HIJACK DETECTED —", sourceDomain, "->", destDomain);
      updateTabStatus(
        details.tabId,
        "suspicious",
        destDomain,
        `You were redirected from ${sourceDomain} to an unverified site.`
      );
      chrome.tabs.sendMessage(details.tabId, {
        type: "GOVSHIELD_WARNING",
        domain: destDomain,
        reason: `you were redirected here from ${sourceDomain} without warning`,
      });
    }
  },
  { urls: ["<all_urls>"] }
);
async function checkSafeBrowsing(url) {
  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "govshield", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: ["SOCIAL_ENGINEERING", "MALWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );
    const data = await response.json();
    return !!data.matches;
  } catch (e) {
    console.error("GovShield: Safe Browsing check failed —", e);
    return false;
  }
}