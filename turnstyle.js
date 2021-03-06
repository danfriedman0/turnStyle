/**
 * turnstyle.js
 *
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 */

var TurnStyle = function() {
	this.baseUrl = location.origin;
	this.fullUrl = location.href;

	this.activeUrl = "";
	this.pageStyles = [];
	this.styles = {};

	this.initialize();
}

/****************************************************************************************************
 ** Add or remove styles from the page **************************************************************
 ****************************************************************************************************/

// override the page's style by inserting the css rules with optional class name and id
TurnStyle.prototype.addStyleToPage = function(styleRules, styleId, className) {
	var node;
	if (styleRules) {
		if (styleRules.startsWith("script")) {
			node = document.createElement("script");
			styleRules = styleRules.slice(7);
		}
		else {
			node = document.createElement("style");
		}
		node.setAttribute("class", "turnstyle");
		if (className)
			node.classList.add(className);
		if (styleId)
			node.setAttribute("id", styleId);
		node.innerHTML = styleRules;
		document.head.appendChild(node);		
	}
}

// remove all styles with the specified id or class name
// if no arguments are passed, remove all style elements with the "turnstyle" class
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

// remove the style with the specified id from page and replace it with an updated version
TurnStyle.prototype.editStyle = function(styleName, styleRules) {
	var styleId = styleName.replace(/ /g, "-");
	this.removeStyleFromPage(styleId);
	this.addStyleToPage(styleRules, styleId);
	this.saveStyle(styleName, styleRules, true);
}

/****************************************************************************************************
 ** Save settings in storage ************************************************************************
 ****************************************************************************************************/

// add the style to the active URL's list of saved styles
TurnStyle.prototype.setPageStyle = function(styleName) {
	var activeUrl = this.activeUrl;
	if (activeUrl !== "styles") {			// make sure we don't overwrite the styles field
		var pageEntry = {};
		this.pageStyles.push(styleName);
		pageEntry[activeUrl] = this.pageStyles;
		chrome.storage.sync.set(pageEntry);
	}
}

// remove the style from the active URL's list of saved styles
TurnStyle.prototype.unsetPageStyle = function(styleName) {
	var activeUrl = this.activeUrl;
	var index = this.pageStyles.indexOf(styleName);
	if (index > -1) {
		var pageEntry = {};
		this.pageStyles.splice(index, 1);
		pageEntry[activeUrl] = this.pageStyles;
		chrome.storage.sync.set(pageEntry);
	}
}	

// save the style in the styles object in storage
// overwrite the existing style if overwrite is set to true
TurnStyle.prototype.saveStyle = function(styleName, styleRules, overWrite) {
	var styles = this.styles;
	if (overWrite || !styles[styleName]) {
		styles[styleName] = styleRules;
		chrome.storage.sync.set({"styles": styles});
	}
}

/****************************************************************************************************
 ** Manage storage (for development) ****************************************************************
 ****************************************************************************************************/

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

/****************************************************************************************************
 ** Messaging ***************************************************************************************
 ****************************************************************************************************/

// listen for messages from popup.js
TurnStyle.prototype.addListener = function() {
	var me = this;

	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.instruction === "getPageSettings") {
			sendResponse({
				baseUrl: me.baseUrl,
				fullUrl: me.fullUrl,
				activeUrl: me.activeUrl,
				pageStyles: me.pageStyles,
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
			if (request.activeUrl && request.activeUrl !== me.activeUrl)
				me.activeUrl = request.activeUrl;
			if (request.delete)
				me.unsetPageStyle(request.styleName);
		}

		else if (request.instruction === "saveStyle") {
			if (request.styleRules && request.styleName) {
				if (request.activeUrl && request.activeUrl !== me.activeUrl)
					me.activeUrl = request.activeUrl;
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

/****************************************************************************************************
 ** Initialize **************************************************************************************
 ****************************************************************************************************/

// load all saved styles into the styles object
TurnStyle.prototype.loadSettings = function() {
	var me = this,
		fullUrl = this.fullUrl,
		matches = [],
		re, styleRules, pageStyles;

	chrome.storage.sync.get(null, function(storage) {

		// record all of the urls that match this page's url in some way
		for (var key in storage) {
			if (storage.hasOwnProperty(key)) {
				if (key === "styles") {
					me.styles = storage.styles;
				}
				else {
					re = new RegExp("^" + key);
					if (fullUrl.match(re))
						matches.push(key);					
				}
			}
		}

		// if any of the url's match, use the longest one (i.e., the closest match) as the
		// active url
		if (matches) {
			me.activeUrl = matches.sort()[matches.length-1];
			pageStyles = storage[me.activeUrl];
			if (pageStyles) {
				me.pageStyles = pageStyles;
				pageStyles.forEach(function(styleName) {
					styleRules = me.styles[styleName];
					if (styleRules)
						me.addStyleToPage(styleRules, styleName.replace(/ /g, "-"));
				});				
			}
		}
	});
}

TurnStyle.prototype.initialize = function() {
	this.loadSettings();
	this.addListener();
}

var turnStyle = new TurnStyle();








