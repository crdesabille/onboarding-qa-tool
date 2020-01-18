chrome.runtime.sendMessage({ todo: "showPageAction" });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let count = {
        validCnt: 0,
        brokenCnt: 0,
        redOkCnt: 0,
        redUnsureCnt: 0,
        unknownCnt: 0
    };

    // Function: Create results container for check links in background
    const createResultsContainer = () => {
        // Get the body tag
        const body = document.querySelectorAll('body')[0];

        // Create the main container
        const main_container = document.createElement('div');
        main_container.setAttribute('id', 'results_main-container');

        // Create the header container that will contain the drag handle, status bar, anc close button
        const container_header = document.createElement('div');
        container_header.setAttribute('id', 'results_container-header');

        // Create the drag handle
        const drag_handle = document.createElement('div');
        drag_handle.setAttribute('id', 'drag_handle');
        drag_handle.innerHTML = '<span>... ... ...</span>';

        // Create the status bar
        const status_bar = document.createElement('div');
        status_bar.setAttribute('id', 'status_bar');

        // Create statusCount
        const status_count = document.createElement('div');
        status_count.setAttribute('id', 'status_count');

        // Create the close button
        const close = document.createElement('div');
        close.setAttribute('id', 'close');
        close.innerHTML = '<span>x</span>';

        // Create the container of the results that will contain the table of results
        const results_container = document.createElement('div');
        results_container.setAttribute('id', 'results_container');

        // Create the table that will contain the actual results
        const results_table = document.createElement('table');
        results_table.setAttribute('id', 'results_table');
        results_table.setAttribute('class', 'results_table');

        const results_table_header = document.createElement('tr');
        results_table_header.setAttribute('class', 'column_name');
        results_table_header.innerHTML = (
            '<th>#</th>' +
            '<th>Status</th>' +
            '<th>AnchorText</th>' +
            '<th>URL</th>' +
            '<th>ResponseTitle</th>' +
            '<th>ResponseURL</th>'
        );

        container_header.appendChild(drag_handle);
        container_header.appendChild(status_bar);
        container_header.appendChild(status_count);
        container_header.appendChild(close);
        results_table.appendChild(results_table_header);
        results_container.appendChild(results_table);
        main_container.appendChild(container_header);
        main_container.appendChild(results_container);
        body.insertBefore(main_container, body.firstChild);
    };

    // Function: Close results on close button click
    const closeResults = (closeBtn) => {
        closeBtn.onclick = () => cleanUp();
    };

    const cleanUp = () => {
        const main_container = document.getElementById('results_main-container');
        if (main_container) {
            const children = main_container.childNodes;
            if (children) {
                children.forEach(child => child.remove());
            }
            main_container.remove();
        }
    };

    // Function to make the results container draggable
    const dragElement = element => {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        const closeDragElement = () => {
            /* stop moving when mouse button is released:*/
            document.onmouseup = null;
            document.onmousemove = null;
        }

        const elementDrag = e => {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        const dragMouseDown = e => {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }

        if (document.getElementById('drag_handle')) {
            document.getElementById('drag_handle').onmousedown = dragMouseDown;
        } else {
            element.onmousedown = dragMouseDown;
        }
    }

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

        // Section: Add index to each link
        const linksWithIndex = uniqueLinks.map((link, index) => {
            return { index: index, ...link };
        });

        // Section: Return unique links [array of objects]
        return linksWithIndex;
    };

    // Function: Create a csv file
    const createCSV = data => {
        const array = [...data];
        const today = new Date();
        if (array.length > 0) {
            let csv = '';
            const keys = Object.keys(array[0]);
            keys.map(key => csv += `${key},`);
            csv += '\n';
            array.map(item => {
                const link = [];
                for (let i in item) {
                    link.push(item[i]);
                };
                csv += `${link.join(',')}`;
                csv += '\n';
            });

            const status_bar = document.getElementById('status_bar');
            const content = document.createElement('p');
            content.innerText = `Finished! ${array.length} link(s) checked. | `;
            const downloadLink = document.createElement('a');
            downloadLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            downloadLink.target = '_blank';
            downloadLink.download = `checkLinkResults-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}-${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
            downloadLink.innerText = 'Click here to download CSV file of results.';
            content.appendChild(downloadLink);
            status_bar.childNodes[0].remove();
            status_bar.appendChild(content);
        }
    };

    // Function: Interpret the html status codes and output statusText and class
    const interpretStatus = result => {
        let classes = ['results'];
        let statusText = 'Valid';
        if (result.redirect) {
            if (result.url.length < result.urlResponse.length) {
                classes.push('valid_redirect');
                statusText = 'Redirect OK';
            } else {
                classes.push('unsure_redirect');
                statusText = 'Redirect Unsure';
            }
        } else if (!result.ok && result.status === 404) {
            classes.push('broken');
            statusText = 'Broken';
        } else if (result.status === 429) {
            classes.push('warning');
            statusText = result.statusText || 'Too many requests';
        } else if (!result.ok) {
            classes.push('warning');
            statusText = result.statusText || 'Unknown';
        } else {
            classes.push('valid');
            statusText = 'Valid';
        }
        return [statusText, classes];
    };

    // Function: Display count of each status
    const displayStatusCount = statusText => {
        switch (statusText) {
            case 'Valid':
                count.validCnt++;
                break;
            case 'Broken':
                count.brokenCnt++;
                break;
            case 'Redirect OK':
                count.redOkCnt++
                break;
            case 'Redirect Unsure':
                count.redUnsureCnt++
                break;
            case 'Unknown':
                count.unknownCnt++;
                break;
            default: return console.log(statusText);
        }

        const status_count = document.getElementById('status_count');
        status_count.innerHTML = `
        <span>
        Valid: ${count.validCnt} | 
        Broken: ${count.brokenCnt} | 
        Redirect OK: ${count.redOkCnt} | 
        Redirect Unsure: ${count.redUnsureCnt} | 
        Unknown: ${count.unknownCnt}
        </span>`;
    };

    // Function: Display results in the results table
    const displayResults = response => {
        const result = { ...response };
        const [statusText, classes] = interpretStatus(result);
        const table = document.getElementById('results_table');
        const result_row = document.createElement('tr');
        result_row.setAttribute('class', classes.join(" "));
        result_row.innerHTML = `<td>${++result.index}</td><td>${statusText}</td><td>${result.urlText}</td><td>${result.url}</td><td>${result.title}</td><td>${result.urlResponse}</td>`;
        table.appendChild(result_row);
    };

    // Function: Update the status bar to display each link's status
    const statusUpdate = () => {
        const response = { ...request.updatedResponse };
        const status_bar = document.getElementById('status_bar');
        const status = response.status === 429 ? 'Too many request. Retrying in 60s.' : response.status;
        status_bar.innerHTML = `<p>Server Response: ${status} | ${response.urlText}</p>`;
        displayResults(response);
    };

    // Function: Create a CSV of all results and display it on status bar
    const printResults = () => {
        const results = [...request.results];
        const finalResults = results.map(result => {
            const [statusText] = interpretStatus(result);
            displayStatusCount(statusText);
            return {
                status: result.status,
                statusText: statusText,
                anchorText: result.urlText,
                url: result.url,
                urlResponse: result.urlResponse,
                titleResponse: result.title
            };
        });

        // Section: Sort links alphabetically by urlText
        finalResults.sort((a, b) => {
            if (a.status < b.status) return 1;
            if (a.status > b.status) return -1;
            return 0;
        });

        createCSV(finalResults);
    };

    // Function: Check links using xhr
    const checkInBackground = async () => {
        const links = [...fetchLinks()];
        cleanUp();
        createResultsContainer();
        dragElement(document.getElementById("results_main-container"));
        closeResults(document.getElementById('close'));
        chrome.runtime.sendMessage({ todo: "checkLinksInBackground", links: links });
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

    // Function: Remove all popups
    const clearAll = () => {
        cleanUp();
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

        case 'statusUpdate': return statusUpdate();
        case 'printResults': return printResults();


        default: return console.log('default switch');
    }
});
