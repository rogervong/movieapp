const { ActivityHandler, ConversationState, UserState } = require('botbuilder');
const { Dialog } = require('botbuilder-dialogs');

class DialogBot extends ActivityHandler {

    constructor(conversationState, userState, dialog, logger) {
        super();
        if (!conversationState) throw new Error('[DialogBot]: Missing parameter. conversationState is required');
        if (!userState) throw new Error('[DialogBot]: Missing parameter. userState is required');
        if (!dialog) throw new Error('[DialogBot]: Missing parameter. dialog is required');
        if (!logger) {
            logger = console;
            logger.log('[DialogBot]: logger not passed in, defaulting to console');
        }

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.logger = logger;
        this.dialogState = this.conversationState.createProperty('DialogState');

        this.onMessage(async context => {
            this.logger.log('Running dialog with Message Activity.');           
            await this.dialog.run(context, this.dialogState);            
            await this.conversationState.saveChanges(context, false);
            await this.userState.saveChanges(context, false);
        });
    }
}

module.exports.DialogBot = DialogBot;