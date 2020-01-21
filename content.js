chrome.runtime.sendMessage({ todo: "showPageAction" });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    let count = {
        validCnt: 0,
        brokenCnt: 0,
        redOkCnt: 0,
        redUnsureCnt: 0,
        unknownCnt: 0
    };

    // Function: Promise based timer
    const timer = sec => {
        const ms = sec * 1000;
        return new Promise(res => setTimeout(res, ms));
    };

    // Function: Create element
    const createElement = (type, props, inner) => {
        let element = document.getElementById(props.id);
        if (!element) {
            element = document.createElement(type);
            if (inner.innerHTML) {
                element.innerHTML = inner.innerHTML;
            }
            if (inner.innerText) {
                element.innerText = inner.innerText;
            }
            for (let propName in props) {
                element.setAttribute(propName, props[propName]);
            }
            return element;
        } else {
            if (inner.innerHTML) {
                element.innerHTML = inner.innerHTML;
            }
            if (inner.innerText) {
                element.innerText = inner.innerText;
            }
            for (let propName in props) {
                element.setAttribute(propName, props[propName]);
            }
            return props.id;
        }
    };

    const appendElement = (parent, child) => {
        if ((typeof parent) === 'string') {
            parent = document.getElementById(parent);
        }
        if ((typeof child) === 'string') {
            child = document.getElementById(child);
        }
        if (parent) {
            if (child) {
                parent.appendChild(child);
            }
        }
    };

    // Function: Create results container for check links in background
    const createResultsContainer = () => {
        // Get the body tag
        const body = document.querySelectorAll('body')[0];

        // Create the main container
        const main_container = createElement('div', { id: 'results_main-container' }, '');

        // Create the header container that will contain the drag handle, status bar, anc close button
        const container_header = createElement('div', { id: 'results_container-header' }, '');

        // Create the drag handle
        const drag_handle = createElement('div', { id: 'drag_handle' }, { innerHTML: '<div>...</div><div>...</div><div>...</div>' });

        // Create the status bar
        const status_bar = createElement('div', { id: 'status_bar' }, '');

        // Create statusCount
        const status_count = createElement('div', { id: 'status_count' }, { innerHTML: '<div></div>' });

        // Create download link
        const download = createElement('div', { id: 'download' }, '');
        const dLink = createElement('span', { id: 'download_link', style: 'visibility: hidden;' }, { innerText: 'Download CSV.' });

        // Create the close button
        const close = createElement('div', { id: 'close', style: 'visibility: hidden;' }, { innerHTML: '<span>x</span>' });

        // Create the container of the results that will contain the table of results
        const results_container = createElement('div', { id: 'results_container' }, '');

        // Create the table that will contain the actual results
        const results_table = createElement('table', { id: 'results_table' }, '');

        // Create the table headers + column name
        const results_table_header = createElement('tr', { class: 'column_name' }, { innerHTML: '<th>#</th><th>Status</th><th>AnchorText</th><th>URL</th><th>ResponseTitle</th><th>ResponseURL</th>' });

        appendElement(download, dLink);
        appendElement(container_header, drag_handle);
        appendElement(container_header, status_bar);
        appendElement(container_header, status_count);
        appendElement(container_header, download);
        appendElement(container_header, close);
        appendElement(results_table, results_table_header);
        appendElement(results_container, results_table);
        appendElement(main_container, container_header);
        appendElement(main_container, results_container);
        if ((typeof main_container) !== 'string') {
            body.insertBefore(main_container, body.firstChild);
        }
    };

    // Function: Close results on close button click
    const closeResults = closeBtn => {
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

    // Function: Create download link
    const exportCsv = file => {
        const today = new Date();
        const exportLink = document.createElement('a');
        exportLink.href = 'data:text/csv;charset=utf-8,' + encodeURI(file);
        exportLink.target = '_blank';
        exportLink.download = `Results-${today.getMonth() + 1}-${today.getDate()}-${today.getFullYear()}-${today.getHours()}-${today.getMinutes()}-${today.getSeconds()}.csv`;
        exportLink.click();
    };

    // Function: Create a csv file
    const createCSV = data => {
        const resultsToCsv = [...data];
        if (resultsToCsv.length > 0) {
            let csvFile = '';
            resultsToCsv.map((item, index) => {
                const link = [];
                for (let i in item) {
                    if (index === 0) {
                        csvFile += `${i},`;
                    }
                    link.push(item[i]);
                };
                csvFile += index === 0 ? '\n' : '';
                csvFile += `${link.join(',')}`;
                csvFile += '\n';
            });
            exportCsv(csvFile);
        }
    };

    // Function: Format the final results for csv export
    const prepareResultsForCsv = () => {
        const results = [...request.results];
        const finalResults = results.map(result => {
            const [statusText] = interpretStatus(result);
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

    // Function: On click listener for Download CSV button
    const clickedDownloadCsv = downloadBtn => {
        downloadBtn.onclick = () => {
            prepareResultsForCsv();
        };
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
    const displayStatusCount = (statusText) => {
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
        <div>
        <span class='valid'> Valid: ${count.validCnt}</span> | 
        <span class='broken'> Broken: ${count.brokenCnt}</span> | 
        <span class='valid_redirect'> Redirect OK: ${count.redOkCnt}</span> | 
        <span class='unsure_redirect'> Redirect Unsure: ${count.redUnsureCnt}</span> | 
        <span class='warning'> Unknown: ${count.unknownCnt}</span>
        </div>`;
    };

    // Function: Display results in the results table
    const displayResults = response => {
        const result = { ...response };
        const [statusText, classes] = interpretStatus(result);
        const table = document.getElementById('results_table');
        const result_row = createElement('tr', { class: classes.join(" ") }, { innerHTML: `<td>${++result.index}</td><td>${statusText}</td><td>${result.urlText}</td><td>${result.url}</td><td>${result.title}</td><td>${result.urlResponse}</td>` });
        table.appendChild(result_row);
    };

    // Function: Update the status bar to display each link's status
    const statusUpdate = async () => {
        let response = { ...request.updatedResponse };
        const status_bar = document.getElementById('status_bar');
        if (response.status === 429) {
            displayResults(response);
            let countdown = 60;
            while (response.status === 429 && countdown > 0) {
                status_bar.innerHTML = `<p><span class="warning"> Too many request. Retrying in ${countdown}s. </span></p>`;
                countdown = countdown - 1;
                await timer(1);
                response = { ...request.updatedResponse };
            }
        } else {
            const status = response.status === 200 ? '<span class="valid">Valid</span>' : response.status === 404 ? '<span class="broken">Broken</span>' : '<span class="warning">Unknown</span>';
            status_bar.innerHTML = `<p><span class="label">Checking:</span> ${response.urlText}<span class='label'> | Server Response:</span> ${status} </p>`;
            displayResults(response);
        }
    };

    // Function: Create a CSV of all results and display it on status bar
    const completeResults = async () => {
        const results = [...request.results];
        results.map(result => {
            const [statusText] = interpretStatus(result);
            displayStatusCount(statusText);
        });
        const status_bar = document.getElementById('status_bar');
        status_bar.innerHTML = `<p>Finished checking ${results.length} link(s).</p>`;
        const downloadCsvLink = document.getElementById('download_link');
        downloadCsvLink.style.visibility = 'visible';
        clickedDownloadCsv(downloadCsvLink);
        const closeBtn = document.getElementById('close');
        closeBtn.style.visibility = 'visible';
        chrome.runtime.sendMessage({ task: "completeResults" });
    };

    // Function: Check links using xhr
    const checkInBackground = () => {
        sendResponse({ task: "checkInBackground" });
        count = {
            validCnt: 0,
            brokenCnt: 0,
            redOkCnt: 0,
            redUnsureCnt: 0,
            unknownCnt: 0
        };
        const links = [...fetchLinks()];
        const results_table = document.getElementById('results_table');
        if (results_table) {
            results_table.remove();
        }
        createResultsContainer();
        dragElement(document.getElementById("results_main-container"));
        closeResults(document.getElementById('close'));
        chrome.runtime.sendMessage({ todo: "checkLinksInBackground", links: links });
    };

    // Function: Get all links and download CSV file
    const getAllLinks = () => {
        const links = [...fetchLinks()];
        if (links.length > 0) {
            let csv = 'AnchorText,URL\n';
            links.map(link => {
                csv += `${link.urlText}, ${link.url}\n`;
            });

            // Create download link
            const downloadCsv = document.createElement('a');
            downloadCsv.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
            downloadCsv.target = '_blank';
            downloadCsv.download = 'AllLinks.csv';
            downloadCsv.click();
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

    switch (request.todo) {

        case 'openLinksAtOnce': return openLinksAtOnce();
        case 'lazyLoadLinks': return lazyLoadLinks();
        case 'checkInBackground': return checkInBackground();
        case 'getAllLinks': return getAllLinks();

        case 'statusUpdate': return statusUpdate();
        case 'completeResults': return completeResults();


        default: return console.log('default switch');
    }
});
