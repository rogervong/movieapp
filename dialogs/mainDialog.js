const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { MovieDialog } = require('./movieDialog');
const { LuisHelper } = require('./luisHelper');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';
const MOVIE_DIALOG = 'movieDialog';

class MainDialog extends ComponentDialog {
    constructor(logger) {
        super("MainDialog");

        if(!logger) {
            logger.log('[MainDialog]: logger not passed in, defaulting to console');
        }

        this.logger = logger;

        this.addDialog(new TextPrompt('TextPrompt'))
            .addDialog(new MovieDialog(MOVIE_DIALOG))
            .addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    async run(context, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    async introStep(stepContext) {
        if (!process.env.LuisAppId || !process.env.LuisAPIKey || !process.env.LuisAPIHostName) {
            await stepContext.context.sendActivity('NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.');
            return await stepContext.next();
        }

        return await stepContext.prompt('TextPrompt', { prompt: 'What can I help you with today?"' });
    }

    async actStep(stepContext) {
        let movieDetails = {};

        if (process.env.LuisAppId && process.env.LuisAPIKey && process.env.LuisAPIHostName) {
            movieDetails = await LuisHelper.executeLuisQuery(this.logger, stepContext.context);

            this.logger.log('LUIS extracted these food details:', movieDetails);
        }

        return await stepContext.beginDialog('movieialog', movieDetails);
    }

    async finalStep(stepContext) {
        if (stepContext.result) {
            const result = stepContext.result;
            const timeProperty = new TimexProperty(result.travelDate);
            const travelDateMsg = timeProperty.toNaturalLanguage(new Date(Date.now()));
            const msg = `I have you booked to ${ result.movie } from ${ result.theater } on ${ travelDateMsg }.`;
            await stepContext.context.sendActivity(msg);
        } else {
            await stepContext.context.sendActivity('Thank you.');
        }
        return await stepContext.endDialog();
    }
}

module.exports.MainDialog = MainDialog;