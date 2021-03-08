'use strict';
/* eslint-disable no-irregular-whitespace */
/* eslint-disable indent */
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const request = require('superagent');
const URL = require('url');
const UUID = require('uuid/v4');
const { ApiErrorFactory } = require('./errors');
const { Logger } = require('@hmcts/nodejs-logging');
// const route = require('../app');


const errorFactory = ApiErrorFactory('security.js');

const constants = Object.freeze({
  SECURITY_COOKIE: '__auth-token',
  SECURITY_COOKIE_ID: '__id-token',
  SECURITY_REFRESH_COOKIE: '__refresh-token',
  REDIRECT_COOKIE: '__redirect',
  USER_COOKIE: '__user-info',
  CSRF_TOKEN: '_csrf',
  ACCESS_TOKEN_OAUTH2: 'access_token',
  ID_TOKEN_OAUTH2: 'id_token'
});

// const ACCESS_TOKEN_OAUTH2 = 'access_token';

function Security(options) {
  this.opts = options || {};
  if (!this.opts.loginUrl) {
    throw new Error('login URL required for Security');
  }
}

/* --- INTERNAL --- */

function addOAuth2Parameters(url, state, self, req) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside addOAuth2Parameters function');
  url.query.response_type = 'code';
  url.query.state = state;
  url.query.scope = 'openid profile roles';
  url.query.client_id = self.opts.clientId;
  url.query.redirect_uri = `https://${req.get('host')}${self.opts.redirectUri}`;
  if (req.session) {
    // Logger.getLogger('CCPAY-BUBBLE: security.js -> addOAuth2Parameters + SessionId').info(req.sessionId);
    req.session.testing = 'testing';
  }
  if (req.session) {
    req.session.name = 'testing';
  }
  Logger.getLogger('CCPAY-BUBBLE: security.js -> addOAuth2Parameters').info(req.session.name);
  Logger.getLogger('CCPAY-BUBBLE: security.js-> addOAuth2Parameters').info(req.session.testing);
}

function generateState() {
  return UUID();
}

// function storeRedirectCookie(req, res, continueUrl, state) {
//   const url = URL.parse(continueUrl);
//   const cookieValue = { continue_url: url.path, state };
//   if (req.protocol === 'https') {
//     res.cookie(constants.REDIRECT_COOKIE, JSON.stringify(cookieValue),
//       { secure: true, httpOnly: true });
//   } else {
//     res.cookie(constants.REDIRECT_COOKIE, JSON.stringify(cookieValue),
//       { httpOnly: true });
//   }
// }
function storeRedirectSessionCookie(req, continueUrl, state) {
  Logger.getLogger('CCPAY-BUBBLE: security.js ->storeRedirectSessionCookie1 ').info(continueUrl);
  const url = URL.parse(continueUrl);
  const cookieValue = { continue_url: url.path, state };
  if (req.protocol === 'https') {
    req.session[constants.REDIRECT_COOKIE] = JSON.stringify(cookieValue);
  } else {
    req.session[constants.REDIRECT_COOKIE] = JSON.stringify(cookieValue);
  }
  Logger.getLogger('CCPAY-BUBBLE: security.js->storeRedirectSessionCookie2').info(req.session[constants.REDIRECT_COOKIE]);
}

function login(req, res, roles, self) {
  Logger.getLogger('CCPAY-BUBBLE: security.js ->login ').info('inside Login function');
  const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const state = generateState();
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('login function before redirectsessioncookie');
  // storeRedirectCookie(req, res, originalUrl, state);
  storeRedirectSessionCookie(req, originalUrl, state);

  let url = null;

  if (roles.includes('letter-holder')) {
    url = URL.parse(`${self.opts.loginUrl}/pin`, true);
  } else {
    url = URL.parse(self.opts.loginUrl, true);
  }

  addOAuth2Parameters(url, state, self, req);

  res.redirect(url.format());
}

function authorize(req, res, next, self) {
  Logger.getLogger('PAYBUBBLE: server.js -> error santosh1').info('Inside authorize function');
  if (req.roles !== null) {
    for (const role in self.roles) {
      if (req.roles.includes(self.roles[role])) {
        res.cookie(constants.USER_COOKIE, JSON.stringify(req.userInfo));
        req.session[onstants.USER_COOKIE] = JSON.stringify(req.userInfo);
        return next();
      }
    }
  }
  const error = errorFactory.createForbiddenError(null, `ERROR: Access forbidden - User does not have any of ${self.roles}. Actual roles:${req.roles}`);
  return next(error);
}

