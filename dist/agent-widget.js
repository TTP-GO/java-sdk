(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("react"));
	else if(typeof define === 'function' && define.amd)
		define(["react"], factory);
	else if(typeof exports === 'object')
		exports["TTPAgentSDK"] = factory(require("react"));
	else
		root["TTPAgentSDK"] = factory(root["React"]);
})(this, (__WEBPACK_EXTERNAL_MODULE_react__) => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/core/AudioPlayer.js":
/*!*********************************!*\
  !*** ./src/core/AudioPlayer.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AudioPlayer)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * AudioPlayer - Handles audio playback with queue system
 */

var AudioPlayer = /*#__PURE__*/function (_EventEmitter) {
  function AudioPlayer(config) {
    var _this;
    _classCallCheck(this, AudioPlayer);
    _this = _callSuper(this, AudioPlayer);
    _this.config = config;
    _this.audioContext = null;
    _this.audioQueue = [];
    _this.isPlaying = false;
    _this.isProcessingQueue = false;
    _this.currentSource = null;
    return _this;
  }

  /**
   * Add audio data to playback queue
   */
  _inherits(AudioPlayer, _EventEmitter);
  return _createClass(AudioPlayer, [{
    key: "playAudio",
    value: function playAudio(audioData) {
      var _this2 = this;
      try {
        var audioBlob = this.createAudioBlob(audioData);
        this.audioQueue.push(audioBlob);

        // Process queue if not already playing or processing
        if (!this.isPlaying && !this.isProcessingQueue) {
          setTimeout(function () {
            return _this2.processQueue();
          }, 50);
        }
      } catch (error) {
        this.emit('playbackError', error);
      }
    }

    /**
     * Create audio blob from ArrayBuffer
     */
  }, {
    key: "createAudioBlob",
    value: function createAudioBlob(arrayBuffer) {
      var uint8Array = new Uint8Array(arrayBuffer);

      // Detect audio format
      if (uint8Array.length >= 4) {
        // WAV header (RIFF)
        if (uint8Array[0] === 0x52 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 && uint8Array[3] === 0x46) {
          return new Blob([arrayBuffer], {
            type: 'audio/wav'
          });
        }

        // MP3 header
        if (uint8Array[0] === 0xFF && (uint8Array[1] & 0xE0) === 0xE0) {
          return new Blob([arrayBuffer], {
            type: 'audio/mpeg'
          });
        }

        // OGG header
        if (uint8Array[0] === 0x4F && uint8Array[1] === 0x67 && uint8Array[2] === 0x67 && uint8Array[3] === 0x53) {
          return new Blob([arrayBuffer], {
            type: 'audio/ogg'
          });
        }
      }

      // Default to WAV format
      return new Blob([arrayBuffer], {
        type: 'audio/wav'
      });
    }

    /**
     * Process audio queue
     */
  }, {
    key: "processQueue",
    value: (function () {
      var _processQueue = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _this3 = this;
        var audioBlob, audioContext, arrayBuffer, audioBuffer, source, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!(this.isProcessingQueue || this.isPlaying || this.audioQueue.length === 0)) {
                _context.n = 1;
                break;
              }
              return _context.a(2);
            case 1:
              this.isProcessingQueue = true;
              audioBlob = this.audioQueue.shift();
              if (audioBlob) {
                _context.n = 2;
                break;
              }
              this.isProcessingQueue = false;
              return _context.a(2);
            case 2:
              _context.p = 2;
              this.isPlaying = true;
              this.emit('playbackStarted');

              // Create AudioContext if not exists
              if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
              }
              audioContext = this.audioContext; // Resume AudioContext if suspended
              if (!(audioContext.state === 'suspended')) {
                _context.n = 3;
                break;
              }
              _context.n = 3;
              return audioContext.resume();
            case 3:
              _context.n = 4;
              return audioBlob.arrayBuffer();
            case 4:
              arrayBuffer = _context.v;
              _context.n = 5;
              return audioContext.decodeAudioData(arrayBuffer);
            case 5:
              audioBuffer = _context.v;
              source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              this.currentSource = source;

              // Handle audio end
              source.onended = function () {
                _this3.isPlaying = false;
                _this3.isProcessingQueue = false;
                _this3.currentSource = null;
                _this3.emit('playbackStopped');

                // Process next audio in queue if there are more items
                if (_this3.audioQueue.length > 0) {
                  setTimeout(function () {
                    return _this3.processQueue();
                  }, 100);
                }
              };

              // Start playback
              source.start();
              _context.n = 7;
              break;
            case 6:
              _context.p = 6;
              _t = _context.v;
              this.isPlaying = false;
              this.isProcessingQueue = false;
              this.currentSource = null;
              this.emit('playbackError', _t);

              // Try to process next audio in queue if there are more items
              if (this.audioQueue.length > 0) {
                setTimeout(function () {
                  return _this3.processQueue();
                }, 100);
              }
            case 7:
              return _context.a(2);
          }
        }, _callee, this, [[2, 6]]);
      }));
      function processQueue() {
        return _processQueue.apply(this, arguments);
      }
      return processQueue;
    }()
    /**
     * Stop current playback and clear queue
     */
    )
  }, {
    key: "stop",
    value: function stop() {
      this.stopImmediate();
    }

    /**
     * Stop current playback immediately and clear queue
     */
  }, {
    key: "stopImmediate",
    value: function stopImmediate() {
      if (this.currentSource) {
        try {
          this.currentSource.stop();
        } catch (error) {
          // Ignore errors when stopping
        }
        this.currentSource = null;
      }
      this.isPlaying = false;
      this.isProcessingQueue = false;
      this.audioQueue = [];
      this.emit('playbackStopped');
    }

    /**
     * Get playback status
     */
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isPlaying: this.isPlaying,
        isProcessingQueue: this.isProcessingQueue,
        queueLength: this.audioQueue.length,
        audioContextState: this.audioContext ? this.audioContext.state : 'closed'
      };
    }

    /**
     * Cleanup resources
     */
  }, {
    key: "destroy",
    value: function destroy() {
      this.stop();
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
        this.audioContext = null;
      }
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/core/AudioRecorder.js":
/*!***********************************!*\
  !*** ./src/core/AudioRecorder.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AudioRecorder)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * AudioRecorder - Handles audio recording using AudioWorklet
 */

var AudioRecorder = /*#__PURE__*/function (_EventEmitter) {
  function AudioRecorder(config) {
    var _this;
    _classCallCheck(this, AudioRecorder);
    _this = _callSuper(this, AudioRecorder);
    _this.config = config;
    _this.audioContext = null;
    _this.audioWorkletNode = null;
    _this.mediaStream = null;
    _this.isRecording = false;
    return _this;
  }

  /**
   * Start audio recording
   */
  _inherits(AudioRecorder, _EventEmitter);
  return _createClass(AudioRecorder, [{
    key: "start",
    value: (function () {
      var _start = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _this2 = this;
        var source, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              _context.n = 1;
              return navigator.mediaDevices.getUserMedia({
                audio: {
                  sampleRate: this.config.sampleRate,
                  channelCount: 1,
                  echoCancellation: true,
                  noiseSuppression: true,
                  autoGainControl: true
                }
              });
            case 1:
              this.mediaStream = _context.v;
              // Create AudioContext
              this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.config.sampleRate
              });

              // Resume AudioContext if suspended
              if (!(this.audioContext.state === 'suspended')) {
                _context.n = 2;
                break;
              }
              _context.n = 2;
              return this.audioContext.resume();
            case 2:
              _context.n = 3;
              return this.audioContext.audioWorklet.addModule('/audio-processor.js');
            case 3:
              // Create AudioWorklet node
              this.audioWorkletNode = new AudioWorkletNode(this.audioContext, 'audio-processor');

              // Create media stream source
              source = this.audioContext.createMediaStreamSource(this.mediaStream);
              source.connect(this.audioWorkletNode);

              // Handle messages from AudioWorklet
              this.audioWorkletNode.port.onmessage = function (event) {
                var _event$data = event.data,
                  type = _event$data.type,
                  data = _event$data.data;
                if (type === 'pcm_audio_data') {
                  _this2.emit('audioData', data);
                }
              };

              // Enable continuous mode
              this.audioWorkletNode.port.postMessage({
                type: 'setForceContinuous',
                data: {
                  enabled: true
                }
              });
              this.isRecording = true;
              this.emit('recordingStarted');
              _context.n = 5;
              break;
            case 4:
              _context.p = 4;
              _t = _context.v;
              this.emit('error', _t);
              throw _t;
            case 5:
              return _context.a(2);
          }
        }, _callee, this, [[0, 4]]);
      }));
      function start() {
        return _start.apply(this, arguments);
      }
      return start;
    }()
    /**
     * Stop audio recording
     */
    )
  }, {
    key: "stop",
    value: (function () {
      var _stop = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              if (this.isRecording) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              _context2.p = 1;
              if (!this.audioWorkletNode) {
                _context2.n = 2;
                break;
              }
              this.audioWorkletNode.port.postMessage({
                type: 'flush'
              });
              _context2.n = 2;
              return new Promise(function (resolve) {
                return setTimeout(resolve, 100);
              });
            case 2:
              // Disconnect and cleanup
              if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(function (track) {
                  return track.stop();
                });
                this.mediaStream = null;
              }
              if (!(this.audioContext && this.audioContext.state !== 'closed')) {
                _context2.n = 4;
                break;
              }
              _context2.n = 3;
              return this.audioContext.close();
            case 3:
              this.audioContext = null;
            case 4:
              this.audioWorkletNode = null;
              this.isRecording = false;
              this.emit('recordingStopped');
              _context2.n = 6;
              break;
            case 5:
              _context2.p = 5;
              _t2 = _context2.v;
              this.emit('error', _t2);
              throw _t2;
            case 6:
              return _context2.a(2);
          }
        }, _callee2, this, [[1, 5]]);
      }));
      function stop() {
        return _stop.apply(this, arguments);
      }
      return stop;
    }()
    /**
     * Get recording status
     */
    )
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isRecording: this.isRecording,
        audioContextState: this.audioContext ? this.audioContext.state : 'closed'
      };
    }

    /**
     * Cleanup resources
     */
  }, {
    key: "destroy",
    value: function destroy() {
      this.stop();
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/core/ConnectionManager.js":
/*!***************************************!*\
  !*** ./src/core/ConnectionManager.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * ConnectionManager - Global connection manager to prevent multiple connections to the same URL
 */
var ConnectionManager = /*#__PURE__*/function () {
  function ConnectionManager() {
    _classCallCheck(this, ConnectionManager);
    this.connections = new Map(); // Map of URL -> connection info
  }

  /**
   * Register a connection attempt
   */
  return _createClass(ConnectionManager, [{
    key: "registerConnection",
    value: function registerConnection(url, connectionId) {
      if (!this.connections.has(url)) {
        this.connections.set(url, {
          connectionId: connectionId,
          timestamp: Date.now(),
          count: 1
        });
        console.log("\uD83D\uDD0C ConnectionManager: Registered connection ".concat(connectionId, " for ").concat(url));
        return true;
      }
      var existing = this.connections.get(url);
      var timeSinceLastConnection = Date.now() - existing.timestamp;

      // If it's been more than 30 seconds since the last connection, allow it
      if (timeSinceLastConnection > 30000) {
        this.connections.set(url, {
          connectionId: connectionId,
          timestamp: Date.now(),
          count: 1
        });
        console.log("\uD83D\uDD0C ConnectionManager: Allowed new connection ".concat(connectionId, " for ").concat(url, " (old connection was ").concat(timeSinceLastConnection, "ms ago)"));
        return true;
      }

      // Otherwise, prevent the connection
      existing.count++;
      console.log("\uD83D\uDD0C ConnectionManager: Blocked connection ".concat(connectionId, " for ").concat(url, " (").concat(existing.count, " attempts in ").concat(timeSinceLastConnection, "ms)"));
      return false;
    }

    /**
     * Unregister a connection
     */
  }, {
    key: "unregisterConnection",
    value: function unregisterConnection(url, connectionId) {
      var existing = this.connections.get(url);
      if (existing && existing.connectionId === connectionId) {
        this.connections.delete(url);
        console.log("\uD83D\uDD0C ConnectionManager: Unregistered connection ".concat(connectionId, " for ").concat(url));
      }
    }

    /**
     * Check if a connection is allowed
     */
  }, {
    key: "isConnectionAllowed",
    value: function isConnectionAllowed(url) {
      var existing = this.connections.get(url);
      if (!existing) {
        return true;
      }
      var timeSinceLastConnection = Date.now() - existing.timestamp;
      return timeSinceLastConnection > 30000; // Allow if more than 30 seconds ago
    }

    /**
     * Get connection info
     */
  }, {
    key: "getConnectionInfo",
    value: function getConnectionInfo(url) {
      return this.connections.get(url);
    }

    /**
     * Clear all connections (useful for testing)
     */
  }, {
    key: "clearAll",
    value: function clearAll() {
      this.connections.clear();
      console.log('🔌 ConnectionManager: Cleared all connections');
    }
  }]);
}(); // Global instance
var connectionManager = new ConnectionManager();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (connectionManager);

/***/ }),

