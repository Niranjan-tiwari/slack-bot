"use strict";
/**
 * @module botbuilder-adapter-slack
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
  * Create a Slack Dialog object for use with [replyWithDialog()](#replyWithDialog).
  *
  * ```javascript
  * let dialog = new SlackDialog('My Dialog', 'callback_123', 'Save');
  * dialog.addText('Your full name', 'name').addEmail('Your email', 'email');
  * dialog.notifyOnCancel(true);
  * bot.replyWithDialog(message, dialog.asObject());
  * ```
  *
  */
class SlackDialog {
    /**
     * Create a new dialog object
     * @param title Title of dialog
     * @param callback_id Callback id of dialog
     * @param submit_label Label for the submit button
     * @param elements An array of dialog elements
     */
    constructor(title, callback_id, submit_label, elements) {
        this.data = {
            title: title,
            callback_id: callback_id,
            submit_label: submit_label || null,
            elements: elements || []
        };
        return this;
    }
    /**
     * Set the dialog's state field
     * @param v value for state
     */
    state(v) {
        this.data.state = v;
        return this;
    }
    /**
     * Set true to have Slack notify you with a `dialog_cancellation` event if a user cancels the dialog without submitting
     * @param set True or False
     */
    notifyOnCancel(set) {
        this.data.notify_on_cancel = set;
        return this;
    }
    /**
     * Set the title of the dialog
     * @param v Value for title
     */
    title(v) {
        this.data.title = v;
        return this;
    }
    /**
     * Set the dialog's callback_id
     * @param v Value for the callback_id
     */
    callback_id(v) {
        this.data.callback_id = v;
        return this;
    }
    /**
     * Set the button text for the submit button on the dialog
     * @param v Value for the button label
     */
    submit_label(v) {
        this.data.submit_label = v;
        return this;
    }
    /**
     * Add a text input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     * @param subtype
     */
    addText(label, name, value, options, subtype) {
        var element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'text',
            subtype: subtype || null
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    /**
     * Add an email input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    addEmail(label, name, value, options) {
        return this.addText(label, name, value, options, 'email');
    }
    /**
     * Add a number input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    addNumber(label, name, value, options) {
        return this.addText(label, name, value, options, 'number');
    }
    /**
     * Add a telephone number input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    addTel(label, name, value, options) {
        return this.addText(label, name, value, options, 'tel');
    }
    /**
     * Add a URL input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     */
    addUrl(label, name, value, options) {
        return this.addText(label, name, value, options, 'url');
    }
    /**
     * Add a text area input to the dialog
     * @param label
     * @param name
     * @param value
     * @param options
     * @param subtype
     */
    addTextarea(label, name, value, options, subtype) {
        var element = (typeof (label) === 'object') ? label : {
            label: label,
            name: name,
            value: value,
            type: 'textarea',
            subtype: subtype || null
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    /**
     * Add a dropdown select input to the dialog
     * @param label
     * @param name
     * @param value
     * @param option_list
     * @param options
     */
    addSelect(label, name, value, option_list, options) {
        var element = {
            label: label,
            name: name,
            value: value,
            options: option_list,
            type: 'select'
        };
        if (typeof (options) === 'object') {
            for (var key in options) {
                element[key] = options[key];
            }
        }
        this.data.elements.push(element);
        return this;
    }
    /**
     * Get the dialog object as a JSON encoded string.
     */
    asString() {
        return JSON.stringify(this.data, null, 2);
    }
    /**
     * Get the dialog object for use with bot.replyWithDialog()
     */
    asObject() {
        return this.data;
    }
}
exports.SlackDialog = SlackDialog;
//# sourceMappingURL=slack_dialog.js.map