chrome.runtime.sendMessage({ todo: "showPageAction" });
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    // Function: Create results container for check links in background
    const createResultsContainer = () => {
        const body = document.querySelectorAll('body')[0];

        const main_container = document.createElement('div');
        main_container.setAttribute('id', 'results_main-container');

        const container_header = document.createElement('div');
        container_header.setAttribute('id', 'results_container-header');

        const drag_handle = document.createElement('div');
        drag_handle.setAttribute('id', 'drag_handle');
        drag_handle.innerText = 'Drag here to move.';

        const status_bar = document.createElement('div');
        status_bar.setAttribute('id', 'status_bar');
        status_bar.innerHTML = '<span>Status</span>';

        const results_container = document.createElement('div');
        results_container.setAttribute('id', 'results_container');

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
        results_table.appendChild(results_table_header);
        results_container.appendChild(results_table);
        main_container.appendChild(container_header);
        main_container.appendChild(results_container);
        body.insertBefore(main_container, body.firstChild);
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

    const displayResults = () => {
        const results = [...request.results];
        let classes = ['results'];
        let status;
        console.log(results);
        results.map((result, index) => {
            if (result.redirect) {
                if (result.url.length < result.urlResponse.length) {
                    classes.push('valid_redirect');
                    status = 'Redirect OK';
                } else {
                    classes.push('unsure_redirect');
                    status = 'Redirect Unsure';
                }
            } else if (!result.ok && result.status === 404) {
                classes.push('broken');
                status = 'Broken';
            } else if (!result.ok) {
                classes.push('warning');
                status = result.statusText || 'Unknown';
            } else {
                classes.push('valid');
                status = 'Valid';
            }

            const table = document.getElementById('results_table');
            const result_row = document.createElement('tr');
            result_row.setAttribute('class', classes.join(" "));
            result_row.innerHTML = `<td>${index + 1}</td><td>${status}</td><td>${result.urlText}</td><td>${result.url}</td><td>${result.title}</td><td>${result.urlResponse}</td>`;
            table.appendChild(result_row);
        });
    };

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
    const checkInBackground = async () => {
        const links = [...fetchLinks()];
        createResultsContainer();
        dragElement(document.getElementById("results_main-container"));
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

        case 'displayResults': return displayResults();

        default: return console.log('default switch');
    }
});