/***/ "./src/core/EventEmitter.js":
/*!**********************************!*\
  !*** ./src/core/EventEmitter.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ EventEmitter)
/* harmony export */ });
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * EventEmitter - Simple event system for the VoiceSDK
 */
var EventEmitter = /*#__PURE__*/function () {
  function EventEmitter() {
    _classCallCheck(this, EventEmitter);
    this.events = {};
  }

  /**
   * Add event listener
   */
  return _createClass(EventEmitter, [{
    key: "on",
    value: function on(event, callback) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(callback);
    }

    /**
     * Remove event listener
     */
  }, {
    key: "off",
    value: function off(event, callback) {
      if (!this.events[event]) return;
      this.events[event] = this.events[event].filter(function (cb) {
        return cb !== callback;
      });
    }

    /**
     * Emit event
     */
  }, {
    key: "emit",
    value: function emit(event) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }
      if (!this.events[event]) return;
      this.events[event].forEach(function (callback) {
        try {
          callback.apply(void 0, args);
        } catch (error) {
          console.error("Error in event listener for ".concat(event, ":"), error);
        }
      });
    }

    /**
     * Remove all listeners for an event
     */
  }, {
    key: "removeAllListeners",
    value: function removeAllListeners(event) {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
      }
    }
  }]);
}();


/***/ }),

/***/ "./src/core/VoiceSDK.js":
/*!******************************!*\
  !*** ./src/core/VoiceSDK.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ VoiceSDK)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
/* harmony import */ var _WebSocketManagerV2_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./WebSocketManagerV2.js */ "./src/core/WebSocketManagerV2.js");
/* harmony import */ var _AudioRecorder_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./AudioRecorder.js */ "./src/core/AudioRecorder.js");
/* harmony import */ var _AudioPlayer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./AudioPlayer.js */ "./src/core/AudioPlayer.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * VoiceSDK - Core voice interaction SDK
 * Handles WebSocket connection, audio recording, and audio playback
 */




