/**
 * popup.js
 * Dan Friedman
 *
 * This file controls the popup and relays messages between the popup and turnstyle.js, the
 * extension's content script.
 */

var btn = document.getElementById("restyle");
var msg = document.getElementById("message");
btn.addEventListener("click", function() {

	// find the active tab and open a connection with the content script
	chrome.tabs.query({active: true}, function(tabs) {
		var tabId = tabs[0].id;

		var port = chrome.tabs.connect(tabId, {name: "turnstyle"});

		port.postMessage({instruction: "restyle"});
		port.onMessage.addListener(function(msg) {
			message.innerHTML = msg.response;
		});		
	});
});