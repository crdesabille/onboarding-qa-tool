chrome.runtime.sendMessage({ todo: "showPageAction" });
chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {

    // Function: Fetch unique links
    const fetchLinks = () => {
        // Section: Fetch all anchor tags
        const htmlCollection = document.getElementsByTagName('a');
        const anchorTags = Array.from(htmlCollection);
        const anchors = anchorTags.map(anchorTag => {
            return { urlText: anchorTag.innerText, url: anchorTag.href };
        });

        // Section: Remove links with !urlText urlText === ',' , !url, and those containing activepipe and mailto:Email
        const links = anchors.filter(anchor => {
            const activepipe = anchor.url.match(/activepipe/g);
            const mailto = anchor.url.match(/mailto:Email/g);
            return (anchor.urlText && anchor.urlText.trim() !== ',' && !activepipe && !mailto && anchor.url.trim() !== '');
        });

        // Section: Sort links alphabetically by urlText
        links.sort((a, b) => {
            if (a.urlText < b.urlText) return -1;
            if (a.urlText > b.urlText) return 1;
            return 0;
        });

        // Section: Remove duplicates
        const uniqueLinks = links.filter((link, index, arr) => {
            return (index === arr.findIndex(arrItem => arrItem.url === link.url));
        });

        // Section: Return unique links [array of objects]
        return uniqueLinks;
    };

    // Function: Create a csv file
    const createCSV = prop => {
        const array = [...prop];
        const today = new Date();
        if (array.length > 0) {
            let csv = 'Status,AnchorText,URL,ResponseURL\n';
            objResponses.forEach(item => {
                csv += `${item.urlStatus}, ${item.urlText}, ${item.urlLink}, ${item.urlResponse}`;
                csv += "\n";
            });

            const container = document.getElementById('status_text');
            const content = document.createElement('span');
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            downloadLink.target = '_blank';
            downloadLink.download = `${objResponses[0].urlHost}-results-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}-${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
            downloadLink.innerText = 'Download CSV.';
            downloadLink.setAttribute('style', 'color: yellow;');
            content.setAttribute('style', 'padding: 5px 5px 5px 5px;');
            content.appendChild(downloadLink);
            container.childNodes[0].innerHTML = `<span><br />Checked ${objResponses.length} link(s).</span>`;
            container.appendChild(content);
            container.scrollIntoView(true);
        }
    };

    // Function: Open all links at once
    const openLinksAtOnce = () => {
        const links = [...fetchLinks()];
        links.map(link => {
            window.open(link.url);
        });
    };

    // Function: Fetch links and send it background.js to lazy load all links
    const lazyLoadLinks = () => {
        const links = [...fetchLinks()];
        chrome.runtime.sendMessage({ todo: "lazyLoadAllLinks", links: links });
    };

    // Function: Check links using xhr
    const checkInBackground = () => {
        const links = [...fetchLinks()];
        chrome.runtime.sendMessage({ todo: "checkLinksInBackground", links: links });
        console.log('3');
    };

    // Function: Get all links and download CSV file
    const getAllLinks = () => {
        const links = [...fetchLinks()];
        const today = new Date();
        if (links.length > 0) {
            let csv = 'AnchorText,URL\n';
            links.map(link => {
                csv += `${link.urlText}, ${link.url}\n`;
            });

            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            downloadLink.target = '_blank';
            downloadLink.download = `AllLinks-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}-${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
            downloadLink.innerText = 'Download CSV.';
            downloadLink.click();
        }
    };

    // Function: Remove all popups
    const clearAll = () => {
        console.log('5');
    };

    // Function: Stop background check
    const stop = () => {
        console.log('6');
    };

    switch (request.todo) {

        case 'openLinksAtOnce': return openLinksAtOnce();
        case 'lazyLoadLinks': return lazyLoadLinks();
        case 'checkInBackground': return checkInBackground();
        case 'getAllLinks': return getAllLinks();
        case 'clearAll': return clearAll();
        case 'stop': return stop();

        default: return console.log('default switch');
    }
});