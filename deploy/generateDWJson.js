#!/usr/bin/env node

/* eslint no-console: 0 */

// callee must be node bin/generateDWJson.js <SBX>.sandbox.us01.dx.commercecloud.salesforce.com
const fs = require('fs');

const json = JSON.stringify({ hostname: process.argv[2] });
fs.writeFileSync('./dw.json', json, (err) => {
    if (!err) { console.log('Generated'); }
});
