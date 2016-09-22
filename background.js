// The only purpose of this script is to save a basic style the first time you install the extension

var basicFormatting = "body {\n\tmargin: 0 auto !important;\n\tmax-width: 50em !important;\n\tfont-family: 'Roboto', 'Helvetica', 'Arial', sans-serif !important;\n\tline-height: 1.5 !important;\n\tpadding: 4em 1em !important;\n\t color: #555 !important;\n}"
	+ "\n\n"
	+ "h1,\nh2,\nstrong {\n\tcolor: #333 !important;\n}"
	+ "\n\n"
	+ "h2 {\n\tmargin-top: 1em !important;\n\tpadding-top:1em !important;\n}"
	+ "\n\n"
	+ "code,\npre {\n\tbackground: #f5f7f9 !important;\n\tcolor: #474d5a !important;\n}"
	+ "\n\n"
	+ "code {\n\tpadding: 2px 4px !important;\n\tvertical-align: text-bottom !important;\n}"
	+ "\n\n"
	+ "pre {\n\tpadding: 1em !important;\n\tborder: none !important;\n\tborder-left: 2px solid #69c !important;\n}";

var styles = {}
styles["basic formatting"] = basicFormatting;

chrome.runtime.onInstalled.addListener(function(details){
	if (details.reason == "install") {
		chrome.storage.sync.set({"styles": styles});
	}
});