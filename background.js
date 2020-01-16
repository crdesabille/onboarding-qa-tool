'use strict';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  const timer = ms => {
    return new Promise(res => setTimeout(res, ms));
  }
  /**
   * 
  type: "basic"
  url: "https://raywhiteparahills.com.au/properties/residential-for-sale/sa/para-hills-5096/land/2234620"
  redirected: true
  status: 200
  ok: true
  statusText: ""
  headers: Headers {}
  body: (...)
  bodyUsed: true 
   */
  // Function: Query links from website
  const queryLink = async (url) => {
    const response = await fetch(url)
      .then(async (response) => {
        const responseText = await response.text();
        const responseTitle = (new window.DOMParser()).parseFromString(responseText, "text/html").title;
        const updatedLink = {
          url: url,
          title: responseTitle,
          urlResponse: response.url,
          redirected: response.redirected,
          status: response.status,
          ok: response.ok,
          statusText: response.statusText,
        };
        return updatedLink;
      });
    return response;
  };

  // Function: Prepare links for checking
  const checkLinks = async (data) => {
    const links = [...data];
    links.map(async (link) => {
      const result = await queryLink(link.url);
      if (result.ok) {
        console.log(result.status);
      } else {
        console.log('not okay');
      }
    });
  };

  const checkLinksInBackground = async () => {
    const links = [...request.links];
    await checkLinks(links);
  };

  // Function: Lazy load all links at once
  const lazyLoadAllLinks = () => {
    const links = [...request.links];
    links.map(link => {
      chrome.tabs.create({
        url: chrome.extension.getURL('lazyloading.html#') + link.url,
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
