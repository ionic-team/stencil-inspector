/**
 * Checker is a script which is injected by the content script after the page loads.
 * It's role is to check if the current page is powered by Stencil and if it runs in dev mode.
 */

(() => {
  const pageLoadedHandler = () => {
    document.removeEventListener('DOMContentLoaded', pageLoadedHandler, false);
    window.removeEventListener('load', pageLoadedHandler, false);

    window.postMessage({
      data: {
        sender: 'checker',
        type: 'check',
        value: window.hasOwnProperty('devInspector')
      },
      source: 'stencil-inspector'
    }, '*');
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(pageLoadedHandler);
  } else {
    document.addEventListener('DOMContentLoaded', pageLoadedHandler, false);
    window.addEventListener('load', pageLoadedHandler, false);
  }
})();
