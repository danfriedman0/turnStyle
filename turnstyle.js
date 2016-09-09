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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.instruction === "restyle") {
		var stylesheet = request.stylesheet ? request.stylesheet : "default.css";
		restyle(stylesheet);
		saveStyle(stylesheet);
		sendResponse({response: "restyled"})
	}
	else if (request.instruction === "clear storage") {
		clearStorage();
		sendResponse({response: "storage cleared"});
	}
});

// on load
loadSettings();







