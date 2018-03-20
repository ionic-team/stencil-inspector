import { Message } from './declarations';

/**
 * Content script is called by the browser for each page that loads.
 * It has the role to inject the checker in the page and redirect
 * the messages received from injected scripts to the background page.
 */

(() => {
  /** Listen for messages from checker and scout */
  window.addEventListener('message', event => {
    /** Prevent messages from other frames */
    if (event.source !== window) {
      return;
    }

    const message: Message = event.data;

    /** Prevent handling of unwanted messages */
    if (typeof message !== 'object' || message === null || !(message.source === 'stencil-inspector')
    ) {
      return;
    }

    /** Send the message to the background script */
    chrome.runtime.sendMessage(message);
  });

  /** Inject the checker */
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = chrome.runtime.getURL('helpers/checker.js');

  if (document.body && (document as any).contentType !== 'application/pdf') {
    document.body.appendChild(script);

    script.onload = () => {
      document.body.removeChild(script);
    };
  }
})();
