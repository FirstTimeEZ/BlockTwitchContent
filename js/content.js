const SENDER_UUID = "BlockContent@Twitch.tv";
const OPTIONS_SCRIPT = "addon_child";

var shouldDebug = false;

var fragsSplit = [];

console.log("Loaded Content Script, If you see this more then once you may need to restart your browser");

RequestFragments();
RequestDebug();

browser.runtime.onMessage.addListener((request, sender, sendResponse) => { // Listen for messages from the BackgroundWorker
    if (sender.id == SENDER_UUID && sender.envType == OPTIONS_SCRIPT) {
        if (request.requestFragments) {
            RequestFragments(); // Content Script -> BackgroundWorker
        }
        else if (request.requestDebug) {
            RequestDebug(); // Content Script -> BackgroundWorker
        }
        else if (request.refreshPageRequest) {
            shouldDebug && console.log("content script triggered page refresh");

            location.reload();
        }
    }
});

window.addEventListener("message", (event) => { // Listen for Messages from the Web Page Mixin
    if (event.data.completed === undefined
        && event.data.text != undefined
        && event.data.type != undefined
        && event.data.type === "fp"
        && event.data.random != undefined
        && typeof event.data.random === 'number'
        && typeof event.data.type === 'string'
        && typeof event.data.text === 'string'
        && Number.isFinite(event.data.random)) {

        shouldDebug && console.log("ContentScript", event.data.text, event.data.random);
        const isFragmentMatched = fragsSplit.some(frag => frag !== "" && event.data.text.includes(frag));
        window.postMessage({ response: isFragmentMatched ? "f" : "w", completed: true, random: event.data.random }, "https://www.twitch.tv"); // Content Script -> Web Page Mixin
    }
});

function RequestFragments() { // Content Script -> BackgroundWorker
    browser.runtime.sendMessage({ requestForFragments: true },
        (response) => { // BackgroundWorker -> Content Script
            if (response.fragments != undefined) {
                fragsSplit = response.fragments;
                shouldDebug && console.log("Updated fragments", response);
            }
        });
}

function RequestDebug() { // Content Script -> BackgroundWorker
    browser.runtime.sendMessage({ checkDebugSettingRequest: true },
        (response) => { // BackgroundWorker -> Content Script
            if (response != undefined) {
                console.log(response);
                shouldDebug = response.debugEnabled;
            }
        });
}
