/**
 * @file This script executes PassThrough AuthN to a remote datastore via RCS
 * @version 0.1.0
 * @keywords passThrough authN _action=authenticate rcs jit justInTime
 */

/**
 * Environment specific config 
 */

var idmEndpoint = "https://<TENANT>/openidm/system";

/**
 * Full Configuration 
 */

var config = {
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    connectorName: "/ldapclustered",
    systemObjectName: "/account",
    nodeName: "***passThroughAuthN"
};

/**
 * Node outcomes
 */

var NodeOutcome = {
    PASS: "Authenticated",
    FAIL: "Not Authenticated",
    ERROR: "Error"
};

/**
 * Log an HTTP response
 * 
 * @param {Response} HTTP response object
 */

function logResponse(response) {
    logger.message(config.nodeName + ": Scripted Node HTTP Response: " + response.getStatus() + ", Body: " + response.getEntity().getString());
}

/**
 * Executes Pass Through AuthN to a System Object via RCS
 * 
 * @param {string} username - username of the user retrieved from sharedState
 * @param {string} password - password of the user retrieved from transientState
 * @param {string} accessToken - Access Token to interface with IDM APIs
 */

function passThrough(username, password, accessToken) {

    var response;

    logger.message(config.nodeName + ": Attempting to AuthN to remote system using username: " + username);

    try {
        var request = new org.forgerock.http.protocol.Request();
        request.setMethod('POST');
        request.setUri(idmEndpoint + config.connectorName + config.systemObjectName + "?_action=authenticate");
        request.getHeaders().add("Authorization", "Bearer " + accessToken);
        request.getHeaders().add("Content-Type", "application/json");
        requestBodyJson = {

            "username": username,
            "password": password

        }; 
        var requestBody = JSON.stringify(requestBodyJson);
        request.setEntity(requestBody);
        response = httpClient.send(request).get();
    }
    catch (e) {
        logger.error(config.nodeName + ": Unable to call IDM System Endpoint. Exception: " + e);
        return NodeOutcome.ERROR;
    }
    logResponse(response);

    if (response.getStatus().getCode() === 200) {
        logger.message(config.nodeName + ": AuthN for User " + username + " succeeded.");
        return NodeOutcome.PASS;
    }
    else if (response.getStatus().getCode() === 401) {
        logger.error(config.nodeName + ": Access token is invalid or user credentials invalid. HTTP Result: " + response.getStatus() + " for user: " + username);
        return NodeOutcome.FAIL;
    }
    else if (response.getStatus().getCode() === 404) {
        logger.message(config.nodeName + " Not found. HTTP Result: " + response.getStatus() + ": ConnectorName: " + config.connectorName + " or SystemObjectName: " + config.systemObjectName + " not found.");
        return NodeOutcome.ERROR;
    }
    //Catch all error
    logger.error(config.nodeName + ": HTTP 5xx or Unknown error occurred");
    return NodeOutcome.ERROR;
}

/**
 * Node entry point
 */

logger.message(config.nodeName + ": node executing");

var username;
var password;
var accessToken;

if (!(username = sharedState.get("username"))) {
    logger.error(config.nodeName + ": Unable to retrieve username from sharedState");
    outcome = NodeOutcome.ERROR;
}

else if (!(password = transientState.get("password"))) {
    logger.error(config.nodeName + ": Unable to retrieve password from transientState");
    outcome = NodeOutcome.ERROR;
}

//Handle datastores which allow binds without supplying a password
else if (password.length === 0) {
    logger.error(config.nodeName + ": Password is empty");
    outcome = NodeOutcome.ERROR;
}

else if (!(accessToken = transientState.get(config.ACCESS_TOKEN_STATE_FIELD))) {
    logger.error(config.nodeName + ": Unable to retrieve Access Token from transientState");
    outcome = NodeOutcome.ERROR;
}

else {
    outcome = passThrough(username, password, accessToken);
}