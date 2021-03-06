//  Copyright (c) 2014-2015 Thomas Baker
//  
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//  
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//  
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
"use strict";

;
(function ($, window, document, undefined) {

    function view() {
        this.pageSet = {}; // Collection of all active pages
        this.pageStack = []; // Page navigation stack
        this.controlSet = {};
        //this.loadFormArray = [];
        //this.savedFormArray = [];
    };

    view.prototype.init = function (options) {
        //console.log("jqm-view init");

        // Connect to Backbone View events
        _.extend(this, Backbone.Events);

        // Set events
        $("#reset-dialog input[value='ok']").on("click", this.onResetOK.bind(this));
        $("#reset-dialog input[value='cancel']").on("click", this.onResetCancel.bind(this));

        this.on("navigate", this.changePage.bind(this));

        // Add all of the static pages
        var pageObj = this.getPage("mainPage");
        var name = "page-home";
        var page = new pageObj({"name": name});
        this.addPage(name, page);
        this.pageStack.push(this.pageSet["page-home"]);
        
        // add menu to home page
        var homePage = page.$el;
        var menu = homePage.find("#header-menu-list");
        if (menu) {
            var menuList = app.config["mainMenu"];
            for (var i = 0; i < menuList.length; i++) {
                var menuItem = menuList[i];
                menu.append('<li><a id="link-button" link="' + menuItem["page"] + '">' + menuItem["name"] + '</a>');
            }
        }
        //page.setEvents();
    };

    view.prototype.addPage = function (name, page) {
        if (page) {
            this.pageSet[name] = page;
            if (typeof page.on === 'function') {
                page.on("navigate", this.changePage.bind(this));
            }
        }
    };

    view.prototype.getPage = function (name) {
        return this.pageSet[name];
    };
    
    view.prototype.addControl = function(name, control) {
        if (control) {
            this.controlSet[name] = control;
        }
    };
    
    view.prototype.getControl = function(name) {
        return this.controlSet[name];
    };


    view.prototype.getVisiblePage = function () {
        var len = this.pageStack.length;
        if (len <= 0) {
            return;
        }
        return this.pageStack[len - 1];
    };

    view.prototype.changePage = function (pageName) {
        //console.log("view changePage to " + pageName);
        if (pageName === "page-back") {
            this.popPage();
        } else {
            this.showPage(pageName);
        }
    };

    view.prototype.showPage = function (pageName) {
        var newActive = this.pageSet[pageName];
        if (newActive) {
            var currentVisiblePage = this.pageStack[this.pageStack.length - 1];
            this.pageStack.push(newActive);
            newActive.$el.addClass("se-page-visible");
            $("#page-container").append(newActive.el);
            newActive.setEvents();
            if (currentVisiblePage) {
                currentVisiblePage.$el.removeClass("se-page-visible");
                currentVisiblePage.$el.remove();
            }

        }
    };

    view.prototype.popPage = function () {
        if (this.pageStack.length >= 1) {
            var currentVisiblePage = this.pageStack.pop();
            var newActive = this.pageStack[this.pageStack.length - 1];
            currentVisiblePage.$el.removeClass("se-page-visible");
            newActive.$el.addClass("se-page-visible");
            $("#page-container").append(newActive.el);
            newActive.setEvents();
            currentVisiblePage.$el.remove();
            var topBar = newActive.$el.find(".top-bar");
            if (topBar) {

                topBar.removeClass("expanded");
                topBar.foundation();
            }
        }

    };
/*
    view.prototype.newSavedFormItem = function (options) {
        //console.log("jqm-view newSavedFormItem");

        var item = new savedFormItem(options);
        item.index = this.savedFormArray.length;
        item.render();
        this.savedFormArray.unshift(item);
        return true;
    };

    view.prototype.removeSavedFormItem = function (options) {
        //console.log("jqm-view newSavedFormItem");
        var model = options["model"];
        var item = null;
        for (var i = 0; i < this.savedFormArray.length; i++) {
            if (model === this.savedFormArray[i].model) {
                item = this.savedFormArray[i];
            }
        }
        if (!item) {
            return false;
        }

        item.remove();
        //this.$savedFormList.listview("refresh");  TODO: saved form page not implemented
        var index = this.savedFormArray.indexOf(item);
        this.savedFormArray.splice(index, 1);
        return true;
    };
*/
    view.prototype.getModelData = function (page, model) {
        //var form = page.model;
        //var formData = form.get("form");
        //var model = form.get("current");
        var form = app.controller.getForm("disease_case");
        var formName = form.get("name");
        var formData = form.get("form");
        var data = form.get("obj")["$_" + formName][0]["field"];
        for (var key in data) {
            var item = data[key];
            var name = item["@name"];
            var searchString = "#case-" + name;
            var element = page.find(searchString).first();
            var type = item["@type"];
            var value = null;

            if (element.length === 0) {
                continue;
            }

            if (type.indexOf("reference") === 0) {
                if (item["select"]) {
                    var select = element.find("select").first();
                    value = select[0]["value"];
                    model.set(name, value);
                }
            } else {
                if (item["select"]) {
                    var select = element.find("select").first();
                    var selectIndex = select[0].selectedIndex;
                    value = select[0]["value"];
                    model.set(name, value);
                } else {
                    switch (type) {
                    case "string":
                        //TODO: if there is a select then get the string from the select value
                        value = (element.find("input").first().val()) || "";
                        model.set(name, value);
                        break;
                    case "date":
                        value = (element.find("input").first().val()) || "";
                        model.set(name, value);
                        break;
                    case "datetime":
                        value = (element.find("input").first().val()) || "";
                        model.set(name, value);
                        break;
                    case "text":
                        value = (element.find("input").first().val()) || "";
                        model.set(name, value);
                        break;
                    default:
                        break;
                    }
                }
            }
        }
    };

    view.prototype.showForm = function (form, model, page) {
        // Loop through keys finding page elements
        var formName = form.get("name");
        var formData = form.get("form");
        var data = form.get("obj")["$_" + formName][0]["field"];
        for (var key in data) {
            var item = data[key];
            var name = item["@name"];
            var searchString = "#case-" + name;
            var element = page.$el.find(searchString).first();
            var type = item["@type"];
            var value = model.get(name);

            if (element.length === 0) {
                continue;
            }

            if (type.indexOf("reference") === 0) {
                if (item["select"]) {
                    //value = "";
                    var options = item["select"][0]["option"];
                    for (var i = 0; i < options.length; i++) {
                        if (options[i]["@value"] === value) {
                            var select = element.find("select").first();
                            select[0].selectedIndex = i;
                            select.selectmenu("refresh");
                        }
                    }
                }
            } else {
                switch (type) {
                case "string":
                    //element.html(value);
                    element.find("input").first().val(value);
                    break;
                case "date":
                    element.find("input").first().val(value);
                    break;
                case "datetime":
                    element.find("input").first().val(value);
                    break;
                case "text":
                    element.find("input").first().val(value);
                    break;
                default:
                    break;
                }
            }
        }

    };

    view.prototype.notifyModal = function (title, content) {
        var dlg = $("#notify-dialog");
        var header = dlg.find("#header h2");
        header.html(title);
        var contentElement = dlg.find("#content h3");
        contentElement.html(content);
        dlg.find("#ok").on("click", this.hideNotifyModal.bind(this));
        dlg.addClass("visible");
    };

    view.prototype.hideNotifyModal = function () {
        var dlg = $("#notify-dialog");
        dlg.removeClass("visible");
    };

    view.prototype.notifyMessage = function (title, content) {
        var dlg = $("#notify-message");
        var header = dlg.find("#header h2");
        header.html(title);
        var contentElement = dlg.find("#content h3");
        contentElement.html(content);
        //dlg.find("#ok").on("click",this.hideNotifyModal.bind(this));
        dlg.addClass("visible");
    };

    view.prototype.hideNotifyMessage = function () {
        var dlg = $("#notify-message");
        dlg.removeClass("visible");
    };

    view.prototype.resetDialog = function (event) {
        var dialog = $("#reset-dialog-popup");
        $("#reset-dialog").popup("open").popup({
            transition: "none"
        });
    };

    view.prototype.onResetOK = function (event) {
        //console.log("onResetOK");
        $("#reset-dialog").popup("close");
        //app.controller.onReset();
        app.reset();
    };

    view.prototype.onResetCancel = function (event) {
        //console.log("onResetCancel");
        $("#reset-dialog").popup("close");
    };

    view.prototype.reset = function () {
        // Delete new form list
        while (this.newFormArray.length) {
            var element = this.newFormArray.pop();
            element.remove();
        }

        // Delete saved form list
        while (this.savedFormArray.length) {
            var element = this.savedFormArray.pop();
            element.remove();
        }

        // Delete load forms list
        while (this.loadFormArray.length) {
            var element = this.loadFormArray.pop();
            element.remove();
        }

        // reset UI lists
        this.$loadFormList.enhanceWithin();
        this.$loadFormList.controlgroup("refresh");
        this.$newFormList.listview("refresh");
        //this.$savedFormList.listview("refresh");  TODO: saved form page not implemented       
    };


    // bind the plugin to jQuery
    var localView = new view();

    //$.jqmView = localView;
    app.view = localView;

})(jQuery, window, document);