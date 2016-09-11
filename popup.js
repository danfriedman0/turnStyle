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
	this.addStyle = document.getElementById("add-style");
	this.clearSettings = document.getElementById("clear-settings");
	this.clearAll = document.getElementById("clear-all");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");
	this.styleDropDown = document.getElementById("style-dropdown");
	this.message = document.getElementById("message");
	this.styleEditor = document.getElementById("style-editor");

	this.pageUrl = "";
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
		me.sendRequest({
			instruction: "removeStyle",
			styleId: "ts-preview"
		});
		this.disabled = true;
	})

	me.addStyle.addEventListener("click", function() {
		var styleName = me.escapeHtml(me.styleNameInput.value);
		var styleRules = me.escapeHtml(me.styleRulesInput.value);
		me.sendRequest({instruction: "restyle", styleName: styleName, styleRules: styleRules});
		me.addStyleToList(styleName);
		me.styleEditor.style.display = "none";
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
}

TSPopup.prototype.addOption = function(value, text) {
	var option = document.createElement("option");
	option.value = value;
	option.innerHTML = text;
	this.styleDropDown.appendChild(option);
}

TSPopup.prototype.fillDropDown = function() {
	var styles = this.styles;
	var me = this;

	for (var key in styles) {
		if (styles.hasOwnProperty(key)) {
			me.addOption(key, key);
		}
	}

	me.addOption("new-style", "Write a new style");
}

TSPopup.prototype.editStyle = function(styleName) {
	this.openStyleEditor(styleName);
}

TSPopup.prototype.removeStyle = function(styleNode, styleName) {
	var styleId = styleName.replace(/ /g, "-");
	this.sendRequest({instruction: "removeStyle", styleId: styleId, styleName: styleName, delete: true});
	styleNode.parentNode.removeChild(styleNode);
	this.addOption(styleName, styleName);
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
	option.parentNode.removeChild(option);
}

TSPopup.prototype.openStyleEditor = function(styleName) {
	var styleRules = this.styles[styleName];
	if (!styleRules)
		styleName = styleRules = "";
	this.styleNameInput.innerHTML = styleName;
	this.styleRulesInput.innerHTML = styleRules;		
	this.styleEditor.style.display = "block";
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

	me.pageUrl = settings.pageUrl ? settings.pageUrl : "";
	me.pageSettings = settings.pageSettings ? settings.pageSettings : [];
	me.styles = settings.styles ? settings.styles : {};

	document.getElementById("page-url").innerHTML = me.pageUrl;

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





