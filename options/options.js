/**
 * options.js
 *
 * scripts for the turnStyle options page
 */

"use strict";

var TSOptions = function() {
	this.urlList = document.getElementById("saved-urls-list");
	this.styleList = document.getElementById("saved-styles-list");

	// editor
	this.editing = document.getElementById("editing-name");
	this.styleEditor = document.getElementById("style-editor");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");

	// URL info
	this.urlButtons = document.getElementById("url-buttons");
	this.pageStyles = document.getElementById("page-styles");
	this.pageStyleList = document.getElementById("page-style-list");
	this.pageStyleTemplate = document.getElementsByClassName("page-style template")[0];
	this.styleSelector = document.getElementById("style-selector");
	this.styleDropDown = document.getElementById("style-dropdown");

	// style info
	this.styleButtons = document.getElementById("style-buttons");
	this.styleUrls = document.getElementById("style-urls");
	this.styleUrlList = document.getElementById("style-url-list");
	this.styleUrlTemplate = document.getElementsByClassName("style-url template")[0];
	this.urlSelector = document.getElementById("url-selector");
	this.urlDropDown = document.getElementById("url-dropdown");

	this.savedUrls = {};
	this.savedStyles = {};

	this.activeItem = null;
	this.activeItemNode = null;

	this.initialize();
}

/****************************************************************************************************
 ** Events  *****************************************************************************************
 ****************************************************************************************************/

TSOptions.prototype.addListeners = function() {
	var me = this;

	document.querySelector("body").addEventListener("keyup", function(e) {
		// enter key: click on the focused element (to enable keyboard navigation)
		if (e.which === 13) {
			e.preventDefault();
			document.activeElement.click();
		}
	});

	// event delegation for dynamically generated elements
	document.querySelector("body").addEventListener("click", function(e) {
		var elem = e.target;

		if (elem.classList.contains("sidebar-url")) {
			me.selectSidebarItem(elem, elem.innerHTML);
			me.loadUrl(elem.innerHTML);
		}

		else if (elem.className === "edit-style") {
			var styleName = elem.parentNode.previousElementSibling.innerHTML;
			me.openStyleEditor(styleName);
		}

	});

	document.getElementById("close-editor").addEventListener("click", function() {
		me.styleEditor.classList.add("hide");
	});
}




/****************************************************************************************************
 ** Manipulate DOM elements  ************************************************************************
 ****************************************************************************************************/

// add an option to a dropdown with the specified value and text
TSOptions.prototype.addOption = function(value, text, dropDown) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = text;

	dropDown.insertBefore(option, dropDown.firstElementChild.nextElementSibling);
}

/**
 * clone the template, insert the name, add it to the list
 * 	and remove the name from the dropdown
 * this function is used to add styles to the style list (in url mode)
 *	and also to add urls to the url list (in style mode)
 */
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

/**
 * remove the node from the active list (i.e. active styles or active sites),
 *	finds the name, and adds the name back to the dropDown
 */
TSOptions.prototype.removeFromActiveList = function(node, dropDown) {
	var name = node.getElementsByClassName("name")[0].innerHTML;
	node.parentNode.removeChild(node);
	this.addOption(name, name, dropDown);
}

// append a list element ( <li [tabindex="0"] [class="className"]>item</li> ) to list
TSOptions.prototype.appendToSidebarList = function(list, item, focusable, className) {
	var li = document.createElement("li");
	li.innerHTML = item;
	if (focusable)
		li.setAttribute("tabindex", "0");
	if (className)
		li.className = className;
	list.appendChild(li);
}

// deselect the current sidebar item and select the new one
TSOptions.prototype.selectSidebarItem = function(itemNode, item) {
	var me = this;
	if (me.activeItemNode)
		me.activeItemNode.classList.remove("selected");
	me.activeItem = item;
	me.activeItemNode = itemNode;
	itemNode.classList.add("selected");
}

/****************************************************************************************************
 ** Configure the editor ****************************************************************************
 ****************************************************************************************************/

TSOptions.prototype.clearEditorList = function(mode) {
	var me = this,
		nodes, dropDown;

	if (mode === "url") {
		nodes = document.getElementsByClassName("page-style");
		dropDown = me.styleDropDown;
	}
	else {
		nodes = document.getElementsByClassName("style-url");
		dropDown = me.urlDropDown;
	}

	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i].classList.contains("template"))
			me.removeFromActiveList(nodes[i], dropDown);
	}
}

TSOptions.prototype.openStyleEditor = function(styleName) {
	var me = this;
	var styleRules;

	me.clearErrorMessage();

	if (me.savedStyles[styleName])
		styleRules = me.savedStyles[styleName].rules;
	else
		styleName = styleRules = "";

	me.styleNameInput.value = styleName;
	me.styleRulesInput.value = styleRules;
	me.styleEditor.classList.remove("hide");
}

TSOptions.prototype.clearErrorMessage = function() {
	var error = document.getElementById("error-message");
	if (error)
		error.parentNode.removeChild(error);
}

/**
 * change the editor to "url" mode
 * load the url and all associated styles
 */
TSOptions.prototype.loadUrl = function(url) {
	var me = this,
		template, list, dropDown;

	me.clearEditorList("url");

	me.urlButtons.classList.remove("hide");
	me.pageStyles.classList.remove("hide");
	me.styleButtons.classList.add("hide");
	me.styleUrls.classList.add("hide");
	me.styleEditor.classList.add("hide");

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

/**
 * change the editor to "style" mode
 * load the style and all associated URLs
 */
TSOptions.prototype.loadStyle = function(styleName) {
	var me = this,
		styles = this.savedStyles,
		template, list, dropDown, urls;

	me.clearEditorList("style");

	me.urlButtons.classList.add("hide");
	me.pageStyles.classList.add("hide");
	me.styleButtons.classList.remove("hide");
	me.styleUrls.classList.remove("hide");
	me.styleEditor.classList.remove("hide");

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


/****************************************************************************************************
 ** Load settings onto the page *********************************************************************
 ****************************************************************************************************/

// fill the url and style dropdowns
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

// load saved styles and URLs into the sidebar
TSOptions.prototype.loadSidebar = function() {
	var me = this,
		styles = this.savedStyles,
		urls = this.savedUrls,
		styleList = this.styleList,
		urlList = this.urlList,
		key;

	for (key in styles) {
		if (styles.hasOwnProperty(key))
			me.appendToSidebarList(styleList, key, true, "sidebar-style");
	}

	for (key in urls) {
		if (urls.hasOwnProperty(key))
			me.appendToSidebarList(urlList, key, true, "sidebar-url");
	}
}

/**
 * Load settings from storage. Load the saved styles and saved URLs and also map each style
 * 	to all of the pages it's active on
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

/****************************************************************************************************
 ** Initialize **************************************************************************************
 ****************************************************************************************************/


TSOptions.prototype.initializePage = function() {
	var me = this;
	me.loadSidebar();
	me.fillDropDowns();

	var firstItem;

	if (firstItem = me.urlList.getElementsByTagName("li")[0]) {
		me.selectSidebarItem(firstItem, firstItem.innerHTML);
		me.loadUrl(firstItem.innerHTML);
	}
	else if (firstItem = me.styleList.getElementsByTagName("li")[0]) {
		me.selectSidebarItem(firstItem, firstItem.innerHTML);
		me.loadStyle(firstItem.innerHTML);
	}
	else {
		me.editing.innerHTML = "You haven't added any styles yet";
	}

	me.addListeners();
}

TSOptions.prototype.initialize = function() {
	var me = this;
	me.loadSettings(function() {
		me.initializePage();
	});
}

var options = new TSOptions();




