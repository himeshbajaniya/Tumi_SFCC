var base = module.superModule;
var URLUtils = require('dw/web/URLUtils');

/**
 * Middleware validating if user logged in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
base.validateLoggedIn = function (req, res, next) {
    if (!req.currentCustomer.profile) {
        if (req.querystring.args) {
            req.session.privacyCache.set('args', req.querystring.args);
        }

        var target = req.querystring.rurl || 1;

        res.redirect(URLUtils.url('Home-Show', 'rurl', target));
    }
    next();
}

module.exports = base;
