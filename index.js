'use strict';
// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ElicitSlot',
			intentName,
			slots,
			slotToElicit,
			message,
			responseCard,
		},
	};
}

function confirmIntent(sessionAttributes, intentName, slots, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'ConfirmIntent',
			intentName,
			slots,
			message,
			responseCard,
		},
	};
}

function close(sessionAttributes, fulfillmentState, message, responseCard) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Close',
			fulfillmentState,
			message,
			responseCard,
		},
	};
}

function delegate(sessionAttributes, slots) {
	return {
		sessionAttributes,
		dialogAction: {
			type: 'Delegate',
			slots,
		},
	};
}

// ---------------- Helper Functions --------------------------------------------------

// build a message for Lex responses
function buildMessage(messageContent) {
	return {
		contentType: 'PlainText',
		content: messageContent
	};
}

// --------------- Functions that control the skill's behavior -----------------------

function kindergartenHi(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage(`Hello, how may I help you? You can check in/out your kid, enrol, report time changes etc`)
	));
}

function kindergartenChildIsLate(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Thank you for updating us about ${slots.name}. We wait for you around ${slots.expectedTimeOfArrival}` )
	));
}

// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {

	console.log(`dispatch userId=${intentRequest.userId}, intent=${intentRequest.currentIntent.name}`);

	const name = intentRequest.currentIntent.name;

	// dispatch to the intent handlers
	if (name.startsWith('KindergartenHi')) {
		return kindergartenHi(intentRequest, callback);
	} else if (name.startsWith('KindergartenChildIsLate')) {
		return kindergartenChildIsLate(intentRequest, callback);
	} 
	throw new Error(`Intent with name ${name} not supported`);
}

// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {

	console.log(JSON.stringify(event));

	try {
		console.log(`event.bot.name=${event.bot.name}`);

		// fail if this function is for a different bot
		if (! event.bot.name.startsWith('DayCareBot')) {
		     callback('Invalid Bot Name');
		}
		dispatch(event, (response) => callback(null, response));
	} catch (err) {
		callback(err);
	}
};