var VoiceSDK = /*#__PURE__*/function (_EventEmitter) {
  function VoiceSDK() {
    var _this;
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, VoiceSDK);
    _this = _callSuper(this, VoiceSDK);

    // Configuration
    _this.config = _objectSpread({
      websocketUrl: config.websocketUrl || 'wss://speech.bidme.co.il/ws/conv',
      agentId: config.agentId,
      // Optional - for direct agent access (unsecured method)
      appId: config.appId,
      // User's app ID for authentication
      ttpId: config.ttpId,
      // Optional - custom TTP ID (fallback if appId not provided)
      voice: config.voice || 'default',
      language: config.language || 'en',
      sampleRate: config.sampleRate || 16000
    }, config);

    // State
    _this.isConnected = false;
    _this.isRecording = false;
    _this.isPlaying = false;
    _this.isDestroyed = false;

    // Components
    _this.webSocketManager = new _WebSocketManagerV2_js__WEBPACK_IMPORTED_MODULE_1__["default"](_objectSpread(_objectSpread({}, _this.config), {}, {
      autoReconnect: _this.config.autoReconnect !== false // Default to true unless explicitly disabled
    }));
    _this.audioRecorder = new _AudioRecorder_js__WEBPACK_IMPORTED_MODULE_2__["default"](_this.config);
    _this.audioPlayer = new _AudioPlayer_js__WEBPACK_IMPORTED_MODULE_3__["default"](_this.config);

    // Bind event handlers
    _this.setupEventHandlers();
    return _this;
  }

  /**
   * Setup event handlers for all components
   */
  _inherits(VoiceSDK, _EventEmitter);
  return _createClass(VoiceSDK, [{
    key: "setupEventHandlers",
    value: function setupEventHandlers() {
      var _this2 = this;
      // WebSocket events
      this.webSocketManager.on('connected', function () {
        _this2.isConnected = true;
        _this2.sendHelloMessage();
        _this2.emit('connected');
      });
      this.webSocketManager.on('disconnected', function () {
        _this2.isConnected = false;
        _this2.emit('disconnected');
      });
      this.webSocketManager.on('error', function (error) {
        _this2.emit('error', error);
      });
      this.webSocketManager.on('message', function (message) {
        _this2.emit('message', message);
      });
      this.webSocketManager.on('binaryAudio', function (audioData) {
        _this2.audioPlayer.playAudio(audioData);
      });
      this.webSocketManager.on('bargeIn', function (message) {
        _this2.emit('bargeIn', message);
      });
      this.webSocketManager.on('stopPlaying', function (message) {
        _this2.emit('stopPlaying', message);
        // Immediately stop all audio playback
        _this2.audioPlayer.stopImmediate();
      });

      // Audio recorder events
      this.audioRecorder.on('recordingStarted', function () {
        _this2.isRecording = true;
        _this2.emit('recordingStarted');
      });
      this.audioRecorder.on('recordingStopped', function () {
        _this2.isRecording = false;
        _this2.emit('recordingStopped');
      });
      this.audioRecorder.on('audioData', function (audioData) {
        if (_this2.isConnected) {
          _this2.webSocketManager.sendBinary(audioData);
        }
      });

      // Audio player events
      this.audioPlayer.on('playbackStarted', function () {
        _this2.isPlaying = true;
        _this2.emit('playbackStarted');
      });
      this.audioPlayer.on('playbackStopped', function () {
        _this2.isPlaying = false;
        _this2.emit('playbackStopped');
      });
      this.audioPlayer.on('playbackError', function (error) {
        _this2.emit('playbackError', error);
      });
    }

    /**
     * Connect to the voice server
     */
  }, {
    key: "connect",
    value: (function () {
      var _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var wsUrl, _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              if (!this.isDestroyed) {
                _context.n = 1;
                break;
              }
              return _context.a(2, false);
            case 1:
              _context.p = 1;
              // Build WebSocket URL with query parameters if needed
              wsUrl = this.buildWebSocketUrl();
              console.log('VoiceSDK: Using WebSocket URL:', wsUrl);

              // Update the WebSocket manager with the URL that includes query parameters
              this.webSocketManager.config.websocketUrl = wsUrl;
              _context.n = 2;
              return this.webSocketManager.connect();
            case 2:
              return _context.a(2, true);
            case 3:
              _context.p = 3;
              _t = _context.v;
              this.emit('error', _t);
              return _context.a(2, false);
          }
        }, _callee, this, [[1, 3]]);
      }));
      function connect() {
        return _connect.apply(this, arguments);
      }
      return connect;
    }()
    /**
     * Build WebSocket URL with query parameters for authentication
     */
    )
  }, {
    key: "buildWebSocketUrl",
    value: function buildWebSocketUrl() {
      var url = this.config.websocketUrl;
      var params = new URLSearchParams();

      // Add agentId as query parameter if provided
      if (this.config.agentId) {
        params.append('agentId', this.config.agentId);
        console.log('VoiceSDK: Adding agentId to URL:', this.config.agentId);
      }

      // Add appId as query parameter if provided
      if (this.config.appId) {
        params.append('appId', this.config.appId);
        console.log('VoiceSDK: Adding appId to URL:', this.config.appId);
      }

      // Add other parameters if needed
      if (this.config.voice && this.config.voice !== 'default') {
        params.append('voice', this.config.voice);
      }
      if (this.config.language && this.config.language !== 'en') {
        params.append('language', this.config.language);
      }

      // Append query parameters to URL if any exist
      if (params.toString()) {
        var separator = url.includes('?') ? '&' : '?';
        url += separator + params.toString();
      }
      return url;
    }

    /**
     * Disconnect from the voice server
     */
  }, {
    key: "disconnect",
    value: function disconnect() {
      if (this.isDestroyed) {
        console.log("\uD83C\uDF99\uFE0F VoiceSDK: Disconnect called but already destroyed");
        return; // Prevent disconnect after destroy
      }
      console.log("\uD83C\uDF99\uFE0F VoiceSDK: Disconnecting from voice server");
      this.stopRecording();
      this.webSocketManager.disconnect();
    }

    /**
     * Reset reconnection attempts (useful for manual reconnection)
     */
  }, {
    key: "resetReconnectionAttempts",
    value: function resetReconnectionAttempts() {
      if (this.isDestroyed) {
        return;
      }
      this.webSocketManager.resetReconnectionAttempts();
    }

    /**
     * Manually reconnect to the voice server
     */
  }, {
    key: "reconnect",
    value: (function () {
      var _reconnect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              if (!this.isDestroyed) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2, false);
            case 1:
              this.disconnect();
              this.resetReconnectionAttempts();
              _context2.n = 2;
              return this.connect();
            case 2:
              return _context2.a(2, _context2.v);
          }
        }, _callee2, this);
      }));
      function reconnect() {
        return _reconnect.apply(this, arguments);
      }
      return reconnect;
    }()
    /**
     * Start voice recording and streaming
     */
    )
  }, {
    key: "startRecording",
    value: (function () {
      var _startRecording = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              if (this.isConnected) {
                _context3.n = 1;
                break;
              }
              throw new Error('Not connected to voice server');
            case 1:
              _context3.p = 1;
              // Send start continuous mode message
              this.webSocketManager.sendMessage({
                t: 'start_continuous_mode',
                ttpId: this.generateTtpId(),
                voice: this.config.voice,
                language: this.config.language
              });

              // Start audio recording
              _context3.n = 2;
              return this.audioRecorder.start();
            case 2:
              return _context3.a(2, true);
            case 3:
              _context3.p = 3;
              _t2 = _context3.v;
              this.emit('error', _t2);
              return _context3.a(2, false);
          }
        }, _callee3, this, [[1, 3]]);
      }));
      function startRecording() {
        return _startRecording.apply(this, arguments);
      }
      return startRecording;
    }()
    /**
     * Stop voice recording and streaming
     */
    )
  }, {
    key: "stopRecording",
    value: (function () {
      var _stopRecording = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var _t3;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.p = _context4.n) {
            case 0:
              if (this.isRecording) {
                _context4.n = 1;
                break;
              }
              return _context4.a(2);
            case 1:
              _context4.p = 1;
              // Send stop continuous mode message
              this.webSocketManager.sendMessage({
                t: 'stop_continuous_mode',
                ttpId: this.generateTtpId()
              });

              // Stop audio recording
              _context4.n = 2;
              return this.audioRecorder.stop();
            case 2:
              // Stop audio playback immediately when stopping recording
              this.audioPlayer.stopImmediate();
              return _context4.a(2, true);
            case 3:
              _context4.p = 3;
              _t3 = _context4.v;
              this.emit('error', _t3);
              return _context4.a(2, false);
          }
        }, _callee4, this, [[1, 3]]);
      }));
      function stopRecording() {
        return _stopRecording.apply(this, arguments);
      }
      return stopRecording;
    }()
    /**
     * Toggle recording state
     */
    )
  }, {
    key: "toggleRecording",
    value: (function () {
      var _toggleRecording = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
        return _regenerator().w(function (_context5) {
          while (1) switch (_context5.n) {
            case 0:
              if (!this.isRecording) {
                _context5.n = 2;
                break;
              }
              _context5.n = 1;
              return this.stopRecording();
            case 1:
              return _context5.a(2, _context5.v);
            case 2:
              _context5.n = 3;
              return this.startRecording();
            case 3:
              return _context5.a(2, _context5.v);
            case 4:
              return _context5.a(2);
          }
        }, _callee5, this);
      }));
      function toggleRecording() {
        return _toggleRecording.apply(this, arguments);
      }
      return toggleRecording;
    }()
    /**
     * Stop audio playback immediately (for barge-in scenarios)
     */
    )
  }, {
    key: "stopAudioPlayback",
    value: function stopAudioPlayback() {
      this.audioPlayer.stopImmediate();
    }

    /**
     * Handle barge-in (user starts speaking while audio is playing)
     */
  }, {
    key: "handleBargeIn",
    value: (function () {
      var _handleBargeIn = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
        return _regenerator().w(function (_context6) {
          while (1) switch (_context6.n) {
            case 0:
              // Stop current audio playback immediately
              this.stopAudioPlayback();

              // If not already recording, start recording
              if (this.isRecording) {
                _context6.n = 1;
                break;
              }
              _context6.n = 1;
              return this.startRecording();
            case 1:
              return _context6.a(2);
          }
        }, _callee6, this);
      }));
      function handleBargeIn() {
        return _handleBargeIn.apply(this, arguments);
      }
      return handleBargeIn;
    }()
    /**
     * Get current connection status
     */
    )
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isConnected: this.isConnected,
        isRecording: this.isRecording,
        isPlaying: this.isPlaying
      };
    }

    /**
     * Update configuration
     */
  }, {
    key: "updateConfig",
    value: function updateConfig(newConfig) {
      this.config = _objectSpread(_objectSpread({}, this.config), newConfig);
    }

    /**
     * Generate unique TTP ID
     */
  }, {
    key: "generateTtpId",
    value: function generateTtpId() {
      return 'sdk_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    /**
     * Send hello message with appropriate authentication
     */
  }, {
    key: "sendHelloMessage",
    value: function sendHelloMessage() {
      if (!this.isConnected) {
        console.warn('VoiceSDK: Cannot send hello message - not connected');
        return;
      }
      var helloMessage = {
        t: "hello"
      };

      // Use app ID for authentication (preferred method)
      if (this.config.appId) {
        helloMessage.appId = this.config.appId;
        console.log('VoiceSDK: Sending hello message with appId (app-based authentication)');
      } else if (this.config.ttpId) {
        // Fallback to custom TTP ID if app ID not provided
        helloMessage.ttpId = this.config.ttpId;
        console.log('VoiceSDK: Sending hello message with custom TTP ID (fallback method)');
      } else {
        // Generate TTP ID as last resort
        helloMessage.ttpId = this.generateTtpId();
        console.log('VoiceSDK: Sending hello message with generated TTP ID (last resort)');
      }

      // Note: agentId is now sent as query parameter in WebSocket URL, not in hello message

      // Log authentication method for debugging
      if (this.config.appId) {
        console.log('VoiceSDK: Using app ID for authentication:', this.config.appId);
      } else if (this.config.ttpId) {
        console.log('VoiceSDK: Using custom TTP ID:', this.config.ttpId);
      } else {
        console.log('VoiceSDK: Using generated TTP ID:', helloMessage.ttpId);
      }
      try {
        this.webSocketManager.sendMessage(helloMessage);
        console.log('VoiceSDK: Hello message sent:', helloMessage);
      } catch (error) {
        console.error('VoiceSDK: Failed to send hello message:', error);
        this.emit('error', error);
      }
    }

    /**
     * Cleanup resources
     */
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.isDestroyed) {
        console.log("\uD83C\uDF99\uFE0F VoiceSDK: Destroy called but already destroyed");
        return; // Prevent multiple destroy calls
      }
      console.log("\uD83C\uDF99\uFE0F VoiceSDK: Destroying VoiceSDK instance");

      // Disconnect first, before setting isDestroyed
      this.disconnect();
      this.isDestroyed = true;
      this.audioRecorder.destroy();
      this.audioPlayer.destroy();
      this.removeAllListeners();
      console.log("\uD83C\uDF99\uFE0F VoiceSDK: VoiceSDK instance destroyed");
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/core/WebSocketManager.js":
/*!**************************************!*\
  !*** ./src/core/WebSocketManager.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ WebSocketManager)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
/* harmony import */ var _ConnectionManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ConnectionManager.js */ "./src/core/ConnectionManager.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * WebSocketManager - Handles WebSocket connection and message routing
 */


var WebSocketManager = /*#__PURE__*/function (_EventEmitter) {
  function WebSocketManager(config) {
    var _this;
    _classCallCheck(this, WebSocketManager);
    _this = _callSuper(this, WebSocketManager);
    _this.config = config;
    _this.ws = null;
    _this.isConnected = false;
    _this.reconnectAttempts = 0;
    _this.maxReconnectAttempts = config.autoReconnect !== false ? 3 : 0; // Disable auto-reconnect if explicitly set to false
    _this.isReconnecting = false;
    _this.isConnecting = false; // Track if we're currently trying to connect
    _this.connectionId = null; // Unique ID for this connection attempt
    return _this;
  }

  /**
   * Connect to WebSocket
   */
  _inherits(WebSocketManager, _EventEmitter);
  return _createClass(WebSocketManager, [{
    key: "connect",
    value: (function () {
      var _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _this2 = this;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              return _context.a(2, new Promise(function (resolve, reject) {
                try {
                  // Prevent multiple connections
                  if (_this2.ws && (_this2.ws.readyState === WebSocket.CONNECTING || _this2.ws.readyState === WebSocket.OPEN)) {
                    resolve();
                    return;
                  }

                  // Prevent connection if already reconnecting
                  if (_this2.isReconnecting) {
                    resolve();
                    return;
                  }

                  // Prevent connection if already connecting
                  if (_this2.isConnecting) {
                    resolve();
                    return;
                  }

                  // Check if connection is allowed by global manager
                  if (!_ConnectionManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].isConnectionAllowed(_this2.config.websocketUrl)) {
                    console.log("\uD83D\uDD0C WebSocketManager: Connection blocked by global manager for ".concat(_this2.config.websocketUrl));
                    resolve();
                    return;
                  }
                  _this2.isConnecting = true;
                  _this2.connectionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);

                  // Register with global connection manager
                  if (!_ConnectionManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].registerConnection(_this2.config.websocketUrl, _this2.connectionId)) {
                    console.log("\uD83D\uDD0C WebSocketManager: Connection registration failed for ".concat(_this2.connectionId));
                    _this2.isConnecting = false;
                    resolve();
                    return;
                  }
                  console.log("\uD83D\uDD0C WebSocketManager: Starting connection attempt ".concat(_this2.connectionId));
                  _this2.ws = new WebSocket(_this2.config.websocketUrl);
                  _this2.ws.onopen = function () {
                    console.log("\uD83D\uDD0C WebSocketManager: Connection successful ".concat(_this2.connectionId));
                    _this2.isConnected = true;
                    _this2.reconnectAttempts = 0;
                    _this2.isReconnecting = false;
                    _this2.isConnecting = false;
                    _this2.emit('connected');
                    resolve();
                  };
                  _this2.ws.onmessage = function (event) {
                    _this2.handleMessage(event);
                  };
                  _this2.ws.onclose = function (event) {
                    console.log("\uD83D\uDD0C WebSocketManager: Connection closed ".concat(_this2.connectionId, " (Code: ").concat(event.code, ")"));
                    _this2.isConnected = false;
                    _this2.isConnecting = false;
                    _this2.emit('disconnected', event);

                    // Attempt reconnection if not intentional and not already reconnecting
                    if (event.code !== 1000 && _this2.reconnectAttempts < _this2.maxReconnectAttempts && !_this2.isReconnecting) {
                      _this2.isReconnecting = true;
                      _this2.reconnectAttempts++;
                      console.log("\uD83D\uDD0C WebSocketManager: Attempting reconnection ".concat(_this2.reconnectAttempts, "/").concat(_this2.maxReconnectAttempts));
                      setTimeout(function () {
                        _this2.isReconnecting = false;
                        _this2.connect().catch(function () {
                          // Ignore reconnection errors to prevent infinite loops
                        });
                      }, 1000 * _this2.reconnectAttempts);
                    }
                  };
                  _this2.ws.onerror = function (error) {
                    console.log("\uD83D\uDD0C WebSocketManager: Connection error ".concat(_this2.connectionId), error);
                    _this2.isConnecting = false;
                    _this2.emit('error', error);
                    reject(error);
                  };
                } catch (error) {
                  console.log("\uD83D\uDD0C WebSocketManager: Connection failed ".concat(_this2.connectionId), error);
                  _this2.isConnecting = false;
                  reject(error);
                }
              }));
          }
        }, _callee);
      }));
      function connect() {
        return _connect.apply(this, arguments);
      }
      return connect;
    }()
    /**
     * Disconnect from WebSocket
     */
    )
  }, {
    key: "disconnect",
    value: function disconnect() {
      // Stop any reconnection attempts
      this.isReconnecting = false;
      this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection

      // Unregister from global connection manager
      if (this.connectionId) {
        _ConnectionManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].unregisterConnection(this.config.websocketUrl, this.connectionId);
      }
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Intentional disconnect');
      }
      this.ws = null;
      this.isConnected = false;
      this.isConnecting = false;
    }

    /**
     * Reset reconnection attempts (useful for manual reconnection)
     */
  }, {
    key: "resetReconnectionAttempts",
    value: function resetReconnectionAttempts() {
      this.reconnectAttempts = 0;
      this.isReconnecting = false;
    }

    /**
     * Clear all global connections (useful for testing)
     */
  }, {
    key: "sendMessage",
    value:
    /**
     * Send JSON message
     */
    function sendMessage(message) {
      if (!this.isConnected || !this.ws) {
        throw new Error('WebSocket not connected');
      }
      this.ws.send(JSON.stringify(message));
    }

    /**
     * Send binary data
     */
  }, {
    key: "sendBinary",
    value: function sendBinary(data) {
      if (!this.isConnected || !this.ws) {
        throw new Error('WebSocket not connected');
      }
      this.ws.send(data);
    }

    /**
     * Handle incoming WebSocket messages
     */
  }, {
    key: "handleMessage",
    value: function handleMessage(event) {
      var _this3 = this;
      // Check if it's binary data first
      if (event.data instanceof ArrayBuffer) {
        this.emit('binaryAudio', event.data);
        return;
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(function (arrayBuffer) {
          _this3.emit('binaryAudio', arrayBuffer);
        }).catch(function (err) {
          _this3.emit('error', err);
        });
        return;
      }

      // Handle JSON messages
      try {
        var message = JSON.parse(event.data);

        // Handle barge-in related messages
        if (message.t === 'barge_in_ack' || message.t === 'stop_sending') {
          this.emit('bargeIn', message);
        }

        // Handle stop playing message
        if (message.t === 'stop_playing') {
          this.emit('stopPlaying', message);
        }
        this.emit('message', message);
      } catch (error) {
        this.emit('error', error);
      }
    }

    /**
     * Get connection status
     */
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isConnected: this.isConnected,
        readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED
      };
    }
  }], [{
    key: "clearAllConnections",
    value: function clearAllConnections() {
      _ConnectionManager_js__WEBPACK_IMPORTED_MODULE_1__["default"].clearAll();
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/core/WebSocketManagerV2.js":
/*!****************************************!*\
  !*** ./src/core/WebSocketManagerV2.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ WebSocketManagerV2)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
/* harmony import */ var _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./WebSocketSingleton.js */ "./src/core/WebSocketSingleton.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * WebSocketManagerV2 - Uses singleton pattern to prevent multiple connections
 */


var WebSocketManagerV2 = /*#__PURE__*/function (_EventEmitter) {
  function WebSocketManagerV2(config) {
    var _this;
    _classCallCheck(this, WebSocketManagerV2);
    _this = _callSuper(this, WebSocketManagerV2);
    _this.config = config;
    _this.ws = null;
    _this.isConnected = false;
    _this.connectionId = null;
    return _this;
  }

  /**
   * Connect to WebSocket using singleton
   */
  _inherits(WebSocketManagerV2, _EventEmitter);
  return _createClass(WebSocketManagerV2, [{
    key: "connect",
    value: (function () {
      var _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _this2 = this;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              return _context.a(2, new Promise(function (resolve, reject) {
                try {
                  _this2.connectionId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                  console.log("\uD83D\uDD0C WebSocketManagerV2: Requesting connection ".concat(_this2.connectionId, " for ").concat(_this2.config.websocketUrl));

                  // Get connection from singleton
                  _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].getConnection(_this2.config.websocketUrl, _this2.config).then(function (connection) {
                    _this2.ws = connection;
                    console.log("\uD83D\uDD0C WebSocketManagerV2: Got connection ".concat(_this2.connectionId));

                    // Set up event listeners
                    _this2.setupEventListeners();

                    // If already connected, resolve immediately
                    if (connection.readyState === WebSocket.OPEN) {
                      _this2.isConnected = true;
                      _this2.emit('connected');
                      resolve();
                    }
                  }).catch(function (error) {
                    console.error("\uD83D\uDD0C WebSocketManagerV2: Connection failed ".concat(_this2.connectionId), error);
                    reject(error);
                  });
                } catch (error) {
                  console.error("\uD83D\uDD0C WebSocketManagerV2: Connection error ".concat(_this2.connectionId), error);
                  reject(error);
                }
              }));
          }
        }, _callee);
      }));
      function connect() {
        return _connect.apply(this, arguments);
      }
      return connect;
    }()
    /**
     * Set up event listeners
     */
    )
  }, {
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _this3 = this;
      if (!this.ws) return;

      // Use singleton's event forwarding
      var handleOpen = function handleOpen(event, url) {
        if (url === _this3.config.websocketUrl) {
          console.log("\uD83D\uDD0C WebSocketManagerV2: Connection opened ".concat(_this3.connectionId));
          _this3.isConnected = true;
          _this3.emit('connected');
        }
      };
      var handleClose = function handleClose(event, url) {
        if (url === _this3.config.websocketUrl) {
          console.log("\uD83D\uDD0C WebSocketManagerV2: Connection closed ".concat(_this3.connectionId, " (Code: ").concat(event.code, ")"));
          _this3.isConnected = false;
          _this3.emit('disconnected', event);
        }
      };
      var handleError = function handleError(event, url) {
        if (url === _this3.config.websocketUrl) {
          console.log("\uD83D\uDD0C WebSocketManagerV2: Connection error ".concat(_this3.connectionId), event);
          _this3.emit('error', event);
        }
      };
      var handleMessage = function handleMessage(event, url) {
        if (url === _this3.config.websocketUrl) {
          _this3.handleMessage(event);
        }
      };

      // Add event listeners
      _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].on('open', handleOpen);
      _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].on('close', handleClose);
      _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].on('error', handleError);
      _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].on('message', handleMessage);

      // Store handlers for cleanup
      this.eventHandlers = {
        open: handleOpen,
        close: handleClose,
        error: handleError,
        message: handleMessage
      };
    }

    /**
     * Disconnect from WebSocket
     */
  }, {
    key: "disconnect",
    value: function disconnect() {
      console.log("\uD83D\uDD0C WebSocketManagerV2: Disconnecting ".concat(this.connectionId));

      // Remove event listeners
      if (this.eventHandlers) {
        _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].off('open', this.eventHandlers.open);
        _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].off('close', this.eventHandlers.close);
        _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].off('error', this.eventHandlers.error);
        _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].off('message', this.eventHandlers.message);
      }

      // Release connection from singleton
      if (this.config.websocketUrl) {
        console.log("\uD83D\uDD0C WebSocketManagerV2: Releasing connection ".concat(this.connectionId, " from singleton"));
        _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].releaseConnection(this.config.websocketUrl);
      }
      this.ws = null;
      this.isConnected = false;
    }

    /**
     * Send JSON message
     */
  }, {
    key: "sendMessage",
    value: function sendMessage(message) {
      if (!this.isConnected || !this.ws) {
        throw new Error('WebSocket not connected');
      }
      this.ws.send(JSON.stringify(message));
    }

    /**
     * Send binary data
     */
  }, {
    key: "sendBinary",
    value: function sendBinary(data) {
      if (!this.isConnected || !this.ws) {
        throw new Error('WebSocket not connected');
      }
      this.ws.send(data);
    }

    /**
     * Handle incoming messages
     */
  }, {
    key: "handleMessage",
    value: function handleMessage(event) {
      var _this4 = this;
      // Check if it's binary data
      if (event.data instanceof ArrayBuffer) {
        this.emit('binaryAudio', event.data);
        return;
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(function (arrayBuffer) {
          _this4.emit('binaryAudio', arrayBuffer);
        }).catch(function (err) {
          console.error('🔌 WebSocketManagerV2: Error converting Blob to ArrayBuffer:', err);
        });
        return;
      }

      // Handle JSON messages
      try {
        var message = JSON.parse(event.data);

        // Handle barge-in related messages
        if (message.t === 'barge_in_ack' || message.t === 'stop_sending') {
          this.emit('bargeIn', message);
        }

        // Handle stop playing message
        if (message.t === 'stop_playing') {
          this.emit('stopPlaying', message);
        }
        this.emit('message', message);
      } catch (error) {
        this.emit('error', error);
      }
    }

    /**
     * Get connection status
     */
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isConnected: this.isConnected,
        readyState: this.ws ? this.ws.readyState : null,
        connectionId: this.connectionId
      };
    }

    /**
     * Get singleton status (for debugging)
     */
  }], [{
    key: "getSingletonStatus",
    value: function getSingletonStatus() {
      return _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].getAllConnections();
    }

    /**
     * Clear all singleton connections (for testing)
     */
  }, {
    key: "clearAllConnections",
    value: function clearAllConnections() {
      _WebSocketSingleton_js__WEBPACK_IMPORTED_MODULE_1__["default"].clearAll();
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]);


