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
			option.value = key;
			option.innerHTML = key;
			dropdown.appendChild(option);
		}
	}

	option = document.createElement("option");
	option.setAttribute("value", "new-style");
	option.innerHTML = "Write a new style";
	dropdown.appendChild(option);
}

/**
 * addStyleToList: add a style to the list of the active styles on this page and remove
 *	the style's name from the drop down
 */
TSPopup.prototype.addStyleToList = function(styleName) {
	// clone the page-style template, modify it, and add it to the page
	var styleList = document.getElementById("style-list");
	var pageStyleTemplate = styleList.getElementsByClassName("page-style template")[0];
	var newStyle = pageStyleTemplate.cloneNode(true);
	newStyle.classList.remove("template");
	newStyle.getElementsByClassName("style-name")[0].innerHTML = styleName;
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
 * sendRequest: sends a message to the content script (turnstyle.js) and calls callback on the response
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
	var me = this;
	me.addListeners();

	chrome.storage.sync.get("styles", function(result) {
		me.styles = result.styles ? result.styles : {};
		me.fillDropDown();
	});

}

var popup = new TSPopup();





