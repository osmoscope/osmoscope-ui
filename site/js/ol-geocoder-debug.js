/*!
 * ol-geocoder - v4.1.2
 * A geocoder extension for OpenLayers.
 * https://github.com/jonataswalker/ol-geocoder
 * Built: Wed Jan 20 2021 10:05:05 GMT-0300 (Brasilia Standard Time)
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('ol/control/Control'), require('ol/style/Style'), require('ol/style/Icon'), require('ol/layer/Vector'), require('ol/source/Vector'), require('ol/geom/Point'), require('ol/Feature'), require('ol/proj')) :
  typeof define === 'function' && define.amd ? define(['ol/control/Control', 'ol/style/Style', 'ol/style/Icon', 'ol/layer/Vector', 'ol/source/Vector', 'ol/geom/Point', 'ol/Feature', 'ol/proj'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Geocoder = factory(global.ol.control.Control, global.ol.style.Style, global.ol.style.Icon, global.ol.layer.Vector, global.ol.source.Vector, global.ol.geom.Point, global.ol.Feature, global.ol.proj));
}(this, (function (Control, Style, Icon, LayerVector, SourceVector, Point, Feature, proj) { 'use strict';

  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  var Control__default = /*#__PURE__*/_interopDefaultLegacy(Control);
  var Style__default = /*#__PURE__*/_interopDefaultLegacy(Style);
  var Icon__default = /*#__PURE__*/_interopDefaultLegacy(Icon);
  var LayerVector__default = /*#__PURE__*/_interopDefaultLegacy(LayerVector);
  var SourceVector__default = /*#__PURE__*/_interopDefaultLegacy(SourceVector);
  var Point__default = /*#__PURE__*/_interopDefaultLegacy(Point);
  var Feature__default = /*#__PURE__*/_interopDefaultLegacy(Feature);
  var proj__default = /*#__PURE__*/_interopDefaultLegacy(proj);

  var containerId = "gcd-container";
  var buttonControlId = "gcd-button-control";
  var inputQueryId = "gcd-input-query";
  var inputResetId = "gcd-input-reset";
  var cssClasses = {
  	namespace: "ol-geocoder",
  	spin: "gcd-pseudo-rotate",
  	hidden: "gcd-hidden",
  	address: "gcd-address",
  	country: "gcd-country",
  	city: "gcd-city",
  	road: "gcd-road",
  	olControl: "ol-control",
  	glass: {
  		container: "gcd-gl-container",
  		control: "gcd-gl-control",
  		button: "gcd-gl-btn",
  		input: "gcd-gl-input",
  		expanded: "gcd-gl-expanded",
  		reset: "gcd-gl-reset",
  		result: "gcd-gl-result"
  	},
  	inputText: {
  		container: "gcd-txt-container",
  		control: "gcd-txt-control",
  		input: "gcd-txt-input",
  		reset: "gcd-txt-reset",
  		icon: "gcd-txt-glass",
  		result: "gcd-txt-result"
  	}
  };
  var vars = {
  	containerId: containerId,
  	buttonControlId: buttonControlId,
  	inputQueryId: inputQueryId,
  	inputResetId: inputResetId,
  	cssClasses: cssClasses
  };

  var _VARS_ = /*#__PURE__*/Object.freeze({
    __proto__: null,
    containerId: containerId,
    buttonControlId: buttonControlId,
    inputQueryId: inputQueryId,
    inputResetId: inputResetId,
    cssClasses: cssClasses,
    'default': vars
  });

  var VARS = _VARS_;

  var EVENT_TYPE = {
    ADDRESSCHOSEN: 'addresschosen',
  };

  var CONTROL_TYPE = {
    NOMINATIM: 'nominatim',
    REVERSE: 'reverse',
  };

  var TARGET_TYPE = {
    GLASS: 'glass-button',
    INPUT: 'text-input',
  };

  var FEATURE_SRC = '//cdn.rawgit.com/jonataswalker/map-utils/master/images/marker.png';

  var PROVIDERS = {
    OSM: 'osm',
    MAPQUEST: 'mapquest',
    PHOTON: 'photon',
    BING: 'bing',
    OPENCAGE: 'opencage',
  };

  var DEFAULT_OPTIONS = {
    provider: PROVIDERS.OSM,
    placeholder: 'Search for an address',
    featureStyle: null,
    targetType: TARGET_TYPE.GLASS,
    lang: 'en-US',
    limit: 5,
    keepOpen: false,
    preventDefault: false,
    autoComplete: false,
    autoCompleteMinLength: 2,
    autoCompleteTimeout: 200,
    debug: false,
  };

  /**
   * Overwrites obj1's values with obj2's and adds
   * obj2's if non existent in obj1
   * @returns obj3 a new object based on obj1 and obj2
   */
  function mergeOptions(obj1, obj2) {
    var obj3 = {};

    for (var key in obj1) {
      if (Object.prototype.hasOwnProperty.call(obj1, key)) {
        obj3[key] = obj1[key];
      }
    }

    for (var key$1 in obj2) {
      if (Object.prototype.hasOwnProperty.call(obj2, key$1)) {
        obj3[key$1] = obj2[key$1];
      }
    }

    return obj3;
  }

  function assert(condition, message) {
    if ( message === void 0 ) message = 'Assertion failed';

    if (!condition) {
      if (typeof Error !== 'undefined') { throw new Error(message); }

      throw message; // Fallback
    }
  }

  function now() {
    // Polyfill for window.performance.now()
    // @license http://opensource.org/licenses/MIT
    // copyright Paul Irish 2015
    // https://gist.github.com/paulirish/5438650
    if ('performance' in window === false) {
      window.performance = {};
    }

    if ('now' in window.performance === false) {
      var nowOffset = Date.now();

      if (performance.timing && performance.timing.navigationStart) {
        nowOffset = performance.timing.navigationStart;
      }

      window.performance.now = function () { return Date.now() - nowOffset; };
    }

    return window.performance.now();
  }

  function flyTo(map, coord, duration, resolution) {
    if ( duration === void 0 ) duration = 500;
    if ( resolution === void 0 ) resolution = 2.388657133911758;

    map.getView().animate({ duration: duration, resolution: resolution }, { duration: duration, center: coord });
  }

  function randomId(prefix) {
    var id = now().toString(36);

    return prefix ? prefix + id : id;
  }

  function isNumeric(str) {
    return /^[0-9]+$/.test(str);
  }

  /* eslint-disable optimize-regex/optimize-regex */

  /**
   * @param {Element|Array<Element>} element DOM node or array of nodes.
   * @param {String|Array<String>} classname Class or array of classes.
   * For example: 'class1 class2' or ['class1', 'class2']
   * @param {Number|undefined} timeout Timeout to remove a class.
   */
  function addClass(element, classname, timeout) {
    if (Array.isArray(element)) {
      element.forEach(function (each) { return addClass(each, classname); });

      return;
    }

    var array = Array.isArray(classname) ? classname : classname.split(/[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/);

    var i = array.length;

    while (i--) {
      if (!hasClass(element, array[i])) {
        _addClass(element, array[i], timeout);
      }
    }
  }

  /**
   * @param {Element|Array<Element>} element DOM node or array of nodes.
   * @param {String|Array<String>} classname Class or array of classes.
   * For example: 'class1 class2' or ['class1', 'class2']
   * @param {Number|undefined} timeout Timeout to add a class.
   */
  function removeClass(element, classname, timeout) {
    if (Array.isArray(element)) {
      element.forEach(function (each) { return removeClass(each, classname, timeout); });

      return;
    }

    var array = Array.isArray(classname) ? classname : classname.split(/[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+/);

    var i = array.length;

    while (i--) {
      if (hasClass(element, array[i])) {
        _removeClass(element, array[i], timeout);
      }
    }
  }

  /**
   * @param {Element} element DOM node.
   * @param {String} classname Classname.
   * @return {Boolean}
   */
  function hasClass(element, c) {
    // use native if available
    return element.classList ? element.classList.contains(c) : classRegex(c).test(element.className);
  }

  function removeAllChildren(node) {
    while (node.firstChild) { node.firstChild.remove(); }
  }

  function template(html, row) {
    return html.replace(/\{[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*([\x2D0-9A-Z_a-z]+)[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*\}/g, function (htm, key) {
      var value = row[key] === undefined ? '' : row[key];

      return htmlEscape(value);
    });
  }

  function htmlEscape(str) {
    return String(str)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function createElement(node, html) {
    var elem;

    if (Array.isArray(node)) {
      elem = document.createElement(node[0]);

      if (node[1].id) { elem.id = node[1].id; }

      if (node[1].classname) { elem.className = node[1].classname; }

      if (node[1].attr) {
        var ref = node[1];
        var attr = ref.attr;

        if (Array.isArray(attr)) {
          var i = -1;

          while (++i < attr.length) {
            elem.setAttribute(attr[i].name, attr[i].value);
          }
        } else {
          elem.setAttribute(attr.name, attr.value);
        }
      }
    } else {
      elem = document.createElement(node);
    }

    elem.innerHTML = html;

    var frag = document.createDocumentFragment();

    while (elem.childNodes[0]) { frag.append(elem.childNodes[0]); }

    elem.append(frag);

    return elem;
  }

  function classRegex(classname) {
    // eslint-disable-next-line security/detect-non-literal-regexp
    return new RegExp(("(^|\\s+) " + classname + " (\\s+|$)"), 'u');
  }

  function _addClass(el, klass, timeout) {
    // use native if available
    if (el.classList) {
      el.classList.add(klass);
    } else {
      el.className = ((el.className) + " " + klass).trim();
    }

    if (timeout && isNumeric(timeout)) {
      window.setTimeout(function () { return _removeClass(el, klass); }, timeout);
    }
  }

  function _removeClass(el, klass, timeout) {
    if (el.classList) {
      el.classList.remove(klass);
    } else {
      el.className = el.className.replace(classRegex(klass), ' ').trim();
    }

    if (timeout && isNumeric(timeout)) {
      window.setTimeout(function () { return _addClass(el, klass); }, timeout);
    }
  }

  var klasses = VARS.cssClasses;

  /**
   * @class Html
   */
  var Html = function Html(base) {
    this.options = base.options;
    this.els = this.createControl();
  };

  Html.prototype.createControl = function createControl () {
    var container;
    var containerClass;
    var elements;

    if (this.options.targetType === TARGET_TYPE.INPUT) {
      containerClass = (klasses.namespace) + " " + (klasses.inputText.container);
      container = createElement(
        ['div', { id: VARS.containerId, classname: containerClass }],
        Html.input
      );
      elements = {
        container: container,
        control: container.querySelector(("." + (klasses.inputText.control))),
        input: container.querySelector(("." + (klasses.inputText.input))),
        reset: container.querySelector(("." + (klasses.inputText.reset))),
        result: container.querySelector(("." + (klasses.inputText.result))),
      };
    } else {
      containerClass = (klasses.namespace) + " " + (klasses.glass.container);
      container = createElement(
        ['div', { id: VARS.containerId, classname: containerClass }],
        Html.glass
      );
      elements = {
        container: container,
        control: container.querySelector(("." + (klasses.glass.control))),
        button: container.querySelector(("." + (klasses.glass.button))),
        input: container.querySelector(("." + (klasses.glass.input))),
        reset: container.querySelector(("." + (klasses.glass.reset))),
        result: container.querySelector(("." + (klasses.glass.result))),
      };
    }

    // set placeholder from options
    elements.input.placeholder = this.options.placeholder;

    return elements;
  };

  Html.glass = "\n  <div class=\"" + (klasses.glass.control) + " " + (klasses.olControl) + "\">\n    <button type=\"button\" id=\"" + (VARS.buttonControlId) + "\" class=\"" + (klasses.glass.button) + "\"></button>\n    <input type=\"text\" id=\"" + (VARS.inputQueryId) + "\" class=\"" + (klasses.glass.input) + "\" autocomplete=\"off\" placeholder=\"Search ...\">\n    <a id=\"" + (VARS.inputResetId) + "\" class=\"" + (klasses.glass.reset) + " " + (klasses.hidden) + "\"></a>\n  </div>\n  <ul class=\"" + (klasses.glass.result) + "\"></ul>\n";

  Html.input = "\n  <div class=\"" + (klasses.inputText.control) + "\">\n    <input type=\"text\" id=\"" + (VARS.inputQueryId) + "\" class=\"" + (klasses.inputText.input) + "\" autocomplete=\"off\" placeholder=\"Search ...\">\n    <span class=\"" + (klasses.inputText.icon) + "\"></span>\n    <button type=\"button\" id=\"" + (VARS.inputResetId) + "\" class=\"" + (klasses.inputText.reset) + " " + (klasses.hidden) + "\"></button>\n  </div>\n  <ul class=\"" + (klasses.inputText.result) + "\"></ul>\n";

  /**
   * @class Photon
   */
  var Photon = function Photon() {
    this.settings = {
      url: 'https://photon.komoot.io/api/',

      params: {
        q: '',
        limit: 10,
        lang: 'en',
      },

      langs: ['de', 'it', 'fr', 'en'],
    };
  };

  Photon.prototype.getParameters = function getParameters (options) {
    options.lang = options.lang.toLowerCase();

    return {
      url: this.settings.url,

      params: {
        q: options.query,
        limit: options.limit || this.settings.params.limit,

        lang: this.settings.langs.includes(options.lang) ? options.lang : this.settings.params.lang,
      },
    };
  };

  Photon.prototype.handleResponse = function handleResponse (results) {
    if (results.features.length === 0) { return []; }

    return results.features.map(function (result) { return ({
      lon: result.geometry.coordinates[0],
      lat: result.geometry.coordinates[1],

      address: {
        name: result.properties.name,
        postcode: result.properties.postcode,
        city: result.properties.city,
        state: result.properties.state,
        country: result.properties.country,
      },

      original: {
        formatted: result.properties.name,
        details: result.properties,
      },
    }); });
  };

  /**
   * @class OpenStreet
   */
  var OpenStreet = function OpenStreet() {
    this.settings = {
      url: 'https://nominatim.openstreetmap.org/search/',

      params: {
        q: '',
        format: 'json',
        addressdetails: 1,
        limit: 10,
        countrycodes: '',
        'accept-language': 'en-US',
      },
    };
  };

  OpenStreet.prototype.getParameters = function getParameters (opt) {
    return {
      url: this.settings.url,

      params: {
        q: opt.query,
        format: this.settings.params.format,
        addressdetails: this.settings.params.addressdetails,
        limit: opt.limit || this.settings.params.limit,
        countrycodes: opt.countrycodes || this.settings.params.countrycodes,
        'accept-language': opt.lang || this.settings.params['accept-language'],
      },
    };
  };

  OpenStreet.prototype.handleResponse = function handleResponse (results) {
    if (results.length === 0) { return []; }

    return results.map(function (result) { return ({
      lon: result.lon,
      lat: result.lat,
      bbox: result.boundingbox,

      address: {
        name: result.display_name,
        road: result.address.road || '',
        houseNumber: result.address.house_number || '',
        postcode: result.address.postcode,
        city: result.address.city || result.address.town,
        state: result.address.state,
        country: result.address.country,
      },

      original: {
        formatted: result.display_name,
        details: result.address,
      },
    }); });
  };

  /**
   * @class MapQuest
   */
  var MapQuest = function MapQuest() {
    this.settings = {
      url: 'https://open.mapquestapi.com/nominatim/v1/search.php',

      params: {
        q: '',
        key: '',
        format: 'json',
        addressdetails: 1,
        limit: 10,
        countrycodes: '',
        'accept-language': 'en-US',
      },
    };
  };

  MapQuest.prototype.getParameters = function getParameters (options) {
    return {
      url: this.settings.url,

      params: {
        q: options.query,
        key: options.key,
        format: 'json',
        addressdetails: 1,
        limit: options.limit || this.settings.params.limit,
        countrycodes: options.countrycodes || this.settings.params.countrycodes,

        'accept-language': options.lang || this.settings.params['accept-language'],
      },
    };
  };

  MapQuest.prototype.handleResponse = function handleResponse (results) {
    if (results.length === 0) { return []; }

    return results.map(function (result) { return ({
      lon: result.lon,
      lat: result.lat,

      address: {
        name: result.address.neighbourhood || '',
        road: result.address.road || '',
        postcode: result.address.postcode,
        city: result.address.city || result.address.town,
        state: result.address.state,
        country: result.address.country,
      },

      original: {
        formatted: result.display_name,
        details: result.address,
      },
    }); });
  };

  /**
   * @class Bing
   */
  var Bing = function Bing() {
    this.settings = {
      url: 'https://dev.virtualearth.net/REST/v1/Locations',
      callbackName: 'jsonp',

      params: {
        query: '',
        key: '',
        includeNeighborhood: 0,
        maxResults: 10,
      },
    };
  };

  Bing.prototype.getParameters = function getParameters (options) {
    return {
      url: this.settings.url,
      callbackName: this.settings.callbackName,

      params: {
        query: options.query,
        key: options.key,

        includeNeighborhood:
          options.includeNeighborhood || this.settings.params.includeNeighborhood,

        maxResults: options.maxResults || this.settings.params.maxResults,
      },
    };
  };

  Bing.prototype.handleResponse = function handleResponse (results) {
    var ref = results.resourceSets[0];
      var resources = ref.resources;

    if (resources.length === 0) { return []; }

    return resources.map(function (result) { return ({
      lon: result.point.coordinates[1],
      lat: result.point.coordinates[0],

      address: {
        name: result.name,
      },

      original: {
        formatted: result.address.formattedAddress,
        details: result.address,
      },
    }); });
  };

  /**
   * @class OpenCage
   */
  var OpenCage = function OpenCage() {
    this.settings = {
      url: 'https://api.opencagedata.com/geocode/v1/json?',

      params: {
        q: '',
        key: '',
        limit: 10,
        countrycode: '',
        pretty: 1,
        no_annotations: 1,
      },
    };
  };

  OpenCage.prototype.getParameters = function getParameters (options) {
    return {
      url: this.settings.url,

      params: {
        q: options.query,
        key: options.key,
        limit: options.limit || this.settings.params.limit,
        countrycode: options.countrycodes || this.settings.params.countrycodes,
      },
    };
  };

  OpenCage.prototype.handleResponse = function handleResponse (results) {
    if (results.results.length === 0) { return []; }

    return results.results.map(function (result) { return ({
      lon: result.geometry.lng,
      lat: result.geometry.lat,

      address: {
        name: result.components.house_number || '',
        road: result.components.road || '',
        postcode: result.components.postcode,
        city: result.components.city || result.components.town,
        state: result.components.state,
        country: result.components.country,
      },

      original: {
        formatted: result.formatted,
        details: result.components,
      },
    }); });
  };

  function json(obj) {
    return new Promise(function (resolve, reject) {
      var url = encodeUrlXhr(obj.url, obj.data);
      var config = {
        method: 'GET',
        mode: 'cors',
        credentials: 'same-origin',
      };

      if (obj.jsonp) {
        jsonp(url, obj.callbackName, resolve);
      } else {
        fetch(url, config)
          .then(function (r) { return r.json(); })
          .then(resolve)
          .catch(reject);
      }
    });
  }

  function toQueryString(obj) {
    return Object.keys(obj)
      .reduce(function (acc, k) {
        acc.push(
          typeof obj[k] === 'object'
            ? toQueryString(obj[k])
            : ((encodeURIComponent(k)) + "=" + (encodeURIComponent(obj[k])))
        );

        return acc;
      }, [])
      .join('&');
  }

  function encodeUrlXhr(url, data) {
    if (data && typeof data === 'object') {
      url += (/\?/.test(url) ? '&' : '?') + toQueryString(data);
    }

    return url;
  }

  function jsonp(url, key, callback) {
    // https://github.com/Fresheyeball/micro-jsonp/blob/master/src/jsonp.js
    var head = document.head;
    var script = document.createElement('script');
    // generate minimally unique name for callback function
    var callbackName = "f" + (Math.round(Math.random() * Date.now()));

    // set request url
    script.setAttribute(
      'src',
      // add callback parameter to the url
      //    where key is the parameter key supplied
      //    and callbackName is the parameter value
      ((url + (url.indexOf('?') > 0 ? '&' : '?') + key) + "=" + callbackName)
    );

    // place jsonp callback on window,
    //  the script sent by the server should call this
    //  function as it was passed as a url parameter
    window[callbackName] = function (data) {
      window[callbackName] = undefined;

      // clean up script tag created for request
      setTimeout(function () { return head.removeChild(script); }, 0);

      // hand data back to the user
      callback(data);
    };

    // actually make the request
    head.append(script);
  }

  var klasses$1 = VARS.cssClasses;

  /**
   * @class Nominatim
   */
  var Nominatim = function Nominatim(base, els) {
    this.Base = base;

    this.layerName = randomId('geocoder-layer-');
    this.layer = new LayerVector__default['default']({
      name: this.layerName,
      source: new SourceVector__default['default'](),
    });

    this.options = base.options;
    // provider is either the name of a built-in provider as a string or an
    // object that implements the provider API
    this.options.provider =
      typeof this.options.provider === 'string'
        ? this.options.provider.toLowerCase()
        : this.options.provider;
    this.provider = this.newProvider();

    this.els = els;
    this.lastQuery = '';
    this.container = this.els.container;
    this.registeredListeners = { mapClick: false };
    this.setListeners();
  };

  Nominatim.prototype.setListeners = function setListeners () {
      var this$1 = this;

    var timeout;
    var lastQuery;

    var openSearch = function (evt) {
      evt.stopPropagation();

      hasClass(this$1.els.control, klasses$1.glass.expanded) ? this$1.collapse() : this$1.expand();
    };
    var query = function (evt) {
      var value = evt.target.value.trim();
      var hit = evt.key
        ? evt.key === 'Enter'
        : evt.which
        ? evt.which === 13
        : evt.keyCode
        ? evt.keyCode === 13
        : false;

      if (hit) {
        evt.preventDefault();
        this$1.query(value);
      }
    };
    // eslint-disable-next-line unicorn/consistent-function-scoping
    var stopBubbling = function (evt) { return evt.stopPropagation(); };
    var reset = function (evt) {
      this$1.els.input.focus();
      this$1.els.input.value = '';
      this$1.lastQuery = '';
      addClass(this$1.els.reset, klasses$1.hidden);
      this$1.clearResults();
    };
    var handleValue = function (evt) {
      var value = evt.target.value.trim();

      value.length !== 0
        ? removeClass(this$1.els.reset, klasses$1.hidden)
        : addClass(this$1.els.reset, klasses$1.hidden);

      if (this$1.options.autoComplete && value !== lastQuery) {
        lastQuery = value;
        timeout && clearTimeout(timeout);
        timeout = setTimeout(function () {
          if (value.length >= this$1.options.autoCompleteMinLength) {
            this$1.query(value);
          }
        }, this$1.options.autoCompleteTimeout);
      }
    };

    this.els.input.addEventListener('keypress', query, false);
    this.els.input.addEventListener('click', stopBubbling, false);
    this.els.input.addEventListener('input', handleValue, false);
    this.els.reset.addEventListener('click', reset, false);

    if (this.options.targetType === TARGET_TYPE.GLASS) {
      this.els.button.addEventListener('click', openSearch, false);
    }
  };

  Nominatim.prototype.query = function query (q) {
      var this$1 = this;

    // lazy provider
    if (!this.provider) {
      this.provider = this.newProvider();
    }

    var parameters = this.provider.getParameters({
      query: q,
      key: this.options.key,
      lang: this.options.lang,
      countrycodes: this.options.countrycodes,
      limit: this.options.limit,
    });

    if (this.lastQuery === q && this.els.result.firstChild) { return; }

    this.lastQuery = q;
    this.clearResults();
    addClass(this.els.reset, klasses$1.spin);

    var ajax = {
      url: parameters.url,
      data: parameters.params,
    };

    if (parameters.callbackName) {
      ajax.jsonp = true;
      ajax.callbackName = parameters.callbackName;
    }

    json(ajax)
      .then(function (res) {
        // eslint-disable-next-line no-console
        this$1.options.debug && console.info(res);

        removeClass(this$1.els.reset, klasses$1.spin);

        // will be fullfiled according to provider
        var res_ = this$1.provider.handleResponse(res);

        if (res_) {
          this$1.createList(res_);
          this$1.listenMapClick();
        }
      })
      .catch(function (err) {
        removeClass(this$1.els.reset, klasses$1.spin);

        var li = createElement('li', '<h5>Error! No internet connection?</h5>');

        this$1.els.result.append(li);
      });
  };

  Nominatim.prototype.createList = function createList (response) {
      var this$1 = this;

    var ul = this.els.result;

    response.forEach(function (row) {
      var addressHtml;

      switch (this$1.options.provider) {
        case PROVIDERS.OSM:
          addressHtml = "<span class=\"" + (klasses$1.road) + "\">" + (row.address.name) + "</span>";

          break;

        default:
          addressHtml = this$1.addressTemplate(row.address);
      }

      var html = "<a href=\"#\">" + addressHtml + "</a>";
      var li = createElement('li', html);

      li.addEventListener(
        'click',
        function (evt) {
          evt.preventDefault();
          this$1.chosen(row, addressHtml, row.address, row.original);
        },
        false
      );

      ul.append(li);
    });
  };

  Nominatim.prototype.chosen = function chosen (place, addressHtml, addressObj, addressOriginal) {
    var map = this.Base.getMap();
    var coord_ = [Number.parseFloat(place.lon), Number.parseFloat(place.lat)];
    var projection = map.getView().getProjection();
    var coord = proj__default['default'].transform(coord_, 'EPSG:4326', projection);

    var bbox = place.bbox;

    if (bbox) {
      bbox = proj__default['default'].transformExtent(
        [bbox[2], bbox[1], bbox[3], bbox[0]], // NSWE -> WSEN
        'EPSG:4326',
        projection
      );
    }

    var address = {
      formatted: addressHtml,
      details: addressObj,
      original: addressOriginal,
    };

    this.options.keepOpen === false && this.clearResults(true);

    if (this.options.preventDefault === true) {
      this.Base.dispatchEvent({
        type: EVENT_TYPE.ADDRESSCHOSEN,
        address: address,
        coordinate: coord,
        bbox: bbox,
        place: place,
      });
    } else {
      if (bbox) {
        map.getView().fit(bbox, { duration: 500 });
      } else {
        flyTo(map, coord);
      }

      var feature = this.createFeature(coord, address);

      this.Base.dispatchEvent({
        type: EVENT_TYPE.ADDRESSCHOSEN,
        address: address,
        feature: feature,
        coordinate: coord,
        bbox: bbox,
        place: place,
      });
    }
  };

  Nominatim.prototype.createFeature = function createFeature (coord) {
    var feature = new Feature__default['default'](new Point__default['default'](coord));

    this.addLayer();
    feature.setStyle(this.options.featureStyle);
    feature.setId(randomId('geocoder-ft-'));
    this.getSource().addFeature(feature);

    return feature;
  };

  Nominatim.prototype.addressTemplate = function addressTemplate (address) {
    var html = [];

    if (address.name) {
      html.push(['<span class="', klasses$1.road, '">{name}</span>'].join(''));
    }

    if (address.road || address.building || address.house_number) {
      html.push(
        ['<span class="', klasses$1.road, '">{building} {road} {house_number}</span>'].join('')
      );
    }

    if (address.city || address.town || address.village) {
      html.push(
        ['<span class="', klasses$1.city, '">{postcode} {city} {town} {village}</span>'].join('')
      );
    }

    if (address.state || address.country) {
      html.push(['<span class="', klasses$1.country, '">{state} {country}</span>'].join(''));
    }

    return template(html.join('<br>'), address);
  };

  Nominatim.prototype.newProvider = function newProvider () {
    switch (this.options.provider) {
      case PROVIDERS.OSM:
        return new OpenStreet();
      case PROVIDERS.MAPQUEST:
        return new MapQuest();
      case PROVIDERS.PHOTON:
        return new Photon();
      case PROVIDERS.BING:
        return new Bing();
      case PROVIDERS.OPENCAGE:
        return new OpenCage();

      default:
        return this.options.provider;
    }
  };

  Nominatim.prototype.expand = function expand () {
      var this$1 = this;

    removeClass(this.els.input, klasses$1.spin);
    addClass(this.els.control, klasses$1.glass.expanded);
    window.setTimeout(function () { return this$1.els.input.focus(); }, 100);
    this.listenMapClick();
  };

  Nominatim.prototype.collapse = function collapse () {
    this.els.input.value = '';
    this.els.input.blur();
    addClass(this.els.reset, klasses$1.hidden);
    removeClass(this.els.control, klasses$1.glass.expanded);
    this.clearResults();
  };

  Nominatim.prototype.listenMapClick = function listenMapClick () {
    // already registered
    if (this.registeredListeners.mapClick) { return; }

    var that = this;
    var mapElement = this.Base.getMap().getTargetElement();

    this.registeredListeners.mapClick = true;

    // one-time fire click
    mapElement.addEventListener(
      'click',
      {
        handleEvent: function handleEvent(evt) {
          that.clearResults(true);
          mapElement.removeEventListener(evt.type, this, false);
          that.registeredListeners.mapClick = false;
        },
      },
      false
    );
  };

  Nominatim.prototype.clearResults = function clearResults (collapse) {
    collapse && this.options.targetType === TARGET_TYPE.GLASS
      ? this.collapse()
      : removeAllChildren(this.els.result);
  };

  Nominatim.prototype.getSource = function getSource () {
    return this.layer.getSource();
  };

  Nominatim.prototype.addLayer = function addLayer () {
      var this$1 = this;

    var found = false;

    var map = this.Base.getMap();

    map.getLayers().forEach(function (layer) {
      if (layer === this$1.layer) { found = true; }
    });

    if (!found) { map.addLayer(this.layer); }
  };

  /**
   * @class Base
   * @extends {ol.control.Control}
   */
  var Base = /*@__PURE__*/(function (Control) {
    function Base(type, options) {
      if ( type === void 0 ) type = CONTROL_TYPE.NOMINATIM;
      if ( options === void 0 ) options = {};

      if (!(this instanceof Base)) { return new Base(); }

      assert(typeof type === 'string', '@param `type` should be string!');
      assert(
        type === CONTROL_TYPE.NOMINATIM || type === CONTROL_TYPE.REVERSE,
        ("@param 'type' should be '" + (CONTROL_TYPE.NOMINATIM) + "'\n      or '" + (CONTROL_TYPE.REVERSE) + "'!")
      );
      assert(typeof options === 'object', '@param `options` should be object!');

      DEFAULT_OPTIONS.featureStyle = [
        new Style__default['default']({ image: new Icon__default['default']({ scale: 0.7, src: FEATURE_SRC }) }) ];

      this.options = mergeOptions(DEFAULT_OPTIONS, options);
      this.container = undefined;

      var $nominatim;

      var $html = new Html(this);

      if (type === CONTROL_TYPE.NOMINATIM) {
        this.container = $html.els.container;
        $nominatim = new Nominatim(this, $html.els);
        this.layer = $nominatim.layer;
      }

      Control.call(this, { element: this.container });
    }

    if ( Control ) Base.__proto__ = Control;
    Base.prototype = Object.create( Control && Control.prototype );
    Base.prototype.constructor = Base;

    /**
     * @return {ol.layer.Vector} Returns the layer created by this control
     */
    Base.prototype.getLayer = function getLayer () {
      return this.layer;
    };

    /**
     * @return {ol.source.Vector} Returns the source created by this control
     */
    Base.prototype.getSource = function getSource () {
      return this.getLayer().getSource();
    };

    /**
     * Set a new provider
     * @param {String} provider
     */
    Base.prototype.setProvider = function setProvider (provider) {
      this.options.provider = provider;
    };

    /**
     * Set provider key
     * @param {String} key
     */
    Base.prototype.setProviderKey = function setProviderKey (key) {
      this.options.key = key;
    };

    return Base;
  }(Control__default['default']));

  return Base;

})));
//# sourceMappingURL=ol-geocoder-debug.js.map
