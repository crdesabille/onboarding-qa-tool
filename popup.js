'use strict';

const popupBody = document.getElementById('popup_body');
const onboardingDiv = document.getElementById('onboarding_div');
const openLinksAtOnceBtn = document.getElementById('openLinksAtOnceBtn');
const lazyLoadLinksBtn = document.getElementById('lazyLoadLinksBtn');
const checkInBackgroundBtn = document.getElementById('checkInBackgroundBtn');
const getAllLinksBtn = document.getElementById('getAllLinksBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const stopBtn = document.getElementById('stopBtn');


openLinksAtOnceBtn.addEventListener('click', () => { sendToDo('openLinksAtOnce') });
lazyLoadLinksBtn.addEventListener('click', () => { sendToDo('lazyLoadLinks') });
checkInBackgroundBtn.addEventListener('click', () => { sendToDo('checkInBackground') });
getAllLinksBtn.addEventListener('click', () => { sendToDo('getAllLinks') });
clearAllBtn.addEventListener('click', () => { sendToDo('clearAll') });
stopBtn.addEventListener('click', () => { sendToDo('stop') });

const sendToDo = todo => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { todo: todo, tabID: tabs[0].id });
  });
}

