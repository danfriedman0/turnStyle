/**
 * Content script for the turnStyle extension. Whenever a page loads, this file looks in chrome.storage
 * to see if any settings have been saved for that site and restyles the page if it finds anything. It
 * also listens for messages from the extension popup and restyles the page and saves settings when
 * it's instructed to.
 *
 * Dan Friedman
 */

var styleString = "@import 'https://fonts.googleapis.com/css?family=Roboto:300,400,500'\n" +
	"body { margin: 0 auto; max-width: 50em; font-family: 'Roboto', Helvetica', 'Arial', sans-serif; line-height: 1.5; padding: 4em 1em; color: #444 }\n" +
	"h2 { margin-top: 1em; padding-top: 1em }\n" +
	"h1,h2,strong { color: #333; }\n" +
	"code,pre { background: #f5f7f9; border-bottom: 1px solid #d8dee9; }\n" +
	"code { padding: 2px 4px; vertical-align: text-bottom; }\n" +
	"pre { padding: 1em; border-left: 2px solid #69c; }\n";

var styleObj = {
	"@import": "https://fonts.googleapis.com/css?family=Roboto:300,400,500",
	"body": {
		"margin": "0 auto",
		"max-width": "50em",
		"font-family": "'Roboto', 'Helvetica', 'Arial', sans-serif'",
		"line-height": "1.5",
		"padding": "4em 1em",
		"color": "#444"
	},
	"h2": {
		"margin-top": "1em",
		"padding-top": "1em",
		"color": "#333"
	},
	"h1": {
		"color": "#333"
	},
	"strong": {
		"color": "#333"
	},
	"code": {
		"background": "#f5f7f9",
		"border-bottom": "1px solid #d8dee9",
		"padding": "2px 4px",
		"vertical-align": "text-bottom"
	},
	"pre": {
		"background": "#f5f7f9",
		"border-bottom": "1px solid #d8dee9",
		"padding": "1em",
		"border-left": "2px solid #69c"
	}
}

/**
 * restyle: overrides the page's style by inserting the specified stylesheet
 * @param {String} stylesheet: the name of a stylesheet
 */
function restyle(stylesheet) {
	var path = chrome.extension.getURL("styles/" + stylesheet);
	var link = document.createElement("link");
	var head = document.head || document.getElementsByTagName('head')[0];

	link.setAttribute("rel", "stylesheet");
	link.setAttribute("href", path);

	head.appendChild(link);
}

/**
 * saveStyle: save the settings for this website with the Chrome storage API
 * @param {String} stylesheet: the name of a stylesheet
 */
function saveStyle(stylesheet) {
	chrome.storage.sync.get("turnStyle", function(obj) {
		var settings = obj.turnStyle ? obj.turnStyle : {};
		var pageUrl = location.origin;
		settings[pageUrl] = stylesheet;
		chrome.storage.sync.set({"turnStyle": settings});
	});
}

/**
 * loadSettings: look for saved settings in chrome.storage; if there are any, restyle the
 * page and send a message to the popup script to change the popup text
 */
function loadSettings() {
	chrome.storage.sync.get("turnStyle", function(obj) {
		if (obj && obj.turnStyle) {
			var pageUrl = location.origin;
			var stylesheet = obj ? obj.turnStyle[pageUrl] : null;
			if (stylesheet) {
				restyle(stylesheet);
			}
		}
	});
}

/**
 * clearStorage: clear any of the settings saved for this website and reload the page
 * @param {Boolean} clearAll: the function will clear all turnStyle settings if clearAll == True
 * @param {Boolean} reload: reload the page unless reload == False
 */
function clearStorage(clearAll, reload) {
	if (clearAll) {
		chrome.storage.sync.remove("turnStyle");	
	}
	else {
		var pageUrl = location.origin;
		chrome.storage.sync.get("turnStyle", function(obj) {
			var turnStyle = obj ? obj.turnStyle : null;
			if (turnStyle) {
				var pageUrl = location.origin;
				delete turnStyle[pageUrl];
				chrome.storage.sync.set({"turnStyle": turnStyle});
			}
		});
	}
	if (reload || reload == null)
		location.reload();

}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.instruction === "restyle") {
		var stylesheet = request.stylesheet ? request.stylesheet : "default.css";
		restyle(stylesheet);
		saveStyle(stylesheet);
		sendResponse({message: "restyled"})
	}
	else if (request.instruction === "clear storage") {
		clearStorage();
		sendResponse({message: "storage cleared"});
	}
});

// on load
loadSettings();







