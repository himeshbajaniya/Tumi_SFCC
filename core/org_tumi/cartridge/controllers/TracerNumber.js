'use strict';

var server = require('server');

/**
 * TraceNumber-Register : The TraceNumber-Register enpoint allows the shopper to submit their Trace Number.
 * @function
 * @param {httpparameter} - traceNumber - Input field,
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */
server.post('Register', function (req, res, next) {
    var Resource = require('dw/web/Resource');

    var traceNumber = req.form.traceNumber;
    if (traceNumber) {
        res.json({
            success: true,
            msg: Resource.msg('subscribe.email.success', 'homePage', null)
        });
    } else {
        res.json({
            error: true,
            msg: Resource.msg('subscribe.email.invalid', 'homePage', null)
        });
    }

    next();
});

module.exports = server.exports();
