/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and turnstyle.js, the
 * content script.
 */

var restyle = document.getElementById("restyle");
var clearSettings = document.getElementById("clear-settings");
var clearAll = document.getElementById("clear-all");

function sendRequest(request, callback) {
	// find the active tab and open a connection with the content script
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {instruction: request}, function(response) {
			if (callback)
				callback(response);
		});
	});	
}

function displayResponse(response) {
	var message = document.getElementById("message");
	if ((typeof response).toLowerCase() === "string")
		message.innerHTML = response;
	else if (response.message)
		message.innerHTML = response.message;
}

restyle.addEventListener("click", function() {
	sendRequest("restyle", displayResponse);
});

clearSettings.addEventListener("click", function() {
	sendRequest("clear settings", displayResponse);
});

clearAll.addEventListener("click", function() {
	sendRequest("clear all", displayResponse);
});


