/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and the content script (turnstyle.js)
 */

var TSPopup = function() {

	// page URL
	this.pageUrlDisplay = document.getElementById("page-url-display");
	this.pageUrlInput = document.getElementById("page-url-input");
	this.editUrl = document.getElementById("edit-url");
	this.saveUrl = document.getElementById("save-url");

	// style selector
	this.message = document.getElementById("message");
	this.styleSelector = document.getElementById("style-selector");
	this.styleDropdown = document.getElementById("style-dropdown");

	// style editor and buttons
	this.styleEditor = document.getElementById("style-editor");
	this.closeEditor = document.getElementById("close-editor");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");
	this.previewStyle = document.getElementById("preview-style");
	this.clearStyle = document.getElementById("clear-style");
	this.importantButton = document.getElementById("append-importants");
	this.saveStyle = document.getElementById("save-style");


	this.baseUrl = "";
	this.fullUrl = "";
	this.activeUrl = "";
	this.pageStyles = [];
	this.styles = {};

	this.initialize();
}

/****************************************************************************************************
 ** Events ******************************************************************************************
 ****************************************************************************************************/


TSPopup.prototype.addListeners = function() {
	var me = this;

	me.previewStyle.addEventListener("click", function() {
		if (me.styleRulesInput.value) {
			var styleRules = me.escapeHtml(me.styleRulesInput.value);
			me.preview(styleRules);
		}
	});

	me.clearStyle.addEventListener("click", function() {
		me.clearPreview();
	})

	me.saveStyle.addEventListener("click", function() {
		var styleName = me.escapeHtml(me.styleNameInput.value);
		var styleRules = me.escapeHtml(me.styleRulesInput.value);
		var errorMessage;

		if (!styleName)
			me.appendError("You should give your style a name", me.styleNameInput);
		else if (!styleRules)
			me.appendError("You should add some rules", me.styleRulesInput);
		else
			me.saveStyle(styleName, styleRules);
	});

	me.styleDropdown.addEventListener("change", function() {
		var styleName = this.value;
		if (styleName)
			me.openStyleEditor(styleName);
		else
			me.styleEditor.style.display = "none";
	});

	me.closeEditor.addEventListener("click", function() {
		me.styleEditor.style.display = "none";
		me.styleDropdown.value = "";
		me.clearPreview();
	});

	me.editUrl.addEventListener("click", function() {
		me.saveUrl.disabled = false;
		me.pageUrlDisplay.style.display = "none";
		me.pageUrlInput.style.display = "block";
		this.disabled = true;
	});

	me.saveUrl.addEventListener("click", function() {
		var newUrl = me.escapeHtml(me.pageUrlInput.value);
		var re = new RegExp("^" + newUrl);
		if (!me.fullUrl.match(re)) {
			me.appendError("The URL has to match this page in some way", me.pageUrlInput);
		}
		else if (newUrl.slice(0, me.baseUrl.length) !== me.baseUrl) {
			me.appendError("The URL has to start with " + me.baseUrl, me.pageUrlInput);
		}
		else {
			me.saveUrl(newUrl);
			this.disabled = true;
		}
	});

	me.importantButton.addEventListener("click", function() {
		me.appendImportants();
	});
}

/****************************************************************************************************
 ** Style changes ***********************************************************************************
 ****************************************************************************************************/

// Save changes to the active URL
TSPopup.prototype.saveUrl = function(url) {
	var me = this;

	me.activeUrl = url;
	me.pageUrlDisplay.innerHTML = newUrl;

	me.clearErrorMessage();
	me.editUrl.disabled = false;
	me.pageUrlInput.style.display = "none";
	me.pageUrlDisplay.style.display = "block";
}

// Remove a style from the page, from the style list, and from the saved settings
TSPopup.prototype.removeStyle = function(styleNode, styleName) {
	var index = this.pageStyles.indexOf(styleName),
		activeUrl = this.activeUrl;
		styleId = styleName.replace(/ /g, "-");

	if (index > -1)
		this.pageStyles.splice(index, 1);

	this.sendRequest({
		instruction: "removeStyle",
		activeUrl: activeUrl,
		styleId: styleId,
		styleName: styleName,
		delete: true
	});

	styleNode.parentNode.removeChild(styleNode);
	this.addOption(styleName, styleName);
}

/**
 * saveStyle: update the style if it's already been added to the page;
 *	otherwise save it and add it to the page
 */
TSPopup.saveStyle = function(styleName, styleRules) {
	var me = this;

	if (me.pageStyles.indexOf(styleName) > -1) {
		me.sendRequest({instruction: "editStyle", styleName: styleName, styleRules: styleRules});
		me.styleEditor.style.display = "none";
		me.styleDropdown.value = "";
	}
	else {
		me.pageStyles.push(styleName);
		me.styles[styleName] = styleRules;
		me.sendRequest({
			instruction: "saveStyle",
			activeUrl: me.activeUrl,
			styleName: styleName,
			styleRules: styleRules
		});
		me.addStyleToList(styleName);
		me.styleEditor.style.display = "none";
		me.styleDropdown.value = "";
	}

	me.clearPreview();
}

// Clear the preview style from the page
TSPopup.prototype.clearPreview = function() {
	this.sendRequest({
		instruction: "removeStyle",
		styleId: "ts-preview"
	});
	this.disabled = true;
}

