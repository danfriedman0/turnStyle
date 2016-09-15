/**
 * options.js
 *
 * scripts for the turnStyle options page
 */

TSOptions = function() {
	this.savedUrlsList = document.getElementById("saved-urls-list");
	this.savedStylesList = document.getElementById("saved-styles-list");

	this.savedUrls = {};
	this.savedStyles = {};

	this.initialize();
}

// append a list element ( <li [tabindex="0"]>item</li> ) to list
TSOptions.prototype.appendToSidebarList = function(list, item, focusable) {
	var li = document.createElement("li");
	li.innerHTML = item;
	if (focusable)
		li.setAttribute("tabindex", "0");
	list.appendChild(li);
}

TSOptions.prototype.loadSidebar = function() {
	var me = this,
		styles = this.savedStyles,
		urls = this.savedUrls,
		styleList = this.savedStylesList,
		urlList = this.savedUrlsList,
		key;

	for (key in styles) {
		if (styles.hasOwnProperty(key))
			me.appendToSidebarList(styleList, key, true);
	}

	for (key in urls) {
		if (urls.hasOwnProperty(key))
			me.appendToSidebarList(urlList, key, true);
	}
}

/**
 * Load settings from storage. Load the saved styles and saved URLs and also map each style
 * to all of the pages it's active on
 */
TSOptions.prototype.loadSettings = function(callback) {
	var me = this,
		style, styles, key, styleNames;

	chrome.storage.sync.get(null, function(storage) {
		styles = storage.styles;

		// save the styles
		for (key in styles) {
			if (styles.hasOwnProperty(key)) {
				style = {rules: styles[key], urls: []};
				me.savedStyles[key] = style;
			}
		}

		// save the URLs
		for (key in storage) {
			if (key !== "styles" && storage.hasOwnProperty(key)) {
				styleNames = storage[key];
				me.savedUrls[key] = styleNames;

				// map each style to all the pages it's active on
				styleNames.forEach(function(styleName) {
					if (me.savedStyles[styleName])
						me.savedStyles[styleName].urls.push(key);
				});
			}
		}

		if (callback)
			callback();
	});
}

TSOptions.prototype.initializePage = function() {
	this.loadSidebar();
}

TSOptions.prototype.initialize = function() {
	var me = this;
	me.loadSettings(function() {
		me.initializePage();
	});
}

var options = new TSOptions();




