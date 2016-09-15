/**
 * options.js
 *
 * scripts for the turnStyle options page
 */

TSOptions = function() {
	this.savedUrls = {};
	this.savedStyles = {};

	this.initialize();
}

/**
 * Load settings from storage. Load the saved styles and saved URLs and also map each style
 * to all of the pages it's active on
 */
TSOptions.prototype.loadSettings = function() {
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
	});
}

TSOptions.prototype.initialize = function() {
	this.loadSettings();
}

var options = new TSOptions();




