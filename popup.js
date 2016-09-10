/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and turnstyle.js, the
 * content script.
 */

var restyle = document.getElementById("restyle");
var restyleDefault = document.getElementById("restyle-default");
var clearSettings = document.getElementById("clear-settings");
var clearAll = document.getElementById("clear-all");
var styleNameInput = document.getElementById("style-name-input");
var styleRulesInput = document.getElementById("style-rules-input");

/**
 * sendRequest: sends a message to the content script (turnstyle.js) and calls callback on the response
 * @param {object} request
 * @param {function} callback
 */
function sendRequest(request, callback) {
	// find the active tab and open a connection with the content script
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
function displayResponse(response) {
	var message = document.getElementById("message");
	if ((typeof response).toLowerCase() === "string")
		message.innerHTML = response;
	else if (response && response.message)
		message.innerHTML = response.message;
}

// copied from StackOverflow (http://stackoverflow.com/a/6234804)
function escapeHtml(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
 }

restyle.addEventListener("click", function() {
	var styleName = escapeHtml(styleNameInput.value);
	var styleRules = escapeHtml(styleRulesInput.value);
	sendRequest({instruction: "restyle", styleName: styleName, styleRules: styleRules});
});

restyleDefault.addEventListener("click", function() {
	sendRequest({instruction: "restyle"}, displayResponse);
});

clearSettings.addEventListener("click", function() {
	sendRequest({instruction: "clear settings"}, displayResponse);
});

clearAll.addEventListener("click", function() {
	sendRequest({instruction: "clear all"}, displayResponse);
});