function getTokenFromCode(self, req) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside getTokenFromCode function');
  const url = URL.parse(`${self.opts.apiUrl}/o/token`, true);

  return request.post(url.format())
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .type('form')

    .send({ client_id: self.opts.clientId })
    .send({ client_secret: self.opts.clientSecret })
    .send({ grant_type: 'authorization_code' })
    .send({ code: req.query.code })
    .send({ redirect_uri: `https://${req.get('host')}${self.opts.redirectUri}` });
}

function getUserDetails(self, securityCookie) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside getUserDetails function');
  return request.get(`${self.opts.apiUrl}/o/userinfo`)
    .set('Accept', 'application/json')
    .set('Authorization', `Bearer ${securityCookie}`);
}

// function storeCookie(req, res, token, cookieName) {
//   req.authToken = token;

//   if (req.protocol === 'https') { /* SECURE */
//     res.cookie(cookieName, req.authToken, { secure: true, httpOnly: true });
//   } else {
//     res.cookie(cookieName, req.authToken, { httpOnly: true });
//   }
// }

function storeSession(req, token, sessionName) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside storeSession function');
  req.authToken = token;
  if (req.protocol === 'https') { /* SECURE */
    req.session[sessionName] = req.authToken;
  } else {
    req.session[sessionName] = req.authToken;
  }
}

// function handleCookie(req) {
//   if (req.cookies && req.cookies[constants.SECURITY_COOKIE]) {
//     req.authToken = req.cookies[constants.SECURITY_COOKIE];
//     return req.authToken;
//   }

//   return null;
// }

function handleSession(req) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside handleSession function');
  if (req.session && req.session[constants.SECURITY_COOKIE]) {
    req.authToken = req.session[constants.SECURITY_COOKIE];
    return req.authToken;
  }
    return null;
}

// function invalidateToken(self, req) {
//   const url = URL.parse(`${self.opts.apiUrl}/session/${req.cookies[constants.SECURITY_COOKIE]}`, true);
//   return request.delete(url.format())
//     .auth(self.opts.clientId, self.opts.clientSecret);
// }

function invalidatesUserToken(self, securityCookie) {
  return request

    .get(`${self.opts.apiUrl}/o/endSession`)
    .query({ id_token_hint: securityCookie, post_logout_redirect_uri: '/logout' })
    .set('Accept', 'application/json');
}

Security.prototype.logout = function logout() {
  const self = { opts: this.opts };

  // eslint-disable-next-line no-unused-vars
  return function ret(req, res) {
    const token = req.cookies[constants.SECURITY_COOKIE_ID];
    return invalidatesUserToken(self, token).end(err => {
      if (err) {
        Logger.getLogger('CCPAY-BUBBLE: security.js').error(err);
      }
      // const token1 = req.cookies[constants.SECURITY_COOKIE];

      res.clearCookie(constants.SECURITY_COOKIE);
      res.clearCookie(constants.REDIRECT_COOKIE);
      res.clearCookie(constants.USER_COOKIE);
      res.clearCookie(constants.authToken);
      res.clearCookie(constants.userInfo);
      if (token) {
        res.redirect(`${self.opts.webUrl}/login/logout?jwt=${token1}`);
      } else {
        res.redirect(`${self.opts.webUrl}/login/logout`);
      }
    });
  };
};

