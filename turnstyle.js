/**
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 *
 * Dan Friedman
 */

var defaultStyle = "body { margin: 0 auto; max-width: 50em; font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif; line-height: 1.5; padding: 4em 1em; color: #444 }\n" +
	"h2 { margin-top: 1em; padding-top: 1em }\n" +
	"h1,h2,strong { color: #333; }\n" +
	"code,pre { background: #f5f7f9; border-bottom: 1px solid #d8dee9; }\n" +
	"code { padding: 2px 4px; vertical-align: text-bottom; }\n" +
	"pre { padding: 1em; border-left: 2px solid #69c; }\n";


/**
 * restyle: overrides the page's style by inserting the css rules
 * @param {string} styleRules
 */
function restyle(styleRules) {
	if (styleRules) {
		var node = document.createElement("style");
		node.setAttribute("class", "turnstyle");
		node.innerHTML = styleRules;
		document.head.appendChild(node);		
	}
}

/**
 * getStyle: get a string of style rules from the styles object in chrome storage
 * 		and call the callback function on the result
 * @param {string} styleName
 * @param {function} callback
 */
function getStyle(styleName, callback) {
	chrome.storage.sync.get("styles", function(result) {
		if (result.styles) {
			var styleRules = result.styles[styleName] ? result.styles[styleName] : "";
			callback(styleRules);
		}
	});
}


/**
 * saveStyle: save the style in the styles object in storage
 * @param {string} styleName
 * @param {string} styleRules
 */
function saveStyle(styleName, styleRules, overWrite) {
	chrome.storage.sync.get("styles", function(result) {
		var styles = result.styles ? result.styles : {};
		if (overWrite || !styles[styleName]) {
			styles[styleName] = styleRules;
			chrome.storage.sync.set({"styles": styles});
		}
	});
}

/**
 * saveSettings: save the settings for this website in chrome storage
 * @param {string} styleName
 */
function saveSettings(styleName) {
	var pageUrl = location.origin;
	if (pageUrl !== "styles") {			// make sure we don't overwrite the styles field
		var settings = {};
		settings[pageUrl] = styleName;
		chrome.storage.sync.set(settings);		
	}
}

/**
 * loadSettings: look for saved settings in chrome.storage; if there are any, restyle the
 * 		page and send a message to the popup script to change the popup text
 */
function loadSettings() {
	var pageUrl = location.origin;
	chrome.storage.sync.get(pageUrl, function(result) {
		if (result[pageUrl]) {
			getStyle(result[pageUrl], restyle);
		}
	});
}

/**
 * clearStorage: clear any of the settings saved for this website
 * @param {boolean} clearAll: clear all saved settings if set to true
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
	chrome.storage.sync.getBytesInUse(null, function(bytes) {
		console.log(bytes + " bytes in use");
	});
	chrome.storage.sync.get(null, function(storage) {
		console.log(storage);
	});
}

// listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.instruction === "restyle") {
		console.log(request);
		var styleRules, styleName;
		if (request.styleRules) {
			styleRules = request.styleRules;
			styleName = request.styleName ? request.styleName : location.origin;
		}
		else {
			styleRules = defaultStyle;
			styleName = "default";
		}
		saveStyle(styleName, styleRules);
		saveSettings(styleName);
		restyle(styleRules);
		sendResponse({message: "restyled"})
	}
	else if (request.instruction === "clear settings") {
		clearStorage();
		sendResponse({message: "settings cleared"});
	}
	else if (request.instruction === "clear all") {
		clearStorage(true);
		sendResponse({message: "storage cleared"})
	}
});

// on load
loadSettings();







