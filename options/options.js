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
	this.editingInput = document.getElementById("editing-name-input");
	this.styleEditor = document.getElementById("style-editor");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");
	this.newUrl = document.getElementById("new-url");
	this.newUrlInput = document.getElementById("new-url-input");
	this.tabModeInput = document.getElementById("tab-mode");

	// URL info
	this.urlButtons = document.getElementById("url-buttons");
	this.editUrlButton = document.getElementById("edit-url");
	this.saveUrlButton = document.getElementById("save-url");
	this.pageStyles = document.getElementById("page-styles");
	this.pageStyleList = document.getElementById("page-style-list");
	this.pageStyleTemplate = document.getElementsByClassName("page-style template")[0];
	this.styleSelector = document.getElementById("style-selector");
	this.styleDropdown = document.getElementById("style-dropdown");

	// style info
	this.styleButtons = document.getElementById("style-buttons");
	this.renameStyleButton = document.getElementById("rename-style");
	this.saveStyleNameButton = document.getElementById("save-style-name");
	this.styleUrls = document.getElementById("style-urls");
	this.styleUrlList = document.getElementById("style-url-list");
	this.styleUrlTemplate = document.getElementsByClassName("style-url template")[0];
	this.urlSelector = document.getElementById("url-selector");
	this.urlDropdown = document.getElementById("url-dropdown");

	// popup
	this.popup = document.getElementById("popup-wrapper");
	this.popupMessage = document.getElementById("popup-message");
	this.popupButtons = document.getElementById("popup-buttons");
	this.closePopup = document.getElementById("close-popup");
	this.popupInput = document.getElementById("popup-input");


	this.savedUrls = {};
	this.savedStyles = {};			// this styles object maps all the styles to their active URLs
	this.storageStyles = {};		// this is the styles object to put in storage

	this.activeItem = null;			// selected style or url
	this.activeItemNode = null;		// sidebar node for the selected style or url
	this.editMode = null;			// "style" or "url"

	this.tabMode = this.tabModeInput.checked;

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
			me.removeStyleFromUrl(elem);
		}

		else if (elem.className === "remove-url") {
			me.removeStyleFromUrl(elem);
		}

	});

	me.styleDropdown.addEventListener("change", function() {
		var styleName = this.value;
		if (styleName) {
			me.openStyleEditor(styleName);
		}
	});

	me.tabModeInput.addEventListener("click", function() {
		me.tabMode = !me.tabMode;
	});

	// copied from Stack Overflow: http://stackoverflow.com/a/18303822
	me.styleRulesInput.addEventListener("keydown", function(e) {
		if (e.which === 9 && me.tabMode) {
			var start = this.selectionStart;
			var end = this.selectionEnd;
			var target = e.target;
			var value = target.value;

			target.value = value.substring(0, start) + "\t" + value.substring(end);
			this.selectionStart = this.selectionEnd = start + 1;
			e.preventDefault();
		}
	})

	me.editUrlButton.addEventListener("click", function() {
		me.editUrl();
	});

	me.saveUrlButton.addEventListener("click", function() {
		me.saveUrl();
	});

	me.renameStyleButton.addEventListener("click", function() {
		me.renameStyle();
	});

	me.saveStyleNameButton.addEventListener("click", function() {
		me.saveStyleName();
	});

	document.getElementById("close-editor").addEventListener("click", function() {
		me.styleEditor.classList.add("hide");
	});

	document.getElementById("append-importants").addEventListener("click", function() {
		me.appendImportants();
	});

	document.getElementById("save-style").addEventListener("click", function() {
		var styleName = me.escapeHtml(me.styleNameInput.value),
			styleRules = me.escapeHtml(me.styleRulesInput.value);

		me.clearErrorMessage();

		if (!styleName) {
			me.appendError("You should give your style a name", me.styleNameInput);
		}
		else if (!styleRules) {
			me.appendError("You should add some rules", me.styleRulesInput);
		}
		else if (me.editMode === "url") {
			me.saveUrlStyle(styleName, styleRules);
			me.styleDropdown.value = "";
			me.openPopup("Saved style", "alert");
		}
		else {
			me.saveStyle(styleName, styleRules);
			me.savedStyles[styleName].rules = styleRules;
			me.openPopup("Saved style", "alert");
		}

	});

	document.getElementById("delete-url").addEventListener("click", function() {
		var url = me.activeItem,
			message = "Are you sure you want to delete your settings for " + url + "?";

		me.openPopup(message, "confirm", function(reply) {
			if (reply)
				me.deleteUrl(url, true);
		});
	});

	document.getElementById("delete-style").addEventListener("click", function() {
		var styleName = me.activeItem,
			message = "Are you sure you want to delete " + styleName + "?";

		me.openPopup(message, "confirm", function(reply) {
			if (reply)
				me.deleteStyle(styleName, true);
		});
	});

	me.urlDropdown.addEventListener("change", function() {
		var url = this.value;
		if (url === "new-url") {
			me.clearErrorMessage();
			me.newUrl.classList.remove("hide");
			me.newUrlInput.focus();
		}
		else if (url) {
			me.addUrlToStyle(url);
			this.value = "";
			me.newUrl.classList.add("hide");
		}
		else {
			me.newUrl.classList.add("hide");
		}	
	});

	document.getElementById("add-new-url").addEventListener("click", function() {
		var url = me.newUrlInput.value;
		if (!me.validateUrl(url)) {
			me.appendError("Invalid URL (make sure to add 'http://')", me.newUrl);
		}
		else {
			me.clearErrorMessage();
			me.addUrlToStyle(url);
			me.newUrlInput = "";
			me.urlDropdown = "";
			me.newUrl.classList.add("hide");
		}
	});

	document.getElementById("cancel-new-url").addEventListener("click", function() {
		me.newUrl.classList.add("hide");
		me.urlDropdown.value = "";
	});

	document.getElementById("new-style").addEventListener("click", function() {
		me.openPopup("Enter a name:", "prompt-style", function(response) {
			if (response) {
				me.addNewStyle(response, "", true);
				me.selectSidebarItem(me.styleList.childNodes.item(1), response)
				me.loadStyle(response);
			}
		});
	});

	document.getElementById("new-site").addEventListener("click", function() {
		me.openPopup("Enter a url:", "prompt-url", function(response) {
			if (response) {
				me.addNewUrl(response, [], true, me.activeItemNode);
				me.selectSidebarItem(me.urlList.childNodes.item(1), response);
				me.loadUrl(response);
			}
		});
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

TSOptions.prototype.validateUrl = function(url) {
	// Copyright (c) 2010-2013 Diego Perini, MIT licensed
	// https://gist.github.com/dperini/729294
    // see also https://mathiasbynens.be/demo/url-regex
	return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(url);
}

TSOptions.prototype.validateStyleName = function(styleName) {
	var me = this;
	if (me.savedStyles[styleName])
		return false;
	else
		return true;
}

/****************************************************************************************************
 ** Messaging  **************************************************************************************
 ****************************************************************************************************/

TSOptions.prototype.openPopup = function(message, mode, callback) {
	var me = this,
		clone, cancelPopup, confirmPopup, input;

	me.clearErrorMessage();

	// clone the buttons to clear event listeners
	clone = me.closePopup.cloneNode(true);
	me.closePopup.parentNode.replaceChild(clone, me.closePopup);
	me.closePopup = clone;
	clone = me.popupButtons.cloneNode(true);
	me.popupButtons.parentNode.replaceChild(clone, me.popupButtons);
	me.popupButtons = clone;

	me.popupMessage.innerHTML = message;

	if (mode === "prompt-style" || mode === "prompt-url")
		me.popupInput.classList.remove("hide")
	else
		me.popupInput.classList.add("hide");

	// bind new events
	me.closePopup.addEventListener("click", function() {
		me.popup.classList.add("hide");
		if (mode === "confirm")
			callback(false);
	});

	cancelPopup = document.getElementById("cancel-popup");

	if (mode === "alert") {
		cancelPopup.classList.add("hide");
	}
	else {
		cancelPopup.classList.remove("hide");
		cancelPopup.addEventListener("click", function() {
			me.popup.classList.add("hide");
			callback(false);
		});
	}



	confirmPopup = document.getElementById("confirm-popup");
	confirmPopup.addEventListener("click", function() {

		if (mode === "confirm") {
			me.popup.classList.add("hide");
			callback(true);		
		}
		else if (mode === "prompt-style" || mode === "prompt-url") {
			me.clearErrorMessage();
			input = me.escapeHtml(me.popupInput.value);
			if (!input) {
				me.appendError("You have to enter something", me.popupInput);
			}
			else if (mode === "prompt-url" && !me.validateUrl(input)) {
				me.appendError("Invalid URL (make sure to begin with 'http://')", me.popupInput);
			}
			else if (mode === "prompt-style" && !me.validateStyleName(input)) {
				me.appendError("That style already exists", me.popupInput);
			}
			else {
				me.popup.classList.add("hide");
				callback(input);
			}
		}
		else {
			me.popup.classList.add("hide");
		}
	});

	me.popup.classList.remove("hide");
	confirmPopup.focus();
}


/****************************************************************************************************
 ** Save changes  ***********************************************************************************
 ****************************************************************************************************/

/** Style changes ***********************************************************************************/

TSOptions.prototype.saveStyle = function(name, rules) {
	var me = this;
	me.storageStyles[name] = rules;
	chrome.storage.sync.set({"styles": me.storageStyles});
}

TSOptions.prototype.addNewStyle = function(name, rules, addToDropdown, targetNode) {
	var me = this;

	me.savedStyles[name] = {
		urls: [],
		rules: rules
	};

	me.appendToSidebarList(me.styleList, name, true, "sidebar-style", targetNode);

	if (addToDropdown)
		me.addOption(name, name, me.styleDropdown);

	me.saveStyle(name, rules);
}

TSOptions.prototype.deleteStyle = function(styleName, reload) {
	var me = this,
		entry = {},
		nodes, option, urls, key, index, i;


	// remove from sidebar
	nodes = document.getElementsByClassName("sidebar-style");
	for (i = 0; i < nodes.length; i++) {
		if (nodes[i].innerHTML === styleName) {
			me.styleList.removeChild(nodes[i]);
			break;
		}
	}

	// remove from dropdown
	option = me.styleDropdown.querySelector("option[value='" + styleName + "']");
	if (option)
		option.parentNode.removeChild(option);

	// go through the saved URLs and remove all references to this style
	urls = me.savedUrls;
	for (key in urls) {
		if (urls.hasOwnProperty(key)) {
			index = urls[key].indexOf(styleName);
			if (index > -1) {
				urls[key].splice(index, 1);
				entry[key] = urls[key];
			}
		}
	}

	// load something else
	if (reload)
		me.loadASetting("style");

	delete me.savedStyles[styleName];
	delete me.storageStyles[styleName];
	entry["styles"] = me.storageStyles;

	// save all the new settings
	chrome.storage.sync.set(entry);
}

TSOptions.prototype.renameStyle = function() {
	var me = this;

	me.editing.classList.add("hide");
	me.editingInput.value = me.activeItem;
	me.editingInput.classList.remove("hide");
	me.editingInput.focus();
	me.renameStyleButton.disabled = true;
	me.saveStyleNameButton.disabled = false;
}

TSOptions.prototype.saveStyleName = function() {
	var me = this,
		activeUrls = [],
		oldStyle = me.activeItem,
		styleName = me.escapeHtml(me.editingInput.value),
		styleRules, index, urls, key;

	if (styleName !== me.activeItem) {
		styleRules = me.savedStyles[me.activeItem].rules;
		me.addNewStyle(styleName, styleRules, true, me.activeItemNode);

		// go through all the saved urls to swap in the replacement
		urls = me.savedUrls;
		for (key in urls) {
			if (urls.hasOwnProperty(key) && urls[key].indexOf(oldStyle) > -1) {
				urls[key].push(styleName);
				activeUrls.push(key);
			}
		}
		me.savedStyles[styleName].urls = activeUrls;

		index = Array.prototype.indexOf.call(me.styleList.childNodes, me.activeItemNode) - 1;
		me.deleteStyle(me.activeItem, false);
		me.selectSidebarItem(me.styleList.childNodes.item(index), styleName);
	}

	me.editing.innerHTML = styleName;
	me.editing.classList.remove("hide");
	me.editingInput.classList.add("hide");
	me.saveStyleNameButton.disabled = true;
	me.renameStyleButton.disabled = false;	
}


TSOptions.prototype.addUrlToStyle = function(url) {
	var me = this,
		style = me.activeItem,
		entry = {};

	me.addToList(url, me.styleUrlTemplate, me.styleUrlList, me.urlDropdown);

	if (!me.savedUrls[url]) {
		me.addNewUrl(url, [style], true);
	}
	else {
		me.savedUrls[url].push(style);
		entry[url] = me.savedUrls[url];
		chrome.storage.sync.set(entry);
	}

	me.savedStyles[style].urls.push(url);
}


/** URL changes *************************************************************************************/


TSOptions.prototype.addNewUrl = function(url, styles, addToDropdown, targetNode) {
	var me = this,
		entry = {};

	me.savedUrls[url] = styles;
	me.appendToSidebarList(me.urlList, url, true, "sidebar-url", targetNode);

	if (addToDropdown)
		me.addOption(url, url, me.urlDropdown);

	styles.forEach(function(style) {
		me.savedStyles[style].urls.push(url);
	});

	entry[url] = styles;
	chrome.storage.sync.set(entry);
}

TSOptions.prototype.saveUrlStyle = function(styleName, styleRules) {
	var me = this,
		url = me.activeItem,
		pageStyles = me.savedUrls[url],
		entry = {};

	// the style has already been added to this page
	if (pageStyles.indexOf(styleName) > -1) {
		me.saveStyle(styleName, styleRules);
		me.savedStyles[styleName].rules = styleRules;
		me.styleEditor.classList.add("hide");
	}

	else {
		me.saveStyle(styleName, styleRules);
		me.addToList(styleName, me.pageStyleTemplate, me.pageStyleList, me.styleDropdown);
		
		// save the style if it's new
		if (!me.savedStyles[styleName])
			me.addNewStyle(styleName, styleRules);
		
		me.savedStyles[styleName].urls.push(url);
		
		pageStyles.push(styleName);
		entry[url] = pageStyles;
		chrome.storage.sync.set(entry);
		
		me.styleEditor.classList.add("hide");
	}
}

TSOptions.prototype.deleteUrl = function(url, reload) {
	var me = this,
		nodes, option, styles, key, index, i;

	// remove from sidebar
	nodes = document.getElementsByClassName("sidebar-url");
	for (i = 0; i < nodes.length; i++) {
		if (nodes[i].innerHTML === url) {
			me.urlList.removeChild(nodes[i]);
			break;
		}
	}

	// remove from dropdown
	option = me.urlDropdown.querySelector("option[value='" + url + "']");
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
	if (reload)
		me.loadASetting("url");

	// delete
	chrome.storage.sync.remove(url);
}

TSOptions.prototype.removeStyleFromUrl = function(node) {
	var me = this,
		entry = {},
		index, style, styleName, parent, url, list, dropdown, option;

	if (me.editMode === "url") {
		list = me.pageStyleList;
		dropdown = me.styleDropdown;
		styleName = node.parentNode.previousElementSibling.innerHTML;
		url = me.activeItem;
		option = styleName;
		parent = node.parentNode.parentNode;	// this is not ideal...
	}
	else {
		list = me.styleUrlList;
		dropdown = me.styleDropdown;
		url = node.previousElementSibling.innerHTML;
		styleName = me.activeItem;
		option = url;
		parent = node.parentNode;
	}

	list.removeChild(parent);
	me.addOption(option, option, dropdown);

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

TSOptions.prototype.editUrl = function() {
	var me = this;

	me.editing.classList.add("hide");
	me.editingInput.value = me.activeItem;
	me.editingInput.classList.remove("hide");
	me.editingInput.focus();
	me.saveUrlButton.disabled = false;
	me.editUrlButton.disabled = true;
}

TSOptions.prototype.saveUrl = function() {
	var me = this,
		newUrl = me.editingInput.value,
		styles, index;

	if (!me.validateUrl(newUrl)) {
		me.appendError("That's not a valid URL", me.editingInput);
	}
	else {
		//if the URL has changed, we just delete the old one and add the new one in its place
		if (newUrl !== me.activeItem) {
			styles = me.savedUrls[me.activeItem];
			me.addNewUrl(newUrl, styles, true, me.activeItemNode);
			index = Array.prototype.indexOf.call(me.urlList.childNodes, me.activeItemNode) - 1;
			me.deleteUrl(me.activeItem, false);
			me.selectSidebarItem(me.urlList.childNodes.item(index), newUrl);
		}

		me.clearErrorMessage();
		me.editing.innerHTML = "<a href='" + newUrl + "' target='_blank'>" + newUrl + "</a>";
		me.editing.classList.remove("hide");
		me.editingInput.classList.add("hide");
		me.saveUrlButton.disabled = true;
		me.editUrlButton.disabled = false;	
	}
}


/****************************************************************************************************
 ** Manipulate DOM **********************************************************************************
 ****************************************************************************************************/

// add an option to a dropdown with the specified value and text
TSOptions.prototype.addOption = function(value, text, dropdown) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = text;

	dropdown.insertBefore(option, dropdown.firstElementChild.nextElementSibling);
}

/**
 * clone the template, insert the name, add it to the list
 * 	and remove the name from the dropdown
 * this function is used to add styles to the style list (in url mode)
 *	and also to add urls to the url list (in style mode)
 */
TSOptions.prototype.addToList = function(name, template, list, dropdown) {
	var me = this;
	var node = template.cloneNode(true);

	node.classList.remove("template");
	node.getElementsByClassName("name")[0].innerHTML = name;
	list.insertBefore(node, template);

	// remove name from dropdown
	var option = dropdown.querySelector("option[value='" + name + "']");
	if (option)
		option.parentNode.removeChild(option);
}

// append a list element ( <li [tabindex="0"] [class="className"]>item</li> ) to list
TSOptions.prototype.appendToSidebarList = function(list, item, focusable, className, targetNode) {
	var li = document.createElement("li");
	li.innerHTML = item;
	if (focusable)
		li.setAttribute("tabindex", "0");
	if (className)
		li.className = className;

	if (targetNode)
		list.insertBefore(li, targetNode);
	else
		list.appendChild(li);
}

// deselect the current sidebar item and select the new one
TSOptions.prototype.selectSidebarItem = function(itemNode, item) {
	var me = this;
	if (me.activeItemNode)
		me.activeItemNode.classList.remove("selected");
	if (item)
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
		nodes, dropdown, list, name;

	if (mode === "url") {
		nodes = document.getElementsByClassName("page-style");
		list = me.pageStyleList;
		dropdown = me.styleDropdown;
	}
	else {
		nodes = document.getElementsByClassName("style-url");
		list = me.styleUrlList;
		dropdown = me.urlDropdown;
	}

	for (var i = nodes.length - 2; i >= 0; i--) {		// subtract 2 to skip the template node
		name = nodes[i].getElementsByClassName("name")[0].innerHTML
		list.removeChild(nodes[i]);
		me.addOption(name, name, dropdown);			
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
		template, list, dropdown;

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
		dropdown = me.styleDropdown;
		me.savedUrls[url].forEach(function(styleName) {
			me.addToList(styleName, template, list, dropdown);
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
		template, list, dropdown, urls;

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
		dropdown = me.urlDropdown;

		styles[styleName].urls.forEach(function(url) {
			me.addToList(url, template, list, dropdown);
		});
	}

	me.openStyleEditor(styleName);
}


/****************************************************************************************************
 ** Load settings onto the page *********************************************************************
 ****************************************************************************************************/

// fill the url and style dropdowns
TSOptions.prototype.fillDropdowns = function() {
	var me = this,
		styles = this.savedStyles,
		urls = this.savedUrls,
		styleDropdown = this.styleDropdown,
		urlDropdown = this.urlDropdown,
		key;

	for (key in styles) {
		if (styles.hasOwnProperty(key)) {
			me.addOption(key, key, styleDropdown);
		}
	}

	for (key in urls) {
		if (urls.hasOwnProperty(key)) {
			me.addOption(key, key, urlDropdown);
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

TSOptions.prototype.loadASetting = function(type) {
	var me = this,
		firstUrl = me.urlList.getElementsByTagName("li")[0],
		firstStyle = me.styleList.getElementsByTagName("li")[0];

	if (firstUrl && (type === "url" || !type || !firstStyle)) {
		me.selectSidebarItem(firstUrl, firstUrl.innerHTML);
		me.loadUrl(firstUrl.innerHTML);		
	}
	else if (firstStyle && (type === "style" || !type || !firstUrl)) {
		me.selectSidebarItem(firstStyle, firstStyle.innerHTML);
		me.loadStyle(firstStyle.innerHTML);
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
	me.fillDropdowns();
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