function protectImpl(req, res, next, self) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside protectImpl function');
  if (self.exceptUrls) {
    for (let i = 0; i < self.exceptUrls.length; i++) {
      if (req.url.includes(self.exceptUrls[i])) {
        return next();
      }
    }
  }
  let securityCookie = null;
  if (process.env.NODE_ENV === 'development') {
    if (req.method === 'OPTIONS') {
      return next();
    }
    // req.cookies[constants.SECURITY_COOKIE] = req.header('Auth-Dev');
    req.session[constants.SECURITY_COOKIE] = req.header('Auth-Dev');
  }
  Logger.getLogger('CCPAY-BUBBLE: security.js -> Inside protectImpl function security cookie1').info(req.header('Auth-Dev'));
  Logger.getLogger('PAYBUBBLE: server.js -> Inside protectImpl function security cookie').info(req.session[constants.SECURITY_COOKIE]);
  // securityCookie = handleCookie(req);
  securityCookie = handleSession(req);

  if (!securityCookie) {
    return login(req, res, self.roles, self);
  }

  Logger.getLogger('PAYBUBBLE: server.js -> error').info('About to call user details endpoint');
  return getUserDetails(self, securityCookie).end(
    (err, response) => {
      Logger.getLogger('CCPAY-BUBBLE: security.js').info('Welcome pay bubble');
      if (err) {
        Logger.getLogger('PAYBUBBLE: server.js -> error').info(`Get user details called with the result: err: ${err}`);
        if (!err.status) {
          err.status = 500;
        }

        switch (err.status) {
        case UNAUTHORIZED:
          return login(req, res, self.roles, self);
        case FORBIDDEN:
          return next(errorFactory.createForbiddenError(err, 'getUserDetails() call was forbidden'));
        default:
          return next(errorFactory.createServerError(err, 'getUserDetails() call failed'));
        }
      }

      self.opts.appInsights.setAuthenticatedUserContext(response.body.sub);
      req.roles = response.body.roles;
      req.userInfo = response.body;
      return authorize(req, res, next, self);
    });
}

Security.prototype.protect = function protect(role, exceptUrls) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('protect');
  const self = {
    roles: [role],
    new: false,
    opts: this.opts,
    exceptUrls
  };

  return function ret(req, res, next) {
    Logger.getLogger('CCPAY-BUBBLE: security.js').info('before calling protectimpl function');
    // Logger.getLogger('CCPAY-BUBBLE: security.js').info(req);
    // Logger.getLogger('CCPAY-BUBBLE: security.js').info(req.session);
    // Logger.getLogger(req.session);
    protectImpl(req, res, next, self);
  };
};

Security.prototype.protectWithAnyOf = function protectWithAnyOf(roles, exceptUrls) {
  const self = {
    roles,
    new: false,
    opts: this.opts,
    exceptUrls
  };
  // Logger.getLogger('CCPAY-BUBBLE: security.js').info('before calling protectimpl in protectWithAnyOf1 function');
  return function ret(req, res, next) {
    Logger.getLogger('CCPAY-BUBBLE: security.js').info('before calling protectimpl in protectWithAnyOf function');
    // Logger.getLogger('CCPAY-BUBBLE: security.js').info(req);
    Logger.getLogger('CCPAY-BUBBLE: security.js').info(req.sessionId);
    protectImpl(req, res, next, self);
  };
};

Security.prototype.protectWithUplift = function protectWithUplift(role, roleToUplift) {
  const self = {
    role,
    roleToUplift,
    new: false,
    opts: this.opts
  };
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('protectWithUplift function');
  return function ret(req, res, next) {
    /* Read the value of the token from the cookie */
    // const securityCookie = handleCookie(req);
    Logger.getLogger('CCPAY-BUBBLE: security.js').info('protectWithUplift function');
    Logger.getLogger('CCPAY-BUBBLE: security.js').info(req);
    Logger.getLogger('CCPAY-BUBBLE: security.js').info(req.session);
    const securityCookie = handleSession(req);

    if (!securityCookie) {
      return login(req, res, self.role, self);
    }

    return getUserDetails(self, securityCookie)
      .end((err, response) => {
        if (err) {
          /* If the token is expired we want to go to login.
          * - This invalidates correctly sessions of letter users that does not exist anymore
          */
          if (err.status === UNAUTHORIZED) {
            return login(req, res, [], self);
          }
          return next(errorFactory.createUnatohorizedError(err, `getUserDetails() call failed: ${response.text}`));
        }

        req.roles = response.body.roles;
        req.userInfo = response.body;

        if (req.roles.includes(self.role)) { /* LOGGED IN ALREADY WITH THE UPLIFTED USER */
          return next();
        }

        if (!req.roles.includes(self.roleToUplift)) {
          return next(errorFactory.createUnatohorizedError(err, 'This user can not uplift'));
        }

        /* REDIRECT TO UPLIFT PAGE */
        const originalUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

        const state = generateState();
        storeRedirectSessionCookie(req, originalUrl, state);
        // storeRedirectCookie(req, res, originalUrl, state);

        const url = URL.parse(`${self.opts.loginUrl}/uplift`, true);
        addOAuth2Parameters(url, state, self, req);
        url.query.jwt = securityCookie;

        return res.redirect(url.format());
      });
  };
};

