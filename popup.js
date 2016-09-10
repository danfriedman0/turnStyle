/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and turnstyle.js, the
 * content script.
 */

var TSPopup = function() {
	this.restyle = document.getElementById("restyle");
	this.restyleDefault = document.getElementById("restyle-default");
	this.clearSettings = document.getElementById("clear-settings");
	this.clearAll = document.getElementById("clear-all");
	this.styleNameInput = document.getElementById("style-name-input");
	this.styleRulesInput = document.getElementById("style-rules-input");
	this.styleDropDown = document.getElementById("style-dropdown");
	this.message = document.getElementById("message");
	this.styleEditor = document.getElementById("style-editor");

	this.styles = {};

	this.initialize();
}

TSPopup.prototype.addListeners = function() {
	var me = this;

	me.restyle.addEventListener("click", function() {
		var styleName = me.escapeHtml(me.styleNameInput.value);
		var styleRules = me.escapeHtml(me.styleRulesInput.value);
		me.sendRequest({instruction: "restyle", styleName: styleName, styleRules: styleRules});
	});

	me.restyleDefault.addEventListener("click", function() {
		console.log("clicked");
		me.sendRequest({instruction: "restyle"}, me.displayResponse);
	});

	me.clearSettings.addEventListener("click", function() {
		me.sendRequest({instruction: "clear settings"}, me.displayResponse);
	});

	me.clearAll.addEventListener("click", function() {
		me.sendRequest({instruction: "clear all"}, me.displayResponse);
	});

	me.styleDropDown.addEventListener("change", function() {
		var styleName = this.value;
		if (styleName)
			me.openStyleEditor(styleName);
		else
			me.styleEditor.style.display = "none";
	});
}

TSPopup.prototype.fillDropDown = function() {
	var styles = this.styles;
	var dropdown = this.styleDropDown;
	var option;

	for (var key in styles) {
		if (styles.hasOwnProperty(key)) {
			option = document.createElement("option");
			option.setAttribute("value", key);
			option.innerHTML = key;
			dropdown.appendChild(option);
		}
	}

	option = document.createElement("option");
	option.setAttribute("value", "new-style");
	option.innerHTML = "Write a new style";
	dropdown.appendChild(option);
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
 * sendRequest: sends a message to the content script (turnstyle.js) and calls callback on the response
 * @param {object} request
 * @param {function} callback
 */
TSPopup.prototype.sendRequest = function(request, callback) {
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, request, function(response) {
			if (callback)
				callback(response);
		});
	});	
}

/**
 * displayReponse: displays a response in the message field of the popup if the response is a string
 *		or if it has a message field
 * @param {(string|object)} response
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

TSPopup.prototype.initialize = function() {
	var pageUrl = location.origin;
	var me = this;
	me.addListeners();

	chrome.storage.sync.get("styles", function(result) {
		me.styles = result.styles ? result.styles : {};
		me.fillDropDown();
	});
}

var popup = new TSPopup();





