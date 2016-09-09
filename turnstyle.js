/**
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 *
 * Dan Friedman
 */

/**
 * restyle: overrides the page's style by inserting the specified stylesheet
 * @param {String} stylesheet: the name of a stylesheet
 */
function restyle(stylesheet) {
	var path = chrome.extension.getURL("styles/" + stylesheet);
	var link = document.createElement("link");
	var head = document.head || document.getElementsByTagName('head')[0];

	link.setAttribute("rel", "stylesheet");
	link.setAttribute("href", path);

	head.appendChild(link);
}

/**
 * saveStyle: save the settings for this website with the Chrome storage API
 * @param {String} stylesheet: the name of a stylesheet
 */
function saveStyle(stylesheet) {
	chrome.storage.sync.get("turnStyle", function(obj) {
		var settings = obj.turnStyle ? obj.turnStyle : {};
		var pageUrl = location.origin;
		settings[pageUrl] = stylesheet;
		chrome.storage.sync.set({"turnStyle": settings});
	});
}

/**
 * loadSettings: restyle the page if there are any saved settings in chrome.storage
 */
function loadSettings() {
	chrome.storage.sync.get("turnStyle", function(obj) {
		if (obj && obj.turnStyle) {
			var pageUrl = location.origin;
			var stylesheet = obj ? obj.turnStyle[pageUrl] : null;
			if (stylesheet)
				restyle(stylesheet);
		}
	});
}

/**
 * clearStorage: clear any saved settings in chrome.storage
 */
function clearStorage() {
	chrome.storage.sync.remove("turnStyle");	
}

// Listen for messages from popup.js
chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name === "turnstyle");
	port.onMessage.addListener(function(msg) {
		if (msg.instruction === "restyle") {
			var stylesheet = msg.stylesheet ? msg.stylesheet : "default.css";
			restyle(stylesheet);
			saveStyle(stylesheet);
			port.postMessage({response: "restyled"})
		}
		else if (msg.instruction === "clear storage") {
			clearStorage();
			port.postMessage({response: "storage cleared"});
		}
	});
});

// on load
loadSettings();







