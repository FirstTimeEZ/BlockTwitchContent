# Block Twitch Content

[![](https://i.imgur.com/3BynCoO.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

A [`Firefox Extension`](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) that blocks `Chat Content` on [`Twitch`](https://www.twitch.tv) using various identifiers, phrases, or simply a display name.

You can easily create rules by opening the pop-up in the address bar while viewing [`Twitch`](https://www.twitch.tv). 

The list is stored locally and remains private.

# How does it work

The extension works by injecting a `Mixin` to check messages as they arrive.

This is achieved by using a very durable `Regex` to find the location of the `messageProcessor` in `vendor.js`.

```js
var FIND_FRAGMENT_REGEX = /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/;
```

Once the `messageProcessor` has been found, it gets replaced with a `Mixin` that can securely communicate with the extension.

```js
// this is a string
new Promise((resolve) => {
    const val = Math.floor(Math.random() * 100000000);
    const handler = (e2) => {
        if (e2.data.response !== undefined && e2.data.completed && e2.data.random === val) {
            resolve(e2.data.response);
            window.removeEventListener('message', handler);
        }
    };
    
    window.addEventListener('message', handler);
    window.postMessage({
        random: val,
        type: 'fp',
        text: " + matches[2] + ".data
    });
}, 'https://www.twitch.tv').then(response => {
    if (response === 'w') {
        " + matches[1] + ".messageProcessor.processMessage(" + matches[2] + ".data);
    } else {
        console.warn('removed message:', " + matches[2] + ".data);
    }
});
```

Using a `Promise` this way creates a synchronous channel with the `Extension` through the `Content Script`.

```js
var INSERT = "new Promise((resolve) => { const val = Math.floor(Math.random() * 100000000); const handler = (e2) => { if (e2.data.response != undefined && e2.data.completed && e2.data.random == val) { resolve(e2.data.response); window.removeEventListener('message', handler); } }; window.addEventListener('message', handler); window.postMessage({ random: val, type: 'fp', text: " + matches[2] + ".data }); }, 'https://www.twitch.tv').then(response => { if(response === 'w'){ " + matches[1] + ".messageProcessor.processMessage(" + matches[2] + ".data) } else { console.warn('removed message:', " + matches[2] + ".data); }});";
decodedString.replace(FIND_FRAGMENT_REGEX, INSERT);
```

This makes it possible to update the `Hidden Chat Content Rules` in real time instead of needing a page refresh.

# Settings

Additional settings and examples can be found in the `options` menu.

[![](https://i.imgur.com/Alq7jYH.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

# Debug Mode

In debug mode, the extension will start displaying messages in the console.

[![](https://i.imgur.com/fn1u01f.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

This information can be useful for creating rules or finding bugs.

[![](https://i.imgur.com/SrEm1at.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

# Self Healing

The `Mixin` makes use of the `Matches` from the `Regex` to self-heal when [`Twitch`](https://www.twitch.tv) updates.

```js
$1.messageProcessor.processMessage($2.data);
```