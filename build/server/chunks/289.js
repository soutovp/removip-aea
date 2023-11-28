exports.id = 289;
exports.ids = [289];
exports.modules = {

/***/ 6661:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 1232, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 2987, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 831, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 6926, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 4282, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 6505, 23))

/***/ }),

/***/ 9269:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 3380, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 2503));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 4751))

/***/ }),

/***/ 2786:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Atendimento)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_image__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2451);
/* harmony import */ var next_image__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_image__WEBPACK_IMPORTED_MODULE_1__);
/* __next_internal_client_entry_do_not_use__ default auto */ 

// import atendimento from '../styles/components/atendimento.module.sass'
/**
 *
 * São botões dentro da página que levam o usuário para o whatsapp e para ligação por telefone.
 */ function Atendimento({ className = null }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: `${className}`,
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                href: "https://whatsa.me/5521970769075/?t=Ol%C3%A1",
                target: "_blank",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", {
                    tabIndex: -1,
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("strong", {
                            children: "PE\xc7A AGORA"
                        }),
                        " VIA WHATSAPP"
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_image__WEBPACK_IMPORTED_MODULE_1___default()), {
                src: "/svg/ambulancia.svg",
                width: 50,
                height: 50,
                alt: "Icone ambul\xe2ncia"
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                href: "tel:+5521970769075",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("button", {
                    tabIndex: -1,
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("strong", {
                            children: "PE\xc7A AGORA"
                        }),
                        " POR TELEFONE"
                    ]
                })
            })
        ]
    });
}


/***/ }),

/***/ 2503:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Header)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_image__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2451);
/* harmony import */ var next_image__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_image__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(8038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(1440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _styles_components_header_module_sass__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(4490);
/* harmony import */ var _styles_components_header_module_sass__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_styles_components_header_module_sass__WEBPACK_IMPORTED_MODULE_4__);
/* __next_internal_client_entry_do_not_use__ default auto */ 




function Header() {
    const [menuInfo, setMenuInfo] = (0,react__WEBPACK_IMPORTED_MODULE_2__.useState)({
        mobile: false,
        showHide: "translateX(0px)"
    });
    const updateMenuInfo = (novosValores)=>{
        setMenuInfo((prevMenuInfo)=>({
                ...prevMenuInfo,
                ...novosValores
            }));
    };
    const hamburger = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
    const menu = (0,react__WEBPACK_IMPORTED_MODULE_2__.useRef)(null);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        const handleResize = ()=>{
            setMenuInfo((prevMenuInfo)=>({
                    ...prevMenuInfo,
                    mobile: window.innerWidth <= 768
                }));
        };
        window.addEventListener("resize", handleResize);
        handleResize(); // Estado inicial
        return ()=>{
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        const handleResize = ()=>{
            updateMenuInfo({
                mobile: window.innerWidth <= 768
            });
        };
        window.addEventListener("resize", handleResize);
        handleResize(); // Estado inicial
        return ()=>{
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    (0,react__WEBPACK_IMPORTED_MODULE_2__.useEffect)(()=>{
        if (!menuInfo.mobile) {
            updateMenuInfo({
                showHide: "translateX(0px)"
            });
            hamburger.current.style.display = "none";
        } else {
            updateMenuInfo({
                showHide: "translateX(-100%)"
            });
            hamburger.current.style.display = "block";
        }
    }, [
        menuInfo.mobile
    ]);
    function openMenu() {
        if (menuInfo.mobile) {
            updateMenuInfo({
                showHide: menuInfo.showHide === "translateX(0px)" ? "translateX(-100%)" : "translateX(0px)"
            });
        }
    }
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                ref: hamburger,
                className: (_styles_components_header_module_sass__WEBPACK_IMPORTED_MODULE_4___default().hamburger),
                onClick: openMenu,
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("svg", {
                    width: "32px",
                    height: "32px",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    xmlns: "http://www.w3.org/2000/svg",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                            d: "M20 7L4 7",
                            stroke: "#791B28",
                            strokeWidth: "1.5",
                            strokeLinecap: "round"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                            d: "M20 12L4 12",
                            stroke: "#791B28",
                            strokeWidth: "1.5",
                            strokeLinecap: "round"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                            d: "M20 17L4 17",
                            stroke: "#791B28",
                            strokeWidth: "1.5",
                            strokeLinecap: "round"
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: (_styles_components_header_module_sass__WEBPACK_IMPORTED_MODULE_4___default().menu),
                ref: menu,
                style: {
                    transform: menuInfo.showHide
                },
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                    className: "headerNav widthLimitation",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                src: "/images/removiplogo.png",
                                alt: "Logo da Removip"
                            })
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {
                                            className: "headerActiveLink",
                                            href: "/",
                                            onClick: openMenu,
                                            children: "Home"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {
                                            href: "sobre",
                                            onClick: openMenu,
                                            children: "Sobre"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {
                                            href: "servicos",
                                            onClick: openMenu,
                                            children: "Servi\xe7os"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_3___default()), {
                                            href: "contato",
                                            onClick: openMenu,
                                            children: "Contato"
                                        })
                                    })
                                ]
                            })
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                                className: "headerRedes",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                                            href: "https://www.instagram.com/removip_/",
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                                src: "/svg/instagram.svg",
                                                width: 32,
                                                height: 32,
                                                alt: "Link para o Instagram"
                                            })
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("a", {
                                            href: "https://whatsa.me/5521970769075/?t=Ol%C3%A1",
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                                src: "/svg/whatsapp.svg",
                                                width: 32,
                                                height: 32,
                                                alt: "Link para o Whatsapp"
                                            })
                                        })
                                    })
                                ]
                            })
                        })
                    ]
                })
            })
        ]
    });
}


