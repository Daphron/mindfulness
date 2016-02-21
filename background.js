var redirect_page = chrome.extension.getURL("blocked.html");
var queue_max_length = 5;
var num_cycles_needed = 2;
var time_before_reset = 1000 * 15; // in milliseconds
var mindless_urls = ["https://news.ycombinator.com/", "http://hackaday.com/", "https://www.facebook.com/", "https://www.reddit.com/", "https://feedly.com/i/my", "http://dpmaster.deathmask.net/?game=nexuiz"];

var blocked_urls = [];
var recent_urls = []; // oldest -> youngest
var recent_urls_timestamps = [];

function array_contains(arr, elem) {
    if(elem.substring(0,5) == "https") {
        elem = "https" + elem.substring(4);
    }
    for(e of arr) {
        if(e == elem || "https" + e.substring(4) == elem) {
            return true;
        }
    }
    return false;
}

function get_blocked_urls() {
    var last_url = "";
    var url_map = new Map();
    for(var i = 0; i < recent_urls.length; i++) {
        var url = recent_urls[i];
        var ts = recent_urls_timestamps[i];
        if(url != last_url && (Date.now() - ts <= time_before_reset)) {
            if(!mindless_urls.includes(url)) {
                url_map = new Map();
            } else if(url_map.has(url)) {
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

                recent_urls.push(details.url); // add new elem to end of array
                recent_urls_timestamps.push(Date.now());
                if(recent_urls.length > queue_max_length) {

                    recent_urls.shift(); // remove first elem of array (oldest)
                    recent_urls_timestamps.shift(); 
                }
                blocked_urls = get_blocked_urls();
                console.log("recent_urls:", recent_urls);
                console.log("blocked_urls:", blocked_urls);
            }
        }
        );

chrome.webNavigation.onBeforeNavigate.addListener(
        function(details) {
            if(array_contains(blocked_urls, details.url)) {
                chrome.tabs.update(details.tabId, {url:redirect_page});
                // blocked_urls = [];
                // recent_urls = [];
                // recent_urls_timestamps = [];
            }
        },
        {
            urls: ["http://*/*", "https://*/*"],
            types: ["main_frame", "sub_frame", "stylesheet", "script", "image", "object", "xmlhttprequest", "other"]
        }
        );