/***/ }),

/***/ "./src/core/WebSocketSingleton.js":
/*!****************************************!*\
  !*** ./src/core/WebSocketSingleton.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./EventEmitter.js */ "./src/core/EventEmitter.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t.return || t.return(); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
/**
 * WebSocketSingleton - Ensures only one WebSocket connection per URL exists
 */

var WebSocketSingleton = /*#__PURE__*/function (_EventEmitter) {
  function WebSocketSingleton() {
    var _this;
    _classCallCheck(this, WebSocketSingleton);
    _this = _callSuper(this, WebSocketSingleton);
    _this.connections = new Map(); // Map of URL -> WebSocket instance
    _this.connectionCounts = new Map(); // Map of URL -> number of subscribers
    _this.creatingConnections = new Set(); // Set of URLs currently being created
    return _this;
  }

  /**
   * Get or create a WebSocket connection
   */
  _inherits(WebSocketSingleton, _EventEmitter);
  return _createClass(WebSocketSingleton, [{
    key: "getConnection",
    value: (function () {
      var _getConnection = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(url) {
        var _this2 = this;
        var config,
          existingConnection,
          connection,
          _args = arguments;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.n) {
            case 0:
              config = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
              if (!this.connections.has(url)) {
                _context.n = 1;
                break;
              }
              existingConnection = this.connections.get(url);
              this.connectionCounts.set(url, (this.connectionCounts.get(url) || 0) + 1);
              console.log("\uD83D\uDD0C WebSocketSingleton: Reusing existing connection for ".concat(url, " (").concat(this.connectionCounts.get(url), " subscribers)"));
              return _context.a(2, existingConnection);
            case 1:
              if (!(this.creatingConnections && this.creatingConnections.has(url))) {
                _context.n = 2;
                break;
              }
              console.log("\uD83D\uDD0C WebSocketSingleton: Connection already being created for ".concat(url, ", waiting..."));
              // Wait for the existing creation to complete
              return _context.a(2, new Promise(function (resolve) {
                var _checkConnection = function checkConnection() {
                  if (_this2.connections.has(url)) {
                    var _existingConnection = _this2.connections.get(url);
                    _this2.connectionCounts.set(url, (_this2.connectionCounts.get(url) || 0) + 1);
                    console.log("\uD83D\uDD0C WebSocketSingleton: Got existing connection after wait for ".concat(url, " (").concat(_this2.connectionCounts.get(url), " subscribers)"));
                    resolve(_existingConnection);
                  } else {
                    setTimeout(_checkConnection, 50);
                  }
                };
                _checkConnection();
              }));
            case 2:
              // Create new connection
              console.log("\uD83D\uDD0C WebSocketSingleton: Creating new connection for ".concat(url));
              this.creatingConnections.add(url);
              connection = new WebSocket(url);
              this.connections.set(url, connection);
              this.connectionCounts.set(url, 1);

              // Set up event forwarding
              connection.addEventListener('open', function (event) {
                console.log("\uD83D\uDD0C WebSocketSingleton: Connection opened for ".concat(url));
                _this2.creatingConnections.delete(url);
                _this2.emit('open', event, url);
              });
              connection.addEventListener('close', function (event) {
                console.log("\uD83D\uDD0C WebSocketSingleton: Connection closed for ".concat(url, " (Code: ").concat(event.code, ")"));
                _this2.creatingConnections.delete(url);
                _this2.connections.delete(url);
                _this2.connectionCounts.delete(url);
                _this2.emit('close', event, url);
              });
              connection.addEventListener('error', function (event) {
                console.log("\uD83D\uDD0C WebSocketSingleton: Connection error for ".concat(url), event);
                _this2.creatingConnections.delete(url);
                _this2.emit('error', event, url);
              });
              connection.addEventListener('message', function (event) {
                _this2.emit('message', event, url);
              });
              return _context.a(2, connection);
          }
        }, _callee, this);
      }));
      function getConnection(_x) {
        return _getConnection.apply(this, arguments);
      }
      return getConnection;
    }()
    /**
     * Release a connection (decrement subscriber count)
     */
    )
  }, {
    key: "releaseConnection",
    value: function releaseConnection(url) {
      if (!this.connections.has(url)) {
        console.log("\uD83D\uDD0C WebSocketSingleton: Attempted to release non-existent connection for ".concat(url));
        return;
      }
      var currentCount = this.connectionCounts.get(url) || 0;
      var newCount = Math.max(0, currentCount - 1);
      this.connectionCounts.set(url, newCount);
      console.log("\uD83D\uDD0C WebSocketSingleton: Released connection for ".concat(url, " (").concat(newCount, " subscribers remaining)"));

      // If no more subscribers, close the connection
      if (newCount === 0) {
        var connection = this.connections.get(url);
        if (connection && connection.readyState === WebSocket.OPEN) {
          console.log("\uD83D\uDD0C WebSocketSingleton: Closing connection for ".concat(url, " (no more subscribers)"));
          connection.close(1000, 'No more subscribers');
        }
        this.connections.delete(url);
        this.connectionCounts.delete(url);
      }
    }

    /**
     * Force close a connection
     */
  }, {
    key: "forceClose",
    value: function forceClose(url) {
      if (this.connections.has(url)) {
        var connection = this.connections.get(url);
        if (connection && connection.readyState === WebSocket.OPEN) {
          console.log("\uD83D\uDD0C WebSocketSingleton: Force closing connection for ".concat(url));
          connection.close(1000, 'Force close');
        }
        this.connections.delete(url);
        this.connectionCounts.delete(url);
      }
    }

    /**
     * Get connection status
     */
  }, {
    key: "getConnectionStatus",
    value: function getConnectionStatus(url) {
      if (!this.connections.has(url)) {
        return {
          exists: false,
          readyState: null,
          subscribers: 0
        };
      }
      var connection = this.connections.get(url);
      return {
        exists: true,
        readyState: connection.readyState,
        subscribers: this.connectionCounts.get(url) || 0
      };
    }

    /**
     * Get all active connections
     */
  }, {
    key: "getAllConnections",
    value: function getAllConnections() {
      var result = {};
      var _iterator = _createForOfIteratorHelper(this.connections.entries()),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _slicedToArray(_step.value, 2),
            url = _step$value[0],
            connection = _step$value[1];
          result[url] = {
            readyState: connection.readyState,
            subscribers: this.connectionCounts.get(url) || 0
          };
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return result;
    }

    /**
     * Clear all connections (for testing)
     */
  }, {
    key: "clearAll",
    value: function clearAll() {
      console.log("\uD83D\uDD0C WebSocketSingleton: Clearing all connections");
      var _iterator2 = _createForOfIteratorHelper(this.connections.entries()),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _step2$value = _slicedToArray(_step2.value, 2),
            url = _step2$value[0],
            connection = _step2$value[1];
          if (connection && connection.readyState === WebSocket.OPEN) {
            connection.close(1000, 'Clear all');
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      this.connections.clear();
      this.connectionCounts.clear();
      this.creatingConnections.clear();
    }
  }]);
}(_EventEmitter_js__WEBPACK_IMPORTED_MODULE_0__["default"]); // Global singleton instance
var webSocketSingleton = new WebSocketSingleton();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (webSocketSingleton);

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AgentSDK: () => (/* reexport safe */ _legacy_AgentSDK_js__WEBPACK_IMPORTED_MODULE_8__.AgentSDK),
/* harmony export */   AgentWidget: () => (/* reexport safe */ _legacy_AgentSDK_js__WEBPACK_IMPORTED_MODULE_8__.AgentWidget),
/* harmony export */   AudioPlayer: () => (/* reexport safe */ _core_AudioPlayer_js__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   AudioRecorder: () => (/* reexport safe */ _core_AudioRecorder_js__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   EventEmitter: () => (/* reexport safe */ _core_EventEmitter_js__WEBPACK_IMPORTED_MODULE_5__["default"]),
/* harmony export */   VERSION: () => (/* binding */ VERSION),
/* harmony export */   VanillaVoiceButton: () => (/* reexport safe */ _vanilla_VoiceButton_js__WEBPACK_IMPORTED_MODULE_7__["default"]),
/* harmony export */   VoiceButton: () => (/* reexport safe */ _react_VoiceButton_jsx__WEBPACK_IMPORTED_MODULE_6__["default"]),
/* harmony export */   VoiceSDK: () => (/* reexport safe */ _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_0__["default"]),
/* harmony export */   WebSocketManager: () => (/* reexport safe */ _core_WebSocketManager_js__WEBPACK_IMPORTED_MODULE_1__["default"]),
/* harmony export */   WebSocketManagerV2: () => (/* reexport safe */ _core_WebSocketManagerV2_js__WEBPACK_IMPORTED_MODULE_2__["default"]),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./core/VoiceSDK.js */ "./src/core/VoiceSDK.js");
/* harmony import */ var _core_WebSocketManager_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./core/WebSocketManager.js */ "./src/core/WebSocketManager.js");
/* harmony import */ var _core_WebSocketManagerV2_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./core/WebSocketManagerV2.js */ "./src/core/WebSocketManagerV2.js");
/* harmony import */ var _core_AudioRecorder_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./core/AudioRecorder.js */ "./src/core/AudioRecorder.js");
/* harmony import */ var _core_AudioPlayer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./core/AudioPlayer.js */ "./src/core/AudioPlayer.js");
/* harmony import */ var _core_EventEmitter_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./core/EventEmitter.js */ "./src/core/EventEmitter.js");
/* harmony import */ var _react_VoiceButton_jsx__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./react/VoiceButton.jsx */ "./src/react/VoiceButton.jsx");
/* harmony import */ var _vanilla_VoiceButton_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./vanilla/VoiceButton.js */ "./src/vanilla/VoiceButton.js");
/* harmony import */ var _legacy_AgentSDK_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./legacy/AgentSDK.js */ "./src/legacy/AgentSDK.js");
/**
 * TTP Agent SDK - Main Entry Point
 * 
 * A comprehensive SDK for voice interaction with AI agents.
 * Provides real-time audio recording, WebSocket communication, and audio playback.
 * 
 * Features:
 * - 🎤 Real-time Audio Recording with AudioWorklet
 * - 🔄 WebSocket Communication with authentication
 * - 🔊 Audio Playback with queue management
 * - ⚛️ React Components
 * - 🌐 Vanilla JavaScript Components
 * - 🎯 Event-driven architecture
 * - 🔒 Multiple authentication methods
 */