// Add a preview of the style to the page
TSPopup.preview = function(styleRules) {
	var me = this;
	me.sendRequest({
		instruction: "insertStyle",
		styleRules: styleRules,
		styleId: "ts-preview"
	});	
	me.clearStyle.disabled = false;	
}

/****************************************************************************************************
 ** Handle input ************************************************************************************
 ****************************************************************************************************/

// based on code from StackOverflow (http://stackoverflow.com/a/6234804)
TSPopup.prototype.escapeHtml = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

// append an error message to the specified node
TSPopup.prototype.appendError = function(errorMessage, node) {
	// only show one error message at a time
	this.clearErrorMessage();

	var error = document.createElement("div");
	error.id = "error-message";
	error.innerHTML = errorMessage;
	node.parentNode.insertBefore(error, node.nextElementSibling);
}

// clear the error message from the page
TSPopup.prototype.clearErrorMessage = function() {
	var error = document.getElementById("error-message");
	if (error)
		error.parentNode.removeChild(error);
}

/****************************************************************************************************
 ** Configure style editor **************************************************************************
 ****************************************************************************************************/

TSPopup.prototype.editStyle = function(styleName) {
	this.styleDropdown.value = "";
	this.openStyleEditor(styleName);
}

// add "!important" to every style rule that doesn't already have one
TSPopup.prototype.appendImportants = function() {
	var me = this;
	console.log(me);
	var styleRules = me.escapeHtml(me.styleRulesInput.value);
	var lines = [];

	if (styleRules) {
		styleRules = styleRules.replace(/ !important/g, "");	// get rid of any previous !importants
		lines = styleRules.split(";");
		styleRules = lines.join(" !important;");
		me.styleRulesInput.value = styleRules;
	}
}

// load the style name and style rules into the editor
TSPopup.prototype.openStyleEditor = function(styleName) {
	var me = this;
	me.clearErrorMessage();
	var styleRules = me.styles[styleName];
	if (!styleRules)
		styleName = styleRules = "";
	me.styleNameInput.value = styleName;
	me.styleRulesInput.value = styleRules;
	me.styleEditor.style.display = "block";
}

/****************************************************************************************************
 ** Manipulate DOM **********************************************************************************
 ****************************************************************************************************/

// add an option to the dropdown
TSPopup.prototype.addOption = function(value, text) {
	var option = document.createElement("option");
	var dropdown = this.styleDropdown;
	option.value = value;
	option.innerHTML = text;

	dropdown.insertBefore(option, dropdown.firstElementChild.nextElementSibling);
}

/**
 * addStyleToList: add a style to the list of the active styles on this page and remove
 *	the style's name from the drop down
 */
TSPopup.prototype.addStyleToList = function(styleName) {
	var me = this;

	// clone the page-style template
	var styleList = document.getElementById("style-list");
	var pageStyleTemplate = styleList.getElementsByClassName("page-style template")[0];
	var newStyle = pageStyleTemplate.cloneNode(true);

	// modify and add event listeners
	newStyle.classList.remove("template");
	newStyle.getElementsByClassName("style-name")[0].innerHTML = styleName;
	newStyle.getElementsByClassName("edit-style")[0].addEventListener("click", function() {
		me.editStyle(styleName);
	});
	newStyle.getElementsByClassName("remove-style")[0].addEventListener("click", function() {
		me.removeStyle(newStyle, styleName);
	});

	styleList.insertBefore(newStyle, pageStyleTemplate);

	// remove name from dropdown
	var option = this.styleDropdown.querySelector("option[value='" + styleName + "']");
	if (option)
		option.parentNode.removeChild(option);
}

/****************************************************************************************************
 ** Page setup **************************************************************************************
 ****************************************************************************************************/

TSPopup.prototype.fillDropdown = function() {
	var styles = this.styles;
	var me = this;

	for (var key in styles) {
		if (styles.hasOwnProperty(key)) {
			me.addOption(key, key);
		}
	}
}

TSPopup.prototype.loadSettings = function(settings) {
	var me = this;

	me.baseUrl = settings.baseUrl ? settings.baseUrl : "";
	me.fullUrl = settings.fullUrl ? settings.fullUrl : "";
	me.activeUrl = settings.activeUrl ? settings.activeUrl : settings.baseUrl;
	me.pageStyles = settings.pageStyles ? settings.pageStyles : [];
	me.styles = settings.styles ? settings.styles : {};

	me.pageUrlDisplay.innerHTML = me.activeUrl;
	me.pageUrlInput.value = me.activeUrl;

	me.fillDropdown();
	if (me.pageStyles) {
		me.pageStyles.forEach(function(styleName) {
			me.addStyleToList(styleName);
		});
	}
}

/****************************************************************************************************
 ** Messaging ***************************************************************************************
 ****************************************************************************************************/

/**
 * sendRequest: sends a message to the content script (turnstyle.js) and calls callback on the response,
 *	bound to the specified context
 */
TSPopup.prototype.sendRequest = function(request, callback, context) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
			if (callback && context)
				callback.bind(context, response)();
		});
	});	
}

/****************************************************************************************************
 ** Initialize **************************************************************************************
 ****************************************************************************************************/

TSPopup.prototype.initialize = function() {
	var me = this;
	me.addListeners();
	me.sendRequest({instruction: "getPageSettings"}, me.loadSettings, me);

	chrome.storage.sync.get(null, function(storage) {
		console.log(storage);
	})
}

var popup = new TSPopup();




