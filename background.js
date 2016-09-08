chrome.browserAction.onClicked.addListener(function(tab) {
	console.log('Injecting style');
	chrome.tabs.insertCSS({
		file: 'default.css'
	});
});