// Core SDK







// React components


// Vanilla JavaScript components


// Legacy AgentSDK (for backward compatibility)


// Version
var VERSION = '2.0.0';

// Default export for convenience
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  VoiceSDK: VoiceSDK,
  WebSocketManager: WebSocketManager,
  WebSocketManagerV2: WebSocketManagerV2,
  AudioRecorder: AudioRecorder,
  AudioPlayer: AudioPlayer,
  EventEmitter: EventEmitter,
  VoiceButton: VoiceButton,
  VanillaVoiceButton: VanillaVoiceButton,
  AgentSDK: AgentSDK,
  AgentWidget: AgentWidget,
  VERSION: VERSION
});

/***/ }),

/***/ "./src/legacy/AgentSDK.js":
/*!********************************!*\
  !*** ./src/legacy/AgentSDK.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AgentSDK: () => (/* binding */ AgentSDK),
/* harmony export */   AgentWidget: () => (/* binding */ AgentWidget)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../index.js */ "./src/index.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * Legacy AgentSDK - Backward Compatibility Layer
 * 
 * This maintains the original AgentSDK API while using the new VoiceSDK internally.
 * This ensures existing integrations continue to work without changes.
 */


var AgentSDK = /*#__PURE__*/function () {
  function AgentSDK(config) {
    _classCallCheck(this, AgentSDK);
    this.config = config;
    this.voiceSDK = null;
    this.isConnected = false;
    this.isListening = false;

    // Legacy callback properties
    this.onConnected = function () {};
    this.onDisconnected = function () {};
    this.onError = function (error) {
      return console.error('SDK Error:', error);
    };
    this.onTranscript = function (text) {};
    this.onAgentSpeaking = function (isStart) {};
  }
  return _createClass(AgentSDK, [{
    key: "connect",
    value: function () {
      var _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(signedUrl) {
        var _this = this;
        var _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              if (signedUrl) {
                _context.n = 1;
                break;
              }
              throw new Error('signedUrl is required');
            case 1:
              // Create VoiceSDK instance
              this.voiceSDK = new _index_js__WEBPACK_IMPORTED_MODULE_0__.VoiceSDK({
                websocketUrl: signedUrl,
                autoReconnect: false
              });

              // Set up event handlers to map to legacy callbacks
              this.voiceSDK.on('connected', function () {
                _this.isConnected = true;
                _this.onConnected();
              });
              this.voiceSDK.on('disconnected', function () {
                _this.isConnected = false;
                _this.onDisconnected();
              });
              this.voiceSDK.on('error', function (error) {
                _this.onError(error);
              });
              this.voiceSDK.on('message', function (message) {
                _this.handleWebSocketMessage(message);
              });
              this.voiceSDK.on('recordingStarted', function () {
                _this.isListening = true;
              });
              this.voiceSDK.on('recordingStopped', function () {
                _this.isListening = false;
              });
              this.voiceSDK.on('playbackStarted', function () {
                _this.onAgentSpeaking(true);
              });
              this.voiceSDK.on('playbackStopped', function () {
                _this.onAgentSpeaking(false);
              });

              // Connect using VoiceSDK
              _context.n = 2;
              return this.voiceSDK.connect();
            case 2:
              _context.n = 4;
              break;
            case 3:
              _context.p = 3;
              _t = _context.v;
              this.onError(_t);
              throw _t;
            case 4:
              return _context.a(2);
          }
        }, _callee, this, [[0, 3]]);
      }));
      function connect(_x) {
        return _connect.apply(this, arguments);
      }
      return connect;
    }()
  }, {
    key: "handleWebSocketMessage",
    value: function handleWebSocketMessage(message) {
      // Map new message format to legacy format
      switch (message.type) {
        case 'connected':
          console.log('Session started successfully');
          break;
        case 'user_transcript':
          this.onTranscript(message.user_transcription || message.text);
          break;
        case 'agent_response':
          // Handle agent text response
          break;
        case 'barge_in':
          // Handle barge-in
          break;
        case 'stop_playing':
          // Handle stop playing
          break;
        case 'error':
          this.onError(new Error(message.message));
          break;
      }
    }
  }, {
    key: "startListening",
    value: function () {
      var _startListening = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.n) {
            case 0:
              if (!this.voiceSDK) {
                _context2.n = 1;
                break;
              }
              _context2.n = 1;
              return this.voiceSDK.startRecording();
            case 1:
              return _context2.a(2);
          }
        }, _callee2, this);
      }));
      function startListening() {
        return _startListening.apply(this, arguments);
      }
      return startListening;
    }()
  }, {
    key: "stopListening",
    value: function stopListening() {
      if (this.voiceSDK) {
        this.voiceSDK.stopRecording();
      }
    }
  }, {
    key: "updateVariables",
    value: function updateVariables(variables) {
      if (this.voiceSDK && this.isConnected) {
        // Send variables update message
        this.voiceSDK.webSocketManager.sendMessage({
          t: 'update_variables',
          variables: variables
        });
      }
    }
  }, {
    key: "disconnect",
    value: function disconnect() {
      if (this.voiceSDK) {
        this.voiceSDK.destroy();
        this.voiceSDK = null;
      }
      this.isConnected = false;
      this.isListening = false;
    }
  }]);
}();

