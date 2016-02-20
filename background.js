var redirect_page = chrome.extension.getURL("blocked.html");
var blocked_urls = ["*://xkcd.com/*"];
chrome.webRequest.onBeforeRequest.addListener(
        function(details) {
            return {redirectUrl: redirect_page};
        },
        {
            urls: blocked_urls,
            types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
        },
        ["blocking"]
        );
