'use strict';

var showStatus = require('./components/showStatus');
var dialogPopup = require('./components/dialogPopup');

/**
 * Event name formatter for Emarsys side
 * @param {string} sfccName - BM side event name
 * @return {string} - Emarsys side event name
 */
function eventNameFormatter(sfccName) {
    var formattedName = '';
    formattedName = sfccName.replace(/[-\s]+/g, '_');
    formattedName = formattedName.replace(/([a-z])([A-Z])/g, '$1_$2');
    return 'SFCC_' + formattedName.toUpperCase();
}

/**
 * Prepare select with allowed emarsys events options for replacement
 * @param {string} eventType - neded to find appropriate select for replacement
 * @param {string} currentName - name of Emarsys event, that should be in the first option
 * @return {jQuery} - select with Emarsys name options
 */
function prepareEmarsysNameSelect(eventType, currentName) {
    var $select = $('.js-page-data-block .js-' + eventType + '-events .js-emarsys-name-select').clone();
    if (currentName != null) {
        // put option with currently selected name on the first position
        var currentOption = $select.find('[value="' + currentName + '"]');
        $select.prepend(currentOption);
        // mark it as selected
        currentOption.prop('selected', true);
    }
    return $select;
}

/**
 * Request error handler
 */
function requestErrorHandler() {
    // Server error
    var message = $('.js-notification-messages').data('server-error');
    showStatus('error', message);
    setTimeout(function () { showStatus(); }, 5000);
}

/**
 * Refresh option of created Emarsys event
 * @param {Object} event - all data about mapping of the event
 * @param {string} eventType - neded to separate work with different types of events
 */
function refreshCreatedEventOption(event, eventType) {
    // refresh id-attribute of created Emarsys event
    var $emarsysSelect = $('.js-page-data-block .js-' + eventType + '-events .js-emarsys-name-select');
    var $option = $emarsysSelect.children('[value="' + event.emarsysName + '"]');
    $option.attr('data-emarsys-id', event.emarsysId);

    // refresh active select nodes
    var $activeSelectNodes = $('.js-' + eventType + '-events-table .js-emarsys-name-select').filter(':not(:disabled)');
    $activeSelectNodes.each(function () {
        var appropreateName = $(this).children(':first').attr('value');
        var $emarsysSelectTemplate = prepareEmarsysNameSelect(eventType, appropreateName);
        // Show cancel option
        var cancelOptionTitle = $('.js-emarsys-select-data').data('option-cancel-title');
        $emarsysSelectTemplate.children(':first').text(cancelOptionTitle);
        // Choose currently selected option
        $emarsysSelectTemplate.val($(this).val());
        $(this).replaceWith($emarsysSelectTemplate);
    });
}

/**
 * Refresh data attribute with external events descriptions
 * @param {Object} event - external event data object
 * @param {string} eventType - neded to find appropriate block with data
 */
function refreshEmarsysDescriptions(event, eventType) {
    var emarsysDescriptions = $('.js-page-data-block .js-' + eventType + '-events').data('emarsys-descriptions');
    var context = {
        event: event,
        index: emarsysDescriptions.length
    };
    emarsysDescriptions.some(function (description, i) {
        var isTarget = description.emarsysName === this.event.emarsysName;
        if (isTarget) {
            this.index = i;
        }
        return isTarget;
    }, context);
    emarsysDescriptions.splice(context.index, 1, event);
}

/**
 * Validate trigger event form
 * @param {jQuery} $form - trigger event form
 * @return {boolean} - whether the form is valid
 */
function formValidation($form) {
    var $inputs = $form.find('.js-input-fields');
    var context = {
        isValid: true
    };

    Array.prototype.forEach.call($inputs, function (node) {
        var isRequired = $(node).attr('required') === 'required';
        var noValue = $(node).val() === '';
        if (isRequired && noValue) {
            this.isValid = false;
        }
    }, context);

    return context.isValid;
}

