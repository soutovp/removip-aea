exports.id = 828;
exports.ids = [828];
exports.modules = {

/***/ 66:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

(function() {
    (__webpack_require__(6191).config)(Object.assign({}, __webpack_require__(8234), __webpack_require__(4113)(process.argv)));
})();


/***/ }),

/***/ 4113:
/***/ ((module) => {

"use strict";

const re = /^dotenv_config_(encoding|path|debug|override|DOTENV_KEY)=(.+)$/;
module.exports = function optionMatcher(args) {
    return args.reduce(function(acc, cur) {
        const matches = cur.match(re);
        if (matches) {
            acc[matches[1]] = matches[2];
        }
        return acc;
    }, {});
};


/***/ }),

/***/ 8234:
/***/ ((module) => {

"use strict";
// ../config.js accepts options via environment variables

const options = {};
if (process.env.DOTENV_CONFIG_ENCODING != null) {
    options.encoding = process.env.DOTENV_CONFIG_ENCODING;
}
if (process.env.DOTENV_CONFIG_PATH != null) {
    options.path = process.env.DOTENV_CONFIG_PATH;
}
if (process.env.DOTENV_CONFIG_DEBUG != null) {
    options.debug = process.env.DOTENV_CONFIG_DEBUG;
}
if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
    options.override = process.env.DOTENV_CONFIG_OVERRIDE;
}
if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
    options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
}
module.exports = options;


/***/ }),

/***/ 6191:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const fs = __webpack_require__(7147);
const path = __webpack_require__(1017);
const os = __webpack_require__(2037);
const crypto = __webpack_require__(6113);
const packageJson = __webpack_require__(1564);
const version = packageJson.version;
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
// Parse src into an Object
function parse(src) {
    const obj = {};
    // Convert buffer to string
    let lines = src.toString();
    // Convert line breaks to same format
    lines = lines.replace(/\r\n?/mg, "\n");
    let match;
    while((match = LINE.exec(lines)) != null){
        const key = match[1];
        // Default undefined or null to empty string
        let value = match[2] || "";
        // Remove whitespace
        value = value.trim();
        // Check if double quoted
        const maybeQuote = value[0];
        // Remove surrounding quotes
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
        // Expand newlines if double quoted
        if (maybeQuote === '"') {
            value = value.replace(/\\n/g, "\n");
            value = value.replace(/\\r/g, "\r");
        }
        // Add to object
        obj[key] = value;
    }
    return obj;
}
function _parseVault(options) {
    const vaultPath = _vaultPath(options);
    // Parse .env.vault
    const result = DotenvModule.configDotenv({
        path: vaultPath
    });
    if (!result.parsed) {
        throw new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
    }
    // handle scenario for comma separated keys - for use with key rotation
    // example: DOTENV_KEY="dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenv.org/vault/.env.vault?environment=prod"
    const keys = _dotenvKey(options).split(",");
    const length = keys.length;
    let decrypted;
    for(let i = 0; i < length; i++){
        try {
            // Get full key
            const key = keys[i].trim();
            // Get instructions for decrypt
            const attrs = _instructions(result, key);
            // Decrypt
            decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
            break;
        } catch (error) {
            // last key
            if (i + 1 >= length) {
                throw error;
            }
        // try next key
        }
    }
    // Parse decrypted .env string
    return DotenvModule.parse(decrypted);
}
function _log(message) {
    console.log(`[dotenv@${version}][INFO] ${message}`);
}
function _warn(message) {
    console.log(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
    console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _dotenvKey(options) {
    // prioritize developer directly setting options.DOTENV_KEY
    if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
        return options.DOTENV_KEY;
    }
    // secondary infra already contains a DOTENV_KEY environment variable
    if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
        return process.env.DOTENV_KEY;
    }
    // fallback to empty string
    return "";
}
function _instructions(result, dotenvKey) {
    // Parse DOTENV_KEY. Format is a URI
    let uri;
    try {
        uri = new URL(dotenvKey);
    } catch (error) {
        if (error.code === "ERR_INVALID_URL") {
            throw new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenv.org/vault/.env.vault?environment=development");
        }
        throw error;
    }
    // Get decrypt key
    const key = uri.password;
    if (!key) {
        throw new Error("INVALID_DOTENV_KEY: Missing key part");
    }
    // Get environment
    const environment = uri.searchParams.get("environment");
    if (!environment) {
        throw new Error("INVALID_DOTENV_KEY: Missing environment part");
    }
    // Get ciphertext payload
    const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
    const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
    ;
    if (!ciphertext) {
        throw new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
    }
    return {
        ciphertext,
        key
    };
}
function _vaultPath(options) {
    let dotenvPath = path.resolve(process.cwd(), ".env");
    if (options && options.path && options.path.length > 0) {
        dotenvPath = options.path;
    }
    // Locate .env.vault
    return dotenvPath.endsWith(".vault") ? dotenvPath : `${dotenvPath}.vault`;
}
function _resolveHome(envPath) {
    return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options) {
    _log("Loading env from encrypted .env.vault");
    const parsed = DotenvModule._parseVault(options);
    let processEnv = process.env;
    if (options && options.processEnv != null) {
        processEnv = options.processEnv;
    }
    DotenvModule.populate(processEnv, parsed, options);
    return {
        parsed
    };
}
function configDotenv(options) {
    let dotenvPath = path.resolve(process.cwd(), ".env");
    let encoding = "utf8";
    const debug = Boolean(options && options.debug);
    if (options) {
        if (options.path != null) {
            dotenvPath = _resolveHome(options.path);
        }
        if (options.encoding != null) {
            encoding = options.encoding;
        }
    }
    try {
        // Specifying an encoding returns a string instead of a buffer
        const parsed = DotenvModule.parse(fs.readFileSync(dotenvPath, {
            encoding
        }));
        let processEnv = process.env;
        if (options && options.processEnv != null) {
            processEnv = options.processEnv;
        }
        DotenvModule.populate(processEnv, parsed, options);
        return {
            parsed
        };
    } catch (e) {
        if (debug) {
            _debug(`Failed to load ${dotenvPath} ${e.message}`);
        }
        return {
            error: e
        };
    }
}
// Populates process.env from .env file
function config(options) {
    const vaultPath = _vaultPath(options);
    // fallback to original dotenv if DOTENV_KEY is not set
    if (_dotenvKey(options).length === 0) {
        return DotenvModule.configDotenv(options);
    }
    // dotenvKey exists but .env.vault file does not exist
    if (!fs.existsSync(vaultPath)) {
        _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
        return DotenvModule.configDotenv(options);
    }
    return DotenvModule._configVault(options);
}
function decrypt(encrypted, keyStr) {
    const key = Buffer.from(keyStr.slice(-64), "hex");
    let ciphertext = Buffer.from(encrypted, "base64");
    const nonce = ciphertext.slice(0, 12);
    const authTag = ciphertext.slice(-16);
    ciphertext = ciphertext.slice(12, -16);
    try {
        const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
        aesgcm.setAuthTag(authTag);
        return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
    } catch (error) {
        const isRange = error instanceof RangeError;
        const invalidKeyLength = error.message === "Invalid key length";
        const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
        if (isRange || invalidKeyLength) {
            const msg = "INVALID_DOTENV_KEY: It must be 64 characters long (or more)";
            throw new Error(msg);
        } else if (decryptionFailed) {
            const msg = "DECRYPTION_FAILED: Please check your DOTENV_KEY";
            throw new Error(msg);
        } else {
            console.error("Error: ", error.code);
            console.error("Error: ", error.message);
            throw error;
        }
    }
}
// Populate process.env with parsed values
function populate(processEnv, parsed, options = {}) {
    const debug = Boolean(options && options.debug);
    const override = Boolean(options && options.override);
    if (typeof parsed !== "object") {
        throw new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    }
    // Set process.env
    for (const key of Object.keys(parsed)){
        if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
            if (override === true) {
                processEnv[key] = parsed[key];
            }
            if (debug) {
                if (override === true) {
                    _debug(`"${key}" is already defined and WAS overwritten`);
                } else {
                    _debug(`"${key}" is already defined and was NOT overwritten`);
                }
            }
        } else {
            processEnv[key] = parsed[key];
        }
    }
}
const DotenvModule = {
    configDotenv,
    _configVault,
    _parseVault,
    config,
    decrypt,
    parse,
    populate
};
module.exports.configDotenv = DotenvModule.configDotenv;
module.exports._configVault = DotenvModule._configVault;
module.exports._parseVault = DotenvModule._parseVault;
module.exports.config = DotenvModule.config;
module.exports.decrypt = DotenvModule.decrypt;
module.exports.parse = DotenvModule.parse;
module.exports.populate = DotenvModule.populate;
module.exports = DotenvModule;


/***/ }),

/***/ 7057:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    prefixes: function() {
        return prefixes;
    },
    wait: function() {
        return wait;
    },
    error: function() {
        return error;
    },
    warn: function() {
        return warn;
    },
    ready: function() {
        return ready;
    },
    info: function() {
        return info;
    },
    event: function() {
        return event;
    },
    trace: function() {
        return trace;
    },
    warnOnce: function() {
        return warnOnce;
    }
});
const _chalk = /*#__PURE__*/ _interop_require_default(__webpack_require__(2642));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const prefixes = {
    wait: "- " + _chalk.default.cyan("wait"),
    error: "- " + _chalk.default.red("error"),
    warn: "- " + _chalk.default.yellow("warn"),
    ready: "- " + _chalk.default.green("ready"),
    info: "- " + _chalk.default.cyan("info"),
    event: "- " + _chalk.default.magenta("event"),
    trace: "- " + _chalk.default.magenta("trace")
};
function wait(...message) {
    console.log(prefixes.wait, ...message);
}
function error(...message) {
    console.error(prefixes.error, ...message);
}
function warn(...message) {
    console.warn(prefixes.warn, ...message);
}
function ready(...message) {
    console.log(prefixes.ready, ...message);
}
function info(...message) {
    console.log(prefixes.info, ...message);
}
function event(...message) {
    console.log(prefixes.event, ...message);
}
function trace(...message) {
    console.log(prefixes.trace, ...message);
}
const warnOnceMessages = new Set();
function warnOnce(...message) {
    if (!warnOnceMessages.has(message[0])) {
        warnOnceMessages.add(message.join(" "));
        warn(...message);
    }
} //# sourceMappingURL=log.js.map


/***/ }),

/***/ 3909:
/***/ ((module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RSC: function() {
        return RSC;
    },
    ACTION: function() {
        return ACTION;
    },
    NEXT_ROUTER_STATE_TREE: function() {
        return NEXT_ROUTER_STATE_TREE;
    },
    NEXT_ROUTER_PREFETCH: function() {
        return NEXT_ROUTER_PREFETCH;
    },
    NEXT_URL: function() {
        return NEXT_URL;
    },
    FETCH_CACHE_HEADER: function() {
        return FETCH_CACHE_HEADER;
    },
    RSC_CONTENT_TYPE_HEADER: function() {
        return RSC_CONTENT_TYPE_HEADER;
    },
    RSC_VARY_HEADER: function() {
        return RSC_VARY_HEADER;
    },
    FLIGHT_PARAMETERS: function() {
        return FLIGHT_PARAMETERS;
    },
    NEXT_RSC_UNION_QUERY: function() {
        return NEXT_RSC_UNION_QUERY;
    }
});
const RSC = "RSC";
const ACTION = "Next-Action";
const NEXT_ROUTER_STATE_TREE = "Next-Router-State-Tree";
const NEXT_ROUTER_PREFETCH = "Next-Router-Prefetch";
const NEXT_URL = "Next-Url";
const FETCH_CACHE_HEADER = "x-vercel-sc-headers";
const RSC_CONTENT_TYPE_HEADER = "text/x-component";
const RSC_VARY_HEADER = RSC + ", " + NEXT_ROUTER_STATE_TREE + ", " + NEXT_ROUTER_PREFETCH + ", " + NEXT_URL;
const FLIGHT_PARAMETERS = [
    [
        RSC
    ],
    [
        NEXT_ROUTER_STATE_TREE
    ],
    [
        NEXT_ROUTER_PREFETCH
    ]
];
const NEXT_RSC_UNION_QUERY = "_rsc";
if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
    Object.defineProperty(exports.default, "__esModule", {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=app-router-headers.js.map


/***/ }),

/***/ 3641:
/***/ ((module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "DraftMode", ({
    enumerable: true,
    get: function() {
        return DraftMode;
    }
}));
const _staticgenerationbailout = __webpack_require__(6164);
class DraftMode {
    get isEnabled() {
        return this._provider.isEnabled;
    }
    enable() {
        if ((0, _staticgenerationbailout.staticGenerationBailout)("draftMode().enable()")) {
            return;
        }
        return this._provider.enable();
    }
    disable() {
        if ((0, _staticgenerationbailout.staticGenerationBailout)("draftMode().disable()")) {
            return;
        }
        return this._provider.disable();
    }
    constructor(provider){
        this._provider = provider;
    }
}
if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
    Object.defineProperty(exports.default, "__esModule", {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=draft-mode.js.map


/***/ }),

/***/ 4937:
/***/ ((module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    headers: function() {
        return headers;
    },
    cookies: function() {
        return cookies;
    },
    draftMode: function() {
        return draftMode;
    }
});
const _requestcookies = __webpack_require__(9934);
const _headers = __webpack_require__(3423);
const _cookies = __webpack_require__(1220);
const _requestasyncstorage = __webpack_require__(1715);
const _actionasyncstorage = __webpack_require__(4876);
const _staticgenerationbailout = __webpack_require__(6164);
const _draftmode = __webpack_require__(3641);
function headers() {
    if ((0, _staticgenerationbailout.staticGenerationBailout)("headers", {
        link: "https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering"
    })) {
        return _headers.HeadersAdapter.seal(new Headers({}));
    }
    const requestStore = _requestasyncstorage.requestAsyncStorage.getStore();
    if (!requestStore) {
        throw new Error("Invariant: headers() expects to have requestAsyncStorage, none available.");
    }
    return requestStore.headers;
}
function cookies() {
    if ((0, _staticgenerationbailout.staticGenerationBailout)("cookies", {
        link: "https://nextjs.org/docs/app/building-your-application/rendering/static-and-dynamic#dynamic-rendering"
    })) {
        return _requestcookies.RequestCookiesAdapter.seal(new _cookies.RequestCookies(new Headers({})));
    }
    const requestStore = _requestasyncstorage.requestAsyncStorage.getStore();
    if (!requestStore) {
        throw new Error("Invariant: cookies() expects to have requestAsyncStorage, none available.");
    }
    const asyncActionStore = _actionasyncstorage.actionAsyncStorage.getStore();
    if (asyncActionStore && (asyncActionStore.isAction || asyncActionStore.isAppRoute)) {
        // We can't conditionally return different types here based on the context.
        // To avoid confusion, we always return the readonly type here.
        return requestStore.mutableCookies;
    }
    return requestStore.cookies;
}
function draftMode() {
    const requestStore = _requestasyncstorage.requestAsyncStorage.getStore();
    if (!requestStore) {
        throw new Error("Invariant: draftMode() expects to have requestAsyncStorage, none available.");
    }
    return new _draftmode.DraftMode(requestStore.draftMode);
}
if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
    Object.defineProperty(exports.default, "__esModule", {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=headers.js.map


/***/ }),

/***/ 2241:
/***/ ((module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    notFound: function() {
        return notFound;
    },
    isNotFoundError: function() {
        return isNotFoundError;
    }
});
const NOT_FOUND_ERROR_CODE = "NEXT_NOT_FOUND";
function notFound() {
    // eslint-disable-next-line no-throw-literal
    const error = new Error(NOT_FOUND_ERROR_CODE);
    error.digest = NOT_FOUND_ERROR_CODE;
    throw error;
}
function isNotFoundError(error) {
    return (error == null ? void 0 : error.digest) === NOT_FOUND_ERROR_CODE;
}
if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
    Object.defineProperty(exports.default, "__esModule", {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=not-found.js.map


/***/ }),

/***/ 5287:
/***/ ((module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RedirectType: function() {
        return RedirectType;
    },
    getRedirectError: function() {
        return getRedirectError;
    },
    redirect: function() {
        return redirect;
    },
    isRedirectError: function() {
        return isRedirectError;
    },
    getURLFromRedirectError: function() {
        return getURLFromRedirectError;
    },
    getRedirectTypeFromError: function() {
        return getRedirectTypeFromError;
    }
});
const _requestasyncstorage = __webpack_require__(1715);
const REDIRECT_ERROR_CODE = "NEXT_REDIRECT";
var RedirectType;
(function(RedirectType) {
    RedirectType["push"] = "push";
    RedirectType["replace"] = "replace";
})(RedirectType || (RedirectType = {}));
function getRedirectError(url, type) {
    const error = new Error(REDIRECT_ERROR_CODE);
    error.digest = REDIRECT_ERROR_CODE + ";" + type + ";" + url;
    const requestStore = _requestasyncstorage.requestAsyncStorage.getStore();
    if (requestStore) {
        error.mutableCookies = requestStore.mutableCookies;
    }
    return error;
}
function redirect(url, type) {
    if (type === void 0) type = "replace";
    throw getRedirectError(url, type);
}
function isRedirectError(error) {
    if (typeof (error == null ? void 0 : error.digest) !== "string") return false;
    const [errorCode, type, destination] = error.digest.split(";", 3);
    return errorCode === REDIRECT_ERROR_CODE && (type === "replace" || type === "push") && typeof destination === "string";
}
function getURLFromRedirectError(error) {
    if (!isRedirectError(error)) return null;
    // Slices off the beginning of the digest that contains the code and the
    // separating ';'.
    return error.digest.split(";", 3)[2];
}
function getRedirectTypeFromError(error) {
    if (!isRedirectError(error)) {
        throw new Error("Not a redirect error");
    }
    return error.digest.split(";", 3)[1];
}
if ((typeof exports.default === "function" || typeof exports.default === "object" && exports.default !== null) && typeof exports.default.__esModule === "undefined") {
    Object.defineProperty(exports.default, "__esModule", {
        value: true
    });
    Object.assign(exports.default, exports);
    module.exports = exports.default;
} //# sourceMappingURL=redirect.js.map


/***/ }),

/***/ 1749:
/***/ ((module) => {

"use strict";

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all)=>{
    for(var name in all)__defProp(target, name, {
        get: all[name],
        enumerable: true
    });
};
var __copyProps = (to, from, except, desc)=>{
    if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
            get: ()=>from[key],
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
    return to;
};
var __toCommonJS = (mod)=>__copyProps(__defProp({}, "__esModule", {
        value: true
    }), mod);
// src/index.ts
var src_exports = {};
__export(src_exports, {
    RequestCookies: ()=>RequestCookies,
    ResponseCookies: ()=>ResponseCookies,
    parseCookie: ()=>parseCookie,
    parseSetCookie: ()=>parseSetCookie,
    splitCookiesString: ()=>splitCookiesString,
    stringifyCookie: ()=>stringifyCookie
});
module.exports = __toCommonJS(src_exports);
// src/serialize.ts
function stringifyCookie(c) {
    var _a;
    const attrs = [
        "path" in c && c.path && `Path=${c.path}`,
        "expires" in c && (c.expires || c.expires === 0) && `Expires=${(typeof c.expires === "number" ? new Date(c.expires) : c.expires).toUTCString()}`,
        "maxAge" in c && typeof c.maxAge === "number" && `Max-Age=${c.maxAge}`,
        "domain" in c && c.domain && `Domain=${c.domain}`,
        "secure" in c && c.secure && "Secure",
        "httpOnly" in c && c.httpOnly && "HttpOnly",
        "sameSite" in c && c.sameSite && `SameSite=${c.sameSite}`
    ].filter(Boolean);
    return `${c.name}=${encodeURIComponent((_a = c.value) != null ? _a : "")}; ${attrs.join("; ")}`;
}
function parseCookie(cookie) {
    const map = /* @__PURE__ */ new Map();
    for (const pair of cookie.split(/; */)){
        if (!pair) continue;
        const splitAt = pair.indexOf("=");
        if (splitAt === -1) {
            map.set(pair, "true");
            continue;
        }
        const [key, value] = [
            pair.slice(0, splitAt),
            pair.slice(splitAt + 1)
        ];
        try {
            map.set(key, decodeURIComponent(value != null ? value : "true"));
        } catch  {}
    }
    return map;
}
function parseSetCookie(setCookie) {
    if (!setCookie) {
        return void 0;
    }
    const [[name, value], ...attributes] = parseCookie(setCookie);
    const { domain, expires, httponly, maxage, path, samesite, secure } = Object.fromEntries(attributes.map(([key, value2])=>[
            key.toLowerCase(),
            value2
        ]));
    const cookie = {
        name,
        value: decodeURIComponent(value),
        domain,
        ...expires && {
            expires: new Date(expires)
        },
        ...httponly && {
            httpOnly: true
        },
        ...typeof maxage === "string" && {
            maxAge: Number(maxage)
        },
        path,
        ...samesite && {
            sameSite: parseSameSite(samesite)
        },
        ...secure && {
            secure: true
        }
    };
    return compact(cookie);
}
function compact(t) {
    const newT = {};
    for(const key in t){
        if (t[key]) {
            newT[key] = t[key];
        }
    }
    return newT;
}
var SAME_SITE = [
    "strict",
    "lax",
    "none"
];
function parseSameSite(string) {
    string = string.toLowerCase();
    return SAME_SITE.includes(string) ? string : void 0;
}
function splitCookiesString(cookiesString) {
    if (!cookiesString) return [];
    var cookiesStrings = [];
    var pos = 0;
    var start;
    var ch;
    var lastComma;
    var nextStart;
    var cookiesSeparatorFound;
    function skipWhitespace() {
        while(pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))){
            pos += 1;
        }
        return pos < cookiesString.length;
    }
    function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
    }
    while(pos < cookiesString.length){
        start = pos;
        cookiesSeparatorFound = false;
        while(skipWhitespace()){
            ch = cookiesString.charAt(pos);
            if (ch === ",") {
                lastComma = pos;
                pos += 1;
                skipWhitespace();
                nextStart = pos;
                while(pos < cookiesString.length && notSpecialChar()){
                    pos += 1;
                }
                if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
                    cookiesSeparatorFound = true;
                    pos = nextStart;
                    cookiesStrings.push(cookiesString.substring(start, lastComma));
                    start = pos;
                } else {
                    pos = lastComma + 1;
                }
            } else {
                pos += 1;
            }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
            cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
    }
    return cookiesStrings;
}
// src/request-cookies.ts
var RequestCookies = class {
    constructor(requestHeaders){
        /** @internal */ this._parsed = /* @__PURE__ */ new Map();
        this._headers = requestHeaders;
        const header = requestHeaders.get("cookie");
        if (header) {
            const parsed = parseCookie(header);
            for (const [name, value] of parsed){
                this._parsed.set(name, {
                    name,
                    value
                });
            }
        }
    }
    [Symbol.iterator]() {
        return this._parsed[Symbol.iterator]();
    }
    /**
   * The amount of cookies received from the client
   */ get size() {
        return this._parsed.size;
    }
    get(...args) {
        const name = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(name);
    }
    getAll(...args) {
        var _a;
        const all = Array.from(this._parsed);
        if (!args.length) {
            return all.map(([_, value])=>value);
        }
        const name = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter(([n])=>n === name).map(([_, value])=>value);
    }
    has(name) {
        return this._parsed.has(name);
    }
    set(...args) {
        const [name, value] = args.length === 1 ? [
            args[0].name,
            args[0].value
        ] : args;
        const map = this._parsed;
        map.set(name, {
            name,
            value
        });
        this._headers.set("cookie", Array.from(map).map(([_, value2])=>stringifyCookie(value2)).join("; "));
        return this;
    }
    /**
   * Delete the cookies matching the passed name or names in the request.
   */ delete(names) {
        const map = this._parsed;
        const result = !Array.isArray(names) ? map.delete(names) : names.map((name)=>map.delete(name));
        this._headers.set("cookie", Array.from(map).map(([_, value])=>stringifyCookie(value)).join("; "));
        return result;
    }
    /**
   * Delete all the cookies in the cookies in the request.
   */ clear() {
        this.delete(Array.from(this._parsed.keys()));
        return this;
    }
    /**
   * Format the cookies in the request as a string for logging
   */ [Symbol.for("edge-runtime.inspect.custom")]() {
        return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
    }
    toString() {
        return [
            ...this._parsed.values()
        ].map((v)=>`${v.name}=${encodeURIComponent(v.value)}`).join("; ");
    }
};
// src/response-cookies.ts
var ResponseCookies = class {
    constructor(responseHeaders){
        /** @internal */ this._parsed = /* @__PURE__ */ new Map();
        var _a, _b, _c;
        this._headers = responseHeaders;
        const setCookie = // @ts-expect-error See https://github.com/whatwg/fetch/issues/973
        (_c = (_b = (_a = responseHeaders.getAll) == null ? void 0 : _a.call(responseHeaders, "set-cookie")) != null ? _b : responseHeaders.get("set-cookie")) != null ? _c : [];
        const cookieStrings = Array.isArray(setCookie) ? setCookie : splitCookiesString(setCookie);
        for (const cookieString of cookieStrings){
            const parsed = parseSetCookie(cookieString);
            if (parsed) this._parsed.set(parsed.name, parsed);
        }
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */ get(...args) {
        const key = typeof args[0] === "string" ? args[0] : args[0].name;
        return this._parsed.get(key);
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */ getAll(...args) {
        var _a;
        const all = Array.from(this._parsed.values());
        if (!args.length) {
            return all;
        }
        const key = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
        return all.filter((c)=>c.name === key);
    }
    has(name) {
        return this._parsed.has(name);
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
   */ set(...args) {
        const [name, value, cookie] = args.length === 1 ? [
            args[0].name,
            args[0].value,
            args[0]
        ] : args;
        const map = this._parsed;
        map.set(name, normalizeCookie({
            name,
            value,
            ...cookie
        }));
        replace(map, this._headers);
        return this;
    }
    /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */ delete(...args) {
        const [name, path, domain] = typeof args[0] === "string" ? [
            args[0]
        ] : [
            args[0].name,
            args[0].path,
            args[0].domain
        ];
        return this.set({
            name,
            path,
            domain,
            value: "",
            expires: /* @__PURE__ */ new Date(0)
        });
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
    }
    toString() {
        return [
            ...this._parsed.values()
        ].map(stringifyCookie).join("; ");
    }
};
function replace(bag, headers) {
    headers.delete("set-cookie");
    for (const [, value] of bag){
        const serialized = stringifyCookie(value);
        headers.append("set-cookie", serialized);
    }
}
function normalizeCookie(cookie = {
    name: "",
    value: ""
}) {
    if (typeof cookie.expires === "number") {
        cookie.expires = new Date(cookie.expires);
    }
    if (cookie.maxAge) {
        cookie.expires = new Date(Date.now() + cookie.maxAge * 1e3);
    }
    if (cookie.path === null || cookie.path === void 0) {
        cookie.path = "/";
    }
    return cookie;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (0);


/***/ }),

/***/ 1149:
/***/ ((module) => {

"use strict";

(()=>{
    "use strict";
    var e = {
        339: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.ContextAPI = void 0;
            const n = r(44);
            const a = r(38);
            const o = r(741);
            const i = "context";
            const c = new n.NoopContextManager;
            class ContextAPI {
                constructor(){}
                static getInstance() {
                    if (!this._instance) {
                        this._instance = new ContextAPI;
                    }
                    return this._instance;
                }
                setGlobalContextManager(e) {
                    return (0, a.registerGlobal)(i, e, o.DiagAPI.instance());
                }
                active() {
                    return this._getContextManager().active();
                }
                with(e, t, r, ...n) {
                    return this._getContextManager().with(e, t, r, ...n);
                }
                bind(e, t) {
                    return this._getContextManager().bind(e, t);
                }
                _getContextManager() {
                    return (0, a.getGlobal)(i) || c;
                }
                disable() {
                    this._getContextManager().disable();
                    (0, a.unregisterGlobal)(i, o.DiagAPI.instance());
                }
            }
            t.ContextAPI = ContextAPI;
        },
        741: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.DiagAPI = void 0;
            const n = r(144);
            const a = r(871);
            const o = r(133);
            const i = r(38);
            const c = "diag";
            class DiagAPI {
                constructor(){
                    function _logProxy(e) {
                        return function(...t) {
                            const r = (0, i.getGlobal)("diag");
                            if (!r) return;
                            return r[e](...t);
                        };
                    }
                    const e = this;
                    const setLogger = (t, r = {
                        logLevel: o.DiagLogLevel.INFO
                    })=>{
                        var n, c, s;
                        if (t === e) {
                            const t = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
                            e.error((n = t.stack) !== null && n !== void 0 ? n : t.message);
                            return false;
                        }
                        if (typeof r === "number") {
                            r = {
                                logLevel: r
                            };
                        }
                        const u = (0, i.getGlobal)("diag");
                        const l = (0, a.createLogLevelDiagLogger)((c = r.logLevel) !== null && c !== void 0 ? c : o.DiagLogLevel.INFO, t);
                        if (u && !r.suppressOverrideMessage) {
                            const e = (s = (new Error).stack) !== null && s !== void 0 ? s : "<failed to generate stacktrace>";
                            u.warn(`Current logger will be overwritten from ${e}`);
                            l.warn(`Current logger will overwrite one already registered from ${e}`);
                        }
                        return (0, i.registerGlobal)("diag", l, e, true);
                    };
                    e.setLogger = setLogger;
                    e.disable = ()=>{
                        (0, i.unregisterGlobal)(c, e);
                    };
                    e.createComponentLogger = (e)=>new n.DiagComponentLogger(e);
                    e.verbose = _logProxy("verbose");
                    e.debug = _logProxy("debug");
                    e.info = _logProxy("info");
                    e.warn = _logProxy("warn");
                    e.error = _logProxy("error");
                }
                static instance() {
                    if (!this._instance) {
                        this._instance = new DiagAPI;
                    }
                    return this._instance;
                }
            }
            t.DiagAPI = DiagAPI;
        },
        128: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.MetricsAPI = void 0;
            const n = r(333);
            const a = r(38);
            const o = r(741);
            const i = "metrics";
            class MetricsAPI {
                constructor(){}
                static getInstance() {
                    if (!this._instance) {
                        this._instance = new MetricsAPI;
                    }
                    return this._instance;
                }
                setGlobalMeterProvider(e) {
                    return (0, a.registerGlobal)(i, e, o.DiagAPI.instance());
                }
                getMeterProvider() {
                    return (0, a.getGlobal)(i) || n.NOOP_METER_PROVIDER;
                }
                getMeter(e, t, r) {
                    return this.getMeterProvider().getMeter(e, t, r);
                }
                disable() {
                    (0, a.unregisterGlobal)(i, o.DiagAPI.instance());
                }
            }
            t.MetricsAPI = MetricsAPI;
        },
        930: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.PropagationAPI = void 0;
            const n = r(38);
            const a = r(600);
            const o = r(625);
            const i = r(377);
            const c = r(701);
            const s = r(741);
            const u = "propagation";
            const l = new a.NoopTextMapPropagator;
            class PropagationAPI {
                constructor(){
                    this.createBaggage = c.createBaggage;
                    this.getBaggage = i.getBaggage;
                    this.getActiveBaggage = i.getActiveBaggage;
                    this.setBaggage = i.setBaggage;
                    this.deleteBaggage = i.deleteBaggage;
                }
                static getInstance() {
                    if (!this._instance) {
                        this._instance = new PropagationAPI;
                    }
                    return this._instance;
                }
                setGlobalPropagator(e) {
                    return (0, n.registerGlobal)(u, e, s.DiagAPI.instance());
                }
                inject(e, t, r = o.defaultTextMapSetter) {
                    return this._getGlobalPropagator().inject(e, t, r);
                }
                extract(e, t, r = o.defaultTextMapGetter) {
                    return this._getGlobalPropagator().extract(e, t, r);
                }
                fields() {
                    return this._getGlobalPropagator().fields();
                }
                disable() {
                    (0, n.unregisterGlobal)(u, s.DiagAPI.instance());
                }
                _getGlobalPropagator() {
                    return (0, n.getGlobal)(u) || l;
                }
            }
            t.PropagationAPI = PropagationAPI;
        },
        967: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.TraceAPI = void 0;
            const n = r(38);
            const a = r(414);
            const o = r(994);
            const i = r(542);
            const c = r(741);
            const s = "trace";
            class TraceAPI {
                constructor(){
                    this._proxyTracerProvider = new a.ProxyTracerProvider;
                    this.wrapSpanContext = o.wrapSpanContext;
                    this.isSpanContextValid = o.isSpanContextValid;
                    this.deleteSpan = i.deleteSpan;
                    this.getSpan = i.getSpan;
                    this.getActiveSpan = i.getActiveSpan;
                    this.getSpanContext = i.getSpanContext;
                    this.setSpan = i.setSpan;
                    this.setSpanContext = i.setSpanContext;
                }
                static getInstance() {
                    if (!this._instance) {
                        this._instance = new TraceAPI;
                    }
                    return this._instance;
                }
                setGlobalTracerProvider(e) {
                    const t = (0, n.registerGlobal)(s, this._proxyTracerProvider, c.DiagAPI.instance());
                    if (t) {
                        this._proxyTracerProvider.setDelegate(e);
                    }
                    return t;
                }
                getTracerProvider() {
                    return (0, n.getGlobal)(s) || this._proxyTracerProvider;
                }
                getTracer(e, t) {
                    return this.getTracerProvider().getTracer(e, t);
                }
                disable() {
                    (0, n.unregisterGlobal)(s, c.DiagAPI.instance());
                    this._proxyTracerProvider = new a.ProxyTracerProvider;
                }
            }
            t.TraceAPI = TraceAPI;
        },
        377: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.deleteBaggage = t.setBaggage = t.getActiveBaggage = t.getBaggage = void 0;
            const n = r(339);
            const a = r(421);
            const o = (0, a.createContextKey)("OpenTelemetry Baggage Key");
            function getBaggage(e) {
                return e.getValue(o) || undefined;
            }
            t.getBaggage = getBaggage;
            function getActiveBaggage() {
                return getBaggage(n.ContextAPI.getInstance().active());
            }
            t.getActiveBaggage = getActiveBaggage;
            function setBaggage(e, t) {
                return e.setValue(o, t);
            }
            t.setBaggage = setBaggage;
            function deleteBaggage(e) {
                return e.deleteValue(o);
            }
            t.deleteBaggage = deleteBaggage;
        },
        496: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.BaggageImpl = void 0;
            class BaggageImpl {
                constructor(e){
                    this._entries = e ? new Map(e) : new Map;
                }
                getEntry(e) {
                    const t = this._entries.get(e);
                    if (!t) {
                        return undefined;
                    }
                    return Object.assign({}, t);
                }
                getAllEntries() {
                    return Array.from(this._entries.entries()).map(([e, t])=>[
                            e,
                            t
                        ]);
                }
                setEntry(e, t) {
                    const r = new BaggageImpl(this._entries);
                    r._entries.set(e, t);
                    return r;
                }
                removeEntry(e) {
                    const t = new BaggageImpl(this._entries);
                    t._entries.delete(e);
                    return t;
                }
                removeEntries(...e) {
                    const t = new BaggageImpl(this._entries);
                    for (const r of e){
                        t._entries.delete(r);
                    }
                    return t;
                }
                clear() {
                    return new BaggageImpl;
                }
            }
            t.BaggageImpl = BaggageImpl;
        },
        817: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.baggageEntryMetadataSymbol = void 0;
            t.baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
        },
        701: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.baggageEntryMetadataFromString = t.createBaggage = void 0;
            const n = r(741);
            const a = r(496);
            const o = r(817);
            const i = n.DiagAPI.instance();
            function createBaggage(e = {}) {
                return new a.BaggageImpl(new Map(Object.entries(e)));
            }
            t.createBaggage = createBaggage;
            function baggageEntryMetadataFromString(e) {
                if (typeof e !== "string") {
                    i.error(`Cannot create baggage metadata from unknown type: ${typeof e}`);
                    e = "";
                }
                return {
                    __TYPE__: o.baggageEntryMetadataSymbol,
                    toString () {
                        return e;
                    }
                };
            }
            t.baggageEntryMetadataFromString = baggageEntryMetadataFromString;
        },
        388: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.context = void 0;
            const n = r(339);
            t.context = n.ContextAPI.getInstance();
        },
        44: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NoopContextManager = void 0;
            const n = r(421);
            class NoopContextManager {
                active() {
                    return n.ROOT_CONTEXT;
                }
                with(e, t, r, ...n) {
                    return t.call(r, ...n);
                }
                bind(e, t) {
                    return t;
                }
                enable() {
                    return this;
                }
                disable() {
                    return this;
                }
            }
            t.NoopContextManager = NoopContextManager;
        },
        421: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.ROOT_CONTEXT = t.createContextKey = void 0;
            function createContextKey(e) {
                return Symbol.for(e);
            }
            t.createContextKey = createContextKey;
            class BaseContext {
                constructor(e){
                    const t = this;
                    t._currentContext = e ? new Map(e) : new Map;
                    t.getValue = (e)=>t._currentContext.get(e);
                    t.setValue = (e, r)=>{
                        const n = new BaseContext(t._currentContext);
                        n._currentContext.set(e, r);
                        return n;
                    };
                    t.deleteValue = (e)=>{
                        const r = new BaseContext(t._currentContext);
                        r._currentContext.delete(e);
                        return r;
                    };
                }
            }
            t.ROOT_CONTEXT = new BaseContext;
        },
        920: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.diag = void 0;
            const n = r(741);
            t.diag = n.DiagAPI.instance();
        },
        144: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.DiagComponentLogger = void 0;
            const n = r(38);
            class DiagComponentLogger {
                constructor(e){
                    this._namespace = e.namespace || "DiagComponentLogger";
                }
                debug(...e) {
                    return logProxy("debug", this._namespace, e);
                }
                error(...e) {
                    return logProxy("error", this._namespace, e);
                }
                info(...e) {
                    return logProxy("info", this._namespace, e);
                }
                warn(...e) {
                    return logProxy("warn", this._namespace, e);
                }
                verbose(...e) {
                    return logProxy("verbose", this._namespace, e);
                }
            }
            t.DiagComponentLogger = DiagComponentLogger;
            function logProxy(e, t, r) {
                const a = (0, n.getGlobal)("diag");
                if (!a) {
                    return;
                }
                r.unshift(t);
                return a[e](...r);
            }
        },
        689: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.DiagConsoleLogger = void 0;
            const r = [
                {
                    n: "error",
                    c: "error"
                },
                {
                    n: "warn",
                    c: "warn"
                },
                {
                    n: "info",
                    c: "info"
                },
                {
                    n: "debug",
                    c: "debug"
                },
                {
                    n: "verbose",
                    c: "trace"
                }
            ];
            class DiagConsoleLogger {
                constructor(){
                    function _consoleFunc(e) {
                        return function(...t) {
                            if (console) {
                                let r = console[e];
                                if (typeof r !== "function") {
                                    r = console.log;
                                }
                                if (typeof r === "function") {
                                    return r.apply(console, t);
                                }
                            }
                        };
                    }
                    for(let e = 0; e < r.length; e++){
                        this[r[e].n] = _consoleFunc(r[e].c);
                    }
                }
            }
            t.DiagConsoleLogger = DiagConsoleLogger;
        },
        871: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.createLogLevelDiagLogger = void 0;
            const n = r(133);
            function createLogLevelDiagLogger(e, t) {
                if (e < n.DiagLogLevel.NONE) {
                    e = n.DiagLogLevel.NONE;
                } else if (e > n.DiagLogLevel.ALL) {
                    e = n.DiagLogLevel.ALL;
                }
                t = t || {};
                function _filterFunc(r, n) {
                    const a = t[r];
                    if (typeof a === "function" && e >= n) {
                        return a.bind(t);
                    }
                    return function() {};
                }
                return {
                    error: _filterFunc("error", n.DiagLogLevel.ERROR),
                    warn: _filterFunc("warn", n.DiagLogLevel.WARN),
                    info: _filterFunc("info", n.DiagLogLevel.INFO),
                    debug: _filterFunc("debug", n.DiagLogLevel.DEBUG),
                    verbose: _filterFunc("verbose", n.DiagLogLevel.VERBOSE)
                };
            }
            t.createLogLevelDiagLogger = createLogLevelDiagLogger;
        },
        133: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.DiagLogLevel = void 0;
            var r;
            (function(e) {
                e[e["NONE"] = 0] = "NONE";
                e[e["ERROR"] = 30] = "ERROR";
                e[e["WARN"] = 50] = "WARN";
                e[e["INFO"] = 60] = "INFO";
                e[e["DEBUG"] = 70] = "DEBUG";
                e[e["VERBOSE"] = 80] = "VERBOSE";
                e[e["ALL"] = 9999] = "ALL";
            })(r = t.DiagLogLevel || (t.DiagLogLevel = {}));
        },
        38: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.unregisterGlobal = t.getGlobal = t.registerGlobal = void 0;
            const n = r(966);
            const a = r(520);
            const o = r(565);
            const i = a.VERSION.split(".")[0];
            const c = Symbol.for(`opentelemetry.js.api.${i}`);
            const s = n._globalThis;
            function registerGlobal(e, t, r, n = false) {
                var o;
                const i = s[c] = (o = s[c]) !== null && o !== void 0 ? o : {
                    version: a.VERSION
                };
                if (!n && i[e]) {
                    const t = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${e}`);
                    r.error(t.stack || t.message);
                    return false;
                }
                if (i.version !== a.VERSION) {
                    const t = new Error(`@opentelemetry/api: Registration of version v${i.version} for ${e} does not match previously registered API v${a.VERSION}`);
                    r.error(t.stack || t.message);
                    return false;
                }
                i[e] = t;
                r.debug(`@opentelemetry/api: Registered a global for ${e} v${a.VERSION}.`);
                return true;
            }
            t.registerGlobal = registerGlobal;
            function getGlobal(e) {
                var t, r;
                const n = (t = s[c]) === null || t === void 0 ? void 0 : t.version;
                if (!n || !(0, o.isCompatible)(n)) {
                    return;
                }
                return (r = s[c]) === null || r === void 0 ? void 0 : r[e];
            }
            t.getGlobal = getGlobal;
            function unregisterGlobal(e, t) {
                t.debug(`@opentelemetry/api: Unregistering a global for ${e} v${a.VERSION}.`);
                const r = s[c];
                if (r) {
                    delete r[e];
                }
            }
            t.unregisterGlobal = unregisterGlobal;
        },
        565: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.isCompatible = t._makeCompatibilityCheck = void 0;
            const n = r(520);
            const a = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
            function _makeCompatibilityCheck(e) {
                const t = new Set([
                    e
                ]);
                const r = new Set;
                const n = e.match(a);
                if (!n) {
                    return ()=>false;
                }
                const o = {
                    major: +n[1],
                    minor: +n[2],
                    patch: +n[3],
                    prerelease: n[4]
                };
                if (o.prerelease != null) {
                    return function isExactmatch(t) {
                        return t === e;
                    };
                }
                function _reject(e) {
                    r.add(e);
                    return false;
                }
                function _accept(e) {
                    t.add(e);
                    return true;
                }
                return function isCompatible(e) {
                    if (t.has(e)) {
                        return true;
                    }
                    if (r.has(e)) {
                        return false;
                    }
                    const n = e.match(a);
                    if (!n) {
                        return _reject(e);
                    }
                    const i = {
                        major: +n[1],
                        minor: +n[2],
                        patch: +n[3],
                        prerelease: n[4]
                    };
                    if (i.prerelease != null) {
                        return _reject(e);
                    }
                    if (o.major !== i.major) {
                        return _reject(e);
                    }
                    if (o.major === 0) {
                        if (o.minor === i.minor && o.patch <= i.patch) {
                            return _accept(e);
                        }
                        return _reject(e);
                    }
                    if (o.minor <= i.minor) {
                        return _accept(e);
                    }
                    return _reject(e);
                };
            }
            t._makeCompatibilityCheck = _makeCompatibilityCheck;
            t.isCompatible = _makeCompatibilityCheck(n.VERSION);
        },
        934: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.metrics = void 0;
            const n = r(128);
            t.metrics = n.MetricsAPI.getInstance();
        },
        28: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.ValueType = void 0;
            var r;
            (function(e) {
                e[e["INT"] = 0] = "INT";
                e[e["DOUBLE"] = 1] = "DOUBLE";
            })(r = t.ValueType || (t.ValueType = {}));
        },
        962: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.createNoopMeter = t.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = t.NOOP_OBSERVABLE_GAUGE_METRIC = t.NOOP_OBSERVABLE_COUNTER_METRIC = t.NOOP_UP_DOWN_COUNTER_METRIC = t.NOOP_HISTOGRAM_METRIC = t.NOOP_COUNTER_METRIC = t.NOOP_METER = t.NoopObservableUpDownCounterMetric = t.NoopObservableGaugeMetric = t.NoopObservableCounterMetric = t.NoopObservableMetric = t.NoopHistogramMetric = t.NoopUpDownCounterMetric = t.NoopCounterMetric = t.NoopMetric = t.NoopMeter = void 0;
            class NoopMeter {
                constructor(){}
                createHistogram(e, r) {
                    return t.NOOP_HISTOGRAM_METRIC;
                }
                createCounter(e, r) {
                    return t.NOOP_COUNTER_METRIC;
                }
                createUpDownCounter(e, r) {
                    return t.NOOP_UP_DOWN_COUNTER_METRIC;
                }
                createObservableGauge(e, r) {
                    return t.NOOP_OBSERVABLE_GAUGE_METRIC;
                }
                createObservableCounter(e, r) {
                    return t.NOOP_OBSERVABLE_COUNTER_METRIC;
                }
                createObservableUpDownCounter(e, r) {
                    return t.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
                }
                addBatchObservableCallback(e, t) {}
                removeBatchObservableCallback(e) {}
            }
            t.NoopMeter = NoopMeter;
            class NoopMetric {
            }
            t.NoopMetric = NoopMetric;
            class NoopCounterMetric extends NoopMetric {
                add(e, t) {}
            }
            t.NoopCounterMetric = NoopCounterMetric;
            class NoopUpDownCounterMetric extends NoopMetric {
                add(e, t) {}
            }
            t.NoopUpDownCounterMetric = NoopUpDownCounterMetric;
            class NoopHistogramMetric extends NoopMetric {
                record(e, t) {}
            }
            t.NoopHistogramMetric = NoopHistogramMetric;
            class NoopObservableMetric {
                addCallback(e) {}
                removeCallback(e) {}
            }
            t.NoopObservableMetric = NoopObservableMetric;
            class NoopObservableCounterMetric extends NoopObservableMetric {
            }
            t.NoopObservableCounterMetric = NoopObservableCounterMetric;
            class NoopObservableGaugeMetric extends NoopObservableMetric {
            }
            t.NoopObservableGaugeMetric = NoopObservableGaugeMetric;
            class NoopObservableUpDownCounterMetric extends NoopObservableMetric {
            }
            t.NoopObservableUpDownCounterMetric = NoopObservableUpDownCounterMetric;
            t.NOOP_METER = new NoopMeter;
            t.NOOP_COUNTER_METRIC = new NoopCounterMetric;
            t.NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric;
            t.NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric;
            t.NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric;
            t.NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric;
            t.NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric;
            function createNoopMeter() {
                return t.NOOP_METER;
            }
            t.createNoopMeter = createNoopMeter;
        },
        333: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NOOP_METER_PROVIDER = t.NoopMeterProvider = void 0;
            const n = r(962);
            class NoopMeterProvider {
                getMeter(e, t, r) {
                    return n.NOOP_METER;
                }
            }
            t.NoopMeterProvider = NoopMeterProvider;
            t.NOOP_METER_PROVIDER = new NoopMeterProvider;
        },
        966: function(e, t, r) {
            var n = this && this.__createBinding || (Object.create ? function(e, t, r, n) {
                if (n === undefined) n = r;
                Object.defineProperty(e, n, {
                    enumerable: true,
                    get: function() {
                        return t[r];
                    }
                });
            } : function(e, t, r, n) {
                if (n === undefined) n = r;
                e[n] = t[r];
            });
            var a = this && this.__exportStar || function(e, t) {
                for(var r in e)if (r !== "default" && !Object.prototype.hasOwnProperty.call(t, r)) n(t, e, r);
            };
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            a(r(652), t);
        },
        385: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t._globalThis = void 0;
            t._globalThis = typeof globalThis === "object" ? globalThis : global;
        },
        652: function(e, t, r) {
            var n = this && this.__createBinding || (Object.create ? function(e, t, r, n) {
                if (n === undefined) n = r;
                Object.defineProperty(e, n, {
                    enumerable: true,
                    get: function() {
                        return t[r];
                    }
                });
            } : function(e, t, r, n) {
                if (n === undefined) n = r;
                e[n] = t[r];
            });
            var a = this && this.__exportStar || function(e, t) {
                for(var r in e)if (r !== "default" && !Object.prototype.hasOwnProperty.call(t, r)) n(t, e, r);
            };
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            a(r(385), t);
        },
        251: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.propagation = void 0;
            const n = r(930);
            t.propagation = n.PropagationAPI.getInstance();
        },
        600: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NoopTextMapPropagator = void 0;
            class NoopTextMapPropagator {
                inject(e, t) {}
                extract(e, t) {
                    return e;
                }
                fields() {
                    return [];
                }
            }
            t.NoopTextMapPropagator = NoopTextMapPropagator;
        },
        625: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.defaultTextMapSetter = t.defaultTextMapGetter = void 0;
            t.defaultTextMapGetter = {
                get (e, t) {
                    if (e == null) {
                        return undefined;
                    }
                    return e[t];
                },
                keys (e) {
                    if (e == null) {
                        return [];
                    }
                    return Object.keys(e);
                }
            };
            t.defaultTextMapSetter = {
                set (e, t, r) {
                    if (e == null) {
                        return;
                    }
                    e[t] = r;
                }
            };
        },
        978: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.trace = void 0;
            const n = r(967);
            t.trace = n.TraceAPI.getInstance();
        },
        76: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NonRecordingSpan = void 0;
            const n = r(304);
            class NonRecordingSpan {
                constructor(e = n.INVALID_SPAN_CONTEXT){
                    this._spanContext = e;
                }
                spanContext() {
                    return this._spanContext;
                }
                setAttribute(e, t) {
                    return this;
                }
                setAttributes(e) {
                    return this;
                }
                addEvent(e, t) {
                    return this;
                }
                setStatus(e) {
                    return this;
                }
                updateName(e) {
                    return this;
                }
                end(e) {}
                isRecording() {
                    return false;
                }
                recordException(e, t) {}
            }
            t.NonRecordingSpan = NonRecordingSpan;
        },
        527: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NoopTracer = void 0;
            const n = r(339);
            const a = r(542);
            const o = r(76);
            const i = r(994);
            const c = n.ContextAPI.getInstance();
            class NoopTracer {
                startSpan(e, t, r = c.active()) {
                    const n = Boolean(t === null || t === void 0 ? void 0 : t.root);
                    if (n) {
                        return new o.NonRecordingSpan;
                    }
                    const s = r && (0, a.getSpanContext)(r);
                    if (isSpanContext(s) && (0, i.isSpanContextValid)(s)) {
                        return new o.NonRecordingSpan(s);
                    } else {
                        return new o.NonRecordingSpan;
                    }
                }
                startActiveSpan(e, t, r, n) {
                    let o;
                    let i;
                    let s;
                    if (arguments.length < 2) {
                        return;
                    } else if (arguments.length === 2) {
                        s = t;
                    } else if (arguments.length === 3) {
                        o = t;
                        s = r;
                    } else {
                        o = t;
                        i = r;
                        s = n;
                    }
                    const u = i !== null && i !== void 0 ? i : c.active();
                    const l = this.startSpan(e, o, u);
                    const g = (0, a.setSpan)(u, l);
                    return c.with(g, s, undefined, l);
                }
            }
            t.NoopTracer = NoopTracer;
            function isSpanContext(e) {
                return typeof e === "object" && typeof e["spanId"] === "string" && typeof e["traceId"] === "string" && typeof e["traceFlags"] === "number";
            }
        },
        228: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.NoopTracerProvider = void 0;
            const n = r(527);
            class NoopTracerProvider {
                getTracer(e, t, r) {
                    return new n.NoopTracer;
                }
            }
            t.NoopTracerProvider = NoopTracerProvider;
        },
        387: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.ProxyTracer = void 0;
            const n = r(527);
            const a = new n.NoopTracer;
            class ProxyTracer {
                constructor(e, t, r, n){
                    this._provider = e;
                    this.name = t;
                    this.version = r;
                    this.options = n;
                }
                startSpan(e, t, r) {
                    return this._getTracer().startSpan(e, t, r);
                }
                startActiveSpan(e, t, r, n) {
                    const a = this._getTracer();
                    return Reflect.apply(a.startActiveSpan, a, arguments);
                }
                _getTracer() {
                    if (this._delegate) {
                        return this._delegate;
                    }
                    const e = this._provider.getDelegateTracer(this.name, this.version, this.options);
                    if (!e) {
                        return a;
                    }
                    this._delegate = e;
                    return this._delegate;
                }
            }
            t.ProxyTracer = ProxyTracer;
        },
        414: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.ProxyTracerProvider = void 0;
            const n = r(387);
            const a = r(228);
            const o = new a.NoopTracerProvider;
            class ProxyTracerProvider {
                getTracer(e, t, r) {
                    var a;
                    return (a = this.getDelegateTracer(e, t, r)) !== null && a !== void 0 ? a : new n.ProxyTracer(this, e, t, r);
                }
                getDelegate() {
                    var e;
                    return (e = this._delegate) !== null && e !== void 0 ? e : o;
                }
                setDelegate(e) {
                    this._delegate = e;
                }
                getDelegateTracer(e, t, r) {
                    var n;
                    return (n = this._delegate) === null || n === void 0 ? void 0 : n.getTracer(e, t, r);
                }
            }
            t.ProxyTracerProvider = ProxyTracerProvider;
        },
        505: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.SamplingDecision = void 0;
            var r;
            (function(e) {
                e[e["NOT_RECORD"] = 0] = "NOT_RECORD";
                e[e["RECORD"] = 1] = "RECORD";
                e[e["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
            })(r = t.SamplingDecision || (t.SamplingDecision = {}));
        },
        542: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.getSpanContext = t.setSpanContext = t.deleteSpan = t.setSpan = t.getActiveSpan = t.getSpan = void 0;
            const n = r(421);
            const a = r(76);
            const o = r(339);
            const i = (0, n.createContextKey)("OpenTelemetry Context Key SPAN");
            function getSpan(e) {
                return e.getValue(i) || undefined;
            }
            t.getSpan = getSpan;
            function getActiveSpan() {
                return getSpan(o.ContextAPI.getInstance().active());
            }
            t.getActiveSpan = getActiveSpan;
            function setSpan(e, t) {
                return e.setValue(i, t);
            }
            t.setSpan = setSpan;
            function deleteSpan(e) {
                return e.deleteValue(i);
            }
            t.deleteSpan = deleteSpan;
            function setSpanContext(e, t) {
                return setSpan(e, new a.NonRecordingSpan(t));
            }
            t.setSpanContext = setSpanContext;
            function getSpanContext(e) {
                var t;
                return (t = getSpan(e)) === null || t === void 0 ? void 0 : t.spanContext();
            }
            t.getSpanContext = getSpanContext;
        },
        430: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.TraceStateImpl = void 0;
            const n = r(450);
            const a = 32;
            const o = 512;
            const i = ",";
            const c = "=";
            class TraceStateImpl {
                constructor(e){
                    this._internalState = new Map;
                    if (e) this._parse(e);
                }
                set(e, t) {
                    const r = this._clone();
                    if (r._internalState.has(e)) {
                        r._internalState.delete(e);
                    }
                    r._internalState.set(e, t);
                    return r;
                }
                unset(e) {
                    const t = this._clone();
                    t._internalState.delete(e);
                    return t;
                }
                get(e) {
                    return this._internalState.get(e);
                }
                serialize() {
                    return this._keys().reduce((e, t)=>{
                        e.push(t + c + this.get(t));
                        return e;
                    }, []).join(i);
                }
                _parse(e) {
                    if (e.length > o) return;
                    this._internalState = e.split(i).reverse().reduce((e, t)=>{
                        const r = t.trim();
                        const a = r.indexOf(c);
                        if (a !== -1) {
                            const o = r.slice(0, a);
                            const i = r.slice(a + 1, t.length);
                            if ((0, n.validateKey)(o) && (0, n.validateValue)(i)) {
                                e.set(o, i);
                            } else {}
                        }
                        return e;
                    }, new Map);
                    if (this._internalState.size > a) {
                        this._internalState = new Map(Array.from(this._internalState.entries()).reverse().slice(0, a));
                    }
                }
                _keys() {
                    return Array.from(this._internalState.keys()).reverse();
                }
                _clone() {
                    const e = new TraceStateImpl;
                    e._internalState = new Map(this._internalState);
                    return e;
                }
            }
            t.TraceStateImpl = TraceStateImpl;
        },
        450: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.validateValue = t.validateKey = void 0;
            const r = "[_0-9a-z-*/]";
            const n = `[a-z]${r}{0,255}`;
            const a = `[a-z0-9]${r}{0,240}@[a-z]${r}{0,13}`;
            const o = new RegExp(`^(?:${n}|${a})$`);
            const i = /^[ -~]{0,255}[!-~]$/;
            const c = /,|=/;
            function validateKey(e) {
                return o.test(e);
            }
            t.validateKey = validateKey;
            function validateValue(e) {
                return i.test(e) && !c.test(e);
            }
            t.validateValue = validateValue;
        },
        757: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.createTraceState = void 0;
            const n = r(430);
            function createTraceState(e) {
                return new n.TraceStateImpl(e);
            }
            t.createTraceState = createTraceState;
        },
        304: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.INVALID_SPAN_CONTEXT = t.INVALID_TRACEID = t.INVALID_SPANID = void 0;
            const n = r(762);
            t.INVALID_SPANID = "0000000000000000";
            t.INVALID_TRACEID = "00000000000000000000000000000000";
            t.INVALID_SPAN_CONTEXT = {
                traceId: t.INVALID_TRACEID,
                spanId: t.INVALID_SPANID,
                traceFlags: n.TraceFlags.NONE
            };
        },
        902: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.SpanKind = void 0;
            var r;
            (function(e) {
                e[e["INTERNAL"] = 0] = "INTERNAL";
                e[e["SERVER"] = 1] = "SERVER";
                e[e["CLIENT"] = 2] = "CLIENT";
                e[e["PRODUCER"] = 3] = "PRODUCER";
                e[e["CONSUMER"] = 4] = "CONSUMER";
            })(r = t.SpanKind || (t.SpanKind = {}));
        },
        994: (e, t, r)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.wrapSpanContext = t.isSpanContextValid = t.isValidSpanId = t.isValidTraceId = void 0;
            const n = r(304);
            const a = r(76);
            const o = /^([0-9a-f]{32})$/i;
            const i = /^[0-9a-f]{16}$/i;
            function isValidTraceId(e) {
                return o.test(e) && e !== n.INVALID_TRACEID;
            }
            t.isValidTraceId = isValidTraceId;
            function isValidSpanId(e) {
                return i.test(e) && e !== n.INVALID_SPANID;
            }
            t.isValidSpanId = isValidSpanId;
            function isSpanContextValid(e) {
                return isValidTraceId(e.traceId) && isValidSpanId(e.spanId);
            }
            t.isSpanContextValid = isSpanContextValid;
            function wrapSpanContext(e) {
                return new a.NonRecordingSpan(e);
            }
            t.wrapSpanContext = wrapSpanContext;
        },
        832: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.SpanStatusCode = void 0;
            var r;
            (function(e) {
                e[e["UNSET"] = 0] = "UNSET";
                e[e["OK"] = 1] = "OK";
                e[e["ERROR"] = 2] = "ERROR";
            })(r = t.SpanStatusCode || (t.SpanStatusCode = {}));
        },
        762: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.TraceFlags = void 0;
            var r;
            (function(e) {
                e[e["NONE"] = 0] = "NONE";
                e[e["SAMPLED"] = 1] = "SAMPLED";
            })(r = t.TraceFlags || (t.TraceFlags = {}));
        },
        520: (e, t)=>{
            Object.defineProperty(t, "__esModule", {
                value: true
            });
            t.VERSION = void 0;
            t.VERSION = "1.4.1";
        }
    };
    var t = {};
    function __nccwpck_require__(r) {
        var n = t[r];
        if (n !== undefined) {
            return n.exports;
        }
        var a = t[r] = {
            exports: {}
        };
        var o = true;
        try {
            e[r].call(a.exports, a, a.exports, __nccwpck_require__);
            o = false;
        } finally{
            if (o) delete t[r];
        }
        return a.exports;
    }
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
    var r = {};
    (()=>{
        var e = r;
        Object.defineProperty(e, "__esModule", {
            value: true
        });
        e.trace = e.propagation = e.metrics = e.diag = e.context = e.INVALID_SPAN_CONTEXT = e.INVALID_TRACEID = e.INVALID_SPANID = e.isValidSpanId = e.isValidTraceId = e.isSpanContextValid = e.createTraceState = e.TraceFlags = e.SpanStatusCode = e.SpanKind = e.SamplingDecision = e.ProxyTracerProvider = e.ProxyTracer = e.defaultTextMapSetter = e.defaultTextMapGetter = e.ValueType = e.createNoopMeter = e.DiagLogLevel = e.DiagConsoleLogger = e.ROOT_CONTEXT = e.createContextKey = e.baggageEntryMetadataFromString = void 0;
        var t = __nccwpck_require__(701);
        Object.defineProperty(e, "baggageEntryMetadataFromString", {
            enumerable: true,
            get: function() {
                return t.baggageEntryMetadataFromString;
            }
        });
        var n = __nccwpck_require__(421);
        Object.defineProperty(e, "createContextKey", {
            enumerable: true,
            get: function() {
                return n.createContextKey;
            }
        });
        Object.defineProperty(e, "ROOT_CONTEXT", {
            enumerable: true,
            get: function() {
                return n.ROOT_CONTEXT;
            }
        });
        var a = __nccwpck_require__(689);
        Object.defineProperty(e, "DiagConsoleLogger", {
            enumerable: true,
            get: function() {
                return a.DiagConsoleLogger;
            }
        });
        var o = __nccwpck_require__(133);
        Object.defineProperty(e, "DiagLogLevel", {
            enumerable: true,
            get: function() {
                return o.DiagLogLevel;
            }
        });
        var i = __nccwpck_require__(962);
        Object.defineProperty(e, "createNoopMeter", {
            enumerable: true,
            get: function() {
                return i.createNoopMeter;
            }
        });
        var c = __nccwpck_require__(28);
        Object.defineProperty(e, "ValueType", {
            enumerable: true,
            get: function() {
                return c.ValueType;
            }
        });
        var s = __nccwpck_require__(625);
        Object.defineProperty(e, "defaultTextMapGetter", {
            enumerable: true,
            get: function() {
                return s.defaultTextMapGetter;
            }
        });
        Object.defineProperty(e, "defaultTextMapSetter", {
            enumerable: true,
            get: function() {
                return s.defaultTextMapSetter;
            }
        });
        var u = __nccwpck_require__(387);
        Object.defineProperty(e, "ProxyTracer", {
            enumerable: true,
            get: function() {
                return u.ProxyTracer;
            }
        });
        var l = __nccwpck_require__(414);
        Object.defineProperty(e, "ProxyTracerProvider", {
            enumerable: true,
            get: function() {
                return l.ProxyTracerProvider;
            }
        });
        var g = __nccwpck_require__(505);
        Object.defineProperty(e, "SamplingDecision", {
            enumerable: true,
            get: function() {
                return g.SamplingDecision;
            }
        });
        var p = __nccwpck_require__(902);
        Object.defineProperty(e, "SpanKind", {
            enumerable: true,
            get: function() {
                return p.SpanKind;
            }
        });
        var d = __nccwpck_require__(832);
        Object.defineProperty(e, "SpanStatusCode", {
            enumerable: true,
            get: function() {
                return d.SpanStatusCode;
            }
        });
        var _ = __nccwpck_require__(762);
        Object.defineProperty(e, "TraceFlags", {
            enumerable: true,
            get: function() {
                return _.TraceFlags;
            }
        });
        var f = __nccwpck_require__(757);
        Object.defineProperty(e, "createTraceState", {
            enumerable: true,
            get: function() {
                return f.createTraceState;
            }
        });
        var b = __nccwpck_require__(994);
        Object.defineProperty(e, "isSpanContextValid", {
            enumerable: true,
            get: function() {
                return b.isSpanContextValid;
            }
        });
        Object.defineProperty(e, "isValidTraceId", {
            enumerable: true,
            get: function() {
                return b.isValidTraceId;
            }
        });
        Object.defineProperty(e, "isValidSpanId", {
            enumerable: true,
            get: function() {
                return b.isValidSpanId;
            }
        });
        var v = __nccwpck_require__(304);
        Object.defineProperty(e, "INVALID_SPANID", {
            enumerable: true,
            get: function() {
                return v.INVALID_SPANID;
            }
        });
        Object.defineProperty(e, "INVALID_TRACEID", {
            enumerable: true,
            get: function() {
                return v.INVALID_TRACEID;
            }
        });
        Object.defineProperty(e, "INVALID_SPAN_CONTEXT", {
            enumerable: true,
            get: function() {
                return v.INVALID_SPAN_CONTEXT;
            }
        });
        const O = __nccwpck_require__(388);
        Object.defineProperty(e, "context", {
            enumerable: true,
            get: function() {
                return O.context;
            }
        });
        const P = __nccwpck_require__(920);
        Object.defineProperty(e, "diag", {
            enumerable: true,
            get: function() {
                return P.diag;
            }
        });
        const N = __nccwpck_require__(934);
        Object.defineProperty(e, "metrics", {
            enumerable: true,
            get: function() {
                return N.metrics;
            }
        });
        const S = __nccwpck_require__(251);
        Object.defineProperty(e, "propagation", {
            enumerable: true,
            get: function() {
                return S.propagation;
            }
        });
        const C = __nccwpck_require__(978);
        Object.defineProperty(e, "trace", {
            enumerable: true,
            get: function() {
                return C.trace;
            }
        });
        e["default"] = {
            context: O.context,
            diag: P.diag,
            metrics: N.metrics,
            propagation: S.propagation,
            trace: C.trace
        };
    })();
    module.exports = r;
})();


/***/ }),

/***/ 2312:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

(()=>{
    var r = {
        535: (r, e, n)=>{
            "use strict";
            r = n.nmd(r);
            const t = n(54);
            const wrapAnsi16 = (r, e)=>function() {
                    const n = r.apply(t, arguments);
                    return `[${n + e}m`;
                };
            const wrapAnsi256 = (r, e)=>function() {
                    const n = r.apply(t, arguments);
                    return `[${38 + e};5;${n}m`;
                };
            const wrapAnsi16m = (r, e)=>function() {
                    const n = r.apply(t, arguments);
                    return `[${38 + e};2;${n[0]};${n[1]};${n[2]}m`;
                };
            function assembleStyles() {
                const r = new Map;
                const e = {
                    modifier: {
                        reset: [
                            0,
                            0
                        ],
                        bold: [
                            1,
                            22
                        ],
                        dim: [
                            2,
                            22
                        ],
                        italic: [
                            3,
                            23
                        ],
                        underline: [
                            4,
                            24
                        ],
                        inverse: [
                            7,
                            27
                        ],
                        hidden: [
                            8,
                            28
                        ],
                        strikethrough: [
                            9,
                            29
                        ]
                    },
                    color: {
                        black: [
                            30,
                            39
                        ],
                        red: [
                            31,
                            39
                        ],
                        green: [
                            32,
                            39
                        ],
                        yellow: [
                            33,
                            39
                        ],
                        blue: [
                            34,
                            39
                        ],
                        magenta: [
                            35,
                            39
                        ],
                        cyan: [
                            36,
                            39
                        ],
                        white: [
                            37,
                            39
                        ],
                        gray: [
                            90,
                            39
                        ],
                        redBright: [
                            91,
                            39
                        ],
                        greenBright: [
                            92,
                            39
                        ],
                        yellowBright: [
                            93,
                            39
                        ],
                        blueBright: [
                            94,
                            39
                        ],
                        magentaBright: [
                            95,
                            39
                        ],
                        cyanBright: [
                            96,
                            39
                        ],
                        whiteBright: [
                            97,
                            39
                        ]
                    },
                    bgColor: {
                        bgBlack: [
                            40,
                            49
                        ],
                        bgRed: [
                            41,
                            49
                        ],
                        bgGreen: [
                            42,
                            49
                        ],
                        bgYellow: [
                            43,
                            49
                        ],
                        bgBlue: [
                            44,
                            49
                        ],
                        bgMagenta: [
                            45,
                            49
                        ],
                        bgCyan: [
                            46,
                            49
                        ],
                        bgWhite: [
                            47,
                            49
                        ],
                        bgBlackBright: [
                            100,
                            49
                        ],
                        bgRedBright: [
                            101,
                            49
                        ],
                        bgGreenBright: [
                            102,
                            49
                        ],
                        bgYellowBright: [
                            103,
                            49
                        ],
                        bgBlueBright: [
                            104,
                            49
                        ],
                        bgMagentaBright: [
                            105,
                            49
                        ],
                        bgCyanBright: [
                            106,
                            49
                        ],
                        bgWhiteBright: [
                            107,
                            49
                        ]
                    }
                };
                e.color.grey = e.color.gray;
                for (const n of Object.keys(e)){
                    const t = e[n];
                    for (const n of Object.keys(t)){
                        const a = t[n];
                        e[n] = {
                            open: `[${a[0]}m`,
                            close: `[${a[1]}m`
                        };
                        t[n] = e[n];
                        r.set(a[0], a[1]);
                    }
                    Object.defineProperty(e, n, {
                        value: t,
                        enumerable: false
                    });
                    Object.defineProperty(e, "codes", {
                        value: r,
                        enumerable: false
                    });
                }
                const ansi2ansi = (r)=>r;
                const rgb2rgb = (r, e, n)=>[
                        r,
                        e,
                        n
                    ];
                e.color.close = "\x1b[39m";
                e.bgColor.close = "\x1b[49m";
                e.color.ansi = {
                    ansi: wrapAnsi16(ansi2ansi, 0)
                };
                e.color.ansi256 = {
                    ansi256: wrapAnsi256(ansi2ansi, 0)
                };
                e.color.ansi16m = {
                    rgb: wrapAnsi16m(rgb2rgb, 0)
                };
                e.bgColor.ansi = {
                    ansi: wrapAnsi16(ansi2ansi, 10)
                };
                e.bgColor.ansi256 = {
                    ansi256: wrapAnsi256(ansi2ansi, 10)
                };
                e.bgColor.ansi16m = {
                    rgb: wrapAnsi16m(rgb2rgb, 10)
                };
                for (let r of Object.keys(t)){
                    if (typeof t[r] !== "object") {
                        continue;
                    }
                    const n = t[r];
                    if (r === "ansi16") {
                        r = "ansi";
                    }
                    if ("ansi16" in n) {
                        e.color.ansi[r] = wrapAnsi16(n.ansi16, 0);
                        e.bgColor.ansi[r] = wrapAnsi16(n.ansi16, 10);
                    }
                    if ("ansi256" in n) {
                        e.color.ansi256[r] = wrapAnsi256(n.ansi256, 0);
                        e.bgColor.ansi256[r] = wrapAnsi256(n.ansi256, 10);
                    }
                    if ("rgb" in n) {
                        e.color.ansi16m[r] = wrapAnsi16m(n.rgb, 0);
                        e.bgColor.ansi16m[r] = wrapAnsi16m(n.rgb, 10);
                    }
                }
                return e;
            }
            Object.defineProperty(r, "exports", {
                enumerable: true,
                get: assembleStyles
            });
        },
        148: (r, e, n)=>{
            "use strict";
            const t = n(379);
            const a = n(535);
            const o = n(220).stdout;
            const s = n(299);
            const l = process.platform === "win32" && !(process.env.TERM || "").toLowerCase().startsWith("xterm");
            const i = [
                "ansi",
                "ansi",
                "ansi256",
                "ansi16m"
            ];
            const c = new Set([
                "gray"
            ]);
            const u = Object.create(null);
            function applyOptions(r, e) {
                e = e || {};
                const n = o ? o.level : 0;
                r.level = e.level === undefined ? n : e.level;
                r.enabled = "enabled" in e ? e.enabled : r.level > 0;
            }
            function Chalk(r) {
                if (!this || !(this instanceof Chalk) || this.template) {
                    const e = {};
                    applyOptions(e, r);
                    e.template = function() {
                        const r = [].slice.call(arguments);
                        return chalkTag.apply(null, [
                            e.template
                        ].concat(r));
                    };
                    Object.setPrototypeOf(e, Chalk.prototype);
                    Object.setPrototypeOf(e.template, e);
                    e.template.constructor = Chalk;
                    return e.template;
                }
                applyOptions(this, r);
            }
            if (l) {
                a.blue.open = "\x1b[94m";
            }
            for (const r of Object.keys(a)){
                a[r].closeRe = new RegExp(t(a[r].close), "g");
                u[r] = {
                    get () {
                        const e = a[r];
                        return build.call(this, this._styles ? this._styles.concat(e) : [
                            e
                        ], this._empty, r);
                    }
                };
            }
            u.visible = {
                get () {
                    return build.call(this, this._styles || [], true, "visible");
                }
            };
            a.color.closeRe = new RegExp(t(a.color.close), "g");
            for (const r of Object.keys(a.color.ansi)){
                if (c.has(r)) {
                    continue;
                }
                u[r] = {
                    get () {
                        const e = this.level;
                        return function() {
                            const n = a.color[i[e]][r].apply(null, arguments);
                            const t = {
                                open: n,
                                close: a.color.close,
                                closeRe: a.color.closeRe
                            };
                            return build.call(this, this._styles ? this._styles.concat(t) : [
                                t
                            ], this._empty, r);
                        };
                    }
                };
            }
            a.bgColor.closeRe = new RegExp(t(a.bgColor.close), "g");
            for (const r of Object.keys(a.bgColor.ansi)){
                if (c.has(r)) {
                    continue;
                }
                const e = "bg" + r[0].toUpperCase() + r.slice(1);
                u[e] = {
                    get () {
                        const e = this.level;
                        return function() {
                            const n = a.bgColor[i[e]][r].apply(null, arguments);
                            const t = {
                                open: n,
                                close: a.bgColor.close,
                                closeRe: a.bgColor.closeRe
                            };
                            return build.call(this, this._styles ? this._styles.concat(t) : [
                                t
                            ], this._empty, r);
                        };
                    }
                };
            }
            const v = Object.defineProperties(()=>{}, u);
            function build(r, e, n) {
                const builder = function() {
                    return applyStyle.apply(builder, arguments);
                };
                builder._styles = r;
                builder._empty = e;
                const t = this;
                Object.defineProperty(builder, "level", {
                    enumerable: true,
                    get () {
                        return t.level;
                    },
                    set (r) {
                        t.level = r;
                    }
                });
                Object.defineProperty(builder, "enabled", {
                    enumerable: true,
                    get () {
                        return t.enabled;
                    },
                    set (r) {
                        t.enabled = r;
                    }
                });
                builder.hasGrey = this.hasGrey || n === "gray" || n === "grey";
                builder.__proto__ = v;
                return builder;
            }
            function applyStyle() {
                const r = arguments;
                const e = r.length;
                let n = String(arguments[0]);
                if (e === 0) {
                    return "";
                }
                if (e > 1) {
                    for(let t = 1; t < e; t++){
                        n += " " + r[t];
                    }
                }
                if (!this.enabled || this.level <= 0 || !n) {
                    return this._empty ? "" : n;
                }
                const t = a.dim.open;
                if (l && this.hasGrey) {
                    a.dim.open = "";
                }
                for (const r of this._styles.slice().reverse()){
                    n = r.open + n.replace(r.closeRe, r.open) + r.close;
                    n = n.replace(/\r?\n/g, `${r.close}$&${r.open}`);
                }
                a.dim.open = t;
                return n;
            }
            function chalkTag(r, e) {
                if (!Array.isArray(e)) {
                    return [].slice.call(arguments, 1).join(" ");
                }
                const n = [].slice.call(arguments, 2);
                const t = [
                    e.raw[0]
                ];
                for(let r = 1; r < e.length; r++){
                    t.push(String(n[r - 1]).replace(/[{}\\]/g, "\\$&"));
                    t.push(String(e.raw[r]));
                }
                return s(r, t.join(""));
            }
            Object.defineProperties(Chalk.prototype, u);
            r.exports = Chalk();
            r.exports.supportsColor = o;
            r.exports["default"] = r.exports;
        },
        299: (r)=>{
            "use strict";
            const e = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
            const n = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
            const t = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
            const a = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;
            const o = new Map([
                [
                    "n",
                    "\n"
                ],
                [
                    "r",
                    "\r"
                ],
                [
                    "t",
                    "	"
                ],
                [
                    "b",
                    "\b"
                ],
                [
                    "f",
                    "\f"
                ],
                [
                    "v",
                    "\v"
                ],
                [
                    "0",
                    "\x00"
                ],
                [
                    "\\",
                    "\\"
                ],
                [
                    "e",
                    "\x1b"
                ],
                [
                    "a",
                    "\x07"
                ]
            ]);
            function unescape(r) {
                if (r[0] === "u" && r.length === 5 || r[0] === "x" && r.length === 3) {
                    return String.fromCharCode(parseInt(r.slice(1), 16));
                }
                return o.get(r) || r;
            }
            function parseArguments(r, e) {
                const n = [];
                const o = e.trim().split(/\s*,\s*/g);
                let s;
                for (const e of o){
                    if (!isNaN(e)) {
                        n.push(Number(e));
                    } else if (s = e.match(t)) {
                        n.push(s[2].replace(a, (r, e, n)=>e ? unescape(e) : n));
                    } else {
                        throw new Error(`Invalid Chalk template style argument: ${e} (in style '${r}')`);
                    }
                }
                return n;
            }
            function parseStyle(r) {
                n.lastIndex = 0;
                const e = [];
                let t;
                while((t = n.exec(r)) !== null){
                    const r = t[1];
                    if (t[2]) {
                        const n = parseArguments(r, t[2]);
                        e.push([
                            r
                        ].concat(n));
                    } else {
                        e.push([
                            r
                        ]);
                    }
                }
                return e;
            }
            function buildStyle(r, e) {
                const n = {};
                for (const r of e){
                    for (const e of r.styles){
                        n[e[0]] = r.inverse ? null : e.slice(1);
                    }
                }
                let t = r;
                for (const r of Object.keys(n)){
                    if (Array.isArray(n[r])) {
                        if (!(r in t)) {
                            throw new Error(`Unknown Chalk style: ${r}`);
                        }
                        if (n[r].length > 0) {
                            t = t[r].apply(t, n[r]);
                        } else {
                            t = t[r];
                        }
                    }
                }
                return t;
            }
            r.exports = (r, n)=>{
                const t = [];
                const a = [];
                let o = [];
                n.replace(e, (e, n, s, l, i, c)=>{
                    if (n) {
                        o.push(unescape(n));
                    } else if (l) {
                        const e = o.join("");
                        o = [];
                        a.push(t.length === 0 ? e : buildStyle(r, t)(e));
                        t.push({
                            inverse: s,
                            styles: parseStyle(l)
                        });
                    } else if (i) {
                        if (t.length === 0) {
                            throw new Error("Found extraneous } in Chalk template literal");
                        }
                        a.push(buildStyle(r, t)(o.join("")));
                        o = [];
                        t.pop();
                    } else {
                        o.push(c);
                    }
                });
                a.push(o.join(""));
                if (t.length > 0) {
                    const r = `Chalk template literal is missing ${t.length} closing bracket${t.length === 1 ? "" : "s"} (\`}\`)`;
                    throw new Error(r);
                }
                return a.join("");
            };
        },
        117: (r, e, n)=>{
            var t = n(251);
            var a = {};
            for(var o in t){
                if (t.hasOwnProperty(o)) {
                    a[t[o]] = o;
                }
            }
            var s = r.exports = {
                rgb: {
                    channels: 3,
                    labels: "rgb"
                },
                hsl: {
                    channels: 3,
                    labels: "hsl"
                },
                hsv: {
                    channels: 3,
                    labels: "hsv"
                },
                hwb: {
                    channels: 3,
                    labels: "hwb"
                },
                cmyk: {
                    channels: 4,
                    labels: "cmyk"
                },
                xyz: {
                    channels: 3,
                    labels: "xyz"
                },
                lab: {
                    channels: 3,
                    labels: "lab"
                },
                lch: {
                    channels: 3,
                    labels: "lch"
                },
                hex: {
                    channels: 1,
                    labels: [
                        "hex"
                    ]
                },
                keyword: {
                    channels: 1,
                    labels: [
                        "keyword"
                    ]
                },
                ansi16: {
                    channels: 1,
                    labels: [
                        "ansi16"
                    ]
                },
                ansi256: {
                    channels: 1,
                    labels: [
                        "ansi256"
                    ]
                },
                hcg: {
                    channels: 3,
                    labels: [
                        "h",
                        "c",
                        "g"
                    ]
                },
                apple: {
                    channels: 3,
                    labels: [
                        "r16",
                        "g16",
                        "b16"
                    ]
                },
                gray: {
                    channels: 1,
                    labels: [
                        "gray"
                    ]
                }
            };
            for(var l in s){
                if (s.hasOwnProperty(l)) {
                    if (!("channels" in s[l])) {
                        throw new Error("missing channels property: " + l);
                    }
                    if (!("labels" in s[l])) {
                        throw new Error("missing channel labels property: " + l);
                    }
                    if (s[l].labels.length !== s[l].channels) {
                        throw new Error("channel and label counts mismatch: " + l);
                    }
                    var i = s[l].channels;
                    var c = s[l].labels;
                    delete s[l].channels;
                    delete s[l].labels;
                    Object.defineProperty(s[l], "channels", {
                        value: i
                    });
                    Object.defineProperty(s[l], "labels", {
                        value: c
                    });
                }
            }
            s.rgb.hsl = function(r) {
                var e = r[0] / 255;
                var n = r[1] / 255;
                var t = r[2] / 255;
                var a = Math.min(e, n, t);
                var o = Math.max(e, n, t);
                var s = o - a;
                var l;
                var i;
                var c;
                if (o === a) {
                    l = 0;
                } else if (e === o) {
                    l = (n - t) / s;
                } else if (n === o) {
                    l = 2 + (t - e) / s;
                } else if (t === o) {
                    l = 4 + (e - n) / s;
                }
                l = Math.min(l * 60, 360);
                if (l < 0) {
                    l += 360;
                }
                c = (a + o) / 2;
                if (o === a) {
                    i = 0;
                } else if (c <= .5) {
                    i = s / (o + a);
                } else {
                    i = s / (2 - o - a);
                }
                return [
                    l,
                    i * 100,
                    c * 100
                ];
            };
            s.rgb.hsv = function(r) {
                var e;
                var n;
                var t;
                var a;
                var o;
                var s = r[0] / 255;
                var l = r[1] / 255;
                var i = r[2] / 255;
                var c = Math.max(s, l, i);
                var u = c - Math.min(s, l, i);
                var diffc = function(r) {
                    return (c - r) / 6 / u + 1 / 2;
                };
                if (u === 0) {
                    a = o = 0;
                } else {
                    o = u / c;
                    e = diffc(s);
                    n = diffc(l);
                    t = diffc(i);
                    if (s === c) {
                        a = t - n;
                    } else if (l === c) {
                        a = 1 / 3 + e - t;
                    } else if (i === c) {
                        a = 2 / 3 + n - e;
                    }
                    if (a < 0) {
                        a += 1;
                    } else if (a > 1) {
                        a -= 1;
                    }
                }
                return [
                    a * 360,
                    o * 100,
                    c * 100
                ];
            };
            s.rgb.hwb = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a = s.rgb.hsl(r)[0];
                var o = 1 / 255 * Math.min(e, Math.min(n, t));
                t = 1 - 1 / 255 * Math.max(e, Math.max(n, t));
                return [
                    a,
                    o * 100,
                    t * 100
                ];
            };
            s.rgb.cmyk = function(r) {
                var e = r[0] / 255;
                var n = r[1] / 255;
                var t = r[2] / 255;
                var a;
                var o;
                var s;
                var l;
                l = Math.min(1 - e, 1 - n, 1 - t);
                a = (1 - e - l) / (1 - l) || 0;
                o = (1 - n - l) / (1 - l) || 0;
                s = (1 - t - l) / (1 - l) || 0;
                return [
                    a * 100,
                    o * 100,
                    s * 100,
                    l * 100
                ];
            };
            function comparativeDistance(r, e) {
                return Math.pow(r[0] - e[0], 2) + Math.pow(r[1] - e[1], 2) + Math.pow(r[2] - e[2], 2);
            }
            s.rgb.keyword = function(r) {
                var e = a[r];
                if (e) {
                    return e;
                }
                var n = Infinity;
                var o;
                for(var s in t){
                    if (t.hasOwnProperty(s)) {
                        var l = t[s];
                        var i = comparativeDistance(r, l);
                        if (i < n) {
                            n = i;
                            o = s;
                        }
                    }
                }
                return o;
            };
            s.keyword.rgb = function(r) {
                return t[r];
            };
            s.rgb.xyz = function(r) {
                var e = r[0] / 255;
                var n = r[1] / 255;
                var t = r[2] / 255;
                e = e > .04045 ? Math.pow((e + .055) / 1.055, 2.4) : e / 12.92;
                n = n > .04045 ? Math.pow((n + .055) / 1.055, 2.4) : n / 12.92;
                t = t > .04045 ? Math.pow((t + .055) / 1.055, 2.4) : t / 12.92;
                var a = e * .4124 + n * .3576 + t * .1805;
                var o = e * .2126 + n * .7152 + t * .0722;
                var s = e * .0193 + n * .1192 + t * .9505;
                return [
                    a * 100,
                    o * 100,
                    s * 100
                ];
            };
            s.rgb.lab = function(r) {
                var e = s.rgb.xyz(r);
                var n = e[0];
                var t = e[1];
                var a = e[2];
                var o;
                var l;
                var i;
                n /= 95.047;
                t /= 100;
                a /= 108.883;
                n = n > .008856 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116;
                t = t > .008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
                a = a > .008856 ? Math.pow(a, 1 / 3) : 7.787 * a + 16 / 116;
                o = 116 * t - 16;
                l = 500 * (n - t);
                i = 200 * (t - a);
                return [
                    o,
                    l,
                    i
                ];
            };
            s.hsl.rgb = function(r) {
                var e = r[0] / 360;
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a;
                var o;
                var s;
                var l;
                var i;
                if (n === 0) {
                    i = t * 255;
                    return [
                        i,
                        i,
                        i
                    ];
                }
                if (t < .5) {
                    o = t * (1 + n);
                } else {
                    o = t + n - t * n;
                }
                a = 2 * t - o;
                l = [
                    0,
                    0,
                    0
                ];
                for(var c = 0; c < 3; c++){
                    s = e + 1 / 3 * -(c - 1);
                    if (s < 0) {
                        s++;
                    }
                    if (s > 1) {
                        s--;
                    }
                    if (6 * s < 1) {
                        i = a + (o - a) * 6 * s;
                    } else if (2 * s < 1) {
                        i = o;
                    } else if (3 * s < 2) {
                        i = a + (o - a) * (2 / 3 - s) * 6;
                    } else {
                        i = a;
                    }
                    l[c] = i * 255;
                }
                return l;
            };
            s.hsl.hsv = function(r) {
                var e = r[0];
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a = n;
                var o = Math.max(t, .01);
                var s;
                var l;
                t *= 2;
                n *= t <= 1 ? t : 2 - t;
                a *= o <= 1 ? o : 2 - o;
                l = (t + n) / 2;
                s = t === 0 ? 2 * a / (o + a) : 2 * n / (t + n);
                return [
                    e,
                    s * 100,
                    l * 100
                ];
            };
            s.hsv.rgb = function(r) {
                var e = r[0] / 60;
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a = Math.floor(e) % 6;
                var o = e - Math.floor(e);
                var s = 255 * t * (1 - n);
                var l = 255 * t * (1 - n * o);
                var i = 255 * t * (1 - n * (1 - o));
                t *= 255;
                switch(a){
                    case 0:
                        return [
                            t,
                            i,
                            s
                        ];
                    case 1:
                        return [
                            l,
                            t,
                            s
                        ];
                    case 2:
                        return [
                            s,
                            t,
                            i
                        ];
                    case 3:
                        return [
                            s,
                            l,
                            t
                        ];
                    case 4:
                        return [
                            i,
                            s,
                            t
                        ];
                    case 5:
                        return [
                            t,
                            s,
                            l
                        ];
                }
            };
            s.hsv.hsl = function(r) {
                var e = r[0];
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a = Math.max(t, .01);
                var o;
                var s;
                var l;
                l = (2 - n) * t;
                o = (2 - n) * a;
                s = n * a;
                s /= o <= 1 ? o : 2 - o;
                s = s || 0;
                l /= 2;
                return [
                    e,
                    s * 100,
                    l * 100
                ];
            };
            s.hwb.rgb = function(r) {
                var e = r[0] / 360;
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a = n + t;
                var o;
                var s;
                var l;
                var i;
                if (a > 1) {
                    n /= a;
                    t /= a;
                }
                o = Math.floor(6 * e);
                s = 1 - t;
                l = 6 * e - o;
                if ((o & 1) !== 0) {
                    l = 1 - l;
                }
                i = n + l * (s - n);
                var c;
                var u;
                var v;
                switch(o){
                    default:
                    case 6:
                    case 0:
                        c = s;
                        u = i;
                        v = n;
                        break;
                    case 1:
                        c = i;
                        u = s;
                        v = n;
                        break;
                    case 2:
                        c = n;
                        u = s;
                        v = i;
                        break;
                    case 3:
                        c = n;
                        u = i;
                        v = s;
                        break;
                    case 4:
                        c = i;
                        u = n;
                        v = s;
                        break;
                    case 5:
                        c = s;
                        u = n;
                        v = i;
                        break;
                }
                return [
                    c * 255,
                    u * 255,
                    v * 255
                ];
            };
            s.cmyk.rgb = function(r) {
                var e = r[0] / 100;
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a = r[3] / 100;
                var o;
                var s;
                var l;
                o = 1 - Math.min(1, e * (1 - a) + a);
                s = 1 - Math.min(1, n * (1 - a) + a);
                l = 1 - Math.min(1, t * (1 - a) + a);
                return [
                    o * 255,
                    s * 255,
                    l * 255
                ];
            };
            s.xyz.rgb = function(r) {
                var e = r[0] / 100;
                var n = r[1] / 100;
                var t = r[2] / 100;
                var a;
                var o;
                var s;
                a = e * 3.2406 + n * -1.5372 + t * -.4986;
                o = e * -.9689 + n * 1.8758 + t * .0415;
                s = e * .0557 + n * -.204 + t * 1.057;
                a = a > .0031308 ? 1.055 * Math.pow(a, 1 / 2.4) - .055 : a * 12.92;
                o = o > .0031308 ? 1.055 * Math.pow(o, 1 / 2.4) - .055 : o * 12.92;
                s = s > .0031308 ? 1.055 * Math.pow(s, 1 / 2.4) - .055 : s * 12.92;
                a = Math.min(Math.max(0, a), 1);
                o = Math.min(Math.max(0, o), 1);
                s = Math.min(Math.max(0, s), 1);
                return [
                    a * 255,
                    o * 255,
                    s * 255
                ];
            };
            s.xyz.lab = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a;
                var o;
                var s;
                e /= 95.047;
                n /= 100;
                t /= 108.883;
                e = e > .008856 ? Math.pow(e, 1 / 3) : 7.787 * e + 16 / 116;
                n = n > .008856 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116;
                t = t > .008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
                a = 116 * n - 16;
                o = 500 * (e - n);
                s = 200 * (n - t);
                return [
                    a,
                    o,
                    s
                ];
            };
            s.lab.xyz = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a;
                var o;
                var s;
                o = (e + 16) / 116;
                a = n / 500 + o;
                s = o - t / 200;
                var l = Math.pow(o, 3);
                var i = Math.pow(a, 3);
                var c = Math.pow(s, 3);
                o = l > .008856 ? l : (o - 16 / 116) / 7.787;
                a = i > .008856 ? i : (a - 16 / 116) / 7.787;
                s = c > .008856 ? c : (s - 16 / 116) / 7.787;
                a *= 95.047;
                o *= 100;
                s *= 108.883;
                return [
                    a,
                    o,
                    s
                ];
            };
            s.lab.lch = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a;
                var o;
                var s;
                a = Math.atan2(t, n);
                o = a * 360 / 2 / Math.PI;
                if (o < 0) {
                    o += 360;
                }
                s = Math.sqrt(n * n + t * t);
                return [
                    e,
                    s,
                    o
                ];
            };
            s.lch.lab = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a;
                var o;
                var s;
                s = t / 360 * 2 * Math.PI;
                a = n * Math.cos(s);
                o = n * Math.sin(s);
                return [
                    e,
                    a,
                    o
                ];
            };
            s.rgb.ansi16 = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                var a = 1 in arguments ? arguments[1] : s.rgb.hsv(r)[2];
                a = Math.round(a / 50);
                if (a === 0) {
                    return 30;
                }
                var o = 30 + (Math.round(t / 255) << 2 | Math.round(n / 255) << 1 | Math.round(e / 255));
                if (a === 2) {
                    o += 60;
                }
                return o;
            };
            s.hsv.ansi16 = function(r) {
                return s.rgb.ansi16(s.hsv.rgb(r), r[2]);
            };
            s.rgb.ansi256 = function(r) {
                var e = r[0];
                var n = r[1];
                var t = r[2];
                if (e === n && n === t) {
                    if (e < 8) {
                        return 16;
                    }
                    if (e > 248) {
                        return 231;
                    }
                    return Math.round((e - 8) / 247 * 24) + 232;
                }
                var a = 16 + 36 * Math.round(e / 255 * 5) + 6 * Math.round(n / 255 * 5) + Math.round(t / 255 * 5);
                return a;
            };
            s.ansi16.rgb = function(r) {
                var e = r % 10;
                if (e === 0 || e === 7) {
                    if (r > 50) {
                        e += 3.5;
                    }
                    e = e / 10.5 * 255;
                    return [
                        e,
                        e,
                        e
                    ];
                }
                var n = (~~(r > 50) + 1) * .5;
                var t = (e & 1) * n * 255;
                var a = (e >> 1 & 1) * n * 255;
                var o = (e >> 2 & 1) * n * 255;
                return [
                    t,
                    a,
                    o
                ];
            };
            s.ansi256.rgb = function(r) {
                if (r >= 232) {
                    var e = (r - 232) * 10 + 8;
                    return [
                        e,
                        e,
                        e
                    ];
                }
                r -= 16;
                var n;
                var t = Math.floor(r / 36) / 5 * 255;
                var a = Math.floor((n = r % 36) / 6) / 5 * 255;
                var o = n % 6 / 5 * 255;
                return [
                    t,
                    a,
                    o
                ];
            };
            s.rgb.hex = function(r) {
                var e = ((Math.round(r[0]) & 255) << 16) + ((Math.round(r[1]) & 255) << 8) + (Math.round(r[2]) & 255);
                var n = e.toString(16).toUpperCase();
                return "000000".substring(n.length) + n;
            };
            s.hex.rgb = function(r) {
                var e = r.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
                if (!e) {
                    return [
                        0,
                        0,
                        0
                    ];
                }
                var n = e[0];
                if (e[0].length === 3) {
                    n = n.split("").map(function(r) {
                        return r + r;
                    }).join("");
                }
                var t = parseInt(n, 16);
                var a = t >> 16 & 255;
                var o = t >> 8 & 255;
                var s = t & 255;
                return [
                    a,
                    o,
                    s
                ];
            };
            s.rgb.hcg = function(r) {
                var e = r[0] / 255;
                var n = r[1] / 255;
                var t = r[2] / 255;
                var a = Math.max(Math.max(e, n), t);
                var o = Math.min(Math.min(e, n), t);
                var s = a - o;
                var l;
                var i;
                if (s < 1) {
                    l = o / (1 - s);
                } else {
                    l = 0;
                }
                if (s <= 0) {
                    i = 0;
                } else if (a === e) {
                    i = (n - t) / s % 6;
                } else if (a === n) {
                    i = 2 + (t - e) / s;
                } else {
                    i = 4 + (e - n) / s + 4;
                }
                i /= 6;
                i %= 1;
                return [
                    i * 360,
                    s * 100,
                    l * 100
                ];
            };
            s.hsl.hcg = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = 1;
                var a = 0;
                if (n < .5) {
                    t = 2 * e * n;
                } else {
                    t = 2 * e * (1 - n);
                }
                if (t < 1) {
                    a = (n - .5 * t) / (1 - t);
                }
                return [
                    r[0],
                    t * 100,
                    a * 100
                ];
            };
            s.hsv.hcg = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = e * n;
                var a = 0;
                if (t < 1) {
                    a = (n - t) / (1 - t);
                }
                return [
                    r[0],
                    t * 100,
                    a * 100
                ];
            };
            s.hcg.rgb = function(r) {
                var e = r[0] / 360;
                var n = r[1] / 100;
                var t = r[2] / 100;
                if (n === 0) {
                    return [
                        t * 255,
                        t * 255,
                        t * 255
                    ];
                }
                var a = [
                    0,
                    0,
                    0
                ];
                var o = e % 1 * 6;
                var s = o % 1;
                var l = 1 - s;
                var i = 0;
                switch(Math.floor(o)){
                    case 0:
                        a[0] = 1;
                        a[1] = s;
                        a[2] = 0;
                        break;
                    case 1:
                        a[0] = l;
                        a[1] = 1;
                        a[2] = 0;
                        break;
                    case 2:
                        a[0] = 0;
                        a[1] = 1;
                        a[2] = s;
                        break;
                    case 3:
                        a[0] = 0;
                        a[1] = l;
                        a[2] = 1;
                        break;
                    case 4:
                        a[0] = s;
                        a[1] = 0;
                        a[2] = 1;
                        break;
                    default:
                        a[0] = 1;
                        a[1] = 0;
                        a[2] = l;
                }
                i = (1 - n) * t;
                return [
                    (n * a[0] + i) * 255,
                    (n * a[1] + i) * 255,
                    (n * a[2] + i) * 255
                ];
            };
            s.hcg.hsv = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = e + n * (1 - e);
                var a = 0;
                if (t > 0) {
                    a = e / t;
                }
                return [
                    r[0],
                    a * 100,
                    t * 100
                ];
            };
            s.hcg.hsl = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = n * (1 - e) + .5 * e;
                var a = 0;
                if (t > 0 && t < .5) {
                    a = e / (2 * t);
                } else if (t >= .5 && t < 1) {
                    a = e / (2 * (1 - t));
                }
                return [
                    r[0],
                    a * 100,
                    t * 100
                ];
            };
            s.hcg.hwb = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = e + n * (1 - e);
                return [
                    r[0],
                    (t - e) * 100,
                    (1 - t) * 100
                ];
            };
            s.hwb.hcg = function(r) {
                var e = r[1] / 100;
                var n = r[2] / 100;
                var t = 1 - n;
                var a = t - e;
                var o = 0;
                if (a < 1) {
                    o = (t - a) / (1 - a);
                }
                return [
                    r[0],
                    a * 100,
                    o * 100
                ];
            };
            s.apple.rgb = function(r) {
                return [
                    r[0] / 65535 * 255,
                    r[1] / 65535 * 255,
                    r[2] / 65535 * 255
                ];
            };
            s.rgb.apple = function(r) {
                return [
                    r[0] / 255 * 65535,
                    r[1] / 255 * 65535,
                    r[2] / 255 * 65535
                ];
            };
            s.gray.rgb = function(r) {
                return [
                    r[0] / 100 * 255,
                    r[0] / 100 * 255,
                    r[0] / 100 * 255
                ];
            };
            s.gray.hsl = s.gray.hsv = function(r) {
                return [
                    0,
                    0,
                    r[0]
                ];
            };
            s.gray.hwb = function(r) {
                return [
                    0,
                    100,
                    r[0]
                ];
            };
            s.gray.cmyk = function(r) {
                return [
                    0,
                    0,
                    0,
                    r[0]
                ];
            };
            s.gray.lab = function(r) {
                return [
                    r[0],
                    0,
                    0
                ];
            };
            s.gray.hex = function(r) {
                var e = Math.round(r[0] / 100 * 255) & 255;
                var n = (e << 16) + (e << 8) + e;
                var t = n.toString(16).toUpperCase();
                return "000000".substring(t.length) + t;
            };
            s.rgb.gray = function(r) {
                var e = (r[0] + r[1] + r[2]) / 3;
                return [
                    e / 255 * 100
                ];
            };
        },
        54: (r, e, n)=>{
            var t = n(117);
            var a = n(528);
            var o = {};
            var s = Object.keys(t);
            function wrapRaw(r) {
                var wrappedFn = function(e) {
                    if (e === undefined || e === null) {
                        return e;
                    }
                    if (arguments.length > 1) {
                        e = Array.prototype.slice.call(arguments);
                    }
                    return r(e);
                };
                if ("conversion" in r) {
                    wrappedFn.conversion = r.conversion;
                }
                return wrappedFn;
            }
            function wrapRounded(r) {
                var wrappedFn = function(e) {
                    if (e === undefined || e === null) {
                        return e;
                    }
                    if (arguments.length > 1) {
                        e = Array.prototype.slice.call(arguments);
                    }
                    var n = r(e);
                    if (typeof n === "object") {
                        for(var t = n.length, a = 0; a < t; a++){
                            n[a] = Math.round(n[a]);
                        }
                    }
                    return n;
                };
                if ("conversion" in r) {
                    wrappedFn.conversion = r.conversion;
                }
                return wrappedFn;
            }
            s.forEach(function(r) {
                o[r] = {};
                Object.defineProperty(o[r], "channels", {
                    value: t[r].channels
                });
                Object.defineProperty(o[r], "labels", {
                    value: t[r].labels
                });
                var e = a(r);
                var n = Object.keys(e);
                n.forEach(function(n) {
                    var t = e[n];
                    o[r][n] = wrapRounded(t);
                    o[r][n].raw = wrapRaw(t);
                });
            });
            r.exports = o;
        },
        528: (r, e, n)=>{
            var t = n(117);
            function buildGraph() {
                var r = {};
                var e = Object.keys(t);
                for(var n = e.length, a = 0; a < n; a++){
                    r[e[a]] = {
                        distance: -1,
                        parent: null
                    };
                }
                return r;
            }
            function deriveBFS(r) {
                var e = buildGraph();
                var n = [
                    r
                ];
                e[r].distance = 0;
                while(n.length){
                    var a = n.pop();
                    var o = Object.keys(t[a]);
                    for(var s = o.length, l = 0; l < s; l++){
                        var i = o[l];
                        var c = e[i];
                        if (c.distance === -1) {
                            c.distance = e[a].distance + 1;
                            c.parent = a;
                            n.unshift(i);
                        }
                    }
                }
                return e;
            }
            function link(r, e) {
                return function(n) {
                    return e(r(n));
                };
            }
            function wrapConversion(r, e) {
                var n = [
                    e[r].parent,
                    r
                ];
                var a = t[e[r].parent][r];
                var o = e[r].parent;
                while(e[o].parent){
                    n.unshift(e[o].parent);
                    a = link(t[e[o].parent][o], a);
                    o = e[o].parent;
                }
                a.conversion = n;
                return a;
            }
            r.exports = function(r) {
                var e = deriveBFS(r);
                var n = {};
                var t = Object.keys(e);
                for(var a = t.length, o = 0; o < a; o++){
                    var s = t[o];
                    var l = e[s];
                    if (l.parent === null) {
                        continue;
                    }
                    n[s] = wrapConversion(s, e);
                }
                return n;
            };
        },
        251: (r)=>{
            "use strict";
            r.exports = {
                aliceblue: [
                    240,
                    248,
                    255
                ],
                antiquewhite: [
                    250,
                    235,
                    215
                ],
                aqua: [
                    0,
                    255,
                    255
                ],
                aquamarine: [
                    127,
                    255,
                    212
                ],
                azure: [
                    240,
                    255,
                    255
                ],
                beige: [
                    245,
                    245,
                    220
                ],
                bisque: [
                    255,
                    228,
                    196
                ],
                black: [
                    0,
                    0,
                    0
                ],
                blanchedalmond: [
                    255,
                    235,
                    205
                ],
                blue: [
                    0,
                    0,
                    255
                ],
                blueviolet: [
                    138,
                    43,
                    226
                ],
                brown: [
                    165,
                    42,
                    42
                ],
                burlywood: [
                    222,
                    184,
                    135
                ],
                cadetblue: [
                    95,
                    158,
                    160
                ],
                chartreuse: [
                    127,
                    255,
                    0
                ],
                chocolate: [
                    210,
                    105,
                    30
                ],
                coral: [
                    255,
                    127,
                    80
                ],
                cornflowerblue: [
                    100,
                    149,
                    237
                ],
                cornsilk: [
                    255,
                    248,
                    220
                ],
                crimson: [
                    220,
                    20,
                    60
                ],
                cyan: [
                    0,
                    255,
                    255
                ],
                darkblue: [
                    0,
                    0,
                    139
                ],
                darkcyan: [
                    0,
                    139,
                    139
                ],
                darkgoldenrod: [
                    184,
                    134,
                    11
                ],
                darkgray: [
                    169,
                    169,
                    169
                ],
                darkgreen: [
                    0,
                    100,
                    0
                ],
                darkgrey: [
                    169,
                    169,
                    169
                ],
                darkkhaki: [
                    189,
                    183,
                    107
                ],
                darkmagenta: [
                    139,
                    0,
                    139
                ],
                darkolivegreen: [
                    85,
                    107,
                    47
                ],
                darkorange: [
                    255,
                    140,
                    0
                ],
                darkorchid: [
                    153,
                    50,
                    204
                ],
                darkred: [
                    139,
                    0,
                    0
                ],
                darksalmon: [
                    233,
                    150,
                    122
                ],
                darkseagreen: [
                    143,
                    188,
                    143
                ],
                darkslateblue: [
                    72,
                    61,
                    139
                ],
                darkslategray: [
                    47,
                    79,
                    79
                ],
                darkslategrey: [
                    47,
                    79,
                    79
                ],
                darkturquoise: [
                    0,
                    206,
                    209
                ],
                darkviolet: [
                    148,
                    0,
                    211
                ],
                deeppink: [
                    255,
                    20,
                    147
                ],
                deepskyblue: [
                    0,
                    191,
                    255
                ],
                dimgray: [
                    105,
                    105,
                    105
                ],
                dimgrey: [
                    105,
                    105,
                    105
                ],
                dodgerblue: [
                    30,
                    144,
                    255
                ],
                firebrick: [
                    178,
                    34,
                    34
                ],
                floralwhite: [
                    255,
                    250,
                    240
                ],
                forestgreen: [
                    34,
                    139,
                    34
                ],
                fuchsia: [
                    255,
                    0,
                    255
                ],
                gainsboro: [
                    220,
                    220,
                    220
                ],
                ghostwhite: [
                    248,
                    248,
                    255
                ],
                gold: [
                    255,
                    215,
                    0
                ],
                goldenrod: [
                    218,
                    165,
                    32
                ],
                gray: [
                    128,
                    128,
                    128
                ],
                green: [
                    0,
                    128,
                    0
                ],
                greenyellow: [
                    173,
                    255,
                    47
                ],
                grey: [
                    128,
                    128,
                    128
                ],
                honeydew: [
                    240,
                    255,
                    240
                ],
                hotpink: [
                    255,
                    105,
                    180
                ],
                indianred: [
                    205,
                    92,
                    92
                ],
                indigo: [
                    75,
                    0,
                    130
                ],
                ivory: [
                    255,
                    255,
                    240
                ],
                khaki: [
                    240,
                    230,
                    140
                ],
                lavender: [
                    230,
                    230,
                    250
                ],
                lavenderblush: [
                    255,
                    240,
                    245
                ],
                lawngreen: [
                    124,
                    252,
                    0
                ],
                lemonchiffon: [
                    255,
                    250,
                    205
                ],
                lightblue: [
                    173,
                    216,
                    230
                ],
                lightcoral: [
                    240,
                    128,
                    128
                ],
                lightcyan: [
                    224,
                    255,
                    255
                ],
                lightgoldenrodyellow: [
                    250,
                    250,
                    210
                ],
                lightgray: [
                    211,
                    211,
                    211
                ],
                lightgreen: [
                    144,
                    238,
                    144
                ],
                lightgrey: [
                    211,
                    211,
                    211
                ],
                lightpink: [
                    255,
                    182,
                    193
                ],
                lightsalmon: [
                    255,
                    160,
                    122
                ],
                lightseagreen: [
                    32,
                    178,
                    170
                ],
                lightskyblue: [
                    135,
                    206,
                    250
                ],
                lightslategray: [
                    119,
                    136,
                    153
                ],
                lightslategrey: [
                    119,
                    136,
                    153
                ],
                lightsteelblue: [
                    176,
                    196,
                    222
                ],
                lightyellow: [
                    255,
                    255,
                    224
                ],
                lime: [
                    0,
                    255,
                    0
                ],
                limegreen: [
                    50,
                    205,
                    50
                ],
                linen: [
                    250,
                    240,
                    230
                ],
                magenta: [
                    255,
                    0,
                    255
                ],
                maroon: [
                    128,
                    0,
                    0
                ],
                mediumaquamarine: [
                    102,
                    205,
                    170
                ],
                mediumblue: [
                    0,
                    0,
                    205
                ],
                mediumorchid: [
                    186,
                    85,
                    211
                ],
                mediumpurple: [
                    147,
                    112,
                    219
                ],
                mediumseagreen: [
                    60,
                    179,
                    113
                ],
                mediumslateblue: [
                    123,
                    104,
                    238
                ],
                mediumspringgreen: [
                    0,
                    250,
                    154
                ],
                mediumturquoise: [
                    72,
                    209,
                    204
                ],
                mediumvioletred: [
                    199,
                    21,
                    133
                ],
                midnightblue: [
                    25,
                    25,
                    112
                ],
                mintcream: [
                    245,
                    255,
                    250
                ],
                mistyrose: [
                    255,
                    228,
                    225
                ],
                moccasin: [
                    255,
                    228,
                    181
                ],
                navajowhite: [
                    255,
                    222,
                    173
                ],
                navy: [
                    0,
                    0,
                    128
                ],
                oldlace: [
                    253,
                    245,
                    230
                ],
                olive: [
                    128,
                    128,
                    0
                ],
                olivedrab: [
                    107,
                    142,
                    35
                ],
                orange: [
                    255,
                    165,
                    0
                ],
                orangered: [
                    255,
                    69,
                    0
                ],
                orchid: [
                    218,
                    112,
                    214
                ],
                palegoldenrod: [
                    238,
                    232,
                    170
                ],
                palegreen: [
                    152,
                    251,
                    152
                ],
                paleturquoise: [
                    175,
                    238,
                    238
                ],
                palevioletred: [
                    219,
                    112,
                    147
                ],
                papayawhip: [
                    255,
                    239,
                    213
                ],
                peachpuff: [
                    255,
                    218,
                    185
                ],
                peru: [
                    205,
                    133,
                    63
                ],
                pink: [
                    255,
                    192,
                    203
                ],
                plum: [
                    221,
                    160,
                    221
                ],
                powderblue: [
                    176,
                    224,
                    230
                ],
                purple: [
                    128,
                    0,
                    128
                ],
                rebeccapurple: [
                    102,
                    51,
                    153
                ],
                red: [
                    255,
                    0,
                    0
                ],
                rosybrown: [
                    188,
                    143,
                    143
                ],
                royalblue: [
                    65,
                    105,
                    225
                ],
                saddlebrown: [
                    139,
                    69,
                    19
                ],
                salmon: [
                    250,
                    128,
                    114
                ],
                sandybrown: [
                    244,
                    164,
                    96
                ],
                seagreen: [
                    46,
                    139,
                    87
                ],
                seashell: [
                    255,
                    245,
                    238
                ],
                sienna: [
                    160,
                    82,
                    45
                ],
                silver: [
                    192,
                    192,
                    192
                ],
                skyblue: [
                    135,
                    206,
                    235
                ],
                slateblue: [
                    106,
                    90,
                    205
                ],
                slategray: [
                    112,
                    128,
                    144
                ],
                slategrey: [
                    112,
                    128,
                    144
                ],
                snow: [
                    255,
                    250,
                    250
                ],
                springgreen: [
                    0,
                    255,
                    127
                ],
                steelblue: [
                    70,
                    130,
                    180
                ],
                tan: [
                    210,
                    180,
                    140
                ],
                teal: [
                    0,
                    128,
                    128
                ],
                thistle: [
                    216,
                    191,
                    216
                ],
                tomato: [
                    255,
                    99,
                    71
                ],
                turquoise: [
                    64,
                    224,
                    208
                ],
                violet: [
                    238,
                    130,
                    238
                ],
                wheat: [
                    245,
                    222,
                    179
                ],
                white: [
                    255,
                    255,
                    255
                ],
                whitesmoke: [
                    245,
                    245,
                    245
                ],
                yellow: [
                    255,
                    255,
                    0
                ],
                yellowgreen: [
                    154,
                    205,
                    50
                ]
            };
        },
        379: (r)=>{
            "use strict";
            var e = /[|\\{}()[\]^$+*?.]/g;
            r.exports = function(r) {
                if (typeof r !== "string") {
                    throw new TypeError("Expected a string");
                }
                return r.replace(e, "\\$&");
            };
        },
        343: (r)=>{
            "use strict";
            r.exports = (r, e)=>{
                e = e || process.argv;
                const n = r.startsWith("-") ? "" : r.length === 1 ? "-" : "--";
                const t = e.indexOf(n + r);
                const a = e.indexOf("--");
                return t !== -1 && (a === -1 ? true : t < a);
            };
        },
        220: (r, e, n)=>{
            "use strict";
            const t = n(37);
            const a = n(343);
            const o = process.env;
            let s;
            if (a("no-color") || a("no-colors") || a("color=false")) {
                s = false;
            } else if (a("color") || a("colors") || a("color=true") || a("color=always")) {
                s = true;
            }
            if ("FORCE_COLOR" in o) {
                s = o.FORCE_COLOR.length === 0 || parseInt(o.FORCE_COLOR, 10) !== 0;
            }
            function translateLevel(r) {
                if (r === 0) {
                    return false;
                }
                return {
                    level: r,
                    hasBasic: true,
                    has256: r >= 2,
                    has16m: r >= 3
                };
            }
            function supportsColor(r) {
                if (s === false) {
                    return 0;
                }
                if (a("color=16m") || a("color=full") || a("color=truecolor")) {
                    return 3;
                }
                if (a("color=256")) {
                    return 2;
                }
                if (r && !r.isTTY && s !== true) {
                    return 0;
                }
                const e = s ? 1 : 0;
                if (process.platform === "win32") {
                    const r = t.release().split(".");
                    if (Number(process.versions.node.split(".")[0]) >= 8 && Number(r[0]) >= 10 && Number(r[2]) >= 10586) {
                        return Number(r[2]) >= 14931 ? 3 : 2;
                    }
                    return 1;
                }
                if ("CI" in o) {
                    if ([
                        "TRAVIS",
                        "CIRCLECI",
                        "APPVEYOR",
                        "GITLAB_CI"
                    ].some((r)=>r in o) || o.CI_NAME === "codeship") {
                        return 1;
                    }
                    return e;
                }
                if ("TEAMCITY_VERSION" in o) {
                    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(o.TEAMCITY_VERSION) ? 1 : 0;
                }
                if (o.COLORTERM === "truecolor") {
                    return 3;
                }
                if ("TERM_PROGRAM" in o) {
                    const r = parseInt((o.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
                    switch(o.TERM_PROGRAM){
                        case "iTerm.app":
                            return r >= 3 ? 3 : 2;
                        case "Apple_Terminal":
                            return 2;
                    }
                }
                if (/-256(color)?$/i.test(o.TERM)) {
                    return 2;
                }
                if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(o.TERM)) {
                    return 1;
                }
                if ("COLORTERM" in o) {
                    return 1;
                }
                if (o.TERM === "dumb") {
                    return e;
                }
                return e;
            }
            function getSupportLevel(r) {
                const e = supportsColor(r);
                return translateLevel(e);
            }
            r.exports = {
                supportsColor: getSupportLevel,
                stdout: getSupportLevel(process.stdout),
                stderr: getSupportLevel(process.stderr)
            };
        },
        37: (r)=>{
            "use strict";
            r.exports = __webpack_require__(2037);
        }
    };
    var e = {};
    function __nccwpck_require__(n) {
        var t = e[n];
        if (t !== undefined) {
            return t.exports;
        }
        var a = e[n] = {
            id: n,
            loaded: false,
            exports: {}
        };
        var o = true;
        try {
            r[n](a, a.exports, __nccwpck_require__);
            o = false;
        } finally{
            if (o) delete e[n];
        }
        a.loaded = true;
        return a.exports;
    }
    (()=>{
        __nccwpck_require__.nmd = (r)=>{
            r.paths = [];
            if (!r.children) r.children = [];
            return r;
        };
    })();
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
    var n = __nccwpck_require__(148);
    module.exports = n;
})();


/***/ }),

/***/ 2184:
/***/ ((module) => {

"use strict";

(()=>{
    "use strict";
    if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
    var e = {};
    (()=>{
        var r = e;
        /*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */ r.parse = parse;
        r.serialize = serialize;
        var i = decodeURIComponent;
        var t = encodeURIComponent;
        var a = /; */;
        var n = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
        function parse(e, r) {
            if (typeof e !== "string") {
                throw new TypeError("argument str must be a string");
            }
            var t = {};
            var n = r || {};
            var o = e.split(a);
            var s = n.decode || i;
            for(var p = 0; p < o.length; p++){
                var f = o[p];
                var u = f.indexOf("=");
                if (u < 0) {
                    continue;
                }
                var v = f.substr(0, u).trim();
                var c = f.substr(++u, f.length).trim();
                if ('"' == c[0]) {
                    c = c.slice(1, -1);
                }
                if (undefined == t[v]) {
                    t[v] = tryDecode(c, s);
                }
            }
            return t;
        }
        function serialize(e, r, i) {
            var a = i || {};
            var o = a.encode || t;
            if (typeof o !== "function") {
                throw new TypeError("option encode is invalid");
            }
            if (!n.test(e)) {
                throw new TypeError("argument name is invalid");
            }
            var s = o(r);
            if (s && !n.test(s)) {
                throw new TypeError("argument val is invalid");
            }
            var p = e + "=" + s;
            if (null != a.maxAge) {
                var f = a.maxAge - 0;
                if (isNaN(f) || !isFinite(f)) {
                    throw new TypeError("option maxAge is invalid");
                }
                p += "; Max-Age=" + Math.floor(f);
            }
            if (a.domain) {
                if (!n.test(a.domain)) {
                    throw new TypeError("option domain is invalid");
                }
                p += "; Domain=" + a.domain;
            }
            if (a.path) {
                if (!n.test(a.path)) {
                    throw new TypeError("option path is invalid");
                }
                p += "; Path=" + a.path;
            }
            if (a.expires) {
                if (typeof a.expires.toUTCString !== "function") {
                    throw new TypeError("option expires is invalid");
                }
                p += "; Expires=" + a.expires.toUTCString();
            }
            if (a.httpOnly) {
                p += "; HttpOnly";
            }
            if (a.secure) {
                p += "; Secure";
            }
            if (a.sameSite) {
                var u = typeof a.sameSite === "string" ? a.sameSite.toLowerCase() : a.sameSite;
                switch(u){
                    case true:
                        p += "; SameSite=Strict";
                        break;
                    case "lax":
                        p += "; SameSite=Lax";
                        break;
                    case "strict":
                        p += "; SameSite=Strict";
                        break;
                    case "none":
                        p += "; SameSite=None";
                        break;
                    default:
                        throw new TypeError("option sameSite is invalid");
                }
            }
            return p;
        }
        function tryDecode(e, r) {
            try {
                return r(e);
            } catch (r) {
                return e;
            }
        }
    })();
    module.exports = e;
})();


/***/ }),

/***/ 2642:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "default", ({
    enumerable: true,
    get: function() {
        return _default;
    }
}));
let chalk;
if (false) {} else {
    chalk = __webpack_require__(2312);
}
const _default = chalk; //# sourceMappingURL=chalk.js.map


/***/ }),

/***/ 2078:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    NEXT_QUERY_PARAM_PREFIX: function() {
        return NEXT_QUERY_PARAM_PREFIX;
    },
    PRERENDER_REVALIDATE_HEADER: function() {
        return PRERENDER_REVALIDATE_HEADER;
    },
    PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
        return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
    },
    CACHE_ONE_YEAR: function() {
        return CACHE_ONE_YEAR;
    },
    MIDDLEWARE_FILENAME: function() {
        return MIDDLEWARE_FILENAME;
    },
    MIDDLEWARE_LOCATION_REGEXP: function() {
        return MIDDLEWARE_LOCATION_REGEXP;
    },
    INSTRUMENTATION_HOOK_FILENAME: function() {
        return INSTRUMENTATION_HOOK_FILENAME;
    },
    PAGES_DIR_ALIAS: function() {
        return PAGES_DIR_ALIAS;
    },
    DOT_NEXT_ALIAS: function() {
        return DOT_NEXT_ALIAS;
    },
    ROOT_DIR_ALIAS: function() {
        return ROOT_DIR_ALIAS;
    },
    APP_DIR_ALIAS: function() {
        return APP_DIR_ALIAS;
    },
    RSC_MOD_REF_PROXY_ALIAS: function() {
        return RSC_MOD_REF_PROXY_ALIAS;
    },
    RSC_ACTION_VALIDATE_ALIAS: function() {
        return RSC_ACTION_VALIDATE_ALIAS;
    },
    RSC_ACTION_PROXY_ALIAS: function() {
        return RSC_ACTION_PROXY_ALIAS;
    },
    RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
        return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
    },
    PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
        return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
    },
    SSG_GET_INITIAL_PROPS_CONFLICT: function() {
        return SSG_GET_INITIAL_PROPS_CONFLICT;
    },
    SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
        return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
    },
    SERVER_PROPS_SSG_CONFLICT: function() {
        return SERVER_PROPS_SSG_CONFLICT;
    },
    STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
        return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
    },
    SERVER_PROPS_EXPORT_ERROR: function() {
        return SERVER_PROPS_EXPORT_ERROR;
    },
    GSP_NO_RETURNED_VALUE: function() {
        return GSP_NO_RETURNED_VALUE;
    },
    GSSP_NO_RETURNED_VALUE: function() {
        return GSSP_NO_RETURNED_VALUE;
    },
    UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
        return UNSTABLE_REVALIDATE_RENAME_ERROR;
    },
    GSSP_COMPONENT_MEMBER_ERROR: function() {
        return GSSP_COMPONENT_MEMBER_ERROR;
    },
    NON_STANDARD_NODE_ENV: function() {
        return NON_STANDARD_NODE_ENV;
    },
    SSG_FALLBACK_EXPORT_ERROR: function() {
        return SSG_FALLBACK_EXPORT_ERROR;
    },
    ESLINT_DEFAULT_DIRS: function() {
        return ESLINT_DEFAULT_DIRS;
    },
    ESLINT_DEFAULT_DIRS_WITH_APP: function() {
        return ESLINT_DEFAULT_DIRS_WITH_APP;
    },
    ESLINT_PROMPT_VALUES: function() {
        return ESLINT_PROMPT_VALUES;
    },
    SERVER_RUNTIME: function() {
        return SERVER_RUNTIME;
    },
    WEBPACK_LAYERS: function() {
        return WEBPACK_LAYERS;
    },
    WEBPACK_RESOURCE_QUERIES: function() {
        return WEBPACK_RESOURCE_QUERIES;
    }
});
const NEXT_QUERY_PARAM_PREFIX = "nxtP";
const PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
const PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
const CACHE_ONE_YEAR = 31536000;
const MIDDLEWARE_FILENAME = "middleware";
const MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
const INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
const PAGES_DIR_ALIAS = "private-next-pages";
const DOT_NEXT_ALIAS = "private-dot-next";
const ROOT_DIR_ALIAS = "private-next-root-dir";
const APP_DIR_ALIAS = "private-next-app-dir";
const RSC_MOD_REF_PROXY_ALIAS = "next/dist/build/webpack/loaders/next-flight-loader/module-proxy";
const RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
const RSC_ACTION_PROXY_ALIAS = "private-next-rsc-action-proxy";
const RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
const GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
const GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
const UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\n" + "Please use `revalidate` instead.";
const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
const ESLINT_DEFAULT_DIRS = [
    "pages",
    "components",
    "lib",
    "src"
];
const ESLINT_DEFAULT_DIRS_WITH_APP = [
    "app",
    ...ESLINT_DEFAULT_DIRS
];
const ESLINT_PROMPT_VALUES = [
    {
        title: "Strict",
        recommended: true,
        config: {
            extends: "next/core-web-vitals"
        }
    },
    {
        title: "Base",
        config: {
            extends: "next"
        }
    },
    {
        title: "Cancel",
        config: null
    }
];
const SERVER_RUNTIME = {
    edge: "edge",
    experimentalEdge: "experimental-edge",
    nodejs: "nodejs"
};
/**
 * The names of the webpack layers. These layers are the primitives for the
 * webpack chunks.
 */ const WEBPACK_LAYERS_NAMES = {
    /**
   * The layer for the shared code between the client and server bundles.
   */ shared: "shared",
    /**
   * React Server Components layer (rsc).
   */ reactServerComponents: "rsc",
    /**
   * Server Side Rendering layer (ssr).
   */ serverSideRendering: "ssr",
    /**
   * The browser client bundle layer for actions.
   */ actionBrowser: "actionBrowser",
    /**
   * The layer for the API routes.
   */ api: "api",
    /**
   * The layer for the middleware code.
   */ middleware: "middleware",
    /**
   * The layer for assets on the edge.
   */ edgeAsset: "edge-asset",
    /**
   * The browser client bundle layer for App directory.
   */ appPagesBrowser: "app-pages-browser",
    /**
   * The server bundle layer for metadata routes.
   */ appMetadataRoute: "app-metadata-route"
};
const WEBPACK_LAYERS = {
    ...WEBPACK_LAYERS_NAMES,
    GROUP: {
        server: [
            WEBPACK_LAYERS_NAMES.reactServerComponents,
            WEBPACK_LAYERS_NAMES.actionBrowser,
            WEBPACK_LAYERS_NAMES.appMetadataRoute
        ]
    }
};
const WEBPACK_RESOURCE_QUERIES = {
    edgeSSREntry: "__next_edge_ssr_entry__",
    metadata: "__next_metadata__",
    metadataRoute: "__next_metadata_route__",
    metadataImageMeta: "__next_metadata_image_meta__"
}; //# sourceMappingURL=constants.js.map


/***/ }),

/***/ 4561:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getCookieParser: function() {
        return getCookieParser;
    },
    sendStatusCode: function() {
        return sendStatusCode;
    },
    redirect: function() {
        return redirect;
    },
    checkIsOnDemandRevalidate: function() {
        return checkIsOnDemandRevalidate;
    },
    COOKIE_NAME_PRERENDER_BYPASS: function() {
        return COOKIE_NAME_PRERENDER_BYPASS;
    },
    COOKIE_NAME_PRERENDER_DATA: function() {
        return COOKIE_NAME_PRERENDER_DATA;
    },
    RESPONSE_LIMIT_DEFAULT: function() {
        return RESPONSE_LIMIT_DEFAULT;
    },
    SYMBOL_PREVIEW_DATA: function() {
        return SYMBOL_PREVIEW_DATA;
    },
    SYMBOL_CLEARED_COOKIES: function() {
        return SYMBOL_CLEARED_COOKIES;
    },
    clearPreviewData: function() {
        return clearPreviewData;
    },
    ApiError: function() {
        return ApiError;
    },
    sendError: function() {
        return sendError;
    },
    setLazyProp: function() {
        return setLazyProp;
    }
});
const _headers = __webpack_require__(3423);
const _constants = __webpack_require__(2078);
function getCookieParser(headers) {
    return function parseCookie() {
        const { cookie } = headers;
        if (!cookie) {
            return {};
        }
        const { parse: parseCookieFn } = __webpack_require__(2184);
        return parseCookieFn(Array.isArray(cookie) ? cookie.join("; ") : cookie);
    };
}
function sendStatusCode(res, statusCode) {
    res.statusCode = statusCode;
    return res;
}
function redirect(res, statusOrUrl, url) {
    if (typeof statusOrUrl === "string") {
        url = statusOrUrl;
        statusOrUrl = 307;
    }
    if (typeof statusOrUrl !== "number" || typeof url !== "string") {
        throw new Error(`Invalid redirect arguments. Please use a single argument URL, e.g. res.redirect('/destination') or use a status code and URL, e.g. res.redirect(307, '/destination').`);
    }
    res.writeHead(statusOrUrl, {
        Location: url
    });
    res.write(url);
    res.end();
    return res;
}
function checkIsOnDemandRevalidate(req, previewProps) {
    const headers = _headers.HeadersAdapter.from(req.headers);
    const previewModeId = headers.get(_constants.PRERENDER_REVALIDATE_HEADER);
    const isOnDemandRevalidate = previewModeId === previewProps.previewModeId;
    const revalidateOnlyGenerated = headers.has(_constants.PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER);
    return {
        isOnDemandRevalidate,
        revalidateOnlyGenerated
    };
}
const COOKIE_NAME_PRERENDER_BYPASS = `__prerender_bypass`;
const COOKIE_NAME_PRERENDER_DATA = `__next_preview_data`;
const RESPONSE_LIMIT_DEFAULT = 4 * 1024 * 1024;
const SYMBOL_PREVIEW_DATA = Symbol(COOKIE_NAME_PRERENDER_DATA);
const SYMBOL_CLEARED_COOKIES = Symbol(COOKIE_NAME_PRERENDER_BYPASS);
function clearPreviewData(res, options = {}) {
    if (SYMBOL_CLEARED_COOKIES in res) {
        return res;
    }
    const { serialize } = __webpack_require__(2184);
    const previous = res.getHeader("Set-Cookie");
    res.setHeader(`Set-Cookie`, [
        ...typeof previous === "string" ? [
            previous
        ] : Array.isArray(previous) ? previous : [],
        serialize(COOKIE_NAME_PRERENDER_BYPASS, "", {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        }),
        serialize(COOKIE_NAME_PRERENDER_DATA, "", {
            // To delete a cookie, set `expires` to a date in the past:
            // https://tools.ietf.org/html/rfc6265#section-4.1.1
            // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
            expires: new Date(0),
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            ...options.path !== undefined ? {
                path: options.path
            } : undefined
        })
    ]);
    Object.defineProperty(res, SYMBOL_CLEARED_COOKIES, {
        value: true,
        enumerable: false
    });
    return res;
}
class ApiError extends Error {
    constructor(statusCode, message){
        super(message);
        this.statusCode = statusCode;
    }
}
function sendError(res, statusCode, message) {
    res.statusCode = statusCode;
    res.statusMessage = message;
    res.end(message);
}
function setLazyProp({ req }, prop, getter) {
    const opts = {
        configurable: true,
        enumerable: true
    };
    const optsReset = {
        ...opts,
        writable: true
    };
    Object.defineProperty(req, prop, {
        ...opts,
        get: ()=>{
            const value = getter();
            // we set the property on the object to avoid recalculating it
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
            return value;
        },
        set: (value)=>{
            Object.defineProperty(req, prop, {
                ...optsReset,
                value
            });
        }
    });
} //# sourceMappingURL=index.js.map


/***/ }),

/***/ 2146:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "DraftModeProvider", ({
    enumerable: true,
    get: function() {
        return DraftModeProvider;
    }
}));
const _apiutils = __webpack_require__(4561);
class DraftModeProvider {
    constructor(previewProps, req, cookies, mutableCookies){
        var _cookies_get;
        // The logic for draftMode() is very similar to tryGetPreviewData()
        // but Draft Mode does not have any data associated with it.
        const isOnDemandRevalidate = previewProps && (0, _apiutils.checkIsOnDemandRevalidate)(req, previewProps).isOnDemandRevalidate;
        const cookieValue = (_cookies_get = cookies.get(_apiutils.COOKIE_NAME_PRERENDER_BYPASS)) == null ? void 0 : _cookies_get.value;
        this.isEnabled = Boolean(!isOnDemandRevalidate && cookieValue && previewProps && cookieValue === previewProps.previewModeId);
        this._previewModeId = previewProps == null ? void 0 : previewProps.previewModeId;
        this._mutableCookies = mutableCookies;
    }
    enable() {
        if (!this._previewModeId) {
            throw new Error("Invariant: previewProps missing previewModeId this should never happen");
        }
        this._mutableCookies.set({
            name: _apiutils.COOKIE_NAME_PRERENDER_BYPASS,
            value: this._previewModeId,
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/"
        });
    }
    disable() {
        // To delete a cookie, set `expires` to a date in the past:
        // https://tools.ietf.org/html/rfc6265#section-4.1.1
        // `Max-Age: 0` is not valid, thus ignored, and the cookie is persisted.
        this._mutableCookies.set({
            name: _apiutils.COOKIE_NAME_PRERENDER_BYPASS,
            value: "",
            httpOnly: true,
            sameSite:  true ? "none" : 0,
            secure: "production" !== "development",
            path: "/",
            expires: new Date(0)
        });
    }
} //# sourceMappingURL=draft-mode-provider.js.map


/***/ }),

/***/ 5208:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "RequestAsyncStorageWrapper", ({
    enumerable: true,
    get: function() {
        return RequestAsyncStorageWrapper;
    }
}));
const _approuterheaders = __webpack_require__(3909);
const _headers = __webpack_require__(3423);
const _requestcookies = __webpack_require__(9934);
const _cookies = __webpack_require__(1220);
const _draftmodeprovider = __webpack_require__(2146);
function getHeaders(headers) {
    const cleaned = _headers.HeadersAdapter.from(headers);
    for (const param of _approuterheaders.FLIGHT_PARAMETERS){
        cleaned.delete(param.toString().toLowerCase());
    }
    return _headers.HeadersAdapter.seal(cleaned);
}
function getCookies(headers) {
    const cookies = new _cookies.RequestCookies(_headers.HeadersAdapter.from(headers));
    return _requestcookies.RequestCookiesAdapter.seal(cookies);
}
function getMutableCookies(headers, onUpdateCookies) {
    const cookies = new _cookies.RequestCookies(_headers.HeadersAdapter.from(headers));
    return _requestcookies.MutableRequestCookiesAdapter.wrap(cookies, onUpdateCookies);
}
const RequestAsyncStorageWrapper = {
    /**
   * Wrap the callback with the given store so it can access the underlying
   * store using hooks.
   *
   * @param storage underlying storage object returned by the module
   * @param context context to seed the store
   * @param callback function to call within the scope of the context
   * @returns the result returned by the callback
   */ wrap (storage, { req, res, renderOpts }, callback) {
        let previewProps = undefined;
        if (renderOpts && "previewProps" in renderOpts) {
            // TODO: investigate why previewProps isn't on RenderOpts
            previewProps = renderOpts.previewProps;
        }
        function defaultOnUpdateCookies(cookies) {
            if (res) {
                res.setHeader("Set-Cookie", cookies);
            }
        }
        const cache = {};
        const store = {
            get headers () {
                if (!cache.headers) {
                    // Seal the headers object that'll freeze out any methods that could
                    // mutate the underlying data.
                    cache.headers = getHeaders(req.headers);
                }
                return cache.headers;
            },
            get cookies () {
                if (!cache.cookies) {
                    // Seal the cookies object that'll freeze out any methods that could
                    // mutate the underlying data.
                    cache.cookies = getCookies(req.headers);
                }
                return cache.cookies;
            },
            get mutableCookies () {
                if (!cache.mutableCookies) {
                    cache.mutableCookies = getMutableCookies(req.headers, (renderOpts == null ? void 0 : renderOpts.onUpdateCookies) || (res ? defaultOnUpdateCookies : undefined));
                }
                return cache.mutableCookies;
            },
            get draftMode () {
                if (!cache.draftMode) {
                    cache.draftMode = new _draftmodeprovider.DraftModeProvider(previewProps, req, this.cookies, this.mutableCookies);
                }
                return cache.draftMode;
            }
        };
        return storage.run(store, callback, store);
    }
}; //# sourceMappingURL=request-async-storage-wrapper.js.map


/***/ }),

/***/ 3204:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "StaticGenerationAsyncStorageWrapper", ({
    enumerable: true,
    get: function() {
        return StaticGenerationAsyncStorageWrapper;
    }
}));
const StaticGenerationAsyncStorageWrapper = {
    wrap (storage, { pathname, renderOpts }, callback) {
        /**
     * Rules of Static & Dynamic HTML:
     *
     *    1.) We must generate static HTML unless the caller explicitly opts
     *        in to dynamic HTML support.
     *
     *    2.) If dynamic HTML support is requested, we must honor that request
     *        or throw an error. It is the sole responsibility of the caller to
     *        ensure they aren't e.g. requesting dynamic HTML for an AMP page.
     *
     *    3.) If the request is in draft mode, we must generate dynamic HTML.
     *
     * These rules help ensure that other existing features like request caching,
     * coalescing, and ISR continue working as intended.
     */ const isStaticGeneration = !renderOpts.supportsDynamicHTML && !renderOpts.isDraftMode;
        const store = {
            isStaticGeneration,
            pathname,
            originalPathname: renderOpts.originalPathname,
            incrementalCache: // so that it can access the fs cache without mocks
            renderOpts.incrementalCache || globalThis.__incrementalCache,
            isRevalidate: renderOpts.isRevalidate,
            isPrerendering: renderOpts.nextExport,
            fetchCache: renderOpts.fetchCache,
            isOnDemandRevalidate: renderOpts.isOnDemandRevalidate,
            isDraftMode: renderOpts.isDraftMode
        };
        // TODO: remove this when we resolve accessing the store outside the execution context
        renderOpts.store = store;
        return storage.run(store, callback, store);
    }
}; //# sourceMappingURL=static-generation-async-storage-wrapper.js.map


/***/ }),

/***/ 5298:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "autoImplementMethods", ({
    enumerable: true,
    get: function() {
        return autoImplementMethods;
    }
}));
const _http = __webpack_require__(7961);
const _responsehandlers = __webpack_require__(1332);
const AUTOMATIC_ROUTE_METHODS = [
    "HEAD",
    "OPTIONS"
];
function autoImplementMethods(handlers) {
    // Loop through all the HTTP methods to create the initial methods object.
    // Each of the methods will be set to the the 405 response handler.
    const methods = _http.HTTP_METHODS.reduce((acc, method)=>({
            ...acc,
            // If the userland module implements the method, then use it. Otherwise,
            // use the 405 response handler.
            [method]: handlers[method] ?? _responsehandlers.handleMethodNotAllowedResponse
        }), {});
    // Get all the methods that could be automatically implemented that were not
    // implemented by the userland module.
    const implemented = new Set(_http.HTTP_METHODS.filter((method)=>handlers[method]));
    const missing = AUTOMATIC_ROUTE_METHODS.filter((method)=>!implemented.has(method));
    // Loop over the missing methods to automatically implement them if we can.
    for (const method of missing){
        // If the userland module doesn't implement the HEAD method, then
        // we'll automatically implement it by calling the GET method (if it
        // exists).
        if (method === "HEAD") {
            // If the userland module doesn't implement the GET method, then
            // we're done.
            if (!handlers.GET) break;
            // Implement the HEAD method by calling the GET method.
            methods.HEAD = handlers.GET;
            // Mark it as implemented.
            implemented.add("HEAD");
            continue;
        }
        // If OPTIONS is not provided then implement it.
        if (method === "OPTIONS") {
            // TODO: check if HEAD is implemented, if so, use it to add more headers
            // Get all the methods that were implemented by the userland module.
            const allow = [
                "OPTIONS",
                ...implemented
            ];
            // If the list of methods doesn't include HEAD, but it includes GET, then
            // add HEAD as it's automatically implemented.
            if (!implemented.has("HEAD") && implemented.has("GET")) {
                allow.push("HEAD");
            }
            // Sort and join the list with commas to create the `Allow` header. See:
            // https://httpwg.org/specs/rfc9110.html#field.allow
            const headers = {
                Allow: allow.sort().join(", ")
            };
            // Implement the OPTIONS method by returning a 204 response with the
            // `Allow` header.
            methods.OPTIONS = ()=>new Response(null, {
                    status: 204,
                    headers
                });
            // Mark this method as implemented.
            implemented.add("OPTIONS");
            continue;
        }
        throw new Error(`Invariant: should handle all automatic implementable methods, got method: ${method}`);
    }
    return methods;
} //# sourceMappingURL=auto-implement-methods.js.map


/***/ }),

/***/ 6341:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * Cleans a URL by stripping the protocol, host, and search params.
 *
 * @param urlString the url to clean
 * @returns the cleaned url
 */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "cleanURL", ({
    enumerable: true,
    get: function() {
        return cleanURL;
    }
}));
function cleanURL(urlString) {
    const url = new URL(urlString);
    url.host = "localhost:3000";
    url.search = "";
    url.protocol = "http";
    return url.toString();
} //# sourceMappingURL=clean-url.js.map


/***/ }),

/***/ 3884:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "getNonStaticMethods", ({
    enumerable: true,
    get: function() {
        return getNonStaticMethods;
    }
}));
const NON_STATIC_METHODS = [
    "OPTIONS",
    "POST",
    "PUT",
    "DELETE",
    "PATCH"
];
function getNonStaticMethods(handlers) {
    // We can currently only statically optimize if only GET/HEAD are used as
    // prerender can't be used conditionally based on the method currently.
    const methods = NON_STATIC_METHODS.filter((method)=>handlers[method]);
    if (methods.length === 0) return false;
    return methods;
} //# sourceMappingURL=get-non-static-methods.js.map


/***/ }),

/***/ 8636:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * Get pathname from absolute path.
 *
 * @param absolutePath the absolute path
 * @returns the pathname
 */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "getPathnameFromAbsolutePath", ({
    enumerable: true,
    get: function() {
        return getPathnameFromAbsolutePath;
    }
}));
function getPathnameFromAbsolutePath(absolutePath) {
    // Remove prefix including app dir
    let appDir = "/app/";
    if (!absolutePath.includes(appDir)) {
        appDir = "\\app\\";
    }
    const [, ...parts] = absolutePath.split(appDir);
    const relativePath = appDir[0] + parts.join(appDir);
    // remove extension
    const pathname = relativePath.split(".").slice(0, -1).join(".");
    return pathname;
} //# sourceMappingURL=get-pathname-from-absolute-path.js.map


/***/ }),

/***/ 8657:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "parsedUrlQueryToParams", ({
    enumerable: true,
    get: function() {
        return parsedUrlQueryToParams;
    }
}));
function parsedUrlQueryToParams(query) {
    const params = {};
    for (const [key, value] of Object.entries(query)){
        if (typeof value === "undefined") continue;
        params[key] = value;
    }
    return params;
} //# sourceMappingURL=parsed-url-query-to-params.js.map


/***/ }),

/***/ 5807:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "proxyRequest", ({
    enumerable: true,
    get: function() {
        return proxyRequest;
    }
}));
const _cookies = __webpack_require__(1749);
const _nexturl = __webpack_require__(2284);
const _cleanurl = __webpack_require__(6341);
function proxyRequest(request, { dynamic }, hooks) {
    function handleNextUrlBailout(prop) {
        switch(prop){
            case "search":
            case "searchParams":
            case "toString":
            case "href":
            case "origin":
                hooks.staticGenerationBailout(`nextUrl.${prop}`);
                return;
            default:
                return;
        }
    }
    const cache = {};
    const handleForceStatic = (url, prop)=>{
        switch(prop){
            case "search":
                return "";
            case "searchParams":
                if (!cache.searchParams) cache.searchParams = new URLSearchParams();
                return cache.searchParams;
            case "url":
            case "href":
                if (!cache.url) cache.url = (0, _cleanurl.cleanURL)(url);
                return cache.url;
            case "toJSON":
            case "toString":
                if (!cache.url) cache.url = (0, _cleanurl.cleanURL)(url);
                if (!cache.toString) cache.toString = ()=>cache.url;
                return cache.toString;
            case "headers":
                if (!cache.headers) cache.headers = new Headers();
                return cache.headers;
            case "cookies":
                if (!cache.headers) cache.headers = new Headers();
                if (!cache.cookies) cache.cookies = new _cookies.RequestCookies(cache.headers);
                return cache.cookies;
            case "clone":
                if (!cache.url) cache.url = (0, _cleanurl.cleanURL)(url);
                return ()=>new _nexturl.NextURL(cache.url);
            default:
                break;
        }
    };
    const wrappedNextUrl = new Proxy(request.nextUrl, {
        get (target, prop) {
            handleNextUrlBailout(prop);
            if (dynamic === "force-static" && typeof prop === "string") {
                const result = handleForceStatic(target.href, prop);
                if (result !== undefined) return result;
            }
            const value = target[prop];
            if (typeof value === "function") {
                return value.bind(target);
            }
            return value;
        },
        set (target, prop, value) {
            handleNextUrlBailout(prop);
            target[prop] = value;
            return true;
        }
    });
    const handleReqBailout = (prop)=>{
        switch(prop){
            case "headers":
                hooks.headerHooks.headers();
                return;
            // if request.url is accessed directly instead of
            // request.nextUrl we bail since it includes query
            // values that can be relied on dynamically
            case "url":
            case "body":
            case "blob":
            case "json":
            case "text":
            case "arrayBuffer":
            case "formData":
                hooks.staticGenerationBailout(`request.${prop}`);
                return;
            default:
                return;
        }
    };
    return new Proxy(request, {
        get (target, prop) {
            handleReqBailout(prop);
            if (prop === "nextUrl") {
                return wrappedNextUrl;
            }
            if (dynamic === "force-static" && typeof prop === "string") {
                const result = handleForceStatic(target.url, prop);
                if (result !== undefined) return result;
            }
            const value = target[prop];
            if (typeof value === "function") {
                return value.bind(target);
            }
            return value;
        },
        set (target, prop, value) {
            handleReqBailout(prop);
            target[prop] = value;
            return true;
        }
    });
} //# sourceMappingURL=proxy-request.js.map


/***/ }),

/***/ 7864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "resolveHandlerError", ({
    enumerable: true,
    get: function() {
        return resolveHandlerError;
    }
}));
const _notfound = __webpack_require__(2241);
const _redirect = __webpack_require__(5287);
const _responsehandlers = __webpack_require__(1332);
function resolveHandlerError(err) {
    if ((0, _redirect.isRedirectError)(err)) {
        const redirect = (0, _redirect.getURLFromRedirectError)(err);
        if (!redirect) {
            throw new Error("Invariant: Unexpected redirect url format");
        }
        // This is a redirect error! Send the redirect response.
        return (0, _responsehandlers.handleTemporaryRedirectResponse)(redirect, err.mutableCookies);
    }
    if ((0, _notfound.isNotFoundError)(err)) {
        // This is a not found error! Send the not found response.
        return (0, _responsehandlers.handleNotFoundResponse)();
    }
    // Return false to indicate that this is not a handled error.
    return false;
} //# sourceMappingURL=resolve-handler-error.js.map


/***/ }),

/***/ 9692:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    AppRouteRouteModule: function() {
        return AppRouteRouteModule;
    },
    default: function() {
        return _default;
    }
});
const _routemodule = __webpack_require__(6649);
const _requestasyncstoragewrapper = __webpack_require__(5208);
const _staticgenerationasyncstoragewrapper = __webpack_require__(3204);
const _responsehandlers = __webpack_require__(1332);
const _http = __webpack_require__(7961);
const _patchfetch = __webpack_require__(2181);
const _tracer = __webpack_require__(9553);
const _constants = __webpack_require__(845);
const _getpathnamefromabsolutepath = __webpack_require__(8636);
const _proxyrequest = __webpack_require__(5807);
const _resolvehandlererror = __webpack_require__(7864);
const _log = /*#__PURE__*/ _interop_require_wildcard(__webpack_require__(7057));
const _autoimplementmethods = __webpack_require__(5298);
const _getnonstaticmethods = __webpack_require__(3884);
const _requestcookies = __webpack_require__(9934);
const _routekind = __webpack_require__(9513);
const _parsedurlquerytoparams = __webpack_require__(8657);
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {};
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
// These are imported weirdly like this because of the way that the bundling
// works. We need to import the built files from the dist directory, but we
// can't do that directly because we need types from the source files. So we
// import the types from the source files and then import the built files.
const { requestAsyncStorage } = __webpack_require__(1715);
const { staticGenerationAsyncStorage } = __webpack_require__(3539);
const serverHooks = __webpack_require__(1651);
const headerHooks = __webpack_require__(4937);
const { staticGenerationBailout } = __webpack_require__(6164);
const { actionAsyncStorage } = __webpack_require__(4876);
class AppRouteRouteModule extends _routemodule.RouteModule {
    static is(route) {
        return route.definition.kind === _routekind.RouteKind.APP_ROUTE;
    }
    constructor({ userland, definition, resolvedPagePath, nextConfigOutput }){
        super({
            userland,
            definition
        });
        /**
   * A reference to the request async storage.
   */ this.requestAsyncStorage = requestAsyncStorage;
        /**
   * A reference to the static generation async storage.
   */ this.staticGenerationAsyncStorage = staticGenerationAsyncStorage;
        /**
   * An interface to call server hooks which interact with the underlying
   * storage.
   */ this.serverHooks = serverHooks;
        /**
   * An interface to call header hooks which interact with the underlying
   * request storage.
   */ this.headerHooks = headerHooks;
        /**
   * An interface to call static generation bailout hooks which interact with
   * the underlying static generation storage.
   */ this.staticGenerationBailout = staticGenerationBailout;
        /**
   * A reference to the mutation related async storage, such as mutations of
   * cookies.
   */ this.actionAsyncStorage = actionAsyncStorage;
        this.resolvedPagePath = resolvedPagePath;
        this.nextConfigOutput = nextConfigOutput;
        // Automatically implement some methods if they aren't implemented by the
        // userland module.
        this.methods = (0, _autoimplementmethods.autoImplementMethods)(userland);
        // Get the non-static methods for this route.
        this.nonStaticMethods = (0, _getnonstaticmethods.getNonStaticMethods)(userland);
        // Get the dynamic property from the userland module.
        this.dynamic = this.userland.dynamic;
        if (this.nextConfigOutput === "export") {
            if (!this.dynamic || this.dynamic === "auto") {
                this.dynamic = "error";
            } else if (this.dynamic === "force-dynamic") {
                throw new Error(`export const dynamic = "force-dynamic" on page "${definition.pathname}" cannot be used with "output: export". See more info here: https://nextjs.org/docs/advanced-features/static-html-export`);
            }
        }
        // We only warn in development after here, so return if we're not in
        // development.
        if (false) {}
    }
    /**
   * Resolves the handler function for the given method.
   *
   * @param method the requested method
   * @returns the handler function for the given method
   */ resolve(method) {
        // Ensure that the requested method is a valid method (to prevent RCE's).
        if (!(0, _http.isHTTPMethod)(method)) return _responsehandlers.handleBadRequestResponse;
        // Return the handler.
        return this.methods[method];
    }
    /**
   * Executes the route handler.
   */ async execute(request, context) {
        // Get the handler function for the given method.
        const handler = this.resolve(request.method);
        // Get the context for the request.
        const requestContext = {
            req: request
        };
        requestContext.renderOpts = {
            previewProps: context.prerenderManifest.preview
        };
        // Get the context for the static generation.
        const staticGenerationContext = {
            pathname: this.definition.pathname,
            renderOpts: // the default values.
            context.staticGenerationContext ?? {
                supportsDynamicHTML: false
            }
        };
        // Add the fetchCache option to the renderOpts.
        staticGenerationContext.renderOpts.fetchCache = this.userland.fetchCache;
        // Run the handler with the request AsyncLocalStorage to inject the helper
        // support. We set this to `unknown` because the type is not known until
        // runtime when we do a instanceof check below.
        const response = await this.actionAsyncStorage.run({
            isAppRoute: true
        }, ()=>{
            return _requestasyncstoragewrapper.RequestAsyncStorageWrapper.wrap(this.requestAsyncStorage, requestContext, ()=>{
                return _staticgenerationasyncstoragewrapper.StaticGenerationAsyncStorageWrapper.wrap(this.staticGenerationAsyncStorage, staticGenerationContext, (staticGenerationStore)=>{
                    var _getTracer_getRootSpanAttributes;
                    // Check to see if we should bail out of static generation based on
                    // having non-static methods.
                    if (this.nonStaticMethods) {
                        this.staticGenerationBailout(`non-static methods used ${this.nonStaticMethods.join(", ")}`);
                    }
                    // Update the static generation store based on the dynamic property.
                    switch(this.dynamic){
                        case "force-dynamic":
                            // The dynamic property is set to force-dynamic, so we should
                            // force the page to be dynamic.
                            staticGenerationStore.forceDynamic = true;
                            this.staticGenerationBailout(`force-dynamic`, {
                                dynamic: this.dynamic
                            });
                            break;
                        case "force-static":
                            // The dynamic property is set to force-static, so we should
                            // force the page to be static.
                            staticGenerationStore.forceStatic = true;
                            break;
                        case "error":
                            // The dynamic property is set to error, so we should throw an
                            // error if the page is being statically generated.
                            staticGenerationStore.dynamicShouldError = true;
                            break;
                        default:
                            break;
                    }
                    // If the static generation store does not have a revalidate value
                    // set, then we should set it the revalidate value from the userland
                    // module or default to false.
                    staticGenerationStore.revalidate ??= this.userland.revalidate ?? false;
                    // Wrap the request so we can add additional functionality to cases
                    // that might change it's output or affect the rendering.
                    const wrappedRequest = (0, _proxyrequest.proxyRequest)(request, {
                        dynamic: this.dynamic
                    }, {
                        headerHooks: this.headerHooks,
                        serverHooks: this.serverHooks,
                        staticGenerationBailout: this.staticGenerationBailout
                    });
                    // TODO: propagate this pathname from route matcher
                    const route = (0, _getpathnamefromabsolutepath.getPathnameFromAbsolutePath)(this.resolvedPagePath);
                    (_getTracer_getRootSpanAttributes = (0, _tracer.getTracer)().getRootSpanAttributes()) == null ? void 0 : _getTracer_getRootSpanAttributes.set("next.route", route);
                    return (0, _tracer.getTracer)().trace(_constants.AppRouteRouteHandlersSpan.runHandler, {
                        spanName: `executing api route (app) ${route}`,
                        attributes: {
                            "next.route": route
                        }
                    }, async ()=>{
                        var _staticGenerationStore_tags;
                        // Patch the global fetch.
                        (0, _patchfetch.patchFetch)({
                            serverHooks: this.serverHooks,
                            staticGenerationAsyncStorage: this.staticGenerationAsyncStorage
                        });
                        const res = await handler(wrappedRequest, {
                            params: context.params ? (0, _parsedurlquerytoparams.parsedUrlQueryToParams)(context.params) : undefined
                        });
                        context.staticGenerationContext.fetchMetrics = staticGenerationStore.fetchMetrics;
                        await Promise.all(staticGenerationStore.pendingRevalidates || []);
                        (0, _patchfetch.addImplicitTags)(staticGenerationStore);
                        context.staticGenerationContext.fetchTags = (_staticGenerationStore_tags = staticGenerationStore.tags) == null ? void 0 : _staticGenerationStore_tags.join(",");
                        // It's possible cookies were set in the handler, so we need
                        // to merge the modified cookies and the returned response
                        // here.
                        const requestStore = this.requestAsyncStorage.getStore();
                        if (requestStore && requestStore.mutableCookies) {
                            const headers = new Headers(res.headers);
                            if ((0, _requestcookies.appendMutableCookies)(headers, requestStore.mutableCookies)) {
                                return new Response(res.body, {
                                    status: res.status,
                                    statusText: res.statusText,
                                    headers
                                });
                            }
                        }
                        return res;
                    });
                });
            });
        });
        // If the handler did't return a valid response, then return the internal
        // error response.
        if (!(response instanceof Response)) {
            // TODO: validate the correct handling behavior, maybe log something?
            return (0, _responsehandlers.handleInternalServerErrorResponse)();
        }
        if (response.headers.has("x-middleware-rewrite")) {
            // TODO: move this error into the `NextResponse.rewrite()` function.
            // TODO-APP: re-enable support below when we can proxy these type of requests
            throw new Error("NextResponse.rewrite() was used in a app route handler, this is not currently supported. Please remove the invocation to continue.");
        // // This is a rewrite created via `NextResponse.rewrite()`. We need to send
        // // the response up so it can be handled by the backing server.
        // // If the server is running in minimal mode, we just want to forward the
        // // response (including the rewrite headers) upstream so it can perform the
        // // redirect for us, otherwise return with the special condition so this
        // // server can perform a rewrite.
        // if (!minimalMode) {
        //   return { response, condition: 'rewrite' }
        // }
        // // Relativize the url so it's relative to the base url. This is so the
        // // outgoing headers upstream can be relative.
        // const rewritePath = response.headers.get('x-middleware-rewrite')!
        // const initUrl = getRequestMeta(req, '__NEXT_INIT_URL')!
        // const { pathname } = parseUrl(relativizeURL(rewritePath, initUrl))
        // response.headers.set('x-middleware-rewrite', pathname)
        }
        if (response.headers.get("x-middleware-next") === "1") {
            // TODO: move this error into the `NextResponse.next()` function.
            throw new Error("NextResponse.next() was used in a app route handler, this is not supported. See here for more info: https://nextjs.org/docs/messages/next-response-next-in-app-route-handler");
        }
        return response;
    }
    async handle(request, context) {
        try {
            // Execute the route to get the response.
            const response = await this.execute(request, context);
            // The response was handled, return it.
            return response;
        } catch (err) {
            // Try to resolve the error to a response, else throw it again.
            const response = (0, _resolvehandlererror.resolveHandlerError)(err);
            if (!response) throw err;
            // The response was resolved, return it.
            return response;
        }
    }
}
const _default = AppRouteRouteModule; //# sourceMappingURL=module.js.map


/***/ }),

/***/ 1332:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    handleTemporaryRedirectResponse: function() {
        return handleTemporaryRedirectResponse;
    },
    handleBadRequestResponse: function() {
        return handleBadRequestResponse;
    },
    handleNotFoundResponse: function() {
        return handleNotFoundResponse;
    },
    handleMethodNotAllowedResponse: function() {
        return handleMethodNotAllowedResponse;
    },
    handleInternalServerErrorResponse: function() {
        return handleInternalServerErrorResponse;
    }
});
const _requestcookies = __webpack_require__(9934);
function handleTemporaryRedirectResponse(url, mutableCookies) {
    const headers = new Headers({
        location: url
    });
    (0, _requestcookies.appendMutableCookies)(headers, mutableCookies);
    return new Response(null, {
        status: 307,
        headers
    });
}
function handleBadRequestResponse() {
    return new Response(null, {
        status: 400
    });
}
function handleNotFoundResponse() {
    return new Response(null, {
        status: 404
    });
}
function handleMethodNotAllowedResponse() {
    return new Response(null, {
        status: 405
    });
}
function handleInternalServerErrorResponse() {
    return new Response(null, {
        status: 500
    });
} //# sourceMappingURL=response-handlers.js.map


/***/ }),

/***/ 6649:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "RouteModule", ({
    enumerable: true,
    get: function() {
        return RouteModule;
    }
}));
class RouteModule {
    constructor({ userland, definition }){
        this.userland = userland;
        this.definition = definition;
    }
} //# sourceMappingURL=route-module.js.map


/***/ }),

/***/ 2181:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    addImplicitTags: function() {
        return addImplicitTags;
    },
    patchFetch: function() {
        return patchFetch;
    }
});
const _constants = __webpack_require__(845);
const _tracer = __webpack_require__(9553);
const _constants1 = __webpack_require__(2078);
const isEdgeRuntime = "nodejs" === "edge";
function addImplicitTags(staticGenerationStore) {
    const newTags = [];
    const pathname = staticGenerationStore == null ? void 0 : staticGenerationStore.originalPathname;
    if (!pathname) {
        return newTags;
    }
    if (!Array.isArray(staticGenerationStore.tags)) {
        staticGenerationStore.tags = [];
    }
    if (!staticGenerationStore.tags.includes(pathname)) {
        staticGenerationStore.tags.push(pathname);
    }
    newTags.push(pathname);
    return newTags;
}
function trackFetchMetric(staticGenerationStore, ctx) {
    if (!staticGenerationStore) return;
    if (!staticGenerationStore.fetchMetrics) {
        staticGenerationStore.fetchMetrics = [];
    }
    const dedupeFields = [
        "url",
        "status",
        "method"
    ];
    // don't add metric if one already exists for the fetch
    if (staticGenerationStore.fetchMetrics.some((metric)=>{
        return dedupeFields.every((field)=>metric[field] === ctx[field]);
    })) {
        return;
    }
    staticGenerationStore.fetchMetrics.push({
        url: ctx.url,
        cacheStatus: ctx.cacheStatus,
        cacheReason: ctx.cacheReason,
        status: ctx.status,
        method: ctx.method,
        start: ctx.start,
        end: Date.now(),
        idx: staticGenerationStore.nextFetchId || 0
    });
}
function patchFetch({ serverHooks, staticGenerationAsyncStorage }) {
    if (!globalThis._nextOriginalFetch) {
        globalThis._nextOriginalFetch = globalThis.fetch;
    }
    if (globalThis.fetch.__nextPatched) return;
    const { DynamicServerError } = serverHooks;
    const originFetch = globalThis._nextOriginalFetch;
    globalThis.fetch = async (input, init)=>{
        var _init_method, _ref;
        let url;
        try {
            url = new URL(input instanceof Request ? input.url : input);
            url.username = "";
            url.password = "";
        } catch  {
            // Error caused by malformed URL should be handled by native fetch
            url = undefined;
        }
        const fetchUrl = (url == null ? void 0 : url.href) ?? "";
        const fetchStart = Date.now();
        const method = (init == null ? void 0 : (_init_method = init.method) == null ? void 0 : _init_method.toUpperCase()) || "GET";
        // Do create a new span trace for internal fetches in the
        // non-verbose mode.
        const isInternal = ((_ref = init == null ? void 0 : init.next) == null ? void 0 : _ref.internal) === true;
        return await (0, _tracer.getTracer)().trace(isInternal ? _constants.NextNodeServerSpan.internalFetch : _constants.AppRenderSpan.fetch, {
            kind: _tracer.SpanKind.CLIENT,
            spanName: [
                "fetch",
                method,
                fetchUrl
            ].filter(Boolean).join(" "),
            attributes: {
                "http.url": fetchUrl,
                "http.method": method,
                "net.peer.name": url == null ? void 0 : url.hostname,
                "net.peer.port": (url == null ? void 0 : url.port) || undefined
            }
        }, async ()=>{
            var _getRequestMeta;
            const staticGenerationStore = staticGenerationAsyncStorage.getStore() || (fetch.__nextGetStaticStore == null ? void 0 : fetch.__nextGetStaticStore());
            const isRequestInput = input && typeof input === "object" && typeof input.method === "string";
            const getRequestMeta = (field)=>{
                let value = isRequestInput ? input[field] : null;
                return value || (init == null ? void 0 : init[field]);
            };
            // If the staticGenerationStore is not available, we can't do any
            // special treatment of fetch, therefore fallback to the original
            // fetch implementation.
            if (!staticGenerationStore || isInternal || staticGenerationStore.isDraftMode) {
                return originFetch(input, init);
            }
            let revalidate = undefined;
            const getNextField = (field)=>{
                var _init_next, _init_next1, _input_next;
                return typeof (init == null ? void 0 : (_init_next = init.next) == null ? void 0 : _init_next[field]) !== "undefined" ? init == null ? void 0 : (_init_next1 = init.next) == null ? void 0 : _init_next1[field] : isRequestInput ? (_input_next = input.next) == null ? void 0 : _input_next[field] : undefined;
            };
            // RequestInit doesn't keep extra fields e.g. next so it's
            // only available if init is used separate
            let curRevalidate = getNextField("revalidate");
            const tags = getNextField("tags") || [];
            if (Array.isArray(tags)) {
                if (!staticGenerationStore.tags) {
                    staticGenerationStore.tags = [];
                }
                for (const tag of tags){
                    if (!staticGenerationStore.tags.includes(tag)) {
                        staticGenerationStore.tags.push(tag);
                    }
                }
            }
            const implicitTags = addImplicitTags(staticGenerationStore);
            for (const tag of implicitTags || []){
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            }
            const isOnlyCache = staticGenerationStore.fetchCache === "only-cache";
            const isForceCache = staticGenerationStore.fetchCache === "force-cache";
            const isDefaultCache = staticGenerationStore.fetchCache === "default-cache";
            const isDefaultNoStore = staticGenerationStore.fetchCache === "default-no-store";
            const isOnlyNoStore = staticGenerationStore.fetchCache === "only-no-store";
            const isForceNoStore = staticGenerationStore.fetchCache === "force-no-store";
            let _cache = getRequestMeta("cache");
            let cacheReason = "";
            if (typeof _cache === "string" && typeof curRevalidate !== "undefined") {
                console.warn(`Warning: fetch for ${fetchUrl} on ${staticGenerationStore.pathname} specified "cache: ${_cache}" and "revalidate: ${curRevalidate}", only one should be specified.`);
                _cache = undefined;
            }
            if (_cache === "force-cache") {
                curRevalidate = false;
            }
            if ([
                "no-cache",
                "no-store"
            ].includes(_cache || "")) {
                curRevalidate = 0;
                cacheReason = `cache: ${_cache}`;
            }
            if (typeof curRevalidate === "number" || curRevalidate === false) {
                revalidate = curRevalidate;
            }
            const _headers = getRequestMeta("headers");
            const initHeaders = typeof (_headers == null ? void 0 : _headers.get) === "function" ? _headers : new Headers(_headers || {});
            const hasUnCacheableHeader = initHeaders.get("authorization") || initHeaders.get("cookie");
            const isUnCacheableMethod = ![
                "get",
                "head"
            ].includes(((_getRequestMeta = getRequestMeta("method")) == null ? void 0 : _getRequestMeta.toLowerCase()) || "get");
            // if there are authorized headers or a POST method and
            // dynamic data usage was present above the tree we bail
            // e.g. if cookies() is used before an authed/POST fetch
            const autoNoCache = (hasUnCacheableHeader || isUnCacheableMethod) && staticGenerationStore.revalidate === 0;
            if (isForceNoStore) {
                revalidate = 0;
                cacheReason = "fetchCache = force-no-store";
            }
            if (isOnlyNoStore) {
                if (_cache === "force-cache" || revalidate === 0) {
                    throw new Error(`cache: 'force-cache' used on fetch for ${fetchUrl} with 'export const fetchCache = 'only-no-store'`);
                }
                revalidate = 0;
                cacheReason = "fetchCache = only-no-store";
            }
            if (isOnlyCache && _cache === "no-store") {
                throw new Error(`cache: 'no-store' used on fetch for ${fetchUrl} with 'export const fetchCache = 'only-cache'`);
            }
            if (isForceCache && (typeof curRevalidate === "undefined" || curRevalidate === 0)) {
                cacheReason = "fetchCache = force-cache";
                revalidate = false;
            }
            if (typeof revalidate === "undefined") {
                if (isDefaultCache) {
                    revalidate = false;
                    cacheReason = "fetchCache = default-cache";
                } else if (autoNoCache) {
                    revalidate = 0;
                    cacheReason = "auto no cache";
                } else if (isDefaultNoStore) {
                    revalidate = 0;
                    cacheReason = "fetchCache = default-no-store";
                } else {
                    cacheReason = "auto cache";
                    revalidate = typeof staticGenerationStore.revalidate === "boolean" || typeof staticGenerationStore.revalidate === "undefined" ? false : staticGenerationStore.revalidate;
                }
            } else if (!cacheReason) {
                cacheReason = `revalidate: ${revalidate}`;
            }
            if (// revalidate although if it occurs during build we do
            !autoNoCache && (typeof staticGenerationStore.revalidate === "undefined" || typeof revalidate === "number" && (staticGenerationStore.revalidate === false || typeof staticGenerationStore.revalidate === "number" && revalidate < staticGenerationStore.revalidate))) {
                staticGenerationStore.revalidate = revalidate;
            }
            const isCacheableRevalidate = typeof revalidate === "number" && revalidate > 0 || revalidate === false;
            let cacheKey;
            if (staticGenerationStore.incrementalCache && isCacheableRevalidate) {
                try {
                    cacheKey = await staticGenerationStore.incrementalCache.fetchCacheKey(fetchUrl, isRequestInput ? input : init);
                } catch (err) {
                    console.error(`Failed to generate cache key for`, input);
                }
            }
            const requestInputFields = [
                "cache",
                "credentials",
                "headers",
                "integrity",
                "keepalive",
                "method",
                "mode",
                "redirect",
                "referrer",
                "referrerPolicy",
                "signal",
                "window",
                "duplex"
            ];
            if (isRequestInput) {
                const reqInput = input;
                const reqOptions = {
                    body: reqInput._ogBody || reqInput.body
                };
                for (const field of requestInputFields){
                    // @ts-expect-error custom fields
                    reqOptions[field] = reqInput[field];
                }
                input = new Request(reqInput.url, reqOptions);
            } else if (init) {
                const initialInit = init;
                init = {
                    body: init._ogBody || init.body
                };
                for (const field of requestInputFields){
                    // @ts-expect-error custom fields
                    init[field] = initialInit[field];
                }
            }
            const fetchIdx = staticGenerationStore.nextFetchId ?? 1;
            staticGenerationStore.nextFetchId = fetchIdx + 1;
            const normalizedRevalidate = typeof revalidate !== "number" ? _constants1.CACHE_ONE_YEAR : revalidate;
            const doOriginalFetch = async (isStale, cacheReasonOverride)=>{
                // add metadata to init without editing the original
                const clonedInit = {
                    ...init,
                    next: {
                        ...init == null ? void 0 : init.next,
                        fetchType: "origin",
                        fetchIdx
                    }
                };
                return originFetch(input, clonedInit).then(async (res)=>{
                    if (!isStale) {
                        trackFetchMetric(staticGenerationStore, {
                            start: fetchStart,
                            url: fetchUrl,
                            cacheReason: cacheReasonOverride || cacheReason,
                            cacheStatus: revalidate === 0 || cacheReasonOverride ? "skip" : "miss",
                            status: res.status,
                            method: clonedInit.method || "GET"
                        });
                    }
                    if (res.status === 200 && staticGenerationStore.incrementalCache && cacheKey && isCacheableRevalidate) {
                        const bodyBuffer = Buffer.from(await res.arrayBuffer());
                        try {
                            await staticGenerationStore.incrementalCache.set(cacheKey, {
                                kind: "FETCH",
                                data: {
                                    headers: Object.fromEntries(res.headers.entries()),
                                    body: bodyBuffer.toString("base64"),
                                    status: res.status,
                                    tags,
                                    url: res.url
                                },
                                revalidate: normalizedRevalidate
                            }, revalidate, true, fetchUrl, fetchIdx);
                        } catch (err) {
                            console.warn(`Failed to set fetch cache`, input, err);
                        }
                        const response = new Response(bodyBuffer, {
                            headers: new Headers(res.headers),
                            status: res.status
                        });
                        Object.defineProperty(response, "url", {
                            value: res.url
                        });
                        return response;
                    }
                    return res;
                });
            };
            let handleUnlock = ()=>Promise.resolve();
            let cacheReasonOverride;
            if (cacheKey && staticGenerationStore.incrementalCache) {
                handleUnlock = await staticGenerationStore.incrementalCache.lock(cacheKey);
                const entry = staticGenerationStore.isOnDemandRevalidate ? null : await staticGenerationStore.incrementalCache.get(cacheKey, true, revalidate, fetchUrl, fetchIdx);
                if (entry) {
                    await handleUnlock();
                } else {
                    // in dev, incremental cache response will be null in case the browser adds `cache-control: no-cache` in the request headers
                    cacheReasonOverride = "cache-control: no-cache (hard refresh)";
                }
                if ((entry == null ? void 0 : entry.value) && entry.value.kind === "FETCH") {
                    const currentTags = entry.value.data.tags;
                    // when stale and is revalidating we wait for fresh data
                    // so the revalidated entry has the updated data
                    if (!(staticGenerationStore.isRevalidate && entry.isStale)) {
                        if (entry.isStale) {
                            if (!staticGenerationStore.pendingRevalidates) {
                                staticGenerationStore.pendingRevalidates = [];
                            }
                            staticGenerationStore.pendingRevalidates.push(doOriginalFetch(true).catch(console.error));
                        } else if (tags && !tags.every((tag)=>{
                            return currentTags == null ? void 0 : currentTags.includes(tag);
                        })) {
                            var _staticGenerationStore_incrementalCache;
                            // if new tags are being added we need to set even if
                            // the data isn't stale
                            if (!entry.value.data.tags) {
                                entry.value.data.tags = [];
                            }
                            for (const tag of tags){
                                if (!entry.value.data.tags.includes(tag)) {
                                    entry.value.data.tags.push(tag);
                                }
                            }
                            (_staticGenerationStore_incrementalCache = staticGenerationStore.incrementalCache) == null ? void 0 : _staticGenerationStore_incrementalCache.set(cacheKey, entry.value, revalidate, true, fetchUrl, fetchIdx);
                        }
                        const resData = entry.value.data;
                        let decodedBody;
                        if (false) {} else {
                            decodedBody = Buffer.from(resData.body, "base64").subarray();
                        }
                        trackFetchMetric(staticGenerationStore, {
                            start: fetchStart,
                            url: fetchUrl,
                            cacheReason,
                            cacheStatus: "hit",
                            status: resData.status || 200,
                            method: (init == null ? void 0 : init.method) || "GET"
                        });
                        const response = new Response(decodedBody, {
                            headers: resData.headers,
                            status: resData.status
                        });
                        Object.defineProperty(response, "url", {
                            value: entry.value.data.url
                        });
                        return response;
                    }
                }
            }
            if (staticGenerationStore.isStaticGeneration) {
                if (init && typeof init === "object") {
                    const cache = init.cache;
                    // Delete `cache` property as Cloudflare Workers will throw an error
                    if (isEdgeRuntime) {
                        delete init.cache;
                    }
                    if (cache === "no-store") {
                        staticGenerationStore.revalidate = 0;
                        const dynamicUsageReason = `no-store fetch ${input}${staticGenerationStore.pathname ? ` ${staticGenerationStore.pathname}` : ""}`;
                        const err = new DynamicServerError(dynamicUsageReason);
                        staticGenerationStore.dynamicUsageErr = err;
                        staticGenerationStore.dynamicUsageStack = err.stack;
                        staticGenerationStore.dynamicUsageDescription = dynamicUsageReason;
                    }
                    const hasNextConfig = "next" in init;
                    const next = init.next || {};
                    if (typeof next.revalidate === "number" && (typeof staticGenerationStore.revalidate === "undefined" || typeof staticGenerationStore.revalidate === "number" && next.revalidate < staticGenerationStore.revalidate)) {
                        const forceDynamic = staticGenerationStore.forceDynamic;
                        if (!forceDynamic || next.revalidate !== 0) {
                            staticGenerationStore.revalidate = next.revalidate;
                        }
                        if (!forceDynamic && next.revalidate === 0) {
                            const dynamicUsageReason = `revalidate: ${next.revalidate} fetch ${input}${staticGenerationStore.pathname ? ` ${staticGenerationStore.pathname}` : ""}`;
                            const err = new DynamicServerError(dynamicUsageReason);
                            staticGenerationStore.dynamicUsageErr = err;
                            staticGenerationStore.dynamicUsageStack = err.stack;
                            staticGenerationStore.dynamicUsageDescription = dynamicUsageReason;
                        }
                    }
                    if (hasNextConfig) delete init.next;
                }
            }
            return doOriginalFetch(false, cacheReasonOverride).finally(handleUnlock);
        });
    };
    globalThis.fetch.__nextGetStaticStore = ()=>{
        return staticGenerationAsyncStorage;
    };
    globalThis.fetch.__nextPatched = true;
} //# sourceMappingURL=patch-fetch.js.map


/***/ }),

/***/ 845:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * Contains predefined constants for the trace span name in next/server.
 *
 * Currently, next/server/tracer is internal implementation only for tracking
 * next.js's implementation only with known span names defined here.
 **/ // eslint typescript has a bug with TS enums
/* eslint-disable no-shadow */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    NextVanillaSpanAllowlist: function() {
        return NextVanillaSpanAllowlist;
    },
    BaseServerSpan: function() {
        return BaseServerSpan;
    },
    LoadComponentsSpan: function() {
        return LoadComponentsSpan;
    },
    NextServerSpan: function() {
        return NextServerSpan;
    },
    NextNodeServerSpan: function() {
        return NextNodeServerSpan;
    },
    StartServerSpan: function() {
        return StartServerSpan;
    },
    RenderSpan: function() {
        return RenderSpan;
    },
    RouterSpan: function() {
        return RouterSpan;
    },
    AppRenderSpan: function() {
        return AppRenderSpan;
    },
    NodeSpan: function() {
        return NodeSpan;
    },
    AppRouteRouteHandlersSpan: function() {
        return AppRouteRouteHandlersSpan;
    },
    ResolveMetadataSpan: function() {
        return ResolveMetadataSpan;
    }
});
var BaseServerSpan;
(function(BaseServerSpan) {
    BaseServerSpan["handleRequest"] = "BaseServer.handleRequest";
    BaseServerSpan["run"] = "BaseServer.run";
    BaseServerSpan["pipe"] = "BaseServer.pipe";
    BaseServerSpan["getStaticHTML"] = "BaseServer.getStaticHTML";
    BaseServerSpan["render"] = "BaseServer.render";
    BaseServerSpan["renderToResponseWithComponents"] = "BaseServer.renderToResponseWithComponents";
    BaseServerSpan["renderToResponse"] = "BaseServer.renderToResponse";
    BaseServerSpan["renderToHTML"] = "BaseServer.renderToHTML";
    BaseServerSpan["renderError"] = "BaseServer.renderError";
    BaseServerSpan["renderErrorToResponse"] = "BaseServer.renderErrorToResponse";
    BaseServerSpan["renderErrorToHTML"] = "BaseServer.renderErrorToHTML";
    BaseServerSpan["render404"] = "BaseServer.render404";
})(BaseServerSpan || (BaseServerSpan = {}));
var LoadComponentsSpan;
(function(LoadComponentsSpan) {
    LoadComponentsSpan["loadDefaultErrorComponents"] = "LoadComponents.loadDefaultErrorComponents";
    LoadComponentsSpan["loadComponents"] = "LoadComponents.loadComponents";
})(LoadComponentsSpan || (LoadComponentsSpan = {}));
var NextServerSpan;
(function(NextServerSpan) {
    NextServerSpan["getRequestHandler"] = "NextServer.getRequestHandler";
    NextServerSpan["getServer"] = "NextServer.getServer";
    NextServerSpan["getServerRequestHandler"] = "NextServer.getServerRequestHandler";
    NextServerSpan["createServer"] = "createServer.createServer";
})(NextServerSpan || (NextServerSpan = {}));
var NextNodeServerSpan;
(function(NextNodeServerSpan) {
    NextNodeServerSpan["compression"] = "NextNodeServer.compression";
    NextNodeServerSpan["getBuildId"] = "NextNodeServer.getBuildId";
    NextNodeServerSpan["generateStaticRoutes"] = "NextNodeServer.generateStaticRoutes";
    NextNodeServerSpan["generateFsStaticRoutes"] = "NextNodeServer.generateFsStaticRoutes";
    NextNodeServerSpan["generatePublicRoutes"] = "NextNodeServer.generatePublicRoutes";
    NextNodeServerSpan["generateImageRoutes"] = "NextNodeServer.generateImageRoutes.route";
    NextNodeServerSpan["sendRenderResult"] = "NextNodeServer.sendRenderResult";
    NextNodeServerSpan["sendStatic"] = "NextNodeServer.sendStatic";
    NextNodeServerSpan["proxyRequest"] = "NextNodeServer.proxyRequest";
    NextNodeServerSpan["runApi"] = "NextNodeServer.runApi";
    NextNodeServerSpan["render"] = "NextNodeServer.render";
    NextNodeServerSpan["renderHTML"] = "NextNodeServer.renderHTML";
    NextNodeServerSpan["imageOptimizer"] = "NextNodeServer.imageOptimizer";
    NextNodeServerSpan["getPagePath"] = "NextNodeServer.getPagePath";
    NextNodeServerSpan["getRoutesManifest"] = "NextNodeServer.getRoutesManifest";
    NextNodeServerSpan["findPageComponents"] = "NextNodeServer.findPageComponents";
    NextNodeServerSpan["getFontManifest"] = "NextNodeServer.getFontManifest";
    NextNodeServerSpan["getServerComponentManifest"] = "NextNodeServer.getServerComponentManifest";
    NextNodeServerSpan["getRequestHandler"] = "NextNodeServer.getRequestHandler";
    NextNodeServerSpan["renderToHTML"] = "NextNodeServer.renderToHTML";
    NextNodeServerSpan["renderError"] = "NextNodeServer.renderError";
    NextNodeServerSpan["renderErrorToHTML"] = "NextNodeServer.renderErrorToHTML";
    NextNodeServerSpan["render404"] = "NextNodeServer.render404";
    NextNodeServerSpan["route"] = "route";
    NextNodeServerSpan["onProxyReq"] = "onProxyReq";
    NextNodeServerSpan["apiResolver"] = "apiResolver";
    NextNodeServerSpan["internalFetch"] = "internalFetch";
})(NextNodeServerSpan || (NextNodeServerSpan = {}));
var StartServerSpan;
(function(StartServerSpan) {
    StartServerSpan["startServer"] = "startServer.startServer";
})(StartServerSpan || (StartServerSpan = {}));
var RenderSpan;
(function(RenderSpan) {
    RenderSpan["getServerSideProps"] = "Render.getServerSideProps";
    RenderSpan["getStaticProps"] = "Render.getStaticProps";
    RenderSpan["renderToString"] = "Render.renderToString";
    RenderSpan["renderDocument"] = "Render.renderDocument";
    RenderSpan["createBodyResult"] = "Render.createBodyResult";
})(RenderSpan || (RenderSpan = {}));
var AppRenderSpan;
(function(AppRenderSpan) {
    AppRenderSpan["renderToString"] = "AppRender.renderToString";
    AppRenderSpan["renderToReadableStream"] = "AppRender.renderToReadableStream";
    AppRenderSpan["getBodyResult"] = "AppRender.getBodyResult";
    AppRenderSpan["fetch"] = "AppRender.fetch";
})(AppRenderSpan || (AppRenderSpan = {}));
var RouterSpan;
(function(RouterSpan) {
    RouterSpan["executeRoute"] = "Router.executeRoute";
})(RouterSpan || (RouterSpan = {}));
var NodeSpan;
(function(NodeSpan) {
    NodeSpan["runHandler"] = "Node.runHandler";
})(NodeSpan || (NodeSpan = {}));
var AppRouteRouteHandlersSpan;
(function(AppRouteRouteHandlersSpan) {
    AppRouteRouteHandlersSpan["runHandler"] = "AppRouteRouteHandlers.runHandler";
})(AppRouteRouteHandlersSpan || (AppRouteRouteHandlersSpan = {}));
var ResolveMetadataSpan;
(function(ResolveMetadataSpan) {
    ResolveMetadataSpan["generateMetadata"] = "ResolveMetadata.generateMetadata";
})(ResolveMetadataSpan || (ResolveMetadataSpan = {}));
const NextVanillaSpanAllowlist = [
    "BaseServer.handleRequest",
    "Render.getServerSideProps",
    "Render.getStaticProps",
    "AppRender.fetch",
    "AppRender.getBodyResult",
    "Render.renderDocument",
    "Node.runHandler",
    "AppRouteRouteHandlers.runHandler",
    "ResolveMetadata.generateMetadata"
]; //# sourceMappingURL=constants.js.map


/***/ }),

/***/ 9553:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getTracer: function() {
        return getTracer;
    },
    SpanStatusCode: function() {
        return SpanStatusCode;
    },
    SpanKind: function() {
        return SpanKind;
    }
});
const _constants = __webpack_require__(845);
let api;
// we want to allow users to use their own version of @opentelemetry/api if they
// want to, so we try to require it first, and if it fails we fall back to the
// version that is bundled with Next.js
// this is because @opentelemetry/api has to be synced with the version of
// @opentelemetry/tracing that is used, and we don't want to force users to use
// the version that is bundled with Next.js.
// the API is ~stable, so this should be fine
if (false) {} else {
    try {
        api = __webpack_require__(1149);
    } catch (err) {
        api = __webpack_require__(1149);
    }
}
const { context, trace, SpanStatusCode, SpanKind } = api;
const isPromise = (p)=>{
    return p !== null && typeof p === "object" && typeof p.then === "function";
};
const closeSpanWithError = (span, error)=>{
    if (error) {
        span.recordException(error);
    }
    span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error == null ? void 0 : error.message
    });
    span.end();
};
/** we use this map to propagate attributes from nested spans to the top span */ const rootSpanAttributesStore = new Map();
const rootSpanIdKey = api.createContextKey("next.rootSpanId");
let lastSpanId = 0;
const getSpanId = ()=>lastSpanId++;
class NextTracerImpl {
    /**
   * Returns an instance to the trace with configured name.
   * Since wrap / trace can be defined in any place prior to actual trace subscriber initialization,
   * This should be lazily evaluated.
   */ getTracerInstance() {
        return trace.getTracer("next.js", "0.0.1");
    }
    getContext() {
        return context;
    }
    getActiveScopeSpan() {
        return trace.getSpan(context == null ? void 0 : context.active());
    }
    trace(...args) {
        const [type, fnOrOptions, fnOrEmpty] = args;
        // coerce options form overload
        const { fn, options } = typeof fnOrOptions === "function" ? {
            fn: fnOrOptions,
            options: {}
        } : {
            fn: fnOrEmpty,
            options: {
                ...fnOrOptions
            }
        };
        if (!_constants.NextVanillaSpanAllowlist.includes(type) && process.env.NEXT_OTEL_VERBOSE !== "1" || options.hideSpan) {
            return fn();
        }
        const spanName = options.spanName ?? type;
        // Trying to get active scoped span to assign parent. If option specifies parent span manually, will try to use it.
        let spanContext = this.getSpanContext((options == null ? void 0 : options.parentSpan) ?? this.getActiveScopeSpan());
        let isRootSpan = false;
        if (!spanContext) {
            spanContext = api.ROOT_CONTEXT;
            isRootSpan = true;
        }
        const spanId = getSpanId();
        options.attributes = {
            "next.span_name": spanName,
            "next.span_type": type,
            ...options.attributes
        };
        return api.context.with(spanContext.setValue(rootSpanIdKey, spanId), ()=>this.getTracerInstance().startActiveSpan(spanName, options, (span)=>{
                const onCleanup = ()=>{
                    rootSpanAttributesStore.delete(spanId);
                };
                if (isRootSpan) {
                    rootSpanAttributesStore.set(spanId, new Map(Object.entries(options.attributes ?? {})));
                }
                try {
                    if (fn.length > 1) {
                        return fn(span, (err)=>closeSpanWithError(span, err));
                    }
                    const result = fn(span);
                    if (isPromise(result)) {
                        result.then(()=>span.end(), (err)=>closeSpanWithError(span, err)).finally(onCleanup);
                    } else {
                        span.end();
                        onCleanup();
                    }
                    return result;
                } catch (err) {
                    closeSpanWithError(span, err);
                    onCleanup();
                    throw err;
                }
            }));
    }
    wrap(...args) {
        const tracer = this;
        const [name, options, fn] = args.length === 3 ? args : [
            args[0],
            {},
            args[1]
        ];
        if (!_constants.NextVanillaSpanAllowlist.includes(name) && process.env.NEXT_OTEL_VERBOSE !== "1") {
            return fn;
        }
        return function() {
            let optionsObj = options;
            if (typeof optionsObj === "function" && typeof fn === "function") {
                optionsObj = optionsObj.apply(this, arguments);
            }
            const lastArgId = arguments.length - 1;
            const cb = arguments[lastArgId];
            if (typeof cb === "function") {
                const scopeBoundCb = tracer.getContext().bind(context.active(), cb);
                return tracer.trace(name, optionsObj, (_span, done)=>{
                    arguments[lastArgId] = function(err) {
                        done == null ? void 0 : done(err);
                        return scopeBoundCb.apply(this, arguments);
                    };
                    return fn.apply(this, arguments);
                });
            } else {
                return tracer.trace(name, optionsObj, ()=>fn.apply(this, arguments));
            }
        };
    }
    startSpan(...args) {
        const [type, options] = args;
        const spanContext = this.getSpanContext((options == null ? void 0 : options.parentSpan) ?? this.getActiveScopeSpan());
        return this.getTracerInstance().startSpan(type, options, spanContext);
    }
    getSpanContext(parentSpan) {
        const spanContext = parentSpan ? trace.setSpan(context.active(), parentSpan) : undefined;
        return spanContext;
    }
    getRootSpanAttributes() {
        const spanId = context.active().getValue(rootSpanIdKey);
        return rootSpanAttributesStore.get(spanId);
    }
}
const getTracer = (()=>{
    const tracer = new NextTracerImpl();
    return ()=>tracer;
})(); //# sourceMappingURL=tracer.js.map


/***/ }),

/***/ 2394:
/***/ (() => {

"use strict";
/**
 * Polyfills the `Headers.getAll(name)` method so it'll work in the edge
 * runtime.
 */ 
if (!("getAll" in Headers.prototype)) {
    // @ts-expect-error - this is polyfilling this method so it doesn't exist yet
    Headers.prototype.getAll = function(name) {
        name = name.toLowerCase();
        if (name !== "set-cookie") throw new Error("Headers.getAll is only supported for Set-Cookie header");
        const headers = [
            ...this.entries()
        ].filter(([key])=>key === name);
        return headers.map(([, value])=>value);
    };
} //# sourceMappingURL=node-polyfill-headers.js.map


/***/ }),

/***/ 9335:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;
// This file is for modularized imports for next/server to get fully-treeshaking.

__webpack_unused_export__ = ({
    value: true
});
Object.defineProperty(exports, "Z", ({
    enumerable: true,
    get: function() {
        return _response.NextResponse;
    }
}));
const _response = __webpack_require__(7099); //# sourceMappingURL=next-response.js.map


/***/ }),

/***/ 7961:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * List of valid HTTP methods that can be implemented by Next.js's Custom App
 * Routes.
 */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    HTTP_METHODS: function() {
        return HTTP_METHODS;
    },
    isHTTPMethod: function() {
        return isHTTPMethod;
    }
});
const HTTP_METHODS = [
    "GET",
    "HEAD",
    "OPTIONS",
    "POST",
    "PUT",
    "DELETE",
    "PATCH"
];
function isHTTPMethod(maybeMethod) {
    return HTTP_METHODS.includes(maybeMethod);
} //# sourceMappingURL=http.js.map


/***/ }),

/***/ 2284:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "NextURL", ({
    enumerable: true,
    get: function() {
        return NextURL;
    }
}));
const _detectdomainlocale = __webpack_require__(2080);
const _formatnextpathnameinfo = __webpack_require__(4714);
const _gethostname = __webpack_require__(2661);
const _getnextpathnameinfo = __webpack_require__(2669);
const REGEX_LOCALHOST_HOSTNAME = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
function parseURL(url, base) {
    return new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"), base && String(base).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"));
}
const Internal = Symbol("NextURLInternal");
class NextURL {
    constructor(input, baseOrOpts, opts){
        let base;
        let options;
        if (typeof baseOrOpts === "object" && "pathname" in baseOrOpts || typeof baseOrOpts === "string") {
            base = baseOrOpts;
            options = opts || {};
        } else {
            options = opts || baseOrOpts || {};
        }
        this[Internal] = {
            url: parseURL(input, base ?? options.base),
            options: options,
            basePath: ""
        };
        this.analyze();
    }
    analyze() {
        var _this_Internal_options_nextConfig, _this_Internal_options_nextConfig_i18n, _this_Internal_domainLocale, _this_Internal_options_nextConfig1, _this_Internal_options_nextConfig_i18n1;
        const info = (0, _getnextpathnameinfo.getNextPathnameInfo)(this[Internal].url.pathname, {
            nextConfig: this[Internal].options.nextConfig,
            parseData: !undefined,
            i18nProvider: this[Internal].options.i18nProvider
        });
        const hostname = (0, _gethostname.getHostname)(this[Internal].url, this[Internal].options.headers);
        this[Internal].domainLocale = this[Internal].options.i18nProvider ? this[Internal].options.i18nProvider.detectDomainLocale(hostname) : (0, _detectdomainlocale.detectDomainLocale)((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.domains, hostname);
        const defaultLocale = ((_this_Internal_domainLocale = this[Internal].domainLocale) == null ? void 0 : _this_Internal_domainLocale.defaultLocale) || ((_this_Internal_options_nextConfig1 = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n1 = _this_Internal_options_nextConfig1.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n1.defaultLocale);
        this[Internal].url.pathname = info.pathname;
        this[Internal].defaultLocale = defaultLocale;
        this[Internal].basePath = info.basePath ?? "";
        this[Internal].buildId = info.buildId;
        this[Internal].locale = info.locale ?? defaultLocale;
        this[Internal].trailingSlash = info.trailingSlash;
    }
    formatPathname() {
        return (0, _formatnextpathnameinfo.formatNextPathnameInfo)({
            basePath: this[Internal].basePath,
            buildId: this[Internal].buildId,
            defaultLocale: !this[Internal].options.forceLocale ? this[Internal].defaultLocale : undefined,
            locale: this[Internal].locale,
            pathname: this[Internal].url.pathname,
            trailingSlash: this[Internal].trailingSlash
        });
    }
    formatSearch() {
        return this[Internal].url.search;
    }
    get buildId() {
        return this[Internal].buildId;
    }
    set buildId(buildId) {
        this[Internal].buildId = buildId;
    }
    get locale() {
        return this[Internal].locale ?? "";
    }
    set locale(locale) {
        var _this_Internal_options_nextConfig, _this_Internal_options_nextConfig_i18n;
        if (!this[Internal].locale || !((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.locales.includes(locale))) {
            throw new TypeError(`The NextURL configuration includes no locale "${locale}"`);
        }
        this[Internal].locale = locale;
    }
    get defaultLocale() {
        return this[Internal].defaultLocale;
    }
    get domainLocale() {
        return this[Internal].domainLocale;
    }
    get searchParams() {
        return this[Internal].url.searchParams;
    }
    get host() {
        return this[Internal].url.host;
    }
    set host(value) {
        this[Internal].url.host = value;
    }
    get hostname() {
        return this[Internal].url.hostname;
    }
    set hostname(value) {
        this[Internal].url.hostname = value;
    }
    get port() {
        return this[Internal].url.port;
    }
    set port(value) {
        this[Internal].url.port = value;
    }
    get protocol() {
        return this[Internal].url.protocol;
    }
    set protocol(value) {
        this[Internal].url.protocol = value;
    }
    get href() {
        const pathname = this.formatPathname();
        const search = this.formatSearch();
        return `${this.protocol}//${this.host}${pathname}${search}${this.hash}`;
    }
    set href(url) {
        this[Internal].url = parseURL(url);
        this.analyze();
    }
    get origin() {
        return this[Internal].url.origin;
    }
    get pathname() {
        return this[Internal].url.pathname;
    }
    set pathname(value) {
        this[Internal].url.pathname = value;
    }
    get hash() {
        return this[Internal].url.hash;
    }
    set hash(value) {
        this[Internal].url.hash = value;
    }
    get search() {
        return this[Internal].url.search;
    }
    set search(value) {
        this[Internal].url.search = value;
    }
    get password() {
        return this[Internal].url.password;
    }
    set password(value) {
        this[Internal].url.password = value;
    }
    get username() {
        return this[Internal].url.username;
    }
    set username(value) {
        this[Internal].url.username = value;
    }
    get basePath() {
        return this[Internal].basePath;
    }
    set basePath(value) {
        this[Internal].basePath = value.startsWith("/") ? value : `/${value}`;
    }
    toString() {
        return this.href;
    }
    toJSON() {
        return this.href;
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            href: this.href,
            origin: this.origin,
            protocol: this.protocol,
            username: this.username,
            password: this.password,
            host: this.host,
            hostname: this.hostname,
            port: this.port,
            pathname: this.pathname,
            search: this.search,
            searchParams: this.searchParams,
            hash: this.hash
        };
    }
    clone() {
        return new NextURL(String(this), this[Internal].options);
    }
} //# sourceMappingURL=next-url.js.map


/***/ }),

/***/ 3423:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ReadonlyHeadersError: function() {
        return ReadonlyHeadersError;
    },
    HeadersAdapter: function() {
        return HeadersAdapter;
    }
});
const _reflect = __webpack_require__(794);
class ReadonlyHeadersError extends Error {
    constructor(){
        super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers");
    }
    static callable() {
        throw new ReadonlyHeadersError();
    }
}
class HeadersAdapter extends Headers {
    constructor(headers){
        // We've already overridden the methods that would be called, so we're just
        // calling the super constructor to ensure that the instanceof check works.
        super();
        this.headers = new Proxy(headers, {
            get (target, prop, receiver) {
                // Because this is just an object, we expect that all "get" operations
                // are for properties. If it's a "get" for a symbol, we'll just return
                // the symbol.
                if (typeof prop === "symbol") {
                    return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return undefined.
                if (typeof original === "undefined") return;
                // If the original casing exists, return the value.
                return _reflect.ReflectAdapter.get(target, original, receiver);
            },
            set (target, prop, value, receiver) {
                if (typeof prop === "symbol") {
                    return _reflect.ReflectAdapter.set(target, prop, value, receiver);
                }
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, use the prop as the key.
                return _reflect.ReflectAdapter.set(target, original ?? prop, value, receiver);
            },
            has (target, prop) {
                if (typeof prop === "symbol") return _reflect.ReflectAdapter.has(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return false.
                if (typeof original === "undefined") return false;
                // If the original casing exists, return true.
                return _reflect.ReflectAdapter.has(target, original);
            },
            deleteProperty (target, prop) {
                if (typeof prop === "symbol") return _reflect.ReflectAdapter.deleteProperty(target, prop);
                const lowercased = prop.toLowerCase();
                // Let's find the original casing of the key. This assumes that there is
                // no mixed case keys (e.g. "Content-Type" and "content-type") in the
                // headers object.
                const original = Object.keys(headers).find((o)=>o.toLowerCase() === lowercased);
                // If the original casing doesn't exist, return true.
                if (typeof original === "undefined") return true;
                // If the original casing exists, delete the property.
                return _reflect.ReflectAdapter.deleteProperty(target, original);
            }
        });
    }
    /**
   * Seals a Headers instance to prevent modification by throwing an error when
   * any mutating method is called.
   */ static seal(headers) {
        return new Proxy(headers, {
            get (target, prop, receiver) {
                switch(prop){
                    case "append":
                    case "delete":
                    case "set":
                        return ReadonlyHeadersError.callable;
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
    /**
   * Merges a header value into a string. This stores multiple values as an
   * array, so we need to merge them into a string.
   *
   * @param value a header value
   * @returns a merged header value (a string)
   */ merge(value) {
        if (Array.isArray(value)) return value.join(", ");
        return value;
    }
    /**
   * Creates a Headers instance from a plain object or a Headers instance.
   *
   * @param headers a plain object or a Headers instance
   * @returns a headers instance
   */ static from(headers) {
        if (headers instanceof Headers) return headers;
        return new HeadersAdapter(headers);
    }
    append(name, value) {
        const existing = this.headers[name];
        if (typeof existing === "string") {
            this.headers[name] = [
                existing,
                value
            ];
        } else if (Array.isArray(existing)) {
            existing.push(value);
        } else {
            this.headers[name] = value;
        }
    }
    delete(name) {
        delete this.headers[name];
    }
    get(name) {
        const value = this.headers[name];
        if (typeof value !== "undefined") return this.merge(value);
        return null;
    }
    has(name) {
        return typeof this.headers[name] !== "undefined";
    }
    set(name, value) {
        this.headers[name] = value;
    }
    forEach(callbackfn, thisArg) {
        for (const [name, value] of this.entries()){
            callbackfn.call(thisArg, value, name, this);
        }
    }
    *entries() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(name);
            yield [
                name,
                value
            ];
        }
    }
    *keys() {
        for (const key of Object.keys(this.headers)){
            const name = key.toLowerCase();
            yield name;
        }
    }
    *values() {
        for (const key of Object.keys(this.headers)){
            // We assert here that this is a string because we got it from the
            // Object.keys() call above.
            const value = this.get(key);
            yield value;
        }
    }
    [Symbol.iterator]() {
        return this.entries();
    }
} //# sourceMappingURL=headers.js.map


/***/ }),

/***/ 794:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "ReflectAdapter", ({
    enumerable: true,
    get: function() {
        return ReflectAdapter;
    }
}));
class ReflectAdapter {
    static get(target, prop, receiver) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === "function") {
            return value.bind(target);
        }
        return value;
    }
    static set(target, prop, value, receiver) {
        return Reflect.set(target, prop, value, receiver);
    }
    static has(target, prop) {
        return Reflect.has(target, prop);
    }
    static deleteProperty(target, prop) {
        return Reflect.deleteProperty(target, prop);
    }
} //# sourceMappingURL=reflect.js.map


/***/ }),

/***/ 9934:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    ReadonlyRequestCookiesError: function() {
        return ReadonlyRequestCookiesError;
    },
    RequestCookiesAdapter: function() {
        return RequestCookiesAdapter;
    },
    getModifiedCookieValues: function() {
        return getModifiedCookieValues;
    },
    appendMutableCookies: function() {
        return appendMutableCookies;
    },
    MutableRequestCookiesAdapter: function() {
        return MutableRequestCookiesAdapter;
    }
});
const _cookies = __webpack_require__(1220);
const _reflect = __webpack_require__(794);
class ReadonlyRequestCookiesError extends Error {
    constructor(){
        super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options");
    }
    static callable() {
        throw new ReadonlyRequestCookiesError();
    }
}
class RequestCookiesAdapter {
    static seal(cookies) {
        return new Proxy(cookies, {
            get (target, prop, receiver) {
                switch(prop){
                    case "clear":
                    case "delete":
                    case "set":
                        return ReadonlyRequestCookiesError.callable;
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
}
const SYMBOL_MODIFY_COOKIE_VALUES = Symbol.for("next.mutated.cookies");
function getModifiedCookieValues(cookies) {
    const modified = cookies[SYMBOL_MODIFY_COOKIE_VALUES];
    if (!modified || !Array.isArray(modified) || modified.length === 0) {
        return [];
    }
    return modified;
}
function appendMutableCookies(headers, mutableCookies) {
    const modifiedCookieValues = getModifiedCookieValues(mutableCookies);
    if (modifiedCookieValues.length === 0) {
        return false;
    }
    // Return a new response that extends the response with
    // the modified cookies as fallbacks. `res`' cookies
    // will still take precedence.
    const resCookies = new _cookies.ResponseCookies(headers);
    const returnedCookies = resCookies.getAll();
    // Set the modified cookies as fallbacks.
    for (const cookie of modifiedCookieValues){
        resCookies.set(cookie);
    }
    // Set the original cookies as the final values.
    for (const cookie of returnedCookies){
        resCookies.set(cookie);
    }
    return true;
}
class MutableRequestCookiesAdapter {
    static wrap(cookies, onUpdateCookies) {
        const responseCookes = new _cookies.ResponseCookies(new Headers());
        for (const cookie of cookies.getAll()){
            responseCookes.set(cookie);
        }
        let modifiedValues = [];
        const modifiedCookies = new Set();
        const updateResponseCookies = ()=>{
            var _fetch___nextGetStaticStore;
            // TODO-APP: change method of getting staticGenerationAsyncStore
            const staticGenerationAsyncStore = fetch.__nextGetStaticStore == null ? void 0 : (_fetch___nextGetStaticStore = fetch.__nextGetStaticStore()) == null ? void 0 : _fetch___nextGetStaticStore.getStore();
            if (staticGenerationAsyncStore) {
                staticGenerationAsyncStore.pathWasRevalidated = true;
            }
            const allCookies = responseCookes.getAll();
            modifiedValues = allCookies.filter((c)=>modifiedCookies.has(c.name));
            if (onUpdateCookies) {
                const serializedCookies = [];
                for (const cookie of modifiedValues){
                    const tempCookies = new _cookies.ResponseCookies(new Headers());
                    tempCookies.set(cookie);
                    serializedCookies.push(tempCookies.toString());
                }
                onUpdateCookies(serializedCookies);
            }
        };
        return new Proxy(responseCookes, {
            get (target, prop, receiver) {
                switch(prop){
                    // A special symbol to get the modified cookie values
                    case SYMBOL_MODIFY_COOKIE_VALUES:
                        return modifiedValues;
                    // TODO: Throw error if trying to set a cookie after the response
                    // headers have been set.
                    case "delete":
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                            try {
                                target.delete(...args);
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    case "set":
                        return function(...args) {
                            modifiedCookies.add(typeof args[0] === "string" ? args[0] : args[0].name);
                            try {
                                return target.set(...args);
                            } finally{
                                updateResponseCookies();
                            }
                        };
                    default:
                        return _reflect.ReflectAdapter.get(target, prop, receiver);
                }
            }
        });
    }
} //# sourceMappingURL=request-cookies.js.map


/***/ }),

/***/ 1220:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    RequestCookies: function() {
        return _cookies.RequestCookies;
    },
    ResponseCookies: function() {
        return _cookies.ResponseCookies;
    }
});
const _cookies = __webpack_require__(1749); //# sourceMappingURL=cookies.js.map


/***/ }),

/***/ 7099:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "NextResponse", ({
    enumerable: true,
    get: function() {
        return NextResponse;
    }
}));
const _nexturl = __webpack_require__(2284);
const _utils = __webpack_require__(8217);
const _cookies = __webpack_require__(1220);
const INTERNALS = Symbol("internal response");
const REDIRECTS = new Set([
    301,
    302,
    303,
    307,
    308
]);
function handleMiddlewareField(init, headers) {
    var _init_request;
    if (init == null ? void 0 : (_init_request = init.request) == null ? void 0 : _init_request.headers) {
        if (!(init.request.headers instanceof Headers)) {
            throw new Error("request.headers must be an instance of Headers");
        }
        const keys = [];
        for (const [key, value] of init.request.headers){
            headers.set("x-middleware-request-" + key, value);
            keys.push(key);
        }
        headers.set("x-middleware-override-headers", keys.join(","));
    }
}
class NextResponse extends Response {
    constructor(body, init = {}){
        super(body, init);
        this[INTERNALS] = {
            cookies: new _cookies.ResponseCookies(this.headers),
            url: init.url ? new _nexturl.NextURL(init.url, {
                headers: (0, _utils.toNodeOutgoingHttpHeaders)(this.headers),
                nextConfig: init.nextConfig
            }) : undefined
        };
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
        return {
            cookies: this.cookies,
            url: this.url,
            // rest of props come from Response
            body: this.body,
            bodyUsed: this.bodyUsed,
            headers: Object.fromEntries(this.headers),
            ok: this.ok,
            redirected: this.redirected,
            status: this.status,
            statusText: this.statusText,
            type: this.type
        };
    }
    get cookies() {
        return this[INTERNALS].cookies;
    }
    static json(body, init) {
        // @ts-expect-error This is not in lib/dom right now, and we can't augment it.
        const response = Response.json(body, init);
        return new NextResponse(response.body, response);
    }
    static redirect(url, init) {
        const status = typeof init === "number" ? init : (init == null ? void 0 : init.status) ?? 307;
        if (!REDIRECTS.has(status)) {
            throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        const initObj = typeof init === "object" ? init : {};
        const headers = new Headers(initObj == null ? void 0 : initObj.headers);
        headers.set("Location", (0, _utils.validateURL)(url));
        return new NextResponse(null, {
            ...initObj,
            headers,
            status
        });
    }
    static rewrite(destination, init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-rewrite", (0, _utils.validateURL)(destination));
        handleMiddlewareField(init, headers);
        return new NextResponse(null, {
            ...init,
            headers
        });
    }
    static next(init) {
        const headers = new Headers(init == null ? void 0 : init.headers);
        headers.set("x-middleware-next", "1");
        handleMiddlewareField(init, headers);
        return new NextResponse(null, {
            ...init,
            headers
        });
    }
} //# sourceMappingURL=response.js.map


/***/ }),

/***/ 8217:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
0 && (0);
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    fromNodeOutgoingHttpHeaders: function() {
        return fromNodeOutgoingHttpHeaders;
    },
    splitCookiesString: function() {
        return splitCookiesString;
    },
    toNodeOutgoingHttpHeaders: function() {
        return toNodeOutgoingHttpHeaders;
    },
    validateURL: function() {
        return validateURL;
    }
});
function fromNodeOutgoingHttpHeaders(nodeHeaders) {
    const headers = new Headers();
    for (let [key, value] of Object.entries(nodeHeaders)){
        const values = Array.isArray(value) ? value : [
            value
        ];
        for (let v of values){
            if (typeof v === "undefined") continue;
            if (typeof v === "number") {
                v = v.toString();
            }
            headers.append(key, v);
        }
    }
    return headers;
}
function splitCookiesString(cookiesString) {
    var cookiesStrings = [];
    var pos = 0;
    var start;
    var ch;
    var lastComma;
    var nextStart;
    var cookiesSeparatorFound;
    function skipWhitespace() {
        while(pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))){
            pos += 1;
        }
        return pos < cookiesString.length;
    }
    function notSpecialChar() {
        ch = cookiesString.charAt(pos);
        return ch !== "=" && ch !== ";" && ch !== ",";
    }
    while(pos < cookiesString.length){
        start = pos;
        cookiesSeparatorFound = false;
        while(skipWhitespace()){
            ch = cookiesString.charAt(pos);
            if (ch === ",") {
                // ',' is a cookie separator if we have later first '=', not ';' or ','
                lastComma = pos;
                pos += 1;
                skipWhitespace();
                nextStart = pos;
                while(pos < cookiesString.length && notSpecialChar()){
                    pos += 1;
                }
                // currently special character
                if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
                    // we found cookies separator
                    cookiesSeparatorFound = true;
                    // pos is inside the next cookie, so back up and return it.
                    pos = nextStart;
                    cookiesStrings.push(cookiesString.substring(start, lastComma));
                    start = pos;
                } else {
                    // in param ',' or param separator ';',
                    // we continue from that comma
                    pos = lastComma + 1;
                }
            } else {
                pos += 1;
            }
        }
        if (!cookiesSeparatorFound || pos >= cookiesString.length) {
            cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
        }
    }
    return cookiesStrings;
}
function toNodeOutgoingHttpHeaders(headers) {
    const nodeHeaders = {};
    const cookies = [];
    if (headers) {
        for (const [key, value] of headers.entries()){
            if (key.toLowerCase() === "set-cookie") {
                // We may have gotten a comma joined string of cookies, or multiple
                // set-cookie headers. We need to merge them into one header array
                // to represent all the cookies.
                cookies.push(...splitCookiesString(value));
                nodeHeaders[key] = cookies.length === 1 ? cookies[0] : cookies;
            } else {
                nodeHeaders[key] = value;
            }
        }
    }
    return nodeHeaders;
}
function validateURL(url) {
    try {
        return String(new URL(String(url)));
    } catch (error) {
        throw new Error(`URL is malformed "${String(url)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, {
            cause: error
        });
    }
} //# sourceMappingURL=utils.js.map


/***/ }),

/***/ 2661:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "getHostname", ({
    enumerable: true,
    get: function() {
        return getHostname;
    }
}));
function getHostname(parsed, headers) {
    // Get the hostname from the headers if it exists, otherwise use the parsed
    // hostname.
    let hostname;
    if ((headers == null ? void 0 : headers.host) && !Array.isArray(headers.host)) {
        hostname = headers.host.toString().split(":")[0];
    } else if (parsed.hostname) {
        hostname = parsed.hostname;
    } else return;
    return hostname.toLowerCase();
} //# sourceMappingURL=get-hostname.js.map


/***/ }),

/***/ 2080:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "detectDomainLocale", ({
    enumerable: true,
    get: function() {
        return detectDomainLocale;
    }
}));
function detectDomainLocale(domainItems, hostname, detectedLocale) {
    if (!domainItems) return;
    if (detectedLocale) {
        detectedLocale = detectedLocale.toLowerCase();
    }
    for (const item of domainItems){
        var _item_domain, _item_locales;
        // remove port if present
        const domainHostname = (_item_domain = item.domain) == null ? void 0 : _item_domain.split(":")[0].toLowerCase();
        if (hostname === domainHostname || detectedLocale === item.defaultLocale.toLowerCase() || ((_item_locales = item.locales) == null ? void 0 : _item_locales.some((locale)=>locale.toLowerCase() === detectedLocale))) {
            return item;
        }
    }
} //# sourceMappingURL=detect-domain-locale.js.map


/***/ }),

/***/ 7415:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "normalizeLocalePath", ({
    enumerable: true,
    get: function() {
        return normalizeLocalePath;
    }
}));
function normalizeLocalePath(pathname, locales) {
    let detectedLocale;
    // first item will be empty string from splitting at first char
    const pathnameParts = pathname.split("/");
    (locales || []).some((locale)=>{
        if (pathnameParts[1] && pathnameParts[1].toLowerCase() === locale.toLowerCase()) {
            detectedLocale = locale;
            pathnameParts.splice(1, 1);
            pathname = pathnameParts.join("/") || "/";
            return true;
        }
        return false;
    });
    return {
        pathname,
        detectedLocale
    };
} //# sourceMappingURL=normalize-locale-path.js.map


/***/ }),

/***/ 4022:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "addLocale", ({
    enumerable: true,
    get: function() {
        return addLocale;
    }
}));
const _addpathprefix = __webpack_require__(9970);
const _pathhasprefix = __webpack_require__(3676);
function addLocale(path, locale, defaultLocale, ignorePrefix) {
    // If no locale was given or the locale is the default locale, we don't need
    // to prefix the path.
    if (!locale || locale === defaultLocale) return path;
    const lower = path.toLowerCase();
    // If the path is an API path or the path already has the locale prefix, we
    // don't need to prefix the path.
    if (!ignorePrefix) {
        if ((0, _pathhasprefix.pathHasPrefix)(lower, "/api")) return path;
        if ((0, _pathhasprefix.pathHasPrefix)(lower, "/" + locale.toLowerCase())) return path;
    }
    // Add the locale prefix to the path.
    return (0, _addpathprefix.addPathPrefix)(path, "/" + locale);
} //# sourceMappingURL=add-locale.js.map


/***/ }),

/***/ 9970:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "addPathPrefix", ({
    enumerable: true,
    get: function() {
        return addPathPrefix;
    }
}));
const _parsepath = __webpack_require__(4640);
function addPathPrefix(path, prefix) {
    if (!path.startsWith("/") || !prefix) {
        return path;
    }
    const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
    return "" + prefix + pathname + query + hash;
} //# sourceMappingURL=add-path-prefix.js.map


/***/ }),

/***/ 6995:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "addPathSuffix", ({
    enumerable: true,
    get: function() {
        return addPathSuffix;
    }
}));
const _parsepath = __webpack_require__(4640);
function addPathSuffix(path, suffix) {
    if (!path.startsWith("/") || !suffix) {
        return path;
    }
    const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
    return "" + pathname + suffix + query + hash;
} //# sourceMappingURL=add-path-suffix.js.map


/***/ }),

/***/ 4714:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "formatNextPathnameInfo", ({
    enumerable: true,
    get: function() {
        return formatNextPathnameInfo;
    }
}));
const _removetrailingslash = __webpack_require__(468);
const _addpathprefix = __webpack_require__(9970);
const _addpathsuffix = __webpack_require__(6995);
const _addlocale = __webpack_require__(4022);
function formatNextPathnameInfo(info) {
    let pathname = (0, _addlocale.addLocale)(info.pathname, info.locale, info.buildId ? undefined : info.defaultLocale, info.ignorePrefix);
    if (info.buildId || !info.trailingSlash) {
        pathname = (0, _removetrailingslash.removeTrailingSlash)(pathname);
    }
    if (info.buildId) {
        pathname = (0, _addpathsuffix.addPathSuffix)((0, _addpathprefix.addPathPrefix)(pathname, "/_next/data/" + info.buildId), info.pathname === "/" ? "index.json" : ".json");
    }
    pathname = (0, _addpathprefix.addPathPrefix)(pathname, info.basePath);
    return !info.buildId && info.trailingSlash ? !pathname.endsWith("/") ? (0, _addpathsuffix.addPathSuffix)(pathname, "/") : pathname : (0, _removetrailingslash.removeTrailingSlash)(pathname);
} //# sourceMappingURL=format-next-pathname-info.js.map


/***/ }),

/***/ 2669:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "getNextPathnameInfo", ({
    enumerable: true,
    get: function() {
        return getNextPathnameInfo;
    }
}));
const _normalizelocalepath = __webpack_require__(7415);
const _removepathprefix = __webpack_require__(7656);
const _pathhasprefix = __webpack_require__(3676);
function getNextPathnameInfo(pathname, options) {
    var _options_nextConfig;
    const { basePath, i18n, trailingSlash } = (_options_nextConfig = options.nextConfig) != null ? _options_nextConfig : {};
    const info = {
        pathname: pathname,
        trailingSlash: pathname !== "/" ? pathname.endsWith("/") : trailingSlash
    };
    if (basePath && (0, _pathhasprefix.pathHasPrefix)(info.pathname, basePath)) {
        info.pathname = (0, _removepathprefix.removePathPrefix)(info.pathname, basePath);
        info.basePath = basePath;
    }
    if (options.parseData === true && info.pathname.startsWith("/_next/data/") && info.pathname.endsWith(".json")) {
        const paths = info.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
        const buildId = paths[0];
        info.pathname = paths[1] !== "index" ? "/" + paths.slice(1).join("/") : "/";
        info.buildId = buildId;
    }
    // If provided, use the locale route normalizer to detect the locale instead
    // of the function below.
    if (options.i18nProvider) {
        const result = options.i18nProvider.analyze(info.pathname);
        info.locale = result.detectedLocale;
        var _result_pathname;
        info.pathname = (_result_pathname = result.pathname) != null ? _result_pathname : info.pathname;
    } else if (i18n) {
        const pathLocale = (0, _normalizelocalepath.normalizeLocalePath)(info.pathname, i18n.locales);
        info.locale = pathLocale.detectedLocale;
        var _pathLocale_pathname;
        info.pathname = (_pathLocale_pathname = pathLocale.pathname) != null ? _pathLocale_pathname : info.pathname;
    }
    return info;
} //# sourceMappingURL=get-next-pathname-info.js.map


/***/ }),

/***/ 4640:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * Given a path this function will find the pathname, query and hash and return
 * them. This is useful to parse full paths on the client side.
 * @param path A path to parse e.g. /foo/bar?id=1#hash
 */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "parsePath", ({
    enumerable: true,
    get: function() {
        return parsePath;
    }
}));
function parsePath(path) {
    const hashIndex = path.indexOf("#");
    const queryIndex = path.indexOf("?");
    const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
    if (hasQuery || hashIndex > -1) {
        return {
            pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
            query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : undefined) : "",
            hash: hashIndex > -1 ? path.slice(hashIndex) : ""
        };
    }
    return {
        pathname: path,
        query: "",
        hash: ""
    };
} //# sourceMappingURL=parse-path.js.map


/***/ }),

/***/ 3676:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "pathHasPrefix", ({
    enumerable: true,
    get: function() {
        return pathHasPrefix;
    }
}));
const _parsepath = __webpack_require__(4640);
function pathHasPrefix(path, prefix) {
    if (typeof path !== "string") {
        return false;
    }
    const { pathname } = (0, _parsepath.parsePath)(path);
    return pathname === prefix || pathname.startsWith(prefix + "/");
} //# sourceMappingURL=path-has-prefix.js.map


/***/ }),

/***/ 7656:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "removePathPrefix", ({
    enumerable: true,
    get: function() {
        return removePathPrefix;
    }
}));
const _pathhasprefix = __webpack_require__(3676);
function removePathPrefix(path, prefix) {
    // If the path doesn't start with the prefix we can return it as is. This
    // protects us from situations where the prefix is a substring of the path
    // prefix such as:
    //
    // For prefix: /blog
    //
    //   /blog -> true
    //   /blog/ -> true
    //   /blog/1 -> true
    //   /blogging -> false
    //   /blogging/ -> false
    //   /blogging/1 -> false
    if (!(0, _pathhasprefix.pathHasPrefix)(path, prefix)) {
        return path;
    }
    // Remove the prefix from the path via slicing.
    const withoutPrefix = path.slice(prefix.length);
    // If the path without the prefix starts with a `/` we can return it as is.
    if (withoutPrefix.startsWith("/")) {
        return withoutPrefix;
    }
    // If the path without the prefix doesn't start with a `/` we need to add it
    // back to the path to make sure it's a valid path.
    return "/" + withoutPrefix;
} //# sourceMappingURL=remove-path-prefix.js.map


/***/ }),

/***/ 468:
/***/ ((__unused_webpack_module, exports) => {

"use strict";
/**
 * Removes the trailing slash for a given route or page path. Preserves the
 * root page. Examples:
 *   - `/foo/bar/` -> `/foo/bar`
 *   - `/foo/bar` -> `/foo/bar`
 *   - `/` -> `/`
 */ 
Object.defineProperty(exports, "__esModule", ({
    value: true
}));
Object.defineProperty(exports, "removeTrailingSlash", ({
    enumerable: true,
    get: function() {
        return removeTrailingSlash;
    }
}));
function removeTrailingSlash(route) {
    return route.replace(/\/$/, "") || "/";
} //# sourceMappingURL=remove-trailing-slash.js.map


/***/ }),

/***/ 3625:
/***/ ((module) => {

"use strict";

/**
 * Converts tokens for a single address into an address object
 *
 * @param {Array} tokens Tokens object
 * @return {Object} Address object
 */ function _handleAddress(tokens) {
    let token;
    let isGroup = false;
    let state = "text";
    let address;
    let addresses = [];
    let data = {
        address: [],
        comment: [],
        group: [],
        text: []
    };
    let i;
    let len;
    // Filter out <addresses>, (comments) and regular text
    for(i = 0, len = tokens.length; i < len; i++){
        token = tokens[i];
        if (token.type === "operator") {
            switch(token.value){
                case "<":
                    state = "address";
                    break;
                case "(":
                    state = "comment";
                    break;
                case ":":
                    state = "group";
                    isGroup = true;
                    break;
                default:
                    state = "text";
            }
        } else if (token.value) {
            if (state === "address") {
                // handle use case where unquoted name includes a "<"
                // Apple Mail truncates everything between an unexpected < and an address
                // and so will we
                token.value = token.value.replace(/^[^<]*<\s*/, "");
            }
            data[state].push(token.value);
        }
    }
    // If there is no text but a comment, replace the two
    if (!data.text.length && data.comment.length) {
        data.text = data.comment;
        data.comment = [];
    }
    if (isGroup) {
        // http://tools.ietf.org/html/rfc2822#appendix-A.1.3
        data.text = data.text.join(" ");
        addresses.push({
            name: data.text || address && address.name,
            group: data.group.length ? addressparser(data.group.join(",")) : []
        });
    } else {
        // If no address was found, try to detect one from regular text
        if (!data.address.length && data.text.length) {
            for(i = data.text.length - 1; i >= 0; i--){
                if (data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
                    data.address = data.text.splice(i, 1);
                    break;
                }
            }
            let _regexHandler = function(address) {
                if (!data.address.length) {
                    data.address = [
                        address.trim()
                    ];
                    return " ";
                } else {
                    return address;
                }
            };
            // still no address
            if (!data.address.length) {
                for(i = data.text.length - 1; i >= 0; i--){
                    // fixed the regex to parse email address correctly when email address has more than one @
                    data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
                    if (data.address.length) {
                        break;
                    }
                }
            }
        }
        // If there's still is no text but a comment exixts, replace the two
        if (!data.text.length && data.comment.length) {
            data.text = data.comment;
            data.comment = [];
        }
        // Keep only the first address occurence, push others to regular text
        if (data.address.length > 1) {
            data.text = data.text.concat(data.address.splice(1));
        }
        // Join values with spaces
        data.text = data.text.join(" ");
        data.address = data.address.join(" ");
        if (!data.address && isGroup) {
            return [];
        } else {
            address = {
                address: data.address || data.text || "",
                name: data.text || data.address || ""
            };
            if (address.address === address.name) {
                if ((address.address || "").match(/@/)) {
                    address.name = "";
                } else {
                    address.address = "";
                }
            }
            addresses.push(address);
        }
    }
    return addresses;
}
/**
 * Creates a Tokenizer object for tokenizing address field strings
 *
 * @constructor
 * @param {String} str Address field string
 */ class Tokenizer {
    constructor(str){
        this.str = (str || "").toString();
        this.operatorCurrent = "";
        this.operatorExpecting = "";
        this.node = null;
        this.escaped = false;
        this.list = [];
        /**
         * Operator tokens and which tokens are expected to end the sequence
         */ this.operators = {
            '"': '"',
            "(": ")",
            "<": ">",
            ",": "",
            ":": ";",
            // Semicolons are not a legal delimiter per the RFC2822 grammar other
            // than for terminating a group, but they are also not valid for any
            // other use in this context.  Given that some mail clients have
            // historically allowed the semicolon as a delimiter equivalent to the
            // comma in their UI, it makes sense to treat them the same as a comma
            // when used outside of a group.
            ";": ""
        };
    }
    /**
     * Tokenizes the original input string
     *
     * @return {Array} An array of operator|text tokens
     */ tokenize() {
        let chr, list = [];
        for(let i = 0, len = this.str.length; i < len; i++){
            chr = this.str.charAt(i);
            this.checkChar(chr);
        }
        this.list.forEach((node)=>{
            node.value = (node.value || "").toString().trim();
            if (node.value) {
                list.push(node);
            }
        });
        return list;
    }
    /**
     * Checks if a character is an operator or text and acts accordingly
     *
     * @param {String} chr Character from the address field
     */ checkChar(chr) {
        if (this.escaped) {
        // ignore next condition blocks
        } else if (chr === this.operatorExpecting) {
            this.node = {
                type: "operator",
                value: chr
            };
            this.list.push(this.node);
            this.node = null;
            this.operatorExpecting = "";
            this.escaped = false;
            return;
        } else if (!this.operatorExpecting && chr in this.operators) {
            this.node = {
                type: "operator",
                value: chr
            };
            this.list.push(this.node);
            this.node = null;
            this.operatorExpecting = this.operators[chr];
            this.escaped = false;
            return;
        } else if ([
            '"',
            "'"
        ].includes(this.operatorExpecting) && chr === "\\") {
            this.escaped = true;
            return;
        }
        if (!this.node) {
            this.node = {
                type: "text",
                value: ""
            };
            this.list.push(this.node);
        }
        if (chr === "\n") {
            // Convert newlines to spaces. Carriage return is ignored as \r and \n usually
            // go together anyway and there already is a WS for \n. Lone \r means something is fishy.
            chr = " ";
        }
        if (chr.charCodeAt(0) >= 0x21 || [
            " ",
            "	"
        ].includes(chr)) {
            // skip command bytes
            this.node.value += chr;
        }
        this.escaped = false;
    }
}
/**
 * Parses structured e-mail addresses from an address field
 *
 * Example:
 *
 *    'Name <address@domain>'
 *
 * will be converted to
 *
 *     [{name: 'Name', address: 'address@domain'}]
 *
 * @param {String} str Address field
 * @return {Array} An array of address objects
 */ function addressparser(str, options) {
    options = options || {};
    let tokenizer = new Tokenizer(str);
    let tokens = tokenizer.tokenize();
    let addresses = [];
    let address = [];
    let parsedAddresses = [];
    tokens.forEach((token)=>{
        if (token.type === "operator" && (token.value === "," || token.value === ";")) {
            if (address.length) {
                addresses.push(address);
            }
            address = [];
        } else {
            address.push(token);
        }
    });
    if (address.length) {
        addresses.push(address);
    }
    addresses.forEach((address)=>{
        address = _handleAddress(address);
        if (address.length) {
            parsedAddresses = parsedAddresses.concat(address);
        }
    });
    if (options.flatten) {
        let addresses = [];
        let walkAddressList = (list)=>{
            list.forEach((address)=>{
                if (address.group) {
                    return walkAddressList(address.group);
                } else {
                    addresses.push(address);
                }
            });
        };
        walkAddressList(parsedAddresses);
        return addresses;
    }
    return parsedAddresses;
}
// expose to the world
module.exports = addressparser;


/***/ }),

/***/ 4806:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Transform = (__webpack_require__(2781).Transform);
/**
 * Encodes a Buffer into a base64 encoded string
 *
 * @param {Buffer} buffer Buffer to convert
 * @returns {String} base64 encoded string
 */ function encode(buffer) {
    if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "utf-8");
    }
    return buffer.toString("base64");
}
/**
 * Adds soft line breaks to a base64 string
 *
 * @param {String} str base64 encoded string that might need line wrapping
 * @param {Number} [lineLength=76] Maximum allowed length for a line
 * @returns {String} Soft-wrapped base64 encoded string
 */ function wrap(str, lineLength) {
    str = (str || "").toString();
    lineLength = lineLength || 76;
    if (str.length <= lineLength) {
        return str;
    }
    let result = [];
    let pos = 0;
    let chunkLength = lineLength * 1024;
    while(pos < str.length){
        let wrappedLines = str.substr(pos, chunkLength).replace(new RegExp(".{" + lineLength + "}", "g"), "$&\r\n").trim();
        result.push(wrappedLines);
        pos += chunkLength;
    }
    return result.join("\r\n").trim();
}
/**
 * Creates a transform stream for encoding data to base64 encoding
 *
 * @constructor
 * @param {Object} options Stream options
 * @param {Number} [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
 */ class Encoder extends Transform {
    constructor(options){
        super();
        // init Transform
        this.options = options || {};
        if (this.options.lineLength !== false) {
            this.options.lineLength = this.options.lineLength || 76;
        }
        this._curLine = "";
        this._remainingBytes = false;
        this.inputBytes = 0;
        this.outputBytes = 0;
    }
    _transform(chunk, encoding, done) {
        if (encoding !== "buffer") {
            chunk = Buffer.from(chunk, encoding);
        }
        if (!chunk || !chunk.length) {
            return setImmediate(done);
        }
        this.inputBytes += chunk.length;
        if (this._remainingBytes && this._remainingBytes.length) {
            chunk = Buffer.concat([
                this._remainingBytes,
                chunk
            ], this._remainingBytes.length + chunk.length);
            this._remainingBytes = false;
        }
        if (chunk.length % 3) {
            this._remainingBytes = chunk.slice(chunk.length - chunk.length % 3);
            chunk = chunk.slice(0, chunk.length - chunk.length % 3);
        } else {
            this._remainingBytes = false;
        }
        let b64 = this._curLine + encode(chunk);
        if (this.options.lineLength) {
            b64 = wrap(b64, this.options.lineLength);
            // remove last line as it is still most probably incomplete
            let lastLF = b64.lastIndexOf("\n");
            if (lastLF < 0) {
                this._curLine = b64;
                b64 = "";
            } else if (lastLF === b64.length - 1) {
                this._curLine = "";
            } else {
                this._curLine = b64.substr(lastLF + 1);
                b64 = b64.substr(0, lastLF + 1);
            }
        }
        if (b64) {
            this.outputBytes += b64.length;
            this.push(Buffer.from(b64, "ascii"));
        }
        setImmediate(done);
    }
    _flush(done) {
        if (this._remainingBytes && this._remainingBytes.length) {
            this._curLine += encode(this._remainingBytes);
        }
        if (this._curLine) {
            this._curLine = wrap(this._curLine, this.options.lineLength);
            this.outputBytes += this._curLine.length;
            this.push(this._curLine, "ascii");
            this._curLine = "";
        }
        done();
    }
}
// expose to the world
module.exports = {
    encode,
    wrap,
    Encoder
};


/***/ }),

/***/ 6732:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// FIXME:
// replace this Transform mess with a method that pipes input argument to output argument
const MessageParser = __webpack_require__(1079);
const RelaxedBody = __webpack_require__(4297);
const sign = __webpack_require__(714);
const PassThrough = (__webpack_require__(2781).PassThrough);
const fs = __webpack_require__(7147);
const path = __webpack_require__(1017);
const crypto = __webpack_require__(6113);
const DKIM_ALGO = "sha256";
const MAX_MESSAGE_SIZE = 128 * 1024; // buffer messages larger than this to disk
/*
// Usage:

let dkim = new DKIM({
    domainName: 'example.com',
    keySelector: 'key-selector',
    privateKey,
    cacheDir: '/tmp'
});
dkim.sign(input).pipe(process.stdout);

// Where inputStream is a rfc822 message (either a stream, string or Buffer)
// and outputStream is a DKIM signed rfc822 message
*/ class DKIMSigner {
    constructor(options, keys, input, output){
        this.options = options || {};
        this.keys = keys;
        this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE;
        this.hashAlgo = this.options.hashAlgo || DKIM_ALGO;
        this.cacheDir = this.options.cacheDir || false;
        this.chunks = [];
        this.chunklen = 0;
        this.readPos = 0;
        this.cachePath = this.cacheDir ? path.join(this.cacheDir, "message." + Date.now() + "-" + crypto.randomBytes(14).toString("hex")) : false;
        this.cache = false;
        this.headers = false;
        this.bodyHash = false;
        this.parser = false;
        this.relaxedBody = false;
        this.input = input;
        this.output = output;
        this.output.usingCache = false;
        this.hasErrored = false;
        this.input.on("error", (err)=>{
            this.hasErrored = true;
            this.cleanup();
            output.emit("error", err);
        });
    }
    cleanup() {
        if (!this.cache || !this.cachePath) {
            return;
        }
        fs.unlink(this.cachePath, ()=>false);
    }
    createReadCache() {
        // pipe remainings to cache file
        this.cache = fs.createReadStream(this.cachePath);
        this.cache.once("error", (err)=>{
            this.cleanup();
            this.output.emit("error", err);
        });
        this.cache.once("close", ()=>{
            this.cleanup();
        });
        this.cache.pipe(this.output);
    }
    sendNextChunk() {
        if (this.hasErrored) {
            return;
        }
        if (this.readPos >= this.chunks.length) {
            if (!this.cache) {
                return this.output.end();
            }
            return this.createReadCache();
        }
        let chunk = this.chunks[this.readPos++];
        if (this.output.write(chunk) === false) {
            return this.output.once("drain", ()=>{
                this.sendNextChunk();
            });
        }
        setImmediate(()=>this.sendNextChunk());
    }
    sendSignedOutput() {
        let keyPos = 0;
        let signNextKey = ()=>{
            if (keyPos >= this.keys.length) {
                this.output.write(this.parser.rawHeaders);
                return setImmediate(()=>this.sendNextChunk());
            }
            let key = this.keys[keyPos++];
            let dkimField = sign(this.headers, this.hashAlgo, this.bodyHash, {
                domainName: key.domainName,
                keySelector: key.keySelector,
                privateKey: key.privateKey,
                headerFieldNames: this.options.headerFieldNames,
                skipFields: this.options.skipFields
            });
            if (dkimField) {
                this.output.write(Buffer.from(dkimField + "\r\n"));
            }
            return setImmediate(signNextKey);
        };
        if (this.bodyHash && this.headers) {
            return signNextKey();
        }
        this.output.write(this.parser.rawHeaders);
        this.sendNextChunk();
    }
    createWriteCache() {
        this.output.usingCache = true;
        // pipe remainings to cache file
        this.cache = fs.createWriteStream(this.cachePath);
        this.cache.once("error", (err)=>{
            this.cleanup();
            // drain input
            this.relaxedBody.unpipe(this.cache);
            this.relaxedBody.on("readable", ()=>{
                while(this.relaxedBody.read() !== null){
                // do nothing
                }
            });
            this.hasErrored = true;
            // emit error
            this.output.emit("error", err);
        });
        this.cache.once("close", ()=>{
            this.sendSignedOutput();
        });
        this.relaxedBody.removeAllListeners("readable");
        this.relaxedBody.pipe(this.cache);
    }
    signStream() {
        this.parser = new MessageParser();
        this.relaxedBody = new RelaxedBody({
            hashAlgo: this.hashAlgo
        });
        this.parser.on("headers", (value)=>{
            this.headers = value;
        });
        this.relaxedBody.on("hash", (value)=>{
            this.bodyHash = value;
        });
        this.relaxedBody.on("readable", ()=>{
            let chunk;
            if (this.cache) {
                return;
            }
            while((chunk = this.relaxedBody.read()) !== null){
                this.chunks.push(chunk);
                this.chunklen += chunk.length;
                if (this.chunklen >= this.cacheTreshold && this.cachePath) {
                    return this.createWriteCache();
                }
            }
        });
        this.relaxedBody.on("end", ()=>{
            if (this.cache) {
                return;
            }
            this.sendSignedOutput();
        });
        this.parser.pipe(this.relaxedBody);
        setImmediate(()=>this.input.pipe(this.parser));
    }
}
class DKIM {
    constructor(options){
        this.options = options || {};
        this.keys = [].concat(this.options.keys || {
            domainName: options.domainName,
            keySelector: options.keySelector,
            privateKey: options.privateKey
        });
    }
    sign(input, extraOptions) {
        let output = new PassThrough();
        let inputStream = input;
        let writeValue = false;
        if (Buffer.isBuffer(input)) {
            writeValue = input;
            inputStream = new PassThrough();
        } else if (typeof input === "string") {
            writeValue = Buffer.from(input);
            inputStream = new PassThrough();
        }
        let options = this.options;
        if (extraOptions && Object.keys(extraOptions).length) {
            options = {};
            Object.keys(this.options || {}).forEach((key)=>{
                options[key] = this.options[key];
            });
            Object.keys(extraOptions || {}).forEach((key)=>{
                if (!(key in options)) {
                    options[key] = extraOptions[key];
                }
            });
        }
        let signer = new DKIMSigner(options, this.keys, inputStream, output);
        setImmediate(()=>{
            signer.signStream();
            if (writeValue) {
                setImmediate(()=>{
                    inputStream.end(writeValue);
                });
            }
        });
        return output;
    }
}
module.exports = DKIM;


/***/ }),

/***/ 1079:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Transform = (__webpack_require__(2781).Transform);
/**
 * MessageParser instance is a transform stream that separates message headers
 * from the rest of the body. Headers are emitted with the 'headers' event. Message
 * body is passed on as the resulting stream.
 */ class MessageParser extends Transform {
    constructor(options){
        super(options);
        this.lastBytes = Buffer.alloc(4);
        this.headersParsed = false;
        this.headerBytes = 0;
        this.headerChunks = [];
        this.rawHeaders = false;
        this.bodySize = 0;
    }
    /**
     * Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
     *
     * @param {Buffer} data Next data chunk from the stream
     */ updateLastBytes(data) {
        let lblen = this.lastBytes.length;
        let nblen = Math.min(data.length, lblen);
        // shift existing bytes
        for(let i = 0, len = lblen - nblen; i < len; i++){
            this.lastBytes[i] = this.lastBytes[i + nblen];
        }
        // add new bytes
        for(let i = 1; i <= nblen; i++){
            this.lastBytes[lblen - i] = data[data.length - i];
        }
    }
    /**
     * Finds and removes message headers from the remaining body. We want to keep
     * headers separated until final delivery to be able to modify these
     *
     * @param {Buffer} data Next chunk of data
     * @return {Boolean} Returns true if headers are already found or false otherwise
     */ checkHeaders(data) {
        if (this.headersParsed) {
            return true;
        }
        let lblen = this.lastBytes.length;
        let headerPos = 0;
        this.curLinePos = 0;
        for(let i = 0, len = this.lastBytes.length + data.length; i < len; i++){
            let chr;
            if (i < lblen) {
                chr = this.lastBytes[i];
            } else {
                chr = data[i - lblen];
            }
            if (chr === 0x0a && i) {
                let pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen];
                let pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : false;
                if (pr1 === 0x0a) {
                    this.headersParsed = true;
                    headerPos = i - lblen + 1;
                    this.headerBytes += headerPos;
                    break;
                } else if (pr1 === 0x0d && pr2 === 0x0a) {
                    this.headersParsed = true;
                    headerPos = i - lblen + 1;
                    this.headerBytes += headerPos;
                    break;
                }
            }
        }
        if (this.headersParsed) {
            this.headerChunks.push(data.slice(0, headerPos));
            this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
            this.headerChunks = null;
            this.emit("headers", this.parseHeaders());
            if (data.length - 1 > headerPos) {
                let chunk = data.slice(headerPos);
                this.bodySize += chunk.length;
                // this would be the first chunk of data sent downstream
                setImmediate(()=>this.push(chunk));
            }
            return false;
        } else {
            this.headerBytes += data.length;
            this.headerChunks.push(data);
        }
        // store last 4 bytes to catch header break
        this.updateLastBytes(data);
        return false;
    }
    _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length) {
            return callback();
        }
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk, encoding);
        }
        let headersFound;
        try {
            headersFound = this.checkHeaders(chunk);
        } catch (E) {
            return callback(E);
        }
        if (headersFound) {
            this.bodySize += chunk.length;
            this.push(chunk);
        }
        setImmediate(callback);
    }
    _flush(callback) {
        if (this.headerChunks) {
            let chunk = Buffer.concat(this.headerChunks, this.headerBytes);
            this.bodySize += chunk.length;
            this.push(chunk);
            this.headerChunks = null;
        }
        callback();
    }
    parseHeaders() {
        let lines = (this.rawHeaders || "").toString().split(/\r?\n/);
        for(let i = lines.length - 1; i > 0; i--){
            if (/^\s/.test(lines[i])) {
                lines[i - 1] += "\n" + lines[i];
                lines.splice(i, 1);
            }
        }
        return lines.filter((line)=>line.trim()).map((line)=>({
                key: line.substr(0, line.indexOf(":")).trim().toLowerCase(),
                line
            }));
    }
}
module.exports = MessageParser;


/***/ }),

/***/ 4297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// streams through a message body and calculates relaxed body hash
const Transform = (__webpack_require__(2781).Transform);
const crypto = __webpack_require__(6113);
class RelaxedBody extends Transform {
    constructor(options){
        super();
        options = options || {};
        this.chunkBuffer = [];
        this.chunkBufferLen = 0;
        this.bodyHash = crypto.createHash(options.hashAlgo || "sha1");
        this.remainder = "";
        this.byteLength = 0;
        this.debug = options.debug;
        this._debugBody = options.debug ? [] : false;
    }
    updateHash(chunk) {
        let bodyStr;
        // find next remainder
        let nextRemainder = "";
        // This crux finds and removes the spaces from the last line and the newline characters after the last non-empty line
        // If we get another chunk that does not match this description then we can restore the previously processed data
        let state = "file";
        for(let i = chunk.length - 1; i >= 0; i--){
            let c = chunk[i];
            if (state === "file" && (c === 0x0a || c === 0x0d)) {
            // do nothing, found \n or \r at the end of chunk, stil end of file
            } else if (state === "file" && (c === 0x09 || c === 0x20)) {
                // switch to line ending mode, this is the last non-empty line
                state = "line";
            } else if (state === "line" && (c === 0x09 || c === 0x20)) {
            // do nothing, found ' ' or \t at the end of line, keep processing the last non-empty line
            } else if (state === "file" || state === "line") {
                // non line/file ending character found, switch to body mode
                state = "body";
                if (i === chunk.length - 1) {
                    break;
                }
            }
            if (i === 0) {
                // reached to the beginning of the chunk, check if it is still about the ending
                // and if the remainder also matches
                if (state === "file" && (!this.remainder || /[\r\n]$/.test(this.remainder)) || state === "line" && (!this.remainder || /[ \t]$/.test(this.remainder))) {
                    // keep everything
                    this.remainder += chunk.toString("binary");
                    return;
                } else if (state === "line" || state === "file") {
                    // process existing remainder as normal line but store the current chunk
                    nextRemainder = chunk.toString("binary");
                    chunk = false;
                    break;
                }
            }
            if (state !== "body") {
                continue;
            }
            // reached first non ending byte
            nextRemainder = chunk.slice(i + 1).toString("binary");
            chunk = chunk.slice(0, i + 1);
            break;
        }
        let needsFixing = !!this.remainder;
        if (chunk && !needsFixing) {
            // check if we even need to change anything
            for(let i = 0, len = chunk.length; i < len; i++){
                if (i && chunk[i] === 0x0a && chunk[i - 1] !== 0x0d) {
                    // missing \r before \n
                    needsFixing = true;
                    break;
                } else if (i && chunk[i] === 0x0d && chunk[i - 1] === 0x20) {
                    // trailing WSP found
                    needsFixing = true;
                    break;
                } else if (i && chunk[i] === 0x20 && chunk[i - 1] === 0x20) {
                    // multiple spaces found, needs to be replaced with just one
                    needsFixing = true;
                    break;
                } else if (chunk[i] === 0x09) {
                    // TAB found, needs to be replaced with a space
                    needsFixing = true;
                    break;
                }
            }
        }
        if (needsFixing) {
            bodyStr = this.remainder + (chunk ? chunk.toString("binary") : "");
            this.remainder = nextRemainder;
            bodyStr = bodyStr.replace(/\r?\n/g, "\n") // use js line endings
            .replace(/[ \t]*$/gm, "") // remove line endings, rtrim
            .replace(/[ \t]+/gm, " ") // single spaces
            .replace(/\n/g, "\r\n"); // restore rfc822 line endings
            chunk = Buffer.from(bodyStr, "binary");
        } else if (nextRemainder) {
            this.remainder = nextRemainder;
        }
        if (this.debug) {
            this._debugBody.push(chunk);
        }
        this.bodyHash.update(chunk);
    }
    _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length) {
            return callback();
        }
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk, encoding);
        }
        this.updateHash(chunk);
        this.byteLength += chunk.length;
        this.push(chunk);
        callback();
    }
    _flush(callback) {
        // generate final hash and emit it
        if (/[\r\n]$/.test(this.remainder) && this.byteLength > 2) {
            // add terminating line end
            this.bodyHash.update(Buffer.from("\r\n"));
        }
        if (!this.byteLength) {
            // emit empty line buffer to keep the stream flowing
            this.push(Buffer.from("\r\n"));
        // this.bodyHash.update(Buffer.from('\r\n'));
        }
        this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : false);
        callback();
    }
}
module.exports = RelaxedBody;


/***/ }),

/***/ 714:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const punycode = __webpack_require__(5477);
const mimeFuncs = __webpack_require__(2499);
const crypto = __webpack_require__(6113);
/**
 * Returns DKIM signature header line
 *
 * @param {Object} headers Parsed headers object from MessageParser
 * @param {String} bodyHash Base64 encoded hash of the message
 * @param {Object} options DKIM options
 * @param {String} options.domainName Domain name to be signed for
 * @param {String} options.keySelector DKIM key selector to use
 * @param {String} options.privateKey DKIM private key to use
 * @return {String} Complete header line
 */ module.exports = (headers, hashAlgo, bodyHash, options)=>{
    options = options || {};
    // all listed fields from RFC4871 #5.5
    let defaultFieldNames = "From:Sender:Reply-To:Subject:Date:Message-ID:To:" + "Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:" + "Content-Description:Resent-Date:Resent-From:Resent-Sender:" + "Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:" + "List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:" + "List-Owner:List-Archive";
    let fieldNames = options.headerFieldNames || defaultFieldNames;
    let canonicalizedHeaderData = relaxedHeaders(headers, fieldNames, options.skipFields);
    let dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash);
    let signer, signature;
    canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader);
    signer = crypto.createSign(("rsa-" + hashAlgo).toUpperCase());
    signer.update(canonicalizedHeaderData.headers);
    try {
        signature = signer.sign(options.privateKey, "base64");
    } catch (E) {
        return false;
    }
    return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, "$&\r\n ").trim();
};
module.exports.relaxedHeaders = relaxedHeaders;
function generateDKIMHeader(domainName, keySelector, fieldNames, hashAlgo, bodyHash) {
    let dkim = [
        "v=1",
        "a=rsa-" + hashAlgo,
        "c=relaxed/relaxed",
        "d=" + punycode.toASCII(domainName),
        "q=dns/txt",
        "s=" + keySelector,
        "bh=" + bodyHash,
        "h=" + fieldNames
    ].join("; ");
    return mimeFuncs.foldLines("DKIM-Signature: " + dkim, 76) + ";\r\n b=";
}
function relaxedHeaders(headers, fieldNames, skipFields) {
    let includedFields = new Set();
    let skip = new Set();
    let headerFields = new Map();
    (skipFields || "").toLowerCase().split(":").forEach((field)=>{
        skip.add(field.trim());
    });
    (fieldNames || "").toLowerCase().split(":").filter((field)=>!skip.has(field.trim())).forEach((field)=>{
        includedFields.add(field.trim());
    });
    for(let i = headers.length - 1; i >= 0; i--){
        let line = headers[i];
        // only include the first value from bottom to top
        if (includedFields.has(line.key) && !headerFields.has(line.key)) {
            headerFields.set(line.key, relaxedHeaderLine(line.line));
        }
    }
    let headersList = [];
    let fields = [];
    includedFields.forEach((field)=>{
        if (headerFields.has(field)) {
            fields.push(field);
            headersList.push(field + ":" + headerFields.get(field));
        }
    });
    return {
        headers: headersList.join("\r\n") + "\r\n",
        fieldNames: fields.join(":")
    };
}
function relaxedHeaderLine(line) {
    return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/\s+/g, " ").trim();
}


/***/ }),

/***/ 472:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

// module to handle cookies
const urllib = __webpack_require__(7310);
const SESSION_TIMEOUT = 1800; // 30 min
/**
 * Creates a biskviit cookie jar for managing cookie values in memory
 *
 * @constructor
 * @param {Object} [options] Optional options object
 */ class Cookies {
    constructor(options){
        this.options = options || {};
        this.cookies = [];
    }
    /**
     * Stores a cookie string to the cookie storage
     *
     * @param {String} cookieStr Value from the 'Set-Cookie:' header
     * @param {String} url Current URL
     */ set(cookieStr, url) {
        let urlparts = urllib.parse(url || "");
        let cookie = this.parse(cookieStr);
        let domain;
        if (cookie.domain) {
            domain = cookie.domain.replace(/^\./, "");
            // do not allow cross origin cookies
            if (// can't be valid if the requested domain is shorter than current hostname
            urlparts.hostname.length < domain.length || // prefix domains with dot to be sure that partial matches are not used
            ("." + urlparts.hostname).substr(-domain.length + 1) !== "." + domain) {
                cookie.domain = urlparts.hostname;
            }
        } else {
            cookie.domain = urlparts.hostname;
        }
        if (!cookie.path) {
            cookie.path = this.getPath(urlparts.pathname);
        }
        // if no expire date, then use sessionTimeout value
        if (!cookie.expires) {
            cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1000);
        }
        return this.add(cookie);
    }
    /**
     * Returns cookie string for the 'Cookie:' header.
     *
     * @param {String} url URL to check for
     * @returns {String} Cookie header or empty string if no matches were found
     */ get(url) {
        return this.list(url).map((cookie)=>cookie.name + "=" + cookie.value).join("; ");
    }
    /**
     * Lists all valied cookie objects for the specified URL
     *
     * @param {String} url URL to check for
     * @returns {Array} An array of cookie objects
     */ list(url) {
        let result = [];
        let i;
        let cookie;
        for(i = this.cookies.length - 1; i >= 0; i--){
            cookie = this.cookies[i];
            if (this.isExpired(cookie)) {
                this.cookies.splice(i, i);
                continue;
            }
            if (this.match(cookie, url)) {
                result.unshift(cookie);
            }
        }
        return result;
    }
    /**
     * Parses cookie string from the 'Set-Cookie:' header
     *
     * @param {String} cookieStr String from the 'Set-Cookie:' header
     * @returns {Object} Cookie object
     */ parse(cookieStr) {
        let cookie = {};
        (cookieStr || "").toString().split(";").forEach((cookiePart)=>{
            let valueParts = cookiePart.split("=");
            let key = valueParts.shift().trim().toLowerCase();
            let value = valueParts.join("=").trim();
            let domain;
            if (!key) {
                // skip empty parts
                return;
            }
            switch(key){
                case "expires":
                    value = new Date(value);
                    // ignore date if can not parse it
                    if (value.toString() !== "Invalid Date") {
                        cookie.expires = value;
                    }
                    break;
                case "path":
                    cookie.path = value;
                    break;
                case "domain":
                    domain = value.toLowerCase();
                    if (domain.length && domain.charAt(0) !== ".") {
                        domain = "." + domain; // ensure preceeding dot for user set domains
                    }
                    cookie.domain = domain;
                    break;
                case "max-age":
                    cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1000);
                    break;
                case "secure":
                    cookie.secure = true;
                    break;
                case "httponly":
                    cookie.httponly = true;
                    break;
                default:
                    if (!cookie.name) {
                        cookie.name = key;
                        cookie.value = value;
                    }
            }
        });
        return cookie;
    }
    /**
     * Checks if a cookie object is valid for a specified URL
     *
     * @param {Object} cookie Cookie object
     * @param {String} url URL to check for
     * @returns {Boolean} true if cookie is valid for specifiec URL
     */ match(cookie, url) {
        let urlparts = urllib.parse(url || "");
        // check if hostname matches
        // .foo.com also matches subdomains, foo.com does not
        if (urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain)) {
            return false;
        }
        // check if path matches
        let path = this.getPath(urlparts.pathname);
        if (path.substr(0, cookie.path.length) !== cookie.path) {
            return false;
        }
        // check secure argument
        if (cookie.secure && urlparts.protocol !== "https:") {
            return false;
        }
        return true;
    }
    /**
     * Adds (or updates/removes if needed) a cookie object to the cookie storage
     *
     * @param {Object} cookie Cookie value to be stored
     */ add(cookie) {
        let i;
        let len;
        // nothing to do here
        if (!cookie || !cookie.name) {
            return false;
        }
        // overwrite if has same params
        for(i = 0, len = this.cookies.length; i < len; i++){
            if (this.compare(this.cookies[i], cookie)) {
                // check if the cookie needs to be removed instead
                if (this.isExpired(cookie)) {
                    this.cookies.splice(i, 1); // remove expired/unset cookie
                    return false;
                }
                this.cookies[i] = cookie;
                return true;
            }
        }
        // add as new if not already expired
        if (!this.isExpired(cookie)) {
            this.cookies.push(cookie);
        }
        return true;
    }
    /**
     * Checks if two cookie objects are the same
     *
     * @param {Object} a Cookie to check against
     * @param {Object} b Cookie to check against
     * @returns {Boolean} True, if the cookies are the same
     */ compare(a, b) {
        return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === a.httponly;
    }
    /**
     * Checks if a cookie is expired
     *
     * @param {Object} cookie Cookie object to check against
     * @returns {Boolean} True, if the cookie is expired
     */ isExpired(cookie) {
        return cookie.expires && cookie.expires < new Date() || !cookie.value;
    }
    /**
     * Returns normalized cookie path for an URL path argument
     *
     * @param {String} pathname
     * @returns {String} Normalized path
     */ getPath(pathname) {
        let path = (pathname || "/").split("/");
        path.pop(); // remove filename part
        path = path.join("/").trim();
        // ensure path prefix /
        if (path.charAt(0) !== "/") {
            path = "/" + path;
        }
        // ensure path suffix /
        if (path.substr(-1) !== "/") {
            path += "/";
        }
        return path;
    }
}
module.exports = Cookies;


/***/ }),

/***/ 7199:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const http = __webpack_require__(3685);
const https = __webpack_require__(5687);
const urllib = __webpack_require__(7310);
const zlib = __webpack_require__(9796);
const PassThrough = (__webpack_require__(2781).PassThrough);
const Cookies = __webpack_require__(472);
const packageData = __webpack_require__(3259);
const net = __webpack_require__(1808);
const MAX_REDIRECTS = 5;
module.exports = function(url, options) {
    return nmfetch(url, options);
};
module.exports.Cookies = Cookies;
function nmfetch(url, options) {
    options = options || {};
    options.fetchRes = options.fetchRes || new PassThrough();
    options.cookies = options.cookies || new Cookies();
    options.redirects = options.redirects || 0;
    options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;
    if (options.cookie) {
        [].concat(options.cookie || []).forEach((cookie)=>{
            options.cookies.set(cookie, url);
        });
        options.cookie = false;
    }
    let fetchRes = options.fetchRes;
    let parsed = urllib.parse(url);
    let method = (options.method || "").toString().trim().toUpperCase() || "GET";
    let finished = false;
    let cookies;
    let body;
    let handler = parsed.protocol === "https:" ? https : http;
    let headers = {
        "accept-encoding": "gzip,deflate",
        "user-agent": "nodemailer/" + packageData.version
    };
    Object.keys(options.headers || {}).forEach((key)=>{
        headers[key.toLowerCase().trim()] = options.headers[key];
    });
    if (options.userAgent) {
        headers["user-agent"] = options.userAgent;
    }
    if (parsed.auth) {
        headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64");
    }
    if (cookies = options.cookies.get(url)) {
        headers.cookie = cookies;
    }
    if (options.body) {
        if (options.contentType !== false) {
            headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
        }
        if (typeof options.body.pipe === "function") {
            // it's a stream
            headers["Transfer-Encoding"] = "chunked";
            body = options.body;
            body.on("error", (err)=>{
                if (finished) {
                    return;
                }
                finished = true;
                err.type = "FETCH";
                err.sourceUrl = url;
                fetchRes.emit("error", err);
            });
        } else {
            if (options.body instanceof Buffer) {
                body = options.body;
            } else if (typeof options.body === "object") {
                try {
                    // encodeURIComponent can fail on invalid input (partial emoji etc.)
                    body = Buffer.from(Object.keys(options.body).map((key)=>{
                        let value = options.body[key].toString().trim();
                        return encodeURIComponent(key) + "=" + encodeURIComponent(value);
                    }).join("&"));
                } catch (E) {
                    if (finished) {
                        return;
                    }
                    finished = true;
                    E.type = "FETCH";
                    E.sourceUrl = url;
                    fetchRes.emit("error", E);
                    return;
                }
            } else {
                body = Buffer.from(options.body.toString().trim());
            }
            headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
            headers["Content-Length"] = body.length;
        }
        // if method is not provided, use POST instead of GET
        method = (options.method || "").toString().trim().toUpperCase() || "POST";
    }
    let req;
    let reqOptions = {
        method,
        host: parsed.hostname,
        path: parsed.path,
        port: parsed.port ? parsed.port : parsed.protocol === "https:" ? 443 : 80,
        headers,
        rejectUnauthorized: false,
        agent: false
    };
    if (options.tls) {
        Object.keys(options.tls).forEach((key)=>{
            reqOptions[key] = options.tls[key];
        });
    }
    if (parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !net.isIP(parsed.hostname) && !reqOptions.servername) {
        reqOptions.servername = parsed.hostname;
    }
    try {
        req = handler.request(reqOptions);
    } catch (E) {
        finished = true;
        setImmediate(()=>{
            E.type = "FETCH";
            E.sourceUrl = url;
            fetchRes.emit("error", E);
        });
        return fetchRes;
    }
    if (options.timeout) {
        req.setTimeout(options.timeout, ()=>{
            if (finished) {
                return;
            }
            finished = true;
            req.abort();
            let err = new Error("Request Timeout");
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
        });
    }
    req.on("error", (err)=>{
        if (finished) {
            return;
        }
        finished = true;
        err.type = "FETCH";
        err.sourceUrl = url;
        fetchRes.emit("error", err);
    });
    req.on("response", (res)=>{
        let inflate;
        if (finished) {
            return;
        }
        switch(res.headers["content-encoding"]){
            case "gzip":
            case "deflate":
                inflate = zlib.createUnzip();
                break;
        }
        if (res.headers["set-cookie"]) {
            [].concat(res.headers["set-cookie"] || []).forEach((cookie)=>{
                options.cookies.set(cookie, url);
            });
        }
        if ([
            301,
            302,
            303,
            307,
            308
        ].includes(res.statusCode) && res.headers.location) {
            // redirect
            options.redirects++;
            if (options.redirects > options.maxRedirects) {
                finished = true;
                let err = new Error("Maximum redirect count exceeded");
                err.type = "FETCH";
                err.sourceUrl = url;
                fetchRes.emit("error", err);
                req.abort();
                return;
            }
            // redirect does not include POST body
            options.method = "GET";
            options.body = false;
            return nmfetch(urllib.resolve(url, res.headers.location), options);
        }
        fetchRes.statusCode = res.statusCode;
        fetchRes.headers = res.headers;
        if (res.statusCode >= 300 && !options.allowErrorResponse) {
            finished = true;
            let err = new Error("Invalid status code " + res.statusCode);
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
            req.abort();
            return;
        }
        res.on("error", (err)=>{
            if (finished) {
                return;
            }
            finished = true;
            err.type = "FETCH";
            err.sourceUrl = url;
            fetchRes.emit("error", err);
            req.abort();
        });
        if (inflate) {
            res.pipe(inflate).pipe(fetchRes);
            inflate.on("error", (err)=>{
                if (finished) {
                    return;
                }
                finished = true;
                err.type = "FETCH";
                err.sourceUrl = url;
                fetchRes.emit("error", err);
                req.abort();
            });
        } else {
            res.pipe(fetchRes);
        }
    });
    setImmediate(()=>{
        if (body) {
            try {
                if (typeof body.pipe === "function") {
                    return body.pipe(req);
                } else {
                    req.write(body);
                }
            } catch (err) {
                finished = true;
                err.type = "FETCH";
                err.sourceUrl = url;
                fetchRes.emit("error", err);
                return;
            }
        }
        req.end();
    });
    return fetchRes;
}


/***/ }),

/***/ 8312:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const packageData = __webpack_require__(3259);
const shared = __webpack_require__(2122);
/**
 * Generates a Transport object to generate JSON output
 *
 * @constructor
 * @param {Object} optional config parameter
 */ class JSONTransport {
    constructor(options){
        options = options || {};
        this.options = options || {};
        this.name = "JSONTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "json-transport"
        });
    }
    /**
     * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */ send(mail, done) {
        // Sendmail strips this header line by itself
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
            recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info({
            tnx: "send",
            messageId
        }, "Composing JSON structure of %s to <%s>", messageId, recipients.join(", "));
        setImmediate(()=>{
            mail.normalize((err, data)=>{
                if (err) {
                    this.logger.error({
                        err,
                        tnx: "send",
                        messageId
                    }, "Failed building JSON structure for %s. %s", messageId, err.message);
                    return done(err);
                }
                delete data.envelope;
                delete data.normalizedHeaders;
                return done(null, {
                    envelope,
                    messageId,
                    message: this.options.skipEncoding ? data : JSON.stringify(data)
                });
            });
        });
    }
}
module.exports = JSONTransport;


/***/ }),

/***/ 5865:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint no-undefined: 0 */ 
const MimeNode = __webpack_require__(812);
const mimeFuncs = __webpack_require__(2499);
/**
 * Creates the object for composing a MimeNode instance out from the mail options
 *
 * @constructor
 * @param {Object} mail Mail options
 */ class MailComposer {
    constructor(mail){
        this.mail = mail || {};
        this.message = false;
    }
    /**
     * Builds MimeNode instance
     */ compile() {
        this._alternatives = this.getAlternatives();
        this._htmlNode = this._alternatives.filter((alternative)=>/^text\/html\b/i.test(alternative.contentType)).pop();
        this._attachments = this.getAttachments(!!this._htmlNode);
        this._useRelated = !!(this._htmlNode && this._attachments.related.length);
        this._useAlternative = this._alternatives.length > 1;
        this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1;
        // Compose MIME tree
        if (this.mail.raw) {
            this.message = new MimeNode("message/rfc822", {
                newline: this.mail.newline
            }).setRaw(this.mail.raw);
        } else if (this._useMixed) {
            this.message = this._createMixed();
        } else if (this._useAlternative) {
            this.message = this._createAlternative();
        } else if (this._useRelated) {
            this.message = this._createRelated();
        } else {
            this.message = this._createContentNode(false, [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
                contentType: "text/plain",
                content: ""
            });
        }
        // Add custom headers
        if (this.mail.headers) {
            this.message.addHeader(this.mail.headers);
        }
        // Add headers to the root node, always overrides custom headers
        [
            "from",
            "sender",
            "to",
            "cc",
            "bcc",
            "reply-to",
            "in-reply-to",
            "references",
            "subject",
            "message-id",
            "date"
        ].forEach((header)=>{
            let key = header.replace(/-(\w)/g, (o, c)=>c.toUpperCase());
            if (this.mail[key]) {
                this.message.setHeader(header, this.mail[key]);
            }
        });
        // Sets custom envelope
        if (this.mail.envelope) {
            this.message.setEnvelope(this.mail.envelope);
        }
        // ensure Message-Id value
        this.message.messageId();
        return this.message;
    }
    /**
     * List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
     *
     * @param {Boolean} findRelated If true separate related attachments from attached ones
     * @returns {Object} An object of arrays (`related` and `attached`)
     */ getAttachments(findRelated) {
        let icalEvent, eventObject;
        let attachments = [].concat(this.mail.attachments || []).map((attachment, i)=>{
            let data;
            let isMessageNode = /^message\//i.test(attachment.contentType);
            if (/^data:/i.test(attachment.path || attachment.href)) {
                attachment = this._processDataUrl(attachment);
            }
            data = {
                contentType: attachment.contentType || mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin"),
                contentDisposition: attachment.contentDisposition || (isMessageNode ? "inline" : "attachment"),
                contentTransferEncoding: "contentTransferEncoding" in attachment ? attachment.contentTransferEncoding : "base64"
            };
            if (attachment.filename) {
                data.filename = attachment.filename;
            } else if (!isMessageNode && attachment.filename !== false) {
                data.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
                if (data.filename.indexOf(".") < 0) {
                    data.filename += "." + mimeFuncs.detectExtension(data.contentType);
                }
            }
            if (/^https?:\/\//i.test(attachment.path)) {
                attachment.href = attachment.path;
                attachment.path = undefined;
            }
            if (attachment.cid) {
                data.cid = attachment.cid;
            }
            if (attachment.raw) {
                data.raw = attachment.raw;
            } else if (attachment.path) {
                data.content = {
                    path: attachment.path
                };
            } else if (attachment.href) {
                data.content = {
                    href: attachment.href,
                    httpHeaders: attachment.httpHeaders
                };
            } else {
                data.content = attachment.content || "";
            }
            if (attachment.encoding) {
                data.encoding = attachment.encoding;
            }
            if (attachment.headers) {
                data.headers = attachment.headers;
            }
            return data;
        });
        if (this.mail.icalEvent) {
            if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) {
                icalEvent = this.mail.icalEvent;
            } else {
                icalEvent = {
                    content: this.mail.icalEvent
                };
            }
            eventObject = {};
            Object.keys(icalEvent).forEach((key)=>{
                eventObject[key] = icalEvent[key];
            });
            eventObject.contentType = "application/ics";
            if (!eventObject.headers) {
                eventObject.headers = {};
            }
            eventObject.filename = eventObject.filename || "invite.ics";
            eventObject.headers["Content-Disposition"] = "attachment";
            eventObject.headers["Content-Transfer-Encoding"] = "base64";
        }
        if (!findRelated) {
            return {
                attached: attachments.concat(eventObject || []),
                related: []
            };
        } else {
            return {
                attached: attachments.filter((attachment)=>!attachment.cid).concat(eventObject || []),
                related: attachments.filter((attachment)=>!!attachment.cid)
            };
        }
    }
    /**
     * List alternatives. Resulting objects can be used as input for MimeNode nodes
     *
     * @returns {Array} An array of alternative elements. Includes the `text` and `html` values as well
     */ getAlternatives() {
        let alternatives = [], text, html, watchHtml, amp, icalEvent, eventObject;
        if (this.mail.text) {
            if (typeof this.mail.text === "object" && (this.mail.text.content || this.mail.text.path || this.mail.text.href || this.mail.text.raw)) {
                text = this.mail.text;
            } else {
                text = {
                    content: this.mail.text
                };
            }
            text.contentType = "text/plain; charset=utf-8";
        }
        if (this.mail.watchHtml) {
            if (typeof this.mail.watchHtml === "object" && (this.mail.watchHtml.content || this.mail.watchHtml.path || this.mail.watchHtml.href || this.mail.watchHtml.raw)) {
                watchHtml = this.mail.watchHtml;
            } else {
                watchHtml = {
                    content: this.mail.watchHtml
                };
            }
            watchHtml.contentType = "text/watch-html; charset=utf-8";
        }
        if (this.mail.amp) {
            if (typeof this.mail.amp === "object" && (this.mail.amp.content || this.mail.amp.path || this.mail.amp.href || this.mail.amp.raw)) {
                amp = this.mail.amp;
            } else {
                amp = {
                    content: this.mail.amp
                };
            }
            amp.contentType = "text/x-amp-html; charset=utf-8";
        }
        // NB! when including attachments with a calendar alternative you might end up in a blank screen on some clients
        if (this.mail.icalEvent) {
            if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) {
                icalEvent = this.mail.icalEvent;
            } else {
                icalEvent = {
                    content: this.mail.icalEvent
                };
            }
            eventObject = {};
            Object.keys(icalEvent).forEach((key)=>{
                eventObject[key] = icalEvent[key];
            });
            if (eventObject.content && typeof eventObject.content === "object") {
                // we are going to have the same attachment twice, so mark this to be
                // resolved just once
                eventObject.content._resolve = true;
            }
            eventObject.filename = false;
            eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase();
            if (!eventObject.headers) {
                eventObject.headers = {};
            }
        }
        if (this.mail.html) {
            if (typeof this.mail.html === "object" && (this.mail.html.content || this.mail.html.path || this.mail.html.href || this.mail.html.raw)) {
                html = this.mail.html;
            } else {
                html = {
                    content: this.mail.html
                };
            }
            html.contentType = "text/html; charset=utf-8";
        }
        [].concat(text || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative)=>{
            let data;
            if (/^data:/i.test(alternative.path || alternative.href)) {
                alternative = this._processDataUrl(alternative);
            }
            data = {
                contentType: alternative.contentType || mimeFuncs.detectMimeType(alternative.filename || alternative.path || alternative.href || "txt"),
                contentTransferEncoding: alternative.contentTransferEncoding
            };
            if (alternative.filename) {
                data.filename = alternative.filename;
            }
            if (/^https?:\/\//i.test(alternative.path)) {
                alternative.href = alternative.path;
                alternative.path = undefined;
            }
            if (alternative.raw) {
                data.raw = alternative.raw;
            } else if (alternative.path) {
                data.content = {
                    path: alternative.path
                };
            } else if (alternative.href) {
                data.content = {
                    href: alternative.href
                };
            } else {
                data.content = alternative.content || "";
            }
            if (alternative.encoding) {
                data.encoding = alternative.encoding;
            }
            if (alternative.headers) {
                data.headers = alternative.headers;
            }
            alternatives.push(data);
        });
        return alternatives;
    }
    /**
     * Builds multipart/mixed node. It should always contain different type of elements on the same level
     * eg. text + attachments
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */ _createMixed(parentNode) {
        let node;
        if (!parentNode) {
            node = new MimeNode("multipart/mixed", {
                baseBoundary: this.mail.baseBoundary,
                textEncoding: this.mail.textEncoding,
                boundaryPrefix: this.mail.boundaryPrefix,
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        } else {
            node = parentNode.createChild("multipart/mixed", {
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        }
        if (this._useAlternative) {
            this._createAlternative(node);
        } else if (this._useRelated) {
            this._createRelated(node);
        }
        [].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element)=>{
            // if the element is a html node from related subpart then ignore it
            if (!this._useRelated || element !== this._htmlNode) {
                this._createContentNode(node, element);
            }
        });
        return node;
    }
    /**
     * Builds multipart/alternative node. It should always contain same type of elements on the same level
     * eg. text + html view of the same data
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */ _createAlternative(parentNode) {
        let node;
        if (!parentNode) {
            node = new MimeNode("multipart/alternative", {
                baseBoundary: this.mail.baseBoundary,
                textEncoding: this.mail.textEncoding,
                boundaryPrefix: this.mail.boundaryPrefix,
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        } else {
            node = parentNode.createChild("multipart/alternative", {
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        }
        this._alternatives.forEach((alternative)=>{
            if (this._useRelated && this._htmlNode === alternative) {
                this._createRelated(node);
            } else {
                this._createContentNode(node, alternative);
            }
        });
        return node;
    }
    /**
     * Builds multipart/related node. It should always contain html node with related attachments
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @returns {Object} MimeNode node element
     */ _createRelated(parentNode) {
        let node;
        if (!parentNode) {
            node = new MimeNode('multipart/related; type="text/html"', {
                baseBoundary: this.mail.baseBoundary,
                textEncoding: this.mail.textEncoding,
                boundaryPrefix: this.mail.boundaryPrefix,
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        } else {
            node = parentNode.createChild('multipart/related; type="text/html"', {
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        }
        this._createContentNode(node, this._htmlNode);
        this._attachments.related.forEach((alternative)=>this._createContentNode(node, alternative));
        return node;
    }
    /**
     * Creates a regular node with contents
     *
     * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
     * @param {Object} element Node data
     * @returns {Object} MimeNode node element
     */ _createContentNode(parentNode, element) {
        element = element || {};
        element.content = element.content || "";
        let node;
        let encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
        if (!parentNode) {
            node = new MimeNode(element.contentType, {
                filename: element.filename,
                baseBoundary: this.mail.baseBoundary,
                textEncoding: this.mail.textEncoding,
                boundaryPrefix: this.mail.boundaryPrefix,
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        } else {
            node = parentNode.createChild(element.contentType, {
                filename: element.filename,
                textEncoding: this.mail.textEncoding,
                disableUrlAccess: this.mail.disableUrlAccess,
                disableFileAccess: this.mail.disableFileAccess,
                normalizeHeaderKey: this.mail.normalizeHeaderKey,
                newline: this.mail.newline
            });
        }
        // add custom headers
        if (element.headers) {
            node.addHeader(element.headers);
        }
        if (element.cid) {
            node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">");
        }
        if (element.contentTransferEncoding) {
            node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding);
        } else if (this.mail.encoding && /^text\//i.test(element.contentType)) {
            node.setHeader("Content-Transfer-Encoding", this.mail.encoding);
        }
        if (!/^text\//i.test(element.contentType) || element.contentDisposition) {
            node.setHeader("Content-Disposition", element.contentDisposition || (element.cid ? "inline" : "attachment"));
        }
        if (typeof element.content === "string" && ![
            "utf8",
            "usascii",
            "ascii"
        ].includes(encoding)) {
            element.content = Buffer.from(element.content, encoding);
        }
        // prefer pregenerated raw content
        if (element.raw) {
            node.setRaw(element.raw);
        } else {
            node.setContent(element.content);
        }
        return node;
    }
    /**
     * Parses data uri and converts it to a Buffer
     *
     * @param {Object} element Content element
     * @return {Object} Parsed element
     */ _processDataUrl(element) {
        let parts = (element.path || element.href).match(/^data:((?:[^;]*;)*(?:[^,]*)),(.*)$/i);
        if (!parts) {
            return element;
        }
        element.content = /\bbase64$/i.test(parts[1]) ? Buffer.from(parts[2], "base64") : Buffer.from(decodeURIComponent(parts[2]));
        if ("path" in element) {
            element.path = false;
        }
        if ("href" in element) {
            element.href = false;
        }
        parts[1].split(";").forEach((item)=>{
            if (/^\w+\/[^/]+$/i.test(item)) {
                element.contentType = element.contentType || item.toLowerCase();
            }
        });
        return element;
    }
}
module.exports = MailComposer;


/***/ }),

/***/ 882:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const EventEmitter = __webpack_require__(2361);
const shared = __webpack_require__(2122);
const mimeTypes = __webpack_require__(8897);
const MailComposer = __webpack_require__(5865);
const DKIM = __webpack_require__(6732);
const httpProxyClient = __webpack_require__(3402);
const util = __webpack_require__(3837);
const urllib = __webpack_require__(7310);
const packageData = __webpack_require__(3259);
const MailMessage = __webpack_require__(3366);
const net = __webpack_require__(1808);
const dns = __webpack_require__(9523);
const crypto = __webpack_require__(6113);
/**
 * Creates an object for exposing the Mail API
 *
 * @constructor
 * @param {Object} transporter Transport object instance to pass the mails to
 */ class Mail extends EventEmitter {
    constructor(transporter, options, defaults){
        super();
        this.options = options || {};
        this._defaults = defaults || {};
        this._defaultPlugins = {
            compile: [
                (...args)=>this._convertDataImages(...args)
            ],
            stream: []
        };
        this._userPlugins = {
            compile: [],
            stream: []
        };
        this.meta = new Map();
        this.dkim = this.options.dkim ? new DKIM(this.options.dkim) : false;
        this.transporter = transporter;
        this.transporter.mailer = this;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "mail"
        });
        this.logger.debug({
            tnx: "create"
        }, "Creating transport: %s", this.getVersionString());
        // setup emit handlers for the transporter
        if (typeof this.transporter.on === "function") {
            // deprecated log interface
            this.transporter.on("log", (log)=>{
                this.logger.debug({
                    tnx: "transport"
                }, "%s: %s", log.type, log.message);
            });
            // transporter errors
            this.transporter.on("error", (err)=>{
                this.logger.error({
                    err,
                    tnx: "transport"
                }, "Transport Error: %s", err.message);
                this.emit("error", err);
            });
            // indicates if the sender has became idle
            this.transporter.on("idle", (...args)=>{
                this.emit("idle", ...args);
            });
        }
        /**
         * Optional methods passed to the underlying transport object
         */ [
            "close",
            "isIdle",
            "verify"
        ].forEach((method)=>{
            this[method] = (...args)=>{
                if (typeof this.transporter[method] === "function") {
                    if (method === "verify" && typeof this.getSocket === "function") {
                        this.transporter.getSocket = this.getSocket;
                        this.getSocket = false;
                    }
                    return this.transporter[method](...args);
                } else {
                    this.logger.warn({
                        tnx: "transport",
                        methodName: method
                    }, "Non existing method %s called for transport", method);
                    return false;
                }
            };
        });
        // setup proxy handling
        if (this.options.proxy && typeof this.options.proxy === "string") {
            this.setupProxy(this.options.proxy);
        }
    }
    use(step, plugin) {
        step = (step || "").toString();
        if (!this._userPlugins.hasOwnProperty(step)) {
            this._userPlugins[step] = [
                plugin
            ];
        } else {
            this._userPlugins[step].push(plugin);
        }
        return this;
    }
    /**
     * Sends an email using the preselected transport object
     *
     * @param {Object} data E-data description
     * @param {Function?} callback Callback to run once the sending succeeded or failed
     */ sendMail(data, callback = null) {
        let promise;
        if (!callback) {
            promise = new Promise((resolve, reject)=>{
                callback = shared.callbackPromise(resolve, reject);
            });
        }
        if (typeof this.getSocket === "function") {
            this.transporter.getSocket = this.getSocket;
            this.getSocket = false;
        }
        let mail = new MailMessage(this, data);
        this.logger.debug({
            tnx: "transport",
            name: this.transporter.name,
            version: this.transporter.version,
            action: "send"
        }, "Sending mail using %s/%s", this.transporter.name, this.transporter.version);
        this._processPlugins("compile", mail, (err)=>{
            if (err) {
                this.logger.error({
                    err,
                    tnx: "plugin",
                    action: "compile"
                }, "PluginCompile Error: %s", err.message);
                return callback(err);
            }
            mail.message = new MailComposer(mail.data).compile();
            mail.setMailerHeader();
            mail.setPriorityHeaders();
            mail.setListHeaders();
            this._processPlugins("stream", mail, (err)=>{
                if (err) {
                    this.logger.error({
                        err,
                        tnx: "plugin",
                        action: "stream"
                    }, "PluginStream Error: %s", err.message);
                    return callback(err);
                }
                if (mail.data.dkim || this.dkim) {
                    mail.message.processFunc((input)=>{
                        let dkim = mail.data.dkim ? new DKIM(mail.data.dkim) : this.dkim;
                        this.logger.debug({
                            tnx: "DKIM",
                            messageId: mail.message.messageId(),
                            dkimDomains: dkim.keys.map((key)=>key.keySelector + "." + key.domainName).join(", ")
                        }, "Signing outgoing message with %s keys", dkim.keys.length);
                        return dkim.sign(input, mail.data._dkim);
                    });
                }
                this.transporter.send(mail, (...args)=>{
                    if (args[0]) {
                        this.logger.error({
                            err: args[0],
                            tnx: "transport",
                            action: "send"
                        }, "Send Error: %s", args[0].message);
                    }
                    callback(...args);
                });
            });
        });
        return promise;
    }
    getVersionString() {
        return util.format("%s (%s; +%s; %s/%s)", packageData.name, packageData.version, packageData.homepage, this.transporter.name, this.transporter.version);
    }
    _processPlugins(step, mail, callback) {
        step = (step || "").toString();
        if (!this._userPlugins.hasOwnProperty(step)) {
            return callback();
        }
        let userPlugins = this._userPlugins[step] || [];
        let defaultPlugins = this._defaultPlugins[step] || [];
        if (userPlugins.length) {
            this.logger.debug({
                tnx: "transaction",
                pluginCount: userPlugins.length,
                step
            }, "Using %s plugins for %s", userPlugins.length, step);
        }
        if (userPlugins.length + defaultPlugins.length === 0) {
            return callback();
        }
        let pos = 0;
        let block = "default";
        let processPlugins = ()=>{
            let curplugins = block === "default" ? defaultPlugins : userPlugins;
            if (pos >= curplugins.length) {
                if (block === "default" && userPlugins.length) {
                    block = "user";
                    pos = 0;
                    curplugins = userPlugins;
                } else {
                    return callback();
                }
            }
            let plugin = curplugins[pos++];
            plugin(mail, (err)=>{
                if (err) {
                    return callback(err);
                }
                processPlugins();
            });
        };
        processPlugins();
    }
    /**
     * Sets up proxy handler for a Nodemailer object
     *
     * @param {String} proxyUrl Proxy configuration url
     */ setupProxy(proxyUrl) {
        let proxy = urllib.parse(proxyUrl);
        // setup socket handler for the mailer object
        this.getSocket = (options, callback)=>{
            let protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
            if (this.meta.has("proxy_handler_" + protocol)) {
                return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
            }
            switch(protocol){
                // Connect using a HTTP CONNECT method
                case "http":
                case "https":
                    httpProxyClient(proxy.href, options.port, options.host, (err, socket)=>{
                        if (err) {
                            return callback(err);
                        }
                        return callback(null, {
                            connection: socket
                        });
                    });
                    return;
                case "socks":
                case "socks5":
                case "socks4":
                case "socks4a":
                    {
                        if (!this.meta.has("proxy_socks_module")) {
                            return callback(new Error("Socks module not loaded"));
                        }
                        let connect = (ipaddress)=>{
                            let proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient;
                            let socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module");
                            let proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5;
                            let connectionOpts = {
                                proxy: {
                                    ipaddress,
                                    port: Number(proxy.port),
                                    type: proxyType
                                },
                                [proxyV2 ? "destination" : "target"]: {
                                    host: options.host,
                                    port: options.port
                                },
                                command: "connect"
                            };
                            if (proxy.auth) {
                                let username = decodeURIComponent(proxy.auth.split(":").shift());
                                let password = decodeURIComponent(proxy.auth.split(":").pop());
                                if (proxyV2) {
                                    connectionOpts.proxy.userId = username;
                                    connectionOpts.proxy.password = password;
                                } else if (proxyType === 4) {
                                    connectionOpts.userid = username;
                                } else {
                                    connectionOpts.authentication = {
                                        username,
                                        password
                                    };
                                }
                            }
                            socksClient.createConnection(connectionOpts, (err, info)=>{
                                if (err) {
                                    return callback(err);
                                }
                                return callback(null, {
                                    connection: info.socket || info
                                });
                            });
                        };
                        if (net.isIP(proxy.hostname)) {
                            return connect(proxy.hostname);
                        }
                        return dns.resolve(proxy.hostname, (err, address)=>{
                            if (err) {
                                return callback(err);
                            }
                            connect(Array.isArray(address) ? address[0] : address);
                        });
                    }
            }
            callback(new Error("Unknown proxy configuration"));
        };
    }
    _convertDataImages(mail, callback) {
        if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html) {
            return callback();
        }
        mail.resolveContent(mail.data, "html", (err, html)=>{
            if (err) {
                return callback(err);
            }
            let cidCounter = 0;
            html = (html || "").toString().replace(/(<img\b[^>]* src\s*=[\s"']*)(data:([^;]+);[^"'>\s]+)/gi, (match, prefix, dataUri, mimeType)=>{
                let cid = crypto.randomBytes(10).toString("hex") + "@localhost";
                if (!mail.data.attachments) {
                    mail.data.attachments = [];
                }
                if (!Array.isArray(mail.data.attachments)) {
                    mail.data.attachments = [].concat(mail.data.attachments || []);
                }
                mail.data.attachments.push({
                    path: dataUri,
                    cid,
                    filename: "image-" + ++cidCounter + "." + mimeTypes.detectExtension(mimeType)
                });
                return prefix + "cid:" + cid;
            });
            mail.data.html = html;
            callback();
        });
    }
    set(key, value) {
        return this.meta.set(key, value);
    }
    get(key) {
        return this.meta.get(key);
    }
}
module.exports = Mail;


/***/ }),

/***/ 3366:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const shared = __webpack_require__(2122);
const MimeNode = __webpack_require__(812);
const mimeFuncs = __webpack_require__(2499);
class MailMessage {
    constructor(mailer, data){
        this.mailer = mailer;
        this.data = {};
        this.message = null;
        data = data || {};
        let options = mailer.options || {};
        let defaults = mailer._defaults || {};
        Object.keys(data).forEach((key)=>{
            this.data[key] = data[key];
        });
        this.data.headers = this.data.headers || {};
        // apply defaults
        Object.keys(defaults).forEach((key)=>{
            if (!(key in this.data)) {
                this.data[key] = defaults[key];
            } else if (key === "headers") {
                // headers is a special case. Allow setting individual default headers
                Object.keys(defaults.headers).forEach((key)=>{
                    if (!(key in this.data.headers)) {
                        this.data.headers[key] = defaults.headers[key];
                    }
                });
            }
        });
        // force specific keys from transporter options
        [
            "disableFileAccess",
            "disableUrlAccess",
            "normalizeHeaderKey"
        ].forEach((key)=>{
            if (key in options) {
                this.data[key] = options[key];
            }
        });
    }
    resolveContent(...args) {
        return shared.resolveContent(...args);
    }
    resolveAll(callback) {
        let keys = [
            [
                this.data,
                "html"
            ],
            [
                this.data,
                "text"
            ],
            [
                this.data,
                "watchHtml"
            ],
            [
                this.data,
                "amp"
            ],
            [
                this.data,
                "icalEvent"
            ]
        ];
        if (this.data.alternatives && this.data.alternatives.length) {
            this.data.alternatives.forEach((alternative, i)=>{
                keys.push([
                    this.data.alternatives,
                    i
                ]);
            });
        }
        if (this.data.attachments && this.data.attachments.length) {
            this.data.attachments.forEach((attachment, i)=>{
                if (!attachment.filename) {
                    attachment.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
                    if (attachment.filename.indexOf(".") < 0) {
                        attachment.filename += "." + mimeFuncs.detectExtension(attachment.contentType);
                    }
                }
                if (!attachment.contentType) {
                    attachment.contentType = mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
                }
                keys.push([
                    this.data.attachments,
                    i
                ]);
            });
        }
        let mimeNode = new MimeNode();
        let addressKeys = [
            "from",
            "to",
            "cc",
            "bcc",
            "sender",
            "replyTo"
        ];
        addressKeys.forEach((address)=>{
            let value;
            if (this.message) {
                value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []);
            } else if (this.data[address]) {
                value = [].concat(mimeNode._parseAddresses(this.data[address]) || []);
            }
            if (value && value.length) {
                this.data[address] = value;
            } else if (address in this.data) {
                this.data[address] = null;
            }
        });
        let singleKeys = [
            "from",
            "sender"
        ];
        singleKeys.forEach((address)=>{
            if (this.data[address]) {
                this.data[address] = this.data[address].shift();
            }
        });
        let pos = 0;
        let resolveNext = ()=>{
            if (pos >= keys.length) {
                return callback(null, this.data);
            }
            let args = keys[pos++];
            if (!args[0] || !args[0][args[1]]) {
                return resolveNext();
            }
            shared.resolveContent(...args, (err, value)=>{
                if (err) {
                    return callback(err);
                }
                let node = {
                    content: value
                };
                if (args[0][args[1]] && typeof args[0][args[1]] === "object" && !Buffer.isBuffer(args[0][args[1]])) {
                    Object.keys(args[0][args[1]]).forEach((key)=>{
                        if (!(key in node) && ![
                            "content",
                            "path",
                            "href",
                            "raw"
                        ].includes(key)) {
                            node[key] = args[0][args[1]][key];
                        }
                    });
                }
                args[0][args[1]] = node;
                resolveNext();
            });
        };
        setImmediate(()=>resolveNext());
    }
    normalize(callback) {
        let envelope = this.data.envelope || this.message.getEnvelope();
        let messageId = this.message.messageId();
        this.resolveAll((err, data)=>{
            if (err) {
                return callback(err);
            }
            data.envelope = envelope;
            data.messageId = messageId;
            [
                "html",
                "text",
                "watchHtml",
                "amp"
            ].forEach((key)=>{
                if (data[key] && data[key].content) {
                    if (typeof data[key].content === "string") {
                        data[key] = data[key].content;
                    } else if (Buffer.isBuffer(data[key].content)) {
                        data[key] = data[key].content.toString();
                    }
                }
            });
            if (data.icalEvent && Buffer.isBuffer(data.icalEvent.content)) {
                data.icalEvent.content = data.icalEvent.content.toString("base64");
                data.icalEvent.encoding = "base64";
            }
            if (data.alternatives && data.alternatives.length) {
                data.alternatives.forEach((alternative)=>{
                    if (alternative && alternative.content && Buffer.isBuffer(alternative.content)) {
                        alternative.content = alternative.content.toString("base64");
                        alternative.encoding = "base64";
                    }
                });
            }
            if (data.attachments && data.attachments.length) {
                data.attachments.forEach((attachment)=>{
                    if (attachment && attachment.content && Buffer.isBuffer(attachment.content)) {
                        attachment.content = attachment.content.toString("base64");
                        attachment.encoding = "base64";
                    }
                });
            }
            data.normalizedHeaders = {};
            Object.keys(data.headers || {}).forEach((key)=>{
                let value = [].concat(data.headers[key] || []).shift();
                value = value && value.value || value;
                if (value) {
                    if ([
                        "references",
                        "in-reply-to",
                        "message-id",
                        "content-id"
                    ].includes(key)) {
                        value = this.message._encodeHeaderValue(key, value);
                    }
                    data.normalizedHeaders[key] = value;
                }
            });
            if (data.list && typeof data.list === "object") {
                let listHeaders = this._getListHeaders(data.list);
                listHeaders.forEach((entry)=>{
                    data.normalizedHeaders[entry.key] = entry.value.map((val)=>val && val.value || val).join(", ");
                });
            }
            if (data.references) {
                data.normalizedHeaders.references = this.message._encodeHeaderValue("references", data.references);
            }
            if (data.inReplyTo) {
                data.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", data.inReplyTo);
            }
            return callback(null, data);
        });
    }
    setMailerHeader() {
        if (!this.message || !this.data.xMailer) {
            return;
        }
        this.message.setHeader("X-Mailer", this.data.xMailer);
    }
    setPriorityHeaders() {
        if (!this.message || !this.data.priority) {
            return;
        }
        switch((this.data.priority || "").toString().toLowerCase()){
            case "high":
                this.message.setHeader("X-Priority", "1 (Highest)");
                this.message.setHeader("X-MSMail-Priority", "High");
                this.message.setHeader("Importance", "High");
                break;
            case "low":
                this.message.setHeader("X-Priority", "5 (Lowest)");
                this.message.setHeader("X-MSMail-Priority", "Low");
                this.message.setHeader("Importance", "Low");
                break;
            default:
        }
    }
    setListHeaders() {
        if (!this.message || !this.data.list || typeof this.data.list !== "object") {
            return;
        }
        // add optional List-* headers
        if (this.data.list && typeof this.data.list === "object") {
            this._getListHeaders(this.data.list).forEach((listHeader)=>{
                listHeader.value.forEach((value)=>{
                    this.message.addHeader(listHeader.key, value);
                });
            });
        }
    }
    _getListHeaders(listData) {
        // make sure an url looks like <protocol:url>
        return Object.keys(listData).map((key)=>({
                key: "list-" + key.toLowerCase().trim(),
                value: [].concat(listData[key] || []).map((value)=>({
                        prepared: true,
                        foldLines: true,
                        value: [].concat(value || []).map((value)=>{
                            if (typeof value === "string") {
                                value = {
                                    url: value
                                };
                            }
                            if (value && value.url) {
                                if (key.toLowerCase().trim() === "id") {
                                    // List-ID: "comment" <domain>
                                    let comment = value.comment || "";
                                    if (mimeFuncs.isPlainText(comment)) {
                                        comment = '"' + comment + '"';
                                    } else {
                                        comment = mimeFuncs.encodeWord(comment);
                                    }
                                    return (value.comment ? comment + " " : "") + this._formatListUrl(value.url).replace(/^<[^:]+\/{,2}/, "");
                                }
                                // List-*: <http://domain> (comment)
                                let comment = value.comment || "";
                                if (!mimeFuncs.isPlainText(comment)) {
                                    comment = mimeFuncs.encodeWord(comment);
                                }
                                return this._formatListUrl(value.url) + (value.comment ? " (" + comment + ")" : "");
                            }
                            return "";
                        }).filter((value)=>value).join(", ")
                    }))
            }));
    }
    _formatListUrl(url) {
        url = url.replace(/[\s<]+|[\s>]+/g, "");
        if (/^(https?|mailto|ftp):/.test(url)) {
            return "<" + url + ">";
        }
        if (/^[^@]+@[^@]+$/.test(url)) {
            return "<mailto:" + url + ">";
        }
        return "<http://" + url + ">";
    }
}
module.exports = MailMessage;


/***/ }),

/***/ 2499:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint no-control-regex:0 */ 
const base64 = __webpack_require__(4806);
const qp = __webpack_require__(964);
const mimeTypes = __webpack_require__(8897);
module.exports = {
    /**
     * Checks if a value is plaintext string (uses only printable 7bit chars)
     *
     * @param {String} value String to be tested
     * @returns {Boolean} true if it is a plaintext string
     */ isPlainText (value, isParam) {
        const re = isParam ? /[\x00-\x08\x0b\x0c\x0e-\x1f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/;
        if (typeof value !== "string" || re.test(value)) {
            return false;
        } else {
            return true;
        }
    },
    /**
     * Checks if a multi line string containes lines longer than the selected value.
     *
     * Useful when detecting if a mail message needs any processing at all –
     * if only plaintext characters are used and lines are short, then there is
     * no need to encode the values in any way. If the value is plaintext but has
     * longer lines then allowed, then use format=flowed
     *
     * @param {Number} lineLength Max line length to check for
     * @returns {Boolean} Returns true if there is at least one line longer than lineLength chars
     */ hasLongerLines (str, lineLength) {
        if (str.length > 128 * 1024) {
            // do not test strings longer than 128kB
            return true;
        }
        return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
    },
    /**
     * Encodes a string or an Buffer to an UTF-8 MIME Word (rfc2047)
     *
     * @param {String|Buffer} data String to be encoded
     * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
     * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
     * @return {String} Single or several mime words joined together
     */ encodeWord (data, mimeWordEncoding, maxLength) {
        mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0);
        maxLength = maxLength || 0;
        let encodedStr;
        let toCharset = "UTF-8";
        if (maxLength && maxLength > 7 + toCharset.length) {
            maxLength -= 7 + toCharset.length;
        }
        if (mimeWordEncoding === "Q") {
            // https://tools.ietf.org/html/rfc2047#section-5 rule (3)
            encodedStr = qp.encode(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr)=>{
                let ord = chr.charCodeAt(0).toString(16).toUpperCase();
                if (chr === " ") {
                    return "_";
                } else {
                    return "=" + (ord.length === 1 ? "0" + ord : ord);
                }
            });
        } else if (mimeWordEncoding === "B") {
            encodedStr = typeof data === "string" ? data : base64.encode(data);
            maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0;
        }
        if (maxLength && (mimeWordEncoding !== "B" ? encodedStr : base64.encode(data)).length > maxLength) {
            if (mimeWordEncoding === "Q") {
                encodedStr = this.splitMimeEncodedString(encodedStr, maxLength).join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
            } else {
                // RFC2047 6.3 (2) states that encoded-word must include an integral number of characters, so no chopping unicode sequences
                let parts = [];
                let lpart = "";
                for(let i = 0, len = encodedStr.length; i < len; i++){
                    let chr = encodedStr.charAt(i);
                    if (/[\ud83c\ud83d\ud83e]/.test(chr) && i < len - 1) {
                        // composite emoji byte, so add the next byte as well
                        chr += encodedStr.charAt(++i);
                    }
                    // check if we can add this character to the existing string
                    // without breaking byte length limit
                    if (Buffer.byteLength(lpart + chr) <= maxLength || i === 0) {
                        lpart += chr;
                    } else {
                        // we hit the length limit, so push the existing string and start over
                        parts.push(base64.encode(lpart));
                        lpart = chr;
                    }
                }
                if (lpart) {
                    parts.push(base64.encode(lpart));
                }
                if (parts.length > 1) {
                    encodedStr = parts.join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
                } else {
                    encodedStr = parts.join("");
                }
            }
        } else if (mimeWordEncoding === "B") {
            encodedStr = base64.encode(data);
        }
        return "=?" + toCharset + "?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
    },
    /**
     * Finds word sequences with non ascii text and converts these to mime words
     *
     * @param {String} value String to be encoded
     * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
     * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
     * @param {Boolean} [encodeAll=false] If true and the value needs encoding then encodes entire string, not just the smallest match
     * @return {String} String with possible mime words
     */ encodeWords (value, mimeWordEncoding, maxLength, encodeAll) {
        maxLength = maxLength || 0;
        let encodedValue;
        // find first word with a non-printable ascii or special symbol in it
        let firstMatch = value.match(/(?:^|\s)([^\s]*["\u0080-\uFFFF])/);
        if (!firstMatch) {
            return value;
        }
        if (encodeAll) {
            // if it is requested to encode everything or the string contains something that resebles encoded word, then encode everything
            return this.encodeWord(value, mimeWordEncoding, maxLength);
        }
        // find the last word with a non-printable ascii in it
        let lastMatch = value.match(/(["\u0080-\uFFFF][^\s]*)[^"\u0080-\uFFFF]*$/);
        if (!lastMatch) {
            // should not happen
            return value;
        }
        let startIndex = firstMatch.index + (firstMatch[0].match(/[^\s]/) || {
            index: 0
        }).index;
        let endIndex = lastMatch.index + (lastMatch[1] || "").length;
        encodedValue = (startIndex ? value.substr(0, startIndex) : "") + this.encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : "");
        return encodedValue;
    },
    /**
     * Joins parsed header value together as 'value; param1=value1; param2=value2'
     * PS: We are following RFC 822 for the list of special characters that we need to keep in quotes.
     *      Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
     * @param {Object} structured Parsed header value
     * @return {String} joined header value
     */ buildHeaderValue (structured) {
        let paramsArray = [];
        Object.keys(structured.params || {}).forEach((param)=>{
            // filename might include unicode characters so it is a special case
            // other values probably do not
            let value = structured.params[param];
            if (!this.isPlainText(value, true) || value.length >= 75) {
                this.buildHeaderParam(param, value, 50).forEach((encodedParam)=>{
                    if (!/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*") {
                        paramsArray.push(encodedParam.key + "=" + encodedParam.value);
                    } else {
                        paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
                    }
                });
            } else if (/[\s'"\\;:/=(),<>@[\]?]|^-/.test(value)) {
                paramsArray.push(param + "=" + JSON.stringify(value));
            } else {
                paramsArray.push(param + "=" + value);
            }
        });
        return structured.value + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
    },
    /**
     * Encodes a string or an Buffer to an UTF-8 Parameter Value Continuation encoding (rfc2231)
     * Useful for splitting long parameter values.
     *
     * For example
     *      title="unicode string"
     * becomes
     *     title*0*=utf-8''unicode
     *     title*1*=%20string
     *
     * @param {String|Buffer} data String to be encoded
     * @param {Number} [maxLength=50] Max length for generated chunks
     * @param {String} [fromCharset='UTF-8'] Source sharacter set
     * @return {Array} A list of encoded keys and headers
     */ buildHeaderParam (key, data, maxLength) {
        let list = [];
        let encodedStr = typeof data === "string" ? data : (data || "").toString();
        let encodedStrArr;
        let chr, ord;
        let line;
        let startPos = 0;
        let i, len;
        maxLength = maxLength || 50;
        // process ascii only text
        if (this.isPlainText(data, true)) {
            // check if conversion is even needed
            if (encodedStr.length <= maxLength) {
                return [
                    {
                        key,
                        value: encodedStr
                    }
                ];
            }
            encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str)=>{
                list.push({
                    line: str
                });
                return "";
            });
            if (encodedStr) {
                list.push({
                    line: encodedStr
                });
            }
        } else {
            if (/[\uD800-\uDBFF]/.test(encodedStr)) {
                // string containts surrogate pairs, so normalize it to an array of bytes
                encodedStrArr = [];
                for(i = 0, len = encodedStr.length; i < len; i++){
                    chr = encodedStr.charAt(i);
                    ord = chr.charCodeAt(0);
                    if (ord >= 0xd800 && ord <= 0xdbff && i < len - 1) {
                        chr += encodedStr.charAt(i + 1);
                        encodedStrArr.push(chr);
                        i++;
                    } else {
                        encodedStrArr.push(chr);
                    }
                }
                encodedStr = encodedStrArr;
            }
            // first line includes the charset and language info and needs to be encoded
            // even if it does not contain any unicode characters
            line = "utf-8''";
            let encoded = true;
            startPos = 0;
            // process text with unicode or special chars
            for(i = 0, len = encodedStr.length; i < len; i++){
                chr = encodedStr[i];
                if (encoded) {
                    chr = this.safeEncodeURIComponent(chr);
                } else {
                    // try to urlencode current char
                    chr = chr === " " ? chr : this.safeEncodeURIComponent(chr);
                    // By default it is not required to encode a line, the need
                    // only appears when the string contains unicode or special chars
                    // in this case we start processing the line over and encode all chars
                    if (chr !== encodedStr[i]) {
                        // Check if it is even possible to add the encoded char to the line
                        // If not, there is no reason to use this line, just push it to the list
                        // and start a new line with the char that needs encoding
                        if ((this.safeEncodeURIComponent(line) + chr).length >= maxLength) {
                            list.push({
                                line,
                                encoded
                            });
                            line = "";
                            startPos = i - 1;
                        } else {
                            encoded = true;
                            i = startPos;
                            line = "";
                            continue;
                        }
                    }
                }
                // if the line is already too long, push it to the list and start a new one
                if ((line + chr).length >= maxLength) {
                    list.push({
                        line,
                        encoded
                    });
                    line = chr = encodedStr[i] === " " ? " " : this.safeEncodeURIComponent(encodedStr[i]);
                    if (chr === encodedStr[i]) {
                        encoded = false;
                        startPos = i - 1;
                    } else {
                        encoded = true;
                    }
                } else {
                    line += chr;
                }
            }
            if (line) {
                list.push({
                    line,
                    encoded
                });
            }
        }
        return list.map((item, i)=>({
                // encoded lines: {name}*{part}*
                // unencoded lines: {name}*{part}
                // if any line needs to be encoded then the first line (part==0) is always encoded
                key: key + "*" + i + (item.encoded ? "*" : ""),
                value: item.line
            }));
    },
    /**
     * Parses a header value with key=value arguments into a structured
     * object.
     *
     *   parseHeaderValue('content-type: text/plain; CHARSET='UTF-8'') ->
     *   {
     *     'value': 'text/plain',
     *     'params': {
     *       'charset': 'UTF-8'
     *     }
     *   }
     *
     * @param {String} str Header value
     * @return {Object} Header value as a parsed structure
     */ parseHeaderValue (str) {
        let response = {
            value: false,
            params: {}
        };
        let key = false;
        let value = "";
        let type = "value";
        let quote = false;
        let escaped = false;
        let chr;
        for(let i = 0, len = str.length; i < len; i++){
            chr = str.charAt(i);
            if (type === "key") {
                if (chr === "=") {
                    key = value.trim().toLowerCase();
                    type = "value";
                    value = "";
                    continue;
                }
                value += chr;
            } else {
                if (escaped) {
                    value += chr;
                } else if (chr === "\\") {
                    escaped = true;
                    continue;
                } else if (quote && chr === quote) {
                    quote = false;
                } else if (!quote && chr === '"') {
                    quote = chr;
                } else if (!quote && chr === ";") {
                    if (key === false) {
                        response.value = value.trim();
                    } else {
                        response.params[key] = value.trim();
                    }
                    type = "key";
                    value = "";
                } else {
                    value += chr;
                }
                escaped = false;
            }
        }
        if (type === "value") {
            if (key === false) {
                response.value = value.trim();
            } else {
                response.params[key] = value.trim();
            }
        } else if (value.trim()) {
            response.params[value.trim().toLowerCase()] = "";
        }
        // handle parameter value continuations
        // https://tools.ietf.org/html/rfc2231#section-3
        // preprocess values
        Object.keys(response.params).forEach((key)=>{
            let actualKey, nr, match, value;
            if (match = key.match(/(\*(\d+)|\*(\d+)\*|\*)$/)) {
                actualKey = key.substr(0, match.index);
                nr = Number(match[2] || match[3]) || 0;
                if (!response.params[actualKey] || typeof response.params[actualKey] !== "object") {
                    response.params[actualKey] = {
                        charset: false,
                        values: []
                    };
                }
                value = response.params[key];
                if (nr === 0 && match[0].substr(-1) === "*" && (match = value.match(/^([^']*)'[^']*'(.*)$/))) {
                    response.params[actualKey].charset = match[1] || "iso-8859-1";
                    value = match[2];
                }
                response.params[actualKey].values[nr] = value;
                // remove the old reference
                delete response.params[key];
            }
        });
        // concatenate split rfc2231 strings and convert encoded strings to mime encoded words
        Object.keys(response.params).forEach((key)=>{
            let value;
            if (response.params[key] && Array.isArray(response.params[key].values)) {
                value = response.params[key].values.map((val)=>val || "").join("");
                if (response.params[key].charset) {
                    // convert "%AB" to "=?charset?Q?=AB?="
                    response.params[key] = "=?" + response.params[key].charset + "?Q?" + value// fix invalidly encoded chars
                    .replace(/[=?_\s]/g, (s)=>{
                        let c = s.charCodeAt(0).toString(16);
                        if (s === " ") {
                            return "_";
                        } else {
                            return "%" + (c.length < 2 ? "0" : "") + c;
                        }
                    })// change from urlencoding to percent encoding
                    .replace(/%/g, "=") + "?=";
                } else {
                    response.params[key] = value;
                }
            }
        });
        return response;
    },
    /**
     * Returns file extension for a content type string. If no suitable extensions
     * are found, 'bin' is used as the default extension
     *
     * @param {String} mimeType Content type to be checked for
     * @return {String} File extension
     */ detectExtension: (mimeType)=>mimeTypes.detectExtension(mimeType),
    /**
     * Returns content type for a file extension. If no suitable content types
     * are found, 'application/octet-stream' is used as the default content type
     *
     * @param {String} extension Extension to be checked for
     * @return {String} File extension
     */ detectMimeType: (extension)=>mimeTypes.detectMimeType(extension),
    /**
     * Folds long lines, useful for folding header lines (afterSpace=false) and
     * flowed text (afterSpace=true)
     *
     * @param {String} str String to be folded
     * @param {Number} [lineLength=76] Maximum length of a line
     * @param {Boolean} afterSpace If true, leave a space in th end of a line
     * @return {String} String with folded lines
     */ foldLines (str, lineLength, afterSpace) {
        str = (str || "").toString();
        lineLength = lineLength || 76;
        let pos = 0, len = str.length, result = "", line, match;
        while(pos < len){
            line = str.substr(pos, lineLength);
            if (line.length < lineLength) {
                result += line;
                break;
            }
            if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
                line = match[0];
                result += line;
                pos += line.length;
                continue;
            } else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) {
                line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
            } else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
                line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
            }
            result += line;
            pos += line.length;
            if (pos < len) {
                result += "\r\n";
            }
        }
        return result;
    },
    /**
     * Splits a mime encoded string. Needed for dividing mime words into smaller chunks
     *
     * @param {String} str Mime encoded string to be split up
     * @param {Number} maxlen Maximum length of characters for one part (minimum 12)
     * @return {Array} Split string
     */ splitMimeEncodedString: (str, maxlen)=>{
        let curLine, match, chr, done, lines = [];
        // require at least 12 symbols to fit possible 4 octet UTF-8 sequences
        maxlen = Math.max(maxlen || 0, 12);
        while(str.length){
            curLine = str.substr(0, maxlen);
            // move incomplete escaped char back to main
            if (match = curLine.match(/[=][0-9A-F]?$/i)) {
                curLine = curLine.substr(0, match.index);
            }
            done = false;
            while(!done){
                done = true;
                // check if not middle of a unicode char sequence
                if (match = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) {
                    chr = parseInt(match[1], 16);
                    // invalid sequence, move one char back anc recheck
                    if (chr < 0xc2 && chr > 0x7f) {
                        curLine = curLine.substr(0, curLine.length - 3);
                        done = false;
                    }
                }
            }
            if (curLine.length) {
                lines.push(curLine);
            }
            str = str.substr(curLine.length);
        }
        return lines;
    },
    encodeURICharComponent: (chr)=>{
        let res = "";
        let ord = chr.charCodeAt(0).toString(16).toUpperCase();
        if (ord.length % 2) {
            ord = "0" + ord;
        }
        if (ord.length > 2) {
            for(let i = 0, len = ord.length / 2; i < len; i++){
                res += "%" + ord.substr(i, 2);
            }
        } else {
            res += "%" + ord;
        }
        return res;
    },
    safeEncodeURIComponent (str) {
        str = (str || "").toString();
        try {
            // might throw if we try to encode invalid sequences, eg. partial emoji
            str = encodeURIComponent(str);
        } catch (E) {
            // should never run
            return str.replace(/[^\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]+/g, "");
        }
        // ensure chars that are not handled by encodeURICompent are converted as well
        return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr)=>this.encodeURICharComponent(chr));
    }
};


/***/ }),

/***/ 8897:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint quote-props: 0 */ 
const path = __webpack_require__(1017);
const defaultMimeType = "application/octet-stream";
const defaultExtension = "bin";
const mimeTypes = new Map([
    [
        "application/acad",
        "dwg"
    ],
    [
        "application/applixware",
        "aw"
    ],
    [
        "application/arj",
        "arj"
    ],
    [
        "application/atom+xml",
        "xml"
    ],
    [
        "application/atomcat+xml",
        "atomcat"
    ],
    [
        "application/atomsvc+xml",
        "atomsvc"
    ],
    [
        "application/base64",
        [
            "mm",
            "mme"
        ]
    ],
    [
        "application/binhex",
        "hqx"
    ],
    [
        "application/binhex4",
        "hqx"
    ],
    [
        "application/book",
        [
            "book",
            "boo"
        ]
    ],
    [
        "application/ccxml+xml,",
        "ccxml"
    ],
    [
        "application/cdf",
        "cdf"
    ],
    [
        "application/cdmi-capability",
        "cdmia"
    ],
    [
        "application/cdmi-container",
        "cdmic"
    ],
    [
        "application/cdmi-domain",
        "cdmid"
    ],
    [
        "application/cdmi-object",
        "cdmio"
    ],
    [
        "application/cdmi-queue",
        "cdmiq"
    ],
    [
        "application/clariscad",
        "ccad"
    ],
    [
        "application/commonground",
        "dp"
    ],
    [
        "application/cu-seeme",
        "cu"
    ],
    [
        "application/davmount+xml",
        "davmount"
    ],
    [
        "application/drafting",
        "drw"
    ],
    [
        "application/dsptype",
        "tsp"
    ],
    [
        "application/dssc+der",
        "dssc"
    ],
    [
        "application/dssc+xml",
        "xdssc"
    ],
    [
        "application/dxf",
        "dxf"
    ],
    [
        "application/ecmascript",
        [
            "js",
            "es"
        ]
    ],
    [
        "application/emma+xml",
        "emma"
    ],
    [
        "application/envoy",
        "evy"
    ],
    [
        "application/epub+zip",
        "epub"
    ],
    [
        "application/excel",
        [
            "xls",
            "xl",
            "xla",
            "xlb",
            "xlc",
            "xld",
            "xlk",
            "xll",
            "xlm",
            "xlt",
            "xlv",
            "xlw"
        ]
    ],
    [
        "application/exi",
        "exi"
    ],
    [
        "application/font-tdpfr",
        "pfr"
    ],
    [
        "application/fractals",
        "fif"
    ],
    [
        "application/freeloader",
        "frl"
    ],
    [
        "application/futuresplash",
        "spl"
    ],
    [
        "application/gnutar",
        "tgz"
    ],
    [
        "application/groupwise",
        "vew"
    ],
    [
        "application/hlp",
        "hlp"
    ],
    [
        "application/hta",
        "hta"
    ],
    [
        "application/hyperstudio",
        "stk"
    ],
    [
        "application/i-deas",
        "unv"
    ],
    [
        "application/iges",
        [
            "iges",
            "igs"
        ]
    ],
    [
        "application/inf",
        "inf"
    ],
    [
        "application/internet-property-stream",
        "acx"
    ],
    [
        "application/ipfix",
        "ipfix"
    ],
    [
        "application/java",
        "class"
    ],
    [
        "application/java-archive",
        "jar"
    ],
    [
        "application/java-byte-code",
        "class"
    ],
    [
        "application/java-serialized-object",
        "ser"
    ],
    [
        "application/java-vm",
        "class"
    ],
    [
        "application/javascript",
        "js"
    ],
    [
        "application/json",
        "json"
    ],
    [
        "application/lha",
        "lha"
    ],
    [
        "application/lzx",
        "lzx"
    ],
    [
        "application/mac-binary",
        "bin"
    ],
    [
        "application/mac-binhex",
        "hqx"
    ],
    [
        "application/mac-binhex40",
        "hqx"
    ],
    [
        "application/mac-compactpro",
        "cpt"
    ],
    [
        "application/macbinary",
        "bin"
    ],
    [
        "application/mads+xml",
        "mads"
    ],
    [
        "application/marc",
        "mrc"
    ],
    [
        "application/marcxml+xml",
        "mrcx"
    ],
    [
        "application/mathematica",
        "ma"
    ],
    [
        "application/mathml+xml",
        "mathml"
    ],
    [
        "application/mbedlet",
        "mbd"
    ],
    [
        "application/mbox",
        "mbox"
    ],
    [
        "application/mcad",
        "mcd"
    ],
    [
        "application/mediaservercontrol+xml",
        "mscml"
    ],
    [
        "application/metalink4+xml",
        "meta4"
    ],
    [
        "application/mets+xml",
        "mets"
    ],
    [
        "application/mime",
        "aps"
    ],
    [
        "application/mods+xml",
        "mods"
    ],
    [
        "application/mp21",
        "m21"
    ],
    [
        "application/mp4",
        "mp4"
    ],
    [
        "application/mspowerpoint",
        [
            "ppt",
            "pot",
            "pps",
            "ppz"
        ]
    ],
    [
        "application/msword",
        [
            "doc",
            "dot",
            "w6w",
            "wiz",
            "word"
        ]
    ],
    [
        "application/mswrite",
        "wri"
    ],
    [
        "application/mxf",
        "mxf"
    ],
    [
        "application/netmc",
        "mcp"
    ],
    [
        "application/octet-stream",
        [
            "*"
        ]
    ],
    [
        "application/oda",
        "oda"
    ],
    [
        "application/oebps-package+xml",
        "opf"
    ],
    [
        "application/ogg",
        "ogx"
    ],
    [
        "application/olescript",
        "axs"
    ],
    [
        "application/onenote",
        "onetoc"
    ],
    [
        "application/patch-ops-error+xml",
        "xer"
    ],
    [
        "application/pdf",
        "pdf"
    ],
    [
        "application/pgp-encrypted",
        "asc"
    ],
    [
        "application/pgp-signature",
        "pgp"
    ],
    [
        "application/pics-rules",
        "prf"
    ],
    [
        "application/pkcs-12",
        "p12"
    ],
    [
        "application/pkcs-crl",
        "crl"
    ],
    [
        "application/pkcs10",
        "p10"
    ],
    [
        "application/pkcs7-mime",
        [
            "p7c",
            "p7m"
        ]
    ],
    [
        "application/pkcs7-signature",
        "p7s"
    ],
    [
        "application/pkcs8",
        "p8"
    ],
    [
        "application/pkix-attr-cert",
        "ac"
    ],
    [
        "application/pkix-cert",
        [
            "cer",
            "crt"
        ]
    ],
    [
        "application/pkix-crl",
        "crl"
    ],
    [
        "application/pkix-pkipath",
        "pkipath"
    ],
    [
        "application/pkixcmp",
        "pki"
    ],
    [
        "application/plain",
        "text"
    ],
    [
        "application/pls+xml",
        "pls"
    ],
    [
        "application/postscript",
        [
            "ps",
            "ai",
            "eps"
        ]
    ],
    [
        "application/powerpoint",
        "ppt"
    ],
    [
        "application/pro_eng",
        [
            "part",
            "prt"
        ]
    ],
    [
        "application/prs.cww",
        "cww"
    ],
    [
        "application/pskc+xml",
        "pskcxml"
    ],
    [
        "application/rdf+xml",
        "rdf"
    ],
    [
        "application/reginfo+xml",
        "rif"
    ],
    [
        "application/relax-ng-compact-syntax",
        "rnc"
    ],
    [
        "application/resource-lists+xml",
        "rl"
    ],
    [
        "application/resource-lists-diff+xml",
        "rld"
    ],
    [
        "application/ringing-tones",
        "rng"
    ],
    [
        "application/rls-services+xml",
        "rs"
    ],
    [
        "application/rsd+xml",
        "rsd"
    ],
    [
        "application/rss+xml",
        "xml"
    ],
    [
        "application/rtf",
        [
            "rtf",
            "rtx"
        ]
    ],
    [
        "application/sbml+xml",
        "sbml"
    ],
    [
        "application/scvp-cv-request",
        "scq"
    ],
    [
        "application/scvp-cv-response",
        "scs"
    ],
    [
        "application/scvp-vp-request",
        "spq"
    ],
    [
        "application/scvp-vp-response",
        "spp"
    ],
    [
        "application/sdp",
        "sdp"
    ],
    [
        "application/sea",
        "sea"
    ],
    [
        "application/set",
        "set"
    ],
    [
        "application/set-payment-initiation",
        "setpay"
    ],
    [
        "application/set-registration-initiation",
        "setreg"
    ],
    [
        "application/shf+xml",
        "shf"
    ],
    [
        "application/sla",
        "stl"
    ],
    [
        "application/smil",
        [
            "smi",
            "smil"
        ]
    ],
    [
        "application/smil+xml",
        "smi"
    ],
    [
        "application/solids",
        "sol"
    ],
    [
        "application/sounder",
        "sdr"
    ],
    [
        "application/sparql-query",
        "rq"
    ],
    [
        "application/sparql-results+xml",
        "srx"
    ],
    [
        "application/srgs",
        "gram"
    ],
    [
        "application/srgs+xml",
        "grxml"
    ],
    [
        "application/sru+xml",
        "sru"
    ],
    [
        "application/ssml+xml",
        "ssml"
    ],
    [
        "application/step",
        [
            "step",
            "stp"
        ]
    ],
    [
        "application/streamingmedia",
        "ssm"
    ],
    [
        "application/tei+xml",
        "tei"
    ],
    [
        "application/thraud+xml",
        "tfi"
    ],
    [
        "application/timestamped-data",
        "tsd"
    ],
    [
        "application/toolbook",
        "tbk"
    ],
    [
        "application/vda",
        "vda"
    ],
    [
        "application/vnd.3gpp.pic-bw-large",
        "plb"
    ],
    [
        "application/vnd.3gpp.pic-bw-small",
        "psb"
    ],
    [
        "application/vnd.3gpp.pic-bw-var",
        "pvb"
    ],
    [
        "application/vnd.3gpp2.tcap",
        "tcap"
    ],
    [
        "application/vnd.3m.post-it-notes",
        "pwn"
    ],
    [
        "application/vnd.accpac.simply.aso",
        "aso"
    ],
    [
        "application/vnd.accpac.simply.imp",
        "imp"
    ],
    [
        "application/vnd.acucobol",
        "acu"
    ],
    [
        "application/vnd.acucorp",
        "atc"
    ],
    [
        "application/vnd.adobe.air-application-installer-package+zip",
        "air"
    ],
    [
        "application/vnd.adobe.fxp",
        "fxp"
    ],
    [
        "application/vnd.adobe.xdp+xml",
        "xdp"
    ],
    [
        "application/vnd.adobe.xfdf",
        "xfdf"
    ],
    [
        "application/vnd.ahead.space",
        "ahead"
    ],
    [
        "application/vnd.airzip.filesecure.azf",
        "azf"
    ],
    [
        "application/vnd.airzip.filesecure.azs",
        "azs"
    ],
    [
        "application/vnd.amazon.ebook",
        "azw"
    ],
    [
        "application/vnd.americandynamics.acc",
        "acc"
    ],
    [
        "application/vnd.amiga.ami",
        "ami"
    ],
    [
        "application/vnd.android.package-archive",
        "apk"
    ],
    [
        "application/vnd.anser-web-certificate-issue-initiation",
        "cii"
    ],
    [
        "application/vnd.anser-web-funds-transfer-initiation",
        "fti"
    ],
    [
        "application/vnd.antix.game-component",
        "atx"
    ],
    [
        "application/vnd.apple.installer+xml",
        "mpkg"
    ],
    [
        "application/vnd.apple.mpegurl",
        "m3u8"
    ],
    [
        "application/vnd.aristanetworks.swi",
        "swi"
    ],
    [
        "application/vnd.audiograph",
        "aep"
    ],
    [
        "application/vnd.blueice.multipass",
        "mpm"
    ],
    [
        "application/vnd.bmi",
        "bmi"
    ],
    [
        "application/vnd.businessobjects",
        "rep"
    ],
    [
        "application/vnd.chemdraw+xml",
        "cdxml"
    ],
    [
        "application/vnd.chipnuts.karaoke-mmd",
        "mmd"
    ],
    [
        "application/vnd.cinderella",
        "cdy"
    ],
    [
        "application/vnd.claymore",
        "cla"
    ],
    [
        "application/vnd.cloanto.rp9",
        "rp9"
    ],
    [
        "application/vnd.clonk.c4group",
        "c4g"
    ],
    [
        "application/vnd.cluetrust.cartomobile-config",
        "c11amc"
    ],
    [
        "application/vnd.cluetrust.cartomobile-config-pkg",
        "c11amz"
    ],
    [
        "application/vnd.commonspace",
        "csp"
    ],
    [
        "application/vnd.contact.cmsg",
        "cdbcmsg"
    ],
    [
        "application/vnd.cosmocaller",
        "cmc"
    ],
    [
        "application/vnd.crick.clicker",
        "clkx"
    ],
    [
        "application/vnd.crick.clicker.keyboard",
        "clkk"
    ],
    [
        "application/vnd.crick.clicker.palette",
        "clkp"
    ],
    [
        "application/vnd.crick.clicker.template",
        "clkt"
    ],
    [
        "application/vnd.crick.clicker.wordbank",
        "clkw"
    ],
    [
        "application/vnd.criticaltools.wbs+xml",
        "wbs"
    ],
    [
        "application/vnd.ctc-posml",
        "pml"
    ],
    [
        "application/vnd.cups-ppd",
        "ppd"
    ],
    [
        "application/vnd.curl.car",
        "car"
    ],
    [
        "application/vnd.curl.pcurl",
        "pcurl"
    ],
    [
        "application/vnd.data-vision.rdz",
        "rdz"
    ],
    [
        "application/vnd.denovo.fcselayout-link",
        "fe_launch"
    ],
    [
        "application/vnd.dna",
        "dna"
    ],
    [
        "application/vnd.dolby.mlp",
        "mlp"
    ],
    [
        "application/vnd.dpgraph",
        "dpg"
    ],
    [
        "application/vnd.dreamfactory",
        "dfac"
    ],
    [
        "application/vnd.dvb.ait",
        "ait"
    ],
    [
        "application/vnd.dvb.service",
        "svc"
    ],
    [
        "application/vnd.dynageo",
        "geo"
    ],
    [
        "application/vnd.ecowin.chart",
        "mag"
    ],
    [
        "application/vnd.enliven",
        "nml"
    ],
    [
        "application/vnd.epson.esf",
        "esf"
    ],
    [
        "application/vnd.epson.msf",
        "msf"
    ],
    [
        "application/vnd.epson.quickanime",
        "qam"
    ],
    [
        "application/vnd.epson.salt",
        "slt"
    ],
    [
        "application/vnd.epson.ssf",
        "ssf"
    ],
    [
        "application/vnd.eszigno3+xml",
        "es3"
    ],
    [
        "application/vnd.ezpix-album",
        "ez2"
    ],
    [
        "application/vnd.ezpix-package",
        "ez3"
    ],
    [
        "application/vnd.fdf",
        "fdf"
    ],
    [
        "application/vnd.fdsn.seed",
        "seed"
    ],
    [
        "application/vnd.flographit",
        "gph"
    ],
    [
        "application/vnd.fluxtime.clip",
        "ftc"
    ],
    [
        "application/vnd.framemaker",
        "fm"
    ],
    [
        "application/vnd.frogans.fnc",
        "fnc"
    ],
    [
        "application/vnd.frogans.ltf",
        "ltf"
    ],
    [
        "application/vnd.fsc.weblaunch",
        "fsc"
    ],
    [
        "application/vnd.fujitsu.oasys",
        "oas"
    ],
    [
        "application/vnd.fujitsu.oasys2",
        "oa2"
    ],
    [
        "application/vnd.fujitsu.oasys3",
        "oa3"
    ],
    [
        "application/vnd.fujitsu.oasysgp",
        "fg5"
    ],
    [
        "application/vnd.fujitsu.oasysprs",
        "bh2"
    ],
    [
        "application/vnd.fujixerox.ddd",
        "ddd"
    ],
    [
        "application/vnd.fujixerox.docuworks",
        "xdw"
    ],
    [
        "application/vnd.fujixerox.docuworks.binder",
        "xbd"
    ],
    [
        "application/vnd.fuzzysheet",
        "fzs"
    ],
    [
        "application/vnd.genomatix.tuxedo",
        "txd"
    ],
    [
        "application/vnd.geogebra.file",
        "ggb"
    ],
    [
        "application/vnd.geogebra.tool",
        "ggt"
    ],
    [
        "application/vnd.geometry-explorer",
        "gex"
    ],
    [
        "application/vnd.geonext",
        "gxt"
    ],
    [
        "application/vnd.geoplan",
        "g2w"
    ],
    [
        "application/vnd.geospace",
        "g3w"
    ],
    [
        "application/vnd.gmx",
        "gmx"
    ],
    [
        "application/vnd.google-earth.kml+xml",
        "kml"
    ],
    [
        "application/vnd.google-earth.kmz",
        "kmz"
    ],
    [
        "application/vnd.grafeq",
        "gqf"
    ],
    [
        "application/vnd.groove-account",
        "gac"
    ],
    [
        "application/vnd.groove-help",
        "ghf"
    ],
    [
        "application/vnd.groove-identity-message",
        "gim"
    ],
    [
        "application/vnd.groove-injector",
        "grv"
    ],
    [
        "application/vnd.groove-tool-message",
        "gtm"
    ],
    [
        "application/vnd.groove-tool-template",
        "tpl"
    ],
    [
        "application/vnd.groove-vcard",
        "vcg"
    ],
    [
        "application/vnd.hal+xml",
        "hal"
    ],
    [
        "application/vnd.handheld-entertainment+xml",
        "zmm"
    ],
    [
        "application/vnd.hbci",
        "hbci"
    ],
    [
        "application/vnd.hhe.lesson-player",
        "les"
    ],
    [
        "application/vnd.hp-hpgl",
        [
            "hgl",
            "hpg",
            "hpgl"
        ]
    ],
    [
        "application/vnd.hp-hpid",
        "hpid"
    ],
    [
        "application/vnd.hp-hps",
        "hps"
    ],
    [
        "application/vnd.hp-jlyt",
        "jlt"
    ],
    [
        "application/vnd.hp-pcl",
        "pcl"
    ],
    [
        "application/vnd.hp-pclxl",
        "pclxl"
    ],
    [
        "application/vnd.hydrostatix.sof-data",
        "sfd-hdstx"
    ],
    [
        "application/vnd.hzn-3d-crossword",
        "x3d"
    ],
    [
        "application/vnd.ibm.minipay",
        "mpy"
    ],
    [
        "application/vnd.ibm.modcap",
        "afp"
    ],
    [
        "application/vnd.ibm.rights-management",
        "irm"
    ],
    [
        "application/vnd.ibm.secure-container",
        "sc"
    ],
    [
        "application/vnd.iccprofile",
        "icc"
    ],
    [
        "application/vnd.igloader",
        "igl"
    ],
    [
        "application/vnd.immervision-ivp",
        "ivp"
    ],
    [
        "application/vnd.immervision-ivu",
        "ivu"
    ],
    [
        "application/vnd.insors.igm",
        "igm"
    ],
    [
        "application/vnd.intercon.formnet",
        "xpw"
    ],
    [
        "application/vnd.intergeo",
        "i2g"
    ],
    [
        "application/vnd.intu.qbo",
        "qbo"
    ],
    [
        "application/vnd.intu.qfx",
        "qfx"
    ],
    [
        "application/vnd.ipunplugged.rcprofile",
        "rcprofile"
    ],
    [
        "application/vnd.irepository.package+xml",
        "irp"
    ],
    [
        "application/vnd.is-xpr",
        "xpr"
    ],
    [
        "application/vnd.isac.fcs",
        "fcs"
    ],
    [
        "application/vnd.jam",
        "jam"
    ],
    [
        "application/vnd.jcp.javame.midlet-rms",
        "rms"
    ],
    [
        "application/vnd.jisp",
        "jisp"
    ],
    [
        "application/vnd.joost.joda-archive",
        "joda"
    ],
    [
        "application/vnd.kahootz",
        "ktz"
    ],
    [
        "application/vnd.kde.karbon",
        "karbon"
    ],
    [
        "application/vnd.kde.kchart",
        "chrt"
    ],
    [
        "application/vnd.kde.kformula",
        "kfo"
    ],
    [
        "application/vnd.kde.kivio",
        "flw"
    ],
    [
        "application/vnd.kde.kontour",
        "kon"
    ],
    [
        "application/vnd.kde.kpresenter",
        "kpr"
    ],
    [
        "application/vnd.kde.kspread",
        "ksp"
    ],
    [
        "application/vnd.kde.kword",
        "kwd"
    ],
    [
        "application/vnd.kenameaapp",
        "htke"
    ],
    [
        "application/vnd.kidspiration",
        "kia"
    ],
    [
        "application/vnd.kinar",
        "kne"
    ],
    [
        "application/vnd.koan",
        "skp"
    ],
    [
        "application/vnd.kodak-descriptor",
        "sse"
    ],
    [
        "application/vnd.las.las+xml",
        "lasxml"
    ],
    [
        "application/vnd.llamagraphics.life-balance.desktop",
        "lbd"
    ],
    [
        "application/vnd.llamagraphics.life-balance.exchange+xml",
        "lbe"
    ],
    [
        "application/vnd.lotus-1-2-3",
        "123"
    ],
    [
        "application/vnd.lotus-approach",
        "apr"
    ],
    [
        "application/vnd.lotus-freelance",
        "pre"
    ],
    [
        "application/vnd.lotus-notes",
        "nsf"
    ],
    [
        "application/vnd.lotus-organizer",
        "org"
    ],
    [
        "application/vnd.lotus-screencam",
        "scm"
    ],
    [
        "application/vnd.lotus-wordpro",
        "lwp"
    ],
    [
        "application/vnd.macports.portpkg",
        "portpkg"
    ],
    [
        "application/vnd.mcd",
        "mcd"
    ],
    [
        "application/vnd.medcalcdata",
        "mc1"
    ],
    [
        "application/vnd.mediastation.cdkey",
        "cdkey"
    ],
    [
        "application/vnd.mfer",
        "mwf"
    ],
    [
        "application/vnd.mfmp",
        "mfm"
    ],
    [
        "application/vnd.micrografx.flo",
        "flo"
    ],
    [
        "application/vnd.micrografx.igx",
        "igx"
    ],
    [
        "application/vnd.mif",
        "mif"
    ],
    [
        "application/vnd.mobius.daf",
        "daf"
    ],
    [
        "application/vnd.mobius.dis",
        "dis"
    ],
    [
        "application/vnd.mobius.mbk",
        "mbk"
    ],
    [
        "application/vnd.mobius.mqy",
        "mqy"
    ],
    [
        "application/vnd.mobius.msl",
        "msl"
    ],
    [
        "application/vnd.mobius.plc",
        "plc"
    ],
    [
        "application/vnd.mobius.txf",
        "txf"
    ],
    [
        "application/vnd.mophun.application",
        "mpn"
    ],
    [
        "application/vnd.mophun.certificate",
        "mpc"
    ],
    [
        "application/vnd.mozilla.xul+xml",
        "xul"
    ],
    [
        "application/vnd.ms-artgalry",
        "cil"
    ],
    [
        "application/vnd.ms-cab-compressed",
        "cab"
    ],
    [
        "application/vnd.ms-excel",
        [
            "xls",
            "xla",
            "xlc",
            "xlm",
            "xlt",
            "xlw",
            "xlb",
            "xll"
        ]
    ],
    [
        "application/vnd.ms-excel.addin.macroenabled.12",
        "xlam"
    ],
    [
        "application/vnd.ms-excel.sheet.binary.macroenabled.12",
        "xlsb"
    ],
    [
        "application/vnd.ms-excel.sheet.macroenabled.12",
        "xlsm"
    ],
    [
        "application/vnd.ms-excel.template.macroenabled.12",
        "xltm"
    ],
    [
        "application/vnd.ms-fontobject",
        "eot"
    ],
    [
        "application/vnd.ms-htmlhelp",
        "chm"
    ],
    [
        "application/vnd.ms-ims",
        "ims"
    ],
    [
        "application/vnd.ms-lrm",
        "lrm"
    ],
    [
        "application/vnd.ms-officetheme",
        "thmx"
    ],
    [
        "application/vnd.ms-outlook",
        "msg"
    ],
    [
        "application/vnd.ms-pki.certstore",
        "sst"
    ],
    [
        "application/vnd.ms-pki.pko",
        "pko"
    ],
    [
        "application/vnd.ms-pki.seccat",
        "cat"
    ],
    [
        "application/vnd.ms-pki.stl",
        "stl"
    ],
    [
        "application/vnd.ms-pkicertstore",
        "sst"
    ],
    [
        "application/vnd.ms-pkiseccat",
        "cat"
    ],
    [
        "application/vnd.ms-pkistl",
        "stl"
    ],
    [
        "application/vnd.ms-powerpoint",
        [
            "ppt",
            "pot",
            "pps",
            "ppa",
            "pwz"
        ]
    ],
    [
        "application/vnd.ms-powerpoint.addin.macroenabled.12",
        "ppam"
    ],
    [
        "application/vnd.ms-powerpoint.presentation.macroenabled.12",
        "pptm"
    ],
    [
        "application/vnd.ms-powerpoint.slide.macroenabled.12",
        "sldm"
    ],
    [
        "application/vnd.ms-powerpoint.slideshow.macroenabled.12",
        "ppsm"
    ],
    [
        "application/vnd.ms-powerpoint.template.macroenabled.12",
        "potm"
    ],
    [
        "application/vnd.ms-project",
        "mpp"
    ],
    [
        "application/vnd.ms-word.document.macroenabled.12",
        "docm"
    ],
    [
        "application/vnd.ms-word.template.macroenabled.12",
        "dotm"
    ],
    [
        "application/vnd.ms-works",
        [
            "wks",
            "wcm",
            "wdb",
            "wps"
        ]
    ],
    [
        "application/vnd.ms-wpl",
        "wpl"
    ],
    [
        "application/vnd.ms-xpsdocument",
        "xps"
    ],
    [
        "application/vnd.mseq",
        "mseq"
    ],
    [
        "application/vnd.musician",
        "mus"
    ],
    [
        "application/vnd.muvee.style",
        "msty"
    ],
    [
        "application/vnd.neurolanguage.nlu",
        "nlu"
    ],
    [
        "application/vnd.noblenet-directory",
        "nnd"
    ],
    [
        "application/vnd.noblenet-sealer",
        "nns"
    ],
    [
        "application/vnd.noblenet-web",
        "nnw"
    ],
    [
        "application/vnd.nokia.configuration-message",
        "ncm"
    ],
    [
        "application/vnd.nokia.n-gage.data",
        "ngdat"
    ],
    [
        "application/vnd.nokia.n-gage.symbian.install",
        "n-gage"
    ],
    [
        "application/vnd.nokia.radio-preset",
        "rpst"
    ],
    [
        "application/vnd.nokia.radio-presets",
        "rpss"
    ],
    [
        "application/vnd.nokia.ringing-tone",
        "rng"
    ],
    [
        "application/vnd.novadigm.edm",
        "edm"
    ],
    [
        "application/vnd.novadigm.edx",
        "edx"
    ],
    [
        "application/vnd.novadigm.ext",
        "ext"
    ],
    [
        "application/vnd.oasis.opendocument.chart",
        "odc"
    ],
    [
        "application/vnd.oasis.opendocument.chart-template",
        "otc"
    ],
    [
        "application/vnd.oasis.opendocument.database",
        "odb"
    ],
    [
        "application/vnd.oasis.opendocument.formula",
        "odf"
    ],
    [
        "application/vnd.oasis.opendocument.formula-template",
        "odft"
    ],
    [
        "application/vnd.oasis.opendocument.graphics",
        "odg"
    ],
    [
        "application/vnd.oasis.opendocument.graphics-template",
        "otg"
    ],
    [
        "application/vnd.oasis.opendocument.image",
        "odi"
    ],
    [
        "application/vnd.oasis.opendocument.image-template",
        "oti"
    ],
    [
        "application/vnd.oasis.opendocument.presentation",
        "odp"
    ],
    [
        "application/vnd.oasis.opendocument.presentation-template",
        "otp"
    ],
    [
        "application/vnd.oasis.opendocument.spreadsheet",
        "ods"
    ],
    [
        "application/vnd.oasis.opendocument.spreadsheet-template",
        "ots"
    ],
    [
        "application/vnd.oasis.opendocument.text",
        "odt"
    ],
    [
        "application/vnd.oasis.opendocument.text-master",
        "odm"
    ],
    [
        "application/vnd.oasis.opendocument.text-template",
        "ott"
    ],
    [
        "application/vnd.oasis.opendocument.text-web",
        "oth"
    ],
    [
        "application/vnd.olpc-sugar",
        "xo"
    ],
    [
        "application/vnd.oma.dd2+xml",
        "dd2"
    ],
    [
        "application/vnd.openofficeorg.extension",
        "oxt"
    ],
    [
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "pptx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.presentationml.slide",
        "sldx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
        "ppsx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.presentationml.template",
        "potx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xlsx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
        "xltx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "docx"
    ],
    [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
        "dotx"
    ],
    [
        "application/vnd.osgeo.mapguide.package",
        "mgp"
    ],
    [
        "application/vnd.osgi.dp",
        "dp"
    ],
    [
        "application/vnd.palm",
        "pdb"
    ],
    [
        "application/vnd.pawaafile",
        "paw"
    ],
    [
        "application/vnd.pg.format",
        "str"
    ],
    [
        "application/vnd.pg.osasli",
        "ei6"
    ],
    [
        "application/vnd.picsel",
        "efif"
    ],
    [
        "application/vnd.pmi.widget",
        "wg"
    ],
    [
        "application/vnd.pocketlearn",
        "plf"
    ],
    [
        "application/vnd.powerbuilder6",
        "pbd"
    ],
    [
        "application/vnd.previewsystems.box",
        "box"
    ],
    [
        "application/vnd.proteus.magazine",
        "mgz"
    ],
    [
        "application/vnd.publishare-delta-tree",
        "qps"
    ],
    [
        "application/vnd.pvi.ptid1",
        "ptid"
    ],
    [
        "application/vnd.quark.quarkxpress",
        "qxd"
    ],
    [
        "application/vnd.realvnc.bed",
        "bed"
    ],
    [
        "application/vnd.recordare.musicxml",
        "mxl"
    ],
    [
        "application/vnd.recordare.musicxml+xml",
        "musicxml"
    ],
    [
        "application/vnd.rig.cryptonote",
        "cryptonote"
    ],
    [
        "application/vnd.rim.cod",
        "cod"
    ],
    [
        "application/vnd.rn-realmedia",
        "rm"
    ],
    [
        "application/vnd.rn-realplayer",
        "rnx"
    ],
    [
        "application/vnd.route66.link66+xml",
        "link66"
    ],
    [
        "application/vnd.sailingtracker.track",
        "st"
    ],
    [
        "application/vnd.seemail",
        "see"
    ],
    [
        "application/vnd.sema",
        "sema"
    ],
    [
        "application/vnd.semd",
        "semd"
    ],
    [
        "application/vnd.semf",
        "semf"
    ],
    [
        "application/vnd.shana.informed.formdata",
        "ifm"
    ],
    [
        "application/vnd.shana.informed.formtemplate",
        "itp"
    ],
    [
        "application/vnd.shana.informed.interchange",
        "iif"
    ],
    [
        "application/vnd.shana.informed.package",
        "ipk"
    ],
    [
        "application/vnd.simtech-mindmapper",
        "twd"
    ],
    [
        "application/vnd.smaf",
        "mmf"
    ],
    [
        "application/vnd.smart.teacher",
        "teacher"
    ],
    [
        "application/vnd.solent.sdkm+xml",
        "sdkm"
    ],
    [
        "application/vnd.spotfire.dxp",
        "dxp"
    ],
    [
        "application/vnd.spotfire.sfs",
        "sfs"
    ],
    [
        "application/vnd.stardivision.calc",
        "sdc"
    ],
    [
        "application/vnd.stardivision.draw",
        "sda"
    ],
    [
        "application/vnd.stardivision.impress",
        "sdd"
    ],
    [
        "application/vnd.stardivision.math",
        "smf"
    ],
    [
        "application/vnd.stardivision.writer",
        "sdw"
    ],
    [
        "application/vnd.stardivision.writer-global",
        "sgl"
    ],
    [
        "application/vnd.stepmania.stepchart",
        "sm"
    ],
    [
        "application/vnd.sun.xml.calc",
        "sxc"
    ],
    [
        "application/vnd.sun.xml.calc.template",
        "stc"
    ],
    [
        "application/vnd.sun.xml.draw",
        "sxd"
    ],
    [
        "application/vnd.sun.xml.draw.template",
        "std"
    ],
    [
        "application/vnd.sun.xml.impress",
        "sxi"
    ],
    [
        "application/vnd.sun.xml.impress.template",
        "sti"
    ],
    [
        "application/vnd.sun.xml.math",
        "sxm"
    ],
    [
        "application/vnd.sun.xml.writer",
        "sxw"
    ],
    [
        "application/vnd.sun.xml.writer.global",
        "sxg"
    ],
    [
        "application/vnd.sun.xml.writer.template",
        "stw"
    ],
    [
        "application/vnd.sus-calendar",
        "sus"
    ],
    [
        "application/vnd.svd",
        "svd"
    ],
    [
        "application/vnd.symbian.install",
        "sis"
    ],
    [
        "application/vnd.syncml+xml",
        "xsm"
    ],
    [
        "application/vnd.syncml.dm+wbxml",
        "bdm"
    ],
    [
        "application/vnd.syncml.dm+xml",
        "xdm"
    ],
    [
        "application/vnd.tao.intent-module-archive",
        "tao"
    ],
    [
        "application/vnd.tmobile-livetv",
        "tmo"
    ],
    [
        "application/vnd.trid.tpt",
        "tpt"
    ],
    [
        "application/vnd.triscape.mxs",
        "mxs"
    ],
    [
        "application/vnd.trueapp",
        "tra"
    ],
    [
        "application/vnd.ufdl",
        "ufd"
    ],
    [
        "application/vnd.uiq.theme",
        "utz"
    ],
    [
        "application/vnd.umajin",
        "umj"
    ],
    [
        "application/vnd.unity",
        "unityweb"
    ],
    [
        "application/vnd.uoml+xml",
        "uoml"
    ],
    [
        "application/vnd.vcx",
        "vcx"
    ],
    [
        "application/vnd.visio",
        "vsd"
    ],
    [
        "application/vnd.visionary",
        "vis"
    ],
    [
        "application/vnd.vsf",
        "vsf"
    ],
    [
        "application/vnd.wap.wbxml",
        "wbxml"
    ],
    [
        "application/vnd.wap.wmlc",
        "wmlc"
    ],
    [
        "application/vnd.wap.wmlscriptc",
        "wmlsc"
    ],
    [
        "application/vnd.webturbo",
        "wtb"
    ],
    [
        "application/vnd.wolfram.player",
        "nbp"
    ],
    [
        "application/vnd.wordperfect",
        "wpd"
    ],
    [
        "application/vnd.wqd",
        "wqd"
    ],
    [
        "application/vnd.wt.stf",
        "stf"
    ],
    [
        "application/vnd.xara",
        [
            "web",
            "xar"
        ]
    ],
    [
        "application/vnd.xfdl",
        "xfdl"
    ],
    [
        "application/vnd.yamaha.hv-dic",
        "hvd"
    ],
    [
        "application/vnd.yamaha.hv-script",
        "hvs"
    ],
    [
        "application/vnd.yamaha.hv-voice",
        "hvp"
    ],
    [
        "application/vnd.yamaha.openscoreformat",
        "osf"
    ],
    [
        "application/vnd.yamaha.openscoreformat.osfpvg+xml",
        "osfpvg"
    ],
    [
        "application/vnd.yamaha.smaf-audio",
        "saf"
    ],
    [
        "application/vnd.yamaha.smaf-phrase",
        "spf"
    ],
    [
        "application/vnd.yellowriver-custom-menu",
        "cmp"
    ],
    [
        "application/vnd.zul",
        "zir"
    ],
    [
        "application/vnd.zzazz.deck+xml",
        "zaz"
    ],
    [
        "application/vocaltec-media-desc",
        "vmd"
    ],
    [
        "application/vocaltec-media-file",
        "vmf"
    ],
    [
        "application/voicexml+xml",
        "vxml"
    ],
    [
        "application/widget",
        "wgt"
    ],
    [
        "application/winhlp",
        "hlp"
    ],
    [
        "application/wordperfect",
        [
            "wp",
            "wp5",
            "wp6",
            "wpd"
        ]
    ],
    [
        "application/wordperfect6.0",
        [
            "w60",
            "wp5"
        ]
    ],
    [
        "application/wordperfect6.1",
        "w61"
    ],
    [
        "application/wsdl+xml",
        "wsdl"
    ],
    [
        "application/wspolicy+xml",
        "wspolicy"
    ],
    [
        "application/x-123",
        "wk1"
    ],
    [
        "application/x-7z-compressed",
        "7z"
    ],
    [
        "application/x-abiword",
        "abw"
    ],
    [
        "application/x-ace-compressed",
        "ace"
    ],
    [
        "application/x-aim",
        "aim"
    ],
    [
        "application/x-authorware-bin",
        "aab"
    ],
    [
        "application/x-authorware-map",
        "aam"
    ],
    [
        "application/x-authorware-seg",
        "aas"
    ],
    [
        "application/x-bcpio",
        "bcpio"
    ],
    [
        "application/x-binary",
        "bin"
    ],
    [
        "application/x-binhex40",
        "hqx"
    ],
    [
        "application/x-bittorrent",
        "torrent"
    ],
    [
        "application/x-bsh",
        [
            "bsh",
            "sh",
            "shar"
        ]
    ],
    [
        "application/x-bytecode.elisp",
        "elc"
    ],
    [
        "application/x-bytecode.python",
        "pyc"
    ],
    [
        "application/x-bzip",
        "bz"
    ],
    [
        "application/x-bzip2",
        [
            "boz",
            "bz2"
        ]
    ],
    [
        "application/x-cdf",
        "cdf"
    ],
    [
        "application/x-cdlink",
        "vcd"
    ],
    [
        "application/x-chat",
        [
            "cha",
            "chat"
        ]
    ],
    [
        "application/x-chess-pgn",
        "pgn"
    ],
    [
        "application/x-cmu-raster",
        "ras"
    ],
    [
        "application/x-cocoa",
        "cco"
    ],
    [
        "application/x-compactpro",
        "cpt"
    ],
    [
        "application/x-compress",
        "z"
    ],
    [
        "application/x-compressed",
        [
            "tgz",
            "gz",
            "z",
            "zip"
        ]
    ],
    [
        "application/x-conference",
        "nsc"
    ],
    [
        "application/x-cpio",
        "cpio"
    ],
    [
        "application/x-cpt",
        "cpt"
    ],
    [
        "application/x-csh",
        "csh"
    ],
    [
        "application/x-debian-package",
        "deb"
    ],
    [
        "application/x-deepv",
        "deepv"
    ],
    [
        "application/x-director",
        [
            "dir",
            "dcr",
            "dxr"
        ]
    ],
    [
        "application/x-doom",
        "wad"
    ],
    [
        "application/x-dtbncx+xml",
        "ncx"
    ],
    [
        "application/x-dtbook+xml",
        "dtb"
    ],
    [
        "application/x-dtbresource+xml",
        "res"
    ],
    [
        "application/x-dvi",
        "dvi"
    ],
    [
        "application/x-elc",
        "elc"
    ],
    [
        "application/x-envoy",
        [
            "env",
            "evy"
        ]
    ],
    [
        "application/x-esrehber",
        "es"
    ],
    [
        "application/x-excel",
        [
            "xls",
            "xla",
            "xlb",
            "xlc",
            "xld",
            "xlk",
            "xll",
            "xlm",
            "xlt",
            "xlv",
            "xlw"
        ]
    ],
    [
        "application/x-font-bdf",
        "bdf"
    ],
    [
        "application/x-font-ghostscript",
        "gsf"
    ],
    [
        "application/x-font-linux-psf",
        "psf"
    ],
    [
        "application/x-font-otf",
        "otf"
    ],
    [
        "application/x-font-pcf",
        "pcf"
    ],
    [
        "application/x-font-snf",
        "snf"
    ],
    [
        "application/x-font-ttf",
        "ttf"
    ],
    [
        "application/x-font-type1",
        "pfa"
    ],
    [
        "application/x-font-woff",
        "woff"
    ],
    [
        "application/x-frame",
        "mif"
    ],
    [
        "application/x-freelance",
        "pre"
    ],
    [
        "application/x-futuresplash",
        "spl"
    ],
    [
        "application/x-gnumeric",
        "gnumeric"
    ],
    [
        "application/x-gsp",
        "gsp"
    ],
    [
        "application/x-gss",
        "gss"
    ],
    [
        "application/x-gtar",
        "gtar"
    ],
    [
        "application/x-gzip",
        [
            "gz",
            "gzip"
        ]
    ],
    [
        "application/x-hdf",
        "hdf"
    ],
    [
        "application/x-helpfile",
        [
            "help",
            "hlp"
        ]
    ],
    [
        "application/x-httpd-imap",
        "imap"
    ],
    [
        "application/x-ima",
        "ima"
    ],
    [
        "application/x-internet-signup",
        [
            "ins",
            "isp"
        ]
    ],
    [
        "application/x-internett-signup",
        "ins"
    ],
    [
        "application/x-inventor",
        "iv"
    ],
    [
        "application/x-ip2",
        "ip"
    ],
    [
        "application/x-iphone",
        "iii"
    ],
    [
        "application/x-java-class",
        "class"
    ],
    [
        "application/x-java-commerce",
        "jcm"
    ],
    [
        "application/x-java-jnlp-file",
        "jnlp"
    ],
    [
        "application/x-javascript",
        "js"
    ],
    [
        "application/x-koan",
        [
            "skd",
            "skm",
            "skp",
            "skt"
        ]
    ],
    [
        "application/x-ksh",
        "ksh"
    ],
    [
        "application/x-latex",
        [
            "latex",
            "ltx"
        ]
    ],
    [
        "application/x-lha",
        "lha"
    ],
    [
        "application/x-lisp",
        "lsp"
    ],
    [
        "application/x-livescreen",
        "ivy"
    ],
    [
        "application/x-lotus",
        "wq1"
    ],
    [
        "application/x-lotusscreencam",
        "scm"
    ],
    [
        "application/x-lzh",
        "lzh"
    ],
    [
        "application/x-lzx",
        "lzx"
    ],
    [
        "application/x-mac-binhex40",
        "hqx"
    ],
    [
        "application/x-macbinary",
        "bin"
    ],
    [
        "application/x-magic-cap-package-1.0",
        "mc$"
    ],
    [
        "application/x-mathcad",
        "mcd"
    ],
    [
        "application/x-meme",
        "mm"
    ],
    [
        "application/x-midi",
        [
            "mid",
            "midi"
        ]
    ],
    [
        "application/x-mif",
        "mif"
    ],
    [
        "application/x-mix-transfer",
        "nix"
    ],
    [
        "application/x-mobipocket-ebook",
        "prc"
    ],
    [
        "application/x-mplayer2",
        "asx"
    ],
    [
        "application/x-ms-application",
        "application"
    ],
    [
        "application/x-ms-wmd",
        "wmd"
    ],
    [
        "application/x-ms-wmz",
        "wmz"
    ],
    [
        "application/x-ms-xbap",
        "xbap"
    ],
    [
        "application/x-msaccess",
        "mdb"
    ],
    [
        "application/x-msbinder",
        "obd"
    ],
    [
        "application/x-mscardfile",
        "crd"
    ],
    [
        "application/x-msclip",
        "clp"
    ],
    [
        "application/x-msdownload",
        [
            "exe",
            "dll"
        ]
    ],
    [
        "application/x-msexcel",
        [
            "xls",
            "xla",
            "xlw"
        ]
    ],
    [
        "application/x-msmediaview",
        [
            "mvb",
            "m13",
            "m14"
        ]
    ],
    [
        "application/x-msmetafile",
        "wmf"
    ],
    [
        "application/x-msmoney",
        "mny"
    ],
    [
        "application/x-mspowerpoint",
        "ppt"
    ],
    [
        "application/x-mspublisher",
        "pub"
    ],
    [
        "application/x-msschedule",
        "scd"
    ],
    [
        "application/x-msterminal",
        "trm"
    ],
    [
        "application/x-mswrite",
        "wri"
    ],
    [
        "application/x-navi-animation",
        "ani"
    ],
    [
        "application/x-navidoc",
        "nvd"
    ],
    [
        "application/x-navimap",
        "map"
    ],
    [
        "application/x-navistyle",
        "stl"
    ],
    [
        "application/x-netcdf",
        [
            "cdf",
            "nc"
        ]
    ],
    [
        "application/x-newton-compatible-pkg",
        "pkg"
    ],
    [
        "application/x-nokia-9000-communicator-add-on-software",
        "aos"
    ],
    [
        "application/x-omc",
        "omc"
    ],
    [
        "application/x-omcdatamaker",
        "omcd"
    ],
    [
        "application/x-omcregerator",
        "omcr"
    ],
    [
        "application/x-pagemaker",
        [
            "pm4",
            "pm5"
        ]
    ],
    [
        "application/x-pcl",
        "pcl"
    ],
    [
        "application/x-perfmon",
        [
            "pma",
            "pmc",
            "pml",
            "pmr",
            "pmw"
        ]
    ],
    [
        "application/x-pixclscript",
        "plx"
    ],
    [
        "application/x-pkcs10",
        "p10"
    ],
    [
        "application/x-pkcs12",
        [
            "p12",
            "pfx"
        ]
    ],
    [
        "application/x-pkcs7-certificates",
        [
            "p7b",
            "spc"
        ]
    ],
    [
        "application/x-pkcs7-certreqresp",
        "p7r"
    ],
    [
        "application/x-pkcs7-mime",
        [
            "p7m",
            "p7c"
        ]
    ],
    [
        "application/x-pkcs7-signature",
        [
            "p7s",
            "p7a"
        ]
    ],
    [
        "application/x-pointplus",
        "css"
    ],
    [
        "application/x-portable-anymap",
        "pnm"
    ],
    [
        "application/x-project",
        [
            "mpc",
            "mpt",
            "mpv",
            "mpx"
        ]
    ],
    [
        "application/x-qpro",
        "wb1"
    ],
    [
        "application/x-rar-compressed",
        "rar"
    ],
    [
        "application/x-rtf",
        "rtf"
    ],
    [
        "application/x-sdp",
        "sdp"
    ],
    [
        "application/x-sea",
        "sea"
    ],
    [
        "application/x-seelogo",
        "sl"
    ],
    [
        "application/x-sh",
        "sh"
    ],
    [
        "application/x-shar",
        [
            "shar",
            "sh"
        ]
    ],
    [
        "application/x-shockwave-flash",
        "swf"
    ],
    [
        "application/x-silverlight-app",
        "xap"
    ],
    [
        "application/x-sit",
        "sit"
    ],
    [
        "application/x-sprite",
        [
            "spr",
            "sprite"
        ]
    ],
    [
        "application/x-stuffit",
        "sit"
    ],
    [
        "application/x-stuffitx",
        "sitx"
    ],
    [
        "application/x-sv4cpio",
        "sv4cpio"
    ],
    [
        "application/x-sv4crc",
        "sv4crc"
    ],
    [
        "application/x-tar",
        "tar"
    ],
    [
        "application/x-tbook",
        [
            "sbk",
            "tbk"
        ]
    ],
    [
        "application/x-tcl",
        "tcl"
    ],
    [
        "application/x-tex",
        "tex"
    ],
    [
        "application/x-tex-tfm",
        "tfm"
    ],
    [
        "application/x-texinfo",
        [
            "texi",
            "texinfo"
        ]
    ],
    [
        "application/x-troff",
        [
            "roff",
            "t",
            "tr"
        ]
    ],
    [
        "application/x-troff-man",
        "man"
    ],
    [
        "application/x-troff-me",
        "me"
    ],
    [
        "application/x-troff-ms",
        "ms"
    ],
    [
        "application/x-troff-msvideo",
        "avi"
    ],
    [
        "application/x-ustar",
        "ustar"
    ],
    [
        "application/x-visio",
        [
            "vsd",
            "vst",
            "vsw"
        ]
    ],
    [
        "application/x-vnd.audioexplosion.mzz",
        "mzz"
    ],
    [
        "application/x-vnd.ls-xpix",
        "xpix"
    ],
    [
        "application/x-vrml",
        "vrml"
    ],
    [
        "application/x-wais-source",
        [
            "src",
            "wsrc"
        ]
    ],
    [
        "application/x-winhelp",
        "hlp"
    ],
    [
        "application/x-wintalk",
        "wtk"
    ],
    [
        "application/x-world",
        [
            "wrl",
            "svr"
        ]
    ],
    [
        "application/x-wpwin",
        "wpd"
    ],
    [
        "application/x-wri",
        "wri"
    ],
    [
        "application/x-x509-ca-cert",
        [
            "cer",
            "crt",
            "der"
        ]
    ],
    [
        "application/x-x509-user-cert",
        "crt"
    ],
    [
        "application/x-xfig",
        "fig"
    ],
    [
        "application/x-xpinstall",
        "xpi"
    ],
    [
        "application/x-zip-compressed",
        "zip"
    ],
    [
        "application/xcap-diff+xml",
        "xdf"
    ],
    [
        "application/xenc+xml",
        "xenc"
    ],
    [
        "application/xhtml+xml",
        "xhtml"
    ],
    [
        "application/xml",
        "xml"
    ],
    [
        "application/xml-dtd",
        "dtd"
    ],
    [
        "application/xop+xml",
        "xop"
    ],
    [
        "application/xslt+xml",
        "xslt"
    ],
    [
        "application/xspf+xml",
        "xspf"
    ],
    [
        "application/xv+xml",
        "mxml"
    ],
    [
        "application/yang",
        "yang"
    ],
    [
        "application/yin+xml",
        "yin"
    ],
    [
        "application/ynd.ms-pkipko",
        "pko"
    ],
    [
        "application/zip",
        "zip"
    ],
    [
        "audio/adpcm",
        "adp"
    ],
    [
        "audio/aiff",
        [
            "aiff",
            "aif",
            "aifc"
        ]
    ],
    [
        "audio/basic",
        [
            "snd",
            "au"
        ]
    ],
    [
        "audio/it",
        "it"
    ],
    [
        "audio/make",
        [
            "funk",
            "my",
            "pfunk"
        ]
    ],
    [
        "audio/make.my.funk",
        "pfunk"
    ],
    [
        "audio/mid",
        [
            "mid",
            "rmi"
        ]
    ],
    [
        "audio/midi",
        [
            "midi",
            "kar",
            "mid"
        ]
    ],
    [
        "audio/mod",
        "mod"
    ],
    [
        "audio/mp4",
        "mp4a"
    ],
    [
        "audio/mpeg",
        [
            "mpga",
            "mp3",
            "m2a",
            "mp2",
            "mpa",
            "mpg"
        ]
    ],
    [
        "audio/mpeg3",
        "mp3"
    ],
    [
        "audio/nspaudio",
        [
            "la",
            "lma"
        ]
    ],
    [
        "audio/ogg",
        "oga"
    ],
    [
        "audio/s3m",
        "s3m"
    ],
    [
        "audio/tsp-audio",
        "tsi"
    ],
    [
        "audio/tsplayer",
        "tsp"
    ],
    [
        "audio/vnd.dece.audio",
        "uva"
    ],
    [
        "audio/vnd.digital-winds",
        "eol"
    ],
    [
        "audio/vnd.dra",
        "dra"
    ],
    [
        "audio/vnd.dts",
        "dts"
    ],
    [
        "audio/vnd.dts.hd",
        "dtshd"
    ],
    [
        "audio/vnd.lucent.voice",
        "lvp"
    ],
    [
        "audio/vnd.ms-playready.media.pya",
        "pya"
    ],
    [
        "audio/vnd.nuera.ecelp4800",
        "ecelp4800"
    ],
    [
        "audio/vnd.nuera.ecelp7470",
        "ecelp7470"
    ],
    [
        "audio/vnd.nuera.ecelp9600",
        "ecelp9600"
    ],
    [
        "audio/vnd.qcelp",
        "qcp"
    ],
    [
        "audio/vnd.rip",
        "rip"
    ],
    [
        "audio/voc",
        "voc"
    ],
    [
        "audio/voxware",
        "vox"
    ],
    [
        "audio/wav",
        "wav"
    ],
    [
        "audio/webm",
        "weba"
    ],
    [
        "audio/x-aac",
        "aac"
    ],
    [
        "audio/x-adpcm",
        "snd"
    ],
    [
        "audio/x-aiff",
        [
            "aiff",
            "aif",
            "aifc"
        ]
    ],
    [
        "audio/x-au",
        "au"
    ],
    [
        "audio/x-gsm",
        [
            "gsd",
            "gsm"
        ]
    ],
    [
        "audio/x-jam",
        "jam"
    ],
    [
        "audio/x-liveaudio",
        "lam"
    ],
    [
        "audio/x-mid",
        [
            "mid",
            "midi"
        ]
    ],
    [
        "audio/x-midi",
        [
            "midi",
            "mid"
        ]
    ],
    [
        "audio/x-mod",
        "mod"
    ],
    [
        "audio/x-mpeg",
        "mp2"
    ],
    [
        "audio/x-mpeg-3",
        "mp3"
    ],
    [
        "audio/x-mpegurl",
        "m3u"
    ],
    [
        "audio/x-mpequrl",
        "m3u"
    ],
    [
        "audio/x-ms-wax",
        "wax"
    ],
    [
        "audio/x-ms-wma",
        "wma"
    ],
    [
        "audio/x-nspaudio",
        [
            "la",
            "lma"
        ]
    ],
    [
        "audio/x-pn-realaudio",
        [
            "ra",
            "ram",
            "rm",
            "rmm",
            "rmp"
        ]
    ],
    [
        "audio/x-pn-realaudio-plugin",
        [
            "ra",
            "rmp",
            "rpm"
        ]
    ],
    [
        "audio/x-psid",
        "sid"
    ],
    [
        "audio/x-realaudio",
        "ra"
    ],
    [
        "audio/x-twinvq",
        "vqf"
    ],
    [
        "audio/x-twinvq-plugin",
        [
            "vqe",
            "vql"
        ]
    ],
    [
        "audio/x-vnd.audioexplosion.mjuicemediafile",
        "mjf"
    ],
    [
        "audio/x-voc",
        "voc"
    ],
    [
        "audio/x-wav",
        "wav"
    ],
    [
        "audio/xm",
        "xm"
    ],
    [
        "chemical/x-cdx",
        "cdx"
    ],
    [
        "chemical/x-cif",
        "cif"
    ],
    [
        "chemical/x-cmdf",
        "cmdf"
    ],
    [
        "chemical/x-cml",
        "cml"
    ],
    [
        "chemical/x-csml",
        "csml"
    ],
    [
        "chemical/x-pdb",
        [
            "pdb",
            "xyz"
        ]
    ],
    [
        "chemical/x-xyz",
        "xyz"
    ],
    [
        "drawing/x-dwf",
        "dwf"
    ],
    [
        "i-world/i-vrml",
        "ivr"
    ],
    [
        "image/bmp",
        [
            "bmp",
            "bm"
        ]
    ],
    [
        "image/cgm",
        "cgm"
    ],
    [
        "image/cis-cod",
        "cod"
    ],
    [
        "image/cmu-raster",
        [
            "ras",
            "rast"
        ]
    ],
    [
        "image/fif",
        "fif"
    ],
    [
        "image/florian",
        [
            "flo",
            "turbot"
        ]
    ],
    [
        "image/g3fax",
        "g3"
    ],
    [
        "image/gif",
        "gif"
    ],
    [
        "image/ief",
        [
            "ief",
            "iefs"
        ]
    ],
    [
        "image/jpeg",
        [
            "jpeg",
            "jpe",
            "jpg",
            "jfif",
            "jfif-tbnl"
        ]
    ],
    [
        "image/jutvision",
        "jut"
    ],
    [
        "image/ktx",
        "ktx"
    ],
    [
        "image/naplps",
        [
            "nap",
            "naplps"
        ]
    ],
    [
        "image/pict",
        [
            "pic",
            "pict"
        ]
    ],
    [
        "image/pipeg",
        "jfif"
    ],
    [
        "image/pjpeg",
        [
            "jfif",
            "jpe",
            "jpeg",
            "jpg"
        ]
    ],
    [
        "image/png",
        [
            "png",
            "x-png"
        ]
    ],
    [
        "image/prs.btif",
        "btif"
    ],
    [
        "image/svg+xml",
        "svg"
    ],
    [
        "image/tiff",
        [
            "tif",
            "tiff"
        ]
    ],
    [
        "image/vasa",
        "mcf"
    ],
    [
        "image/vnd.adobe.photoshop",
        "psd"
    ],
    [
        "image/vnd.dece.graphic",
        "uvi"
    ],
    [
        "image/vnd.djvu",
        "djvu"
    ],
    [
        "image/vnd.dvb.subtitle",
        "sub"
    ],
    [
        "image/vnd.dwg",
        [
            "dwg",
            "dxf",
            "svf"
        ]
    ],
    [
        "image/vnd.dxf",
        "dxf"
    ],
    [
        "image/vnd.fastbidsheet",
        "fbs"
    ],
    [
        "image/vnd.fpx",
        "fpx"
    ],
    [
        "image/vnd.fst",
        "fst"
    ],
    [
        "image/vnd.fujixerox.edmics-mmr",
        "mmr"
    ],
    [
        "image/vnd.fujixerox.edmics-rlc",
        "rlc"
    ],
    [
        "image/vnd.ms-modi",
        "mdi"
    ],
    [
        "image/vnd.net-fpx",
        [
            "fpx",
            "npx"
        ]
    ],
    [
        "image/vnd.rn-realflash",
        "rf"
    ],
    [
        "image/vnd.rn-realpix",
        "rp"
    ],
    [
        "image/vnd.wap.wbmp",
        "wbmp"
    ],
    [
        "image/vnd.xiff",
        "xif"
    ],
    [
        "image/webp",
        "webp"
    ],
    [
        "image/x-cmu-raster",
        "ras"
    ],
    [
        "image/x-cmx",
        "cmx"
    ],
    [
        "image/x-dwg",
        [
            "dwg",
            "dxf",
            "svf"
        ]
    ],
    [
        "image/x-freehand",
        "fh"
    ],
    [
        "image/x-icon",
        "ico"
    ],
    [
        "image/x-jg",
        "art"
    ],
    [
        "image/x-jps",
        "jps"
    ],
    [
        "image/x-niff",
        [
            "niff",
            "nif"
        ]
    ],
    [
        "image/x-pcx",
        "pcx"
    ],
    [
        "image/x-pict",
        [
            "pct",
            "pic"
        ]
    ],
    [
        "image/x-portable-anymap",
        "pnm"
    ],
    [
        "image/x-portable-bitmap",
        "pbm"
    ],
    [
        "image/x-portable-graymap",
        "pgm"
    ],
    [
        "image/x-portable-greymap",
        "pgm"
    ],
    [
        "image/x-portable-pixmap",
        "ppm"
    ],
    [
        "image/x-quicktime",
        [
            "qif",
            "qti",
            "qtif"
        ]
    ],
    [
        "image/x-rgb",
        "rgb"
    ],
    [
        "image/x-tiff",
        [
            "tif",
            "tiff"
        ]
    ],
    [
        "image/x-windows-bmp",
        "bmp"
    ],
    [
        "image/x-xbitmap",
        "xbm"
    ],
    [
        "image/x-xbm",
        "xbm"
    ],
    [
        "image/x-xpixmap",
        [
            "xpm",
            "pm"
        ]
    ],
    [
        "image/x-xwd",
        "xwd"
    ],
    [
        "image/x-xwindowdump",
        "xwd"
    ],
    [
        "image/xbm",
        "xbm"
    ],
    [
        "image/xpm",
        "xpm"
    ],
    [
        "message/rfc822",
        [
            "eml",
            "mht",
            "mhtml",
            "nws",
            "mime"
        ]
    ],
    [
        "model/iges",
        [
            "iges",
            "igs"
        ]
    ],
    [
        "model/mesh",
        "msh"
    ],
    [
        "model/vnd.collada+xml",
        "dae"
    ],
    [
        "model/vnd.dwf",
        "dwf"
    ],
    [
        "model/vnd.gdl",
        "gdl"
    ],
    [
        "model/vnd.gtw",
        "gtw"
    ],
    [
        "model/vnd.mts",
        "mts"
    ],
    [
        "model/vnd.vtu",
        "vtu"
    ],
    [
        "model/vrml",
        [
            "vrml",
            "wrl",
            "wrz"
        ]
    ],
    [
        "model/x-pov",
        "pov"
    ],
    [
        "multipart/x-gzip",
        "gzip"
    ],
    [
        "multipart/x-ustar",
        "ustar"
    ],
    [
        "multipart/x-zip",
        "zip"
    ],
    [
        "music/crescendo",
        [
            "mid",
            "midi"
        ]
    ],
    [
        "music/x-karaoke",
        "kar"
    ],
    [
        "paleovu/x-pv",
        "pvu"
    ],
    [
        "text/asp",
        "asp"
    ],
    [
        "text/calendar",
        "ics"
    ],
    [
        "text/css",
        "css"
    ],
    [
        "text/csv",
        "csv"
    ],
    [
        "text/ecmascript",
        "js"
    ],
    [
        "text/h323",
        "323"
    ],
    [
        "text/html",
        [
            "html",
            "htm",
            "stm",
            "acgi",
            "htmls",
            "htx",
            "shtml"
        ]
    ],
    [
        "text/iuls",
        "uls"
    ],
    [
        "text/javascript",
        "js"
    ],
    [
        "text/mcf",
        "mcf"
    ],
    [
        "text/n3",
        "n3"
    ],
    [
        "text/pascal",
        "pas"
    ],
    [
        "text/plain",
        [
            "txt",
            "bas",
            "c",
            "h",
            "c++",
            "cc",
            "com",
            "conf",
            "cxx",
            "def",
            "f",
            "f90",
            "for",
            "g",
            "hh",
            "idc",
            "jav",
            "java",
            "list",
            "log",
            "lst",
            "m",
            "mar",
            "pl",
            "sdml",
            "text"
        ]
    ],
    [
        "text/plain-bas",
        "par"
    ],
    [
        "text/prs.lines.tag",
        "dsc"
    ],
    [
        "text/richtext",
        [
            "rtx",
            "rt",
            "rtf"
        ]
    ],
    [
        "text/scriplet",
        "wsc"
    ],
    [
        "text/scriptlet",
        "sct"
    ],
    [
        "text/sgml",
        [
            "sgm",
            "sgml"
        ]
    ],
    [
        "text/tab-separated-values",
        "tsv"
    ],
    [
        "text/troff",
        "t"
    ],
    [
        "text/turtle",
        "ttl"
    ],
    [
        "text/uri-list",
        [
            "uni",
            "unis",
            "uri",
            "uris"
        ]
    ],
    [
        "text/vnd.abc",
        "abc"
    ],
    [
        "text/vnd.curl",
        "curl"
    ],
    [
        "text/vnd.curl.dcurl",
        "dcurl"
    ],
    [
        "text/vnd.curl.mcurl",
        "mcurl"
    ],
    [
        "text/vnd.curl.scurl",
        "scurl"
    ],
    [
        "text/vnd.fly",
        "fly"
    ],
    [
        "text/vnd.fmi.flexstor",
        "flx"
    ],
    [
        "text/vnd.graphviz",
        "gv"
    ],
    [
        "text/vnd.in3d.3dml",
        "3dml"
    ],
    [
        "text/vnd.in3d.spot",
        "spot"
    ],
    [
        "text/vnd.rn-realtext",
        "rt"
    ],
    [
        "text/vnd.sun.j2me.app-descriptor",
        "jad"
    ],
    [
        "text/vnd.wap.wml",
        "wml"
    ],
    [
        "text/vnd.wap.wmlscript",
        "wmls"
    ],
    [
        "text/webviewhtml",
        "htt"
    ],
    [
        "text/x-asm",
        [
            "asm",
            "s"
        ]
    ],
    [
        "text/x-audiosoft-intra",
        "aip"
    ],
    [
        "text/x-c",
        [
            "c",
            "cc",
            "cpp"
        ]
    ],
    [
        "text/x-component",
        "htc"
    ],
    [
        "text/x-fortran",
        [
            "for",
            "f",
            "f77",
            "f90"
        ]
    ],
    [
        "text/x-h",
        [
            "h",
            "hh"
        ]
    ],
    [
        "text/x-java-source",
        [
            "java",
            "jav"
        ]
    ],
    [
        "text/x-java-source,java",
        "java"
    ],
    [
        "text/x-la-asf",
        "lsx"
    ],
    [
        "text/x-m",
        "m"
    ],
    [
        "text/x-pascal",
        "p"
    ],
    [
        "text/x-script",
        "hlb"
    ],
    [
        "text/x-script.csh",
        "csh"
    ],
    [
        "text/x-script.elisp",
        "el"
    ],
    [
        "text/x-script.guile",
        "scm"
    ],
    [
        "text/x-script.ksh",
        "ksh"
    ],
    [
        "text/x-script.lisp",
        "lsp"
    ],
    [
        "text/x-script.perl",
        "pl"
    ],
    [
        "text/x-script.perl-module",
        "pm"
    ],
    [
        "text/x-script.phyton",
        "py"
    ],
    [
        "text/x-script.rexx",
        "rexx"
    ],
    [
        "text/x-script.scheme",
        "scm"
    ],
    [
        "text/x-script.sh",
        "sh"
    ],
    [
        "text/x-script.tcl",
        "tcl"
    ],
    [
        "text/x-script.tcsh",
        "tcsh"
    ],
    [
        "text/x-script.zsh",
        "zsh"
    ],
    [
        "text/x-server-parsed-html",
        [
            "shtml",
            "ssi"
        ]
    ],
    [
        "text/x-setext",
        "etx"
    ],
    [
        "text/x-sgml",
        [
            "sgm",
            "sgml"
        ]
    ],
    [
        "text/x-speech",
        [
            "spc",
            "talk"
        ]
    ],
    [
        "text/x-uil",
        "uil"
    ],
    [
        "text/x-uuencode",
        [
            "uu",
            "uue"
        ]
    ],
    [
        "text/x-vcalendar",
        "vcs"
    ],
    [
        "text/x-vcard",
        "vcf"
    ],
    [
        "text/xml",
        "xml"
    ],
    [
        "video/3gpp",
        "3gp"
    ],
    [
        "video/3gpp2",
        "3g2"
    ],
    [
        "video/animaflex",
        "afl"
    ],
    [
        "video/avi",
        "avi"
    ],
    [
        "video/avs-video",
        "avs"
    ],
    [
        "video/dl",
        "dl"
    ],
    [
        "video/fli",
        "fli"
    ],
    [
        "video/gl",
        "gl"
    ],
    [
        "video/h261",
        "h261"
    ],
    [
        "video/h263",
        "h263"
    ],
    [
        "video/h264",
        "h264"
    ],
    [
        "video/jpeg",
        "jpgv"
    ],
    [
        "video/jpm",
        "jpm"
    ],
    [
        "video/mj2",
        "mj2"
    ],
    [
        "video/mp4",
        "mp4"
    ],
    [
        "video/mpeg",
        [
            "mpeg",
            "mp2",
            "mpa",
            "mpe",
            "mpg",
            "mpv2",
            "m1v",
            "m2v",
            "mp3"
        ]
    ],
    [
        "video/msvideo",
        "avi"
    ],
    [
        "video/ogg",
        "ogv"
    ],
    [
        "video/quicktime",
        [
            "mov",
            "qt",
            "moov"
        ]
    ],
    [
        "video/vdo",
        "vdo"
    ],
    [
        "video/vivo",
        [
            "viv",
            "vivo"
        ]
    ],
    [
        "video/vnd.dece.hd",
        "uvh"
    ],
    [
        "video/vnd.dece.mobile",
        "uvm"
    ],
    [
        "video/vnd.dece.pd",
        "uvp"
    ],
    [
        "video/vnd.dece.sd",
        "uvs"
    ],
    [
        "video/vnd.dece.video",
        "uvv"
    ],
    [
        "video/vnd.fvt",
        "fvt"
    ],
    [
        "video/vnd.mpegurl",
        "mxu"
    ],
    [
        "video/vnd.ms-playready.media.pyv",
        "pyv"
    ],
    [
        "video/vnd.rn-realvideo",
        "rv"
    ],
    [
        "video/vnd.uvvu.mp4",
        "uvu"
    ],
    [
        "video/vnd.vivo",
        [
            "viv",
            "vivo"
        ]
    ],
    [
        "video/vosaic",
        "vos"
    ],
    [
        "video/webm",
        "webm"
    ],
    [
        "video/x-amt-demorun",
        "xdr"
    ],
    [
        "video/x-amt-showrun",
        "xsr"
    ],
    [
        "video/x-atomic3d-feature",
        "fmf"
    ],
    [
        "video/x-dl",
        "dl"
    ],
    [
        "video/x-dv",
        [
            "dif",
            "dv"
        ]
    ],
    [
        "video/x-f4v",
        "f4v"
    ],
    [
        "video/x-fli",
        "fli"
    ],
    [
        "video/x-flv",
        "flv"
    ],
    [
        "video/x-gl",
        "gl"
    ],
    [
        "video/x-isvideo",
        "isu"
    ],
    [
        "video/x-la-asf",
        [
            "lsf",
            "lsx"
        ]
    ],
    [
        "video/x-m4v",
        "m4v"
    ],
    [
        "video/x-motion-jpeg",
        "mjpg"
    ],
    [
        "video/x-mpeg",
        [
            "mp3",
            "mp2"
        ]
    ],
    [
        "video/x-mpeq2a",
        "mp2"
    ],
    [
        "video/x-ms-asf",
        [
            "asf",
            "asr",
            "asx"
        ]
    ],
    [
        "video/x-ms-asf-plugin",
        "asx"
    ],
    [
        "video/x-ms-wm",
        "wm"
    ],
    [
        "video/x-ms-wmv",
        "wmv"
    ],
    [
        "video/x-ms-wmx",
        "wmx"
    ],
    [
        "video/x-ms-wvx",
        "wvx"
    ],
    [
        "video/x-msvideo",
        "avi"
    ],
    [
        "video/x-qtc",
        "qtc"
    ],
    [
        "video/x-scm",
        "scm"
    ],
    [
        "video/x-sgi-movie",
        [
            "movie",
            "mv"
        ]
    ],
    [
        "windows/metafile",
        "wmf"
    ],
    [
        "www/mime",
        "mime"
    ],
    [
        "x-conference/x-cooltalk",
        "ice"
    ],
    [
        "x-music/x-midi",
        [
            "mid",
            "midi"
        ]
    ],
    [
        "x-world/x-3dmf",
        [
            "3dm",
            "3dmf",
            "qd3",
            "qd3d"
        ]
    ],
    [
        "x-world/x-svr",
        "svr"
    ],
    [
        "x-world/x-vrml",
        [
            "flr",
            "vrml",
            "wrl",
            "wrz",
            "xaf",
            "xof"
        ]
    ],
    [
        "x-world/x-vrt",
        "vrt"
    ],
    [
        "xgl/drawing",
        "xgz"
    ],
    [
        "xgl/movie",
        "xmz"
    ]
]);
const extensions = new Map([
    [
        "123",
        "application/vnd.lotus-1-2-3"
    ],
    [
        "323",
        "text/h323"
    ],
    [
        "*",
        "application/octet-stream"
    ],
    [
        "3dm",
        "x-world/x-3dmf"
    ],
    [
        "3dmf",
        "x-world/x-3dmf"
    ],
    [
        "3dml",
        "text/vnd.in3d.3dml"
    ],
    [
        "3g2",
        "video/3gpp2"
    ],
    [
        "3gp",
        "video/3gpp"
    ],
    [
        "7z",
        "application/x-7z-compressed"
    ],
    [
        "a",
        "application/octet-stream"
    ],
    [
        "aab",
        "application/x-authorware-bin"
    ],
    [
        "aac",
        "audio/x-aac"
    ],
    [
        "aam",
        "application/x-authorware-map"
    ],
    [
        "aas",
        "application/x-authorware-seg"
    ],
    [
        "abc",
        "text/vnd.abc"
    ],
    [
        "abw",
        "application/x-abiword"
    ],
    [
        "ac",
        "application/pkix-attr-cert"
    ],
    [
        "acc",
        "application/vnd.americandynamics.acc"
    ],
    [
        "ace",
        "application/x-ace-compressed"
    ],
    [
        "acgi",
        "text/html"
    ],
    [
        "acu",
        "application/vnd.acucobol"
    ],
    [
        "acx",
        "application/internet-property-stream"
    ],
    [
        "adp",
        "audio/adpcm"
    ],
    [
        "aep",
        "application/vnd.audiograph"
    ],
    [
        "afl",
        "video/animaflex"
    ],
    [
        "afp",
        "application/vnd.ibm.modcap"
    ],
    [
        "ahead",
        "application/vnd.ahead.space"
    ],
    [
        "ai",
        "application/postscript"
    ],
    [
        "aif",
        [
            "audio/aiff",
            "audio/x-aiff"
        ]
    ],
    [
        "aifc",
        [
            "audio/aiff",
            "audio/x-aiff"
        ]
    ],
    [
        "aiff",
        [
            "audio/aiff",
            "audio/x-aiff"
        ]
    ],
    [
        "aim",
        "application/x-aim"
    ],
    [
        "aip",
        "text/x-audiosoft-intra"
    ],
    [
        "air",
        "application/vnd.adobe.air-application-installer-package+zip"
    ],
    [
        "ait",
        "application/vnd.dvb.ait"
    ],
    [
        "ami",
        "application/vnd.amiga.ami"
    ],
    [
        "ani",
        "application/x-navi-animation"
    ],
    [
        "aos",
        "application/x-nokia-9000-communicator-add-on-software"
    ],
    [
        "apk",
        "application/vnd.android.package-archive"
    ],
    [
        "application",
        "application/x-ms-application"
    ],
    [
        "apr",
        "application/vnd.lotus-approach"
    ],
    [
        "aps",
        "application/mime"
    ],
    [
        "arc",
        "application/octet-stream"
    ],
    [
        "arj",
        [
            "application/arj",
            "application/octet-stream"
        ]
    ],
    [
        "art",
        "image/x-jg"
    ],
    [
        "asf",
        "video/x-ms-asf"
    ],
    [
        "asm",
        "text/x-asm"
    ],
    [
        "aso",
        "application/vnd.accpac.simply.aso"
    ],
    [
        "asp",
        "text/asp"
    ],
    [
        "asr",
        "video/x-ms-asf"
    ],
    [
        "asx",
        [
            "video/x-ms-asf",
            "application/x-mplayer2",
            "video/x-ms-asf-plugin"
        ]
    ],
    [
        "atc",
        "application/vnd.acucorp"
    ],
    [
        "atomcat",
        "application/atomcat+xml"
    ],
    [
        "atomsvc",
        "application/atomsvc+xml"
    ],
    [
        "atx",
        "application/vnd.antix.game-component"
    ],
    [
        "au",
        [
            "audio/basic",
            "audio/x-au"
        ]
    ],
    [
        "avi",
        [
            "video/avi",
            "video/msvideo",
            "application/x-troff-msvideo",
            "video/x-msvideo"
        ]
    ],
    [
        "avs",
        "video/avs-video"
    ],
    [
        "aw",
        "application/applixware"
    ],
    [
        "axs",
        "application/olescript"
    ],
    [
        "azf",
        "application/vnd.airzip.filesecure.azf"
    ],
    [
        "azs",
        "application/vnd.airzip.filesecure.azs"
    ],
    [
        "azw",
        "application/vnd.amazon.ebook"
    ],
    [
        "bas",
        "text/plain"
    ],
    [
        "bcpio",
        "application/x-bcpio"
    ],
    [
        "bdf",
        "application/x-font-bdf"
    ],
    [
        "bdm",
        "application/vnd.syncml.dm+wbxml"
    ],
    [
        "bed",
        "application/vnd.realvnc.bed"
    ],
    [
        "bh2",
        "application/vnd.fujitsu.oasysprs"
    ],
    [
        "bin",
        [
            "application/octet-stream",
            "application/mac-binary",
            "application/macbinary",
            "application/x-macbinary",
            "application/x-binary"
        ]
    ],
    [
        "bm",
        "image/bmp"
    ],
    [
        "bmi",
        "application/vnd.bmi"
    ],
    [
        "bmp",
        [
            "image/bmp",
            "image/x-windows-bmp"
        ]
    ],
    [
        "boo",
        "application/book"
    ],
    [
        "book",
        "application/book"
    ],
    [
        "box",
        "application/vnd.previewsystems.box"
    ],
    [
        "boz",
        "application/x-bzip2"
    ],
    [
        "bsh",
        "application/x-bsh"
    ],
    [
        "btif",
        "image/prs.btif"
    ],
    [
        "bz",
        "application/x-bzip"
    ],
    [
        "bz2",
        "application/x-bzip2"
    ],
    [
        "c",
        [
            "text/plain",
            "text/x-c"
        ]
    ],
    [
        "c++",
        "text/plain"
    ],
    [
        "c11amc",
        "application/vnd.cluetrust.cartomobile-config"
    ],
    [
        "c11amz",
        "application/vnd.cluetrust.cartomobile-config-pkg"
    ],
    [
        "c4g",
        "application/vnd.clonk.c4group"
    ],
    [
        "cab",
        "application/vnd.ms-cab-compressed"
    ],
    [
        "car",
        "application/vnd.curl.car"
    ],
    [
        "cat",
        [
            "application/vnd.ms-pkiseccat",
            "application/vnd.ms-pki.seccat"
        ]
    ],
    [
        "cc",
        [
            "text/plain",
            "text/x-c"
        ]
    ],
    [
        "ccad",
        "application/clariscad"
    ],
    [
        "cco",
        "application/x-cocoa"
    ],
    [
        "ccxml",
        "application/ccxml+xml,"
    ],
    [
        "cdbcmsg",
        "application/vnd.contact.cmsg"
    ],
    [
        "cdf",
        [
            "application/cdf",
            "application/x-cdf",
            "application/x-netcdf"
        ]
    ],
    [
        "cdkey",
        "application/vnd.mediastation.cdkey"
    ],
    [
        "cdmia",
        "application/cdmi-capability"
    ],
    [
        "cdmic",
        "application/cdmi-container"
    ],
    [
        "cdmid",
        "application/cdmi-domain"
    ],
    [
        "cdmio",
        "application/cdmi-object"
    ],
    [
        "cdmiq",
        "application/cdmi-queue"
    ],
    [
        "cdx",
        "chemical/x-cdx"
    ],
    [
        "cdxml",
        "application/vnd.chemdraw+xml"
    ],
    [
        "cdy",
        "application/vnd.cinderella"
    ],
    [
        "cer",
        [
            "application/pkix-cert",
            "application/x-x509-ca-cert"
        ]
    ],
    [
        "cgm",
        "image/cgm"
    ],
    [
        "cha",
        "application/x-chat"
    ],
    [
        "chat",
        "application/x-chat"
    ],
    [
        "chm",
        "application/vnd.ms-htmlhelp"
    ],
    [
        "chrt",
        "application/vnd.kde.kchart"
    ],
    [
        "cif",
        "chemical/x-cif"
    ],
    [
        "cii",
        "application/vnd.anser-web-certificate-issue-initiation"
    ],
    [
        "cil",
        "application/vnd.ms-artgalry"
    ],
    [
        "cla",
        "application/vnd.claymore"
    ],
    [
        "class",
        [
            "application/octet-stream",
            "application/java",
            "application/java-byte-code",
            "application/java-vm",
            "application/x-java-class"
        ]
    ],
    [
        "clkk",
        "application/vnd.crick.clicker.keyboard"
    ],
    [
        "clkp",
        "application/vnd.crick.clicker.palette"
    ],
    [
        "clkt",
        "application/vnd.crick.clicker.template"
    ],
    [
        "clkw",
        "application/vnd.crick.clicker.wordbank"
    ],
    [
        "clkx",
        "application/vnd.crick.clicker"
    ],
    [
        "clp",
        "application/x-msclip"
    ],
    [
        "cmc",
        "application/vnd.cosmocaller"
    ],
    [
        "cmdf",
        "chemical/x-cmdf"
    ],
    [
        "cml",
        "chemical/x-cml"
    ],
    [
        "cmp",
        "application/vnd.yellowriver-custom-menu"
    ],
    [
        "cmx",
        "image/x-cmx"
    ],
    [
        "cod",
        [
            "image/cis-cod",
            "application/vnd.rim.cod"
        ]
    ],
    [
        "com",
        [
            "application/octet-stream",
            "text/plain"
        ]
    ],
    [
        "conf",
        "text/plain"
    ],
    [
        "cpio",
        "application/x-cpio"
    ],
    [
        "cpp",
        "text/x-c"
    ],
    [
        "cpt",
        [
            "application/mac-compactpro",
            "application/x-compactpro",
            "application/x-cpt"
        ]
    ],
    [
        "crd",
        "application/x-mscardfile"
    ],
    [
        "crl",
        [
            "application/pkix-crl",
            "application/pkcs-crl"
        ]
    ],
    [
        "crt",
        [
            "application/pkix-cert",
            "application/x-x509-user-cert",
            "application/x-x509-ca-cert"
        ]
    ],
    [
        "cryptonote",
        "application/vnd.rig.cryptonote"
    ],
    [
        "csh",
        [
            "text/x-script.csh",
            "application/x-csh"
        ]
    ],
    [
        "csml",
        "chemical/x-csml"
    ],
    [
        "csp",
        "application/vnd.commonspace"
    ],
    [
        "css",
        [
            "text/css",
            "application/x-pointplus"
        ]
    ],
    [
        "csv",
        "text/csv"
    ],
    [
        "cu",
        "application/cu-seeme"
    ],
    [
        "curl",
        "text/vnd.curl"
    ],
    [
        "cww",
        "application/prs.cww"
    ],
    [
        "cxx",
        "text/plain"
    ],
    [
        "dae",
        "model/vnd.collada+xml"
    ],
    [
        "daf",
        "application/vnd.mobius.daf"
    ],
    [
        "davmount",
        "application/davmount+xml"
    ],
    [
        "dcr",
        "application/x-director"
    ],
    [
        "dcurl",
        "text/vnd.curl.dcurl"
    ],
    [
        "dd2",
        "application/vnd.oma.dd2+xml"
    ],
    [
        "ddd",
        "application/vnd.fujixerox.ddd"
    ],
    [
        "deb",
        "application/x-debian-package"
    ],
    [
        "deepv",
        "application/x-deepv"
    ],
    [
        "def",
        "text/plain"
    ],
    [
        "der",
        "application/x-x509-ca-cert"
    ],
    [
        "dfac",
        "application/vnd.dreamfactory"
    ],
    [
        "dif",
        "video/x-dv"
    ],
    [
        "dir",
        "application/x-director"
    ],
    [
        "dis",
        "application/vnd.mobius.dis"
    ],
    [
        "djvu",
        "image/vnd.djvu"
    ],
    [
        "dl",
        [
            "video/dl",
            "video/x-dl"
        ]
    ],
    [
        "dll",
        "application/x-msdownload"
    ],
    [
        "dms",
        "application/octet-stream"
    ],
    [
        "dna",
        "application/vnd.dna"
    ],
    [
        "doc",
        "application/msword"
    ],
    [
        "docm",
        "application/vnd.ms-word.document.macroenabled.12"
    ],
    [
        "docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ],
    [
        "dot",
        "application/msword"
    ],
    [
        "dotm",
        "application/vnd.ms-word.template.macroenabled.12"
    ],
    [
        "dotx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.template"
    ],
    [
        "dp",
        [
            "application/commonground",
            "application/vnd.osgi.dp"
        ]
    ],
    [
        "dpg",
        "application/vnd.dpgraph"
    ],
    [
        "dra",
        "audio/vnd.dra"
    ],
    [
        "drw",
        "application/drafting"
    ],
    [
        "dsc",
        "text/prs.lines.tag"
    ],
    [
        "dssc",
        "application/dssc+der"
    ],
    [
        "dtb",
        "application/x-dtbook+xml"
    ],
    [
        "dtd",
        "application/xml-dtd"
    ],
    [
        "dts",
        "audio/vnd.dts"
    ],
    [
        "dtshd",
        "audio/vnd.dts.hd"
    ],
    [
        "dump",
        "application/octet-stream"
    ],
    [
        "dv",
        "video/x-dv"
    ],
    [
        "dvi",
        "application/x-dvi"
    ],
    [
        "dwf",
        [
            "model/vnd.dwf",
            "drawing/x-dwf"
        ]
    ],
    [
        "dwg",
        [
            "application/acad",
            "image/vnd.dwg",
            "image/x-dwg"
        ]
    ],
    [
        "dxf",
        [
            "application/dxf",
            "image/vnd.dwg",
            "image/vnd.dxf",
            "image/x-dwg"
        ]
    ],
    [
        "dxp",
        "application/vnd.spotfire.dxp"
    ],
    [
        "dxr",
        "application/x-director"
    ],
    [
        "ecelp4800",
        "audio/vnd.nuera.ecelp4800"
    ],
    [
        "ecelp7470",
        "audio/vnd.nuera.ecelp7470"
    ],
    [
        "ecelp9600",
        "audio/vnd.nuera.ecelp9600"
    ],
    [
        "edm",
        "application/vnd.novadigm.edm"
    ],
    [
        "edx",
        "application/vnd.novadigm.edx"
    ],
    [
        "efif",
        "application/vnd.picsel"
    ],
    [
        "ei6",
        "application/vnd.pg.osasli"
    ],
    [
        "el",
        "text/x-script.elisp"
    ],
    [
        "elc",
        [
            "application/x-elc",
            "application/x-bytecode.elisp"
        ]
    ],
    [
        "eml",
        "message/rfc822"
    ],
    [
        "emma",
        "application/emma+xml"
    ],
    [
        "env",
        "application/x-envoy"
    ],
    [
        "eol",
        "audio/vnd.digital-winds"
    ],
    [
        "eot",
        "application/vnd.ms-fontobject"
    ],
    [
        "eps",
        "application/postscript"
    ],
    [
        "epub",
        "application/epub+zip"
    ],
    [
        "es",
        [
            "application/ecmascript",
            "application/x-esrehber"
        ]
    ],
    [
        "es3",
        "application/vnd.eszigno3+xml"
    ],
    [
        "esf",
        "application/vnd.epson.esf"
    ],
    [
        "etx",
        "text/x-setext"
    ],
    [
        "evy",
        [
            "application/envoy",
            "application/x-envoy"
        ]
    ],
    [
        "exe",
        [
            "application/octet-stream",
            "application/x-msdownload"
        ]
    ],
    [
        "exi",
        "application/exi"
    ],
    [
        "ext",
        "application/vnd.novadigm.ext"
    ],
    [
        "ez2",
        "application/vnd.ezpix-album"
    ],
    [
        "ez3",
        "application/vnd.ezpix-package"
    ],
    [
        "f",
        [
            "text/plain",
            "text/x-fortran"
        ]
    ],
    [
        "f4v",
        "video/x-f4v"
    ],
    [
        "f77",
        "text/x-fortran"
    ],
    [
        "f90",
        [
            "text/plain",
            "text/x-fortran"
        ]
    ],
    [
        "fbs",
        "image/vnd.fastbidsheet"
    ],
    [
        "fcs",
        "application/vnd.isac.fcs"
    ],
    [
        "fdf",
        "application/vnd.fdf"
    ],
    [
        "fe_launch",
        "application/vnd.denovo.fcselayout-link"
    ],
    [
        "fg5",
        "application/vnd.fujitsu.oasysgp"
    ],
    [
        "fh",
        "image/x-freehand"
    ],
    [
        "fif",
        [
            "application/fractals",
            "image/fif"
        ]
    ],
    [
        "fig",
        "application/x-xfig"
    ],
    [
        "fli",
        [
            "video/fli",
            "video/x-fli"
        ]
    ],
    [
        "flo",
        [
            "image/florian",
            "application/vnd.micrografx.flo"
        ]
    ],
    [
        "flr",
        "x-world/x-vrml"
    ],
    [
        "flv",
        "video/x-flv"
    ],
    [
        "flw",
        "application/vnd.kde.kivio"
    ],
    [
        "flx",
        "text/vnd.fmi.flexstor"
    ],
    [
        "fly",
        "text/vnd.fly"
    ],
    [
        "fm",
        "application/vnd.framemaker"
    ],
    [
        "fmf",
        "video/x-atomic3d-feature"
    ],
    [
        "fnc",
        "application/vnd.frogans.fnc"
    ],
    [
        "for",
        [
            "text/plain",
            "text/x-fortran"
        ]
    ],
    [
        "fpx",
        [
            "image/vnd.fpx",
            "image/vnd.net-fpx"
        ]
    ],
    [
        "frl",
        "application/freeloader"
    ],
    [
        "fsc",
        "application/vnd.fsc.weblaunch"
    ],
    [
        "fst",
        "image/vnd.fst"
    ],
    [
        "ftc",
        "application/vnd.fluxtime.clip"
    ],
    [
        "fti",
        "application/vnd.anser-web-funds-transfer-initiation"
    ],
    [
        "funk",
        "audio/make"
    ],
    [
        "fvt",
        "video/vnd.fvt"
    ],
    [
        "fxp",
        "application/vnd.adobe.fxp"
    ],
    [
        "fzs",
        "application/vnd.fuzzysheet"
    ],
    [
        "g",
        "text/plain"
    ],
    [
        "g2w",
        "application/vnd.geoplan"
    ],
    [
        "g3",
        "image/g3fax"
    ],
    [
        "g3w",
        "application/vnd.geospace"
    ],
    [
        "gac",
        "application/vnd.groove-account"
    ],
    [
        "gdl",
        "model/vnd.gdl"
    ],
    [
        "geo",
        "application/vnd.dynageo"
    ],
    [
        "gex",
        "application/vnd.geometry-explorer"
    ],
    [
        "ggb",
        "application/vnd.geogebra.file"
    ],
    [
        "ggt",
        "application/vnd.geogebra.tool"
    ],
    [
        "ghf",
        "application/vnd.groove-help"
    ],
    [
        "gif",
        "image/gif"
    ],
    [
        "gim",
        "application/vnd.groove-identity-message"
    ],
    [
        "gl",
        [
            "video/gl",
            "video/x-gl"
        ]
    ],
    [
        "gmx",
        "application/vnd.gmx"
    ],
    [
        "gnumeric",
        "application/x-gnumeric"
    ],
    [
        "gph",
        "application/vnd.flographit"
    ],
    [
        "gqf",
        "application/vnd.grafeq"
    ],
    [
        "gram",
        "application/srgs"
    ],
    [
        "grv",
        "application/vnd.groove-injector"
    ],
    [
        "grxml",
        "application/srgs+xml"
    ],
    [
        "gsd",
        "audio/x-gsm"
    ],
    [
        "gsf",
        "application/x-font-ghostscript"
    ],
    [
        "gsm",
        "audio/x-gsm"
    ],
    [
        "gsp",
        "application/x-gsp"
    ],
    [
        "gss",
        "application/x-gss"
    ],
    [
        "gtar",
        "application/x-gtar"
    ],
    [
        "gtm",
        "application/vnd.groove-tool-message"
    ],
    [
        "gtw",
        "model/vnd.gtw"
    ],
    [
        "gv",
        "text/vnd.graphviz"
    ],
    [
        "gxt",
        "application/vnd.geonext"
    ],
    [
        "gz",
        [
            "application/x-gzip",
            "application/x-compressed"
        ]
    ],
    [
        "gzip",
        [
            "multipart/x-gzip",
            "application/x-gzip"
        ]
    ],
    [
        "h",
        [
            "text/plain",
            "text/x-h"
        ]
    ],
    [
        "h261",
        "video/h261"
    ],
    [
        "h263",
        "video/h263"
    ],
    [
        "h264",
        "video/h264"
    ],
    [
        "hal",
        "application/vnd.hal+xml"
    ],
    [
        "hbci",
        "application/vnd.hbci"
    ],
    [
        "hdf",
        "application/x-hdf"
    ],
    [
        "help",
        "application/x-helpfile"
    ],
    [
        "hgl",
        "application/vnd.hp-hpgl"
    ],
    [
        "hh",
        [
            "text/plain",
            "text/x-h"
        ]
    ],
    [
        "hlb",
        "text/x-script"
    ],
    [
        "hlp",
        [
            "application/winhlp",
            "application/hlp",
            "application/x-helpfile",
            "application/x-winhelp"
        ]
    ],
    [
        "hpg",
        "application/vnd.hp-hpgl"
    ],
    [
        "hpgl",
        "application/vnd.hp-hpgl"
    ],
    [
        "hpid",
        "application/vnd.hp-hpid"
    ],
    [
        "hps",
        "application/vnd.hp-hps"
    ],
    [
        "hqx",
        [
            "application/mac-binhex40",
            "application/binhex",
            "application/binhex4",
            "application/mac-binhex",
            "application/x-binhex40",
            "application/x-mac-binhex40"
        ]
    ],
    [
        "hta",
        "application/hta"
    ],
    [
        "htc",
        "text/x-component"
    ],
    [
        "htke",
        "application/vnd.kenameaapp"
    ],
    [
        "htm",
        "text/html"
    ],
    [
        "html",
        "text/html"
    ],
    [
        "htmls",
        "text/html"
    ],
    [
        "htt",
        "text/webviewhtml"
    ],
    [
        "htx",
        "text/html"
    ],
    [
        "hvd",
        "application/vnd.yamaha.hv-dic"
    ],
    [
        "hvp",
        "application/vnd.yamaha.hv-voice"
    ],
    [
        "hvs",
        "application/vnd.yamaha.hv-script"
    ],
    [
        "i2g",
        "application/vnd.intergeo"
    ],
    [
        "icc",
        "application/vnd.iccprofile"
    ],
    [
        "ice",
        "x-conference/x-cooltalk"
    ],
    [
        "ico",
        "image/x-icon"
    ],
    [
        "ics",
        "text/calendar"
    ],
    [
        "idc",
        "text/plain"
    ],
    [
        "ief",
        "image/ief"
    ],
    [
        "iefs",
        "image/ief"
    ],
    [
        "ifm",
        "application/vnd.shana.informed.formdata"
    ],
    [
        "iges",
        [
            "application/iges",
            "model/iges"
        ]
    ],
    [
        "igl",
        "application/vnd.igloader"
    ],
    [
        "igm",
        "application/vnd.insors.igm"
    ],
    [
        "igs",
        [
            "application/iges",
            "model/iges"
        ]
    ],
    [
        "igx",
        "application/vnd.micrografx.igx"
    ],
    [
        "iif",
        "application/vnd.shana.informed.interchange"
    ],
    [
        "iii",
        "application/x-iphone"
    ],
    [
        "ima",
        "application/x-ima"
    ],
    [
        "imap",
        "application/x-httpd-imap"
    ],
    [
        "imp",
        "application/vnd.accpac.simply.imp"
    ],
    [
        "ims",
        "application/vnd.ms-ims"
    ],
    [
        "inf",
        "application/inf"
    ],
    [
        "ins",
        [
            "application/x-internet-signup",
            "application/x-internett-signup"
        ]
    ],
    [
        "ip",
        "application/x-ip2"
    ],
    [
        "ipfix",
        "application/ipfix"
    ],
    [
        "ipk",
        "application/vnd.shana.informed.package"
    ],
    [
        "irm",
        "application/vnd.ibm.rights-management"
    ],
    [
        "irp",
        "application/vnd.irepository.package+xml"
    ],
    [
        "isp",
        "application/x-internet-signup"
    ],
    [
        "isu",
        "video/x-isvideo"
    ],
    [
        "it",
        "audio/it"
    ],
    [
        "itp",
        "application/vnd.shana.informed.formtemplate"
    ],
    [
        "iv",
        "application/x-inventor"
    ],
    [
        "ivp",
        "application/vnd.immervision-ivp"
    ],
    [
        "ivr",
        "i-world/i-vrml"
    ],
    [
        "ivu",
        "application/vnd.immervision-ivu"
    ],
    [
        "ivy",
        "application/x-livescreen"
    ],
    [
        "jad",
        "text/vnd.sun.j2me.app-descriptor"
    ],
    [
        "jam",
        [
            "application/vnd.jam",
            "audio/x-jam"
        ]
    ],
    [
        "jar",
        "application/java-archive"
    ],
    [
        "jav",
        [
            "text/plain",
            "text/x-java-source"
        ]
    ],
    [
        "java",
        [
            "text/plain",
            "text/x-java-source,java",
            "text/x-java-source"
        ]
    ],
    [
        "jcm",
        "application/x-java-commerce"
    ],
    [
        "jfif",
        [
            "image/pipeg",
            "image/jpeg",
            "image/pjpeg"
        ]
    ],
    [
        "jfif-tbnl",
        "image/jpeg"
    ],
    [
        "jisp",
        "application/vnd.jisp"
    ],
    [
        "jlt",
        "application/vnd.hp-jlyt"
    ],
    [
        "jnlp",
        "application/x-java-jnlp-file"
    ],
    [
        "joda",
        "application/vnd.joost.joda-archive"
    ],
    [
        "jpe",
        [
            "image/jpeg",
            "image/pjpeg"
        ]
    ],
    [
        "jpeg",
        [
            "image/jpeg",
            "image/pjpeg"
        ]
    ],
    [
        "jpg",
        [
            "image/jpeg",
            "image/pjpeg"
        ]
    ],
    [
        "jpgv",
        "video/jpeg"
    ],
    [
        "jpm",
        "video/jpm"
    ],
    [
        "jps",
        "image/x-jps"
    ],
    [
        "js",
        [
            "application/javascript",
            "application/ecmascript",
            "text/javascript",
            "text/ecmascript",
            "application/x-javascript"
        ]
    ],
    [
        "json",
        "application/json"
    ],
    [
        "jut",
        "image/jutvision"
    ],
    [
        "kar",
        [
            "audio/midi",
            "music/x-karaoke"
        ]
    ],
    [
        "karbon",
        "application/vnd.kde.karbon"
    ],
    [
        "kfo",
        "application/vnd.kde.kformula"
    ],
    [
        "kia",
        "application/vnd.kidspiration"
    ],
    [
        "kml",
        "application/vnd.google-earth.kml+xml"
    ],
    [
        "kmz",
        "application/vnd.google-earth.kmz"
    ],
    [
        "kne",
        "application/vnd.kinar"
    ],
    [
        "kon",
        "application/vnd.kde.kontour"
    ],
    [
        "kpr",
        "application/vnd.kde.kpresenter"
    ],
    [
        "ksh",
        [
            "application/x-ksh",
            "text/x-script.ksh"
        ]
    ],
    [
        "ksp",
        "application/vnd.kde.kspread"
    ],
    [
        "ktx",
        "image/ktx"
    ],
    [
        "ktz",
        "application/vnd.kahootz"
    ],
    [
        "kwd",
        "application/vnd.kde.kword"
    ],
    [
        "la",
        [
            "audio/nspaudio",
            "audio/x-nspaudio"
        ]
    ],
    [
        "lam",
        "audio/x-liveaudio"
    ],
    [
        "lasxml",
        "application/vnd.las.las+xml"
    ],
    [
        "latex",
        "application/x-latex"
    ],
    [
        "lbd",
        "application/vnd.llamagraphics.life-balance.desktop"
    ],
    [
        "lbe",
        "application/vnd.llamagraphics.life-balance.exchange+xml"
    ],
    [
        "les",
        "application/vnd.hhe.lesson-player"
    ],
    [
        "lha",
        [
            "application/octet-stream",
            "application/lha",
            "application/x-lha"
        ]
    ],
    [
        "lhx",
        "application/octet-stream"
    ],
    [
        "link66",
        "application/vnd.route66.link66+xml"
    ],
    [
        "list",
        "text/plain"
    ],
    [
        "lma",
        [
            "audio/nspaudio",
            "audio/x-nspaudio"
        ]
    ],
    [
        "log",
        "text/plain"
    ],
    [
        "lrm",
        "application/vnd.ms-lrm"
    ],
    [
        "lsf",
        "video/x-la-asf"
    ],
    [
        "lsp",
        [
            "application/x-lisp",
            "text/x-script.lisp"
        ]
    ],
    [
        "lst",
        "text/plain"
    ],
    [
        "lsx",
        [
            "video/x-la-asf",
            "text/x-la-asf"
        ]
    ],
    [
        "ltf",
        "application/vnd.frogans.ltf"
    ],
    [
        "ltx",
        "application/x-latex"
    ],
    [
        "lvp",
        "audio/vnd.lucent.voice"
    ],
    [
        "lwp",
        "application/vnd.lotus-wordpro"
    ],
    [
        "lzh",
        [
            "application/octet-stream",
            "application/x-lzh"
        ]
    ],
    [
        "lzx",
        [
            "application/lzx",
            "application/octet-stream",
            "application/x-lzx"
        ]
    ],
    [
        "m",
        [
            "text/plain",
            "text/x-m"
        ]
    ],
    [
        "m13",
        "application/x-msmediaview"
    ],
    [
        "m14",
        "application/x-msmediaview"
    ],
    [
        "m1v",
        "video/mpeg"
    ],
    [
        "m21",
        "application/mp21"
    ],
    [
        "m2a",
        "audio/mpeg"
    ],
    [
        "m2v",
        "video/mpeg"
    ],
    [
        "m3u",
        [
            "audio/x-mpegurl",
            "audio/x-mpequrl"
        ]
    ],
    [
        "m3u8",
        "application/vnd.apple.mpegurl"
    ],
    [
        "m4v",
        "video/x-m4v"
    ],
    [
        "ma",
        "application/mathematica"
    ],
    [
        "mads",
        "application/mads+xml"
    ],
    [
        "mag",
        "application/vnd.ecowin.chart"
    ],
    [
        "man",
        "application/x-troff-man"
    ],
    [
        "map",
        "application/x-navimap"
    ],
    [
        "mar",
        "text/plain"
    ],
    [
        "mathml",
        "application/mathml+xml"
    ],
    [
        "mbd",
        "application/mbedlet"
    ],
    [
        "mbk",
        "application/vnd.mobius.mbk"
    ],
    [
        "mbox",
        "application/mbox"
    ],
    [
        "mc$",
        "application/x-magic-cap-package-1.0"
    ],
    [
        "mc1",
        "application/vnd.medcalcdata"
    ],
    [
        "mcd",
        [
            "application/mcad",
            "application/vnd.mcd",
            "application/x-mathcad"
        ]
    ],
    [
        "mcf",
        [
            "image/vasa",
            "text/mcf"
        ]
    ],
    [
        "mcp",
        "application/netmc"
    ],
    [
        "mcurl",
        "text/vnd.curl.mcurl"
    ],
    [
        "mdb",
        "application/x-msaccess"
    ],
    [
        "mdi",
        "image/vnd.ms-modi"
    ],
    [
        "me",
        "application/x-troff-me"
    ],
    [
        "meta4",
        "application/metalink4+xml"
    ],
    [
        "mets",
        "application/mets+xml"
    ],
    [
        "mfm",
        "application/vnd.mfmp"
    ],
    [
        "mgp",
        "application/vnd.osgeo.mapguide.package"
    ],
    [
        "mgz",
        "application/vnd.proteus.magazine"
    ],
    [
        "mht",
        "message/rfc822"
    ],
    [
        "mhtml",
        "message/rfc822"
    ],
    [
        "mid",
        [
            "audio/mid",
            "audio/midi",
            "music/crescendo",
            "x-music/x-midi",
            "audio/x-midi",
            "application/x-midi",
            "audio/x-mid"
        ]
    ],
    [
        "midi",
        [
            "audio/midi",
            "music/crescendo",
            "x-music/x-midi",
            "audio/x-midi",
            "application/x-midi",
            "audio/x-mid"
        ]
    ],
    [
        "mif",
        [
            "application/vnd.mif",
            "application/x-mif",
            "application/x-frame"
        ]
    ],
    [
        "mime",
        [
            "message/rfc822",
            "www/mime"
        ]
    ],
    [
        "mj2",
        "video/mj2"
    ],
    [
        "mjf",
        "audio/x-vnd.audioexplosion.mjuicemediafile"
    ],
    [
        "mjpg",
        "video/x-motion-jpeg"
    ],
    [
        "mlp",
        "application/vnd.dolby.mlp"
    ],
    [
        "mm",
        [
            "application/base64",
            "application/x-meme"
        ]
    ],
    [
        "mmd",
        "application/vnd.chipnuts.karaoke-mmd"
    ],
    [
        "mme",
        "application/base64"
    ],
    [
        "mmf",
        "application/vnd.smaf"
    ],
    [
        "mmr",
        "image/vnd.fujixerox.edmics-mmr"
    ],
    [
        "mny",
        "application/x-msmoney"
    ],
    [
        "mod",
        [
            "audio/mod",
            "audio/x-mod"
        ]
    ],
    [
        "mods",
        "application/mods+xml"
    ],
    [
        "moov",
        "video/quicktime"
    ],
    [
        "mov",
        "video/quicktime"
    ],
    [
        "movie",
        "video/x-sgi-movie"
    ],
    [
        "mp2",
        [
            "video/mpeg",
            "audio/mpeg",
            "video/x-mpeg",
            "audio/x-mpeg",
            "video/x-mpeq2a"
        ]
    ],
    [
        "mp3",
        [
            "audio/mpeg",
            "audio/mpeg3",
            "video/mpeg",
            "audio/x-mpeg-3",
            "video/x-mpeg"
        ]
    ],
    [
        "mp4",
        [
            "video/mp4",
            "application/mp4"
        ]
    ],
    [
        "mp4a",
        "audio/mp4"
    ],
    [
        "mpa",
        [
            "video/mpeg",
            "audio/mpeg"
        ]
    ],
    [
        "mpc",
        [
            "application/vnd.mophun.certificate",
            "application/x-project"
        ]
    ],
    [
        "mpe",
        "video/mpeg"
    ],
    [
        "mpeg",
        "video/mpeg"
    ],
    [
        "mpg",
        [
            "video/mpeg",
            "audio/mpeg"
        ]
    ],
    [
        "mpga",
        "audio/mpeg"
    ],
    [
        "mpkg",
        "application/vnd.apple.installer+xml"
    ],
    [
        "mpm",
        "application/vnd.blueice.multipass"
    ],
    [
        "mpn",
        "application/vnd.mophun.application"
    ],
    [
        "mpp",
        "application/vnd.ms-project"
    ],
    [
        "mpt",
        "application/x-project"
    ],
    [
        "mpv",
        "application/x-project"
    ],
    [
        "mpv2",
        "video/mpeg"
    ],
    [
        "mpx",
        "application/x-project"
    ],
    [
        "mpy",
        "application/vnd.ibm.minipay"
    ],
    [
        "mqy",
        "application/vnd.mobius.mqy"
    ],
    [
        "mrc",
        "application/marc"
    ],
    [
        "mrcx",
        "application/marcxml+xml"
    ],
    [
        "ms",
        "application/x-troff-ms"
    ],
    [
        "mscml",
        "application/mediaservercontrol+xml"
    ],
    [
        "mseq",
        "application/vnd.mseq"
    ],
    [
        "msf",
        "application/vnd.epson.msf"
    ],
    [
        "msg",
        "application/vnd.ms-outlook"
    ],
    [
        "msh",
        "model/mesh"
    ],
    [
        "msl",
        "application/vnd.mobius.msl"
    ],
    [
        "msty",
        "application/vnd.muvee.style"
    ],
    [
        "mts",
        "model/vnd.mts"
    ],
    [
        "mus",
        "application/vnd.musician"
    ],
    [
        "musicxml",
        "application/vnd.recordare.musicxml+xml"
    ],
    [
        "mv",
        "video/x-sgi-movie"
    ],
    [
        "mvb",
        "application/x-msmediaview"
    ],
    [
        "mwf",
        "application/vnd.mfer"
    ],
    [
        "mxf",
        "application/mxf"
    ],
    [
        "mxl",
        "application/vnd.recordare.musicxml"
    ],
    [
        "mxml",
        "application/xv+xml"
    ],
    [
        "mxs",
        "application/vnd.triscape.mxs"
    ],
    [
        "mxu",
        "video/vnd.mpegurl"
    ],
    [
        "my",
        "audio/make"
    ],
    [
        "mzz",
        "application/x-vnd.audioexplosion.mzz"
    ],
    [
        "n-gage",
        "application/vnd.nokia.n-gage.symbian.install"
    ],
    [
        "n3",
        "text/n3"
    ],
    [
        "nap",
        "image/naplps"
    ],
    [
        "naplps",
        "image/naplps"
    ],
    [
        "nbp",
        "application/vnd.wolfram.player"
    ],
    [
        "nc",
        "application/x-netcdf"
    ],
    [
        "ncm",
        "application/vnd.nokia.configuration-message"
    ],
    [
        "ncx",
        "application/x-dtbncx+xml"
    ],
    [
        "ngdat",
        "application/vnd.nokia.n-gage.data"
    ],
    [
        "nif",
        "image/x-niff"
    ],
    [
        "niff",
        "image/x-niff"
    ],
    [
        "nix",
        "application/x-mix-transfer"
    ],
    [
        "nlu",
        "application/vnd.neurolanguage.nlu"
    ],
    [
        "nml",
        "application/vnd.enliven"
    ],
    [
        "nnd",
        "application/vnd.noblenet-directory"
    ],
    [
        "nns",
        "application/vnd.noblenet-sealer"
    ],
    [
        "nnw",
        "application/vnd.noblenet-web"
    ],
    [
        "npx",
        "image/vnd.net-fpx"
    ],
    [
        "nsc",
        "application/x-conference"
    ],
    [
        "nsf",
        "application/vnd.lotus-notes"
    ],
    [
        "nvd",
        "application/x-navidoc"
    ],
    [
        "nws",
        "message/rfc822"
    ],
    [
        "o",
        "application/octet-stream"
    ],
    [
        "oa2",
        "application/vnd.fujitsu.oasys2"
    ],
    [
        "oa3",
        "application/vnd.fujitsu.oasys3"
    ],
    [
        "oas",
        "application/vnd.fujitsu.oasys"
    ],
    [
        "obd",
        "application/x-msbinder"
    ],
    [
        "oda",
        "application/oda"
    ],
    [
        "odb",
        "application/vnd.oasis.opendocument.database"
    ],
    [
        "odc",
        "application/vnd.oasis.opendocument.chart"
    ],
    [
        "odf",
        "application/vnd.oasis.opendocument.formula"
    ],
    [
        "odft",
        "application/vnd.oasis.opendocument.formula-template"
    ],
    [
        "odg",
        "application/vnd.oasis.opendocument.graphics"
    ],
    [
        "odi",
        "application/vnd.oasis.opendocument.image"
    ],
    [
        "odm",
        "application/vnd.oasis.opendocument.text-master"
    ],
    [
        "odp",
        "application/vnd.oasis.opendocument.presentation"
    ],
    [
        "ods",
        "application/vnd.oasis.opendocument.spreadsheet"
    ],
    [
        "odt",
        "application/vnd.oasis.opendocument.text"
    ],
    [
        "oga",
        "audio/ogg"
    ],
    [
        "ogv",
        "video/ogg"
    ],
    [
        "ogx",
        "application/ogg"
    ],
    [
        "omc",
        "application/x-omc"
    ],
    [
        "omcd",
        "application/x-omcdatamaker"
    ],
    [
        "omcr",
        "application/x-omcregerator"
    ],
    [
        "onetoc",
        "application/onenote"
    ],
    [
        "opf",
        "application/oebps-package+xml"
    ],
    [
        "org",
        "application/vnd.lotus-organizer"
    ],
    [
        "osf",
        "application/vnd.yamaha.openscoreformat"
    ],
    [
        "osfpvg",
        "application/vnd.yamaha.openscoreformat.osfpvg+xml"
    ],
    [
        "otc",
        "application/vnd.oasis.opendocument.chart-template"
    ],
    [
        "otf",
        "application/x-font-otf"
    ],
    [
        "otg",
        "application/vnd.oasis.opendocument.graphics-template"
    ],
    [
        "oth",
        "application/vnd.oasis.opendocument.text-web"
    ],
    [
        "oti",
        "application/vnd.oasis.opendocument.image-template"
    ],
    [
        "otp",
        "application/vnd.oasis.opendocument.presentation-template"
    ],
    [
        "ots",
        "application/vnd.oasis.opendocument.spreadsheet-template"
    ],
    [
        "ott",
        "application/vnd.oasis.opendocument.text-template"
    ],
    [
        "oxt",
        "application/vnd.openofficeorg.extension"
    ],
    [
        "p",
        "text/x-pascal"
    ],
    [
        "p10",
        [
            "application/pkcs10",
            "application/x-pkcs10"
        ]
    ],
    [
        "p12",
        [
            "application/pkcs-12",
            "application/x-pkcs12"
        ]
    ],
    [
        "p7a",
        "application/x-pkcs7-signature"
    ],
    [
        "p7b",
        "application/x-pkcs7-certificates"
    ],
    [
        "p7c",
        [
            "application/pkcs7-mime",
            "application/x-pkcs7-mime"
        ]
    ],
    [
        "p7m",
        [
            "application/pkcs7-mime",
            "application/x-pkcs7-mime"
        ]
    ],
    [
        "p7r",
        "application/x-pkcs7-certreqresp"
    ],
    [
        "p7s",
        [
            "application/pkcs7-signature",
            "application/x-pkcs7-signature"
        ]
    ],
    [
        "p8",
        "application/pkcs8"
    ],
    [
        "par",
        "text/plain-bas"
    ],
    [
        "part",
        "application/pro_eng"
    ],
    [
        "pas",
        "text/pascal"
    ],
    [
        "paw",
        "application/vnd.pawaafile"
    ],
    [
        "pbd",
        "application/vnd.powerbuilder6"
    ],
    [
        "pbm",
        "image/x-portable-bitmap"
    ],
    [
        "pcf",
        "application/x-font-pcf"
    ],
    [
        "pcl",
        [
            "application/vnd.hp-pcl",
            "application/x-pcl"
        ]
    ],
    [
        "pclxl",
        "application/vnd.hp-pclxl"
    ],
    [
        "pct",
        "image/x-pict"
    ],
    [
        "pcurl",
        "application/vnd.curl.pcurl"
    ],
    [
        "pcx",
        "image/x-pcx"
    ],
    [
        "pdb",
        [
            "application/vnd.palm",
            "chemical/x-pdb"
        ]
    ],
    [
        "pdf",
        "application/pdf"
    ],
    [
        "pfa",
        "application/x-font-type1"
    ],
    [
        "pfr",
        "application/font-tdpfr"
    ],
    [
        "pfunk",
        [
            "audio/make",
            "audio/make.my.funk"
        ]
    ],
    [
        "pfx",
        "application/x-pkcs12"
    ],
    [
        "pgm",
        [
            "image/x-portable-graymap",
            "image/x-portable-greymap"
        ]
    ],
    [
        "pgn",
        "application/x-chess-pgn"
    ],
    [
        "pgp",
        "application/pgp-signature"
    ],
    [
        "pic",
        [
            "image/pict",
            "image/x-pict"
        ]
    ],
    [
        "pict",
        "image/pict"
    ],
    [
        "pkg",
        "application/x-newton-compatible-pkg"
    ],
    [
        "pki",
        "application/pkixcmp"
    ],
    [
        "pkipath",
        "application/pkix-pkipath"
    ],
    [
        "pko",
        [
            "application/ynd.ms-pkipko",
            "application/vnd.ms-pki.pko"
        ]
    ],
    [
        "pl",
        [
            "text/plain",
            "text/x-script.perl"
        ]
    ],
    [
        "plb",
        "application/vnd.3gpp.pic-bw-large"
    ],
    [
        "plc",
        "application/vnd.mobius.plc"
    ],
    [
        "plf",
        "application/vnd.pocketlearn"
    ],
    [
        "pls",
        "application/pls+xml"
    ],
    [
        "plx",
        "application/x-pixclscript"
    ],
    [
        "pm",
        [
            "text/x-script.perl-module",
            "image/x-xpixmap"
        ]
    ],
    [
        "pm4",
        "application/x-pagemaker"
    ],
    [
        "pm5",
        "application/x-pagemaker"
    ],
    [
        "pma",
        "application/x-perfmon"
    ],
    [
        "pmc",
        "application/x-perfmon"
    ],
    [
        "pml",
        [
            "application/vnd.ctc-posml",
            "application/x-perfmon"
        ]
    ],
    [
        "pmr",
        "application/x-perfmon"
    ],
    [
        "pmw",
        "application/x-perfmon"
    ],
    [
        "png",
        "image/png"
    ],
    [
        "pnm",
        [
            "application/x-portable-anymap",
            "image/x-portable-anymap"
        ]
    ],
    [
        "portpkg",
        "application/vnd.macports.portpkg"
    ],
    [
        "pot",
        [
            "application/vnd.ms-powerpoint",
            "application/mspowerpoint"
        ]
    ],
    [
        "potm",
        "application/vnd.ms-powerpoint.template.macroenabled.12"
    ],
    [
        "potx",
        "application/vnd.openxmlformats-officedocument.presentationml.template"
    ],
    [
        "pov",
        "model/x-pov"
    ],
    [
        "ppa",
        "application/vnd.ms-powerpoint"
    ],
    [
        "ppam",
        "application/vnd.ms-powerpoint.addin.macroenabled.12"
    ],
    [
        "ppd",
        "application/vnd.cups-ppd"
    ],
    [
        "ppm",
        "image/x-portable-pixmap"
    ],
    [
        "pps",
        [
            "application/vnd.ms-powerpoint",
            "application/mspowerpoint"
        ]
    ],
    [
        "ppsm",
        "application/vnd.ms-powerpoint.slideshow.macroenabled.12"
    ],
    [
        "ppsx",
        "application/vnd.openxmlformats-officedocument.presentationml.slideshow"
    ],
    [
        "ppt",
        [
            "application/vnd.ms-powerpoint",
            "application/mspowerpoint",
            "application/powerpoint",
            "application/x-mspowerpoint"
        ]
    ],
    [
        "pptm",
        "application/vnd.ms-powerpoint.presentation.macroenabled.12"
    ],
    [
        "pptx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ],
    [
        "ppz",
        "application/mspowerpoint"
    ],
    [
        "prc",
        "application/x-mobipocket-ebook"
    ],
    [
        "pre",
        [
            "application/vnd.lotus-freelance",
            "application/x-freelance"
        ]
    ],
    [
        "prf",
        "application/pics-rules"
    ],
    [
        "prt",
        "application/pro_eng"
    ],
    [
        "ps",
        "application/postscript"
    ],
    [
        "psb",
        "application/vnd.3gpp.pic-bw-small"
    ],
    [
        "psd",
        [
            "application/octet-stream",
            "image/vnd.adobe.photoshop"
        ]
    ],
    [
        "psf",
        "application/x-font-linux-psf"
    ],
    [
        "pskcxml",
        "application/pskc+xml"
    ],
    [
        "ptid",
        "application/vnd.pvi.ptid1"
    ],
    [
        "pub",
        "application/x-mspublisher"
    ],
    [
        "pvb",
        "application/vnd.3gpp.pic-bw-var"
    ],
    [
        "pvu",
        "paleovu/x-pv"
    ],
    [
        "pwn",
        "application/vnd.3m.post-it-notes"
    ],
    [
        "pwz",
        "application/vnd.ms-powerpoint"
    ],
    [
        "py",
        "text/x-script.phyton"
    ],
    [
        "pya",
        "audio/vnd.ms-playready.media.pya"
    ],
    [
        "pyc",
        "application/x-bytecode.python"
    ],
    [
        "pyv",
        "video/vnd.ms-playready.media.pyv"
    ],
    [
        "qam",
        "application/vnd.epson.quickanime"
    ],
    [
        "qbo",
        "application/vnd.intu.qbo"
    ],
    [
        "qcp",
        "audio/vnd.qcelp"
    ],
    [
        "qd3",
        "x-world/x-3dmf"
    ],
    [
        "qd3d",
        "x-world/x-3dmf"
    ],
    [
        "qfx",
        "application/vnd.intu.qfx"
    ],
    [
        "qif",
        "image/x-quicktime"
    ],
    [
        "qps",
        "application/vnd.publishare-delta-tree"
    ],
    [
        "qt",
        "video/quicktime"
    ],
    [
        "qtc",
        "video/x-qtc"
    ],
    [
        "qti",
        "image/x-quicktime"
    ],
    [
        "qtif",
        "image/x-quicktime"
    ],
    [
        "qxd",
        "application/vnd.quark.quarkxpress"
    ],
    [
        "ra",
        [
            "audio/x-realaudio",
            "audio/x-pn-realaudio",
            "audio/x-pn-realaudio-plugin"
        ]
    ],
    [
        "ram",
        "audio/x-pn-realaudio"
    ],
    [
        "rar",
        "application/x-rar-compressed"
    ],
    [
        "ras",
        [
            "image/cmu-raster",
            "application/x-cmu-raster",
            "image/x-cmu-raster"
        ]
    ],
    [
        "rast",
        "image/cmu-raster"
    ],
    [
        "rcprofile",
        "application/vnd.ipunplugged.rcprofile"
    ],
    [
        "rdf",
        "application/rdf+xml"
    ],
    [
        "rdz",
        "application/vnd.data-vision.rdz"
    ],
    [
        "rep",
        "application/vnd.businessobjects"
    ],
    [
        "res",
        "application/x-dtbresource+xml"
    ],
    [
        "rexx",
        "text/x-script.rexx"
    ],
    [
        "rf",
        "image/vnd.rn-realflash"
    ],
    [
        "rgb",
        "image/x-rgb"
    ],
    [
        "rif",
        "application/reginfo+xml"
    ],
    [
        "rip",
        "audio/vnd.rip"
    ],
    [
        "rl",
        "application/resource-lists+xml"
    ],
    [
        "rlc",
        "image/vnd.fujixerox.edmics-rlc"
    ],
    [
        "rld",
        "application/resource-lists-diff+xml"
    ],
    [
        "rm",
        [
            "application/vnd.rn-realmedia",
            "audio/x-pn-realaudio"
        ]
    ],
    [
        "rmi",
        "audio/mid"
    ],
    [
        "rmm",
        "audio/x-pn-realaudio"
    ],
    [
        "rmp",
        [
            "audio/x-pn-realaudio-plugin",
            "audio/x-pn-realaudio"
        ]
    ],
    [
        "rms",
        "application/vnd.jcp.javame.midlet-rms"
    ],
    [
        "rnc",
        "application/relax-ng-compact-syntax"
    ],
    [
        "rng",
        [
            "application/ringing-tones",
            "application/vnd.nokia.ringing-tone"
        ]
    ],
    [
        "rnx",
        "application/vnd.rn-realplayer"
    ],
    [
        "roff",
        "application/x-troff"
    ],
    [
        "rp",
        "image/vnd.rn-realpix"
    ],
    [
        "rp9",
        "application/vnd.cloanto.rp9"
    ],
    [
        "rpm",
        "audio/x-pn-realaudio-plugin"
    ],
    [
        "rpss",
        "application/vnd.nokia.radio-presets"
    ],
    [
        "rpst",
        "application/vnd.nokia.radio-preset"
    ],
    [
        "rq",
        "application/sparql-query"
    ],
    [
        "rs",
        "application/rls-services+xml"
    ],
    [
        "rsd",
        "application/rsd+xml"
    ],
    [
        "rt",
        [
            "text/richtext",
            "text/vnd.rn-realtext"
        ]
    ],
    [
        "rtf",
        [
            "application/rtf",
            "text/richtext",
            "application/x-rtf"
        ]
    ],
    [
        "rtx",
        [
            "text/richtext",
            "application/rtf"
        ]
    ],
    [
        "rv",
        "video/vnd.rn-realvideo"
    ],
    [
        "s",
        "text/x-asm"
    ],
    [
        "s3m",
        "audio/s3m"
    ],
    [
        "saf",
        "application/vnd.yamaha.smaf-audio"
    ],
    [
        "saveme",
        "application/octet-stream"
    ],
    [
        "sbk",
        "application/x-tbook"
    ],
    [
        "sbml",
        "application/sbml+xml"
    ],
    [
        "sc",
        "application/vnd.ibm.secure-container"
    ],
    [
        "scd",
        "application/x-msschedule"
    ],
    [
        "scm",
        [
            "application/vnd.lotus-screencam",
            "video/x-scm",
            "text/x-script.guile",
            "application/x-lotusscreencam",
            "text/x-script.scheme"
        ]
    ],
    [
        "scq",
        "application/scvp-cv-request"
    ],
    [
        "scs",
        "application/scvp-cv-response"
    ],
    [
        "sct",
        "text/scriptlet"
    ],
    [
        "scurl",
        "text/vnd.curl.scurl"
    ],
    [
        "sda",
        "application/vnd.stardivision.draw"
    ],
    [
        "sdc",
        "application/vnd.stardivision.calc"
    ],
    [
        "sdd",
        "application/vnd.stardivision.impress"
    ],
    [
        "sdkm",
        "application/vnd.solent.sdkm+xml"
    ],
    [
        "sdml",
        "text/plain"
    ],
    [
        "sdp",
        [
            "application/sdp",
            "application/x-sdp"
        ]
    ],
    [
        "sdr",
        "application/sounder"
    ],
    [
        "sdw",
        "application/vnd.stardivision.writer"
    ],
    [
        "sea",
        [
            "application/sea",
            "application/x-sea"
        ]
    ],
    [
        "see",
        "application/vnd.seemail"
    ],
    [
        "seed",
        "application/vnd.fdsn.seed"
    ],
    [
        "sema",
        "application/vnd.sema"
    ],
    [
        "semd",
        "application/vnd.semd"
    ],
    [
        "semf",
        "application/vnd.semf"
    ],
    [
        "ser",
        "application/java-serialized-object"
    ],
    [
        "set",
        "application/set"
    ],
    [
        "setpay",
        "application/set-payment-initiation"
    ],
    [
        "setreg",
        "application/set-registration-initiation"
    ],
    [
        "sfd-hdstx",
        "application/vnd.hydrostatix.sof-data"
    ],
    [
        "sfs",
        "application/vnd.spotfire.sfs"
    ],
    [
        "sgl",
        "application/vnd.stardivision.writer-global"
    ],
    [
        "sgm",
        [
            "text/sgml",
            "text/x-sgml"
        ]
    ],
    [
        "sgml",
        [
            "text/sgml",
            "text/x-sgml"
        ]
    ],
    [
        "sh",
        [
            "application/x-shar",
            "application/x-bsh",
            "application/x-sh",
            "text/x-script.sh"
        ]
    ],
    [
        "shar",
        [
            "application/x-bsh",
            "application/x-shar"
        ]
    ],
    [
        "shf",
        "application/shf+xml"
    ],
    [
        "shtml",
        [
            "text/html",
            "text/x-server-parsed-html"
        ]
    ],
    [
        "sid",
        "audio/x-psid"
    ],
    [
        "sis",
        "application/vnd.symbian.install"
    ],
    [
        "sit",
        [
            "application/x-stuffit",
            "application/x-sit"
        ]
    ],
    [
        "sitx",
        "application/x-stuffitx"
    ],
    [
        "skd",
        "application/x-koan"
    ],
    [
        "skm",
        "application/x-koan"
    ],
    [
        "skp",
        [
            "application/vnd.koan",
            "application/x-koan"
        ]
    ],
    [
        "skt",
        "application/x-koan"
    ],
    [
        "sl",
        "application/x-seelogo"
    ],
    [
        "sldm",
        "application/vnd.ms-powerpoint.slide.macroenabled.12"
    ],
    [
        "sldx",
        "application/vnd.openxmlformats-officedocument.presentationml.slide"
    ],
    [
        "slt",
        "application/vnd.epson.salt"
    ],
    [
        "sm",
        "application/vnd.stepmania.stepchart"
    ],
    [
        "smf",
        "application/vnd.stardivision.math"
    ],
    [
        "smi",
        [
            "application/smil",
            "application/smil+xml"
        ]
    ],
    [
        "smil",
        "application/smil"
    ],
    [
        "snd",
        [
            "audio/basic",
            "audio/x-adpcm"
        ]
    ],
    [
        "snf",
        "application/x-font-snf"
    ],
    [
        "sol",
        "application/solids"
    ],
    [
        "spc",
        [
            "text/x-speech",
            "application/x-pkcs7-certificates"
        ]
    ],
    [
        "spf",
        "application/vnd.yamaha.smaf-phrase"
    ],
    [
        "spl",
        [
            "application/futuresplash",
            "application/x-futuresplash"
        ]
    ],
    [
        "spot",
        "text/vnd.in3d.spot"
    ],
    [
        "spp",
        "application/scvp-vp-response"
    ],
    [
        "spq",
        "application/scvp-vp-request"
    ],
    [
        "spr",
        "application/x-sprite"
    ],
    [
        "sprite",
        "application/x-sprite"
    ],
    [
        "src",
        "application/x-wais-source"
    ],
    [
        "sru",
        "application/sru+xml"
    ],
    [
        "srx",
        "application/sparql-results+xml"
    ],
    [
        "sse",
        "application/vnd.kodak-descriptor"
    ],
    [
        "ssf",
        "application/vnd.epson.ssf"
    ],
    [
        "ssi",
        "text/x-server-parsed-html"
    ],
    [
        "ssm",
        "application/streamingmedia"
    ],
    [
        "ssml",
        "application/ssml+xml"
    ],
    [
        "sst",
        [
            "application/vnd.ms-pkicertstore",
            "application/vnd.ms-pki.certstore"
        ]
    ],
    [
        "st",
        "application/vnd.sailingtracker.track"
    ],
    [
        "stc",
        "application/vnd.sun.xml.calc.template"
    ],
    [
        "std",
        "application/vnd.sun.xml.draw.template"
    ],
    [
        "step",
        "application/step"
    ],
    [
        "stf",
        "application/vnd.wt.stf"
    ],
    [
        "sti",
        "application/vnd.sun.xml.impress.template"
    ],
    [
        "stk",
        "application/hyperstudio"
    ],
    [
        "stl",
        [
            "application/vnd.ms-pkistl",
            "application/sla",
            "application/vnd.ms-pki.stl",
            "application/x-navistyle"
        ]
    ],
    [
        "stm",
        "text/html"
    ],
    [
        "stp",
        "application/step"
    ],
    [
        "str",
        "application/vnd.pg.format"
    ],
    [
        "stw",
        "application/vnd.sun.xml.writer.template"
    ],
    [
        "sub",
        "image/vnd.dvb.subtitle"
    ],
    [
        "sus",
        "application/vnd.sus-calendar"
    ],
    [
        "sv4cpio",
        "application/x-sv4cpio"
    ],
    [
        "sv4crc",
        "application/x-sv4crc"
    ],
    [
        "svc",
        "application/vnd.dvb.service"
    ],
    [
        "svd",
        "application/vnd.svd"
    ],
    [
        "svf",
        [
            "image/vnd.dwg",
            "image/x-dwg"
        ]
    ],
    [
        "svg",
        "image/svg+xml"
    ],
    [
        "svr",
        [
            "x-world/x-svr",
            "application/x-world"
        ]
    ],
    [
        "swf",
        "application/x-shockwave-flash"
    ],
    [
        "swi",
        "application/vnd.aristanetworks.swi"
    ],
    [
        "sxc",
        "application/vnd.sun.xml.calc"
    ],
    [
        "sxd",
        "application/vnd.sun.xml.draw"
    ],
    [
        "sxg",
        "application/vnd.sun.xml.writer.global"
    ],
    [
        "sxi",
        "application/vnd.sun.xml.impress"
    ],
    [
        "sxm",
        "application/vnd.sun.xml.math"
    ],
    [
        "sxw",
        "application/vnd.sun.xml.writer"
    ],
    [
        "t",
        [
            "text/troff",
            "application/x-troff"
        ]
    ],
    [
        "talk",
        "text/x-speech"
    ],
    [
        "tao",
        "application/vnd.tao.intent-module-archive"
    ],
    [
        "tar",
        "application/x-tar"
    ],
    [
        "tbk",
        [
            "application/toolbook",
            "application/x-tbook"
        ]
    ],
    [
        "tcap",
        "application/vnd.3gpp2.tcap"
    ],
    [
        "tcl",
        [
            "text/x-script.tcl",
            "application/x-tcl"
        ]
    ],
    [
        "tcsh",
        "text/x-script.tcsh"
    ],
    [
        "teacher",
        "application/vnd.smart.teacher"
    ],
    [
        "tei",
        "application/tei+xml"
    ],
    [
        "tex",
        "application/x-tex"
    ],
    [
        "texi",
        "application/x-texinfo"
    ],
    [
        "texinfo",
        "application/x-texinfo"
    ],
    [
        "text",
        [
            "application/plain",
            "text/plain"
        ]
    ],
    [
        "tfi",
        "application/thraud+xml"
    ],
    [
        "tfm",
        "application/x-tex-tfm"
    ],
    [
        "tgz",
        [
            "application/gnutar",
            "application/x-compressed"
        ]
    ],
    [
        "thmx",
        "application/vnd.ms-officetheme"
    ],
    [
        "tif",
        [
            "image/tiff",
            "image/x-tiff"
        ]
    ],
    [
        "tiff",
        [
            "image/tiff",
            "image/x-tiff"
        ]
    ],
    [
        "tmo",
        "application/vnd.tmobile-livetv"
    ],
    [
        "torrent",
        "application/x-bittorrent"
    ],
    [
        "tpl",
        "application/vnd.groove-tool-template"
    ],
    [
        "tpt",
        "application/vnd.trid.tpt"
    ],
    [
        "tr",
        "application/x-troff"
    ],
    [
        "tra",
        "application/vnd.trueapp"
    ],
    [
        "trm",
        "application/x-msterminal"
    ],
    [
        "tsd",
        "application/timestamped-data"
    ],
    [
        "tsi",
        "audio/tsp-audio"
    ],
    [
        "tsp",
        [
            "application/dsptype",
            "audio/tsplayer"
        ]
    ],
    [
        "tsv",
        "text/tab-separated-values"
    ],
    [
        "ttf",
        "application/x-font-ttf"
    ],
    [
        "ttl",
        "text/turtle"
    ],
    [
        "turbot",
        "image/florian"
    ],
    [
        "twd",
        "application/vnd.simtech-mindmapper"
    ],
    [
        "txd",
        "application/vnd.genomatix.tuxedo"
    ],
    [
        "txf",
        "application/vnd.mobius.txf"
    ],
    [
        "txt",
        "text/plain"
    ],
    [
        "ufd",
        "application/vnd.ufdl"
    ],
    [
        "uil",
        "text/x-uil"
    ],
    [
        "uls",
        "text/iuls"
    ],
    [
        "umj",
        "application/vnd.umajin"
    ],
    [
        "uni",
        "text/uri-list"
    ],
    [
        "unis",
        "text/uri-list"
    ],
    [
        "unityweb",
        "application/vnd.unity"
    ],
    [
        "unv",
        "application/i-deas"
    ],
    [
        "uoml",
        "application/vnd.uoml+xml"
    ],
    [
        "uri",
        "text/uri-list"
    ],
    [
        "uris",
        "text/uri-list"
    ],
    [
        "ustar",
        [
            "application/x-ustar",
            "multipart/x-ustar"
        ]
    ],
    [
        "utz",
        "application/vnd.uiq.theme"
    ],
    [
        "uu",
        [
            "application/octet-stream",
            "text/x-uuencode"
        ]
    ],
    [
        "uue",
        "text/x-uuencode"
    ],
    [
        "uva",
        "audio/vnd.dece.audio"
    ],
    [
        "uvh",
        "video/vnd.dece.hd"
    ],
    [
        "uvi",
        "image/vnd.dece.graphic"
    ],
    [
        "uvm",
        "video/vnd.dece.mobile"
    ],
    [
        "uvp",
        "video/vnd.dece.pd"
    ],
    [
        "uvs",
        "video/vnd.dece.sd"
    ],
    [
        "uvu",
        "video/vnd.uvvu.mp4"
    ],
    [
        "uvv",
        "video/vnd.dece.video"
    ],
    [
        "vcd",
        "application/x-cdlink"
    ],
    [
        "vcf",
        "text/x-vcard"
    ],
    [
        "vcg",
        "application/vnd.groove-vcard"
    ],
    [
        "vcs",
        "text/x-vcalendar"
    ],
    [
        "vcx",
        "application/vnd.vcx"
    ],
    [
        "vda",
        "application/vda"
    ],
    [
        "vdo",
        "video/vdo"
    ],
    [
        "vew",
        "application/groupwise"
    ],
    [
        "vis",
        "application/vnd.visionary"
    ],
    [
        "viv",
        [
            "video/vivo",
            "video/vnd.vivo"
        ]
    ],
    [
        "vivo",
        [
            "video/vivo",
            "video/vnd.vivo"
        ]
    ],
    [
        "vmd",
        "application/vocaltec-media-desc"
    ],
    [
        "vmf",
        "application/vocaltec-media-file"
    ],
    [
        "voc",
        [
            "audio/voc",
            "audio/x-voc"
        ]
    ],
    [
        "vos",
        "video/vosaic"
    ],
    [
        "vox",
        "audio/voxware"
    ],
    [
        "vqe",
        "audio/x-twinvq-plugin"
    ],
    [
        "vqf",
        "audio/x-twinvq"
    ],
    [
        "vql",
        "audio/x-twinvq-plugin"
    ],
    [
        "vrml",
        [
            "model/vrml",
            "x-world/x-vrml",
            "application/x-vrml"
        ]
    ],
    [
        "vrt",
        "x-world/x-vrt"
    ],
    [
        "vsd",
        [
            "application/vnd.visio",
            "application/x-visio"
        ]
    ],
    [
        "vsf",
        "application/vnd.vsf"
    ],
    [
        "vst",
        "application/x-visio"
    ],
    [
        "vsw",
        "application/x-visio"
    ],
    [
        "vtu",
        "model/vnd.vtu"
    ],
    [
        "vxml",
        "application/voicexml+xml"
    ],
    [
        "w60",
        "application/wordperfect6.0"
    ],
    [
        "w61",
        "application/wordperfect6.1"
    ],
    [
        "w6w",
        "application/msword"
    ],
    [
        "wad",
        "application/x-doom"
    ],
    [
        "wav",
        [
            "audio/wav",
            "audio/x-wav"
        ]
    ],
    [
        "wax",
        "audio/x-ms-wax"
    ],
    [
        "wb1",
        "application/x-qpro"
    ],
    [
        "wbmp",
        "image/vnd.wap.wbmp"
    ],
    [
        "wbs",
        "application/vnd.criticaltools.wbs+xml"
    ],
    [
        "wbxml",
        "application/vnd.wap.wbxml"
    ],
    [
        "wcm",
        "application/vnd.ms-works"
    ],
    [
        "wdb",
        "application/vnd.ms-works"
    ],
    [
        "web",
        "application/vnd.xara"
    ],
    [
        "weba",
        "audio/webm"
    ],
    [
        "webm",
        "video/webm"
    ],
    [
        "webp",
        "image/webp"
    ],
    [
        "wg",
        "application/vnd.pmi.widget"
    ],
    [
        "wgt",
        "application/widget"
    ],
    [
        "wiz",
        "application/msword"
    ],
    [
        "wk1",
        "application/x-123"
    ],
    [
        "wks",
        "application/vnd.ms-works"
    ],
    [
        "wm",
        "video/x-ms-wm"
    ],
    [
        "wma",
        "audio/x-ms-wma"
    ],
    [
        "wmd",
        "application/x-ms-wmd"
    ],
    [
        "wmf",
        [
            "windows/metafile",
            "application/x-msmetafile"
        ]
    ],
    [
        "wml",
        "text/vnd.wap.wml"
    ],
    [
        "wmlc",
        "application/vnd.wap.wmlc"
    ],
    [
        "wmls",
        "text/vnd.wap.wmlscript"
    ],
    [
        "wmlsc",
        "application/vnd.wap.wmlscriptc"
    ],
    [
        "wmv",
        "video/x-ms-wmv"
    ],
    [
        "wmx",
        "video/x-ms-wmx"
    ],
    [
        "wmz",
        "application/x-ms-wmz"
    ],
    [
        "woff",
        "application/x-font-woff"
    ],
    [
        "word",
        "application/msword"
    ],
    [
        "wp",
        "application/wordperfect"
    ],
    [
        "wp5",
        [
            "application/wordperfect",
            "application/wordperfect6.0"
        ]
    ],
    [
        "wp6",
        "application/wordperfect"
    ],
    [
        "wpd",
        [
            "application/wordperfect",
            "application/vnd.wordperfect",
            "application/x-wpwin"
        ]
    ],
    [
        "wpl",
        "application/vnd.ms-wpl"
    ],
    [
        "wps",
        "application/vnd.ms-works"
    ],
    [
        "wq1",
        "application/x-lotus"
    ],
    [
        "wqd",
        "application/vnd.wqd"
    ],
    [
        "wri",
        [
            "application/mswrite",
            "application/x-wri",
            "application/x-mswrite"
        ]
    ],
    [
        "wrl",
        [
            "model/vrml",
            "x-world/x-vrml",
            "application/x-world"
        ]
    ],
    [
        "wrz",
        [
            "model/vrml",
            "x-world/x-vrml"
        ]
    ],
    [
        "wsc",
        "text/scriplet"
    ],
    [
        "wsdl",
        "application/wsdl+xml"
    ],
    [
        "wspolicy",
        "application/wspolicy+xml"
    ],
    [
        "wsrc",
        "application/x-wais-source"
    ],
    [
        "wtb",
        "application/vnd.webturbo"
    ],
    [
        "wtk",
        "application/x-wintalk"
    ],
    [
        "wvx",
        "video/x-ms-wvx"
    ],
    [
        "x-png",
        "image/png"
    ],
    [
        "x3d",
        "application/vnd.hzn-3d-crossword"
    ],
    [
        "xaf",
        "x-world/x-vrml"
    ],
    [
        "xap",
        "application/x-silverlight-app"
    ],
    [
        "xar",
        "application/vnd.xara"
    ],
    [
        "xbap",
        "application/x-ms-xbap"
    ],
    [
        "xbd",
        "application/vnd.fujixerox.docuworks.binder"
    ],
    [
        "xbm",
        [
            "image/xbm",
            "image/x-xbm",
            "image/x-xbitmap"
        ]
    ],
    [
        "xdf",
        "application/xcap-diff+xml"
    ],
    [
        "xdm",
        "application/vnd.syncml.dm+xml"
    ],
    [
        "xdp",
        "application/vnd.adobe.xdp+xml"
    ],
    [
        "xdr",
        "video/x-amt-demorun"
    ],
    [
        "xdssc",
        "application/dssc+xml"
    ],
    [
        "xdw",
        "application/vnd.fujixerox.docuworks"
    ],
    [
        "xenc",
        "application/xenc+xml"
    ],
    [
        "xer",
        "application/patch-ops-error+xml"
    ],
    [
        "xfdf",
        "application/vnd.adobe.xfdf"
    ],
    [
        "xfdl",
        "application/vnd.xfdl"
    ],
    [
        "xgz",
        "xgl/drawing"
    ],
    [
        "xhtml",
        "application/xhtml+xml"
    ],
    [
        "xif",
        "image/vnd.xiff"
    ],
    [
        "xl",
        "application/excel"
    ],
    [
        "xla",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-msexcel",
            "application/x-excel"
        ]
    ],
    [
        "xlam",
        "application/vnd.ms-excel.addin.macroenabled.12"
    ],
    [
        "xlb",
        [
            "application/excel",
            "application/vnd.ms-excel",
            "application/x-excel"
        ]
    ],
    [
        "xlc",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xld",
        [
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xlk",
        [
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xll",
        [
            "application/excel",
            "application/vnd.ms-excel",
            "application/x-excel"
        ]
    ],
    [
        "xlm",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xls",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-msexcel",
            "application/x-excel"
        ]
    ],
    [
        "xlsb",
        "application/vnd.ms-excel.sheet.binary.macroenabled.12"
    ],
    [
        "xlsm",
        "application/vnd.ms-excel.sheet.macroenabled.12"
    ],
    [
        "xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ],
    [
        "xlt",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xltm",
        "application/vnd.ms-excel.template.macroenabled.12"
    ],
    [
        "xltx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.template"
    ],
    [
        "xlv",
        [
            "application/excel",
            "application/x-excel"
        ]
    ],
    [
        "xlw",
        [
            "application/vnd.ms-excel",
            "application/excel",
            "application/x-msexcel",
            "application/x-excel"
        ]
    ],
    [
        "xm",
        "audio/xm"
    ],
    [
        "xml",
        [
            "application/xml",
            "text/xml",
            "application/atom+xml",
            "application/rss+xml"
        ]
    ],
    [
        "xmz",
        "xgl/movie"
    ],
    [
        "xo",
        "application/vnd.olpc-sugar"
    ],
    [
        "xof",
        "x-world/x-vrml"
    ],
    [
        "xop",
        "application/xop+xml"
    ],
    [
        "xpi",
        "application/x-xpinstall"
    ],
    [
        "xpix",
        "application/x-vnd.ls-xpix"
    ],
    [
        "xpm",
        [
            "image/xpm",
            "image/x-xpixmap"
        ]
    ],
    [
        "xpr",
        "application/vnd.is-xpr"
    ],
    [
        "xps",
        "application/vnd.ms-xpsdocument"
    ],
    [
        "xpw",
        "application/vnd.intercon.formnet"
    ],
    [
        "xslt",
        "application/xslt+xml"
    ],
    [
        "xsm",
        "application/vnd.syncml+xml"
    ],
    [
        "xspf",
        "application/xspf+xml"
    ],
    [
        "xsr",
        "video/x-amt-showrun"
    ],
    [
        "xul",
        "application/vnd.mozilla.xul+xml"
    ],
    [
        "xwd",
        [
            "image/x-xwd",
            "image/x-xwindowdump"
        ]
    ],
    [
        "xyz",
        [
            "chemical/x-xyz",
            "chemical/x-pdb"
        ]
    ],
    [
        "yang",
        "application/yang"
    ],
    [
        "yin",
        "application/yin+xml"
    ],
    [
        "z",
        [
            "application/x-compressed",
            "application/x-compress"
        ]
    ],
    [
        "zaz",
        "application/vnd.zzazz.deck+xml"
    ],
    [
        "zip",
        [
            "application/zip",
            "multipart/x-zip",
            "application/x-zip-compressed",
            "application/x-compressed"
        ]
    ],
    [
        "zir",
        "application/vnd.zul"
    ],
    [
        "zmm",
        "application/vnd.handheld-entertainment+xml"
    ],
    [
        "zoo",
        "application/octet-stream"
    ],
    [
        "zsh",
        "text/x-script.zsh"
    ]
]);
module.exports = {
    detectMimeType (filename) {
        if (!filename) {
            return defaultMimeType;
        }
        let parsed = path.parse(filename);
        let extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
        let value = defaultMimeType;
        if (extensions.has(extension)) {
            value = extensions.get(extension);
        }
        if (Array.isArray(value)) {
            return value[0];
        }
        return value;
    },
    detectExtension (mimeType) {
        if (!mimeType) {
            return defaultExtension;
        }
        let parts = (mimeType || "").toLowerCase().trim().split("/");
        let rootType = parts.shift().trim();
        let subType = parts.join("/").trim();
        if (mimeTypes.has(rootType + "/" + subType)) {
            let value = mimeTypes.get(rootType + "/" + subType);
            if (Array.isArray(value)) {
                return value[0];
            }
            return value;
        }
        switch(rootType){
            case "text":
                return "txt";
            default:
                return "bin";
        }
    }
};


/***/ }),

/***/ 812:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint no-undefined: 0, prefer-spread: 0, no-control-regex: 0 */ 
const crypto = __webpack_require__(6113);
const fs = __webpack_require__(7147);
const punycode = __webpack_require__(5477);
const PassThrough = (__webpack_require__(2781).PassThrough);
const shared = __webpack_require__(2122);
const mimeFuncs = __webpack_require__(2499);
const qp = __webpack_require__(964);
const base64 = __webpack_require__(4806);
const addressparser = __webpack_require__(3625);
const nmfetch = __webpack_require__(7199);
const LastNewline = __webpack_require__(9643);
const LeWindows = __webpack_require__(7547);
const LeUnix = __webpack_require__(4694);
/**
 * Creates a new mime tree node. Assumes 'multipart/*' as the content type
 * if it is a branch, anything else counts as leaf. If rootNode is missing from
 * the options, assumes this is the root.
 *
 * @param {String} contentType Define the content type for the node. Can be left blank for attachments (derived from filename)
 * @param {Object} [options] optional options
 * @param {Object} [options.rootNode] root node for this tree
 * @param {Object} [options.parentNode] immediate parent for this node
 * @param {Object} [options.filename] filename for an attachment node
 * @param {String} [options.baseBoundary] shared part of the unique multipart boundary
 * @param {Boolean} [options.keepBcc] If true, do not exclude Bcc from the generated headers
 * @param {Function} [options.normalizeHeaderKey] method to normalize header keys for custom caseing
 * @param {String} [options.textEncoding] either 'Q' (the default) or 'B'
 */ class MimeNode {
    constructor(contentType, options){
        this.nodeCounter = 0;
        options = options || {};
        /**
         * shared part of the unique multipart boundary
         */ this.baseBoundary = options.baseBoundary || crypto.randomBytes(8).toString("hex");
        this.boundaryPrefix = options.boundaryPrefix || "--_NmP";
        this.disableFileAccess = !!options.disableFileAccess;
        this.disableUrlAccess = !!options.disableUrlAccess;
        this.normalizeHeaderKey = options.normalizeHeaderKey;
        /**
         * If date headers is missing and current node is the root, this value is used instead
         */ this.date = new Date();
        /**
         * Root node for current mime tree
         */ this.rootNode = options.rootNode || this;
        /**
         * If true include Bcc in generated headers (if available)
         */ this.keepBcc = !!options.keepBcc;
        /**
         * If filename is specified but contentType is not (probably an attachment)
         * detect the content type from filename extension
         */ if (options.filename) {
            /**
             * Filename for this node. Useful with attachments
             */ this.filename = options.filename;
            if (!contentType) {
                contentType = mimeFuncs.detectMimeType(this.filename.split(".").pop());
            }
        }
        /**
         * Indicates which encoding should be used for header strings: "Q" or "B"
         */ this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase();
        /**
         * Immediate parent for this node (or undefined if not set)
         */ this.parentNode = options.parentNode;
        /**
         * Hostname for default message-id values
         */ this.hostname = options.hostname;
        /**
         * If set to 'win' then uses \r\n, if 'linux' then \n. If not set (or `raw` is used) then newlines are kept as is.
         */ this.newline = options.newline;
        /**
         * An array for possible child nodes
         */ this.childNodes = [];
        /**
         * Used for generating unique boundaries (prepended to the shared base)
         */ this._nodeId = ++this.rootNode.nodeCounter;
        /**
         * A list of header values for this node in the form of [{key:'', value:''}]
         */ this._headers = [];
        /**
         * True if the content only uses ASCII printable characters
         * @type {Boolean}
         */ this._isPlainText = false;
        /**
         * True if the content is plain text but has longer lines than allowed
         * @type {Boolean}
         */ this._hasLongLines = false;
        /**
         * If set, use instead this value for envelopes instead of generating one
         * @type {Boolean}
         */ this._envelope = false;
        /**
         * If set then use this value as the stream content instead of building it
         * @type {String|Buffer|Stream}
         */ this._raw = false;
        /**
         * Additional transform streams that the message will be piped before
         * exposing by createReadStream
         * @type {Array}
         */ this._transforms = [];
        /**
         * Additional process functions that the message will be piped through before
         * exposing by createReadStream. These functions are run after transforms
         * @type {Array}
         */ this._processFuncs = [];
        /**
         * If content type is set (or derived from the filename) add it to headers
         */ if (contentType) {
            this.setHeader("Content-Type", contentType);
        }
    }
    /////// PUBLIC METHODS
    /**
     * Creates and appends a child node.Arguments provided are passed to MimeNode constructor
     *
     * @param {String} [contentType] Optional content type
     * @param {Object} [options] Optional options object
     * @return {Object} Created node object
     */ createChild(contentType, options) {
        if (!options && typeof contentType === "object") {
            options = contentType;
            contentType = undefined;
        }
        let node = new MimeNode(contentType, options);
        this.appendChild(node);
        return node;
    }
    /**
     * Appends an existing node to the mime tree. Removes the node from an existing
     * tree if needed
     *
     * @param {Object} childNode node to be appended
     * @return {Object} Appended node object
     */ appendChild(childNode) {
        if (childNode.rootNode !== this.rootNode) {
            childNode.rootNode = this.rootNode;
            childNode._nodeId = ++this.rootNode.nodeCounter;
        }
        childNode.parentNode = this;
        this.childNodes.push(childNode);
        return childNode;
    }
    /**
     * Replaces current node with another node
     *
     * @param {Object} node Replacement node
     * @return {Object} Replacement node
     */ replace(node) {
        if (node === this) {
            return this;
        }
        this.parentNode.childNodes.forEach((childNode, i)=>{
            if (childNode === this) {
                node.rootNode = this.rootNode;
                node.parentNode = this.parentNode;
                node._nodeId = this._nodeId;
                this.rootNode = this;
                this.parentNode = undefined;
                node.parentNode.childNodes[i] = node;
            }
        });
        return node;
    }
    /**
     * Removes current node from the mime tree
     *
     * @return {Object} removed node
     */ remove() {
        if (!this.parentNode) {
            return this;
        }
        for(let i = this.parentNode.childNodes.length - 1; i >= 0; i--){
            if (this.parentNode.childNodes[i] === this) {
                this.parentNode.childNodes.splice(i, 1);
                this.parentNode = undefined;
                this.rootNode = this;
                return this;
            }
        }
    }
    /**
     * Sets a header value. If the value for selected key exists, it is overwritten.
     * You can set multiple values as well by using [{key:'', value:''}] or
     * {key: 'value'} as the first argument.
     *
     * @param {String|Array|Object} key Header key or a list of key value pairs
     * @param {String} value Header value
     * @return {Object} current node
     */ setHeader(key, value) {
        let added = false, headerValue;
        // Allow setting multiple headers at once
        if (!value && key && typeof key === "object") {
            // allow {key:'content-type', value: 'text/plain'}
            if (key.key && "value" in key) {
                this.setHeader(key.key, key.value);
            } else if (Array.isArray(key)) {
                // allow [{key:'content-type', value: 'text/plain'}]
                key.forEach((i)=>{
                    this.setHeader(i.key, i.value);
                });
            } else {
                // allow {'content-type': 'text/plain'}
                Object.keys(key).forEach((i)=>{
                    this.setHeader(i, key[i]);
                });
            }
            return this;
        }
        key = this._normalizeHeaderKey(key);
        headerValue = {
            key,
            value
        };
        // Check if the value exists and overwrite
        for(let i = 0, len = this._headers.length; i < len; i++){
            if (this._headers[i].key === key) {
                if (!added) {
                    // replace the first match
                    this._headers[i] = headerValue;
                    added = true;
                } else {
                    // remove following matches
                    this._headers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        // match not found, append the value
        if (!added) {
            this._headers.push(headerValue);
        }
        return this;
    }
    /**
     * Adds a header value. If the value for selected key exists, the value is appended
     * as a new field and old one is not touched.
     * You can set multiple values as well by using [{key:'', value:''}] or
     * {key: 'value'} as the first argument.
     *
     * @param {String|Array|Object} key Header key or a list of key value pairs
     * @param {String} value Header value
     * @return {Object} current node
     */ addHeader(key, value) {
        // Allow setting multiple headers at once
        if (!value && key && typeof key === "object") {
            // allow {key:'content-type', value: 'text/plain'}
            if (key.key && key.value) {
                this.addHeader(key.key, key.value);
            } else if (Array.isArray(key)) {
                // allow [{key:'content-type', value: 'text/plain'}]
                key.forEach((i)=>{
                    this.addHeader(i.key, i.value);
                });
            } else {
                // allow {'content-type': 'text/plain'}
                Object.keys(key).forEach((i)=>{
                    this.addHeader(i, key[i]);
                });
            }
            return this;
        } else if (Array.isArray(value)) {
            value.forEach((val)=>{
                this.addHeader(key, val);
            });
            return this;
        }
        this._headers.push({
            key: this._normalizeHeaderKey(key),
            value
        });
        return this;
    }
    /**
     * Retrieves the first mathcing value of a selected key
     *
     * @param {String} key Key to search for
     * @retun {String} Value for the key
     */ getHeader(key) {
        key = this._normalizeHeaderKey(key);
        for(let i = 0, len = this._headers.length; i < len; i++){
            if (this._headers[i].key === key) {
                return this._headers[i].value;
            }
        }
    }
    /**
     * Sets body content for current node. If the value is a string, charset is added automatically
     * to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
     * the charset yourself
     *
     * @param (String|Buffer) content Body content
     * @return {Object} current node
     */ setContent(content) {
        this.content = content;
        if (typeof this.content.pipe === "function") {
            // pre-stream handler. might be triggered if a stream is set as content
            // and 'error' fires before anything is done with this stream
            this._contentErrorHandler = (err)=>{
                this.content.removeListener("error", this._contentErrorHandler);
                this.content = err;
            };
            this.content.once("error", this._contentErrorHandler);
        } else if (typeof this.content === "string") {
            this._isPlainText = mimeFuncs.isPlainText(this.content);
            if (this._isPlainText && mimeFuncs.hasLongerLines(this.content, 76)) {
                // If there are lines longer than 76 symbols/bytes do not use 7bit
                this._hasLongLines = true;
            }
        }
        return this;
    }
    build(callback) {
        let promise;
        if (!callback) {
            promise = new Promise((resolve, reject)=>{
                callback = shared.callbackPromise(resolve, reject);
            });
        }
        let stream = this.createReadStream();
        let buf = [];
        let buflen = 0;
        let returned = false;
        stream.on("readable", ()=>{
            let chunk;
            while((chunk = stream.read()) !== null){
                buf.push(chunk);
                buflen += chunk.length;
            }
        });
        stream.once("error", (err)=>{
            if (returned) {
                return;
            }
            returned = true;
            return callback(err);
        });
        stream.once("end", (chunk)=>{
            if (returned) {
                return;
            }
            returned = true;
            if (chunk && chunk.length) {
                buf.push(chunk);
                buflen += chunk.length;
            }
            return callback(null, Buffer.concat(buf, buflen));
        });
        return promise;
    }
    getTransferEncoding() {
        let transferEncoding = false;
        let contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
        if (this.content) {
            transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim();
            if (!transferEncoding || ![
                "base64",
                "quoted-printable"
            ].includes(transferEncoding)) {
                if (/^text\//i.test(contentType)) {
                    // If there are no special symbols, no need to modify the text
                    if (this._isPlainText && !this._hasLongLines) {
                        transferEncoding = "7bit";
                    } else if (typeof this.content === "string" || this.content instanceof Buffer) {
                        // detect preferred encoding for string value
                        transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64";
                    } else {
                        // we can not check content for a stream, so either use preferred encoding or fallback to QP
                        transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable";
                    }
                } else if (!/^(multipart|message)\//i.test(contentType)) {
                    transferEncoding = transferEncoding || "base64";
                }
            }
        }
        return transferEncoding;
    }
    /**
     * Builds the header block for the mime node. Append \r\n\r\n before writing the content
     *
     * @returns {String} Headers
     */ buildHeaders() {
        let transferEncoding = this.getTransferEncoding();
        let headers = [];
        if (transferEncoding) {
            this.setHeader("Content-Transfer-Encoding", transferEncoding);
        }
        if (this.filename && !this.getHeader("Content-Disposition")) {
            this.setHeader("Content-Disposition", "attachment");
        }
        // Ensure mandatory header fields
        if (this.rootNode === this) {
            if (!this.getHeader("Date")) {
                this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000"));
            }
            // ensure that Message-Id is present
            this.messageId();
            if (!this.getHeader("MIME-Version")) {
                this.setHeader("MIME-Version", "1.0");
            }
        }
        this._headers.forEach((header)=>{
            let key = header.key;
            let value = header.value;
            let structured;
            let param;
            let options = {};
            let formattedHeaders = [
                "From",
                "Sender",
                "To",
                "Cc",
                "Bcc",
                "Reply-To",
                "Date",
                "References"
            ];
            if (value && typeof value === "object" && !formattedHeaders.includes(key)) {
                Object.keys(value).forEach((key)=>{
                    if (key !== "value") {
                        options[key] = value[key];
                    }
                });
                value = (value.value || "").toString();
                if (!value.trim()) {
                    return;
                }
            }
            if (options.prepared) {
                // header value is
                if (options.foldLines) {
                    headers.push(mimeFuncs.foldLines(key + ": " + value));
                } else {
                    headers.push(key + ": " + value);
                }
                return;
            }
            switch(header.key){
                case "Content-Disposition":
                    structured = mimeFuncs.parseHeaderValue(value);
                    if (this.filename) {
                        structured.params.filename = this.filename;
                    }
                    value = mimeFuncs.buildHeaderValue(structured);
                    break;
                case "Content-Type":
                    structured = mimeFuncs.parseHeaderValue(value);
                    this._handleContentType(structured);
                    if (structured.value.match(/^text\/plain\b/) && typeof this.content === "string" && /[\u0080-\uFFFF]/.test(this.content)) {
                        structured.params.charset = "utf-8";
                    }
                    value = mimeFuncs.buildHeaderValue(structured);
                    if (this.filename) {
                        // add support for non-compliant clients like QQ webmail
                        // we can't build the value with buildHeaderValue as the value is non standard and
                        // would be converted to parameter continuation encoding that we do not want
                        param = this._encodeWords(this.filename);
                        if (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) {
                            // include value in quotes if needed
                            param = '"' + param + '"';
                        }
                        value += "; name=" + param;
                    }
                    break;
                case "Bcc":
                    if (!this.keepBcc) {
                        // skip BCC values
                        return;
                    }
                    break;
            }
            value = this._encodeHeaderValue(key, value);
            // skip empty lines
            if (!(value || "").toString().trim()) {
                return;
            }
            if (typeof this.normalizeHeaderKey === "function") {
                let normalized = this.normalizeHeaderKey(key, value);
                if (normalized && typeof normalized === "string" && normalized.length) {
                    key = normalized;
                }
            }
            headers.push(mimeFuncs.foldLines(key + ": " + value, 76));
        });
        return headers.join("\r\n");
    }
    /**
     * Streams the rfc2822 message from the current node. If this is a root node,
     * mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
     *
     * @return {String} Compiled message
     */ createReadStream(options) {
        options = options || {};
        let stream = new PassThrough(options);
        let outputStream = stream;
        let transform;
        this.stream(stream, options, (err)=>{
            if (err) {
                outputStream.emit("error", err);
                return;
            }
            stream.end();
        });
        for(let i = 0, len = this._transforms.length; i < len; i++){
            transform = typeof this._transforms[i] === "function" ? this._transforms[i]() : this._transforms[i];
            outputStream.once("error", (err)=>{
                transform.emit("error", err);
            });
            outputStream = outputStream.pipe(transform);
        }
        // ensure terminating newline after possible user transforms
        transform = new LastNewline();
        outputStream.once("error", (err)=>{
            transform.emit("error", err);
        });
        outputStream = outputStream.pipe(transform);
        // dkim and stuff
        for(let i = 0, len = this._processFuncs.length; i < len; i++){
            transform = this._processFuncs[i];
            outputStream = transform(outputStream);
        }
        if (this.newline) {
            const winbreak = [
                "win",
                "windows",
                "dos",
                "\r\n"
            ].includes(this.newline.toString().toLowerCase());
            const newlineTransform = winbreak ? new LeWindows() : new LeUnix();
            const stream = outputStream.pipe(newlineTransform);
            outputStream.on("error", (err)=>stream.emit("error", err));
            return stream;
        }
        return outputStream;
    }
    /**
     * Appends a transform stream object to the transforms list. Final output
     * is passed through this stream before exposing
     *
     * @param {Object} transform Read-Write stream
     */ transform(transform) {
        this._transforms.push(transform);
    }
    /**
     * Appends a post process function. The functon is run after transforms and
     * uses the following syntax
     *
     *   processFunc(input) -> outputStream
     *
     * @param {Object} processFunc Read-Write stream
     */ processFunc(processFunc) {
        this._processFuncs.push(processFunc);
    }
    stream(outputStream, options, done) {
        let transferEncoding = this.getTransferEncoding();
        let contentStream;
        let localStream;
        // protect actual callback against multiple triggering
        let returned = false;
        let callback = (err)=>{
            if (returned) {
                return;
            }
            returned = true;
            done(err);
        };
        // for multipart nodes, push child nodes
        // for content nodes end the stream
        let finalize = ()=>{
            let childId = 0;
            let processChildNode = ()=>{
                if (childId >= this.childNodes.length) {
                    outputStream.write("\r\n--" + this.boundary + "--\r\n");
                    return callback();
                }
                let child = this.childNodes[childId++];
                outputStream.write((childId > 1 ? "\r\n" : "") + "--" + this.boundary + "\r\n");
                child.stream(outputStream, options, (err)=>{
                    if (err) {
                        return callback(err);
                    }
                    setImmediate(processChildNode);
                });
            };
            if (this.multipart) {
                setImmediate(processChildNode);
            } else {
                return callback();
            }
        };
        // pushes node content
        let sendContent = ()=>{
            if (this.content) {
                if (Object.prototype.toString.call(this.content) === "[object Error]") {
                    // content is already errored
                    return callback(this.content);
                }
                if (typeof this.content.pipe === "function") {
                    this.content.removeListener("error", this._contentErrorHandler);
                    this._contentErrorHandler = (err)=>callback(err);
                    this.content.once("error", this._contentErrorHandler);
                }
                let createStream = ()=>{
                    if ([
                        "quoted-printable",
                        "base64"
                    ].includes(transferEncoding)) {
                        contentStream = new (transferEncoding === "base64" ? base64 : qp).Encoder(options);
                        contentStream.pipe(outputStream, {
                            end: false
                        });
                        contentStream.once("end", finalize);
                        contentStream.once("error", (err)=>callback(err));
                        localStream = this._getStream(this.content);
                        localStream.pipe(contentStream);
                    } else {
                        // anything that is not QP or Base54 passes as-is
                        localStream = this._getStream(this.content);
                        localStream.pipe(outputStream, {
                            end: false
                        });
                        localStream.once("end", finalize);
                    }
                    localStream.once("error", (err)=>callback(err));
                };
                if (this.content._resolve) {
                    let chunks = [];
                    let chunklen = 0;
                    let returned = false;
                    let sourceStream = this._getStream(this.content);
                    sourceStream.on("error", (err)=>{
                        if (returned) {
                            return;
                        }
                        returned = true;
                        callback(err);
                    });
                    sourceStream.on("readable", ()=>{
                        let chunk;
                        while((chunk = sourceStream.read()) !== null){
                            chunks.push(chunk);
                            chunklen += chunk.length;
                        }
                    });
                    sourceStream.on("end", ()=>{
                        if (returned) {
                            return;
                        }
                        returned = true;
                        this.content._resolve = false;
                        this.content._resolvedValue = Buffer.concat(chunks, chunklen);
                        setImmediate(createStream);
                    });
                } else {
                    setImmediate(createStream);
                }
                return;
            } else {
                return setImmediate(finalize);
            }
        };
        if (this._raw) {
            setImmediate(()=>{
                if (Object.prototype.toString.call(this._raw) === "[object Error]") {
                    // content is already errored
                    return callback(this._raw);
                }
                // remove default error handler (if set)
                if (typeof this._raw.pipe === "function") {
                    this._raw.removeListener("error", this._contentErrorHandler);
                }
                let raw = this._getStream(this._raw);
                raw.pipe(outputStream, {
                    end: false
                });
                raw.on("error", (err)=>outputStream.emit("error", err));
                raw.on("end", finalize);
            });
        } else {
            outputStream.write(this.buildHeaders() + "\r\n\r\n");
            setImmediate(sendContent);
        }
    }
    /**
     * Sets envelope to be used instead of the generated one
     *
     * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
     */ setEnvelope(envelope) {
        let list;
        this._envelope = {
            from: false,
            to: []
        };
        if (envelope.from) {
            list = [];
            this._convertAddresses(this._parseAddresses(envelope.from), list);
            list = list.filter((address)=>address && address.address);
            if (list.length && list[0]) {
                this._envelope.from = list[0].address;
            }
        }
        [
            "to",
            "cc",
            "bcc"
        ].forEach((key)=>{
            if (envelope[key]) {
                this._convertAddresses(this._parseAddresses(envelope[key]), this._envelope.to);
            }
        });
        this._envelope.to = this._envelope.to.map((to)=>to.address).filter((address)=>address);
        let standardFields = [
            "to",
            "cc",
            "bcc",
            "from"
        ];
        Object.keys(envelope).forEach((key)=>{
            if (!standardFields.includes(key)) {
                this._envelope[key] = envelope[key];
            }
        });
        return this;
    }
    /**
     * Generates and returns an object with parsed address fields
     *
     * @return {Object} Address object
     */ getAddresses() {
        let addresses = {};
        this._headers.forEach((header)=>{
            let key = header.key.toLowerCase();
            if ([
                "from",
                "sender",
                "reply-to",
                "to",
                "cc",
                "bcc"
            ].includes(key)) {
                if (!Array.isArray(addresses[key])) {
                    addresses[key] = [];
                }
                this._convertAddresses(this._parseAddresses(header.value), addresses[key]);
            }
        });
        return addresses;
    }
    /**
     * Generates and returns SMTP envelope with the sender address and a list of recipients addresses
     *
     * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
     */ getEnvelope() {
        if (this._envelope) {
            return this._envelope;
        }
        let envelope = {
            from: false,
            to: []
        };
        this._headers.forEach((header)=>{
            let list = [];
            if (header.key === "From" || !envelope.from && [
                "Reply-To",
                "Sender"
            ].includes(header.key)) {
                this._convertAddresses(this._parseAddresses(header.value), list);
                if (list.length && list[0]) {
                    envelope.from = list[0].address;
                }
            } else if ([
                "To",
                "Cc",
                "Bcc"
            ].includes(header.key)) {
                this._convertAddresses(this._parseAddresses(header.value), envelope.to);
            }
        });
        envelope.to = envelope.to.map((to)=>to.address);
        return envelope;
    }
    /**
     * Returns Message-Id value. If it does not exist, then creates one
     *
     * @return {String} Message-Id value
     */ messageId() {
        let messageId = this.getHeader("Message-ID");
        // You really should define your own Message-Id field!
        if (!messageId) {
            messageId = this._generateMessageId();
            this.setHeader("Message-ID", messageId);
        }
        return messageId;
    }
    /**
     * Sets pregenerated content that will be used as the output of this node
     *
     * @param {String|Buffer|Stream} Raw MIME contents
     */ setRaw(raw) {
        this._raw = raw;
        if (this._raw && typeof this._raw.pipe === "function") {
            // pre-stream handler. might be triggered if a stream is set as content
            // and 'error' fires before anything is done with this stream
            this._contentErrorHandler = (err)=>{
                this._raw.removeListener("error", this._contentErrorHandler);
                this._raw = err;
            };
            this._raw.once("error", this._contentErrorHandler);
        }
        return this;
    }
    /////// PRIVATE METHODS
    /**
     * Detects and returns handle to a stream related with the content.
     *
     * @param {Mixed} content Node content
     * @returns {Object} Stream object
     */ _getStream(content) {
        let contentStream;
        if (content._resolvedValue) {
            // pass string or buffer content as a stream
            contentStream = new PassThrough();
            setImmediate(()=>{
                try {
                    contentStream.end(content._resolvedValue);
                } catch (err) {
                    contentStream.emit("error", err);
                }
            });
            return contentStream;
        } else if (typeof content.pipe === "function") {
            // assume as stream
            return content;
        } else if (content && typeof content.path === "string" && !content.href) {
            if (this.disableFileAccess) {
                contentStream = new PassThrough();
                setImmediate(()=>contentStream.emit("error", new Error("File access rejected for " + content.path)));
                return contentStream;
            }
            // read file
            return fs.createReadStream(content.path);
        } else if (content && typeof content.href === "string") {
            if (this.disableUrlAccess) {
                contentStream = new PassThrough();
                setImmediate(()=>contentStream.emit("error", new Error("Url access rejected for " + content.href)));
                return contentStream;
            }
            // fetch URL
            return nmfetch(content.href, {
                headers: content.httpHeaders
            });
        } else {
            // pass string or buffer content as a stream
            contentStream = new PassThrough();
            setImmediate(()=>{
                try {
                    contentStream.end(content || "");
                } catch (err) {
                    contentStream.emit("error", err);
                }
            });
            return contentStream;
        }
    }
    /**
     * Parses addresses. Takes in a single address or an array or an
     * array of address arrays (eg. To: [[first group], [second group],...])
     *
     * @param {Mixed} addresses Addresses to be parsed
     * @return {Array} An array of address objects
     */ _parseAddresses(addresses) {
        return [].concat.apply([], [].concat(addresses).map((address)=>{
            // eslint-disable-line prefer-spread
            if (address && address.address) {
                address.address = this._normalizeAddress(address.address);
                address.name = address.name || "";
                return [
                    address
                ];
            }
            return addressparser(address);
        }));
    }
    /**
     * Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
     *
     * @param {String} key Key to be normalized
     * @return {String} key in Camel-Case form
     */ _normalizeHeaderKey(key) {
        key = (key || "").toString()// no newlines in keys
        .replace(/\r?\n|\r/g, " ").trim().toLowerCase()// use uppercase words, except MIME
        .replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c)=>c.toUpperCase())// special case
        .replace(/^Content-Features$/i, "Content-features");
        return key;
    }
    /**
     * Checks if the content type is multipart and defines boundary if needed.
     * Doesn't return anything, modifies object argument instead.
     *
     * @param {Object} structured Parsed header value for 'Content-Type' key
     */ _handleContentType(structured) {
        this.contentType = structured.value.trim().toLowerCase();
        this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : false;
        if (this.multipart) {
            this.boundary = structured.params.boundary = structured.params.boundary || this.boundary || this._generateBoundary();
        } else {
            this.boundary = false;
        }
    }
    /**
     * Generates a multipart boundary value
     *
     * @return {String} boundary value
     */ _generateBoundary() {
        return this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary + "-Part_" + this._nodeId;
    }
    /**
     * Encodes a header value for use in the generated rfc2822 email.
     *
     * @param {String} key Header key
     * @param {String} value Header value
     */ _encodeHeaderValue(key, value) {
        key = this._normalizeHeaderKey(key);
        switch(key){
            // Structured headers
            case "From":
            case "Sender":
            case "To":
            case "Cc":
            case "Bcc":
            case "Reply-To":
                return this._convertAddresses(this._parseAddresses(value));
            // values enclosed in <>
            case "Message-ID":
            case "In-Reply-To":
            case "Content-Id":
                value = (value || "").toString().replace(/\r?\n|\r/g, " ");
                if (value.charAt(0) !== "<") {
                    value = "<" + value;
                }
                if (value.charAt(value.length - 1) !== ">") {
                    value = value + ">";
                }
                return value;
            // space separated list of values enclosed in <>
            case "References":
                value = [].concat.apply([], [].concat(value || "").map((elm)=>{
                    // eslint-disable-line prefer-spread
                    elm = (elm || "").toString().replace(/\r?\n|\r/g, " ").trim();
                    return elm.replace(/<[^>]*>/g, (str)=>str.replace(/\s/g, "")).split(/\s+/);
                })).map((elm)=>{
                    if (elm.charAt(0) !== "<") {
                        elm = "<" + elm;
                    }
                    if (elm.charAt(elm.length - 1) !== ">") {
                        elm = elm + ">";
                    }
                    return elm;
                });
                return value.join(" ").trim();
            case "Date":
                if (Object.prototype.toString.call(value) === "[object Date]") {
                    return value.toUTCString().replace(/GMT/, "+0000");
                }
                value = (value || "").toString().replace(/\r?\n|\r/g, " ");
                return this._encodeWords(value);
            case "Content-Type":
            case "Content-Disposition":
                // if it includes a filename then it is already encoded
                return (value || "").toString().replace(/\r?\n|\r/g, " ");
            default:
                value = (value || "").toString().replace(/\r?\n|\r/g, " ");
                // encodeWords only encodes if needed, otherwise the original string is returned
                return this._encodeWords(value);
        }
    }
    /**
     * Rebuilds address object using punycode and other adjustments
     *
     * @param {Array} addresses An array of address objects
     * @param {Array} [uniqueList] An array to be populated with addresses
     * @return {String} address string
     */ _convertAddresses(addresses, uniqueList) {
        let values = [];
        uniqueList = uniqueList || [];
        [].concat(addresses || []).forEach((address)=>{
            if (address.address) {
                address.address = this._normalizeAddress(address.address);
                if (!address.name) {
                    values.push(address.address.indexOf(" ") >= 0 ? `<${address.address}>` : `${address.address}`);
                } else if (address.name) {
                    values.push(`${this._encodeAddressName(address.name)} <${address.address}>`);
                }
                if (address.address) {
                    if (!uniqueList.filter((a)=>a.address === address.address).length) {
                        uniqueList.push(address);
                    }
                }
            } else if (address.group) {
                let groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList) : "").trim();
                values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
            }
        });
        return values.join(", ");
    }
    /**
     * Normalizes an email address
     *
     * @param {Array} address An array of address objects
     * @return {String} address string
     */ _normalizeAddress(address) {
        address = (address || "").toString().replace(/[\x00-\x1F<>]+/g, " ") // remove unallowed characters
        .trim();
        let lastAt = address.lastIndexOf("@");
        if (lastAt < 0) {
            // Bare username
            return address;
        }
        let user = address.substr(0, lastAt);
        let domain = address.substr(lastAt + 1);
        // Usernames are not touched and are kept as is even if these include unicode
        // Domains are punycoded by default
        // 'jõgeva.ee' will be converted to 'xn--jgeva-dua.ee'
        // non-unicode domains are left as is
        let encodedDomain;
        try {
            encodedDomain = punycode.toASCII(domain.toLowerCase());
        } catch (err) {
        // keep as is?
        }
        if (user.indexOf(" ") >= 0) {
            if (user.charAt(0) !== '"') {
                user = '"' + user;
            }
            if (user.substr(-1) !== '"') {
                user = user + '"';
            }
        }
        return `${user}@${encodedDomain}`;
    }
    /**
     * If needed, mime encodes the name part
     *
     * @param {String} name Name part of an address
     * @returns {String} Mime word encoded string if needed
     */ _encodeAddressName(name) {
        if (!/^[\w ']*$/.test(name)) {
            if (/^[\x20-\x7e]*$/.test(name)) {
                return '"' + name.replace(/([\\"])/g, "\\$1") + '"';
            } else {
                return mimeFuncs.encodeWord(name, this._getTextEncoding(name), 52);
            }
        }
        return name;
    }
    /**
     * If needed, mime encodes the name part
     *
     * @param {String} name Name part of an address
     * @returns {String} Mime word encoded string if needed
     */ _encodeWords(value) {
        // set encodeAll parameter to true even though it is against the recommendation of RFC2047,
        // by default only words that include non-ascii should be converted into encoded words
        // but some clients (eg. Zimbra) do not handle it properly and remove surrounding whitespace
        return mimeFuncs.encodeWords(value, this._getTextEncoding(value), 52, true);
    }
    /**
     * Detects best mime encoding for a text value
     *
     * @param {String} value Value to check for
     * @return {String} either 'Q' or 'B'
     */ _getTextEncoding(value) {
        value = (value || "").toString();
        let encoding = this.textEncoding;
        let latinLen;
        let nonLatinLen;
        if (!encoding) {
            // count latin alphabet symbols and 8-bit range symbols + control symbols
            // if there are more latin characters, then use quoted-printable
            // encoding, otherwise use base64
            nonLatinLen = (value.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\u0080-\uFFFF]/g) || []).length; // eslint-disable-line no-control-regex
            latinLen = (value.match(/[a-z]/gi) || []).length;
            // if there are more latin symbols than binary/unicode, then prefer Q, otherwise B
            encoding = nonLatinLen < latinLen ? "Q" : "B";
        }
        return encoding;
    }
    /**
     * Generates a message id
     *
     * @return {String} Random Message-ID value
     */ _generateMessageId() {
        return "<" + [
            2,
            2,
            2,
            6
        ].reduce(// crux to generate UUID-like random strings
        (prev, len)=>prev + "-" + crypto.randomBytes(len).toString("hex"), crypto.randomBytes(4).toString("hex")) + "@" + // try to use the domain of the FROM address or fallback to server hostname
        (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
    }
}
module.exports = MimeNode;


/***/ }),

/***/ 9643:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Transform = (__webpack_require__(2781).Transform);
class LastNewline extends Transform {
    constructor(){
        super();
        this.lastByte = false;
    }
    _transform(chunk, encoding, done) {
        if (chunk.length) {
            this.lastByte = chunk[chunk.length - 1];
        }
        this.push(chunk);
        done();
    }
    _flush(done) {
        if (this.lastByte === 0x0a) {
            return done();
        }
        if (this.lastByte === 0x0d) {
            this.push(Buffer.from("\n"));
            return done();
        }
        this.push(Buffer.from("\r\n"));
        return done();
    }
}
module.exports = LastNewline;


/***/ }),

/***/ 4694:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const stream = __webpack_require__(2781);
const Transform = stream.Transform;
/**
 * Ensures that only <LF> is used for linebreaks
 *
 * @param {Object} options Stream options
 */ class LeWindows extends Transform {
    constructor(options){
        super(options);
        // init Transform
        this.options = options || {};
    }
    /**
     * Escapes dots
     */ _transform(chunk, encoding, done) {
        let buf;
        let lastPos = 0;
        for(let i = 0, len = chunk.length; i < len; i++){
            if (chunk[i] === 0x0d) {
                // \n
                buf = chunk.slice(lastPos, i);
                lastPos = i + 1;
                this.push(buf);
            }
        }
        if (lastPos && lastPos < chunk.length) {
            buf = chunk.slice(lastPos);
            this.push(buf);
        } else if (!lastPos) {
            this.push(chunk);
        }
        done();
    }
}
module.exports = LeWindows;


/***/ }),

/***/ 7547:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const stream = __webpack_require__(2781);
const Transform = stream.Transform;
/**
 * Ensures that only <CR><LF> sequences are used for linebreaks
 *
 * @param {Object} options Stream options
 */ class LeWindows extends Transform {
    constructor(options){
        super(options);
        // init Transform
        this.options = options || {};
        this.lastByte = false;
    }
    /**
     * Escapes dots
     */ _transform(chunk, encoding, done) {
        let buf;
        let lastPos = 0;
        for(let i = 0, len = chunk.length; i < len; i++){
            if (chunk[i] === 0x0a) {
                // \n
                if (i && chunk[i - 1] !== 0x0d || !i && this.lastByte !== 0x0d) {
                    if (i > lastPos) {
                        buf = chunk.slice(lastPos, i);
                        this.push(buf);
                    }
                    this.push(Buffer.from("\r\n"));
                    lastPos = i + 1;
                }
            }
        }
        if (lastPos && lastPos < chunk.length) {
            buf = chunk.slice(lastPos);
            this.push(buf);
        } else if (!lastPos) {
            this.push(chunk);
        }
        this.lastByte = chunk[chunk.length - 1];
        done();
    }
}
module.exports = LeWindows;


/***/ }),

/***/ 4098:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Mailer = __webpack_require__(882);
const shared = __webpack_require__(2122);
const SMTPPool = __webpack_require__(5567);
const SMTPTransport = __webpack_require__(4307);
const SendmailTransport = __webpack_require__(6994);
const StreamTransport = __webpack_require__(5606);
const JSONTransport = __webpack_require__(8312);
const SESTransport = __webpack_require__(1574);
const nmfetch = __webpack_require__(7199);
const packageData = __webpack_require__(3259);
const ETHEREAL_API = (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, "");
const ETHEREAL_WEB = (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, "");
const ETHEREAL_CACHE = [
    "true",
    "yes",
    "y",
    "1"
].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
let testAccount = false;
module.exports.createTransport = function(transporter, defaults) {
    let urlConfig;
    let options;
    let mailer;
    if (// provided transporter is a configuration object, not transporter plugin
    typeof transporter === "object" && typeof transporter.send !== "function" || // provided transporter looks like a connection url
    typeof transporter === "string" && /^(smtps?|direct):/i.test(transporter)) {
        if (urlConfig = typeof transporter === "string" ? transporter : transporter.url) {
            // parse a configuration URL into configuration options
            options = shared.parseConnectionUrl(urlConfig);
        } else {
            options = transporter;
        }
        if (options.pool) {
            transporter = new SMTPPool(options);
        } else if (options.sendmail) {
            transporter = new SendmailTransport(options);
        } else if (options.streamTransport) {
            transporter = new StreamTransport(options);
        } else if (options.jsonTransport) {
            transporter = new JSONTransport(options);
        } else if (options.SES) {
            transporter = new SESTransport(options);
        } else {
            transporter = new SMTPTransport(options);
        }
    }
    mailer = new Mailer(transporter, options, defaults);
    return mailer;
};
module.exports.createTestAccount = function(apiUrl, callback) {
    let promise;
    if (!callback && typeof apiUrl === "function") {
        callback = apiUrl;
        apiUrl = false;
    }
    if (!callback) {
        promise = new Promise((resolve, reject)=>{
            callback = shared.callbackPromise(resolve, reject);
        });
    }
    if (ETHEREAL_CACHE && testAccount) {
        setImmediate(()=>callback(null, testAccount));
        return promise;
    }
    apiUrl = apiUrl || ETHEREAL_API;
    let chunks = [];
    let chunklen = 0;
    let req = nmfetch(apiUrl + "/user", {
        contentType: "application/json",
        method: "POST",
        body: Buffer.from(JSON.stringify({
            requestor: packageData.name,
            version: packageData.version
        }))
    });
    req.on("readable", ()=>{
        let chunk;
        while((chunk = req.read()) !== null){
            chunks.push(chunk);
            chunklen += chunk.length;
        }
    });
    req.once("error", (err)=>callback(err));
    req.once("end", ()=>{
        let res = Buffer.concat(chunks, chunklen);
        let data;
        let err;
        try {
            data = JSON.parse(res.toString());
        } catch (E) {
            err = E;
        }
        if (err) {
            return callback(err);
        }
        if (data.status !== "success" || data.error) {
            return callback(new Error(data.error || "Request failed"));
        }
        delete data.status;
        testAccount = data;
        callback(null, testAccount);
    });
    return promise;
};
module.exports.getTestMessageUrl = function(info) {
    if (!info || !info.response) {
        return false;
    }
    let infoProps = new Map();
    info.response.replace(/\[([^\]]+)\]$/, (m, props)=>{
        props.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m, key, value)=>{
            infoProps.set(key, value);
        });
    });
    if (infoProps.has("STATUS") && infoProps.has("MSGID")) {
        return (testAccount.web || ETHEREAL_WEB) + "/message/" + infoProps.get("MSGID");
    }
    return false;
};


/***/ }),

/***/ 964:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Transform = (__webpack_require__(2781).Transform);
/**
 * Encodes a Buffer into a Quoted-Printable encoded string
 *
 * @param {Buffer} buffer Buffer to convert
 * @returns {String} Quoted-Printable encoded string
 */ function encode(buffer) {
    if (typeof buffer === "string") {
        buffer = Buffer.from(buffer, "utf-8");
    }
    // usable characters that do not need encoding
    let ranges = [
        // https://tools.ietf.org/html/rfc2045#section-6.7
        [
            0x09
        ],
        [
            0x0a
        ],
        [
            0x0d
        ],
        [
            0x20,
            0x3c
        ],
        [
            0x3e,
            0x7e
        ] // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
    ];
    let result = "";
    let ord;
    for(let i = 0, len = buffer.length; i < len; i++){
        ord = buffer[i];
        // if the char is in allowed range, then keep as is, unless it is a WS in the end of a line
        if (checkRanges(ord, ranges) && !((ord === 0x20 || ord === 0x09) && (i === len - 1 || buffer[i + 1] === 0x0a || buffer[i + 1] === 0x0d))) {
            result += String.fromCharCode(ord);
            continue;
        }
        result += "=" + (ord < 0x10 ? "0" : "") + ord.toString(16).toUpperCase();
    }
    return result;
}
/**
 * Adds soft line breaks to a Quoted-Printable string
 *
 * @param {String} str Quoted-Printable encoded string that might need line wrapping
 * @param {Number} [lineLength=76] Maximum allowed length for a line
 * @returns {String} Soft-wrapped Quoted-Printable encoded string
 */ function wrap(str, lineLength) {
    str = (str || "").toString();
    lineLength = lineLength || 76;
    if (str.length <= lineLength) {
        return str;
    }
    let pos = 0;
    let len = str.length;
    let match, code, line;
    let lineMargin = Math.floor(lineLength / 3);
    let result = "";
    // insert soft linebreaks where needed
    while(pos < len){
        line = str.substr(pos, lineLength);
        if (match = line.match(/\r\n/)) {
            line = line.substr(0, match.index + match[0].length);
            result += line;
            pos += line.length;
            continue;
        }
        if (line.substr(-1) === "\n") {
            // nothing to change here
            result += line;
            pos += line.length;
            continue;
        } else if (match = line.substr(-lineMargin).match(/\n.*?$/)) {
            // truncate to nearest line break
            line = line.substr(0, line.length - (match[0].length - 1));
            result += line;
            pos += line.length;
            continue;
        } else if (line.length > lineLength - lineMargin && (match = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/))) {
            // truncate to nearest space
            line = line.substr(0, line.length - (match[0].length - 1));
        } else if (line.match(/[=][\da-f]{0,2}$/i)) {
            // push incomplete encoding sequences to the next line
            if (match = line.match(/[=][\da-f]{0,1}$/i)) {
                line = line.substr(0, line.length - match[0].length);
            }
            // ensure that utf-8 sequences are not split
            while(line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match = line.match(/[=][\da-f]{2}$/gi))){
                code = parseInt(match[0].substr(1, 2), 16);
                if (code < 128) {
                    break;
                }
                line = line.substr(0, line.length - 3);
                if (code >= 0xc0) {
                    break;
                }
            }
        }
        if (pos + line.length < len && line.substr(-1) !== "\n") {
            if (line.length === lineLength && line.match(/[=][\da-f]{2}$/i)) {
                line = line.substr(0, line.length - 3);
            } else if (line.length === lineLength) {
                line = line.substr(0, line.length - 1);
            }
            pos += line.length;
            line += "=\r\n";
        } else {
            pos += line.length;
        }
        result += line;
    }
    return result;
}
/**
 * Helper function to check if a number is inside provided ranges
 *
 * @param {Number} nr Number to check for
 * @param {Array} ranges An Array of allowed values
 * @returns {Boolean} True if the value was found inside allowed ranges, false otherwise
 */ function checkRanges(nr, ranges) {
    for(let i = ranges.length - 1; i >= 0; i--){
        if (!ranges[i].length) {
            continue;
        }
        if (ranges[i].length === 1 && nr === ranges[i][0]) {
            return true;
        }
        if (ranges[i].length === 2 && nr >= ranges[i][0] && nr <= ranges[i][1]) {
            return true;
        }
    }
    return false;
}
/**
 * Creates a transform stream for encoding data to Quoted-Printable encoding
 *
 * @constructor
 * @param {Object} options Stream options
 * @param {Number} [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
 */ class Encoder extends Transform {
    constructor(options){
        super();
        // init Transform
        this.options = options || {};
        if (this.options.lineLength !== false) {
            this.options.lineLength = this.options.lineLength || 76;
        }
        this._curLine = "";
        this.inputBytes = 0;
        this.outputBytes = 0;
    }
    _transform(chunk, encoding, done) {
        let qp;
        if (encoding !== "buffer") {
            chunk = Buffer.from(chunk, encoding);
        }
        if (!chunk || !chunk.length) {
            return done();
        }
        this.inputBytes += chunk.length;
        if (this.options.lineLength) {
            qp = this._curLine + encode(chunk);
            qp = wrap(qp, this.options.lineLength);
            qp = qp.replace(/(^|\n)([^\n]*)$/, (match, lineBreak, lastLine)=>{
                this._curLine = lastLine;
                return lineBreak;
            });
            if (qp) {
                this.outputBytes += qp.length;
                this.push(qp);
            }
        } else {
            qp = encode(chunk);
            this.outputBytes += qp.length;
            this.push(qp, "ascii");
        }
        done();
    }
    _flush(done) {
        if (this._curLine) {
            this.outputBytes += this._curLine.length;
            this.push(this._curLine, "ascii");
        }
        done();
    }
}
// expose to the world
module.exports = {
    encode,
    wrap,
    Encoder
};


/***/ }),

/***/ 6994:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const spawn = (__webpack_require__(2081).spawn);
const packageData = __webpack_require__(3259);
const shared = __webpack_require__(2122);
/**
 * Generates a Transport object for Sendmail
 *
 * Possible options can be the following:
 *
 *  * **path** optional path to sendmail binary
 *  * **newline** either 'windows' or 'unix'
 *  * **args** an array of arguments for the sendmail binary
 *
 * @constructor
 * @param {Object} optional config parameter for Sendmail
 */ class SendmailTransport {
    constructor(options){
        options = options || {};
        // use a reference to spawn for mocking purposes
        this._spawn = spawn;
        this.options = options || {};
        this.name = "Sendmail";
        this.version = packageData.version;
        this.path = "sendmail";
        this.args = false;
        this.winbreak = false;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "sendmail"
        });
        if (options) {
            if (typeof options === "string") {
                this.path = options;
            } else if (typeof options === "object") {
                if (options.path) {
                    this.path = options.path;
                }
                if (Array.isArray(options.args)) {
                    this.args = options.args;
                }
                this.winbreak = [
                    "win",
                    "windows",
                    "dos",
                    "\r\n"
                ].includes((options.newline || "").toString().toLowerCase());
            }
        }
    }
    /**
     * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */ send(mail, done) {
        // Sendmail strips this header line by itself
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let args;
        let sendmail;
        let returned;
        const hasInvalidAddresses = [].concat(envelope.from || []).concat(envelope.to || []).some((addr)=>/^-/.test(addr));
        if (hasInvalidAddresses) {
            return done(new Error("Can not send mail. Invalid envelope addresses."));
        }
        if (this.args) {
            // force -i to keep single dots
            args = [
                "-i"
            ].concat(this.args).concat(envelope.to);
        } else {
            args = [
                "-i"
            ].concat(envelope.from ? [
                "-f",
                envelope.from
            ] : []).concat(envelope.to);
        }
        let callback = (err)=>{
            if (returned) {
                // ignore any additional responses, already done
                return;
            }
            returned = true;
            if (typeof done === "function") {
                if (err) {
                    return done(err);
                } else {
                    return done(null, {
                        envelope: mail.data.envelope || mail.message.getEnvelope(),
                        messageId,
                        response: "Messages queued for delivery"
                    });
                }
            }
        };
        try {
            sendmail = this._spawn(this.path, args);
        } catch (E) {
            this.logger.error({
                err: E,
                tnx: "spawn",
                messageId
            }, "Error occurred while spawning sendmail. %s", E.message);
            return callback(E);
        }
        if (sendmail) {
            sendmail.on("error", (err)=>{
                this.logger.error({
                    err,
                    tnx: "spawn",
                    messageId
                }, "Error occurred when sending message %s. %s", messageId, err.message);
                callback(err);
            });
            sendmail.once("exit", (code)=>{
                if (!code) {
                    return callback();
                }
                let err;
                if (code === 127) {
                    err = new Error("Sendmail command not found, process exited with code " + code);
                } else {
                    err = new Error("Sendmail exited with code " + code);
                }
                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error sending message %s to sendmail. %s", messageId, err.message);
                callback(err);
            });
            sendmail.once("close", callback);
            sendmail.stdin.on("error", (err)=>{
                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error occurred when piping message %s to sendmail. %s", messageId, err.message);
                callback(err);
            });
            let recipients = [].concat(envelope.to || []);
            if (recipients.length > 3) {
                recipients.push("...and " + recipients.splice(2).length + " more");
            }
            this.logger.info({
                tnx: "send",
                messageId
            }, "Sending message %s to <%s>", messageId, recipients.join(", "));
            let sourceStream = mail.message.createReadStream();
            sourceStream.once("error", (err)=>{
                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error occurred when generating message %s. %s", messageId, err.message);
                sendmail.kill("SIGINT"); // do not deliver the message
                callback(err);
            });
            sourceStream.pipe(sendmail.stdin);
        } else {
            return callback(new Error("sendmail was not found"));
        }
    }
}
module.exports = SendmailTransport;


/***/ }),

/***/ 1574:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const EventEmitter = __webpack_require__(2361);
const packageData = __webpack_require__(3259);
const shared = __webpack_require__(2122);
const LeWindows = __webpack_require__(7547);
/**
 * Generates a Transport object for AWS SES
 *
 * Possible options can be the following:
 *
 *  * **sendingRate** optional Number specifying how many messages per second should be delivered to SES
 *  * **maxConnections** optional Number specifying max number of parallel connections to SES
 *
 * @constructor
 * @param {Object} optional config parameter
 */ class SESTransport extends EventEmitter {
    constructor(options){
        super();
        options = options || {};
        this.options = options || {};
        this.ses = this.options.SES;
        this.name = "SESTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "ses-transport"
        });
        // parallel sending connections
        this.maxConnections = Number(this.options.maxConnections) || Infinity;
        this.connections = 0;
        // max messages per second
        this.sendingRate = Number(this.options.sendingRate) || Infinity;
        this.sendingRateTTL = null;
        this.rateInterval = 1000; // milliseconds
        this.rateMessages = [];
        this.pending = [];
        this.idling = true;
        setImmediate(()=>{
            if (this.idling) {
                this.emit("idle");
            }
        });
    }
    /**
     * Schedules a sending of a message
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */ send(mail, callback) {
        if (this.connections >= this.maxConnections) {
            this.idling = false;
            return this.pending.push({
                mail,
                callback
            });
        }
        if (!this._checkSendingRate()) {
            this.idling = false;
            return this.pending.push({
                mail,
                callback
            });
        }
        this._send(mail, (...args)=>{
            setImmediate(()=>callback(...args));
            this._sent();
        });
    }
    _checkRatedQueue() {
        if (this.connections >= this.maxConnections || !this._checkSendingRate()) {
            return;
        }
        if (!this.pending.length) {
            if (!this.idling) {
                this.idling = true;
                this.emit("idle");
            }
            return;
        }
        let next = this.pending.shift();
        this._send(next.mail, (...args)=>{
            setImmediate(()=>next.callback(...args));
            this._sent();
        });
    }
    _checkSendingRate() {
        clearTimeout(this.sendingRateTTL);
        let now = Date.now();
        let oldest = false;
        // delete older messages
        for(let i = this.rateMessages.length - 1; i >= 0; i--){
            if (this.rateMessages[i].ts >= now - this.rateInterval && (!oldest || this.rateMessages[i].ts < oldest)) {
                oldest = this.rateMessages[i].ts;
            }
            if (this.rateMessages[i].ts < now - this.rateInterval && !this.rateMessages[i].pending) {
                this.rateMessages.splice(i, 1);
            }
        }
        if (this.rateMessages.length < this.sendingRate) {
            return true;
        }
        let delay = Math.max(oldest + 1001, now + 20);
        this.sendingRateTTL = setTimeout(()=>this._checkRatedQueue(), now - delay);
        try {
            this.sendingRateTTL.unref();
        } catch (E) {
        // Ignore. Happens on envs with non-node timer implementation
        }
        return false;
    }
    _sent() {
        this.connections--;
        this._checkRatedQueue();
    }
    /**
     * Returns true if there are free slots in the queue
     */ isIdle() {
        return this.idling;
    }
    /**
     * Compiles a mailcomposer message and forwards it to SES
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */ _send(mail, callback) {
        let statObject = {
            ts: Date.now(),
            pending: true
        };
        this.connections++;
        this.rateMessages.push(statObject);
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
            recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info({
            tnx: "send",
            messageId
        }, "Sending message %s to <%s>", messageId, recipients.join(", "));
        let getRawMessage = (next)=>{
            // do not use Message-ID and Date in DKIM signature
            if (!mail.data._dkim) {
                mail.data._dkim = {};
            }
            if (mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields === "string") {
                mail.data._dkim.skipFields += ":date:message-id";
            } else {
                mail.data._dkim.skipFields = "date:message-id";
            }
            let sourceStream = mail.message.createReadStream();
            let stream = sourceStream.pipe(new LeWindows());
            let chunks = [];
            let chunklen = 0;
            stream.on("readable", ()=>{
                let chunk;
                while((chunk = stream.read()) !== null){
                    chunks.push(chunk);
                    chunklen += chunk.length;
                }
            });
            sourceStream.once("error", (err)=>stream.emit("error", err));
            stream.once("error", (err)=>{
                next(err);
            });
            stream.once("end", ()=>next(null, Buffer.concat(chunks, chunklen)));
        };
        setImmediate(()=>getRawMessage((err, raw)=>{
                if (err) {
                    this.logger.error({
                        err,
                        tnx: "send",
                        messageId
                    }, "Failed creating message for %s. %s", messageId, err.message);
                    statObject.pending = false;
                    return callback(err);
                }
                let sesMessage = {
                    RawMessage: {
                        // required
                        Data: raw // required
                    },
                    Source: envelope.from,
                    Destinations: envelope.to
                };
                Object.keys(mail.data.ses || {}).forEach((key)=>{
                    sesMessage[key] = mail.data.ses[key];
                });
                let ses = (this.ses.aws ? this.ses.ses : this.ses) || {};
                let aws = this.ses.aws || {};
                let getRegion = (cb)=>{
                    if (ses.config && typeof ses.config.region === "function") {
                        // promise
                        return ses.config.region().then((region)=>cb(null, region)).catch((err)=>cb(err));
                    }
                    return cb(null, ses.config && ses.config.region || "us-east-1");
                };
                getRegion((err, region)=>{
                    if (err || !region) {
                        region = "us-east-1";
                    }
                    let sendPromise;
                    if (typeof ses.send === "function" && aws.SendRawEmailCommand) {
                        // v3 API
                        sendPromise = ses.send(new aws.SendRawEmailCommand(sesMessage));
                    } else {
                        // v2 API
                        sendPromise = ses.sendRawEmail(sesMessage).promise();
                    }
                    sendPromise.then((data)=>{
                        if (region === "us-east-1") {
                            region = "email";
                        }
                        statObject.pending = false;
                        callback(null, {
                            envelope: {
                                from: envelope.from,
                                to: envelope.to
                            },
                            messageId: "<" + data.MessageId + (!/@/.test(data.MessageId) ? "@" + region + ".amazonses.com" : "") + ">",
                            response: data.MessageId,
                            raw
                        });
                    }).catch((err)=>{
                        this.logger.error({
                            err,
                            tnx: "send"
                        }, "Send error for %s: %s", messageId, err.message);
                        statObject.pending = false;
                        callback(err);
                    });
                });
            }));
    }
    /**
     * Verifies SES configuration
     *
     * @param {Function} callback Callback function
     */ verify(callback) {
        let promise;
        let ses = (this.ses.aws ? this.ses.ses : this.ses) || {};
        let aws = this.ses.aws || {};
        const sesMessage = {
            RawMessage: {
                // required
                Data: "From: invalid@invalid\r\nTo: invalid@invalid\r\n Subject: Invalid\r\n\r\nInvalid"
            },
            Source: "invalid@invalid",
            Destinations: [
                "invalid@invalid"
            ]
        };
        if (!callback) {
            promise = new Promise((resolve, reject)=>{
                callback = shared.callbackPromise(resolve, reject);
            });
        }
        const cb = (err)=>{
            if (err && (err.code || err.Code) !== "InvalidParameterValue") {
                return callback(err);
            }
            return callback(null, true);
        };
        if (typeof ses.send === "function" && aws.SendRawEmailCommand) {
            // v3 API
            sesMessage.RawMessage.Data = Buffer.from(sesMessage.RawMessage.Data);
            ses.send(new aws.SendRawEmailCommand(sesMessage), cb);
        } else {
            // v2 API
            ses.sendRawEmail(sesMessage, cb);
        }
        return promise;
    }
}
module.exports = SESTransport;


/***/ }),

/***/ 2122:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* eslint no-console: 0 */ 
const urllib = __webpack_require__(7310);
const util = __webpack_require__(3837);
const fs = __webpack_require__(7147);
const nmfetch = __webpack_require__(7199);
const dns = __webpack_require__(9523);
const net = __webpack_require__(1808);
const os = __webpack_require__(2037);
const DNS_TTL = 5 * 60 * 1000;
let networkInterfaces;
try {
    networkInterfaces = os.networkInterfaces();
} catch (err) {
// fails on some systems
}
module.exports.networkInterfaces = networkInterfaces;
const isFamilySupported = (family, allowInternal)=>{
    let networkInterfaces = module.exports.networkInterfaces;
    if (!networkInterfaces) {
        // hope for the best
        return true;
    }
    const familySupported = // crux that replaces Object.values(networkInterfaces) as Object.values is not supported in nodejs v6
    Object.keys(networkInterfaces).map((key)=>networkInterfaces[key])// crux that replaces .flat() as it is not supported in older Node versions (v10 and older)
    .reduce((acc, val)=>acc.concat(val), []).filter((i)=>!i.internal || allowInternal).filter((i)=>i.family === "IPv" + family || i.family === family).length > 0;
    return familySupported;
};
const resolver = (family, hostname, options, callback)=>{
    options = options || {};
    const familySupported = isFamilySupported(family, options.allowInternalNetworkInterfaces);
    if (!familySupported) {
        return callback(null, []);
    }
    const resolver = dns.Resolver ? new dns.Resolver(options) : dns;
    resolver["resolve" + family](hostname, (err, addresses)=>{
        if (err) {
            switch(err.code){
                case dns.NODATA:
                case dns.NOTFOUND:
                case dns.NOTIMP:
                case dns.SERVFAIL:
                case dns.CONNREFUSED:
                case dns.REFUSED:
                case "EAI_AGAIN":
                    return callback(null, []);
            }
            return callback(err);
        }
        return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
    });
};
const dnsCache = module.exports.dnsCache = new Map();
const formatDNSValue = (value, extra)=>{
    if (!value) {
        return Object.assign({}, extra || {});
    }
    return Object.assign({
        servername: value.servername,
        host: !value.addresses || !value.addresses.length ? null : value.addresses.length === 1 ? value.addresses[0] : value.addresses[Math.floor(Math.random() * value.addresses.length)]
    }, extra || {});
};
module.exports.resolveHostname = (options, callback)=>{
    options = options || {};
    if (!options.host && options.servername) {
        options.host = options.servername;
    }
    if (!options.host || net.isIP(options.host)) {
        // nothing to do here
        let value = {
            addresses: [
                options.host
            ],
            servername: options.servername || false
        };
        return callback(null, formatDNSValue(value, {
            cached: false
        }));
    }
    let cached;
    if (dnsCache.has(options.host)) {
        cached = dnsCache.get(options.host);
        if (!cached.expires || cached.expires >= Date.now()) {
            return callback(null, formatDNSValue(cached.value, {
                cached: true
            }));
        }
    }
    resolver(4, options.host, options, (err, addresses)=>{
        if (err) {
            if (cached) {
                // ignore error, use expired value
                return callback(null, formatDNSValue(cached.value, {
                    cached: true,
                    error: err
                }));
            }
            return callback(err);
        }
        if (addresses && addresses.length) {
            let value = {
                addresses,
                servername: options.servername || options.host
            };
            dnsCache.set(options.host, {
                value,
                expires: Date.now() + (options.dnsTtl || DNS_TTL)
            });
            return callback(null, formatDNSValue(value, {
                cached: false
            }));
        }
        resolver(6, options.host, options, (err, addresses)=>{
            if (err) {
                if (cached) {
                    // ignore error, use expired value
                    return callback(null, formatDNSValue(cached.value, {
                        cached: true,
                        error: err
                    }));
                }
                return callback(err);
            }
            if (addresses && addresses.length) {
                let value = {
                    addresses,
                    servername: options.servername || options.host
                };
                dnsCache.set(options.host, {
                    value,
                    expires: Date.now() + (options.dnsTtl || DNS_TTL)
                });
                return callback(null, formatDNSValue(value, {
                    cached: false
                }));
            }
            try {
                dns.lookup(options.host, {
                    all: true
                }, (err, addresses)=>{
                    if (err) {
                        if (cached) {
                            // ignore error, use expired value
                            return callback(null, formatDNSValue(cached.value, {
                                cached: true,
                                error: err
                            }));
                        }
                        return callback(err);
                    }
                    let address = addresses ? addresses.filter((addr)=>isFamilySupported(addr.family)).map((addr)=>addr.address).shift() : false;
                    if (addresses && addresses.length && !address) {
                        // there are addresses but none can be used
                        console.warn(`Failed to resolve IPv${addresses[0].family} addresses with current network`);
                    }
                    if (!address && cached) {
                        // nothing was found, fallback to cached value
                        return callback(null, formatDNSValue(cached.value, {
                            cached: true
                        }));
                    }
                    let value = {
                        addresses: address ? [
                            address
                        ] : [
                            options.host
                        ],
                        servername: options.servername || options.host
                    };
                    dnsCache.set(options.host, {
                        value,
                        expires: Date.now() + (options.dnsTtl || DNS_TTL)
                    });
                    return callback(null, formatDNSValue(value, {
                        cached: false
                    }));
                });
            } catch (err) {
                if (cached) {
                    // ignore error, use expired value
                    return callback(null, formatDNSValue(cached.value, {
                        cached: true,
                        error: err
                    }));
                }
                return callback(err);
            }
        });
    });
};
/**
 * Parses connection url to a structured configuration object
 *
 * @param {String} str Connection url
 * @return {Object} Configuration object
 */ module.exports.parseConnectionUrl = (str)=>{
    str = str || "";
    let options = {};
    [
        urllib.parse(str, true)
    ].forEach((url)=>{
        let auth;
        switch(url.protocol){
            case "smtp:":
                options.secure = false;
                break;
            case "smtps:":
                options.secure = true;
                break;
            case "direct:":
                options.direct = true;
                break;
        }
        if (!isNaN(url.port) && Number(url.port)) {
            options.port = Number(url.port);
        }
        if (url.hostname) {
            options.host = url.hostname;
        }
        if (url.auth) {
            auth = url.auth.split(":");
            if (!options.auth) {
                options.auth = {};
            }
            options.auth.user = auth.shift();
            options.auth.pass = auth.join(":");
        }
        Object.keys(url.query || {}).forEach((key)=>{
            let obj = options;
            let lKey = key;
            let value = url.query[key];
            if (!isNaN(value)) {
                value = Number(value);
            }
            switch(value){
                case "true":
                    value = true;
                    break;
                case "false":
                    value = false;
                    break;
            }
            // tls is nested object
            if (key.indexOf("tls.") === 0) {
                lKey = key.substr(4);
                if (!options.tls) {
                    options.tls = {};
                }
                obj = options.tls;
            } else if (key.indexOf(".") >= 0) {
                // ignore nested properties besides tls
                return;
            }
            if (!(lKey in obj)) {
                obj[lKey] = value;
            }
        });
    });
    return options;
};
module.exports._logFunc = (logger, level, defaults, data, message, ...args)=>{
    let entry = {};
    Object.keys(defaults || {}).forEach((key)=>{
        if (key !== "level") {
            entry[key] = defaults[key];
        }
    });
    Object.keys(data || {}).forEach((key)=>{
        if (key !== "level") {
            entry[key] = data[key];
        }
    });
    logger[level](entry, message, ...args);
};
/**
 * Returns a bunyan-compatible logger interface. Uses either provided logger or
 * creates a default console logger
 *
 * @param {Object} [options] Options object that might include 'logger' value
 * @return {Object} bunyan compatible logger
 */ module.exports.getLogger = (options, defaults)=>{
    options = options || {};
    let response = {};
    let levels = [
        "trace",
        "debug",
        "info",
        "warn",
        "error",
        "fatal"
    ];
    if (!options.logger) {
        // use vanity logger
        levels.forEach((level)=>{
            response[level] = ()=>false;
        });
        return response;
    }
    let logger = options.logger;
    if (options.logger === true) {
        // create console logger
        logger = createDefaultLogger(levels);
    }
    levels.forEach((level)=>{
        response[level] = (data, message, ...args)=>{
            module.exports._logFunc(logger, level, defaults, data, message, ...args);
        };
    });
    return response;
};
/**
 * Wrapper for creating a callback that either resolves or rejects a promise
 * based on input
 *
 * @param {Function} resolve Function to run if callback is called
 * @param {Function} reject Function to run if callback ends with an error
 */ module.exports.callbackPromise = (resolve, reject)=>function() {
        let args = Array.from(arguments);
        let err = args.shift();
        if (err) {
            reject(err);
        } else {
            resolve(...args);
        }
    };
/**
 * Resolves a String or a Buffer value for content value. Useful if the value
 * is a Stream or a file or an URL. If the value is a Stream, overwrites
 * the stream object with the resolved value (you can't stream a value twice).
 *
 * This is useful when you want to create a plugin that needs a content value,
 * for example the `html` or `text` value as a String or a Buffer but not as
 * a file path or an URL.
 *
 * @param {Object} data An object or an Array you want to resolve an element for
 * @param {String|Number} key Property name or an Array index
 * @param {Function} callback Callback function with (err, value)
 */ module.exports.resolveContent = (data, key, callback)=>{
    let promise;
    if (!callback) {
        promise = new Promise((resolve, reject)=>{
            callback = module.exports.callbackPromise(resolve, reject);
        });
    }
    let content = data && data[key] && data[key].content || data[key];
    let contentStream;
    let encoding = (typeof data[key] === "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
    if (!content) {
        return callback(null, content);
    }
    if (typeof content === "object") {
        if (typeof content.pipe === "function") {
            return resolveStream(content, (err, value)=>{
                if (err) {
                    return callback(err);
                }
                // we can't stream twice the same content, so we need
                // to replace the stream object with the streaming result
                if (data[key].content) {
                    data[key].content = value;
                } else {
                    data[key] = value;
                }
                callback(null, value);
            });
        } else if (/^https?:\/\//i.test(content.path || content.href)) {
            contentStream = nmfetch(content.path || content.href);
            return resolveStream(contentStream, callback);
        } else if (/^data:/i.test(content.path || content.href)) {
            let parts = (content.path || content.href).match(/^data:((?:[^;]*;)*(?:[^,]*)),(.*)$/i);
            if (!parts) {
                return callback(null, Buffer.from(0));
            }
            return callback(null, /\bbase64$/i.test(parts[1]) ? Buffer.from(parts[2], "base64") : Buffer.from(decodeURIComponent(parts[2])));
        } else if (content.path) {
            return resolveStream(fs.createReadStream(content.path), callback);
        }
    }
    if (typeof data[key].content === "string" && ![
        "utf8",
        "usascii",
        "ascii"
    ].includes(encoding)) {
        content = Buffer.from(data[key].content, encoding);
    }
    // default action, return as is
    setImmediate(()=>callback(null, content));
    return promise;
};
/**
 * Copies properties from source objects to target objects
 */ module.exports.assign = function() {
    let args = Array.from(arguments);
    let target = args.shift() || {};
    args.forEach((source)=>{
        Object.keys(source || {}).forEach((key)=>{
            if ([
                "tls",
                "auth"
            ].includes(key) && source[key] && typeof source[key] === "object") {
                // tls and auth are special keys that need to be enumerated separately
                // other objects are passed as is
                if (!target[key]) {
                    // ensure that target has this key
                    target[key] = {};
                }
                Object.keys(source[key]).forEach((subKey)=>{
                    target[key][subKey] = source[key][subKey];
                });
            } else {
                target[key] = source[key];
            }
        });
    });
    return target;
};
module.exports.encodeXText = (str)=>{
    // ! 0x21
    // + 0x2B
    // = 0x3D
    // ~ 0x7E
    if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str)) {
        return str;
    }
    let buf = Buffer.from(str);
    let result = "";
    for(let i = 0, len = buf.length; i < len; i++){
        let c = buf[i];
        if (c < 0x21 || c > 0x7e || c === 0x2b || c === 0x3d) {
            result += "+" + (c < 0x10 ? "0" : "") + c.toString(16).toUpperCase();
        } else {
            result += String.fromCharCode(c);
        }
    }
    return result;
};
/**
 * Streams a stream value into a Buffer
 *
 * @param {Object} stream Readable stream
 * @param {Function} callback Callback function with (err, value)
 */ function resolveStream(stream, callback) {
    let responded = false;
    let chunks = [];
    let chunklen = 0;
    stream.on("error", (err)=>{
        if (responded) {
            return;
        }
        responded = true;
        callback(err);
    });
    stream.on("readable", ()=>{
        let chunk;
        while((chunk = stream.read()) !== null){
            chunks.push(chunk);
            chunklen += chunk.length;
        }
    });
    stream.on("end", ()=>{
        if (responded) {
            return;
        }
        responded = true;
        let value;
        try {
            value = Buffer.concat(chunks, chunklen);
        } catch (E) {
            return callback(E);
        }
        callback(null, value);
    });
}
/**
 * Generates a bunyan-like logger that prints to console
 *
 * @returns {Object} Bunyan logger instance
 */ function createDefaultLogger(levels) {
    let levelMaxLen = 0;
    let levelNames = new Map();
    levels.forEach((level)=>{
        if (level.length > levelMaxLen) {
            levelMaxLen = level.length;
        }
    });
    levels.forEach((level)=>{
        let levelName = level.toUpperCase();
        if (levelName.length < levelMaxLen) {
            levelName += " ".repeat(levelMaxLen - levelName.length);
        }
        levelNames.set(level, levelName);
    });
    let print = (level, entry, message, ...args)=>{
        let prefix = "";
        if (entry) {
            if (entry.tnx === "server") {
                prefix = "S: ";
            } else if (entry.tnx === "client") {
                prefix = "C: ";
            }
            if (entry.sid) {
                prefix = "[" + entry.sid + "] " + prefix;
            }
            if (entry.cid) {
                prefix = "[#" + entry.cid + "] " + prefix;
            }
        }
        message = util.format(message, ...args);
        message.split(/\r?\n/).forEach((line)=>{
            console.log("[%s] %s %s", new Date().toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
        });
    };
    let logger = {};
    levels.forEach((level)=>{
        logger[level] = print.bind(null, level);
    });
    return logger;
}


/***/ }),

/***/ 9042:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const stream = __webpack_require__(2781);
const Transform = stream.Transform;
/**
 * Escapes dots in the beginning of lines. Ends the stream with <CR><LF>.<CR><LF>
 * Also makes sure that only <CR><LF> sequences are used for linebreaks
 *
 * @param {Object} options Stream options
 */ class DataStream extends Transform {
    constructor(options){
        super(options);
        // init Transform
        this.options = options || {};
        this._curLine = "";
        this.inByteCount = 0;
        this.outByteCount = 0;
        this.lastByte = false;
    }
    /**
     * Escapes dots
     */ _transform(chunk, encoding, done) {
        let chunks = [];
        let chunklen = 0;
        let i, len, lastPos = 0;
        let buf;
        if (!chunk || !chunk.length) {
            return done();
        }
        if (typeof chunk === "string") {
            chunk = Buffer.from(chunk);
        }
        this.inByteCount += chunk.length;
        for(i = 0, len = chunk.length; i < len; i++){
            if (chunk[i] === 0x2e) {
                // .
                if (i && chunk[i - 1] === 0x0a || !i && (!this.lastByte || this.lastByte === 0x0a)) {
                    buf = chunk.slice(lastPos, i + 1);
                    chunks.push(buf);
                    chunks.push(Buffer.from("."));
                    chunklen += buf.length + 1;
                    lastPos = i + 1;
                }
            } else if (chunk[i] === 0x0a) {
                // .
                if (i && chunk[i - 1] !== 0x0d || !i && this.lastByte !== 0x0d) {
                    if (i > lastPos) {
                        buf = chunk.slice(lastPos, i);
                        chunks.push(buf);
                        chunklen += buf.length + 2;
                    } else {
                        chunklen += 2;
                    }
                    chunks.push(Buffer.from("\r\n"));
                    lastPos = i + 1;
                }
            }
        }
        if (chunklen) {
            // add last piece
            if (lastPos < chunk.length) {
                buf = chunk.slice(lastPos);
                chunks.push(buf);
                chunklen += buf.length;
            }
            this.outByteCount += chunklen;
            this.push(Buffer.concat(chunks, chunklen));
        } else {
            this.outByteCount += chunk.length;
            this.push(chunk);
        }
        this.lastByte = chunk[chunk.length - 1];
        done();
    }
    /**
     * Finalizes the stream with a dot on a single line
     */ _flush(done) {
        let buf;
        if (this.lastByte === 0x0a) {
            buf = Buffer.from(".\r\n");
        } else if (this.lastByte === 0x0d) {
            buf = Buffer.from("\n.\r\n");
        } else {
            buf = Buffer.from("\r\n.\r\n");
        }
        this.outByteCount += buf.length;
        this.push(buf);
        done();
    }
}
module.exports = DataStream;


/***/ }),

/***/ 3402:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

/**
 * Minimal HTTP/S proxy client
 */ const net = __webpack_require__(1808);
const tls = __webpack_require__(4404);
const urllib = __webpack_require__(7310);
/**
 * Establishes proxied connection to destinationPort
 *
 * httpProxyClient("http://localhost:3128/", 80, "google.com", function(err, socket){
 *     socket.write("GET / HTTP/1.0\r\n\r\n");
 * });
 *
 * @param {String} proxyUrl proxy configuration, etg "http://proxy.host:3128/"
 * @param {Number} destinationPort Port to open in destination host
 * @param {String} destinationHost Destination hostname
 * @param {Function} callback Callback to run with the rocket object once connection is established
 */ function httpProxyClient(proxyUrl, destinationPort, destinationHost, callback) {
    let proxy = urllib.parse(proxyUrl);
    // create a socket connection to the proxy server
    let options;
    let connect;
    let socket;
    options = {
        host: proxy.hostname,
        port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
    };
    if (proxy.protocol === "https:") {
        // we can use untrusted proxies as long as we verify actual SMTP certificates
        options.rejectUnauthorized = false;
        connect = tls.connect.bind(tls);
    } else {
        connect = net.connect.bind(net);
    }
    // Error harness for initial connection. Once connection is established, the responsibility
    // to handle errors is passed to whoever uses this socket
    let finished = false;
    let tempSocketErr = (err)=>{
        if (finished) {
            return;
        }
        finished = true;
        try {
            socket.destroy();
        } catch (E) {
        // ignore
        }
        callback(err);
    };
    let timeoutErr = ()=>{
        let err = new Error("Proxy socket timed out");
        err.code = "ETIMEDOUT";
        tempSocketErr(err);
    };
    socket = connect(options, ()=>{
        if (finished) {
            return;
        }
        let reqHeaders = {
            Host: destinationHost + ":" + destinationPort,
            Connection: "close"
        };
        if (proxy.auth) {
            reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
        }
        socket.write(// HTTP method
        "CONNECT " + destinationHost + ":" + destinationPort + " HTTP/1.1\r\n" + // HTTP request headers
        Object.keys(reqHeaders).map((key)=>key + ": " + reqHeaders[key]).join("\r\n") + // End request
        "\r\n\r\n");
        let headers = "";
        let onSocketData = (chunk)=>{
            let match;
            let remainder;
            if (finished) {
                return;
            }
            headers += chunk.toString("binary");
            if (match = headers.match(/\r\n\r\n/)) {
                socket.removeListener("data", onSocketData);
                remainder = headers.substr(match.index + match[0].length);
                headers = headers.substr(0, match.index);
                if (remainder) {
                    socket.unshift(Buffer.from(remainder, "binary"));
                }
                // proxy connection is now established
                finished = true;
                // check response code
                match = headers.match(/^HTTP\/\d+\.\d+ (\d+)/i);
                if (!match || (match[1] || "").charAt(0) !== "2") {
                    try {
                        socket.destroy();
                    } catch (E) {
                    // ignore
                    }
                    return callback(new Error("Invalid response from proxy" + (match && ": " + match[1] || "")));
                }
                socket.removeListener("error", tempSocketErr);
                socket.removeListener("timeout", timeoutErr);
                socket.setTimeout(0);
                return callback(null, socket);
            }
        };
        socket.on("data", onSocketData);
    });
    socket.setTimeout(httpProxyClient.timeout || 30 * 1000);
    socket.on("timeout", timeoutErr);
    socket.once("error", tempSocketErr);
}
module.exports = httpProxyClient;


/***/ }),

/***/ 7753:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const packageInfo = __webpack_require__(3259);
const EventEmitter = (__webpack_require__(2361).EventEmitter);
const net = __webpack_require__(1808);
const tls = __webpack_require__(4404);
const os = __webpack_require__(2037);
const crypto = __webpack_require__(6113);
const DataStream = __webpack_require__(9042);
const PassThrough = (__webpack_require__(2781).PassThrough);
const shared = __webpack_require__(2122);
// default timeout values in ms
const CONNECTION_TIMEOUT = 2 * 60 * 1000; // how much to wait for the connection to be established
const SOCKET_TIMEOUT = 10 * 60 * 1000; // how much to wait for socket inactivity before disconnecting the client
const GREETING_TIMEOUT = 30 * 1000; // how much to wait after connection is established but SMTP greeting is not receieved
const DNS_TIMEOUT = 30 * 1000; // how much to wait for resolveHostname
/**
 * Generates a SMTP connection object
 *
 * Optional options object takes the following possible properties:
 *
 *  * **port** - is the port to connect to (defaults to 587 or 465)
 *  * **host** - is the hostname or IP address to connect to (defaults to 'localhost')
 *  * **secure** - use SSL
 *  * **ignoreTLS** - ignore server support for STARTTLS
 *  * **requireTLS** - forces the client to use STARTTLS
 *  * **name** - the name of the client server
 *  * **localAddress** - outbound address to bind to (see: http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener)
 *  * **greetingTimeout** - Time to wait in ms until greeting message is received from the server (defaults to 10000)
 *  * **connectionTimeout** - how many milliseconds to wait for the connection to establish
 *  * **socketTimeout** - Time of inactivity until the connection is closed (defaults to 1 hour)
 *  * **dnsTimeout** - Time to wait in ms for the DNS requests to be resolved (defaults to 30 seconds)
 *  * **lmtp** - if true, uses LMTP instead of SMTP protocol
 *  * **logger** - bunyan compatible logger interface
 *  * **debug** - if true pass SMTP traffic to the logger
 *  * **tls** - options for createCredentials
 *  * **socket** - existing socket to use instead of creating a new one (see: http://nodejs.org/api/net.html#net_class_net_socket)
 *  * **secured** - boolean indicates that the provided socket has already been upgraded to tls
 *
 * @constructor
 * @namespace SMTP Client module
 * @param {Object} [options] Option properties
 */ class SMTPConnection extends EventEmitter {
    constructor(options){
        super(options);
        this.id = crypto.randomBytes(8).toString("base64").replace(/\W/g, "");
        this.stage = "init";
        this.options = options || {};
        this.secureConnection = !!this.options.secure;
        this.alreadySecured = !!this.options.secured;
        this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587);
        this.host = this.options.host || "localhost";
        this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || false;
        if (typeof this.options.secure === "undefined" && this.port === 465) {
            // if secure option is not set but port is 465, then default to secure
            this.secureConnection = true;
        }
        this.name = this.options.name || this._getHostname();
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "smtp-connection",
            sid: this.id
        });
        this.customAuth = new Map();
        Object.keys(this.options.customAuth || {}).forEach((key)=>{
            let mapKey = (key || "").toString().trim().toUpperCase();
            if (!mapKey) {
                return;
            }
            this.customAuth.set(mapKey, this.options.customAuth[key]);
        });
        /**
         * Expose version nr, just for the reference
         * @type {String}
         */ this.version = packageInfo.version;
        /**
         * If true, then the user is authenticated
         * @type {Boolean}
         */ this.authenticated = false;
        /**
         * If set to true, this instance is no longer active
         * @private
         */ this.destroyed = false;
        /**
         * Defines if the current connection is secure or not. If not,
         * STARTTLS can be used if available
         * @private
         */ this.secure = !!this.secureConnection;
        /**
         * Store incomplete messages coming from the server
         * @private
         */ this._remainder = "";
        /**
         * Unprocessed responses from the server
         * @type {Array}
         */ this._responseQueue = [];
        this.lastServerResponse = false;
        /**
         * The socket connecting to the server
         * @publick
         */ this._socket = false;
        /**
         * Lists supported auth mechanisms
         * @private
         */ this._supportedAuth = [];
        /**
         * Set to true, if EHLO response includes "AUTH".
         * If false then authentication is not tried
         */ this.allowsAuth = false;
        /**
         * Includes current envelope (from, to)
         * @private
         */ this._envelope = false;
        /**
         * Lists supported extensions
         * @private
         */ this._supportedExtensions = [];
        /**
         * Defines the maximum allowed size for a single message
         * @private
         */ this._maxAllowedSize = 0;
        /**
         * Function queue to run if a data chunk comes from the server
         * @private
         */ this._responseActions = [];
        this._recipientQueue = [];
        /**
         * Timeout variable for waiting the greeting
         * @private
         */ this._greetingTimeout = false;
        /**
         * Timeout variable for waiting the connection to start
         * @private
         */ this._connectionTimeout = false;
        /**
         * If the socket is deemed already closed
         * @private
         */ this._destroyed = false;
        /**
         * If the socket is already being closed
         * @private
         */ this._closing = false;
        /**
         * Callbacks for socket's listeners
         */ this._onSocketData = (chunk)=>this._onData(chunk);
        this._onSocketError = (error)=>this._onError(error, "ESOCKET", false, "CONN");
        this._onSocketClose = ()=>this._onClose();
        this._onSocketEnd = ()=>this._onEnd();
        this._onSocketTimeout = ()=>this._onTimeout();
    }
    /**
     * Creates a connection to a SMTP server and sets up connection
     * listener
     */ connect(connectCallback) {
        if (typeof connectCallback === "function") {
            this.once("connect", ()=>{
                this.logger.debug({
                    tnx: "smtp"
                }, "SMTP handshake finished");
                connectCallback();
            });
            const isDestroyedMessage = this._isDestroyedMessage("connect");
            if (isDestroyedMessage) {
                return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "CONN"));
            }
        }
        let opts = {
            port: this.port,
            host: this.host,
            allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
            timeout: this.options.dnsTimeout || DNS_TIMEOUT
        };
        if (this.options.localAddress) {
            opts.localAddress = this.options.localAddress;
        }
        let setupConnectionHandlers = ()=>{
            this._connectionTimeout = setTimeout(()=>{
                this._onError("Connection timeout", "ETIMEDOUT", false, "CONN");
            }, this.options.connectionTimeout || CONNECTION_TIMEOUT);
            this._socket.on("error", this._onSocketError);
        };
        if (this.options.connection) {
            // connection is already opened
            this._socket = this.options.connection;
            if (this.secureConnection && !this.alreadySecured) {
                setImmediate(()=>this._upgradeConnection((err)=>{
                        if (err) {
                            this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
                            return;
                        }
                        this._onConnect();
                    }));
            } else {
                setImmediate(()=>this._onConnect());
            }
            return;
        } else if (this.options.socket) {
            // socket object is set up but not yet connected
            this._socket = this.options.socket;
            return shared.resolveHostname(opts, (err, resolved)=>{
                if (err) {
                    return setImmediate(()=>this._onError(err, "EDNS", false, "CONN"));
                }
                this.logger.debug({
                    tnx: "dns",
                    source: opts.host,
                    resolved: resolved.host,
                    cached: !!resolved.cached
                }, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
                Object.keys(resolved).forEach((key)=>{
                    if (key.charAt(0) !== "_" && resolved[key]) {
                        opts[key] = resolved[key];
                    }
                });
                try {
                    this._socket.connect(this.port, this.host, ()=>{
                        this._socket.setKeepAlive(true);
                        this._onConnect();
                    });
                    setupConnectionHandlers();
                } catch (E) {
                    return setImmediate(()=>this._onError(E, "ECONNECTION", false, "CONN"));
                }
            });
        } else if (this.secureConnection) {
            // connect using tls
            if (this.options.tls) {
                Object.keys(this.options.tls).forEach((key)=>{
                    opts[key] = this.options.tls[key];
                });
            }
            return shared.resolveHostname(opts, (err, resolved)=>{
                if (err) {
                    return setImmediate(()=>this._onError(err, "EDNS", false, "CONN"));
                }
                this.logger.debug({
                    tnx: "dns",
                    source: opts.host,
                    resolved: resolved.host,
                    cached: !!resolved.cached
                }, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
                Object.keys(resolved).forEach((key)=>{
                    if (key.charAt(0) !== "_" && resolved[key]) {
                        opts[key] = resolved[key];
                    }
                });
                try {
                    this._socket = tls.connect(opts, ()=>{
                        this._socket.setKeepAlive(true);
                        this._onConnect();
                    });
                    setupConnectionHandlers();
                } catch (E) {
                    return setImmediate(()=>this._onError(E, "ECONNECTION", false, "CONN"));
                }
            });
        } else {
            // connect using plaintext
            return shared.resolveHostname(opts, (err, resolved)=>{
                if (err) {
                    return setImmediate(()=>this._onError(err, "EDNS", false, "CONN"));
                }
                this.logger.debug({
                    tnx: "dns",
                    source: opts.host,
                    resolved: resolved.host,
                    cached: !!resolved.cached
                }, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
                Object.keys(resolved).forEach((key)=>{
                    if (key.charAt(0) !== "_" && resolved[key]) {
                        opts[key] = resolved[key];
                    }
                });
                try {
                    this._socket = net.connect(opts, ()=>{
                        this._socket.setKeepAlive(true);
                        this._onConnect();
                    });
                    setupConnectionHandlers();
                } catch (E) {
                    return setImmediate(()=>this._onError(E, "ECONNECTION", false, "CONN"));
                }
            });
        }
    }
    /**
     * Sends QUIT
     */ quit() {
        this._sendCommand("QUIT");
        this._responseActions.push(this.close);
    }
    /**
     * Closes the connection to the server
     */ close() {
        clearTimeout(this._connectionTimeout);
        clearTimeout(this._greetingTimeout);
        this._responseActions = [];
        // allow to run this function only once
        if (this._closing) {
            return;
        }
        this._closing = true;
        let closeMethod = "end";
        if (this.stage === "init") {
            // Close the socket immediately when connection timed out
            closeMethod = "destroy";
        }
        this.logger.debug({
            tnx: "smtp"
        }, 'Closing connection to the server using "%s"', closeMethod);
        let socket = this._socket && this._socket.socket || this._socket;
        if (socket && !socket.destroyed) {
            try {
                this._socket[closeMethod]();
            } catch (E) {
            // just ignore
            }
        }
        this._destroy();
    }
    /**
     * Authenticate user
     */ login(authData, callback) {
        const isDestroyedMessage = this._isDestroyedMessage("login");
        if (isDestroyedMessage) {
            return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
        }
        this._auth = authData || {};
        // Select SASL authentication method
        this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || false;
        if (!this._authMethod && this._auth.oauth2 && !this._auth.credentials) {
            this._authMethod = "XOAUTH2";
        } else if (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) {
            // use first supported
            this._authMethod = (this._supportedAuth[0] || "PLAIN").toUpperCase().trim();
        }
        if (this._authMethod !== "XOAUTH2" && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass)) {
            if (this._auth.user && this._auth.pass) {
                this._auth.credentials = {
                    user: this._auth.user,
                    pass: this._auth.pass,
                    options: this._auth.options
                };
            } else {
                return callback(this._formatError('Missing credentials for "' + this._authMethod + '"', "EAUTH", false, "API"));
            }
        }
        if (this.customAuth.has(this._authMethod)) {
            let handler = this.customAuth.get(this._authMethod);
            let lastResponse;
            let returned = false;
            let resolve = ()=>{
                if (returned) {
                    return;
                }
                returned = true;
                this.logger.info({
                    tnx: "smtp",
                    username: this._auth.user,
                    action: "authenticated",
                    method: this._authMethod
                }, "User %s authenticated", JSON.stringify(this._auth.user));
                this.authenticated = true;
                callback(null, true);
            };
            let reject = (err)=>{
                if (returned) {
                    return;
                }
                returned = true;
                callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod));
            };
            let handlerResponse = handler({
                auth: this._auth,
                method: this._authMethod,
                extensions: [].concat(this._supportedExtensions),
                authMethods: [].concat(this._supportedAuth),
                maxAllowedSize: this._maxAllowedSize || false,
                sendCommand: (cmd, done)=>{
                    let promise;
                    if (!done) {
                        promise = new Promise((resolve, reject)=>{
                            done = shared.callbackPromise(resolve, reject);
                        });
                    }
                    this._responseActions.push((str)=>{
                        lastResponse = str;
                        let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/);
                        let data = {
                            command: cmd,
                            response: str
                        };
                        if (codes) {
                            data.status = Number(codes[1]) || 0;
                            if (codes[2]) {
                                data.code = codes[2];
                            }
                            data.text = str.substr(codes[0].length);
                        } else {
                            data.text = str;
                            data.status = 0; // just in case we need to perform numeric comparisons
                        }
                        done(null, data);
                    });
                    setImmediate(()=>this._sendCommand(cmd));
                    return promise;
                },
                resolve,
                reject
            });
            if (handlerResponse && typeof handlerResponse.catch === "function") {
                // a promise was returned
                handlerResponse.then(resolve).catch(reject);
            }
            return;
        }
        switch(this._authMethod){
            case "XOAUTH2":
                this._handleXOauth2Token(false, callback);
                return;
            case "LOGIN":
                this._responseActions.push((str)=>{
                    this._actionAUTH_LOGIN_USER(str, callback);
                });
                this._sendCommand("AUTH LOGIN");
                return;
            case "PLAIN":
                this._responseActions.push((str)=>{
                    this._actionAUTHComplete(str, callback);
                });
                this._sendCommand("AUTH PLAIN " + Buffer.from(//this._auth.user+'\u0000'+
                "\x00" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\x00" + this._auth.credentials.pass, "utf-8").toString("base64"), // log entry without passwords
                "AUTH PLAIN " + Buffer.from(//this._auth.user+'\u0000'+
                "\x00" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\x00" + "/* secret */", "utf-8").toString("base64"));
                return;
            case "CRAM-MD5":
                this._responseActions.push((str)=>{
                    this._actionAUTH_CRAM_MD5(str, callback);
                });
                this._sendCommand("AUTH CRAM-MD5");
                return;
        }
        return callback(this._formatError('Unknown authentication method "' + this._authMethod + '"', "EAUTH", false, "API"));
    }
    /**
     * Sends a message
     *
     * @param {Object} envelope Envelope object, {from: addr, to: [addr]}
     * @param {Object} message String, Buffer or a Stream
     * @param {Function} callback Callback to return once sending is completed
     */ send(envelope, message, done) {
        if (!message) {
            return done(this._formatError("Empty message", "EMESSAGE", false, "API"));
        }
        const isDestroyedMessage = this._isDestroyedMessage("send message");
        if (isDestroyedMessage) {
            return done(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
        }
        // reject larger messages than allowed
        if (this._maxAllowedSize && envelope.size > this._maxAllowedSize) {
            return setImmediate(()=>{
                done(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", false, "MAIL FROM"));
            });
        }
        // ensure that callback is only called once
        let returned = false;
        let callback = function() {
            if (returned) {
                return;
            }
            returned = true;
            done(...arguments);
        };
        if (typeof message.on === "function") {
            message.on("error", (err)=>callback(this._formatError(err, "ESTREAM", false, "API")));
        }
        let startTime = Date.now();
        this._setEnvelope(envelope, (err, info)=>{
            if (err) {
                return callback(err);
            }
            let envelopeTime = Date.now();
            let stream = this._createSendStream((err, str)=>{
                if (err) {
                    return callback(err);
                }
                info.envelopeTime = envelopeTime - startTime;
                info.messageTime = Date.now() - envelopeTime;
                info.messageSize = stream.outByteCount;
                info.response = str;
                return callback(null, info);
            });
            if (typeof message.pipe === "function") {
                message.pipe(stream);
            } else {
                stream.write(message);
                stream.end();
            }
        });
    }
    /**
     * Resets connection state
     *
     * @param {Function} callback Callback to return once connection is reset
     */ reset(callback) {
        this._sendCommand("RSET");
        this._responseActions.push((str)=>{
            if (str.charAt(0) !== "2") {
                return callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET"));
            }
            this._envelope = false;
            return callback(null, true);
        });
    }
    /**
     * Connection listener that is run when the connection to
     * the server is opened
     *
     * @event
     */ _onConnect() {
        clearTimeout(this._connectionTimeout);
        this.logger.info({
            tnx: "network",
            localAddress: this._socket.localAddress,
            localPort: this._socket.localPort,
            remoteAddress: this._socket.remoteAddress,
            remotePort: this._socket.remotePort
        }, "%s established to %s:%s", this.secure ? "Secure connection" : "Connection", this._socket.remoteAddress, this._socket.remotePort);
        if (this._destroyed) {
            // Connection was established after we already had canceled it
            this.close();
            return;
        }
        this.stage = "connected";
        // clear existing listeners for the socket
        this._socket.removeListener("data", this._onSocketData);
        this._socket.removeListener("timeout", this._onSocketTimeout);
        this._socket.removeListener("close", this._onSocketClose);
        this._socket.removeListener("end", this._onSocketEnd);
        this._socket.on("data", this._onSocketData);
        this._socket.once("close", this._onSocketClose);
        this._socket.once("end", this._onSocketEnd);
        this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
        this._socket.on("timeout", this._onSocketTimeout);
        this._greetingTimeout = setTimeout(()=>{
            // if still waiting for greeting, give up
            if (this._socket && !this._destroyed && this._responseActions[0] === this._actionGreeting) {
                this._onError("Greeting never received", "ETIMEDOUT", false, "CONN");
            }
        }, this.options.greetingTimeout || GREETING_TIMEOUT);
        this._responseActions.push(this._actionGreeting);
        // we have a 'data' listener set up so resume socket if it was paused
        this._socket.resume();
    }
    /**
     * 'data' listener for data coming from the server
     *
     * @event
     * @param {Buffer} chunk Data chunk coming from the server
     */ _onData(chunk) {
        if (this._destroyed || !chunk || !chunk.length) {
            return;
        }
        let data = (chunk || "").toString("binary");
        let lines = (this._remainder + data).split(/\r?\n/);
        let lastline;
        this._remainder = lines.pop();
        for(let i = 0, len = lines.length; i < len; i++){
            if (this._responseQueue.length) {
                lastline = this._responseQueue[this._responseQueue.length - 1];
                if (/^\d+-/.test(lastline.split("\n").pop())) {
                    this._responseQueue[this._responseQueue.length - 1] += "\n" + lines[i];
                    continue;
                }
            }
            this._responseQueue.push(lines[i]);
        }
        if (this._responseQueue.length) {
            lastline = this._responseQueue[this._responseQueue.length - 1];
            if (/^\d+-/.test(lastline.split("\n").pop())) {
                return;
            }
        }
        this._processResponse();
    }
    /**
     * 'error' listener for the socket
     *
     * @event
     * @param {Error} err Error object
     * @param {String} type Error name
     */ _onError(err, type, data, command) {
        clearTimeout(this._connectionTimeout);
        clearTimeout(this._greetingTimeout);
        if (this._destroyed) {
            // just ignore, already closed
            // this might happen when a socket is canceled because of reached timeout
            // but the socket timeout error itself receives only after
            return;
        }
        err = this._formatError(err, type, data, command);
        this.logger.error(data, err.message);
        this.emit("error", err);
        this.close();
    }
    _formatError(message, type, response, command) {
        let err;
        if (/Error\]$/i.test(Object.prototype.toString.call(message))) {
            err = message;
        } else {
            err = new Error(message);
        }
        if (type && type !== "Error") {
            err.code = type;
        }
        if (response) {
            err.response = response;
            err.message += ": " + response;
        }
        let responseCode = typeof response === "string" && Number((response.match(/^\d+/) || [])[0]) || false;
        if (responseCode) {
            err.responseCode = responseCode;
        }
        if (command) {
            err.command = command;
        }
        return err;
    }
    /**
     * 'close' listener for the socket
     *
     * @event
     */ _onClose() {
        let serverResponse = false;
        if (this._remainder && this._remainder.trim()) {
            if (this.options.debug || this.options.transactionLog) {
                this.logger.debug({
                    tnx: "server"
                }, this._remainder.replace(/\r?\n$/, ""));
            }
            this.lastServerResponse = serverResponse = this._remainder.trim();
        }
        this.logger.info({
            tnx: "network"
        }, "Connection closed");
        if (this.upgrading && !this._destroyed) {
            return this._onError(new Error("Connection closed unexpectedly"), "ETLS", serverResponse, "CONN");
        } else if (![
            this._actionGreeting,
            this.close
        ].includes(this._responseActions[0]) && !this._destroyed) {
            return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        } else if (/^[45]\d{2}\b/.test(serverResponse)) {
            return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        }
        this._destroy();
    }
    /**
     * 'end' listener for the socket
     *
     * @event
     */ _onEnd() {
        if (this._socket && !this._socket.destroyed) {
            this._socket.destroy();
        }
    }
    /**
     * 'timeout' listener for the socket
     *
     * @event
     */ _onTimeout() {
        return this._onError(new Error("Timeout"), "ETIMEDOUT", false, "CONN");
    }
    /**
     * Destroys the client, emits 'end'
     */ _destroy() {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this.emit("end");
    }
    /**
     * Upgrades the connection to TLS
     *
     * @param {Function} callback Callback function to run when the connection
     *        has been secured
     */ _upgradeConnection(callback) {
        // do not remove all listeners or it breaks node v0.10 as there's
        // apparently a 'finish' event set that would be cleared as well
        // we can safely keep 'error', 'end', 'close' etc. events
        this._socket.removeListener("data", this._onSocketData); // incoming data is going to be gibberish from this point onwards
        this._socket.removeListener("timeout", this._onSocketTimeout); // timeout will be re-set for the new socket object
        let socketPlain = this._socket;
        let opts = {
            socket: this._socket,
            host: this.host
        };
        Object.keys(this.options.tls || {}).forEach((key)=>{
            opts[key] = this.options.tls[key];
        });
        this.upgrading = true;
        // tls.connect is not an asynchronous function however it may still throw errors and requires to be wrapped with try/catch
        try {
            this._socket = tls.connect(opts, ()=>{
                this.secure = true;
                this.upgrading = false;
                this._socket.on("data", this._onSocketData);
                socketPlain.removeListener("close", this._onSocketClose);
                socketPlain.removeListener("end", this._onSocketEnd);
                return callback(null, true);
            });
        } catch (err) {
            return callback(err);
        }
        this._socket.on("error", this._onSocketError);
        this._socket.once("close", this._onSocketClose);
        this._socket.once("end", this._onSocketEnd);
        this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT); // 10 min.
        this._socket.on("timeout", this._onSocketTimeout);
        // resume in case the socket was paused
        socketPlain.resume();
    }
    /**
     * Processes queued responses from the server
     *
     * @param {Boolean} force If true, ignores _processing flag
     */ _processResponse() {
        if (!this._responseQueue.length) {
            return false;
        }
        let str = this.lastServerResponse = (this._responseQueue.shift() || "").toString();
        if (/^\d+-/.test(str.split("\n").pop())) {
            // keep waiting for the final part of multiline response
            return;
        }
        if (this.options.debug || this.options.transactionLog) {
            this.logger.debug({
                tnx: "server"
            }, str.replace(/\r?\n$/, ""));
        }
        if (!str.trim()) {
            // skip unexpected empty lines
            setImmediate(()=>this._processResponse());
        }
        let action = this._responseActions.shift();
        if (typeof action === "function") {
            action.call(this, str);
            setImmediate(()=>this._processResponse());
        } else {
            return this._onError(new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
        }
    }
    /**
     * Send a command to the server, append \r\n
     *
     * @param {String} str String to be sent to the server
     * @param {String} logStr Optional string to be used for logging instead of the actual string
     */ _sendCommand(str, logStr) {
        if (this._destroyed) {
            // Connection already closed, can't send any more data
            return;
        }
        if (this._socket.destroyed) {
            return this.close();
        }
        if (this.options.debug || this.options.transactionLog) {
            this.logger.debug({
                tnx: "client"
            }, (logStr || str || "").toString().replace(/\r?\n$/, ""));
        }
        this._socket.write(Buffer.from(str + "\r\n", "utf-8"));
    }
    /**
     * Initiates a new message by submitting envelope data, starting with
     * MAIL FROM: command
     *
     * @param {Object} envelope Envelope object in the form of
     *        {from:'...', to:['...']}
     *        or
     *        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
     */ _setEnvelope(envelope, callback) {
        let args = [];
        let useSmtpUtf8 = false;
        this._envelope = envelope || {};
        this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim();
        this._envelope.to = [].concat(this._envelope.to || []).map((to)=>(to && to.address || to || "").toString().trim());
        if (!this._envelope.to.length) {
            return callback(this._formatError("No recipients defined", "EENVELOPE", false, "API"));
        }
        if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from)) {
            return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", false, "API"));
        }
        // check if the sender address uses only ASCII characters,
        // otherwise require usage of SMTPUTF8 extension
        if (/[\x80-\uFFFF]/.test(this._envelope.from)) {
            useSmtpUtf8 = true;
        }
        for(let i = 0, len = this._envelope.to.length; i < len; i++){
            if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i])) {
                return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", false, "API"));
            }
            // check if the recipients addresses use only ASCII characters,
            // otherwise require usage of SMTPUTF8 extension
            if (/[\x80-\uFFFF]/.test(this._envelope.to[i])) {
                useSmtpUtf8 = true;
            }
        }
        // clone the recipients array for latter manipulation
        this._envelope.rcptQueue = JSON.parse(JSON.stringify(this._envelope.to || []));
        this._envelope.rejected = [];
        this._envelope.rejectedErrors = [];
        this._envelope.accepted = [];
        if (this._envelope.dsn) {
            try {
                this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
            } catch (err) {
                return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", false, "API"));
            }
        }
        this._responseActions.push((str)=>{
            this._actionMAIL(str, callback);
        });
        // If the server supports SMTPUTF8 and the envelope includes an internationalized
        // email address then append SMTPUTF8 keyword to the MAIL FROM command
        if (useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8")) {
            args.push("SMTPUTF8");
            this._usingSmtpUtf8 = true;
        }
        // If the server supports 8BITMIME and the message might contain non-ascii bytes
        // then append the 8BITMIME keyword to the MAIL FROM command
        if (this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME")) {
            args.push("BODY=8BITMIME");
            this._using8BitMime = true;
        }
        if (this._envelope.size && this._supportedExtensions.includes("SIZE")) {
            args.push("SIZE=" + this._envelope.size);
        }
        // If the server supports DSN and the envelope includes an DSN prop
        // then append DSN params to the MAIL FROM command
        if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
            if (this._envelope.dsn.ret) {
                args.push("RET=" + shared.encodeXText(this._envelope.dsn.ret));
            }
            if (this._envelope.dsn.envid) {
                args.push("ENVID=" + shared.encodeXText(this._envelope.dsn.envid));
            }
        }
        this._sendCommand("MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : ""));
    }
    _setDsnEnvelope(params) {
        let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
        if (ret) {
            switch(ret){
                case "HDRS":
                case "HEADERS":
                    ret = "HDRS";
                    break;
                case "FULL":
                case "BODY":
                    ret = "FULL";
                    break;
            }
        }
        if (ret && ![
            "FULL",
            "HDRS"
        ].includes(ret)) {
            throw new Error("ret: " + JSON.stringify(ret));
        }
        let envid = (params.envid || params.id || "").toString() || null;
        let notify = params.notify || null;
        if (notify) {
            if (typeof notify === "string") {
                notify = notify.split(",");
            }
            notify = notify.map((n)=>n.trim().toUpperCase());
            let validNotify = [
                "NEVER",
                "SUCCESS",
                "FAILURE",
                "DELAY"
            ];
            let invaliNotify = notify.filter((n)=>!validNotify.includes(n));
            if (invaliNotify.length || notify.length > 1 && notify.includes("NEVER")) {
                throw new Error("notify: " + JSON.stringify(notify.join(",")));
            }
            notify = notify.join(",");
        }
        let orcpt = (params.recipient || params.orcpt || "").toString() || null;
        if (orcpt && orcpt.indexOf(";") < 0) {
            orcpt = "rfc822;" + orcpt;
        }
        return {
            ret,
            envid,
            notify,
            orcpt
        };
    }
    _getDsnRcptToArgs() {
        let args = [];
        // If the server supports DSN and the envelope includes an DSN prop
        // then append DSN params to the RCPT TO command
        if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
            if (this._envelope.dsn.notify) {
                args.push("NOTIFY=" + shared.encodeXText(this._envelope.dsn.notify));
            }
            if (this._envelope.dsn.orcpt) {
                args.push("ORCPT=" + shared.encodeXText(this._envelope.dsn.orcpt));
            }
        }
        return args.length ? " " + args.join(" ") : "";
    }
    _createSendStream(callback) {
        let dataStream = new DataStream();
        let logStream;
        if (this.options.lmtp) {
            this._envelope.accepted.forEach((recipient, i)=>{
                let final = i === this._envelope.accepted.length - 1;
                this._responseActions.push((str)=>{
                    this._actionLMTPStream(recipient, final, str, callback);
                });
            });
        } else {
            this._responseActions.push((str)=>{
                this._actionSMTPStream(str, callback);
            });
        }
        dataStream.pipe(this._socket, {
            end: false
        });
        if (this.options.debug) {
            logStream = new PassThrough();
            logStream.on("readable", ()=>{
                let chunk;
                while(chunk = logStream.read()){
                    this.logger.debug({
                        tnx: "message"
                    }, chunk.toString("binary").replace(/\r?\n$/, ""));
                }
            });
            dataStream.pipe(logStream);
        }
        dataStream.once("end", ()=>{
            this.logger.info({
                tnx: "message",
                inByteCount: dataStream.inByteCount,
                outByteCount: dataStream.outByteCount
            }, "<%s bytes encoded mime message (source size %s bytes)>", dataStream.outByteCount, dataStream.inByteCount);
        });
        return dataStream;
    }
    /** ACTIONS **/ /**
     * Will be run after the connection is created and the server sends
     * a greeting. If the incoming message starts with 220 initiate
     * SMTP session by sending EHLO command
     *
     * @param {String} str Message from the server
     */ _actionGreeting(str) {
        clearTimeout(this._greetingTimeout);
        if (str.substr(0, 3) !== "220") {
            this._onError(new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
            return;
        }
        if (this.options.lmtp) {
            this._responseActions.push(this._actionLHLO);
            this._sendCommand("LHLO " + this.name);
        } else {
            this._responseActions.push(this._actionEHLO);
            this._sendCommand("EHLO " + this.name);
        }
    }
    /**
     * Handles server response for LHLO command. If it yielded in
     * error, emit 'error', otherwise treat this as an EHLO response
     *
     * @param {String} str Message from the server
     */ _actionLHLO(str) {
        if (str.charAt(0) !== "2") {
            this._onError(new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
            return;
        }
        this._actionEHLO(str);
    }
    /**
     * Handles server response for EHLO command. If it yielded in
     * error, try HELO instead, otherwise initiate TLS negotiation
     * if STARTTLS is supported by the server or move into the
     * authentication phase.
     *
     * @param {String} str Message from the server
     */ _actionEHLO(str) {
        let match;
        if (str.substr(0, 3) === "421") {
            this._onError(new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
            return;
        }
        if (str.charAt(0) !== "2") {
            if (this.options.requireTLS) {
                this._onError(new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
                return;
            }
            // Try HELO instead
            this._responseActions.push(this._actionHELO);
            this._sendCommand("HELO " + this.name);
            return;
        }
        this._ehloLines = str.split(/\r?\n/).map((line)=>line.replace(/^\d+[ -]/, "").trim()).filter((line)=>line).slice(1);
        // Detect if the server supports STARTTLS
        if (!this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
            this._sendCommand("STARTTLS");
            this._responseActions.push(this._actionSTARTTLS);
            return;
        }
        // Detect if the server supports SMTPUTF8
        if (/[ -]SMTPUTF8\b/im.test(str)) {
            this._supportedExtensions.push("SMTPUTF8");
        }
        // Detect if the server supports DSN
        if (/[ -]DSN\b/im.test(str)) {
            this._supportedExtensions.push("DSN");
        }
        // Detect if the server supports 8BITMIME
        if (/[ -]8BITMIME\b/im.test(str)) {
            this._supportedExtensions.push("8BITMIME");
        }
        // Detect if the server supports PIPELINING
        if (/[ -]PIPELINING\b/im.test(str)) {
            this._supportedExtensions.push("PIPELINING");
        }
        // Detect if the server supports AUTH
        if (/[ -]AUTH\b/i.test(str)) {
            this.allowsAuth = true;
        }
        // Detect if the server supports PLAIN auth
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)PLAIN/i.test(str)) {
            this._supportedAuth.push("PLAIN");
        }
        // Detect if the server supports LOGIN auth
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)LOGIN/i.test(str)) {
            this._supportedAuth.push("LOGIN");
        }
        // Detect if the server supports CRAM-MD5 auth
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)CRAM-MD5/i.test(str)) {
            this._supportedAuth.push("CRAM-MD5");
        }
        // Detect if the server supports XOAUTH2 auth
        if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)XOAUTH2/i.test(str)) {
            this._supportedAuth.push("XOAUTH2");
        }
        // Detect if the server supports SIZE extensions (and the max allowed size)
        if (match = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) {
            this._supportedExtensions.push("SIZE");
            this._maxAllowedSize = Number(match[1]) || 0;
        }
        this.emit("connect");
    }
    /**
     * Handles server response for HELO command. If it yielded in
     * error, emit 'error', otherwise move into the authentication phase.
     *
     * @param {String} str Message from the server
     */ _actionHELO(str) {
        if (str.charAt(0) !== "2") {
            this._onError(new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
            return;
        }
        // assume that authentication is enabled (most probably is not though)
        this.allowsAuth = true;
        this.emit("connect");
    }
    /**
     * Handles server response for STARTTLS command. If there's an error
     * try HELO instead, otherwise initiate TLS upgrade. If the upgrade
     * succeedes restart the EHLO
     *
     * @param {String} str Message from the server
     */ _actionSTARTTLS(str) {
        if (str.charAt(0) !== "2") {
            if (this.options.opportunisticTLS) {
                this.logger.info({
                    tnx: "smtp"
                }, "Failed STARTTLS upgrade, continuing unencrypted");
                return this.emit("connect");
            }
            this._onError(new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
            return;
        }
        this._upgradeConnection((err, secured)=>{
            if (err) {
                this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "STARTTLS");
                return;
            }
            this.logger.info({
                tnx: "smtp"
            }, "Connection upgraded with STARTTLS");
            if (secured) {
                // restart session
                if (this.options.lmtp) {
                    this._responseActions.push(this._actionLHLO);
                    this._sendCommand("LHLO " + this.name);
                } else {
                    this._responseActions.push(this._actionEHLO);
                    this._sendCommand("EHLO " + this.name);
                }
            } else {
                this.emit("connect");
            }
        });
    }
    /**
     * Handle the response for AUTH LOGIN command. We are expecting
     * '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
     * response needs to be base64 encoded username. We do not need
     * exact match but settle with 334 response in general as some
     * hosts invalidly use a longer message than VXNlcm5hbWU6
     *
     * @param {String} str Message from the server
     */ _actionAUTH_LOGIN_USER(str, callback) {
        if (!/^334[ -]/.test(str)) {
            // expecting '334 VXNlcm5hbWU6'
            callback(this._formatError('Invalid login sequence while waiting for "334 VXNlcm5hbWU6"', "EAUTH", str, "AUTH LOGIN"));
            return;
        }
        this._responseActions.push((str)=>{
            this._actionAUTH_LOGIN_PASS(str, callback);
        });
        this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
    }
    /**
     * Handle the response for AUTH CRAM-MD5 command. We are expecting
     * '334 <challenge string>'. Data to be sent as response needs to be
     * base64 decoded challenge string, MD5 hashed using the password as
     * a HMAC key, prefixed by the username and a space, and finally all
     * base64 encoded again.
     *
     * @param {String} str Message from the server
     */ _actionAUTH_CRAM_MD5(str, callback) {
        let challengeMatch = str.match(/^334\s+(.+)$/);
        let challengeString = "";
        if (!challengeMatch) {
            return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
        } else {
            challengeString = challengeMatch[1];
        }
        // Decode from base64
        let base64decoded = Buffer.from(challengeString, "base64").toString("ascii"), hmacMD5 = crypto.createHmac("md5", this._auth.credentials.pass);
        hmacMD5.update(base64decoded);
        let prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
        this._responseActions.push((str)=>{
            this._actionAUTH_CRAM_MD5_PASS(str, callback);
        });
        this._sendCommand(Buffer.from(prepended).toString("base64"), // hidden hash for logs
        Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64"));
    }
    /**
     * Handles the response to CRAM-MD5 authentication, if there's no error,
     * the user can be considered logged in. Start waiting for a message to send
     *
     * @param {String} str Message from the server
     */ _actionAUTH_CRAM_MD5_PASS(str, callback) {
        if (!str.match(/^235\s+/)) {
            return callback(this._formatError('Invalid login sequence while waiting for "235"', "EAUTH", str, "AUTH CRAM-MD5"));
        }
        this.logger.info({
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
        }, "User %s authenticated", JSON.stringify(this._auth.user));
        this.authenticated = true;
        callback(null, true);
    }
    /**
     * Handle the response for AUTH LOGIN command. We are expecting
     * '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
     * response needs to be base64 encoded password.
     *
     * @param {String} str Message from the server
     */ _actionAUTH_LOGIN_PASS(str, callback) {
        if (!/^334[ -]/.test(str)) {
            // expecting '334 UGFzc3dvcmQ6'
            return callback(this._formatError('Invalid login sequence while waiting for "334 UGFzc3dvcmQ6"', "EAUTH", str, "AUTH LOGIN"));
        }
        this._responseActions.push((str)=>{
            this._actionAUTHComplete(str, callback);
        });
        this._sendCommand(Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"), // Hidden pass for logs
        Buffer.from("/* secret */", "utf-8").toString("base64"));
    }
    /**
     * Handles the response for authentication, if there's no error,
     * the user can be considered logged in. Start waiting for a message to send
     *
     * @param {String} str Message from the server
     */ _actionAUTHComplete(str, isRetry, callback) {
        if (!callback && typeof isRetry === "function") {
            callback = isRetry;
            isRetry = false;
        }
        if (str.substr(0, 3) === "334") {
            this._responseActions.push((str)=>{
                if (isRetry || this._authMethod !== "XOAUTH2") {
                    this._actionAUTHComplete(str, true, callback);
                } else {
                    // fetch a new OAuth2 access token
                    setImmediate(()=>this._handleXOauth2Token(true, callback));
                }
            });
            this._sendCommand("");
            return;
        }
        if (str.charAt(0) !== "2") {
            this.logger.info({
                tnx: "smtp",
                username: this._auth.user,
                action: "authfail",
                method: this._authMethod
            }, "User %s failed to authenticate", JSON.stringify(this._auth.user));
            return callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
        }
        this.logger.info({
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
        }, "User %s authenticated", JSON.stringify(this._auth.user));
        this.authenticated = true;
        callback(null, true);
    }
    /**
     * Handle response for a MAIL FROM: command
     *
     * @param {String} str Message from the server
     */ _actionMAIL(str, callback) {
        let message, curRecipient;
        if (Number(str.charAt(0)) !== 2) {
            if (this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(this._envelope.from)) {
                message = "Internationalized mailbox name not allowed";
            } else {
                message = "Mail command failed";
            }
            return callback(this._formatError(message, "EENVELOPE", str, "MAIL FROM"));
        }
        if (!this._envelope.rcptQueue.length) {
            return callback(this._formatError("Can't send mail - no recipients defined", "EENVELOPE", false, "API"));
        } else {
            this._recipientQueue = [];
            if (this._supportedExtensions.includes("PIPELINING")) {
                while(this._envelope.rcptQueue.length){
                    curRecipient = this._envelope.rcptQueue.shift();
                    this._recipientQueue.push(curRecipient);
                    this._responseActions.push((str)=>{
                        this._actionRCPT(str, callback);
                    });
                    this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
                }
            } else {
                curRecipient = this._envelope.rcptQueue.shift();
                this._recipientQueue.push(curRecipient);
                this._responseActions.push((str)=>{
                    this._actionRCPT(str, callback);
                });
                this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
            }
        }
    }
    /**
     * Handle response for a RCPT TO: command
     *
     * @param {String} str Message from the server
     */ _actionRCPT(str, callback) {
        let message, err, curRecipient = this._recipientQueue.shift();
        if (Number(str.charAt(0)) !== 2) {
            // this is a soft error
            if (this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient)) {
                message = "Internationalized mailbox name not allowed";
            } else {
                message = "Recipient command failed";
            }
            this._envelope.rejected.push(curRecipient);
            // store error for the failed recipient
            err = this._formatError(message, "EENVELOPE", str, "RCPT TO");
            err.recipient = curRecipient;
            this._envelope.rejectedErrors.push(err);
        } else {
            this._envelope.accepted.push(curRecipient);
        }
        if (!this._envelope.rcptQueue.length && !this._recipientQueue.length) {
            if (this._envelope.rejected.length < this._envelope.to.length) {
                this._responseActions.push((str)=>{
                    this._actionDATA(str, callback);
                });
                this._sendCommand("DATA");
            } else {
                err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", str, "RCPT TO");
                err.rejected = this._envelope.rejected;
                err.rejectedErrors = this._envelope.rejectedErrors;
                return callback(err);
            }
        } else if (this._envelope.rcptQueue.length) {
            curRecipient = this._envelope.rcptQueue.shift();
            this._recipientQueue.push(curRecipient);
            this._responseActions.push((str)=>{
                this._actionRCPT(str, callback);
            });
            this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
        }
    }
    /**
     * Handle response for a DATA command
     *
     * @param {String} str Message from the server
     */ _actionDATA(str, callback) {
        // response should be 354 but according to this issue https://github.com/eleith/emailjs/issues/24
        // some servers might use 250 instead, so lets check for 2 or 3 as the first digit
        if (!/^[23]/.test(str)) {
            return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
        }
        let response = {
            accepted: this._envelope.accepted,
            rejected: this._envelope.rejected
        };
        if (this._ehloLines && this._ehloLines.length) {
            response.ehlo = this._ehloLines;
        }
        if (this._envelope.rejectedErrors.length) {
            response.rejectedErrors = this._envelope.rejectedErrors;
        }
        callback(null, response);
    }
    /**
     * Handle response for a DATA stream when using SMTP
     * We expect a single response that defines if the sending succeeded or failed
     *
     * @param {String} str Message from the server
     */ _actionSMTPStream(str, callback) {
        if (Number(str.charAt(0)) !== 2) {
            // Message failed
            return callback(this._formatError("Message failed", "EMESSAGE", str, "DATA"));
        } else {
            // Message sent succesfully
            return callback(null, str);
        }
    }
    /**
     * Handle response for a DATA stream
     * We expect a separate response for every recipient. All recipients can either
     * succeed or fail separately
     *
     * @param {String} recipient The recipient this response applies to
     * @param {Boolean} final Is this the final recipient?
     * @param {String} str Message from the server
     */ _actionLMTPStream(recipient, final, str, callback) {
        let err;
        if (Number(str.charAt(0)) !== 2) {
            // Message failed
            err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA");
            err.recipient = recipient;
            this._envelope.rejected.push(recipient);
            this._envelope.rejectedErrors.push(err);
            for(let i = 0, len = this._envelope.accepted.length; i < len; i++){
                if (this._envelope.accepted[i] === recipient) {
                    this._envelope.accepted.splice(i, 1);
                }
            }
        }
        if (final) {
            return callback(null, str);
        }
    }
    _handleXOauth2Token(isRetry, callback) {
        this._auth.oauth2.getToken(isRetry, (err, accessToken)=>{
            if (err) {
                this.logger.info({
                    tnx: "smtp",
                    username: this._auth.user,
                    action: "authfail",
                    method: this._authMethod
                }, "User %s failed to authenticate", JSON.stringify(this._auth.user));
                return callback(this._formatError(err, "EAUTH", false, "AUTH XOAUTH2"));
            }
            this._responseActions.push((str)=>{
                this._actionAUTHComplete(str, isRetry, callback);
            });
            this._sendCommand("AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken), //  Hidden for logs
            "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */"));
        });
    }
    /**
     *
     * @param {string} command
     * @private
     */ _isDestroyedMessage(command) {
        if (this._destroyed) {
            return "Cannot " + command + " - smtp connection is already destroyed.";
        }
        if (this._socket) {
            if (this._socket.destroyed) {
                return "Cannot " + command + " - smtp connection socket is already destroyed.";
            }
            if (!this._socket.writable) {
                return "Cannot " + command + " - smtp connection socket is already half-closed.";
            }
        }
    }
    _getHostname() {
        // defaul hostname is machine hostname or [IP]
        let defaultHostname;
        try {
            defaultHostname = os.hostname() || "";
        } catch (err) {
            // fails on windows 7
            defaultHostname = "localhost";
        }
        // ignore if not FQDN
        if (!defaultHostname || defaultHostname.indexOf(".") < 0) {
            defaultHostname = "[127.0.0.1]";
        }
        // IP should be enclosed in []
        if (defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
            defaultHostname = "[" + defaultHostname + "]";
        }
        return defaultHostname;
    }
}
module.exports = SMTPConnection;


/***/ }),

/***/ 5567:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const EventEmitter = __webpack_require__(2361);
const PoolResource = __webpack_require__(763);
const SMTPConnection = __webpack_require__(7753);
const wellKnown = __webpack_require__(3591);
const shared = __webpack_require__(2122);
const packageData = __webpack_require__(3259);
/**
 * Creates a SMTP pool transport object for Nodemailer
 *
 * @constructor
 * @param {Object} options SMTP Connection options
 */ class SMTPPool extends EventEmitter {
    constructor(options){
        super();
        options = options || {};
        if (typeof options === "string") {
            options = {
                url: options
            };
        }
        let urlData;
        let service = options.service;
        if (typeof options.getSocket === "function") {
            this.getSocket = options.getSocket;
        }
        if (options.url) {
            urlData = shared.parseConnectionUrl(options.url);
            service = service || urlData.service;
        }
        this.options = shared.assign(false, options, urlData, service && wellKnown(service) // wellknown options
        );
        this.options.maxConnections = this.options.maxConnections || 5;
        this.options.maxMessages = this.options.maxMessages || 100;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "smtp-pool"
        });
        // temporary object
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP (pool)";
        this.version = packageData.version + "[client:" + connection.version + "]";
        this._rateLimit = {
            counter: 0,
            timeout: null,
            waiting: [],
            checkpoint: false,
            delta: Number(this.options.rateDelta) || 1000,
            limit: Number(this.options.rateLimit) || 0
        };
        this._closed = false;
        this._queue = [];
        this._connections = [];
        this._connectionCounter = 0;
        this.idling = true;
        setImmediate(()=>{
            if (this.idling) {
                this.emit("idle");
            }
        });
    }
    /**
     * Placeholder function for creating proxy sockets. This method immediatelly returns
     * without a socket
     *
     * @param {Object} options Connection options
     * @param {Function} callback Callback function to run with the socket keys
     */ getSocket(options, callback) {
        // return immediatelly
        return setImmediate(()=>callback(null, false));
    }
    /**
     * Queues an e-mail to be sent using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */ send(mail, callback) {
        if (this._closed) {
            return false;
        }
        this._queue.push({
            mail,
            requeueAttempts: 0,
            callback
        });
        if (this.idling && this._queue.length >= this.options.maxConnections) {
            this.idling = false;
        }
        setImmediate(()=>this._processMessages());
        return true;
    }
    /**
     * Closes all connections in the pool. If there is a message being sent, the connection
     * is closed later
     */ close() {
        let connection;
        let len = this._connections.length;
        this._closed = true;
        // clear rate limit timer if it exists
        clearTimeout(this._rateLimit.timeout);
        if (!len && !this._queue.length) {
            return;
        }
        // remove all available connections
        for(let i = len - 1; i >= 0; i--){
            if (this._connections[i] && this._connections[i].available) {
                connection = this._connections[i];
                connection.close();
                this.logger.info({
                    tnx: "connection",
                    cid: connection.id,
                    action: "removed"
                }, "Connection #%s removed", connection.id);
            }
        }
        if (len && !this._connections.length) {
            this.logger.debug({
                tnx: "connection"
            }, "All connections removed");
        }
        if (!this._queue.length) {
            return;
        }
        // make sure that entire queue would be cleaned
        let invokeCallbacks = ()=>{
            if (!this._queue.length) {
                this.logger.debug({
                    tnx: "connection"
                }, "Pending queue entries cleared");
                return;
            }
            let entry = this._queue.shift();
            if (entry && typeof entry.callback === "function") {
                try {
                    entry.callback(new Error("Connection pool was closed"));
                } catch (E) {
                    this.logger.error({
                        err: E,
                        tnx: "callback",
                        cid: connection.id
                    }, "Callback error for #%s: %s", connection.id, E.message);
                }
            }
            setImmediate(invokeCallbacks);
        };
        setImmediate(invokeCallbacks);
    }
    /**
     * Check the queue and available connections. If there is a message to be sent and there is
     * an available connection, then use this connection to send the mail
     */ _processMessages() {
        let connection;
        let i, len;
        // do nothing if already closed
        if (this._closed) {
            return;
        }
        // do nothing if queue is empty
        if (!this._queue.length) {
            if (!this.idling) {
                // no pending jobs
                this.idling = true;
                this.emit("idle");
            }
            return;
        }
        // find first available connection
        for(i = 0, len = this._connections.length; i < len; i++){
            if (this._connections[i].available) {
                connection = this._connections[i];
                break;
            }
        }
        if (!connection && this._connections.length < this.options.maxConnections) {
            connection = this._createConnection();
        }
        if (!connection) {
            // no more free connection slots available
            this.idling = false;
            return;
        }
        // check if there is free space in the processing queue
        if (!this.idling && this._queue.length < this.options.maxConnections) {
            this.idling = true;
            this.emit("idle");
        }
        let entry = connection.queueEntry = this._queue.shift();
        entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, "");
        connection.available = false;
        this.logger.debug({
            tnx: "pool",
            cid: connection.id,
            messageId: entry.messageId,
            action: "assign"
        }, "Assigned message <%s> to #%s (%s)", entry.messageId, connection.id, connection.messages + 1);
        if (this._rateLimit.limit) {
            this._rateLimit.counter++;
            if (!this._rateLimit.checkpoint) {
                this._rateLimit.checkpoint = Date.now();
            }
        }
        connection.send(entry.mail, (err, info)=>{
            // only process callback if current handler is not changed
            if (entry === connection.queueEntry) {
                try {
                    entry.callback(err, info);
                } catch (E) {
                    this.logger.error({
                        err: E,
                        tnx: "callback",
                        cid: connection.id
                    }, "Callback error for #%s: %s", connection.id, E.message);
                }
                connection.queueEntry = false;
            }
        });
    }
    /**
     * Creates a new pool resource
     */ _createConnection() {
        let connection = new PoolResource(this);
        connection.id = ++this._connectionCounter;
        this.logger.info({
            tnx: "pool",
            cid: connection.id,
            action: "conection"
        }, "Created new pool resource #%s", connection.id);
        // resource comes available
        connection.on("available", ()=>{
            this.logger.debug({
                tnx: "connection",
                cid: connection.id,
                action: "available"
            }, "Connection #%s became available", connection.id);
            if (this._closed) {
                // if already closed run close() that will remove this connections from connections list
                this.close();
            } else {
                // check if there's anything else to send
                this._processMessages();
            }
        });
        // resource is terminated with an error
        connection.once("error", (err)=>{
            if (err.code !== "EMAXLIMIT") {
                this.logger.error({
                    err,
                    tnx: "pool",
                    cid: connection.id
                }, "Pool Error for #%s: %s", connection.id, err.message);
            } else {
                this.logger.debug({
                    tnx: "pool",
                    cid: connection.id,
                    action: "maxlimit"
                }, "Max messages limit exchausted for #%s", connection.id);
            }
            if (connection.queueEntry) {
                try {
                    connection.queueEntry.callback(err);
                } catch (E) {
                    this.logger.error({
                        err: E,
                        tnx: "callback",
                        cid: connection.id
                    }, "Callback error for #%s: %s", connection.id, E.message);
                }
                connection.queueEntry = false;
            }
            // remove the erroneus connection from connections list
            this._removeConnection(connection);
            this._continueProcessing();
        });
        connection.once("close", ()=>{
            this.logger.info({
                tnx: "connection",
                cid: connection.id,
                action: "closed"
            }, "Connection #%s was closed", connection.id);
            this._removeConnection(connection);
            if (connection.queueEntry) {
                // If the connection closed when sending, add the message to the queue again
                // if max number of requeues is not reached yet
                // Note that we must wait a bit.. because the callback of the 'error' handler might be called
                // in the next event loop
                setTimeout(()=>{
                    if (connection.queueEntry) {
                        if (this._shouldRequeuOnConnectionClose(connection.queueEntry)) {
                            this._requeueEntryOnConnectionClose(connection);
                        } else {
                            this._failDeliveryOnConnectionClose(connection);
                        }
                    }
                    this._continueProcessing();
                }, 50);
            } else {
                this._continueProcessing();
            }
        });
        this._connections.push(connection);
        return connection;
    }
    _shouldRequeuOnConnectionClose(queueEntry) {
        if (this.options.maxRequeues === undefined || this.options.maxRequeues < 0) {
            return true;
        }
        return queueEntry.requeueAttempts < this.options.maxRequeues;
    }
    _failDeliveryOnConnectionClose(connection) {
        if (connection.queueEntry && connection.queueEntry.callback) {
            try {
                connection.queueEntry.callback(new Error("Reached maximum number of retries after connection was closed"));
            } catch (E) {
                this.logger.error({
                    err: E,
                    tnx: "callback",
                    messageId: connection.queueEntry.messageId,
                    cid: connection.id
                }, "Callback error for #%s: %s", connection.id, E.message);
            }
            connection.queueEntry = false;
        }
    }
    _requeueEntryOnConnectionClose(connection) {
        connection.queueEntry.requeueAttempts = connection.queueEntry.requeueAttempts + 1;
        this.logger.debug({
            tnx: "pool",
            cid: connection.id,
            messageId: connection.queueEntry.messageId,
            action: "requeue"
        }, "Re-queued message <%s> for #%s. Attempt: #%s", connection.queueEntry.messageId, connection.id, connection.queueEntry.requeueAttempts);
        this._queue.unshift(connection.queueEntry);
        connection.queueEntry = false;
    }
    /**
     * Continue to process message if the pool hasn't closed
     */ _continueProcessing() {
        if (this._closed) {
            this.close();
        } else {
            setTimeout(()=>this._processMessages(), 100);
        }
    }
    /**
     * Remove resource from pool
     *
     * @param {Object} connection The PoolResource to remove
     */ _removeConnection(connection) {
        let index = this._connections.indexOf(connection);
        if (index !== -1) {
            this._connections.splice(index, 1);
        }
    }
    /**
     * Checks if connections have hit current rate limit and if so, queues the availability callback
     *
     * @param {Function} callback Callback function to run once rate limiter has been cleared
     */ _checkRateLimit(callback) {
        if (!this._rateLimit.limit) {
            return callback();
        }
        let now = Date.now();
        if (this._rateLimit.counter < this._rateLimit.limit) {
            return callback();
        }
        this._rateLimit.waiting.push(callback);
        if (this._rateLimit.checkpoint <= now - this._rateLimit.delta) {
            return this._clearRateLimit();
        } else if (!this._rateLimit.timeout) {
            this._rateLimit.timeout = setTimeout(()=>this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint));
            this._rateLimit.checkpoint = now;
        }
    }
    /**
     * Clears current rate limit limitation and runs paused callback
     */ _clearRateLimit() {
        clearTimeout(this._rateLimit.timeout);
        this._rateLimit.timeout = null;
        this._rateLimit.counter = 0;
        this._rateLimit.checkpoint = false;
        // resume all paused connections
        while(this._rateLimit.waiting.length){
            let cb = this._rateLimit.waiting.shift();
            setImmediate(cb);
        }
    }
    /**
     * Returns true if there are free slots in the queue
     */ isIdle() {
        return this.idling;
    }
    /**
     * Verifies SMTP configuration
     *
     * @param {Function} callback Callback function
     */ verify(callback) {
        let promise;
        if (!callback) {
            promise = new Promise((resolve, reject)=>{
                callback = shared.callbackPromise(resolve, reject);
            });
        }
        let auth = new PoolResource(this).auth;
        this.getSocket(this.options, (err, socketOptions)=>{
            if (err) {
                return callback(err);
            }
            let options = this.options;
            if (socketOptions && socketOptions.connection) {
                this.logger.info({
                    tnx: "proxy",
                    remoteAddress: socketOptions.connection.remoteAddress,
                    remotePort: socketOptions.connection.remotePort,
                    destHost: options.host || "",
                    destPort: options.port || "",
                    action: "connected"
                }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
                options = shared.assign(false, options);
                Object.keys(socketOptions).forEach((key)=>{
                    options[key] = socketOptions[key];
                });
            }
            let connection = new SMTPConnection(options);
            let returned = false;
            connection.once("error", (err)=>{
                if (returned) {
                    return;
                }
                returned = true;
                connection.close();
                return callback(err);
            });
            connection.once("end", ()=>{
                if (returned) {
                    return;
                }
                returned = true;
                return callback(new Error("Connection closed"));
            });
            let finalize = ()=>{
                if (returned) {
                    return;
                }
                returned = true;
                connection.quit();
                return callback(null, true);
            };
            connection.connect(()=>{
                if (returned) {
                    return;
                }
                if (auth && (connection.allowsAuth || options.forceAuth)) {
                    connection.login(auth, (err)=>{
                        if (returned) {
                            return;
                        }
                        if (err) {
                            returned = true;
                            connection.close();
                            return callback(err);
                        }
                        finalize();
                    });
                } else if (!auth && connection.allowsAuth && options.forceAuth) {
                    let err = new Error("Authentication info was not provided");
                    err.code = "NoAuth";
                    returned = true;
                    connection.close();
                    return callback(err);
                } else {
                    finalize();
                }
            });
        });
        return promise;
    }
}
// expose to the world
module.exports = SMTPPool;


/***/ }),

/***/ 763:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const SMTPConnection = __webpack_require__(7753);
const assign = (__webpack_require__(2122).assign);
const XOAuth2 = __webpack_require__(6784);
const EventEmitter = __webpack_require__(2361);
/**
 * Creates an element for the pool
 *
 * @constructor
 * @param {Object} options SMTPPool instance
 */ class PoolResource extends EventEmitter {
    constructor(pool){
        super();
        this.pool = pool;
        this.options = pool.options;
        this.logger = this.pool.logger;
        if (this.options.auth) {
            switch((this.options.auth.type || "").toString().toUpperCase()){
                case "OAUTH2":
                    {
                        let oauth2 = new XOAuth2(this.options.auth, this.logger);
                        oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
                        this.auth = {
                            type: "OAUTH2",
                            user: this.options.auth.user,
                            oauth2,
                            method: "XOAUTH2"
                        };
                        oauth2.on("token", (token)=>this.pool.mailer.emit("token", token));
                        oauth2.on("error", (err)=>this.emit("error", err));
                        break;
                    }
                default:
                    if (!this.options.auth.user && !this.options.auth.pass) {
                        break;
                    }
                    this.auth = {
                        type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
                        user: this.options.auth.user,
                        credentials: {
                            user: this.options.auth.user || "",
                            pass: this.options.auth.pass,
                            options: this.options.auth.options
                        },
                        method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || false
                    };
            }
        }
        this._connection = false;
        this._connected = false;
        this.messages = 0;
        this.available = true;
    }
    /**
     * Initiates a connection to the SMTP server
     *
     * @param {Function} callback Callback function to run once the connection is established or failed
     */ connect(callback) {
        this.pool.getSocket(this.options, (err, socketOptions)=>{
            if (err) {
                return callback(err);
            }
            let returned = false;
            let options = this.options;
            if (socketOptions && socketOptions.connection) {
                this.logger.info({
                    tnx: "proxy",
                    remoteAddress: socketOptions.connection.remoteAddress,
                    remotePort: socketOptions.connection.remotePort,
                    destHost: options.host || "",
                    destPort: options.port || "",
                    action: "connected"
                }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
                options = assign(false, options);
                Object.keys(socketOptions).forEach((key)=>{
                    options[key] = socketOptions[key];
                });
            }
            this.connection = new SMTPConnection(options);
            this.connection.once("error", (err)=>{
                this.emit("error", err);
                if (returned) {
                    return;
                }
                returned = true;
                return callback(err);
            });
            this.connection.once("end", ()=>{
                this.close();
                if (returned) {
                    return;
                }
                returned = true;
                let timer = setTimeout(()=>{
                    if (returned) {
                        return;
                    }
                    // still have not returned, this means we have an unexpected connection close
                    let err = new Error("Unexpected socket close");
                    if (this.connection && this.connection._socket && this.connection._socket.upgrading) {
                        // starttls connection errors
                        err.code = "ETLS";
                    }
                    callback(err);
                }, 1000);
                try {
                    timer.unref();
                } catch (E) {
                // Ignore. Happens on envs with non-node timer implementation
                }
            });
            this.connection.connect(()=>{
                if (returned) {
                    return;
                }
                if (this.auth && (this.connection.allowsAuth || options.forceAuth)) {
                    this.connection.login(this.auth, (err)=>{
                        if (returned) {
                            return;
                        }
                        returned = true;
                        if (err) {
                            this.connection.close();
                            this.emit("error", err);
                            return callback(err);
                        }
                        this._connected = true;
                        callback(null, true);
                    });
                } else {
                    returned = true;
                    this._connected = true;
                    return callback(null, true);
                }
            });
        });
    }
    /**
     * Sends an e-mail to be sent using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */ send(mail, callback) {
        if (!this._connected) {
            return this.connect((err)=>{
                if (err) {
                    return callback(err);
                }
                return this.send(mail, callback);
            });
        }
        let envelope = mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
            recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info({
            tnx: "send",
            messageId,
            cid: this.id
        }, "Sending message %s using #%s to <%s>", messageId, this.id, recipients.join(", "));
        if (mail.data.dsn) {
            envelope.dsn = mail.data.dsn;
        }
        this.connection.send(envelope, mail.message.createReadStream(), (err, info)=>{
            this.messages++;
            if (err) {
                this.connection.close();
                this.emit("error", err);
                return callback(err);
            }
            info.envelope = {
                from: envelope.from,
                to: envelope.to
            };
            info.messageId = messageId;
            setImmediate(()=>{
                let err;
                if (this.messages >= this.options.maxMessages) {
                    err = new Error("Resource exhausted");
                    err.code = "EMAXLIMIT";
                    this.connection.close();
                    this.emit("error", err);
                } else {
                    this.pool._checkRateLimit(()=>{
                        this.available = true;
                        this.emit("available");
                    });
                }
            });
            callback(null, info);
        });
    }
    /**
     * Closes the connection
     */ close() {
        this._connected = false;
        if (this.auth && this.auth.oauth2) {
            this.auth.oauth2.removeAllListeners();
        }
        if (this.connection) {
            this.connection.close();
        }
        this.emit("close");
    }
}
module.exports = PoolResource;


/***/ }),

/***/ 4307:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const EventEmitter = __webpack_require__(2361);
const SMTPConnection = __webpack_require__(7753);
const wellKnown = __webpack_require__(3591);
const shared = __webpack_require__(2122);
const XOAuth2 = __webpack_require__(6784);
const packageData = __webpack_require__(3259);
/**
 * Creates a SMTP transport object for Nodemailer
 *
 * @constructor
 * @param {Object} options Connection options
 */ class SMTPTransport extends EventEmitter {
    constructor(options){
        super();
        options = options || {};
        if (typeof options === "string") {
            options = {
                url: options
            };
        }
        let urlData;
        let service = options.service;
        if (typeof options.getSocket === "function") {
            this.getSocket = options.getSocket;
        }
        if (options.url) {
            urlData = shared.parseConnectionUrl(options.url);
            service = service || urlData.service;
        }
        this.options = shared.assign(false, options, urlData, service && wellKnown(service) // wellknown options
        );
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "smtp-transport"
        });
        // temporary object
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP";
        this.version = packageData.version + "[client:" + connection.version + "]";
        if (this.options.auth) {
            this.auth = this.getAuth({});
        }
    }
    /**
     * Placeholder function for creating proxy sockets. This method immediatelly returns
     * without a socket
     *
     * @param {Object} options Connection options
     * @param {Function} callback Callback function to run with the socket keys
     */ getSocket(options, callback) {
        // return immediatelly
        return setImmediate(()=>callback(null, false));
    }
    getAuth(authOpts) {
        if (!authOpts) {
            return this.auth;
        }
        let hasAuth = false;
        let authData = {};
        if (this.options.auth && typeof this.options.auth === "object") {
            Object.keys(this.options.auth).forEach((key)=>{
                hasAuth = true;
                authData[key] = this.options.auth[key];
            });
        }
        if (authOpts && typeof authOpts === "object") {
            Object.keys(authOpts).forEach((key)=>{
                hasAuth = true;
                authData[key] = authOpts[key];
            });
        }
        if (!hasAuth) {
            return false;
        }
        switch((authData.type || "").toString().toUpperCase()){
            case "OAUTH2":
                {
                    if (!authData.service && !authData.user) {
                        return false;
                    }
                    let oauth2 = new XOAuth2(authData, this.logger);
                    oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
                    oauth2.on("token", (token)=>this.mailer.emit("token", token));
                    oauth2.on("error", (err)=>this.emit("error", err));
                    return {
                        type: "OAUTH2",
                        user: authData.user,
                        oauth2,
                        method: "XOAUTH2"
                    };
                }
            default:
                return {
                    type: (authData.type || "").toString().toUpperCase() || "LOGIN",
                    user: authData.user,
                    credentials: {
                        user: authData.user || "",
                        pass: authData.pass,
                        options: authData.options
                    },
                    method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || false
                };
        }
    }
    /**
     * Sends an e-mail using the selected settings
     *
     * @param {Object} mail Mail object
     * @param {Function} callback Callback function
     */ send(mail, callback) {
        this.getSocket(this.options, (err, socketOptions)=>{
            if (err) {
                return callback(err);
            }
            let returned = false;
            let options = this.options;
            if (socketOptions && socketOptions.connection) {
                this.logger.info({
                    tnx: "proxy",
                    remoteAddress: socketOptions.connection.remoteAddress,
                    remotePort: socketOptions.connection.remotePort,
                    destHost: options.host || "",
                    destPort: options.port || "",
                    action: "connected"
                }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
                // only copy options if we need to modify it
                options = shared.assign(false, options);
                Object.keys(socketOptions).forEach((key)=>{
                    options[key] = socketOptions[key];
                });
            }
            let connection = new SMTPConnection(options);
            connection.once("error", (err)=>{
                if (returned) {
                    return;
                }
                returned = true;
                connection.close();
                return callback(err);
            });
            connection.once("end", ()=>{
                if (returned) {
                    return;
                }
                let timer = setTimeout(()=>{
                    if (returned) {
                        return;
                    }
                    returned = true;
                    // still have not returned, this means we have an unexpected connection close
                    let err = new Error("Unexpected socket close");
                    if (connection && connection._socket && connection._socket.upgrading) {
                        // starttls connection errors
                        err.code = "ETLS";
                    }
                    callback(err);
                }, 1000);
                try {
                    timer.unref();
                } catch (E) {
                // Ignore. Happens on envs with non-node timer implementation
                }
            });
            let sendMessage = ()=>{
                let envelope = mail.message.getEnvelope();
                let messageId = mail.message.messageId();
                let recipients = [].concat(envelope.to || []);
                if (recipients.length > 3) {
                    recipients.push("...and " + recipients.splice(2).length + " more");
                }
                if (mail.data.dsn) {
                    envelope.dsn = mail.data.dsn;
                }
                this.logger.info({
                    tnx: "send",
                    messageId
                }, "Sending message %s to <%s>", messageId, recipients.join(", "));
                connection.send(envelope, mail.message.createReadStream(), (err, info)=>{
                    returned = true;
                    connection.close();
                    if (err) {
                        this.logger.error({
                            err,
                            tnx: "send"
                        }, "Send error for %s: %s", messageId, err.message);
                        return callback(err);
                    }
                    info.envelope = {
                        from: envelope.from,
                        to: envelope.to
                    };
                    info.messageId = messageId;
                    try {
                        return callback(null, info);
                    } catch (E) {
                        this.logger.error({
                            err: E,
                            tnx: "callback"
                        }, "Callback error for %s: %s", messageId, E.message);
                    }
                });
            };
            connection.connect(()=>{
                if (returned) {
                    return;
                }
                let auth = this.getAuth(mail.data.auth);
                if (auth && (connection.allowsAuth || options.forceAuth)) {
                    connection.login(auth, (err)=>{
                        if (auth && auth !== this.auth && auth.oauth2) {
                            auth.oauth2.removeAllListeners();
                        }
                        if (returned) {
                            return;
                        }
                        if (err) {
                            returned = true;
                            connection.close();
                            return callback(err);
                        }
                        sendMessage();
                    });
                } else {
                    sendMessage();
                }
            });
        });
    }
    /**
     * Verifies SMTP configuration
     *
     * @param {Function} callback Callback function
     */ verify(callback) {
        let promise;
        if (!callback) {
            promise = new Promise((resolve, reject)=>{
                callback = shared.callbackPromise(resolve, reject);
            });
        }
        this.getSocket(this.options, (err, socketOptions)=>{
            if (err) {
                return callback(err);
            }
            let options = this.options;
            if (socketOptions && socketOptions.connection) {
                this.logger.info({
                    tnx: "proxy",
                    remoteAddress: socketOptions.connection.remoteAddress,
                    remotePort: socketOptions.connection.remotePort,
                    destHost: options.host || "",
                    destPort: options.port || "",
                    action: "connected"
                }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
                options = shared.assign(false, options);
                Object.keys(socketOptions).forEach((key)=>{
                    options[key] = socketOptions[key];
                });
            }
            let connection = new SMTPConnection(options);
            let returned = false;
            connection.once("error", (err)=>{
                if (returned) {
                    return;
                }
                returned = true;
                connection.close();
                return callback(err);
            });
            connection.once("end", ()=>{
                if (returned) {
                    return;
                }
                returned = true;
                return callback(new Error("Connection closed"));
            });
            let finalize = ()=>{
                if (returned) {
                    return;
                }
                returned = true;
                connection.quit();
                return callback(null, true);
            };
            connection.connect(()=>{
                if (returned) {
                    return;
                }
                let authData = this.getAuth({});
                if (authData && (connection.allowsAuth || options.forceAuth)) {
                    connection.login(authData, (err)=>{
                        if (returned) {
                            return;
                        }
                        if (err) {
                            returned = true;
                            connection.close();
                            return callback(err);
                        }
                        finalize();
                    });
                } else if (!authData && connection.allowsAuth && options.forceAuth) {
                    let err = new Error("Authentication info was not provided");
                    err.code = "NoAuth";
                    returned = true;
                    connection.close();
                    return callback(err);
                } else {
                    finalize();
                }
            });
        });
        return promise;
    }
    /**
     * Releases resources
     */ close() {
        if (this.auth && this.auth.oauth2) {
            this.auth.oauth2.removeAllListeners();
        }
        this.emit("close");
    }
}
// expose to the world
module.exports = SMTPTransport;


/***/ }),

/***/ 5606:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const packageData = __webpack_require__(3259);
const shared = __webpack_require__(2122);
/**
 * Generates a Transport object for streaming
 *
 * Possible options can be the following:
 *
 *  * **buffer** if true, then returns the message as a Buffer object instead of a stream
 *  * **newline** either 'windows' or 'unix'
 *
 * @constructor
 * @param {Object} optional config parameter
 */ class StreamTransport {
    constructor(options){
        options = options || {};
        this.options = options || {};
        this.name = "StreamTransport";
        this.version = packageData.version;
        this.logger = shared.getLogger(this.options, {
            component: this.options.component || "stream-transport"
        });
        this.winbreak = [
            "win",
            "windows",
            "dos",
            "\r\n"
        ].includes((options.newline || "").toString().toLowerCase());
    }
    /**
     * Compiles a mailcomposer message and forwards it to handler that sends it
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */ send(mail, done) {
        // We probably need this in the output
        mail.message.keepBcc = true;
        let envelope = mail.data.envelope || mail.message.getEnvelope();
        let messageId = mail.message.messageId();
        let recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
            recipients.push("...and " + recipients.splice(2).length + " more");
        }
        this.logger.info({
            tnx: "send",
            messageId
        }, "Sending message %s to <%s> using %s line breaks", messageId, recipients.join(", "), this.winbreak ? "<CR><LF>" : "<LF>");
        setImmediate(()=>{
            let stream;
            try {
                stream = mail.message.createReadStream();
            } catch (E) {
                this.logger.error({
                    err: E,
                    tnx: "send",
                    messageId
                }, "Creating send stream failed for %s. %s", messageId, E.message);
                return done(E);
            }
            if (!this.options.buffer) {
                stream.once("error", (err)=>{
                    this.logger.error({
                        err,
                        tnx: "send",
                        messageId
                    }, "Failed creating message for %s. %s", messageId, err.message);
                });
                return done(null, {
                    envelope: mail.data.envelope || mail.message.getEnvelope(),
                    messageId,
                    message: stream
                });
            }
            let chunks = [];
            let chunklen = 0;
            stream.on("readable", ()=>{
                let chunk;
                while((chunk = stream.read()) !== null){
                    chunks.push(chunk);
                    chunklen += chunk.length;
                }
            });
            stream.once("error", (err)=>{
                this.logger.error({
                    err,
                    tnx: "send",
                    messageId
                }, "Failed creating message for %s. %s", messageId, err.message);
                return done(err);
            });
            stream.on("end", ()=>done(null, {
                    envelope: mail.data.envelope || mail.message.getEnvelope(),
                    messageId,
                    message: Buffer.concat(chunks, chunklen)
                }));
        });
    }
}
module.exports = StreamTransport;


/***/ }),

/***/ 3591:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const services = __webpack_require__(9493);
const normalized = {};
Object.keys(services).forEach((key)=>{
    let service = services[key];
    normalized[normalizeKey(key)] = normalizeService(service);
    [].concat(service.aliases || []).forEach((alias)=>{
        normalized[normalizeKey(alias)] = normalizeService(service);
    });
    [].concat(service.domains || []).forEach((domain)=>{
        normalized[normalizeKey(domain)] = normalizeService(service);
    });
});
function normalizeKey(key) {
    return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
}
function normalizeService(service) {
    let filter = [
        "domains",
        "aliases"
    ];
    let response = {};
    Object.keys(service).forEach((key)=>{
        if (filter.indexOf(key) < 0) {
            response[key] = service[key];
        }
    });
    return response;
}
/**
 * Resolves SMTP config for given key. Key can be a name (like 'Gmail'), alias (like 'Google Mail') or
 * an email address (like 'test@googlemail.com').
 *
 * @param {String} key [description]
 * @returns {Object} SMTP config or false if not found
 */ module.exports = function(key) {
    key = normalizeKey(key.split("@").pop());
    return normalized[key] || false;
};


/***/ }),

/***/ 6784:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";

const Stream = (__webpack_require__(2781).Stream);
const nmfetch = __webpack_require__(7199);
const crypto = __webpack_require__(6113);
const shared = __webpack_require__(2122);
/**
 * XOAUTH2 access_token generator for Gmail.
 * Create client ID for web applications in Google API console to use it.
 * See Offline Access for receiving the needed refreshToken for an user
 * https://developers.google.com/accounts/docs/OAuth2WebServer#offline
 *
 * Usage for generating access tokens with a custom method using provisionCallback:
 * provisionCallback(user, renew, callback)
 *   * user is the username to get the token for
 *   * renew is a boolean that if true indicates that existing token failed and needs to be renewed
 *   * callback is the callback to run with (error, accessToken [, expires])
 *     * accessToken is a string
 *     * expires is an optional expire time in milliseconds
 * If provisionCallback is used, then Nodemailer does not try to attempt generating the token by itself
 *
 * @constructor
 * @param {Object} options Client information for token generation
 * @param {String} options.user User e-mail address
 * @param {String} options.clientId Client ID value
 * @param {String} options.clientSecret Client secret value
 * @param {String} options.refreshToken Refresh token for an user
 * @param {String} options.accessUrl Endpoint for token generation, defaults to 'https://accounts.google.com/o/oauth2/token'
 * @param {String} options.accessToken An existing valid accessToken
 * @param {String} options.privateKey Private key for JSW
 * @param {Number} options.expires Optional Access Token expire time in ms
 * @param {Number} options.timeout Optional TTL for Access Token in seconds
 * @param {Function} options.provisionCallback Function to run when a new access token is required
 */ class XOAuth2 extends Stream {
    constructor(options, logger){
        super();
        this.options = options || {};
        if (options && options.serviceClient) {
            if (!options.privateKey || !options.user) {
                setImmediate(()=>this.emit("error", new Error('Options "privateKey" and "user" are required for service account!')));
                return;
            }
            let serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
            this.options.serviceRequestTimeout = serviceRequestTimeout || 5 * 60;
        }
        this.logger = shared.getLogger({
            logger
        }, {
            component: this.options.component || "OAuth2"
        });
        this.provisionCallback = typeof this.options.provisionCallback === "function" ? this.options.provisionCallback : false;
        this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token";
        this.options.customHeaders = this.options.customHeaders || {};
        this.options.customParams = this.options.customParams || {};
        this.accessToken = this.options.accessToken || false;
        if (this.options.expires && Number(this.options.expires)) {
            this.expires = this.options.expires;
        } else {
            let timeout = Math.max(Number(this.options.timeout) || 0, 0);
            this.expires = timeout && Date.now() + timeout * 1000 || 0;
        }
    }
    /**
     * Returns or generates (if previous has expired) a XOAuth2 token
     *
     * @param {Boolean} renew If false then use cached access token (if available)
     * @param {Function} callback Callback function with error object and token string
     */ getToken(renew, callback) {
        if (!renew && this.accessToken && (!this.expires || this.expires > Date.now())) {
            return callback(null, this.accessToken);
        }
        let generateCallback = (...args)=>{
            if (args[0]) {
                this.logger.error({
                    err: args[0],
                    tnx: "OAUTH2",
                    user: this.options.user,
                    action: "renew"
                }, "Failed generating new Access Token for %s", this.options.user);
            } else {
                this.logger.info({
                    tnx: "OAUTH2",
                    user: this.options.user,
                    action: "renew"
                }, "Generated new Access Token for %s", this.options.user);
            }
            callback(...args);
        };
        if (this.provisionCallback) {
            this.provisionCallback(this.options.user, !!renew, (err, accessToken, expires)=>{
                if (!err && accessToken) {
                    this.accessToken = accessToken;
                    this.expires = expires || 0;
                }
                generateCallback(err, accessToken);
            });
        } else {
            this.generateToken(generateCallback);
        }
    }
    /**
     * Updates token values
     *
     * @param {String} accessToken New access token
     * @param {Number} timeout Access token lifetime in seconds
     *
     * Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
     */ updateToken(accessToken, timeout) {
        this.accessToken = accessToken;
        timeout = Math.max(Number(timeout) || 0, 0);
        this.expires = timeout && Date.now() + timeout * 1000 || 0;
        this.emit("token", {
            user: this.options.user,
            accessToken: accessToken || "",
            expires: this.expires
        });
    }
    /**
     * Generates a new XOAuth2 token with the credentials provided at initialization
     *
     * @param {Function} callback Callback function with error object and token string
     */ generateToken(callback) {
        let urlOptions;
        let loggedUrlOptions;
        if (this.options.serviceClient) {
            // service account - https://developers.google.com/identity/protocols/OAuth2ServiceAccount
            let iat = Math.floor(Date.now() / 1000); // unix time
            let tokenData = {
                iss: this.options.serviceClient,
                scope: this.options.scope || "https://mail.google.com/",
                sub: this.options.user,
                aud: this.options.accessUrl,
                iat,
                exp: iat + this.options.serviceRequestTimeout
            };
            let token;
            try {
                token = this.jwtSignRS256(tokenData);
            } catch (err) {
                return callback(new Error("Can't generate token. Check your auth options"));
            }
            urlOptions = {
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: token
            };
            loggedUrlOptions = {
                grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                assertion: tokenData
            };
        } else {
            if (!this.options.refreshToken) {
                return callback(new Error("Can't create new access token for user"));
            }
            // web app - https://developers.google.com/identity/protocols/OAuth2WebServer
            urlOptions = {
                client_id: this.options.clientId || "",
                client_secret: this.options.clientSecret || "",
                refresh_token: this.options.refreshToken,
                grant_type: "refresh_token"
            };
            loggedUrlOptions = {
                client_id: this.options.clientId || "",
                client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
                refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
                grant_type: "refresh_token"
            };
        }
        Object.keys(this.options.customParams).forEach((key)=>{
            urlOptions[key] = this.options.customParams[key];
            loggedUrlOptions[key] = this.options.customParams[key];
        });
        this.logger.debug({
            tnx: "OAUTH2",
            user: this.options.user,
            action: "generate"
        }, "Requesting token using: %s", JSON.stringify(loggedUrlOptions));
        this.postRequest(this.options.accessUrl, urlOptions, this.options, (error, body)=>{
            let data;
            if (error) {
                return callback(error);
            }
            try {
                data = JSON.parse(body.toString());
            } catch (E) {
                return callback(E);
            }
            if (!data || typeof data !== "object") {
                this.logger.debug({
                    tnx: "OAUTH2",
                    user: this.options.user,
                    action: "post"
                }, "Response: %s", (body || "").toString());
                return callback(new Error("Invalid authentication response"));
            }
            let logData = {};
            Object.keys(data).forEach((key)=>{
                if (key !== "access_token") {
                    logData[key] = data[key];
                } else {
                    logData[key] = (data[key] || "").toString().substr(0, 6) + "...";
                }
            });
            this.logger.debug({
                tnx: "OAUTH2",
                user: this.options.user,
                action: "post"
            }, "Response: %s", JSON.stringify(logData));
            if (data.error) {
                // Error Response : https://tools.ietf.org/html/rfc6749#section-5.2
                let errorMessage = data.error;
                if (data.error_description) {
                    errorMessage += ": " + data.error_description;
                }
                if (data.error_uri) {
                    errorMessage += " (" + data.error_uri + ")";
                }
                return callback(new Error(errorMessage));
            }
            if (data.access_token) {
                this.updateToken(data.access_token, data.expires_in);
                return callback(null, this.accessToken);
            }
            return callback(new Error("No access token"));
        });
    }
    /**
     * Converts an access_token and user id into a base64 encoded XOAuth2 token
     *
     * @param {String} [accessToken] Access token string
     * @return {String} Base64 encoded token for IMAP or SMTP login
     */ buildXOAuth2Token(accessToken) {
        let authData = [
            "user=" + (this.options.user || ""),
            "auth=Bearer " + (accessToken || this.accessToken),
            "",
            ""
        ];
        return Buffer.from(authData.join("\x01"), "utf-8").toString("base64");
    }
    /**
     * Custom POST request handler.
     * This is only needed to keep paths short in Windows – usually this module
     * is a dependency of a dependency and if it tries to require something
     * like the request module the paths get way too long to handle for Windows.
     * As we do only a simple POST request we do not actually require complicated
     * logic support (no redirects, no nothing) anyway.
     *
     * @param {String} url Url to POST to
     * @param {String|Buffer} payload Payload to POST
     * @param {Function} callback Callback function with (err, buff)
     */ postRequest(url, payload, params, callback) {
        let returned = false;
        let chunks = [];
        let chunklen = 0;
        let req = nmfetch(url, {
            method: "post",
            headers: params.customHeaders,
            body: payload,
            allowErrorResponse: true
        });
        req.on("readable", ()=>{
            let chunk;
            while((chunk = req.read()) !== null){
                chunks.push(chunk);
                chunklen += chunk.length;
            }
        });
        req.once("error", (err)=>{
            if (returned) {
                return;
            }
            returned = true;
            return callback(err);
        });
        req.once("end", ()=>{
            if (returned) {
                return;
            }
            returned = true;
            return callback(null, Buffer.concat(chunks, chunklen));
        });
    }
    /**
     * Encodes a buffer or a string into Base64url format
     *
     * @param {Buffer|String} data The data to convert
     * @return {String} The encoded string
     */ toBase64URL(data) {
        if (typeof data === "string") {
            data = Buffer.from(data);
        }
        return data.toString("base64").replace(/[=]+/g, "") // remove '='s
        .replace(/\+/g, "-") // '+' → '-'
        .replace(/\//g, "_"); // '/' → '_'
    }
    /**
     * Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
     *
     * @param {Object} payload The payload to include in the generated token
     * @return {String} The generated and signed token
     */ jwtSignRS256(payload) {
        payload = [
            '{"alg":"RS256","typ":"JWT"}',
            JSON.stringify(payload)
        ].map((val)=>this.toBase64URL(val)).join(".");
        let signature = crypto.createSign("RSA-SHA256").update(payload).sign(this.options.privateKey);
        return payload + "." + this.toBase64URL(signature);
    }
}
module.exports = XOAuth2;


/***/ }),

/***/ 1564:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"dotenv","version":"16.3.1","description":"Loads environment variables from .env file","main":"lib/main.js","types":"lib/main.d.ts","exports":{".":{"types":"./lib/main.d.ts","require":"./lib/main.js","default":"./lib/main.js"},"./config":"./config.js","./config.js":"./config.js","./lib/env-options":"./lib/env-options.js","./lib/env-options.js":"./lib/env-options.js","./lib/cli-options":"./lib/cli-options.js","./lib/cli-options.js":"./lib/cli-options.js","./package.json":"./package.json"},"scripts":{"dts-check":"tsc --project tests/types/tsconfig.json","lint":"standard","lint-readme":"standard-markdown","pretest":"npm run lint && npm run dts-check","test":"tap tests/*.js --100 -Rspec","prerelease":"npm test","release":"standard-version"},"repository":{"type":"git","url":"git://github.com/motdotla/dotenv.git"},"funding":"https://github.com/motdotla/dotenv?sponsor=1","keywords":["dotenv","env",".env","environment","variables","config","settings"],"readmeFilename":"README.md","license":"BSD-2-Clause","devDependencies":{"@definitelytyped/dtslint":"^0.0.133","@types/node":"^18.11.3","decache":"^4.6.1","sinon":"^14.0.1","standard":"^17.0.0","standard-markdown":"^7.1.0","standard-version":"^9.5.0","tap":"^16.3.0","tar":"^6.1.11","typescript":"^4.8.4"},"engines":{"node":">=12"},"browser":{"fs":false}}');

/***/ }),

/***/ 9493:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"126":{"host":"smtp.126.com","port":465,"secure":true},"163":{"host":"smtp.163.com","port":465,"secure":true},"1und1":{"host":"smtp.1und1.de","port":465,"secure":true,"authMethod":"LOGIN"},"AOL":{"domains":["aol.com"],"host":"smtp.aol.com","port":587},"Bluewin":{"host":"smtpauths.bluewin.ch","domains":["bluewin.ch"],"port":465},"DebugMail":{"host":"debugmail.io","port":25},"DynectEmail":{"aliases":["Dynect"],"host":"smtp.dynect.net","port":25},"Ethereal":{"aliases":["ethereal.email"],"host":"smtp.ethereal.email","port":587},"FastMail":{"domains":["fastmail.fm"],"host":"smtp.fastmail.com","port":465,"secure":true},"Forward Email":{"aliases":["FE","ForwardEmail"],"domains":["forwardemail.net"],"host":"smtp.forwardemail.net","port":465,"secure":true},"GandiMail":{"aliases":["Gandi","Gandi Mail"],"host":"mail.gandi.net","port":587},"Gmail":{"aliases":["Google Mail"],"domains":["gmail.com","googlemail.com"],"host":"smtp.gmail.com","port":465,"secure":true},"Godaddy":{"host":"smtpout.secureserver.net","port":25},"GodaddyAsia":{"host":"smtp.asia.secureserver.net","port":25},"GodaddyEurope":{"host":"smtp.europe.secureserver.net","port":25},"hot.ee":{"host":"mail.hot.ee"},"Hotmail":{"aliases":["Outlook","Outlook.com","Hotmail.com"],"domains":["hotmail.com","outlook.com"],"host":"smtp-mail.outlook.com","port":587},"iCloud":{"aliases":["Me","Mac"],"domains":["me.com","mac.com"],"host":"smtp.mail.me.com","port":587},"Infomaniak":{"host":"mail.infomaniak.com","domains":["ik.me","ikmail.com","etik.com"],"port":587},"mail.ee":{"host":"smtp.mail.ee"},"Mail.ru":{"host":"smtp.mail.ru","port":465,"secure":true},"Maildev":{"port":1025,"ignoreTLS":true},"Mailgun":{"host":"smtp.mailgun.org","port":465,"secure":true},"Mailjet":{"host":"in.mailjet.com","port":587},"Mailosaur":{"host":"mailosaur.io","port":25},"Mailtrap":{"host":"smtp.mailtrap.io","port":2525},"Mandrill":{"host":"smtp.mandrillapp.com","port":587},"Naver":{"host":"smtp.naver.com","port":587},"One":{"host":"send.one.com","port":465,"secure":true},"OpenMailBox":{"aliases":["OMB","openmailbox.org"],"host":"smtp.openmailbox.org","port":465,"secure":true},"Outlook365":{"host":"smtp.office365.com","port":587,"secure":false},"OhMySMTP":{"host":"smtp.ohmysmtp.com","port":587,"secure":false},"Postmark":{"aliases":["PostmarkApp"],"host":"smtp.postmarkapp.com","port":2525},"qiye.aliyun":{"host":"smtp.mxhichina.com","port":"465","secure":true},"QQ":{"domains":["qq.com"],"host":"smtp.qq.com","port":465,"secure":true},"QQex":{"aliases":["QQ Enterprise"],"domains":["exmail.qq.com"],"host":"smtp.exmail.qq.com","port":465,"secure":true},"SendCloud":{"host":"smtp.sendcloud.net","port":2525},"SendGrid":{"host":"smtp.sendgrid.net","port":587},"SendinBlue":{"aliases":["Brevo"],"host":"smtp-relay.brevo.com","port":587},"SendPulse":{"host":"smtp-pulse.com","port":465,"secure":true},"SES":{"host":"email-smtp.us-east-1.amazonaws.com","port":465,"secure":true},"SES-US-EAST-1":{"host":"email-smtp.us-east-1.amazonaws.com","port":465,"secure":true},"SES-US-WEST-2":{"host":"email-smtp.us-west-2.amazonaws.com","port":465,"secure":true},"SES-EU-WEST-1":{"host":"email-smtp.eu-west-1.amazonaws.com","port":465,"secure":true},"Sparkpost":{"aliases":["SparkPost","SparkPost Mail"],"domains":["sparkpost.com"],"host":"smtp.sparkpostmail.com","port":587,"secure":false},"Tipimail":{"host":"smtp.tipimail.com","port":587},"Yahoo":{"domains":["yahoo.com"],"host":"smtp.mail.yahoo.com","port":465,"secure":true},"Yandex":{"domains":["yandex.ru"],"host":"smtp.yandex.ru","port":465,"secure":true},"Zoho":{"host":"smtp.zoho.com","port":465,"secure":true,"authMethod":"LOGIN"}}');

/***/ }),

/***/ 3259:
/***/ ((module) => {

"use strict";
module.exports = JSON.parse('{"name":"nodemailer","version":"6.9.4","description":"Easy as cake e-mail sending from your Node.js applications","main":"lib/nodemailer.js","scripts":{"test":"grunt --trace-warnings"},"repository":{"type":"git","url":"https://github.com/nodemailer/nodemailer.git"},"keywords":["Nodemailer"],"author":"Andris Reinman","license":"MIT-0","bugs":{"url":"https://github.com/nodemailer/nodemailer/issues"},"homepage":"https://nodemailer.com/","devDependencies":{"@aws-sdk/client-ses":"3.370.0","aws-sdk":"2.1417.0","bunyan":"1.8.15","chai":"4.3.7","eslint-config-nodemailer":"1.2.0","eslint-config-prettier":"8.8.0","grunt":"1.6.1","grunt-cli":"1.4.3","grunt-eslint":"24.3.0","grunt-mocha-test":"0.13.3","libbase64":"1.2.1","libmime":"5.2.1","libqp":"2.0.1","mocha":"10.2.0","nodemailer-ntlm-auth":"1.0.4","proxy":"1.0.2","proxy-test-server":"1.0.0","sinon":"15.2.0","smtp-server":"3.12.0"},"engines":{"node":">=6.0.0"}}');

/***/ })

};
;