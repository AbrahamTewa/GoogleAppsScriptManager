'use strict';

/**
 * The daemon will load each filters one by one and apply them.
 * For each filters, it will search all matching threads and apply each actions one by one
 *
 *
 * @name MailDaemonAction
 * @type {Object}
 * @property {string[]}     searches
 * @property {MailAction[]} actions
 */

/**
 * @name MailAction
 * @type {Object}
 * @property {MailDaemon.ActionTypes} type
 * @property {string}         parameter1
 *
 */

var MailDaemon = {};

MailDaemon.ArchiveRules = { important_unread     : -14
                          , important_read       : -7
                          , not_important_unread : -7
                          , not_important_read   : 3};

/**
 * @name MailDaemon.ActionTypes
 * @enum
 */
MailDaemon.ActionTypes = { APPLY_LABEL         : 'Apply label'
                         , CLEAR_LABEL         : 'Clear all labels'
                         , MOVE_TO_ARCHIVE     : 'Move to archive'
                         , MOVE_TO_INBOX       : 'Move to inbox'
                         , MOVE_TO_TRASH       : 'Move to trash'
                         , MOVE_TO_SPAM        : 'Move to spam'
                         , MARK_AS_READ        : 'Mark as read'
                         , MARK_AS_UNREAD      : 'Mark as unread'
                         , MARK_AS_IMPORTANT   : 'Mark as important'
                         , MARK_AS_UNIMPORTANT : 'Mark as unimportant'
                         , REMOVE_LABEL        : 'Remove label'
                         , STAR_MESSAGES       : 'Star messages'
                         , UNSTAR_MESSAGES     : 'Unstar messages'};

MailDaemon.applyRule          = function (threads, rule) {

    var /** @type {number}              */ a
      , /** @type {MailAction}          */ action
      , /** @type {number}              */ l
      , /** @type {GmailLabel}          */ label
      , /** @type {string}              */ labelName
      , /** @type {Object.<GmailLabel>} */ labels
      , /** @type {number}              */ m
      , /** @type {GmailMessage}        */ message
      , /** @type {GmailMessage[]}      */ messages
      , /** @type {number}              */ t
      , /** @type {GmailThread}         */ thread;

    labels = {};

    for(t=0; t < threads.length; t++) {

        if (!MailDaemon.timer.canContinue())
            return;

        thread = threads[t];

        for(a=0; a < rule.actions.length; a++) {

            if (!MailDaemon.timer.canContinue())
                return;

            action = rule.actions[a];

            switch(action.type) {

                case MailDaemon.ActionTypes.APPLY_LABEL:

                    for(l=0; l < action.parameter1.length; l++) {

                        if (!MailDaemon.timer.canContinue())
                            return;

                        labelName = action.parameter1[l];

                        // Retrieving the label
                        if (labels[labelName])
                            label = labels[labelName];
                        else {
                            label = GmailApp.getUserLabelByName(labelName);

                            if (label === null)
                                label = GmailApp.createLabel(labelName);
                        }

                        thread.addLabel(label);
                    }

                    break;

                case MailDaemon.ActionTypes.MARK_AS_IMPORTANT:
                    thread.markImportant();
                    break;

                case MailDaemon.ActionTypes.MARK_AS_READ:
                    thread.markRead();
                    break;

                case MailDaemon.ActionTypes.MARK_AS_UNIMPORTANT:
                    thread.markUnimportant();
                    break;

                case MailDaemon.ActionTypes.MARK_AS_UNREAD:
                    thread.markUnread();
                    break;

                case MailDaemon.ActionTypes.MOVE_TO_ARCHIVE:
                    thread.moveToArchive();
                    break;

                case MailDaemon.ActionTypes.MOVE_TO_INBOX:
                    thread.moveToInbox();
                    break;

                case MailDaemon.ActionTypes.MOVE_TO_SPAM:
                    thread.moveToSpam();
                    break;

                case MailDaemon.ActionTypes.MOVE_TO_TRASH:
                    thread.moveToTrash();
                    break;

                case MailDaemon.ActionTypes.REMOVE_LABEL:
                    for(l=0; l < action.parameter1.length; l++) {

                        if (!MailDaemon.timer.canContinue())
                            return;

                        labelName = action.parameter1[l];

                        // Retrieving the label
                        if (labels[labelName])
                            label = labels[labelName];
                        else {
                            label = GmailApp.getUserLabelByName(labelName);

                            if (label === null)
                                continue;
                        }

                        thread.removeLabel(label);
                    }

                    break;

                case MailDaemon.ActionTypes.STAR_MESSAGES:

                    messages = thread.getMessages();
                    for(m=0; m < messages.length; m++) {

                        if (!MailDaemon.timer.canContinue())
                            return;

                        message = messages[m];
                        message.star();
                    }
                    break;

                case MailDaemon.ActionTypes.UNSTAR_MESSAGES:
                    messages = thread.getMessages();
                    for(m=0; m < messages.length; m++) {

                        if (!MailDaemon.timer.canContinue())
                            return;

                        message = messages[m];
                        message.unstar();
                    }
                    break;

            }
        }
    }
};

