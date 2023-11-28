"use strict";
exports.id = 963;
exports.ids = [963];
exports.modules = {

/***/ 9975:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ Carrossel)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(6786);
// EXTERNAL MODULE: ./node_modules/@splidejs/react-splide/dist/js/react-splide.esm.js
var react_splide_esm = __webpack_require__(491);
// EXTERNAL MODULE: ./node_modules/next/image.js
var next_image = __webpack_require__(2451);
var image_default = /*#__PURE__*/__webpack_require__.n(next_image);
// EXTERNAL MODULE: ./node_modules/@splidejs/react-splide/dist/css/splide-core.min.css
var splide_core_min = __webpack_require__(4797);
;// CONCATENATED MODULE: ./app/components/carrossel.json
const carrossel_namespaceObject = JSON.parse('[{"imageSrc":"/images/servico_resgate-aeromedico.jpg","altText":"Resgate aeromédico","title":"Resgate Aeromédico"},{"imageSrc":"/images/servico_remocao-ambulancia-particular.jpg","altText":"Remoção de pacientes","title":"Remoção de pacientes"},{"imageSrc":"/images/servico_ambulancia-cobertura-medica.jpg","altText":"Cobertura médica de eventos","title":"Cobertura médica de eventos"},{"imageSrc":"/images/servico_posto-medico-evento.jpg","altText":"Postos médicos","title":"Postos médicos"},{"imageSrc":"/images/servico_locacao-aluguel-ambulancia.jpg","altText":"Locação de ambulâncias","title":"Locação de ambulâncias"},{"imageSrc":"/images/banner-ambulancia-1.jpeg","altText":"Locação de ambulâncias","title":"Locação de ambulâncias"},{"imageSrc":"/images/banner-ambulancia-2.jpeg","altText":"Locação de ambulâncias","title":"Locação de ambulâncias"},{"imageSrc":"/images/banner-ambulancia-3.jpeg","altText":"Locação de ambulâncias","title":"Locação de ambulâncias"}]');
;// CONCATENATED MODULE: ./app/components/Carrossel.js
/* __next_internal_client_entry_do_not_use__ default auto */ 




function Carrossel() {
    return /*#__PURE__*/ jsx_runtime_.jsx(jsx_runtime_.Fragment, {
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(react_splide_esm/* Splide */.tv, {
            hasTrack: false,
            tag: "div",
            options: {
                type: "loop",
                pagination: false,
                autoplay: true,
                pauseOnHover: true,
                resetProgress: false
            },
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx(react_splide_esm/* SplideTrack */.Gj, {
                    children: carrossel_namespaceObject.map(({ imageSrc, altText, title }, index)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(react_splide_esm/* SplideSlide */.jw, {
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                                    src: imageSrc,
                                    width: 600,
                                    height: 300,
                                    alt: altText
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("h3", {
                                    children: title
                                })
                            ]
                        }, index))
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                    className: "splide__progress",
                    children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "splide__progress__bar"
                    })
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "splide__arrows",
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx("button", {
                            className: "splide__arrow splide__arrow--prev",
                            children: /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                                src: "/svg/botao-esquerda.svg",
                                width: 35,
                                height: 35,
                                alt: "Bot\xe3o Esquerda"
                            })
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx("button", {
                            className: "splide__arrow splide__arrow--next",
                            children: /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                                src: "/svg/botao-direita.svg",
                                width: 35,
                                height: 35,
                                alt: "Bot\xe3o Esquerda"
                            })
                        })
                    ]
                })
            ]
        })
    });
}


/***/ }),

/***/ 4492:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`C:\Users\ferna\Documents\Projetos\removip\app\components\Carrossel.js`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ })

};
;