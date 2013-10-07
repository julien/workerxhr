(function (workerxhr) {

  'use strict';

  function Emitter() {
    if (!(this instanceof Emitter)) {
      return new Emitter();
    }
    this.callbacks = {};
  }

  Emitter.prototype.on = function (event, fn) {
    (this.callbacks[event] = this.callbacks[event] || []).push(fn);
    return this;
  };

  Emitter.prototype.off = function (event, fn) {
    var index;
    if (this.callbacks[event]) {
      index = this.callbacks[event].indexOf(fn);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
    return this;
  };

  Emitter.prototype.emit = function (event) {
    var args = [].slice.call(arguments, 1),
      callbacks = this.callbacks[event],
      i, l;

    if (callbacks) {
      l = callbacks.length;
      for (i = 0; i < l; i += 1) {
        callbacks[i].apply(this, args);
      }
    }
    return this;
  };

  function xhrWorker() {
    var blob = new Blob([
      'self.onmessage = function (e) {\
        var url, type, data, xhr;\
        url = e.data.url;\
        type = e.data.type;\
        data = e.data.data;\
        xhr = new XMLHttpRequest();\
        xhr.onreadystatechange = function (e) {\
          if (xhr.readyState === xhr.DONE && xhr.status === 200) {\
            self.postMessage(xhr.responseText);\
          };\
        };\
        xhr.open(type, url);\
        xhr.send(data);\
      };']);

    return new Worker(window.URL.createObjectURL(blob));
  }

  function WorkerXhr(opts) {
    Emitter.call(this);

    opts = opts || {};
    if (!(this instanceof WorkerXhr)) {
      return new WorkerXhr(opts);
    }

    this.load(opts);
  }
  WorkerXhr.prototype = new Emitter();
  WorkerXhr.prototype.constructor = WorkerXhr;

  WorkerXhr.prototype.load = function (opts) {
    var worker, key, cached, that = this;
    opts = opts || {};

    opts.type = opts.type || 'GET';
    opts.data = opts.data || null;

    // other settings

    if (!!opts.url) {
      key = opts.url.match(/\w+\.\w+$/).join().replace(/\./, '-');

      cached = localStorage.getItem(key);

      if (!!cached && !opts.force) {
        this.emit('data', JSON.parse(cached));
      } else {
        // worker = new Worker(opts.workerPath + 'workerxhr_worker.js');
        worker = xhrWorker();
        worker.onmessage = function (e) {
          if (!!e.data) {
            localStorage.setItem(key, e.data);
            that.emit('data', JSON.parse(e.data));
          }
        };
        worker.onerror = function (e) {
          that.emit('error', e);
        };
        worker.postMessage(opts);
      }
    }
  };

  workerxhr = workerxhr || new WorkerXhr();


  if (typeof exports === 'object') {
    module.exports = workerxhr;
  } else if (typeof define === 'function' && define.amd) {
    define(function () { return workerxhr; });
  } else {
    window['workerxhr'] = workerxhr;
  }

}(window.workerxhr));


