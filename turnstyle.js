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
	chrome.storage.sync.get("turnStyle", function(obj) {
		var turnStyle = obj.turnStyle ? obj.turnStyle : {};
		var pageUrl = location.origin;
		turnStyle[pageUrl] = style;
		chrome.storage.sync.set({"turnStyle": turnStyle});
	});

	getStorageInfo();
}

/**
 * loadSettings: look for saved settings in chrome.storage; if there are any, restyle the
 * page and send a message to the popup script to change the popup text
 */
function loadSettings() {
	chrome.storage.sync.get("turnStyle", function(obj) {
		if (obj && obj.turnStyle) {
			var pageUrl = location.origin;
			var style = obj ? obj.turnStyle[pageUrl] : null;
			if (style) {
				restyle(style);
			}
		}
	});
}

/**
 * clearStorage: clear any of the settings saved for this website and reload the page
 * @param {Boolean} clearAll: the function will clear all turnStyle settings if clearAll == True
 */
function clearStorage(clearAll) {
	if (clearAll) {
		chrome.storage.sync.remove("turnStyle");	
	}
	else {
		var pageUrl = location.origin;
		chrome.storage.sync.get("turnStyle", function(obj) {
			var turnStyle = obj ? obj.turnStyle : null;
			if (turnStyle) {
				var pageUrl = location.origin;
				delete turnStyle[pageUrl];
				chrome.storage.sync.set({"turnStyle": turnStyle});
			}
		});
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
		console.log("storage contains: " + storage);
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







