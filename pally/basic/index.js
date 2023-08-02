// An example of running Pa11y programmatically
'use strict';

const pa11y = require('pa11y');
const htmlReporter = require('pa11y-reporter-html');
const fs = require('fs');

runExample();

// Async function required for us to use await
async function runExample() {
	try {

		// Testhttps://www.tumi.com/
		const result = await pa11y('https://www.tumi.com/', {

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
		fs.appendFile('result.html', html, function (err) {
			if (err) throw err;
			console.log('Saved!');
		  });
       
	} catch (error) {

		// Output an error if it occurred
		console.error(error.message);

	}
}
