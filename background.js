'use strict';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ processState: "Stopped", linksCount: 0 });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let secToWait = 0;
  let senderId;

  // Function: Promise based timer
  const timer = sec => {
    const ms = sec * 1000;
    return new Promise(res => setTimeout(res, ms));
  };

  // Function: Step 3 - Query links using fetch API
  const queryLink = async (link) => {
    const { index, urlText, url } = link;
    const response = await fetch(url);
    const responseText = await response.text();
    const parsedData = (new window.DOMParser()).parseFromString(responseText, "text/html");
    const responseTitle = parsedData.title;
    const updatedResponse = {
      index: index,
      urlText: urlText,
      url: url,
      title: responseTitle,
      urlResponse: response.url,
      redirected: response.redirected,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    };
    chrome.tabs.sendMessage(senderId, { todo: "statusUpdate", updatedResponse: updatedResponse });
    if (updatedResponse.status === 429) {
      await timer(60);
      secToWait = secToWait <= 25 ? secToWait + 2.5 : 30;
      return await queryLink(link);
    } else {
      return updatedResponse;
    }
  };

  // Function: Step 2 - Prepare links for checking
  const checkLinks = async (linksArray) => {
    const links = [...linksArray];
    const results = [];
    for (let link of links) {
      await timer(secToWait);
      const result = await queryLink(link);
      if (result) {
        results.push({ ...result });
      }
    }
    return results;
  };

  // Function: Step 1 - Checking links in background
  const checkLinksInBackground = async () => {
    // console.log(sender);
    senderId = sender.tab.id;
    const links = [...request.links];
    const results = await checkLinks(links);
    if (results && links.length === results.length) {
      chrome.tabs.sendMessage(senderId, { todo: "completeResults", results: results });
    }
  };

  // Function: Lazy load all links at once
  const lazyLoadAllLinks = () => {
    const links = [...request.links];
    links.map(link => {
      chrome.tabs.create({
        url: chrome.extension.getURL('lazyload.html#') + link.url,
        active: false
      });
    });
  };

  // Function: Activate extension
  const showPageAction = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      chrome.pageAction.show(tabs[0].id);
    });
  }

  switch (request.todo) {
    case 'lazyLoadAllLinks': return lazyLoadAllLinks();
    case 'checkLinksInBackground': return checkLinksInBackground();
    case 'showPageAction': return showPageAction();
    default:
      console.log('default');
      break;
  }
});
