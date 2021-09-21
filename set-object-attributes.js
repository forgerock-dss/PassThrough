/**
 * @file This script sets user attribute in sharedState ready for the Create or Patch Object nodes to action
 * @version 0.1.0
 * @keywords profile attributes rcs objectAttributes create patch
 */

/**
 * Full Configuration 
 */

var config = {
    nodeName: "***setObjectAttributes",
    REMOTE_PROFILE_FIELD: "remoteProfile"
};

/**
 * Node outcomes
 */

var NodeOutcome = {
    PASS: "Success",
    ERROR: "Error"
};

/**
 * Set profile attribute in the objectAttributes sharedState value
 * 
 * @param {string} username - username of the user retrieved from sharedState
 * @param {string} profileAttributes - profile data attribute retrieved from sharedState
 */

function setProfile(username, profileAttributes) {
    logger.message(config.nodeName + ": Username is: " + username);
    logger.message(config.nodeName + ": New profile attributes are: " + profileAttributes);
    jsonBlock = JSON.parse(profileAttributes);

    for (var property in jsonBlock) {
        logger.message(config.nodeName + ": Data to be added to objectAttributes sharedState:" + property + " value " + jsonBlock[property]);
    }

    sharedState.put("objectAttributes", jsonBlock);
    return NodeOutcome.PASS;
}

/**
 * Node entry point
 */

logger.message(config.nodeName + ": node executing");

var username;
var profileAttributes;

if (!(username = sharedState.get("username"))) {
    logger.error(config.nodeName + ": Unable to retrieve username from sharedState");
    outcome = NodeOutcome.ERROR;
}

else if (!(profileAttributes = sharedState.get(config.REMOTE_PROFILE_FIELD))) {
    logger.error(config.nodeName + ": Unable to retrieve profile attribute from" + config.REMOTE_PROFILE_FIELD + " sharedState attribute");
    outcome = NodeOutcome.ERROR;
}

else {
    outcome = setProfile(username, profileAttributes);
}