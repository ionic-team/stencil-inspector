import * as d from './declarations';

/**
 * Background Script has two roles:
 *   - intermediate discussions between all parts of the extension: injector, checker, scout
 *   - update the extension icon and title according to checker's result
 */
(() => {
  /** A map of opened tabs and the result of the checker */
  const tabsMap: d.TabsMap = {};

  /** A map of devtools connections and the corresponding port */
  const devToolsMap: d.InjectorsMap = {};

  /** Listen for connections from devTools */
  chrome.runtime.onConnect.addListener(port => {
    let inspectedTabId: number;

    const extensionListener = (message: d.Message<number>) => {
      const {
        source,
        data
      } = message;

      /** We make sure the message comes from the injector */
      if (source === 'stencil-inspector' && data && data.sender === 'injector') {
        const {
          type,
          value
        } = data;

        if (type === 'register') {
          inspectedTabId = value;

          devToolsMap[value] = port;

          /** Wait for checker before responding back */
          const intervalId = setInterval(() => {
            if (tabsMap.hasOwnProperty(inspectedTabId)) {
              clearInterval(intervalId);

              devToolsMap[inspectedTabId].postMessage({
                data: {
                  sender: 'background-page',
                  type: 'register',
                  value: tabsMap[inspectedTabId]
                },
                source: 'stencil-inspector'
              });
            }
          }, 0);
        } else if (type === 'unregister') {
          delete devToolsMap[value];
          delete tabsMap[value];
        }
      }

      return true;
    };

    port.onMessage.addListener(extensionListener);

    /** Remove the connection on disconnect */
    port.onDisconnect.addListener((port) => {
      port.onMessage.removeListener(extensionListener);

      const tabs = Object.keys(devToolsMap);

      for (let i = 0, len = tabs.length; i < len; i++) {
        if (devToolsMap[tabs[i]] === port) {
          delete devToolsMap[tabs[i]];

          break;
        }
      }
    });
  });

  /** Listen for messages from content script */
  chrome.runtime.onMessage.addListener((request: d.Message, sender) => {
    if (!sender.tab) {
      /** We don't do anything here */
    } else if (request && request.data && request.data.sender === 'checker') {
      /** Here we received the result of the initial check */
      tabsMap[sender.tab.id] = request.data.value;

      const suffix = tabsMap[sender.tab.id] ? '' : '-disabled';

      chrome.browserAction.setIcon({
        tabId: sender.tab.id,
        path: {
          16: `images/stencil-logo${suffix}-16x16.png`,
          48: `images/stencil-logo${suffix}-48x48.png`,
          128: `images/stencil-logo${suffix}-128x128.png`
        }
      });

      chrome.browserAction.setPopup({
        tabId: sender.tab.id,
        popup: tabsMap[sender.tab.id] ? 'enabled.html' : 'disabled.html'
      });
    } else {
      /** Redirect the message to the injector */
      const tabId = sender.tab.id;

      if (tabId in devToolsMap) {
        devToolsMap[tabId].postMessage(request);
      }
    }

    return true;
  });
})();
