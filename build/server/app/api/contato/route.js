"use strict";
(() => {
var exports = {};
exports.id = 122;
exports.ids = [122];
exports.modules = {

/***/ 2081:
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),

/***/ 6113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 9523:
/***/ ((module) => {

module.exports = require("dns");

/***/ }),

/***/ 2361:
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ 7147:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 3685:
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ 5687:
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ 1808:
/***/ ((module) => {

module.exports = require("net");

/***/ }),

/***/ 2037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 1017:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 5477:
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ 2781:
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ 4404:
/***/ ((module) => {

module.exports = require("tls");

/***/ }),

/***/ 7310:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 3837:
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ 9796:
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ 6922:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  headerHooks: () => (/* binding */ headerHooks),
  originalPathname: () => (/* binding */ originalPathname),
  requestAsyncStorage: () => (/* binding */ requestAsyncStorage),
  routeModule: () => (/* binding */ routeModule),
  serverHooks: () => (/* binding */ serverHooks),
  staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),
  staticGenerationBailout: () => (/* binding */ staticGenerationBailout)
});

// NAMESPACE OBJECT: ./app/api/contato/route.js
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  POST: () => (POST)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(2394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(9692);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-kind.js
var route_kind = __webpack_require__(9513);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(9335);
// EXTERNAL MODULE: ./node_modules/nodemailer/lib/nodemailer.js
var nodemailer = __webpack_require__(4098);
// EXTERNAL MODULE: ./node_modules/dotenv/config.js
var config = __webpack_require__(66);
;// CONCATENATED MODULE: ./app/api/contato/route.js



async function POST(req) {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    const { nome, telefone, email, assunto, mensagem } = await req.json();
    // comentario
    const transporter = nodemailer.createTransport({
        // service: process.env.EMAIL_SERVICE,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        auth: {
            user: emailUser,
            pass: emailPass
        }
    });
    const mailOptions = {
        from: emailUser,
        to: emailUser,
        subject: `Contato | ${assunto}`,
        html: `
			<h1 style="padding: 10px; color: #EBEAEA; background-color: #9E2537; margin: 0">Contato</h1>
			<div style="background-color: #58141D; color: #EBEAEA; padding: 10px">
				<p>Nome: <strong>${nome}</strong></p>
				<p>Email: <strong>${email}</strong></p>
				<p>Telefone: <strong>${telefone}</strong></p>
				<p style="text-align: justify">Mensagem: <strong>${mensagem}</strong></p>
			</div>
		`
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("E-mail enviado com sucesso:", info.response);
        return next_response/* default */.Z.json({
            status: 200,
            message: "E-mail enviado com sucesso"
        });
    } catch (error) {
        console.error("Erro ao enviar e-mail:", error);
        return next_response/* default */.Z.json({
            status: 500,
            message: "Erro ao enviar e-mail"
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fcontato%2Froute&name=app%2Fapi%2Fcontato%2Froute&pagePath=private-next-app-dir%2Fapi%2Fcontato%2Froute.js&appDir=C%3A%5CUsers%5Cferna%5CDocuments%5CProjetos%5Cremovip%5Capp&appPaths=%2Fapi%2Fcontato%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

// @ts-ignore this need to be imported from next/dist to be external


// @ts-expect-error - replaced by webpack/turbopack loader

const AppRouteRouteModule = app_route_module.AppRouteRouteModule;
// We inject the nextConfigOutput here so that we can use them in the route
// module.
const nextConfigOutput = ""
const routeModule = new AppRouteRouteModule({
    definition: {
        kind: route_kind.RouteKind.APP_ROUTE,
        page: "/api/contato/route",
        pathname: "/api/contato",
        filename: "route",
        bundlePath: "app/api/contato/route"
    },
    resolvedPagePath: "C:\\Users\\ferna\\Documents\\Projetos\\removip\\app\\api\\contato\\route.js",
    nextConfigOutput,
    userland: route_namespaceObject
});
// Pull out the exports that we need to expose from the module. This should
// be eliminated when we've moved the other routes to the new format. These
// are used to hook into the route.
const { requestAsyncStorage , staticGenerationAsyncStorage , serverHooks , headerHooks , staticGenerationBailout  } = routeModule;
const originalPathname = "/api/contato/route";


//# sourceMappingURL=app-route.js.map

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [478,828], () => (__webpack_exec__(6922)));
module.exports = __webpack_exports__;

})();