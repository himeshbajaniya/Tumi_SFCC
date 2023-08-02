'use strict'

class Customer {
    constructor() {
        this.authenticated = true;
        this.registered = true;
        this.profile = {
            email: "test@test.com",
            addressBook: {
                preferredAddress: {
                    countryCode: {
                        value: ''
                    }
                }
            },
            gender: {
                value: '1'
            }
        }
    }
}

module.exports = Customer;
