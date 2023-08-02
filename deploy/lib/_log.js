const chalk = require('chalk');
module.exports = {
    logInfo: (msg) => {
        console.log(msg);
    },
    logError: (msg) => {
        console.log(chalk.red(msg));
    },
    logSuccess: (msg) => {
        console.log(chalk.green(msg));
    },
    logHeading: (msg) => {
        console.log(`-----------------------------------\n${msg}\n-----------------------------------\n`);
    }
};
