// background.js

// This service worker is currently not doing anything.
// You can add background logic here if needed later.

chrome.runtime.onInstalled.addListener(() => {
  console.log("Phishing Site Checker extension installed.");
});
