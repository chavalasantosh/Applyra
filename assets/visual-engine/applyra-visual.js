function G1(i) {
  return i && i.__esModule && Object.prototype.hasOwnProperty.call(i, "default") ? i.default : i;
}
var zr = { exports: {} }, il = {};
/**
 * @license React
 * react-jsx-runtime.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Jm;
function X1() {
  if (Jm) return il;
  Jm = 1;
  var i = Symbol.for("react.transitional.element"), l = Symbol.for("react.fragment");
  function u(o, c, h) {
    var f = null;
    if (h !== void 0 && (f = "" + h), c.key !== void 0 && (f = "" + c.key), "key" in c) {
      h = {};
      for (var m in c)
        m !== "key" && (h[m] = c[m]);
    } else h = c;
    return c = h.ref, {
      $$typeof: i,
      type: o,
      key: f,
      ref: c !== void 0 ? c : null,
      props: h
    };
  }
  return il.Fragment = l, il.jsx = u, il.jsxs = u, il;
}
var Fm;
function Z1() {
  return Fm || (Fm = 1, zr.exports = X1()), zr.exports;
}
var L = Z1(), _r = { exports: {} }, ot = {};
/**
 * @license React
 * react.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Wm;
function K1() {
  if (Wm) return ot;
  Wm = 1;
  var i = Symbol.for("react.transitional.element"), l = Symbol.for("react.portal"), u = Symbol.for("react.fragment"), o = Symbol.for("react.strict_mode"), c = Symbol.for("react.profiler"), h = Symbol.for("react.consumer"), f = Symbol.for("react.context"), m = Symbol.for("react.forward_ref"), v = Symbol.for("react.suspense"), p = Symbol.for("react.memo"), g = Symbol.for("react.lazy"), S = Symbol.iterator;
  function b(A) {
    return A === null || typeof A != "object" ? null : (A = S && A[S] || A["@@iterator"], typeof A == "function" ? A : null);
  }
  var V = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, D = Object.assign, z = {};
  function B(A, j, k) {
    this.props = A, this.context = j, this.refs = z, this.updater = k || V;
  }
  B.prototype.isReactComponent = {}, B.prototype.setState = function(A, j) {
    if (typeof A != "object" && typeof A != "function" && A != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, A, j, "setState");
  }, B.prototype.forceUpdate = function(A) {
    this.updater.enqueueForceUpdate(this, A, "forceUpdate");
  };
  function H() {
  }
  H.prototype = B.prototype;
  function X(A, j, k) {
    this.props = A, this.context = j, this.refs = z, this.updater = k || V;
  }
  var q = X.prototype = new H();
  q.constructor = X, D(q, B.prototype), q.isPureReactComponent = !0;
  var G = Array.isArray, Z = { H: null, A: null, T: null, S: null, V: null }, it = Object.prototype.hasOwnProperty;
  function at(A, j, k, Q, tt, gt) {
    return k = gt.ref, {
      $$typeof: i,
      type: A,
      key: j,
      ref: k !== void 0 ? k : null,
      props: gt
    };
  }
  function P(A, j) {
    return at(
      A.type,
      j,
      void 0,
      void 0,
      void 0,
      A.props
    );
  }
  function st(A) {
    return typeof A == "object" && A !== null && A.$$typeof === i;
  }
  function $(A) {
    var j = { "=": "=0", ":": "=2" };
    return "$" + A.replace(/[=:]/g, function(k) {
      return j[k];
    });
  }
  var mt = /\/+/g;
  function pt(A, j) {
    return typeof A == "object" && A !== null && A.key != null ? $("" + A.key) : j.toString(36);
  }
  function Jt() {
  }
  function Zt(A) {
    switch (A.status) {
      case "fulfilled":
        return A.value;
      case "rejected":
        throw A.reason;
      default:
        switch (typeof A.status == "string" ? A.then(Jt, Jt) : (A.status = "pending", A.then(
          function(j) {
            A.status === "pending" && (A.status = "fulfilled", A.value = j);
          },
          function(j) {
            A.status === "pending" && (A.status = "rejected", A.reason = j);
          }
        )), A.status) {
          case "fulfilled":
            return A.value;
          case "rejected":
            throw A.reason;
        }
    }
    throw A;
  }
  function Ct(A, j, k, Q, tt) {
    var gt = typeof A;
    (gt === "undefined" || gt === "boolean") && (A = null);
    var ut = !1;
    if (A === null) ut = !0;
    else
      switch (gt) {
        case "bigint":
        case "string":
        case "number":
          ut = !0;
          break;
        case "object":
          switch (A.$$typeof) {
            case i:
            case l:
              ut = !0;
              break;
            case g:
              return ut = A._init, Ct(
                ut(A._payload),
                j,
                k,
                Q,
                tt
              );
          }
      }
    if (ut)
      return tt = tt(A), ut = Q === "" ? "." + pt(A, 0) : Q, G(tt) ? (k = "", ut != null && (k = ut.replace(mt, "$&/") + "/"), Ct(tt, j, k, "", function(dn) {
        return dn;
      })) : tt != null && (st(tt) && (tt = P(
        tt,
        k + (tt.key == null || A && A.key === tt.key ? "" : ("" + tt.key).replace(
          mt,
          "$&/"
        ) + "/") + ut
      )), j.push(tt)), 1;
    ut = 0;
    var he = Q === "" ? "." : Q + ":";
    if (G(A))
      for (var Vt = 0; Vt < A.length; Vt++)
        Q = A[Vt], gt = he + pt(Q, Vt), ut += Ct(
          Q,
          j,
          k,
          gt,
          tt
        );
    else if (Vt = b(A), typeof Vt == "function")
      for (A = Vt.call(A), Vt = 0; !(Q = A.next()).done; )
        Q = Q.value, gt = he + pt(Q, Vt++), ut += Ct(
          Q,
          j,
          k,
          gt,
          tt
        );
    else if (gt === "object") {
      if (typeof A.then == "function")
        return Ct(
          Zt(A),
          j,
          k,
          Q,
          tt
        );
      throw j = String(A), Error(
        "Objects are not valid as a React child (found: " + (j === "[object Object]" ? "object with keys {" + Object.keys(A).join(", ") + "}" : j) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return ut;
  }
  function w(A, j, k) {
    if (A == null) return A;
    var Q = [], tt = 0;
    return Ct(A, Q, "", "", function(gt) {
      return j.call(k, gt, tt++);
    }), Q;
  }
  function K(A) {
    if (A._status === -1) {
      var j = A._result;
      j = j(), j.then(
        function(k) {
          (A._status === 0 || A._status === -1) && (A._status = 1, A._result = k);
        },
        function(k) {
          (A._status === 0 || A._status === -1) && (A._status = 2, A._result = k);
        }
      ), A._status === -1 && (A._status = 0, A._result = j);
    }
    if (A._status === 1) return A._result.default;
    throw A._result;
  }
  var J = typeof reportError == "function" ? reportError : function(A) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var j = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof A == "object" && A !== null && typeof A.message == "string" ? String(A.message) : String(A),
        error: A
      });
      if (!window.dispatchEvent(j)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", A);
      return;
    }
    console.error(A);
  };
  function rt() {
  }
  return ot.Children = {
    map: w,
    forEach: function(A, j, k) {
      w(
        A,
        function() {
          j.apply(this, arguments);
        },
        k
      );
    },
    count: function(A) {
      var j = 0;
      return w(A, function() {
        j++;
      }), j;
    },
    toArray: function(A) {
      return w(A, function(j) {
        return j;
      }) || [];
    },
    only: function(A) {
      if (!st(A))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return A;
    }
  }, ot.Component = B, ot.Fragment = u, ot.Profiler = c, ot.PureComponent = X, ot.StrictMode = o, ot.Suspense = v, ot.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Z, ot.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(A) {
      return Z.H.useMemoCache(A);
    }
  }, ot.cache = function(A) {
    return function() {
      return A.apply(null, arguments);
    };
  }, ot.cloneElement = function(A, j, k) {
    if (A == null)
      throw Error(
        "The argument must be a React element, but you passed " + A + "."
      );
    var Q = D({}, A.props), tt = A.key, gt = void 0;
    if (j != null)
      for (ut in j.ref !== void 0 && (gt = void 0), j.key !== void 0 && (tt = "" + j.key), j)
        !it.call(j, ut) || ut === "key" || ut === "__self" || ut === "__source" || ut === "ref" && j.ref === void 0 || (Q[ut] = j[ut]);
    var ut = arguments.length - 2;
    if (ut === 1) Q.children = k;
    else if (1 < ut) {
      for (var he = Array(ut), Vt = 0; Vt < ut; Vt++)
        he[Vt] = arguments[Vt + 2];
      Q.children = he;
    }
    return at(A.type, tt, void 0, void 0, gt, Q);
  }, ot.createContext = function(A) {
    return A = {
      $$typeof: f,
      _currentValue: A,
      _currentValue2: A,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, A.Provider = A, A.Consumer = {
      $$typeof: h,
      _context: A
    }, A;
  }, ot.createElement = function(A, j, k) {
    var Q, tt = {}, gt = null;
    if (j != null)
      for (Q in j.key !== void 0 && (gt = "" + j.key), j)
        it.call(j, Q) && Q !== "key" && Q !== "__self" && Q !== "__source" && (tt[Q] = j[Q]);
    var ut = arguments.length - 2;
    if (ut === 1) tt.children = k;
    else if (1 < ut) {
      for (var he = Array(ut), Vt = 0; Vt < ut; Vt++)
        he[Vt] = arguments[Vt + 2];
      tt.children = he;
    }
    if (A && A.defaultProps)
      for (Q in ut = A.defaultProps, ut)
        tt[Q] === void 0 && (tt[Q] = ut[Q]);
    return at(A, gt, void 0, void 0, null, tt);
  }, ot.createRef = function() {
    return { current: null };
  }, ot.forwardRef = function(A) {
    return { $$typeof: m, render: A };
  }, ot.isValidElement = st, ot.lazy = function(A) {
    return {
      $$typeof: g,
      _payload: { _status: -1, _result: A },
      _init: K
    };
  }, ot.memo = function(A, j) {
    return {
      $$typeof: p,
      type: A,
      compare: j === void 0 ? null : j
    };
  }, ot.startTransition = function(A) {
    var j = Z.T, k = {};
    Z.T = k;
    try {
      var Q = A(), tt = Z.S;
      tt !== null && tt(k, Q), typeof Q == "object" && Q !== null && typeof Q.then == "function" && Q.then(rt, J);
    } catch (gt) {
      J(gt);
    } finally {
      Z.T = j;
    }
  }, ot.unstable_useCacheRefresh = function() {
    return Z.H.useCacheRefresh();
  }, ot.use = function(A) {
    return Z.H.use(A);
  }, ot.useActionState = function(A, j, k) {
    return Z.H.useActionState(A, j, k);
  }, ot.useCallback = function(A, j) {
    return Z.H.useCallback(A, j);
  }, ot.useContext = function(A) {
    return Z.H.useContext(A);
  }, ot.useDebugValue = function() {
  }, ot.useDeferredValue = function(A, j) {
    return Z.H.useDeferredValue(A, j);
  }, ot.useEffect = function(A, j, k) {
    var Q = Z.H;
    if (typeof k == "function")
      throw Error(
        "useEffect CRUD overload is not enabled in this build of React."
      );
    return Q.useEffect(A, j);
  }, ot.useId = function() {
    return Z.H.useId();
  }, ot.useImperativeHandle = function(A, j, k) {
    return Z.H.useImperativeHandle(A, j, k);
  }, ot.useInsertionEffect = function(A, j) {
    return Z.H.useInsertionEffect(A, j);
  }, ot.useLayoutEffect = function(A, j) {
    return Z.H.useLayoutEffect(A, j);
  }, ot.useMemo = function(A, j) {
    return Z.H.useMemo(A, j);
  }, ot.useOptimistic = function(A, j) {
    return Z.H.useOptimistic(A, j);
  }, ot.useReducer = function(A, j, k) {
    return Z.H.useReducer(A, j, k);
  }, ot.useRef = function(A) {
    return Z.H.useRef(A);
  }, ot.useState = function(A) {
    return Z.H.useState(A);
  }, ot.useSyncExternalStore = function(A, j, k) {
    return Z.H.useSyncExternalStore(
      A,
      j,
      k
    );
  }, ot.useTransition = function() {
    return Z.H.useTransition();
  }, ot.version = "19.1.0", ot;
}
var $m;
function Dc() {
  return $m || ($m = 1, _r.exports = K1()), _r.exports;
}
var Y = Dc();
const Ey = /* @__PURE__ */ G1(Y);
var Br = { exports: {} }, al = {}, Nr = { exports: {} }, Ur = {};
/**
 * @license React
 * scheduler.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Im;
function Q1() {
  return Im || (Im = 1, (function(i) {
    function l(w, K) {
      var J = w.length;
      w.push(K);
      t: for (; 0 < J; ) {
        var rt = J - 1 >>> 1, A = w[rt];
        if (0 < c(A, K))
          w[rt] = K, w[J] = A, J = rt;
        else break t;
      }
    }
    function u(w) {
      return w.length === 0 ? null : w[0];
    }
    function o(w) {
      if (w.length === 0) return null;
      var K = w[0], J = w.pop();
      if (J !== K) {
        w[0] = J;
        t: for (var rt = 0, A = w.length, j = A >>> 1; rt < j; ) {
          var k = 2 * (rt + 1) - 1, Q = w[k], tt = k + 1, gt = w[tt];
          if (0 > c(Q, J))
            tt < A && 0 > c(gt, Q) ? (w[rt] = gt, w[tt] = J, rt = tt) : (w[rt] = Q, w[k] = J, rt = k);
          else if (tt < A && 0 > c(gt, J))
            w[rt] = gt, w[tt] = J, rt = tt;
          else break t;
        }
      }
      return K;
    }
    function c(w, K) {
      var J = w.sortIndex - K.sortIndex;
      return J !== 0 ? J : w.id - K.id;
    }
    if (i.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var h = performance;
      i.unstable_now = function() {
        return h.now();
      };
    } else {
      var f = Date, m = f.now();
      i.unstable_now = function() {
        return f.now() - m;
      };
    }
    var v = [], p = [], g = 1, S = null, b = 3, V = !1, D = !1, z = !1, B = !1, H = typeof setTimeout == "function" ? setTimeout : null, X = typeof clearTimeout == "function" ? clearTimeout : null, q = typeof setImmediate < "u" ? setImmediate : null;
    function G(w) {
      for (var K = u(p); K !== null; ) {
        if (K.callback === null) o(p);
        else if (K.startTime <= w)
          o(p), K.sortIndex = K.expirationTime, l(v, K);
        else break;
        K = u(p);
      }
    }
    function Z(w) {
      if (z = !1, G(w), !D)
        if (u(v) !== null)
          D = !0, it || (it = !0, pt());
        else {
          var K = u(p);
          K !== null && Ct(Z, K.startTime - w);
        }
    }
    var it = !1, at = -1, P = 5, st = -1;
    function $() {
      return B ? !0 : !(i.unstable_now() - st < P);
    }
    function mt() {
      if (B = !1, it) {
        var w = i.unstable_now();
        st = w;
        var K = !0;
        try {
          t: {
            D = !1, z && (z = !1, X(at), at = -1), V = !0;
            var J = b;
            try {
              e: {
                for (G(w), S = u(v); S !== null && !(S.expirationTime > w && $()); ) {
                  var rt = S.callback;
                  if (typeof rt == "function") {
                    S.callback = null, b = S.priorityLevel;
                    var A = rt(
                      S.expirationTime <= w
                    );
                    if (w = i.unstable_now(), typeof A == "function") {
                      S.callback = A, G(w), K = !0;
                      break e;
                    }
                    S === u(v) && o(v), G(w);
                  } else o(v);
                  S = u(v);
                }
                if (S !== null) K = !0;
                else {
                  var j = u(p);
                  j !== null && Ct(
                    Z,
                    j.startTime - w
                  ), K = !1;
                }
              }
              break t;
            } finally {
              S = null, b = J, V = !1;
            }
            K = void 0;
          }
        } finally {
          K ? pt() : it = !1;
        }
      }
    }
    var pt;
    if (typeof q == "function")
      pt = function() {
        q(mt);
      };
    else if (typeof MessageChannel < "u") {
      var Jt = new MessageChannel(), Zt = Jt.port2;
      Jt.port1.onmessage = mt, pt = function() {
        Zt.postMessage(null);
      };
    } else
      pt = function() {
        H(mt, 0);
      };
    function Ct(w, K) {
      at = H(function() {
        w(i.unstable_now());
      }, K);
    }
    i.unstable_IdlePriority = 5, i.unstable_ImmediatePriority = 1, i.unstable_LowPriority = 4, i.unstable_NormalPriority = 3, i.unstable_Profiling = null, i.unstable_UserBlockingPriority = 2, i.unstable_cancelCallback = function(w) {
      w.callback = null;
    }, i.unstable_forceFrameRate = function(w) {
      0 > w || 125 < w ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : P = 0 < w ? Math.floor(1e3 / w) : 5;
    }, i.unstable_getCurrentPriorityLevel = function() {
      return b;
    }, i.unstable_next = function(w) {
      switch (b) {
        case 1:
        case 2:
        case 3:
          var K = 3;
          break;
        default:
          K = b;
      }
      var J = b;
      b = K;
      try {
        return w();
      } finally {
        b = J;
      }
    }, i.unstable_requestPaint = function() {
      B = !0;
    }, i.unstable_runWithPriority = function(w, K) {
      switch (w) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          w = 3;
      }
      var J = b;
      b = w;
      try {
        return K();
      } finally {
        b = J;
      }
    }, i.unstable_scheduleCallback = function(w, K, J) {
      var rt = i.unstable_now();
      switch (typeof J == "object" && J !== null ? (J = J.delay, J = typeof J == "number" && 0 < J ? rt + J : rt) : J = rt, w) {
        case 1:
          var A = -1;
          break;
        case 2:
          A = 250;
          break;
        case 5:
          A = 1073741823;
          break;
        case 4:
          A = 1e4;
          break;
        default:
          A = 5e3;
      }
      return A = J + A, w = {
        id: g++,
        callback: K,
        priorityLevel: w,
        startTime: J,
        expirationTime: A,
        sortIndex: -1
      }, J > rt ? (w.sortIndex = J, l(p, w), u(v) === null && w === u(p) && (z ? (X(at), at = -1) : z = !0, Ct(Z, J - rt))) : (w.sortIndex = A, l(v, w), D || V || (D = !0, it || (it = !0, pt()))), w;
    }, i.unstable_shouldYield = $, i.unstable_wrapCallback = function(w) {
      var K = b;
      return function() {
        var J = b;
        b = K;
        try {
          return w.apply(this, arguments);
        } finally {
          b = J;
        }
      };
    };
  })(Ur)), Ur;
}
var tp;
function k1() {
  return tp || (tp = 1, Nr.exports = Q1()), Nr.exports;
}
var jr = { exports: {} }, ie = {};
/**
 * @license React
 * react-dom.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ep;
function P1() {
  if (ep) return ie;
  ep = 1;
  var i = Dc();
  function l(v) {
    var p = "https://react.dev/errors/" + v;
    if (1 < arguments.length) {
      p += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var g = 2; g < arguments.length; g++)
        p += "&args[]=" + encodeURIComponent(arguments[g]);
    }
    return "Minified React error #" + v + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function u() {
  }
  var o = {
    d: {
      f: u,
      r: function() {
        throw Error(l(522));
      },
      D: u,
      C: u,
      L: u,
      m: u,
      X: u,
      S: u,
      M: u
    },
    p: 0,
    findDOMNode: null
  }, c = Symbol.for("react.portal");
  function h(v, p, g) {
    var S = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: c,
      key: S == null ? null : "" + S,
      children: v,
      containerInfo: p,
      implementation: g
    };
  }
  var f = i.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function m(v, p) {
    if (v === "font") return "";
    if (typeof p == "string")
      return p === "use-credentials" ? p : "";
  }
  return ie.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = o, ie.createPortal = function(v, p) {
    var g = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
      throw Error(l(299));
    return h(v, p, null, g);
  }, ie.flushSync = function(v) {
    var p = f.T, g = o.p;
    try {
      if (f.T = null, o.p = 2, v) return v();
    } finally {
      f.T = p, o.p = g, o.d.f();
    }
  }, ie.preconnect = function(v, p) {
    typeof v == "string" && (p ? (p = p.crossOrigin, p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null, o.d.C(v, p));
  }, ie.prefetchDNS = function(v) {
    typeof v == "string" && o.d.D(v);
  }, ie.preinit = function(v, p) {
    if (typeof v == "string" && p && typeof p.as == "string") {
      var g = p.as, S = m(g, p.crossOrigin), b = typeof p.integrity == "string" ? p.integrity : void 0, V = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
      g === "style" ? o.d.S(
        v,
        typeof p.precedence == "string" ? p.precedence : void 0,
        {
          crossOrigin: S,
          integrity: b,
          fetchPriority: V
        }
      ) : g === "script" && o.d.X(v, {
        crossOrigin: S,
        integrity: b,
        fetchPriority: V,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0
      });
    }
  }, ie.preinitModule = function(v, p) {
    if (typeof v == "string")
      if (typeof p == "object" && p !== null) {
        if (p.as == null || p.as === "script") {
          var g = m(
            p.as,
            p.crossOrigin
          );
          o.d.M(v, {
            crossOrigin: g,
            integrity: typeof p.integrity == "string" ? p.integrity : void 0,
            nonce: typeof p.nonce == "string" ? p.nonce : void 0
          });
        }
      } else p == null && o.d.M(v);
  }, ie.preload = function(v, p) {
    if (typeof v == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
      var g = p.as, S = m(g, p.crossOrigin);
      o.d.L(v, g, {
        crossOrigin: S,
        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
        nonce: typeof p.nonce == "string" ? p.nonce : void 0,
        type: typeof p.type == "string" ? p.type : void 0,
        fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
        referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
        imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
        imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
        media: typeof p.media == "string" ? p.media : void 0
      });
    }
  }, ie.preloadModule = function(v, p) {
    if (typeof v == "string")
      if (p) {
        var g = m(p.as, p.crossOrigin);
        o.d.m(v, {
          as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
          crossOrigin: g,
          integrity: typeof p.integrity == "string" ? p.integrity : void 0
        });
      } else o.d.m(v);
  }, ie.requestFormReset = function(v) {
    o.d.r(v);
  }, ie.unstable_batchedUpdates = function(v, p) {
    return v(p);
  }, ie.useFormState = function(v, p, g) {
    return f.H.useFormState(v, p, g);
  }, ie.useFormStatus = function() {
    return f.H.useHostTransitionStatus();
  }, ie.version = "19.1.0", ie;
}
var np;
function My() {
  if (np) return jr.exports;
  np = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (l) {
        console.error(l);
      }
  }
  return i(), jr.exports = P1(), jr.exports;
}
/**
 * @license React
 * react-dom-client.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var ip;
function J1() {
  if (ip) return al;
  ip = 1;
  var i = k1(), l = Dc(), u = My();
  function o(t) {
    var e = "https://react.dev/errors/" + t;
    if (1 < arguments.length) {
      e += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var n = 2; n < arguments.length; n++)
        e += "&args[]=" + encodeURIComponent(arguments[n]);
    }
    return "Minified React error #" + t + "; visit " + e + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function c(t) {
    return !(!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11);
  }
  function h(t) {
    var e = t, n = t;
    if (t.alternate) for (; e.return; ) e = e.return;
    else {
      t = e;
      do
        e = t, (e.flags & 4098) !== 0 && (n = e.return), t = e.return;
      while (t);
    }
    return e.tag === 3 ? n : null;
  }
  function f(t) {
    if (t.tag === 13) {
      var e = t.memoizedState;
      if (e === null && (t = t.alternate, t !== null && (e = t.memoizedState)), e !== null) return e.dehydrated;
    }
    return null;
  }
  function m(t) {
    if (h(t) !== t)
      throw Error(o(188));
  }
  function v(t) {
    var e = t.alternate;
    if (!e) {
      if (e = h(t), e === null) throw Error(o(188));
      return e !== t ? null : t;
    }
    for (var n = t, a = e; ; ) {
      var s = n.return;
      if (s === null) break;
      var r = s.alternate;
      if (r === null) {
        if (a = s.return, a !== null) {
          n = a;
          continue;
        }
        break;
      }
      if (s.child === r.child) {
        for (r = s.child; r; ) {
          if (r === n) return m(s), t;
          if (r === a) return m(s), e;
          r = r.sibling;
        }
        throw Error(o(188));
      }
      if (n.return !== a.return) n = s, a = r;
      else {
        for (var d = !1, y = s.child; y; ) {
          if (y === n) {
            d = !0, n = s, a = r;
            break;
          }
          if (y === a) {
            d = !0, a = s, n = r;
            break;
          }
          y = y.sibling;
        }
        if (!d) {
          for (y = r.child; y; ) {
            if (y === n) {
              d = !0, n = r, a = s;
              break;
            }
            if (y === a) {
              d = !0, a = r, n = s;
              break;
            }
            y = y.sibling;
          }
          if (!d) throw Error(o(189));
        }
      }
      if (n.alternate !== a) throw Error(o(190));
    }
    if (n.tag !== 3) throw Error(o(188));
    return n.stateNode.current === n ? t : e;
  }
  function p(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t;
    for (t = t.child; t !== null; ) {
      if (e = p(t), e !== null) return e;
      t = t.sibling;
    }
    return null;
  }
  var g = Object.assign, S = Symbol.for("react.element"), b = Symbol.for("react.transitional.element"), V = Symbol.for("react.portal"), D = Symbol.for("react.fragment"), z = Symbol.for("react.strict_mode"), B = Symbol.for("react.profiler"), H = Symbol.for("react.provider"), X = Symbol.for("react.consumer"), q = Symbol.for("react.context"), G = Symbol.for("react.forward_ref"), Z = Symbol.for("react.suspense"), it = Symbol.for("react.suspense_list"), at = Symbol.for("react.memo"), P = Symbol.for("react.lazy"), st = Symbol.for("react.activity"), $ = Symbol.for("react.memo_cache_sentinel"), mt = Symbol.iterator;
  function pt(t) {
    return t === null || typeof t != "object" ? null : (t = mt && t[mt] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var Jt = Symbol.for("react.client.reference");
  function Zt(t) {
    if (t == null) return null;
    if (typeof t == "function")
      return t.$$typeof === Jt ? null : t.displayName || t.name || null;
    if (typeof t == "string") return t;
    switch (t) {
      case D:
        return "Fragment";
      case B:
        return "Profiler";
      case z:
        return "StrictMode";
      case Z:
        return "Suspense";
      case it:
        return "SuspenseList";
      case st:
        return "Activity";
    }
    if (typeof t == "object")
      switch (t.$$typeof) {
        case V:
          return "Portal";
        case q:
          return (t.displayName || "Context") + ".Provider";
        case X:
          return (t._context.displayName || "Context") + ".Consumer";
        case G:
          var e = t.render;
          return t = t.displayName, t || (t = e.displayName || e.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
        case at:
          return e = t.displayName || null, e !== null ? e : Zt(t.type) || "Memo";
        case P:
          e = t._payload, t = t._init;
          try {
            return Zt(t(e));
          } catch {
          }
      }
    return null;
  }
  var Ct = Array.isArray, w = l.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, K = u.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, J = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, rt = [], A = -1;
  function j(t) {
    return { current: t };
  }
  function k(t) {
    0 > A || (t.current = rt[A], rt[A] = null, A--);
  }
  function Q(t, e) {
    A++, rt[A] = t.current, t.current = e;
  }
  var tt = j(null), gt = j(null), ut = j(null), he = j(null);
  function Vt(t, e) {
    switch (Q(ut, e), Q(gt, t), Q(tt, null), e.nodeType) {
      case 9:
      case 11:
        t = (t = e.documentElement) && (t = t.namespaceURI) ? xm(t) : 0;
        break;
      default:
        if (t = e.tagName, e = e.namespaceURI)
          e = xm(e), t = Em(e, t);
        else
          switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
    }
    k(tt), Q(tt, t);
  }
  function dn() {
    k(tt), k(gt), k(ut);
  }
  function yu(t) {
    t.memoizedState !== null && Q(he, t);
    var e = tt.current, n = Em(e, t.type);
    e !== n && (Q(gt, t), Q(tt, n));
  }
  function Al(t) {
    gt.current === t && (k(tt), k(gt)), he.current === t && (k(he), $a._currentValue = J);
  }
  var gu = Object.prototype.hasOwnProperty, vu = i.unstable_scheduleCallback, Su = i.unstable_cancelCallback, b0 = i.unstable_shouldYield, T0 = i.unstable_requestPaint, qe = i.unstable_now, A0 = i.unstable_getCurrentPriorityLevel, nf = i.unstable_ImmediatePriority, af = i.unstable_UserBlockingPriority, xl = i.unstable_NormalPriority, x0 = i.unstable_LowPriority, lf = i.unstable_IdlePriority, E0 = i.log, M0 = i.unstable_setDisableYieldValue, sa = null, de = null;
  function mn(t) {
    if (typeof E0 == "function" && M0(t), de && typeof de.setStrictMode == "function")
      try {
        de.setStrictMode(sa, t);
      } catch {
      }
  }
  var me = Math.clz32 ? Math.clz32 : C0, D0 = Math.log, R0 = Math.LN2;
  function C0(t) {
    return t >>>= 0, t === 0 ? 32 : 31 - (D0(t) / R0 | 0) | 0;
  }
  var El = 256, Ml = 4194304;
  function Gn(t) {
    var e = t & 42;
    if (e !== 0) return e;
    switch (t & -t) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t & 4194048;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return t & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return t;
    }
  }
  function Dl(t, e, n) {
    var a = t.pendingLanes;
    if (a === 0) return 0;
    var s = 0, r = t.suspendedLanes, d = t.pingedLanes;
    t = t.warmLanes;
    var y = a & 134217727;
    return y !== 0 ? (a = y & ~r, a !== 0 ? s = Gn(a) : (d &= y, d !== 0 ? s = Gn(d) : n || (n = y & ~t, n !== 0 && (s = Gn(n))))) : (y = a & ~r, y !== 0 ? s = Gn(y) : d !== 0 ? s = Gn(d) : n || (n = a & ~t, n !== 0 && (s = Gn(n)))), s === 0 ? 0 : e !== 0 && e !== s && (e & r) === 0 && (r = s & -s, n = e & -e, r >= n || r === 32 && (n & 4194048) !== 0) ? e : s;
  }
  function ua(t, e) {
    return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & e) === 0;
  }
  function O0(t, e) {
    switch (t) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return e + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function sf() {
    var t = El;
    return El <<= 1, (El & 4194048) === 0 && (El = 256), t;
  }
  function uf() {
    var t = Ml;
    return Ml <<= 1, (Ml & 62914560) === 0 && (Ml = 4194304), t;
  }
  function bu(t) {
    for (var e = [], n = 0; 31 > n; n++) e.push(t);
    return e;
  }
  function oa(t, e) {
    t.pendingLanes |= e, e !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
  }
  function V0(t, e, n, a, s, r) {
    var d = t.pendingLanes;
    t.pendingLanes = n, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= n, t.entangledLanes &= n, t.errorRecoveryDisabledLanes &= n, t.shellSuspendCounter = 0;
    var y = t.entanglements, T = t.expirationTimes, R = t.hiddenUpdates;
    for (n = d & ~n; 0 < n; ) {
      var _ = 31 - me(n), U = 1 << _;
      y[_] = 0, T[_] = -1;
      var C = R[_];
      if (C !== null)
        for (R[_] = null, _ = 0; _ < C.length; _++) {
          var O = C[_];
          O !== null && (O.lane &= -536870913);
        }
      n &= ~U;
    }
    a !== 0 && of(t, a, 0), r !== 0 && s === 0 && t.tag !== 0 && (t.suspendedLanes |= r & ~(d & ~e));
  }
  function of(t, e, n) {
    t.pendingLanes |= e, t.suspendedLanes &= ~e;
    var a = 31 - me(e);
    t.entangledLanes |= e, t.entanglements[a] = t.entanglements[a] | 1073741824 | n & 4194090;
  }
  function rf(t, e) {
    var n = t.entangledLanes |= e;
    for (t = t.entanglements; n; ) {
      var a = 31 - me(n), s = 1 << a;
      s & e | t[a] & e && (t[a] |= e), n &= ~s;
    }
  }
  function Tu(t) {
    switch (t) {
      case 2:
        t = 1;
        break;
      case 8:
        t = 4;
        break;
      case 32:
        t = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        t = 128;
        break;
      case 268435456:
        t = 134217728;
        break;
      default:
        t = 0;
    }
    return t;
  }
  function Au(t) {
    return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function cf() {
    var t = K.p;
    return t !== 0 ? t : (t = window.event, t === void 0 ? 32 : Xm(t.type));
  }
  function w0(t, e) {
    var n = K.p;
    try {
      return K.p = t, e();
    } finally {
      K.p = n;
    }
  }
  var pn = Math.random().toString(36).slice(2), ee = "__reactFiber$" + pn, ue = "__reactProps$" + pn, hi = "__reactContainer$" + pn, xu = "__reactEvents$" + pn, z0 = "__reactListeners$" + pn, _0 = "__reactHandles$" + pn, ff = "__reactResources$" + pn, ra = "__reactMarker$" + pn;
  function Eu(t) {
    delete t[ee], delete t[ue], delete t[xu], delete t[z0], delete t[_0];
  }
  function di(t) {
    var e = t[ee];
    if (e) return e;
    for (var n = t.parentNode; n; ) {
      if (e = n[hi] || n[ee]) {
        if (n = e.alternate, e.child !== null || n !== null && n.child !== null)
          for (t = Cm(t); t !== null; ) {
            if (n = t[ee]) return n;
            t = Cm(t);
          }
        return e;
      }
      t = n, n = t.parentNode;
    }
    return null;
  }
  function mi(t) {
    if (t = t[ee] || t[hi]) {
      var e = t.tag;
      if (e === 5 || e === 6 || e === 13 || e === 26 || e === 27 || e === 3)
        return t;
    }
    return null;
  }
  function ca(t) {
    var e = t.tag;
    if (e === 5 || e === 26 || e === 27 || e === 6) return t.stateNode;
    throw Error(o(33));
  }
  function pi(t) {
    var e = t[ff];
    return e || (e = t[ff] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), e;
  }
  function Kt(t) {
    t[ra] = !0;
  }
  var hf = /* @__PURE__ */ new Set(), df = {};
  function Xn(t, e) {
    yi(t, e), yi(t + "Capture", e);
  }
  function yi(t, e) {
    for (df[t] = e, t = 0; t < e.length; t++)
      hf.add(e[t]);
  }
  var B0 = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), mf = {}, pf = {};
  function N0(t) {
    return gu.call(pf, t) ? !0 : gu.call(mf, t) ? !1 : B0.test(t) ? pf[t] = !0 : (mf[t] = !0, !1);
  }
  function Rl(t, e, n) {
    if (N0(e))
      if (n === null) t.removeAttribute(e);
      else {
        switch (typeof n) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(e);
            return;
          case "boolean":
            var a = e.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              t.removeAttribute(e);
              return;
            }
        }
        t.setAttribute(e, "" + n);
      }
  }
  function Cl(t, e, n) {
    if (n === null) t.removeAttribute(e);
    else {
      switch (typeof n) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(e);
          return;
      }
      t.setAttribute(e, "" + n);
    }
  }
  function Fe(t, e, n, a) {
    if (a === null) t.removeAttribute(n);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(n);
          return;
      }
      t.setAttributeNS(e, n, "" + a);
    }
  }
  var Mu, yf;
  function gi(t) {
    if (Mu === void 0)
      try {
        throw Error();
      } catch (n) {
        var e = n.stack.trim().match(/\n( *(at )?)/);
        Mu = e && e[1] || "", yf = -1 < n.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < n.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + Mu + t + yf;
  }
  var Du = !1;
  function Ru(t, e) {
    if (!t || Du) return "";
    Du = !0;
    var n = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (e) {
              var U = function() {
                throw Error();
              };
              if (Object.defineProperty(U.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(U, []);
                } catch (O) {
                  var C = O;
                }
                Reflect.construct(t, [], U);
              } else {
                try {
                  U.call();
                } catch (O) {
                  C = O;
                }
                t.call(U.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (O) {
                C = O;
              }
              (U = t()) && typeof U.catch == "function" && U.catch(function() {
              });
            }
          } catch (O) {
            if (O && C && typeof O.stack == "string")
              return [O.stack, C.stack];
          }
          return [null, null];
        }
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var s = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name"
      );
      s && s.configurable && Object.defineProperty(
        a.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var r = a.DetermineComponentFrameRoot(), d = r[0], y = r[1];
      if (d && y) {
        var T = d.split(`
`), R = y.split(`
`);
        for (s = a = 0; a < T.length && !T[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; s < R.length && !R[s].includes(
          "DetermineComponentFrameRoot"
        ); )
          s++;
        if (a === T.length || s === R.length)
          for (a = T.length - 1, s = R.length - 1; 1 <= a && 0 <= s && T[a] !== R[s]; )
            s--;
        for (; 1 <= a && 0 <= s; a--, s--)
          if (T[a] !== R[s]) {
            if (a !== 1 || s !== 1)
              do
                if (a--, s--, 0 > s || T[a] !== R[s]) {
                  var _ = `
` + T[a].replace(" at new ", " at ");
                  return t.displayName && _.includes("<anonymous>") && (_ = _.replace("<anonymous>", t.displayName)), _;
                }
              while (1 <= a && 0 <= s);
            break;
          }
      }
    } finally {
      Du = !1, Error.prepareStackTrace = n;
    }
    return (n = t ? t.displayName || t.name : "") ? gi(n) : "";
  }
  function U0(t) {
    switch (t.tag) {
      case 26:
      case 27:
      case 5:
        return gi(t.type);
      case 16:
        return gi("Lazy");
      case 13:
        return gi("Suspense");
      case 19:
        return gi("SuspenseList");
      case 0:
      case 15:
        return Ru(t.type, !1);
      case 11:
        return Ru(t.type.render, !1);
      case 1:
        return Ru(t.type, !0);
      case 31:
        return gi("Activity");
      default:
        return "";
    }
  }
  function gf(t) {
    try {
      var e = "";
      do
        e += U0(t), t = t.return;
      while (t);
      return e;
    } catch (n) {
      return `
Error generating stack: ` + n.message + `
` + n.stack;
    }
  }
  function xe(t) {
    switch (typeof t) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return t;
      case "object":
        return t;
      default:
        return "";
    }
  }
  function vf(t) {
    var e = t.type;
    return (t = t.nodeName) && t.toLowerCase() === "input" && (e === "checkbox" || e === "radio");
  }
  function j0(t) {
    var e = vf(t) ? "checked" : "value", n = Object.getOwnPropertyDescriptor(
      t.constructor.prototype,
      e
    ), a = "" + t[e];
    if (!t.hasOwnProperty(e) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
      var s = n.get, r = n.set;
      return Object.defineProperty(t, e, {
        configurable: !0,
        get: function() {
          return s.call(this);
        },
        set: function(d) {
          a = "" + d, r.call(this, d);
        }
      }), Object.defineProperty(t, e, {
        enumerable: n.enumerable
      }), {
        getValue: function() {
          return a;
        },
        setValue: function(d) {
          a = "" + d;
        },
        stopTracking: function() {
          t._valueTracker = null, delete t[e];
        }
      };
    }
  }
  function Ol(t) {
    t._valueTracker || (t._valueTracker = j0(t));
  }
  function Sf(t) {
    if (!t) return !1;
    var e = t._valueTracker;
    if (!e) return !0;
    var n = e.getValue(), a = "";
    return t && (a = vf(t) ? t.checked ? "true" : "false" : t.value), t = a, t !== n ? (e.setValue(t), !0) : !1;
  }
  function Vl(t) {
    if (t = t || (typeof document < "u" ? document : void 0), typeof t > "u") return null;
    try {
      return t.activeElement || t.body;
    } catch {
      return t.body;
    }
  }
  var L0 = /[\n"\\]/g;
  function Ee(t) {
    return t.replace(
      L0,
      function(e) {
        return "\\" + e.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function Cu(t, e, n, a, s, r, d, y) {
    t.name = "", d != null && typeof d != "function" && typeof d != "symbol" && typeof d != "boolean" ? t.type = d : t.removeAttribute("type"), e != null ? d === "number" ? (e === 0 && t.value === "" || t.value != e) && (t.value = "" + xe(e)) : t.value !== "" + xe(e) && (t.value = "" + xe(e)) : d !== "submit" && d !== "reset" || t.removeAttribute("value"), e != null ? Ou(t, d, xe(e)) : n != null ? Ou(t, d, xe(n)) : a != null && t.removeAttribute("value"), s == null && r != null && (t.defaultChecked = !!r), s != null && (t.checked = s && typeof s != "function" && typeof s != "symbol"), y != null && typeof y != "function" && typeof y != "symbol" && typeof y != "boolean" ? t.name = "" + xe(y) : t.removeAttribute("name");
  }
  function bf(t, e, n, a, s, r, d, y) {
    if (r != null && typeof r != "function" && typeof r != "symbol" && typeof r != "boolean" && (t.type = r), e != null || n != null) {
      if (!(r !== "submit" && r !== "reset" || e != null))
        return;
      n = n != null ? "" + xe(n) : "", e = e != null ? "" + xe(e) : n, y || e === t.value || (t.value = e), t.defaultValue = e;
    }
    a = a ?? s, a = typeof a != "function" && typeof a != "symbol" && !!a, t.checked = y ? t.checked : !!a, t.defaultChecked = !!a, d != null && typeof d != "function" && typeof d != "symbol" && typeof d != "boolean" && (t.name = d);
  }
  function Ou(t, e, n) {
    e === "number" && Vl(t.ownerDocument) === t || t.defaultValue === "" + n || (t.defaultValue = "" + n);
  }
  function vi(t, e, n, a) {
    if (t = t.options, e) {
      e = {};
      for (var s = 0; s < n.length; s++)
        e["$" + n[s]] = !0;
      for (n = 0; n < t.length; n++)
        s = e.hasOwnProperty("$" + t[n].value), t[n].selected !== s && (t[n].selected = s), s && a && (t[n].defaultSelected = !0);
    } else {
      for (n = "" + xe(n), e = null, s = 0; s < t.length; s++) {
        if (t[s].value === n) {
          t[s].selected = !0, a && (t[s].defaultSelected = !0);
          return;
        }
        e !== null || t[s].disabled || (e = t[s]);
      }
      e !== null && (e.selected = !0);
    }
  }
  function Tf(t, e, n) {
    if (e != null && (e = "" + xe(e), e !== t.value && (t.value = e), n == null)) {
      t.defaultValue !== e && (t.defaultValue = e);
      return;
    }
    t.defaultValue = n != null ? "" + xe(n) : "";
  }
  function Af(t, e, n, a) {
    if (e == null) {
      if (a != null) {
        if (n != null) throw Error(o(92));
        if (Ct(a)) {
          if (1 < a.length) throw Error(o(93));
          a = a[0];
        }
        n = a;
      }
      n == null && (n = ""), e = n;
    }
    n = xe(e), t.defaultValue = n, a = t.textContent, a === n && a !== "" && a !== null && (t.value = a);
  }
  function Si(t, e) {
    if (e) {
      var n = t.firstChild;
      if (n && n === t.lastChild && n.nodeType === 3) {
        n.nodeValue = e;
        return;
      }
    }
    t.textContent = e;
  }
  var H0 = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function xf(t, e, n) {
    var a = e.indexOf("--") === 0;
    n == null || typeof n == "boolean" || n === "" ? a ? t.setProperty(e, "") : e === "float" ? t.cssFloat = "" : t[e] = "" : a ? t.setProperty(e, n) : typeof n != "number" || n === 0 || H0.has(e) ? e === "float" ? t.cssFloat = n : t[e] = ("" + n).trim() : t[e] = n + "px";
  }
  function Ef(t, e, n) {
    if (e != null && typeof e != "object")
      throw Error(o(62));
    if (t = t.style, n != null) {
      for (var a in n)
        !n.hasOwnProperty(a) || e != null && e.hasOwnProperty(a) || (a.indexOf("--") === 0 ? t.setProperty(a, "") : a === "float" ? t.cssFloat = "" : t[a] = "");
      for (var s in e)
        a = e[s], e.hasOwnProperty(s) && n[s] !== a && xf(t, s, a);
    } else
      for (var r in e)
        e.hasOwnProperty(r) && xf(t, r, e[r]);
  }
  function Vu(t) {
    if (t.indexOf("-") === -1) return !1;
    switch (t) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var q0 = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), Y0 = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function wl(t) {
    return Y0.test("" + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
  }
  var wu = null;
  function zu(t) {
    return t = t.target || t.srcElement || window, t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t;
  }
  var bi = null, Ti = null;
  function Mf(t) {
    var e = mi(t);
    if (e && (t = e.stateNode)) {
      var n = t[ue] || null;
      t: switch (t = e.stateNode, e.type) {
        case "input":
          if (Cu(
            t,
            n.value,
            n.defaultValue,
            n.defaultValue,
            n.checked,
            n.defaultChecked,
            n.type,
            n.name
          ), e = n.name, n.type === "radio" && e != null) {
            for (n = t; n.parentNode; ) n = n.parentNode;
            for (n = n.querySelectorAll(
              'input[name="' + Ee(
                "" + e
              ) + '"][type="radio"]'
            ), e = 0; e < n.length; e++) {
              var a = n[e];
              if (a !== t && a.form === t.form) {
                var s = a[ue] || null;
                if (!s) throw Error(o(90));
                Cu(
                  a,
                  s.value,
                  s.defaultValue,
                  s.defaultValue,
                  s.checked,
                  s.defaultChecked,
                  s.type,
                  s.name
                );
              }
            }
            for (e = 0; e < n.length; e++)
              a = n[e], a.form === t.form && Sf(a);
          }
          break t;
        case "textarea":
          Tf(t, n.value, n.defaultValue);
          break t;
        case "select":
          e = n.value, e != null && vi(t, !!n.multiple, e, !1);
      }
    }
  }
  var _u = !1;
  function Df(t, e, n) {
    if (_u) return t(e, n);
    _u = !0;
    try {
      var a = t(e);
      return a;
    } finally {
      if (_u = !1, (bi !== null || Ti !== null) && (ys(), bi && (e = bi, t = Ti, Ti = bi = null, Mf(e), t)))
        for (e = 0; e < t.length; e++) Mf(t[e]);
    }
  }
  function fa(t, e) {
    var n = t.stateNode;
    if (n === null) return null;
    var a = n[ue] || null;
    if (a === null) return null;
    n = a[e];
    t: switch (e) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (a = !a.disabled) || (t = t.type, a = !(t === "button" || t === "input" || t === "select" || t === "textarea")), t = !a;
        break t;
      default:
        t = !1;
    }
    if (t) return null;
    if (n && typeof n != "function")
      throw Error(
        o(231, e, typeof n)
      );
    return n;
  }
  var We = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Bu = !1;
  if (We)
    try {
      var ha = {};
      Object.defineProperty(ha, "passive", {
        get: function() {
          Bu = !0;
        }
      }), window.addEventListener("test", ha, ha), window.removeEventListener("test", ha, ha);
    } catch {
      Bu = !1;
    }
  var yn = null, Nu = null, zl = null;
  function Rf() {
    if (zl) return zl;
    var t, e = Nu, n = e.length, a, s = "value" in yn ? yn.value : yn.textContent, r = s.length;
    for (t = 0; t < n && e[t] === s[t]; t++) ;
    var d = n - t;
    for (a = 1; a <= d && e[n - a] === s[r - a]; a++) ;
    return zl = s.slice(t, 1 < a ? 1 - a : void 0);
  }
  function _l(t) {
    var e = t.keyCode;
    return "charCode" in t ? (t = t.charCode, t === 0 && e === 13 && (t = 13)) : t = e, t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0;
  }
  function Bl() {
    return !0;
  }
  function Cf() {
    return !1;
  }
  function oe(t) {
    function e(n, a, s, r, d) {
      this._reactName = n, this._targetInst = s, this.type = a, this.nativeEvent = r, this.target = d, this.currentTarget = null;
      for (var y in t)
        t.hasOwnProperty(y) && (n = t[y], this[y] = n ? n(r) : r[y]);
      return this.isDefaultPrevented = (r.defaultPrevented != null ? r.defaultPrevented : r.returnValue === !1) ? Bl : Cf, this.isPropagationStopped = Cf, this;
    }
    return g(e.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1), this.isDefaultPrevented = Bl);
      },
      stopPropagation: function() {
        var n = this.nativeEvent;
        n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0), this.isPropagationStopped = Bl);
      },
      persist: function() {
      },
      isPersistent: Bl
    }), e;
  }
  var Zn = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(t) {
      return t.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, Nl = oe(Zn), da = g({}, Zn, { view: 0, detail: 0 }), G0 = oe(da), Uu, ju, ma, Ul = g({}, da, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Hu,
    button: 0,
    buttons: 0,
    relatedTarget: function(t) {
      return t.relatedTarget === void 0 ? t.fromElement === t.srcElement ? t.toElement : t.fromElement : t.relatedTarget;
    },
    movementX: function(t) {
      return "movementX" in t ? t.movementX : (t !== ma && (ma && t.type === "mousemove" ? (Uu = t.screenX - ma.screenX, ju = t.screenY - ma.screenY) : ju = Uu = 0, ma = t), Uu);
    },
    movementY: function(t) {
      return "movementY" in t ? t.movementY : ju;
    }
  }), Of = oe(Ul), X0 = g({}, Ul, { dataTransfer: 0 }), Z0 = oe(X0), K0 = g({}, da, { relatedTarget: 0 }), Lu = oe(K0), Q0 = g({}, Zn, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), k0 = oe(Q0), P0 = g({}, Zn, {
    clipboardData: function(t) {
      return "clipboardData" in t ? t.clipboardData : window.clipboardData;
    }
  }), J0 = oe(P0), F0 = g({}, Zn, { data: 0 }), Vf = oe(F0), W0 = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, $0 = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, I0 = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function tv(t) {
    var e = this.nativeEvent;
    return e.getModifierState ? e.getModifierState(t) : (t = I0[t]) ? !!e[t] : !1;
  }
  function Hu() {
    return tv;
  }
  var ev = g({}, da, {
    key: function(t) {
      if (t.key) {
        var e = W0[t.key] || t.key;
        if (e !== "Unidentified") return e;
      }
      return t.type === "keypress" ? (t = _l(t), t === 13 ? "Enter" : String.fromCharCode(t)) : t.type === "keydown" || t.type === "keyup" ? $0[t.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Hu,
    charCode: function(t) {
      return t.type === "keypress" ? _l(t) : 0;
    },
    keyCode: function(t) {
      return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    },
    which: function(t) {
      return t.type === "keypress" ? _l(t) : t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    }
  }), nv = oe(ev), iv = g({}, Ul, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), wf = oe(iv), av = g({}, da, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Hu
  }), lv = oe(av), sv = g({}, Zn, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), uv = oe(sv), ov = g({}, Ul, {
    deltaX: function(t) {
      return "deltaX" in t ? t.deltaX : "wheelDeltaX" in t ? -t.wheelDeltaX : 0;
    },
    deltaY: function(t) {
      return "deltaY" in t ? t.deltaY : "wheelDeltaY" in t ? -t.wheelDeltaY : "wheelDelta" in t ? -t.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), rv = oe(ov), cv = g({}, Zn, {
    newState: 0,
    oldState: 0
  }), fv = oe(cv), hv = [9, 13, 27, 32], qu = We && "CompositionEvent" in window, pa = null;
  We && "documentMode" in document && (pa = document.documentMode);
  var dv = We && "TextEvent" in window && !pa, zf = We && (!qu || pa && 8 < pa && 11 >= pa), _f = " ", Bf = !1;
  function Nf(t, e) {
    switch (t) {
      case "keyup":
        return hv.indexOf(e.keyCode) !== -1;
      case "keydown":
        return e.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function Uf(t) {
    return t = t.detail, typeof t == "object" && "data" in t ? t.data : null;
  }
  var Ai = !1;
  function mv(t, e) {
    switch (t) {
      case "compositionend":
        return Uf(e);
      case "keypress":
        return e.which !== 32 ? null : (Bf = !0, _f);
      case "textInput":
        return t = e.data, t === _f && Bf ? null : t;
      default:
        return null;
    }
  }
  function pv(t, e) {
    if (Ai)
      return t === "compositionend" || !qu && Nf(t, e) ? (t = Rf(), zl = Nu = yn = null, Ai = !1, t) : null;
    switch (t) {
      case "paste":
        return null;
      case "keypress":
        if (!(e.ctrlKey || e.altKey || e.metaKey) || e.ctrlKey && e.altKey) {
          if (e.char && 1 < e.char.length)
            return e.char;
          if (e.which) return String.fromCharCode(e.which);
        }
        return null;
      case "compositionend":
        return zf && e.locale !== "ko" ? null : e.data;
      default:
        return null;
    }
  }
  var yv = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function jf(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e === "input" ? !!yv[t.type] : e === "textarea";
  }
  function Lf(t, e, n, a) {
    bi ? Ti ? Ti.push(a) : Ti = [a] : bi = a, e = As(e, "onChange"), 0 < e.length && (n = new Nl(
      "onChange",
      "change",
      null,
      n,
      a
    ), t.push({ event: n, listeners: e }));
  }
  var ya = null, ga = null;
  function gv(t) {
    vm(t, 0);
  }
  function jl(t) {
    var e = ca(t);
    if (Sf(e)) return t;
  }
  function Hf(t, e) {
    if (t === "change") return e;
  }
  var qf = !1;
  if (We) {
    var Yu;
    if (We) {
      var Gu = "oninput" in document;
      if (!Gu) {
        var Yf = document.createElement("div");
        Yf.setAttribute("oninput", "return;"), Gu = typeof Yf.oninput == "function";
      }
      Yu = Gu;
    } else Yu = !1;
    qf = Yu && (!document.documentMode || 9 < document.documentMode);
  }
  function Gf() {
    ya && (ya.detachEvent("onpropertychange", Xf), ga = ya = null);
  }
  function Xf(t) {
    if (t.propertyName === "value" && jl(ga)) {
      var e = [];
      Lf(
        e,
        ga,
        t,
        zu(t)
      ), Df(gv, e);
    }
  }
  function vv(t, e, n) {
    t === "focusin" ? (Gf(), ya = e, ga = n, ya.attachEvent("onpropertychange", Xf)) : t === "focusout" && Gf();
  }
  function Sv(t) {
    if (t === "selectionchange" || t === "keyup" || t === "keydown")
      return jl(ga);
  }
  function bv(t, e) {
    if (t === "click") return jl(e);
  }
  function Tv(t, e) {
    if (t === "input" || t === "change")
      return jl(e);
  }
  function Av(t, e) {
    return t === e && (t !== 0 || 1 / t === 1 / e) || t !== t && e !== e;
  }
  var pe = typeof Object.is == "function" ? Object.is : Av;
  function va(t, e) {
    if (pe(t, e)) return !0;
    if (typeof t != "object" || t === null || typeof e != "object" || e === null)
      return !1;
    var n = Object.keys(t), a = Object.keys(e);
    if (n.length !== a.length) return !1;
    for (a = 0; a < n.length; a++) {
      var s = n[a];
      if (!gu.call(e, s) || !pe(t[s], e[s]))
        return !1;
    }
    return !0;
  }
  function Zf(t) {
    for (; t && t.firstChild; ) t = t.firstChild;
    return t;
  }
  function Kf(t, e) {
    var n = Zf(t);
    t = 0;
    for (var a; n; ) {
      if (n.nodeType === 3) {
        if (a = t + n.textContent.length, t <= e && a >= e)
          return { node: n, offset: e - t };
        t = a;
      }
      t: {
        for (; n; ) {
          if (n.nextSibling) {
            n = n.nextSibling;
            break t;
          }
          n = n.parentNode;
        }
        n = void 0;
      }
      n = Zf(n);
    }
  }
  function Qf(t, e) {
    return t && e ? t === e ? !0 : t && t.nodeType === 3 ? !1 : e && e.nodeType === 3 ? Qf(t, e.parentNode) : "contains" in t ? t.contains(e) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(e) & 16) : !1 : !1;
  }
  function kf(t) {
    t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
    for (var e = Vl(t.document); e instanceof t.HTMLIFrameElement; ) {
      try {
        var n = typeof e.contentWindow.location.href == "string";
      } catch {
        n = !1;
      }
      if (n) t = e.contentWindow;
      else break;
      e = Vl(t.document);
    }
    return e;
  }
  function Xu(t) {
    var e = t && t.nodeName && t.nodeName.toLowerCase();
    return e && (e === "input" && (t.type === "text" || t.type === "search" || t.type === "tel" || t.type === "url" || t.type === "password") || e === "textarea" || t.contentEditable === "true");
  }
  var xv = We && "documentMode" in document && 11 >= document.documentMode, xi = null, Zu = null, Sa = null, Ku = !1;
  function Pf(t, e, n) {
    var a = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
    Ku || xi == null || xi !== Vl(a) || (a = xi, "selectionStart" in a && Xu(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), Sa && va(Sa, a) || (Sa = a, a = As(Zu, "onSelect"), 0 < a.length && (e = new Nl(
      "onSelect",
      "select",
      null,
      e,
      n
    ), t.push({ event: e, listeners: a }), e.target = xi)));
  }
  function Kn(t, e) {
    var n = {};
    return n[t.toLowerCase()] = e.toLowerCase(), n["Webkit" + t] = "webkit" + e, n["Moz" + t] = "moz" + e, n;
  }
  var Ei = {
    animationend: Kn("Animation", "AnimationEnd"),
    animationiteration: Kn("Animation", "AnimationIteration"),
    animationstart: Kn("Animation", "AnimationStart"),
    transitionrun: Kn("Transition", "TransitionRun"),
    transitionstart: Kn("Transition", "TransitionStart"),
    transitioncancel: Kn("Transition", "TransitionCancel"),
    transitionend: Kn("Transition", "TransitionEnd")
  }, Qu = {}, Jf = {};
  We && (Jf = document.createElement("div").style, "AnimationEvent" in window || (delete Ei.animationend.animation, delete Ei.animationiteration.animation, delete Ei.animationstart.animation), "TransitionEvent" in window || delete Ei.transitionend.transition);
  function Qn(t) {
    if (Qu[t]) return Qu[t];
    if (!Ei[t]) return t;
    var e = Ei[t], n;
    for (n in e)
      if (e.hasOwnProperty(n) && n in Jf)
        return Qu[t] = e[n];
    return t;
  }
  var Ff = Qn("animationend"), Wf = Qn("animationiteration"), $f = Qn("animationstart"), Ev = Qn("transitionrun"), Mv = Qn("transitionstart"), Dv = Qn("transitioncancel"), If = Qn("transitionend"), th = /* @__PURE__ */ new Map(), ku = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  ku.push("scrollEnd");
  function Be(t, e) {
    th.set(t, e), Xn(e, [t]);
  }
  var eh = /* @__PURE__ */ new WeakMap();
  function Me(t, e) {
    if (typeof t == "object" && t !== null) {
      var n = eh.get(t);
      return n !== void 0 ? n : (e = {
        value: t,
        source: e,
        stack: gf(e)
      }, eh.set(t, e), e);
    }
    return {
      value: t,
      source: e,
      stack: gf(e)
    };
  }
  var De = [], Mi = 0, Pu = 0;
  function Ll() {
    for (var t = Mi, e = Pu = Mi = 0; e < t; ) {
      var n = De[e];
      De[e++] = null;
      var a = De[e];
      De[e++] = null;
      var s = De[e];
      De[e++] = null;
      var r = De[e];
      if (De[e++] = null, a !== null && s !== null) {
        var d = a.pending;
        d === null ? s.next = s : (s.next = d.next, d.next = s), a.pending = s;
      }
      r !== 0 && nh(n, s, r);
    }
  }
  function Hl(t, e, n, a) {
    De[Mi++] = t, De[Mi++] = e, De[Mi++] = n, De[Mi++] = a, Pu |= a, t.lanes |= a, t = t.alternate, t !== null && (t.lanes |= a);
  }
  function Ju(t, e, n, a) {
    return Hl(t, e, n, a), ql(t);
  }
  function Di(t, e) {
    return Hl(t, null, null, e), ql(t);
  }
  function nh(t, e, n) {
    t.lanes |= n;
    var a = t.alternate;
    a !== null && (a.lanes |= n);
    for (var s = !1, r = t.return; r !== null; )
      r.childLanes |= n, a = r.alternate, a !== null && (a.childLanes |= n), r.tag === 22 && (t = r.stateNode, t === null || t._visibility & 1 || (s = !0)), t = r, r = r.return;
    return t.tag === 3 ? (r = t.stateNode, s && e !== null && (s = 31 - me(n), t = r.hiddenUpdates, a = t[s], a === null ? t[s] = [e] : a.push(e), e.lane = n | 536870912), r) : null;
  }
  function ql(t) {
    if (50 < Za)
      throw Za = 0, nr = null, Error(o(185));
    for (var e = t.return; e !== null; )
      t = e, e = t.return;
    return t.tag === 3 ? t.stateNode : null;
  }
  var Ri = {};
  function Rv(t, e, n, a) {
    this.tag = t, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = e, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function ye(t, e, n, a) {
    return new Rv(t, e, n, a);
  }
  function Fu(t) {
    return t = t.prototype, !(!t || !t.isReactComponent);
  }
  function $e(t, e) {
    var n = t.alternate;
    return n === null ? (n = ye(
      t.tag,
      e,
      t.key,
      t.mode
    ), n.elementType = t.elementType, n.type = t.type, n.stateNode = t.stateNode, n.alternate = t, t.alternate = n) : (n.pendingProps = e, n.type = t.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = t.flags & 65011712, n.childLanes = t.childLanes, n.lanes = t.lanes, n.child = t.child, n.memoizedProps = t.memoizedProps, n.memoizedState = t.memoizedState, n.updateQueue = t.updateQueue, e = t.dependencies, n.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext }, n.sibling = t.sibling, n.index = t.index, n.ref = t.ref, n.refCleanup = t.refCleanup, n;
  }
  function ih(t, e) {
    t.flags &= 65011714;
    var n = t.alternate;
    return n === null ? (t.childLanes = 0, t.lanes = e, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = n.childLanes, t.lanes = n.lanes, t.child = n.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = n.memoizedProps, t.memoizedState = n.memoizedState, t.updateQueue = n.updateQueue, t.type = n.type, e = n.dependencies, t.dependencies = e === null ? null : {
      lanes: e.lanes,
      firstContext: e.firstContext
    }), t;
  }
  function Yl(t, e, n, a, s, r) {
    var d = 0;
    if (a = t, typeof t == "function") Fu(t) && (d = 1);
    else if (typeof t == "string")
      d = O1(
        t,
        n,
        tt.current
      ) ? 26 : t === "html" || t === "head" || t === "body" ? 27 : 5;
    else
      t: switch (t) {
        case st:
          return t = ye(31, n, e, s), t.elementType = st, t.lanes = r, t;
        case D:
          return kn(n.children, s, r, e);
        case z:
          d = 8, s |= 24;
          break;
        case B:
          return t = ye(12, n, e, s | 2), t.elementType = B, t.lanes = r, t;
        case Z:
          return t = ye(13, n, e, s), t.elementType = Z, t.lanes = r, t;
        case it:
          return t = ye(19, n, e, s), t.elementType = it, t.lanes = r, t;
        default:
          if (typeof t == "object" && t !== null)
            switch (t.$$typeof) {
              case H:
              case q:
                d = 10;
                break t;
              case X:
                d = 9;
                break t;
              case G:
                d = 11;
                break t;
              case at:
                d = 14;
                break t;
              case P:
                d = 16, a = null;
                break t;
            }
          d = 29, n = Error(
            o(130, t === null ? "null" : typeof t, "")
          ), a = null;
      }
    return e = ye(d, n, e, s), e.elementType = t, e.type = a, e.lanes = r, e;
  }
  function kn(t, e, n, a) {
    return t = ye(7, t, a, e), t.lanes = n, t;
  }
  function Wu(t, e, n) {
    return t = ye(6, t, null, e), t.lanes = n, t;
  }
  function $u(t, e, n) {
    return e = ye(
      4,
      t.children !== null ? t.children : [],
      t.key,
      e
    ), e.lanes = n, e.stateNode = {
      containerInfo: t.containerInfo,
      pendingChildren: null,
      implementation: t.implementation
    }, e;
  }
  var Ci = [], Oi = 0, Gl = null, Xl = 0, Re = [], Ce = 0, Pn = null, Ie = 1, tn = "";
  function Jn(t, e) {
    Ci[Oi++] = Xl, Ci[Oi++] = Gl, Gl = t, Xl = e;
  }
  function ah(t, e, n) {
    Re[Ce++] = Ie, Re[Ce++] = tn, Re[Ce++] = Pn, Pn = t;
    var a = Ie;
    t = tn;
    var s = 32 - me(a) - 1;
    a &= ~(1 << s), n += 1;
    var r = 32 - me(e) + s;
    if (30 < r) {
      var d = s - s % 5;
      r = (a & (1 << d) - 1).toString(32), a >>= d, s -= d, Ie = 1 << 32 - me(e) + s | n << s | a, tn = r + t;
    } else
      Ie = 1 << r | n << s | a, tn = t;
  }
  function Iu(t) {
    t.return !== null && (Jn(t, 1), ah(t, 1, 0));
  }
  function to(t) {
    for (; t === Gl; )
      Gl = Ci[--Oi], Ci[Oi] = null, Xl = Ci[--Oi], Ci[Oi] = null;
    for (; t === Pn; )
      Pn = Re[--Ce], Re[Ce] = null, tn = Re[--Ce], Re[Ce] = null, Ie = Re[--Ce], Re[Ce] = null;
  }
  var ae = null, _t = null, St = !1, Fn = null, Ye = !1, eo = Error(o(519));
  function Wn(t) {
    var e = Error(o(418, ""));
    throw Aa(Me(e, t)), eo;
  }
  function lh(t) {
    var e = t.stateNode, n = t.type, a = t.memoizedProps;
    switch (e[ee] = t, e[ue] = a, n) {
      case "dialog":
        dt("cancel", e), dt("close", e);
        break;
      case "iframe":
      case "object":
      case "embed":
        dt("load", e);
        break;
      case "video":
      case "audio":
        for (n = 0; n < Qa.length; n++)
          dt(Qa[n], e);
        break;
      case "source":
        dt("error", e);
        break;
      case "img":
      case "image":
      case "link":
        dt("error", e), dt("load", e);
        break;
      case "details":
        dt("toggle", e);
        break;
      case "input":
        dt("invalid", e), bf(
          e,
          a.value,
          a.defaultValue,
          a.checked,
          a.defaultChecked,
          a.type,
          a.name,
          !0
        ), Ol(e);
        break;
      case "select":
        dt("invalid", e);
        break;
      case "textarea":
        dt("invalid", e), Af(e, a.value, a.defaultValue, a.children), Ol(e);
    }
    n = a.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || e.textContent === "" + n || a.suppressHydrationWarning === !0 || Am(e.textContent, n) ? (a.popover != null && (dt("beforetoggle", e), dt("toggle", e)), a.onScroll != null && dt("scroll", e), a.onScrollEnd != null && dt("scrollend", e), a.onClick != null && (e.onclick = xs), e = !0) : e = !1, e || Wn(t);
  }
  function sh(t) {
    for (ae = t.return; ae; )
      switch (ae.tag) {
        case 5:
        case 13:
          Ye = !1;
          return;
        case 27:
        case 3:
          Ye = !0;
          return;
        default:
          ae = ae.return;
      }
  }
  function ba(t) {
    if (t !== ae) return !1;
    if (!St) return sh(t), St = !0, !1;
    var e = t.tag, n;
    if ((n = e !== 3 && e !== 27) && ((n = e === 5) && (n = t.type, n = !(n !== "form" && n !== "button") || vr(t.type, t.memoizedProps)), n = !n), n && _t && Wn(t), sh(t), e === 13) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(o(317));
      t: {
        for (t = t.nextSibling, e = 0; t; ) {
          if (t.nodeType === 8)
            if (n = t.data, n === "/$") {
              if (e === 0) {
                _t = Ue(t.nextSibling);
                break t;
              }
              e--;
            } else
              n !== "$" && n !== "$!" && n !== "$?" || e++;
          t = t.nextSibling;
        }
        _t = null;
      }
    } else
      e === 27 ? (e = _t, zn(t.type) ? (t = Ar, Ar = null, _t = t) : _t = e) : _t = ae ? Ue(t.stateNode.nextSibling) : null;
    return !0;
  }
  function Ta() {
    _t = ae = null, St = !1;
  }
  function uh() {
    var t = Fn;
    return t !== null && (fe === null ? fe = t : fe.push.apply(
      fe,
      t
    ), Fn = null), t;
  }
  function Aa(t) {
    Fn === null ? Fn = [t] : Fn.push(t);
  }
  var no = j(null), $n = null, en = null;
  function gn(t, e, n) {
    Q(no, e._currentValue), e._currentValue = n;
  }
  function nn(t) {
    t._currentValue = no.current, k(no);
  }
  function io(t, e, n) {
    for (; t !== null; ) {
      var a = t.alternate;
      if ((t.childLanes & e) !== e ? (t.childLanes |= e, a !== null && (a.childLanes |= e)) : a !== null && (a.childLanes & e) !== e && (a.childLanes |= e), t === n) break;
      t = t.return;
    }
  }
  function ao(t, e, n, a) {
    var s = t.child;
    for (s !== null && (s.return = t); s !== null; ) {
      var r = s.dependencies;
      if (r !== null) {
        var d = s.child;
        r = r.firstContext;
        t: for (; r !== null; ) {
          var y = r;
          r = s;
          for (var T = 0; T < e.length; T++)
            if (y.context === e[T]) {
              r.lanes |= n, y = r.alternate, y !== null && (y.lanes |= n), io(
                r.return,
                n,
                t
              ), a || (d = null);
              break t;
            }
          r = y.next;
        }
      } else if (s.tag === 18) {
        if (d = s.return, d === null) throw Error(o(341));
        d.lanes |= n, r = d.alternate, r !== null && (r.lanes |= n), io(d, n, t), d = null;
      } else d = s.child;
      if (d !== null) d.return = s;
      else
        for (d = s; d !== null; ) {
          if (d === t) {
            d = null;
            break;
          }
          if (s = d.sibling, s !== null) {
            s.return = d.return, d = s;
            break;
          }
          d = d.return;
        }
      s = d;
    }
  }
  function xa(t, e, n, a) {
    t = null;
    for (var s = e, r = !1; s !== null; ) {
      if (!r) {
        if ((s.flags & 524288) !== 0) r = !0;
        else if ((s.flags & 262144) !== 0) break;
      }
      if (s.tag === 10) {
        var d = s.alternate;
        if (d === null) throw Error(o(387));
        if (d = d.memoizedProps, d !== null) {
          var y = s.type;
          pe(s.pendingProps.value, d.value) || (t !== null ? t.push(y) : t = [y]);
        }
      } else if (s === he.current) {
        if (d = s.alternate, d === null) throw Error(o(387));
        d.memoizedState.memoizedState !== s.memoizedState.memoizedState && (t !== null ? t.push($a) : t = [$a]);
      }
      s = s.return;
    }
    t !== null && ao(
      e,
      t,
      n,
      a
    ), e.flags |= 262144;
  }
  function Zl(t) {
    for (t = t.firstContext; t !== null; ) {
      if (!pe(
        t.context._currentValue,
        t.memoizedValue
      ))
        return !0;
      t = t.next;
    }
    return !1;
  }
  function In(t) {
    $n = t, en = null, t = t.dependencies, t !== null && (t.firstContext = null);
  }
  function ne(t) {
    return oh($n, t);
  }
  function Kl(t, e) {
    return $n === null && In(t), oh(t, e);
  }
  function oh(t, e) {
    var n = e._currentValue;
    if (e = { context: e, memoizedValue: n, next: null }, en === null) {
      if (t === null) throw Error(o(308));
      en = e, t.dependencies = { lanes: 0, firstContext: e }, t.flags |= 524288;
    } else en = en.next = e;
    return n;
  }
  var Cv = typeof AbortController < "u" ? AbortController : function() {
    var t = [], e = this.signal = {
      aborted: !1,
      addEventListener: function(n, a) {
        t.push(a);
      }
    };
    this.abort = function() {
      e.aborted = !0, t.forEach(function(n) {
        return n();
      });
    };
  }, Ov = i.unstable_scheduleCallback, Vv = i.unstable_NormalPriority, Yt = {
    $$typeof: q,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function lo() {
    return {
      controller: new Cv(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Ea(t) {
    t.refCount--, t.refCount === 0 && Ov(Vv, function() {
      t.controller.abort();
    });
  }
  var Ma = null, so = 0, Vi = 0, wi = null;
  function wv(t, e) {
    if (Ma === null) {
      var n = Ma = [];
      so = 0, Vi = rr(), wi = {
        status: "pending",
        value: void 0,
        then: function(a) {
          n.push(a);
        }
      };
    }
    return so++, e.then(rh, rh), e;
  }
  function rh() {
    if (--so === 0 && Ma !== null) {
      wi !== null && (wi.status = "fulfilled");
      var t = Ma;
      Ma = null, Vi = 0, wi = null;
      for (var e = 0; e < t.length; e++) (0, t[e])();
    }
  }
  function zv(t, e) {
    var n = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(s) {
        n.push(s);
      }
    };
    return t.then(
      function() {
        a.status = "fulfilled", a.value = e;
        for (var s = 0; s < n.length; s++) (0, n[s])(e);
      },
      function(s) {
        for (a.status = "rejected", a.reason = s, s = 0; s < n.length; s++)
          (0, n[s])(void 0);
      }
    ), a;
  }
  var ch = w.S;
  w.S = function(t, e) {
    typeof e == "object" && e !== null && typeof e.then == "function" && wv(t, e), ch !== null && ch(t, e);
  };
  var ti = j(null);
  function uo() {
    var t = ti.current;
    return t !== null ? t : Ot.pooledCache;
  }
  function Ql(t, e) {
    e === null ? Q(ti, ti.current) : Q(ti, e.pool);
  }
  function fh() {
    var t = uo();
    return t === null ? null : { parent: Yt._currentValue, pool: t };
  }
  var Da = Error(o(460)), hh = Error(o(474)), kl = Error(o(542)), oo = { then: function() {
  } };
  function dh(t) {
    return t = t.status, t === "fulfilled" || t === "rejected";
  }
  function Pl() {
  }
  function mh(t, e, n) {
    switch (n = t[n], n === void 0 ? t.push(e) : n !== e && (e.then(Pl, Pl), e = n), e.status) {
      case "fulfilled":
        return e.value;
      case "rejected":
        throw t = e.reason, yh(t), t;
      default:
        if (typeof e.status == "string") e.then(Pl, Pl);
        else {
          if (t = Ot, t !== null && 100 < t.shellSuspendCounter)
            throw Error(o(482));
          t = e, t.status = "pending", t.then(
            function(a) {
              if (e.status === "pending") {
                var s = e;
                s.status = "fulfilled", s.value = a;
              }
            },
            function(a) {
              if (e.status === "pending") {
                var s = e;
                s.status = "rejected", s.reason = a;
              }
            }
          );
        }
        switch (e.status) {
          case "fulfilled":
            return e.value;
          case "rejected":
            throw t = e.reason, yh(t), t;
        }
        throw Ra = e, Da;
    }
  }
  var Ra = null;
  function ph() {
    if (Ra === null) throw Error(o(459));
    var t = Ra;
    return Ra = null, t;
  }
  function yh(t) {
    if (t === Da || t === kl)
      throw Error(o(483));
  }
  var vn = !1;
  function ro(t) {
    t.updateQueue = {
      baseState: t.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function co(t, e) {
    t = t.updateQueue, e.updateQueue === t && (e.updateQueue = {
      baseState: t.baseState,
      firstBaseUpdate: t.firstBaseUpdate,
      lastBaseUpdate: t.lastBaseUpdate,
      shared: t.shared,
      callbacks: null
    });
  }
  function Sn(t) {
    return { lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function bn(t, e, n) {
    var a = t.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (bt & 2) !== 0) {
      var s = a.pending;
      return s === null ? e.next = e : (e.next = s.next, s.next = e), a.pending = e, e = ql(t), nh(t, null, n), e;
    }
    return Hl(t, a, e, n), ql(t);
  }
  function Ca(t, e, n) {
    if (e = e.updateQueue, e !== null && (e = e.shared, (n & 4194048) !== 0)) {
      var a = e.lanes;
      a &= t.pendingLanes, n |= a, e.lanes = n, rf(t, n);
    }
  }
  function fo(t, e) {
    var n = t.updateQueue, a = t.alternate;
    if (a !== null && (a = a.updateQueue, n === a)) {
      var s = null, r = null;
      if (n = n.firstBaseUpdate, n !== null) {
        do {
          var d = {
            lane: n.lane,
            tag: n.tag,
            payload: n.payload,
            callback: null,
            next: null
          };
          r === null ? s = r = d : r = r.next = d, n = n.next;
        } while (n !== null);
        r === null ? s = r = e : r = r.next = e;
      } else s = r = e;
      n = {
        baseState: a.baseState,
        firstBaseUpdate: s,
        lastBaseUpdate: r,
        shared: a.shared,
        callbacks: a.callbacks
      }, t.updateQueue = n;
      return;
    }
    t = n.lastBaseUpdate, t === null ? n.firstBaseUpdate = e : t.next = e, n.lastBaseUpdate = e;
  }
  var ho = !1;
  function Oa() {
    if (ho) {
      var t = wi;
      if (t !== null) throw t;
    }
  }
  function Va(t, e, n, a) {
    ho = !1;
    var s = t.updateQueue;
    vn = !1;
    var r = s.firstBaseUpdate, d = s.lastBaseUpdate, y = s.shared.pending;
    if (y !== null) {
      s.shared.pending = null;
      var T = y, R = T.next;
      T.next = null, d === null ? r = R : d.next = R, d = T;
      var _ = t.alternate;
      _ !== null && (_ = _.updateQueue, y = _.lastBaseUpdate, y !== d && (y === null ? _.firstBaseUpdate = R : y.next = R, _.lastBaseUpdate = T));
    }
    if (r !== null) {
      var U = s.baseState;
      d = 0, _ = R = T = null, y = r;
      do {
        var C = y.lane & -536870913, O = C !== y.lane;
        if (O ? (yt & C) === C : (a & C) === C) {
          C !== 0 && C === Vi && (ho = !0), _ !== null && (_ = _.next = {
            lane: 0,
            tag: y.tag,
            payload: y.payload,
            callback: null,
            next: null
          });
          t: {
            var lt = t, et = y;
            C = e;
            var Et = n;
            switch (et.tag) {
              case 1:
                if (lt = et.payload, typeof lt == "function") {
                  U = lt.call(Et, U, C);
                  break t;
                }
                U = lt;
                break t;
              case 3:
                lt.flags = lt.flags & -65537 | 128;
              case 0:
                if (lt = et.payload, C = typeof lt == "function" ? lt.call(Et, U, C) : lt, C == null) break t;
                U = g({}, U, C);
                break t;
              case 2:
                vn = !0;
            }
          }
          C = y.callback, C !== null && (t.flags |= 64, O && (t.flags |= 8192), O = s.callbacks, O === null ? s.callbacks = [C] : O.push(C));
        } else
          O = {
            lane: C,
            tag: y.tag,
            payload: y.payload,
            callback: y.callback,
            next: null
          }, _ === null ? (R = _ = O, T = U) : _ = _.next = O, d |= C;
        if (y = y.next, y === null) {
          if (y = s.shared.pending, y === null)
            break;
          O = y, y = O.next, O.next = null, s.lastBaseUpdate = O, s.shared.pending = null;
        }
      } while (!0);
      _ === null && (T = U), s.baseState = T, s.firstBaseUpdate = R, s.lastBaseUpdate = _, r === null && (s.shared.lanes = 0), Cn |= d, t.lanes = d, t.memoizedState = U;
    }
  }
  function gh(t, e) {
    if (typeof t != "function")
      throw Error(o(191, t));
    t.call(e);
  }
  function vh(t, e) {
    var n = t.callbacks;
    if (n !== null)
      for (t.callbacks = null, t = 0; t < n.length; t++)
        gh(n[t], e);
  }
  var zi = j(null), Jl = j(0);
  function Sh(t, e) {
    t = cn, Q(Jl, t), Q(zi, e), cn = t | e.baseLanes;
  }
  function mo() {
    Q(Jl, cn), Q(zi, zi.current);
  }
  function po() {
    cn = Jl.current, k(zi), k(Jl);
  }
  var Tn = 0, ct = null, At = null, Lt = null, Fl = !1, _i = !1, ei = !1, Wl = 0, wa = 0, Bi = null, _v = 0;
  function Ut() {
    throw Error(o(321));
  }
  function yo(t, e) {
    if (e === null) return !1;
    for (var n = 0; n < e.length && n < t.length; n++)
      if (!pe(t[n], e[n])) return !1;
    return !0;
  }
  function go(t, e, n, a, s, r) {
    return Tn = r, ct = e, e.memoizedState = null, e.updateQueue = null, e.lanes = 0, w.H = t === null || t.memoizedState === null ? nd : id, ei = !1, r = n(a, s), ei = !1, _i && (r = Th(
      e,
      n,
      a,
      s
    )), bh(t), r;
  }
  function bh(t) {
    w.H = is;
    var e = At !== null && At.next !== null;
    if (Tn = 0, Lt = At = ct = null, Fl = !1, wa = 0, Bi = null, e) throw Error(o(300));
    t === null || Qt || (t = t.dependencies, t !== null && Zl(t) && (Qt = !0));
  }
  function Th(t, e, n, a) {
    ct = t;
    var s = 0;
    do {
      if (_i && (Bi = null), wa = 0, _i = !1, 25 <= s) throw Error(o(301));
      if (s += 1, Lt = At = null, t.updateQueue != null) {
        var r = t.updateQueue;
        r.lastEffect = null, r.events = null, r.stores = null, r.memoCache != null && (r.memoCache.index = 0);
      }
      w.H = qv, r = e(n, a);
    } while (_i);
    return r;
  }
  function Bv() {
    var t = w.H, e = t.useState()[0];
    return e = typeof e.then == "function" ? za(e) : e, t = t.useState()[0], (At !== null ? At.memoizedState : null) !== t && (ct.flags |= 1024), e;
  }
  function vo() {
    var t = Wl !== 0;
    return Wl = 0, t;
  }
  function So(t, e, n) {
    e.updateQueue = t.updateQueue, e.flags &= -2053, t.lanes &= ~n;
  }
  function bo(t) {
    if (Fl) {
      for (t = t.memoizedState; t !== null; ) {
        var e = t.queue;
        e !== null && (e.pending = null), t = t.next;
      }
      Fl = !1;
    }
    Tn = 0, Lt = At = ct = null, _i = !1, wa = Wl = 0, Bi = null;
  }
  function re() {
    var t = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return Lt === null ? ct.memoizedState = Lt = t : Lt = Lt.next = t, Lt;
  }
  function Ht() {
    if (At === null) {
      var t = ct.alternate;
      t = t !== null ? t.memoizedState : null;
    } else t = At.next;
    var e = Lt === null ? ct.memoizedState : Lt.next;
    if (e !== null)
      Lt = e, At = t;
    else {
      if (t === null)
        throw ct.alternate === null ? Error(o(467)) : Error(o(310));
      At = t, t = {
        memoizedState: At.memoizedState,
        baseState: At.baseState,
        baseQueue: At.baseQueue,
        queue: At.queue,
        next: null
      }, Lt === null ? ct.memoizedState = Lt = t : Lt = Lt.next = t;
    }
    return Lt;
  }
  function To() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function za(t) {
    var e = wa;
    return wa += 1, Bi === null && (Bi = []), t = mh(Bi, t, e), e = ct, (Lt === null ? e.memoizedState : Lt.next) === null && (e = e.alternate, w.H = e === null || e.memoizedState === null ? nd : id), t;
  }
  function $l(t) {
    if (t !== null && typeof t == "object") {
      if (typeof t.then == "function") return za(t);
      if (t.$$typeof === q) return ne(t);
    }
    throw Error(o(438, String(t)));
  }
  function Ao(t) {
    var e = null, n = ct.updateQueue;
    if (n !== null && (e = n.memoCache), e == null) {
      var a = ct.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (e = {
        data: a.data.map(function(s) {
          return s.slice();
        }),
        index: 0
      })));
    }
    if (e == null && (e = { data: [], index: 0 }), n === null && (n = To(), ct.updateQueue = n), n.memoCache = e, n = e.data[e.index], n === void 0)
      for (n = e.data[e.index] = Array(t), a = 0; a < t; a++)
        n[a] = $;
    return e.index++, n;
  }
  function an(t, e) {
    return typeof e == "function" ? e(t) : e;
  }
  function Il(t) {
    var e = Ht();
    return xo(e, At, t);
  }
  function xo(t, e, n) {
    var a = t.queue;
    if (a === null) throw Error(o(311));
    a.lastRenderedReducer = n;
    var s = t.baseQueue, r = a.pending;
    if (r !== null) {
      if (s !== null) {
        var d = s.next;
        s.next = r.next, r.next = d;
      }
      e.baseQueue = s = r, a.pending = null;
    }
    if (r = t.baseState, s === null) t.memoizedState = r;
    else {
      e = s.next;
      var y = d = null, T = null, R = e, _ = !1;
      do {
        var U = R.lane & -536870913;
        if (U !== R.lane ? (yt & U) === U : (Tn & U) === U) {
          var C = R.revertLane;
          if (C === 0)
            T !== null && (T = T.next = {
              lane: 0,
              revertLane: 0,
              action: R.action,
              hasEagerState: R.hasEagerState,
              eagerState: R.eagerState,
              next: null
            }), U === Vi && (_ = !0);
          else if ((Tn & C) === C) {
            R = R.next, C === Vi && (_ = !0);
            continue;
          } else
            U = {
              lane: 0,
              revertLane: R.revertLane,
              action: R.action,
              hasEagerState: R.hasEagerState,
              eagerState: R.eagerState,
              next: null
            }, T === null ? (y = T = U, d = r) : T = T.next = U, ct.lanes |= C, Cn |= C;
          U = R.action, ei && n(r, U), r = R.hasEagerState ? R.eagerState : n(r, U);
        } else
          C = {
            lane: U,
            revertLane: R.revertLane,
            action: R.action,
            hasEagerState: R.hasEagerState,
            eagerState: R.eagerState,
            next: null
          }, T === null ? (y = T = C, d = r) : T = T.next = C, ct.lanes |= U, Cn |= U;
        R = R.next;
      } while (R !== null && R !== e);
      if (T === null ? d = r : T.next = y, !pe(r, t.memoizedState) && (Qt = !0, _ && (n = wi, n !== null)))
        throw n;
      t.memoizedState = r, t.baseState = d, t.baseQueue = T, a.lastRenderedState = r;
    }
    return s === null && (a.lanes = 0), [t.memoizedState, a.dispatch];
  }
  function Eo(t) {
    var e = Ht(), n = e.queue;
    if (n === null) throw Error(o(311));
    n.lastRenderedReducer = t;
    var a = n.dispatch, s = n.pending, r = e.memoizedState;
    if (s !== null) {
      n.pending = null;
      var d = s = s.next;
      do
        r = t(r, d.action), d = d.next;
      while (d !== s);
      pe(r, e.memoizedState) || (Qt = !0), e.memoizedState = r, e.baseQueue === null && (e.baseState = r), n.lastRenderedState = r;
    }
    return [r, a];
  }
  function Ah(t, e, n) {
    var a = ct, s = Ht(), r = St;
    if (r) {
      if (n === void 0) throw Error(o(407));
      n = n();
    } else n = e();
    var d = !pe(
      (At || s).memoizedState,
      n
    );
    d && (s.memoizedState = n, Qt = !0), s = s.queue;
    var y = Mh.bind(null, a, s, t);
    if (_a(2048, 8, y, [t]), s.getSnapshot !== e || d || Lt !== null && Lt.memoizedState.tag & 1) {
      if (a.flags |= 2048, Ni(
        9,
        ts(),
        Eh.bind(
          null,
          a,
          s,
          n,
          e
        ),
        null
      ), Ot === null) throw Error(o(349));
      r || (Tn & 124) !== 0 || xh(a, e, n);
    }
    return n;
  }
  function xh(t, e, n) {
    t.flags |= 16384, t = { getSnapshot: e, value: n }, e = ct.updateQueue, e === null ? (e = To(), ct.updateQueue = e, e.stores = [t]) : (n = e.stores, n === null ? e.stores = [t] : n.push(t));
  }
  function Eh(t, e, n, a) {
    e.value = n, e.getSnapshot = a, Dh(e) && Rh(t);
  }
  function Mh(t, e, n) {
    return n(function() {
      Dh(e) && Rh(t);
    });
  }
  function Dh(t) {
    var e = t.getSnapshot;
    t = t.value;
    try {
      var n = e();
      return !pe(t, n);
    } catch {
      return !0;
    }
  }
  function Rh(t) {
    var e = Di(t, 2);
    e !== null && Te(e, t, 2);
  }
  function Mo(t) {
    var e = re();
    if (typeof t == "function") {
      var n = t;
      if (t = n(), ei) {
        mn(!0);
        try {
          n();
        } finally {
          mn(!1);
        }
      }
    }
    return e.memoizedState = e.baseState = t, e.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: an,
      lastRenderedState: t
    }, e;
  }
  function Ch(t, e, n, a) {
    return t.baseState = n, xo(
      t,
      At,
      typeof a == "function" ? a : an
    );
  }
  function Nv(t, e, n, a, s) {
    if (ns(t)) throw Error(o(485));
    if (t = e.action, t !== null) {
      var r = {
        payload: s,
        action: t,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(d) {
          r.listeners.push(d);
        }
      };
      w.T !== null ? n(!0) : r.isTransition = !1, a(r), n = e.pending, n === null ? (r.next = e.pending = r, Oh(e, r)) : (r.next = n.next, e.pending = n.next = r);
    }
  }
  function Oh(t, e) {
    var n = e.action, a = e.payload, s = t.state;
    if (e.isTransition) {
      var r = w.T, d = {};
      w.T = d;
      try {
        var y = n(s, a), T = w.S;
        T !== null && T(d, y), Vh(t, e, y);
      } catch (R) {
        Do(t, e, R);
      } finally {
        w.T = r;
      }
    } else
      try {
        r = n(s, a), Vh(t, e, r);
      } catch (R) {
        Do(t, e, R);
      }
  }
  function Vh(t, e, n) {
    n !== null && typeof n == "object" && typeof n.then == "function" ? n.then(
      function(a) {
        wh(t, e, a);
      },
      function(a) {
        return Do(t, e, a);
      }
    ) : wh(t, e, n);
  }
  function wh(t, e, n) {
    e.status = "fulfilled", e.value = n, zh(e), t.state = n, e = t.pending, e !== null && (n = e.next, n === e ? t.pending = null : (n = n.next, e.next = n, Oh(t, n)));
  }
  function Do(t, e, n) {
    var a = t.pending;
    if (t.pending = null, a !== null) {
      a = a.next;
      do
        e.status = "rejected", e.reason = n, zh(e), e = e.next;
      while (e !== a);
    }
    t.action = null;
  }
  function zh(t) {
    t = t.listeners;
    for (var e = 0; e < t.length; e++) (0, t[e])();
  }
  function _h(t, e) {
    return e;
  }
  function Bh(t, e) {
    if (St) {
      var n = Ot.formState;
      if (n !== null) {
        t: {
          var a = ct;
          if (St) {
            if (_t) {
              e: {
                for (var s = _t, r = Ye; s.nodeType !== 8; ) {
                  if (!r) {
                    s = null;
                    break e;
                  }
                  if (s = Ue(
                    s.nextSibling
                  ), s === null) {
                    s = null;
                    break e;
                  }
                }
                r = s.data, s = r === "F!" || r === "F" ? s : null;
              }
              if (s) {
                _t = Ue(
                  s.nextSibling
                ), a = s.data === "F!";
                break t;
              }
            }
            Wn(a);
          }
          a = !1;
        }
        a && (e = n[0]);
      }
    }
    return n = re(), n.memoizedState = n.baseState = e, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: _h,
      lastRenderedState: e
    }, n.queue = a, n = Ih.bind(
      null,
      ct,
      a
    ), a.dispatch = n, a = Mo(!1), r = wo.bind(
      null,
      ct,
      !1,
      a.queue
    ), a = re(), s = {
      state: e,
      dispatch: null,
      action: t,
      pending: null
    }, a.queue = s, n = Nv.bind(
      null,
      ct,
      s,
      r,
      n
    ), s.dispatch = n, a.memoizedState = t, [e, n, !1];
  }
  function Nh(t) {
    var e = Ht();
    return Uh(e, At, t);
  }
  function Uh(t, e, n) {
    if (e = xo(
      t,
      e,
      _h
    )[0], t = Il(an)[0], typeof e == "object" && e !== null && typeof e.then == "function")
      try {
        var a = za(e);
      } catch (d) {
        throw d === Da ? kl : d;
      }
    else a = e;
    e = Ht();
    var s = e.queue, r = s.dispatch;
    return n !== e.memoizedState && (ct.flags |= 2048, Ni(
      9,
      ts(),
      Uv.bind(null, s, n),
      null
    )), [a, r, t];
  }
  function Uv(t, e) {
    t.action = e;
  }
  function jh(t) {
    var e = Ht(), n = At;
    if (n !== null)
      return Uh(e, n, t);
    Ht(), e = e.memoizedState, n = Ht();
    var a = n.queue.dispatch;
    return n.memoizedState = t, [e, a, !1];
  }
  function Ni(t, e, n, a) {
    return t = { tag: t, create: n, deps: a, inst: e, next: null }, e = ct.updateQueue, e === null && (e = To(), ct.updateQueue = e), n = e.lastEffect, n === null ? e.lastEffect = t.next = t : (a = n.next, n.next = t, t.next = a, e.lastEffect = t), t;
  }
  function ts() {
    return { destroy: void 0, resource: void 0 };
  }
  function Lh() {
    return Ht().memoizedState;
  }
  function es(t, e, n, a) {
    var s = re();
    a = a === void 0 ? null : a, ct.flags |= t, s.memoizedState = Ni(
      1 | e,
      ts(),
      n,
      a
    );
  }
  function _a(t, e, n, a) {
    var s = Ht();
    a = a === void 0 ? null : a;
    var r = s.memoizedState.inst;
    At !== null && a !== null && yo(a, At.memoizedState.deps) ? s.memoizedState = Ni(e, r, n, a) : (ct.flags |= t, s.memoizedState = Ni(
      1 | e,
      r,
      n,
      a
    ));
  }
  function Hh(t, e) {
    es(8390656, 8, t, e);
  }
  function qh(t, e) {
    _a(2048, 8, t, e);
  }
  function Yh(t, e) {
    return _a(4, 2, t, e);
  }
  function Gh(t, e) {
    return _a(4, 4, t, e);
  }
  function Xh(t, e) {
    if (typeof e == "function") {
      t = t();
      var n = e(t);
      return function() {
        typeof n == "function" ? n() : e(null);
      };
    }
    if (e != null)
      return t = t(), e.current = t, function() {
        e.current = null;
      };
  }
  function Zh(t, e, n) {
    n = n != null ? n.concat([t]) : null, _a(4, 4, Xh.bind(null, e, t), n);
  }
  function Ro() {
  }
  function Kh(t, e) {
    var n = Ht();
    e = e === void 0 ? null : e;
    var a = n.memoizedState;
    return e !== null && yo(e, a[1]) ? a[0] : (n.memoizedState = [t, e], t);
  }
  function Qh(t, e) {
    var n = Ht();
    e = e === void 0 ? null : e;
    var a = n.memoizedState;
    if (e !== null && yo(e, a[1]))
      return a[0];
    if (a = t(), ei) {
      mn(!0);
      try {
        t();
      } finally {
        mn(!1);
      }
    }
    return n.memoizedState = [a, e], a;
  }
  function Co(t, e, n) {
    return n === void 0 || (Tn & 1073741824) !== 0 ? t.memoizedState = e : (t.memoizedState = n, t = Jd(), ct.lanes |= t, Cn |= t, n);
  }
  function kh(t, e, n, a) {
    return pe(n, e) ? n : zi.current !== null ? (t = Co(t, n, a), pe(t, e) || (Qt = !0), t) : (Tn & 42) === 0 ? (Qt = !0, t.memoizedState = n) : (t = Jd(), ct.lanes |= t, Cn |= t, e);
  }
  function Ph(t, e, n, a, s) {
    var r = K.p;
    K.p = r !== 0 && 8 > r ? r : 8;
    var d = w.T, y = {};
    w.T = y, wo(t, !1, e, n);
    try {
      var T = s(), R = w.S;
      if (R !== null && R(y, T), T !== null && typeof T == "object" && typeof T.then == "function") {
        var _ = zv(
          T,
          a
        );
        Ba(
          t,
          e,
          _,
          be(t)
        );
      } else
        Ba(
          t,
          e,
          a,
          be(t)
        );
    } catch (U) {
      Ba(
        t,
        e,
        { then: function() {
        }, status: "rejected", reason: U },
        be()
      );
    } finally {
      K.p = r, w.T = d;
    }
  }
  function jv() {
  }
  function Oo(t, e, n, a) {
    if (t.tag !== 5) throw Error(o(476));
    var s = Jh(t).queue;
    Ph(
      t,
      s,
      e,
      J,
      n === null ? jv : function() {
        return Fh(t), n(a);
      }
    );
  }
  function Jh(t) {
    var e = t.memoizedState;
    if (e !== null) return e;
    e = {
      memoizedState: J,
      baseState: J,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: an,
        lastRenderedState: J
      },
      next: null
    };
    var n = {};
    return e.next = {
      memoizedState: n,
      baseState: n,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: an,
        lastRenderedState: n
      },
      next: null
    }, t.memoizedState = e, t = t.alternate, t !== null && (t.memoizedState = e), e;
  }
  function Fh(t) {
    var e = Jh(t).next.queue;
    Ba(t, e, {}, be());
  }
  function Vo() {
    return ne($a);
  }
  function Wh() {
    return Ht().memoizedState;
  }
  function $h() {
    return Ht().memoizedState;
  }
  function Lv(t) {
    for (var e = t.return; e !== null; ) {
      switch (e.tag) {
        case 24:
        case 3:
          var n = be();
          t = Sn(n);
          var a = bn(e, t, n);
          a !== null && (Te(a, e, n), Ca(a, e, n)), e = { cache: lo() }, t.payload = e;
          return;
      }
      e = e.return;
    }
  }
  function Hv(t, e, n) {
    var a = be();
    n = {
      lane: a,
      revertLane: 0,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ns(t) ? td(e, n) : (n = Ju(t, e, n, a), n !== null && (Te(n, t, a), ed(n, e, a)));
  }
  function Ih(t, e, n) {
    var a = be();
    Ba(t, e, n, a);
  }
  function Ba(t, e, n, a) {
    var s = {
      lane: a,
      revertLane: 0,
      action: n,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (ns(t)) td(e, s);
    else {
      var r = t.alternate;
      if (t.lanes === 0 && (r === null || r.lanes === 0) && (r = e.lastRenderedReducer, r !== null))
        try {
          var d = e.lastRenderedState, y = r(d, n);
          if (s.hasEagerState = !0, s.eagerState = y, pe(y, d))
            return Hl(t, e, s, 0), Ot === null && Ll(), !1;
        } catch {
        } finally {
        }
      if (n = Ju(t, e, s, a), n !== null)
        return Te(n, t, a), ed(n, e, a), !0;
    }
    return !1;
  }
  function wo(t, e, n, a) {
    if (a = {
      lane: 2,
      revertLane: rr(),
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ns(t)) {
      if (e) throw Error(o(479));
    } else
      e = Ju(
        t,
        n,
        a,
        2
      ), e !== null && Te(e, t, 2);
  }
  function ns(t) {
    var e = t.alternate;
    return t === ct || e !== null && e === ct;
  }
  function td(t, e) {
    _i = Fl = !0;
    var n = t.pending;
    n === null ? e.next = e : (e.next = n.next, n.next = e), t.pending = e;
  }
  function ed(t, e, n) {
    if ((n & 4194048) !== 0) {
      var a = e.lanes;
      a &= t.pendingLanes, n |= a, e.lanes = n, rf(t, n);
    }
  }
  var is = {
    readContext: ne,
    use: $l,
    useCallback: Ut,
    useContext: Ut,
    useEffect: Ut,
    useImperativeHandle: Ut,
    useLayoutEffect: Ut,
    useInsertionEffect: Ut,
    useMemo: Ut,
    useReducer: Ut,
    useRef: Ut,
    useState: Ut,
    useDebugValue: Ut,
    useDeferredValue: Ut,
    useTransition: Ut,
    useSyncExternalStore: Ut,
    useId: Ut,
    useHostTransitionStatus: Ut,
    useFormState: Ut,
    useActionState: Ut,
    useOptimistic: Ut,
    useMemoCache: Ut,
    useCacheRefresh: Ut
  }, nd = {
    readContext: ne,
    use: $l,
    useCallback: function(t, e) {
      return re().memoizedState = [
        t,
        e === void 0 ? null : e
      ], t;
    },
    useContext: ne,
    useEffect: Hh,
    useImperativeHandle: function(t, e, n) {
      n = n != null ? n.concat([t]) : null, es(
        4194308,
        4,
        Xh.bind(null, e, t),
        n
      );
    },
    useLayoutEffect: function(t, e) {
      return es(4194308, 4, t, e);
    },
    useInsertionEffect: function(t, e) {
      es(4, 2, t, e);
    },
    useMemo: function(t, e) {
      var n = re();
      e = e === void 0 ? null : e;
      var a = t();
      if (ei) {
        mn(!0);
        try {
          t();
        } finally {
          mn(!1);
        }
      }
      return n.memoizedState = [a, e], a;
    },
    useReducer: function(t, e, n) {
      var a = re();
      if (n !== void 0) {
        var s = n(e);
        if (ei) {
          mn(!0);
          try {
            n(e);
          } finally {
            mn(!1);
          }
        }
      } else s = e;
      return a.memoizedState = a.baseState = s, t = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: t,
        lastRenderedState: s
      }, a.queue = t, t = t.dispatch = Hv.bind(
        null,
        ct,
        t
      ), [a.memoizedState, t];
    },
    useRef: function(t) {
      var e = re();
      return t = { current: t }, e.memoizedState = t;
    },
    useState: function(t) {
      t = Mo(t);
      var e = t.queue, n = Ih.bind(null, ct, e);
      return e.dispatch = n, [t.memoizedState, n];
    },
    useDebugValue: Ro,
    useDeferredValue: function(t, e) {
      var n = re();
      return Co(n, t, e);
    },
    useTransition: function() {
      var t = Mo(!1);
      return t = Ph.bind(
        null,
        ct,
        t.queue,
        !0,
        !1
      ), re().memoizedState = t, [!1, t];
    },
    useSyncExternalStore: function(t, e, n) {
      var a = ct, s = re();
      if (St) {
        if (n === void 0)
          throw Error(o(407));
        n = n();
      } else {
        if (n = e(), Ot === null)
          throw Error(o(349));
        (yt & 124) !== 0 || xh(a, e, n);
      }
      s.memoizedState = n;
      var r = { value: n, getSnapshot: e };
      return s.queue = r, Hh(Mh.bind(null, a, r, t), [
        t
      ]), a.flags |= 2048, Ni(
        9,
        ts(),
        Eh.bind(
          null,
          a,
          r,
          n,
          e
        ),
        null
      ), n;
    },
    useId: function() {
      var t = re(), e = Ot.identifierPrefix;
      if (St) {
        var n = tn, a = Ie;
        n = (a & ~(1 << 32 - me(a) - 1)).toString(32) + n, e = "«" + e + "R" + n, n = Wl++, 0 < n && (e += "H" + n.toString(32)), e += "»";
      } else
        n = _v++, e = "«" + e + "r" + n.toString(32) + "»";
      return t.memoizedState = e;
    },
    useHostTransitionStatus: Vo,
    useFormState: Bh,
    useActionState: Bh,
    useOptimistic: function(t) {
      var e = re();
      e.memoizedState = e.baseState = t;
      var n = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return e.queue = n, e = wo.bind(
        null,
        ct,
        !0,
        n
      ), n.dispatch = e, [t, e];
    },
    useMemoCache: Ao,
    useCacheRefresh: function() {
      return re().memoizedState = Lv.bind(
        null,
        ct
      );
    }
  }, id = {
    readContext: ne,
    use: $l,
    useCallback: Kh,
    useContext: ne,
    useEffect: qh,
    useImperativeHandle: Zh,
    useInsertionEffect: Yh,
    useLayoutEffect: Gh,
    useMemo: Qh,
    useReducer: Il,
    useRef: Lh,
    useState: function() {
      return Il(an);
    },
    useDebugValue: Ro,
    useDeferredValue: function(t, e) {
      var n = Ht();
      return kh(
        n,
        At.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Il(an)[0], e = Ht().memoizedState;
      return [
        typeof t == "boolean" ? t : za(t),
        e
      ];
    },
    useSyncExternalStore: Ah,
    useId: Wh,
    useHostTransitionStatus: Vo,
    useFormState: Nh,
    useActionState: Nh,
    useOptimistic: function(t, e) {
      var n = Ht();
      return Ch(n, At, t, e);
    },
    useMemoCache: Ao,
    useCacheRefresh: $h
  }, qv = {
    readContext: ne,
    use: $l,
    useCallback: Kh,
    useContext: ne,
    useEffect: qh,
    useImperativeHandle: Zh,
    useInsertionEffect: Yh,
    useLayoutEffect: Gh,
    useMemo: Qh,
    useReducer: Eo,
    useRef: Lh,
    useState: function() {
      return Eo(an);
    },
    useDebugValue: Ro,
    useDeferredValue: function(t, e) {
      var n = Ht();
      return At === null ? Co(n, t, e) : kh(
        n,
        At.memoizedState,
        t,
        e
      );
    },
    useTransition: function() {
      var t = Eo(an)[0], e = Ht().memoizedState;
      return [
        typeof t == "boolean" ? t : za(t),
        e
      ];
    },
    useSyncExternalStore: Ah,
    useId: Wh,
    useHostTransitionStatus: Vo,
    useFormState: jh,
    useActionState: jh,
    useOptimistic: function(t, e) {
      var n = Ht();
      return At !== null ? Ch(n, At, t, e) : (n.baseState = t, [t, n.queue.dispatch]);
    },
    useMemoCache: Ao,
    useCacheRefresh: $h
  }, Ui = null, Na = 0;
  function as(t) {
    var e = Na;
    return Na += 1, Ui === null && (Ui = []), mh(Ui, t, e);
  }
  function Ua(t, e) {
    e = e.props.ref, t.ref = e !== void 0 ? e : null;
  }
  function ls(t, e) {
    throw e.$$typeof === S ? Error(o(525)) : (t = Object.prototype.toString.call(e), Error(
      o(
        31,
        t === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : t
      )
    ));
  }
  function ad(t) {
    var e = t._init;
    return e(t._payload);
  }
  function ld(t) {
    function e(E, x) {
      if (t) {
        var M = E.deletions;
        M === null ? (E.deletions = [x], E.flags |= 16) : M.push(x);
      }
    }
    function n(E, x) {
      if (!t) return null;
      for (; x !== null; )
        e(E, x), x = x.sibling;
      return null;
    }
    function a(E) {
      for (var x = /* @__PURE__ */ new Map(); E !== null; )
        E.key !== null ? x.set(E.key, E) : x.set(E.index, E), E = E.sibling;
      return x;
    }
    function s(E, x) {
      return E = $e(E, x), E.index = 0, E.sibling = null, E;
    }
    function r(E, x, M) {
      return E.index = M, t ? (M = E.alternate, M !== null ? (M = M.index, M < x ? (E.flags |= 67108866, x) : M) : (E.flags |= 67108866, x)) : (E.flags |= 1048576, x);
    }
    function d(E) {
      return t && E.alternate === null && (E.flags |= 67108866), E;
    }
    function y(E, x, M, N) {
      return x === null || x.tag !== 6 ? (x = Wu(M, E.mode, N), x.return = E, x) : (x = s(x, M), x.return = E, x);
    }
    function T(E, x, M, N) {
      var F = M.type;
      return F === D ? _(
        E,
        x,
        M.props.children,
        N,
        M.key
      ) : x !== null && (x.elementType === F || typeof F == "object" && F !== null && F.$$typeof === P && ad(F) === x.type) ? (x = s(x, M.props), Ua(x, M), x.return = E, x) : (x = Yl(
        M.type,
        M.key,
        M.props,
        null,
        E.mode,
        N
      ), Ua(x, M), x.return = E, x);
    }
    function R(E, x, M, N) {
      return x === null || x.tag !== 4 || x.stateNode.containerInfo !== M.containerInfo || x.stateNode.implementation !== M.implementation ? (x = $u(M, E.mode, N), x.return = E, x) : (x = s(x, M.children || []), x.return = E, x);
    }
    function _(E, x, M, N, F) {
      return x === null || x.tag !== 7 ? (x = kn(
        M,
        E.mode,
        N,
        F
      ), x.return = E, x) : (x = s(x, M), x.return = E, x);
    }
    function U(E, x, M) {
      if (typeof x == "string" && x !== "" || typeof x == "number" || typeof x == "bigint")
        return x = Wu(
          "" + x,
          E.mode,
          M
        ), x.return = E, x;
      if (typeof x == "object" && x !== null) {
        switch (x.$$typeof) {
          case b:
            return M = Yl(
              x.type,
              x.key,
              x.props,
              null,
              E.mode,
              M
            ), Ua(M, x), M.return = E, M;
          case V:
            return x = $u(
              x,
              E.mode,
              M
            ), x.return = E, x;
          case P:
            var N = x._init;
            return x = N(x._payload), U(E, x, M);
        }
        if (Ct(x) || pt(x))
          return x = kn(
            x,
            E.mode,
            M,
            null
          ), x.return = E, x;
        if (typeof x.then == "function")
          return U(E, as(x), M);
        if (x.$$typeof === q)
          return U(
            E,
            Kl(E, x),
            M
          );
        ls(E, x);
      }
      return null;
    }
    function C(E, x, M, N) {
      var F = x !== null ? x.key : null;
      if (typeof M == "string" && M !== "" || typeof M == "number" || typeof M == "bigint")
        return F !== null ? null : y(E, x, "" + M, N);
      if (typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case b:
            return M.key === F ? T(E, x, M, N) : null;
          case V:
            return M.key === F ? R(E, x, M, N) : null;
          case P:
            return F = M._init, M = F(M._payload), C(E, x, M, N);
        }
        if (Ct(M) || pt(M))
          return F !== null ? null : _(E, x, M, N, null);
        if (typeof M.then == "function")
          return C(
            E,
            x,
            as(M),
            N
          );
        if (M.$$typeof === q)
          return C(
            E,
            x,
            Kl(E, M),
            N
          );
        ls(E, M);
      }
      return null;
    }
    function O(E, x, M, N, F) {
      if (typeof N == "string" && N !== "" || typeof N == "number" || typeof N == "bigint")
        return E = E.get(M) || null, y(x, E, "" + N, F);
      if (typeof N == "object" && N !== null) {
        switch (N.$$typeof) {
          case b:
            return E = E.get(
              N.key === null ? M : N.key
            ) || null, T(x, E, N, F);
          case V:
            return E = E.get(
              N.key === null ? M : N.key
            ) || null, R(x, E, N, F);
          case P:
            var ft = N._init;
            return N = ft(N._payload), O(
              E,
              x,
              M,
              N,
              F
            );
        }
        if (Ct(N) || pt(N))
          return E = E.get(M) || null, _(x, E, N, F, null);
        if (typeof N.then == "function")
          return O(
            E,
            x,
            M,
            as(N),
            F
          );
        if (N.$$typeof === q)
          return O(
            E,
            x,
            M,
            Kl(x, N),
            F
          );
        ls(x, N);
      }
      return null;
    }
    function lt(E, x, M, N) {
      for (var F = null, ft = null, I = x, nt = x = 0, Pt = null; I !== null && nt < M.length; nt++) {
        I.index > nt ? (Pt = I, I = null) : Pt = I.sibling;
        var vt = C(
          E,
          I,
          M[nt],
          N
        );
        if (vt === null) {
          I === null && (I = Pt);
          break;
        }
        t && I && vt.alternate === null && e(E, I), x = r(vt, x, nt), ft === null ? F = vt : ft.sibling = vt, ft = vt, I = Pt;
      }
      if (nt === M.length)
        return n(E, I), St && Jn(E, nt), F;
      if (I === null) {
        for (; nt < M.length; nt++)
          I = U(E, M[nt], N), I !== null && (x = r(
            I,
            x,
            nt
          ), ft === null ? F = I : ft.sibling = I, ft = I);
        return St && Jn(E, nt), F;
      }
      for (I = a(I); nt < M.length; nt++)
        Pt = O(
          I,
          E,
          nt,
          M[nt],
          N
        ), Pt !== null && (t && Pt.alternate !== null && I.delete(
          Pt.key === null ? nt : Pt.key
        ), x = r(
          Pt,
          x,
          nt
        ), ft === null ? F = Pt : ft.sibling = Pt, ft = Pt);
      return t && I.forEach(function(jn) {
        return e(E, jn);
      }), St && Jn(E, nt), F;
    }
    function et(E, x, M, N) {
      if (M == null) throw Error(o(151));
      for (var F = null, ft = null, I = x, nt = x = 0, Pt = null, vt = M.next(); I !== null && !vt.done; nt++, vt = M.next()) {
        I.index > nt ? (Pt = I, I = null) : Pt = I.sibling;
        var jn = C(E, I, vt.value, N);
        if (jn === null) {
          I === null && (I = Pt);
          break;
        }
        t && I && jn.alternate === null && e(E, I), x = r(jn, x, nt), ft === null ? F = jn : ft.sibling = jn, ft = jn, I = Pt;
      }
      if (vt.done)
        return n(E, I), St && Jn(E, nt), F;
      if (I === null) {
        for (; !vt.done; nt++, vt = M.next())
          vt = U(E, vt.value, N), vt !== null && (x = r(vt, x, nt), ft === null ? F = vt : ft.sibling = vt, ft = vt);
        return St && Jn(E, nt), F;
      }
      for (I = a(I); !vt.done; nt++, vt = M.next())
        vt = O(I, E, nt, vt.value, N), vt !== null && (t && vt.alternate !== null && I.delete(vt.key === null ? nt : vt.key), x = r(vt, x, nt), ft === null ? F = vt : ft.sibling = vt, ft = vt);
      return t && I.forEach(function(Y1) {
        return e(E, Y1);
      }), St && Jn(E, nt), F;
    }
    function Et(E, x, M, N) {
      if (typeof M == "object" && M !== null && M.type === D && M.key === null && (M = M.props.children), typeof M == "object" && M !== null) {
        switch (M.$$typeof) {
          case b:
            t: {
              for (var F = M.key; x !== null; ) {
                if (x.key === F) {
                  if (F = M.type, F === D) {
                    if (x.tag === 7) {
                      n(
                        E,
                        x.sibling
                      ), N = s(
                        x,
                        M.props.children
                      ), N.return = E, E = N;
                      break t;
                    }
                  } else if (x.elementType === F || typeof F == "object" && F !== null && F.$$typeof === P && ad(F) === x.type) {
                    n(
                      E,
                      x.sibling
                    ), N = s(x, M.props), Ua(N, M), N.return = E, E = N;
                    break t;
                  }
                  n(E, x);
                  break;
                } else e(E, x);
                x = x.sibling;
              }
              M.type === D ? (N = kn(
                M.props.children,
                E.mode,
                N,
                M.key
              ), N.return = E, E = N) : (N = Yl(
                M.type,
                M.key,
                M.props,
                null,
                E.mode,
                N
              ), Ua(N, M), N.return = E, E = N);
            }
            return d(E);
          case V:
            t: {
              for (F = M.key; x !== null; ) {
                if (x.key === F)
                  if (x.tag === 4 && x.stateNode.containerInfo === M.containerInfo && x.stateNode.implementation === M.implementation) {
                    n(
                      E,
                      x.sibling
                    ), N = s(x, M.children || []), N.return = E, E = N;
                    break t;
                  } else {
                    n(E, x);
                    break;
                  }
                else e(E, x);
                x = x.sibling;
              }
              N = $u(M, E.mode, N), N.return = E, E = N;
            }
            return d(E);
          case P:
            return F = M._init, M = F(M._payload), Et(
              E,
              x,
              M,
              N
            );
        }
        if (Ct(M))
          return lt(
            E,
            x,
            M,
            N
          );
        if (pt(M)) {
          if (F = pt(M), typeof F != "function") throw Error(o(150));
          return M = F.call(M), et(
            E,
            x,
            M,
            N
          );
        }
        if (typeof M.then == "function")
          return Et(
            E,
            x,
            as(M),
            N
          );
        if (M.$$typeof === q)
          return Et(
            E,
            x,
            Kl(E, M),
            N
          );
        ls(E, M);
      }
      return typeof M == "string" && M !== "" || typeof M == "number" || typeof M == "bigint" ? (M = "" + M, x !== null && x.tag === 6 ? (n(E, x.sibling), N = s(x, M), N.return = E, E = N) : (n(E, x), N = Wu(M, E.mode, N), N.return = E, E = N), d(E)) : n(E, x);
    }
    return function(E, x, M, N) {
      try {
        Na = 0;
        var F = Et(
          E,
          x,
          M,
          N
        );
        return Ui = null, F;
      } catch (I) {
        if (I === Da || I === kl) throw I;
        var ft = ye(29, I, null, E.mode);
        return ft.lanes = N, ft.return = E, ft;
      } finally {
      }
    };
  }
  var ji = ld(!0), sd = ld(!1), Oe = j(null), Ge = null;
  function An(t) {
    var e = t.alternate;
    Q(Gt, Gt.current & 1), Q(Oe, t), Ge === null && (e === null || zi.current !== null || e.memoizedState !== null) && (Ge = t);
  }
  function ud(t) {
    if (t.tag === 22) {
      if (Q(Gt, Gt.current), Q(Oe, t), Ge === null) {
        var e = t.alternate;
        e !== null && e.memoizedState !== null && (Ge = t);
      }
    } else xn();
  }
  function xn() {
    Q(Gt, Gt.current), Q(Oe, Oe.current);
  }
  function ln(t) {
    k(Oe), Ge === t && (Ge = null), k(Gt);
  }
  var Gt = j(0);
  function ss(t) {
    for (var e = t; e !== null; ) {
      if (e.tag === 13) {
        var n = e.memoizedState;
        if (n !== null && (n = n.dehydrated, n === null || n.data === "$?" || Tr(n)))
          return e;
      } else if (e.tag === 19 && e.memoizedProps.revealOrder !== void 0) {
        if ((e.flags & 128) !== 0) return e;
      } else if (e.child !== null) {
        e.child.return = e, e = e.child;
        continue;
      }
      if (e === t) break;
      for (; e.sibling === null; ) {
        if (e.return === null || e.return === t) return null;
        e = e.return;
      }
      e.sibling.return = e.return, e = e.sibling;
    }
    return null;
  }
  function zo(t, e, n, a) {
    e = t.memoizedState, n = n(a, e), n = n == null ? e : g({}, e, n), t.memoizedState = n, t.lanes === 0 && (t.updateQueue.baseState = n);
  }
  var _o = {
    enqueueSetState: function(t, e, n) {
      t = t._reactInternals;
      var a = be(), s = Sn(a);
      s.payload = e, n != null && (s.callback = n), e = bn(t, s, a), e !== null && (Te(e, t, a), Ca(e, t, a));
    },
    enqueueReplaceState: function(t, e, n) {
      t = t._reactInternals;
      var a = be(), s = Sn(a);
      s.tag = 1, s.payload = e, n != null && (s.callback = n), e = bn(t, s, a), e !== null && (Te(e, t, a), Ca(e, t, a));
    },
    enqueueForceUpdate: function(t, e) {
      t = t._reactInternals;
      var n = be(), a = Sn(n);
      a.tag = 2, e != null && (a.callback = e), e = bn(t, a, n), e !== null && (Te(e, t, n), Ca(e, t, n));
    }
  };
  function od(t, e, n, a, s, r, d) {
    return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(a, r, d) : e.prototype && e.prototype.isPureReactComponent ? !va(n, a) || !va(s, r) : !0;
  }
  function rd(t, e, n, a) {
    t = e.state, typeof e.componentWillReceiveProps == "function" && e.componentWillReceiveProps(n, a), typeof e.UNSAFE_componentWillReceiveProps == "function" && e.UNSAFE_componentWillReceiveProps(n, a), e.state !== t && _o.enqueueReplaceState(e, e.state, null);
  }
  function ni(t, e) {
    var n = e;
    if ("ref" in e) {
      n = {};
      for (var a in e)
        a !== "ref" && (n[a] = e[a]);
    }
    if (t = t.defaultProps) {
      n === e && (n = g({}, n));
      for (var s in t)
        n[s] === void 0 && (n[s] = t[s]);
    }
    return n;
  }
  var us = typeof reportError == "function" ? reportError : function(t) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var e = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
        error: t
      });
      if (!window.dispatchEvent(e)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  };
  function cd(t) {
    us(t);
  }
  function fd(t) {
    console.error(t);
  }
  function hd(t) {
    us(t);
  }
  function os(t, e) {
    try {
      var n = t.onUncaughtError;
      n(e.value, { componentStack: e.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function dd(t, e, n) {
    try {
      var a = t.onCaughtError;
      a(n.value, {
        componentStack: n.stack,
        errorBoundary: e.tag === 1 ? e.stateNode : null
      });
    } catch (s) {
      setTimeout(function() {
        throw s;
      });
    }
  }
  function Bo(t, e, n) {
    return n = Sn(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
      os(t, e);
    }, n;
  }
  function md(t) {
    return t = Sn(t), t.tag = 3, t;
  }
  function pd(t, e, n, a) {
    var s = n.type.getDerivedStateFromError;
    if (typeof s == "function") {
      var r = a.value;
      t.payload = function() {
        return s(r);
      }, t.callback = function() {
        dd(e, n, a);
      };
    }
    var d = n.stateNode;
    d !== null && typeof d.componentDidCatch == "function" && (t.callback = function() {
      dd(e, n, a), typeof s != "function" && (On === null ? On = /* @__PURE__ */ new Set([this]) : On.add(this));
      var y = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: y !== null ? y : ""
      });
    });
  }
  function Yv(t, e, n, a, s) {
    if (n.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (e = n.alternate, e !== null && xa(
        e,
        n,
        s,
        !0
      ), n = Oe.current, n !== null) {
        switch (n.tag) {
          case 13:
            return Ge === null ? ar() : n.alternate === null && Bt === 0 && (Bt = 3), n.flags &= -257, n.flags |= 65536, n.lanes = s, a === oo ? n.flags |= 16384 : (e = n.updateQueue, e === null ? n.updateQueue = /* @__PURE__ */ new Set([a]) : e.add(a), sr(t, a, s)), !1;
          case 22:
            return n.flags |= 65536, a === oo ? n.flags |= 16384 : (e = n.updateQueue, e === null ? (e = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, n.updateQueue = e) : (n = e.retryQueue, n === null ? e.retryQueue = /* @__PURE__ */ new Set([a]) : n.add(a)), sr(t, a, s)), !1;
        }
        throw Error(o(435, n.tag));
      }
      return sr(t, a, s), ar(), !1;
    }
    if (St)
      return e = Oe.current, e !== null ? ((e.flags & 65536) === 0 && (e.flags |= 256), e.flags |= 65536, e.lanes = s, a !== eo && (t = Error(o(422), { cause: a }), Aa(Me(t, n)))) : (a !== eo && (e = Error(o(423), {
        cause: a
      }), Aa(
        Me(e, n)
      )), t = t.current.alternate, t.flags |= 65536, s &= -s, t.lanes |= s, a = Me(a, n), s = Bo(
        t.stateNode,
        a,
        s
      ), fo(t, s), Bt !== 4 && (Bt = 2)), !1;
    var r = Error(o(520), { cause: a });
    if (r = Me(r, n), Xa === null ? Xa = [r] : Xa.push(r), Bt !== 4 && (Bt = 2), e === null) return !0;
    a = Me(a, n), n = e;
    do {
      switch (n.tag) {
        case 3:
          return n.flags |= 65536, t = s & -s, n.lanes |= t, t = Bo(n.stateNode, a, t), fo(n, t), !1;
        case 1:
          if (e = n.type, r = n.stateNode, (n.flags & 128) === 0 && (typeof e.getDerivedStateFromError == "function" || r !== null && typeof r.componentDidCatch == "function" && (On === null || !On.has(r))))
            return n.flags |= 65536, s &= -s, n.lanes |= s, s = md(s), pd(
              s,
              t,
              n,
              a
            ), fo(n, s), !1;
      }
      n = n.return;
    } while (n !== null);
    return !1;
  }
  var yd = Error(o(461)), Qt = !1;
  function Ft(t, e, n, a) {
    e.child = t === null ? sd(e, null, n, a) : ji(
      e,
      t.child,
      n,
      a
    );
  }
  function gd(t, e, n, a, s) {
    n = n.render;
    var r = e.ref;
    if ("ref" in a) {
      var d = {};
      for (var y in a)
        y !== "ref" && (d[y] = a[y]);
    } else d = a;
    return In(e), a = go(
      t,
      e,
      n,
      d,
      r,
      s
    ), y = vo(), t !== null && !Qt ? (So(t, e, s), sn(t, e, s)) : (St && y && Iu(e), e.flags |= 1, Ft(t, e, a, s), e.child);
  }
  function vd(t, e, n, a, s) {
    if (t === null) {
      var r = n.type;
      return typeof r == "function" && !Fu(r) && r.defaultProps === void 0 && n.compare === null ? (e.tag = 15, e.type = r, Sd(
        t,
        e,
        r,
        a,
        s
      )) : (t = Yl(
        n.type,
        null,
        a,
        e,
        e.mode,
        s
      ), t.ref = e.ref, t.return = e, e.child = t);
    }
    if (r = t.child, !Go(t, s)) {
      var d = r.memoizedProps;
      if (n = n.compare, n = n !== null ? n : va, n(d, a) && t.ref === e.ref)
        return sn(t, e, s);
    }
    return e.flags |= 1, t = $e(r, a), t.ref = e.ref, t.return = e, e.child = t;
  }
  function Sd(t, e, n, a, s) {
    if (t !== null) {
      var r = t.memoizedProps;
      if (va(r, a) && t.ref === e.ref)
        if (Qt = !1, e.pendingProps = a = r, Go(t, s))
          (t.flags & 131072) !== 0 && (Qt = !0);
        else
          return e.lanes = t.lanes, sn(t, e, s);
    }
    return No(
      t,
      e,
      n,
      a,
      s
    );
  }
  function bd(t, e, n) {
    var a = e.pendingProps, s = a.children, r = t !== null ? t.memoizedState : null;
    if (a.mode === "hidden") {
      if ((e.flags & 128) !== 0) {
        if (a = r !== null ? r.baseLanes | n : n, t !== null) {
          for (s = e.child = t.child, r = 0; s !== null; )
            r = r | s.lanes | s.childLanes, s = s.sibling;
          e.childLanes = r & ~a;
        } else e.childLanes = 0, e.child = null;
        return Td(
          t,
          e,
          a,
          n
        );
      }
      if ((n & 536870912) !== 0)
        e.memoizedState = { baseLanes: 0, cachePool: null }, t !== null && Ql(
          e,
          r !== null ? r.cachePool : null
        ), r !== null ? Sh(e, r) : mo(), ud(e);
      else
        return e.lanes = e.childLanes = 536870912, Td(
          t,
          e,
          r !== null ? r.baseLanes | n : n,
          n
        );
    } else
      r !== null ? (Ql(e, r.cachePool), Sh(e, r), xn(), e.memoizedState = null) : (t !== null && Ql(e, null), mo(), xn());
    return Ft(t, e, s, n), e.child;
  }
  function Td(t, e, n, a) {
    var s = uo();
    return s = s === null ? null : { parent: Yt._currentValue, pool: s }, e.memoizedState = {
      baseLanes: n,
      cachePool: s
    }, t !== null && Ql(e, null), mo(), ud(e), t !== null && xa(t, e, a, !0), null;
  }
  function rs(t, e) {
    var n = e.ref;
    if (n === null)
      t !== null && t.ref !== null && (e.flags |= 4194816);
    else {
      if (typeof n != "function" && typeof n != "object")
        throw Error(o(284));
      (t === null || t.ref !== n) && (e.flags |= 4194816);
    }
  }
  function No(t, e, n, a, s) {
    return In(e), n = go(
      t,
      e,
      n,
      a,
      void 0,
      s
    ), a = vo(), t !== null && !Qt ? (So(t, e, s), sn(t, e, s)) : (St && a && Iu(e), e.flags |= 1, Ft(t, e, n, s), e.child);
  }
  function Ad(t, e, n, a, s, r) {
    return In(e), e.updateQueue = null, n = Th(
      e,
      a,
      n,
      s
    ), bh(t), a = vo(), t !== null && !Qt ? (So(t, e, r), sn(t, e, r)) : (St && a && Iu(e), e.flags |= 1, Ft(t, e, n, r), e.child);
  }
  function xd(t, e, n, a, s) {
    if (In(e), e.stateNode === null) {
      var r = Ri, d = n.contextType;
      typeof d == "object" && d !== null && (r = ne(d)), r = new n(a, r), e.memoizedState = r.state !== null && r.state !== void 0 ? r.state : null, r.updater = _o, e.stateNode = r, r._reactInternals = e, r = e.stateNode, r.props = a, r.state = e.memoizedState, r.refs = {}, ro(e), d = n.contextType, r.context = typeof d == "object" && d !== null ? ne(d) : Ri, r.state = e.memoizedState, d = n.getDerivedStateFromProps, typeof d == "function" && (zo(
        e,
        n,
        d,
        a
      ), r.state = e.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof r.getSnapshotBeforeUpdate == "function" || typeof r.UNSAFE_componentWillMount != "function" && typeof r.componentWillMount != "function" || (d = r.state, typeof r.componentWillMount == "function" && r.componentWillMount(), typeof r.UNSAFE_componentWillMount == "function" && r.UNSAFE_componentWillMount(), d !== r.state && _o.enqueueReplaceState(r, r.state, null), Va(e, a, r, s), Oa(), r.state = e.memoizedState), typeof r.componentDidMount == "function" && (e.flags |= 4194308), a = !0;
    } else if (t === null) {
      r = e.stateNode;
      var y = e.memoizedProps, T = ni(n, y);
      r.props = T;
      var R = r.context, _ = n.contextType;
      d = Ri, typeof _ == "object" && _ !== null && (d = ne(_));
      var U = n.getDerivedStateFromProps;
      _ = typeof U == "function" || typeof r.getSnapshotBeforeUpdate == "function", y = e.pendingProps !== y, _ || typeof r.UNSAFE_componentWillReceiveProps != "function" && typeof r.componentWillReceiveProps != "function" || (y || R !== d) && rd(
        e,
        r,
        a,
        d
      ), vn = !1;
      var C = e.memoizedState;
      r.state = C, Va(e, a, r, s), Oa(), R = e.memoizedState, y || C !== R || vn ? (typeof U == "function" && (zo(
        e,
        n,
        U,
        a
      ), R = e.memoizedState), (T = vn || od(
        e,
        n,
        T,
        a,
        C,
        R,
        d
      )) ? (_ || typeof r.UNSAFE_componentWillMount != "function" && typeof r.componentWillMount != "function" || (typeof r.componentWillMount == "function" && r.componentWillMount(), typeof r.UNSAFE_componentWillMount == "function" && r.UNSAFE_componentWillMount()), typeof r.componentDidMount == "function" && (e.flags |= 4194308)) : (typeof r.componentDidMount == "function" && (e.flags |= 4194308), e.memoizedProps = a, e.memoizedState = R), r.props = a, r.state = R, r.context = d, a = T) : (typeof r.componentDidMount == "function" && (e.flags |= 4194308), a = !1);
    } else {
      r = e.stateNode, co(t, e), d = e.memoizedProps, _ = ni(n, d), r.props = _, U = e.pendingProps, C = r.context, R = n.contextType, T = Ri, typeof R == "object" && R !== null && (T = ne(R)), y = n.getDerivedStateFromProps, (R = typeof y == "function" || typeof r.getSnapshotBeforeUpdate == "function") || typeof r.UNSAFE_componentWillReceiveProps != "function" && typeof r.componentWillReceiveProps != "function" || (d !== U || C !== T) && rd(
        e,
        r,
        a,
        T
      ), vn = !1, C = e.memoizedState, r.state = C, Va(e, a, r, s), Oa();
      var O = e.memoizedState;
      d !== U || C !== O || vn || t !== null && t.dependencies !== null && Zl(t.dependencies) ? (typeof y == "function" && (zo(
        e,
        n,
        y,
        a
      ), O = e.memoizedState), (_ = vn || od(
        e,
        n,
        _,
        a,
        C,
        O,
        T
      ) || t !== null && t.dependencies !== null && Zl(t.dependencies)) ? (R || typeof r.UNSAFE_componentWillUpdate != "function" && typeof r.componentWillUpdate != "function" || (typeof r.componentWillUpdate == "function" && r.componentWillUpdate(a, O, T), typeof r.UNSAFE_componentWillUpdate == "function" && r.UNSAFE_componentWillUpdate(
        a,
        O,
        T
      )), typeof r.componentDidUpdate == "function" && (e.flags |= 4), typeof r.getSnapshotBeforeUpdate == "function" && (e.flags |= 1024)) : (typeof r.componentDidUpdate != "function" || d === t.memoizedProps && C === t.memoizedState || (e.flags |= 4), typeof r.getSnapshotBeforeUpdate != "function" || d === t.memoizedProps && C === t.memoizedState || (e.flags |= 1024), e.memoizedProps = a, e.memoizedState = O), r.props = a, r.state = O, r.context = T, a = _) : (typeof r.componentDidUpdate != "function" || d === t.memoizedProps && C === t.memoizedState || (e.flags |= 4), typeof r.getSnapshotBeforeUpdate != "function" || d === t.memoizedProps && C === t.memoizedState || (e.flags |= 1024), a = !1);
    }
    return r = a, rs(t, e), a = (e.flags & 128) !== 0, r || a ? (r = e.stateNode, n = a && typeof n.getDerivedStateFromError != "function" ? null : r.render(), e.flags |= 1, t !== null && a ? (e.child = ji(
      e,
      t.child,
      null,
      s
    ), e.child = ji(
      e,
      null,
      n,
      s
    )) : Ft(t, e, n, s), e.memoizedState = r.state, t = e.child) : t = sn(
      t,
      e,
      s
    ), t;
  }
  function Ed(t, e, n, a) {
    return Ta(), e.flags |= 256, Ft(t, e, n, a), e.child;
  }
  var Uo = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function jo(t) {
    return { baseLanes: t, cachePool: fh() };
  }
  function Lo(t, e, n) {
    return t = t !== null ? t.childLanes & ~n : 0, e && (t |= Ve), t;
  }
  function Md(t, e, n) {
    var a = e.pendingProps, s = !1, r = (e.flags & 128) !== 0, d;
    if ((d = r) || (d = t !== null && t.memoizedState === null ? !1 : (Gt.current & 2) !== 0), d && (s = !0, e.flags &= -129), d = (e.flags & 32) !== 0, e.flags &= -33, t === null) {
      if (St) {
        if (s ? An(e) : xn(), St) {
          var y = _t, T;
          if (T = y) {
            t: {
              for (T = y, y = Ye; T.nodeType !== 8; ) {
                if (!y) {
                  y = null;
                  break t;
                }
                if (T = Ue(
                  T.nextSibling
                ), T === null) {
                  y = null;
                  break t;
                }
              }
              y = T;
            }
            y !== null ? (e.memoizedState = {
              dehydrated: y,
              treeContext: Pn !== null ? { id: Ie, overflow: tn } : null,
              retryLane: 536870912,
              hydrationErrors: null
            }, T = ye(
              18,
              null,
              null,
              0
            ), T.stateNode = y, T.return = e, e.child = T, ae = e, _t = null, T = !0) : T = !1;
          }
          T || Wn(e);
        }
        if (y = e.memoizedState, y !== null && (y = y.dehydrated, y !== null))
          return Tr(y) ? e.lanes = 32 : e.lanes = 536870912, null;
        ln(e);
      }
      return y = a.children, a = a.fallback, s ? (xn(), s = e.mode, y = cs(
        { mode: "hidden", children: y },
        s
      ), a = kn(
        a,
        s,
        n,
        null
      ), y.return = e, a.return = e, y.sibling = a, e.child = y, s = e.child, s.memoizedState = jo(n), s.childLanes = Lo(
        t,
        d,
        n
      ), e.memoizedState = Uo, a) : (An(e), Ho(e, y));
    }
    if (T = t.memoizedState, T !== null && (y = T.dehydrated, y !== null)) {
      if (r)
        e.flags & 256 ? (An(e), e.flags &= -257, e = qo(
          t,
          e,
          n
        )) : e.memoizedState !== null ? (xn(), e.child = t.child, e.flags |= 128, e = null) : (xn(), s = a.fallback, y = e.mode, a = cs(
          { mode: "visible", children: a.children },
          y
        ), s = kn(
          s,
          y,
          n,
          null
        ), s.flags |= 2, a.return = e, s.return = e, a.sibling = s, e.child = a, ji(
          e,
          t.child,
          null,
          n
        ), a = e.child, a.memoizedState = jo(n), a.childLanes = Lo(
          t,
          d,
          n
        ), e.memoizedState = Uo, e = s);
      else if (An(e), Tr(y)) {
        if (d = y.nextSibling && y.nextSibling.dataset, d) var R = d.dgst;
        d = R, a = Error(o(419)), a.stack = "", a.digest = d, Aa({ value: a, source: null, stack: null }), e = qo(
          t,
          e,
          n
        );
      } else if (Qt || xa(t, e, n, !1), d = (n & t.childLanes) !== 0, Qt || d) {
        if (d = Ot, d !== null && (a = n & -n, a = (a & 42) !== 0 ? 1 : Tu(a), a = (a & (d.suspendedLanes | n)) !== 0 ? 0 : a, a !== 0 && a !== T.retryLane))
          throw T.retryLane = a, Di(t, a), Te(d, t, a), yd;
        y.data === "$?" || ar(), e = qo(
          t,
          e,
          n
        );
      } else
        y.data === "$?" ? (e.flags |= 192, e.child = t.child, e = null) : (t = T.treeContext, _t = Ue(
          y.nextSibling
        ), ae = e, St = !0, Fn = null, Ye = !1, t !== null && (Re[Ce++] = Ie, Re[Ce++] = tn, Re[Ce++] = Pn, Ie = t.id, tn = t.overflow, Pn = e), e = Ho(
          e,
          a.children
        ), e.flags |= 4096);
      return e;
    }
    return s ? (xn(), s = a.fallback, y = e.mode, T = t.child, R = T.sibling, a = $e(T, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = T.subtreeFlags & 65011712, R !== null ? s = $e(R, s) : (s = kn(
      s,
      y,
      n,
      null
    ), s.flags |= 2), s.return = e, a.return = e, a.sibling = s, e.child = a, a = s, s = e.child, y = t.child.memoizedState, y === null ? y = jo(n) : (T = y.cachePool, T !== null ? (R = Yt._currentValue, T = T.parent !== R ? { parent: R, pool: R } : T) : T = fh(), y = {
      baseLanes: y.baseLanes | n,
      cachePool: T
    }), s.memoizedState = y, s.childLanes = Lo(
      t,
      d,
      n
    ), e.memoizedState = Uo, a) : (An(e), n = t.child, t = n.sibling, n = $e(n, {
      mode: "visible",
      children: a.children
    }), n.return = e, n.sibling = null, t !== null && (d = e.deletions, d === null ? (e.deletions = [t], e.flags |= 16) : d.push(t)), e.child = n, e.memoizedState = null, n);
  }
  function Ho(t, e) {
    return e = cs(
      { mode: "visible", children: e },
      t.mode
    ), e.return = t, t.child = e;
  }
  function cs(t, e) {
    return t = ye(22, t, null, e), t.lanes = 0, t.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }, t;
  }
  function qo(t, e, n) {
    return ji(e, t.child, null, n), t = Ho(
      e,
      e.pendingProps.children
    ), t.flags |= 2, e.memoizedState = null, t;
  }
  function Dd(t, e, n) {
    t.lanes |= e;
    var a = t.alternate;
    a !== null && (a.lanes |= e), io(t.return, e, n);
  }
  function Yo(t, e, n, a, s) {
    var r = t.memoizedState;
    r === null ? t.memoizedState = {
      isBackwards: e,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: n,
      tailMode: s
    } : (r.isBackwards = e, r.rendering = null, r.renderingStartTime = 0, r.last = a, r.tail = n, r.tailMode = s);
  }
  function Rd(t, e, n) {
    var a = e.pendingProps, s = a.revealOrder, r = a.tail;
    if (Ft(t, e, a.children, n), a = Gt.current, (a & 2) !== 0)
      a = a & 1 | 2, e.flags |= 128;
    else {
      if (t !== null && (t.flags & 128) !== 0)
        t: for (t = e.child; t !== null; ) {
          if (t.tag === 13)
            t.memoizedState !== null && Dd(t, n, e);
          else if (t.tag === 19)
            Dd(t, n, e);
          else if (t.child !== null) {
            t.child.return = t, t = t.child;
            continue;
          }
          if (t === e) break t;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e)
              break t;
            t = t.return;
          }
          t.sibling.return = t.return, t = t.sibling;
        }
      a &= 1;
    }
    switch (Q(Gt, a), s) {
      case "forwards":
        for (n = e.child, s = null; n !== null; )
          t = n.alternate, t !== null && ss(t) === null && (s = n), n = n.sibling;
        n = s, n === null ? (s = e.child, e.child = null) : (s = n.sibling, n.sibling = null), Yo(
          e,
          !1,
          s,
          n,
          r
        );
        break;
      case "backwards":
        for (n = null, s = e.child, e.child = null; s !== null; ) {
          if (t = s.alternate, t !== null && ss(t) === null) {
            e.child = s;
            break;
          }
          t = s.sibling, s.sibling = n, n = s, s = t;
        }
        Yo(
          e,
          !0,
          n,
          null,
          r
        );
        break;
      case "together":
        Yo(e, !1, null, null, void 0);
        break;
      default:
        e.memoizedState = null;
    }
    return e.child;
  }
  function sn(t, e, n) {
    if (t !== null && (e.dependencies = t.dependencies), Cn |= e.lanes, (n & e.childLanes) === 0)
      if (t !== null) {
        if (xa(
          t,
          e,
          n,
          !1
        ), (n & e.childLanes) === 0)
          return null;
      } else return null;
    if (t !== null && e.child !== t.child)
      throw Error(o(153));
    if (e.child !== null) {
      for (t = e.child, n = $e(t, t.pendingProps), e.child = n, n.return = e; t.sibling !== null; )
        t = t.sibling, n = n.sibling = $e(t, t.pendingProps), n.return = e;
      n.sibling = null;
    }
    return e.child;
  }
  function Go(t, e) {
    return (t.lanes & e) !== 0 ? !0 : (t = t.dependencies, !!(t !== null && Zl(t)));
  }
  function Gv(t, e, n) {
    switch (e.tag) {
      case 3:
        Vt(e, e.stateNode.containerInfo), gn(e, Yt, t.memoizedState.cache), Ta();
        break;
      case 27:
      case 5:
        yu(e);
        break;
      case 4:
        Vt(e, e.stateNode.containerInfo);
        break;
      case 10:
        gn(
          e,
          e.type,
          e.memoizedProps.value
        );
        break;
      case 13:
        var a = e.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (An(e), e.flags |= 128, null) : (n & e.child.childLanes) !== 0 ? Md(t, e, n) : (An(e), t = sn(
            t,
            e,
            n
          ), t !== null ? t.sibling : null);
        An(e);
        break;
      case 19:
        var s = (t.flags & 128) !== 0;
        if (a = (n & e.childLanes) !== 0, a || (xa(
          t,
          e,
          n,
          !1
        ), a = (n & e.childLanes) !== 0), s) {
          if (a)
            return Rd(
              t,
              e,
              n
            );
          e.flags |= 128;
        }
        if (s = e.memoizedState, s !== null && (s.rendering = null, s.tail = null, s.lastEffect = null), Q(Gt, Gt.current), a) break;
        return null;
      case 22:
      case 23:
        return e.lanes = 0, bd(t, e, n);
      case 24:
        gn(e, Yt, t.memoizedState.cache);
    }
    return sn(t, e, n);
  }
  function Cd(t, e, n) {
    if (t !== null)
      if (t.memoizedProps !== e.pendingProps)
        Qt = !0;
      else {
        if (!Go(t, n) && (e.flags & 128) === 0)
          return Qt = !1, Gv(
            t,
            e,
            n
          );
        Qt = (t.flags & 131072) !== 0;
      }
    else
      Qt = !1, St && (e.flags & 1048576) !== 0 && ah(e, Xl, e.index);
    switch (e.lanes = 0, e.tag) {
      case 16:
        t: {
          t = e.pendingProps;
          var a = e.elementType, s = a._init;
          if (a = s(a._payload), e.type = a, typeof a == "function")
            Fu(a) ? (t = ni(a, t), e.tag = 1, e = xd(
              null,
              e,
              a,
              t,
              n
            )) : (e.tag = 0, e = No(
              null,
              e,
              a,
              t,
              n
            ));
          else {
            if (a != null) {
              if (s = a.$$typeof, s === G) {
                e.tag = 11, e = gd(
                  null,
                  e,
                  a,
                  t,
                  n
                );
                break t;
              } else if (s === at) {
                e.tag = 14, e = vd(
                  null,
                  e,
                  a,
                  t,
                  n
                );
                break t;
              }
            }
            throw e = Zt(a) || a, Error(o(306, e, ""));
          }
        }
        return e;
      case 0:
        return No(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 1:
        return a = e.type, s = ni(
          a,
          e.pendingProps
        ), xd(
          t,
          e,
          a,
          s,
          n
        );
      case 3:
        t: {
          if (Vt(
            e,
            e.stateNode.containerInfo
          ), t === null) throw Error(o(387));
          a = e.pendingProps;
          var r = e.memoizedState;
          s = r.element, co(t, e), Va(e, a, null, n);
          var d = e.memoizedState;
          if (a = d.cache, gn(e, Yt, a), a !== r.cache && ao(
            e,
            [Yt],
            n,
            !0
          ), Oa(), a = d.element, r.isDehydrated)
            if (r = {
              element: a,
              isDehydrated: !1,
              cache: d.cache
            }, e.updateQueue.baseState = r, e.memoizedState = r, e.flags & 256) {
              e = Ed(
                t,
                e,
                a,
                n
              );
              break t;
            } else if (a !== s) {
              s = Me(
                Error(o(424)),
                e
              ), Aa(s), e = Ed(
                t,
                e,
                a,
                n
              );
              break t;
            } else {
              switch (t = e.stateNode.containerInfo, t.nodeType) {
                case 9:
                  t = t.body;
                  break;
                default:
                  t = t.nodeName === "HTML" ? t.ownerDocument.body : t;
              }
              for (_t = Ue(t.firstChild), ae = e, St = !0, Fn = null, Ye = !0, n = sd(
                e,
                null,
                a,
                n
              ), e.child = n; n; )
                n.flags = n.flags & -3 | 4096, n = n.sibling;
            }
          else {
            if (Ta(), a === s) {
              e = sn(
                t,
                e,
                n
              );
              break t;
            }
            Ft(
              t,
              e,
              a,
              n
            );
          }
          e = e.child;
        }
        return e;
      case 26:
        return rs(t, e), t === null ? (n = zm(
          e.type,
          null,
          e.pendingProps,
          null
        )) ? e.memoizedState = n : St || (n = e.type, t = e.pendingProps, a = Es(
          ut.current
        ).createElement(n), a[ee] = e, a[ue] = t, $t(a, n, t), Kt(a), e.stateNode = a) : e.memoizedState = zm(
          e.type,
          t.memoizedProps,
          e.pendingProps,
          t.memoizedState
        ), null;
      case 27:
        return yu(e), t === null && St && (a = e.stateNode = Om(
          e.type,
          e.pendingProps,
          ut.current
        ), ae = e, Ye = !0, s = _t, zn(e.type) ? (Ar = s, _t = Ue(
          a.firstChild
        )) : _t = s), Ft(
          t,
          e,
          e.pendingProps.children,
          n
        ), rs(t, e), t === null && (e.flags |= 4194304), e.child;
      case 5:
        return t === null && St && ((s = a = _t) && (a = y1(
          a,
          e.type,
          e.pendingProps,
          Ye
        ), a !== null ? (e.stateNode = a, ae = e, _t = Ue(
          a.firstChild
        ), Ye = !1, s = !0) : s = !1), s || Wn(e)), yu(e), s = e.type, r = e.pendingProps, d = t !== null ? t.memoizedProps : null, a = r.children, vr(s, r) ? a = null : d !== null && vr(s, d) && (e.flags |= 32), e.memoizedState !== null && (s = go(
          t,
          e,
          Bv,
          null,
          null,
          n
        ), $a._currentValue = s), rs(t, e), Ft(t, e, a, n), e.child;
      case 6:
        return t === null && St && ((t = n = _t) && (n = g1(
          n,
          e.pendingProps,
          Ye
        ), n !== null ? (e.stateNode = n, ae = e, _t = null, t = !0) : t = !1), t || Wn(e)), null;
      case 13:
        return Md(t, e, n);
      case 4:
        return Vt(
          e,
          e.stateNode.containerInfo
        ), a = e.pendingProps, t === null ? e.child = ji(
          e,
          null,
          a,
          n
        ) : Ft(
          t,
          e,
          a,
          n
        ), e.child;
      case 11:
        return gd(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 7:
        return Ft(
          t,
          e,
          e.pendingProps,
          n
        ), e.child;
      case 8:
        return Ft(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 12:
        return Ft(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 10:
        return a = e.pendingProps, gn(e, e.type, a.value), Ft(
          t,
          e,
          a.children,
          n
        ), e.child;
      case 9:
        return s = e.type._context, a = e.pendingProps.children, In(e), s = ne(s), a = a(s), e.flags |= 1, Ft(t, e, a, n), e.child;
      case 14:
        return vd(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 15:
        return Sd(
          t,
          e,
          e.type,
          e.pendingProps,
          n
        );
      case 19:
        return Rd(t, e, n);
      case 31:
        return a = e.pendingProps, n = e.mode, a = {
          mode: a.mode,
          children: a.children
        }, t === null ? (n = cs(
          a,
          n
        ), n.ref = e.ref, e.child = n, n.return = e, e = n) : (n = $e(t.child, a), n.ref = e.ref, e.child = n, n.return = e, e = n), e;
      case 22:
        return bd(t, e, n);
      case 24:
        return In(e), a = ne(Yt), t === null ? (s = uo(), s === null && (s = Ot, r = lo(), s.pooledCache = r, r.refCount++, r !== null && (s.pooledCacheLanes |= n), s = r), e.memoizedState = {
          parent: a,
          cache: s
        }, ro(e), gn(e, Yt, s)) : ((t.lanes & n) !== 0 && (co(t, e), Va(e, null, null, n), Oa()), s = t.memoizedState, r = e.memoizedState, s.parent !== a ? (s = { parent: a, cache: a }, e.memoizedState = s, e.lanes === 0 && (e.memoizedState = e.updateQueue.baseState = s), gn(e, Yt, a)) : (a = r.cache, gn(e, Yt, a), a !== s.cache && ao(
          e,
          [Yt],
          n,
          !0
        ))), Ft(
          t,
          e,
          e.pendingProps.children,
          n
        ), e.child;
      case 29:
        throw e.pendingProps;
    }
    throw Error(o(156, e.tag));
  }
  function un(t) {
    t.flags |= 4;
  }
  function Od(t, e) {
    if (e.type !== "stylesheet" || (e.state.loading & 4) !== 0)
      t.flags &= -16777217;
    else if (t.flags |= 16777216, !jm(e)) {
      if (e = Oe.current, e !== null && ((yt & 4194048) === yt ? Ge !== null : (yt & 62914560) !== yt && (yt & 536870912) === 0 || e !== Ge))
        throw Ra = oo, hh;
      t.flags |= 8192;
    }
  }
  function fs(t, e) {
    e !== null && (t.flags |= 4), t.flags & 16384 && (e = t.tag !== 22 ? uf() : 536870912, t.lanes |= e, Yi |= e);
  }
  function ja(t, e) {
    if (!St)
      switch (t.tailMode) {
        case "hidden":
          e = t.tail;
          for (var n = null; e !== null; )
            e.alternate !== null && (n = e), e = e.sibling;
          n === null ? t.tail = null : n.sibling = null;
          break;
        case "collapsed":
          n = t.tail;
          for (var a = null; n !== null; )
            n.alternate !== null && (a = n), n = n.sibling;
          a === null ? e || t.tail === null ? t.tail = null : t.tail.sibling = null : a.sibling = null;
      }
  }
  function zt(t) {
    var e = t.alternate !== null && t.alternate.child === t.child, n = 0, a = 0;
    if (e)
      for (var s = t.child; s !== null; )
        n |= s.lanes | s.childLanes, a |= s.subtreeFlags & 65011712, a |= s.flags & 65011712, s.return = t, s = s.sibling;
    else
      for (s = t.child; s !== null; )
        n |= s.lanes | s.childLanes, a |= s.subtreeFlags, a |= s.flags, s.return = t, s = s.sibling;
    return t.subtreeFlags |= a, t.childLanes = n, e;
  }
  function Xv(t, e, n) {
    var a = e.pendingProps;
    switch (to(e), e.tag) {
      case 31:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return zt(e), null;
      case 1:
        return zt(e), null;
      case 3:
        return n = e.stateNode, a = null, t !== null && (a = t.memoizedState.cache), e.memoizedState.cache !== a && (e.flags |= 2048), nn(Yt), dn(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (t === null || t.child === null) && (ba(e) ? un(e) : t === null || t.memoizedState.isDehydrated && (e.flags & 256) === 0 || (e.flags |= 1024, uh())), zt(e), null;
      case 26:
        return n = e.memoizedState, t === null ? (un(e), n !== null ? (zt(e), Od(e, n)) : (zt(e), e.flags &= -16777217)) : n ? n !== t.memoizedState ? (un(e), zt(e), Od(e, n)) : (zt(e), e.flags &= -16777217) : (t.memoizedProps !== a && un(e), zt(e), e.flags &= -16777217), null;
      case 27:
        Al(e), n = ut.current;
        var s = e.type;
        if (t !== null && e.stateNode != null)
          t.memoizedProps !== a && un(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(o(166));
            return zt(e), null;
          }
          t = tt.current, ba(e) ? lh(e) : (t = Om(s, a, n), e.stateNode = t, un(e));
        }
        return zt(e), null;
      case 5:
        if (Al(e), n = e.type, t !== null && e.stateNode != null)
          t.memoizedProps !== a && un(e);
        else {
          if (!a) {
            if (e.stateNode === null)
              throw Error(o(166));
            return zt(e), null;
          }
          if (t = tt.current, ba(e))
            lh(e);
          else {
            switch (s = Es(
              ut.current
            ), t) {
              case 1:
                t = s.createElementNS(
                  "http://www.w3.org/2000/svg",
                  n
                );
                break;
              case 2:
                t = s.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  n
                );
                break;
              default:
                switch (n) {
                  case "svg":
                    t = s.createElementNS(
                      "http://www.w3.org/2000/svg",
                      n
                    );
                    break;
                  case "math":
                    t = s.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n
                    );
                    break;
                  case "script":
                    t = s.createElement("div"), t.innerHTML = "<script><\/script>", t = t.removeChild(t.firstChild);
                    break;
                  case "select":
                    t = typeof a.is == "string" ? s.createElement("select", { is: a.is }) : s.createElement("select"), a.multiple ? t.multiple = !0 : a.size && (t.size = a.size);
                    break;
                  default:
                    t = typeof a.is == "string" ? s.createElement(n, { is: a.is }) : s.createElement(n);
                }
            }
            t[ee] = e, t[ue] = a;
            t: for (s = e.child; s !== null; ) {
              if (s.tag === 5 || s.tag === 6)
                t.appendChild(s.stateNode);
              else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                s.child.return = s, s = s.child;
                continue;
              }
              if (s === e) break t;
              for (; s.sibling === null; ) {
                if (s.return === null || s.return === e)
                  break t;
                s = s.return;
              }
              s.sibling.return = s.return, s = s.sibling;
            }
            e.stateNode = t;
            t: switch ($t(t, n, a), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                t = !!a.autoFocus;
                break t;
              case "img":
                t = !0;
                break t;
              default:
                t = !1;
            }
            t && un(e);
          }
        }
        return zt(e), e.flags &= -16777217, null;
      case 6:
        if (t && e.stateNode != null)
          t.memoizedProps !== a && un(e);
        else {
          if (typeof a != "string" && e.stateNode === null)
            throw Error(o(166));
          if (t = ut.current, ba(e)) {
            if (t = e.stateNode, n = e.memoizedProps, a = null, s = ae, s !== null)
              switch (s.tag) {
                case 27:
                case 5:
                  a = s.memoizedProps;
              }
            t[ee] = e, t = !!(t.nodeValue === n || a !== null && a.suppressHydrationWarning === !0 || Am(t.nodeValue, n)), t || Wn(e);
          } else
            t = Es(t).createTextNode(
              a
            ), t[ee] = e, e.stateNode = t;
        }
        return zt(e), null;
      case 13:
        if (a = e.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
          if (s = ba(e), a !== null && a.dehydrated !== null) {
            if (t === null) {
              if (!s) throw Error(o(318));
              if (s = e.memoizedState, s = s !== null ? s.dehydrated : null, !s) throw Error(o(317));
              s[ee] = e;
            } else
              Ta(), (e.flags & 128) === 0 && (e.memoizedState = null), e.flags |= 4;
            zt(e), s = !1;
          } else
            s = uh(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = s), s = !0;
          if (!s)
            return e.flags & 256 ? (ln(e), e) : (ln(e), null);
        }
        if (ln(e), (e.flags & 128) !== 0)
          return e.lanes = n, e;
        if (n = a !== null, t = t !== null && t.memoizedState !== null, n) {
          a = e.child, s = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (s = a.alternate.memoizedState.cachePool.pool);
          var r = null;
          a.memoizedState !== null && a.memoizedState.cachePool !== null && (r = a.memoizedState.cachePool.pool), r !== s && (a.flags |= 2048);
        }
        return n !== t && n && (e.child.flags |= 8192), fs(e, e.updateQueue), zt(e), null;
      case 4:
        return dn(), t === null && dr(e.stateNode.containerInfo), zt(e), null;
      case 10:
        return nn(e.type), zt(e), null;
      case 19:
        if (k(Gt), s = e.memoizedState, s === null) return zt(e), null;
        if (a = (e.flags & 128) !== 0, r = s.rendering, r === null)
          if (a) ja(s, !1);
          else {
            if (Bt !== 0 || t !== null && (t.flags & 128) !== 0)
              for (t = e.child; t !== null; ) {
                if (r = ss(t), r !== null) {
                  for (e.flags |= 128, ja(s, !1), t = r.updateQueue, e.updateQueue = t, fs(e, t), e.subtreeFlags = 0, t = n, n = e.child; n !== null; )
                    ih(n, t), n = n.sibling;
                  return Q(
                    Gt,
                    Gt.current & 1 | 2
                  ), e.child;
                }
                t = t.sibling;
              }
            s.tail !== null && qe() > ms && (e.flags |= 128, a = !0, ja(s, !1), e.lanes = 4194304);
          }
        else {
          if (!a)
            if (t = ss(r), t !== null) {
              if (e.flags |= 128, a = !0, t = t.updateQueue, e.updateQueue = t, fs(e, t), ja(s, !0), s.tail === null && s.tailMode === "hidden" && !r.alternate && !St)
                return zt(e), null;
            } else
              2 * qe() - s.renderingStartTime > ms && n !== 536870912 && (e.flags |= 128, a = !0, ja(s, !1), e.lanes = 4194304);
          s.isBackwards ? (r.sibling = e.child, e.child = r) : (t = s.last, t !== null ? t.sibling = r : e.child = r, s.last = r);
        }
        return s.tail !== null ? (e = s.tail, s.rendering = e, s.tail = e.sibling, s.renderingStartTime = qe(), e.sibling = null, t = Gt.current, Q(Gt, a ? t & 1 | 2 : t & 1), e) : (zt(e), null);
      case 22:
      case 23:
        return ln(e), po(), a = e.memoizedState !== null, t !== null ? t.memoizedState !== null !== a && (e.flags |= 8192) : a && (e.flags |= 8192), a ? (n & 536870912) !== 0 && (e.flags & 128) === 0 && (zt(e), e.subtreeFlags & 6 && (e.flags |= 8192)) : zt(e), n = e.updateQueue, n !== null && fs(e, n.retryQueue), n = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (n = t.memoizedState.cachePool.pool), a = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool), a !== n && (e.flags |= 2048), t !== null && k(ti), null;
      case 24:
        return n = null, t !== null && (n = t.memoizedState.cache), e.memoizedState.cache !== n && (e.flags |= 2048), nn(Yt), zt(e), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(o(156, e.tag));
  }
  function Zv(t, e) {
    switch (to(e), e.tag) {
      case 1:
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 3:
        return nn(Yt), dn(), t = e.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (e.flags = t & -65537 | 128, e) : null;
      case 26:
      case 27:
      case 5:
        return Al(e), null;
      case 13:
        if (ln(e), t = e.memoizedState, t !== null && t.dehydrated !== null) {
          if (e.alternate === null)
            throw Error(o(340));
          Ta();
        }
        return t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 19:
        return k(Gt), null;
      case 4:
        return dn(), null;
      case 10:
        return nn(e.type), null;
      case 22:
      case 23:
        return ln(e), po(), t !== null && k(ti), t = e.flags, t & 65536 ? (e.flags = t & -65537 | 128, e) : null;
      case 24:
        return nn(Yt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Vd(t, e) {
    switch (to(e), e.tag) {
      case 3:
        nn(Yt), dn();
        break;
      case 26:
      case 27:
      case 5:
        Al(e);
        break;
      case 4:
        dn();
        break;
      case 13:
        ln(e);
        break;
      case 19:
        k(Gt);
        break;
      case 10:
        nn(e.type);
        break;
      case 22:
      case 23:
        ln(e), po(), t !== null && k(ti);
        break;
      case 24:
        nn(Yt);
    }
  }
  function La(t, e) {
    try {
      var n = e.updateQueue, a = n !== null ? n.lastEffect : null;
      if (a !== null) {
        var s = a.next;
        n = s;
        do {
          if ((n.tag & t) === t) {
            a = void 0;
            var r = n.create, d = n.inst;
            a = r(), d.destroy = a;
          }
          n = n.next;
        } while (n !== s);
      }
    } catch (y) {
      Mt(e, e.return, y);
    }
  }
  function En(t, e, n) {
    try {
      var a = e.updateQueue, s = a !== null ? a.lastEffect : null;
      if (s !== null) {
        var r = s.next;
        a = r;
        do {
          if ((a.tag & t) === t) {
            var d = a.inst, y = d.destroy;
            if (y !== void 0) {
              d.destroy = void 0, s = e;
              var T = n, R = y;
              try {
                R();
              } catch (_) {
                Mt(
                  s,
                  T,
                  _
                );
              }
            }
          }
          a = a.next;
        } while (a !== r);
      }
    } catch (_) {
      Mt(e, e.return, _);
    }
  }
  function wd(t) {
    var e = t.updateQueue;
    if (e !== null) {
      var n = t.stateNode;
      try {
        vh(e, n);
      } catch (a) {
        Mt(t, t.return, a);
      }
    }
  }
  function zd(t, e, n) {
    n.props = ni(
      t.type,
      t.memoizedProps
    ), n.state = t.memoizedState;
    try {
      n.componentWillUnmount();
    } catch (a) {
      Mt(t, e, a);
    }
  }
  function Ha(t, e) {
    try {
      var n = t.ref;
      if (n !== null) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            var a = t.stateNode;
            break;
          case 30:
            a = t.stateNode;
            break;
          default:
            a = t.stateNode;
        }
        typeof n == "function" ? t.refCleanup = n(a) : n.current = a;
      }
    } catch (s) {
      Mt(t, e, s);
    }
  }
  function Xe(t, e) {
    var n = t.ref, a = t.refCleanup;
    if (n !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (s) {
          Mt(t, e, s);
        } finally {
          t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
        }
      else if (typeof n == "function")
        try {
          n(null);
        } catch (s) {
          Mt(t, e, s);
        }
      else n.current = null;
  }
  function _d(t) {
    var e = t.type, n = t.memoizedProps, a = t.stateNode;
    try {
      t: switch (e) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          n.autoFocus && a.focus();
          break t;
        case "img":
          n.src ? a.src = n.src : n.srcSet && (a.srcset = n.srcSet);
      }
    } catch (s) {
      Mt(t, t.return, s);
    }
  }
  function Xo(t, e, n) {
    try {
      var a = t.stateNode;
      f1(a, t.type, n, e), a[ue] = e;
    } catch (s) {
      Mt(t, t.return, s);
    }
  }
  function Bd(t) {
    return t.tag === 5 || t.tag === 3 || t.tag === 26 || t.tag === 27 && zn(t.type) || t.tag === 4;
  }
  function Zo(t) {
    t: for (; ; ) {
      for (; t.sibling === null; ) {
        if (t.return === null || Bd(t.return)) return null;
        t = t.return;
      }
      for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
        if (t.tag === 27 && zn(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
        t.child.return = t, t = t.child;
      }
      if (!(t.flags & 2)) return t.stateNode;
    }
  }
  function Ko(t, e, n) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, e ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(t, e) : (e = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, e.appendChild(t), n = n._reactRootContainer, n != null || e.onclick !== null || (e.onclick = xs));
    else if (a !== 4 && (a === 27 && zn(t.type) && (n = t.stateNode, e = null), t = t.child, t !== null))
      for (Ko(t, e, n), t = t.sibling; t !== null; )
        Ko(t, e, n), t = t.sibling;
  }
  function hs(t, e, n) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, e ? n.insertBefore(t, e) : n.appendChild(t);
    else if (a !== 4 && (a === 27 && zn(t.type) && (n = t.stateNode), t = t.child, t !== null))
      for (hs(t, e, n), t = t.sibling; t !== null; )
        hs(t, e, n), t = t.sibling;
  }
  function Nd(t) {
    var e = t.stateNode, n = t.memoizedProps;
    try {
      for (var a = t.type, s = e.attributes; s.length; )
        e.removeAttributeNode(s[0]);
      $t(e, a, n), e[ee] = t, e[ue] = n;
    } catch (r) {
      Mt(t, t.return, r);
    }
  }
  var on = !1, jt = !1, Qo = !1, Ud = typeof WeakSet == "function" ? WeakSet : Set, kt = null;
  function Kv(t, e) {
    if (t = t.containerInfo, yr = Vs, t = kf(t), Xu(t)) {
      if ("selectionStart" in t)
        var n = {
          start: t.selectionStart,
          end: t.selectionEnd
        };
      else
        t: {
          n = (n = t.ownerDocument) && n.defaultView || window;
          var a = n.getSelection && n.getSelection();
          if (a && a.rangeCount !== 0) {
            n = a.anchorNode;
            var s = a.anchorOffset, r = a.focusNode;
            a = a.focusOffset;
            try {
              n.nodeType, r.nodeType;
            } catch {
              n = null;
              break t;
            }
            var d = 0, y = -1, T = -1, R = 0, _ = 0, U = t, C = null;
            e: for (; ; ) {
              for (var O; U !== n || s !== 0 && U.nodeType !== 3 || (y = d + s), U !== r || a !== 0 && U.nodeType !== 3 || (T = d + a), U.nodeType === 3 && (d += U.nodeValue.length), (O = U.firstChild) !== null; )
                C = U, U = O;
              for (; ; ) {
                if (U === t) break e;
                if (C === n && ++R === s && (y = d), C === r && ++_ === a && (T = d), (O = U.nextSibling) !== null) break;
                U = C, C = U.parentNode;
              }
              U = O;
            }
            n = y === -1 || T === -1 ? null : { start: y, end: T };
          } else n = null;
        }
      n = n || { start: 0, end: 0 };
    } else n = null;
    for (gr = { focusedElem: t, selectionRange: n }, Vs = !1, kt = e; kt !== null; )
      if (e = kt, t = e.child, (e.subtreeFlags & 1024) !== 0 && t !== null)
        t.return = e, kt = t;
      else
        for (; kt !== null; ) {
          switch (e = kt, r = e.alternate, t = e.flags, e.tag) {
            case 0:
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((t & 1024) !== 0 && r !== null) {
                t = void 0, n = e, s = r.memoizedProps, r = r.memoizedState, a = n.stateNode;
                try {
                  var lt = ni(
                    n.type,
                    s,
                    n.elementType === n.type
                  );
                  t = a.getSnapshotBeforeUpdate(
                    lt,
                    r
                  ), a.__reactInternalSnapshotBeforeUpdate = t;
                } catch (et) {
                  Mt(
                    n,
                    n.return,
                    et
                  );
                }
              }
              break;
            case 3:
              if ((t & 1024) !== 0) {
                if (t = e.stateNode.containerInfo, n = t.nodeType, n === 9)
                  br(t);
                else if (n === 1)
                  switch (t.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      br(t);
                      break;
                    default:
                      t.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((t & 1024) !== 0) throw Error(o(163));
          }
          if (t = e.sibling, t !== null) {
            t.return = e.return, kt = t;
            break;
          }
          kt = e.return;
        }
  }
  function jd(t, e, n) {
    var a = n.flags;
    switch (n.tag) {
      case 0:
      case 11:
      case 15:
        Mn(t, n), a & 4 && La(5, n);
        break;
      case 1:
        if (Mn(t, n), a & 4)
          if (t = n.stateNode, e === null)
            try {
              t.componentDidMount();
            } catch (d) {
              Mt(n, n.return, d);
            }
          else {
            var s = ni(
              n.type,
              e.memoizedProps
            );
            e = e.memoizedState;
            try {
              t.componentDidUpdate(
                s,
                e,
                t.__reactInternalSnapshotBeforeUpdate
              );
            } catch (d) {
              Mt(
                n,
                n.return,
                d
              );
            }
          }
        a & 64 && wd(n), a & 512 && Ha(n, n.return);
        break;
      case 3:
        if (Mn(t, n), a & 64 && (t = n.updateQueue, t !== null)) {
          if (e = null, n.child !== null)
            switch (n.child.tag) {
              case 27:
              case 5:
                e = n.child.stateNode;
                break;
              case 1:
                e = n.child.stateNode;
            }
          try {
            vh(t, e);
          } catch (d) {
            Mt(n, n.return, d);
          }
        }
        break;
      case 27:
        e === null && a & 4 && Nd(n);
      case 26:
      case 5:
        Mn(t, n), e === null && a & 4 && _d(n), a & 512 && Ha(n, n.return);
        break;
      case 12:
        Mn(t, n);
        break;
      case 13:
        Mn(t, n), a & 4 && qd(t, n), a & 64 && (t = n.memoizedState, t !== null && (t = t.dehydrated, t !== null && (n = t1.bind(
          null,
          n
        ), v1(t, n))));
        break;
      case 22:
        if (a = n.memoizedState !== null || on, !a) {
          e = e !== null && e.memoizedState !== null || jt, s = on;
          var r = jt;
          on = a, (jt = e) && !r ? Dn(
            t,
            n,
            (n.subtreeFlags & 8772) !== 0
          ) : Mn(t, n), on = s, jt = r;
        }
        break;
      case 30:
        break;
      default:
        Mn(t, n);
    }
  }
  function Ld(t) {
    var e = t.alternate;
    e !== null && (t.alternate = null, Ld(e)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (e = t.stateNode, e !== null && Eu(e)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
  }
  var wt = null, ce = !1;
  function rn(t, e, n) {
    for (n = n.child; n !== null; )
      Hd(t, e, n), n = n.sibling;
  }
  function Hd(t, e, n) {
    if (de && typeof de.onCommitFiberUnmount == "function")
      try {
        de.onCommitFiberUnmount(sa, n);
      } catch {
      }
    switch (n.tag) {
      case 26:
        jt || Xe(n, e), rn(
          t,
          e,
          n
        ), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
        break;
      case 27:
        jt || Xe(n, e);
        var a = wt, s = ce;
        zn(n.type) && (wt = n.stateNode, ce = !1), rn(
          t,
          e,
          n
        ), Pa(n.stateNode), wt = a, ce = s;
        break;
      case 5:
        jt || Xe(n, e);
      case 6:
        if (a = wt, s = ce, wt = null, rn(
          t,
          e,
          n
        ), wt = a, ce = s, wt !== null)
          if (ce)
            try {
              (wt.nodeType === 9 ? wt.body : wt.nodeName === "HTML" ? wt.ownerDocument.body : wt).removeChild(n.stateNode);
            } catch (r) {
              Mt(
                n,
                e,
                r
              );
            }
          else
            try {
              wt.removeChild(n.stateNode);
            } catch (r) {
              Mt(
                n,
                e,
                r
              );
            }
        break;
      case 18:
        wt !== null && (ce ? (t = wt, Rm(
          t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t,
          n.stateNode
        ), nl(t)) : Rm(wt, n.stateNode));
        break;
      case 4:
        a = wt, s = ce, wt = n.stateNode.containerInfo, ce = !0, rn(
          t,
          e,
          n
        ), wt = a, ce = s;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        jt || En(2, n, e), jt || En(4, n, e), rn(
          t,
          e,
          n
        );
        break;
      case 1:
        jt || (Xe(n, e), a = n.stateNode, typeof a.componentWillUnmount == "function" && zd(
          n,
          e,
          a
        )), rn(
          t,
          e,
          n
        );
        break;
      case 21:
        rn(
          t,
          e,
          n
        );
        break;
      case 22:
        jt = (a = jt) || n.memoizedState !== null, rn(
          t,
          e,
          n
        ), jt = a;
        break;
      default:
        rn(
          t,
          e,
          n
        );
    }
  }
  function qd(t, e) {
    if (e.memoizedState === null && (t = e.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null))))
      try {
        nl(t);
      } catch (n) {
        Mt(e, e.return, n);
      }
  }
  function Qv(t) {
    switch (t.tag) {
      case 13:
      case 19:
        var e = t.stateNode;
        return e === null && (e = t.stateNode = new Ud()), e;
      case 22:
        return t = t.stateNode, e = t._retryCache, e === null && (e = t._retryCache = new Ud()), e;
      default:
        throw Error(o(435, t.tag));
    }
  }
  function ko(t, e) {
    var n = Qv(t);
    e.forEach(function(a) {
      var s = e1.bind(null, t, a);
      n.has(a) || (n.add(a), a.then(s, s));
    });
  }
  function ge(t, e) {
    var n = e.deletions;
    if (n !== null)
      for (var a = 0; a < n.length; a++) {
        var s = n[a], r = t, d = e, y = d;
        t: for (; y !== null; ) {
          switch (y.tag) {
            case 27:
              if (zn(y.type)) {
                wt = y.stateNode, ce = !1;
                break t;
              }
              break;
            case 5:
              wt = y.stateNode, ce = !1;
              break t;
            case 3:
            case 4:
              wt = y.stateNode.containerInfo, ce = !0;
              break t;
          }
          y = y.return;
        }
        if (wt === null) throw Error(o(160));
        Hd(r, d, s), wt = null, ce = !1, r = s.alternate, r !== null && (r.return = null), s.return = null;
      }
    if (e.subtreeFlags & 13878)
      for (e = e.child; e !== null; )
        Yd(e, t), e = e.sibling;
  }
  var Ne = null;
  function Yd(t, e) {
    var n = t.alternate, a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ge(e, t), ve(t), a & 4 && (En(3, t, t.return), La(3, t), En(5, t, t.return));
        break;
      case 1:
        ge(e, t), ve(t), a & 512 && (jt || n === null || Xe(n, n.return)), a & 64 && on && (t = t.updateQueue, t !== null && (a = t.callbacks, a !== null && (n = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = n === null ? a : n.concat(a))));
        break;
      case 26:
        var s = Ne;
        if (ge(e, t), ve(t), a & 512 && (jt || n === null || Xe(n, n.return)), a & 4) {
          var r = n !== null ? n.memoizedState : null;
          if (a = t.memoizedState, n === null)
            if (a === null)
              if (t.stateNode === null) {
                t: {
                  a = t.type, n = t.memoizedProps, s = s.ownerDocument || s;
                  e: switch (a) {
                    case "title":
                      r = s.getElementsByTagName("title")[0], (!r || r[ra] || r[ee] || r.namespaceURI === "http://www.w3.org/2000/svg" || r.hasAttribute("itemprop")) && (r = s.createElement(a), s.head.insertBefore(
                        r,
                        s.querySelector("head > title")
                      )), $t(r, a, n), r[ee] = t, Kt(r), a = r;
                      break t;
                    case "link":
                      var d = Nm(
                        "link",
                        "href",
                        s
                      ).get(a + (n.href || ""));
                      if (d) {
                        for (var y = 0; y < d.length; y++)
                          if (r = d[y], r.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && r.getAttribute("rel") === (n.rel == null ? null : n.rel) && r.getAttribute("title") === (n.title == null ? null : n.title) && r.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
                            d.splice(y, 1);
                            break e;
                          }
                      }
                      r = s.createElement(a), $t(r, a, n), s.head.appendChild(r);
                      break;
                    case "meta":
                      if (d = Nm(
                        "meta",
                        "content",
                        s
                      ).get(a + (n.content || ""))) {
                        for (y = 0; y < d.length; y++)
                          if (r = d[y], r.getAttribute("content") === (n.content == null ? null : "" + n.content) && r.getAttribute("name") === (n.name == null ? null : n.name) && r.getAttribute("property") === (n.property == null ? null : n.property) && r.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && r.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
                            d.splice(y, 1);
                            break e;
                          }
                      }
                      r = s.createElement(a), $t(r, a, n), s.head.appendChild(r);
                      break;
                    default:
                      throw Error(o(468, a));
                  }
                  r[ee] = t, Kt(r), a = r;
                }
                t.stateNode = a;
              } else
                Um(
                  s,
                  t.type,
                  t.stateNode
                );
            else
              t.stateNode = Bm(
                s,
                a,
                t.memoizedProps
              );
          else
            r !== a ? (r === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : r.count--, a === null ? Um(
              s,
              t.type,
              t.stateNode
            ) : Bm(
              s,
              a,
              t.memoizedProps
            )) : a === null && t.stateNode !== null && Xo(
              t,
              t.memoizedProps,
              n.memoizedProps
            );
        }
        break;
      case 27:
        ge(e, t), ve(t), a & 512 && (jt || n === null || Xe(n, n.return)), n !== null && a & 4 && Xo(
          t,
          t.memoizedProps,
          n.memoizedProps
        );
        break;
      case 5:
        if (ge(e, t), ve(t), a & 512 && (jt || n === null || Xe(n, n.return)), t.flags & 32) {
          s = t.stateNode;
          try {
            Si(s, "");
          } catch (O) {
            Mt(t, t.return, O);
          }
        }
        a & 4 && t.stateNode != null && (s = t.memoizedProps, Xo(
          t,
          s,
          n !== null ? n.memoizedProps : s
        )), a & 1024 && (Qo = !0);
        break;
      case 6:
        if (ge(e, t), ve(t), a & 4) {
          if (t.stateNode === null)
            throw Error(o(162));
          a = t.memoizedProps, n = t.stateNode;
          try {
            n.nodeValue = a;
          } catch (O) {
            Mt(t, t.return, O);
          }
        }
        break;
      case 3:
        if (Rs = null, s = Ne, Ne = Ms(e.containerInfo), ge(e, t), Ne = s, ve(t), a & 4 && n !== null && n.memoizedState.isDehydrated)
          try {
            nl(e.containerInfo);
          } catch (O) {
            Mt(t, t.return, O);
          }
        Qo && (Qo = !1, Gd(t));
        break;
      case 4:
        a = Ne, Ne = Ms(
          t.stateNode.containerInfo
        ), ge(e, t), ve(t), Ne = a;
        break;
      case 12:
        ge(e, t), ve(t);
        break;
      case 13:
        ge(e, t), ve(t), t.child.flags & 8192 && t.memoizedState !== null != (n !== null && n.memoizedState !== null) && (Io = qe()), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, ko(t, a)));
        break;
      case 22:
        s = t.memoizedState !== null;
        var T = n !== null && n.memoizedState !== null, R = on, _ = jt;
        if (on = R || s, jt = _ || T, ge(e, t), jt = _, on = R, ve(t), a & 8192)
          t: for (e = t.stateNode, e._visibility = s ? e._visibility & -2 : e._visibility | 1, s && (n === null || T || on || jt || ii(t)), n = null, e = t; ; ) {
            if (e.tag === 5 || e.tag === 26) {
              if (n === null) {
                T = n = e;
                try {
                  if (r = T.stateNode, s)
                    d = r.style, typeof d.setProperty == "function" ? d.setProperty("display", "none", "important") : d.display = "none";
                  else {
                    y = T.stateNode;
                    var U = T.memoizedProps.style, C = U != null && U.hasOwnProperty("display") ? U.display : null;
                    y.style.display = C == null || typeof C == "boolean" ? "" : ("" + C).trim();
                  }
                } catch (O) {
                  Mt(T, T.return, O);
                }
              }
            } else if (e.tag === 6) {
              if (n === null) {
                T = e;
                try {
                  T.stateNode.nodeValue = s ? "" : T.memoizedProps;
                } catch (O) {
                  Mt(T, T.return, O);
                }
              }
            } else if ((e.tag !== 22 && e.tag !== 23 || e.memoizedState === null || e === t) && e.child !== null) {
              e.child.return = e, e = e.child;
              continue;
            }
            if (e === t) break t;
            for (; e.sibling === null; ) {
              if (e.return === null || e.return === t) break t;
              n === e && (n = null), e = e.return;
            }
            n === e && (n = null), e.sibling.return = e.return, e = e.sibling;
          }
        a & 4 && (a = t.updateQueue, a !== null && (n = a.retryQueue, n !== null && (a.retryQueue = null, ko(t, n))));
        break;
      case 19:
        ge(e, t), ve(t), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, ko(t, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        ge(e, t), ve(t);
    }
  }
  function ve(t) {
    var e = t.flags;
    if (e & 2) {
      try {
        for (var n, a = t.return; a !== null; ) {
          if (Bd(a)) {
            n = a;
            break;
          }
          a = a.return;
        }
        if (n == null) throw Error(o(160));
        switch (n.tag) {
          case 27:
            var s = n.stateNode, r = Zo(t);
            hs(t, r, s);
            break;
          case 5:
            var d = n.stateNode;
            n.flags & 32 && (Si(d, ""), n.flags &= -33);
            var y = Zo(t);
            hs(t, y, d);
            break;
          case 3:
          case 4:
            var T = n.stateNode.containerInfo, R = Zo(t);
            Ko(
              t,
              R,
              T
            );
            break;
          default:
            throw Error(o(161));
        }
      } catch (_) {
        Mt(t, t.return, _);
      }
      t.flags &= -3;
    }
    e & 4096 && (t.flags &= -4097);
  }
  function Gd(t) {
    if (t.subtreeFlags & 1024)
      for (t = t.child; t !== null; ) {
        var e = t;
        Gd(e), e.tag === 5 && e.flags & 1024 && e.stateNode.reset(), t = t.sibling;
      }
  }
  function Mn(t, e) {
    if (e.subtreeFlags & 8772)
      for (e = e.child; e !== null; )
        jd(t, e.alternate, e), e = e.sibling;
  }
  function ii(t) {
    for (t = t.child; t !== null; ) {
      var e = t;
      switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          En(4, e, e.return), ii(e);
          break;
        case 1:
          Xe(e, e.return);
          var n = e.stateNode;
          typeof n.componentWillUnmount == "function" && zd(
            e,
            e.return,
            n
          ), ii(e);
          break;
        case 27:
          Pa(e.stateNode);
        case 26:
        case 5:
          Xe(e, e.return), ii(e);
          break;
        case 22:
          e.memoizedState === null && ii(e);
          break;
        case 30:
          ii(e);
          break;
        default:
          ii(e);
      }
      t = t.sibling;
    }
  }
  function Dn(t, e, n) {
    for (n = n && (e.subtreeFlags & 8772) !== 0, e = e.child; e !== null; ) {
      var a = e.alternate, s = t, r = e, d = r.flags;
      switch (r.tag) {
        case 0:
        case 11:
        case 15:
          Dn(
            s,
            r,
            n
          ), La(4, r);
          break;
        case 1:
          if (Dn(
            s,
            r,
            n
          ), a = r, s = a.stateNode, typeof s.componentDidMount == "function")
            try {
              s.componentDidMount();
            } catch (R) {
              Mt(a, a.return, R);
            }
          if (a = r, s = a.updateQueue, s !== null) {
            var y = a.stateNode;
            try {
              var T = s.shared.hiddenCallbacks;
              if (T !== null)
                for (s.shared.hiddenCallbacks = null, s = 0; s < T.length; s++)
                  gh(T[s], y);
            } catch (R) {
              Mt(a, a.return, R);
            }
          }
          n && d & 64 && wd(r), Ha(r, r.return);
          break;
        case 27:
          Nd(r);
        case 26:
        case 5:
          Dn(
            s,
            r,
            n
          ), n && a === null && d & 4 && _d(r), Ha(r, r.return);
          break;
        case 12:
          Dn(
            s,
            r,
            n
          );
          break;
        case 13:
          Dn(
            s,
            r,
            n
          ), n && d & 4 && qd(s, r);
          break;
        case 22:
          r.memoizedState === null && Dn(
            s,
            r,
            n
          ), Ha(r, r.return);
          break;
        case 30:
          break;
        default:
          Dn(
            s,
            r,
            n
          );
      }
      e = e.sibling;
    }
  }
  function Po(t, e) {
    var n = null;
    t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (n = t.memoizedState.cachePool.pool), t = null, e.memoizedState !== null && e.memoizedState.cachePool !== null && (t = e.memoizedState.cachePool.pool), t !== n && (t != null && t.refCount++, n != null && Ea(n));
  }
  function Jo(t, e) {
    t = null, e.alternate !== null && (t = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== t && (e.refCount++, t != null && Ea(t));
  }
  function Ze(t, e, n, a) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; )
        Xd(
          t,
          e,
          n,
          a
        ), e = e.sibling;
  }
  function Xd(t, e, n, a) {
    var s = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        Ze(
          t,
          e,
          n,
          a
        ), s & 2048 && La(9, e);
        break;
      case 1:
        Ze(
          t,
          e,
          n,
          a
        );
        break;
      case 3:
        Ze(
          t,
          e,
          n,
          a
        ), s & 2048 && (t = null, e.alternate !== null && (t = e.alternate.memoizedState.cache), e = e.memoizedState.cache, e !== t && (e.refCount++, t != null && Ea(t)));
        break;
      case 12:
        if (s & 2048) {
          Ze(
            t,
            e,
            n,
            a
          ), t = e.stateNode;
          try {
            var r = e.memoizedProps, d = r.id, y = r.onPostCommit;
            typeof y == "function" && y(
              d,
              e.alternate === null ? "mount" : "update",
              t.passiveEffectDuration,
              -0
            );
          } catch (T) {
            Mt(e, e.return, T);
          }
        } else
          Ze(
            t,
            e,
            n,
            a
          );
        break;
      case 13:
        Ze(
          t,
          e,
          n,
          a
        );
        break;
      case 23:
        break;
      case 22:
        r = e.stateNode, d = e.alternate, e.memoizedState !== null ? r._visibility & 2 ? Ze(
          t,
          e,
          n,
          a
        ) : qa(t, e) : r._visibility & 2 ? Ze(
          t,
          e,
          n,
          a
        ) : (r._visibility |= 2, Li(
          t,
          e,
          n,
          a,
          (e.subtreeFlags & 10256) !== 0
        )), s & 2048 && Po(d, e);
        break;
      case 24:
        Ze(
          t,
          e,
          n,
          a
        ), s & 2048 && Jo(e.alternate, e);
        break;
      default:
        Ze(
          t,
          e,
          n,
          a
        );
    }
  }
  function Li(t, e, n, a, s) {
    for (s = s && (e.subtreeFlags & 10256) !== 0, e = e.child; e !== null; ) {
      var r = t, d = e, y = n, T = a, R = d.flags;
      switch (d.tag) {
        case 0:
        case 11:
        case 15:
          Li(
            r,
            d,
            y,
            T,
            s
          ), La(8, d);
          break;
        case 23:
          break;
        case 22:
          var _ = d.stateNode;
          d.memoizedState !== null ? _._visibility & 2 ? Li(
            r,
            d,
            y,
            T,
            s
          ) : qa(
            r,
            d
          ) : (_._visibility |= 2, Li(
            r,
            d,
            y,
            T,
            s
          )), s && R & 2048 && Po(
            d.alternate,
            d
          );
          break;
        case 24:
          Li(
            r,
            d,
            y,
            T,
            s
          ), s && R & 2048 && Jo(d.alternate, d);
          break;
        default:
          Li(
            r,
            d,
            y,
            T,
            s
          );
      }
      e = e.sibling;
    }
  }
  function qa(t, e) {
    if (e.subtreeFlags & 10256)
      for (e = e.child; e !== null; ) {
        var n = t, a = e, s = a.flags;
        switch (a.tag) {
          case 22:
            qa(n, a), s & 2048 && Po(
              a.alternate,
              a
            );
            break;
          case 24:
            qa(n, a), s & 2048 && Jo(a.alternate, a);
            break;
          default:
            qa(n, a);
        }
        e = e.sibling;
      }
  }
  var Ya = 8192;
  function Hi(t) {
    if (t.subtreeFlags & Ya)
      for (t = t.child; t !== null; )
        Zd(t), t = t.sibling;
  }
  function Zd(t) {
    switch (t.tag) {
      case 26:
        Hi(t), t.flags & Ya && t.memoizedState !== null && w1(
          Ne,
          t.memoizedState,
          t.memoizedProps
        );
        break;
      case 5:
        Hi(t);
        break;
      case 3:
      case 4:
        var e = Ne;
        Ne = Ms(t.stateNode.containerInfo), Hi(t), Ne = e;
        break;
      case 22:
        t.memoizedState === null && (e = t.alternate, e !== null && e.memoizedState !== null ? (e = Ya, Ya = 16777216, Hi(t), Ya = e) : Hi(t));
        break;
      default:
        Hi(t);
    }
  }
  function Kd(t) {
    var e = t.alternate;
    if (e !== null && (t = e.child, t !== null)) {
      e.child = null;
      do
        e = t.sibling, t.sibling = null, t = e;
      while (t !== null);
    }
  }
  function Ga(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var n = 0; n < e.length; n++) {
          var a = e[n];
          kt = a, kd(
            a,
            t
          );
        }
      Kd(t);
    }
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        Qd(t), t = t.sibling;
  }
  function Qd(t) {
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        Ga(t), t.flags & 2048 && En(9, t, t.return);
        break;
      case 3:
        Ga(t);
        break;
      case 12:
        Ga(t);
        break;
      case 22:
        var e = t.stateNode;
        t.memoizedState !== null && e._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (e._visibility &= -3, ds(t)) : Ga(t);
        break;
      default:
        Ga(t);
    }
  }
  function ds(t) {
    var e = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (e !== null)
        for (var n = 0; n < e.length; n++) {
          var a = e[n];
          kt = a, kd(
            a,
            t
          );
        }
      Kd(t);
    }
    for (t = t.child; t !== null; ) {
      switch (e = t, e.tag) {
        case 0:
        case 11:
        case 15:
          En(8, e, e.return), ds(e);
          break;
        case 22:
          n = e.stateNode, n._visibility & 2 && (n._visibility &= -3, ds(e));
          break;
        default:
          ds(e);
      }
      t = t.sibling;
    }
  }
  function kd(t, e) {
    for (; kt !== null; ) {
      var n = kt;
      switch (n.tag) {
        case 0:
        case 11:
        case 15:
          En(8, n, e);
          break;
        case 23:
        case 22:
          if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
            var a = n.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          Ea(n.memoizedState.cache);
      }
      if (a = n.child, a !== null) a.return = n, kt = a;
      else
        t: for (n = t; kt !== null; ) {
          a = kt;
          var s = a.sibling, r = a.return;
          if (Ld(a), a === n) {
            kt = null;
            break t;
          }
          if (s !== null) {
            s.return = r, kt = s;
            break t;
          }
          kt = r;
        }
    }
  }
  var kv = {
    getCacheForType: function(t) {
      var e = ne(Yt), n = e.data.get(t);
      return n === void 0 && (n = t(), e.data.set(t, n)), n;
    }
  }, Pv = typeof WeakMap == "function" ? WeakMap : Map, bt = 0, Ot = null, ht = null, yt = 0, Tt = 0, Se = null, Rn = !1, qi = !1, Fo = !1, cn = 0, Bt = 0, Cn = 0, ai = 0, Wo = 0, Ve = 0, Yi = 0, Xa = null, fe = null, $o = !1, Io = 0, ms = 1 / 0, ps = null, On = null, Wt = 0, Vn = null, Gi = null, Xi = 0, tr = 0, er = null, Pd = null, Za = 0, nr = null;
  function be() {
    if ((bt & 2) !== 0 && yt !== 0)
      return yt & -yt;
    if (w.T !== null) {
      var t = Vi;
      return t !== 0 ? t : rr();
    }
    return cf();
  }
  function Jd() {
    Ve === 0 && (Ve = (yt & 536870912) === 0 || St ? sf() : 536870912);
    var t = Oe.current;
    return t !== null && (t.flags |= 32), Ve;
  }
  function Te(t, e, n) {
    (t === Ot && (Tt === 2 || Tt === 9) || t.cancelPendingCommit !== null) && (Zi(t, 0), wn(
      t,
      yt,
      Ve,
      !1
    )), oa(t, n), ((bt & 2) === 0 || t !== Ot) && (t === Ot && ((bt & 2) === 0 && (ai |= n), Bt === 4 && wn(
      t,
      yt,
      Ve,
      !1
    )), Ke(t));
  }
  function Fd(t, e, n) {
    if ((bt & 6) !== 0) throw Error(o(327));
    var a = !n && (e & 124) === 0 && (e & t.expiredLanes) === 0 || ua(t, e), s = a ? Wv(t, e) : lr(t, e, !0), r = a;
    do {
      if (s === 0) {
        qi && !a && wn(t, e, 0, !1);
        break;
      } else {
        if (n = t.current.alternate, r && !Jv(n)) {
          s = lr(t, e, !1), r = !1;
          continue;
        }
        if (s === 2) {
          if (r = e, t.errorRecoveryDisabledLanes & r)
            var d = 0;
          else
            d = t.pendingLanes & -536870913, d = d !== 0 ? d : d & 536870912 ? 536870912 : 0;
          if (d !== 0) {
            e = d;
            t: {
              var y = t;
              s = Xa;
              var T = y.current.memoizedState.isDehydrated;
              if (T && (Zi(y, d).flags |= 256), d = lr(
                y,
                d,
                !1
              ), d !== 2) {
                if (Fo && !T) {
                  y.errorRecoveryDisabledLanes |= r, ai |= r, s = 4;
                  break t;
                }
                r = fe, fe = s, r !== null && (fe === null ? fe = r : fe.push.apply(
                  fe,
                  r
                ));
              }
              s = d;
            }
            if (r = !1, s !== 2) continue;
          }
        }
        if (s === 1) {
          Zi(t, 0), wn(t, e, 0, !0);
          break;
        }
        t: {
          switch (a = t, r = s, r) {
            case 0:
            case 1:
              throw Error(o(345));
            case 4:
              if ((e & 4194048) !== e) break;
            case 6:
              wn(
                a,
                e,
                Ve,
                !Rn
              );
              break t;
            case 2:
              fe = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(o(329));
          }
          if ((e & 62914560) === e && (s = Io + 300 - qe(), 10 < s)) {
            if (wn(
              a,
              e,
              Ve,
              !Rn
            ), Dl(a, 0, !0) !== 0) break t;
            a.timeoutHandle = Mm(
              Wd.bind(
                null,
                a,
                n,
                fe,
                ps,
                $o,
                e,
                Ve,
                ai,
                Yi,
                Rn,
                r,
                2,
                -0,
                0
              ),
              s
            );
            break t;
          }
          Wd(
            a,
            n,
            fe,
            ps,
            $o,
            e,
            Ve,
            ai,
            Yi,
            Rn,
            r,
            0,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    Ke(t);
  }
  function Wd(t, e, n, a, s, r, d, y, T, R, _, U, C, O) {
    if (t.timeoutHandle = -1, U = e.subtreeFlags, (U & 8192 || (U & 16785408) === 16785408) && (Wa = { stylesheets: null, count: 0, unsuspend: V1 }, Zd(e), U = z1(), U !== null)) {
      t.cancelPendingCommit = U(
        am.bind(
          null,
          t,
          e,
          r,
          n,
          a,
          s,
          d,
          y,
          T,
          _,
          1,
          C,
          O
        )
      ), wn(t, r, d, !R);
      return;
    }
    am(
      t,
      e,
      r,
      n,
      a,
      s,
      d,
      y,
      T
    );
  }
  function Jv(t) {
    for (var e = t; ; ) {
      var n = e.tag;
      if ((n === 0 || n === 11 || n === 15) && e.flags & 16384 && (n = e.updateQueue, n !== null && (n = n.stores, n !== null)))
        for (var a = 0; a < n.length; a++) {
          var s = n[a], r = s.getSnapshot;
          s = s.value;
          try {
            if (!pe(r(), s)) return !1;
          } catch {
            return !1;
          }
        }
      if (n = e.child, e.subtreeFlags & 16384 && n !== null)
        n.return = e, e = n;
      else {
        if (e === t) break;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) return !0;
          e = e.return;
        }
        e.sibling.return = e.return, e = e.sibling;
      }
    }
    return !0;
  }
  function wn(t, e, n, a) {
    e &= ~Wo, e &= ~ai, t.suspendedLanes |= e, t.pingedLanes &= ~e, a && (t.warmLanes |= e), a = t.expirationTimes;
    for (var s = e; 0 < s; ) {
      var r = 31 - me(s), d = 1 << r;
      a[r] = -1, s &= ~d;
    }
    n !== 0 && of(t, n, e);
  }
  function ys() {
    return (bt & 6) === 0 ? (Ka(0), !1) : !0;
  }
  function ir() {
    if (ht !== null) {
      if (Tt === 0)
        var t = ht.return;
      else
        t = ht, en = $n = null, bo(t), Ui = null, Na = 0, t = ht;
      for (; t !== null; )
        Vd(t.alternate, t), t = t.return;
      ht = null;
    }
  }
  function Zi(t, e) {
    var n = t.timeoutHandle;
    n !== -1 && (t.timeoutHandle = -1, d1(n)), n = t.cancelPendingCommit, n !== null && (t.cancelPendingCommit = null, n()), ir(), Ot = t, ht = n = $e(t.current, null), yt = e, Tt = 0, Se = null, Rn = !1, qi = ua(t, e), Fo = !1, Yi = Ve = Wo = ai = Cn = Bt = 0, fe = Xa = null, $o = !1, (e & 8) !== 0 && (e |= e & 32);
    var a = t.entangledLanes;
    if (a !== 0)
      for (t = t.entanglements, a &= e; 0 < a; ) {
        var s = 31 - me(a), r = 1 << s;
        e |= t[s], a &= ~r;
      }
    return cn = e, Ll(), n;
  }
  function $d(t, e) {
    ct = null, w.H = is, e === Da || e === kl ? (e = ph(), Tt = 3) : e === hh ? (e = ph(), Tt = 4) : Tt = e === yd ? 8 : e !== null && typeof e == "object" && typeof e.then == "function" ? 6 : 1, Se = e, ht === null && (Bt = 1, os(
      t,
      Me(e, t.current)
    ));
  }
  function Id() {
    var t = w.H;
    return w.H = is, t === null ? is : t;
  }
  function tm() {
    var t = w.A;
    return w.A = kv, t;
  }
  function ar() {
    Bt = 4, Rn || (yt & 4194048) !== yt && Oe.current !== null || (qi = !0), (Cn & 134217727) === 0 && (ai & 134217727) === 0 || Ot === null || wn(
      Ot,
      yt,
      Ve,
      !1
    );
  }
  function lr(t, e, n) {
    var a = bt;
    bt |= 2;
    var s = Id(), r = tm();
    (Ot !== t || yt !== e) && (ps = null, Zi(t, e)), e = !1;
    var d = Bt;
    t: do
      try {
        if (Tt !== 0 && ht !== null) {
          var y = ht, T = Se;
          switch (Tt) {
            case 8:
              ir(), d = 6;
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              Oe.current === null && (e = !0);
              var R = Tt;
              if (Tt = 0, Se = null, Ki(t, y, T, R), n && qi) {
                d = 0;
                break t;
              }
              break;
            default:
              R = Tt, Tt = 0, Se = null, Ki(t, y, T, R);
          }
        }
        Fv(), d = Bt;
        break;
      } catch (_) {
        $d(t, _);
      }
    while (!0);
    return e && t.shellSuspendCounter++, en = $n = null, bt = a, w.H = s, w.A = r, ht === null && (Ot = null, yt = 0, Ll()), d;
  }
  function Fv() {
    for (; ht !== null; ) em(ht);
  }
  function Wv(t, e) {
    var n = bt;
    bt |= 2;
    var a = Id(), s = tm();
    Ot !== t || yt !== e ? (ps = null, ms = qe() + 500, Zi(t, e)) : qi = ua(
      t,
      e
    );
    t: do
      try {
        if (Tt !== 0 && ht !== null) {
          e = ht;
          var r = Se;
          e: switch (Tt) {
            case 1:
              Tt = 0, Se = null, Ki(t, e, r, 1);
              break;
            case 2:
            case 9:
              if (dh(r)) {
                Tt = 0, Se = null, nm(e);
                break;
              }
              e = function() {
                Tt !== 2 && Tt !== 9 || Ot !== t || (Tt = 7), Ke(t);
              }, r.then(e, e);
              break t;
            case 3:
              Tt = 7;
              break t;
            case 4:
              Tt = 5;
              break t;
            case 7:
              dh(r) ? (Tt = 0, Se = null, nm(e)) : (Tt = 0, Se = null, Ki(t, e, r, 7));
              break;
            case 5:
              var d = null;
              switch (ht.tag) {
                case 26:
                  d = ht.memoizedState;
                case 5:
                case 27:
                  var y = ht;
                  if (!d || jm(d)) {
                    Tt = 0, Se = null;
                    var T = y.sibling;
                    if (T !== null) ht = T;
                    else {
                      var R = y.return;
                      R !== null ? (ht = R, gs(R)) : ht = null;
                    }
                    break e;
                  }
              }
              Tt = 0, Se = null, Ki(t, e, r, 5);
              break;
            case 6:
              Tt = 0, Se = null, Ki(t, e, r, 6);
              break;
            case 8:
              ir(), Bt = 6;
              break t;
            default:
              throw Error(o(462));
          }
        }
        $v();
        break;
      } catch (_) {
        $d(t, _);
      }
    while (!0);
    return en = $n = null, w.H = a, w.A = s, bt = n, ht !== null ? 0 : (Ot = null, yt = 0, Ll(), Bt);
  }
  function $v() {
    for (; ht !== null && !b0(); )
      em(ht);
  }
  function em(t) {
    var e = Cd(t.alternate, t, cn);
    t.memoizedProps = t.pendingProps, e === null ? gs(t) : ht = e;
  }
  function nm(t) {
    var e = t, n = e.alternate;
    switch (e.tag) {
      case 15:
      case 0:
        e = Ad(
          n,
          e,
          e.pendingProps,
          e.type,
          void 0,
          yt
        );
        break;
      case 11:
        e = Ad(
          n,
          e,
          e.pendingProps,
          e.type.render,
          e.ref,
          yt
        );
        break;
      case 5:
        bo(e);
      default:
        Vd(n, e), e = ht = ih(e, cn), e = Cd(n, e, cn);
    }
    t.memoizedProps = t.pendingProps, e === null ? gs(t) : ht = e;
  }
  function Ki(t, e, n, a) {
    en = $n = null, bo(e), Ui = null, Na = 0;
    var s = e.return;
    try {
      if (Yv(
        t,
        s,
        e,
        n,
        yt
      )) {
        Bt = 1, os(
          t,
          Me(n, t.current)
        ), ht = null;
        return;
      }
    } catch (r) {
      if (s !== null) throw ht = s, r;
      Bt = 1, os(
        t,
        Me(n, t.current)
      ), ht = null;
      return;
    }
    e.flags & 32768 ? (St || a === 1 ? t = !0 : qi || (yt & 536870912) !== 0 ? t = !1 : (Rn = t = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = Oe.current, a !== null && a.tag === 13 && (a.flags |= 16384))), im(e, t)) : gs(e);
  }
  function gs(t) {
    var e = t;
    do {
      if ((e.flags & 32768) !== 0) {
        im(
          e,
          Rn
        );
        return;
      }
      t = e.return;
      var n = Xv(
        e.alternate,
        e,
        cn
      );
      if (n !== null) {
        ht = n;
        return;
      }
      if (e = e.sibling, e !== null) {
        ht = e;
        return;
      }
      ht = e = t;
    } while (e !== null);
    Bt === 0 && (Bt = 5);
  }
  function im(t, e) {
    do {
      var n = Zv(t.alternate, t);
      if (n !== null) {
        n.flags &= 32767, ht = n;
        return;
      }
      if (n = t.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !e && (t = t.sibling, t !== null)) {
        ht = t;
        return;
      }
      ht = t = n;
    } while (t !== null);
    Bt = 6, ht = null;
  }
  function am(t, e, n, a, s, r, d, y, T) {
    t.cancelPendingCommit = null;
    do
      vs();
    while (Wt !== 0);
    if ((bt & 6) !== 0) throw Error(o(327));
    if (e !== null) {
      if (e === t.current) throw Error(o(177));
      if (r = e.lanes | e.childLanes, r |= Pu, V0(
        t,
        n,
        r,
        d,
        y,
        T
      ), t === Ot && (ht = Ot = null, yt = 0), Gi = e, Vn = t, Xi = n, tr = r, er = s, Pd = a, (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, n1(xl, function() {
        return rm(), null;
      })) : (t.callbackNode = null, t.callbackPriority = 0), a = (e.flags & 13878) !== 0, (e.subtreeFlags & 13878) !== 0 || a) {
        a = w.T, w.T = null, s = K.p, K.p = 2, d = bt, bt |= 4;
        try {
          Kv(t, e, n);
        } finally {
          bt = d, K.p = s, w.T = a;
        }
      }
      Wt = 1, lm(), sm(), um();
    }
  }
  function lm() {
    if (Wt === 1) {
      Wt = 0;
      var t = Vn, e = Gi, n = (e.flags & 13878) !== 0;
      if ((e.subtreeFlags & 13878) !== 0 || n) {
        n = w.T, w.T = null;
        var a = K.p;
        K.p = 2;
        var s = bt;
        bt |= 4;
        try {
          Yd(e, t);
          var r = gr, d = kf(t.containerInfo), y = r.focusedElem, T = r.selectionRange;
          if (d !== y && y && y.ownerDocument && Qf(
            y.ownerDocument.documentElement,
            y
          )) {
            if (T !== null && Xu(y)) {
              var R = T.start, _ = T.end;
              if (_ === void 0 && (_ = R), "selectionStart" in y)
                y.selectionStart = R, y.selectionEnd = Math.min(
                  _,
                  y.value.length
                );
              else {
                var U = y.ownerDocument || document, C = U && U.defaultView || window;
                if (C.getSelection) {
                  var O = C.getSelection(), lt = y.textContent.length, et = Math.min(T.start, lt), Et = T.end === void 0 ? et : Math.min(T.end, lt);
                  !O.extend && et > Et && (d = Et, Et = et, et = d);
                  var E = Kf(
                    y,
                    et
                  ), x = Kf(
                    y,
                    Et
                  );
                  if (E && x && (O.rangeCount !== 1 || O.anchorNode !== E.node || O.anchorOffset !== E.offset || O.focusNode !== x.node || O.focusOffset !== x.offset)) {
                    var M = U.createRange();
                    M.setStart(E.node, E.offset), O.removeAllRanges(), et > Et ? (O.addRange(M), O.extend(x.node, x.offset)) : (M.setEnd(x.node, x.offset), O.addRange(M));
                  }
                }
              }
            }
            for (U = [], O = y; O = O.parentNode; )
              O.nodeType === 1 && U.push({
                element: O,
                left: O.scrollLeft,
                top: O.scrollTop
              });
            for (typeof y.focus == "function" && y.focus(), y = 0; y < U.length; y++) {
              var N = U[y];
              N.element.scrollLeft = N.left, N.element.scrollTop = N.top;
            }
          }
          Vs = !!yr, gr = yr = null;
        } finally {
          bt = s, K.p = a, w.T = n;
        }
      }
      t.current = e, Wt = 2;
    }
  }
  function sm() {
    if (Wt === 2) {
      Wt = 0;
      var t = Vn, e = Gi, n = (e.flags & 8772) !== 0;
      if ((e.subtreeFlags & 8772) !== 0 || n) {
        n = w.T, w.T = null;
        var a = K.p;
        K.p = 2;
        var s = bt;
        bt |= 4;
        try {
          jd(t, e.alternate, e);
        } finally {
          bt = s, K.p = a, w.T = n;
        }
      }
      Wt = 3;
    }
  }
  function um() {
    if (Wt === 4 || Wt === 3) {
      Wt = 0, T0();
      var t = Vn, e = Gi, n = Xi, a = Pd;
      (e.subtreeFlags & 10256) !== 0 || (e.flags & 10256) !== 0 ? Wt = 5 : (Wt = 0, Gi = Vn = null, om(t, t.pendingLanes));
      var s = t.pendingLanes;
      if (s === 0 && (On = null), Au(n), e = e.stateNode, de && typeof de.onCommitFiberRoot == "function")
        try {
          de.onCommitFiberRoot(
            sa,
            e,
            void 0,
            (e.current.flags & 128) === 128
          );
        } catch {
        }
      if (a !== null) {
        e = w.T, s = K.p, K.p = 2, w.T = null;
        try {
          for (var r = t.onRecoverableError, d = 0; d < a.length; d++) {
            var y = a[d];
            r(y.value, {
              componentStack: y.stack
            });
          }
        } finally {
          w.T = e, K.p = s;
        }
      }
      (Xi & 3) !== 0 && vs(), Ke(t), s = t.pendingLanes, (n & 4194090) !== 0 && (s & 42) !== 0 ? t === nr ? Za++ : (Za = 0, nr = t) : Za = 0, Ka(0);
    }
  }
  function om(t, e) {
    (t.pooledCacheLanes &= e) === 0 && (e = t.pooledCache, e != null && (t.pooledCache = null, Ea(e)));
  }
  function vs(t) {
    return lm(), sm(), um(), rm();
  }
  function rm() {
    if (Wt !== 5) return !1;
    var t = Vn, e = tr;
    tr = 0;
    var n = Au(Xi), a = w.T, s = K.p;
    try {
      K.p = 32 > n ? 32 : n, w.T = null, n = er, er = null;
      var r = Vn, d = Xi;
      if (Wt = 0, Gi = Vn = null, Xi = 0, (bt & 6) !== 0) throw Error(o(331));
      var y = bt;
      if (bt |= 4, Qd(r.current), Xd(
        r,
        r.current,
        d,
        n
      ), bt = y, Ka(0, !1), de && typeof de.onPostCommitFiberRoot == "function")
        try {
          de.onPostCommitFiberRoot(sa, r);
        } catch {
        }
      return !0;
    } finally {
      K.p = s, w.T = a, om(t, e);
    }
  }
  function cm(t, e, n) {
    e = Me(n, e), e = Bo(t.stateNode, e, 2), t = bn(t, e, 2), t !== null && (oa(t, 2), Ke(t));
  }
  function Mt(t, e, n) {
    if (t.tag === 3)
      cm(t, t, n);
    else
      for (; e !== null; ) {
        if (e.tag === 3) {
          cm(
            e,
            t,
            n
          );
          break;
        } else if (e.tag === 1) {
          var a = e.stateNode;
          if (typeof e.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (On === null || !On.has(a))) {
            t = Me(n, t), n = md(2), a = bn(e, n, 2), a !== null && (pd(
              n,
              a,
              e,
              t
            ), oa(a, 2), Ke(a));
            break;
          }
        }
        e = e.return;
      }
  }
  function sr(t, e, n) {
    var a = t.pingCache;
    if (a === null) {
      a = t.pingCache = new Pv();
      var s = /* @__PURE__ */ new Set();
      a.set(e, s);
    } else
      s = a.get(e), s === void 0 && (s = /* @__PURE__ */ new Set(), a.set(e, s));
    s.has(n) || (Fo = !0, s.add(n), t = Iv.bind(null, t, e, n), e.then(t, t));
  }
  function Iv(t, e, n) {
    var a = t.pingCache;
    a !== null && a.delete(e), t.pingedLanes |= t.suspendedLanes & n, t.warmLanes &= ~n, Ot === t && (yt & n) === n && (Bt === 4 || Bt === 3 && (yt & 62914560) === yt && 300 > qe() - Io ? (bt & 2) === 0 && Zi(t, 0) : Wo |= n, Yi === yt && (Yi = 0)), Ke(t);
  }
  function fm(t, e) {
    e === 0 && (e = uf()), t = Di(t, e), t !== null && (oa(t, e), Ke(t));
  }
  function t1(t) {
    var e = t.memoizedState, n = 0;
    e !== null && (n = e.retryLane), fm(t, n);
  }
  function e1(t, e) {
    var n = 0;
    switch (t.tag) {
      case 13:
        var a = t.stateNode, s = t.memoizedState;
        s !== null && (n = s.retryLane);
        break;
      case 19:
        a = t.stateNode;
        break;
      case 22:
        a = t.stateNode._retryCache;
        break;
      default:
        throw Error(o(314));
    }
    a !== null && a.delete(e), fm(t, n);
  }
  function n1(t, e) {
    return vu(t, e);
  }
  var Ss = null, Qi = null, ur = !1, bs = !1, or = !1, li = 0;
  function Ke(t) {
    t !== Qi && t.next === null && (Qi === null ? Ss = Qi = t : Qi = Qi.next = t), bs = !0, ur || (ur = !0, a1());
  }
  function Ka(t, e) {
    if (!or && bs) {
      or = !0;
      do
        for (var n = !1, a = Ss; a !== null; ) {
          if (t !== 0) {
            var s = a.pendingLanes;
            if (s === 0) var r = 0;
            else {
              var d = a.suspendedLanes, y = a.pingedLanes;
              r = (1 << 31 - me(42 | t) + 1) - 1, r &= s & ~(d & ~y), r = r & 201326741 ? r & 201326741 | 1 : r ? r | 2 : 0;
            }
            r !== 0 && (n = !0, pm(a, r));
          } else
            r = yt, r = Dl(
              a,
              a === Ot ? r : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (r & 3) === 0 || ua(a, r) || (n = !0, pm(a, r));
          a = a.next;
        }
      while (n);
      or = !1;
    }
  }
  function i1() {
    hm();
  }
  function hm() {
    bs = ur = !1;
    var t = 0;
    li !== 0 && (h1() && (t = li), li = 0);
    for (var e = qe(), n = null, a = Ss; a !== null; ) {
      var s = a.next, r = dm(a, e);
      r === 0 ? (a.next = null, n === null ? Ss = s : n.next = s, s === null && (Qi = n)) : (n = a, (t !== 0 || (r & 3) !== 0) && (bs = !0)), a = s;
    }
    Ka(t);
  }
  function dm(t, e) {
    for (var n = t.suspendedLanes, a = t.pingedLanes, s = t.expirationTimes, r = t.pendingLanes & -62914561; 0 < r; ) {
      var d = 31 - me(r), y = 1 << d, T = s[d];
      T === -1 ? ((y & n) === 0 || (y & a) !== 0) && (s[d] = O0(y, e)) : T <= e && (t.expiredLanes |= y), r &= ~y;
    }
    if (e = Ot, n = yt, n = Dl(
      t,
      t === e ? n : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a = t.callbackNode, n === 0 || t === e && (Tt === 2 || Tt === 9) || t.cancelPendingCommit !== null)
      return a !== null && a !== null && Su(a), t.callbackNode = null, t.callbackPriority = 0;
    if ((n & 3) === 0 || ua(t, n)) {
      if (e = n & -n, e === t.callbackPriority) return e;
      switch (a !== null && Su(a), Au(n)) {
        case 2:
        case 8:
          n = af;
          break;
        case 32:
          n = xl;
          break;
        case 268435456:
          n = lf;
          break;
        default:
          n = xl;
      }
      return a = mm.bind(null, t), n = vu(n, a), t.callbackPriority = e, t.callbackNode = n, e;
    }
    return a !== null && a !== null && Su(a), t.callbackPriority = 2, t.callbackNode = null, 2;
  }
  function mm(t, e) {
    if (Wt !== 0 && Wt !== 5)
      return t.callbackNode = null, t.callbackPriority = 0, null;
    var n = t.callbackNode;
    if (vs() && t.callbackNode !== n)
      return null;
    var a = yt;
    return a = Dl(
      t,
      t === Ot ? a : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a === 0 ? null : (Fd(t, a, e), dm(t, qe()), t.callbackNode != null && t.callbackNode === n ? mm.bind(null, t) : null);
  }
  function pm(t, e) {
    if (vs()) return null;
    Fd(t, e, !0);
  }
  function a1() {
    m1(function() {
      (bt & 6) !== 0 ? vu(
        nf,
        i1
      ) : hm();
    });
  }
  function rr() {
    return li === 0 && (li = sf()), li;
  }
  function ym(t) {
    return t == null || typeof t == "symbol" || typeof t == "boolean" ? null : typeof t == "function" ? t : wl("" + t);
  }
  function gm(t, e) {
    var n = e.ownerDocument.createElement("input");
    return n.name = e.name, n.value = e.value, t.id && n.setAttribute("form", t.id), e.parentNode.insertBefore(n, e), t = new FormData(t), n.parentNode.removeChild(n), t;
  }
  function l1(t, e, n, a, s) {
    if (e === "submit" && n && n.stateNode === s) {
      var r = ym(
        (s[ue] || null).action
      ), d = a.submitter;
      d && (e = (e = d[ue] || null) ? ym(e.formAction) : d.getAttribute("formAction"), e !== null && (r = e, d = null));
      var y = new Nl(
        "action",
        "action",
        null,
        a,
        s
      );
      t.push({
        event: y,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (li !== 0) {
                  var T = d ? gm(s, d) : new FormData(s);
                  Oo(
                    n,
                    {
                      pending: !0,
                      data: T,
                      method: s.method,
                      action: r
                    },
                    null,
                    T
                  );
                }
              } else
                typeof r == "function" && (y.preventDefault(), T = d ? gm(s, d) : new FormData(s), Oo(
                  n,
                  {
                    pending: !0,
                    data: T,
                    method: s.method,
                    action: r
                  },
                  r,
                  T
                ));
            },
            currentTarget: s
          }
        ]
      });
    }
  }
  for (var cr = 0; cr < ku.length; cr++) {
    var fr = ku[cr], s1 = fr.toLowerCase(), u1 = fr[0].toUpperCase() + fr.slice(1);
    Be(
      s1,
      "on" + u1
    );
  }
  Be(Ff, "onAnimationEnd"), Be(Wf, "onAnimationIteration"), Be($f, "onAnimationStart"), Be("dblclick", "onDoubleClick"), Be("focusin", "onFocus"), Be("focusout", "onBlur"), Be(Ev, "onTransitionRun"), Be(Mv, "onTransitionStart"), Be(Dv, "onTransitionCancel"), Be(If, "onTransitionEnd"), yi("onMouseEnter", ["mouseout", "mouseover"]), yi("onMouseLeave", ["mouseout", "mouseover"]), yi("onPointerEnter", ["pointerout", "pointerover"]), yi("onPointerLeave", ["pointerout", "pointerover"]), Xn(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), Xn(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), Xn("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Xn(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), Xn(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), Xn(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var Qa = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), o1 = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Qa)
  );
  function vm(t, e) {
    e = (e & 4) !== 0;
    for (var n = 0; n < t.length; n++) {
      var a = t[n], s = a.event;
      a = a.listeners;
      t: {
        var r = void 0;
        if (e)
          for (var d = a.length - 1; 0 <= d; d--) {
            var y = a[d], T = y.instance, R = y.currentTarget;
            if (y = y.listener, T !== r && s.isPropagationStopped())
              break t;
            r = y, s.currentTarget = R;
            try {
              r(s);
            } catch (_) {
              us(_);
            }
            s.currentTarget = null, r = T;
          }
        else
          for (d = 0; d < a.length; d++) {
            if (y = a[d], T = y.instance, R = y.currentTarget, y = y.listener, T !== r && s.isPropagationStopped())
              break t;
            r = y, s.currentTarget = R;
            try {
              r(s);
            } catch (_) {
              us(_);
            }
            s.currentTarget = null, r = T;
          }
      }
    }
  }
  function dt(t, e) {
    var n = e[xu];
    n === void 0 && (n = e[xu] = /* @__PURE__ */ new Set());
    var a = t + "__bubble";
    n.has(a) || (Sm(e, t, 2, !1), n.add(a));
  }
  function hr(t, e, n) {
    var a = 0;
    e && (a |= 4), Sm(
      n,
      t,
      a,
      e
    );
  }
  var Ts = "_reactListening" + Math.random().toString(36).slice(2);
  function dr(t) {
    if (!t[Ts]) {
      t[Ts] = !0, hf.forEach(function(n) {
        n !== "selectionchange" && (o1.has(n) || hr(n, !1, t), hr(n, !0, t));
      });
      var e = t.nodeType === 9 ? t : t.ownerDocument;
      e === null || e[Ts] || (e[Ts] = !0, hr("selectionchange", !1, e));
    }
  }
  function Sm(t, e, n, a) {
    switch (Xm(e)) {
      case 2:
        var s = N1;
        break;
      case 8:
        s = U1;
        break;
      default:
        s = Rr;
    }
    n = s.bind(
      null,
      e,
      n,
      t
    ), s = void 0, !Bu || e !== "touchstart" && e !== "touchmove" && e !== "wheel" || (s = !0), a ? s !== void 0 ? t.addEventListener(e, n, {
      capture: !0,
      passive: s
    }) : t.addEventListener(e, n, !0) : s !== void 0 ? t.addEventListener(e, n, {
      passive: s
    }) : t.addEventListener(e, n, !1);
  }
  function mr(t, e, n, a, s) {
    var r = a;
    if ((e & 1) === 0 && (e & 2) === 0 && a !== null)
      t: for (; ; ) {
        if (a === null) return;
        var d = a.tag;
        if (d === 3 || d === 4) {
          var y = a.stateNode.containerInfo;
          if (y === s) break;
          if (d === 4)
            for (d = a.return; d !== null; ) {
              var T = d.tag;
              if ((T === 3 || T === 4) && d.stateNode.containerInfo === s)
                return;
              d = d.return;
            }
          for (; y !== null; ) {
            if (d = di(y), d === null) return;
            if (T = d.tag, T === 5 || T === 6 || T === 26 || T === 27) {
              a = r = d;
              continue t;
            }
            y = y.parentNode;
          }
        }
        a = a.return;
      }
    Df(function() {
      var R = r, _ = zu(n), U = [];
      t: {
        var C = th.get(t);
        if (C !== void 0) {
          var O = Nl, lt = t;
          switch (t) {
            case "keypress":
              if (_l(n) === 0) break t;
            case "keydown":
            case "keyup":
              O = nv;
              break;
            case "focusin":
              lt = "focus", O = Lu;
              break;
            case "focusout":
              lt = "blur", O = Lu;
              break;
            case "beforeblur":
            case "afterblur":
              O = Lu;
              break;
            case "click":
              if (n.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              O = Of;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              O = Z0;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              O = lv;
              break;
            case Ff:
            case Wf:
            case $f:
              O = k0;
              break;
            case If:
              O = uv;
              break;
            case "scroll":
            case "scrollend":
              O = G0;
              break;
            case "wheel":
              O = rv;
              break;
            case "copy":
            case "cut":
            case "paste":
              O = J0;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              O = wf;
              break;
            case "toggle":
            case "beforetoggle":
              O = fv;
          }
          var et = (e & 4) !== 0, Et = !et && (t === "scroll" || t === "scrollend"), E = et ? C !== null ? C + "Capture" : null : C;
          et = [];
          for (var x = R, M; x !== null; ) {
            var N = x;
            if (M = N.stateNode, N = N.tag, N !== 5 && N !== 26 && N !== 27 || M === null || E === null || (N = fa(x, E), N != null && et.push(
              ka(x, N, M)
            )), Et) break;
            x = x.return;
          }
          0 < et.length && (C = new O(
            C,
            lt,
            null,
            n,
            _
          ), U.push({ event: C, listeners: et }));
        }
      }
      if ((e & 7) === 0) {
        t: {
          if (C = t === "mouseover" || t === "pointerover", O = t === "mouseout" || t === "pointerout", C && n !== wu && (lt = n.relatedTarget || n.fromElement) && (di(lt) || lt[hi]))
            break t;
          if ((O || C) && (C = _.window === _ ? _ : (C = _.ownerDocument) ? C.defaultView || C.parentWindow : window, O ? (lt = n.relatedTarget || n.toElement, O = R, lt = lt ? di(lt) : null, lt !== null && (Et = h(lt), et = lt.tag, lt !== Et || et !== 5 && et !== 27 && et !== 6) && (lt = null)) : (O = null, lt = R), O !== lt)) {
            if (et = Of, N = "onMouseLeave", E = "onMouseEnter", x = "mouse", (t === "pointerout" || t === "pointerover") && (et = wf, N = "onPointerLeave", E = "onPointerEnter", x = "pointer"), Et = O == null ? C : ca(O), M = lt == null ? C : ca(lt), C = new et(
              N,
              x + "leave",
              O,
              n,
              _
            ), C.target = Et, C.relatedTarget = M, N = null, di(_) === R && (et = new et(
              E,
              x + "enter",
              lt,
              n,
              _
            ), et.target = M, et.relatedTarget = Et, N = et), Et = N, O && lt)
              e: {
                for (et = O, E = lt, x = 0, M = et; M; M = ki(M))
                  x++;
                for (M = 0, N = E; N; N = ki(N))
                  M++;
                for (; 0 < x - M; )
                  et = ki(et), x--;
                for (; 0 < M - x; )
                  E = ki(E), M--;
                for (; x--; ) {
                  if (et === E || E !== null && et === E.alternate)
                    break e;
                  et = ki(et), E = ki(E);
                }
                et = null;
              }
            else et = null;
            O !== null && bm(
              U,
              C,
              O,
              et,
              !1
            ), lt !== null && Et !== null && bm(
              U,
              Et,
              lt,
              et,
              !0
            );
          }
        }
        t: {
          if (C = R ? ca(R) : window, O = C.nodeName && C.nodeName.toLowerCase(), O === "select" || O === "input" && C.type === "file")
            var F = Hf;
          else if (jf(C))
            if (qf)
              F = Tv;
            else {
              F = Sv;
              var ft = vv;
            }
          else
            O = C.nodeName, !O || O.toLowerCase() !== "input" || C.type !== "checkbox" && C.type !== "radio" ? R && Vu(R.elementType) && (F = Hf) : F = bv;
          if (F && (F = F(t, R))) {
            Lf(
              U,
              F,
              n,
              _
            );
            break t;
          }
          ft && ft(t, C, R), t === "focusout" && R && C.type === "number" && R.memoizedProps.value != null && Ou(C, "number", C.value);
        }
        switch (ft = R ? ca(R) : window, t) {
          case "focusin":
            (jf(ft) || ft.contentEditable === "true") && (xi = ft, Zu = R, Sa = null);
            break;
          case "focusout":
            Sa = Zu = xi = null;
            break;
          case "mousedown":
            Ku = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Ku = !1, Pf(U, n, _);
            break;
          case "selectionchange":
            if (xv) break;
          case "keydown":
          case "keyup":
            Pf(U, n, _);
        }
        var I;
        if (qu)
          t: {
            switch (t) {
              case "compositionstart":
                var nt = "onCompositionStart";
                break t;
              case "compositionend":
                nt = "onCompositionEnd";
                break t;
              case "compositionupdate":
                nt = "onCompositionUpdate";
                break t;
            }
            nt = void 0;
          }
        else
          Ai ? Nf(t, n) && (nt = "onCompositionEnd") : t === "keydown" && n.keyCode === 229 && (nt = "onCompositionStart");
        nt && (zf && n.locale !== "ko" && (Ai || nt !== "onCompositionStart" ? nt === "onCompositionEnd" && Ai && (I = Rf()) : (yn = _, Nu = "value" in yn ? yn.value : yn.textContent, Ai = !0)), ft = As(R, nt), 0 < ft.length && (nt = new Vf(
          nt,
          t,
          null,
          n,
          _
        ), U.push({ event: nt, listeners: ft }), I ? nt.data = I : (I = Uf(n), I !== null && (nt.data = I)))), (I = dv ? mv(t, n) : pv(t, n)) && (nt = As(R, "onBeforeInput"), 0 < nt.length && (ft = new Vf(
          "onBeforeInput",
          "beforeinput",
          null,
          n,
          _
        ), U.push({
          event: ft,
          listeners: nt
        }), ft.data = I)), l1(
          U,
          t,
          R,
          n,
          _
        );
      }
      vm(U, e);
    });
  }
  function ka(t, e, n) {
    return {
      instance: t,
      listener: e,
      currentTarget: n
    };
  }
  function As(t, e) {
    for (var n = e + "Capture", a = []; t !== null; ) {
      var s = t, r = s.stateNode;
      if (s = s.tag, s !== 5 && s !== 26 && s !== 27 || r === null || (s = fa(t, n), s != null && a.unshift(
        ka(t, s, r)
      ), s = fa(t, e), s != null && a.push(
        ka(t, s, r)
      )), t.tag === 3) return a;
      t = t.return;
    }
    return [];
  }
  function ki(t) {
    if (t === null) return null;
    do
      t = t.return;
    while (t && t.tag !== 5 && t.tag !== 27);
    return t || null;
  }
  function bm(t, e, n, a, s) {
    for (var r = e._reactName, d = []; n !== null && n !== a; ) {
      var y = n, T = y.alternate, R = y.stateNode;
      if (y = y.tag, T !== null && T === a) break;
      y !== 5 && y !== 26 && y !== 27 || R === null || (T = R, s ? (R = fa(n, r), R != null && d.unshift(
        ka(n, R, T)
      )) : s || (R = fa(n, r), R != null && d.push(
        ka(n, R, T)
      ))), n = n.return;
    }
    d.length !== 0 && t.push({ event: e, listeners: d });
  }
  var r1 = /\r\n?/g, c1 = /\u0000|\uFFFD/g;
  function Tm(t) {
    return (typeof t == "string" ? t : "" + t).replace(r1, `
`).replace(c1, "");
  }
  function Am(t, e) {
    return e = Tm(e), Tm(t) === e;
  }
  function xs() {
  }
  function xt(t, e, n, a, s, r) {
    switch (n) {
      case "children":
        typeof a == "string" ? e === "body" || e === "textarea" && a === "" || Si(t, a) : (typeof a == "number" || typeof a == "bigint") && e !== "body" && Si(t, "" + a);
        break;
      case "className":
        Cl(t, "class", a);
        break;
      case "tabIndex":
        Cl(t, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Cl(t, n, a);
        break;
      case "style":
        Ef(t, a, r);
        break;
      case "data":
        if (e !== "object") {
          Cl(t, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (e !== "a" || n !== "href")) {
          t.removeAttribute(n);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(n);
          break;
        }
        a = wl("" + a), t.setAttribute(n, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          t.setAttribute(
            n,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof r == "function" && (n === "formAction" ? (e !== "input" && xt(t, e, "name", s.name, s, null), xt(
            t,
            e,
            "formEncType",
            s.formEncType,
            s,
            null
          ), xt(
            t,
            e,
            "formMethod",
            s.formMethod,
            s,
            null
          ), xt(
            t,
            e,
            "formTarget",
            s.formTarget,
            s,
            null
          )) : (xt(t, e, "encType", s.encType, s, null), xt(t, e, "method", s.method, s, null), xt(t, e, "target", s.target, s, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(n);
          break;
        }
        a = wl("" + a), t.setAttribute(n, a);
        break;
      case "onClick":
        a != null && (t.onclick = xs);
        break;
      case "onScroll":
        a != null && dt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && dt("scrollend", t);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(o(61));
          if (n = a.__html, n != null) {
            if (s.children != null) throw Error(o(60));
            t.innerHTML = n;
          }
        }
        break;
      case "multiple":
        t.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        t.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          t.removeAttribute("xlink:href");
          break;
        }
        n = wl("" + a), t.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          n
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, "" + a) : t.removeAttribute(n);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, "") : t.removeAttribute(n);
        break;
      case "capture":
      case "download":
        a === !0 ? t.setAttribute(n, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(n, a) : t.removeAttribute(n);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? t.setAttribute(n, a) : t.removeAttribute(n);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? t.removeAttribute(n) : t.setAttribute(n, a);
        break;
      case "popover":
        dt("beforetoggle", t), dt("toggle", t), Rl(t, "popover", a);
        break;
      case "xlinkActuate":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        Fe(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        Fe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        Fe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        Fe(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        Rl(t, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = q0.get(n) || n, Rl(t, n, a));
    }
  }
  function pr(t, e, n, a, s, r) {
    switch (n) {
      case "style":
        Ef(t, a, r);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(o(61));
          if (n = a.__html, n != null) {
            if (s.children != null) throw Error(o(60));
            t.innerHTML = n;
          }
        }
        break;
      case "children":
        typeof a == "string" ? Si(t, a) : (typeof a == "number" || typeof a == "bigint") && Si(t, "" + a);
        break;
      case "onScroll":
        a != null && dt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && dt("scrollend", t);
        break;
      case "onClick":
        a != null && (t.onclick = xs);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!df.hasOwnProperty(n))
          t: {
            if (n[0] === "o" && n[1] === "n" && (s = n.endsWith("Capture"), e = n.slice(2, s ? n.length - 7 : void 0), r = t[ue] || null, r = r != null ? r[n] : null, typeof r == "function" && t.removeEventListener(e, r, s), typeof a == "function")) {
              typeof r != "function" && r !== null && (n in t ? t[n] = null : t.hasAttribute(n) && t.removeAttribute(n)), t.addEventListener(e, a, s);
              break t;
            }
            n in t ? t[n] = a : a === !0 ? t.setAttribute(n, "") : Rl(t, n, a);
          }
    }
  }
  function $t(t, e, n) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        dt("error", t), dt("load", t);
        var a = !1, s = !1, r;
        for (r in n)
          if (n.hasOwnProperty(r)) {
            var d = n[r];
            if (d != null)
              switch (r) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  s = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(o(137, e));
                default:
                  xt(t, e, r, d, n, null);
              }
          }
        s && xt(t, e, "srcSet", n.srcSet, n, null), a && xt(t, e, "src", n.src, n, null);
        return;
      case "input":
        dt("invalid", t);
        var y = r = d = s = null, T = null, R = null;
        for (a in n)
          if (n.hasOwnProperty(a)) {
            var _ = n[a];
            if (_ != null)
              switch (a) {
                case "name":
                  s = _;
                  break;
                case "type":
                  d = _;
                  break;
                case "checked":
                  T = _;
                  break;
                case "defaultChecked":
                  R = _;
                  break;
                case "value":
                  r = _;
                  break;
                case "defaultValue":
                  y = _;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (_ != null)
                    throw Error(o(137, e));
                  break;
                default:
                  xt(t, e, a, _, n, null);
              }
          }
        bf(
          t,
          r,
          y,
          T,
          R,
          d,
          s,
          !1
        ), Ol(t);
        return;
      case "select":
        dt("invalid", t), a = d = r = null;
        for (s in n)
          if (n.hasOwnProperty(s) && (y = n[s], y != null))
            switch (s) {
              case "value":
                r = y;
                break;
              case "defaultValue":
                d = y;
                break;
              case "multiple":
                a = y;
              default:
                xt(t, e, s, y, n, null);
            }
        e = r, n = d, t.multiple = !!a, e != null ? vi(t, !!a, e, !1) : n != null && vi(t, !!a, n, !0);
        return;
      case "textarea":
        dt("invalid", t), r = s = a = null;
        for (d in n)
          if (n.hasOwnProperty(d) && (y = n[d], y != null))
            switch (d) {
              case "value":
                a = y;
                break;
              case "defaultValue":
                s = y;
                break;
              case "children":
                r = y;
                break;
              case "dangerouslySetInnerHTML":
                if (y != null) throw Error(o(91));
                break;
              default:
                xt(t, e, d, y, n, null);
            }
        Af(t, a, s, r), Ol(t);
        return;
      case "option":
        for (T in n)
          if (n.hasOwnProperty(T) && (a = n[T], a != null))
            switch (T) {
              case "selected":
                t.selected = a && typeof a != "function" && typeof a != "symbol";
                break;
              default:
                xt(t, e, T, a, n, null);
            }
        return;
      case "dialog":
        dt("beforetoggle", t), dt("toggle", t), dt("cancel", t), dt("close", t);
        break;
      case "iframe":
      case "object":
        dt("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Qa.length; a++)
          dt(Qa[a], t);
        break;
      case "image":
        dt("error", t), dt("load", t);
        break;
      case "details":
        dt("toggle", t);
        break;
      case "embed":
      case "source":
      case "link":
        dt("error", t), dt("load", t);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (R in n)
          if (n.hasOwnProperty(R) && (a = n[R], a != null))
            switch (R) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(o(137, e));
              default:
                xt(t, e, R, a, n, null);
            }
        return;
      default:
        if (Vu(e)) {
          for (_ in n)
            n.hasOwnProperty(_) && (a = n[_], a !== void 0 && pr(
              t,
              e,
              _,
              a,
              n,
              void 0
            ));
          return;
        }
    }
    for (y in n)
      n.hasOwnProperty(y) && (a = n[y], a != null && xt(t, e, y, a, n, null));
  }
  function f1(t, e, n, a) {
    switch (e) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var s = null, r = null, d = null, y = null, T = null, R = null, _ = null;
        for (O in n) {
          var U = n[O];
          if (n.hasOwnProperty(O) && U != null)
            switch (O) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                T = U;
              default:
                a.hasOwnProperty(O) || xt(t, e, O, null, a, U);
            }
        }
        for (var C in a) {
          var O = a[C];
          if (U = n[C], a.hasOwnProperty(C) && (O != null || U != null))
            switch (C) {
              case "type":
                r = O;
                break;
              case "name":
                s = O;
                break;
              case "checked":
                R = O;
                break;
              case "defaultChecked":
                _ = O;
                break;
              case "value":
                d = O;
                break;
              case "defaultValue":
                y = O;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (O != null)
                  throw Error(o(137, e));
                break;
              default:
                O !== U && xt(
                  t,
                  e,
                  C,
                  O,
                  a,
                  U
                );
            }
        }
        Cu(
          t,
          d,
          y,
          T,
          R,
          _,
          r,
          s
        );
        return;
      case "select":
        O = d = y = C = null;
        for (r in n)
          if (T = n[r], n.hasOwnProperty(r) && T != null)
            switch (r) {
              case "value":
                break;
              case "multiple":
                O = T;
              default:
                a.hasOwnProperty(r) || xt(
                  t,
                  e,
                  r,
                  null,
                  a,
                  T
                );
            }
        for (s in a)
          if (r = a[s], T = n[s], a.hasOwnProperty(s) && (r != null || T != null))
            switch (s) {
              case "value":
                C = r;
                break;
              case "defaultValue":
                y = r;
                break;
              case "multiple":
                d = r;
              default:
                r !== T && xt(
                  t,
                  e,
                  s,
                  r,
                  a,
                  T
                );
            }
        e = y, n = d, a = O, C != null ? vi(t, !!n, C, !1) : !!a != !!n && (e != null ? vi(t, !!n, e, !0) : vi(t, !!n, n ? [] : "", !1));
        return;
      case "textarea":
        O = C = null;
        for (y in n)
          if (s = n[y], n.hasOwnProperty(y) && s != null && !a.hasOwnProperty(y))
            switch (y) {
              case "value":
                break;
              case "children":
                break;
              default:
                xt(t, e, y, null, a, s);
            }
        for (d in a)
          if (s = a[d], r = n[d], a.hasOwnProperty(d) && (s != null || r != null))
            switch (d) {
              case "value":
                C = s;
                break;
              case "defaultValue":
                O = s;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (s != null) throw Error(o(91));
                break;
              default:
                s !== r && xt(t, e, d, s, a, r);
            }
        Tf(t, C, O);
        return;
      case "option":
        for (var lt in n)
          if (C = n[lt], n.hasOwnProperty(lt) && C != null && !a.hasOwnProperty(lt))
            switch (lt) {
              case "selected":
                t.selected = !1;
                break;
              default:
                xt(
                  t,
                  e,
                  lt,
                  null,
                  a,
                  C
                );
            }
        for (T in a)
          if (C = a[T], O = n[T], a.hasOwnProperty(T) && C !== O && (C != null || O != null))
            switch (T) {
              case "selected":
                t.selected = C && typeof C != "function" && typeof C != "symbol";
                break;
              default:
                xt(
                  t,
                  e,
                  T,
                  C,
                  a,
                  O
                );
            }
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var et in n)
          C = n[et], n.hasOwnProperty(et) && C != null && !a.hasOwnProperty(et) && xt(t, e, et, null, a, C);
        for (R in a)
          if (C = a[R], O = n[R], a.hasOwnProperty(R) && C !== O && (C != null || O != null))
            switch (R) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (C != null)
                  throw Error(o(137, e));
                break;
              default:
                xt(
                  t,
                  e,
                  R,
                  C,
                  a,
                  O
                );
            }
        return;
      default:
        if (Vu(e)) {
          for (var Et in n)
            C = n[Et], n.hasOwnProperty(Et) && C !== void 0 && !a.hasOwnProperty(Et) && pr(
              t,
              e,
              Et,
              void 0,
              a,
              C
            );
          for (_ in a)
            C = a[_], O = n[_], !a.hasOwnProperty(_) || C === O || C === void 0 && O === void 0 || pr(
              t,
              e,
              _,
              C,
              a,
              O
            );
          return;
        }
    }
    for (var E in n)
      C = n[E], n.hasOwnProperty(E) && C != null && !a.hasOwnProperty(E) && xt(t, e, E, null, a, C);
    for (U in a)
      C = a[U], O = n[U], !a.hasOwnProperty(U) || C === O || C == null && O == null || xt(t, e, U, C, a, O);
  }
  var yr = null, gr = null;
  function Es(t) {
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  function xm(t) {
    switch (t) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function Em(t, e) {
    if (t === 0)
      switch (e) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return t === 1 && e === "foreignObject" ? 0 : t;
  }
  function vr(t, e) {
    return t === "textarea" || t === "noscript" || typeof e.children == "string" || typeof e.children == "number" || typeof e.children == "bigint" || typeof e.dangerouslySetInnerHTML == "object" && e.dangerouslySetInnerHTML !== null && e.dangerouslySetInnerHTML.__html != null;
  }
  var Sr = null;
  function h1() {
    var t = window.event;
    return t && t.type === "popstate" ? t === Sr ? !1 : (Sr = t, !0) : (Sr = null, !1);
  }
  var Mm = typeof setTimeout == "function" ? setTimeout : void 0, d1 = typeof clearTimeout == "function" ? clearTimeout : void 0, Dm = typeof Promise == "function" ? Promise : void 0, m1 = typeof queueMicrotask == "function" ? queueMicrotask : typeof Dm < "u" ? function(t) {
    return Dm.resolve(null).then(t).catch(p1);
  } : Mm;
  function p1(t) {
    setTimeout(function() {
      throw t;
    });
  }
  function zn(t) {
    return t === "head";
  }
  function Rm(t, e) {
    var n = e, a = 0, s = 0;
    do {
      var r = n.nextSibling;
      if (t.removeChild(n), r && r.nodeType === 8)
        if (n = r.data, n === "/$") {
          if (0 < a && 8 > a) {
            n = a;
            var d = t.ownerDocument;
            if (n & 1 && Pa(d.documentElement), n & 2 && Pa(d.body), n & 4)
              for (n = d.head, Pa(n), d = n.firstChild; d; ) {
                var y = d.nextSibling, T = d.nodeName;
                d[ra] || T === "SCRIPT" || T === "STYLE" || T === "LINK" && d.rel.toLowerCase() === "stylesheet" || n.removeChild(d), d = y;
              }
          }
          if (s === 0) {
            t.removeChild(r), nl(e);
            return;
          }
          s--;
        } else
          n === "$" || n === "$?" || n === "$!" ? s++ : a = n.charCodeAt(0) - 48;
      else a = 0;
      n = r;
    } while (n);
    nl(e);
  }
  function br(t) {
    var e = t.firstChild;
    for (e && e.nodeType === 10 && (e = e.nextSibling); e; ) {
      var n = e;
      switch (e = e.nextSibling, n.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          br(n), Eu(n);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (n.rel.toLowerCase() === "stylesheet") continue;
      }
      t.removeChild(n);
    }
  }
  function y1(t, e, n, a) {
    for (; t.nodeType === 1; ) {
      var s = n;
      if (t.nodeName.toLowerCase() !== e.toLowerCase()) {
        if (!a && (t.nodeName !== "INPUT" || t.type !== "hidden"))
          break;
      } else if (a) {
        if (!t[ra])
          switch (e) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (r = t.getAttribute("rel"), r === "stylesheet" && t.hasAttribute("data-precedence"))
                break;
              if (r !== s.rel || t.getAttribute("href") !== (s.href == null || s.href === "" ? null : s.href) || t.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin) || t.getAttribute("title") !== (s.title == null ? null : s.title))
                break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (r = t.getAttribute("src"), (r !== (s.src == null ? null : s.src) || t.getAttribute("type") !== (s.type == null ? null : s.type) || t.getAttribute("crossorigin") !== (s.crossOrigin == null ? null : s.crossOrigin)) && r && t.hasAttribute("async") && !t.hasAttribute("itemprop"))
                break;
              return t;
            default:
              return t;
          }
      } else if (e === "input" && t.type === "hidden") {
        var r = s.name == null ? null : "" + s.name;
        if (s.type === "hidden" && t.getAttribute("name") === r)
          return t;
      } else return t;
      if (t = Ue(t.nextSibling), t === null) break;
    }
    return null;
  }
  function g1(t, e, n) {
    if (e === "") return null;
    for (; t.nodeType !== 3; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !n || (t = Ue(t.nextSibling), t === null)) return null;
    return t;
  }
  function Tr(t) {
    return t.data === "$!" || t.data === "$?" && t.ownerDocument.readyState === "complete";
  }
  function v1(t, e) {
    var n = t.ownerDocument;
    if (t.data !== "$?" || n.readyState === "complete")
      e();
    else {
      var a = function() {
        e(), n.removeEventListener("DOMContentLoaded", a);
      };
      n.addEventListener("DOMContentLoaded", a), t._reactRetry = a;
    }
  }
  function Ue(t) {
    for (; t != null; t = t.nextSibling) {
      var e = t.nodeType;
      if (e === 1 || e === 3) break;
      if (e === 8) {
        if (e = t.data, e === "$" || e === "$!" || e === "$?" || e === "F!" || e === "F")
          break;
        if (e === "/$") return null;
      }
    }
    return t;
  }
  var Ar = null;
  function Cm(t) {
    t = t.previousSibling;
    for (var e = 0; t; ) {
      if (t.nodeType === 8) {
        var n = t.data;
        if (n === "$" || n === "$!" || n === "$?") {
          if (e === 0) return t;
          e--;
        } else n === "/$" && e++;
      }
      t = t.previousSibling;
    }
    return null;
  }
  function Om(t, e, n) {
    switch (e = Es(n), t) {
      case "html":
        if (t = e.documentElement, !t) throw Error(o(452));
        return t;
      case "head":
        if (t = e.head, !t) throw Error(o(453));
        return t;
      case "body":
        if (t = e.body, !t) throw Error(o(454));
        return t;
      default:
        throw Error(o(451));
    }
  }
  function Pa(t) {
    for (var e = t.attributes; e.length; )
      t.removeAttributeNode(e[0]);
    Eu(t);
  }
  var we = /* @__PURE__ */ new Map(), Vm = /* @__PURE__ */ new Set();
  function Ms(t) {
    return typeof t.getRootNode == "function" ? t.getRootNode() : t.nodeType === 9 ? t : t.ownerDocument;
  }
  var fn = K.d;
  K.d = {
    f: S1,
    r: b1,
    D: T1,
    C: A1,
    L: x1,
    m: E1,
    X: D1,
    S: M1,
    M: R1
  };
  function S1() {
    var t = fn.f(), e = ys();
    return t || e;
  }
  function b1(t) {
    var e = mi(t);
    e !== null && e.tag === 5 && e.type === "form" ? Fh(e) : fn.r(t);
  }
  var Pi = typeof document > "u" ? null : document;
  function wm(t, e, n) {
    var a = Pi;
    if (a && typeof e == "string" && e) {
      var s = Ee(e);
      s = 'link[rel="' + t + '"][href="' + s + '"]', typeof n == "string" && (s += '[crossorigin="' + n + '"]'), Vm.has(s) || (Vm.add(s), t = { rel: t, crossOrigin: n, href: e }, a.querySelector(s) === null && (e = a.createElement("link"), $t(e, "link", t), Kt(e), a.head.appendChild(e)));
    }
  }
  function T1(t) {
    fn.D(t), wm("dns-prefetch", t, null);
  }
  function A1(t, e) {
    fn.C(t, e), wm("preconnect", t, e);
  }
  function x1(t, e, n) {
    fn.L(t, e, n);
    var a = Pi;
    if (a && t && e) {
      var s = 'link[rel="preload"][as="' + Ee(e) + '"]';
      e === "image" && n && n.imageSrcSet ? (s += '[imagesrcset="' + Ee(
        n.imageSrcSet
      ) + '"]', typeof n.imageSizes == "string" && (s += '[imagesizes="' + Ee(
        n.imageSizes
      ) + '"]')) : s += '[href="' + Ee(t) + '"]';
      var r = s;
      switch (e) {
        case "style":
          r = Ji(t);
          break;
        case "script":
          r = Fi(t);
      }
      we.has(r) || (t = g(
        {
          rel: "preload",
          href: e === "image" && n && n.imageSrcSet ? void 0 : t,
          as: e
        },
        n
      ), we.set(r, t), a.querySelector(s) !== null || e === "style" && a.querySelector(Ja(r)) || e === "script" && a.querySelector(Fa(r)) || (e = a.createElement("link"), $t(e, "link", t), Kt(e), a.head.appendChild(e)));
    }
  }
  function E1(t, e) {
    fn.m(t, e);
    var n = Pi;
    if (n && t) {
      var a = e && typeof e.as == "string" ? e.as : "script", s = 'link[rel="modulepreload"][as="' + Ee(a) + '"][href="' + Ee(t) + '"]', r = s;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          r = Fi(t);
      }
      if (!we.has(r) && (t = g({ rel: "modulepreload", href: t }, e), we.set(r, t), n.querySelector(s) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (n.querySelector(Fa(r)))
              return;
        }
        a = n.createElement("link"), $t(a, "link", t), Kt(a), n.head.appendChild(a);
      }
    }
  }
  function M1(t, e, n) {
    fn.S(t, e, n);
    var a = Pi;
    if (a && t) {
      var s = pi(a).hoistableStyles, r = Ji(t);
      e = e || "default";
      var d = s.get(r);
      if (!d) {
        var y = { loading: 0, preload: null };
        if (d = a.querySelector(
          Ja(r)
        ))
          y.loading = 5;
        else {
          t = g(
            { rel: "stylesheet", href: t, "data-precedence": e },
            n
          ), (n = we.get(r)) && xr(t, n);
          var T = d = a.createElement("link");
          Kt(T), $t(T, "link", t), T._p = new Promise(function(R, _) {
            T.onload = R, T.onerror = _;
          }), T.addEventListener("load", function() {
            y.loading |= 1;
          }), T.addEventListener("error", function() {
            y.loading |= 2;
          }), y.loading |= 4, Ds(d, e, a);
        }
        d = {
          type: "stylesheet",
          instance: d,
          count: 1,
          state: y
        }, s.set(r, d);
      }
    }
  }
  function D1(t, e) {
    fn.X(t, e);
    var n = Pi;
    if (n && t) {
      var a = pi(n).hoistableScripts, s = Fi(t), r = a.get(s);
      r || (r = n.querySelector(Fa(s)), r || (t = g({ src: t, async: !0 }, e), (e = we.get(s)) && Er(t, e), r = n.createElement("script"), Kt(r), $t(r, "link", t), n.head.appendChild(r)), r = {
        type: "script",
        instance: r,
        count: 1,
        state: null
      }, a.set(s, r));
    }
  }
  function R1(t, e) {
    fn.M(t, e);
    var n = Pi;
    if (n && t) {
      var a = pi(n).hoistableScripts, s = Fi(t), r = a.get(s);
      r || (r = n.querySelector(Fa(s)), r || (t = g({ src: t, async: !0, type: "module" }, e), (e = we.get(s)) && Er(t, e), r = n.createElement("script"), Kt(r), $t(r, "link", t), n.head.appendChild(r)), r = {
        type: "script",
        instance: r,
        count: 1,
        state: null
      }, a.set(s, r));
    }
  }
  function zm(t, e, n, a) {
    var s = (s = ut.current) ? Ms(s) : null;
    if (!s) throw Error(o(446));
    switch (t) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof n.precedence == "string" && typeof n.href == "string" ? (e = Ji(n.href), n = pi(
          s
        ).hoistableStyles, a = n.get(e), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, n.set(e, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
          t = Ji(n.href);
          var r = pi(
            s
          ).hoistableStyles, d = r.get(t);
          if (d || (s = s.ownerDocument || s, d = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, r.set(t, d), (r = s.querySelector(
            Ja(t)
          )) && !r._p && (d.instance = r, d.state.loading = 5), we.has(t) || (n = {
            rel: "preload",
            as: "style",
            href: n.href,
            crossOrigin: n.crossOrigin,
            integrity: n.integrity,
            media: n.media,
            hrefLang: n.hrefLang,
            referrerPolicy: n.referrerPolicy
          }, we.set(t, n), r || C1(
            s,
            t,
            n,
            d.state
          ))), e && a === null)
            throw Error(o(528, ""));
          return d;
        }
        if (e && a !== null)
          throw Error(o(529, ""));
        return null;
      case "script":
        return e = n.async, n = n.src, typeof n == "string" && e && typeof e != "function" && typeof e != "symbol" ? (e = Fi(n), n = pi(
          s
        ).hoistableScripts, a = n.get(e), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, n.set(e, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(o(444, t));
    }
  }
  function Ji(t) {
    return 'href="' + Ee(t) + '"';
  }
  function Ja(t) {
    return 'link[rel="stylesheet"][' + t + "]";
  }
  function _m(t) {
    return g({}, t, {
      "data-precedence": t.precedence,
      precedence: null
    });
  }
  function C1(t, e, n, a) {
    t.querySelector('link[rel="preload"][as="style"][' + e + "]") ? a.loading = 1 : (e = t.createElement("link"), a.preload = e, e.addEventListener("load", function() {
      return a.loading |= 1;
    }), e.addEventListener("error", function() {
      return a.loading |= 2;
    }), $t(e, "link", n), Kt(e), t.head.appendChild(e));
  }
  function Fi(t) {
    return '[src="' + Ee(t) + '"]';
  }
  function Fa(t) {
    return "script[async]" + t;
  }
  function Bm(t, e, n) {
    if (e.count++, e.instance === null)
      switch (e.type) {
        case "style":
          var a = t.querySelector(
            'style[data-href~="' + Ee(n.href) + '"]'
          );
          if (a)
            return e.instance = a, Kt(a), a;
          var s = g({}, n, {
            "data-href": n.href,
            "data-precedence": n.precedence,
            href: null,
            precedence: null
          });
          return a = (t.ownerDocument || t).createElement(
            "style"
          ), Kt(a), $t(a, "style", s), Ds(a, n.precedence, t), e.instance = a;
        case "stylesheet":
          s = Ji(n.href);
          var r = t.querySelector(
            Ja(s)
          );
          if (r)
            return e.state.loading |= 4, e.instance = r, Kt(r), r;
          a = _m(n), (s = we.get(s)) && xr(a, s), r = (t.ownerDocument || t).createElement("link"), Kt(r);
          var d = r;
          return d._p = new Promise(function(y, T) {
            d.onload = y, d.onerror = T;
          }), $t(r, "link", a), e.state.loading |= 4, Ds(r, n.precedence, t), e.instance = r;
        case "script":
          return r = Fi(n.src), (s = t.querySelector(
            Fa(r)
          )) ? (e.instance = s, Kt(s), s) : (a = n, (s = we.get(r)) && (a = g({}, n), Er(a, s)), t = t.ownerDocument || t, s = t.createElement("script"), Kt(s), $t(s, "link", a), t.head.appendChild(s), e.instance = s);
        case "void":
          return null;
        default:
          throw Error(o(443, e.type));
      }
    else
      e.type === "stylesheet" && (e.state.loading & 4) === 0 && (a = e.instance, e.state.loading |= 4, Ds(a, n.precedence, t));
    return e.instance;
  }
  function Ds(t, e, n) {
    for (var a = n.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), s = a.length ? a[a.length - 1] : null, r = s, d = 0; d < a.length; d++) {
      var y = a[d];
      if (y.dataset.precedence === e) r = y;
      else if (r !== s) break;
    }
    r ? r.parentNode.insertBefore(t, r.nextSibling) : (e = n.nodeType === 9 ? n.head : n, e.insertBefore(t, e.firstChild));
  }
  function xr(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.title == null && (t.title = e.title);
  }
  function Er(t, e) {
    t.crossOrigin == null && (t.crossOrigin = e.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = e.referrerPolicy), t.integrity == null && (t.integrity = e.integrity);
  }
  var Rs = null;
  function Nm(t, e, n) {
    if (Rs === null) {
      var a = /* @__PURE__ */ new Map(), s = Rs = /* @__PURE__ */ new Map();
      s.set(n, a);
    } else
      s = Rs, a = s.get(n), a || (a = /* @__PURE__ */ new Map(), s.set(n, a));
    if (a.has(t)) return a;
    for (a.set(t, null), n = n.getElementsByTagName(t), s = 0; s < n.length; s++) {
      var r = n[s];
      if (!(r[ra] || r[ee] || t === "link" && r.getAttribute("rel") === "stylesheet") && r.namespaceURI !== "http://www.w3.org/2000/svg") {
        var d = r.getAttribute(e) || "";
        d = t + d;
        var y = a.get(d);
        y ? y.push(r) : a.set(d, [r]);
      }
    }
    return a;
  }
  function Um(t, e, n) {
    t = t.ownerDocument || t, t.head.insertBefore(
      n,
      e === "title" ? t.querySelector("head > title") : null
    );
  }
  function O1(t, e, n) {
    if (n === 1 || e.itemProp != null) return !1;
    switch (t) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof e.precedence != "string" || typeof e.href != "string" || e.href === "")
          break;
        return !0;
      case "link":
        if (typeof e.rel != "string" || typeof e.href != "string" || e.href === "" || e.onLoad || e.onError)
          break;
        switch (e.rel) {
          case "stylesheet":
            return t = e.disabled, typeof e.precedence == "string" && t == null;
          default:
            return !0;
        }
      case "script":
        if (e.async && typeof e.async != "function" && typeof e.async != "symbol" && !e.onLoad && !e.onError && e.src && typeof e.src == "string")
          return !0;
    }
    return !1;
  }
  function jm(t) {
    return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
  }
  var Wa = null;
  function V1() {
  }
  function w1(t, e, n) {
    if (Wa === null) throw Error(o(475));
    var a = Wa;
    if (e.type === "stylesheet" && (typeof n.media != "string" || matchMedia(n.media).matches !== !1) && (e.state.loading & 4) === 0) {
      if (e.instance === null) {
        var s = Ji(n.href), r = t.querySelector(
          Ja(s)
        );
        if (r) {
          t = r._p, t !== null && typeof t == "object" && typeof t.then == "function" && (a.count++, a = Cs.bind(a), t.then(a, a)), e.state.loading |= 4, e.instance = r, Kt(r);
          return;
        }
        r = t.ownerDocument || t, n = _m(n), (s = we.get(s)) && xr(n, s), r = r.createElement("link"), Kt(r);
        var d = r;
        d._p = new Promise(function(y, T) {
          d.onload = y, d.onerror = T;
        }), $t(r, "link", n), e.instance = r;
      }
      a.stylesheets === null && (a.stylesheets = /* @__PURE__ */ new Map()), a.stylesheets.set(e, t), (t = e.state.preload) && (e.state.loading & 3) === 0 && (a.count++, e = Cs.bind(a), t.addEventListener("load", e), t.addEventListener("error", e));
    }
  }
  function z1() {
    if (Wa === null) throw Error(o(475));
    var t = Wa;
    return t.stylesheets && t.count === 0 && Mr(t, t.stylesheets), 0 < t.count ? function(e) {
      var n = setTimeout(function() {
        if (t.stylesheets && Mr(t, t.stylesheets), t.unsuspend) {
          var a = t.unsuspend;
          t.unsuspend = null, a();
        }
      }, 6e4);
      return t.unsuspend = e, function() {
        t.unsuspend = null, clearTimeout(n);
      };
    } : null;
  }
  function Cs() {
    if (this.count--, this.count === 0) {
      if (this.stylesheets) Mr(this, this.stylesheets);
      else if (this.unsuspend) {
        var t = this.unsuspend;
        this.unsuspend = null, t();
      }
    }
  }
  var Os = null;
  function Mr(t, e) {
    t.stylesheets = null, t.unsuspend !== null && (t.count++, Os = /* @__PURE__ */ new Map(), e.forEach(_1, t), Os = null, Cs.call(t));
  }
  function _1(t, e) {
    if (!(e.state.loading & 4)) {
      var n = Os.get(t);
      if (n) var a = n.get(null);
      else {
        n = /* @__PURE__ */ new Map(), Os.set(t, n);
        for (var s = t.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), r = 0; r < s.length; r++) {
          var d = s[r];
          (d.nodeName === "LINK" || d.getAttribute("media") !== "not all") && (n.set(d.dataset.precedence, d), a = d);
        }
        a && n.set(null, a);
      }
      s = e.instance, d = s.getAttribute("data-precedence"), r = n.get(d) || a, r === a && n.set(null, s), n.set(d, s), this.count++, a = Cs.bind(this), s.addEventListener("load", a), s.addEventListener("error", a), r ? r.parentNode.insertBefore(s, r.nextSibling) : (t = t.nodeType === 9 ? t.head : t, t.insertBefore(s, t.firstChild)), e.state.loading |= 4;
    }
  }
  var $a = {
    $$typeof: q,
    Provider: null,
    Consumer: null,
    _currentValue: J,
    _currentValue2: J,
    _threadCount: 0
  };
  function B1(t, e, n, a, s, r, d, y) {
    this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = bu(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = bu(0), this.hiddenUpdates = bu(null), this.identifierPrefix = a, this.onUncaughtError = s, this.onCaughtError = r, this.onRecoverableError = d, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = y, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Lm(t, e, n, a, s, r, d, y, T, R, _, U) {
    return t = new B1(
      t,
      e,
      n,
      d,
      y,
      T,
      R,
      U
    ), e = 1, r === !0 && (e |= 24), r = ye(3, null, null, e), t.current = r, r.stateNode = t, e = lo(), e.refCount++, t.pooledCache = e, e.refCount++, r.memoizedState = {
      element: a,
      isDehydrated: n,
      cache: e
    }, ro(r), t;
  }
  function Hm(t) {
    return t ? (t = Ri, t) : Ri;
  }
  function qm(t, e, n, a, s, r) {
    s = Hm(s), a.context === null ? a.context = s : a.pendingContext = s, a = Sn(e), a.payload = { element: n }, r = r === void 0 ? null : r, r !== null && (a.callback = r), n = bn(t, a, e), n !== null && (Te(n, t, e), Ca(n, t, e));
  }
  function Ym(t, e) {
    if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
      var n = t.retryLane;
      t.retryLane = n !== 0 && n < e ? n : e;
    }
  }
  function Dr(t, e) {
    Ym(t, e), (t = t.alternate) && Ym(t, e);
  }
  function Gm(t) {
    if (t.tag === 13) {
      var e = Di(t, 67108864);
      e !== null && Te(e, t, 67108864), Dr(t, 67108864);
    }
  }
  var Vs = !0;
  function N1(t, e, n, a) {
    var s = w.T;
    w.T = null;
    var r = K.p;
    try {
      K.p = 2, Rr(t, e, n, a);
    } finally {
      K.p = r, w.T = s;
    }
  }
  function U1(t, e, n, a) {
    var s = w.T;
    w.T = null;
    var r = K.p;
    try {
      K.p = 8, Rr(t, e, n, a);
    } finally {
      K.p = r, w.T = s;
    }
  }
  function Rr(t, e, n, a) {
    if (Vs) {
      var s = Cr(a);
      if (s === null)
        mr(
          t,
          e,
          a,
          ws,
          n
        ), Zm(t, a);
      else if (L1(
        s,
        t,
        e,
        n,
        a
      ))
        a.stopPropagation();
      else if (Zm(t, a), e & 4 && -1 < j1.indexOf(t)) {
        for (; s !== null; ) {
          var r = mi(s);
          if (r !== null)
            switch (r.tag) {
              case 3:
                if (r = r.stateNode, r.current.memoizedState.isDehydrated) {
                  var d = Gn(r.pendingLanes);
                  if (d !== 0) {
                    var y = r;
                    for (y.pendingLanes |= 2, y.entangledLanes |= 2; d; ) {
                      var T = 1 << 31 - me(d);
                      y.entanglements[1] |= T, d &= ~T;
                    }
                    Ke(r), (bt & 6) === 0 && (ms = qe() + 500, Ka(0));
                  }
                }
                break;
              case 13:
                y = Di(r, 2), y !== null && Te(y, r, 2), ys(), Dr(r, 2);
            }
          if (r = Cr(a), r === null && mr(
            t,
            e,
            a,
            ws,
            n
          ), r === s) break;
          s = r;
        }
        s !== null && a.stopPropagation();
      } else
        mr(
          t,
          e,
          a,
          null,
          n
        );
    }
  }
  function Cr(t) {
    return t = zu(t), Or(t);
  }
  var ws = null;
  function Or(t) {
    if (ws = null, t = di(t), t !== null) {
      var e = h(t);
      if (e === null) t = null;
      else {
        var n = e.tag;
        if (n === 13) {
          if (t = f(e), t !== null) return t;
          t = null;
        } else if (n === 3) {
          if (e.stateNode.current.memoizedState.isDehydrated)
            return e.tag === 3 ? e.stateNode.containerInfo : null;
          t = null;
        } else e !== t && (t = null);
      }
    }
    return ws = t, null;
  }
  function Xm(t) {
    switch (t) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (A0()) {
          case nf:
            return 2;
          case af:
            return 8;
          case xl:
          case x0:
            return 32;
          case lf:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Vr = !1, _n = null, Bn = null, Nn = null, Ia = /* @__PURE__ */ new Map(), tl = /* @__PURE__ */ new Map(), Un = [], j1 = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function Zm(t, e) {
    switch (t) {
      case "focusin":
      case "focusout":
        _n = null;
        break;
      case "dragenter":
      case "dragleave":
        Bn = null;
        break;
      case "mouseover":
      case "mouseout":
        Nn = null;
        break;
      case "pointerover":
      case "pointerout":
        Ia.delete(e.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        tl.delete(e.pointerId);
    }
  }
  function el(t, e, n, a, s, r) {
    return t === null || t.nativeEvent !== r ? (t = {
      blockedOn: e,
      domEventName: n,
      eventSystemFlags: a,
      nativeEvent: r,
      targetContainers: [s]
    }, e !== null && (e = mi(e), e !== null && Gm(e)), t) : (t.eventSystemFlags |= a, e = t.targetContainers, s !== null && e.indexOf(s) === -1 && e.push(s), t);
  }
  function L1(t, e, n, a, s) {
    switch (e) {
      case "focusin":
        return _n = el(
          _n,
          t,
          e,
          n,
          a,
          s
        ), !0;
      case "dragenter":
        return Bn = el(
          Bn,
          t,
          e,
          n,
          a,
          s
        ), !0;
      case "mouseover":
        return Nn = el(
          Nn,
          t,
          e,
          n,
          a,
          s
        ), !0;
      case "pointerover":
        var r = s.pointerId;
        return Ia.set(
          r,
          el(
            Ia.get(r) || null,
            t,
            e,
            n,
            a,
            s
          )
        ), !0;
      case "gotpointercapture":
        return r = s.pointerId, tl.set(
          r,
          el(
            tl.get(r) || null,
            t,
            e,
            n,
            a,
            s
          )
        ), !0;
    }
    return !1;
  }
  function Km(t) {
    var e = di(t.target);
    if (e !== null) {
      var n = h(e);
      if (n !== null) {
        if (e = n.tag, e === 13) {
          if (e = f(n), e !== null) {
            t.blockedOn = e, w0(t.priority, function() {
              if (n.tag === 13) {
                var a = be();
                a = Tu(a);
                var s = Di(n, a);
                s !== null && Te(s, n, a), Dr(n, a);
              }
            });
            return;
          }
        } else if (e === 3 && n.stateNode.current.memoizedState.isDehydrated) {
          t.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
          return;
        }
      }
    }
    t.blockedOn = null;
  }
  function zs(t) {
    if (t.blockedOn !== null) return !1;
    for (var e = t.targetContainers; 0 < e.length; ) {
      var n = Cr(t.nativeEvent);
      if (n === null) {
        n = t.nativeEvent;
        var a = new n.constructor(
          n.type,
          n
        );
        wu = a, n.target.dispatchEvent(a), wu = null;
      } else
        return e = mi(n), e !== null && Gm(e), t.blockedOn = n, !1;
      e.shift();
    }
    return !0;
  }
  function Qm(t, e, n) {
    zs(t) && n.delete(e);
  }
  function H1() {
    Vr = !1, _n !== null && zs(_n) && (_n = null), Bn !== null && zs(Bn) && (Bn = null), Nn !== null && zs(Nn) && (Nn = null), Ia.forEach(Qm), tl.forEach(Qm);
  }
  function _s(t, e) {
    t.blockedOn === e && (t.blockedOn = null, Vr || (Vr = !0, i.unstable_scheduleCallback(
      i.unstable_NormalPriority,
      H1
    )));
  }
  var Bs = null;
  function km(t) {
    Bs !== t && (Bs = t, i.unstable_scheduleCallback(
      i.unstable_NormalPriority,
      function() {
        Bs === t && (Bs = null);
        for (var e = 0; e < t.length; e += 3) {
          var n = t[e], a = t[e + 1], s = t[e + 2];
          if (typeof a != "function") {
            if (Or(a || n) === null)
              continue;
            break;
          }
          var r = mi(n);
          r !== null && (t.splice(e, 3), e -= 3, Oo(
            r,
            {
              pending: !0,
              data: s,
              method: n.method,
              action: a
            },
            a,
            s
          ));
        }
      }
    ));
  }
  function nl(t) {
    function e(T) {
      return _s(T, t);
    }
    _n !== null && _s(_n, t), Bn !== null && _s(Bn, t), Nn !== null && _s(Nn, t), Ia.forEach(e), tl.forEach(e);
    for (var n = 0; n < Un.length; n++) {
      var a = Un[n];
      a.blockedOn === t && (a.blockedOn = null);
    }
    for (; 0 < Un.length && (n = Un[0], n.blockedOn === null); )
      Km(n), n.blockedOn === null && Un.shift();
    if (n = (t.ownerDocument || t).$$reactFormReplay, n != null)
      for (a = 0; a < n.length; a += 3) {
        var s = n[a], r = n[a + 1], d = s[ue] || null;
        if (typeof r == "function")
          d || km(n);
        else if (d) {
          var y = null;
          if (r && r.hasAttribute("formAction")) {
            if (s = r, d = r[ue] || null)
              y = d.formAction;
            else if (Or(s) !== null) continue;
          } else y = d.action;
          typeof y == "function" ? n[a + 1] = y : (n.splice(a, 3), a -= 3), km(n);
        }
      }
  }
  function wr(t) {
    this._internalRoot = t;
  }
  Ns.prototype.render = wr.prototype.render = function(t) {
    var e = this._internalRoot;
    if (e === null) throw Error(o(409));
    var n = e.current, a = be();
    qm(n, a, t, e, null, null);
  }, Ns.prototype.unmount = wr.prototype.unmount = function() {
    var t = this._internalRoot;
    if (t !== null) {
      this._internalRoot = null;
      var e = t.containerInfo;
      qm(t.current, 2, null, t, null, null), ys(), e[hi] = null;
    }
  };
  function Ns(t) {
    this._internalRoot = t;
  }
  Ns.prototype.unstable_scheduleHydration = function(t) {
    if (t) {
      var e = cf();
      t = { blockedOn: null, target: t, priority: e };
      for (var n = 0; n < Un.length && e !== 0 && e < Un[n].priority; n++) ;
      Un.splice(n, 0, t), n === 0 && Km(t);
    }
  };
  var Pm = l.version;
  if (Pm !== "19.1.0")
    throw Error(
      o(
        527,
        Pm,
        "19.1.0"
      )
    );
  K.findDOMNode = function(t) {
    var e = t._reactInternals;
    if (e === void 0)
      throw typeof t.render == "function" ? Error(o(188)) : (t = Object.keys(t).join(","), Error(o(268, t)));
    return t = v(e), t = t !== null ? p(t) : null, t = t === null ? null : t.stateNode, t;
  };
  var q1 = {
    bundleType: 0,
    version: "19.1.0",
    rendererPackageName: "react-dom",
    currentDispatcherRef: w,
    reconcilerVersion: "19.1.0"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Us = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Us.isDisabled && Us.supportsFiber)
      try {
        sa = Us.inject(
          q1
        ), de = Us;
      } catch {
      }
  }
  return al.createRoot = function(t, e) {
    if (!c(t)) throw Error(o(299));
    var n = !1, a = "", s = cd, r = fd, d = hd, y = null;
    return e != null && (e.unstable_strictMode === !0 && (n = !0), e.identifierPrefix !== void 0 && (a = e.identifierPrefix), e.onUncaughtError !== void 0 && (s = e.onUncaughtError), e.onCaughtError !== void 0 && (r = e.onCaughtError), e.onRecoverableError !== void 0 && (d = e.onRecoverableError), e.unstable_transitionCallbacks !== void 0 && (y = e.unstable_transitionCallbacks)), e = Lm(
      t,
      1,
      !1,
      null,
      null,
      n,
      a,
      s,
      r,
      d,
      y,
      null
    ), t[hi] = e.current, dr(t), new wr(e);
  }, al.hydrateRoot = function(t, e, n) {
    if (!c(t)) throw Error(o(299));
    var a = !1, s = "", r = cd, d = fd, y = hd, T = null, R = null;
    return n != null && (n.unstable_strictMode === !0 && (a = !0), n.identifierPrefix !== void 0 && (s = n.identifierPrefix), n.onUncaughtError !== void 0 && (r = n.onUncaughtError), n.onCaughtError !== void 0 && (d = n.onCaughtError), n.onRecoverableError !== void 0 && (y = n.onRecoverableError), n.unstable_transitionCallbacks !== void 0 && (T = n.unstable_transitionCallbacks), n.formState !== void 0 && (R = n.formState)), e = Lm(
      t,
      1,
      !0,
      e,
      n ?? null,
      a,
      s,
      r,
      d,
      y,
      T,
      R
    ), e.context = Hm(null), n = e.current, a = be(), a = Tu(a), s = Sn(a), s.callback = null, bn(n, s, a), n = a, e.current.lanes = n, oa(e, n), Ke(e), t[hi] = e.current, dr(t), new Ns(e);
  }, al.version = "19.1.0", al;
}
var ap;
function F1() {
  if (ap) return Br.exports;
  ap = 1;
  function i() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(i);
      } catch (l) {
        console.error(l);
      }
  }
  return i(), Br.exports = J1(), Br.exports;
}
var W1 = F1(), lp = My();
const Rc = Y.createContext({});
function ou(i) {
  const l = Y.useRef(null);
  return l.current === null && (l.current = i()), l.current;
}
const $1 = typeof window < "u", Cc = $1 ? Y.useLayoutEffect : Y.useEffect, ru = /* @__PURE__ */ Y.createContext(null);
function Oc(i, l) {
  i.indexOf(l) === -1 && i.push(l);
}
function Ws(i, l) {
  const u = i.indexOf(l);
  u > -1 && i.splice(u, 1);
}
const Je = (i, l, u) => u > l ? l : u < i ? i : u;
let cu = () => {
};
const Hn = {}, Dy = (i) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(i), Ry = (i) => typeof i == "object" && i !== null, Cy = (i) => /^0[^.\s]+$/u.test(i);
// @__NO_SIDE_EFFECTS__
function Oy(i) {
  let l;
  return () => (l === void 0 && (l = i()), l);
}
const _e = /* @__NO_SIDE_EFFECTS__ */ (i) => i, vl = (...i) => i.reduce((l, u) => (o) => u(l(o))), hl = /* @__NO_SIDE_EFFECTS__ */ (i, l, u) => {
  const o = l - i;
  return o ? (u - i) / o : 1;
};
class Vc {
  constructor() {
    this.subscriptions = [];
  }
  add(l) {
    return Oc(this.subscriptions, l), () => Ws(this.subscriptions, l);
  }
  notify(l, u, o) {
    const c = this.subscriptions.length;
    if (c)
      if (c === 1)
        this.subscriptions[0](l, u, o);
      else
        for (let h = 0; h < c; h++) {
          const f = this.subscriptions[h];
          f && f(l, u, o);
        }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
const Ae = /* @__NO_SIDE_EFFECTS__ */ (i) => i * 1e3, ze = /* @__NO_SIDE_EFFECTS__ */ (i) => i / 1e3, Vy = /* @__NO_SIDE_EFFECTS__ */ (i, l) => l ? i * (1e3 / l) : 0, wy = (i, l, u) => (((1 - 3 * u + 3 * l) * i + (3 * u - 6 * l)) * i + 3 * l) * i, I1 = 1e-7, tS = 12;
function eS(i, l, u, o, c) {
  let h, f, m = 0;
  do
    f = l + (u - l) / 2, h = wy(f, o, c) - i, h > 0 ? u = f : l = f;
  while (Math.abs(h) > I1 && ++m < tS);
  return f;
}
// @__NO_SIDE_EFFECTS__
function Sl(i, l, u, o) {
  if (i === l && u === o)
    return _e;
  const c = (h) => eS(h, 0, 1, i, u);
  return (h) => h === 0 || h === 1 ? h : wy(c(h), l, o);
}
const zy = /* @__NO_SIDE_EFFECTS__ */ (i) => (l) => l <= 0.5 ? i(2 * l) / 2 : (2 - i(2 * (1 - l))) / 2, _y = /* @__NO_SIDE_EFFECTS__ */ (i) => (l) => 1 - i(1 - l), By = /* @__PURE__ */ Sl(0.33, 1.53, 0.69, 0.99), wc = /* @__PURE__ */ _y(By), Ny = /* @__PURE__ */ zy(wc), Uy = (i) => i >= 1 ? 1 : (i *= 2) < 1 ? 0.5 * wc(i) : 0.5 * (2 - Math.pow(2, -10 * (i - 1))), zc = (i) => 1 - Math.sin(Math.acos(i)), jy = /* @__PURE__ */ _y(zc), Ly = /* @__PURE__ */ zy(zc), nS = /* @__PURE__ */ Sl(0.42, 0, 1, 1), iS = /* @__PURE__ */ Sl(0, 0, 0.58, 1), Hy = /* @__PURE__ */ Sl(0.42, 0, 0.58, 1), aS = /* @__NO_SIDE_EFFECTS__ */ (i) => Array.isArray(i) && typeof i[0] != "number", qy = /* @__NO_SIDE_EFFECTS__ */ (i) => Array.isArray(i) && typeof i[0] == "number", lS = {
  linear: _e,
  easeIn: nS,
  easeInOut: Hy,
  easeOut: iS,
  circIn: zc,
  circInOut: Ly,
  circOut: jy,
  backIn: wc,
  backInOut: Ny,
  backOut: By,
  anticipate: Uy
}, sS = (i) => typeof i == "string", sp = (i) => {
  if (/* @__PURE__ */ qy(i)) {
    cu(i.length === 4);
    const [l, u, o, c] = i;
    return /* @__PURE__ */ Sl(l, u, o, c);
  } else if (sS(i))
    return lS[i];
  return i;
}, js = [
  "setup",
  // Compute
  "read",
  // Read
  "resolveKeyframes",
  // Write/Read/Write/Read
  "preUpdate",
  // Compute
  "update",
  // Compute
  "preRender",
  // Compute
  "render",
  // Write
  "postRender"
  // Compute
];
function uS(i) {
  let l = /* @__PURE__ */ new Set(), u = /* @__PURE__ */ new Set(), o = !1, c = !1;
  const h = /* @__PURE__ */ new WeakSet();
  let f = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  };
  function m(p) {
    h.has(p) && (v.schedule(p), i()), p(f);
  }
  const v = {
    /**
     * Schedule a process to run on the next frame.
     */
    schedule: (p, g = !1, S = !1) => {
      const V = S && o ? l : u;
      return g && h.add(p), V.add(p), p;
    },
    /**
     * Cancel the provided callback from running on the next frame.
     */
    cancel: (p) => {
      u.delete(p), h.delete(p);
    },
    /**
     * Execute all schedule callbacks.
     */
    process: (p) => {
      if (f = p, o) {
        c = !0;
        return;
      }
      o = !0;
      const g = l;
      l = u, u = g, l.forEach(m), l.clear(), o = !1, c && (c = !1, v.process(p));
    }
  };
  return v;
}
const oS = 40;
function Yy(i, l) {
  let u = !1, o = !0;
  const c = {
    delta: 0,
    timestamp: 0,
    isProcessing: !1
  }, h = () => u = !0, f = js.reduce((q, G) => (q[G] = uS(h), q), {}), { setup: m, read: v, resolveKeyframes: p, preUpdate: g, update: S, preRender: b, render: V, postRender: D } = f, z = () => {
    const q = Hn.useManualTiming, G = q ? c.timestamp : performance.now();
    u = !1, q || (c.delta = o ? 1e3 / 60 : Math.max(Math.min(G - c.timestamp, oS), 1)), c.timestamp = G, c.isProcessing = !0, m.process(c), v.process(c), p.process(c), g.process(c), S.process(c), b.process(c), V.process(c), D.process(c), c.isProcessing = !1, u && l && (o = !1, i(z));
  }, B = () => {
    u = !0, o = !0, c.isProcessing || i(z);
  };
  return { schedule: js.reduce((q, G) => {
    const Z = f[G];
    return q[G] = (it, at = !1, P = !1) => (u || B(), Z.schedule(it, at, P)), q;
  }, {}), cancel: (q) => {
    for (let G = 0; G < js.length; G++)
      f[js[G]].cancel(q);
  }, state: c, steps: f };
}
const { schedule: Rt, cancel: qn, state: It, steps: Lr } = /* @__PURE__ */ Yy(typeof requestAnimationFrame < "u" ? requestAnimationFrame : _e, !0);
let Gs;
function rS() {
  Gs = void 0;
}
const le = {
  now: () => (Gs === void 0 && le.set(It.isProcessing || Hn.useManualTiming ? It.timestamp : performance.now()), Gs),
  set: (i) => {
    Gs = i, queueMicrotask(rS);
  }
}, Gy = (i) => (l) => typeof l == "string" && l.startsWith(i), Xy = /* @__PURE__ */ Gy("--"), cS = /* @__PURE__ */ Gy("var(--"), _c = (i) => cS(i) ? fS.test(i.split("/*")[0].trim()) : !1, fS = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
function up(i) {
  return typeof i != "string" ? !1 : i.split("/*")[0].includes("var(--");
}
const ia = {
  test: (i) => typeof i == "number",
  parse: parseFloat,
  transform: (i) => i
}, dl = {
  ...ia,
  transform: (i) => Je(0, 1, i)
}, Ls = {
  ...ia,
  default: 1
}, ul = (i) => Math.round(i * 1e5) / 1e5, Bc = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
function hS(i) {
  return i == null;
}
const dS = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu, Nc = (i, l) => (u) => !!(typeof u == "string" && dS.test(u) && u.startsWith(i) || l && !hS(u) && Object.prototype.hasOwnProperty.call(u, l)), Zy = (i, l, u) => (o) => {
  if (typeof o != "string")
    return o;
  const [c, h, f, m] = o.match(Bc);
  return {
    [i]: parseFloat(c),
    [l]: parseFloat(h),
    [u]: parseFloat(f),
    alpha: m !== void 0 ? parseFloat(m) : 1
  };
}, mS = (i) => Je(0, 255, i), Hr = {
  ...ia,
  transform: (i) => Math.round(mS(i))
}, oi = {
  test: /* @__PURE__ */ Nc("rgb", "red"),
  parse: /* @__PURE__ */ Zy("red", "green", "blue"),
  transform: ({ red: i, green: l, blue: u, alpha: o = 1 }) => "rgba(" + Hr.transform(i) + ", " + Hr.transform(l) + ", " + Hr.transform(u) + ", " + ul(dl.transform(o)) + ")"
};
function pS(i) {
  let l = "", u = "", o = "", c = "";
  return i.length > 5 ? (l = i.substring(1, 3), u = i.substring(3, 5), o = i.substring(5, 7), c = i.substring(7, 9)) : (l = i.substring(1, 2), u = i.substring(2, 3), o = i.substring(3, 4), c = i.substring(4, 5), l += l, u += u, o += o, c += c), {
    red: parseInt(l, 16),
    green: parseInt(u, 16),
    blue: parseInt(o, 16),
    alpha: c ? parseInt(c, 16) / 255 : 1
  };
}
const ec = {
  test: /* @__PURE__ */ Nc("#"),
  parse: pS,
  transform: oi.transform
}, bl = /* @__NO_SIDE_EFFECTS__ */ (i) => ({
  test: (l) => typeof l == "string" && l.endsWith(i) && l.split(" ").length === 1,
  parse: parseFloat,
  transform: (l) => `${l}${i}`
}), hn = /* @__PURE__ */ bl("deg"), Pe = /* @__PURE__ */ bl("%"), W = /* @__PURE__ */ bl("px"), yS = /* @__PURE__ */ bl("vh"), gS = /* @__PURE__ */ bl("vw"), op = {
  ...Pe,
  parse: (i) => Pe.parse(i) / 100,
  transform: (i) => Pe.transform(i * 100)
}, $i = {
  test: /* @__PURE__ */ Nc("hsl", "hue"),
  parse: /* @__PURE__ */ Zy("hue", "saturation", "lightness"),
  transform: ({ hue: i, saturation: l, lightness: u, alpha: o = 1 }) => "hsla(" + Math.round(i) + ", " + Pe.transform(ul(l)) + ", " + Pe.transform(ul(u)) + ", " + ul(dl.transform(o)) + ")"
}, qt = {
  test: (i) => oi.test(i) || ec.test(i) || $i.test(i),
  parse: (i) => oi.test(i) ? oi.parse(i) : $i.test(i) ? $i.parse(i) : ec.parse(i),
  transform: (i) => typeof i == "string" ? i : i.hasOwnProperty("red") ? oi.transform(i) : $i.transform(i),
  getAnimatableNone: (i) => {
    const l = qt.parse(i);
    return l.alpha = 0, qt.transform(l);
  }
}, vS = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
function SS(i) {
  return isNaN(i) && typeof i == "string" && (i.match(Bc)?.length || 0) + (i.match(vS)?.length || 0) > 0;
}
const Ky = "number", Qy = "color", bS = "var", TS = "var(", rp = "${}", AS = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function ea(i) {
  const l = i.toString(), u = [], o = {
    color: [],
    number: [],
    var: []
  }, c = [];
  let h = 0;
  const m = l.replace(AS, (v) => (qt.test(v) ? (o.color.push(h), c.push(Qy), u.push(qt.parse(v))) : v.startsWith(TS) ? (o.var.push(h), c.push(bS), u.push(v)) : (o.number.push(h), c.push(Ky), u.push(parseFloat(v))), ++h, rp)).split(rp);
  return { values: u, split: m, indexes: o, types: c };
}
function xS(i) {
  return ea(i).values;
}
function ky({ split: i, types: l }) {
  const u = i.length;
  return (o) => {
    let c = "";
    for (let h = 0; h < u; h++)
      if (c += i[h], o[h] !== void 0) {
        const f = l[h];
        f === Ky ? c += ul(o[h]) : f === Qy ? c += qt.transform(o[h]) : c += o[h];
      }
    return c;
  };
}
function ES(i) {
  return ky(ea(i));
}
const MS = (i) => typeof i == "number" ? 0 : qt.test(i) ? qt.getAnimatableNone(i) : i, DS = (i, l) => typeof i == "number" ? l?.trim().endsWith("/") ? i : 0 : MS(i);
function RS(i) {
  const l = ea(i);
  return ky(l)(l.values.map((o, c) => DS(o, l.split[c])));
}
const He = {
  test: SS,
  parse: xS,
  createTransformer: ES,
  getAnimatableNone: RS
};
function qr(i, l, u) {
  return u < 0 && (u += 1), u > 1 && (u -= 1), u < 1 / 6 ? i + (l - i) * 6 * u : u < 1 / 2 ? l : u < 2 / 3 ? i + (l - i) * (2 / 3 - u) * 6 : i;
}
function CS({ hue: i, saturation: l, lightness: u, alpha: o }) {
  i /= 360, l /= 100, u /= 100;
  let c = 0, h = 0, f = 0;
  if (!l)
    c = h = f = u;
  else {
    const m = u < 0.5 ? u * (1 + l) : u + l - u * l, v = 2 * u - m;
    c = qr(v, m, i + 1 / 3), h = qr(v, m, i), f = qr(v, m, i - 1 / 3);
  }
  return {
    red: Math.round(c * 255),
    green: Math.round(h * 255),
    blue: Math.round(f * 255),
    alpha: o
  };
}
function $s(i, l) {
  return (u) => u > 0 ? l : i;
}
const Dt = (i, l, u) => i + (l - i) * u, Yr = (i, l, u) => {
  const o = i * i, c = u * (l * l - o) + o;
  return c < 0 ? 0 : Math.sqrt(c);
}, OS = [ec, oi, $i], VS = (i) => OS.find((l) => l.test(i));
function cp(i) {
  const l = VS(i);
  if (!l)
    return !1;
  let u = l.parse(i);
  return l === $i && (u = CS(u)), u;
}
const fp = (i, l) => {
  const u = cp(i), o = cp(l);
  if (!u || !o)
    return $s(i, l);
  const c = { ...u };
  return (h) => (c.red = Yr(u.red, o.red, h), c.green = Yr(u.green, o.green, h), c.blue = Yr(u.blue, o.blue, h), c.alpha = Dt(u.alpha, o.alpha, h), oi.transform(c));
}, nc = /* @__PURE__ */ new Set(["none", "hidden"]);
function wS(i, l) {
  return nc.has(i) ? (u) => u <= 0 ? i : l : (u) => u >= 1 ? l : i;
}
function zS(i, l) {
  return (u) => Dt(i, l, u);
}
function Uc(i) {
  return typeof i == "number" ? zS : typeof i == "string" ? _c(i) ? $s : qt.test(i) ? fp : NS : Array.isArray(i) ? Py : typeof i == "object" ? qt.test(i) ? fp : _S : $s;
}
function Py(i, l) {
  const u = [...i], o = u.length, c = i.map((h, f) => Uc(h)(h, l[f]));
  return (h) => {
    for (let f = 0; f < o; f++)
      u[f] = c[f](h);
    return u;
  };
}
function _S(i, l) {
  const u = { ...i, ...l }, o = {};
  for (const c in u)
    i[c] !== void 0 && l[c] !== void 0 && (o[c] = Uc(i[c])(i[c], l[c]));
  return (c) => {
    for (const h in o)
      u[h] = o[h](c);
    return u;
  };
}
function BS(i, l) {
  const u = [], o = { color: 0, var: 0, number: 0 };
  for (let c = 0; c < l.values.length; c++) {
    const h = l.types[c], f = i.indexes[h][o[h]], m = i.values[f] ?? 0;
    u[c] = m, o[h]++;
  }
  return u;
}
const NS = (i, l) => {
  const u = He.createTransformer(l), o = ea(i), c = ea(l);
  return o.indexes.var.length === c.indexes.var.length && o.indexes.color.length === c.indexes.color.length && o.indexes.number.length >= c.indexes.number.length ? nc.has(i) && !c.values.length || nc.has(l) && !o.values.length ? wS(i, l) : vl(Py(BS(o, c), c.values), u) : $s(i, l);
};
function Jy(i, l, u) {
  return typeof i == "number" && typeof l == "number" && typeof u == "number" ? Dt(i, l, u) : Uc(i)(i, l);
}
const US = (i) => {
  const l = ({ timestamp: u }) => i(u);
  return {
    start: (u = !0) => Rt.update(l, u),
    stop: () => qn(l),
    /**
     * If we're processing this frame we can use the
     * framelocked timestamp to keep things in sync.
     */
    now: () => It.isProcessing ? It.timestamp : le.now()
  };
}, Fy = (i, l, u = 10) => {
  let o = "";
  const c = Math.max(Math.round(l / u), 2);
  for (let h = 0; h < c; h++)
    o += Math.round(i(h / (c - 1)) * 1e4) / 1e4 + ", ";
  return `linear(${o.substring(0, o.length - 2)})`;
}, Is = 2e4;
function jc(i) {
  let l = 0;
  const u = 50;
  let o = i.next(l);
  for (; !o.done && l < Is; )
    l += u, o = i.next(l);
  return l >= Is ? 1 / 0 : l;
}
function jS(i, l = 100, u) {
  const o = u({ ...i, keyframes: [0, l] }), c = Math.min(jc(o), Is);
  return {
    type: "keyframes",
    ease: (h) => o.next(c * h).value / l,
    duration: /* @__PURE__ */ ze(c)
  };
}
const Nt = {
  // Default spring physics
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  // Default duration/bounce-based options
  duration: 800,
  // in ms
  bounce: 0.3,
  visualDuration: 0.3,
  // in seconds
  // Rest thresholds
  restSpeed: {
    granular: 0.01,
    default: 2
  },
  restDelta: {
    granular: 5e-3,
    default: 0.5
  },
  // Limits
  minDuration: 0.01,
  // in seconds
  maxDuration: 10,
  // in seconds
  minDamping: 0.05,
  maxDamping: 1
};
function ic(i, l) {
  return i * Math.sqrt(1 - l * l);
}
const LS = 12;
function HS(i, l, u) {
  let o = u;
  for (let c = 1; c < LS; c++)
    o = o - i(o) / l(o);
  return o;
}
const Gr = 1e-3;
function qS({ duration: i = Nt.duration, bounce: l = Nt.bounce, velocity: u = Nt.velocity, mass: o = Nt.mass }) {
  let c, h, f = 1 - l;
  f = Je(Nt.minDamping, Nt.maxDamping, f), i = Je(Nt.minDuration, Nt.maxDuration, /* @__PURE__ */ ze(i)), f < 1 ? (c = (p) => {
    const g = p * f, S = g * i, b = g - u, V = ic(p, f), D = Math.exp(-S);
    return Gr - b / V * D;
  }, h = (p) => {
    const S = p * f * i, b = S * u + u, V = Math.pow(f, 2) * Math.pow(p, 2) * i, D = Math.exp(-S), z = ic(Math.pow(p, 2), f);
    return (-c(p) + Gr > 0 ? -1 : 1) * ((b - V) * D) / z;
  }) : (c = (p) => {
    const g = Math.exp(-p * i), S = (p - u) * i + 1;
    return -Gr + g * S;
  }, h = (p) => {
    const g = Math.exp(-p * i), S = (u - p) * (i * i);
    return g * S;
  });
  const m = 5 / i, v = HS(c, h, m);
  if (i = /* @__PURE__ */ Ae(i), isNaN(v))
    return {
      stiffness: Nt.stiffness,
      damping: Nt.damping,
      duration: i
    };
  {
    const p = Math.pow(v, 2) * o;
    return {
      stiffness: p,
      damping: f * 2 * Math.sqrt(o * p),
      duration: i
    };
  }
}
const YS = ["duration", "bounce"], GS = ["stiffness", "damping", "mass"];
function hp(i, l) {
  return l.some((u) => i[u] !== void 0);
}
function XS(i) {
  let l = {
    velocity: Nt.velocity,
    stiffness: Nt.stiffness,
    damping: Nt.damping,
    mass: Nt.mass,
    isResolvedFromDuration: !1,
    ...i
  };
  if (!hp(i, GS) && hp(i, YS))
    if (l.velocity = 0, i.visualDuration) {
      const u = i.visualDuration, o = 2 * Math.PI / (u * 1.2), c = o * o, h = 2 * Je(0.05, 1, 1 - (i.bounce || 0)) * Math.sqrt(c);
      l = {
        ...l,
        mass: Nt.mass,
        stiffness: c,
        damping: h
      };
    } else {
      const u = qS({ ...i, velocity: 0 });
      l = {
        ...l,
        ...u,
        mass: Nt.mass
      }, l.isResolvedFromDuration = !0;
    }
  return l;
}
function tu(i = Nt.visualDuration, l = Nt.bounce) {
  const u = typeof i != "object" ? {
    visualDuration: i,
    keyframes: [0, 1],
    bounce: l
  } : i;
  let { restSpeed: o, restDelta: c } = u;
  const h = u.keyframes[0], f = u.keyframes[u.keyframes.length - 1], m = { done: !1, value: h }, { stiffness: v, damping: p, mass: g, duration: S, velocity: b, isResolvedFromDuration: V } = XS({
    ...u,
    velocity: -/* @__PURE__ */ ze(u.velocity || 0)
  }), D = b || 0, z = p / (2 * Math.sqrt(v * g)), B = f - h, H = /* @__PURE__ */ ze(Math.sqrt(v / g)), X = Math.abs(B) < 5;
  o || (o = X ? Nt.restSpeed.granular : Nt.restSpeed.default), c || (c = X ? Nt.restDelta.granular : Nt.restDelta.default);
  let q, G, Z, it, at, P;
  if (z < 1)
    Z = ic(H, z), it = (D + z * H * B) / Z, q = ($) => {
      const mt = Math.exp(-z * H * $);
      return f - mt * (it * Math.sin(Z * $) + B * Math.cos(Z * $));
    }, at = z * H * it + B * Z, P = z * H * B - it * Z, G = ($) => Math.exp(-z * H * $) * (at * Math.sin(Z * $) + P * Math.cos(Z * $));
  else if (z === 1) {
    q = (mt) => f - Math.exp(-H * mt) * (B + (D + H * B) * mt);
    const $ = D + H * B;
    G = (mt) => Math.exp(-H * mt) * (H * $ * mt - D);
  } else {
    const $ = H * Math.sqrt(z * z - 1);
    q = (Zt) => {
      const Ct = Math.exp(-z * H * Zt), w = Math.min($ * Zt, 300);
      return f - Ct * ((D + z * H * B) * Math.sinh(w) + $ * B * Math.cosh(w)) / $;
    };
    const mt = (D + z * H * B) / $, pt = z * H * mt - B * $, Jt = z * H * B - mt * $;
    G = (Zt) => {
      const Ct = Math.exp(-z * H * Zt), w = Math.min($ * Zt, 300);
      return Ct * (pt * Math.sinh(w) + Jt * Math.cosh(w));
    };
  }
  const st = {
    calculatedDuration: V && S || null,
    velocity: ($) => /* @__PURE__ */ Ae(G($)),
    next: ($) => {
      if (!V && z < 1) {
        const pt = Math.exp(-z * H * $), Jt = Math.sin(Z * $), Zt = Math.cos(Z * $), Ct = f - pt * (it * Jt + B * Zt), w = /* @__PURE__ */ Ae(pt * (at * Jt + P * Zt));
        return m.done = Math.abs(w) <= o && Math.abs(f - Ct) <= c, m.value = m.done ? f : Ct, m;
      }
      const mt = q($);
      if (V)
        m.done = $ >= S;
      else {
        const pt = /* @__PURE__ */ Ae(G($));
        m.done = Math.abs(pt) <= o && Math.abs(f - mt) <= c;
      }
      return m.value = m.done ? f : mt, m;
    },
    toString: () => {
      const $ = Math.min(jc(st), Is), mt = Fy((pt) => st.next($ * pt).value, $, 30);
      return $ + "ms " + mt;
    },
    toTransition: () => {
    }
  };
  return st;
}
tu.applyToOptions = (i) => {
  const l = jS(i, 100, tu);
  return i.ease = l.ease, i.duration = /* @__PURE__ */ Ae(l.duration), i.type = "keyframes", i;
};
const ZS = 5;
function Wy(i, l, u) {
  const o = Math.max(l - ZS, 0);
  return /* @__PURE__ */ Vy(u - i(o), l - o);
}
function ac({ keyframes: i, velocity: l = 0, power: u = 0.8, timeConstant: o = 325, bounceDamping: c = 10, bounceStiffness: h = 500, modifyTarget: f, min: m, max: v, restDelta: p = 0.5, restSpeed: g }) {
  const S = i[0], b = {
    done: !1,
    value: S
  }, V = (P) => m !== void 0 && P < m || v !== void 0 && P > v, D = (P) => m === void 0 ? v : v === void 0 || Math.abs(m - P) < Math.abs(v - P) ? m : v;
  let z = u * l;
  const B = S + z, H = f === void 0 ? B : f(B);
  H !== B && (z = H - S);
  const X = (P) => -z * Math.exp(-P / o), q = (P) => H + X(P), G = (P) => {
    const st = X(P), $ = q(P);
    b.done = Math.abs(st) <= p, b.value = b.done ? H : $;
  };
  let Z, it;
  const at = (P) => {
    V(b.value) && (Z = P, it = tu({
      keyframes: [b.value, D(b.value)],
      velocity: Wy(q, P, b.value),
      // TODO: This should be passing * 1000
      damping: c,
      stiffness: h,
      restDelta: p,
      restSpeed: g
    }));
  };
  return at(0), {
    calculatedDuration: null,
    next: (P) => {
      let st = !1;
      return !it && Z === void 0 && (st = !0, G(P), at(P)), Z !== void 0 && P >= Z ? it.next(P - Z) : (!st && G(P), b);
    }
  };
}
function KS(i, l, u) {
  const o = [], c = u || Hn.mix || Jy, h = i.length - 1;
  for (let f = 0; f < h; f++) {
    let m = c(i[f], i[f + 1]);
    if (l) {
      const v = Array.isArray(l) ? l[f] || _e : l;
      m = vl(v, m);
    }
    o.push(m);
  }
  return o;
}
function QS(i, l, { clamp: u = !0, ease: o, mixer: c } = {}) {
  const h = i.length;
  if (cu(h === l.length), h === 1)
    return () => l[0];
  if (h === 2 && l[0] === l[1])
    return () => l[1];
  const f = i[0] === i[1];
  i[0] > i[h - 1] && (i = [...i].reverse(), l = [...l].reverse());
  const m = KS(l, o, c), v = m.length, p = (g) => {
    if (f && g < i[0])
      return l[0];
    let S = 0;
    if (v > 1)
      for (; S < i.length - 2 && !(g < i[S + 1]); S++)
        ;
    const b = /* @__PURE__ */ hl(i[S], i[S + 1], g);
    return m[S](b);
  };
  return u ? (g) => p(Je(i[0], i[h - 1], g)) : p;
}
function kS(i, l) {
  const u = i[i.length - 1];
  for (let o = 1; o <= l; o++) {
    const c = /* @__PURE__ */ hl(0, l, o);
    i.push(Dt(u, 1, c));
  }
}
function PS(i) {
  const l = [0];
  return kS(l, i.length - 1), l;
}
function JS(i, l) {
  return i.map((u) => u * l);
}
function FS(i, l) {
  return i.map(() => l || Hy).splice(0, i.length - 1);
}
function ol({ duration: i = 300, keyframes: l, times: u, ease: o = "easeInOut" }) {
  const c = /* @__PURE__ */ aS(o) ? o.map(sp) : sp(o), h = {
    done: !1,
    value: l[0]
  }, f = JS(
    // Only use the provided offsets if they're the correct length
    // TODO Maybe we should warn here if there's a length mismatch
    u && u.length === l.length ? u : PS(l),
    i
  ), m = QS(f, l, {
    ease: Array.isArray(c) ? c : FS(l, c)
  });
  return {
    calculatedDuration: i,
    next: (v) => (h.value = m(v), h.done = v >= i, h)
  };
}
const WS = (i) => i !== null;
function fu(i, { repeat: l, repeatType: u = "loop" }, o, c = 1) {
  const h = i.filter(WS), m = c < 0 || l && u !== "loop" && l % 2 === 1 ? 0 : h.length - 1;
  return !m || o === void 0 ? h[m] : o;
}
const $S = {
  decay: ac,
  inertia: ac,
  tween: ol,
  keyframes: ol,
  spring: tu
};
function $y(i) {
  typeof i.type == "string" && (i.type = $S[i.type]);
}
class Lc {
  constructor() {
    this.updateFinished();
  }
  get finished() {
    return this._finished;
  }
  updateFinished() {
    this._finished = new Promise((l) => {
      this.resolve = l;
    });
  }
  notifyFinished() {
    this.resolve();
  }
  /**
   * Allows the animation to be awaited.
   *
   * @deprecated Use `finished` instead.
   */
  then(l, u) {
    return this.finished.then(l, u);
  }
}
const IS = (i) => i / 100;
class eu extends Lc {
  constructor(l) {
    super(), this.state = "idle", this.startTime = null, this.isStopped = !1, this.currentTime = 0, this.holdTime = null, this.playbackSpeed = 1, this.delayState = {
      done: !1,
      value: void 0
    }, this.stop = () => {
      const { motionValue: u } = this.options;
      u && u.updatedAt !== le.now() && this.tick(le.now()), this.isStopped = !0, this.state !== "idle" && (this.teardown(), this.options.onStop?.());
    }, this.options = l, this.initAnimation(), this.play(), l.autoplay === !1 && this.pause();
  }
  initAnimation() {
    const { options: l } = this;
    $y(l);
    const { type: u = ol, repeat: o = 0, repeatDelay: c = 0, repeatType: h, velocity: f = 0 } = l;
    let { keyframes: m } = l;
    const v = u || ol;
    v !== ol && typeof m[0] != "number" && (this.mixKeyframes = vl(IS, Jy(m[0], m[1])), m = [0, 100]);
    const p = v({ ...l, keyframes: m });
    h === "mirror" && (this.mirroredGenerator = v({
      ...l,
      keyframes: [...m].reverse(),
      velocity: -f
    })), p.calculatedDuration === null && (p.calculatedDuration = jc(p));
    const { calculatedDuration: g } = p;
    this.calculatedDuration = g, this.resolvedDuration = g + c, this.totalDuration = this.resolvedDuration * (o + 1) - c, this.generator = p;
  }
  updateTime(l) {
    const u = Math.round(l - this.startTime) * this.playbackSpeed;
    this.holdTime !== null ? this.currentTime = this.holdTime : this.currentTime = u;
  }
  tick(l, u = !1) {
    const { generator: o, totalDuration: c, mixKeyframes: h, mirroredGenerator: f, resolvedDuration: m, calculatedDuration: v } = this;
    if (this.startTime === null)
      return o.next(0);
    const { delay: p = 0, keyframes: g, repeat: S, repeatType: b, repeatDelay: V, type: D, onUpdate: z, finalKeyframe: B } = this.options;
    this.speed > 0 ? this.startTime = Math.min(this.startTime, l) : this.speed < 0 && (this.startTime = Math.min(l - c / this.speed, this.startTime)), u ? this.currentTime = l : this.updateTime(l);
    const H = this.currentTime - p * (this.playbackSpeed >= 0 ? 1 : -1), X = this.playbackSpeed >= 0 ? H < 0 : H > c;
    this.currentTime = Math.max(H, 0), this.state === "finished" && this.holdTime === null && (this.currentTime = c);
    let q = this.currentTime, G = o;
    if (S) {
      const P = Math.min(this.currentTime, c) / m;
      let st = Math.floor(P), $ = P % 1;
      !$ && P >= 1 && ($ = 1), $ === 1 && st--, st = Math.min(st, S + 1), !!(st % 2) && (b === "reverse" ? ($ = 1 - $, V && ($ -= V / m)) : b === "mirror" && (G = f)), q = Je(0, 1, $) * m;
    }
    let Z;
    X ? (this.delayState.value = g[0], Z = this.delayState) : Z = G.next(q), h && !X && (Z.value = h(Z.value));
    let { done: it } = Z;
    !X && v !== null && (it = this.playbackSpeed >= 0 ? this.currentTime >= c : this.currentTime <= 0);
    const at = this.holdTime === null && (this.state === "finished" || this.state === "running" && it);
    return at && D !== ac && (Z.value = fu(g, this.options, B, this.speed)), z && z(Z.value), at && this.finish(), Z;
  }
  /**
   * Allows the returned animation to be awaited or promise-chained. Currently
   * resolves when the animation finishes at all but in a future update could/should
   * reject if its cancels.
   */
  then(l, u) {
    return this.finished.then(l, u);
  }
  get duration() {
    return /* @__PURE__ */ ze(this.calculatedDuration);
  }
  get iterationDuration() {
    const { delay: l = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ ze(l);
  }
  get time() {
    return /* @__PURE__ */ ze(this.currentTime);
  }
  set time(l) {
    l = /* @__PURE__ */ Ae(l), this.currentTime = l, this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0 ? this.holdTime = l : this.driver && (this.startTime = this.driver.now() - l / this.playbackSpeed), this.driver ? this.driver.start(!1) : (this.startTime = 0, this.state = "paused", this.holdTime = l, this.tick(l));
  }
  /**
   * Returns the generator's velocity at the current time in units/second.
   * Uses the analytical derivative when available (springs), avoiding
   * the MotionValue's frame-dependent velocity estimation.
   */
  getGeneratorVelocity() {
    const l = this.currentTime;
    if (l <= 0)
      return this.options.velocity || 0;
    if (this.generator.velocity)
      return this.generator.velocity(l);
    const u = this.generator.next(l).value;
    return Wy((o) => this.generator.next(o).value, l, u);
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(l) {
    const u = this.playbackSpeed !== l;
    u && this.driver && this.updateTime(le.now()), this.playbackSpeed = l, u && this.driver && (this.time = /* @__PURE__ */ ze(this.currentTime));
  }
  play() {
    if (this.isStopped)
      return;
    const { driver: l = US, startTime: u } = this.options;
    this.driver || (this.driver = l((c) => this.tick(c))), this.options.onPlay?.();
    const o = this.driver.now();
    this.state === "finished" ? (this.updateFinished(), this.startTime = o) : this.holdTime !== null ? this.startTime = o - this.holdTime : this.startTime || (this.startTime = u ?? o), this.state === "finished" && this.speed < 0 && (this.startTime += this.calculatedDuration), this.holdTime = null, this.state = "running", this.driver.start();
  }
  pause() {
    this.state = "paused", this.updateTime(le.now()), this.holdTime = this.currentTime;
  }
  complete() {
    this.state !== "running" && this.play(), this.state = "finished", this.holdTime = null;
  }
  finish() {
    this.notifyFinished(), this.teardown(), this.state = "finished", this.options.onComplete?.();
  }
  cancel() {
    this.holdTime = null, this.startTime = 0, this.tick(0), this.teardown(), this.options.onCancel?.();
  }
  teardown() {
    this.state = "idle", this.stopDriver(), this.startTime = this.holdTime = null;
  }
  stopDriver() {
    this.driver && (this.driver.stop(), this.driver = void 0);
  }
  sample(l) {
    return this.startTime = 0, this.tick(l, !0);
  }
  attachTimeline(l) {
    return this.options.allowFlatten && (this.options.type = "keyframes", this.options.ease = "linear", this.initAnimation()), this.driver?.stop(), l.observe(this);
  }
}
function tb(i) {
  for (let l = 1; l < i.length; l++)
    i[l] ?? (i[l] = i[l - 1]);
}
const ri = (i) => i * 180 / Math.PI, lc = (i) => {
  const l = ri(Math.atan2(i[1], i[0]));
  return sc(l);
}, eb = {
  x: 4,
  y: 5,
  translateX: 4,
  translateY: 5,
  scaleX: 0,
  scaleY: 3,
  scale: (i) => (Math.abs(i[0]) + Math.abs(i[3])) / 2,
  rotate: lc,
  rotateZ: lc,
  skewX: (i) => ri(Math.atan(i[1])),
  skewY: (i) => ri(Math.atan(i[2])),
  skew: (i) => (Math.abs(i[1]) + Math.abs(i[2])) / 2
}, sc = (i) => (i = i % 360, i < 0 && (i += 360), i), dp = lc, mp = (i) => Math.sqrt(i[0] * i[0] + i[1] * i[1]), pp = (i) => Math.sqrt(i[4] * i[4] + i[5] * i[5]), nb = {
  x: 12,
  y: 13,
  z: 14,
  translateX: 12,
  translateY: 13,
  translateZ: 14,
  scaleX: mp,
  scaleY: pp,
  scale: (i) => (mp(i) + pp(i)) / 2,
  rotateX: (i) => sc(ri(Math.atan2(i[6], i[5]))),
  rotateY: (i) => sc(ri(Math.atan2(-i[2], i[0]))),
  rotateZ: dp,
  rotate: dp,
  skewX: (i) => ri(Math.atan(i[4])),
  skewY: (i) => ri(Math.atan(i[1])),
  skew: (i) => (Math.abs(i[1]) + Math.abs(i[4])) / 2
};
function uc(i) {
  return i.includes("scale") ? 1 : 0;
}
function oc(i, l) {
  if (!i || i === "none")
    return uc(l);
  const u = i.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
  let o, c;
  if (u)
    o = nb, c = u;
  else {
    const m = i.match(/^matrix\(([-\d.e\s,]+)\)$/u);
    o = eb, c = m;
  }
  if (!c)
    return uc(l);
  const h = o[l], f = c[1].split(",").map(ab);
  return typeof h == "function" ? h(f) : f[h];
}
const ib = (i, l) => {
  const { transform: u = "none" } = getComputedStyle(i);
  return oc(u, l);
};
function ab(i) {
  return parseFloat(i.trim());
}
const aa = [
  "transformPerspective",
  "x",
  "y",
  "z",
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skew",
  "skewX",
  "skewY"
], la = /* @__PURE__ */ new Set([...aa, "pathRotation"]), yp = (i) => i === ia || i === W, lb = /* @__PURE__ */ new Set(["x", "y", "z"]), sb = aa.filter((i) => !lb.has(i));
function ub(i) {
  const l = [];
  return sb.forEach((u) => {
    const o = i.getValue(u);
    o !== void 0 && (l.push([u, o.get()]), o.set(u.startsWith("scale") ? 1 : 0));
  }), l;
}
const Ln = {
  // Dimensions
  width: ({ x: i }, { paddingLeft: l = "0", paddingRight: u = "0", boxSizing: o }) => {
    const c = i.max - i.min;
    return o === "border-box" ? c : c - parseFloat(l) - parseFloat(u);
  },
  height: ({ y: i }, { paddingTop: l = "0", paddingBottom: u = "0", boxSizing: o }) => {
    const c = i.max - i.min;
    return o === "border-box" ? c : c - parseFloat(l) - parseFloat(u);
  },
  top: (i, { top: l }) => parseFloat(l),
  left: (i, { left: l }) => parseFloat(l),
  bottom: ({ y: i }, { top: l }) => parseFloat(l) + (i.max - i.min),
  right: ({ x: i }, { left: l }) => parseFloat(l) + (i.max - i.min),
  // Transform
  x: (i, { transform: l }) => oc(l, "x"),
  y: (i, { transform: l }) => oc(l, "y")
};
Ln.translateX = Ln.x;
Ln.translateY = Ln.y;
const ci = /* @__PURE__ */ new Set();
let rc = !1, cc = !1, fc = !1;
function Iy() {
  if (cc) {
    const i = Array.from(ci).filter((o) => o.needsMeasurement), l = new Set(i.map((o) => o.element)), u = /* @__PURE__ */ new Map();
    l.forEach((o) => {
      const c = ub(o);
      c.length && (u.set(o, c), o.render());
    }), i.forEach((o) => o.measureInitialState()), l.forEach((o) => {
      o.render();
      const c = u.get(o);
      c && c.forEach(([h, f]) => {
        o.getValue(h)?.set(f);
      });
    }), i.forEach((o) => o.measureEndState()), i.forEach((o) => {
      o.suspendedScrollY !== void 0 && window.scrollTo(0, o.suspendedScrollY);
    });
  }
  cc = !1, rc = !1, ci.forEach((i) => i.complete(fc)), ci.clear();
}
function tg() {
  ci.forEach((i) => {
    i.readKeyframes(), i.needsMeasurement && (cc = !0);
  });
}
function ob() {
  fc = !0, tg(), Iy(), fc = !1;
}
class Hc {
  constructor(l, u, o, c, h, f = !1) {
    this.state = "pending", this.isAsync = !1, this.needsMeasurement = !1, this.unresolvedKeyframes = [...l], this.onComplete = u, this.name = o, this.motionValue = c, this.element = h, this.isAsync = f;
  }
  scheduleResolve() {
    this.state = "scheduled", this.isAsync ? (ci.add(this), rc || (rc = !0, Rt.read(tg), Rt.resolveKeyframes(Iy))) : (this.readKeyframes(), this.complete());
  }
  readKeyframes() {
    const { unresolvedKeyframes: l, name: u, element: o, motionValue: c } = this;
    if (l[0] === null) {
      const h = c?.get(), f = l[l.length - 1];
      if (h !== void 0)
        l[0] = h;
      else if (o && u) {
        const m = o.readValue(u, f);
        m != null && (l[0] = m);
      }
      l[0] === void 0 && (l[0] = f), c && h === void 0 && c.set(l[0]);
    }
    tb(l);
  }
  setFinalKeyframe() {
  }
  measureInitialState() {
  }
  renderEndStyles() {
  }
  measureEndState() {
  }
  complete(l = !1) {
    this.state = "complete", this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, l), ci.delete(this);
  }
  cancel() {
    this.state === "scheduled" && (ci.delete(this), this.state = "pending");
  }
  resume() {
    this.state === "pending" && this.scheduleResolve();
  }
}
const rb = (i) => i.startsWith("--");
function eg(i, l, u) {
  rb(l) ? i.style.setProperty(l, u) : i.style[l] = u;
}
const cb = {};
function ng(i, l) {
  const u = /* @__PURE__ */ Oy(i);
  return () => cb[l] ?? u();
}
const fb = /* @__PURE__ */ ng(() => window.ScrollTimeline !== void 0, "scrollTimeline"), ig = /* @__PURE__ */ ng(() => {
  try {
    document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
  } catch {
    return !1;
  }
  return !0;
}, "linearEasing"), sl = ([i, l, u, o]) => `cubic-bezier(${i}, ${l}, ${u}, ${o})`, gp = {
  linear: "linear",
  ease: "ease",
  easeIn: "ease-in",
  easeOut: "ease-out",
  easeInOut: "ease-in-out",
  circIn: /* @__PURE__ */ sl([0, 0.65, 0.55, 1]),
  circOut: /* @__PURE__ */ sl([0.55, 0, 1, 0.45]),
  backIn: /* @__PURE__ */ sl([0.31, 0.01, 0.66, -0.59]),
  backOut: /* @__PURE__ */ sl([0.33, 1.53, 0.69, 0.99])
};
function ag(i, l) {
  if (i)
    return typeof i == "function" ? ig() ? Fy(i, l) : "ease-out" : /* @__PURE__ */ qy(i) ? sl(i) : Array.isArray(i) ? i.map((u) => ag(u, l) || gp.easeOut) : gp[i];
}
function hb(i, l, u, { delay: o = 0, duration: c = 300, repeat: h = 0, repeatType: f = "loop", ease: m = "easeOut", times: v } = {}, p = void 0) {
  const g = {
    [l]: u
  };
  v && (g.offset = v);
  const S = ag(m, c);
  Array.isArray(S) && (g.easing = S);
  const b = {
    delay: o,
    duration: c,
    easing: Array.isArray(S) ? "linear" : S,
    fill: "both",
    iterations: h + 1,
    direction: f === "reverse" ? "alternate" : "normal"
  };
  return p && (b.pseudoElement = p), i.animate(g, b);
}
function lg(i) {
  return typeof i == "function" && "applyToOptions" in i;
}
function db({ type: i, ...l }) {
  return lg(i) && ig() ? i.applyToOptions(l) : (l.duration ?? (l.duration = 300), l.ease ?? (l.ease = "easeOut"), l);
}
class sg extends Lc {
  constructor(l) {
    if (super(), this.finishedTime = null, this.isStopped = !1, this.manualStartTime = null, !l)
      return;
    const { element: u, name: o, keyframes: c, pseudoElement: h, allowFlatten: f = !1, finalKeyframe: m, onComplete: v } = l;
    this.isPseudoElement = !!h, this.allowFlatten = f, this.options = l, cu(typeof l.type != "string");
    const p = db(l);
    this.animation = hb(u, o, c, p, h), p.autoplay === !1 && this.animation.pause(), this.animation.onfinish = () => {
      if (this.finishedTime = this.time, !h) {
        const g = fu(c, this.options, m, this.speed);
        this.updateMotionValue && this.updateMotionValue(g), eg(u, o, g), this.animation.cancel();
      }
      v?.(), this.notifyFinished();
    };
  }
  play() {
    this.isStopped || (this.manualStartTime = null, this.animation.play(), this.state === "finished" && this.updateFinished());
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.finish?.();
  }
  cancel() {
    try {
      this.animation.cancel();
    } catch {
    }
  }
  stop() {
    if (this.isStopped)
      return;
    this.isStopped = !0;
    const { state: l } = this;
    l === "idle" || l === "finished" || (this.updateMotionValue ? this.updateMotionValue() : this.commitStyles(), this.isPseudoElement || this.cancel());
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * In this method, we commit styles back to the DOM before cancelling
   * the animation.
   *
   * This is designed to be overridden by NativeAnimationExtended, which
   * will create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to also correctly calculate velocity for any subsequent animation
   * while deferring the commit until the next animation frame.
   */
  commitStyles() {
    const l = this.options?.element;
    !this.isPseudoElement && l?.isConnected && this.animation.commitStyles?.();
  }
  get duration() {
    const l = this.animation.effect?.getComputedTiming?.().duration || 0;
    return /* @__PURE__ */ ze(Number(l));
  }
  get iterationDuration() {
    const { delay: l = 0 } = this.options || {};
    return this.duration + /* @__PURE__ */ ze(l);
  }
  get time() {
    return /* @__PURE__ */ ze(Number(this.animation.currentTime) || 0);
  }
  set time(l) {
    const u = this.finishedTime !== null;
    this.manualStartTime = null, this.finishedTime = null, this.animation.currentTime = /* @__PURE__ */ Ae(l), u && this.animation.pause();
  }
  /**
   * The playback speed of the animation.
   * 1 = normal speed, 2 = double speed, 0.5 = half speed.
   */
  get speed() {
    return this.animation.playbackRate;
  }
  set speed(l) {
    l < 0 && (this.finishedTime = null), this.animation.playbackRate = l;
  }
  get state() {
    return this.finishedTime !== null ? "finished" : this.animation.playState;
  }
  get startTime() {
    return this.manualStartTime ?? Number(this.animation.startTime);
  }
  set startTime(l) {
    this.manualStartTime = this.animation.startTime = l;
  }
  /**
   * Attaches a timeline to the animation, for instance the `ScrollTimeline`.
   */
  attachTimeline({ timeline: l, rangeStart: u, rangeEnd: o, observe: c }) {
    return this.allowFlatten && this.animation.effect?.updateTiming({ easing: "linear" }), this.animation.onfinish = null, l && fb() ? (this.animation.timeline = l, u && (this.animation.rangeStart = u), o && (this.animation.rangeEnd = o), _e) : c(this);
  }
}
const ug = {
  anticipate: Uy,
  backInOut: Ny,
  circInOut: Ly
};
function mb(i) {
  return i in ug;
}
function pb(i) {
  typeof i.ease == "string" && mb(i.ease) && (i.ease = ug[i.ease]);
}
const Xr = 10;
class yb extends sg {
  constructor(l) {
    pb(l), $y(l), super(l), l.startTime !== void 0 && l.autoplay !== !1 && (this.startTime = l.startTime), this.options = l;
  }
  /**
   * WAAPI doesn't natively have any interruption capabilities.
   *
   * Rather than read committed styles back out of the DOM, we can
   * create a renderless JS animation and sample it twice to calculate
   * its current value, "previous" value, and therefore allow
   * Motion to calculate velocity for any subsequent animation.
   */
  updateMotionValue(l) {
    const { motionValue: u, onUpdate: o, onComplete: c, element: h, ...f } = this.options;
    if (!u)
      return;
    if (l !== void 0) {
      u.set(l);
      return;
    }
    const m = new eu({
      ...f,
      autoplay: !1
    }), v = Math.max(Xr, le.now() - this.startTime), p = Je(0, Xr, v - Xr), g = m.sample(v).value, { name: S } = this.options;
    h && S && eg(h, S, g), u.setWithVelocity(m.sample(Math.max(0, v - p)).value, g, p), m.stop();
  }
}
const vp = (i, l) => l === "zIndex" ? !1 : !!(typeof i == "number" || Array.isArray(i) || typeof i == "string" && // It's animatable if we have a string
(He.test(i) || i === "0") && // And it contains numbers and/or colors
!i.startsWith("url("));
function gb(i) {
  const l = i[0];
  if (i.length === 1)
    return !0;
  for (let u = 0; u < i.length; u++)
    if (i[u] !== l)
      return !0;
}
function vb(i, l, u, o) {
  const c = i[0];
  if (c === null)
    return !1;
  if (l === "display" || l === "visibility")
    return !0;
  const h = i[i.length - 1], f = vp(c, l), m = vp(h, l);
  return !f || !m ? !1 : gb(i) || (u === "spring" || lg(u)) && o;
}
function hc(i) {
  i.duration = 0, i.type = "keyframes";
}
const og = /* @__PURE__ */ new Set([
  "opacity",
  "clipPath",
  "filter",
  "transform",
  "backgroundColor"
]), Sb = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
function bb(i) {
  for (let l = 0; l < i.length; l++)
    if (typeof i[l] == "string" && Sb.test(i[l]))
      return !0;
  return !1;
}
const Tb = /* @__PURE__ */ new Set([
  "color",
  "backgroundColor",
  "outlineColor",
  "fill",
  "stroke",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor"
]), Ab = /* @__PURE__ */ Oy(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
function xb(i) {
  const { motionValue: l, name: u, repeatDelay: o, repeatType: c, damping: h, type: f, keyframes: m } = i, v = l?.owner?.current;
  if (!(v instanceof HTMLElement) && !(v instanceof SVGElement))
    return !1;
  const { onUpdate: p, transformTemplate: g } = l.owner.getProps();
  return Ab() && u && /**
   * Force WAAPI for color properties with browser-only color formats
   * (oklch, oklab, lab, lch, etc.) that the JS animation path can't parse.
   */
  (og.has(u) || Tb.has(u) && bb(m)) && (u !== "transform" || !g) && /**
   * If we're outputting values to onUpdate then we can't use WAAPI as there's
   * no way to read the value from WAAPI every frame.
   */
  !p && !o && c !== "mirror" && h !== 0 && f !== "inertia";
}
const Eb = 40;
class Mb extends Lc {
  constructor({ autoplay: l = !0, delay: u = 0, type: o = "keyframes", repeat: c = 0, repeatDelay: h = 0, repeatType: f = "loop", keyframes: m, name: v, motionValue: p, element: g, ...S }) {
    super(), this.stop = () => {
      this._animation && (this._animation.stop(), this.stopTimeline?.()), this.keyframeResolver?.cancel();
    }, this.createdAt = le.now();
    const b = {
      autoplay: l,
      delay: u,
      type: o,
      repeat: c,
      repeatDelay: h,
      repeatType: f,
      name: v,
      motionValue: p,
      element: g,
      ...S
    }, V = g?.KeyframeResolver || Hc;
    this.keyframeResolver = new V(m, (D, z, B) => this.onKeyframesResolved(D, z, b, !B), v, p, g), this.keyframeResolver?.scheduleResolve();
  }
  onKeyframesResolved(l, u, o, c) {
    this.keyframeResolver = void 0;
    const { name: h, type: f, velocity: m, delay: v, isHandoff: p, onUpdate: g } = o;
    this.resolvedAt = le.now();
    let S = !0;
    vb(l, h, f, m) || (S = !1, (Hn.instantAnimations || !v) && g?.(fu(l, o, u)), l[0] = l[l.length - 1], hc(o), o.repeat = 0);
    const V = {
      startTime: c ? this.resolvedAt ? this.resolvedAt - this.createdAt > Eb ? this.resolvedAt : this.createdAt : this.createdAt : void 0,
      finalKeyframe: u,
      ...o,
      keyframes: l
    }, D = S && !p && xb(V), z = V.motionValue?.owner?.current;
    let B;
    if (D)
      try {
        B = new yb({
          ...V,
          element: z
        });
      } catch {
        B = new eu(V);
      }
    else
      B = new eu(V);
    B.finished.then(() => {
      this.notifyFinished();
    }).catch(_e), this.pendingTimeline && (this.stopTimeline = B.attachTimeline(this.pendingTimeline), this.pendingTimeline = void 0), this._animation = B;
  }
  get finished() {
    return this._animation ? this.animation.finished : this._finished;
  }
  then(l, u) {
    return this.finished.finally(l).then(() => {
    });
  }
  get animation() {
    return this._animation || (this.keyframeResolver?.resume(), ob()), this._animation;
  }
  get duration() {
    return this.animation.duration;
  }
  get iterationDuration() {
    return this.animation.iterationDuration;
  }
  get time() {
    return this.animation.time;
  }
  set time(l) {
    this.animation.time = l;
  }
  get speed() {
    return this.animation.speed;
  }
  get state() {
    return this.animation.state;
  }
  set speed(l) {
    this.animation.speed = l;
  }
  get startTime() {
    return this.animation.startTime;
  }
  attachTimeline(l) {
    return this._animation ? this.stopTimeline = this.animation.attachTimeline(l) : this.pendingTimeline = l, () => this.stop();
  }
  play() {
    this.animation.play();
  }
  pause() {
    this.animation.pause();
  }
  complete() {
    this.animation.complete();
  }
  cancel() {
    this._animation && this.animation.cancel(), this.keyframeResolver?.cancel();
  }
}
function rg(i, l, u, o = 0, c = 1) {
  const h = Array.from(i).sort((p, g) => p.sortNodePosition(g)).indexOf(l), f = i.size, m = (f - 1) * o;
  return typeof u == "function" ? u(h, f) : c === 1 ? h * o : m - h * o;
}
const Sp = 30, Db = (i) => !isNaN(parseFloat(i));
class Rb {
  /**
   * @param init - The initiating value
   * @param config - Optional configuration options
   *
   * -  `transformer`: A function to transform incoming values with.
   */
  constructor(l, u = {}) {
    this.canTrackVelocity = null, this.events = {}, this.updateAndNotify = (o) => {
      const c = le.now();
      if (this.updatedAt !== c && this.setPrevFrameValue(), this.prev = this.current, this.setCurrent(o), this.current !== this.prev && (this.events.change?.notify(this.current), this.dependents))
        for (const h of this.dependents)
          h.dirty();
    }, this.hasAnimated = !1, this.setCurrent(l), this.owner = u.owner;
  }
  setCurrent(l) {
    this.current = l, this.updatedAt = le.now(), this.canTrackVelocity === null && l !== void 0 && (this.canTrackVelocity = Db(this.current));
  }
  setPrevFrameValue(l = this.current) {
    this.prevFrameValue = l, this.prevUpdatedAt = this.updatedAt;
  }
  /**
   * Adds a function that will be notified when the `MotionValue` is updated.
   *
   * It returns a function that, when called, will cancel the subscription.
   *
   * When calling `onChange` inside a React component, it should be wrapped with the
   * `useEffect` hook. As it returns an unsubscribe function, this should be returned
   * from the `useEffect` function to ensure you don't add duplicate subscribers..
   *
   * ```jsx
   * export const MyComponent = () => {
   *   const x = useMotionValue(0)
   *   const y = useMotionValue(0)
   *   const opacity = useMotionValue(1)
   *
   *   useEffect(() => {
   *     function updateOpacity() {
   *       const maxXY = Math.max(x.get(), y.get())
   *       const newOpacity = transform(maxXY, [0, 100], [1, 0])
   *       opacity.set(newOpacity)
   *     }
   *
   *     const unsubscribeX = x.on("change", updateOpacity)
   *     const unsubscribeY = y.on("change", updateOpacity)
   *
   *     return () => {
   *       unsubscribeX()
   *       unsubscribeY()
   *     }
   *   }, [])
   *
   *   return <motion.div style={{ x }} />
   * }
   * ```
   *
   * @param subscriber - A function that receives the latest value.
   * @returns A function that, when called, will cancel this subscription.
   *
   * @deprecated
   */
  onChange(l) {
    return this.on("change", l);
  }
  on(l, u) {
    this.events[l] || (this.events[l] = new Vc());
    const o = this.events[l].add(u);
    return l === "change" ? () => {
      o(), Rt.read(() => {
        this.events.change.getSize() || this.stop();
      });
    } : o;
  }
  clearListeners() {
    for (const l in this.events)
      this.events[l].clear();
  }
  /**
   * Attaches a passive effect to the `MotionValue`.
   */
  attach(l, u) {
    this.passiveEffect = l, this.stopPassiveEffect = u;
  }
  /**
   * Sets the state of the `MotionValue`.
   *
   * @remarks
   *
   * ```jsx
   * const x = useMotionValue(0)
   * x.set(10)
   * ```
   *
   * @param latest - Latest value to set.
   * @param render - Whether to notify render subscribers. Defaults to `true`
   *
   * @public
   */
  set(l) {
    this.passiveEffect ? this.passiveEffect(l, this.updateAndNotify) : this.updateAndNotify(l);
  }
  setWithVelocity(l, u, o) {
    this.set(u), this.prev = void 0, this.prevFrameValue = l, this.prevUpdatedAt = this.updatedAt - o;
  }
  /**
   * Set the state of the `MotionValue`, stopping any active animations,
   * effects, and resets velocity to `0`.
   */
  jump(l, u = !0) {
    this.updateAndNotify(l), this.prev = l, this.prevUpdatedAt = this.prevFrameValue = void 0, u && this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
  dirty() {
    this.events.change?.notify(this.current);
  }
  addDependent(l) {
    this.dependents || (this.dependents = /* @__PURE__ */ new Set()), this.dependents.add(l);
  }
  removeDependent(l) {
    this.dependents && this.dependents.delete(l);
  }
  /**
   * Returns the latest state of `MotionValue`
   *
   * @returns - The latest state of `MotionValue`
   *
   * @public
   */
  get() {
    return this.current;
  }
  /**
   * @public
   */
  getPrevious() {
    return this.prev;
  }
  /**
   * Returns the latest velocity of `MotionValue`
   *
   * @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
   *
   * @public
   */
  getVelocity() {
    const l = le.now();
    if (!this.canTrackVelocity || this.prevFrameValue === void 0 || l - this.updatedAt > Sp)
      return 0;
    const u = Math.min(this.updatedAt - this.prevUpdatedAt, Sp);
    return /* @__PURE__ */ Vy(parseFloat(this.current) - parseFloat(this.prevFrameValue), u);
  }
  /**
   * Registers a new animation to control this `MotionValue`. Only one
   * animation can drive a `MotionValue` at one time.
   *
   * ```jsx
   * value.start()
   * ```
   *
   * @param animation - A function that starts the provided animation
   */
  start(l) {
    return this.stop(), new Promise((u) => {
      this.hasAnimated = !0, this.animation = l(u), this.events.animationStart && this.events.animationStart.notify();
    }).then(() => {
      this.events.animationComplete && this.events.animationComplete.notify(), this.clearAnimation();
    });
  }
  /**
   * Stop the currently active animation.
   *
   * @public
   */
  stop() {
    this.animation && (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()), this.clearAnimation();
  }
  /**
   * Returns `true` if this value is currently animating.
   *
   * @public
   */
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  /**
   * Destroy and clean up subscribers to this `MotionValue`.
   *
   * The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
   * handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
   * created a `MotionValue` via the `motionValue` function.
   *
   * @public
   */
  destroy() {
    this.dependents?.clear(), this.events.destroy?.notify(), this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect();
  }
}
function na(i, l) {
  return new Rb(i, l);
}
function qc(i, l) {
  if (i?.inherit && l) {
    const { inherit: u, ...o } = i;
    return { ...l, ...o };
  }
  return i;
}
function Yc(i, l) {
  const u = i?.[l] ?? i?.default ?? i;
  return u !== i ? qc(u, i) : u;
}
const Cb = {
  type: "spring",
  stiffness: 500,
  damping: 25,
  restSpeed: 10
}, Ob = (i) => ({
  type: "spring",
  stiffness: 550,
  damping: i === 0 ? 2 * Math.sqrt(550) : 30,
  restSpeed: 10
}), Vb = {
  type: "keyframes",
  duration: 0.8
}, wb = {
  type: "keyframes",
  ease: [0.25, 0.1, 0.35, 1],
  duration: 0.3
}, zb = (i, { keyframes: l }) => l.length > 2 ? Vb : la.has(i) ? i.startsWith("scale") ? Ob(l[1]) : Cb : wb, _b = /* @__PURE__ */ new Set([
  "when",
  "delay",
  "delayChildren",
  "staggerChildren",
  "staggerDirection",
  "repeat",
  "repeatType",
  "repeatDelay",
  "from",
  "elapsed"
]);
function Bb(i) {
  for (const l in i)
    if (!_b.has(l))
      return !0;
  return !1;
}
const Gc = (i, l, u, o = {}, c, h) => (f) => {
  const m = Yc(o, i) || {}, v = m.delay || o.delay || 0;
  let { elapsed: p = 0 } = o;
  p = p - /* @__PURE__ */ Ae(v);
  const g = {
    keyframes: Array.isArray(u) ? u : [null, u],
    ease: "easeOut",
    velocity: l.getVelocity(),
    ...m,
    delay: -p,
    onUpdate: (b) => {
      l.set(b), m.onUpdate && m.onUpdate(b);
    },
    onComplete: () => {
      f(), m.onComplete && m.onComplete();
    },
    name: i,
    motionValue: l,
    element: h ? void 0 : c
  };
  Bb(m) || Object.assign(g, zb(i, g)), g.duration && (g.duration = /* @__PURE__ */ Ae(g.duration)), g.repeatDelay && (g.repeatDelay = /* @__PURE__ */ Ae(g.repeatDelay)), g.from !== void 0 && (g.keyframes[0] = g.from);
  let S = !1;
  if ((g.type === !1 || g.duration === 0 && !g.repeatDelay) && (hc(g), g.delay === 0 && (S = !0)), (Hn.instantAnimations || Hn.skipAnimations || c?.shouldSkipAnimations || m.skipAnimations) && (S = !0, hc(g), g.delay = 0), g.allowFlatten = !m.type && !m.ease, S && !h && l.get() !== void 0) {
    const b = fu(g.keyframes, m);
    if (b !== void 0) {
      Rt.update(() => {
        g.onUpdate(b), g.onComplete();
      });
      return;
    }
  }
  return m.isSync ? new eu(g) : new Mb(g);
}, Nb = (
  // eslint-disable-next-line redos-detector/no-unsafe-regex -- false positive, as it can match a lot of words
  /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u
);
function Ub(i) {
  const l = Nb.exec(i);
  if (!l)
    return [,];
  const [, u, o, c] = l;
  return [`--${u ?? o}`, c];
}
function cg(i, l, u = 1) {
  const [o, c] = Ub(i);
  if (!o)
    return;
  const h = window.getComputedStyle(l).getPropertyValue(o);
  if (h) {
    const f = h.trim();
    return Dy(f) ? parseFloat(f) : f;
  }
  return _c(c) ? cg(c, l, u + 1) : c;
}
function bp(i) {
  const l = [{}, {}];
  return i?.values.forEach((u, o) => {
    l[0][o] = u.get(), l[1][o] = u.getVelocity();
  }), l;
}
function Xc(i, l, u, o) {
  if (typeof l == "function") {
    const [c, h] = bp(o);
    l = l(u !== void 0 ? u : i.custom, c, h);
  }
  if (typeof l == "string" && (l = i.variants && i.variants[l]), typeof l == "function") {
    const [c, h] = bp(o);
    l = l(u !== void 0 ? u : i.custom, c, h);
  }
  return l;
}
function fi(i, l, u) {
  const o = i.getProps();
  return Xc(o, l, u !== void 0 ? u : o.custom, i);
}
const fg = /* @__PURE__ */ new Set([
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  ...aa
]), dc = (i) => Array.isArray(i);
function jb(i, l, u) {
  i.hasValue(l) ? i.getValue(l).set(u) : i.addValue(l, na(u));
}
function Lb(i) {
  return dc(i) ? i[i.length - 1] || 0 : i;
}
function Hb(i, l) {
  const u = fi(i, l);
  let { transitionEnd: o = {}, transition: c = {}, ...h } = u || {};
  h = { ...h, ...o };
  for (const f in h) {
    const m = Lb(h[f]);
    jb(i, f, m);
  }
}
const te = (i) => !!(i && i.getVelocity);
function qb(i) {
  return !!(te(i) && i.add);
}
function mc(i, l) {
  const u = i.getValue("willChange");
  if (qb(u))
    return u.add(l);
  if (!u && Hn.WillChange) {
    const o = new Hn.WillChange("auto");
    i.addValue("willChange", o), o.add(l);
  }
}
function Zc(i) {
  return i.replace(/([A-Z])/g, (l) => `-${l.toLowerCase()}`);
}
const Yb = "framerAppearId", hg = "data-" + Zc(Yb);
function dg(i) {
  return i.props[hg];
}
function Gb({ protectedKeys: i, needsAnimating: l }, u) {
  const o = i.hasOwnProperty(u) && l[u] !== !0;
  return l[u] = !1, o;
}
function mg(i, l, { delay: u = 0, transitionOverride: o, type: c } = {}) {
  let { transition: h, transitionEnd: f, ...m } = l;
  const v = i.getDefaultTransition();
  h = h ? qc(h, v) : v;
  const p = h?.reduceMotion, g = h?.skipAnimations;
  o && (h = o);
  const S = [], b = c && i.animationState && i.animationState.getState()[c], V = h?.path;
  V && V.animateVisualElement(i, m, h, u, S);
  for (const D in m) {
    const z = i.getValue(D, i.latestValues[D] ?? null), B = m[D];
    if (B === void 0 || b && Gb(b, D))
      continue;
    const H = {
      delay: u,
      ...Yc(h || {}, D)
    };
    g && (H.skipAnimations = !0);
    const X = z.get();
    if (X !== void 0 && !z.isAnimating() && !Array.isArray(B) && B === X && !H.velocity) {
      Rt.update(() => z.set(B));
      continue;
    }
    let q = !1;
    if (window.MotionHandoffAnimation) {
      const it = dg(i);
      if (it) {
        const at = window.MotionHandoffAnimation(it, D, Rt);
        at !== null && (H.startTime = at, q = !0);
      }
    }
    mc(i, D);
    const G = p ?? i.shouldReduceMotion;
    z.start(Gc(D, z, B, G && fg.has(D) ? { type: !1 } : H, i, q));
    const Z = z.animation;
    Z && S.push(Z);
  }
  if (f) {
    const D = () => Rt.update(() => {
      f && Hb(i, f);
    });
    S.length ? Promise.all(S).then(D) : D();
  }
  return S;
}
function pc(i, l, u = {}) {
  const o = fi(i, l, u.type === "exit" ? i.presenceContext?.custom : void 0);
  let { transition: c = i.getDefaultTransition() || {} } = o || {};
  u.transitionOverride && (c = u.transitionOverride);
  const h = o ? () => Promise.all(mg(i, o, u)) : () => Promise.resolve(), f = i.variantChildren && i.variantChildren.size ? (v = 0) => {
    const { delayChildren: p = 0, staggerChildren: g, staggerDirection: S } = c;
    return Xb(i, l, v, p, g, S, u);
  } : () => Promise.resolve(), { when: m } = c;
  if (m) {
    const [v, p] = m === "beforeChildren" ? [h, f] : [f, h];
    return v().then(() => p());
  } else
    return Promise.all([h(), f(u.delay)]);
}
function Xb(i, l, u = 0, o = 0, c = 0, h = 1, f) {
  const m = [];
  for (const v of i.variantChildren)
    v.notify("AnimationStart", l), m.push(pc(v, l, {
      ...f,
      delay: u + (typeof o == "function" ? 0 : o) + rg(i.variantChildren, v, o, c, h)
    }).then(() => v.notify("AnimationComplete", l)));
  return Promise.all(m);
}
function Zb(i, l, u = {}) {
  i.notify("AnimationStart", l);
  let o;
  if (Array.isArray(l)) {
    const c = l.map((h) => pc(i, h, u));
    o = Promise.all(c);
  } else if (typeof l == "string")
    o = pc(i, l, u);
  else {
    const c = typeof l == "function" ? fi(i, l, u.custom) : l;
    o = Promise.all(mg(i, c, u));
  }
  return o.then(() => {
    i.notify("AnimationComplete", l);
  });
}
const Kb = {
  test: (i) => i === "auto",
  parse: (i) => i
}, pg = (i) => (l) => l.test(i), yg = [ia, W, Pe, hn, gS, yS, Kb], Tp = (i) => yg.find(pg(i));
function Qb(i) {
  return typeof i == "number" ? i === 0 : i !== null ? i === "none" || i === "0" || Cy(i) : !0;
}
const kb = /* @__PURE__ */ new Set(["brightness", "contrast", "saturate", "opacity"]);
function Pb(i) {
  const [l, u] = i.slice(0, -1).split("(");
  if (l === "drop-shadow")
    return i;
  const [o] = u.match(Bc) || [];
  if (!o)
    return i;
  const c = u.replace(o, "");
  let h = kb.has(l) ? 1 : 0;
  return o !== u && (h *= 100), l + "(" + h + c + ")";
}
const Jb = /\b([a-z-]*)\(.*?\)/gu, yc = {
  ...He,
  getAnimatableNone: (i) => {
    const l = i.match(Jb);
    return l ? l.map(Pb).join(" ") : i;
  }
}, gc = {
  ...He,
  getAnimatableNone: (i) => {
    const l = He.parse(i);
    return He.createTransformer(i)(l.map((o) => typeof o == "number" ? 0 : typeof o == "object" ? { ...o, alpha: 1 } : o));
  }
}, Ap = {
  ...ia,
  transform: Math.round
}, Fb = {
  rotate: hn,
  /**
   * Internal channel for `transition.path` orientToPath. Composed onto
   * `rotate` at the transform-build sites so the user's `rotate` is
   * never read or overwritten. Not part of `transformPropOrder`.
   */
  pathRotation: hn,
  rotateX: hn,
  rotateY: hn,
  rotateZ: hn,
  scale: Ls,
  scaleX: Ls,
  scaleY: Ls,
  scaleZ: Ls,
  skew: hn,
  skewX: hn,
  skewY: hn,
  distance: W,
  translateX: W,
  translateY: W,
  translateZ: W,
  x: W,
  y: W,
  z: W,
  perspective: W,
  transformPerspective: W,
  opacity: dl,
  originX: op,
  originY: op,
  originZ: W
}, nu = {
  // Border props
  borderWidth: W,
  borderTopWidth: W,
  borderRightWidth: W,
  borderBottomWidth: W,
  borderLeftWidth: W,
  borderRadius: W,
  borderTopLeftRadius: W,
  borderTopRightRadius: W,
  borderBottomRightRadius: W,
  borderBottomLeftRadius: W,
  // Positioning props
  width: W,
  maxWidth: W,
  height: W,
  maxHeight: W,
  top: W,
  right: W,
  bottom: W,
  left: W,
  inset: W,
  insetBlock: W,
  insetBlockStart: W,
  insetBlockEnd: W,
  insetInline: W,
  insetInlineStart: W,
  insetInlineEnd: W,
  // Spacing props
  padding: W,
  paddingTop: W,
  paddingRight: W,
  paddingBottom: W,
  paddingLeft: W,
  paddingBlock: W,
  paddingBlockStart: W,
  paddingBlockEnd: W,
  paddingInline: W,
  paddingInlineStart: W,
  paddingInlineEnd: W,
  margin: W,
  marginTop: W,
  marginRight: W,
  marginBottom: W,
  marginLeft: W,
  marginBlock: W,
  marginBlockStart: W,
  marginBlockEnd: W,
  marginInline: W,
  marginInlineStart: W,
  marginInlineEnd: W,
  // Typography
  fontSize: W,
  // Misc
  backgroundPositionX: W,
  backgroundPositionY: W,
  ...Fb,
  zIndex: Ap,
  // SVG
  fillOpacity: dl,
  strokeOpacity: dl,
  numOctaves: Ap
}, Wb = {
  ...nu,
  // Color props
  color: qt,
  backgroundColor: qt,
  outlineColor: qt,
  fill: qt,
  stroke: qt,
  // Border props
  borderColor: qt,
  borderTopColor: qt,
  borderRightColor: qt,
  borderBottomColor: qt,
  borderLeftColor: qt,
  filter: yc,
  WebkitFilter: yc,
  mask: gc,
  WebkitMask: gc
}, gg = (i) => Wb[i], $b = /* @__PURE__ */ new Set([yc, gc]);
function vg(i, l) {
  let u = gg(i);
  return $b.has(u) || (u = He), u.getAnimatableNone ? u.getAnimatableNone(l) : void 0;
}
const Ib = /* @__PURE__ */ new Set(["auto", "none", "0"]);
function tT(i, l, u) {
  let o = 0, c;
  for (; o < i.length && !c; ) {
    const h = i[o];
    typeof h == "string" && !Ib.has(h) && ea(h).values.length && (c = i[o]), o++;
  }
  if (c && u)
    for (const h of l)
      i[h] = vg(u, c);
}
class eT extends Hc {
  constructor(l, u, o, c, h) {
    super(l, u, o, c, h, !0);
  }
  readKeyframes() {
    const { unresolvedKeyframes: l, element: u, name: o } = this;
    if (!u || !u.current)
      return;
    super.readKeyframes();
    for (let g = 0; g < l.length; g++) {
      let S = l[g];
      if (typeof S == "string" && (S = S.trim(), _c(S))) {
        const b = cg(S, u.current);
        b !== void 0 && (l[g] = b), g === l.length - 1 && (this.finalKeyframe = S);
      }
    }
    if (this.resolveNoneKeyframes(), !fg.has(o) || l.length !== 2)
      return;
    const [c, h] = l, f = Tp(c), m = Tp(h), v = up(c), p = up(h);
    if (v !== p && Ln[o]) {
      this.needsMeasurement = !0;
      return;
    }
    if (f !== m)
      if (yp(f) && yp(m))
        for (let g = 0; g < l.length; g++) {
          const S = l[g];
          typeof S == "string" && (l[g] = parseFloat(S));
        }
      else Ln[o] && (this.needsMeasurement = !0);
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes: l, name: u } = this, o = [];
    for (let c = 0; c < l.length; c++)
      (l[c] === null || Qb(l[c])) && o.push(c);
    o.length && tT(l, o, u);
  }
  measureInitialState() {
    const { element: l, unresolvedKeyframes: u, name: o } = this;
    if (!l || !l.current)
      return;
    o === "height" && (this.suspendedScrollY = window.pageYOffset), this.measuredOrigin = Ln[o](l.measureViewportBox(), window.getComputedStyle(l.current)), u[0] = this.measuredOrigin;
    const c = u[u.length - 1];
    c !== void 0 && l.getValue(o, c).jump(c, !1);
  }
  measureEndState() {
    const { element: l, name: u, unresolvedKeyframes: o } = this;
    if (!l || !l.current)
      return;
    const c = l.getValue(u);
    c && c.jump(this.measuredOrigin, !1);
    const h = o.length - 1, f = o[h];
    o[h] = Ln[u](l.measureViewportBox(), window.getComputedStyle(l.current)), f !== null && this.finalKeyframe === void 0 && (this.finalKeyframe = f), this.removedTransforms?.length && this.removedTransforms.forEach(([m, v]) => {
      l.getValue(m).set(v);
    }), this.resolveNoneKeyframes();
  }
}
const Kc = [
  "borderTopLeftRadius",
  "borderTopRightRadius",
  "borderBottomRightRadius",
  "borderBottomLeftRadius"
];
function Sg(i, l, u) {
  if (i == null)
    return [];
  if (i instanceof EventTarget)
    return [i];
  if (typeof i == "string") {
    let o = document;
    const c = u?.[i] ?? o.querySelectorAll(i);
    return c ? Array.from(c) : [];
  }
  return Array.from(i).filter((o) => o != null);
}
const vc = (i, l) => l && typeof i == "number" ? l.transform(i) : i;
function Xs(i) {
  return Ry(i) && "offsetHeight" in i && !("ownerSVGElement" in i);
}
const { schedule: Qc } = /* @__PURE__ */ Yy(queueMicrotask, !1), Le = {
  x: !1,
  y: !1
};
function bg() {
  return Le.x || Le.y;
}
function nT(i) {
  return i === "x" || i === "y" ? Le[i] ? null : (Le[i] = !0, () => {
    Le[i] = !1;
  }) : Le.x || Le.y ? null : (Le.x = Le.y = !0, () => {
    Le.x = Le.y = !1;
  });
}
function Tg(i, l) {
  const u = Sg(i), o = new AbortController(), c = {
    passive: !0,
    ...l,
    signal: o.signal
  };
  return [u, c, () => o.abort()];
}
function iT(i) {
  return !(i.pointerType === "touch" || bg());
}
function aT(i, l, u = {}) {
  const [o, c, h] = Tg(i, u);
  return o.forEach((f) => {
    let m = !1, v = !1, p;
    const g = () => {
      f.removeEventListener("pointerleave", D);
    }, S = (B) => {
      p && (p(B), p = void 0), g();
    }, b = (B) => {
      m = !1, window.removeEventListener("pointerup", b), window.removeEventListener("pointercancel", b), v && (v = !1, S(B));
    }, V = () => {
      m = !0, window.addEventListener("pointerup", b, c), window.addEventListener("pointercancel", b, c);
    }, D = (B) => {
      if (B.pointerType !== "touch") {
        if (m) {
          v = !0;
          return;
        }
        S(B);
      }
    }, z = (B) => {
      if (!iT(B))
        return;
      v = !1;
      const H = l(f, B);
      typeof H == "function" && (p = H, f.addEventListener("pointerleave", D, c));
    };
    f.addEventListener("pointerenter", z, c), f.addEventListener("pointerdown", V, c);
  }), h;
}
const Ag = (i, l) => l ? i === l ? !0 : Ag(i, l.parentElement) : !1, kc = (i) => i.pointerType === "mouse" ? typeof i.button != "number" || i.button <= 0 : i.isPrimary !== !1, lT = /* @__PURE__ */ new Set([
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "A"
]);
function sT(i) {
  return lT.has(i.tagName) || i.isContentEditable === !0;
}
const uT = /* @__PURE__ */ new Set(["INPUT", "SELECT", "TEXTAREA"]);
function oT(i) {
  return uT.has(i.tagName) || i.isContentEditable === !0;
}
const Zs = /* @__PURE__ */ new WeakSet();
function xp(i) {
  return (l) => {
    l.key === "Enter" && i(l);
  };
}
function Zr(i, l) {
  i.dispatchEvent(new PointerEvent("pointer" + l, { isPrimary: !0, bubbles: !0 }));
}
const rT = (i, l) => {
  const u = i.currentTarget;
  if (!u)
    return;
  const o = xp(() => {
    if (Zs.has(u))
      return;
    Zr(u, "down");
    const c = xp(() => {
      Zr(u, "up");
    }), h = () => Zr(u, "cancel");
    u.addEventListener("keyup", c, l), u.addEventListener("blur", h, l);
  });
  u.addEventListener("keydown", o, l), u.addEventListener("blur", () => u.removeEventListener("keydown", o), l);
};
function Ep(i) {
  return kc(i) && !bg();
}
const Mp = /* @__PURE__ */ new WeakSet();
function cT(i, l, u = {}) {
  const [o, c, h] = Tg(i, u), f = (m) => {
    const v = m.currentTarget;
    if (!Ep(m) || Mp.has(m))
      return;
    Zs.add(v), u.stopPropagation && Mp.add(m);
    const p = l(v, m), g = { ...c, capture: !0 }, S = (D, z) => {
      window.removeEventListener("pointerup", b, g), window.removeEventListener("pointercancel", V, g), Zs.has(v) && Zs.delete(v), Ep(D) && typeof p == "function" && p(D, { success: z });
    }, b = (D) => {
      S(D, v === window || v === document || u.useGlobalTarget || Ag(v, D.target));
    }, V = (D) => {
      S(D, !1);
    };
    window.addEventListener("pointerup", b, g), window.addEventListener("pointercancel", V, g);
  };
  return o.forEach((m) => {
    (u.useGlobalTarget ? window : m).addEventListener("pointerdown", f, c), Xs(m) && (m.addEventListener("focus", (p) => rT(p, c)), !sT(m) && !m.hasAttribute("tabindex") && (m.tabIndex = 0));
  }), h;
}
function Pc(i) {
  return Ry(i) && "ownerSVGElement" in i;
}
const Ks = /* @__PURE__ */ new WeakMap();
let Qs;
const xg = (i, l, u) => (o, c) => c && c[0] ? c[0][i + "Size"] : Pc(o) && "getBBox" in o ? o.getBBox()[l] : o[u], fT = /* @__PURE__ */ xg("inline", "width", "offsetWidth"), hT = /* @__PURE__ */ xg("block", "height", "offsetHeight");
function dT({ target: i, borderBoxSize: l }) {
  Ks.get(i)?.forEach((u) => {
    u(i, {
      get width() {
        return fT(i, l);
      },
      get height() {
        return hT(i, l);
      }
    });
  });
}
function mT(i) {
  i.forEach(dT);
}
function pT() {
  typeof ResizeObserver > "u" || (Qs = new ResizeObserver(mT));
}
function yT(i, l) {
  Qs || pT();
  const u = Sg(i);
  return u.forEach((o) => {
    let c = Ks.get(o);
    c || (c = /* @__PURE__ */ new Set(), Ks.set(o, c)), c.add(l), Qs?.observe(o);
  }), () => {
    u.forEach((o) => {
      const c = Ks.get(o);
      c?.delete(l), c?.size || Qs?.unobserve(o);
    });
  };
}
const ks = /* @__PURE__ */ new Set();
let Ii;
function gT() {
  Ii = () => {
    const i = {
      get width() {
        return window.innerWidth;
      },
      get height() {
        return window.innerHeight;
      }
    };
    ks.forEach((l) => l(i));
  }, window.addEventListener("resize", Ii);
}
function vT(i) {
  return ks.add(i), Ii || gT(), () => {
    ks.delete(i), !ks.size && typeof Ii == "function" && (window.removeEventListener("resize", Ii), Ii = void 0);
  };
}
function Dp(i, l) {
  return typeof i == "function" ? vT(i) : yT(i, l);
}
function ST(i) {
  return Pc(i) && i.tagName === "svg";
}
const bT = [...yg, qt, He], TT = (i) => bT.find(pg(i)), Rp = () => ({
  translate: 0,
  scale: 1,
  origin: 0,
  originPoint: 0
}), ta = () => ({
  x: Rp(),
  y: Rp()
}), Cp = () => ({ min: 0, max: 0 }), Xt = () => ({
  x: Cp(),
  y: Cp()
}), AT = /* @__PURE__ */ new WeakMap();
function hu(i) {
  return i !== null && typeof i == "object" && typeof i.start == "function";
}
function ml(i) {
  return typeof i == "string" || Array.isArray(i);
}
const Jc = [
  "animate",
  "whileInView",
  "whileFocus",
  "whileHover",
  "whileTap",
  "whileDrag",
  "exit"
], Fc = ["initial", ...Jc];
function du(i) {
  return hu(i.animate) || Fc.some((l) => ml(i[l]));
}
function Eg(i) {
  return !!(du(i) || i.variants);
}
function xT(i, l, u) {
  for (const o in l) {
    const c = l[o], h = u[o];
    if (te(c))
      i.addValue(o, c);
    else if (te(h))
      i.addValue(o, na(c, { owner: i }));
    else if (h !== c)
      if (i.hasValue(o)) {
        const f = i.getValue(o);
        f.liveStyle === !0 ? f.jump(c) : f.hasAnimated || f.set(c);
      } else {
        const f = i.getStaticValue(o);
        i.addValue(o, na(f !== void 0 ? f : c, { owner: i }));
      }
  }
  for (const o in u)
    l[o] === void 0 && i.removeValue(o);
  return l;
}
const Sc = { current: null }, Mg = { current: !1 }, ET = typeof window < "u";
function MT() {
  if (Mg.current = !0, !!ET)
    if (window.matchMedia) {
      const i = window.matchMedia("(prefers-reduced-motion)"), l = () => Sc.current = i.matches;
      i.addEventListener("change", l), l();
    } else
      Sc.current = !1;
}
const Op = [
  "AnimationStart",
  "AnimationComplete",
  "Update",
  "BeforeLayoutMeasure",
  "LayoutMeasure",
  "LayoutAnimationStart",
  "LayoutAnimationComplete"
];
let iu = {};
function Dg(i) {
  iu = i;
}
function DT() {
  return iu;
}
class RT {
  /**
   * This method takes React props and returns found MotionValues. For example, HTML
   * MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
   *
   * This isn't an abstract method as it needs calling in the constructor, but it is
   * intended to be one.
   */
  scrapeMotionValuesFromProps(l, u, o) {
    return {};
  }
  constructor({ parent: l, props: u, presenceContext: o, reducedMotionConfig: c, skipAnimations: h, blockInitialAnimation: f, visualState: m }, v = {}) {
    this.current = null, this.children = /* @__PURE__ */ new Set(), this.isVariantNode = !1, this.isControllingVariants = !1, this.shouldReduceMotion = null, this.shouldSkipAnimations = !1, this.values = /* @__PURE__ */ new Map(), this.KeyframeResolver = Hc, this.features = {}, this.valueSubscriptions = /* @__PURE__ */ new Map(), this.prevMotionValues = {}, this.hasBeenMounted = !1, this.events = {}, this.propEventSubscriptions = {}, this.notifyUpdate = () => this.notify("Update", this.latestValues), this.render = () => {
      this.current && (this.triggerBuild(), this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
    }, this.renderScheduledAt = 0, this.scheduleRender = () => {
      const V = le.now();
      this.renderScheduledAt < V && (this.renderScheduledAt = V, Rt.render(this.render, !1, !0));
    };
    const { latestValues: p, renderState: g } = m;
    this.latestValues = p, this.baseTarget = { ...p }, this.initialValues = u.initial ? { ...p } : {}, this.renderState = g, this.parent = l, this.props = u, this.presenceContext = o, this.depth = l ? l.depth + 1 : 0, this.reducedMotionConfig = c, this.skipAnimationsConfig = h, this.options = v, this.blockInitialAnimation = !!f, this.isControllingVariants = du(u), this.isVariantNode = Eg(u), this.isVariantNode && (this.variantChildren = /* @__PURE__ */ new Set()), this.manuallyAnimateOnMount = !!(l && l.current);
    const { willChange: S, ...b } = this.scrapeMotionValuesFromProps(u, {}, this);
    for (const V in b) {
      const D = b[V];
      p[V] !== void 0 && te(D) && D.set(p[V]);
    }
  }
  mount(l) {
    if (this.hasBeenMounted)
      for (const u in this.initialValues)
        this.values.get(u)?.jump(this.initialValues[u]), this.latestValues[u] = this.initialValues[u];
    this.current = l, AT.set(l, this), this.projection && !this.projection.instance && this.projection.mount(l), this.parent && this.isVariantNode && !this.isControllingVariants && (this.removeFromVariantTree = this.parent.addVariantChild(this)), this.values.forEach((u, o) => this.bindToMotionValue(o, u)), this.reducedMotionConfig === "never" ? this.shouldReduceMotion = !1 : this.reducedMotionConfig === "always" ? this.shouldReduceMotion = !0 : (Mg.current || MT(), this.shouldReduceMotion = Sc.current), this.shouldSkipAnimations = this.skipAnimationsConfig ?? !1, this.parent?.addChild(this), this.update(this.props, this.presenceContext), this.hasBeenMounted = !0;
  }
  unmount() {
    this.projection && this.projection.unmount(), qn(this.notifyUpdate), qn(this.render), this.valueSubscriptions.forEach((l) => l()), this.valueSubscriptions.clear(), this.removeFromVariantTree && this.removeFromVariantTree(), this.parent?.removeChild(this);
    for (const l in this.events)
      this.events[l].clear();
    for (const l in this.features) {
      const u = this.features[l];
      u && (u.unmount(), u.isMounted = !1);
    }
    this.current = null;
  }
  addChild(l) {
    this.children.add(l), this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set()), this.enteringChildren.add(l);
  }
  removeChild(l) {
    this.children.delete(l), this.enteringChildren && this.enteringChildren.delete(l);
  }
  bindToMotionValue(l, u) {
    if (this.valueSubscriptions.has(l) && this.valueSubscriptions.get(l)(), u.accelerate && og.has(l) && this.current instanceof HTMLElement) {
      const { factory: f, keyframes: m, times: v, ease: p, duration: g } = u.accelerate, S = new sg({
        element: this.current,
        name: l,
        keyframes: m,
        times: v,
        ease: p,
        duration: /* @__PURE__ */ Ae(g)
      }), b = f(S);
      this.valueSubscriptions.set(l, () => {
        b(), S.cancel();
      });
      return;
    }
    const o = la.has(l);
    o && this.onBindTransform && this.onBindTransform();
    const c = u.on("change", (f) => {
      this.latestValues[l] = f, this.props.onUpdate && Rt.preRender(this.notifyUpdate), o && this.projection && (this.projection.isTransformDirty = !0), this.scheduleRender();
    });
    let h;
    typeof window < "u" && window.MotionCheckAppearSync && (h = window.MotionCheckAppearSync(this, l, u)), this.valueSubscriptions.set(l, () => {
      c(), h && h();
    });
  }
  sortNodePosition(l) {
    return !this.current || !this.sortInstanceNodePosition || this.type !== l.type ? 0 : this.sortInstanceNodePosition(this.current, l.current);
  }
  updateFeatures() {
    let l = "animation";
    for (l in iu) {
      const u = iu[l];
      if (!u)
        continue;
      const { isEnabled: o, Feature: c } = u;
      if (!this.features[l] && c && o(this.props) && (this.features[l] = new c(this)), this.features[l]) {
        const h = this.features[l];
        h.isMounted ? h.update() : (h.mount(), h.isMounted = !0);
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  /**
   * Measure the current viewport box with or without transforms.
   * Only measures axis-aligned boxes, rotate and skew must be manually
   * removed with a re-render to work.
   */
  measureViewportBox() {
    return this.current ? this.measureInstanceViewportBox(this.current, this.props) : Xt();
  }
  getStaticValue(l) {
    return this.latestValues[l];
  }
  setStaticValue(l, u) {
    this.latestValues[l] = u;
  }
  /**
   * Update the provided props. Ensure any newly-added motion values are
   * added to our map, old ones removed, and listeners updated.
   */
  update(l, u) {
    (l.transformTemplate || this.props.transformTemplate) && this.scheduleRender(), this.prevProps = this.props, this.props = l, this.prevPresenceContext = this.presenceContext, this.presenceContext = u;
    for (let o = 0; o < Op.length; o++) {
      const c = Op[o];
      this.propEventSubscriptions[c] && (this.propEventSubscriptions[c](), delete this.propEventSubscriptions[c]);
      const h = "on" + c, f = l[h];
      f && (this.propEventSubscriptions[c] = this.on(c, f));
    }
    this.prevMotionValues = xT(this, this.scrapeMotionValuesFromProps(l, this.prevProps || {}, this), this.prevMotionValues), this.handleChildMotionValue && this.handleChildMotionValue();
  }
  getProps() {
    return this.props;
  }
  /**
   * Returns the variant definition with a given name.
   */
  getVariant(l) {
    return this.props.variants ? this.props.variants[l] : void 0;
  }
  /**
   * Returns the defined default transition on this component.
   */
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  /**
   * Add a child visual element to our set of children.
   */
  addVariantChild(l) {
    const u = this.getClosestVariantNode();
    if (u)
      return u.variantChildren && u.variantChildren.add(l), () => u.variantChildren.delete(l);
  }
  /**
   * Add a motion value and bind it to this visual element.
   */
  addValue(l, u) {
    const o = this.values.get(l);
    u !== o && (o && this.removeValue(l), this.bindToMotionValue(l, u), this.values.set(l, u), this.latestValues[l] = u.get());
  }
  /**
   * Remove a motion value and unbind any active subscriptions.
   */
  removeValue(l) {
    this.values.delete(l);
    const u = this.valueSubscriptions.get(l);
    u && (u(), this.valueSubscriptions.delete(l)), delete this.latestValues[l], this.removeValueFromRenderState(l, this.renderState);
  }
  /**
   * Check whether we have a motion value for this key
   */
  hasValue(l) {
    return this.values.has(l);
  }
  getValue(l, u) {
    if (this.props.values && this.props.values[l])
      return this.props.values[l];
    let o = this.values.get(l);
    return o === void 0 && u !== void 0 && (o = na(u === null ? void 0 : u, { owner: this }), this.addValue(l, o)), o;
  }
  /**
   * If we're trying to animate to a previously unencountered value,
   * we need to check for it in our state and as a last resort read it
   * directly from the instance (which might have performance implications).
   */
  readValue(l, u) {
    let o = this.latestValues[l] !== void 0 || !this.current ? this.latestValues[l] : this.getBaseTargetFromProps(this.props, l) ?? this.readValueFromInstance(this.current, l, this.options);
    return o != null && (typeof o == "string" && (Dy(o) || Cy(o)) ? o = parseFloat(o) : !TT(o) && He.test(u) && (o = vg(l, u)), this.setBaseTarget(l, te(o) ? o.get() : o)), te(o) ? o.get() : o;
  }
  /**
   * Set the base target to later animate back to. This is currently
   * only hydrated on creation and when we first read a value.
   */
  setBaseTarget(l, u) {
    this.baseTarget[l] = u;
  }
  /**
   * Find the base target for a value thats been removed from all animation
   * props.
   */
  getBaseTarget(l) {
    const { initial: u } = this.props;
    let o;
    if (typeof u == "string" || typeof u == "object") {
      const h = Xc(this.props, u, this.presenceContext?.custom);
      h && (o = h[l]);
    }
    if (u && o !== void 0)
      return o;
    const c = this.getBaseTargetFromProps(this.props, l);
    return c !== void 0 && !te(c) ? c : this.initialValues[l] !== void 0 && o === void 0 ? void 0 : this.baseTarget[l];
  }
  on(l, u) {
    return this.events[l] || (this.events[l] = new Vc()), this.events[l].add(u);
  }
  notify(l, ...u) {
    this.events[l] && this.events[l].notify(...u);
  }
  scheduleRenderMicrotask() {
    Qc.render(this.render);
  }
}
class Rg extends RT {
  constructor() {
    super(...arguments), this.KeyframeResolver = eT;
  }
  sortInstanceNodePosition(l, u) {
    return l.compareDocumentPosition(u) & 2 ? 1 : -1;
  }
  getBaseTargetFromProps(l, u) {
    const o = l.style;
    return o ? o[u] : void 0;
  }
  removeValueFromRenderState(l, { vars: u, style: o }) {
    delete u[l], delete o[l];
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    const { children: l } = this.props;
    te(l) && (this.childSubscription = l.on("change", (u) => {
      this.current && (this.current.textContent = `${u}`);
    }));
  }
}
class Yn {
  constructor(l) {
    this.isMounted = !1, this.node = l;
  }
  update() {
  }
}
function Cg({ top: i, left: l, right: u, bottom: o }) {
  return {
    x: { min: l, max: u },
    y: { min: i, max: o }
  };
}
function CT({ x: i, y: l }) {
  return { top: l.min, right: i.max, bottom: l.max, left: i.min };
}
function OT(i, l) {
  if (!l)
    return i;
  const u = l({ x: i.left, y: i.top }), o = l({ x: i.right, y: i.bottom });
  return {
    top: u.y,
    left: u.x,
    bottom: o.y,
    right: o.x
  };
}
function Kr(i) {
  return i === void 0 || i === 1;
}
function bc({ scale: i, scaleX: l, scaleY: u }) {
  return !Kr(i) || !Kr(l) || !Kr(u);
}
function ui(i) {
  return bc(i) || Og(i) || i.z || i.rotate || i.rotateX || i.rotateY || i.skewX || i.skewY;
}
function Og(i) {
  return Vp(i.x) || Vp(i.y);
}
function Vp(i) {
  return i && i !== "0%";
}
function au(i, l, u) {
  const o = i - u, c = l * o;
  return u + c;
}
function wp(i, l, u, o, c) {
  return c !== void 0 && (i = au(i, c, o)), au(i, u, o) + l;
}
function Tc(i, l = 0, u = 1, o, c) {
  i.min = wp(i.min, l, u, o, c), i.max = wp(i.max, l, u, o, c);
}
function Vg(i, { x: l, y: u }) {
  Tc(i.x, l.translate, l.scale, l.originPoint), Tc(i.y, u.translate, u.scale, u.originPoint);
}
const zp = 0.999999999999, _p = 1.0000000000001;
function VT(i, l, u, o = !1) {
  const c = u.length;
  if (!c)
    return;
  l.x = l.y = 1;
  let h, f;
  for (let m = 0; m < c; m++) {
    h = u[m], f = h.projectionDelta;
    const { visualElement: v } = h.options;
    v && v.props.style && v.props.style.display === "contents" || (o && h.options.layoutScroll && h.scroll && h !== h.root && (ke(i.x, -h.scroll.offset.x), ke(i.y, -h.scroll.offset.y)), f && (l.x *= f.x.scale, l.y *= f.y.scale, Vg(i, f)), o && ui(h.latestValues) && Ps(i, h.latestValues, h.layout?.layoutBox));
  }
  l.x < _p && l.x > zp && (l.x = 1), l.y < _p && l.y > zp && (l.y = 1);
}
function ke(i, l) {
  i.min += l, i.max += l;
}
function Bp(i, l, u, o, c = 0.5) {
  const h = Dt(i.min, i.max, c);
  Tc(i, l, u, h, o);
}
function Np(i, l) {
  return typeof i == "string" ? parseFloat(i) / 100 * (l.max - l.min) : i;
}
function Ps(i, l, u) {
  const o = u ?? i;
  Bp(i.x, Np(l.x, o.x), l.scaleX, l.scale, l.originX), Bp(i.y, Np(l.y, o.y), l.scaleY, l.scale, l.originY);
}
function wg(i, l) {
  return Cg(OT(i.getBoundingClientRect(), l));
}
function wT(i, l, u) {
  const o = wg(i, u), { scroll: c } = l;
  return c && (ke(o.x, c.offset.x), ke(o.y, c.offset.y)), o;
}
const zT = {
  x: "translateX",
  y: "translateY",
  z: "translateZ",
  transformPerspective: "perspective"
}, _T = aa.length;
function BT(i, l, u) {
  let o = "", c = !0;
  for (let f = 0; f < _T; f++) {
    const m = aa[f], v = i[m];
    if (v === void 0)
      continue;
    let p = !0;
    if (typeof v == "number")
      p = v === (m.startsWith("scale") ? 1 : 0);
    else {
      const g = parseFloat(v);
      p = m.startsWith("scale") ? g === 1 : g === 0;
    }
    if (!p || u) {
      const g = vc(v, nu[m]);
      if (!p) {
        c = !1;
        const S = zT[m] || m;
        o += `${S}(${g}) `;
      }
      u && (l[m] = g);
    }
  }
  const h = i.pathRotation;
  return h && (c = !1, o += `rotate(${vc(h, nu.pathRotation)}) `), o = o.trim(), u ? o = u(l, c ? "" : o) : c && (o = "none"), o;
}
function Wc(i, l, u) {
  const { style: o, vars: c, transformOrigin: h } = i;
  let f = !1, m = !1;
  for (const v in l) {
    const p = l[v];
    if (la.has(v)) {
      f = !0;
      continue;
    } else if (Xy(v)) {
      c[v] = p;
      continue;
    } else {
      const g = vc(p, nu[v]);
      v.startsWith("origin") ? (m = !0, h[v] = g) : o[v] = g;
    }
  }
  if (l.transform || (f || u ? o.transform = BT(l, i.transform, u) : o.transform && (o.transform = "none")), m) {
    const { originX: v = "50%", originY: p = "50%", originZ: g = 0 } = h;
    o.transformOrigin = `${v} ${p} ${g}`;
  }
}
function zg(i, { style: l, vars: u }, o, c) {
  const h = i.style;
  let f;
  for (f in l)
    h[f] = l[f];
  c?.applyProjectionStyles(h, o);
  for (f in u)
    h.setProperty(f, u[f]);
}
function Up(i, l) {
  return l.max === l.min ? 0 : i / (l.max - l.min) * 100;
}
const ll = {
  correct: (i, l) => {
    if (!l.target)
      return i;
    if (typeof i == "string")
      if (W.test(i))
        i = parseFloat(i);
      else
        return i;
    const u = Up(i, l.target.x), o = Up(i, l.target.y);
    return `${u}% ${o}%`;
  }
}, NT = {
  correct: (i, { treeScale: l, projectionDelta: u }) => {
    const o = i, c = He.parse(i);
    if (c.length > 5)
      return o;
    const h = He.createTransformer(i), f = typeof c[0] != "number" ? 1 : 0, m = u.x.scale * l.x, v = u.y.scale * l.y;
    c[0 + f] /= m, c[1 + f] /= v;
    const p = Dt(m, v, 0.5);
    return typeof c[2 + f] == "number" && (c[2 + f] /= p), typeof c[3 + f] == "number" && (c[3 + f] /= p), h(c);
  }
}, Ac = {
  borderRadius: {
    ...ll,
    applyTo: [...Kc]
  },
  borderTopLeftRadius: ll,
  borderTopRightRadius: ll,
  borderBottomLeftRadius: ll,
  borderBottomRightRadius: ll,
  boxShadow: NT
};
function _g(i, { layout: l, layoutId: u }) {
  return la.has(i) || i.startsWith("origin") || (l || u !== void 0) && (!!Ac[i] || i === "opacity");
}
function $c(i, l, u) {
  const o = i.style, c = l?.style, h = {};
  if (!o)
    return h;
  for (const f in o)
    (te(o[f]) || c && te(c[f]) || _g(f, i) || u?.getValue(f)?.liveStyle !== void 0) && (h[f] = o[f]);
  return h;
}
function UT(i) {
  return window.getComputedStyle(i);
}
class jT extends Rg {
  constructor() {
    super(...arguments), this.type = "html", this.renderInstance = zg;
  }
  mount(l) {
    cu(!!l.style), super.mount(l);
  }
  readValueFromInstance(l, u) {
    if (la.has(u))
      return this.projection?.isProjecting ? uc(u) : ib(l, u);
    {
      const o = UT(l), c = (Xy(u) ? o.getPropertyValue(u) : o[u]) || 0;
      return typeof c == "string" ? c.trim() : c;
    }
  }
  measureInstanceViewportBox(l, { transformPagePoint: u }) {
    return wg(l, u);
  }
  build(l, u, o) {
    Wc(l, u, o.transformTemplate);
  }
  scrapeMotionValuesFromProps(l, u, o) {
    return $c(l, u, o);
  }
}
const LT = {
  offset: "stroke-dashoffset",
  array: "stroke-dasharray"
}, HT = {
  offset: "strokeDashoffset",
  array: "strokeDasharray"
};
function qT(i, l, u = 1, o = 0, c = !0) {
  i.pathLength = 1;
  const h = c ? LT : HT;
  i[h.offset] = `${-o}`, i[h.array] = `${l} ${u}`;
}
const YT = [
  "offsetDistance",
  "offsetPath",
  "offsetRotate",
  "offsetAnchor"
];
function Bg(i, {
  attrX: l,
  attrY: u,
  attrScale: o,
  pathLength: c,
  pathSpacing: h = 1,
  pathOffset: f = 0,
  // This is object creation, which we try to avoid per-frame.
  ...m
}, v, p, g) {
  if (Wc(i, m, p), v) {
    i.style.viewBox && (i.attrs.viewBox = i.style.viewBox);
    return;
  }
  i.attrs = i.style, i.style = {};
  const { attrs: S, style: b } = i;
  S.transform && (b.transform = S.transform, delete S.transform), (b.transform || S.transformOrigin) && (b.transformOrigin = S.transformOrigin ?? "50% 50%", delete S.transformOrigin), b.transform && (b.transformBox = g?.transformBox ?? "fill-box", delete S.transformBox);
  for (const V of YT)
    S[V] !== void 0 && (b[V] = S[V], delete S[V]);
  l !== void 0 && (S.x = l), u !== void 0 && (S.y = u), o !== void 0 && (S.scale = o), c !== void 0 && qT(S, c, h, f, !1);
}
const Ng = /* @__PURE__ */ new Set([
  "baseFrequency",
  "diffuseConstant",
  "kernelMatrix",
  "kernelUnitLength",
  "keySplines",
  "keyTimes",
  "limitingConeAngle",
  "markerHeight",
  "markerWidth",
  "numOctaves",
  "targetX",
  "targetY",
  "surfaceScale",
  "specularConstant",
  "specularExponent",
  "stdDeviation",
  "tableValues",
  "viewBox",
  "gradientTransform",
  "pathLength",
  "startOffset",
  "textLength",
  "lengthAdjust"
]), Ug = (i) => typeof i == "string" && i.toLowerCase() === "svg";
function GT(i, l, u, o) {
  zg(i, l, void 0, o);
  for (const c in l.attrs)
    i.setAttribute(Ng.has(c) ? c : Zc(c), l.attrs[c]);
}
function jg(i, l, u) {
  const o = $c(i, l, u);
  for (const c in i)
    if (te(i[c]) || te(l[c])) {
      const h = aa.indexOf(c) !== -1 ? "attr" + c.charAt(0).toUpperCase() + c.substring(1) : c;
      o[h] = i[c];
    }
  return o;
}
class XT extends Rg {
  constructor() {
    super(...arguments), this.type = "svg", this.isSVGTag = !1, this.measureInstanceViewportBox = Xt;
  }
  getBaseTargetFromProps(l, u) {
    return l[u];
  }
  readValueFromInstance(l, u) {
    if (la.has(u)) {
      const o = gg(u);
      return o && o.default || 0;
    }
    return u = Ng.has(u) ? u : Zc(u), l.getAttribute(u);
  }
  scrapeMotionValuesFromProps(l, u, o) {
    return jg(l, u, o);
  }
  build(l, u, o) {
    Bg(l, u, this.isSVGTag, o.transformTemplate, o.style);
  }
  renderInstance(l, u, o, c) {
    GT(l, u, o, c);
  }
  mount(l) {
    this.isSVGTag = Ug(l.tagName), super.mount(l);
  }
}
const ZT = Fc.length;
function Lg(i) {
  if (!i)
    return;
  if (!i.isControllingVariants) {
    const u = i.parent ? Lg(i.parent) || {} : {};
    return i.props.initial !== void 0 && (u.initial = i.props.initial), u;
  }
  const l = {};
  for (let u = 0; u < ZT; u++) {
    const o = Fc[u], c = i.props[o];
    (ml(c) || c === !1) && (l[o] = c);
  }
  return l;
}
function Hg(i, l) {
  if (!Array.isArray(l))
    return !1;
  const u = l.length;
  if (u !== i.length)
    return !1;
  for (let o = 0; o < u; o++)
    if (l[o] !== i[o])
      return !1;
  return !0;
}
const KT = [...Jc].reverse(), QT = Jc.length;
function kT(i) {
  return (l) => Promise.all(l.map(({ animation: u, options: o }) => Zb(i, u, o)));
}
function PT(i) {
  let l = kT(i), u = jp(), o = !0, c = !1;
  const h = (p) => (g, S) => {
    const b = fi(i, S, p === "exit" ? i.presenceContext?.custom : void 0);
    if (b) {
      const { transition: V, transitionEnd: D, ...z } = b;
      g = { ...g, ...z, ...D };
    }
    return g;
  };
  function f(p) {
    l = p(i);
  }
  function m(p) {
    const { props: g } = i, S = Lg(i.parent) || {}, b = [], V = /* @__PURE__ */ new Set();
    let D = {}, z = 1 / 0;
    for (let H = 0; H < QT; H++) {
      const X = KT[H], q = u[X], G = g[X] !== void 0 ? g[X] : S[X], Z = ml(G), it = X === p ? q.isActive : null;
      it === !1 && (z = H);
      let at = G === S[X] && G !== g[X] && Z;
      if (at && (o || c) && i.manuallyAnimateOnMount && (at = !1), q.protectedKeys = { ...D }, // If it isn't active and hasn't *just* been set as inactive
      !q.isActive && it === null || // If we didn't and don't have any defined prop for this animation type
      !G && !q.prevProp || // Or if the prop doesn't define an animation
      hu(G) || typeof G == "boolean")
        continue;
      if (X === "exit" && q.isActive && it !== !0) {
        q.prevResolvedValues && (D = {
          ...D,
          ...q.prevResolvedValues
        });
        continue;
      }
      const P = JT(q.prevProp, G);
      let st = P || // If we're making this variant active, we want to always make it active
      X === p && q.isActive && !at && Z || // If we removed a higher-priority variant (i is in reverse order)
      H > z && Z, $ = !1;
      const mt = Array.isArray(G) ? G : [G];
      let pt = mt.reduce(h(X), {});
      it === !1 && (pt = {});
      const { prevResolvedValues: Jt = {} } = q, Zt = {
        ...Jt,
        ...pt
      }, Ct = (J) => {
        st = !0, V.has(J) && ($ = !0, V.delete(J)), q.needsAnimating[J] = !0;
        const rt = i.getValue(J);
        rt && (rt.liveStyle = !1);
      };
      for (const J in Zt) {
        const rt = pt[J], A = Jt[J];
        if (D.hasOwnProperty(J))
          continue;
        let j = !1;
        dc(rt) && dc(A) ? j = !Hg(rt, A) || P : j = rt !== A, j ? rt != null ? Ct(J) : V.add(J) : rt !== void 0 && V.has(J) ? Ct(J) : q.protectedKeys[J] = !0;
      }
      q.prevProp = G, q.prevResolvedValues = pt, q.isActive && (D = { ...D, ...pt }), (o || c) && i.blockInitialAnimation && (st = !1);
      const w = at && P;
      st && (!w || $) && b.push(...mt.map((J) => {
        const rt = { type: X };
        if (typeof J == "string" && (o || c) && !w && i.manuallyAnimateOnMount && i.parent) {
          const { parent: A } = i, j = fi(A, J);
          if (A.enteringChildren && j) {
            const { delayChildren: k } = j.transition || {};
            rt.delay = rg(A.enteringChildren, i, k);
          }
        }
        return {
          animation: J,
          options: rt
        };
      }));
    }
    if (V.size) {
      const H = {};
      if (typeof g.initial != "boolean") {
        const X = fi(i, Array.isArray(g.initial) ? g.initial[0] : g.initial);
        X && X.transition && (H.transition = X.transition);
      }
      V.forEach((X) => {
        const q = i.getBaseTarget(X), G = i.getValue(X);
        G && (G.liveStyle = !0), H[X] = q ?? null;
      }), b.push({ animation: H });
    }
    let B = !!b.length;
    return o && (g.initial === !1 || g.initial === g.animate) && !i.manuallyAnimateOnMount && (B = !1), o = !1, c = !1, B ? l(b) : Promise.resolve();
  }
  function v(p, g) {
    if (u[p].isActive === g)
      return Promise.resolve();
    i.variantChildren?.forEach((b) => b.animationState?.setActive(p, g)), u[p].isActive = g;
    const S = m(p);
    for (const b in u)
      u[b].protectedKeys = {};
    return S;
  }
  return {
    animateChanges: m,
    setActive: v,
    setAnimateFunction: f,
    getState: () => u,
    reset: () => {
      u = jp(), c = !0;
    }
  };
}
function JT(i, l) {
  return typeof l == "string" ? l !== i : Array.isArray(l) ? !Hg(l, i) : !1;
}
function si(i = !1) {
  return {
    isActive: i,
    protectedKeys: {},
    needsAnimating: {},
    prevResolvedValues: {}
  };
}
function jp() {
  return {
    animate: si(!0),
    whileInView: si(),
    whileHover: si(),
    whileTap: si(),
    whileDrag: si(),
    whileFocus: si(),
    exit: si()
  };
}
function xc(i, l) {
  i.min = l.min, i.max = l.max;
}
function je(i, l) {
  xc(i.x, l.x), xc(i.y, l.y);
}
function Lp(i, l) {
  i.translate = l.translate, i.scale = l.scale, i.originPoint = l.originPoint, i.origin = l.origin;
}
const qg = 1e-4, FT = 1 - qg, WT = 1 + qg, Yg = 0.01, $T = 0 - Yg, IT = 0 + Yg;
function se(i) {
  return i.max - i.min;
}
function tA(i, l, u) {
  return Math.abs(i - l) <= u;
}
function Hp(i, l, u, o = 0.5) {
  i.origin = o, i.originPoint = Dt(l.min, l.max, i.origin), i.scale = se(u) / se(l), i.translate = Dt(u.min, u.max, i.origin) - i.originPoint, (i.scale >= FT && i.scale <= WT || isNaN(i.scale)) && (i.scale = 1), (i.translate >= $T && i.translate <= IT || isNaN(i.translate)) && (i.translate = 0);
}
function rl(i, l, u, o) {
  Hp(i.x, l.x, u.x, o ? o.originX : void 0), Hp(i.y, l.y, u.y, o ? o.originY : void 0);
}
function qp(i, l, u, o = 0) {
  const c = o ? Dt(u.min, u.max, o) : u.min;
  i.min = c + l.min, i.max = i.min + se(l);
}
function eA(i, l, u, o) {
  qp(i.x, l.x, u.x, o?.x), qp(i.y, l.y, u.y, o?.y);
}
function Yp(i, l, u, o = 0) {
  const c = o ? Dt(u.min, u.max, o) : u.min;
  i.min = l.min - c, i.max = i.min + se(l);
}
function lu(i, l, u, o) {
  Yp(i.x, l.x, u.x, o?.x), Yp(i.y, l.y, u.y, o?.y);
}
function Gp(i, l, u, o, c) {
  return i -= l, i = au(i, 1 / u, o), c !== void 0 && (i = au(i, 1 / c, o)), i;
}
function nA(i, l = 0, u = 1, o = 0.5, c, h = i, f = i) {
  if (Pe.test(l) && (l = parseFloat(l), l = Dt(f.min, f.max, l / 100) - f.min), typeof l != "number")
    return;
  let m = Dt(h.min, h.max, o);
  i === h && (m -= l), i.min = Gp(i.min, l, u, m, c), i.max = Gp(i.max, l, u, m, c);
}
function Xp(i, l, [u, o, c], h, f) {
  nA(i, l[u], l[o], l[c], l.scale, h, f);
}
const iA = ["x", "scaleX", "originX"], aA = ["y", "scaleY", "originY"];
function Zp(i, l, u, o) {
  Xp(i.x, l, iA, u ? u.x : void 0, o ? o.x : void 0), Xp(i.y, l, aA, u ? u.y : void 0, o ? o.y : void 0);
}
function Kp(i) {
  return i.translate === 0 && i.scale === 1;
}
function Gg(i) {
  return Kp(i.x) && Kp(i.y);
}
function Qp(i, l) {
  return i.min === l.min && i.max === l.max;
}
function lA(i, l) {
  return Qp(i.x, l.x) && Qp(i.y, l.y);
}
function kp(i, l) {
  return Math.round(i.min) === Math.round(l.min) && Math.round(i.max) === Math.round(l.max);
}
function Xg(i, l) {
  return kp(i.x, l.x) && kp(i.y, l.y);
}
function Pp(i) {
  return se(i.x) / se(i.y);
}
function Jp(i, l) {
  return i.translate === l.translate && i.scale === l.scale && i.originPoint === l.originPoint;
}
function Qe(i) {
  return [i("x"), i("y")];
}
function sA(i, l, u) {
  let o = "";
  const c = i.x.translate / l.x, h = i.y.translate / l.y, f = u?.z || 0;
  if ((c || h || f) && (o = `translate3d(${c}px, ${h}px, ${f}px) `), (l.x !== 1 || l.y !== 1) && (o += `scale(${1 / l.x}, ${1 / l.y}) `), u) {
    const { transformPerspective: p, rotate: g, pathRotation: S, rotateX: b, rotateY: V, skewX: D, skewY: z } = u;
    p && (o = `perspective(${p}px) ${o}`), g && (o += `rotate(${g}deg) `), S && (o += `rotate(${S}deg) `), b && (o += `rotateX(${b}deg) `), V && (o += `rotateY(${V}deg) `), D && (o += `skewX(${D}deg) `), z && (o += `skewY(${z}deg) `);
  }
  const m = i.x.scale * l.x, v = i.y.scale * l.y;
  return (m !== 1 || v !== 1) && (o += `scale(${m}, ${v})`), o || "none";
}
const uA = Kc.length, Fp = (i) => typeof i == "string" ? parseFloat(i) : i, Wp = (i) => typeof i == "number" || W.test(i);
function oA(i, l, u, o, c, h) {
  c ? (i.opacity = Dt(0, u.opacity ?? 1, rA(o)), i.opacityExit = Dt(l.opacity ?? 1, 0, cA(o))) : h && (i.opacity = Dt(l.opacity ?? 1, u.opacity ?? 1, o));
  for (let f = 0; f < uA; f++) {
    const m = Kc[f];
    let v = $p(l, m), p = $p(u, m);
    if (v === void 0 && p === void 0)
      continue;
    v || (v = 0), p || (p = 0), v === 0 || p === 0 || Wp(v) === Wp(p) ? (i[m] = Math.max(Dt(Fp(v), Fp(p), o), 0), (Pe.test(p) || Pe.test(v)) && (i[m] += "%")) : i[m] = p;
  }
  (l.rotate || u.rotate) && (i.rotate = Dt(l.rotate || 0, u.rotate || 0, o));
}
function $p(i, l) {
  return i[l] !== void 0 ? i[l] : i.borderRadius;
}
const rA = /* @__PURE__ */ Zg(0, 0.5, jy), cA = /* @__PURE__ */ Zg(0.5, 0.95, _e);
function Zg(i, l, u) {
  return (o) => o < i ? 0 : o > l ? 1 : u(/* @__PURE__ */ hl(i, l, o));
}
function fA(i, l, u) {
  const o = te(i) ? i : na(i);
  return o.start(Gc("", o, l, u)), o.animation;
}
function pl(i, l, u, o = { passive: !0 }) {
  return i.addEventListener(l, u, o), () => i.removeEventListener(l, u, o);
}
const hA = (i, l) => i.depth - l.depth;
class dA {
  constructor() {
    this.children = [], this.isDirty = !1;
  }
  add(l) {
    Oc(this.children, l), this.isDirty = !0;
  }
  remove(l) {
    Ws(this.children, l), this.isDirty = !0;
  }
  forEach(l) {
    this.isDirty && this.children.sort(hA), this.isDirty = !1, this.children.forEach(l);
  }
}
function mA(i, l) {
  const u = le.now(), o = ({ timestamp: c }) => {
    const h = c - u;
    h >= l && (qn(o), i(h - l));
  };
  return Rt.setup(o, !0), () => qn(o);
}
function Js(i) {
  return te(i) ? i.get() : i;
}
class pA {
  constructor() {
    this.members = [];
  }
  add(l) {
    Oc(this.members, l);
    for (let u = this.members.length - 1; u >= 0; u--) {
      const o = this.members[u];
      if (o === l || o === this.lead || o === this.prevLead)
        continue;
      const c = o.instance;
      (!c || c.isConnected === !1) && !o.snapshot && (Ws(this.members, o), o.unmount());
    }
    l.scheduleRender();
  }
  remove(l) {
    if (Ws(this.members, l), l === this.prevLead && (this.prevLead = void 0), l === this.lead) {
      const u = this.members[this.members.length - 1];
      u && this.promote(u);
    }
  }
  relegate(l) {
    for (let u = this.members.indexOf(l) - 1; u >= 0; u--) {
      const o = this.members[u];
      if (o.isPresent !== !1 && o.instance?.isConnected !== !1)
        return this.promote(o), !0;
    }
    return !1;
  }
  promote(l, u) {
    const o = this.lead;
    if (l !== o && (this.prevLead = o, this.lead = l, l.show(), o)) {
      o.updateSnapshot(), l.scheduleRender();
      const { layoutDependency: c } = o.options, { layoutDependency: h } = l.options;
      (c === void 0 || c !== h) && (l.resumeFrom = o, u && (o.preserveOpacity = !0), o.snapshot && (l.snapshot = o.snapshot, l.snapshot.latestValues = o.animationValues || o.latestValues), l.root?.isUpdating && (l.isLayoutDirty = !0)), l.options.crossfade === !1 && o.hide();
    }
  }
  exitAnimationComplete() {
    this.members.forEach((l) => {
      l.options.onExitComplete?.(), l.resumingFrom?.options.onExitComplete?.();
    });
  }
  scheduleRender() {
    this.members.forEach((l) => l.instance && l.scheduleRender(!1));
  }
  removeLeadSnapshot() {
    this.lead?.snapshot && (this.lead.snapshot = void 0);
  }
}
const Fs = {
  /**
   * Global flag as to whether the tree has animated since the last time
   * we resized the window
   */
  hasAnimatedSinceResize: !0,
  /**
   * We set this to true once, on the first update. Any nodes added to the tree beyond that
   * update will be given a `data-projection-id` attribute.
   */
  hasEverUpdated: !1
}, Qr = ["", "X", "Y", "Z"], yA = 1e3;
let gA = 0;
function kr(i, l, u, o) {
  const { latestValues: c } = l;
  c[i] && (u[i] = c[i], l.setStaticValue(i, 0), o && (o[i] = 0));
}
function Kg(i) {
  if (i.hasCheckedOptimisedAppear = !0, i.root === i)
    return;
  const { visualElement: l } = i.options;
  if (!l)
    return;
  const u = dg(l);
  if (window.MotionHasOptimisedAnimation(u, "transform")) {
    const { layout: c, layoutId: h } = i.options;
    window.MotionCancelOptimisedAnimation(u, "transform", Rt, !(c || h));
  }
  const { parent: o } = i;
  o && !o.hasCheckedOptimisedAppear && Kg(o);
}
function Qg({ attachResizeListener: i, defaultParent: l, measureScroll: u, checkIsScrollRoot: o, resetTransform: c }) {
  return class {
    constructor(f = {}, m = l?.()) {
      this.id = gA++, this.animationId = 0, this.animationCommitId = 0, this.children = /* @__PURE__ */ new Set(), this.options = {}, this.isTreeAnimating = !1, this.isAnimationBlocked = !1, this.isLayoutDirty = !1, this.isProjectionDirty = !1, this.isSharedProjectionDirty = !1, this.isTransformDirty = !1, this.updateManuallyBlocked = !1, this.updateBlockedByResize = !1, this.isUpdating = !1, this.isSVG = !1, this.needsReset = !1, this.shouldResetTransform = !1, this.hasCheckedOptimisedAppear = !1, this.treeScale = { x: 1, y: 1 }, this.eventHandlers = /* @__PURE__ */ new Map(), this.hasTreeAnimated = !1, this.layoutVersion = 0, this.updateScheduled = !1, this.scheduleUpdate = () => this.update(), this.projectionUpdateScheduled = !1, this.checkUpdateFailed = () => {
        this.isUpdating && (this.isUpdating = !1, this.clearAllSnapshots());
      }, this.updateProjection = () => {
        this.projectionUpdateScheduled = !1, this.nodes.forEach(bA), this.nodes.forEach(DA), this.nodes.forEach(RA), this.nodes.forEach(TA);
      }, this.resolvedRelativeTargetAt = 0, this.linkedParentVersion = 0, this.hasProjected = !1, this.isVisible = !0, this.animationProgress = 0, this.sharedNodes = /* @__PURE__ */ new Map(), this.latestValues = f, this.root = m ? m.root || m : this, this.path = m ? [...m.path, m] : [], this.parent = m, this.depth = m ? m.depth + 1 : 0;
      for (let v = 0; v < this.path.length; v++)
        this.path[v].shouldResetTransform = !0;
      this.root === this && (this.nodes = new dA());
    }
    addEventListener(f, m) {
      return this.eventHandlers.has(f) || this.eventHandlers.set(f, new Vc()), this.eventHandlers.get(f).add(m);
    }
    notifyListeners(f, ...m) {
      const v = this.eventHandlers.get(f);
      v && v.notify(...m);
    }
    hasListeners(f) {
      return this.eventHandlers.has(f);
    }
    /**
     * Lifecycles
     */
    mount(f) {
      if (this.instance)
        return;
      this.isSVG = Pc(f) && !ST(f), this.instance = f;
      const { layoutId: m, layout: v, visualElement: p } = this.options;
      if (p && !p.current && p.mount(f), this.root.nodes.add(this), this.parent && this.parent.children.add(this), this.root.hasTreeAnimated && (v || m) && (this.isLayoutDirty = !0), i) {
        let g, S = 0;
        const b = () => this.root.updateBlockedByResize = !1;
        Rt.read(() => {
          S = window.innerWidth;
        }), i(f, () => {
          const V = window.innerWidth;
          V !== S && (S = V, this.root.updateBlockedByResize = !0, g && g(), g = mA(b, 250), Fs.hasAnimatedSinceResize && (Fs.hasAnimatedSinceResize = !1, this.nodes.forEach(ey)));
        });
      }
      m && this.root.registerSharedNode(m, this), this.options.animate !== !1 && p && (m || v) && this.addEventListener("didUpdate", ({ delta: g, hasLayoutChanged: S, hasRelativeLayoutChanged: b, layout: V }) => {
        if (this.isTreeAnimationBlocked()) {
          this.target = void 0, this.relativeTarget = void 0;
          return;
        }
        const D = this.options.transition || p.getDefaultTransition() || zA, { onLayoutAnimationStart: z, onLayoutAnimationComplete: B } = p.getProps(), H = !this.targetLayout || !Xg(this.targetLayout, V), X = !S && b;
        if (this.options.layoutRoot || this.resumeFrom || X || S && (H || !this.currentAnimation)) {
          this.resumeFrom && (this.resumingFrom = this.resumeFrom, this.resumingFrom.resumingFrom = void 0);
          const q = {
            ...Yc(D, "layout"),
            onPlay: z,
            onComplete: B
          };
          (p.shouldReduceMotion || this.options.layoutRoot) && (q.delay = 0, q.type = !1), this.startAnimation(q), this.setAnimationOrigin(g, X, q.path);
        } else
          S || ey(this), this.isLead() && this.options.onExitComplete && this.options.onExitComplete();
        this.targetLayout = V;
      });
    }
    unmount() {
      this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this);
      const f = this.getStack();
      f && f.remove(this), this.parent && this.parent.children.delete(this), this.instance = void 0, this.eventHandlers.clear(), qn(this.updateProjection);
    }
    // only on the root
    blockUpdate() {
      this.updateManuallyBlocked = !0;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = !1;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || !1;
    }
    // Note: currently only running on root node
    startUpdate() {
      this.isUpdateBlocked() || (this.isUpdating = !0, this.nodes && this.nodes.forEach(CA), this.animationId++);
    }
    getTransformTemplate() {
      const { visualElement: f } = this.options;
      return f && f.getProps().transformTemplate;
    }
    willUpdate(f = !0) {
      if (this.root.hasTreeAnimated = !0, this.root.isUpdateBlocked()) {
        this.options.onExitComplete && this.options.onExitComplete();
        return;
      }
      if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && Kg(this), !this.root.isUpdating && this.root.startUpdate(), this.isLayoutDirty)
        return;
      this.isLayoutDirty = !0;
      for (let g = 0; g < this.path.length; g++) {
        const S = this.path[g];
        S.shouldResetTransform = !0, (typeof S.latestValues.x == "string" || typeof S.latestValues.y == "string") && (S.isLayoutDirty = !0), S.updateScroll("snapshot"), S.options.layoutRoot && S.willUpdate(!1);
      }
      const { layoutId: m, layout: v } = this.options;
      if (m === void 0 && !v)
        return;
      const p = this.getTransformTemplate();
      this.prevTransformTemplateValue = p ? p(this.latestValues, "") : void 0, this.updateSnapshot(), f && this.notifyListeners("willUpdate");
    }
    update() {
      if (this.updateScheduled = !1, this.isUpdateBlocked()) {
        const v = this.updateBlockedByResize;
        this.unblockUpdate(), this.updateBlockedByResize = !1, this.clearAllSnapshots(), v && this.nodes.forEach(xA), this.nodes.forEach(Ip);
        return;
      }
      if (this.animationId <= this.animationCommitId) {
        this.nodes.forEach(ty);
        return;
      }
      this.animationCommitId = this.animationId, this.isUpdating ? (this.isUpdating = !1, this.nodes.forEach(EA), this.nodes.forEach(MA), this.nodes.forEach(vA), this.nodes.forEach(SA)) : this.nodes.forEach(ty), this.clearAllSnapshots();
      const m = le.now();
      It.delta = Je(0, 1e3 / 60, m - It.timestamp), It.timestamp = m, It.isProcessing = !0, Lr.update.process(It), Lr.preRender.process(It), Lr.render.process(It), It.isProcessing = !1;
    }
    didUpdate() {
      this.updateScheduled || (this.updateScheduled = !0, Qc.read(this.scheduleUpdate));
    }
    clearAllSnapshots() {
      this.nodes.forEach(AA), this.sharedNodes.forEach(OA);
    }
    scheduleUpdateProjection() {
      this.projectionUpdateScheduled || (this.projectionUpdateScheduled = !0, Rt.preRender(this.updateProjection, !1, !0));
    }
    scheduleCheckAfterUnmount() {
      Rt.postRender(() => {
        this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
      });
    }
    /**
     * Update measurements
     */
    updateSnapshot() {
      this.snapshot || !this.instance || (this.snapshot = this.measure(), this.snapshot && !se(this.snapshot.measuredBox.x) && !se(this.snapshot.measuredBox.y) && (this.snapshot = void 0));
    }
    updateLayout() {
      if (!this.instance || (this.updateScroll(), !(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty))
        return;
      if (this.resumeFrom && !this.resumeFrom.instance)
        for (let v = 0; v < this.path.length; v++)
          this.path[v].updateScroll();
      const f = this.layout;
      this.layout = this.measure(!1), this.layoutVersion++, this.layoutCorrected || (this.layoutCorrected = Xt()), this.isLayoutDirty = !1, this.projectionDelta = void 0, this.notifyListeners("measure", this.layout.layoutBox);
      const { visualElement: m } = this.options;
      m && m.notify("LayoutMeasure", this.layout.layoutBox, f ? f.layoutBox : void 0);
    }
    updateScroll(f = "measure") {
      let m = !!(this.options.layoutScroll && this.instance);
      if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === f && (m = !1), m && this.instance) {
        const v = o(this.instance);
        this.scroll = {
          animationId: this.root.animationId,
          phase: f,
          isRoot: v,
          offset: u(this.instance),
          wasRoot: this.scroll ? this.scroll.isRoot : v
        };
      }
    }
    resetTransform() {
      if (!c)
        return;
      const f = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout, m = this.projectionDelta && !Gg(this.projectionDelta), v = this.getTransformTemplate(), p = v ? v(this.latestValues, "") : void 0, g = p !== this.prevTransformTemplateValue;
      f && this.instance && (m || ui(this.latestValues) || g) && (c(this.instance, p), this.shouldResetTransform = !1, this.scheduleRender());
    }
    measure(f = !0) {
      const m = this.measurePageBox();
      let v = this.removeElementScroll(m);
      return f && (v = this.removeTransform(v)), _A(v), {
        animationId: this.root.animationId,
        measuredBox: m,
        layoutBox: v,
        latestValues: {},
        source: this.id
      };
    }
    measurePageBox() {
      const { visualElement: f } = this.options;
      if (!f)
        return Xt();
      const m = f.measureViewportBox();
      if (!(this.scroll?.wasRoot || this.path.some(BA))) {
        const { scroll: p } = this.root;
        p && (ke(m.x, p.offset.x), ke(m.y, p.offset.y));
      }
      return m;
    }
    removeElementScroll(f) {
      const m = Xt();
      if (je(m, f), this.scroll?.wasRoot)
        return m;
      for (let v = 0; v < this.path.length; v++) {
        const p = this.path[v], { scroll: g, options: S } = p;
        p !== this.root && g && S.layoutScroll && (g.wasRoot && je(m, f), ke(m.x, g.offset.x), ke(m.y, g.offset.y));
      }
      return m;
    }
    applyTransform(f, m = !1, v) {
      const p = v || Xt();
      je(p, f);
      for (let g = 0; g < this.path.length; g++) {
        const S = this.path[g];
        !m && S.options.layoutScroll && S.scroll && S !== S.root && (ke(p.x, -S.scroll.offset.x), ke(p.y, -S.scroll.offset.y)), ui(S.latestValues) && Ps(p, S.latestValues, S.layout?.layoutBox);
      }
      return ui(this.latestValues) && Ps(p, this.latestValues, this.layout?.layoutBox), p;
    }
    removeTransform(f) {
      const m = Xt();
      je(m, f);
      for (let v = 0; v < this.path.length; v++) {
        const p = this.path[v];
        if (!ui(p.latestValues))
          continue;
        let g;
        p.instance && (bc(p.latestValues) && p.updateSnapshot(), g = Xt(), je(g, p.measurePageBox())), Zp(m, p.latestValues, p.snapshot?.layoutBox, g);
      }
      return ui(this.latestValues) && Zp(m, this.latestValues), m;
    }
    setTargetDelta(f) {
      this.targetDelta = f, this.root.scheduleUpdateProjection(), this.isProjectionDirty = !0;
    }
    setOptions(f) {
      this.options = {
        ...this.options,
        ...f,
        crossfade: f.crossfade !== void 0 ? f.crossfade : !0
      };
    }
    clearMeasurements() {
      this.scroll = void 0, this.layout = void 0, this.snapshot = void 0, this.prevTransformTemplateValue = void 0, this.targetDelta = void 0, this.target = void 0, this.isLayoutDirty = !1;
    }
    forceRelativeParentToResolveTarget() {
      this.relativeParent && this.relativeParent.resolvedRelativeTargetAt !== It.timestamp && this.relativeParent.resolveTargetDelta(!0);
    }
    resolveTargetDelta(f = !1) {
      const m = this.getLead();
      this.isProjectionDirty || (this.isProjectionDirty = m.isProjectionDirty), this.isTransformDirty || (this.isTransformDirty = m.isTransformDirty), this.isSharedProjectionDirty || (this.isSharedProjectionDirty = m.isSharedProjectionDirty);
      const v = !!this.resumingFrom || this !== m;
      if (!(f || v && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize))
        return;
      const { layout: g, layoutId: S } = this.options;
      if (!this.layout || !(g || S))
        return;
      this.resolvedRelativeTargetAt = It.timestamp;
      const b = this.getClosestProjectingParent();
      b && this.linkedParentVersion !== b.layoutVersion && !b.options.layoutRoot && this.removeRelativeTarget(), !this.targetDelta && !this.relativeTarget && (this.options.layoutAnchor !== !1 && b && b.layout ? this.createRelativeTarget(b, this.layout.layoutBox, b.layout.layoutBox) : this.removeRelativeTarget()), !(!this.relativeTarget && !this.targetDelta) && (this.target || (this.target = Xt(), this.targetWithTransforms = Xt()), this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target ? (this.forceRelativeParentToResolveTarget(), eA(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || void 0)) : this.targetDelta ? (this.resumingFrom ? this.applyTransform(this.layout.layoutBox, !1, this.target) : je(this.target, this.layout.layoutBox), Vg(this.target, this.targetDelta)) : je(this.target, this.layout.layoutBox), this.attemptToResolveRelativeTarget && (this.attemptToResolveRelativeTarget = !1, this.options.layoutAnchor !== !1 && b && !!b.resumingFrom == !!this.resumingFrom && !b.options.layoutScroll && b.target && this.animationProgress !== 1 ? this.createRelativeTarget(b, this.target, b.target) : this.relativeParent = this.relativeTarget = void 0));
    }
    getClosestProjectingParent() {
      if (!(!this.parent || bc(this.parent.latestValues) || Og(this.parent.latestValues)))
        return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
    }
    isProjecting() {
      return !!((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
    }
    createRelativeTarget(f, m, v) {
      this.relativeParent = f, this.linkedParentVersion = f.layoutVersion, this.forceRelativeParentToResolveTarget(), this.relativeTarget = Xt(), this.relativeTargetOrigin = Xt(), lu(this.relativeTargetOrigin, m, v, this.options.layoutAnchor || void 0), je(this.relativeTarget, this.relativeTargetOrigin);
    }
    removeRelativeTarget() {
      this.relativeParent = this.relativeTarget = void 0;
    }
    calcProjection() {
      const f = this.getLead(), m = !!this.resumingFrom || this !== f;
      let v = !0;
      if ((this.isProjectionDirty || this.parent?.isProjectionDirty) && (v = !1), m && (this.isSharedProjectionDirty || this.isTransformDirty) && (v = !1), this.resolvedRelativeTargetAt === It.timestamp && (v = !1), v)
        return;
      const { layout: p, layoutId: g } = this.options;
      if (this.isTreeAnimating = !!(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation), this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0), !this.layout || !(p || g))
        return;
      je(this.layoutCorrected, this.layout.layoutBox);
      const S = this.treeScale.x, b = this.treeScale.y;
      VT(this.layoutCorrected, this.treeScale, this.path, m), f.layout && !f.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1) && (f.target = f.layout.layoutBox, f.targetWithTransforms = Xt());
      const { target: V } = f;
      if (!V) {
        this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
        return;
      }
      !this.projectionDelta || !this.prevProjectionDelta ? this.createProjectionDeltas() : (Lp(this.prevProjectionDelta.x, this.projectionDelta.x), Lp(this.prevProjectionDelta.y, this.projectionDelta.y)), rl(this.projectionDelta, this.layoutCorrected, V, this.latestValues), (this.treeScale.x !== S || this.treeScale.y !== b || !Jp(this.projectionDelta.x, this.prevProjectionDelta.x) || !Jp(this.projectionDelta.y, this.prevProjectionDelta.y)) && (this.hasProjected = !0, this.scheduleRender(), this.notifyListeners("projectionUpdate", V));
    }
    hide() {
      this.isVisible = !1;
    }
    show() {
      this.isVisible = !0;
    }
    scheduleRender(f = !0) {
      if (this.options.visualElement?.scheduleRender(), f) {
        const m = this.getStack();
        m && m.scheduleRender();
      }
      this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
    }
    createProjectionDeltas() {
      this.prevProjectionDelta = ta(), this.projectionDelta = ta(), this.projectionDeltaWithTransform = ta();
    }
    setAnimationOrigin(f, m = !1, v) {
      const p = this.snapshot, g = p ? p.latestValues : {}, S = { ...this.latestValues }, b = ta();
      (!this.relativeParent || !this.relativeParent.options.layoutRoot) && (this.relativeTarget = this.relativeTargetOrigin = void 0), this.attemptToResolveRelativeTarget = !m;
      const V = Xt(), D = p ? p.source : void 0, z = this.layout ? this.layout.source : void 0, B = D !== z, H = this.getStack(), X = !H || H.members.length <= 1, q = !!(B && !X && this.options.crossfade === !0 && !this.path.some(wA));
      this.animationProgress = 0;
      let G;
      const Z = v?.interpolateProjection(f);
      this.mixTargetDelta = (it) => {
        const at = it / 1e3, P = Z?.(at);
        P ? (b.x.translate = P.x, b.x.scale = Dt(f.x.scale, 1, at), b.x.origin = f.x.origin, b.x.originPoint = f.x.originPoint, b.y.translate = P.y, b.y.scale = Dt(f.y.scale, 1, at), b.y.origin = f.y.origin, b.y.originPoint = f.y.originPoint) : (ny(b.x, f.x, at), ny(b.y, f.y, at)), this.setTargetDelta(b), this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout && (lu(V, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || void 0), VA(this.relativeTarget, this.relativeTargetOrigin, V, at), G && lA(this.relativeTarget, G) && (this.isProjectionDirty = !1), G || (G = Xt()), je(G, this.relativeTarget)), B && (this.animationValues = S, oA(S, g, this.latestValues, at, q, X)), P && P.rotate !== void 0 && (this.animationValues || (this.animationValues = S), this.animationValues.pathRotation = P.rotate), this.root.scheduleUpdateProjection(), this.scheduleRender(), this.animationProgress = at;
      }, this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
    }
    startAnimation(f) {
      this.notifyListeners("animationStart"), this.currentAnimation?.stop(), this.resumingFrom?.currentAnimation?.stop(), this.pendingAnimation && (qn(this.pendingAnimation), this.pendingAnimation = void 0), this.pendingAnimation = Rt.update(() => {
        Fs.hasAnimatedSinceResize = !0, this.motionValue || (this.motionValue = na(0)), this.motionValue.jump(0, !1), this.currentAnimation = fA(this.motionValue, [0, 1e3], {
          ...f,
          velocity: 0,
          isSync: !0,
          onUpdate: (m) => {
            this.mixTargetDelta(m), f.onUpdate && f.onUpdate(m);
          },
          onComplete: () => {
            f.onComplete && f.onComplete(), this.completeAnimation();
          }
        }), this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation), this.pendingAnimation = void 0;
      });
    }
    completeAnimation() {
      this.resumingFrom && (this.resumingFrom.currentAnimation = void 0, this.resumingFrom.preserveOpacity = void 0);
      const f = this.getStack();
      f && f.exitAnimationComplete(), this.resumingFrom = this.currentAnimation = this.animationValues = void 0, this.notifyListeners("animationComplete");
    }
    finishAnimation() {
      this.currentAnimation && (this.mixTargetDelta && this.mixTargetDelta(yA), this.currentAnimation.stop()), this.completeAnimation();
    }
    applyTransformsToTarget() {
      const f = this.getLead();
      let { targetWithTransforms: m, target: v, layout: p, latestValues: g } = f;
      if (!(!m || !v || !p)) {
        if (this !== f && this.layout && p && kg(this.options.animationType, this.layout.layoutBox, p.layoutBox)) {
          v = this.target || Xt();
          const S = se(this.layout.layoutBox.x);
          v.x.min = f.target.x.min, v.x.max = v.x.min + S;
          const b = se(this.layout.layoutBox.y);
          v.y.min = f.target.y.min, v.y.max = v.y.min + b;
        }
        je(m, v), Ps(m, g), rl(this.projectionDeltaWithTransform, this.layoutCorrected, m, g);
      }
    }
    registerSharedNode(f, m) {
      this.sharedNodes.has(f) || this.sharedNodes.set(f, new pA()), this.sharedNodes.get(f).add(m);
      const p = m.options.initialPromotionConfig;
      m.promote({
        transition: p ? p.transition : void 0,
        preserveFollowOpacity: p && p.shouldPreserveFollowOpacity ? p.shouldPreserveFollowOpacity(m) : void 0
      });
    }
    isLead() {
      const f = this.getStack();
      return f ? f.lead === this : !0;
    }
    getLead() {
      const { layoutId: f } = this.options;
      return f ? this.getStack()?.lead || this : this;
    }
    getPrevLead() {
      const { layoutId: f } = this.options;
      return f ? this.getStack()?.prevLead : void 0;
    }
    getStack() {
      const { layoutId: f } = this.options;
      if (f)
        return this.root.sharedNodes.get(f);
    }
    promote({ needsReset: f, transition: m, preserveFollowOpacity: v } = {}) {
      const p = this.getStack();
      p && p.promote(this, v), f && (this.projectionDelta = void 0, this.needsReset = !0), m && this.setOptions({ transition: m });
    }
    relegate() {
      const f = this.getStack();
      return f ? f.relegate(this) : !1;
    }
    resetSkewAndRotation() {
      const { visualElement: f } = this.options;
      if (!f)
        return;
      let m = !1;
      const { latestValues: v } = f;
      if ((v.z || v.rotate || v.rotateX || v.rotateY || v.rotateZ || v.skewX || v.skewY) && (m = !0), !m)
        return;
      const p = {};
      v.z && kr("z", f, p, this.animationValues);
      for (let g = 0; g < Qr.length; g++)
        kr(`rotate${Qr[g]}`, f, p, this.animationValues), kr(`skew${Qr[g]}`, f, p, this.animationValues);
      f.render();
      for (const g in p)
        f.setStaticValue(g, p[g]), this.animationValues && (this.animationValues[g] = p[g]);
      f.scheduleRender();
    }
    applyProjectionStyles(f, m) {
      if (!this.instance || this.isSVG)
        return;
      if (!this.isVisible) {
        f.visibility = "hidden";
        return;
      }
      const v = this.getTransformTemplate();
      if (this.needsReset) {
        this.needsReset = !1, f.visibility = "", f.opacity = "", f.pointerEvents = Js(m?.pointerEvents) || "", f.transform = v ? v(this.latestValues, "") : "none";
        return;
      }
      const p = this.getLead();
      if (!this.projectionDelta || !this.layout || !p.target) {
        this.options.layoutId && (f.opacity = this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1, f.pointerEvents = Js(m?.pointerEvents) || ""), this.hasProjected && !ui(this.latestValues) && (f.transform = v ? v({}, "") : "none", this.hasProjected = !1);
        return;
      }
      f.visibility = "";
      const g = p.animationValues || p.latestValues;
      this.applyTransformsToTarget();
      let S = sA(this.projectionDeltaWithTransform, this.treeScale, g);
      v && (S = v(g, S)), f.transform = S;
      const { x: b, y: V } = this.projectionDelta;
      f.transformOrigin = `${b.origin * 100}% ${V.origin * 100}% 0`, p.animationValues ? f.opacity = p === this ? g.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : g.opacityExit : f.opacity = p === this ? g.opacity !== void 0 ? g.opacity : "" : g.opacityExit !== void 0 ? g.opacityExit : 0;
      for (const D in Ac) {
        if (g[D] === void 0)
          continue;
        const { correct: z, applyTo: B, isCSSVariable: H } = Ac[D], X = S === "none" ? g[D] : z(g[D], p);
        if (B) {
          const q = B.length;
          for (let G = 0; G < q; G++)
            f[B[G]] = X;
        } else
          H ? this.options.visualElement.renderState.vars[D] = X : f[D] = X;
      }
      this.options.layoutId && (f.pointerEvents = p === this ? Js(m?.pointerEvents) || "" : "none");
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = void 0;
    }
    // Only run on root
    resetTree() {
      this.root.nodes.forEach((f) => f.currentAnimation?.stop()), this.root.nodes.forEach(Ip), this.root.sharedNodes.clear();
    }
  };
}
function vA(i) {
  i.updateLayout();
}
function SA(i) {
  const l = i.resumeFrom?.snapshot || i.snapshot;
  if (i.isLead() && i.layout && l && i.hasListeners("didUpdate")) {
    const { layoutBox: u, measuredBox: o } = i.layout, { animationType: c } = i.options, h = l.source !== i.layout.source;
    if (c === "size")
      Qe((g) => {
        const S = h ? l.measuredBox[g] : l.layoutBox[g], b = se(S);
        S.min = u[g].min, S.max = S.min + b;
      });
    else if (c === "x" || c === "y") {
      const g = c === "x" ? "y" : "x";
      xc(h ? l.measuredBox[g] : l.layoutBox[g], u[g]);
    } else kg(c, l.layoutBox, u) && Qe((g) => {
      const S = h ? l.measuredBox[g] : l.layoutBox[g], b = se(u[g]);
      S.max = S.min + b, i.relativeTarget && !i.currentAnimation && (i.isProjectionDirty = !0, i.relativeTarget[g].max = i.relativeTarget[g].min + b);
    });
    const f = ta();
    rl(f, u, l.layoutBox);
    const m = ta();
    h ? rl(m, i.applyTransform(o, !0), l.measuredBox) : rl(m, u, l.layoutBox);
    const v = !Gg(f);
    let p = !1;
    if (!i.resumeFrom) {
      const g = i.getClosestProjectingParent();
      if (g && !g.resumeFrom) {
        const { snapshot: S, layout: b } = g;
        if (S && b) {
          const V = i.options.layoutAnchor || void 0, D = Xt();
          lu(D, l.layoutBox, S.layoutBox, V);
          const z = Xt();
          lu(z, u, b.layoutBox, V), Xg(D, z) || (p = !0), g.options.layoutRoot && (i.relativeTarget = z, i.relativeTargetOrigin = D, i.relativeParent = g);
        }
      }
    }
    i.notifyListeners("didUpdate", {
      layout: u,
      snapshot: l,
      delta: m,
      layoutDelta: f,
      hasLayoutChanged: v,
      hasRelativeLayoutChanged: p
    });
  } else if (i.isLead()) {
    const { onExitComplete: u } = i.options;
    u && u();
  }
  i.options.transition = void 0;
}
function bA(i) {
  i.parent && (i.isProjecting() || (i.isProjectionDirty = i.parent.isProjectionDirty), i.isSharedProjectionDirty || (i.isSharedProjectionDirty = !!(i.isProjectionDirty || i.parent.isProjectionDirty || i.parent.isSharedProjectionDirty)), i.isTransformDirty || (i.isTransformDirty = i.parent.isTransformDirty));
}
function TA(i) {
  i.isProjectionDirty = i.isSharedProjectionDirty = i.isTransformDirty = !1;
}
function AA(i) {
  i.clearSnapshot();
}
function Ip(i) {
  i.clearMeasurements();
}
function xA(i) {
  i.isLayoutDirty = !0, i.updateLayout();
}
function ty(i) {
  i.isLayoutDirty = !1;
}
function EA(i) {
  i.isAnimationBlocked && i.layout && !i.isLayoutDirty && (i.snapshot = i.layout, i.isLayoutDirty = !0);
}
function MA(i) {
  const { visualElement: l } = i.options;
  l && l.getProps().onBeforeLayoutMeasure && l.notify("BeforeLayoutMeasure"), i.resetTransform();
}
function ey(i) {
  i.finishAnimation(), i.targetDelta = i.relativeTarget = i.target = void 0, i.isProjectionDirty = !0;
}
function DA(i) {
  i.resolveTargetDelta();
}
function RA(i) {
  i.calcProjection();
}
function CA(i) {
  i.resetSkewAndRotation();
}
function OA(i) {
  i.removeLeadSnapshot();
}
function ny(i, l, u) {
  i.translate = Dt(l.translate, 0, u), i.scale = Dt(l.scale, 1, u), i.origin = l.origin, i.originPoint = l.originPoint;
}
function iy(i, l, u, o) {
  i.min = Dt(l.min, u.min, o), i.max = Dt(l.max, u.max, o);
}
function VA(i, l, u, o) {
  iy(i.x, l.x, u.x, o), iy(i.y, l.y, u.y, o);
}
function wA(i) {
  return i.animationValues && i.animationValues.opacityExit !== void 0;
}
const zA = {
  duration: 0.45,
  ease: [0.4, 0, 0.1, 1]
}, ay = (i) => typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(i), ly = ay("applewebkit/") && !ay("chrome/") ? Math.round : _e;
function sy(i) {
  i.min = ly(i.min), i.max = ly(i.max);
}
function _A(i) {
  sy(i.x), sy(i.y);
}
function kg(i, l, u) {
  return i === "position" || i === "preserve-aspect" && !tA(Pp(l), Pp(u), 0.2);
}
function BA(i) {
  return i !== i.root && i.scroll?.wasRoot;
}
const NA = Qg({
  attachResizeListener: (i, l) => pl(i, "resize", l),
  measureScroll: () => ({
    x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
    y: document.documentElement.scrollTop || document.body?.scrollTop || 0
  }),
  checkIsScrollRoot: () => !0
}), Pr = {
  current: void 0
}, Pg = Qg({
  measureScroll: (i) => ({
    x: i.scrollLeft,
    y: i.scrollTop
  }),
  defaultParent: () => {
    if (!Pr.current) {
      const i = new NA({});
      i.mount(window), i.setOptions({ layoutScroll: !0 }), Pr.current = i;
    }
    return Pr.current;
  },
  resetTransform: (i, l) => {
    i.style.transform = l !== void 0 ? l : "none";
  },
  checkIsScrollRoot: (i) => window.getComputedStyle(i).position === "fixed"
}), yl = Y.createContext({
  transformPagePoint: (i) => i,
  isStatic: !1,
  reducedMotion: "never"
});
function uy(i, l) {
  if (typeof i == "function")
    return i(l);
  i != null && (i.current = l);
}
function UA(...i) {
  return (l) => {
    let u = !1;
    const o = i.map((c) => {
      const h = uy(c, l);
      return !u && typeof h == "function" && (u = !0), h;
    });
    if (u)
      return () => {
        for (let c = 0; c < o.length; c++) {
          const h = o[c];
          typeof h == "function" ? h() : uy(i[c], null);
        }
      };
  };
}
function jA(...i) {
  return Y.useCallback(UA(...i), i);
}
class LA extends Y.Component {
  getSnapshotBeforeUpdate(l) {
    const u = this.props.childRef.current;
    if (Xs(u) && l.isPresent && !this.props.isPresent && this.props.pop !== !1) {
      const o = u.offsetParent, c = Xs(o) && o.offsetWidth || 0, h = Xs(o) && o.offsetHeight || 0, f = getComputedStyle(u), m = this.props.sizeRef.current;
      m.height = parseFloat(f.height), m.width = parseFloat(f.width), m.top = u.offsetTop, m.left = u.offsetLeft, m.right = c - m.width - m.left, m.bottom = h - m.height - m.top, m.direction = f.direction;
    }
    return null;
  }
  /**
   * Required with getSnapshotBeforeUpdate to stop React complaining.
   */
  componentDidUpdate() {
  }
  render() {
    return this.props.children;
  }
}
function HA({ children: i, isPresent: l, anchorX: u, anchorY: o, root: c, pop: h }) {
  const f = Y.useId(), m = Y.useRef(null), v = Y.useRef({
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    direction: "ltr"
  }), { nonce: p } = Y.useContext(yl), g = h !== !1 ? i.props?.ref ?? i?.ref : void 0, S = jA(m, g);
  return Y.useInsertionEffect(() => {
    const { width: b, height: V, top: D, left: z, right: B, bottom: H, direction: X } = v.current;
    if (l || h === !1 || !m.current || !b || !V)
      return;
    const q = X === "rtl", G = u === "left" ? q ? `right: ${B}` : `left: ${z}` : q ? `left: ${z}` : `right: ${B}`, Z = o === "bottom" ? `bottom: ${H}` : `top: ${D}`;
    m.current.dataset.motionPopId = f;
    const it = document.createElement("style");
    p && (it.nonce = p);
    const at = c ?? document.head;
    return at.appendChild(it), it.sheet && it.sheet.insertRule(`
          [data-motion-pop-id="${f}"] {
            position: absolute !important;
            width: ${b}px !important;
            height: ${V}px !important;
            ${G}px !important;
            ${Z}px !important;
          }
        `), () => {
      m.current?.removeAttribute("data-motion-pop-id"), at.contains(it) && at.removeChild(it);
    };
  }, [l]), L.jsx(LA, { isPresent: l, childRef: m, sizeRef: v, pop: h, children: h === !1 ? i : Y.cloneElement(i, { ref: S }) });
}
const qA = ({ children: i, initial: l, isPresent: u, onExitComplete: o, custom: c, presenceAffectsLayout: h, mode: f, anchorX: m, anchorY: v, root: p }) => {
  const g = ou(YA), S = Y.useId(), b = Y.useRef(u), V = Y.useRef(o);
  Cc(() => {
    b.current = u, V.current = o;
  });
  let D = !0, z = Y.useMemo(() => (D = !1, {
    id: S,
    initial: l,
    isPresent: u,
    custom: c,
    onExitComplete: (B) => {
      g.set(B, !0);
      for (const H of g.values())
        if (!H)
          return;
      o && o();
    },
    register: (B) => (g.set(B, !1), () => {
      g.delete(B), !b.current && !g.size && V.current?.();
    })
  }), [u, g, o]);
  return h && D && (z = { ...z }), Y.useMemo(() => {
    g.forEach((B, H) => g.set(H, !1));
  }, [u]), Y.useEffect(() => {
    !u && !g.size && o && o();
  }, [u]), i = L.jsx(HA, { pop: f === "popLayout", isPresent: u, anchorX: m, anchorY: v, root: p, children: i }), L.jsx(ru.Provider, { value: z, children: i });
};
function YA() {
  return /* @__PURE__ */ new Map();
}
function Jg(i = !0) {
  const l = Y.useContext(ru);
  if (l === null)
    return [!0, null];
  const { isPresent: u, onExitComplete: o, register: c } = l, h = Y.useId();
  Y.useEffect(() => {
    if (i)
      return c(h);
  }, [i]);
  const f = Y.useCallback(() => i && o && o(h), [h, o, i]);
  return !u && o ? [!1, f] : [!0];
}
const Hs = (i) => i.key || "";
function oy(i) {
  const l = [];
  return Y.Children.forEach(i, (u) => {
    Y.isValidElement(u) && l.push(u);
  }), l;
}
const GA = ({ children: i, custom: l, initial: u = !0, onExitComplete: o, presenceAffectsLayout: c = !0, mode: h = "sync", propagate: f = !1, anchorX: m = "left", anchorY: v = "top", root: p }) => {
  const [g, S] = Jg(f), b = Y.useMemo(() => oy(i), [i]), V = f && !g ? [] : b.map(Hs), D = Y.useRef(!0), z = Y.useRef(b), B = ou(() => /* @__PURE__ */ new Map()), H = Y.useRef(/* @__PURE__ */ new Set()), [X, q] = Y.useState(b), [G, Z] = Y.useState(b);
  Cc(() => {
    D.current = !1, z.current = b;
    for (let P = 0; P < G.length; P++) {
      const st = Hs(G[P]);
      V.includes(st) ? (B.delete(st), H.current.delete(st)) : B.get(st) !== !0 && B.set(st, !1);
    }
  }, [G, V.length, V.join("-")]);
  const it = [];
  if (b !== X) {
    let P = [...b];
    for (let st = 0; st < G.length; st++) {
      const $ = G[st], mt = Hs($);
      V.includes(mt) || (P.splice(st, 0, $), it.push($));
    }
    return h === "wait" && it.length && (P = it), Z(oy(P)), q(b), null;
  }
  const { forceRender: at } = Y.useContext(Rc);
  return L.jsx(L.Fragment, { children: G.map((P) => {
    const st = Hs(P), $ = f && !g ? !1 : b === G || V.includes(st), mt = () => {
      if (H.current.has(st))
        return;
      if (B.has(st))
        H.current.add(st), B.set(st, !0);
      else
        return;
      let pt = !0;
      B.forEach((Jt) => {
        Jt || (pt = !1);
      }), pt && (at?.(), Z(z.current), f && S?.(), o && o());
    };
    return L.jsx(qA, { isPresent: $, initial: !D.current || u ? void 0 : !1, custom: l, presenceAffectsLayout: c, mode: h, root: p, onExitComplete: $ ? void 0 : mt, anchorX: m, anchorY: v, children: P }, st);
  }) });
}, Fg = Y.createContext({ strict: !1 }), ry = {
  animation: [
    "animate",
    "variants",
    "whileHover",
    "whileTap",
    "exit",
    "whileInView",
    "whileFocus",
    "whileDrag"
  ],
  exit: ["exit"],
  drag: ["drag", "dragControls"],
  focus: ["whileFocus"],
  hover: ["whileHover", "onHoverStart", "onHoverEnd"],
  tap: ["whileTap", "onTap", "onTapStart", "onTapCancel"],
  pan: ["onPan", "onPanStart", "onPanSessionStart", "onPanEnd"],
  inView: ["whileInView", "onViewportEnter", "onViewportLeave"],
  layout: ["layout", "layoutId"]
};
let cy = !1;
function XA() {
  if (cy)
    return;
  const i = {};
  for (const l in ry)
    i[l] = {
      isEnabled: (u) => ry[l].some((o) => !!u[o])
    };
  Dg(i), cy = !0;
}
function Wg() {
  return XA(), DT();
}
function ZA(i) {
  const l = Wg();
  for (const u in i)
    l[u] = {
      ...l[u],
      ...i[u]
    };
  Dg(l);
}
const KA = /* @__PURE__ */ new Set([
  "animate",
  "exit",
  "variants",
  "initial",
  "style",
  "values",
  "variants",
  "transition",
  "transformTemplate",
  "custom",
  "inherit",
  "onBeforeLayoutMeasure",
  "onAnimationStart",
  "onAnimationComplete",
  "onUpdate",
  "onDragStart",
  "onDrag",
  "onDragEnd",
  "onMeasureDragConstraints",
  "onDirectionLock",
  "onDragTransitionEnd",
  "_dragX",
  "_dragY",
  "onHoverStart",
  "onHoverEnd",
  "onViewportEnter",
  "onViewportLeave",
  "globalTapTarget",
  "propagate",
  "ignoreStrict",
  "viewport"
]);
function su(i) {
  return i.startsWith("while") || i.startsWith("drag") && i !== "draggable" || i.startsWith("layout") || i.startsWith("onTap") || i.startsWith("onPan") || i.startsWith("onLayout") || KA.has(i);
}
let $g = (i) => !su(i);
function Ig(i) {
  typeof i == "function" && ($g = (l) => l.startsWith("on") ? !su(l) : i(l));
}
try {
  Ig(require("@emotion/is-prop-valid").default);
} catch {
}
function QA(i, l, u) {
  const o = {};
  for (const c in i)
    c === "values" && typeof i.values == "object" || te(i[c]) || ($g(c) || u === !0 && su(c) || !l && !su(c) || // If trying to use native HTML drag events, forward drag listeners
    i.draggable && c.startsWith("onDrag")) && (o[c] = i[c]);
  return o;
}
function kA({ children: i, isValidProp: l, ...u }) {
  l && Ig(l);
  const o = Y.useContext(yl);
  u = { ...o, ...u }, u.transition = qc(u.transition, o.transition), u.isStatic = ou(() => u.isStatic);
  const c = Y.useMemo(() => u, [
    JSON.stringify(u.transition),
    u.transformPagePoint,
    u.reducedMotion,
    u.skipAnimations
  ]);
  return L.jsx(yl.Provider, { value: c, children: i });
}
const mu = /* @__PURE__ */ Y.createContext({});
function PA(i, l) {
  if (du(i)) {
    const { initial: u, animate: o } = i;
    return {
      initial: u === !1 || ml(u) ? u : void 0,
      animate: ml(o) ? o : void 0
    };
  }
  return i.inherit !== !1 ? l : {};
}
function JA(i) {
  const { initial: l, animate: u } = PA(i, Y.useContext(mu));
  return Y.useMemo(() => ({ initial: l, animate: u }), [fy(l), fy(u)]);
}
function fy(i) {
  return Array.isArray(i) ? i.join(" ") : i;
}
const Ic = () => ({
  style: {},
  transform: {},
  transformOrigin: {},
  vars: {}
});
function t0(i, l, u) {
  for (const o in l)
    !te(l[o]) && !_g(o, u) && (i[o] = l[o]);
}
function FA({ transformTemplate: i }, l) {
  return Y.useMemo(() => {
    const u = Ic();
    return Wc(u, l, i), Object.assign({}, u.vars, u.style);
  }, [l]);
}
function WA(i, l) {
  const u = i.style || {}, o = {};
  return t0(o, u, i), Object.assign(o, FA(i, l)), o;
}
function $A(i, l) {
  const u = {}, o = WA(i, l);
  return i.drag && i.dragListener !== !1 && (u.draggable = !1, o.userSelect = o.WebkitUserSelect = o.WebkitTouchCallout = "none", o.touchAction = i.drag === !0 ? "none" : `pan-${i.drag === "x" ? "y" : "x"}`), i.tabIndex === void 0 && (i.onTap || i.onTapStart || i.whileTap) && (u.tabIndex = 0), u.style = o, u;
}
const e0 = () => ({
  ...Ic(),
  attrs: {}
});
function IA(i, l, u, o) {
  const c = Y.useMemo(() => {
    const h = e0();
    return Bg(h, l, Ug(o), i.transformTemplate, i.style), {
      ...h.attrs,
      style: { ...h.style }
    };
  }, [l]);
  if (i.style) {
    const h = {};
    t0(h, i.style, i), c.style = { ...h, ...c.style };
  }
  return c;
}
const tx = [
  "animate",
  "circle",
  "defs",
  "desc",
  "ellipse",
  "g",
  "image",
  "line",
  "filter",
  "marker",
  "mask",
  "metadata",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "rect",
  "stop",
  "switch",
  "symbol",
  "svg",
  "text",
  "tspan",
  "use",
  "view"
];
function tf(i) {
  return (
    /**
     * If it's not a string, it's a custom React component. Currently we only support
     * HTML custom React components.
     */
    typeof i != "string" || /**
     * If it contains a dash, the element is a custom HTML webcomponent.
     */
    i.includes("-") ? !1 : (
      /**
       * If it's in our list of lowercase SVG tags, it's an SVG component
       */
      !!(tx.indexOf(i) > -1 || /**
       * If it contains a capital letter, it's an SVG component
       */
      /[A-Z]/u.test(i))
    )
  );
}
function ex(i, l, u, { latestValues: o }, c, h = !1, f) {
  const v = (f ?? tf(i) ? IA : $A)(l, o, c, i), p = QA(l, typeof i == "string", h), g = i !== Y.Fragment ? { ...p, ...v, ref: u } : {}, { children: S } = l, b = Y.useMemo(() => te(S) ? S.get() : S, [S]);
  return Y.createElement(i, {
    ...g,
    children: b
  });
}
function nx({ scrapeMotionValuesFromProps: i, createRenderState: l }, u, o, c) {
  return {
    latestValues: ix(u, o, c, i),
    renderState: l()
  };
}
function ix(i, l, u, o) {
  const c = {}, h = o(i, {});
  for (const b in h)
    c[b] = Js(h[b]);
  let { initial: f, animate: m } = i;
  const v = du(i), p = Eg(i);
  l && p && !v && i.inherit !== !1 && (f === void 0 && (f = l.initial), m === void 0 && (m = l.animate));
  let g = u ? u.initial === !1 : !1;
  g = g || f === !1;
  const S = g ? m : f;
  if (S && typeof S != "boolean" && !hu(S)) {
    const b = Array.isArray(S) ? S : [S];
    for (let V = 0; V < b.length; V++) {
      const D = Xc(i, b[V]);
      if (D) {
        const { transitionEnd: z, transition: B, ...H } = D;
        for (const X in H) {
          let q = H[X];
          if (Array.isArray(q)) {
            const G = g ? q.length - 1 : 0;
            q = q[G];
          }
          q !== null && (c[X] = q);
        }
        for (const X in z)
          c[X] = z[X];
      }
    }
  }
  return c;
}
const n0 = (i) => (l, u) => {
  const o = Y.useContext(mu), c = Y.useContext(ru), h = () => nx(i, l, o, c);
  return u ? h() : ou(h);
}, ax = /* @__PURE__ */ n0({
  scrapeMotionValuesFromProps: $c,
  createRenderState: Ic
}), lx = /* @__PURE__ */ n0({
  scrapeMotionValuesFromProps: jg,
  createRenderState: e0
}), sx = Symbol.for("motionComponentSymbol");
function ux(i, l, u) {
  const o = Y.useRef(u);
  Y.useInsertionEffect(() => {
    o.current = u;
  });
  const c = Y.useRef(null);
  return Y.useCallback((h) => {
    h && i.onMount?.(h), l && (h ? l.mount(h) : l.unmount());
    const f = o.current;
    if (typeof f == "function")
      if (h) {
        const m = f(h);
        typeof m == "function" && (c.current = m);
      } else c.current ? (c.current(), c.current = null) : f(h);
    else f && (f.current = h);
  }, [l]);
}
const i0 = Y.createContext({});
function Wi(i) {
  return i && typeof i == "object" && Object.prototype.hasOwnProperty.call(i, "current");
}
function ox(i, l, u, o, c, h) {
  const { visualElement: f } = Y.useContext(mu), m = Y.useContext(Fg), v = Y.useContext(ru), p = Y.useContext(yl), g = p.reducedMotion, S = p.skipAnimations, b = Y.useRef(null), V = Y.useRef(!1);
  o = o || m.renderer, !b.current && o && (b.current = o(i, {
    visualState: l,
    parent: f,
    props: u,
    presenceContext: v,
    blockInitialAnimation: v ? v.initial === !1 : !1,
    reducedMotionConfig: g,
    skipAnimations: S,
    isSVG: h
  }), V.current && b.current && (b.current.manuallyAnimateOnMount = !0));
  const D = b.current, z = Y.useContext(i0);
  D && !D.projection && c && (D.type === "html" || D.type === "svg") && rx(b.current, u, c, z);
  const B = Y.useRef(!1);
  Y.useInsertionEffect(() => {
    D && B.current && D.update(u, v);
  });
  const H = u[hg], X = Y.useRef(!!H && typeof window < "u" && !window.MotionHandoffIsComplete?.(H) && window.MotionHasOptimisedAnimation?.(H));
  return Cc(() => {
    V.current = !0, D && (B.current = !0, window.MotionIsMounted = !0, D.updateFeatures(), D.scheduleRenderMicrotask(), X.current && D.animationState && D.animationState.animateChanges());
  }), Y.useEffect(() => {
    D && (!X.current && D.animationState && D.animationState.animateChanges(), X.current && (queueMicrotask(() => {
      window.MotionHandoffMarkAsComplete?.(H);
    }), X.current = !1), D.enteringChildren = void 0);
  }), D;
}
function rx(i, l, u, o) {
  const { layoutId: c, layout: h, drag: f, dragConstraints: m, layoutScroll: v, layoutRoot: p, layoutAnchor: g, layoutCrossfade: S } = l;
  i.projection = new u(i.latestValues, l["data-framer-portal-id"] ? void 0 : a0(i.parent)), i.projection.setOptions({
    layoutId: c,
    layout: h,
    alwaysMeasureLayout: !!f || m && Wi(m),
    visualElement: i,
    /**
     * TODO: Update options in an effect. This could be tricky as it'll be too late
     * to update by the time layout animations run.
     * We also need to fix this safeToRemove by linking it up to the one returned by usePresence,
     * ensuring it gets called if there's no potential layout animations.
     *
     */
    animationType: typeof h == "string" ? h : "both",
    initialPromotionConfig: o,
    crossfade: S,
    layoutScroll: v,
    layoutRoot: p,
    layoutAnchor: g
  });
}
function a0(i) {
  if (i)
    return i.options.allowProjection !== !1 ? i.projection : a0(i.parent);
}
function Jr(i, { forwardMotionProps: l = !1, type: u } = {}, o, c) {
  o && ZA(o);
  const h = u ? u === "svg" : tf(i), f = h ? lx : ax;
  function m(p, g) {
    let S;
    const b = {
      ...Y.useContext(yl),
      ...p,
      layoutId: cx(p)
    }, { isStatic: V } = b, D = JA(p), z = f(p, V);
    if (!V && typeof window < "u") {
      fx();
      const B = hx(b);
      S = B.MeasureLayout, D.visualElement = ox(i, z, b, c, B.ProjectionNode, h);
    }
    return L.jsxs(mu.Provider, { value: D, children: [S && D.visualElement ? L.jsx(S, { visualElement: D.visualElement, ...b }) : null, ex(i, p, ux(z, D.visualElement, g), z, V, l, h)] });
  }
  m.displayName = `motion.${typeof i == "string" ? i : `create(${i.displayName ?? i.name ?? ""})`}`;
  const v = Y.forwardRef(m);
  return v[sx] = i, v;
}
function cx({ layoutId: i }) {
  const l = Y.useContext(Rc).id;
  return l && i !== void 0 ? l + "-" + i : i;
}
function fx(i, l) {
  Y.useContext(Fg).strict;
}
function hx(i) {
  const l = Wg(), { drag: u, layout: o } = l;
  if (!u && !o)
    return {};
  const c = { ...u, ...o };
  return {
    MeasureLayout: u?.isEnabled(i) || o?.isEnabled(i) ? c.MeasureLayout : void 0,
    ProjectionNode: c.ProjectionNode
  };
}
function dx(i, l) {
  if (typeof Proxy > "u")
    return Jr;
  const u = /* @__PURE__ */ new Map(), o = (h, f) => Jr(h, f, i, l), c = (h, f) => o(h, f);
  return new Proxy(c, {
    /**
     * Called when `motion` is referenced with a prop: `motion.div`, `motion.input` etc.
     * The prop name is passed through as `key` and we can use that to generate a `motion`
     * DOM component with that name.
     */
    get: (h, f) => f === "create" ? o : (u.has(f) || u.set(f, Jr(f, void 0, i, l)), u.get(f))
  });
}
const mx = (i, l) => l.isSVG ?? tf(i) ? new XT(l) : new jT(l, {
  allowProjection: i !== Y.Fragment
});
class px extends Yn {
  /**
   * We dynamically generate the AnimationState manager as it contains a reference
   * to the underlying animation library. We only want to load that if we load this,
   * so people can optionally code split it out using the `m` component.
   */
  constructor(l) {
    super(l), l.animationState || (l.animationState = PT(l));
  }
  updateAnimationControlsSubscription() {
    const { animate: l } = this.node.getProps();
    hu(l) && (this.unmountControls = l.subscribe(this.node));
  }
  /**
   * Subscribe any provided AnimationControls to the component's VisualElement
   */
  mount() {
    this.updateAnimationControlsSubscription();
  }
  update() {
    const { animate: l } = this.node.getProps(), { animate: u } = this.node.prevProps || {};
    l !== u && this.updateAnimationControlsSubscription();
  }
  unmount() {
    this.node.animationState.reset(), this.unmountControls?.();
  }
}
let yx = 0;
class gx extends Yn {
  constructor() {
    super(...arguments), this.id = yx++, this.isExitComplete = !1;
  }
  update() {
    if (!this.node.presenceContext)
      return;
    const { isPresent: l, onExitComplete: u } = this.node.presenceContext, { isPresent: o } = this.node.prevPresenceContext || {};
    if (!this.node.animationState || l === o)
      return;
    if (l && o === !1) {
      if (this.isExitComplete) {
        const { initial: h, custom: f } = this.node.getProps();
        if (typeof h == "string" || typeof h == "object" && h !== null && !Array.isArray(h)) {
          const m = fi(this.node, h, f);
          if (m) {
            const { transition: v, transitionEnd: p, ...g } = m;
            for (const S in g)
              this.node.getValue(S)?.jump(g[S]);
          }
        }
        this.node.animationState.reset(), this.node.animationState.animateChanges();
      } else
        this.node.animationState.setActive("exit", !1);
      this.isExitComplete = !1;
      return;
    }
    const c = this.node.animationState.setActive("exit", !l);
    u && !l && c.then(() => {
      this.isExitComplete = !0, u(this.id);
    });
  }
  mount() {
    const { register: l, onExitComplete: u } = this.node.presenceContext || {};
    u && u(this.id), l && (this.unmount = l(this.id));
  }
  unmount() {
  }
}
const vx = {
  animation: {
    Feature: px
  },
  exit: {
    Feature: gx
  }
};
function Tl(i) {
  return {
    point: {
      x: i.pageX,
      y: i.pageY
    }
  };
}
const Sx = (i) => (l) => kc(l) && i(l, Tl(l));
function cl(i, l, u, o) {
  return pl(i, l, Sx(u), o);
}
const l0 = ({ current: i }) => i ? i.ownerDocument.defaultView : null, hy = (i, l) => Math.abs(i - l);
function bx(i, l) {
  const u = hy(i.x, l.x), o = hy(i.y, l.y);
  return Math.sqrt(u ** 2 + o ** 2);
}
const dy = /* @__PURE__ */ new Set(["auto", "scroll"]);
class s0 {
  constructor(l, u, { transformPagePoint: o, contextWindow: c = window, dragSnapToOrigin: h = !1, distanceThreshold: f = 3, element: m } = {}) {
    if (this.startEvent = null, this.lastMoveEvent = null, this.lastMoveEventInfo = null, this.lastRawMoveEventInfo = null, this.handlers = {}, this.contextWindow = window, this.scrollPositions = /* @__PURE__ */ new Map(), this.removeScrollListeners = null, this.onElementScroll = (D) => {
      this.handleScroll(D.target);
    }, this.onWindowScroll = () => {
      this.handleScroll(window);
    }, this.updatePoint = () => {
      if (!(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      this.lastRawMoveEventInfo && (this.lastMoveEventInfo = qs(this.lastRawMoveEventInfo, this.transformPagePoint));
      const D = Fr(this.lastMoveEventInfo, this.history), z = this.startEvent !== null, B = bx(D.offset, { x: 0, y: 0 }) >= this.distanceThreshold;
      if (!z && !B)
        return;
      const { point: H } = D, { timestamp: X } = It;
      this.history.push({ ...H, timestamp: X });
      const { onStart: q, onMove: G } = this.handlers;
      z || (q && q(this.lastMoveEvent, D), this.startEvent = this.lastMoveEvent), G && G(this.lastMoveEvent, D);
    }, this.handlePointerMove = (D, z) => {
      this.lastMoveEvent = D, this.lastRawMoveEventInfo = z, this.lastMoveEventInfo = qs(z, this.transformPagePoint), Rt.update(this.updatePoint, !0);
    }, this.handlePointerUp = (D, z) => {
      this.end();
      const { onEnd: B, onSessionEnd: H, resumeAnimation: X } = this.handlers;
      if ((this.dragSnapToOrigin || !this.startEvent) && X && X(), !(this.lastMoveEvent && this.lastMoveEventInfo))
        return;
      const q = Fr(D.type === "pointercancel" ? this.lastMoveEventInfo : qs(z, this.transformPagePoint), this.history);
      this.startEvent && B && B(D, q), H && H(D, q);
    }, !kc(l))
      return;
    this.dragSnapToOrigin = h, this.handlers = u, this.transformPagePoint = o, this.distanceThreshold = f, this.contextWindow = c || window;
    const v = Tl(l), p = qs(v, this.transformPagePoint), { point: g } = p, { timestamp: S } = It;
    this.history = [{ ...g, timestamp: S }];
    const { onSessionStart: b } = u;
    b && b(l, Fr(p, this.history));
    const V = { passive: !0, capture: !0 };
    this.removeListeners = vl(cl(this.contextWindow, "pointermove", this.handlePointerMove, V), cl(this.contextWindow, "pointerup", this.handlePointerUp, V), cl(this.contextWindow, "pointercancel", this.handlePointerUp, V)), m && this.startScrollTracking(m);
  }
  /**
   * Start tracking scroll on ancestors and window.
   */
  startScrollTracking(l) {
    let u = l.parentElement;
    for (; u; ) {
      const o = getComputedStyle(u);
      (dy.has(o.overflowX) || dy.has(o.overflowY)) && this.scrollPositions.set(u, {
        x: u.scrollLeft,
        y: u.scrollTop
      }), u = u.parentElement;
    }
    this.scrollPositions.set(window, {
      x: window.scrollX,
      y: window.scrollY
    }), window.addEventListener("scroll", this.onElementScroll, {
      capture: !0
    }), window.addEventListener("scroll", this.onWindowScroll), this.removeScrollListeners = () => {
      window.removeEventListener("scroll", this.onElementScroll, {
        capture: !0
      }), window.removeEventListener("scroll", this.onWindowScroll);
    };
  }
  /**
   * Handle scroll compensation during drag.
   *
   * For element scroll: adjusts history origin since pageX/pageY doesn't change.
   * For window scroll: adjusts lastMoveEventInfo since pageX/pageY would change.
   */
  handleScroll(l) {
    const u = this.scrollPositions.get(l);
    if (!u)
      return;
    const o = l === window, c = o ? { x: window.scrollX, y: window.scrollY } : {
      x: l.scrollLeft,
      y: l.scrollTop
    }, h = { x: c.x - u.x, y: c.y - u.y };
    h.x === 0 && h.y === 0 || (o ? this.lastMoveEventInfo && (this.lastMoveEventInfo.point.x += h.x, this.lastMoveEventInfo.point.y += h.y) : this.history.length > 0 && (this.history[0].x -= h.x, this.history[0].y -= h.y), this.scrollPositions.set(l, c), Rt.update(this.updatePoint, !0));
  }
  updateHandlers(l) {
    this.handlers = l;
  }
  end() {
    this.removeListeners && this.removeListeners(), this.removeScrollListeners && this.removeScrollListeners(), this.scrollPositions.clear(), qn(this.updatePoint);
  }
}
function qs(i, l) {
  return l ? { point: l(i.point) } : i;
}
function my(i, l) {
  return { x: i.x - l.x, y: i.y - l.y };
}
function Fr({ point: i }, l) {
  return {
    point: i,
    delta: my(i, u0(l)),
    offset: my(i, Tx(l)),
    velocity: Ax(l, 0.1)
  };
}
function Tx(i) {
  return i[0];
}
function u0(i) {
  return i[i.length - 1];
}
function Ax(i, l) {
  if (i.length < 2)
    return { x: 0, y: 0 };
  let u = i.length - 1, o = null;
  const c = u0(i);
  for (; u >= 0 && (o = i[u], !(c.timestamp - o.timestamp > /* @__PURE__ */ Ae(l))); )
    u--;
  if (!o)
    return { x: 0, y: 0 };
  o === i[0] && i.length > 2 && c.timestamp - o.timestamp > /* @__PURE__ */ Ae(l) * 2 && (o = i[1]);
  const h = /* @__PURE__ */ ze(c.timestamp - o.timestamp);
  if (h === 0)
    return { x: 0, y: 0 };
  const f = {
    x: (c.x - o.x) / h,
    y: (c.y - o.y) / h
  };
  return f.x === 1 / 0 && (f.x = 0), f.y === 1 / 0 && (f.y = 0), f;
}
function xx(i, { min: l, max: u }, o) {
  return l !== void 0 && i < l ? i = o ? Dt(l, i, o.min) : Math.max(i, l) : u !== void 0 && i > u && (i = o ? Dt(u, i, o.max) : Math.min(i, u)), i;
}
function py(i, l, u) {
  return {
    min: l !== void 0 ? i.min + l : void 0,
    max: u !== void 0 ? i.max + u - (i.max - i.min) : void 0
  };
}
function Ex(i, { top: l, left: u, bottom: o, right: c }) {
  return {
    x: py(i.x, u, c),
    y: py(i.y, l, o)
  };
}
function yy(i, l) {
  let u = l.min - i.min, o = l.max - i.max;
  return l.max - l.min < i.max - i.min && ([u, o] = [o, u]), { min: u, max: o };
}
function Mx(i, l) {
  return {
    x: yy(i.x, l.x),
    y: yy(i.y, l.y)
  };
}
function Dx(i, l) {
  let u = 0.5;
  const o = se(i), c = se(l);
  return c > o ? u = /* @__PURE__ */ hl(l.min, l.max - o, i.min) : o > c && (u = /* @__PURE__ */ hl(i.min, i.max - c, l.min)), Je(0, 1, u);
}
function Rx(i, l) {
  const u = {};
  return l.min !== void 0 && (u.min = l.min - i.min), l.max !== void 0 && (u.max = l.max - i.min), u;
}
const Ec = 0.35;
function Cx(i = Ec) {
  return i === !1 ? i = 0 : i === !0 && (i = Ec), {
    x: gy(i, "left", "right"),
    y: gy(i, "top", "bottom")
  };
}
function gy(i, l, u) {
  return {
    min: vy(i, l),
    max: vy(i, u)
  };
}
function vy(i, l) {
  return typeof i == "number" ? i : i[l] || 0;
}
const Ox = /* @__PURE__ */ new WeakMap();
class Vx {
  constructor(l) {
    this.openDragLock = null, this.isDragging = !1, this.currentDirection = null, this.originPoint = { x: 0, y: 0 }, this.constraints = !1, this.hasMutatedConstraints = !1, this.elastic = Xt(), this.latestPointerEvent = null, this.latestPanInfo = null, this.visualElement = l;
  }
  start(l, { snapToCursor: u = !1, distanceThreshold: o } = {}) {
    const { presenceContext: c } = this.visualElement;
    if (c && c.isPresent === !1)
      return;
    const h = (S) => {
      u && this.snapToCursor(Tl(S).point), this.stopAnimation();
    }, f = (S, b) => {
      const { drag: V, dragPropagation: D, onDragStart: z } = this.getProps();
      if (V && !D && (this.openDragLock && this.openDragLock(), this.openDragLock = nT(V), !this.openDragLock))
        return;
      this.latestPointerEvent = S, this.latestPanInfo = b, this.isDragging = !0, this.currentDirection = null, this.resolveConstraints(), this.visualElement.projection && (this.visualElement.projection.isAnimationBlocked = !0, this.visualElement.projection.target = void 0), Qe((H) => {
        let X = this.getAxisMotionValue(H).get() || 0;
        if (Pe.test(X)) {
          const { projection: q } = this.visualElement;
          if (q && q.layout) {
            const G = q.layout.layoutBox[H];
            G && (X = se(G) * (parseFloat(X) / 100));
          }
        }
        this.originPoint[H] = X;
      }), z && Rt.update(() => z(S, b), !1, !0), mc(this.visualElement, "transform");
      const { animationState: B } = this.visualElement;
      B && B.setActive("whileDrag", !0);
    }, m = (S, b) => {
      this.latestPointerEvent = S, this.latestPanInfo = b;
      const { dragPropagation: V, dragDirectionLock: D, onDirectionLock: z, onDrag: B } = this.getProps();
      if (!V && !this.openDragLock)
        return;
      const { offset: H } = b;
      if (D && this.currentDirection === null) {
        this.currentDirection = zx(H), this.currentDirection !== null && z && z(this.currentDirection);
        return;
      }
      this.updateAxis("x", b.point, H), this.updateAxis("y", b.point, H), this.visualElement.render(), B && Rt.update(() => B(S, b), !1, !0);
    }, v = (S, b) => {
      this.latestPointerEvent = S, this.latestPanInfo = b, this.stop(S, b), this.latestPointerEvent = null, this.latestPanInfo = null;
    }, p = () => {
      const { dragSnapToOrigin: S } = this.getProps();
      (S || this.constraints) && this.startAnimation({ x: 0, y: 0 });
    }, { dragSnapToOrigin: g } = this.getProps();
    this.panSession = new s0(l, {
      onSessionStart: h,
      onStart: f,
      onMove: m,
      onSessionEnd: v,
      resumeAnimation: p
    }, {
      transformPagePoint: this.visualElement.getTransformPagePoint(),
      dragSnapToOrigin: g,
      distanceThreshold: o,
      contextWindow: l0(this.visualElement),
      element: this.visualElement.current
    });
  }
  /**
   * @internal
   */
  stop(l, u) {
    const o = l || this.latestPointerEvent, c = u || this.latestPanInfo, h = this.isDragging;
    if (this.cancel(), !h || !c || !o)
      return;
    const { velocity: f } = c;
    this.startAnimation(f);
    const { onDragEnd: m } = this.getProps();
    m && Rt.postRender(() => m(o, c));
  }
  /**
   * @internal
   */
  cancel() {
    this.isDragging = !1;
    const { projection: l, animationState: u } = this.visualElement;
    l && (l.isAnimationBlocked = !1), this.endPanSession();
    const { dragPropagation: o } = this.getProps();
    !o && this.openDragLock && (this.openDragLock(), this.openDragLock = null), u && u.setActive("whileDrag", !1);
  }
  /**
   * Clean up the pan session without modifying other drag state.
   * This is used during unmount to ensure event listeners are removed
   * without affecting projection animations or drag locks.
   * @internal
   */
  endPanSession() {
    this.panSession && this.panSession.end(), this.panSession = void 0;
  }
  updateAxis(l, u, o) {
    const { drag: c } = this.getProps();
    if (!o || !Ys(l, c, this.currentDirection))
      return;
    const h = this.getAxisMotionValue(l);
    let f = this.originPoint[l] + o[l];
    this.constraints && this.constraints[l] && (f = xx(f, this.constraints[l], this.elastic[l])), h.set(f);
  }
  resolveConstraints() {
    const { dragConstraints: l, dragElastic: u } = this.getProps(), o = this.visualElement.projection && !this.visualElement.projection.layout ? this.visualElement.projection.measure(!1) : this.visualElement.projection?.layout, c = this.constraints;
    l && Wi(l) ? this.constraints || (this.constraints = this.resolveRefConstraints()) : l && o ? this.constraints = Ex(o.layoutBox, l) : this.constraints = !1, this.elastic = Cx(u), c !== this.constraints && !Wi(l) && o && this.constraints && !this.hasMutatedConstraints && Qe((h) => {
      this.constraints !== !1 && this.getAxisMotionValue(h) && (this.constraints[h] = Rx(o.layoutBox[h], this.constraints[h]));
    });
  }
  resolveRefConstraints() {
    const { dragConstraints: l, onMeasureDragConstraints: u } = this.getProps();
    if (!l || !Wi(l))
      return !1;
    const o = l.current, { projection: c } = this.visualElement;
    if (!c || !c.layout)
      return !1;
    c.root && (c.root.scroll = void 0, c.root.updateScroll());
    const h = wT(o, c.root, this.visualElement.getTransformPagePoint());
    let f = Mx(c.layout.layoutBox, h);
    if (u) {
      const m = u(CT(f));
      this.hasMutatedConstraints = !!m, m && (f = Cg(m));
    }
    return f;
  }
  startAnimation(l) {
    const { drag: u, dragMomentum: o, dragElastic: c, dragTransition: h, dragSnapToOrigin: f, onDragTransitionEnd: m } = this.getProps(), v = this.constraints || {}, p = Qe((g) => {
      if (!Ys(g, u, this.currentDirection))
        return;
      let S = v && v[g] || {};
      (f === !0 || f === g) && (S = { min: 0, max: 0 });
      const b = c ? 200 : 1e6, V = c ? 40 : 1e7, D = {
        type: "inertia",
        velocity: o ? l[g] : 0,
        bounceStiffness: b,
        bounceDamping: V,
        timeConstant: 750,
        restDelta: 1,
        restSpeed: 10,
        ...h,
        ...S
      };
      return this.startAxisValueAnimation(g, D);
    });
    return Promise.all(p).then(m);
  }
  startAxisValueAnimation(l, u) {
    const o = this.getAxisMotionValue(l);
    return mc(this.visualElement, l), o.start(Gc(l, o, 0, u, this.visualElement, !1));
  }
  stopAnimation() {
    Qe((l) => this.getAxisMotionValue(l).stop());
  }
  /**
   * Drag works differently depending on which props are provided.
   *
   * - If _dragX and _dragY are provided, we output the gesture delta directly to those motion values.
   * - Otherwise, we apply the delta to the x/y motion values.
   */
  getAxisMotionValue(l) {
    const u = `_drag${l.toUpperCase()}`, c = this.visualElement.getProps()[u];
    return c || this.visualElement.getValue(l, this.visualElement.latestValues[l] ?? 0);
  }
  snapToCursor(l) {
    Qe((u) => {
      const { drag: o } = this.getProps();
      if (!Ys(u, o, this.currentDirection))
        return;
      const { projection: c } = this.visualElement, h = this.getAxisMotionValue(u);
      if (c && c.layout) {
        const { min: f, max: m } = c.layout.layoutBox[u], v = h.get() || 0;
        h.set(l[u] - Dt(f, m, 0.5) + v);
      }
    });
  }
  /**
   * When the viewport resizes we want to check if the measured constraints
   * have changed and, if so, reposition the element within those new constraints
   * relative to where it was before the resize.
   */
  scalePositionWithinConstraints() {
    if (!this.visualElement.current)
      return;
    const { drag: l, dragConstraints: u } = this.getProps(), { projection: o } = this.visualElement;
    if (!Wi(u) || !o || !this.constraints)
      return;
    this.stopAnimation();
    const c = { x: 0, y: 0 };
    Qe((f) => {
      const m = this.getAxisMotionValue(f);
      if (m && this.constraints !== !1) {
        const v = m.get();
        c[f] = Dx({ min: v, max: v }, this.constraints[f]);
      }
    });
    const { transformTemplate: h } = this.visualElement.getProps();
    this.visualElement.current.style.transform = h ? h({}, "") : "none", o.root && o.root.updateScroll(), o.updateLayout(), this.constraints = !1, this.resolveConstraints(), Qe((f) => {
      if (!Ys(f, l, null))
        return;
      const m = this.getAxisMotionValue(f), { min: v, max: p } = this.constraints[f];
      m.set(Dt(v, p, c[f]));
    }), this.visualElement.render();
  }
  addListeners() {
    if (!this.visualElement.current)
      return;
    Ox.set(this.visualElement, this);
    const l = this.visualElement.current, u = cl(l, "pointerdown", (p) => {
      const { drag: g, dragListener: S = !0 } = this.getProps(), b = p.target, V = b !== l && oT(b);
      g && S && !V && this.start(p);
    });
    let o;
    const c = () => {
      const { dragConstraints: p } = this.getProps();
      Wi(p) && p.current && (this.constraints = this.resolveRefConstraints(), o || (o = wx(l, p.current, () => this.scalePositionWithinConstraints())));
    }, { projection: h } = this.visualElement, f = h.addEventListener("measure", c);
    h && !h.layout && (h.root && h.root.updateScroll(), h.updateLayout()), Rt.read(c);
    const m = pl(window, "resize", () => this.scalePositionWithinConstraints()), v = h.addEventListener("didUpdate", (({ delta: p, hasLayoutChanged: g }) => {
      this.isDragging && g && (Qe((S) => {
        const b = this.getAxisMotionValue(S);
        b && (this.originPoint[S] += p[S].translate, b.set(b.get() + p[S].translate));
      }), this.visualElement.render());
    }));
    return () => {
      m(), u(), f(), v && v(), o && o();
    };
  }
  getProps() {
    const l = this.visualElement.getProps(), { drag: u = !1, dragDirectionLock: o = !1, dragPropagation: c = !1, dragConstraints: h = !1, dragElastic: f = Ec, dragMomentum: m = !0 } = l;
    return {
      ...l,
      drag: u,
      dragDirectionLock: o,
      dragPropagation: c,
      dragConstraints: h,
      dragElastic: f,
      dragMomentum: m
    };
  }
}
function Sy(i) {
  let l = !0;
  return () => {
    if (l) {
      l = !1;
      return;
    }
    i();
  };
}
function wx(i, l, u) {
  const o = Dp(i, Sy(u)), c = Dp(l, Sy(u));
  return () => {
    o(), c();
  };
}
function Ys(i, l, u) {
  return (l === !0 || l === i) && (u === null || u === i);
}
function zx(i, l = 10) {
  let u = null;
  return Math.abs(i.y) > l ? u = "y" : Math.abs(i.x) > l && (u = "x"), u;
}
class _x extends Yn {
  constructor(l) {
    super(l), this.removeGroupControls = _e, this.removeListeners = _e, this.controls = new Vx(l);
  }
  mount() {
    const { dragControls: l } = this.node.getProps();
    l && (this.removeGroupControls = l.subscribe(this.controls)), this.removeListeners = this.controls.addListeners() || _e;
  }
  update() {
    const { dragControls: l } = this.node.getProps(), { dragControls: u } = this.node.prevProps || {};
    l !== u && (this.removeGroupControls(), l && (this.removeGroupControls = l.subscribe(this.controls)));
  }
  unmount() {
    this.removeGroupControls(), this.removeListeners(), this.controls.isDragging || this.controls.endPanSession();
  }
}
const Wr = (i) => (l, u) => {
  i && Rt.update(() => i(l, u), !1, !0);
};
class Bx extends Yn {
  constructor() {
    super(...arguments), this.removePointerDownListener = _e;
  }
  onPointerDown(l) {
    this.session = new s0(l, this.createPanHandlers(), {
      transformPagePoint: this.node.getTransformPagePoint(),
      contextWindow: l0(this.node)
    });
  }
  createPanHandlers() {
    const { onPanSessionStart: l, onPanStart: u, onPan: o, onPanEnd: c } = this.node.getProps();
    return {
      onSessionStart: Wr(l),
      onStart: Wr(u),
      onMove: Wr(o),
      onEnd: (h, f) => {
        delete this.session, c && Rt.postRender(() => c(h, f));
      }
    };
  }
  mount() {
    this.removePointerDownListener = cl(this.node.current, "pointerdown", (l) => this.onPointerDown(l));
  }
  update() {
    this.session && this.session.updateHandlers(this.createPanHandlers());
  }
  unmount() {
    this.removePointerDownListener(), this.session && this.session.end();
  }
}
let $r = !1;
class Nx extends Y.Component {
  /**
   * This only mounts projection nodes for components that
   * need measuring, we might want to do it for all components
   * in order to incorporate transforms
   */
  componentDidMount() {
    const { visualElement: l, layoutGroup: u, switchLayoutGroup: o, layoutId: c } = this.props, { projection: h } = l;
    h && (u.group && u.group.add(h), o && o.register && c && o.register(h), $r && h.root.didUpdate(), h.addEventListener("animationComplete", () => {
      this.safeToRemove();
    }), h.setOptions({
      ...h.options,
      layoutDependency: this.props.layoutDependency,
      onExitComplete: () => this.safeToRemove()
    })), Fs.hasEverUpdated = !0;
  }
  getSnapshotBeforeUpdate(l) {
    const { layoutDependency: u, visualElement: o, drag: c, isPresent: h } = this.props, { projection: f } = o;
    return f && (f.isPresent = h, l.layoutDependency !== u && f.setOptions({
      ...f.options,
      layoutDependency: u
    }), $r = !0, c || l.layoutDependency !== u || u === void 0 || l.isPresent !== h ? f.willUpdate() : this.safeToRemove(), l.isPresent !== h && (h ? f.promote() : f.relegate() || Rt.postRender(() => {
      const m = f.getStack();
      (!m || !m.members.length) && this.safeToRemove();
    }))), null;
  }
  componentDidUpdate() {
    const { visualElement: l, layoutAnchor: u } = this.props, { projection: o } = l;
    o && (o.options.layoutAnchor = u, o.root.didUpdate(), Qc.postRender(() => {
      !o.currentAnimation && o.isLead() && this.safeToRemove();
    }));
  }
  componentWillUnmount() {
    const { visualElement: l, layoutGroup: u, switchLayoutGroup: o } = this.props, { projection: c } = l;
    $r = !0, c && (c.scheduleCheckAfterUnmount(), u && u.group && u.group.remove(c), o && o.deregister && o.deregister(c));
  }
  safeToRemove() {
    const { safeToRemove: l } = this.props;
    l && l();
  }
  render() {
    return null;
  }
}
function o0(i) {
  const [l, u] = Jg(), o = Y.useContext(Rc);
  return L.jsx(Nx, { ...i, layoutGroup: o, switchLayoutGroup: Y.useContext(i0), isPresent: l, safeToRemove: u });
}
const Ux = {
  pan: {
    Feature: Bx
  },
  drag: {
    Feature: _x,
    ProjectionNode: Pg,
    MeasureLayout: o0
  }
};
function by(i, l, u) {
  const { props: o } = i;
  i.animationState && o.whileHover && i.animationState.setActive("whileHover", u === "Start");
  const c = "onHover" + u, h = o[c];
  h && Rt.postRender(() => h(l, Tl(l)));
}
class jx extends Yn {
  mount() {
    const { current: l } = this.node;
    l && (this.unmount = aT(l, (u, o) => (by(this.node, o, "Start"), (c) => by(this.node, c, "End"))));
  }
  unmount() {
  }
}
class Lx extends Yn {
  constructor() {
    super(...arguments), this.isActive = !1;
  }
  onFocus() {
    let l = !1;
    try {
      l = this.node.current.matches(":focus-visible");
    } catch {
      l = !0;
    }
    !l || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !0), this.isActive = !0);
  }
  onBlur() {
    !this.isActive || !this.node.animationState || (this.node.animationState.setActive("whileFocus", !1), this.isActive = !1);
  }
  mount() {
    this.unmount = vl(pl(this.node.current, "focus", () => this.onFocus()), pl(this.node.current, "blur", () => this.onBlur()));
  }
  unmount() {
  }
}
function Ty(i, l, u) {
  const { props: o } = i;
  if (i.current instanceof HTMLButtonElement && i.current.disabled)
    return;
  i.animationState && o.whileTap && i.animationState.setActive("whileTap", u === "Start");
  const c = "onTap" + (u === "End" ? "" : u), h = o[c];
  h && Rt.postRender(() => h(l, Tl(l)));
}
class Hx extends Yn {
  mount() {
    const { current: l } = this.node;
    if (!l)
      return;
    const { globalTapTarget: u, propagate: o } = this.node.props;
    this.unmount = cT(l, (c, h) => (Ty(this.node, h, "Start"), (f, { success: m }) => Ty(this.node, f, m ? "End" : "Cancel")), {
      useGlobalTarget: u,
      stopPropagation: o?.tap === !1
    });
  }
  unmount() {
  }
}
const Mc = /* @__PURE__ */ new WeakMap(), Ir = /* @__PURE__ */ new WeakMap(), qx = (i) => {
  const l = Mc.get(i.target);
  l && l(i);
}, Yx = (i) => {
  i.forEach(qx);
};
function Gx({ root: i, ...l }) {
  const u = i || document;
  Ir.has(u) || Ir.set(u, {});
  const o = Ir.get(u), c = JSON.stringify(l);
  return o[c] || (o[c] = new IntersectionObserver(Yx, { root: i, ...l })), o[c];
}
function Xx(i, l, u) {
  const o = Gx(l);
  return Mc.set(i, u), o.observe(i), () => {
    Mc.delete(i), o.unobserve(i);
  };
}
const Zx = {
  some: 0,
  all: 1
};
class Kx extends Yn {
  constructor() {
    super(...arguments), this.hasEnteredView = !1, this.isInView = !1;
  }
  startObserver() {
    this.stopObserver?.();
    const { viewport: l = {} } = this.node.getProps(), { root: u, margin: o, amount: c = "some", once: h } = l, f = {
      root: u ? u.current : void 0,
      rootMargin: o,
      threshold: typeof c == "number" ? c : Zx[c]
    }, m = (v) => {
      const { isIntersecting: p } = v;
      if (this.isInView === p || (this.isInView = p, h && !p && this.hasEnteredView))
        return;
      p && (this.hasEnteredView = !0), this.node.animationState && this.node.animationState.setActive("whileInView", p);
      const { onViewportEnter: g, onViewportLeave: S } = this.node.getProps(), b = p ? g : S;
      b && b(v);
    };
    this.stopObserver = Xx(this.node.current, f, m);
  }
  mount() {
    this.startObserver();
  }
  update() {
    if (typeof IntersectionObserver > "u")
      return;
    const { props: l, prevProps: u } = this.node;
    ["amount", "margin", "root"].some(Qx(l, u)) && this.startObserver();
  }
  unmount() {
    this.stopObserver?.(), this.hasEnteredView = !1, this.isInView = !1;
  }
}
function Qx({ viewport: i = {} }, { viewport: l = {} } = {}) {
  return (u) => i[u] !== l[u];
}
const kx = {
  inView: {
    Feature: Kx
  },
  tap: {
    Feature: Hx
  },
  focus: {
    Feature: Lx
  },
  hover: {
    Feature: jx
  }
}, Px = {
  layout: {
    ProjectionNode: Pg,
    MeasureLayout: o0
  }
}, Jx = {
  ...vx,
  ...kx,
  ...Ux,
  ...Px
}, gl = /* @__PURE__ */ dx(Jx, mx), uu = [
  {
    id: "obsidian",
    label: "Obsidian",
    tagline: "Deep slate · Cobalt precision",
    baseTheme: "dark",
    swatches: ["#090d16", "#0f1624", "#3b82f6"]
  },
  {
    id: "ivory",
    label: "Ivory",
    tagline: "Architectural light · Crisp ink",
    baseTheme: "light",
    swatches: ["#f7f8fb", "#ffffff", "#2563eb"]
  },
  {
    id: "spatial",
    label: "Spatial",
    tagline: "Layered glass · Depth & sky",
    baseTheme: "dark",
    swatches: ["#0b1222", "#132038", "#38bdf8"]
  },
  {
    id: "cyber",
    label: "Cyber",
    tagline: "Carbon telemetry · Cyan pulse",
    baseTheme: "dark",
    swatches: ["#060913", "#0d1528", "#06b6d4"]
  },
  {
    id: "graphite",
    label: "Graphite",
    tagline: "Neutral charcoal · Editorial",
    baseTheme: "dark",
    swatches: ["#111317", "#191d24", "#94a3b8"]
  },
  {
    id: "aurora",
    label: "Aurora",
    tagline: "Midnight indigo · Emerald glow",
    baseTheme: "dark",
    swatches: ["#080e1a", "#0f1b2e", "#10b981"]
  }
], r0 = "applyra-appearance", Fx = "applyra-dark-appearance";
function c0(i) {
  return uu.some((l) => l.id === i);
}
function f0(i) {
  return uu.find((l) => l.id === i) ?? uu[0];
}
function Wx() {
  try {
    const i = localStorage.getItem(r0);
    if (c0(i)) return i;
    if (localStorage.getItem("applyra-theme") === "light") return "ivory";
  } catch {
  }
  return "obsidian";
}
function h0(i, l = !0) {
  const u = f0(i), o = document.documentElement;
  if (o.setAttribute("data-appearance", u.id), o.setAttribute("data-theme", u.baseTheme), o.style.colorScheme = u.baseTheme, l) {
    try {
      localStorage.setItem(r0, u.id), localStorage.setItem("applyra-theme", u.baseTheme), u.baseTheme === "dark" && localStorage.setItem(Fx, u.id);
    } catch {
    }
    try {
      window.chrome?.storage?.local?.set({
        applyraAppearance: u.id,
        applyraTheme: u.baseTheme
      });
    } catch {
    }
  }
  return window.dispatchEvent(new CustomEvent("applyra:appearance-changed", { detail: u })), u;
}
const fl = [
  {
    id: "reduced",
    label: "Reduced",
    description: "Zero decorative motion · Instant state changes",
    durationFast: 0,
    durationBase: 0,
    springStiffness: 1e3,
    springDamping: 100,
    enableParticles: !1,
    enableStagger: !1
  },
  {
    id: "standard",
    label: "Standard",
    description: "Crisp precision · Fast micro-transitions",
    durationFast: 0.14,
    durationBase: 0.2,
    springStiffness: 460,
    springDamping: 36,
    enableParticles: !1,
    enableStagger: !1
  },
  {
    id: "enhanced",
    label: "Enhanced",
    description: "Fluid springs · Shared-element layout morphing",
    durationFast: 0.18,
    durationBase: 0.28,
    springStiffness: 380,
    springDamping: 30,
    enableParticles: !0,
    enableStagger: !0
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Expressive springs · Staggered pipeline reveals",
    durationFast: 0.24,
    durationBase: 0.38,
    springStiffness: 280,
    springDamping: 24,
    enableParticles: !0,
    enableStagger: !0
  }
], d0 = "applyra-motion-mode";
function m0(i) {
  return fl.some((l) => l.id === i);
}
function ef() {
  try {
    return typeof window < "u" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return !1;
  }
}
function $x() {
  try {
    const i = localStorage.getItem(d0);
    if (m0(i)) return i;
  } catch {
  }
  return ef() ? "reduced" : "enhanced";
}
function p0(i) {
  return ef() && i !== "reduced" ? fl[0] : fl.find((l) => l.id === i) ?? fl[2];
}
function y0(i, l = !0) {
  const u = p0(i);
  if (document.documentElement.setAttribute("data-motion", u.id), l) {
    try {
      localStorage.setItem(d0, i);
    } catch {
    }
    try {
      window.chrome?.storage?.local?.set({ applyraMotionMode: i });
    } catch {
    }
  }
  return window.dispatchEvent(new CustomEvent("applyra:motion-changed", { detail: u })), u;
}
function g0() {
  return typeof chrome < "u" && !!chrome?.storage?.local;
}
async function Ix(i) {
  return g0() ? await chrome.storage.local.get(i) : {};
}
function tc(i) {
  return Array.isArray(i) ? i : [];
}
function tE(i) {
  return !i || !i.skills ? [] : Array.isArray(i.skills) ? i.skills.map((l) => String(l).trim()).filter(Boolean) : String(i.skills).split(/[,|\n]/).map((l) => l.trim()).filter(Boolean);
}
const v0 = [
  "Python",
  "TypeScript",
  "JavaScript",
  "React",
  "Node.js",
  "SQL",
  "PyTorch",
  "TensorFlow",
  "LangGraph",
  "LLM",
  "RAG",
  "AWS",
  "Docker",
  "Kubernetes",
  "FastAPI",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Data Science",
  "Go",
  "Rust",
  "Java",
  "GraphQL",
  "PostgreSQL"
];
function eE(i, l) {
  const u = tE(l), o = [
    i?.resume?.text || "",
    i?.naukri?.text || "",
    i?.linkedin?.text || "",
    l?.headline || "",
    l?.summary || ""
  ].join(" ").toLowerCase(), c = /* @__PURE__ */ new Set(), h = [];
  for (const f of u) {
    const m = f.toLowerCase();
    c.has(m) || (c.add(m), h.push(f));
  }
  if (o.trim().length > 0)
    for (const f of v0) {
      const m = f.toLowerCase();
      !c.has(m) && o.includes(m) && (c.add(m), h.push(f));
    }
  return h.slice(0, 14);
}
function nE(i) {
  if (Array.isArray(i.skills) && i.skills.length > 0)
    return i.skills.map((o) => String(o).trim()).filter(Boolean).slice(0, 8);
  const l = `${i.title || ""} ${i.description || ""}`.toLowerCase();
  if (!l.trim()) return [];
  const u = [];
  for (const o of v0)
    if (l.includes(o.toLowerCase()) && (u.push(o), u.length >= 6))
      break;
  return u;
}
async function iE() {
  if (!g0())
    return {
      jobs: [],
      candidateEvidence: null,
      candidateProfile: null,
      scheduledScans: [],
      companyIntel: []
    };
  const i = await Ix([
    "jobs",
    "candidateEvidence",
    "candidateProfile",
    "scheduledScans",
    "companyIntel"
  ]);
  return {
    jobs: tc(i.jobs),
    candidateEvidence: i.candidateEvidence || null,
    candidateProfile: i.candidateProfile || null,
    scheduledScans: tc(i.scheduledScans),
    companyIntel: tc(i.companyIntel)
  };
}
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const aE = (i) => i.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase(), lE = (i) => i.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (l, u, o) => o ? o.toUpperCase() : u.toLowerCase()
), Ay = (i) => {
  const l = lE(i);
  return l.charAt(0).toUpperCase() + l.slice(1);
}, S0 = (...i) => i.filter((l, u, o) => !!l && l.trim() !== "" && o.indexOf(l) === u).join(" ").trim(), sE = (i) => {
  for (const l in i)
    if (l.startsWith("aria-") || l === "role" || l === "title")
      return !0;
};
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
var uE = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const oE = Y.forwardRef(
  ({
    color: i = "currentColor",
    size: l = 24,
    strokeWidth: u = 2,
    absoluteStrokeWidth: o,
    className: c = "",
    children: h,
    iconNode: f,
    ...m
  }, v) => Y.createElement(
    "svg",
    {
      ref: v,
      ...uE,
      width: l,
      height: l,
      stroke: i,
      strokeWidth: o ? Number(u) * 24 / Number(l) : u,
      className: S0("lucide", c),
      ...!h && !sE(m) && { "aria-hidden": "true" },
      ...m
    },
    [
      ...f.map(([p, g]) => Y.createElement(p, g)),
      ...Array.isArray(h) ? h : [h]
    ]
  )
);
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const pu = (i, l) => {
  const u = Y.forwardRef(
    ({ className: o, ...c }, h) => Y.createElement(oE, {
      ref: h,
      iconNode: l,
      className: S0(
        `lucide-${aE(Ay(i))}`,
        `lucide-${i}`,
        o
      ),
      ...c
    })
  );
  return u.displayName = Ay(i), u;
};
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const rE = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]], cE = pu("check", rE);
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const fE = [
  [
    "path",
    {
      d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
      key: "e79jfc"
    }
  ],
  ["circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" }],
  ["circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" }],
  ["circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" }],
  ["circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" }]
], hE = pu("palette", fE);
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const dE = [
  ["path", { d: "M10 5H3", key: "1qgfaw" }],
  ["path", { d: "M12 19H3", key: "yhmn1j" }],
  ["path", { d: "M14 3v4", key: "1sua03" }],
  ["path", { d: "M16 17v4", key: "1q0r14" }],
  ["path", { d: "M21 12h-9", key: "1o4lsq" }],
  ["path", { d: "M21 19h-5", key: "1rlt1p" }],
  ["path", { d: "M21 5h-7", key: "1oszz2" }],
  ["path", { d: "M8 10v4", key: "tgpxqk" }],
  ["path", { d: "M8 12H3", key: "a7s4jb" }]
], mE = pu("sliders-horizontal", dE);
/**
 * @license lucide-react v0.544.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const pE = [
  [
    "path",
    {
      d: "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      key: "1s2grr"
    }
  ],
  ["path", { d: "M20 2v4", key: "1rf3ol" }],
  ["path", { d: "M22 4h-4", key: "gwowj6" }],
  ["circle", { cx: "4", cy: "20", r: "2", key: "6kqj1y" }]
], yE = pu("sparkles", pE), gE = ({
  appearance: i,
  motionMode: l,
  onAppearanceChange: u,
  onMotionChange: o
}) => {
  const [c, h] = Y.useState(!1), f = Y.useRef(null), m = f0(i), v = ef();
  Y.useEffect(() => {
    if (!c) return;
    const S = (V) => {
      f.current && !f.current.contains(V.target) && h(!1);
    }, b = (V) => {
      V.key === "Escape" && h(!1);
    };
    return document.addEventListener("mousedown", S), document.addEventListener("keydown", b), () => {
      document.removeEventListener("mousedown", S), document.removeEventListener("keydown", b);
    };
  }, [c]);
  const p = (S) => {
    h0(S, !0), u(S);
  }, g = (S) => {
    y0(S, !0), o(S);
  };
  return /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-studio-wrap", ref: f, children: [
    /* @__PURE__ */ L.jsxs(
      "button",
      {
        type: "button",
        className: "ap-ve-studio-trigger",
        "aria-expanded": c,
        "aria-haspopup": "dialog",
        "aria-label": "Appearance & Motion Engine",
        onClick: () => h((S) => !S),
        "data-testid": "appearance-studio-trigger",
        children: [
          /* @__PURE__ */ L.jsx(
            "span",
            {
              className: "ap-ve-swatch-dot",
              style: { background: m.swatches[2] },
              "aria-hidden": "true"
            }
          ),
          /* @__PURE__ */ L.jsx(hE, { size: 14, "aria-hidden": "true" }),
          /* @__PURE__ */ L.jsx("span", { className: "ap-ve-trigger-label", children: m.label })
        ]
      }
    ),
    /* @__PURE__ */ L.jsx(GA, { children: c && /* @__PURE__ */ L.jsxs(
      gl.div,
      {
        role: "dialog",
        "aria-label": "Appearance & Motion Preferences",
        className: "ap-ve-studio-popover",
        initial: { opacity: 0, scale: 0.96, y: -6 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: -4 },
        transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
        style: { transformOrigin: "top right" },
        children: [
          /* @__PURE__ */ L.jsx("div", { className: "ap-ve-studio-head", children: /* @__PURE__ */ L.jsxs("div", { children: [
            /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-studio-title", children: [
              /* @__PURE__ */ L.jsx(yE, { size: 14, "aria-hidden": "true" }),
              /* @__PURE__ */ L.jsx("span", { children: "Appearance Engine" })
            ] }),
            /* @__PURE__ */ L.jsx("p", { className: "ap-ve-studio-sub", children: "Six calibrated visual personalities & motion physics." })
          ] }) }),
          /* @__PURE__ */ L.jsx("div", { className: "ap-ve-preset-grid", role: "radiogroup", "aria-label": "Visual personality", children: uu.map((S) => {
            const b = S.id === i;
            return /* @__PURE__ */ L.jsxs(
              "button",
              {
                type: "button",
                role: "radio",
                "aria-checked": b,
                className: `ap-ve-preset-card ${b ? "is-selected" : ""}`,
                onClick: () => p(S.id),
                "data-appearance-option": S.id,
                children: [
                  /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-preset-swatches", "aria-hidden": "true", children: [
                    /* @__PURE__ */ L.jsx("span", { style: { background: S.swatches[0] } }),
                    /* @__PURE__ */ L.jsx("span", { style: { background: S.swatches[1] } }),
                    /* @__PURE__ */ L.jsx("span", { style: { background: S.swatches[2] } })
                  ] }),
                  /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-preset-meta", children: [
                    /* @__PURE__ */ L.jsx("strong", { children: S.label }),
                    /* @__PURE__ */ L.jsx("span", { children: S.tagline })
                  ] }),
                  b && /* @__PURE__ */ L.jsx("span", { className: "ap-ve-preset-check", "aria-hidden": "true", children: /* @__PURE__ */ L.jsx(cE, { size: 12 }) })
                ]
              },
              S.id
            );
          }) }),
          /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-motion-section", children: [
            /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-motion-head", children: [
              /* @__PURE__ */ L.jsxs("span", { className: "ap-ve-motion-label", children: [
                /* @__PURE__ */ L.jsx(mE, { size: 13, "aria-hidden": "true" }),
                "Motion Physics"
              ] }),
              v && /* @__PURE__ */ L.jsx("span", { className: "ap-ve-os-badge", children: "OS Reduced Motion Active" })
            ] }),
            /* @__PURE__ */ L.jsx("div", { className: "ap-ve-motion-pills", role: "radiogroup", "aria-label": "Motion preference", children: fl.map((S) => {
              const b = S.id === l;
              return /* @__PURE__ */ L.jsx(
                "button",
                {
                  type: "button",
                  role: "radio",
                  "aria-checked": b,
                  title: S.description,
                  className: `ap-ve-motion-pill ${b ? "is-selected" : ""}`,
                  onClick: () => g(S.id),
                  "data-motion-option": S.id,
                  children: S.label
                },
                S.id
              );
            }) })
          ] })
        ]
      }
    ) })
  ] });
}, vE = ({
  jobs: i,
  motionConfig: l,
  paused: u
}) => {
  const o = Y.useMemo(() => {
    const f = i.length, m = i.filter((S) => Number(S.fitScore ?? 0) >= 70).length, v = i.filter((S) => String(S.status || "").toLowerCase() === "applied" || !!S.appliedAt).length, p = i.filter((S) => String(S.status || "").toLowerCase().includes("interview")).length, g = i.filter((S) => String(S.status || "").toLowerCase().includes("offer")).length;
    return [
      { id: "captured", label: "Captured", count: f, tone: "neutral" },
      { id: "strong", label: "Strong Fit", count: m, tone: "info" },
      { id: "applied", label: "Applied", count: v, tone: "accent" },
      { id: "interview", label: "Interviews", count: p, tone: "warn" },
      { id: "offer", label: "Offers", count: g, tone: "ok" }
    ];
  }, [i]), c = Math.max(1, ...o.map((f) => f.count)), h = l.enableParticles && !u && i.length > 0;
  return /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card", "data-testid": "pipeline-flow-graph", children: [
    /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card-head", children: [
      /* @__PURE__ */ L.jsxs("div", { children: [
        /* @__PURE__ */ L.jsx("h3", { children: "Live Application Pipeline Flow" }),
        /* @__PURE__ */ L.jsx("p", { children: "Real-time stage progression derived from stored extension records" })
      ] }),
      /* @__PURE__ */ L.jsxs("span", { className: "ap-ve-badge", children: [
        i.length,
        " ",
        i.length === 1 ? "record" : "records"
      ] })
    ] }),
    /* @__PURE__ */ L.jsx("div", { className: "ap-ve-pipeline-rail", role: "list", "aria-label": "Pipeline stages", children: o.map((f, m) => {
      const v = i.length > 0 ? Math.round(f.count / c * 100) : 0;
      return /* @__PURE__ */ L.jsxs(Ey.Fragment, { children: [
        /* @__PURE__ */ L.jsxs(
          gl.div,
          {
            role: "listitem",
            className: `ap-ve-stage-node tone-${f.tone}`,
            initial: l.enableStagger ? { opacity: 0, y: 8 } : !1,
            animate: { opacity: 1, y: 0 },
            transition: {
              duration: l.durationBase,
              delay: l.enableStagger ? m * 0.04 : 0,
              ease: [0.22, 1, 0.36, 1]
            },
            children: [
              /* @__PURE__ */ L.jsx("span", { className: "ap-ve-stage-label", children: f.label }),
              /* @__PURE__ */ L.jsx("strong", { className: "ap-ve-stage-count", children: f.count }),
              /* @__PURE__ */ L.jsx("div", { className: "ap-ve-stage-meter", "aria-hidden": "true", children: /* @__PURE__ */ L.jsx(
                "div",
                {
                  className: "ap-ve-stage-fill",
                  style: { transform: `scaleX(${Math.max(v, f.count > 0 ? 6 : 0) / 100})` }
                }
              ) })
            ]
          }
        ),
        m < o.length - 1 && /* @__PURE__ */ L.jsx("div", { className: "ap-ve-stage-connector", "aria-hidden": "true", children: /* @__PURE__ */ L.jsxs("svg", { viewBox: "0 0 36 16", width: "36", height: "16", children: [
          /* @__PURE__ */ L.jsx(
            "line",
            {
              x1: "2",
              y1: "8",
              x2: "34",
              y2: "8",
              stroke: "currentColor",
              strokeOpacity: "0.24",
              strokeWidth: "1.5",
              strokeDasharray: "3 3"
            }
          ),
          h && /* @__PURE__ */ L.jsx(
            gl.circle,
            {
              r: "2.5",
              cy: "8",
              fill: "var(--ap-accent)",
              initial: { cx: 4, opacity: 0 },
              animate: { cx: [4, 32], opacity: [0, 1, 0] },
              transition: {
                duration: 1.8,
                repeat: 1 / 0,
                delay: m * 0.25,
                ease: "easeInOut"
              }
            }
          )
        ] }) })
      ] }, f.id);
    }) })
  ] });
}, SE = ({
  jobs: i,
  evidence: l,
  profile: u,
  motionConfig: o
}) => {
  const [c, h] = Y.useState(null), f = Y.useMemo(
    () => eE(l, u),
    [l, u]
  ), m = Y.useMemo(() => i.slice(0, 6).map((b) => ({
    job: b,
    skills: nE(b)
  })), [i]), v = Y.useMemo(() => {
    const b = [], V = new Set(f.map((D) => D.toLowerCase()));
    for (const D of m)
      for (const z of D.skills)
        V.has(z.toLowerCase()) && b.push({ skill: z, jobId: D.job.id, matched: !0 });
    return b;
  }, [f, m]), p = 560, g = 240, S = f.slice(0, 8);
  return /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card", "data-testid": "skill-network-graph", children: [
    /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card-head", children: [
      /* @__PURE__ */ L.jsxs("div", { children: [
        /* @__PURE__ */ L.jsx("h3", { children: "Skill-to-Opportunity Graph" }),
        /* @__PURE__ */ L.jsx("p", { children: "Verified candidate skills mapped against captured role requirements" })
      ] }),
      /* @__PURE__ */ L.jsxs("span", { className: "ap-ve-badge", children: [
        S.length,
        " skills · ",
        m.length,
        " roles"
      ] })
    ] }),
    S.length === 0 || m.length === 0 ? /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-empty", children: [
      /* @__PURE__ */ L.jsx("strong", { children: "No graph edges available yet" }),
      /* @__PURE__ */ L.jsx("span", { children: "Upload a resume in Career Intelligence and capture jobs in Extractor to map real skill-to-role overlap." })
    ] }) : /* @__PURE__ */ L.jsx("div", { className: "ap-ve-graph-wrap", children: /* @__PURE__ */ L.jsxs(
      "svg",
      {
        viewBox: `0 0 ${p} ${g}`,
        className: "ap-ve-graph-svg",
        role: "img",
        "aria-label": "Candidate skills to captured jobs relationship graph",
        children: [
          S.map((b, V) => {
            const D = 26 + V * ((g - 44) / Math.max(1, S.length - 1));
            return m.map((z, B) => {
              const H = 30 + B * ((g - 56) / Math.max(1, m.length - 1));
              if (!v.some(
                (G) => G.jobId === z.job.id && G.skill.toLowerCase() === b.toLowerCase()
              )) return null;
              const q = !c || c.toLowerCase() === b.toLowerCase();
              return /* @__PURE__ */ L.jsx(
                gl.path,
                {
                  d: `M 148 ${D} C 260 ${D}, 300 ${H}, 396 ${H}`,
                  fill: "none",
                  stroke: "var(--ap-accent)",
                  strokeWidth: q ? 2 : 1,
                  strokeOpacity: q ? 0.68 : 0.14,
                  initial: o.enableStagger ? { pathLength: 0 } : !1,
                  animate: { pathLength: 1 },
                  transition: { duration: o.durationBase }
                },
                `${b}-${z.job.id}`
              );
            });
          }),
          S.map((b, V) => {
            const D = 26 + V * ((g - 44) / Math.max(1, S.length - 1)), z = c === b;
            return /* @__PURE__ */ L.jsxs(
              "g",
              {
                className: "ap-ve-graph-node",
                onClick: () => h(z ? null : b),
                style: { cursor: "pointer" },
                children: [
                  /* @__PURE__ */ L.jsx(
                    "rect",
                    {
                      x: 8,
                      y: D - 11,
                      width: 140,
                      height: 22,
                      rx: 6,
                      fill: z ? "var(--ap-accent-soft)" : "var(--ap-surface-elevated)",
                      stroke: z ? "var(--ap-accent)" : "var(--ap-border)"
                    }
                  ),
                  /* @__PURE__ */ L.jsx(
                    "text",
                    {
                      x: 18,
                      y: D + 4,
                      fill: "var(--ap-text)",
                      fontSize: "11",
                      fontWeight: z ? 600 : 500,
                      children: b.length > 18 ? `${b.slice(0, 17)}…` : b
                    }
                  )
                ]
              },
              b
            );
          }),
          m.map((b, V) => {
            const D = 30 + V * ((g - 56) / Math.max(1, m.length - 1)), z = `${b.job.title || "Role"}`;
            return /* @__PURE__ */ L.jsxs("g", { children: [
              /* @__PURE__ */ L.jsx(
                "rect",
                {
                  x: 396,
                  y: D - 12,
                  width: 156,
                  height: 24,
                  rx: 6,
                  fill: "var(--ap-surface-elevated)",
                  stroke: "var(--ap-border)"
                }
              ),
              /* @__PURE__ */ L.jsx("text", { x: 406, y: D + 4, fill: "var(--ap-text)", fontSize: "11", fontWeight: 500, children: z.length > 20 ? `${z.slice(0, 19)}…` : z })
            ] }, b.job.id);
          })
        ]
      }
    ) })
  ] });
}, bE = ({
  jobs: i,
  motionConfig: l
}) => {
  const u = Y.useMemo(() => {
    const c = /* @__PURE__ */ new Map();
    for (const h of i) {
      const f = String(h.sourceLabel || h.source || h.provider || "Captured").trim() || "Captured";
      c.set(f, (c.get(f) || 0) + 1);
    }
    return Array.from(c.entries()).map(([h, f]) => ({ label: h, count: f })).sort((h, f) => f.count - h.count).slice(0, 6);
  }, [i]), o = Math.max(1, ...u.map((c) => c.count));
  return /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card", "data-testid": "corpus-distribution-chart", children: [
    /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-card-head", children: [
      /* @__PURE__ */ L.jsxs("div", { children: [
        /* @__PURE__ */ L.jsx("h3", { children: "Source & Corpus Distribution" }),
        /* @__PURE__ */ L.jsx("p", { children: "Breakdown of captured opportunities by origin" })
      ] }),
      /* @__PURE__ */ L.jsxs("span", { className: "ap-ve-badge", children: [
        u.length,
        " ",
        u.length === 1 ? "source" : "sources"
      ] })
    ] }),
    u.length === 0 ? /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-empty", children: [
      /* @__PURE__ */ L.jsx("strong", { children: "No captured job sources yet" }),
      /* @__PURE__ */ L.jsx("span", { children: "Run an extraction or import a CSV to inspect source distribution." })
    ] }) : /* @__PURE__ */ L.jsx("div", { className: "ap-ve-bars", children: u.map((c, h) => {
      const f = c.count / o;
      return /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-bar-row", children: [
        /* @__PURE__ */ L.jsxs("div", { className: "ap-ve-bar-meta", children: [
          /* @__PURE__ */ L.jsx("span", { children: c.label }),
          /* @__PURE__ */ L.jsx("strong", { children: c.count })
        ] }),
        /* @__PURE__ */ L.jsx("div", { className: "ap-ve-bar-track", "aria-hidden": "true", children: /* @__PURE__ */ L.jsx(
          gl.div,
          {
            className: "ap-ve-bar-fill",
            initial: l.enableStagger ? { scaleX: 0 } : !1,
            animate: { scaleX: f },
            transition: {
              duration: l.durationBase,
              delay: l.enableStagger ? h * 0.04 : 0,
              ease: [0.22, 1, 0.36, 1]
            },
            style: { transformOrigin: "left center" }
          }
        ) })
      ] }, c.label);
    }) })
  ] });
}, TE = ({
  topbarSlot: i,
  overviewSlot: l,
  isOverviewRoute: u
}) => {
  const [o, c] = Y.useState(() => Wx()), [h, f] = Y.useState(() => $x()), [m, v] = Y.useState(
    () => typeof document < "u" ? document.hidden : !1
  ), [p, g] = Y.useState({
    jobs: [],
    candidateEvidence: null,
    candidateProfile: null,
    scheduledScans: [],
    companyIntel: []
  });
  Y.useEffect(() => {
    h0(o, !1), y0(h, !1);
  }, [o, h]), Y.useEffect(() => {
    const b = (z) => {
      const B = z.detail;
      B && c0(B.id) && c(B.id);
    }, V = (z) => {
      const B = z.detail;
      B && m0(B.id) && f(B.id);
    }, D = () => v(document.hidden);
    return window.addEventListener("applyra:appearance-changed", b), window.addEventListener("applyra:motion-changed", V), document.addEventListener("visibilitychange", D), () => {
      window.removeEventListener("applyra:appearance-changed", b), window.removeEventListener("applyra:motion-changed", V), document.removeEventListener("visibilitychange", D);
    };
  }, []), Y.useEffect(() => {
    let b = !0;
    const V = () => {
      iE().then((B) => {
        b && g(B);
      }).catch(() => {
      });
    };
    V();
    const D = window, z = () => V();
    return D.chrome?.storage?.onChanged?.addListener(z), window.addEventListener("applyra:evidence-updated", V), () => {
      b = !1, D.chrome?.storage?.onChanged?.removeListener(z), window.removeEventListener("applyra:evidence-updated", V);
    };
  }, [u]);
  const S = p0(h);
  return /* @__PURE__ */ L.jsxs(kA, { reducedMotion: S.id === "reduced" ? "always" : "user", children: [
    i && lp.createPortal(
      /* @__PURE__ */ L.jsx(
        gE,
        {
          appearance: o,
          motionMode: h,
          onAppearanceChange: c,
          onMotionChange: f
        }
      ),
      i
    ),
    u && l && lp.createPortal(
      /* @__PURE__ */ L.jsxs(
        "section",
        {
          className: "ap-ve-overview-grid",
          "aria-label": "Applyra Visual Intelligence",
          "data-testid": "visual-engine-overview",
          children: [
            /* @__PURE__ */ L.jsx("div", { className: "ap-ve-span-2", children: /* @__PURE__ */ L.jsx(
              vE,
              {
                jobs: p.jobs,
                motionConfig: S,
                paused: m
              }
            ) }),
            /* @__PURE__ */ L.jsx(
              SE,
              {
                jobs: p.jobs,
                evidence: p.candidateEvidence,
                profile: p.candidateProfile,
                motionConfig: S
              }
            ),
            /* @__PURE__ */ L.jsx(
              bE,
              {
                jobs: p.jobs,
                motionConfig: S
              }
            )
          ]
        }
      ),
      l
    )
  ] });
};
function AE() {
  const i = document.querySelector('.sidebar .nav-item.active, .sidebar [aria-current="page"]');
  if (i)
    return /overview/i.test(i.textContent || "");
  const l = document.getElementById("apBreadcrumb");
  return l ? /overview/i.test(l.textContent || "") : !!(document.getElementById("applyra-overview-health") || document.querySelector(".metric-strip"));
}
function xE() {
  const i = document.querySelector(".topbar-actions");
  if (!i) return null;
  let l = document.getElementById("apVisualTopbarSlot");
  if (!l) {
    l = document.createElement("div"), l.id = "apVisualTopbarSlot", l.className = "ap-ve-topbar-slot";
    const u = i.querySelector("[data-theme-toggle]");
    u ? i.insertBefore(l, u) : i.appendChild(l);
  }
  return l;
}
function EE(i) {
  if (!i) return null;
  const l = document.getElementById("apVisualOverviewSlot");
  if (l && l.isConnected) return l;
  const u = document.querySelector(".metric-strip"), o = document.getElementById("apCommandCenter"), c = u?.parentElement || o?.parentElement;
  if (!c) return null;
  const h = document.createElement("div");
  return h.id = "apVisualOverviewSlot", h.className = "ap-ve-overview-slot", u ? c.insertBefore(h, u) : c.appendChild(h), h;
}
function xy() {
  if (!document.body) return;
  let i = document.getElementById("apVisualEngineHost");
  i || (i = document.createElement("div"), i.id = "apVisualEngineHost", i.style.display = "contents", document.body.appendChild(i));
  const l = W1.createRoot(i), u = () => {
    const h = AE(), f = xE(), m = EE(h);
    l.render(
      /* @__PURE__ */ L.jsx(Ey.StrictMode, { children: /* @__PURE__ */ L.jsx(
        TE,
        {
          topbarSlot: f,
          overviewSlot: m,
          isOverviewRoute: h
        }
      ) })
    );
  };
  u();
  let o = 0;
  new MutationObserver(() => {
    o && cancelAnimationFrame(o), o = requestAnimationFrame(u);
  }).observe(document.body, { childList: !0, subtree: !0 });
}
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", xy, { once: !0 }) : xy();
