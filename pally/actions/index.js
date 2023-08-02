// An example of executing some actions before Pa11y runs.
// This example logs in to a fictional site then waits
// until the account page has loaded before running Pa11y
'use strict';

const pa11y = require('pa11y');
const htmlReporter = require('pa11y-reporter-html');
const fs = require('fs');

runExample();

// Async function required for us to use await
async function runExample() {
	try {

		 
		const result = await pa11y('https://www.tumi.com/p/international-expandable-4-wheeled-carry-on-01171541041/', {
			timeout: 30000,

			// Run some actions before the tests
			actions: [
				'click element #addToCartBtn'
			],

			// Log what's happening to the console
			log: {
				debug: console.log,
				error: console.error,
				info: console.log
			}

		});

		// Output the raw result object
		console.log(result);
		const html = await htmlReporter.results(result);
		fs.appendFile('actionresult.html', html, function (err) {
			if (err) throw err;
			console.log('Saved!');
		  });
       

	} catch (error) {

		// Output an error if it occurred
		console.error(error.message);

	}
}
