(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = global || self, global.JsonExcel = factory());
}(this, (function () { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var download = createCommonjsModule(function (module, exports) {
	//download.js v4.2, by dandavis; 2008-2016. [MIT] see http://danml.com/download.html for tests/usage
	// v1 landed a FF+Chrome compat way of downloading strings to local un-named files, upgraded to use a hidden frame and optional mime
	// v2 added named files via a[download], msSaveBlob, IE (10+) support, and window.URL support for larger+faster saves than dataURLs
	// v3 added dataURL and Blob Input, bind-toggle arity, and legacy dataURL fallback was improved with force-download mime and base64 support. 3.1 improved safari handling.
	// v4 adds AMD/UMD, commonJS, and plain browser support
	// v4.1 adds url download capability via solo URL argument (same domain/CORS only)
	// v4.2 adds semantic variable names, long (over 2MB) dataURL support, and hidden by default temp anchors
	// https://github.com/rndme/download

	(function (root, factory) {
		{
			// Node. Does not work with strict CommonJS, but
			// only CommonJS-like environments that support module.exports,
			// like Node.
			module.exports = factory();
		}
	}(commonjsGlobal, function () {

		return function download(data, strFileName, strMimeType) {

			var self = window, // this script is only for browsers anyway...
				defaultMime = "application/octet-stream", // this default mime also triggers iframe downloads
				mimeType = strMimeType || defaultMime,
				payload = data,
				url = !strFileName && !strMimeType && payload,
				anchor = document.createElement("a"),
				toString = function(a){return String(a);},
				myBlob = (self.Blob || self.MozBlob || self.WebKitBlob || toString),
				fileName = strFileName || "download",
				blob,
				reader;
				myBlob= myBlob.call ? myBlob.bind(self) : Blob ;
		  
			if(String(this)==="true"){ //reverse arguments, allowing download.bind(true, "text/xml", "export.xml") to act as a callback
				payload=[payload, mimeType];
				mimeType=payload[0];
				payload=payload[1];
			}


			if(url && url.length< 2048){ // if no filename and no mime, assume a url was passed as the only argument
				fileName = url.split("/").pop().split("?")[0];
				anchor.href = url; // assign href prop to temp anchor
			  	if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
	        		var ajax=new XMLHttpRequest();
	        		ajax.open( "GET", url, true);
	        		ajax.responseType = 'blob';
	        		ajax.onload= function(e){ 
					  download(e.target.response, fileName, defaultMime);
					};
	        		setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
				    return ajax;
				} // end if valid url?
			} // end if url?


			//go ahead and download dataURLs right away
			if(/^data:([\w+-]+\/[\w+.-]+)?[,;]/.test(payload)){
			
				if(payload.length > (1024*1024*1.999) && myBlob !== toString ){
					payload=dataUrlToBlob(payload);
					mimeType=payload.type || defaultMime;
				}else {			
					return navigator.msSaveBlob ?  // IE10 can't do a[download], only Blobs:
						navigator.msSaveBlob(dataUrlToBlob(payload), fileName) :
						saver(payload) ; // everyone else can save dataURLs un-processed
				}
				
			}else {//not data url, is it a string with special needs?
				if(/([\x80-\xff])/.test(payload)){			  
					var i=0, tempUiArr= new Uint8Array(payload.length), mx=tempUiArr.length;
					for(i;i<mx;++i) tempUiArr[i]= payload.charCodeAt(i);
				 	payload=new myBlob([tempUiArr], {type: mimeType});
				}		  
			}
			blob = payload instanceof myBlob ?
				payload :
				new myBlob([payload], {type: mimeType}) ;


			function dataUrlToBlob(strUrl) {
				var parts= strUrl.split(/[:;,]/),
				type= parts[1],
				decoder= parts[2] == "base64" ? atob : decodeURIComponent,
				binData= decoder( parts.pop() ),
				mx= binData.length,
				i= 0,
				uiArr= new Uint8Array(mx);

				for(i;i<mx;++i) uiArr[i]= binData.charCodeAt(i);

				return new myBlob([uiArr], {type: type});
			 }

			function saver(url, winMode){

				if ('download' in anchor) { //html5 A[download]
					anchor.href = url;
					anchor.setAttribute("download", fileName);
					anchor.className = "download-js-link";
					anchor.innerHTML = "downloading...";
					anchor.style.display = "none";
					document.body.appendChild(anchor);
					setTimeout(function() {
						anchor.click();
						document.body.removeChild(anchor);
						if(winMode===true){setTimeout(function(){ self.URL.revokeObjectURL(anchor.href);}, 250 );}
					}, 66);
					return true;
				}

				// handle non-a[download] safari as best we can:
				if(/(Version)\/(\d+)\.(\d+)(?:\.(\d+))?.*Safari\//.test(navigator.userAgent)) {
					if(/^data:/.test(url))	url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
					if(!window.open(url)){ // popup blocked, offer direct download:
						if(confirm("Displaying New Document\n\nUse Save As... to download, then click back to return to this page.")){ location.href=url; }
					}
					return true;
				}

				//do iframe dataURL download (old ch+FF):
				var f = document.createElement("iframe");
				document.body.appendChild(f);

				if(!winMode && /^data:/.test(url)){ // force a mime that will download:
					url="data:"+url.replace(/^data:([\w\/\-\+]+)/, defaultMime);
				}
				f.src=url;
				setTimeout(function(){ document.body.removeChild(f); }, 333);

			}//end saver




			if (navigator.msSaveBlob) { // IE10+ : (has Blob, but not a[download] or URL)
				return navigator.msSaveBlob(blob, fileName);
			}

			if(self.URL){ // simple fast and modern way using Blob and URL:
				saver(self.URL.createObjectURL(blob), true);
			}else {
				// handle non-Blob()+non-URL browsers:
				if(typeof blob === "string" || blob.constructor===toString ){
					try{
						return saver( "data:" +  mimeType   + ";base64,"  +  self.btoa(blob)  );
					}catch(y){
						return saver( "data:" +  mimeType   + "," + encodeURIComponent(blob)  );
					}
				}

				// Blob but not URL support:
				reader=new FileReader();
				reader.onload=function(e){
					saver(this.result);
				};
				reader.readAsDataURL(blob);
			}
			return true;
		}; /* end download() */
	}));
	});

	function makeMap(str, expectsLowerCase) {
	  const map = /* @__PURE__ */ Object.create(null);
	  const list = str.split(",");
	  for (let i = 0; i < list.length; i++) {
	    map[list[i]] = true;
	  }
	  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
	}

	const EMPTY_OBJ = !!(process.env.NODE_ENV !== "production") ? Object.freeze({}) : {};
	const EMPTY_ARR = !!(process.env.NODE_ENV !== "production") ? Object.freeze([]) : [];
	const NOOP = () => {
	};
	const onRE = /^on[^a-z]/;
	const isOn = (key) => onRE.test(key);
	const extend = Object.assign;
	const hasOwnProperty = Object.prototype.hasOwnProperty;
	const hasOwn = (val, key) => hasOwnProperty.call(val, key);
	const isArray = Array.isArray;
	const isMap = (val) => toTypeString(val) === "[object Map]";
	const isSet = (val) => toTypeString(val) === "[object Set]";
	const isFunction = (val) => typeof val === "function";
	const isString = (val) => typeof val === "string";
	const isSymbol = (val) => typeof val === "symbol";
	const isObject = (val) => val !== null && typeof val === "object";
	const objectToString = Object.prototype.toString;
	const toTypeString = (value) => objectToString.call(value);
	const toRawType = (value) => {
	  return toTypeString(value).slice(8, -1);
	};
	const isPlainObject = (val) => toTypeString(val) === "[object Object]";
	const isIntegerKey = (key) => isString(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
	const cacheStringFunction = (fn) => {
	  const cache = /* @__PURE__ */ Object.create(null);
	  return (str) => {
	    const hit = cache[str];
	    return hit || (cache[str] = fn(str));
	  };
	};
	const capitalize = cacheStringFunction(
	  (str) => str.charAt(0).toUpperCase() + str.slice(1)
	);
	const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
	let _globalThis;
	const getGlobalThis = () => {
	  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
	};

	function normalizeStyle(value) {
	  if (isArray(value)) {
	    const res = {};
	    for (let i = 0; i < value.length; i++) {
	      const item = value[i];
	      const normalized = isString(item) ? parseStringStyle(item) : normalizeStyle(item);
	      if (normalized) {
	        for (const key in normalized) {
	          res[key] = normalized[key];
	        }
	      }
	    }
	    return res;
	  } else if (isString(value)) {
	    return value;
	  } else if (isObject(value)) {
	    return value;
	  }
	}
	const listDelimiterRE = /;(?![^(]*\))/g;
	const propertyDelimiterRE = /:([^]+)/;
	const styleCommentRE = /\/\*[^]*?\*\//g;
	function parseStringStyle(cssText) {
	  const ret = {};
	  cssText.replace(styleCommentRE, "").split(listDelimiterRE).forEach((item) => {
	    if (item) {
	      const tmp = item.split(propertyDelimiterRE);
	      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
	    }
	  });
	  return ret;
	}
	function normalizeClass(value) {
	  let res = "";
	  if (isString(value)) {
	    res = value;
	  } else if (isArray(value)) {
	    for (let i = 0; i < value.length; i++) {
	      const normalized = normalizeClass(value[i]);
	      if (normalized) {
	        res += normalized + " ";
	      }
	    }
	  } else if (isObject(value)) {
	    for (const name in value) {
	      if (value[name]) {
	        res += name + " ";
	      }
	    }
	  }
	  return res.trim();
	}

	const toDisplayString = (val) => {
	  return isString(val) ? val : val == null ? "" : isArray(val) || isObject(val) && (val.toString === objectToString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
	};
	const replacer = (_key, val) => {
	  if (val && val.__v_isRef) {
	    return replacer(_key, val.value);
	  } else if (isMap(val)) {
	    return {
	      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
	        entries[`${key} =>`] = val2;
	        return entries;
	      }, {})
	    };
	  } else if (isSet(val)) {
	    return {
	      [`Set(${val.size})`]: [...val.values()]
	    };
	  } else if (isObject(val) && !isArray(val) && !isPlainObject(val)) {
	    return String(val);
	  }
	  return val;
	};

	function warn(msg, ...args) {
	  console.warn(`[Vue warn] ${msg}`, ...args);
	}

	const createDep = (effects) => {
	  const dep = new Set(effects);
	  dep.w = 0;
	  dep.n = 0;
	  return dep;
	};
	const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
	const newTracked = (dep) => (dep.n & trackOpBit) > 0;

	const targetMap = /* @__PURE__ */ new WeakMap();
	let effectTrackDepth = 0;
	let trackOpBit = 1;
	const maxMarkerBits = 30;
	let activeEffect;
	const ITERATE_KEY = Symbol(!!(process.env.NODE_ENV !== "production") ? "iterate" : "");
	const MAP_KEY_ITERATE_KEY = Symbol(!!(process.env.NODE_ENV !== "production") ? "Map key iterate" : "");
	let shouldTrack = true;
	const trackStack = [];
	function pauseTracking() {
	  trackStack.push(shouldTrack);
	  shouldTrack = false;
	}
	function resetTracking() {
	  const last = trackStack.pop();
	  shouldTrack = last === void 0 ? true : last;
	}
	function track(target, type, key) {
	  if (shouldTrack && activeEffect) {
	    let depsMap = targetMap.get(target);
	    if (!depsMap) {
	      targetMap.set(target, depsMap = /* @__PURE__ */ new Map());
	    }
	    let dep = depsMap.get(key);
	    if (!dep) {
	      depsMap.set(key, dep = createDep());
	    }
	    const eventInfo = !!(process.env.NODE_ENV !== "production") ? { effect: activeEffect, target, type, key } : void 0;
	    trackEffects(dep, eventInfo);
	  }
	}
	function trackEffects(dep, debuggerEventExtraInfo) {
	  let shouldTrack2 = false;
	  if (effectTrackDepth <= maxMarkerBits) {
	    if (!newTracked(dep)) {
	      dep.n |= trackOpBit;
	      shouldTrack2 = !wasTracked(dep);
	    }
	  } else {
	    shouldTrack2 = !dep.has(activeEffect);
	  }
	  if (shouldTrack2) {
	    dep.add(activeEffect);
	    activeEffect.deps.push(dep);
	    if (!!(process.env.NODE_ENV !== "production") && activeEffect.onTrack) {
	      activeEffect.onTrack(
	        extend(
	          {
	            effect: activeEffect
	          },
	          debuggerEventExtraInfo
	        )
	      );
	    }
	  }
	}
	function trigger(target, type, key, newValue, oldValue, oldTarget) {
	  const depsMap = targetMap.get(target);
	  if (!depsMap) {
	    return;
	  }
	  let deps = [];
	  if (type === "clear") {
	    deps = [...depsMap.values()];
	  } else if (key === "length" && isArray(target)) {
	    const newLength = Number(newValue);
	    depsMap.forEach((dep, key2) => {
	      if (key2 === "length" || key2 >= newLength) {
	        deps.push(dep);
	      }
	    });
	  } else {
	    if (key !== void 0) {
	      deps.push(depsMap.get(key));
	    }
	    switch (type) {
	      case "add":
	        if (!isArray(target)) {
	          deps.push(depsMap.get(ITERATE_KEY));
	          if (isMap(target)) {
	            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
	          }
	        } else if (isIntegerKey(key)) {
	          deps.push(depsMap.get("length"));
	        }
	        break;
	      case "delete":
	        if (!isArray(target)) {
	          deps.push(depsMap.get(ITERATE_KEY));
	          if (isMap(target)) {
	            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
	          }
	        }
	        break;
	      case "set":
	        if (isMap(target)) {
	          deps.push(depsMap.get(ITERATE_KEY));
	        }
	        break;
	    }
	  }
	  const eventInfo = !!(process.env.NODE_ENV !== "production") ? { target, type, key, newValue, oldValue, oldTarget } : void 0;
	  if (deps.length === 1) {
	    if (deps[0]) {
	      if (!!(process.env.NODE_ENV !== "production")) {
	        triggerEffects(deps[0], eventInfo);
	      } else {
	        triggerEffects(deps[0]);
	      }
	    }
	  } else {
	    const effects = [];
	    for (const dep of deps) {
	      if (dep) {
	        effects.push(...dep);
	      }
	    }
	    if (!!(process.env.NODE_ENV !== "production")) {
	      triggerEffects(createDep(effects), eventInfo);
	    } else {
	      triggerEffects(createDep(effects));
	    }
	  }
	}
	function triggerEffects(dep, debuggerEventExtraInfo) {
	  const effects = isArray(dep) ? dep : [...dep];
	  for (const effect2 of effects) {
	    if (effect2.computed) {
	      triggerEffect(effect2, debuggerEventExtraInfo);
	    }
	  }
	  for (const effect2 of effects) {
	    if (!effect2.computed) {
	      triggerEffect(effect2, debuggerEventExtraInfo);
	    }
	  }
	}
	function triggerEffect(effect2, debuggerEventExtraInfo) {
	  if (effect2 !== activeEffect || effect2.allowRecurse) {
	    if (!!(process.env.NODE_ENV !== "production") && effect2.onTrigger) {
	      effect2.onTrigger(extend({ effect: effect2 }, debuggerEventExtraInfo));
	    }
	    if (effect2.scheduler) {
	      effect2.scheduler();
	    } else {
	      effect2.run();
	    }
	  }
	}

	const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
	const builtInSymbols = new Set(
	  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((key) => key !== "arguments" && key !== "caller").map((key) => Symbol[key]).filter(isSymbol)
	);
	const get$1 = /* @__PURE__ */ createGetter();
	const readonlyGet = /* @__PURE__ */ createGetter(true);
	const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
	function createArrayInstrumentations() {
	  const instrumentations = {};
	  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
	    instrumentations[key] = function(...args) {
	      const arr = toRaw(this);
	      for (let i = 0, l = this.length; i < l; i++) {
	        track(arr, "get", i + "");
	      }
	      const res = arr[key](...args);
	      if (res === -1 || res === false) {
	        return arr[key](...args.map(toRaw));
	      } else {
	        return res;
	      }
	    };
	  });
	  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
	    instrumentations[key] = function(...args) {
	      pauseTracking();
	      const res = toRaw(this)[key].apply(this, args);
	      resetTracking();
	      return res;
	    };
	  });
	  return instrumentations;
	}
	function hasOwnProperty$1(key) {
	  const obj = toRaw(this);
	  track(obj, "has", key);
	  return obj.hasOwnProperty(key);
	}
	function createGetter(isReadonly2 = false, shallow = false) {
	  return function get2(target, key, receiver) {
	    if (key === "__v_isReactive") {
	      return !isReadonly2;
	    } else if (key === "__v_isReadonly") {
	      return isReadonly2;
	    } else if (key === "__v_isShallow") {
	      return shallow;
	    } else if (key === "__v_raw" && receiver === (isReadonly2 ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
	      return target;
	    }
	    const targetIsArray = isArray(target);
	    if (!isReadonly2) {
	      if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
	        return Reflect.get(arrayInstrumentations, key, receiver);
	      }
	      if (key === "hasOwnProperty") {
	        return hasOwnProperty$1;
	      }
	    }
	    const res = Reflect.get(target, key, receiver);
	    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
	      return res;
	    }
	    if (!isReadonly2) {
	      track(target, "get", key);
	    }
	    if (shallow) {
	      return res;
	    }
	    if (isRef(res)) {
	      return targetIsArray && isIntegerKey(key) ? res : res.value;
	    }
	    if (isObject(res)) {
	      return isReadonly2 ? readonly(res) : reactive(res);
	    }
	    return res;
	  };
	}
	const set$1 = /* @__PURE__ */ createSetter();
	function createSetter(shallow = false) {
	  return function set2(target, key, value, receiver) {
	    let oldValue = target[key];
	    if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
	      return false;
	    }
	    if (!shallow) {
	      if (!isShallow(value) && !isReadonly(value)) {
	        oldValue = toRaw(oldValue);
	        value = toRaw(value);
	      }
	      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
	        oldValue.value = value;
	        return true;
	      }
	    }
	    const hadKey = isArray(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
	    const result = Reflect.set(target, key, value, receiver);
	    if (target === toRaw(receiver)) {
	      if (!hadKey) {
	        trigger(target, "add", key, value);
	      } else if (hasChanged(value, oldValue)) {
	        trigger(target, "set", key, value, oldValue);
	      }
	    }
	    return result;
	  };
	}
	function deleteProperty(target, key) {
	  const hadKey = hasOwn(target, key);
	  const oldValue = target[key];
	  const result = Reflect.deleteProperty(target, key);
	  if (result && hadKey) {
	    trigger(target, "delete", key, void 0, oldValue);
	  }
	  return result;
	}
	function has$1(target, key) {
	  const result = Reflect.has(target, key);
	  if (!isSymbol(key) || !builtInSymbols.has(key)) {
	    track(target, "has", key);
	  }
	  return result;
	}
	function ownKeys(target) {
	  track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
	  return Reflect.ownKeys(target);
	}
	const mutableHandlers = {
	  get: get$1,
	  set: set$1,
	  deleteProperty,
	  has: has$1,
	  ownKeys
	};
	const readonlyHandlers = {
	  get: readonlyGet,
	  set(target, key) {
	    if (!!(process.env.NODE_ENV !== "production")) {
	      warn(
	        `Set operation on key "${String(key)}" failed: target is readonly.`,
	        target
	      );
	    }
	    return true;
	  },
	  deleteProperty(target, key) {
	    if (!!(process.env.NODE_ENV !== "production")) {
	      warn(
	        `Delete operation on key "${String(key)}" failed: target is readonly.`,
	        target
	      );
	    }
	    return true;
	  }
	};

	const toShallow = (value) => value;
	const getProto = (v) => Reflect.getPrototypeOf(v);
	function get(target, key, isReadonly = false, isShallow = false) {
	  target = target["__v_raw"];
	  const rawTarget = toRaw(target);
	  const rawKey = toRaw(key);
	  if (!isReadonly) {
	    if (key !== rawKey) {
	      track(rawTarget, "get", key);
	    }
	    track(rawTarget, "get", rawKey);
	  }
	  const { has: has2 } = getProto(rawTarget);
	  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
	  if (has2.call(rawTarget, key)) {
	    return wrap(target.get(key));
	  } else if (has2.call(rawTarget, rawKey)) {
	    return wrap(target.get(rawKey));
	  } else if (target !== rawTarget) {
	    target.get(key);
	  }
	}
	function has(key, isReadonly = false) {
	  const target = this["__v_raw"];
	  const rawTarget = toRaw(target);
	  const rawKey = toRaw(key);
	  if (!isReadonly) {
	    if (key !== rawKey) {
	      track(rawTarget, "has", key);
	    }
	    track(rawTarget, "has", rawKey);
	  }
	  return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
	}
	function size(target, isReadonly = false) {
	  target = target["__v_raw"];
	  !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
	  return Reflect.get(target, "size", target);
	}
	function add(value) {
	  value = toRaw(value);
	  const target = toRaw(this);
	  const proto = getProto(target);
	  const hadKey = proto.has.call(target, value);
	  if (!hadKey) {
	    target.add(value);
	    trigger(target, "add", value, value);
	  }
	  return this;
	}
	function set(key, value) {
	  value = toRaw(value);
	  const target = toRaw(this);
	  const { has: has2, get: get2 } = getProto(target);
	  let hadKey = has2.call(target, key);
	  if (!hadKey) {
	    key = toRaw(key);
	    hadKey = has2.call(target, key);
	  } else if (!!(process.env.NODE_ENV !== "production")) {
	    checkIdentityKeys(target, has2, key);
	  }
	  const oldValue = get2.call(target, key);
	  target.set(key, value);
	  if (!hadKey) {
	    trigger(target, "add", key, value);
	  } else if (hasChanged(value, oldValue)) {
	    trigger(target, "set", key, value, oldValue);
	  }
	  return this;
	}
	function deleteEntry(key) {
	  const target = toRaw(this);
	  const { has: has2, get: get2 } = getProto(target);
	  let hadKey = has2.call(target, key);
	  if (!hadKey) {
	    key = toRaw(key);
	    hadKey = has2.call(target, key);
	  } else if (!!(process.env.NODE_ENV !== "production")) {
	    checkIdentityKeys(target, has2, key);
	  }
	  const oldValue = get2 ? get2.call(target, key) : void 0;
	  const result = target.delete(key);
	  if (hadKey) {
	    trigger(target, "delete", key, void 0, oldValue);
	  }
	  return result;
	}
	function clear() {
	  const target = toRaw(this);
	  const hadItems = target.size !== 0;
	  const oldTarget = !!(process.env.NODE_ENV !== "production") ? isMap(target) ? new Map(target) : new Set(target) : void 0;
	  const result = target.clear();
	  if (hadItems) {
	    trigger(target, "clear", void 0, void 0, oldTarget);
	  }
	  return result;
	}
	function createForEach(isReadonly, isShallow) {
	  return function forEach(callback, thisArg) {
	    const observed = this;
	    const target = observed["__v_raw"];
	    const rawTarget = toRaw(target);
	    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
	    !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
	    return target.forEach((value, key) => {
	      return callback.call(thisArg, wrap(value), wrap(key), observed);
	    });
	  };
	}
	function createIterableMethod(method, isReadonly, isShallow) {
	  return function(...args) {
	    const target = this["__v_raw"];
	    const rawTarget = toRaw(target);
	    const targetIsMap = isMap(rawTarget);
	    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
	    const isKeyOnly = method === "keys" && targetIsMap;
	    const innerIterator = target[method](...args);
	    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
	    !isReadonly && track(
	      rawTarget,
	      "iterate",
	      isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY
	    );
	    return {
	      // iterator protocol
	      next() {
	        const { value, done } = innerIterator.next();
	        return done ? { value, done } : {
	          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
	          done
	        };
	      },
	      // iterable protocol
	      [Symbol.iterator]() {
	        return this;
	      }
	    };
	  };
	}
	function createReadonlyMethod(type) {
	  return function(...args) {
	    if (!!(process.env.NODE_ENV !== "production")) {
	      const key = args[0] ? `on key "${args[0]}" ` : ``;
	      console.warn(
	        `${capitalize(type)} operation ${key}failed: target is readonly.`,
	        toRaw(this)
	      );
	    }
	    return type === "delete" ? false : this;
	  };
	}
	function createInstrumentations() {
	  const mutableInstrumentations2 = {
	    get(key) {
	      return get(this, key);
	    },
	    get size() {
	      return size(this);
	    },
	    has,
	    add,
	    set,
	    delete: deleteEntry,
	    clear,
	    forEach: createForEach(false, false)
	  };
	  const shallowInstrumentations2 = {
	    get(key) {
	      return get(this, key, false, true);
	    },
	    get size() {
	      return size(this);
	    },
	    has,
	    add,
	    set,
	    delete: deleteEntry,
	    clear,
	    forEach: createForEach(false, true)
	  };
	  const readonlyInstrumentations2 = {
	    get(key) {
	      return get(this, key, true);
	    },
	    get size() {
	      return size(this, true);
	    },
	    has(key) {
	      return has.call(this, key, true);
	    },
	    add: createReadonlyMethod("add"),
	    set: createReadonlyMethod("set"),
	    delete: createReadonlyMethod("delete"),
	    clear: createReadonlyMethod("clear"),
	    forEach: createForEach(true, false)
	  };
	  const shallowReadonlyInstrumentations2 = {
	    get(key) {
	      return get(this, key, true, true);
	    },
	    get size() {
	      return size(this, true);
	    },
	    has(key) {
	      return has.call(this, key, true);
	    },
	    add: createReadonlyMethod("add"),
	    set: createReadonlyMethod("set"),
	    delete: createReadonlyMethod("delete"),
	    clear: createReadonlyMethod("clear"),
	    forEach: createForEach(true, true)
	  };
	  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
	  iteratorMethods.forEach((method) => {
	    mutableInstrumentations2[method] = createIterableMethod(
	      method,
	      false,
	      false
	    );
	    readonlyInstrumentations2[method] = createIterableMethod(
	      method,
	      true,
	      false
	    );
	    shallowInstrumentations2[method] = createIterableMethod(
	      method,
	      false,
	      true
	    );
	    shallowReadonlyInstrumentations2[method] = createIterableMethod(
	      method,
	      true,
	      true
	    );
	  });
	  return [
	    mutableInstrumentations2,
	    readonlyInstrumentations2,
	    shallowInstrumentations2,
	    shallowReadonlyInstrumentations2
	  ];
	}
	const [
	  mutableInstrumentations,
	  readonlyInstrumentations,
	  shallowInstrumentations,
	  shallowReadonlyInstrumentations
	] = /* @__PURE__ */ createInstrumentations();
	function createInstrumentationGetter(isReadonly, shallow) {
	  const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
	  return (target, key, receiver) => {
	    if (key === "__v_isReactive") {
	      return !isReadonly;
	    } else if (key === "__v_isReadonly") {
	      return isReadonly;
	    } else if (key === "__v_raw") {
	      return target;
	    }
	    return Reflect.get(
	      hasOwn(instrumentations, key) && key in target ? instrumentations : target,
	      key,
	      receiver
	    );
	  };
	}
	const mutableCollectionHandlers = {
	  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
	};
	const readonlyCollectionHandlers = {
	  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
	};
	function checkIdentityKeys(target, has2, key) {
	  const rawKey = toRaw(key);
	  if (rawKey !== key && has2.call(target, rawKey)) {
	    const type = toRawType(target);
	    console.warn(
	      `Reactive ${type} contains both the raw and reactive versions of the same object${type === `Map` ? ` as keys` : ``}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
	    );
	  }
	}

	const reactiveMap = /* @__PURE__ */ new WeakMap();
	const shallowReactiveMap = /* @__PURE__ */ new WeakMap();
	const readonlyMap = /* @__PURE__ */ new WeakMap();
	const shallowReadonlyMap = /* @__PURE__ */ new WeakMap();
	function targetTypeMap(rawType) {
	  switch (rawType) {
	    case "Object":
	    case "Array":
	      return 1 /* COMMON */;
	    case "Map":
	    case "Set":
	    case "WeakMap":
	    case "WeakSet":
	      return 2 /* COLLECTION */;
	    default:
	      return 0 /* INVALID */;
	  }
	}
	function getTargetType(value) {
	  return value["__v_skip"] || !Object.isExtensible(value) ? 0 /* INVALID */ : targetTypeMap(toRawType(value));
	}
	function reactive(target) {
	  if (isReadonly(target)) {
	    return target;
	  }
	  return createReactiveObject(
	    target,
	    false,
	    mutableHandlers,
	    mutableCollectionHandlers,
	    reactiveMap
	  );
	}
	function readonly(target) {
	  return createReactiveObject(
	    target,
	    true,
	    readonlyHandlers,
	    readonlyCollectionHandlers,
	    readonlyMap
	  );
	}
	function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
	  if (!isObject(target)) {
	    if (!!(process.env.NODE_ENV !== "production")) {
	      console.warn(`value cannot be made reactive: ${String(target)}`);
	    }
	    return target;
	  }
	  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
	    return target;
	  }
	  const existingProxy = proxyMap.get(target);
	  if (existingProxy) {
	    return existingProxy;
	  }
	  const targetType = getTargetType(target);
	  if (targetType === 0 /* INVALID */) {
	    return target;
	  }
	  const proxy = new Proxy(
	    target,
	    targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers
	  );
	  proxyMap.set(target, proxy);
	  return proxy;
	}
	function isReactive(value) {
	  if (isReadonly(value)) {
	    return isReactive(value["__v_raw"]);
	  }
	  return !!(value && value["__v_isReactive"]);
	}
	function isReadonly(value) {
	  return !!(value && value["__v_isReadonly"]);
	}
	function isShallow(value) {
	  return !!(value && value["__v_isShallow"]);
	}
	function isProxy(value) {
	  return isReactive(value) || isReadonly(value);
	}
	function toRaw(observed) {
	  const raw = observed && observed["__v_raw"];
	  return raw ? toRaw(raw) : observed;
	}
	const toReactive = (value) => isObject(value) ? reactive(value) : value;
	const toReadonly = (value) => isObject(value) ? readonly(value) : value;

	function trackRefValue(ref2) {
	  if (shouldTrack && activeEffect) {
	    ref2 = toRaw(ref2);
	    if (!!(process.env.NODE_ENV !== "production")) {
	      trackEffects(ref2.dep || (ref2.dep = createDep()), {
	        target: ref2,
	        type: "get",
	        key: "value"
	      });
	    } else {
	      trackEffects(ref2.dep || (ref2.dep = createDep()));
	    }
	  }
	}
	function triggerRefValue(ref2, newVal) {
	  ref2 = toRaw(ref2);
	  const dep = ref2.dep;
	  if (dep) {
	    if (!!(process.env.NODE_ENV !== "production")) {
	      triggerEffects(dep, {
	        target: ref2,
	        type: "set",
	        key: "value",
	        newValue: newVal
	      });
	    } else {
	      triggerEffects(dep);
	    }
	  }
	}
	function isRef(r) {
	  return !!(r && r.__v_isRef === true);
	}
	function ref(value) {
	  return createRef(value, false);
	}
	function createRef(rawValue, shallow) {
	  if (isRef(rawValue)) {
	    return rawValue;
	  }
	  return new RefImpl(rawValue, shallow);
	}
	class RefImpl {
	  constructor(value, __v_isShallow) {
	    this.__v_isShallow = __v_isShallow;
	    this.dep = void 0;
	    this.__v_isRef = true;
	    this._rawValue = __v_isShallow ? value : toRaw(value);
	    this._value = __v_isShallow ? value : toReactive(value);
	  }
	  get value() {
	    trackRefValue(this);
	    return this._value;
	  }
	  set value(newVal) {
	    const useDirectValue = this.__v_isShallow || isShallow(newVal) || isReadonly(newVal);
	    newVal = useDirectValue ? newVal : toRaw(newVal);
	    if (hasChanged(newVal, this._rawValue)) {
	      this._rawValue = newVal;
	      this._value = useDirectValue ? newVal : toReactive(newVal);
	      triggerRefValue(this, newVal);
	    }
	  }
	}

	const stack = [];
	function pushWarningContext(vnode) {
	  stack.push(vnode);
	}
	function popWarningContext() {
	  stack.pop();
	}
	function warn$1(msg, ...args) {
	  if (!!!(process.env.NODE_ENV !== "production"))
	    return;
	  pauseTracking();
	  const instance = stack.length ? stack[stack.length - 1].component : null;
	  const appWarnHandler = instance && instance.appContext.config.warnHandler;
	  const trace = getComponentTrace();
	  if (appWarnHandler) {
	    callWithErrorHandling(
	      appWarnHandler,
	      instance,
	      11,
	      [
	        msg + args.join(""),
	        instance && instance.proxy,
	        trace.map(
	          ({ vnode }) => `at <${formatComponentName(instance, vnode.type)}>`
	        ).join("\n"),
	        trace
	      ]
	    );
	  } else {
	    const warnArgs = [`[Vue warn]: ${msg}`, ...args];
	    if (trace.length && // avoid spamming console during tests
	    true) {
	      warnArgs.push(`
`, ...formatTrace(trace));
	    }
	    console.warn(...warnArgs);
	  }
	  resetTracking();
	}
	function getComponentTrace() {
	  let currentVNode = stack[stack.length - 1];
	  if (!currentVNode) {
	    return [];
	  }
	  const normalizedStack = [];
	  while (currentVNode) {
	    const last = normalizedStack[0];
	    if (last && last.vnode === currentVNode) {
	      last.recurseCount++;
	    } else {
	      normalizedStack.push({
	        vnode: currentVNode,
	        recurseCount: 0
	      });
	    }
	    const parentInstance = currentVNode.component && currentVNode.component.parent;
	    currentVNode = parentInstance && parentInstance.vnode;
	  }
	  return normalizedStack;
	}
	function formatTrace(trace) {
	  const logs = [];
	  trace.forEach((entry, i) => {
	    logs.push(...i === 0 ? [] : [`
`], ...formatTraceEntry(entry));
	  });
	  return logs;
	}
	function formatTraceEntry({ vnode, recurseCount }) {
	  const postfix = recurseCount > 0 ? `... (${recurseCount} recursive calls)` : ``;
	  const isRoot = vnode.component ? vnode.component.parent == null : false;
	  const open = ` at <${formatComponentName(
    vnode.component,
    vnode.type,
    isRoot
  )}`;
	  const close = `>` + postfix;
	  return vnode.props ? [open, ...formatProps(vnode.props), close] : [open + close];
	}
	function formatProps(props) {
	  const res = [];
	  const keys = Object.keys(props);
	  keys.slice(0, 3).forEach((key) => {
	    res.push(...formatProp(key, props[key]));
	  });
	  if (keys.length > 3) {
	    res.push(` ...`);
	  }
	  return res;
	}
	function formatProp(key, value, raw) {
	  if (isString(value)) {
	    value = JSON.stringify(value);
	    return raw ? value : [`${key}=${value}`];
	  } else if (typeof value === "number" || typeof value === "boolean" || value == null) {
	    return raw ? value : [`${key}=${value}`];
	  } else if (isRef(value)) {
	    value = formatProp(key, toRaw(value.value), true);
	    return raw ? value : [`${key}=Ref<`, value, `>`];
	  } else if (isFunction(value)) {
	    return [`${key}=fn${value.name ? `<${value.name}>` : ``}`];
	  } else {
	    value = toRaw(value);
	    return raw ? value : [`${key}=`, value];
	  }
	}

	const ErrorTypeStrings = {
	  ["sp"]: "serverPrefetch hook",
	  ["bc"]: "beforeCreate hook",
	  ["c"]: "created hook",
	  ["bm"]: "beforeMount hook",
	  ["m"]: "mounted hook",
	  ["bu"]: "beforeUpdate hook",
	  ["u"]: "updated",
	  ["bum"]: "beforeUnmount hook",
	  ["um"]: "unmounted hook",
	  ["a"]: "activated hook",
	  ["da"]: "deactivated hook",
	  ["ec"]: "errorCaptured hook",
	  ["rtc"]: "renderTracked hook",
	  ["rtg"]: "renderTriggered hook",
	  [0]: "setup function",
	  [1]: "render function",
	  [2]: "watcher getter",
	  [3]: "watcher callback",
	  [4]: "watcher cleanup function",
	  [5]: "native event handler",
	  [6]: "component event handler",
	  [7]: "vnode hook",
	  [8]: "directive hook",
	  [9]: "transition hook",
	  [10]: "app errorHandler",
	  [11]: "app warnHandler",
	  [12]: "ref function",
	  [13]: "async component loader",
	  [14]: "scheduler flush. This is likely a Vue internals bug. Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/core"
	};
	function callWithErrorHandling(fn, instance, type, args) {
	  let res;
	  try {
	    res = args ? fn(...args) : fn();
	  } catch (err) {
	    handleError(err, instance, type);
	  }
	  return res;
	}
	function handleError(err, instance, type, throwInDev = true) {
	  const contextVNode = instance ? instance.vnode : null;
	  if (instance) {
	    let cur = instance.parent;
	    const exposedInstance = instance.proxy;
	    const errorInfo = !!(process.env.NODE_ENV !== "production") ? ErrorTypeStrings[type] : type;
	    while (cur) {
	      const errorCapturedHooks = cur.ec;
	      if (errorCapturedHooks) {
	        for (let i = 0; i < errorCapturedHooks.length; i++) {
	          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
	            return;
	          }
	        }
	      }
	      cur = cur.parent;
	    }
	    const appErrorHandler = instance.appContext.config.errorHandler;
	    if (appErrorHandler) {
	      callWithErrorHandling(
	        appErrorHandler,
	        null,
	        10,
	        [err, exposedInstance, errorInfo]
	      );
	      return;
	    }
	  }
	  logError(err, type, contextVNode, throwInDev);
	}
	function logError(err, type, contextVNode, throwInDev = true) {
	  if (!!(process.env.NODE_ENV !== "production")) {
	    const info = ErrorTypeStrings[type];
	    if (contextVNode) {
	      pushWarningContext(contextVNode);
	    }
	    warn$1(`Unhandled error${info ? ` during execution of ${info}` : ``}`);
	    if (contextVNode) {
	      popWarningContext();
	    }
	    if (throwInDev) {
	      throw err;
	    } else {
	      console.error(err);
	    }
	  } else {
	    console.error(err);
	  }
	}

	let isFlushing = false;
	let isFlushPending = false;
	const queue = [];
	let flushIndex = 0;
	const pendingPostFlushCbs = [];
	let activePostFlushCbs = null;
	let postFlushIndex = 0;
	const resolvedPromise = /* @__PURE__ */ Promise.resolve();
	let currentFlushPromise = null;
	const RECURSION_LIMIT = 100;
	function findInsertionIndex(id) {
	  let start = flushIndex + 1;
	  let end = queue.length;
	  while (start < end) {
	    const middle = start + end >>> 1;
	    const middleJobId = getId(queue[middle]);
	    middleJobId < id ? start = middle + 1 : end = middle;
	  }
	  return start;
	}
	function queueJob(job) {
	  if (!queue.length || !queue.includes(
	    job,
	    isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex
	  )) {
	    if (job.id == null) {
	      queue.push(job);
	    } else {
	      queue.splice(findInsertionIndex(job.id), 0, job);
	    }
	    queueFlush();
	  }
	}
	function queueFlush() {
	  if (!isFlushing && !isFlushPending) {
	    isFlushPending = true;
	    currentFlushPromise = resolvedPromise.then(flushJobs);
	  }
	}
	function queuePostFlushCb(cb) {
	  if (!isArray(cb)) {
	    if (!activePostFlushCbs || !activePostFlushCbs.includes(
	      cb,
	      cb.allowRecurse ? postFlushIndex + 1 : postFlushIndex
	    )) {
	      pendingPostFlushCbs.push(cb);
	    }
	  } else {
	    pendingPostFlushCbs.push(...cb);
	  }
	  queueFlush();
	}
	function flushPostFlushCbs(seen) {
	  if (pendingPostFlushCbs.length) {
	    const deduped = [...new Set(pendingPostFlushCbs)];
	    pendingPostFlushCbs.length = 0;
	    if (activePostFlushCbs) {
	      activePostFlushCbs.push(...deduped);
	      return;
	    }
	    activePostFlushCbs = deduped;
	    if (!!(process.env.NODE_ENV !== "production")) {
	      seen = seen || /* @__PURE__ */ new Map();
	    }
	    activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
	    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
	      if (!!(process.env.NODE_ENV !== "production") && checkRecursiveUpdates(seen, activePostFlushCbs[postFlushIndex])) {
	        continue;
	      }
	      activePostFlushCbs[postFlushIndex]();
	    }
	    activePostFlushCbs = null;
	    postFlushIndex = 0;
	  }
	}
	const getId = (job) => job.id == null ? Infinity : job.id;
	const comparator = (a, b) => {
	  const diff = getId(a) - getId(b);
	  if (diff === 0) {
	    if (a.pre && !b.pre)
	      return -1;
	    if (b.pre && !a.pre)
	      return 1;
	  }
	  return diff;
	};
	function flushJobs(seen) {
	  isFlushPending = false;
	  isFlushing = true;
	  if (!!(process.env.NODE_ENV !== "production")) {
	    seen = seen || /* @__PURE__ */ new Map();
	  }
	  queue.sort(comparator);
	  const check = !!(process.env.NODE_ENV !== "production") ? (job) => checkRecursiveUpdates(seen, job) : NOOP;
	  try {
	    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
	      const job = queue[flushIndex];
	      if (job && job.active !== false) {
	        if (!!(process.env.NODE_ENV !== "production") && check(job)) {
	          continue;
	        }
	        callWithErrorHandling(job, null, 14);
	      }
	    }
	  } finally {
	    flushIndex = 0;
	    queue.length = 0;
	    flushPostFlushCbs(seen);
	    isFlushing = false;
	    currentFlushPromise = null;
	    if (queue.length || pendingPostFlushCbs.length) {
	      flushJobs(seen);
	    }
	  }
	}
	function checkRecursiveUpdates(seen, fn) {
	  if (!seen.has(fn)) {
	    seen.set(fn, 1);
	  } else {
	    const count = seen.get(fn);
	    if (count > RECURSION_LIMIT) {
	      const instance = fn.ownerInstance;
	      const componentName = instance && getComponentName(instance.type);
	      warn$1(
	        `Maximum recursive updates exceeded${componentName ? ` in component <${componentName}>` : ``}. This means you have a reactive effect that is mutating its own dependencies and thus recursively triggering itself. Possible sources include component template, render function, updated hook or watcher source function.`
	      );
	      return true;
	    } else {
	      seen.set(fn, count + 1);
	    }
	  }
	}
	const hmrDirtyComponents = /* @__PURE__ */ new Set();
	if (!!(process.env.NODE_ENV !== "production")) {
	  getGlobalThis().__VUE_HMR_RUNTIME__ = {
	    createRecord: tryWrap(createRecord),
	    rerender: tryWrap(rerender),
	    reload: tryWrap(reload)
	  };
	}
	const map = /* @__PURE__ */ new Map();
	function createRecord(id, initialDef) {
	  if (map.has(id)) {
	    return false;
	  }
	  map.set(id, {
	    initialDef: normalizeClassComponent(initialDef),
	    instances: /* @__PURE__ */ new Set()
	  });
	  return true;
	}
	function normalizeClassComponent(component) {
	  return isClassComponent(component) ? component.__vccOpts : component;
	}
	function rerender(id, newRender) {
	  const record = map.get(id);
	  if (!record) {
	    return;
	  }
	  record.initialDef.render = newRender;
	  [...record.instances].forEach((instance) => {
	    if (newRender) {
	      instance.render = newRender;
	      normalizeClassComponent(instance.type).render = newRender;
	    }
	    instance.renderCache = [];
	    instance.update();
	  });
	}
	function reload(id, newComp) {
	  const record = map.get(id);
	  if (!record)
	    return;
	  newComp = normalizeClassComponent(newComp);
	  updateComponentDef(record.initialDef, newComp);
	  const instances = [...record.instances];
	  for (const instance of instances) {
	    const oldComp = normalizeClassComponent(instance.type);
	    if (!hmrDirtyComponents.has(oldComp)) {
	      if (oldComp !== record.initialDef) {
	        updateComponentDef(oldComp, newComp);
	      }
	      hmrDirtyComponents.add(oldComp);
	    }
	    instance.appContext.propsCache.delete(instance.type);
	    instance.appContext.emitsCache.delete(instance.type);
	    instance.appContext.optionsCache.delete(instance.type);
	    if (instance.ceReload) {
	      hmrDirtyComponents.add(oldComp);
	      instance.ceReload(newComp.styles);
	      hmrDirtyComponents.delete(oldComp);
	    } else if (instance.parent) {
	      queueJob(instance.parent.update);
	    } else if (instance.appContext.reload) {
	      instance.appContext.reload();
	    } else if (typeof window !== "undefined") {
	      window.location.reload();
	    } else {
	      console.warn(
	        "[HMR] Root or manually mounted instance modified. Full reload required."
	      );
	    }
	  }
	  queuePostFlushCb(() => {
	    for (const instance of instances) {
	      hmrDirtyComponents.delete(
	        normalizeClassComponent(instance.type)
	      );
	    }
	  });
	}
	function updateComponentDef(oldComp, newComp) {
	  extend(oldComp, newComp);
	  for (const key in oldComp) {
	    if (key !== "__file" && !(key in newComp)) {
	      delete oldComp[key];
	    }
	  }
	}
	function tryWrap(fn) {
	  return (id, arg) => {
	    try {
	      return fn(id, arg);
	    } catch (e) {
	      console.error(e);
	      console.warn(
	        `[HMR] Something went wrong during Vue component hot-reload. Full reload required.`
	      );
	    }
	  };
	}

	let currentRenderingInstance = null;
	let currentScopeId = null;

	const isSuspense = (type) => type.__isSuspense;

	function defineComponent(options, extraOptions) {
	  return isFunction(options) ? (
	    // #8326: extend call and options.name access are considered side-effects
	    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
	    /* @__PURE__ */ (() => extend({ name: options.name }, extraOptions, { setup: options }))()
	  ) : options;
	}

	const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
	const NULL_DYNAMIC_COMPONENT = Symbol.for("v-ndc");

	function renderSlot(slots, name, props = {}, fallback, noSlotted) {
	  if (currentRenderingInstance.isCE || currentRenderingInstance.parent && isAsyncWrapper(currentRenderingInstance.parent) && currentRenderingInstance.parent.isCE) {
	    if (name !== "default")
	      props.name = name;
	    return createVNode("slot", props, fallback && fallback());
	  }
	  let slot = slots[name];
	  if (!!(process.env.NODE_ENV !== "production") && slot && slot.length > 1) {
	    warn$1(
	      `SSR-optimized slot function detected in a non-SSR-optimized render function. You need to mark this component with $dynamic-slots in the parent template.`
	    );
	    slot = () => [];
	  }
	  if (slot && slot._c) {
	    slot._d = false;
	  }
	  openBlock();
	  const validSlotContent = slot && ensureValidVNode(slot(props));
	  const rendered = createBlock(
	    Fragment,
	    {
	      key: props.key || // slot content array of a dynamic conditional slot may have a branch
	      // key attached in the `createSlots` helper, respect that
	      validSlotContent && validSlotContent.key || `_${name}`
	    },
	    validSlotContent || (fallback ? fallback() : []),
	    validSlotContent && slots._ === 1 ? 64 : -2
	  );
	  if (!noSlotted && rendered.scopeId) {
	    rendered.slotScopeIds = [rendered.scopeId + "-s"];
	  }
	  if (slot && slot._c) {
	    slot._d = true;
	  }
	  return rendered;
	}
	function ensureValidVNode(vnodes) {
	  return vnodes.some((child) => {
	    if (!isVNode(child))
	      return true;
	    if (child.type === Comment)
	      return false;
	    if (child.type === Fragment && !ensureValidVNode(child.children))
	      return false;
	    return true;
	  }) ? vnodes : null;
	}
	if (!!(process.env.NODE_ENV !== "production") && true) ;

	const isTeleport = (type) => type.__isTeleport;

	const Fragment = Symbol.for("v-fgt");
	const Text = Symbol.for("v-txt");
	const Comment = Symbol.for("v-cmt");
	const blockStack = [];
	let currentBlock = null;
	function openBlock(disableTracking = false) {
	  blockStack.push(currentBlock = disableTracking ? null : []);
	}
	function closeBlock() {
	  blockStack.pop();
	  currentBlock = blockStack[blockStack.length - 1] || null;
	}
	function setupBlock(vnode) {
	  vnode.dynamicChildren =  currentBlock || EMPTY_ARR ;
	  closeBlock();
	  if ( currentBlock) {
	    currentBlock.push(vnode);
	  }
	  return vnode;
	}
	function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
	  return setupBlock(
	    createBaseVNode(
	      type,
	      props,
	      children,
	      patchFlag,
	      dynamicProps,
	      shapeFlag,
	      true
	      /* isBlock */
	    )
	  );
	}
	function createBlock(type, props, children, patchFlag, dynamicProps) {
	  return setupBlock(
	    createVNode(
	      type,
	      props,
	      children,
	      patchFlag,
	      dynamicProps,
	      true
	      /* isBlock: prevent a block from tracking itself */
	    )
	  );
	}
	function isVNode(value) {
	  return value ? value.__v_isVNode === true : false;
	}
	const createVNodeWithArgsTransform = (...args) => {
	  return _createVNode(
	    ... args
	  );
	};
	const InternalObjectKey = `__vInternal`;
	const normalizeKey = ({ key }) => key != null ? key : null;
	const normalizeRef = ({
	  ref,
	  ref_key,
	  ref_for
	}) => {
	  if (typeof ref === "number") {
	    ref = "" + ref;
	  }
	  return ref != null ? isString(ref) || isRef(ref) || isFunction(ref) ? { i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for } : ref : null;
	};
	function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
	  const vnode = {
	    __v_isVNode: true,
	    __v_skip: true,
	    type,
	    props,
	    key: props && normalizeKey(props),
	    ref: props && normalizeRef(props),
	    scopeId: currentScopeId,
	    slotScopeIds: null,
	    children,
	    component: null,
	    suspense: null,
	    ssContent: null,
	    ssFallback: null,
	    dirs: null,
	    transition: null,
	    el: null,
	    anchor: null,
	    target: null,
	    targetAnchor: null,
	    staticCount: 0,
	    shapeFlag,
	    patchFlag,
	    dynamicProps,
	    dynamicChildren: null,
	    appContext: null,
	    ctx: currentRenderingInstance
	  };
	  if (needFullChildrenNormalization) {
	    normalizeChildren(vnode, children);
	    if (shapeFlag & 128) {
	      type.normalize(vnode);
	    }
	  } else if (children) {
	    vnode.shapeFlag |= isString(children) ? 8 : 16;
	  }
	  if (!!(process.env.NODE_ENV !== "production") && vnode.key !== vnode.key) {
	    warn$1(`VNode created with invalid key (NaN). VNode type:`, vnode.type);
	  }
	  if ( // avoid a block node from tracking itself
	  !isBlockNode && // has current parent block
	  currentBlock && // presence of a patch flag indicates this node needs patching on updates.
	  // component nodes also should always be patched, because even if the
	  // component doesn't need to update, it needs to persist the instance on to
	  // the next vnode so that it can be properly unmounted later.
	  (vnode.patchFlag > 0 || shapeFlag & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
	  // vnode should not be considered dynamic due to handler caching.
	  vnode.patchFlag !== 32) {
	    currentBlock.push(vnode);
	  }
	  return vnode;
	}
	const createVNode = !!(process.env.NODE_ENV !== "production") ? createVNodeWithArgsTransform : _createVNode;
	function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
	  if (!type || type === NULL_DYNAMIC_COMPONENT) {
	    if (!!(process.env.NODE_ENV !== "production") && !type) {
	      warn$1(`Invalid vnode type when creating vnode: ${type}.`);
	    }
	    type = Comment;
	  }
	  if (isVNode(type)) {
	    const cloned = cloneVNode(
	      type,
	      props,
	      true
	      /* mergeRef: true */
	    );
	    if (children) {
	      normalizeChildren(cloned, children);
	    }
	    if ( !isBlockNode && currentBlock) {
	      if (cloned.shapeFlag & 6) {
	        currentBlock[currentBlock.indexOf(type)] = cloned;
	      } else {
	        currentBlock.push(cloned);
	      }
	    }
	    cloned.patchFlag |= -2;
	    return cloned;
	  }
	  if (isClassComponent(type)) {
	    type = type.__vccOpts;
	  }
	  if (props) {
	    props = guardReactiveProps(props);
	    let { class: klass, style } = props;
	    if (klass && !isString(klass)) {
	      props.class = normalizeClass(klass);
	    }
	    if (isObject(style)) {
	      if (isProxy(style) && !isArray(style)) {
	        style = extend({}, style);
	      }
	      props.style = normalizeStyle(style);
	    }
	  }
	  const shapeFlag = isString(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject(type) ? 4 : isFunction(type) ? 2 : 0;
	  if (!!(process.env.NODE_ENV !== "production") && shapeFlag & 4 && isProxy(type)) {
	    type = toRaw(type);
	    warn$1(
	      `Vue received a Component which was made a reactive object. This can lead to unnecessary performance overhead, and should be avoided by marking the component with \`markRaw\` or using \`shallowRef\` instead of \`ref\`.`,
	      `
Component that was made reactive: `,
	      type
	    );
	  }
	  return createBaseVNode(
	    type,
	    props,
	    children,
	    patchFlag,
	    dynamicProps,
	    shapeFlag,
	    isBlockNode,
	    true
	  );
	}
	function guardReactiveProps(props) {
	  if (!props)
	    return null;
	  return isProxy(props) || InternalObjectKey in props ? extend({}, props) : props;
	}
	function cloneVNode(vnode, extraProps, mergeRef = false) {
	  const { props, ref, patchFlag, children } = vnode;
	  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
	  const cloned = {
	    __v_isVNode: true,
	    __v_skip: true,
	    type: vnode.type,
	    props: mergedProps,
	    key: mergedProps && normalizeKey(mergedProps),
	    ref: extraProps && extraProps.ref ? (
	      // #2078 in the case of <component :is="vnode" ref="extra"/>
	      // if the vnode itself already has a ref, cloneVNode will need to merge
	      // the refs so the single vnode can be set on multiple refs
	      mergeRef && ref ? isArray(ref) ? ref.concat(normalizeRef(extraProps)) : [ref, normalizeRef(extraProps)] : normalizeRef(extraProps)
	    ) : ref,
	    scopeId: vnode.scopeId,
	    slotScopeIds: vnode.slotScopeIds,
	    children: !!(process.env.NODE_ENV !== "production") && patchFlag === -1 && isArray(children) ? children.map(deepCloneVNode) : children,
	    target: vnode.target,
	    targetAnchor: vnode.targetAnchor,
	    staticCount: vnode.staticCount,
	    shapeFlag: vnode.shapeFlag,
	    // if the vnode is cloned with extra props, we can no longer assume its
	    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
	    // note: preserve flag for fragments since they use the flag for children
	    // fast paths only.
	    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
	    dynamicProps: vnode.dynamicProps,
	    dynamicChildren: vnode.dynamicChildren,
	    appContext: vnode.appContext,
	    dirs: vnode.dirs,
	    transition: vnode.transition,
	    // These should technically only be non-null on mounted VNodes. However,
	    // they *should* be copied for kept-alive vnodes. So we just always copy
	    // them since them being non-null during a mount doesn't affect the logic as
	    // they will simply be overwritten.
	    component: vnode.component,
	    suspense: vnode.suspense,
	    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
	    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
	    el: vnode.el,
	    anchor: vnode.anchor,
	    ctx: vnode.ctx,
	    ce: vnode.ce
	  };
	  return cloned;
	}
	function deepCloneVNode(vnode) {
	  const cloned = cloneVNode(vnode);
	  if (isArray(vnode.children)) {
	    cloned.children = vnode.children.map(deepCloneVNode);
	  }
	  return cloned;
	}
	function createTextVNode(text = " ", flag = 0) {
	  return createVNode(Text, null, text, flag);
	}
	function normalizeChildren(vnode, children) {
	  let type = 0;
	  const { shapeFlag } = vnode;
	  if (children == null) {
	    children = null;
	  } else if (isArray(children)) {
	    type = 16;
	  } else if (typeof children === "object") {
	    if (shapeFlag & (1 | 64)) {
	      const slot = children.default;
	      if (slot) {
	        slot._c && (slot._d = false);
	        normalizeChildren(vnode, slot());
	        slot._c && (slot._d = true);
	      }
	      return;
	    } else {
	      type = 32;
	      const slotFlag = children._;
	      if (!slotFlag && !(InternalObjectKey in children)) {
	        children._ctx = currentRenderingInstance;
	      } else if (slotFlag === 3 && currentRenderingInstance) {
	        if (currentRenderingInstance.slots._ === 1) {
	          children._ = 1;
	        } else {
	          children._ = 2;
	          vnode.patchFlag |= 1024;
	        }
	      }
	    }
	  } else if (isFunction(children)) {
	    children = { default: children, _ctx: currentRenderingInstance };
	    type = 32;
	  } else {
	    children = String(children);
	    if (shapeFlag & 64) {
	      type = 16;
	      children = [createTextVNode(children)];
	    } else {
	      type = 8;
	    }
	  }
	  vnode.children = children;
	  vnode.shapeFlag |= type;
	}
	function mergeProps(...args) {
	  const ret = {};
	  for (let i = 0; i < args.length; i++) {
	    const toMerge = args[i];
	    for (const key in toMerge) {
	      if (key === "class") {
	        if (ret.class !== toMerge.class) {
	          ret.class = normalizeClass([ret.class, toMerge.class]);
	        }
	      } else if (key === "style") {
	        ret.style = normalizeStyle([ret.style, toMerge.style]);
	      } else if (isOn(key)) {
	        const existing = ret[key];
	        const incoming = toMerge[key];
	        if (incoming && existing !== incoming && !(isArray(existing) && existing.includes(incoming))) {
	          ret[key] = existing ? [].concat(existing, incoming) : incoming;
	        }
	      } else if (key !== "") {
	        ret[key] = toMerge[key];
	      }
	    }
	  }
	  return ret;
	}
	let currentInstance = null;
	let globalCurrentInstanceSetters;
	let settersKey = "__VUE_INSTANCE_SETTERS__";
	{
	  if (!(globalCurrentInstanceSetters = getGlobalThis()[settersKey])) {
	    globalCurrentInstanceSetters = getGlobalThis()[settersKey] = [];
	  }
	  globalCurrentInstanceSetters.push((i) => currentInstance = i);
	}
	const classifyRE = /(?:^|[-_])(\w)/g;
	const classify = (str) => str.replace(classifyRE, (c) => c.toUpperCase()).replace(/[-_]/g, "");
	function getComponentName(Component, includeInferred = true) {
	  return isFunction(Component) ? Component.displayName || Component.name : Component.name || includeInferred && Component.__name;
	}
	function formatComponentName(instance, Component, isRoot = false) {
	  let name = getComponentName(Component);
	  if (!name && Component.__file) {
	    const match = Component.__file.match(/([^/\\]+)\.\w+$/);
	    if (match) {
	      name = match[1];
	    }
	  }
	  if (!name && instance && instance.parent) {
	    const inferFromRegistry = (registry) => {
	      for (const key in registry) {
	        if (registry[key] === Component) {
	          return key;
	        }
	      }
	    };
	    name = inferFromRegistry(
	      instance.components || instance.parent.type.components
	    ) || inferFromRegistry(instance.appContext.components);
	  }
	  return name ? classify(name) : isRoot ? `App` : `Anonymous`;
	}
	function isClassComponent(value) {
	  return isFunction(value) && "__vccOpts" in value;
	}

	function isShallow$1(value) {
	  return !!(value && value["__v_isShallow"]);
	}

	function initCustomFormatter() {
	  if (!!!(process.env.NODE_ENV !== "production") || typeof window === "undefined") {
	    return;
	  }
	  const vueStyle = { style: "color:#3ba776" };
	  const numberStyle = { style: "color:#0b1bc9" };
	  const stringStyle = { style: "color:#b62e24" };
	  const keywordStyle = { style: "color:#9d288c" };
	  const formatter = {
	    header(obj) {
	      if (!isObject(obj)) {
	        return null;
	      }
	      if (obj.__isVue) {
	        return ["div", vueStyle, `VueInstance`];
	      } else if (isRef(obj)) {
	        return [
	          "div",
	          {},
	          ["span", vueStyle, genRefFlag(obj)],
	          "<",
	          formatValue(obj.value),
	          `>`
	        ];
	      } else if (isReactive(obj)) {
	        return [
	          "div",
	          {},
	          ["span", vueStyle, isShallow$1(obj) ? "ShallowReactive" : "Reactive"],
	          "<",
	          formatValue(obj),
	          `>${isReadonly(obj) ? ` (readonly)` : ``}`
	        ];
	      } else if (isReadonly(obj)) {
	        return [
	          "div",
	          {},
	          ["span", vueStyle, isShallow$1(obj) ? "ShallowReadonly" : "Readonly"],
	          "<",
	          formatValue(obj),
	          ">"
	        ];
	      }
	      return null;
	    },
	    hasBody(obj) {
	      return obj && obj.__isVue;
	    },
	    body(obj) {
	      if (obj && obj.__isVue) {
	        return [
	          "div",
	          {},
	          ...formatInstance(obj.$)
	        ];
	      }
	    }
	  };
	  function formatInstance(instance) {
	    const blocks = [];
	    if (instance.type.props && instance.props) {
	      blocks.push(createInstanceBlock("props", toRaw(instance.props)));
	    }
	    if (instance.setupState !== EMPTY_OBJ) {
	      blocks.push(createInstanceBlock("setup", instance.setupState));
	    }
	    if (instance.data !== EMPTY_OBJ) {
	      blocks.push(createInstanceBlock("data", toRaw(instance.data)));
	    }
	    const computed = extractKeys(instance, "computed");
	    if (computed) {
	      blocks.push(createInstanceBlock("computed", computed));
	    }
	    const injected = extractKeys(instance, "inject");
	    if (injected) {
	      blocks.push(createInstanceBlock("injected", injected));
	    }
	    blocks.push([
	      "div",
	      {},
	      [
	        "span",
	        {
	          style: keywordStyle.style + ";opacity:0.66"
	        },
	        "$ (internal): "
	      ],
	      ["object", { object: instance }]
	    ]);
	    return blocks;
	  }
	  function createInstanceBlock(type, target) {
	    target = extend({}, target);
	    if (!Object.keys(target).length) {
	      return ["span", {}];
	    }
	    return [
	      "div",
	      { style: "line-height:1.25em;margin-bottom:0.6em" },
	      [
	        "div",
	        {
	          style: "color:#476582"
	        },
	        type
	      ],
	      [
	        "div",
	        {
	          style: "padding-left:1.25em"
	        },
	        ...Object.keys(target).map((key) => {
	          return [
	            "div",
	            {},
	            ["span", keywordStyle, key + ": "],
	            formatValue(target[key], false)
	          ];
	        })
	      ]
	    ];
	  }
	  function formatValue(v, asRaw = true) {
	    if (typeof v === "number") {
	      return ["span", numberStyle, v];
	    } else if (typeof v === "string") {
	      return ["span", stringStyle, JSON.stringify(v)];
	    } else if (typeof v === "boolean") {
	      return ["span", keywordStyle, v];
	    } else if (isObject(v)) {
	      return ["object", { object: asRaw ? toRaw(v) : v }];
	    } else {
	      return ["span", stringStyle, String(v)];
	    }
	  }
	  function extractKeys(instance, type) {
	    const Comp = instance.type;
	    if (isFunction(Comp)) {
	      return;
	    }
	    const extracted = {};
	    for (const key in instance.ctx) {
	      if (isKeyOfType(Comp, key, type)) {
	        extracted[key] = instance.ctx[key];
	      }
	    }
	    return extracted;
	  }
	  function isKeyOfType(Comp, key, type) {
	    const opts = Comp[type];
	    if (isArray(opts) && opts.includes(key) || isObject(opts) && key in opts) {
	      return true;
	    }
	    if (Comp.extends && isKeyOfType(Comp.extends, key, type)) {
	      return true;
	    }
	    if (Comp.mixins && Comp.mixins.some((m) => isKeyOfType(m, key, type))) {
	      return true;
	    }
	  }
	  function genRefFlag(v) {
	    if (isShallow$1(v)) {
	      return `ShallowRef`;
	    }
	    if (v.effect) {
	      return `ComputedRef`;
	    }
	    return `Ref`;
	  }
	  if (window.devtoolsFormatters) {
	    window.devtoolsFormatters.push(formatter);
	  } else {
	    window.devtoolsFormatters = [formatter];
	  }
	}

	function initDev() {
	  {
	    initCustomFormatter();
	  }
	}

	if (!!(process.env.NODE_ENV !== "production")) {
	  initDev();
	}

	var script = defineComponent({
	  props: {
	    // If true, don't download but emit a Blob
	    emitBlob: {
	      type: Boolean,
	      default: false,
	    },
	    debounce: {
	      type: Number,
	      default: 500,
	    },
	    // mime type [xls, csv]
	    type: {
	      type: String,
	      default: "xls",
	    },
	    // Json to download
	    data: {
	      type: Array,
	      required: false,
	      default: null,
	    },
	    // fields inside the Json Object that you want to export
	    // if no given, all the properties in the Json are exported
	    fields: {
	      type: Object,
	      default: () => null,
	    },
	    // this prop is used to fix the problem with other components that use the
	    // variable fields, like vee-validate. exportFields works exactly like fields
	    exportFields: {
	      type: Object,
	      default: () => null,
	    },
	    // Use as fallback when the row has no field values
	    defaultValue: {
	      type: String,
	      required: false,
	      default: "",
	    },
	    // Title(s) for the data, could be a string or an array of strings (multiple titles)
	    header: {
	      default: null,
	    },
	    // Title(s) for single column data, must be an array (ex: ['titleCol0',,TitleCol2])
	    perColumnsHeaders: {
	      default: null,
	    },
	    // Footer(s) for the data, could be a string or an array of strings (multiple footers)
	    footer: {
	      default: null,
	    },
	    // filename to export
	    name: {
	      type: String,
	      default: "data.xls",
	    },
	    fetch: {
	      type: Function,
	    },
	    meta: {
	      type: Array,
	      default: () => [],
	    },
	    worksheet: {
	      type: String,
	      default: "Sheet1",
	    },
	    //event before generate was called
	    beforeGenerate: {
	      type: Function,
	    },
	    //event before download pops up
	    beforeFinish: {
	      type: Function,
	    },
	    // Determine if CSV Data should be escaped
	    escapeCsv: {
	      type: Boolean,
	      default: true,
	    },
	    // long number stringify
	    stringifyLongNum: {
	      type: Boolean,
	      default: false,
	    },
	  },
	  setup(){
	    return {
	      isDisabled: ref(false)
	    }
	  },
	  computed: {
	    // unique identifier
	    idName() {
	      var now = new Date().getTime();
	      return "export_" + now;
	    },

	    downloadFields() {
	      if (this.fields) return this.fields;

	      if (this.exportFields) return this.exportFields;
	    },
	  },
	  methods: {
	    async generate() {

	       if (this.isDisabled) {
	        return; // return early if button is disabled
	      }
	      this.isDisabled = true;
	      const debounce = this.$props.debounce;
	      let timeoutId = null;

	      return new Promise((resolve, reject) => {
	        const executeGenerate = async () => {
	          if (typeof this.beforeGenerate === "function") {
	            await this.beforeGenerate();
	          }
	          let data = this.data;
	          if (typeof this.fetch === "function" || !data) data = await this.fetch();

	          if (!data || !data.length) {
	            if (typeof this.beforeFinish === "function") await this.beforeFinish();
	            return;
	          }

	          let json = await this.getProcessedJson(data, this.downloadFields);
	          if (this.type === "html") {
	            // this is mainly for testing
	            return this.export(
	              this.jsonToXLS(json),
	              this.name.replace(".xls", ".html"),
	              "text/html"
	            );
	          } else if (this.type === "csv") {
	            return this.export(
	              this.jsonToCSV(json),
	              this.name.replace(".xls", ".csv"),
	              "application/csv"
	            );
	          }
	          return this.export(
	            this.jsonToXLS(json),
	            this.name,
	            "application/vnd.ms-excel"
	          );
	        };

	        const debouncedGenerate = () => {
	          let self = this;
	          if (timeoutId) {
	            clearTimeout(timeoutId);
	          }
	          timeoutId = setTimeout(() => {
	            executeGenerate().then(resolve).catch(reject);
	            self.isDisabled = false;
	          }, debounce);
	        };

	        debouncedGenerate();
	      });
	    },
	    /*
			Use downloadjs to generate the download link
			*/
	    export: async function (data, filename, mime) {
	      let blob = this.base64ToBlob(data, mime);
	      if (typeof this.beforeFinish === "function") await this.beforeFinish();
	      if (this.emitBlob) this.$emit("blob", blob);
	      else download(blob, filename, mime);
	    },
	    /*
			jsonToXLS
			---------------
			Transform json data into an xml document with MS Excel format, sadly
			it shows a prompt when it opens, that is a default behavior for
			Microsoft office and cannot be avoided. It's recommended to use CSV format instead.
			*/
	    jsonToXLS(data) {
	      let xlsTemp =
	        '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta name=ProgId content=Excel.Sheet> <meta name=Generator content="Microsoft Excel 11"><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><style>br {mso-data-placement: same-cell;}</style></head><body><table>${table}</table></body></html>';
	      let xlsData = "<thead>";
	      const colspan = Object.keys(data[0]).length;
	      let _self = this;

	      //Header
	      const header = this.header || this.$attrs.title;
	      if (header) {
	        xlsData += this.parseExtraData(
	          header,
	          '<tr><th colspan="' + colspan + '">${data}</th></tr>'
	        );
	      }
	      // perColumnsHeaders
	      const perColumnsHeaders = this.perColumnsHeaders;
	      if (Array.isArray(perColumnsHeaders)) {
	        xlsData += "<tr>";
	        for (let pchKey in perColumnsHeaders) {
	          xlsData += "<th>" + perColumnsHeaders[pchKey] + "</th>";
	        }
	        xlsData += "</tr>";
	      }

	      //Fields
	      xlsData += "<tr>";
	      for (let key in data[0]) {
	        xlsData += "<th>" + key + "</th>";
	      }
	      xlsData += "</tr>";
	      xlsData += "</thead>";

	      //Data
	      xlsData += "<tbody>";
	      data.map(function (item, index) {
	        xlsData += "<tr>";
	        for (let key in item) {
	          xlsData +=
	            "<td>" +
	            _self.preprocessLongNum(
	              _self.valueReformattedForMultilines(item[key])
	            ) +
	            "</td>";
	        }
	        xlsData += "</tr>";
	      });
	      xlsData += "</tbody>";

	      //Footer
	      if (this.footer != null) {
	        xlsData += "<tfoot>";
	        xlsData += this.parseExtraData(
	          this.footer,
	          '<tr><td colspan="' + colspan + '">${data}</td></tr>'
	        );
	        xlsData += "</tfoot>";
	      }

	      return xlsTemp
	        .replace("${table}", xlsData)
	        .replace("${worksheet}", this.worksheet);
	    },
	    /*
			jsonToCSV
			---------------
			Transform json data into an CSV file.
			*/
	    jsonToCSV(data) {
	      let _self = this;
	      var csvData = [];

	      //Header
	      const header = this.header || this.$attrs.title;
	      if (header) {
	        csvData.push(this.parseExtraData(header, "${data}\r\n"));
	      }

	      // perColumnsHeaders
	      const perColumnsHeaders = this.perColumnsHeaders;
	      if (Array.isArray(perColumnsHeaders)) {
	        for (let pchKey in perColumnsHeaders) {
	          csvData.push(perColumnsHeaders[pchKey]);
	          csvData.push(",");
	        }
	        csvData.pop();
	        csvData.push("\r\n");
	      }

	      //Fields
	      for (let key in data[0]) {
	        csvData.push(key);
	        csvData.push(",");
	      }
	      csvData.pop();
	      csvData.push("\r\n");
	      //Data
	      data.map(function (item) {
	        for (let key in item) {
	          let escapedCSV = item[key] + "";
	          // Escaped CSV data to string to avoid problems with numbers or other types of values
	          // this is controlled by the prop escapeCsv
	          if (_self.escapeCsv) {
	            escapedCSV = '="' + escapedCSV + '"'; // cast Numbers to string
	            if (escapedCSV.match(/[,"\n]/)) {
	              escapedCSV = '"' + escapedCSV.replace(/\"/g, '""') + '"';
	            }
	          }
	          csvData.push(escapedCSV);
	          csvData.push(",");
	        }
	        csvData.pop();
	        csvData.push("\r\n");
	      });
	      //Footer
	      if (this.footer != null) {
	        csvData.push(this.parseExtraData(this.footer, "${data}\r\n"));
	      }
	      return csvData.join("");
	    },
	    /*
			getProcessedJson
			---------------
			Get only the data to export, if no fields are set return all the data
			*/
	    async getProcessedJson(data, header) {
	      let keys = this.getKeys(data, header);
	      let newData = [];
	      let _self = this;
	      await data.reduce(async function (prev, current) {
	        await prev;
	        let newItem = {};
	        for (let label in keys) {
	          let property = keys[label];
	          newItem[label] = await _self.getValue(property, current);
	        }
	        newData.push(newItem);
	        return true;
	      }, []);

	      return newData;
	    },
	    getKeys(data, header) {
	      if (header) {
	        return header;
	      }

	      let keys = {};
	      for (let key in data[0]) {
	        keys[key] = key;
	      }
	      return keys;
	    },
	    /*
			parseExtraData
			---------------
			Parse title and footer attribute to the csv format
			*/
	    parseExtraData(extraData, format) {
	      let parseData = "";
	      if (Array.isArray(extraData)) {
	        for (var i = 0; i < extraData.length; i++) {
	          if (extraData[i])
	            parseData += format.replace("${data}", extraData[i]);
	        }
	      } else {
	        parseData += format.replace("${data}", extraData);
	      }
	      return parseData;
	    },

	    async getValue(key, item) {
	      const field = typeof key !== "object" ? key : key.field;
	      let indexes = typeof field !== "string" ? [] : field.split(".");
	      let value = this.defaultValue;

	      if (!field) value = item;
	      else if (indexes.length > 1)
	        value = await this.getValueFromNestedItem(item, indexes);
	      else value = this.parseValue(item[field]);

	      if (key.hasOwnProperty("callback"))
	        value = await this.getValueFromCallback(value, key.callback);

	      return value;
	    },

	    /*
	    convert values with newline \n characters into <br/>
	    */
	    valueReformattedForMultilines(value) {
	      if (typeof value == "string") return value.replace(/\n/gi, "<br/>");
	      else return value;
	    },
	    preprocessLongNum(value) {
	      if (this.stringifyLongNum) {
	        if (String(value).startsWith("0x")) {
	          return value;
	        }
	        if (!isNaN(value) && value != "") {
	          if (value > 99999999999 || value < 0.0000000000001) {
	            return '="' + value + '"';
	          }
	        }
	      }
	      return value;
	    },
	    getValueFromNestedItem(item, indexes) {
	      let nestedItem = item;
	      for (let index of indexes) {
	        if (nestedItem) nestedItem = nestedItem[index];
	      }
	      return this.parseValue(nestedItem);
	    },

	    async getValueFromCallback(item, callback) {
	      if (typeof callback !== "function") return this.defaultValue;
	      const value = await callback(item);
	      return this.parseValue(value);
	    },
	    parseValue(value) {
	      return value || value === 0 || typeof value === "boolean"
	        ? value
	        : this.defaultValue;
	    },
	    base64ToBlob(data, mime) {
	      let base64 = window.btoa(window.unescape(encodeURIComponent(data)));
	      let bstr = atob(base64);
	      let n = bstr.length;
	      let u8arr = new Uint8ClampedArray(n);
	      while (n--) {
	        u8arr[n] = bstr.charCodeAt(n);
	      }
	      return new Blob([u8arr], {type: mime});
	    },
	  }, // end methods
	});

	const _hoisted_1 = ["id"];

	function render(_ctx, _cache, $props, $setup, $data, $options) {
	  return (openBlock(), createElementBlock("div", {
	    id: _ctx.idName,
	    onClick: _cache[0] || (_cache[0] = (...args) => (_ctx.generate && _ctx.generate(...args))),
	    style: normalizeStyle(_ctx.isDisabled?{
	  'opacity': '0.5',
	  'pointer-events': 'none'}:{})
	  }, [
	    renderSlot(_ctx.$slots, "default", {}, () => [
	      createTextVNode(" Download " + toDisplayString(_ctx.name), 1 /* TEXT */)
	    ])
	  ], 12 /* STYLE, PROPS */, _hoisted_1))
	}

	script.render = render;
	script.__file = "JsonExcel.vue";

	return script;

})));