MailDaemon.timer              = (function() {

    var /** @type {Date} */ endTime
      , /** @type {Date} */ startTime;

    function canContinue() {
        return new Date() < endTime;
    }

    function start() {
        startTime = new Date();
        endTime   = new Date(startTime);

        endTime.setMinutes(startTime.getMinutes() + 5);
        endTime.setSeconds(startTime.getSeconds() + 30);
    }

    return { canContinue : canContinue
           , start       : start};

})();

/**
 *
 * @param {Object} options
 * @param {Date|number=} options.after
 * @param {Date|number=} options.before
 * @param {boolean=}     options.important
 * @param {string=}      options.labels
 * @param {boolean=}     options.read
 * @returns {string}
 */
MailDaemon.createSearchFilter = function (options) {

    var /** @type {number} */ l
      , /** @type {string} */ search;

    search = '';

    // After
    if (options.after instanceof Date)
        search += ' after:' + (options.after.getTime() / 1000);
    else if (options.after)
        search += ' after:' + options.after;

    // Before
    if (options.before instanceof Date)
        search += ' before:' + (options.before.getTime() / 1000);
    else if (options.before)
        search += ' before:' + options.before;

    // Important
    if (typeof options.important === 'boolean')
        search += ' ' + (options.important ? '':'-') + 'is:important';

    // Label
    if (options.labels) {
        for (l=0; l < options.labels.length; l++) {
            search += ' label:' + options.labels[l];
        }
    }

    // Read
    if (typeof options.read === 'boolean')
        search += ' is:' + (options.read ? 'read':'unread');

    return search;
};

/**
 * Apply the given rule
 * @param {MailDaemonAction} rule
 */
MailDaemon.doDaemonAction     = function (rule) {

    var /** @type {number}        */ s
      , /** @type {GmailThread[]} */ threads;

    for(s=0; s < rule.searches.length; s++) {

        if (!MailDaemon.timer.canContinue())
            return;

        threads = GmailApp.search(rule.searches[s]);
        MailDaemon.applyRule(threads, rule);
    }
};

/**
 *
 * @returns {MailDaemonAction[]}
 */
MailDaemon.getRules           = function () {
    var /** @type {MailDaemonAction} */ archiveRule;

    archiveRule = (function() {
        var /** @type {MailAction} */ action
          , /** @type {Date}       */ limitDate
          , /** @type {string[]}   */ searches
          , /** @type {Date}       */ now;

        searches = [];
        now = new Date();

        // Important read
        limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + MailDaemon.ArchiveRules.important_read);
        searches.push(MailDaemon.createSearchFilter({labels:['inbox'], important: true, read: true, before: limitDate}));

        // Important unread
        limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + MailDaemon.ArchiveRules.important_unread);
        searches.push(MailDaemon.createSearchFilter({labels:['inbox'], important: true, read: false, before: limitDate}));

        // Not important read
        limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + MailDaemon.ArchiveRules.not_important_read);
        searches.push(MailDaemon.createSearchFilter({labels:['inbox'], important: false, read: true, before: limitDate}));

        // Not important unread
        limitDate = new Date(now);
        limitDate.setDate(limitDate.getDate() + MailDaemon.ArchiveRules.not_important_unread);
        searches.push(MailDaemon.createSearchFilter({labels:['inbox'], important: false, read: false, before: limitDate}));

        action = {type: MailDaemon.ActionTypes.MOVE_TO_ARCHIVE};

        return { searches : searches
               , actions  : [action] };
    })();

    return [archiveRule];
};

function install() {
    var /** @type {boolean}   */ isPreciseHour  
      , /** @type {number}    */ t
      , /** @type {Trigger}   */ trigger
      , /** @type {Trigger[]} */ triggers;

    // Clearing triggers
    triggers = ScriptApp.getProjectTriggers();

    for(t=0; t < triggers.length; t++) {
        ScriptApp.deleteTrigger(triggers[t]);
    }

    // Adding trigger
    trigger = ScriptApp.newTrigger('start');

    trigger.timeBased().everyMinutes(30).create();
}

function start() {

    var /** @type {number}             */ da
      , /** @type {MailDaemonAction[]} */ daemonActions;

    daemonActions = MailDaemon.getRules();
    MailDaemon.timer.start();

    for(da=0; da < daemonActions.length; da++) {

        if (!MailDaemon.timer.canContinue())
            return;

        MailDaemon.doDaemonAction(daemonActions[da]);
    }

}