module.exports = {
    processEmptyTableNotifications: function () {
        /**
         * Shows messige if table with events of specified type is empty
         * @param {string} eventType - neded to separate work with different types of events
         */
        function checkTableContent(eventType) {
            var tableRowsCounter = $('.js-' + eventType + '-events-table .js-external-events-row').length;
            if (tableRowsCounter === 0) {
                $('.js-' + eventType + '-events-table .js-empty-table-notification').removeClass('hide-content');
            }
        }

        checkTableContent('subscription');
        checkTableContent('other');
    },
    initAddEventDialog: function () {
        /**
         * Custom function to open add event dialog
         */
        function openAddEventDialog() {
            var $dialog = this.dialog;

            // refresh sfcc names select
            var $sfccSelectTemplate = $(
                '.js-' + this.eventType + '-events .js-sfcc-name-select'
            ).clone();
            var $sfccSelect = $dialog.find('.js-sfcc-name-select');
            $sfccSelect.children(':first').insertBefore($sfccSelectTemplate.children(':first'));
            $sfccSelectTemplate.children(':first').prop('selected', true);
            $sfccSelect.replaceWith($sfccSelectTemplate);

            var $emarsysSelect = $dialog.find('.js-emarsys-name-select');
            if (this.eventType === 'subscription') {
                // refresh Emarsys names select
                var $emarsysSelectTemplate = prepareEmarsysNameSelect(this.eventType);
                $emarsysSelectTemplate.prepend($emarsysSelect.children(':first'));
                $emarsysSelectTemplate.children('[value=""]').remove();
                $emarsysSelectTemplate.children(':first').prop('selected', true);
                $emarsysSelect.replaceWith($emarsysSelectTemplate);
            } else {
                // hide Emarsys names select
                $dialog.find('.js-emarsys-name-select').addClass('hide-content');
            }

            dialogPopup.applyReplacementsList($dialog, this.replaceList);
            dialogPopup.open($dialog);
        }
        /**
         * Custom function to close add event dialog
         * @return {Object} - user response data to add new event
         */
        function closeAddEventDialog() {
            var $dialog = this.dialog;
            dialogPopup.close($dialog);

            // hide old notifications
            showStatus();

            // get and return user response data
            var $emarsysOption = $dialog.find('.js-emarsys-name-select option').filter(':selected');
            var $sfccOption = $dialog.find('.js-sfcc-name-select option').filter(':selected');
            return {
                eventType: this.eventType,
                event: {
                    emarsysId: $emarsysOption.attr('data-emarsys-id'),
                    emarsysName: $emarsysOption.attr('value'),
                    sfccName: $sfccOption.attr('value')
                }
            };
        }

        // init add event button
        dialogPopup.init({
            dialogSelector: '.js-page-data-block .js-add-event-dialog',
            openCallback: openAddEventDialog,
            closeCallback: closeAddEventDialog
        });
    },
    initAddEventButtons: function () {
        /**
         * Check if there are sfcc events allowed to map (listed in source field but not mapped)
         * @param {string} eventType - neded to separate work with different types of events
         * @return {boolean} - flag for open dialog permission
         */
        function checkSfccNameOptions(eventType) {
            var openDialogPermission = true;
            var $sfccNamesSelect = $('.js-page-data-block .js-' + eventType + '-events .js-sfcc-name-select');
            if ($sfccNamesSelect.find('option[value]').length === 0) {
                // Warning message: There are no more sfcc events, allowed to map ...
                var warning = $('.js-notification-messages').data('empty-source-error');
                showStatus('error', warning);
                setTimeout(function () { showStatus(); }, 10000);
                openDialogPermission = false;
            }
            return openDialogPermission;
        }
        /**
         * Add event request success handler
         * @param {Object} data - response data
         */
        function addEventSuccessHandler(data) {
            var htmlData = $(data);
            var response = {
                newRow: htmlData.find('.js-external-events-row'),
                requestBodyExample: htmlData.find('.js-supported-events-data').data('request-example'),
                triggerForm: htmlData.find('.js-trigger-form'),
                error: htmlData.find('.js-request-error').data('error')
            };

            if (response.newRow) {
                var event = {
                    emarsysId: response.newRow.attr('data-emarsys-id'),
                    emarsysName: response.newRow.attr('data-emarsys-name'),
                    sfccName: response.newRow.attr('data-sfcc-name'),
                    campaignId: response.newRow.find('.js-campaign-status').attr('data-id'),
                    campaignStatus: response.newRow.find('.js-campaign-status').attr('data-status')
                };
                var message = '';
                var eventType = this.eventType;

                // refresh campaign status
                var campaignsData = $('.js-page-data-block .js-' + eventType + '-events').data('campaigns');
                if (campaignsData[event.emarsysId]) {
                    campaignsData[event.emarsysId].status = event.campaignStatus;
                } else {
                    campaignsData[event.emarsysId] = {
                        id: event.campaignId,
                        status: event.campaignStatus
                    };
                }

                if (event.emarsysStatus === 'new' && eventType !== 'other') {
                    refreshCreatedEventOption(event, eventType);
                }

                // remove sfcc event from select with not mapped sfcc event options
                var $sfccNamesSelect = $('.js-page-data-block .js-' + eventType + '-events .js-sfcc-name-select');
                $sfccNamesSelect.children('[value="' + event.sfccName + '"]').remove();

                // hide block with empty table message (if exist)
                $('.js-' + eventType + '-events-table .js-empty-table-notification').addClass('hide-content');

                // put new row into appropriate table
                response.newRow.insertBefore($('.js-' + eventType + '-events-table .js-empty-table-notification'));

                // store trigger request example
                if (response.requestBodyExample && response.requestBodyExample.length) {
                    var requestBodyExamples = $('.js-page-data-block .js-' + eventType + '-events').data('request-examples');
                    requestBodyExamples[event.emarsysName] = response.requestBodyExample;
                }

                // store trigger event form
                if (response.triggerForm && response.triggerForm.length) {
                    $('.js-page-data-block .js-' + eventType + '-forms').append(response.triggerForm);
                }

                // refresh emarsys descriptions
                refreshEmarsysDescriptions(event, eventType);

                // Success message: Event ${event.sfccName} was successfully created
                var $messagesBlock = $('.js-notification-messages');
                message = $messagesBlock.data('success-event') +
                    event.sfccName + $messagesBlock.data('success-created');
                showStatus('success', message);
            } else if (response.error && response.error.message === 'ERROR') {
                // Emarsys error
                showStatus('error', response.error.message);
            }
        }
        /**
         * Add event button click handler
         * @param {Object} result - user response data from dialog
         */
        function userResponseHandler(result) {
            if (!result || result.status === 'cancel') { return; }

            var warning = '';
            var eventType = result.data.eventType;
            var event = result.data.event;

            if (!event.sfccName) {
                // Warning message: Name of new event is not specified
                warning = $('.js-notification-messages').data('empty-name-error');
                showStatus('error', warning);
                setTimeout(function () { showStatus(); }, 5000);
                return;
            }

            if (event.emarsysName === 'appropriate') {
                event.emarsysName = eventNameFormatter(event.sfccName);
                var $emarsysNamesSelect = $('.js-page-data-block .js-' + eventType + '-events .js-emarsys-name-select');
                var $appropriateOption = $emarsysNamesSelect.children('[value="' + event.emarsysName + '"]');
                event.emarsysId = $appropriateOption.attr('data-emarsys-id');
            }

            var campaignData = $('.js-page-data-block .js-' + eventType + '-events').data('campaigns')[event.emarsysId];

            var requestData = {
                type: eventType,
                sfccName: event.sfccName,
                emarsysId: event.emarsysId,
                emarsysName: event.emarsysName,
                campaignId: campaignData && campaignData.id,
                campaignStatus: campaignData && campaignData.status
            };

            $.ajax({
                url: $('.js-page-links').data('urls').addEvent,
                type: 'post',
                dataType: 'text',
                data: requestData,
                context: { eventType: eventType },
                success: addEventSuccessHandler,
                error: requestErrorHandler
            });
        }

        $('.js-add-subscription-event-button').on('click', {
            dialogPopup: dialogPopup,
            userResponseHandler: userResponseHandler,
            checkSfccNameOptions: checkSfccNameOptions
        }, function (e) {
            var context = e.data;
            var openDialogPermission = context.checkSfccNameOptions('subscription');
            if (!openDialogPermission) { return; }

            dialogPopup.getUserResponse({
                dialogSelector: '.js-add-event-dialog',
                eventType: 'subscription',
                replaceList: [
                    {
                        selector: '.js-dialog-title',
                        text: $('.js-dialog-messages').data('add-subscription')
                    }
                ]
            }).then(
                context.userResponseHandler
            );
        });
        $('.js-add-other-event-button').on('click', {
            dialogPopup: dialogPopup,
            userResponseHandler: userResponseHandler,
            checkSfccNameOptions: checkSfccNameOptions
        }, function (e) {
            var context = e.data;
            var openDialogPermission = context.checkSfccNameOptions('other');
            if (!openDialogPermission) { return; }

            dialogPopup.getUserResponse({
                dialogSelector: '.js-add-event-dialog',
                eventType: 'other',
                replaceList: [
                    {
                        selector: '.js-dialog-title',
                        text: $('.js-dialog-messages').data('add-other')
                    }
                ]
            }).then(
                context.userResponseHandler
            );
        });
    },
    initChangeButtons: function () {
        /**
         * Change event button click handler
         * @param {string} eventType - neded to separate work with different types of events
         * @param {jQuery} $updateButton - change/apply button node
         */
        function changeEvent(eventType, $updateButton) {
            // switch the button to apply mode
            var applyLabel = $('.js-button-labels').data('apply');
            $updateButton.text(applyLabel);
            $updateButton.removeClass('js-change-button');
            $updateButton.addClass('js-apply-changes-button');

            // prepare actual Emarsys name select
            var $row = $updateButton.closest('.js-external-events-row');
            var $emarsysNameSelect = $row.find('.js-emarsys-name-select');
            var selectedName = $emarsysNameSelect.children(':selected').attr('value');
            var $emarsysSelectTemplate = prepareEmarsysNameSelect(eventType, selectedName);
            // only "approrpeate" and "none" options allowed for other events mapping
            if (eventType === 'other') {
                var appropreateName = eventNameFormatter($row.attr('data-sfcc-name'));
                $emarsysSelectTemplate.children(
                    ':not([value="' + appropreateName + '"],[value=""])'
                ).remove();
            }

            // Show cancel option
            var cancelOptionTitle = $('.js-emarsys-select-data').data('option-cancel-title');
            $emarsysSelectTemplate.children(':first').text(cancelOptionTitle);

            // replace select
            $emarsysNameSelect.replaceWith($emarsysSelectTemplate);

            // hide old notifications
            showStatus();
        }

        $('.js-subscription-events-table').on(
            'click', '.js-change-button', { changeEvent: changeEvent }, function (e) {
                e.data.changeEvent('subscription', $(e.target));
            }
        );
        $('.js-other-events-table').on(
            'click', '.js-change-button', { changeEvent: changeEvent }, function (e) {
                e.data.changeEvent('other', $(e.target));
            }
        );
    },
    initApplyButton: function () {
        /**
         * Should be colled when event change process is finished
         */
        function finishChangeMode() {
            // switch the button to change mode
            var changeLabel = $('.js-button-labels').data('change');
            this.updateButton.text(changeLabel);
            this.updateButton.removeClass('js-apply-changes-button');
            this.updateButton.addClass('js-change-button');

            // Replace cancel option
            var $emarsysSelect = this.row.find('.js-emarsys-name-select');
            var $cancelOption = $emarsysSelect.children(':first');
            var $cancelOptionTemplate = $(
                '.js-page-data-block .js-' + this.eventType + '-events .js-emarsys-name-select'
            ).children(
                'option[value="' + this.prevEmarsysName + '"]'
            ).clone();

            var currentEmarsysName = $emarsysSelect.children(':selected').attr('value');
            $cancelOption.replaceWith($cancelOptionTemplate);
            $emarsysSelect.val(currentEmarsysName);

            // lock select
            $emarsysSelect.prop('disabled', true);

            // unlock update button
            this.updateButton.prop('disabled', false);
        }
        /**
         * Update request success handler
         * @param {Object} data - response data
         */
        function updateSuccessHandler(data) {
            if (data.response && data.response.status === 'OK') {
                var event = data.response.result.event;
                var freshCampaignsData = data.response.result.campaigns;
                var message = '';

                if (event.emarsysStatus === 'new' && this.eventType === 'subscription') {
                    refreshCreatedEventOption(event, this.eventType);
                }

                // choose appropriate option (if user changes it in meantime)
                var $emarsysNamesSelect = this.row.find('.js-emarsys-name-select');
                $emarsysNamesSelect.children('[value="' + event.emarsysName + '"]').prop('selected', true);

                // change data properties
                this.row.attr('data-emarsys-id', event.emarsysId);
                this.row.attr('data-emarsys-name', event.emarsysName);

                // refresh emarsys descriptions
                refreshEmarsysDescriptions(event, this.eventType);

                if (freshCampaignsData) {   // do not do this for "none" mapping
                    // refresh campaign status data
                    var campaignsData = $('.js-page-data-block .js-' + this.eventType + '-events').data('campaigns');
                    if (campaignsData[event.emarsysId]) {
                        campaignsData[event.emarsysId].status = freshCampaignsData[event.emarsysId].status;
                    } else {
                        campaignsData[event.emarsysId] = {
                            id: freshCampaignsData[event.emarsysId].id,
                            status: freshCampaignsData[event.emarsysId].status
                        };
                    }
                    // refresh status in the row
                    var $statusNode = this.row.find('.js-campaign-status');
                    $statusNode.attr('data-id', freshCampaignsData[event.emarsysId].id);
                    $statusNode.attr('data-status', freshCampaignsData[event.emarsysId].status);
                    $statusNode.text(freshCampaignsData[event.emarsysId].status);
                }

                // Success message: Event ${event.sfccName} was successfully changed
                var $messagesBlock = $('.js-notification-messages');
                message = $messagesBlock.data('success-event') +
                    event.sfccName + $messagesBlock.data('success-changed');
                showStatus('success', message);
            } else if (data.response && data.response.status === 'ERROR') {
                // Emarsys error
                showStatus('error', data.response.message);
            }
        }
        /**
         * Apply changes button click handler
         * @param {string} eventType - neded to separate work with different types of events
         * @param {jQuery} $updateButton - change/apply button node
         */
        function applyChanges(eventType, $updateButton) {
            var $row = $updateButton.closest('.js-external-events-row');
            var $chosenOption = $row.find('.js-emarsys-name-select').find('option').filter(':selected');

            var emarsysName = $chosenOption.attr('value');
            var emarsysId = $chosenOption.attr('data-emarsys-id');
            var prevEmarsysName = $row.attr('data-emarsys-name');

            var context = {
                eventType: eventType,
                row: $row,
                updateButton: $updateButton,
                prevEmarsysName: prevEmarsysName
            };

            // cancel option is chosen
            if (emarsysName === prevEmarsysName) {
                finishChangeMode.call(context);
                return;
            }

            var campaignsData = $('.js-page-data-block .js-' + eventType + '-events').data('campaigns');

            var requestData = {
                type: eventType,
                sfccName: $row.attr('data-sfcc-name'),
                emarsysId: emarsysId,
                emarsysName: emarsysName
            };
            if (emarsysId && campaignsData[emarsysId]) {
                requestData.campaignId = campaignsData[emarsysId].id;
                requestData.campaignStatus = campaignsData[emarsysId].status;
            }

            $updateButton.prop('disabled', true);

            $.ajax({
                url: $('.js-page-links').data('urls').updateEvent,
                type: 'post',
                dataType: 'json',
                data: requestData,
                context: context,
                success: updateSuccessHandler,
                error: requestErrorHandler,
                complete: finishChangeMode
            });
        }

        $('.js-subscription-events-table').on(
            'click', '.js-apply-changes-button', { applyChanges: applyChanges }, function (e) {
                e.data.applyChanges('subscription', $(e.target));
            }
        );
        $('.js-other-events-table').on(
            'click', '.js-apply-changes-button', { applyChanges: applyChanges }, function (e) {
                e.data.applyChanges('other', $(e.target));
            }
        );
    },
    initRequestBodyExampleDialog: function () {
        /**
         * Custom function to open request body example dialog
         */
        function openExampleDialog() {
            var $dialog = this.dialog;

            var requestBodyExamples = $('.js-page-data-block .js-' + this.eventType + '-events').data('request-examples');
            var exampleObject = requestBodyExamples[this.emarsysEventName];

            var message = '';
            if (exampleObject) {
                message = JSON.stringify(exampleObject, null, 2);
            } else {
                message = $('.js-page-data-block .js-dialog-messages').data('unsupported-event');
            }
            $dialog.find('.js-content-block pre').text(message);

            dialogPopup.applyReplacementsList($dialog, this.replaceList);
            dialogPopup.open($dialog);
        }

        // init add event button
        dialogPopup.init({
            dialogSelector: '.js-page-data-block .js-request-body-example',
            openCallback: openExampleDialog
        });
    },
    initRequestBodyExampleButton: function () {
        /**
         * Click handler for request body example button
         * @param {string} eventType - neded to separate work with different types of events
         * @param {jQuery} $exampleButton - example button node
         */
        function showRequestBodyExample(eventType, $exampleButton) {
            var $row = $exampleButton.closest('.js-external-events-row');
            var sfccEventName = $row.attr('data-sfcc-name');
            var emarsysEventName = $row.attr('data-emarsys-name');

            dialogPopup.getUserResponse({
                dialogSelector: '.js-request-body-example',
                eventType: eventType,
                emarsysEventName: emarsysEventName,
                replaceList: [
                    {
                        selector: '.js-dialog-title',
                        text: $('.js-dialog-messages').data('show-example') + ' "' + sfccEventName + '"'
                    }
                ]
            });

            // hide old notifications
            showStatus();
        }

        $('.js-subscription-events-table').on('click', '.js-example-button', {
            showRequestBodyExample: showRequestBodyExample
        }, function (e) {
            e.data.showRequestBodyExample('subscription', $(e.target));
        });
        $('.js-other-events-table').on('click', '.js-example-button', {
            showRequestBodyExample: showRequestBodyExample
        }, function (e) {
            e.data.showRequestBodyExample('other', $(e.target));
        });
    },
    initTriggerEventDialog: function () {
        /**
         * Custom function to open trigger event dialog
         */
        function openTriggerDialog() {
            var $dialog = this.dialog;

            var $contentBlock = $dialog.find('.js-content-block');
            var previousFormEvent = $contentBlock.find('.js-trigger-form').attr('data-event-name');
            if (previousFormEvent !== this.event.sfccName) {
                // replace trigger form if current form is not suitable
                $contentBlock.children().remove();
                $contentBlock.append(this.formTemplate);
            }

            dialogPopup.applyReplacementsList($dialog, this.replaceList);
            dialogPopup.open($dialog);
        }
        /**
         * Custom function to close trigger event dialog
         * @return {Object} - user response data
         */
        function closeTriggerDialog() {
            var $dialog = this.dialog;
            dialogPopup.close($dialog);

            // hide old notifications
            showStatus();

            var $triggerForm = $dialog.find('.js-content-block .js-trigger-form');
            var triggerFormFields = $dialog.find('.js-content-block .js-input-fields');
            var formData = {};
            Array.prototype.forEach.call(triggerFormFields, function (node) {
                this.formData[$(node).attr('name')] = $(node).val();
            }, { formData: formData });

            return {
                eventType: this.eventType,
                formData: formData,
                isValid: formValidation($triggerForm),
                event: this.event
            };
        }

        // init add event button
        dialogPopup.init({
            dialogSelector: '.js-page-data-block .js-trigger-event',
            openCallback: openTriggerDialog,
            closeCallback: closeTriggerDialog
        });
    },
    initTriggerEventButton: function () {
        /**
         * Trigger event request success handler
         * @param {Object} data - response data
         */
        function triggerEventSuccessHandler(data) {
            if (data.response && data.response.status === 'OK') {
                showStatus('success', 'The event was successfully triggered');
            } else if (data.response && data.response.status === 'ERROR') {
                // Emarsys error
                showStatus('error', data.response.message);
            }
        }
        /**
         * Send request to trigger event
         * @param {Object} result - user response data from dialog
         */
        function sendRequest(result) {
            if (!result || result.status === 'cancel') { return; }

            var eventType = result.data.eventType;
            var formData = result.data.formData;
            var isValid = result.data.isValid;
            var event = result.data.event;

            if (!isValid) {
                // Warning message: Form validation failed. Some mandatory fields have no value
                var warning = $('.js-notification-messages').data('form-validation-error');
                showStatus('error', warning);
                setTimeout(function () { showStatus(); }, 5000);
                return;
            }

            var requestData = {
                type: eventType,
                sfccName: event.sfccName,
                emarsysId: event.emarsysId,
                emarsysName: event.emarsysName,
                formData: JSON.stringify(formData)
            };

            $.ajax({
                url: $('.js-page-links').data('urls').triggerEvent,
                type: 'post',
                dataType: 'json',
                data: requestData,
                context: { eventType: eventType },
                success: triggerEventSuccessHandler,
                error: requestErrorHandler
            });
        }
        /**
         * Click handler for trigger event button
         * @param {string} eventType - neded to separate work with different types of events
         * @param {jQuery} $triggerButton - trigger event button node
         */
        function triggerEvent(eventType, $triggerButton) {
            var $row = $triggerButton.closest('.js-external-events-row');
            var event = {
                emarsysId: $row.attr('data-emarsys-id'),
                emarsysName: $row.attr('data-emarsys-name'),
                sfccName: $row.attr('data-sfcc-name')
            };
            var warning = '';

            if (!event.emarsysId) {
                // Warning message: Invalid mapping for the event "${event.sfccName}"
                warning = $('.js-notification-messages').data('invalid-mapping') + ' "' + event.sfccName + '"';
                showStatus('error', warning);
                setTimeout(function () { showStatus(); }, 5000);
                return;
            }

            var formsContainer = $('.js-page-data-block .js-' + eventType + '-forms');
            var formTemplate = formsContainer.find('[data-event-name="' + event.sfccName + '"]')[0];
            if (!formTemplate) {
                // Warning message: Trigger event form is not set for the event "event.emarsysName"
                warning = $('.js-notification-messages').data('no-trigger-form') + ' "' + event.emarsysName + '"';
                showStatus('error', warning);
                setTimeout(function () { showStatus(); }, 5000);
                return;
            }

            dialogPopup.getUserResponse({
                dialogSelector: '.js-trigger-event',
                eventType: eventType,
                event: event,
                formTemplate: $(formTemplate).clone(),
                replaceList: [
                    {
                        selector: '.js-dialog-title',
                        text: $('.js-dialog-messages').data('trigger-event') + ' "' + event.sfccName + '"'
                    }
                ]
            }).then(
                sendRequest
            );

            // hide old notifications
            showStatus();
        }

        $('.js-subscription-events-table').on('click', '.js-trigger-button', {
            triggerEvent: triggerEvent
        }, function (e) {
            e.data.triggerEvent('subscription', $(e.target));
        });
        $('.js-other-events-table').on('click', '.js-trigger-button', {
            triggerEvent: triggerEvent
        }, function (e) {
            e.data.triggerEvent('other', $(e.target));
        });
    },
    initRefreshStatusButtons: function () {
        /**
         * Request success handler for refresh campaign status
         * @param {Object} data - response data
         */
        function refreshStatusSuccessHandler(data) {
            if (data.response && data.response.status === 'OK') {
                var eventType = data.response.eventType;
                var freshData = data.response.campaigns;

                $('.js-page-data-block .js-' + eventType + '-events').data('campaigns', freshData);

                $('.js-' + eventType + '-events-table .js-external-events-row').each(function () {
                    var emarsysEventId = $(this).attr('data-emarsys-id');
                    if (emarsysEventId) {
                        var $statusNode = $(this).find('.js-campaign-status');
                        $statusNode.attr('data-id', freshData[emarsysEventId].id);
                        $statusNode.attr('data-status', freshData[emarsysEventId].status);
                        $statusNode.text(freshData[emarsysEventId].status);
                    }
                });

                showStatus('success', 'Statys for "' + eventType + '" event campaigns was successfully refreshed');
            } else if (data.response && data.response.status === 'ERROR') {
                // Emarsys error
                showStatus('error', data.response.message);
            }
        }

        /**
         * Click handler for refresh status button
         * @param {string} eventType - neded to separate work with different types of events
         */
        function refreshStatus(eventType) {
            var emarsysDescriptions = $('.js-page-data-block .js-' + eventType + '-events').data('emarsys-descriptions');
            var requestData = {
                type: eventType,
                descriptions: JSON.stringify(emarsysDescriptions)
            };
            $.ajax({
                url: $('.js-page-links').data('urls').campaignStatus,
                type: 'post',
                dataType: 'json',
                data: requestData,
                context: { eventType: eventType },
                success: refreshStatusSuccessHandler,
                error: requestErrorHandler
            });
        }

        $('.js-refresh-status-subscription').on('click', {
            refreshStatus: refreshStatus
        }, function (e) {
            e.data.refreshStatus('subscription', $(e.target));
        });
        $('.js-refresh-status-other').on('click', {
            refreshStatus: refreshStatus
        }, function (e) {
            e.data.refreshStatus('other', $(e.target));
        });
    }
};
