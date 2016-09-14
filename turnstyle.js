/**
 * turnstyle.js
 * Dan Friedman
 *
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 */

var TurnStyle = function() {
	this.baseUrl = location.origin;
	this.fullUrl = location.href;
	this.pageSettings = [];
	this.styles = {};

	this.initialize();
}

/**
 * loadStyles: load all saved styles into the styles object
 */
TurnStyle.prototype.loadStyles = function() {
	var me = this,
		fullUrl = this.fullUrl,
		matches = [],
		re;

	chrome.storage.sync.get(null, function(storage) {
		for (var key in storage) {
			if (storage.hasOwnProperty(key) && key !== "style") {
				re = new RegExp("^" + key);
				if (fullUrl.match(re))
					matches.push(key);
			}
		}
		if (matches) {
			console.log(matches.sort()[matches.length-1]);
		}
	});

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
	var baseUrl = this.baseUrl;
	var me = this;

	chrome.storage.sync.get(baseUrl, function(result) {
		if (result[baseUrl]) {
			me.pageSettings = result[baseUrl];
			result[baseUrl].forEach(function(styleName) {
				var styleRules = me.styles[styleName];
				if (styleRules)
					me.addStyleToPage(styleRules, styleName.replace(/ /g, "-"));
			});
		}
	});
}

/**
 * addStyleToPage: override the page's style by inserting the css rules with optional class name and id
 */
TurnStyle.prototype.addStyleToPage = function(styleRules, styleId, className) {
	if (styleRules) {
		var node = document.createElement("style");
		node.setAttribute("class", "turnstyle");
		if (className)
			node.classList.add(className);
		if (styleId)
			node.setAttribute("id", styleId);
		node.innerHTML = styleRules;
		document.head.appendChild(node);		
	}
}

/**
 * removeStyleFromPage: remove all styles with the specified id or class name
 *	if no arguments are passed, remove all style elements with the "turnstyle" class
 */
TurnStyle.prototype.removeStyleFromPage = function(styleId, className) {
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
 * setPageStyle: save the style for this website in chrome storage
 */
TurnStyle.prototype.setPageStyle = function(styleName) {
	var baseUrl = this.baseUrl;
	if (baseUrl !== "styles") {			// make sure we don't overwrite the styles field
		var pageEntry = {};
		this.pageSettings.push(styleName);
		pageEntry[baseUrl] = this.pageSettings;
		chrome.storage.sync.set(pageEntry);
	}
}

TurnStyle.prototype.unsetPageStyle = function(styleName) {
	var baseUrl = this.baseUrl;
	var index = this.pageSettings.indexOf(styleName);
	if (index > -1) {
		var pageEntry = {};
		this.pageSettings.splice(index, 1);
		pageEntry[baseUrl] = this.pageSettings;
		chrome.storage.sync.set(pageEntry);
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

TurnStyle.prototype.editStyle = function(styleName, styleRules) {
	var styleId = styleName.replace(/ /g, "-");
	this.removeStyleFromPage(styleId);
	this.addStyleToPage(styleRules, styleId);
	this.saveStyle(styleName, styleRules, true);
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
		chrome.storage.sync.remove(this.baseUrl);
	}

	this.removeStyleFromPage();
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
			sendResponse({
				baseUrl: me.baseUrl,
				fullUrl: me.fullUrl,
				pageSettings: me.pageSettings,
				styles: me.styles
			});
		}

		else if (request.instruction === "insertStyle") {
			var styleRules = request.styleRules ? request.styleRules : "";
			var styleId = request.styleId ? request.styleId : "";
			var className = request.className ? request.className : "";

			if (styleId === "ts-preview")
				me.removeStyleFromPage("ts-preview");

			me.addStyleToPage(styleRules, styleId, className);
		}

		else if (request.instruction === "removeStyle") {
			me.removeStyleFromPage(request.styleId, request.className);
			if (request.delete)
				me.unsetPageStyle(request.styleName);
		}

		else if (request.instruction === "saveStyle") {
			if (request.styleRules && request.styleName) {
				me.addStyleToPage(request.styleRules, request.styleName.replace(/ /g, "-"));
				me.saveStyle(request.styleName, request.styleRules);
				me.setPageStyle(request.styleName);
			}
		}

		else if (request.instruction === "editStyle") {
			me.editStyle(request.styleName, request.styleRules);
		}

		else if (request.instruction === "clear settings") {
			me.clearStorage();
		}

		else if (request.instruction === "clear all") {
			me.clearStorage(true);
		}
	});	
}


TurnStyle.prototype.initialize = function() {
	this.loadStyles();
	this.loadPageSettings();
	this.addListener();
}

var turnStyle = new TurnStyle();








