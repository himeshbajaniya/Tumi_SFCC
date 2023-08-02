'use strict';

/**
 * Shows dialog popup
 * @param {Object} $dialog - jQuery wrap for dialog node
 */
function open($dialog) {
    $dialog.parent().removeClass('hidden-block');
}

/**
 * Hide dialog popup
 * @param {Object} $dialog - jQuery wrap for dialog node
 */
/* eslint-disable */
function close($dialog) {
    $dialog.parent().addClass('hidden-block');
    removeEventHandlers($dialog);
}
/* eslint-enable */

/**
 * Gets valid dialog node from arguments
 * @param {Object} $baseNode - jQuery basic node for search
 * @param {Object} args - open dialog arguments object
 * @return {Object} $dialog - jQuery wrap for dialog node
 */
function getValidDialogNode($baseNode, args) {
    var $dialog = null;
    if (args.dialog) {
        if (args.dialog instanceof jQuery) {
            $dialog = args.dialog;
        } else if (args.dialog instanceof HTMLElement) {
            $dialog = $(args.dialog);
            $.extend(args, { dialog: $dialog });
        }
    } else if (args.dialogSelector) {
        $dialog = $baseNode.find(args.dialogSelector).first();
    }
    return $dialog;
}

/**
 * Wraps dialog node and puts it in container block
 * @param {Object} initParams - parameters for dialog initialization
 * @return {Object} - jQuery wrap for dialog node (null if node was not found)
 */
function init(initParams) {
    // check dialog node
    var $dialog = getValidDialogNode($(document.body), initParams);
    if (!$dialog || !$dialog.length) { return null; }

    // clone node if only selector was passed
    if (!initParams.dialog) {
        $dialog = $dialog.clone();
        $.extend(initParams, { dialog: $dialog });
    }

    // wrap dialog
    var $wrapper = $('<div>', { class: 'js-dialog-wrapper dialog-wrapper hidden-block' });
    $wrapper.append($dialog);

    // save initialization parameters
    $wrapper.data(initParams);

    // create container if it isn't exist
    var $container = $('.js-dialog-container').first();
    if (!$container.length) {
        $container = $('<div>', { class: 'js-dialog-container dialog-container' });
        $(document.body).append($container);
    }

    // all dialog allocated here
    $container.append($wrapper);
    return $dialog;
}

/**
 * Closes dialog and resolves promise
 * @param {Object} event - event details object
 */
function closeDialogClickHandler(event) {
    var data = event.data;
    var args = data.arguments;
    var response = null;

    if (!args.closeCallback) {
        close(args.dialog);
    } else {
        response = args.closeCallback(data);
    }

    data.promiseResolve({
        status: data.status,
        data: response
    });
}

/**
 * Closes dialog when button pressed
 * @param {Object} data - parameters neded to close dialog
 */
function closeDialogPressHandler(data) {
    var args = data.arguments;
    var response = null;

    if (!args.closeCallback) {
        close(args.dialog);
    } else {
        response = args.closeCallback(data);
    }

    data.promiseResolve({
        status: data.status,
        data: response
    });
}

/**
 * Provides keyboard shortcuts
 * @param {Object} event - event details object
 */
function keyboardShortcuts(event) {
    var data = event.data;
    if (event.code === 'Enter') {
        closeDialogPressHandler({
            status: 'confirm',
            promiseResolve: data.promiseResolve,
            arguments: data.arguments
        });
    } else if (event.code === 'Escape') {
        closeDialogPressHandler({
            status: 'cancel',
            promiseResolve: data.promiseResolve,
            arguments: data.arguments
        });
    }
    event.preventDefault();
}

/**
 * Remove event handlers
 * @param {Object} $dialog - jQuery wrap for dialog node
 */
function removeEventHandlers($dialog) {
    var $wrapper = $dialog.parent();
    $dialog.off('click');
    $wrapper.off('click');
    $(document.body).off('keyup', keyboardShortcuts);
}

/**
 * Set event handlers
 * @param {Object} $dialog - jQuery wrap for dialog node
 * @param {Object} basicContextObj - object with common data for event handlers
 */
function setEventHandlers($dialog, basicContextObj) {
    var $wrapper = $dialog.parent();

    // confirm button handler
    $dialog.on('click', '.js-confirm-button',
        $.extend({}, basicContextObj, { status: 'confirm' }),
        closeDialogClickHandler);

    // cancel buttons handler
    $dialog.on('click', '.js-cancel-button,.js-close-button',
        $.extend({}, basicContextObj, { status: 'cancel' }),
        closeDialogClickHandler);

    // make close button from wrapper
    $wrapper.on('click',
        $.extend({}, basicContextObj, { status: 'cancel' }),
        closeDialogClickHandler);
    $dialog.on('click', function (event) {
        event.stopPropagation();
    });

    // keyboard shortcuts handler
    $(document.body).on('keyup',
        $.extend({}, basicContextObj),
        keyboardShortcuts);
}

/**
 * Extends arguments object with initialization parameters
 * @param {Object} $dialog - jQuery wrap for dialog node
 * @param {Object} args - open dialog arguments object
 * @return {Object} - extended arguments object
 */
function extendArguments($dialog, args) {
    var $wrapper = $dialog.parent();
    var initParams = $wrapper.data();
    var extendedArgs = Object.create(initParams);

    $.extend(extendedArgs, args);
    return extendedArgs;
}

/**
 * Show dialog popup and prepare promise to get user input
 * @param {Object} args - dialog popup arguments
 * @return {Object} - promise to get user action (on resolve)
 */
function getUserResponse(args) {
    var $container = $('.js-dialog-container').first();
    var $dialog = getValidDialogNode($container, args);
    if (!$dialog.length) { return Promise.resolve(); }

    // extend arguments with init parameters object
    var extendedArgs = extendArguments($dialog, args);

    var userActionPromise = new Promise(function (resolve) {
        var basicContextObj = {
            arguments: extendedArgs,
            promiseResolve: resolve
        };

        // open dialog
        if (!extendedArgs.openCallback) {
            open($dialog);
        } else {
            extendedArgs.openCallback(basicContextObj);
        }

        setEventHandlers($dialog, basicContextObj);
    });

    return userActionPromise;
}

/**
 * Process text replacements
 * @param {Object} $dialog - jQuery wrap for dialog node
 * @param {Array} replacements - text replacements list
 */
function applyReplacementsList($dialog, replacements) {
    if (!replacements) { return; }
    replacements.forEach(function (replaceObj) {
        this.find(replaceObj.selector).text(replaceObj.text);
    }, $dialog);
}

/**
 * Gets dialog node from DOM structure
 * @param {Object} $dialog - jQuery wrap for dialog node
 * @return {Object} - dialog wrap node
 */
function detach($dialog) {
    return $dialog.parent().detach();
}

module.exports = {
    init: init,
    getUserResponse: getUserResponse,
    open: open,
    close: close,
    detach: detach,
    removeEventHandlers: removeEventHandlers,
    applyReplacementsList: applyReplacementsList
};
