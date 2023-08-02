'use strict';

var Profile = require('./../customer/Profile');

var profilesArr = [
    new Profile(),
    new Profile(),
    new Profile()
];

var SeekableIterator = require('./../util/SeekableIterator');

class CustomerMgr {
    searchProfiles(queryString, sortString, args) {
        return new SeekableIterator(profilesArr);
    }
    close() {
        return true;
    }
}

module.exports = new CustomerMgr;