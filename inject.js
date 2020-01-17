var script = document.createElement('script');
var url = chrome.runtime.getURL("effect.js");
script.setAttribute('src', url);
script.setAttribute('type', 'text/javascript');
document.getElementsByTagName('head')[0].appendChild(script);
