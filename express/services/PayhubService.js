const config = require('config');
const otp = require('otp');

const payhubUrl = config.get('payhub.url');
const ccpayBubbleReturnUrl = config.get('ccpaybubble.url');
const s2sUrl = config.get('s2s.url');
const ccpayBubbleSecret = config.get('s2s.key');
const microService = config.get('ccpaybubble.microservice');

class PayhubService {
  /**
  * Creates an instance of PayhubService.
  * @param {*} makeHttpRequest
  * @memberof PayhubService
  */
  constructor(makeHttpRequest) {
    this.makeHttpRequest = makeHttpRequest;
  }


  sendToPayhub(req) {
    return this.createAuthToken(req).then(token => this.makeHttpRequest({
      uri: `${payhubUrl}card-payments`,
      body: req.body,
      method: 'POST',
      s2sToken: `${token}`,
      returnUrl: `${ccpayBubbleReturnUrl}`
    }, req));
  }

  createAuthToken(req) {
    const otpPassword = otp({ secret: ccpayBubbleSecret }).totp();
    const serviceAuthRequest = {
      microservice: microService,
      oneTimePassword: otpPassword
    };
    return this.getServiceAuthToken(serviceAuthRequest, req);
  }

  getServiceAuthToken(serviceAuthRequest, req) {
    return this.makeHttpRequest({
      uri: `${s2sUrl}/lease`,
      body: serviceAuthRequest,
      method: 'POST'
    }, req);
  }
}

module.exports = PayhubService;
