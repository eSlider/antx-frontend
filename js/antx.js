Number.prototype.formatMoney = function(c, d, t){
    var n = this,
        c = isNaN(c = Math.abs(c)) ? 2 : c,
        d = d == undefined ? "." : d,
        t = t == undefined ? "," : t,
        s = n < 0 ? "-" : "",
        i = String(parseInt(n = Math.abs(Number(n) || 0).toFixed(c))),
        j = (j = i.length) > 3 ? j % 3 : 0;
    return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
};

var antx = window.antx = new function() {

    /**
     * API URL
     *
     * @type {string}
     */
    var url = "api.php";
    var antx = this;

    var ui = antx.ui = new function() {
        var ui = this;
        var frames = [];
        var frameHistory = [];

        /**
         * Show template
         *
         * @param template
         * @param options
         * @param data
         */
        ui.show = function(template, options, data) {
            frameHistory.push({
                template: template,
                options: options,
                data: data
            });

            webix.ui([template], $$("frameContainerBody"));

            ui.setupTopBar(_.get(options, "top", {}));
            ui.setupBottomBar(_.get(options, "bottom", {}));
        };

        /**
         * Setup top tool bar
         *
         * @param buttons
         * @param options
         */
        ui.setupTopBar = function(options) {
            var topToolBar = $$("topToolBar");
            var buttons = [];

            if(!_.isArray(buttons)) {
                buttons = []

            }
            var iconButton = {
                view:  "button",
                type:  "image",
                gravity:0.6,
                image: "assets/favicon/android-icon-36x36.png",
                click: function() {
                    ui.goHome();
                }
            };

            // Add icon at start
            if(_.get(options, "showLogo", true)) {
                buttons.splice(0, 0, iconButton);
            }

            // Option "icon" allows to replace icon with own settings with
            if(_.get(options, "icon", false)) {
                _.extend(iconButton, options.icon);
            }

            var title = _.get(options, "title", false);
                if(title) {
                    buttons.push({
                        gravity: 5,
                        view:     "template",
                        type:     "html",
                        template: title,
                        on:{
                            onAfterRender: function() {
                                $(this.getNode()).css({
                                    "border":           "none",
                                    "background-color": "transparent"
                                }).addClass("topTitle");
                            }
                        }
                    });
                }

            // Draw buttons
            webix.ui(buttons, topToolBar);

            if(_.get(options, "show", true)) {
                topToolBar.show();
            } else {
                topToolBar.hide();
            }
        };

        /**
         * User UI notification
         *
         * @param text
         */
        ui.notify = function(text) {
            webix.message({
                type: "info",
                text: text
            });
        };

        /**
         * Setup user PIN
         */
        ui.setupPin = function() {

            ui.show(ui.centerTemplate(ui.createForm([{
                view:    "text",
                label:   "Please enter PIN:",
                type:    "password",
                pattern: {
                    mask:  "####",
                    allow: /^\d+/g
                },
                on:      {
                    onAfterRender: function() {
                        $("input", this.getNode()).attr("maxlength", 4).focus()
                    }
                },
                name:    "pin1"

            }, {
                view:  "text",
                type:  "password",
                label: "And repeat the PIN",
                name:  "pin2",
                on:    {
                    onAfterRender: function() {
                        $("input", this.getNode()).attr("maxlength", 4);
                    }
                }
            }])), {
                bottom: {
                    right: [{
                        view:  "button",
                        value: "Save",
                        type:  "icon",
                        icon:  "save",
                        click: function() {
                            var appView = this.getTopParentView();
                            var containerView = appView.queryView({id: "frameContainerBody"});
                            var formView = containerView.queryView({type: "form"});
                            var pins = formView.getValues();
                            var pin = pins.pin1;

                            if(pin !== pins.pin2) {
                                ui.notify("Please give same PIN code");
                                return;
                            }

                            if(!pin.match(/^\d{4}$/)) {
                                ui.notify("Please setup 4 numbers");
                                return;
                            }

                            antx.user.setPin(pin);
                            ui.goHome();
                            return true;
                        }
                    }],
                    left:  [{
                        view:  "button",
                        type:  "icon",
                        icon:  "arrow-left",
                        value: "Back",
                        click: function() {
                            ui.goHome();
                        }
                    }]
                }
            });

        };

        /**
         * Center vertical and horizontal
         */
        ui.centerTemplate = function(template) {
            template.gravity = 4;
            return {
                rows: [{}, {
                    cols: [{}, template, {}]
                }, {}]
            };
        };

        /**
         * Create form
         *
         * @param elements array
         * @returns {{view: string, gravity: number, borderless: boolean, elementsConfig: {labelPosition: string}, elements: *}}
         */
        ui.createForm = function(elements, id) {
            elements = _.isArray(elements) ? elements : [elements];
            return {
                view:           "form",
                id:             id ? id : 'form',
                gravity:        4,
                borderless:     true,
                elementsConfig: {
                    labelPosition: 'top', // labelWidth:    100
                },
                elements:       elements
            };
        };

        ui.restoreAccount = function() {
            jQuery.ajax({
                url: "vendor/schmich/instascan/instascan.min.js",
                dataType: 'script',
                success: function(a,b,c) {
                    debugger;
                },
                async: true
            });
        };

        /**
         * Setup wizard
         *
         */
        ui.setupApplication = function() {
            ui.show(ui.centerTemplate({
                height:     500,
                view:       "template",
                src:        "templates/intro.html",
                borderless: true
            }), {
                top:    {
                    show: false
                },
                bottom: {
                    home:  false,
                    left:  [{
                        view:  "button",
                        type:  "icon",
                        label: "Language",
                        icon:  "language",
                        click: function() {
                            ui.setupLanguage();
                        }
                    }],
                    right: [{
                        view:  "button",
                        type:  "icon",
                        label: "Restore",
                        icon:  "camera",
                        click: function() {
                            ui.restoreAccount();
                        }
                    }, {
                        view:  "button",
                        label: "Setup",
                        icon:  "arrow-right",
                        type:  "icon",
                        click: function() {
                            ui.setupPin();
                        }
                    }]
                }
            });

            // webix.ui([{
            //     view:  "button",
            //     type:  "icon",
            //     label: "Language",
            //     icon:  "language",
            //     click: function() {
            //         antx.ui.setupLanguage();
            //     }
            // }], bottomToolBar);

            // bottomToolBar.show();
        };

        /**
         * Show wallet frame
         *
         * @param {int} id Wallet ID
         */
        ui.showWallet = function(id) {
            ui.show(ui.createForm([{
                template: "Buy",
                type:     "header"
            }, {
                view:  "text",
                value: '1',
                label: "Amount"
            }, {
                view:    "select",
                label:   "Buy shift",
                options: ["0%", "+/-2%", "+/-4%"]
            }, {
                view:    "select",
                label:   "Expire",
                options: ["never", "after one hour", "after a day"]
            }, {
                view:       "button",
                label:      "Ask for buy",
                inputWidth: 200,
                align:      "center"
            }

            ]), {
                top: {
                    title: id
                },
                bottom: {
                    left: [{
                        view:    "icon",
                        type:    "button",
                        click:   function() {
                            ui.showWallets()
                        },
                        icon:    "credit-card",
                        // gravity: 4
                    }]
                }
            });
        };

        ui.showHome = function() {
            antx.net.getCurrencies({limit: 4}, function(json) {
                var sum = _.sumBy(json, function(currency) {
                    return Math.round(currency.market_cap_usd);
                });

                var colors  = ["#375E97","#FB6542","#FFBB00","#3F681C"];
                var i= 0;
                _.each(json,function(item){
                    item.color = colors[i++];
                });

                sum = sum.formatMoney(2, '.', ',')+ " USD";

                ui.show({
                    rows: [{
                        id:           "sumPie",
                        view:         "chart",
                        type:         "pie",
                        value:        "#market_cap_usd#",
                        color:        "#color#", // label:        "#short#",
                        pieInnerText: "<span style='color:#fff; text-shadow: 2px 4px 3px rgba(0,0,0,0.3);'>#symbol#<br/><strong>#price_usd#$</strong></span>",
                        shadow:       1,
                        data:         json
                    }, ui.getHeader("Market cap " + sum)]
                }, {
                    top:    {
                        title: "Home"
                    },
                    bottom: {
                        home: false,
                        left: [{
                            view:    "icon",
                            type:    "button",
                            value:   "Wallets",
                            label:   "Wallets",
                            title:   "Wallets",
                            gravity:3,

                            click:   function() {
                                ui.showWallets()
                            },
                            icon:    "credit-card",
                            // gravity: 4
                        }, {
                            view:    "icon",
                            type:    "button",
                            value:   "Exchange",
                            click:   ui.showWallets(),
                            icon:    "exchange",
                            gravity: 4
                        }]
                    }
                });
            });
        };

        ui.iconButton = function(title, onClick, icon) {
            var button = {
                view: "icon",
                type: "button"
            };

            if(title) {
                button.value = title;
            }

            if(icon) {
                button.icon = icon;
            }

            if(onClick) {
                button.click = onClick;
            }

            return button;
        };

        ui.getHeader = function(html){
            return {
                template: "<div style='width:100%;text-align:center'>"+html+"</div>",
                height:   30
            }
        };

        ui.exchangeCurrency = function(options){
            var id = 0;

            ui.show(ui.createForm([{
                template: "Buy",
                type:     "header"
            }, {
                view:  "text",
                value: '1',
                label: "Amount"
            }, {
                view:    "select",
                label:   "Buy shift",
                options: ["0%", "+/-2%", "+/-4%"]
            }, {
                view:    "select",
                label:   "Expire",
                options: ["never", "after one hour", "after a day"]
            }, {
                view:       "button",
                label:      "Ask for buy",
                inputWidth: 200,
                align:      "center"
            }

            ]), {
                top: {
                    title: id
                },
                bottom: {
                    left: [{
                        view:    "icon",
                        type:    "button",
                        click:   function() {
                            ui.showWallets()
                        },
                        icon:    "credit-card",
                        // gravity: 4
                    }]
                }
            });
        };

        ui.removeCurrency = function(options) {

        };

        ui.showWallets = function() {
            ui.show({
                view:   "dataview",
                select: 1,
                css:    "wallets",
                type:   {
                    width:    261,
                    height:   90,
                    margin:   10,
                    template: "<div class='overall'><div class='title'>#blockChain# (#id#)</div><div class='amount'>#amount#</div></div>"
                },
                click:  function(id, event, dom) {
                    ui.showWallet(id);
                },
                data:   [{
                    blockChain: 'Antx$',
                    id:         "ANTX-USD",
                    amount:     115.3
                }, {
                    blockChain: 'Bitcoin',
                    id:         "BTC",
                    amount:     0.5
                }, {
                    blockChain: 'AntX',
                    id:         "ANTX",
                    amount:     0.5
                }, {
                    blockChain: 'Ethereum',
                    id:         "ETH",
                    amount:     2.3
                }]
            }, {
                top: {
                    title: "Wallets"
                }
            });

            $('#currencies').load('api.php?url=https://coinmarketcap.com/ #currencies');
        };

        /**
         * Switch to home.
         *
         * Decides which frame should be loaded depends on user status.
         */
        ui.goHome = function() {

            if(antx.user.hasPin()) {
                if(antx.user.isLogged() ) {
                    if(frameHistory.length){
                        ui.showHome();
                    }else{
                        ui.disable();
                        return webix.storage.local.put("location", location);

                    }
                } else {
                    ui.disable();
                }

            } else {
                ui.setupApplication();
            }
        };

        /**
         * Setup top bar buttons
         *
         * @param options -
         *  icon: icon settings
         *  show: show after set?
         */
        ui.setupBottomBar = function(options) {
            var buttons = [];
            var toolBar = $$("bottomToolBar");
            var leftButtons = _.get(options, 'left', false);
            var rightButtons = _.get(options, 'right', false);
            var homeButton = _.get(options, 'home', {
                view:  "icon",
                type:  "button",
                icon:  "home",
                value: "Home", // width: 100,
                click: function() {
                    ui.goHome();
                }
            });

            if(leftButtons) {
                _.each(leftButtons, function(button) {
                    buttons.push(button);
                });
            } else {
                buttons.push({});
            }

            buttons.push({gravity: 3});

            if(homeButton) {
                buttons.push(homeButton)
            }

            buttons.push({gravity: 3});

            if(rightButtons) {
                _.each(rightButtons, function(button) {
                    buttons.push(button);
                });
            } else {
                buttons.push({});
            }

            webix.ui(buttons, toolBar);

            if(_.get(options, "show", true)) {
                toolBar.show();
            }
        };

        /**
         * Show languge setup frame
         */
        ui.setupLanguage = function() {

            var form = ui.createForm([{
                view:    "select",
                align:   "right", // labelWidth: 100,
                options: [{
                    "id":    "en",
                    "value": "English"
                }, {
                    "id":    "ru",
                    "value": "Russian"
                }]
            }]);

            ui.show(ui.centerTemplate({
                rows: [{
                    template:   "<h1>Languge</h1>\n Please choose you  language:",
                    autoheight: true
                }, form]
            }), {
                bottom: {
                    right: [{
                        view:  "button",
                        type:  "icon",
                        icon:  "check",
                        label: "Save",
                        click: function() {
                            ui.goHome();
                        }
                    }]
                }
            });
        };

        /**
         * Show loading progress screen
         */
        ui.showProgress = function() {
            antx.ui.show({
                view: "template",
                src:  "templates/loadingInProgress.html"
            });
        };

        /**
         * Enable screen
         */
        ui.enable = function() {

        };

        /**
         * Disable screen with PIN input
         */
        ui.disable = function() {
            // $$("topToolBar").hide();
            $$("bottomToolBar").hide();
            return ui.show(ui.centerTemplate(ui.createForm([{
                template: "view",
                src:      "templates/big-logo.html"
            }, {
                view:  "text",
                type:  "password", // label: "Enter a PIN:",
                width: 100,
                on:    {
                    onEnter:function(){
                      debugger;
                    },
                    onAfterRender: function() {
                        var input = $("input", this.getNode());
                        input
                            .css({
                                "text-align": "center",
                                "font-size":  "24pt"
                            })
                            .attr("maxlength", 4)
                            .attr("placeholder", "PIN")
                            .on("input", function(e) {
                                var pin = input.val();
                                if(pin.length === 4 && antx.user.login(pin)) {
                                    ui.goHome();
                                }
                            })
                            .focus()
                    }
                }
            }])), {
                top:    {
                    show: false
                },
                bottom: {
                    show: false
                }
            });
        };
    };

    /**
     * User controller
     */
    var userController = antx.user = new function() {
        this.setPin = function(pin) {
            return webix.storage.local.put("pin", pin);
        };
        this.hasPin = function() {
            var pin = webix.storage.local.get("pin");
            return !!pin;
        };
        this.getPin = function() {
            return webix.storage.local.get("pin");
        };

        this.login = function(pin) {
            var savedPin = webix.storage.local.get("pin");
            var result = savedPin === pin;

            if(result) {
                webix.storage.local.put("userLoggedIn", true);
            }

            return result;
        };

        this.isLogged = function() {
            return webix.storage.local.get("userLoggedIn");
        };
    };

    /**
     * Network controller
     */
    var networkController = antx.net = new function(url) {
        this.query = function(uri, parameters) {
            return webix.ajax().post(url + uri, parameters, function(response) { //callback
                console.log(response);
                if(response) webix.message("Done"); else webix.message("Update Failed");
            });
        };

        /**
         * Get currencies from market cap
         * @param {Object} params
         */
        this.getCurrencies = function(params, onComplete) {
            var parameters = _.extend({
                limit: 10
            },params);

            return $.getJSON("https://api.coinmarketcap.com/v1/ticker/?" + $.param(parameters), function(json) {
                onComplete(json);
            })
        };


        var _loaded = {};
        /**
         * Load external JS once
         */
        this.loadOnce = function(url, parameters, onComplete) {
            var fullUrl = url + $.param(parameters);
            if(!_loaded[fullUrl]) {
                _loaded[fullUrl] = true;
                $.getJSON(fullUrl, function(json) {
                    onComplete(json);
                })
            } else {
                onComplete(json);
            }
        }
    };
};
webix.attachEvent("onRotate", function(orientation) {
    console.log("ROTATIONE: " + orientation);
});
//
webix.ready(function() {
    webix.ui({
        id:   "app",
        rows: [{
            view: "toolbar",
            id:   "topToolBar",
            cols: []
        }, {
            view:   "scrollview",
            id:     "frameContainer",
            scroll: "y",
            body:   {
                id:   "frameContainerBody",
                rows: []
            }
        }, {
            view: "toolbar",
            id:   "bottomToolBar",
            cols: []
        }]
    });

    // antx.ui.showProgress();
    antx.ui.goHome();
});