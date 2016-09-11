/**
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 *
 * Dan Friedman
 */

var TurnStyle = function() {
	this.pageUrl = location.origin;
	this.pageSettings = [];
	this.styles = {};

	this.initialize();
}

/**
 * loadStyles: load all saved styles into the styles object
 */
TurnStyle.prototype.loadStyles = function() {
	var me = this;
	chrome.storage.sync.get("styles", function(result) {
		if (result.styles) {
			me.styles = result.styles;
		}
	});
}

/**
 * loadSettings: look for saved styles in chrome.storage and restyle the page if there are any
 */
TurnStyle.prototype.loadPageSettings = function() {
	var pageUrl = this.pageUrl;
	var me = this;

	chrome.storage.sync.get(pageUrl, function(result) {
		if (result[pageUrl]) {
			me.pageSettings = result[pageUrl];
			result[pageUrl].forEach(function(styleName) {
				var styleRules = me.styles[styleName];
				if (styleRules)
					me.insertStyle(styleRules);
			});
		}
	});
}

/**
 * insertStyle: override the page's style by inserting the css rules with optional class name and id
 */
TurnStyle.prototype.insertStyle = function(styleRules, className, id) {
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
TurnStyle.prototype.removeStyle = function(styleId, className) {
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
 * saveStyle: save the style in the styles object in storage
 *	overwrite the existing style if overwrite is set to true
 */
TurnStyle.prototype.saveStyle = function(styleName, styleRules, overWrite) {
	var styles = this.styles;
	if (overWrite || !styles[styleName]) {
		styles[styleName] = styleRules;
		chrome.storage.sync.set({"styles": styles});
	}
}

/**
 * saveSettings: save the settings for this website in chrome storage
 */
TurnStyle.prototype.saveSettings = function(styleName) {
	var pageUrl = this.pageUrl;
	if (pageUrl !== "styles") {			// make sure we don't overwrite the styles field
		var pageEntry = {};
		this.pageSettings.push(styleName);
		pageEntry[pageUrl] = this.pageSettings;
		chrome.storage.sync.set(pageEntry);
	}
}

/**
 * clearStorage: clear any of the settings saved for this website
 */
TurnStyle.prototype.clearStorage = function(clearAll) {
	if (clearAll) {
		chrome.storage.sync.get(null, function(obj) {
			for (var key in obj) {
				if (obj.hasOwnProperty(key))
					chrome.storage.sync.remove(key);
			}
		});
	}
	else {
		chrome.storage.sync.remove(this.pageUrl);
	}

	this.removeStyle();
}

TurnStyle.prototype.getStorageInfo = function() {
	chrome.storage.sync.getBytesInUse(null, function(bytes) {
		console.log(bytes + " bytes in use");
	});
	chrome.storage.sync.get(null, function(storage) {
		console.log(storage);
	});
}

// listen for messages from popup.js
TurnStyle.prototype.addListener = function() {
	var me = this;

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.instruction === "getPageSettings") {
			console.log("requested page settings");
			sendResponse({pageUrl: me.pageUrl, pageSettings: me.pageSettings, styles: me.styles});
		}

		else if (request.instruction === "insertStyle") {
			var styleRules = request.styleRules ? request.styleRules : "";
			var styleId = request.styleId ? request.styleId : "";
			var className = request.className ? request.className : "";

			if (styleId === "ts-preview")
				me.removeStyle("ts-preview");

			me.insertStyle(styleRules, className, styleId);
			sendResponse({message: "inserted style"});
		}

		else if (request.instruction === "removeStyle") {
			var styleId = request.styleId ? request.styleId : null;
			var className = request.className ? request.className : null;
			me.removeStyle(styleId, className);
			sendResponse({message: "removed style"});
		}

		else if (request.instruction === "restyle") {
			if (request.styleRules && request.styleName) {
				me.insertStyle(request.styleRules);
				me.saveStyle(request.styleName, request.styleRules);
				me.saveSettings(request.styleName);
				sendResponse({message: "restyled"});				
			}
		}

		else if (request.instruction === "clear settings") {
			me.clearStorage();
			sendResponse({message: "settings cleared"});
		}

		else if (request.instruction === "clear all") {
			me.clearStorage(true);
			sendResponse({message: "storage cleared"})
		}
	});	
}


TurnStyle.prototype.initialize = function() {
	this.loadStyles();
	this.loadPageSettings();
	this.addListener();
	console.log(this);
}

var turnStyle = new TurnStyle();