/***/ }),

/***/ 3270:
/***/ ((module) => {

// Exports
module.exports = {
	"aberto": "aberto_aberto__RHpdw"
};


/***/ }),

/***/ 6752:
/***/ ((module) => {

// Exports
module.exports = {
	"sessaoBanner": "banner_sessaoBanner__Bwmht"
};


/***/ }),

/***/ 2923:
/***/ ((module) => {

// Exports
module.exports = {
	"footer": "footer_footer__m0e8A"
};


/***/ }),

/***/ 4490:
/***/ ((module) => {

// Exports
module.exports = {
	"hamburger": "header_hamburger__r7kfZ",
	"menu": "header_menu__EuiGs",
	"headerActiveLink": "header_headerActiveLink__6rCyj"
};


/***/ }),

/***/ 4104:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (/* binding */ Aberto)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _styles_components_aberto_module_sass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(3270);
/* harmony import */ var _styles_components_aberto_module_sass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_components_aberto_module_sass__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Atendimento 24h

 * removip@removip.com.br

 * (21)3042-2666
 */ function Aberto({ className = null }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: `${(_styles_components_aberto_module_sass__WEBPACK_IMPORTED_MODULE_1___default().aberto)} ${className}`,
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                children: "Atendimento 24h"
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                children: "removip@removip.com.br"
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                children: "(21)3040-2666"
            })
        ]
    });
}


/***/ }),

/***/ 6063:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`C:\Users\ferna\Documents\Projetos\removip\app\components\Atendimento.js`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ }),

/***/ 5968:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (/* binding */ Banner)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _styles_components_banner_module_sass__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(6752);
/* harmony import */ var _styles_components_banner_module_sass__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_styles_components_banner_module_sass__WEBPACK_IMPORTED_MODULE_1__);


function Banner({ className = null, alt, img }) {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
            className: `${(_styles_components_banner_module_sass__WEBPACK_IMPORTED_MODULE_1___default().sessaoBanner)} ${className}`,
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            tabIndex: -1
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                                src: `/images/${img}.jpg`,
                                alt: alt
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("img", {
                        src: "/svg/frase-efeito-removip.svg",
                        alt: "Sua tranquilidade em boas m\xe3os.",
                        width: 781,
                        height: 297
                    })
                })
            ]
        })
    });
}


/***/ }),

/***/ 3675:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ RootLayout),
  metadata: () => (/* binding */ metadata)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(6786);
// EXTERNAL MODULE: ./app/styles/style.sass
var style = __webpack_require__(2137);
// EXTERNAL MODULE: ./app/styles/components/footer.module.sass
var footer_module = __webpack_require__(2923);
var footer_module_default = /*#__PURE__*/__webpack_require__.n(footer_module);
// EXTERNAL MODULE: ./node_modules/next/image.js
var next_image = __webpack_require__(4178);
var image_default = /*#__PURE__*/__webpack_require__.n(next_image);
;// CONCATENATED MODULE: ./app/components/Footer.js



function Footer() {
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("footer", {
        className: (footer_module_default()).footer,
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("aside", {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("img", {
                                src: "/images/removiplogo.png",
                                alt: "Logo da Removip"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                children: "A removip \xe9 uma empresa especializada em loca\xe7\xe3o de ambul\xe2cias, remo\xe7\xe3o de pacientes e cobertura m\xe9dica de eventos"
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("hr", {}),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("aside", {
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: "Rua Jo\xe3o Torquato, 248"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: "Bomsucesso - Rio de Janeiro - RJ"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: "CEP 21032-150"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: "removip@removip.com.br"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        children: "(21)3040-2666"
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                        children: [
                            "desenvolvido por ",
                            /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                children: /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                    href: "https://aeaagencia.com/",
                                    target: "_blank",
                                    children: "a&a ag\xeancia criativa"
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("a", {
                        href: "https://aeaagencia.com/",
                        target: "_blank",
                        children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                            children: /*#__PURE__*/ jsx_runtime_.jsx((image_default()), {
                                src: "/svg/logo-a-e-a.svg",
                                width: 30,
                                height: 30,
                                alt: "Logo da ag\xeancia A&A"
                            })
                        })
                    })
                ]
            })
        ]
    });
}

// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(1363);
;// CONCATENATED MODULE: ./app/components/Header.js

const proxy = (0,module_proxy.createProxy)(String.raw`C:\Users\ferna\Documents\Projetos\removip\app\components\Header.js`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const Header = (__default__);
// EXTERNAL MODULE: ./node_modules/react-toastify/dist/react-toastify.esm.mjs
var react_toastify_esm = __webpack_require__(1569);
// EXTERNAL MODULE: ./node_modules/react-toastify/dist/ReactToastify.css
var ReactToastify = __webpack_require__(7001);
;// CONCATENATED MODULE: ./app/layout.js






const metadata = {
    title: "Removip - Home",
    description: "Servi\xe7o de ambul\xe2ncia particular para atendimentos, remo\xe7\xf5es, altas e exames emergenciais.",
    keywords: ""
};
function RootLayout({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("html", {
        lang: "pt-br",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("body", {
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx("header", {
                    children: /*#__PURE__*/ jsx_runtime_.jsx(Header, {})
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("main", {
                    children: children
                }),
                /*#__PURE__*/ jsx_runtime_.jsx(Footer, {}),
                /*#__PURE__*/ jsx_runtime_.jsx(react_toastify_esm/* ToastContainer */.Ix, {
                    position: "bottom-right",
                    autoClose: false,
                    closeOnClick: true
                })
            ]
        })
    });
}


/***/ }),

/***/ 2137:
/***/ (() => {



/***/ })

};
;