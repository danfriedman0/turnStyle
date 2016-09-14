/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and the content script (turnstyle.js)
 */

var TSPopup = function() {
	this.previewStyle = document.getElementById("preview-style");
	this.clearStyle = document.getElementById("clear-style");
	this.saveStyle = document.getElementById("save-style");
	this.clearSettings = document.getElementById("clear-settings");
	this.clearAll = document.getElementById("clear-all");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");
	this.styleDropDown = document.getElementById("style-dropdown");
	this.message = document.getElementById("message");
	this.styleSelector = document.getElementById("style-selector");
	this.styleEditor = document.getElementById("style-editor");
	this.closeEditor = document.getElementById("close-editor");
	this.pageUrlDisplay = document.getElementById("page-url-display");
	this.pageUrlInput = document.getElementById("page-url-input");
	this.editUrl = document.getElementById("edit-url");
	this.saveUrl = document.getElementById("save-url");

	this.baseUrl = "";
	this.fullUrl = "";
	this.activeUrl = "";
	this.pageSettings = [];
	this.styles = {};

	this.initialize();
}

TSPopup.prototype.addListeners = function() {
	var me = this;

	me.previewStyle.addEventListener("click", function() {
		if (me.styleRulesInput.value) {
			var styleRules = me.escapeHtml(me.styleRulesInput.value);
			me.sendRequest({
				instruction: "insertStyle",
				styleRules: styleRules,
				styleId: "ts-preview"
			});	
			me.clearStyle.disabled = false;	
		}
	});

	me.clearStyle.addEventListener("click", function() {
		me.clearPreview();
	})

	me.saveStyle.addEventListener("click", function() {
		var styleName = me.escapeHtml(me.styleNameInput.value);
		var styleRules = me.escapeHtml(me.styleRulesInput.value);
		var errorMessage;

		if (!styleName || !styleRules) {
			if (!styleName)
				me.appendError("You should give your style a name", me.styleNameInput);
			else
				me.appendError("You should add some rules", me.styleRulesInput);
		}
		else if (me.pageSettings.indexOf(styleName) > -1) {
			me.sendRequest({instruction: "editStyle", styleName: styleName, styleRules: styleRules});
			me.styleEditor.style.display = "none";
			me.styleDropDown.value = "";
		}
		else {
			me.pageSettings.push(styleName);
			me.sendRequest({instruction: "saveStyle", styleName: styleName, styleRules: styleRules});
			me.addStyleToList(styleName);
			me.styleEditor.style.display = "none";
			me.styleDropDown.value = "";
		}
		me.clearPreview();
	});

	me.clearSettings.addEventListener("click", function() {
		me.sendRequest({instruction: "clear settings"});
	});

	me.clearAll.addEventListener("click", function() {
		me.sendRequest({instruction: "clear all"});
	});

	me.styleDropDown.addEventListener("change", function() {
		var styleName = this.value;
		if (styleName)
			me.openStyleEditor(styleName);
		else
			me.styleEditor.style.display = "none";
	});

	me.closeEditor.addEventListener("click", function() {
		me.styleEditor.style.display = "none";
		me.styleDropDown.value = "";
		me.clearPreview();
	});

	me.editUrl.addEventListener("click", function() {
		me.saveUrl.disabled = false;
		me.pageUrlDisplay.style.display = "none";
		me.pageUrlInput.style.display = "block";
		this.disabled = true;
	});

	me.saveUrl.addEventListener("click", function() {
		var newUrl = this.value;

		if (newUrl !== me.activeUrl) {
			// make sure it matches the URL in some way
			var re = new RegExp("^" + newUrl);
			if (!me.fullUrl.match(re)) {

			}

		}

		me.editUrl.disabled = false;
		me.pageUrlInput.style.display = "none";
		me.pageUrlDisplay.style.display = "block";
		this.disabled = true;
	});
}

TSPopup.prototype.addOption = function(value, text) {
	var option = document.createElement("option");
	var dropDown = this.styleDropDown;
	option.value = value;
	option.innerHTML = text;

	dropDown.insertBefore(option, dropDown.firstElementChild.nextElementSibling);
}

TSPopup.prototype.fillDropDown = function() {
	var styles = this.styles;
	var me = this;

	for (var key in styles) {
		if (styles.hasOwnProperty(key)) {
			me.addOption(key, key);
		}
	}
}

TSPopup.prototype.appendError = function(errorMessage, node) {
	// only show one error message at a time
	this.clearErrorMessage();

	var error = document.createElement("div");
	error.id = "error-message";
	error.innerHTML = errorMessage;
	node.parentNode.insertBefore(error, node.nextElementSibling);
}

TSPopup.prototype.editStyle = function(styleName) {
	this.styleDropDown.value = "";
	this.openStyleEditor(styleName);
}

TSPopup.prototype.removeStyle = function(styleNode, styleName) {
	var index = this.pageSettings.indexOf(styleName);
	if (index > -1)
		this.pageSettings.splice(index, 1);

	var styleId = styleName.replace(/ /g, "-");
	this.sendRequest({instruction: "removeStyle", styleId: styleId, styleName: styleName, delete: true});
	styleNode.parentNode.removeChild(styleNode);
	this.addOption(styleName, styleName);
}

TSPopup.prototype.clearPreview = function() {
	this.sendRequest({
		instruction: "removeStyle",
		styleId: "ts-preview"
	});
	this.disabled = true;
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
	var option = this.styleDropDown.querySelector("option[value='" + styleName + "']");
	if (option)
		option.parentNode.removeChild(option);
}

TSPopup.prototype.openStyleEditor = function(styleName, editorMode) {
	var me = this;
	me.clearErrorMessage();
	var styleRules = me.styles[styleName];
	if (!styleRules)
		styleName = styleRules = "";
	me.styleNameInput.value = styleName;
	me.styleRulesInput.value = styleRules;
	me.styleEditor.style.display = "block";
}

TSPopup.prototype.clearErrorMessage = function() {
	var error = document.getElementById("error-message");
	if (error)
		error.parentNode.removeChild(error);
}

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

/**
 * displayReponse: displays a response in the message field of the popup if the response is a string
 *		or if it has a message field
 */
TSPopup.prototype.displayResponse = function(response) {
	if ((typeof response).toLowerCase() === "string")
		this.message.innerHTML = response;
	else if (response && response.message)
		this.message.innerHTML = response.message;
}

// based on code from StackOverflow (http://stackoverflow.com/a/6234804)
TSPopup.prototype.escapeHtml = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

TSPopup.prototype.loadSettings = function(settings) {
	var me = this;

	me.baseUrl = settings.baseUrl ? settings.baseUrl : "";
	me.fullUrl = settings.fullUrl ? settings.fullUrl : "";
	me.activeUrl = settings.activeUrl ? settings.activeUrl : settings.baseUrl;
	me.pageSettings = settings.pageSettings ? settings.pageSettings : [];
	me.styles = settings.styles ? settings.styles : {};

	me.pageUrlDisplay.innerHTML = me.activeUrl;
	me.pageUrlInput.value = me.activeUrl;

	me.fillDropDown();
	if (me.pageSettings) {
		me.pageSettings.forEach(function(styleName) {
			me.addStyleToList(styleName);
		});
	}
}

TSPopup.prototype.initialize = function() {
	var me = this;
	me.addListeners();
	me.sendRequest({instruction: "getPageSettings"}, me.loadSettings, me);
}

var popup = new TSPopup();





