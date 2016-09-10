/**
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 *
 * Dan Friedman
 */

var styleString = "body { margin: 0 auto; max-width: 50em; font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.5; padding: 4em 1em; color: #444 }\n" +
	"h2 { margin-top: 1em; padding-top: 1em }\n" +
	"h1,h2,strong { color: #333; }\n" +
	"code,pre { background: #f5f7f9; border-bottom: 1px solid #d8dee9; }\n" +
	"code { padding: 2px 4px; vertical-align: text-bottom; }\n" +
	"pre { padding: 1em; border-left: 2px solid #69c; }\n";

/**
 * restyle: overrides the page's style by inserting the css rules
 * @param {String} style: CSS rules
 */
function restyle(style) {
	var node = document.createElement("style");
	node.setAttribute("class", "turnstyle");
	node.innerHTML = style;
	document.head.appendChild(node);
}

/**
 * saveStyle: save the settings for this website with the Chrome storage API
 * @param {String} style: CSS rules
 */
function saveStyle(style) {
	var pageUrl = location.origin;
	var settings = {};
	settings[pageUrl] = style;
	chrome.storage.sync.set(settings);
}

/**
 * loadSettings: look for saved settings in chrome.storage; if there are any, restyle the
 * page and send a message to the popup script to change the popup text
 */
function loadSettings() {
	var pageUrl = location.origin;
	chrome.storage.sync.get(pageUrl, function(obj) {
		if (obj && obj[pageUrl]) {
			restyle(obj[pageUrl])
		}
	});

	getStorageInfo();
}

/**
 * clearStorage: clear any of the settings saved for this website
 */
function clearStorage(clearAll) {
	if (clearAll) {
		chrome.storage.sync.get(null, function(obj) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key))
					chrome.storage.sync.remove(key);
			}
		});
	}
	else {
		var pageUrl = location.origin;
		chrome.storage.sync.remove(pageUrl);
	}

	var styleNodes = document.getElementsByClassName("turnstyle");
	while (styleNodes.length > 0) {
		styleNodes[0].parentNode.removeChild(styleNodes[0]);
	}
}

function getStorageInfo() {
	chrome.storage.sync.getBytesInUse("turnStyle", function(bytes) {
		console.log(bytes + " bytes in use");
	});
	chrome.storage.sync.get(null, function(storage) {
		for (var key in storage) {
			if (storage.hasOwnProperty(key))
				console.log(key + " -> " + storage[key]);
		}
	});
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.instruction === "restyle") {
		var style = request.style ? request.style : styleString;
		restyle(style);
		saveStyle(style);
		sendResponse({message: "restyled"})
	}
	else if (request.instruction === "clear storage") {
		clearStorage();
		sendResponse({message: "storage cleared"});
	}
});

// on load
loadSettings();







