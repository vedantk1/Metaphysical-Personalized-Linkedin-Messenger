
chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
    
  });
// chrome.downloads.onChanged.addListener((delta) => {
//     if (delta.state && delta.state.current === 'complete') {
//         chrome.downloads.search({ id: delta.id }, (results) => {
//         if (results && results.length > 0) {
//             const file = results[0];
//             console.log('Downloaded:', file.filename);
//             // await chrome.downloads.open(file.id);
//             chrome.tabs.create({ url: "file://" + file.filename, active: false })
//             // chrome.downloads.open(file.id);
            
//         }});
//     }
// });

// Maintain a map of tabs to track if the content script has been injected
// const injectedTabs = new Set();

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//     if (changeInfo.status === 'complete' && tab.url && tab.url.endsWith('.pdf')) {
//         console.log('PDF opened:', tab.url, 'tabId:', tabId);
//         // chrome.runtime.sendMessage({ action: 'processPDF', content: tab.url });
        
//         // chrome.scripting.executeScript({
//             // target: { tabId: tabId },
//             // files: ['dist/content.bundle.js']
//             // }, () => {
//             //     // Mark the tab as injected to avoid re-injecting the script
//             //     console.log('content.js injected');
//             //     injectedTabs.add(tabId);
//             // });

//         if (!injectedTabs.has(tabId)) {
//             // console.log('PDF opened:', tab.url, 'tabId:', tabId);
//             chrome.scripting.executeScript({
//                 target: { tabId: tabId },
//                 files: ['dist/content.bundle.js']
//             }, () => {
//                 // Mark the tab as injected to avoid re-injecting the script
//                 console.log('content.js injected');
//                 injectedTabs.add(tabId);
//             });
//         } else {
//             console.log('content.js already injected');
//         }
//     }
// });

// // Remove tab from injectedTabs set when it is closed to free up memory
// chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
//     injectedTabs.delete(tabId);
// });




