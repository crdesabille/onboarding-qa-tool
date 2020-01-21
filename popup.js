'use strict';

const popupBody = document.getElementById('popup_body');
const onboardingDiv = document.getElementById('onboarding_div');
const openLinksAtOnceBtn = document.getElementById('openLinksAtOnceBtn');
const lazyLoadLinksBtn = document.getElementById('lazyLoadLinksBtn');
const getAllLinksBtn = document.getElementById('getAllLinksBtn');
const checkInBackgroundBtn = document.getElementById('checkInBackgroundBtn');


openLinksAtOnceBtn.addEventListener('click', () => { sendToDo('openLinksAtOnce') });
lazyLoadLinksBtn.addEventListener('click', () => { sendToDo('lazyLoadLinks') });
getAllLinksBtn.addEventListener('click', () => { sendToDo('getAllLinks') });
checkInBackgroundBtn.addEventListener('click', () => { sendToDo('checkInBackground') });

const sendToDo = todo => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { todo: todo, tabID: tabs[0].id }, response => {
      if (response.task === 'checkInBackground') {
        chrome.storage.sync.set({ processState: "Running" });
        checkInBackgroundBtn.disabled = true;
      }
    });
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
  if (request.task === 'completeResults') {
    checkInBackgroundBtn.disabled = false;
  }
});

chrome.storage.sync.get(['processState'], result => {
  if (result.processState === 'Running') {
    checkInBackgroundBtn.disabled = true;
  } else {
    checkInBackgroundBtn.disabled = false;
  }
});
