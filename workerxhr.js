(function (workerxhr) {
  
  'use strict';

  function Emitter() {
    if (!(this instanceof Emitter)) {
      return new Emitter();
    }
    this.callbacks = {};
  };

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
    var worker, cached, that = this;
    opts = opts || {};

    opts.type = opts.type || 'GET';
    opts.data = opts.data || null;
    opts.workerPath = opts.workerPath || './';

    if (!!opts.url) {

      cached = localStorage.getItem(opts.url);

      if (!!cached) {
        this.emit('data', JSON.parse(cached));
      } else {
        worker = new Worker(opts.workerPath + 'workerxhr_worker.js');
        worker.onmessage = function (e) {
          if (!!e.data) {
            localStorage.setItem(opts.url, e.data);
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


  if (typeof exports === "object") {
    module.exports = workerxhr;
  } else if (typeof define === "function" && define.amd) {
    define(function() { return workerxhr; });
  } else {
    window['workerxhr'] = workerxhr;
  }
  
}(window.workerxhr));

