'use strict';

// Initialize the program
let program = require('commander');

// Initialize the version
program.version('1.0.0');

program.option('-D, --debug', 'enable verbose output', function () {
    process.env.DEBUG = true;
    process.env.NODE_DEBUG = 'request';
});
program.name('sfcc-deploy-utils');

program
    .command('code:zip')
    .requiredOption('-cfg, --config <config-file>', 'Describes the name of the realm config file.')
    .option('-r, --release <release-name>', 'Describes the name of the releas ename used to identify zip bundles.', 'code')
    .option('-e, --env <env-name>', 'Describes the environment name, defaults to sandbox (e.g. staging, development, ci, sandbox, etc..')
    .description('Prepares and zips all cartridges defined in config into a single release zip for deployment.')
    .allowUnknownOption()
    .action((options) => {
        require('./lib/_prepareCartridges')({
            releaseName: options.release,
            configFile: options.config,
            env: options.env
        });
        require('./lib/_zipCartridges')(options.release);
    });

program
    .command('code:deploy')
    .requiredOption('-cfg, --config <config-file>', 'Describes the name of the realm config file.')
    .option('-r, --release <release-name>', 'Describes the name of the release name used to identify zip bundles.', 'code')
    .option('-e, --env <env-name>', 'Describes the environment name, defaults to sandbox (e.g. staging, development, ci, sandbox, etc..')
    .option('-cid, --clientid <client-id>', 'Describes the client id to deploy code.')
    .option('-cs, --clientsecret <client-secret>', 'Describes the client secret to deploy code.')
    .option('-a, --activate <activate>', 'Activates the code version in the instance.', 'true')
    .option('-pfx, --pfxpath <pfx-path>', 'The path to the certificate to authenticate to the instance')
    .option('-ps, --passphrase <passphrase>', 'The passphrase associated with the given certificate')
    .option('-d, --debug <debug>', 'Enabled debug logging for deploy sfcc-ci command')
    .option('-k, --keep', 'Keep archive')
    .description('Deploys cartridges and activates code version.')
    .action((options) => {
        require('./lib/_deployCartridges')({
            releaseName: options.release,
            configFile: options.config,
            env: options.env,
            cid: options.clientid,
            cs: options.clientsecret,
            activate: (options.activate === true || options.activate === 'true'),
            pfx: options.pfxpath,
            passphrase: options.passphrase,
            keep: options.keep
        });
    });

program
    .command('data:zip')
    .requiredOption('-cfg, --config <config-file>', 'Describes the name of the realm config file.')
    .option('-r, --release <release-name>', 'String to put at the end of generated site import archive.', 'release')
    .option('-e, --env <env-name>', 'Describes the environment name, defaults to sandbox (e.g. staging, development, ci, sandbox, etc..')
    .description('Attempts to zip the specified directory -- representing a storefront data-import.')
    .allowUnknownOption()
    .action((options) => {
        require('./lib/_zipStorefrontData')({
            releaseName: options.release,
            configFile: options.config,
            env: options.env
        });
    });

program
    .command('data:upload')
    .requiredOption('-cfg, --config <config-file>', 'Describes the name of the realm config file.')
    .option('-r, --release <release-name>', 'Describes the name of the site import', 'release')
    .option('-e, --env <env-name>', 'Describes the environment name (e.g. staging, development, ci, sandbox, etc..')
    .option('-cid, --clientid <client-id>', 'Describes the client id to deploy data.')
    .option('-cs, --clientsecret <client-secret>', 'Describes the client secret to deploy data.')
    .option('-t, --timeout <time-out>', 'Timeout to execute import data')
    .option('-pfx, --pfxpath <pfx-path>', 'The path to the certificate to authenticate to the instance')
    .option('-ps, --passphrase <passphrase>', 'The passphrase associated with the given certificate')
    .description('Attempts to zip the specified directory -- representing a storefront data-import.')
    .action((options) => {
        if ((!options.config)) {
            throw new Error('Missing parameters.');
        }
        // Create the site / release archive
        require('./lib/_uploadStorefrontData')({
            releaseName: options.release,
            configFile: options.config,
            env: options.env,
            cid: options.clientid,
            cs: options.clientsecret,
            timeout: options.timeout,
            pfx: options.pfxpath,
            passphrase: options.passphrase
        });
    });

program
    .command('job:execute')
    .requiredOption('-cfg, --config <config-file>', 'Describes the name of the realm config file.')
    .requiredOption('-jid, --jobId <job-id>', 'Describes the id of the job which suppose to be executed.')
    .option('-e, --env <env-name>', 'Describes the environment name, defaults to sandbox (e.g. staging, development, ci, sandbox, etc..')
    .option('-jp, --jobParams [job-params]', 'Describes the required parametres for the job which suppose to be executed.')
    .option('-cid, --clientid <client-id>', 'Describes the client id to execute.')
    .option('-cs, --clientsecret <client-secret>', 'Describes the client secret to deploy code.')
    .description('Executes the search re-indexing and caching invalidate jobs')
    .action((options) => {
        require('./lib/_executeJobs')({
            configFile: options.config,
            jobId: options.jobId,
            jobParams: options.jobParams,
            env: options.env,
            cid: options.clientid,
            cs: options.clientsecret
        });
    });

// Parse the command-line arguments
program.parse(process.argv);