// ============================================
// WIDGET - Pre-built UI using the SDK
// ============================================

var AgentWidget = /*#__PURE__*/function () {
  function AgentWidget(config) {
    _classCallCheck(this, AgentWidget);
    this.config = config;
    this.sdk = new AgentSDK();
    this.isOpen = false;
    this.isActive = false;
    this.position = config.position || 'bottom-right';
    this.primaryColor = config.primaryColor || '#4F46E5';
    this.setupEventHandlers();
    this.createWidget();
  }
  return _createClass(AgentWidget, [{
    key: "setupEventHandlers",
    value: function setupEventHandlers() {
      var _this2 = this;
      this.sdk.onConnected = function () {
        _this2.updateStatus('connected');
      };
      this.sdk.onDisconnected = function () {
        _this2.updateStatus('disconnected');
        _this2.isActive = false;
      };
      this.sdk.onError = function (error) {
        _this2.showError(error.message);
      };
      this.sdk.onTranscript = function (text) {
        _this2.addMessage('user', text);
      };
      this.sdk.onAgentSpeaking = function (isStart) {
        if (isStart) {
          _this2.showAgentThinking();
        } else {
          _this2.hideAgentThinking();
        }
      };
    }
  }, {
    key: "createWidget",
    value: function createWidget() {
      var _this3 = this;
      var widget = document.createElement('div');
      widget.id = 'agent-widget';
      widget.innerHTML = "\n      <style>\n        #agent-widget {\n          position: fixed;\n          ".concat(this.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;', "\n          ").concat(this.position.includes('right') ? 'right: 20px;' : 'left: 20px;', "\n          z-index: 9999;\n          font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n        }\n        \n        #agent-button {\n          width: 60px;\n          height: 60px;\n          border-radius: 50%;\n          background: ").concat(this.primaryColor, ";\n          border: none;\n          cursor: pointer;\n          box-shadow: 0 4px 12px rgba(0,0,0,0.15);\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          transition: transform 0.2s;\n        }\n        \n        #agent-button:hover {\n          transform: scale(1.1);\n        }\n        \n        #agent-button svg {\n          width: 28px;\n          height: 28px;\n          fill: white;\n        }\n        \n        #agent-panel {\n          display: none;\n          position: absolute;\n          bottom: 80px;\n          ").concat(this.position.includes('right') ? 'right: 0;' : 'left: 0;', "\n          width: 350px;\n          height: 500px;\n          background: white;\n          border-radius: 12px;\n          box-shadow: 0 8px 32px rgba(0,0,0,0.2);\n          flex-direction: column;\n          overflow: hidden;\n        }\n        \n        #agent-panel.open {\n          display: flex;\n        }\n        \n        #agent-header {\n          background: ").concat(this.primaryColor, ";\n          color: white;\n          padding: 16px;\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n        }\n        \n        #agent-close {\n          background: none;\n          border: none;\n          color: white;\n          cursor: pointer;\n          font-size: 24px;\n        }\n        \n        #agent-messages {\n          flex: 1;\n          overflow-y: auto;\n          padding: 16px;\n          display: flex;\n          flex-direction: column;\n          gap: 12px;\n        }\n        \n        .message {\n          padding: 12px;\n          border-radius: 8px;\n          max-width: 80%;\n        }\n        \n        .message.user {\n          background: #E5E7EB;\n          align-self: flex-end;\n        }\n        \n        .message.agent {\n          background: #F3F4F6;\n          align-self: flex-start;\n        }\n        \n        #agent-controls {\n          padding: 16px;\n          border-top: 1px solid #E5E7EB;\n          display: flex;\n          justify-content: center;\n        }\n        \n        #agent-mic-button {\n          width: 60px;\n          height: 60px;\n          border-radius: 50%;\n          border: none;\n          background: ").concat(this.primaryColor, ";\n          cursor: pointer;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          transition: all 0.2s;\n        }\n        \n        #agent-mic-button.active {\n          background: #EF4444;\n          animation: pulse 1.5s infinite;\n        }\n        \n        #agent-mic-button svg {\n          width: 28px;\n          height: 28px;\n          fill: white;\n        }\n        \n        @keyframes pulse {\n          0%, 100% { transform: scale(1); }\n          50% { transform: scale(1.05); }\n        }\n        \n        .agent-thinking {\n          font-style: italic;\n          color: #6B7280;\n        }\n        \n        .error-message {\n          background: #FEE2E2;\n          color: #991B1B;\n          padding: 12px;\n          border-radius: 8px;\n          margin: 8px;\n        }\n      </style>\n      \n      <button id=\"agent-button\">\n        <svg viewBox=\"0 0 24 24\">\n          <path d=\"M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z\"/>\n          <path d=\"M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z\"/>\n        </svg>\n      </button>\n      \n      <div id=\"agent-panel\">\n        <div id=\"agent-header\">\n          <h3 style=\"margin: 0;\">Voice Assistant</h3>\n          <button id=\"agent-close\">&times;</button>\n        </div>\n        \n        <div id=\"agent-messages\"></div>\n        \n        <div id=\"agent-controls\">\n          <button id=\"agent-mic-button\">\n            <svg viewBox=\"0 0 24 24\">\n              <path d=\"M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z\"/>\n              <path d=\"M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n    ");
      document.body.appendChild(widget);
      document.getElementById('agent-button').onclick = function () {
        return _this3.togglePanel();
      };
      document.getElementById('agent-close').onclick = function () {
        return _this3.togglePanel();
      };
      document.getElementById('agent-mic-button').onclick = function () {
        return _this3.toggleVoice();
      };
    }
  }, {
    key: "togglePanel",
    value: function togglePanel() {
      this.isOpen = !this.isOpen;
      var panel = document.getElementById('agent-panel');
      panel.classList.toggle('open');
    }
  }, {
    key: "toggleVoice",
    value: function () {
      var _toggleVoice = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
        var signedUrl, _t2;
        return _regenerator().w(function (_context3) {
          while (1) switch (_context3.p = _context3.n) {
            case 0:
              if (this.isActive) {
                _context3.n = 7;
                break;
              }
              _context3.p = 1;
              _context3.n = 2;
              return this.getSignedUrl();
            case 2:
              signedUrl = _context3.v;
              _context3.n = 3;
              return this.sdk.connect(signedUrl);
            case 3:
              _context3.n = 4;
              return this.sdk.startListening();
            case 4:
              this.isActive = true;
              document.getElementById('agent-mic-button').classList.add('active');
              this.addMessage('system', 'Listening...');
              _context3.n = 6;
              break;
            case 5:
              _context3.p = 5;
              _t2 = _context3.v;
              console.error('Failed to start:', _t2);
              this.showError(_t2.message);
            case 6:
              _context3.n = 8;
              break;
            case 7:
              this.sdk.stopListening();
              this.sdk.disconnect();
              this.isActive = false;
              document.getElementById('agent-mic-button').classList.remove('active');
            case 8:
              return _context3.a(2);
          }
        }, _callee3, this, [[1, 5]]);
      }));
      function toggleVoice() {
        return _toggleVoice.apply(this, arguments);
      }
      return toggleVoice;
    }()
  }, {
    key: "getSignedUrl",
    value: function () {
      var _getSignedUrl = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
        var response, data, result;
        return _regenerator().w(function (_context4) {
          while (1) switch (_context4.n) {
            case 0:
              if (!(typeof this.config.getSessionUrl === 'string')) {
                _context4.n = 4;
                break;
              }
              _context4.n = 1;
              return fetch(this.config.getSessionUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  agentId: this.config.agentId,
                  variables: this.config.variables || {}
                })
              });
            case 1:
              response = _context4.v;
              if (response.ok) {
                _context4.n = 2;
                break;
              }
              throw new Error("Failed to get session URL: ".concat(response.statusText));
            case 2:
              _context4.n = 3;
              return response.json();
            case 3:
              data = _context4.v;
              return _context4.a(2, data.signedUrl || data.wsUrl || data.url);
            case 4:
              if (!(typeof this.config.getSessionUrl === 'function')) {
                _context4.n = 6;
                break;
              }
              _context4.n = 5;
              return this.config.getSessionUrl({
                agentId: this.config.agentId,
                variables: this.config.variables || {}
              });
            case 5:
              result = _context4.v;
              return _context4.a(2, typeof result === 'string' ? result : result.signedUrl || result.wsUrl || result.url);
            case 6:
              throw new Error('getSessionUrl is required (URL string or function)');
            case 7:
              return _context4.a(2);
          }
        }, _callee4, this);
      }));
      function getSignedUrl() {
        return _getSignedUrl.apply(this, arguments);
      }
      return getSignedUrl;
    }()
  }, {
    key: "addMessage",
    value: function addMessage(type, text) {
      var messages = document.getElementById('agent-messages');
      var message = document.createElement('div');
      message.className = "message ".concat(type);
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
    }
  }, {
    key: "showAgentThinking",
    value: function showAgentThinking() {
      var messages = document.getElementById('agent-messages');
      var thinking = document.createElement('div');
      thinking.className = 'message agent agent-thinking';
      thinking.id = 'thinking-indicator';
      thinking.textContent = 'Agent is speaking...';
      messages.appendChild(thinking);
      messages.scrollTop = messages.scrollHeight;
    }
  }, {
    key: "hideAgentThinking",
    value: function hideAgentThinking() {
      var thinking = document.getElementById('thinking-indicator');
      if (thinking) thinking.remove();
    }
  }, {
    key: "showError",
    value: function showError(message) {
      var messages = document.getElementById('agent-messages');
      var error = document.createElement('div');
      error.className = 'error-message';
      error.textContent = message;
      messages.appendChild(error);
    }
  }, {
    key: "updateStatus",
    value: function updateStatus(status) {
      console.log('Widget status:', status);
    }
  }]);
}();

