'use strict';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let secToWait = 0;

  // Function: Promise based timer
  const timer = sec => {
    // console.log(`Waiting for ${sec}s`);
    const ms = sec * 1000;
    return new Promise(res => setTimeout(res, ms));
  };

  // Function: Step 3 - Query links using fetch API
  const queryLink = async (link) => {
    const { urlText, url } = link;
    const response = await fetch(url);
    const responseText = await response.text();
    const parsedData = (new window.DOMParser()).parseFromString(responseText, "text/html");
    const responseTitle = parsedData.title;
    const updatedResponse = {
      urlText: urlText,
      url: url,
      title: responseTitle,
      urlResponse: response.url,
      redirected: response.redirected,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    };

    if (updatedResponse.status === 429) {
      console.log('waiting');
      await timer(secToWait + 40);
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
    console.log(sender);
    const links = [...request.links];
    const results = await checkLinks(links);
    chrome.tabs.sendMessage(sender.tab.id, { todo: "displayResults", results: results });
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
