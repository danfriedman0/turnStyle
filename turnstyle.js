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
 * insertStyle: override the page's style by inserting the css rules with optional class name and id
 */
function insertStyle(styleRules, className, id) {
	if (styleRules) {
		var node = document.createElement("style");
		node.setAttribute("class", "turnstyle");
		if (className)
			node.classList.add(className);
		if (id)
			node.setAttribute("id", id);
		node.innerHTML = styleRules;
		document.head.appendChild(node);		
	}
}

/**
 * removeStyle: remove all styles with the specified id or class name
 *	if no arguments are passed, remove all style elements with the "turnstyle" class
 */
function removeStyle(styleId, className) {
	if (styleId) {
		var styleNode = document.getElementById(styleId);
		if (styleNode)
			styleNode.parentNode.removeChild(styleNode);
	}
	else {
		className = className ? className : "turnstyle";
		var styleNodes = document.getElementsByClassName(className);
		while (styleNodes.length > 0) {
			styleNodes[0].parentNode.removeChild(styleNodes[0]);
		}
	}
}

/**
 * getStyle: get a string of style rules from the styles object in chrome storage
 * 	and call the callback function on the result
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
 *	overwrite the existing style if overwrite is set to true
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
 */
function saveSettings(styleName) {
	var pageUrl = location.origin;
	if (pageUrl !== "styles") {			// make sure we don't overwrite the styles field
		chrome.storage.sync.get(pageUrl, function(result) {
			var pageStyles = result[pageUrl] ? result[pageUrl] : [];
			var pageEntry = {};
			pageStyles.push(styleName);
			pageEntry[pageUrl] = pageStyles;
			chrome.storage.sync.set(pageEntry);
			getStorageInfo();
		});
	}
}

/**
 * loadSettings: look for saved styles in chrome.storage and restyle the page if there are any
 */
function loadSettings() {
	var pageUrl = location.origin;
	chrome.storage.sync.get(pageUrl, function(result) {
		if (result[pageUrl]) {
			result[pageUrl].forEach(function(styleRules) {
				getStyle(styleRules, insertStyle);
			});
		}
	});
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

	removeStyle();
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
	if (request.instruction === "insertStyle") {
		var styleRules = request.styleRules ? request.styleRules : "";
		var styleId = request.styleId ? request.styleId : "";
		var className = request.className ? request.className : "";

		if (styleId === "ts-preview")
			removeStyle("ts-preview");

		insertStyle(styleRules, className, styleId);
		sendResponse({message: "inserted style"});
	}
	else if (request.instruction === "removeStyle") {
		var styleId = request.styleId ? request.styleId : null;
		var className = request.className ? request.className : null;
		removeStyle(styleId, className);
		sendResponse({message: "removed style"});
	}
	else if (request.instruction === "restyle") {
		var styleRules = request.styleRules ? request.styleRules : defaultStyle;
		var styleName = request.styleName ? request.styleName : "default";
		
		insertStyle(styleRules);
		saveStyle(styleName, styleRules);
		saveSettings(styleName);
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







