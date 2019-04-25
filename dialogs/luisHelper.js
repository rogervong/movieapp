const { LuisRecognizer } = require('botbuilder-ai');

class LuisHelper {

    static async executeLuisQuery(logger, context) {
        const movieDetails = {};

        try {
            const recognizer = new LuisRecognizer({
                applicationId: process.env.LuisAppId,
                endpointKey: process.env.LuisAPIKey,
                endpoint: `https://${ process.env.LuisAPIHostName }`
            }, {}, true);

            const recognizerResult = await recognizer.recognize(context);

            const intent = LuisRecognizer.topIntent(recognizerResult);

            movieDetails.intent = intent;

            if (intent === 'MovieTickets.Book') {
                // We need to get the result from the LUIS JSON which at every level returns an array

                movieDetails.movie= LuisHelper.parseCompositeEntity(recognizerResult, 'MovieTickets.MovieTitle');
                movieDetails.theater = LuisHelper.parseCompositeEntity(recognizerResult, 'MovieTickets.PlaceName');                        
                movieDetails.travelDate = LuisHelper.parseDatetimeEntity(recognizerResult);
            }
        } catch (err) {
            logger.warn(`LUIS Exception: ${ err } Check your LUIS configuration`);
        }
        return movieDetails;
    }

    static parseCompositeEntity(result, compositeName, entityName) {
        const compositeEntity = result.entities[compositeName];
        if (!compositeEntity || !compositeEntity[0]) return undefined;

        const entity = compositeEntity[0][entityName];
        if (!entity || !entity[0]) return undefined;

        const entityValue = entity[0][0];
        return entityValue;
    }

    static parseDatetimeEntity(result) {
        const datetimeEntity = result.entities['datetime'];
        if (!datetimeEntity || !datetimeEntity[0]) return undefined;

        const timex = datetimeEntity[0]['timex'];
        if (!timex || !timex[0]) return undefined;

        const datetime = timex[0].split('T')[0];
        return datetime;
    }
}

module.exports.LuisHelper = LuisHelper;
