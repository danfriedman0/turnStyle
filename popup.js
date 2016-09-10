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

	this.addListeners();
}

TSPopup.prototype.addListeners = function() {
	var me = this;
	this.restyle.addEventListener("click", function() {
		var styleName = me.escapeHtml(styleNameInput.value);
		var styleRules = me.escapeHtml(styleRulesInput.value);
		me.sendRequest({instruction: "restyle", styleName: styleName, styleRules: styleRules});
	});

	this.restyleDefault.addEventListener("click", function() {
		console.log("clicked");
		me.sendRequest({instruction: "restyle"}, me.displayResponse);
	});

	this.clearSettings.addEventListener("click", function() {
		me.sendRequest({instruction: "clear settings"}, me.displayResponse);
	});

	this.clearAll.addEventListener("click", function() {
		me.sendRequest({instruction: "clear all"}, me.displayResponse);
	});	
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

// copied from StackOverflow (http://stackoverflow.com/a/6234804)
TSPopup.prototype.escapeHtml = function(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

// function initializePopup() {
// 	chrome.storage.sync.get("styles", function(result) {
// 		if (result.styles) {
// 			fillDropDown(result.styles);
// 		}
// 	});
// }

var popup = new TSPopup();





