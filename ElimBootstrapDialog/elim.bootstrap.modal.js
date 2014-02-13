(function (global, $) {
    "use strict";

    /*jshint undef:true */
    /*jshint unused:true */
    /*jshint maxparams:5 */
    /*jshint maxdepth:4 */

    function isKind(val, kind) {
        return '[object ' + kind + ']' === Object.prototype.toString.call(val);
    }

    function capitaliseFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    var currentBoxes = {},
        boxId = 0,
        useObjectCreate = typeof Object.create === 'function',
    buttons = {
        Ok: {
            value: 1,
            cssclass: 'btn-primary',
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
            cssclass: 'btn-primary',
            icon: null,
            action: 'yes',
            text: null
        },
        No: {
            value: 8,
            cssclass: 'btn-warning',
            icon: null,
            action: 'no',
            text: null
        },
        Close: {
            value: 16,
            cssclass: 'btn-primary',
            icon: null,
            action: 'close',
            text: null
        },
        Save: {
            value: 32,
            cssclass: 'btn-primary',
            icon: null,
            action: 'save',
            text: null
        },
        Delete: {
            value: 64,
            cssclass: 'btn-danger',
            icon: null,
            action: 'delete',
            text: null
        },
        Confirm: {
            value: 128,
            cssclass: 'btn-primary',
            icon: null,
            action: 'confirm',
            text: null
        }
    },
    BoxDefaults = {
        holderTemplate: '<div class="modal fade" role="dialog" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"></div></div></div>',
        headerTemplate: '<div class="modal-header"></div>',
        bodyTemplate: '<div class="modal-body"></div>',
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
        icon: 'icon-exclamation-sign',
        buttons: buttons.Ok.value,
        autoDestroy: true
    }),
        FSBoxDefaults = $.extend({}, BoxDefaults, {
            showX: false,
            backdrop: 'static',
            holdercss: 'model-fullscreen',
            buttons: 16
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

        this._id = makeId();
        this.id = _args[0] || this._id;

        this.withOptions(options)
            .withBody(message)
            .withTitle(title);

        this.el.modal({
            keyboard: false,
            show: this.options.show,
            backdrop: this.options.backdrop
        }).on('shown.bs.modal', function () {
            this.runHandler(this.handlers.shown, 'shown');
        }.bind(this))
        .on('hidden.bs.modal', function () {
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
                this.el = $(this.options.holderTemplate);
                this.el.find('div.modal-content')
                    .append(this.header = $(this.options.headerTemplate))
                    .append(this.body = $(this.options.bodyTemplate))
                    .append(this.footer = $(this.options.footerTemplate));

                //console.log('Dialog#Create',this.el);
                this.el.attr('id', this.id);

                this._createHeader(this.options.showX);

                //$(doc.body).append(this.el);
            }
            return this;
        },
        _createHeader: function (showX) {
            var el = this.header;
            el.empty();
            if (showX) {
                el.append($('<button class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'));
            }
            el.append($('<h4><i style="display:none;"></i><span></span></h4>'));

            return this;
        },
        withOptions: function (options) {
            if (options === null || options === undefined) { options = {}; }
            this.options = $.extend({}, BoxDefaults, this.options, options);
            this.handlers = this.options.handlers || {};
            delete this.options.handlers;
            this._CheckCreated();
            if (this.options.animate) { this.el.addClass('fade'); }
            else { this.el.removeClass('fade'); }
            if (typeof this.options.cssclass === 'string') { this.el.addClass(this.options.cssclass); }
            if (this.options.dialogcss) { this.body.addClass(this.options.dialogcss); }
            if (this.options.holdercss) { this.el.find('div.modal-dialog').addClass(this.options.holdercss); }
            
            return this
                .hasHeader(this.options.header)
                .hasFooter(this.options.footer)
                .withButtons(this.options.buttons);
        },
        on: function (name, ev) {
            var handler = this.handlers[name];
            if (handler === null || handler === undefined) handler = (this.handlers[name] = []);
            handler.push(ev);

            return this;
        },
        buttonMatchesFlag: function (itm, flag) {
            /*jslint bitwise: true */
            return (itm.value & flag) === itm.value;
        },
        getButtonMatchFromArray: function (items, btn) {
            var a = [], i = 0, len = items.length;
            for (i; i < len; i = (i + 1)) {
                if (this.buttonMatchesFlag(items[i], btn)) { a.push(items[i]); }
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
                        if (this.buttonMatchesFlag(itm, btn)) { a.push(itm); }
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
            for (; i < len; i = (i + 1)) {
                holder.append(this._createButton(items[i]));
            }
            holder.bind('click', 'button', function (e) {
                var btn = $(e.target), action = btn.attr('data-action'), cb = this.handlers[action], hideMe = false;
                e.preventDefault();
                if (cb) {
                    hideMe = this.runHandler(cb, action);
                } else { hideMe = true; }
                if (hideMe) { this.hide(); }
            }.bind(this));
        },
        _createButton: function (itm) {
            var btn = $(this.options.buttonTemplate);
            btn.html(itm.text || capitaliseFirstLetter(itm.action));
            btn.attr('data-action', itm.action);
            if (itm.cssclass) { btn.addClass(itm.cssclass); }
            if (itm.icon) { btn.append(this._createIcon(itm.icon)); }
            return btn;
        },
        _createIcon: function (icon) {
            return $('<i class="' + icon + '"></i>');
        },
        runHandler: function (value, action) {
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
            var holder = this.footer;
            holder.empty();
            if (buttons === 0) { return this.hasFooter(false); }

            if (typeof btn === 'number') {
                this._createButtons(holder, this._getButtonsByNumber(btn));
            } else {
                this._createButtons(holder, this._getButtons(btn));
            }

            return this;
        },
        withBody: function (str) {
            if (typeof str === 'string') {
                this.body.html(getString(str));
            } else {
                this.body.empty();
                this.body.append(str);
            }
            return this;
        },
        withTitle: function (str, options) {
            var holder = this.header;
            holder.find('h4>span').html(getString(str));
            if (options) {
                if (options.cssclass) {
                    holder.addClass(options.cssclass);
                }
            }
            if (this.options.icon) { holder.find('i').attr('class', this.options.icon).show(); }
            else { holder.find('i').hide(); }
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

            this.runHandler(this.handlers.destroy, 'destroy');
            //setTimeout(function () { this.runHandler('destroy'); }.bind(this), 1);

            this.el.data('modal', null);
            this.el.empty().remove();
            this.header = null;
            this.footer = null;
            this.body = null;
            this.el = null;
            this._destroyed = true;
            currentBoxes[this._id] = null;
            delete currentBoxes[this._id];
            //console.log('Dialog#Destroy');
        }
    };

    //var BoxHandler = function () { };

    //BoxHandler.prototype = {
    var BoxHandler = {
        _reg: function (itm) {
            currentBoxes[itm._id] = itm;
        },
        get: function (id) {
            var p;
            for (p in currentBoxes) {
                if (currentBoxes.hasOwnProperty(p) && currentBoxes[p].id === id) {
                    return currentBoxes[p];
                }
            }
            return null;
        },
        alert: function () {
            var _args = getArgumentsArray.apply(null, arguments);
            _args[3] = $.extend({}, AlertBoxDefaults, _args[3]);
            return this.dialog.apply(this, _args);
        },
        dialog: function () {
            var itm;
            if (useObjectCreate) {
                itm = this.dialogObjCreate(arguments);
            } else {
                itm = this._dialognoObjCreate(arguments);
            }

            this._reg(itm);
            return itm;
        },
        fs: function () {
            var _args = getArgumentsArray.apply(null, arguments),
                itm = null,
                sizeF = null;

            _args[3] = $.extend({}, FSBoxDefaults, _args[3]);
            sizeF = _args[3].sizeF || function () {
                var headHeight = itm.options.header ? itm.header.outerHeight() : 0,
                    footHeight = itm.options.footer ? itm.footer.outerHeight() : 0,
                    mainHeight = itm.el.find('.modal-content').outerHeight();

                itm.body.css('height', (mainHeight - (headHeight + footHeight)) + 'px');
            };

            itm = BoxHandler.dialog.apply(this, _args);
            
            $(global).on('resize', sizeF);
            itm.on('shown', sizeF);
            itm.on('destroy', function () { $(global).off('resize', sizeF); });

            return itm;
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
    global["elimbox"] = Box;
    global["elimboxes"] = BoxHandler;
    global["elimboxes"]["buttons"] = buttons;

})(this, this.$);
