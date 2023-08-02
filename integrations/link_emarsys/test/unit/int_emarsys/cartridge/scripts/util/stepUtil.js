var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var mockPath = './../../../../../mocks/';

var Calendar = require(mockPath + 'dw/util/Calendar');
var Site = require(mockPath + 'dw/system/Site');
var StringUtils = require(mockPath + 'dw/util/StringUtils');

var cartridgePath = '../../../../../../cartridges/int_emarsys/';

var StepUtil = proxyquire(cartridgePath + 'cartridge/scripts/util/stepUtil.js', {
    'dw/util/Calendar': Calendar,
    'dw/util/StringUtils': StringUtils,
    'dw/system/Site': Site
});

describe('step util', () => {
    global.empty = function(val) {
        if (val === undefined || val == null || val.length <= 0) {
            return true;
        } else {
            return false;
        }
    };

    it('Testing method: isDisabled', () => {
        var params = {
            IsDisabled: true
        };
        var res = StepUtil.isDisabled(params);
        assert.equal(res, true);
    });
    it('Testing method: isDisabled, empty param', () => {
        var res = StepUtil.isDisabled();
        assert.equal(res, false);
    });

    it('Testing method: replacePathPlaceholders; empty path', () => {
        var res = StepUtil.replacePathPlaceholders();
        assert.isUndefined(res);
    });

    it('Testing method: replacePathPlaceholders', () => {
        var path = '_today_; _now_; _siteid_';
        var nowStr = StringUtils.formatCalendar(new Calendar(), 'YYYY-MM-dd');
        var result = nowStr + '; ' + nowStr + '_HH-mm-ss-SSS; siteName';

        var res = StepUtil.replacePathPlaceholders(path);
        assert.equal(res, result);
    });
});
