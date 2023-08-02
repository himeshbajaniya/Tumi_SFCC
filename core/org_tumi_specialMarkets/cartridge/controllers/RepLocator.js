var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('Show', cache.applyDefaultCache, function(req, res, next) {
    var tumiHelpers = require('*/cartridge/scripts/helpers/tumiHelpers');
    var agentDetailsJSON = tumiHelpers.getLocalAgentDetails();
    res.render('/replocator/replocatorLanding', {
        agentDetailsJSON: agentDetailsJSON
    })
    next();
});

module.exports = server.exports();