/***/ }),

/***/ "./src/react/VoiceButton.jsx":
/*!***********************************!*\
  !*** ./src/react/VoiceButton.jsx ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../core/VoiceSDK.js */ "./src/core/VoiceSDK.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * VoiceButton - React component for voice interaction
 */



var VoiceButton = function VoiceButton(_ref) {
  var websocketUrl = _ref.websocketUrl,
    agentId = _ref.agentId,
    _ref$voice = _ref.voice,
    voice = _ref$voice === void 0 ? 'default' : _ref$voice,
    _ref$language = _ref.language,
    language = _ref$language === void 0 ? 'en' : _ref$language,
    _ref$autoReconnect = _ref.autoReconnect,
    autoReconnect = _ref$autoReconnect === void 0 ? true : _ref$autoReconnect,
    onConnected = _ref.onConnected,
    onDisconnected = _ref.onDisconnected,
    onRecordingStarted = _ref.onRecordingStarted,
    onRecordingStopped = _ref.onRecordingStopped,
    onPlaybackStarted = _ref.onPlaybackStarted,
    onPlaybackStopped = _ref.onPlaybackStopped,
    onError = _ref.onError,
    onMessage = _ref.onMessage,
    onBargeIn = _ref.onBargeIn,
    onStopPlaying = _ref.onStopPlaying,
    _ref$className = _ref.className,
    className = _ref$className === void 0 ? '' : _ref$className,
    _ref$style = _ref.style,
    style = _ref$style === void 0 ? {} : _ref$style,
    children = _ref.children;
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isConnected = _useState2[0],
    setIsConnected = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    isRecording = _useState4[0],
    setIsRecording = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    isPlaying = _useState6[0],
    setIsPlaying = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('Disconnected'),
    _useState8 = _slicedToArray(_useState7, 2),
    connectionStatus = _useState8[0],
    setConnectionStatus = _useState8[1];
  var voiceSDKRef = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);

  // Initialize VoiceSDK
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    console.log("\uD83C\uDF99\uFE0F VoiceButton: Creating VoiceSDK instance for ".concat(websocketUrl));

    // Clean up existing instance if any
    if (voiceSDKRef.current) {
      console.log("\uD83C\uDF99\uFE0F VoiceButton: Destroying existing VoiceSDK instance");
      voiceSDKRef.current.destroy();
      voiceSDKRef.current = null;
    }
    var voiceSDK = new _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
      websocketUrl: websocketUrl,
      agentId: agentId,
      // Pass through agentId if provided
      voice: voice,
      language: language,
      autoReconnect: autoReconnect
    });

    // Setup event listeners
    voiceSDK.on('connected', function () {
      setIsConnected(true);
      setConnectionStatus('Connected');
      onConnected === null || onConnected === void 0 || onConnected();
    });
    voiceSDK.on('disconnected', function () {
      setIsConnected(false);
      setConnectionStatus('Disconnected');
      onDisconnected === null || onDisconnected === void 0 || onDisconnected();
    });
    voiceSDK.on('recordingStarted', function () {
      setIsRecording(true);
      onRecordingStarted === null || onRecordingStarted === void 0 || onRecordingStarted();
    });
    voiceSDK.on('recordingStopped', function () {
      setIsRecording(false);
      onRecordingStopped === null || onRecordingStopped === void 0 || onRecordingStopped();
    });
    voiceSDK.on('playbackStarted', function () {
      setIsPlaying(true);
      onPlaybackStarted === null || onPlaybackStarted === void 0 || onPlaybackStarted();
    });
    voiceSDK.on('playbackStopped', function () {
      setIsPlaying(false);
      onPlaybackStopped === null || onPlaybackStopped === void 0 || onPlaybackStopped();
    });
    voiceSDK.on('error', function (error) {
      onError === null || onError === void 0 || onError(error);
    });
    voiceSDK.on('message', function (message) {
      onMessage === null || onMessage === void 0 || onMessage(message);
    });
    voiceSDK.on('bargeIn', function (message) {
      onBargeIn === null || onBargeIn === void 0 || onBargeIn(message);
    });
    voiceSDK.on('stopPlaying', function (message) {
      onStopPlaying === null || onStopPlaying === void 0 || onStopPlaying(message);
    });
    voiceSDKRef.current = voiceSDK;

    // Auto-connect
    voiceSDK.connect();

    // Cleanup on unmount
    return function () {
      console.log("\uD83C\uDF99\uFE0F VoiceButton: Cleaning up VoiceSDK instance for ".concat(websocketUrl));
      if (voiceSDKRef.current) {
        voiceSDKRef.current.destroy();
        voiceSDKRef.current = null;
      }
    };
  }, [websocketUrl, agentId, voice, language]);

  // Handle button click
  var handleClick = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (voiceSDKRef.current) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            _context.p = 1;
            _context.n = 2;
            return voiceSDKRef.current.toggleRecording();
          case 2:
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            console.error('Error toggling recording:', _t);
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3]]);
    }));
    return function handleClick() {
      return _ref2.apply(this, arguments);
    };
  }();

  // Default button content
  var defaultContent = /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsxs)("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      style: {
        fontSize: '20px'
      },
      children: isRecording ? '🔴' : '🎤'
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("div", {
      children: isRecording ? 'Stop Listening' : 'Start Listening'
    })]
  });
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_2__.jsx)("button", {
    className: "voice-button ".concat(isRecording ? 'recording' : '', " ").concat(className),
    style: _objectSpread({
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      backgroundColor: isRecording ? '#dc3545' : '#007bff',
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '500',
      transition: 'all 0.2s ease'
    }, style),
    onClick: handleClick,
    disabled: !isConnected,
    children: children || defaultContent
  });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (VoiceButton);

