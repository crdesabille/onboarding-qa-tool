document.title = `[${window.location.hash.substr(1).replace('http://', '').replace('https://', '')}]`;
// '[' + window.location.hash.substr(1).replace('http://', '').replace('https://', '') + ']';

// Listener: Load website when window/tab is in focus
window.addEventListener('focus', event => { 
	window.location = window.location.hash.substr(1);
}, false);