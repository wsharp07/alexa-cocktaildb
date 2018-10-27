/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk');
const axios = require('axios');

/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();


    const speakOutput = 'Welcome to the Cocktail Database. Go ahead and ask me how to make a drink.';
    const repromptOutput = 'Welcome again';

    handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
  },
};

const CocktailHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'lookupCocktail';
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    
    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const cocktail = slots['cocktail'].value;
    console.log("cocktail: " + cocktail);
    
    return new Promise(resolve => {
      getCocktail(cocktail, data => {
        var drink = data.drinks[0];
        var drinkId = drink.idDrink;
        console.log(drinkId);
        sessionAttributes.speakOutput = getIngredientResponse(drink);
        sessionAttributes.repromptSpeech = 'Need more help?';

        resolve(
          handlerInput.responseBuilder
            .speak(sessionAttributes.speakOutput)
            .reprompt(sessionAttributes.repromptSpeech)
            .getResponse()
        );
      });
    });
  }
};

function getCocktail(cocktailName, callback) {
  const baseURL = "https://www.thecocktaildb.com/api/json/v1/1/search.php?s=";
  axios
    .get(baseURL + cocktailName)
    .then(response => {
      callback(response.data);
    });
}

function getIngredientResponse(cocktailObj) {
  var response = "You will need ";
  var ingredientArr = getItemArray(cocktailObj, "strIngredient");
  var measureArr = getItemArray(cocktailObj, "strMeasure");

  const len = ingredientArr.length;
  for (var i = 0; i < len; i++) {
    if (measureArr[i]) {
      response += measureArr[i] + "of " + ingredientArr[i] + ", ";
    }
    else {
      response += ingredientArr[i];
    }
  }
  
  response += ". " + cocktailObj.strInstructions;
  return response;
}

function getItemArray(cocktailObj, prefix) {
  var response = [];
  for (var i =1; i<=15; i++) { 
    if (cocktailObj[prefix + i]) {
      response.push(cocktailObj[prefix + i]); 
    } 
  }
  return response;
}

const HelpHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.speakOutput = 'Need a suggestion? How about you ask me how to make a margarita.';
    sessionAttributes.repromptSpeech = 'Need more help?';
    
    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const RepeatHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    return handlerInput.responseBuilder
      .speak(sessionAttributes.speakOutput)
      .reprompt(sessionAttributes.repromptSpeech)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent');
  },
  handle(handlerInput) {
    const requestAttributes = handlerInput.attributesManager.getRequestAttributes();
    const speakOutput = requestAttributes.t('STOP_MESSAGE', requestAttributes.t('SKILL_NAME'));

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    console.log("Inside SessionEndedRequestHandler");
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  },
};


const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

/* CONSTANTS */
const skillBuilder = Alexa.SkillBuilders.standard();


/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    CocktailHandler,
    HelpHandler,
    RepeatHandler,
    ExitHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
