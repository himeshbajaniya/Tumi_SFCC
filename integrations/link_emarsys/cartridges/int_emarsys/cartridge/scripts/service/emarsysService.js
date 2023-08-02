/**
* Initialization script for the Emarsys API services
*/
var dwLogger = require('dw/system/Logger');
var Logger = dwLogger.getLogger('emarsys');

module.exports = {
    call: function (endpoint, requestBody, requestMethod) {
        var service = this.getService({
            requestMethod: requestMethod,
            endpoint: endpoint
        });

        var result;

        try {
            result = empty(requestBody) ? service.call() : service.call(requestBody);
        } catch (err) {
            Logger.error(err.fileName + ': service call error - ' + err.message);
        }

        if (result.error || result.status === 'ERROR' || result.status === 'SERVICE_UNAVAILABLE') {
            Logger.error('emarsysService.js - ' + result.errorMessage);
        }

        return result;
    },

    /**
     * @description Helper method to create service authorization string
     * @param {Object} service service
     * @private
     * @return {string} Returns service authorization data
     */
    getAuthorizationData: function (service) {
        var crypto = require('dw/crypto');
        var Bytes = require('dw/util/Bytes');
        var StringUtils = require('dw/util/StringUtils');

        var date = new Date();
        var created = date.toISOString();
        var credentials = service.getConfiguration().getCredential();
        var password = credentials.getPassword();
        var username = credentials.getUser();
        var Random = new crypto.SecureRandom();
        var RandomBytes = Random.generateSeed(16);
        var nonce = crypto.Encoding.toHex(RandomBytes);
        var hashing = new crypto.WeakMessageDigest(crypto.WeakMessageDigest.DIGEST_SHA_1);
        var passwordDigest = nonce + created + password;

        passwordDigest = StringUtils.encodeBase64(hashing.digest(new Bytes(passwordDigest)));

        return StringUtils.format(
            'UsernameToken Username="{0}", PasswordDigest="{1}", Nonce="{2}", Created="{3}"',
            username,
            passwordDigest,
            nonce,
            created
        );
    },

    /**
     * @description Constructs local service
     * @private
     * @param {Object} params params
     * @param {string} params.requestMethod requestMethod
     * @param {string} params.endpoint endpoint
     * @returns {dw.svc.HTTPService} JSON
     */
    getService: function (params) {
        var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
        var self = this;

        return LocalServiceRegistry.createService('emarsys.api', {
            createRequest: function (service, requestBody) {
                var authorization = self.getAuthorizationData(service);
                var requestUrl = service.getURL() + params.endpoint;

                var version = require('dw/system/System').getCompatibilityMode();
                var emarsysVersion = require('dw/web/Resource').msg('emarsys.version', 'emarsysinfo', null);
                var plugin = 'SFRA-' + emarsysVersion + '-' + version;

                service.addHeader('X-WSSE', authorization);
                service.addHeader('x-plugin', plugin);
                service.setRequestMethod(params.requestMethod);
                service.setURL(requestUrl);

                switch (params.requestMethod) {
                    case 'POST':
                    case 'PUT':
                        service.addHeader('Content-Type', 'application/json');
                        break;

                    default:
                }

                return JSON.stringify(requestBody);
            },
            parseResponse: function (service, response) {
                return response && response.text;
            },
            filterLogMessage: function (msg) {return msg;}
        });
    }
};
