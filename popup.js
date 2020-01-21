'use strict';

const popupBody = document.getElementById('popup_body');
const onboardingDiv = document.getElementById('onboarding_div');
const openLinksAtOnceBtn = document.getElementById('openLinksAtOnceBtn');
const lazyLoadLinksBtn = document.getElementById('lazyLoadLinksBtn');
const checkInBackgroundBtn = document.getElementById('checkInBackgroundBtn');
const getAllLinksBtn = document.getElementById('getAllLinksBtn');


openLinksAtOnceBtn.addEventListener('click', () => { sendToDo('openLinksAtOnce') });
lazyLoadLinksBtn.addEventListener('click', () => { sendToDo('lazyLoadLinks') });
checkInBackgroundBtn.addEventListener('click', () => { sendToDo('checkInBackground') });
getAllLinksBtn.addEventListener('click', () => { sendToDo('getAllLinks') });

const sendToDo = todo => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.tabs.sendMessage(tabs[0].id, { todo: todo, tabID: tabs[0].id }, response => {
      if (response.task === 'checkInBackground') {
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

