'use strict';

self.onmessage = function (e) {
  var url, type, data, xhr;
 
  url = e.data.url;
  type = e.data.type;
  data = e.data.data;

  xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function (e) {
    if (xhr.readyState === xhr.DONE && xhr.status === 200) {
      self.postMessage(xhr.responseText);
    };
  };

  // TODO: deal with POST requests later on.
  xhr.open(type, url);
  xhr.send(data);
};
