/**
 * @file This script acquires an access token with the fr:idm:* scope in order to interact with IDM APIs
 * @version 0.1.0
 * @keywords idm accesstoken integration oauth2
 * @source common_get_access_token_for_idm/am/src/get-idm-access-token.js
 */

/**
 * Environment specific config 
 */

 var clientId = "<CLIENT_ID>";
 var clientSecret = "<CLIENT_SECRET>";
 var tokenEndpoint = "https://<TENANT>/am/oauth2/realms/root/realms/<REALM>/access_token";
 var serviceUsername = "<SERVICE_ACCOUNT>";
 var servicePassword = "<PASSWORD>";


/**
 * Full Configuration 
 */

var config = {
  scope: "fr:idm:*",
  nodeName: "***getIDMAccessToken"
};

/**
 * Node outcomes
 */

var NodeOutcome = {
  SUCCESS: "success",
  ERROR: "error"
};

var ACCESS_TOKEN_STATE_FIELD = "idmAccessToken";

/**
 * Log an HTTP response
 * 
 * @param {Response} HTTP response object
 */

function logResponse(response) {
  logger.message(config.nodeName + ": HTTP Response: " + response.getStatus() + ", Body: " + response.getEntity().getString());
}

/**
 * Acquire Access Token using the ROPC flow for:
 */

function getAccessToken() {

  var response;

  logger.message(config.nodeName + ": Getting IDM Access Token");

  try {
    var request = new org.forgerock.http.protocol.Request();
    request.setUri(tokenEndpoint);
    request.setMethod("POST");
    request.getHeaders().add("Content-Type", "application/x-www-form-urlencoded");
    var params = "grant_type=password" +
      "&client_id=" + clientId +
      "&client_secret=" + clientSecret +
      "&scope=" + config.scope +
      "&username=" + serviceUsername +
      "&password=" + servicePassword;
    request.setEntity(params);
    response = httpClient.send(request).get();
  }
  catch (e) {
    logger.error(config.nodeName + ": Unable to call Access Token endpoint: " + tokenEndpoint + " exception:" + e);
    return NodeOutcome.ERROR;
  }

  logResponse(response);

  if (response.getStatus().getCode() === 200) {
    var oauth2response = JSON.parse(response.getEntity().getString());
    var accessToken = oauth2response.access_token;
    logger.message(config.nodeName + ": Access Token acquired: " + accessToken);
    transientState.put(ACCESS_TOKEN_STATE_FIELD, accessToken);
    return NodeOutcome.SUCCESS;
  }
  else {
    logger.error(config.nodeName + ": Unable to acquire Access Token. " + "HTTP Result: " + response.getStatus() + " for OAuth2 client: " + clientId + " with scope: " + config.scope + " against service user: " + serviceUsername);
    return NodeOutcome.ERROR;
  }
}

/**
 * Node entry point
 */

logger.message(config.nodeName + ": node executing");
outcome = getAccessToken();