// function getRedirectCookie(req) {
//   if (!req.cookies[constants.REDIRECT_COOKIE]) {
//     return null;
//   }

//   return JSON.parse(req.cookies[constants.REDIRECT_COOKIE]);
// }

function getRedirectSessionCookie(req) {
  Logger.getLogger('CCPAY-BUBBLE: security.js').info('Inside getRedirectSessionCookie function');
  Logger.getLogger('CCPAY-BUBBLE: security.js').info(req.session);
  Logger.getLogger('CCPAY-BUBBLE: security.js').info(req.session[constants.REDIRECT_COOKIE]);
  if (!req.session[constants.REDIRECT_COOKIE]) {
    return null;
  }

   return JSON.parse(req.session[constants.REDIRECT_COOKIE]);
}

/* Callback endpoint */
Security.prototype.OAuth2CallbackEndpoint = function OAuth2CallbackEndpoint() {
  // Logger.getLogger('PAYBUBBLE: server.js -> error santosh4').info(req.sessionName);
  const self = { opts: this.opts };
  Logger.getLogger('PAYBUBBLE: server.js -> error santosh4').info('Inside OAuth2CallbackEndpoint function');
  // Logger.getLogger('PAYBUBBLE: server.js -> error santosh').info(self);
  return function ret(req, res, next) {
    Logger.getLogger('PAYBUBBLE: server.js -> error santosh5').info(req.session);
    /* We clear any potential existing sessions first, as we want to start over even if we deny access */
    res.clearCookie(constants.SECURITY_COOKIE);
    res.clearCookie(constants.USER_COOKIE);
    // req.session.name = 'ok';
    /* We check that our stored state matches the requested one */
    // const redirectInfo = getRedirectCookie(req);
    const redirectInfo = getRedirectSessionCookie(req);

    if (!redirectInfo) {
      return next(errorFactory.createUnatohorizedError(null, 'Redirect cookie is missing'));
    }

    if (redirectInfo.state !== req.query.state) {
      return next(errorFactory.createUnatohorizedError(null, `States do not match: ${redirectInfo.state} is not ${req.query.state}`));
    }

    if (!redirectInfo.continue_url.startsWith('/')) {
      return next(errorFactory.createUnatohorizedError(null, `Invalid redirect_uri: ${redirectInfo.continue_url}`));
    }

    if (!req.query.code) {
      return res.redirect(redirectInfo.continue_url);
    }

    return getTokenFromCode(self, req).end((err, response) => { /* We ask for the token */
      if (err) {
        Logger.getLogger('PAYBUBBLE: server.js -> error').info('Inside OAuth2CallbackEndpoint function getTokenFromCode failed');
        return next(errorFactory.createUnatohorizedError(err, 'getTokenFromCodetest call failed'));
      }
      Logger.getLogger(response.body[constants.ACCESS_TOKEN_OAUTH2]);
      Logger.getLogger(response.body[constants.ID_TOKEN_OAUTH2]);
      /* We store it in a session cookie */
      const accessToken = response.body[constants.ACCESS_TOKEN_OAUTH2];
      const idToken = response.body[constants.ID_TOKEN_OAUTH2];
      // storeCookie(req, res, accessToken, constants.SECURITY_COOKIE);
      // storeCookie(req, res, idToken, constants.SECURITY_COOKIE_ID);
      storeSession(req, accessToken, constants.ACCESS_TOKEN_OAUTH2);
      storeSession(req, idToken, constants.IDTOKEN_COOKIE);
      /* We delete redirect cookie */
      res.clearCookie(constants.REDIRECT_COOKIE);

      /* We initialise appinsight with user details */
      getUserDetails(self, req.authToken).end(
        (error, resp) => {
          if (!error) {
            const userInfo = resp.body;
            self.opts.appInsights.setAuthenticatedUserContext(userInfo.sub);
            self.opts.appInsights.defaultClient.trackEvent({ name: 'login_event', properties: { role: userInfo.roles } });
          }
        }
      );

      /* And we redirect back to where we originally tried to access */
      return res.redirect(redirectInfo.continue_url);
    });
  };
};

module.exports = {
  Security,
  constants
};