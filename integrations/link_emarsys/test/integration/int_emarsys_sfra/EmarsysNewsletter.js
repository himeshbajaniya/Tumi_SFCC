var assert = require("chai").assert;
var request = require("request-promise");
var config = require("../it.config");
var cheerio = require("cheerio");

describe("EmarsysNewsletter", function () {
    describe("EmarsysNewsletter-Signup", function () {
        this.timeout(10000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-Signup",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should successfully render the submit form", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".email-signup-wrapper").attr();

                assert.equal(data.class, "email-signup-wrapper");
            });
        });
    });

    describe("EmarsysNewsletter-ErrorPage", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-ErrorPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the error page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-ThankYouPage", function () {
        this.timeout(10000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-ThankYouPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the thankyou page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-AlreadyRegisteredPage", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-AlreadyRegisteredPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the alreadyregistered page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-DataSubmittedPage", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-DataSubmittedPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the datasubmitted page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-EmarsysDisabledTemplate", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-EmarsysDisabledTemplate",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the EmarsysDisabledTemplate page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-FooterSubscription", function () {
        this.timeout(15000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-FooterSubscription",
            method: "POST",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
            httpParameterMap: {
                emailAddress: {
                    value: "Test@test.com",
                },
                formatajax: {
                    value: true,
                },
            },
        };

        it("should subscription with footer", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                return request(myRequest).then(function (myresponse) {
                    assert.equal(
                        myresponse.statusCode,
                        200,
                        "Expected statusCode to be 200."
                    );
                });
            });
        });
    });

    describe("EmarsysNewsletter-Unsubscribe", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-Unsubscribe",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the unsubscribe page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var tagAttributes = $(".show-confirmation-message").attr();
                assert.equal(tagAttributes.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-EmailSettings", function () {
        this.timeout(5000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-EmailSettings",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should render the emailsettings page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );
            });
        });
    });

    describe("EmarsysNewsletter-RedirectToDataSubmittedPage", function () {
        this.timeout(10000);

        var myRequest = {
            url:
                config.baseUrl +
                "/EmarsysNewsletter-RedirectToDataSubmittedPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should redirect to dataSubmittedPage", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-RedirectToThankYouPage", function () {
        this.timeout(10000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-RedirectToThankYouPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should redirect to thankYouPage", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-RedirectToAlreadyRegisteredPage", function () {
        this.timeout(10000);

        var myRequest = {
            url:
                config.baseUrl +
                "/EmarsysNewsletter-RedirectToAlreadyRegisteredPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should redirect the alreadyregistered page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-RedirectToErrorPage", function () {
        this.timeout(10000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-RedirectToErrorPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should redirect to error page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });

    describe("EmarsysNewsletter-RedirectToDisabledPage", function () {
        this.timeout(10000);

        var myRequest = {
            url: config.baseUrl + "/EmarsysNewsletter-RedirectToDisabledPage",
            method: "GET",
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        };

        it("should redirect to the disabled page", function () {
            return request(myRequest).then(function (response) {
                assert.equal(
                    response.statusCode,
                    200,
                    "Expected statusCode to be 200."
                );

                var $ = cheerio.load(response.body);
                var data = $(".show-confirmation-message").attr();

                assert.equal(data.class, "show-confirmation-message");
            });
        });
    });
});
