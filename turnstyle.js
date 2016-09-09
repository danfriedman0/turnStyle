/**
 * JavaScript for the turnStyle extension. The program injects CSS into the page when the icon is clicked
 * or if the page URL has been saved.
 *
 * Dan Friedman
 */

var EXTENSION_ID = "fnjfcjdldmglocddmnkhnpkinihbhdeh";

/**
 * restyle: overrides the page's by inserting the specified stylesheet
 * @param {String} stylesheet: path to a stylesheet
 */
function restyle(stylesheet) {
	var path = "chrome-extension://" + EXTENSION_ID + "/styles/" + stylesheet;
	var link = document.createElement("link");
	var head = document.head || document.getElementsByTagName('head')[0];

	link.setAttribute("rel", "stylesheet");
	link.setAttribute("href", path);

	head.appendChild(link);
}

chrome.runtime.onConnect.addListener(function(port) {
	console.assert(port.name === "turnstyle");
	port.onMessage.addListener(function(msg) {
		if (msg.instruction = "restyle") {
			var stylesheet = msg.stylesheet ? msg.stylesheet : "default.css";
			restyle(stylesheet);
			port.postMessage({response: "restyled"})
		}
	});
});