/**
 * options.js
 *
 * scripts for the turnStyle options page
 */

TSOptions = function() {
	this.urlList = document.getElementById("saved-urls-list");
	this.styleList = document.getElementById("saved-styles-list");
	this.editing = document.getElementById("editing-name");
	this.urlButtons = document.getElementById("url-buttons");
	this.pageStyles = document.getElementById("page-styles");
	this.pageStyleList = document.getElementById("page-style-list");
	this.pageStyleTemplate = document.getElementsByClassName("page-style template")[0];
	this.styleSelector = document.getElementById("style-selector");
	this.styleDropDown = document.getElementById("style-dropdown");

	this.styleButtons = document.getElementById("style-buttons");
	this.styleUrls = document.getElementById("style-urls");
	this.styleUrlList = document.getElementById("style-url-list");
	this.styleUrlTemplate = document.getElementsByClassName("style-url template")[0];
	this.urlSelector = document.getElementById("url-selector");
	this.urlDropDown = document.getElementById("url-dropdown");

	this.savedUrls = {};
	this.savedStyles = {};

	this.initialize();
}

TSOptions.prototype.loadEditor = function(mode, name) {
	var me = this;

	me.editing.innerHTML = name;
}

TSOptions.prototype.addToList = function(name, template, list, dropDown) {
	var me = this;

	var node = template.cloneNode(true);
	node.classList.remove("template");
	node.getElementsByClassName("name")[0].innerHTML = name;
	list.insertBefore(node, template);

	// remove name from dropdown
	var option = dropDown.querySelector("option[value='" + name + "']");
	if (option)
		option.parentNode.removeChild(option);
}

TSOptions.prototype.loadUrl = function(url) {
	var me = this,
		template, list, dropDown;

	me.urlButtons.classList.remove("hide");
	me.pageStyles.classList.remove("hide");
	me.styleButtons.classList.add("hide");
	me.styleUrls.classList.add("hide");

	if (url) {
		me.editing.innerHTML = "<a href='" + url + "' + target='_blank'>" + url + "</a>";
		template = me.pageStyleTemplate;
		list = me.pageStyleList;
		dropDown = me.styleDropDown;
		me.savedUrls[url].forEach(function(styleName) {
			me.addToList(styleName, template, list, dropDown);
		});
	}
}

TSOptions.prototype.loadStyle = function(styleName) {
	var me = this,
		styles = this.savedStyles,
		template, list, dropDown, urls;

	me.urlButtons.classList.add("hide");
	me.pageStyles.classList.add("hide");
	me.styleButtons.classList.remove("hide");
	me.styleUrls.classList.remove("hide");

	if (styleName && styles[styleName] && styles[styleName].urls) {
		me.editing.innerHTML = styleName;
		template = me.styleUrlTemplate;
		list = me.styleUrlList;
		dropDown = me.urlDropDown;

		styles[styleName].urls.forEach(function(url) {
			me.addToList(url, template, list, dropDown);
		});
	}
}

TSOptions.prototype.addOption = function(value, text, dropDown) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = text;

	dropDown.insertBefore(option, dropDown.firstElementChild.nextElementSibling);
}

TSOptions.prototype.fillDropDowns = function() {
	var me = this,
		styles = this.savedStyles,
		urls = this.savedUrls,
		styleDropDown = this.styleDropDown,
		urlDropDown = this.urlDropDown,
		key;

	for (key in styles) {
		if (styles.hasOwnProperty(key)) {
			me.addOption(key, key, styleDropDown);
		}
	}

	for (key in urls) {
		if (urls.hasOwnProperty(key)) {
			me.addOption(key, key, urlDropDown);
		}
	}
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
		styleList = this.styleList,
		urlList = this.urlList,
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
	var me = this;
	me.loadSidebar();
	me.fillDropDowns();

	var firstItem = me.urlList.getElementsByTagName("li")[0];

	if (firstItem) {
		firstItem.classList.add("selected");
		me.loadUrl(firstItem.innerHTML);
	}
	else {
		me.editing.innerHTML = "You haven't added any styles yet";
	}
}

TSOptions.prototype.initialize = function() {
	var me = this;
	me.loadSettings(function() {
		me.initializePage();
	});
}

var options = new TSOptions();




