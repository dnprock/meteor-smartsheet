Smartsheet = {};

// Request Smartsheet credentials for the user
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Smartsheet.requestCredential = function (options, credentialRequestCompleteCallback) {
  // support both (options, callback) and (callback).
  if (!credentialRequestCompleteCallback && typeof options === 'function') {
    credentialRequestCompleteCallback = options;
    options = {};
  } else if (!options) {
    options = {};
  }

  var config = ServiceConfiguration.configurations.findOne({service: 'smartsheet'});
  if (!config) {
    credentialRequestCompleteCallback && credentialRequestCompleteCallback(
      new ServiceConfiguration.ConfigError());
    return;
  }

  var credentialToken = Random.secret();

  // always need this to get user id from smartsheet.
  var requiredScope = ['profile'];
  var scope = ['email'];
  if (options.requestPermissions)
    scope = options.requestPermissions;
  scope = _.union(scope, requiredScope);
  var flatScope = _.map(scope, encodeURIComponent).join('+');

  // https://developers.smartsheet.com/accounts/docs/OAuth2WebServer#formingtheurl
  var accessType = options.requestOfflineToken ? 'offline' : 'online';
  var approvalPrompt = options.forceApprovalPrompt ? 'force' : 'auto';

  var loginStyle = OAuth._loginStyle('smartsheet', config, options);

  var loginUrl =
        'https://www.smartsheet.com/b/authorize' +
        '?response_type=code' +
        '&client_id=' + config.clientId +
        '&scope=READ_SHEETS%20WRITE_SHEETS' +
        '&redirect_uri=' + OAuth._redirectUri('smartsheet', config) +
        '&state=' + OAuth._stateParam(loginStyle, credentialToken)

  // Use Smartsheet's domain-specific login page if we want to restrict creation to
  // a particular email domain. (Don't use it if restrictCreationByEmailDomain
  // is a function.) Note that all this does is change Smartsheet's UI ---
  // accounts-base/accounts_server.js still checks server-side that the server
  // has the proper email address after the OAuth conversation.
  if (typeof Accounts._options.restrictCreationByEmailDomain === 'string') {
    loginUrl += '&hd=' + encodeURIComponent(Accounts._options.restrictCreationByEmailDomain);
  }

  OAuth.launchLogin({
    loginService: "smartsheet",
    loginStyle: loginStyle,
    loginUrl: loginUrl,
    credentialRequestCompleteCallback: credentialRequestCompleteCallback,
    credentialToken: credentialToken,
    popupOptions: { height: 406 }
  });
};
