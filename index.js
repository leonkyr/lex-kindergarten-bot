'use strict';

// const KindergartenAPI = require('./kindergarten-api');
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

function allSlotsAreEmpty(slots) {
	for (const name in slots) {
        if (slots[name] !== null && slots[name] != "")
            return false;
    }
    return true;
}

function allSlotsAreNoneEmpty(slots) {
	for (const name in slots) {
        if (slots[name] === null || slots[name] === '')
            return false;
    }
    return true;
}

// --------------- Functions that control the skill's behavior -----------------------

function kindergartenHi(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage(`Hello, how may I help you? You can check in/out your kid, enrol, report time changes etc`)
	));
}

function kindergartenOnboarding(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage(`You can check in/out your kid, enrol into a waiting list, report absence/late drop off or pick up, dietary changes etc`)
	));
}

function kindergartenChildIsLate(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;

	// call KindergartenAPI

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Thank you for updating us about ${slots.name}. We wait for you around ${slots.expectedTimeOfArrival}` )
	));
}

function kindergartenAbsence(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;

	// call KindergartenAPI

	let absence = `from ${slots.startDay} till ${slots.endDay}`;
	if (slots.startDay === slots.endDay) { // cover cases: today/tomorrow
		absence = `for slots.startDay`;
	}

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Thank you for updating us about ${slots.name}. I marked down the absence ${absence}` )
	));
}

function kindergartenEnrolment(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;
	
	if (intentRequest.invocationSource === 'DialogCodeHook' && allSlotsAreEmpty(slots)) {
		if (intentRequest.currentIntent.confirmationStatus === 'Confirmed') {
			// this is our confirmation to ask some questions
			callback(delegate(outputSessionAttributes, slots));
			return;
		}

		callback(confirmIntent(outputSessionAttributes, 'KindergartenEnrolment', slots, 
			buildMessage( `I can enrol you right here, but I need to ask you a few questions. Is it OK?` )
		));
		return;
	}

	// we need all slots to continue
	if (!allSlotsAreNoneEmpty(slots)) {
		callback(delegate(outputSessionAttributes, slots));
		return;
	}

	// call KindergartenAPI

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Looks like I have everything I need. ${slots.parentName}, I will contact you right here or via email if we have further questions or news.` )
	));
}

function kindergartenFood(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;
	
	// call KindergartenAPI

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Looks like I have everything I need. I will contact you right here or via email if we have further questions or news. Thank you for enroling ${slots.parentName}` )
	));
}

function kindergartenCheckInOut(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;
	
	// call KindergartenAPI

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Got it. Thanks.` )
	));
}

function kindergartenLatePickup(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	const source = intentRequest.invocationSource;
	const slots = intentRequest.currentIntent.slots;
	
	if (intentRequest.invocationSource === 'DialogCodeHook' && allSlotsAreEmpty(slots)) {
		if (intentRequest.currentIntent.confirmationStatus === 'Confirmed') {
			// this is our confirmation to ask some questions
			callback(delegate(outputSessionAttributes, slots));
			return;
		}

		callback(confirmIntent(outputSessionAttributes, 'KindergartenLatePickup', slots, 
			buildMessage( `Just as a reminder, if you arrive after 4pm and until 6pm, you will be charged 25$ as after day care fee. Every MINUTE after 6pm is charged at 5$ per minuter, sorry for this. Do you understand?` )
		));
		return;
	}

	// we need all slots to continue
	if (!allSlotsAreNoneEmpty(slots)) {
		callback(delegate(outputSessionAttributes, slots));
		return;
	}

	// call KindergartenAPI

	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `Got it. I will make sure our personal knows about ${slots.name}'s requirements for ${slots.date}. All the best` )
	));
}

function kindergartenThankYou(intentRequest, callback) {
	const outputSessionAttributes = intentRequest.sessionAttributes;
	
	callback(close(outputSessionAttributes, 'Fulfilled', 
		buildMessage( `You are welcome` )
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
	} else if (name.startsWith('KindergartenOnboarding')) {
		return kindergartenOnboarding(intentRequest, callback);
	} else if (name.startsWith('KindergartenChildIsLate')) {
		return kindergartenChildIsLate(intentRequest, callback);
	} else if (name.startsWith('KindergartenAbsence')) {
		return kindergartenAbsence(intentRequest, callback);
	} else if (name.startsWith('KindergartenEnrolment')) {
		return kindergartenEnrolment(intentRequest, callback);
	} else if (name.startsWith('KindergartenFood')) {
		return kindergartenFood(intentRequest, callback);
	} else if (name.startsWith('KindergartenCheckInOut')) {
		return kindergartenCheckInOut(intentRequest, callback);
	} else if (name.startsWith('KindergartenLatePickup')) {
		return kindergartenLatePickup(intentRequest, callback);
	} else if (name.startsWith('KindergartenThankYou')) {
		return kindergartenThankYou(intentRequest, callback);
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
