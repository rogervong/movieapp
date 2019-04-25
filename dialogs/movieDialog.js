const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { DateResolverDialog } = require('./dateResolverDialog');

const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'textPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

class MovieDialog extends CancelAndHelpDialog {
    constructor(id) {
        super(id || 'movieDialog');

        this.addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.movieStep.bind(this),
                this.theaterStep.bind(this),
                this.travelDateStep.bind(this),
                this.confirmStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async movieStep(stepContext) {
        const movieDetails = stepContext.options;

        if (!movieDetails.movie) {
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'What movie would you like to watch?' });
        } else {
            return await stepContext.next(movieDetails.movie);
        }
    }

    async theaterStep(stepContext) {
        const movieDetails = stepContext.options;
        
        movieDetails.movie = stepContext.result;
        if (!movieDetails.theater) {
            return await stepContext.prompt(TEXT_PROMPT, { prompt: 'What movie theater do you want to go to?' });
        } else {
            return await stepContext.next(movieDetails.theater);
        }
    }

    async travelDateStep(stepContext) {
        const movieDetails = stepContext.options;
        
        movieDetails.theater = stepContext.result;
        if (!movieDetails.travelDate || this.isAmbiguous(movieDetails.travelDate)) {
            return await stepContext.beginDialog(DATE_RESOLVER_DIALOG, { date: movieDetails.travelDate });
        } else {
            return await stepContext.next(movieDetails.travelDate);
        }
    }

    async confirmStep(stepContext) {
        const movieDetails = stepContext.options;
        
        movieDetails.travelDate = stepContext.result;
        const msg = `Please confirm, I have you watching: ${ movieDetails.destination } At: ${ movieDetails.theater } on: ${ movieDetails.travelDate }.`;
        
        return await stepContext.prompt(CONFIRM_PROMPT, { prompt: msg });
    }

    async finalStep(stepContext) {
        if (stepContext.result === true) {
            const movieDetails = stepContext.options;

            return await stepContext.endDialog(movieDetails);
        } else {
            return await stepContext.endDialog();
        }
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.MovieDialog = MovieDialog;