(function (doc, $) {
    "use strict";

    /*jshint undef:true */
    /*jshint unused:true */
    /*jshint maxparams:5 */
    /*jshint maxdepth:4 */

    function isKind(val, kind) {
        return '[object ' + kind + ']' === Object.prototype.toString.call(val);
    }

    var currentBoxes = [], boxId = 0, defaultLocale = 'en', useObjectCreate = typeof Object.create === 'function',
    txt = {
        'en': {
            'ok': 'Ok',
            'cancel' : 'Cancel',
            'save' : 'Save',
            'delete' : 'Delete',
            'confirm': 'Confirm',
            'yes': 'Yes',
            'no' : 'No'
        }
    }, buttons = {
        Ok: {
            value: 1,
            cssclass: '',
            icon: null,
            action: 'ok',
            text: null
        },
        Cancel: {
            value: 2,
            cssclass: 'btn-warning',
            icon: null,
            action: 'cancel',
            text: null
        },
        Yes: {
            value: 4,
            cssclass: '',
            icon: null,
            action: 'yes',
            text: null
        },
        No: {
            value: 8,
            cssclass: '',
            icon: null,
            action: 'no',
            text: null
        },
        Close:  {
            value: 16,
            cssclass: '',
            icon: null,
            action: 'close',
            text: null
        },
        Save:  {
            value: 32,
            cssclass: '',
            icon: null,
            action: 'save',
            text: null
        },
        Delete:  {
            value: 64,
            cssclass: '',
            icon: null,
            action: 'delete',
            text: null
        },
        Confirm: {
            value: 128,
            cssclass: '',
            icon: null,
            action: 'confirm',
            text: null
        }
    },
    BoxDefaults = {
        holderTemplate: '<div class="modal hide"></div>',
        headerTemplate: '<div class="modal-header"></div>',
        footerTemplate: '<div class="modal-footer"></div>',
        buttonTemplate: '<button type="button" class="btn"/>',
        icon: null,
        header: true,
        footer: true,
        backdrop: true,
        animate: true,
        showX: true,
        show: false,
        autoDestroy: true,
        width: null,
        height: null,
        locale: 'en',
        buttons: buttons.Ok.value
    },
    AlertBoxDefaults = $.extend({}, BoxDefaults, {
        icon: 'icon-alert',
        buttons: buttons.Ok.value,
        autoDestroy: true
    });

    buttons.OkCancel = [buttons.Ok, buttons.Cancel];
    buttons.YesNo = [buttons.Yes, buttons.No];
    buttons.SaveCancel = [buttons.Save, buttons.Cancel];

    function makeId() {
        return 'box-' + (++boxId);
    }

    function getString(str) {
        if (typeof str === 'function') { return str(); }
        else { return str; }
    }

    function getArgumentsArray() {
        var id = null, title, message, options;
        
        switch (arguments.length) {
            case 1:
                options = arguments[0];
                title = options.title || '';
                message = options.message || '';
                delete options.title;
                delete options.message;
                break;
            case 2:
                title = arguments[0];
                message = arguments[1];
                options = {};
                break;
            case 3:
                title = arguments[0];
                message = arguments[1];
                options = arguments[2];
                break;
            case 4:
                id = arguments[0];
                title = arguments[1];
                message = arguments[2];
                options = arguments[3];
                break;
            default:
                throw new Error("Invalid arguments length");
        }
        return [id, title, message, options];
    }

    function Box() {

        var _args = getArgumentsArray.apply(null, arguments), title = _args[1], message = _args[2], options = _args[3];

        this.id = _args[0];
        if (!this.id || this.id === '') { this.id = makeId(); }

        this.withOptions(options)
            .withBody(message)
            .withTitle(title);

        this.el.modal({
            keyboard: false,
            show: this.options.show,
            backdrop : this.options.backdrop
        }).on('shown', function () {
            this.runHandler(this.handlers.shown, 'shown');
        }.bind(this))
        .on('hidden', function () {
            this.runHandler(this.handlers.hidden, 'hidden');
            if (this.options.autoDestroy) {
                this.destroy();
            }
        }.bind(this));

        return this;
    }

    Box.prototype = {
        constructor: Box,
        id: null,
        handlers: {},
        footer: null,
        header: null,
        body: null,
        _destroyed: false,
        _CheckCreated: function () {
            if (this.el === null || this.el === undefined) {
                this.el = $(this.options.holderTemplate)
                    .append(this.header = $(this.options.headerTemplate))
                    .append(this.body = $('<div class="modal-body box-area"></div>'))
                    .append(this.footer = $(this.options.footerTemplate));

                this.el.attr('id', this.id);

                this._createHeader(this.options.showX);

                $(doc.body).append(this.el);
            }
            return this;
        },
        _createHeader: function (showX) {
            var el = this.header;
            el.empty();
            if (showX) {
                el.append($('<button class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'));
            }
            el.append($('<h4></h4>'));

            return this;
        },
        withOptions: function (options) {
            if (options === null || options === undefined) { options = {}; }
            this.options = $.extend({}, BoxDefaults, this.options, options);
            this.handlers = this.options.handlers || {};
            delete this.options.handlers;
            this._CheckCreated();
            if (this.options.animate) { this.el.addClass('fade'); }
            else { this.el.removeClass('fade');}
            return this
                .hasHeader(this.options.header)
                .hasFooter(this.options.footer)
                .withButtons(this.options.buttons);
        },
        buttonMatchesFlag: function (itm, flag) {
            return itm.value & flag === itm.value;
        },
        getButtonMatchFromArray: function (items, btn) {
            var a = [], i=0, len = items.length;
            for (i; i < len; i = (i + 1)) {
                if (this.buttonMatchesFlag(items[i], btn)) { a.push(items[i]);}
            }
            return a;
        },
        _getButtonsByNumber: function (btn) {
            var a = [], itm, prop;
            for (prop in buttons) {
                if (buttons.hasOwnProperty(prop)) {
                    itm = buttons[prop];
                    if (isKind(itm, 'Array')) {
                        a.concat(this.getButtonMatchFromArray(itm, btn));
                    } else {
                        if (this.buttonMatchesFlag(itm, btn)) { a.push(itm);}
                    }
                }
            }
            return a;
        },
        _getButtons: function (items) {
            if (isKind(items, 'Array')) { return items; }

            return [items];
        },
        _createButtons: function (holder, items) {
            var i = 0, len = items.length;
            for (i; i < len; i = (i + 1)) {
                holder.append(this._createButton(items[i]));
            }
            holder.bind('click', 'button', function (e) {
                var btn = $(e.target), action = btn.attr('data-action'), cb = this.handlers[action], hideMe = false;
                e.preventDefault();
                if (cb) {
                    hideMe = this.runHandler(cb, action);
                } else { hideMe = true; }
                if (hideMe) { this.hide();}
            }.bind(this));
        },
        _createButton: function (itm) {
            var btn = $(this.options.buttonTemplate);
            btn.html(itm.Text || itm.action);
            btn.attr('data-action', itm.action);
            if (itm.cssclass) { btn.addClass(itm.cssclass); }
            if (itm.icon) { btn.append(this._createIcon(itm.icon)); }
            return btn;
        },
        _createIcon: function (icon) {
            return $('<i class="'+icon+'"></i>');
        },
        runHandler: function (value, action)
        {
            var returnValue = false, i = 0, len;
            if (!value) { return returnValue; }
            len = value.length;
            for (i; i < len; i = (1 + 1)) {
                returnValue = value[i](this, action);
                if (returnValue) { break; }
            }
            return returnValue;
        },
        withButtons: function (btn) {
            var holder = this.footer, prop;
            holder.empty();
            if (buttons === 0) { return this.hasFooter(false);}
            
            if (typeof btn === 'number') {
                this._createButtons(holder, this._getButtonsByNumber(btn));
            } else {
                this._createButtons(holder, this._getButtons(btn));
            }

            return this;
        },
        withBody: function (str) {
            this.body.html(getString(str));
            return this;
        },
        withTitle: function (str, options) {
            var holder = this.header;
            holder.find('h4').html(getString(str));
            if (options) {
                if (options.cssclass) {
                    holder.addClass(options.cssclass);
                }
            }
            return this;
        },
        hasHeader: function (show) {
            this.options.header = show;
            if (show) { this.header.show(); }
            else { this.header.hide(); }
            return this;
        },
        hasFooter: function (show) {
            this.options.footer = show;
            if (show) { this.footer.show(); }
            else { this.footer.hide(); }
            return this;
        },
        show: function () {
            this.el.modal('show');
            return this;
        },
        hide: function () {
            if (this.el !== null) { this.el.modal('hide'); }
            return this;
        },
        destroy: function () {
            this.hide();
            if (this._destroyed) { return; }
            this.el.data('modal', null);
            this.el.empty().remove();
            this.header = null;
            this.footer = null;
            this.body = null;
            this.el = null;
            this._destroyed = true;
        }
    };

    var BoxHandler = function () {};

    BoxHandler.prototype = {
        alert: function () {
            var _args = getArgumentsArray.apply(null, arguments);
            _args[3] = $.extend({}, AlertBoxDefaults, _args[3]);
            return this.dialog.apply(this, _args);
        },
        dialog: function () {
            if (useObjectCreate) {
                return this.dialogObjCreate(arguments);
            } else {
                return this._dialognoObjCreate(arguments);
            }
        },
        dialogObjCreate: function (val) {
            var instance = Object.create(Box.prototype);
            return instance.constructor.apply(instance, val);
        },
        _dialognoObjCreate: function (val) {
            var D = function () { }, instance;
            D.prototype = Box.prototype;
            instance = new D();
            Box.apply(instance, val);
            return instance;
        }
    };

    /*jshint sub:true */
    window["elimbox"] = Box;
    window["elimboxes"] = new BoxHandler();
    window["elimboxes"]["buttons"] = buttons;

})(document, window.jQuery);