/***/ }),

/***/ "./src/vanilla/VoiceButton.js":
/*!************************************!*\
  !*** ./src/vanilla/VoiceButton.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ VoiceButton)
/* harmony export */ });
/* harmony import */ var _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../core/VoiceSDK.js */ "./src/core/VoiceSDK.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/**
 * VoiceButton - Vanilla JavaScript voice button
 */

var VoiceButton = /*#__PURE__*/function () {
  function VoiceButton() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    _classCallCheck(this, VoiceButton);
    this.options = _objectSpread({
      websocketUrl: options.websocketUrl || 'wss://speech.bidme.co.il/ws/conv',
      agentId: options.agentId,
      // Optional - for direct agent access (unsecured method)
      voice: options.voice || 'default',
      language: options.language || 'en',
      container: options.container || document.body,
      buttonText: options.buttonText || 'Start Listening',
      buttonClass: options.buttonClass || 'voice-button'
    }, options);
    this.isConnected = false;
    this.isRecording = false;
    this.isPlaying = false;
    this.voiceSDK = new _core_VoiceSDK_js__WEBPACK_IMPORTED_MODULE_0__["default"]({
      websocketUrl: this.options.websocketUrl,
      agentId: this.options.agentId,
      // Pass through agentId if provided
      voice: this.options.voice,
      language: this.options.language
    });
    this.setupEventListeners();
    this.createButton();
    this.connect();
  }

  /**
   * Setup event listeners
   */
  return _createClass(VoiceButton, [{
    key: "setupEventListeners",
    value: function setupEventListeners() {
      var _this = this;
      this.voiceSDK.on('connected', function () {
        var _this$options$onConne, _this$options;
        _this.isConnected = true;
        _this.updateButton();
        (_this$options$onConne = (_this$options = _this.options).onConnected) === null || _this$options$onConne === void 0 || _this$options$onConne.call(_this$options);
      });
      this.voiceSDK.on('disconnected', function () {
        var _this$options$onDisco, _this$options2;
        _this.isConnected = false;
        _this.updateButton();
        (_this$options$onDisco = (_this$options2 = _this.options).onDisconnected) === null || _this$options$onDisco === void 0 || _this$options$onDisco.call(_this$options2);
      });
      this.voiceSDK.on('recordingStarted', function () {
        var _this$options$onRecor, _this$options3;
        _this.isRecording = true;
        _this.updateButton();
        (_this$options$onRecor = (_this$options3 = _this.options).onRecordingStarted) === null || _this$options$onRecor === void 0 || _this$options$onRecor.call(_this$options3);
      });
      this.voiceSDK.on('recordingStopped', function () {
        var _this$options$onRecor2, _this$options4;
        _this.isRecording = false;
        _this.updateButton();
        (_this$options$onRecor2 = (_this$options4 = _this.options).onRecordingStopped) === null || _this$options$onRecor2 === void 0 || _this$options$onRecor2.call(_this$options4);
      });
      this.voiceSDK.on('playbackStarted', function () {
        var _this$options$onPlayb, _this$options5;
        _this.isPlaying = true;
        (_this$options$onPlayb = (_this$options5 = _this.options).onPlaybackStarted) === null || _this$options$onPlayb === void 0 || _this$options$onPlayb.call(_this$options5);
      });
      this.voiceSDK.on('playbackStopped', function () {
        var _this$options$onPlayb2, _this$options6;
        _this.isPlaying = false;
        (_this$options$onPlayb2 = (_this$options6 = _this.options).onPlaybackStopped) === null || _this$options$onPlayb2 === void 0 || _this$options$onPlayb2.call(_this$options6);
      });
      this.voiceSDK.on('error', function (error) {
        var _this$options$onError, _this$options7;
        (_this$options$onError = (_this$options7 = _this.options).onError) === null || _this$options$onError === void 0 || _this$options$onError.call(_this$options7, error);
      });
      this.voiceSDK.on('message', function (message) {
        var _this$options$onMessa, _this$options8;
        (_this$options$onMessa = (_this$options8 = _this.options).onMessage) === null || _this$options$onMessa === void 0 || _this$options$onMessa.call(_this$options8, message);
      });
      this.voiceSDK.on('bargeIn', function (message) {
        var _this$options$onBarge, _this$options9;
        (_this$options$onBarge = (_this$options9 = _this.options).onBargeIn) === null || _this$options$onBarge === void 0 || _this$options$onBarge.call(_this$options9, message);
      });
      this.voiceSDK.on('stopPlaying', function (message) {
        var _this$options$onStopP, _this$options0;
        (_this$options$onStopP = (_this$options0 = _this.options).onStopPlaying) === null || _this$options$onStopP === void 0 || _this$options$onStopP.call(_this$options0, message);
      });
    }

    /**
     * Create the button element
     */
  }, {
    key: "createButton",
    value: function createButton() {
      var _this2 = this;
      this.button = document.createElement('button');
      this.button.className = this.options.buttonClass;
      this.button.style.cssText = "\n      padding: 12px 24px;\n      border: none;\n      border-radius: 8px;\n      background-color: #6c757d;\n      color: white;\n      cursor: pointer;\n      font-size: 16px;\n      font-weight: 500;\n      transition: all 0.2s ease;\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    ";
      this.button.addEventListener('click', function () {
        return _this2.toggleRecording();
      });
      this.options.container.appendChild(this.button);
      this.updateButton();
    }

    /**
     * Update button appearance and state
     */
  }, {
    key: "updateButton",
    value: function updateButton() {
      if (!this.button) return;
      var icon = this.isRecording ? '🔴' : '🎤';
      var text = this.isRecording ? 'Stop Listening' : 'Start Listening';
      this.button.innerHTML = "\n      <span style=\"font-size: 20px;\">".concat(icon, "</span>\n      <span>").concat(text, "</span>\n    ");
      this.button.disabled = !this.isConnected;
      this.button.style.backgroundColor = this.isRecording ? '#dc3545' : this.isConnected ? '#007bff' : '#6c757d';
    }

    /**
     * Connect to voice server
     */
  }, {
    key: "connect",
    value: (function () {
      var _connect = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
        var _t;
        return _regenerator().w(function (_context) {
          while (1) switch (_context.p = _context.n) {
            case 0:
              _context.p = 0;
              _context.n = 1;
              return this.voiceSDK.connect();
            case 1:
              _context.n = 3;
              break;
            case 2:
              _context.p = 2;
              _t = _context.v;
              console.error('Failed to connect:', _t);
            case 3:
              return _context.a(2);
          }
        }, _callee, this, [[0, 2]]);
      }));
      function connect() {
        return _connect.apply(this, arguments);
      }
      return connect;
    }()
    /**
     * Toggle recording
     */
    )
  }, {
    key: "toggleRecording",
    value: (function () {
      var _toggleRecording = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
        var _t2;
        return _regenerator().w(function (_context2) {
          while (1) switch (_context2.p = _context2.n) {
            case 0:
              if (this.voiceSDK) {
                _context2.n = 1;
                break;
              }
              return _context2.a(2);
            case 1:
              _context2.p = 1;
              _context2.n = 2;
              return this.voiceSDK.toggleRecording();
            case 2:
              _context2.n = 4;
              break;
            case 3:
              _context2.p = 3;
              _t2 = _context2.v;
              console.error('Error toggling recording:', _t2);
            case 4:
              return _context2.a(2);
          }
        }, _callee2, this, [[1, 3]]);
      }));
      function toggleRecording() {
        return _toggleRecording.apply(this, arguments);
      }
      return toggleRecording;
    }()
    /**
     * Get current status
     */
    )
  }, {
    key: "getStatus",
    value: function getStatus() {
      return {
        isConnected: this.isConnected,
        isRecording: this.isRecording,
        isPlaying: this.isPlaying
      };
    }

    /**
     * Update configuration
     */
  }, {
    key: "updateConfig",
    value: function updateConfig(newConfig) {
      this.voiceSDK.updateConfig(newConfig);
    }

    /**
     * Destroy the button and cleanup
     */
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.button && this.button.parentNode) {
        this.button.parentNode.removeChild(this.button);
      }
      if (this.voiceSDK) {
        this.voiceSDK.destroy();
      }
    }
  }]);
}();


/***/ }),

/***/ "react":
/*!**************************************************************************************!*\
  !*** external {"commonjs":"react","commonjs2":"react","amd":"react","root":"React"} ***!
  \**************************************************************************************/
/***/ ((module) => {

module.exports = __WEBPACK_EXTERNAL_MODULE_react__;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"main": 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = this["webpackChunkTTPAgentSDK"] = this["webpackChunkTTPAgentSDK"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, ["vendor"], () => (__webpack_require__("./src/index.js")))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	__webpack_exports__ = __webpack_exports__["default"];
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=agent-widget.js.map