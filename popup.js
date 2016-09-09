/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and turnstyle.js, the
 * extension's content script.
 */

var restyle = document.getElementById("restyle");
var clearStorage = document.getElementById("clear-storage");

function sendMessage(msg, callback) {
	// find the active tab and open a connection with the content script
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {instruction: msg}, function(response) {
			if (callback)
				callback(response);
		});
	});	
}

restyle.addEventListener("click", function() {
	sendMessage("restyle", function(msg) {
		if (msg.response) {
			var message = document.getElementById("message");
			message.innerHTML = msg.response;
		}
	});
});

clearStorage.addEventListener("click", function() {
	sendMessage("clear storage", function(msg) {
		if (msg.response) {
			var message = document.getElementById("message");
			message.innerHTML = msg.response;
		}		
	});
});
