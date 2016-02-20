var redirect_page = chrome.extension.getURL("blocked.html");
var queue_max_length = 5;
var num_cycles_needed = 2;
var blocked_urls = ["*://xkcd.com/*"];
var recent_urls = []; // oldest -> youngest

function get_blocked_urls() {
    var last_url = "";
    var url_map = new Map();
    for(var i = 0; i < recent_urls.length; i++) {
        var url = recent_urls[i];
        if(url != last_url) {
            if(url_map.has(url)) {
                url_map.set(url, url_map.get(url) + 1);
            } else {
                url_map.set(url, 1);
            }
            last_url = url;
        }
    }
    console.log("url_map:", url_map);

    url_iter = url_map.values();
    var ret = [];
    var mindless = true;
    for(var v of url_map) {
        if(v[1] < num_cycles_needed) {
            mindless = false;
            break;
        }
        ret.push(v[0]);
    }
    if(mindless) {
        return ret;
    } else {
        return [];
    }
    
};

chrome.webNavigation.onCompleted.addListener(
        function (details) {
            if(details.frameId == 0) { // we only care about the main page load

                // console.log("chrome.webNavigation.onBeforeNavigate hit on " + details.timeStamp);
                recent_urls.push(details.url); // add new elem to end of array
                if(recent_urls.length > queue_max_length) {

                    recent_urls.shift(); // remove first elem of array (oldest)
                }
                blocked_urls = get_blocked_urls();
                console.log("recent_urls:", recent_urls);
                console.log("blocked_urls:", blocked_urls);

                // blocked_urls = ["http://rsstory.com/"];
                // alert(blocked_urls);

            }
        }
        );

// TODO: use the thing in the chrome tab to do redirect via content_scripts
// instead of onbeforerequest
chrome.webNavigation.onBeforeNavigate.addListener(
        function(details) {
            if(blocked_urls.includes(details.url)) {
                chrome.tabs.update(details.tabId, {url:redirect_page});
                blocked_urls = [];
                recent_urls = [];
            }
        },
        {
            urls: ["http://*/*", "https://*/*"],
            types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
        }
        );
