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
	this.savedStyles = {};			// this styles object maps all the styles to their active URLs
	this.storageStyles = {};		// this is the styles object to put in storage

	this.activeItem = null;			// selected style or url
	this.activeItemNode = null;		// sidebar node for the selected style or url
	this.editMode = null;			// "style" or "url"

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

		else if (elem.classList.contains("sidebar-style")) {
			me.selectSidebarItem(elem, elem.innerHTML);
			me.loadStyle(elem.innerHTML);
		}

		else if (elem.className === "edit-style") {
			var styleName = elem.parentNode.previousElementSibling.innerHTML;
			me.openStyleEditor(styleName);
		}

		else if (elem.className === "remove-style") {
			me.removeStyleFromUrl(elem, me.activeItem);
		}

	});

	document.getElementById("close-editor").addEventListener("click", function() {
		me.styleEditor.classList.add("hide");
	});

	document.getElementById("style-dropdown").addEventListener("change", function() {
		var styleName = this.value;
		if (styleName)
			me.openStyleEditor(styleName);
	});

	document.getElementById("append-importants").addEventListener("click", function() {
		me.appendImportants();
	});

	document.getElementById("save-style").addEventListener("click", function() {
		if (me.editMode === "url")	
			me.saveUrlStyle();
	});

	document.getElementById("delete-url").addEventListener("click", function() {
		var url = me.activeItem;
		me.deleteUrl(url);
	});
}


/****************************************************************************************************
 ** Handle user input  ******************************************************************************
 ****************************************************************************************************/

// based on code from StackOverflow (http://stackoverflow.com/a/6234804)
TSOptions.prototype.escapeHtml = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

// append an error message to the specified node
TSOptions.prototype.appendError = function(errorMessage, node) {
	// only show one error message at a time
	this.clearErrorMessage();

	var error = document.createElement("div");
	error.id = "error-message";
	error.innerHTML = errorMessage;
	node.parentNode.insertBefore(error, node.nextElementSibling);
}

/****************************************************************************************************
 ** Save changes  ***********************************************************************************
 ****************************************************************************************************/

TSOptions.prototype.saveStyle = function(name, rules) {
	var me = this;
	me.storageStyles[name] = rules;
	chrome.storage.sync.set({"styles": me.storageStyles});
}

TSOptions.prototype.saveUrlStyle = function() {
	var me = this,
		styleName = me.escapeHtml(me.styleNameInput.value),
		styleRules = me.escapeHtml(me.styleRulesInput.value),
		url = me.activeItem,
		pageStyles = me.savedUrls[url],
		entry = {};

	if (!styleName) {
		me.appendError("You should give your style a name", me.styleNameInput);
	}
	else if (!styleRules) {
		me.appendError("You should add some rules", me.styleRulesInput);
	}

	// the style has already been added to this page
	else if (pageStyles.indexOf(styleName) > -1) {
		me.saveStyle(styleName, styleRules);
		me.savedStyles[styleName].rules = styleRules;
		me.styleEditor.classList.add("hide");
	}

	else {
		me.saveStyle(styleName, styleRules);
		me.addToList(styleName, me.pageStyleTemplate, me.pageStyleList, me.styleDropDown);
		if (me.savedStyles[styleName])
			me.savedStyles[styleName].urls.push(url);
		
		pageStyles.push(styleName);
		entry[url] = pageStyles;
		chrome.storage.sync.set(entry);
		
		me.styleEditor.classList.add("hide");
	}
}

TSOptions.prototype.deleteUrl = function(url) {
	var me = this,
		nodes, option, styles, key, index, i;

	// remove from sidebar
	nodes = document.getElementsByClassName("sidebar-url");
	for (i = 0; i < nodes.length; i++) {
		if (nodes[i].innerHTML === "url") {
			me.urlList.removeChild(nodes[i]);
			break;
		}
	}

	// remove from dropdown
	option = me.urlDropDown.querySelector("option[value='" + url + "']");
	if (option)
		option.parentNode.removeChild(option);

	// go through the saved styles and remove all references to this URL
	styles = me.savedStyles;
	for (key in styles) {
		if (styles.hasOwnProperty(key)) {
			index = styles[key].urls.indexOf(url);
			if (index > -1)
				styles[key].urls.splice(index, 1);
		}
	}

	// load something else
	me.loadASetting();

	// delete
	chrome.storage.sync.remove(url);
}

TSOptions.prototype.removeStyleFromUrl = function(node, url) {
	var me = this,
		entry = {},
		index, style, styleName;

	// update DOM
	styleName = node.parentNode.previousElementSibling.innerHTML;

	me.pageStyleList.removeChild(node.parentNode.parentNode);	// this is not ideal...
	me.addOption(styleName, styleName, me.styleDropDown);

	// update URL settings
	index = me.savedUrls[url].indexOf(styleName);
	me.savedUrls[url].splice(index, 1);
	entry[url] = me.savedUrls[url];
	chrome.storage.sync.set(entry);

	// update style settings
	style = me.savedStyles[styleName];
	index = style.urls.indexOf(url);
	style.urls.splice(index, 1);
}


/****************************************************************************************************
 ** Manipulate DOM **********************************************************************************
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

	//console.log(name, template, list, dropDown);

	var node = template.cloneNode(true);

	node.classList.remove("template");
	node.getElementsByClassName("name")[0].innerHTML = name;
	list.insertBefore(node, template);

	// remove name from dropdown
	var option = dropDown.querySelector("option[value='" + name + "']");
	if (option)
		option.parentNode.removeChild(option);
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

// add "!important" to the end of every rule that doesn't already it "!important"
TSOptions.prototype.appendImportants = function() {
	var me = this;
	var styleRules = me.escapeHtml(me.styleRulesInput.value);
	var lines = [];

	if (styleRules) {
		styleRules = styleRules.replace(/ !important/g, "");	// get rid of any previous !importants
		lines = styleRules.split(";");
		styleRules = lines.join(" !important;");
		me.styleRulesInput.value = styleRules;
	}
}

// clear the list of active styles or active pages (depending on the mode)
TSOptions.prototype.clearActiveList = function(mode) {
	var me = this,
		nodes, dropDown, list, name;

	if (mode === "url") {
		nodes = document.getElementsByClassName("page-style");
		list = me.pageStyleList;
		dropDown = me.styleDropDown;
	}
	else {
		nodes = document.getElementsByClassName("style-url");
		list = me.styleUrlList;
		dropDown = me.urlDropDown;
	}

	for (var i = nodes.length - 2; i >= 0; i--) {		// subtract 2 to skip the template node
		name = nodes[i].getElementsByClassName("name")[0].innerHTML
		list.removeChild(nodes[i]);
		me.addOption(name, name, dropDown);			
	}
}

// load the styleName and the associated styleRules into the style editor
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

	me.editMode = "url";
	me.clearActiveList("url");

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

	me.editMode = "style";
	me.clearActiveList("style");

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

	me.openStyleEditor(styleName);
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
		me.storageStyles = styles;

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

TSOptions.prototype.loadASetting = function() {
	var me = this;

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
		me.editing.innerHTML = "You have nothing saved";
	}
}

/****************************************************************************************************
 ** Initialize **************************************************************************************
 ****************************************************************************************************/


TSOptions.prototype.initializePage = function() {
	var me = this;
	me.loadSidebar();
	me.fillDropDowns();
	me.loadASetting();

	me.addListeners();
}

TSOptions.prototype.initialize = function() {
	var me = this;
	me.loadSettings(function() {
		me.initializePage();
	});
}

var options = new TSOptions();




