# Block Twitch Content

[![](https://i.imgur.com/3BynCoO.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

A [`Firefox Extension`](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) that blocks `Chat Content` on [`Twitch`](https://www.twitch.tv) using various identifiers, phrases, or simply a display name.

[![](https://i.imgur.com/daNrPlm.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

You can easily create rules by opening the pop-up in the address bar while viewing [`Twitch`](https://www.twitch.tv). 

[![](https://i.imgur.com/sqP9TrH.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

The list is stored locally and remains private.

# Settings Bar

You can mouse-over a setting to see what it does, detailed explanations below.

[![](https://i.imgur.com/8nNqi94.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

### Hide Bot Spam

[![](https://i.imgur.com/ohl4bFJ.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) Content containing the words below will be removed from chat if the `Hide Bots` setting is active

```
StreamElements
Streamlabs
SoundAlerts
Moobot
Nightbot
Fossabot
DeepBot
WizeBot
PhantomBot
Streamlabs Chatbot
Botisimo
TwitchBot
```

### Hide Command Spam

[![](https://i.imgur.com/UXkrU4E.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) Content containing the words below will be removed from chat if the `Hide Commands` setting is active

```
!join
!gamble
!following
!followage
!links
!points
!hype
!uptime
!commands
!watchtime
!socials
!donate
!schedule
!vote
```

### View Removed Message History

[![](https://i.imgur.com/63glI6e.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) Click the settings cog to open the removed message history in a new tab

[![](https://i.imgur.com/AHfOIH1.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

### Download List

[![](https://i.imgur.com/qae1VAi.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/) You can download the list of content rules any time by clicking the download button in the pop-up window

---------

# How does it work

The extension works by injecting a `Mixin` to check messages as they arrive.

This is achieved by using a very durable `Regex` to find the location of the `messageProcessor` in `vendor.js`.

```js
CONFIG.REGEX.FRAGMENT: /([A-Za-z])\.messageProcessor\.processMessage\(([A-Za-z])\.data\)/
```

Once the `messageProcessor` has been found, it gets replaced with a `Mixin` that can securely communicate with the extension.

```js
export function createFragmentListener(matches) {
  return `new Promise((resolve) => {
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
      text: ${matches[2]}.data 
    });
  }, 'https://www.twitch.tv').then(response => {
    if(response === 'w'){ 
      ${matches[1]}.messageProcessor.processMessage(${matches[2]}.data)
    } else {
      console.warn('removed message:', ${matches[2]}.data);
    }
  });`;
}
```

Using a `Promise` this way creates a synchronous channel with the `Extension` through the `Content Script`.

This makes it possible to update the `Hidden Chat Content Rules` in real time instead of needing a page refresh.

# Settings

Additional settings and examples can be found in the `options` menu.

[![](https://i.imgur.com/D0bxVAX.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

# Debug Mode

In debug mode, the extension will start displaying messages in the console.

[![](https://i.imgur.com/Sv1urav.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

This information can be useful for creating rules or finding bugs.

[![](https://i.imgur.com/ddLFyJm.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

[![](https://i.imgur.com/bPuow86.png)](https://addons.mozilla.org/en-US/firefox/addon/block-twitch-content/)

# Self Healing

The `Mixin` makes use of the `Matches` from the `Regex` to self-heal when [`Twitch`](https://www.twitch.tv) updates.

```js
$1.messageProcessor.processMessage($2.data);
```