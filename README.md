# TUMI SFCC -Project Charlie


## Why use it?
TUMI SFCC is organized into the followin folder Structure to make the management of code easier.We try to follow a single Git Repo still keeping the ability to retain the plug and play nature of the various market place vendors

Folder Structure :

  ```
  .
  +-- storefront-reference-**applicaton******
  +-- core
  +-- integrations
  +-- deploy
  +-- sfra-webpack-builder
  +-- node_modules
  +----- ....
  ```


- The Base SFRA folder from SFCC will be in its own folder
- The core cartrdges being developed for tumi- org_tumi,tumi_US,tumi_CA will be part of hte core folder
- the integrations folder holds all the market place and custom integrations. For Example   Cybersrouce ,paypal,applepay scene7 are all part of this folder
- SFRA Webpack builder will be leveraged for build and compilation
- the folder deploy has the scripts to deploy the code  to the environment
- Supports reuse of node_modules dependencies from other cartridges

## SFRA Webpack Builder
Webpack can be cumbersome to setup, especially in multicartridge projects for SFRA.
This plugin let you bundle all your `js`, `scss` and `jsx` files out of the box.

- One pre-build `webpack.config.js` for all cartridges and plugins
- No more `sgmf-script`, which interferes with `Prophet uploader`
- Supports multicartridge projects due to simple configuration
- Supports aliases for `commonjs` or `esm` loading
- Supports eslint while watching
- Supports reuse of node_modules dependencies from other cartridges

## Prerequisite

The entire set up is using node 14.8.2 and NPM 8.4.1, please set up your local environment to use the same  to avoid issues or keep the bitbucket yaml file  so that the docker images created work  as they have been tested for the same

### Structure  : sfra-webpack-builder as subfolder
  ```
  .
  +-- storefront-reference-**applicaton******
  +-- core
  +-- integrations
  +-- deploy
  +-- sfra-webpack-builder
  +-- node_modules
  +----- ....
  ```

- Add the commands needed to execute to your `package.json`. Notice the use of `--env local`.
  ```json
   Setting up the local machine 
    - (cd sfra-webpack-builder && npm install)
             - (cd sfra-webpack-builder && npm run postinstall)
             - npm install
             - npm run npmInstall
  ```
 The above commands from the root of the project directory ensure that the workspace is set up for using webpack and deploy commands
## Usage

**configure the path accordingly in `sfraBuilderConfig.js`**


- Configure *cartridges* and *aliases* in `sfraBuilderConfig.js` 

```
module.exports.cartridges = [
  "./integrations/link_cybersource/cartridges/int_cybersource_sfra",
  "./storefront-reference-architecture/cartridges/app_storefront_base",
  "./storefront-reference-architecture/cartridges/bm_app_storefront_base",
  "./storefront-reference-architecture/cartridges/modules",
  "./integrations/link_paypal/cartridges/bm_paypal",
  "./integrations/link_paypal/cartridges/bm_paypal_configuration",
  "./integrations/link_paypal/cartridges/int_paypal",
  "./integrations/link_paypal/cartridges/paypal_credit_financing_options",
  "./integrations/link_paypal/cartridges/paypal_credit_messaging",
  "./integrations/int_scene7",
  "./integrations/plugin_janrain",
  "./integrations/int_valuetec",
  "./integrations/link_emarsys/cartridges/int_emarsys",
  "./core/org_tumi"
];
```

**(Ensure that the paths in `sfraBuilderConfig.js` point correctly to the included SFRA and plugins according to your directory structure)** The paths needs to be set relatively to *webpack.config.js*
- Run `npm run npmInstall`. This will setup all cartridges's node_modules dependencies in the directories which are defined in `sfraBuilderConfig.js` `cartridges` array.
- Run `npm run watch` or `npm run prod`. This will compile all related `js/jsx & css` files included in the directories which are defined in `sfraBuilderConfig.js`

***Make sure you installed node_modules in your plugins as well using npm install command***

### Aliases

`module.exports.aliasConfig` let you specify, how to load module packages inside your plugin. Further information can be found in the [WebpackDocumentation](https://webpack.js.org/configuration/resolve/)

```js
module.exports.aliasConfig = {
    // enter all aliases to configure
    base: path.resolve(
        process.cwd(),
        '../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/'
    ),
    CustomPlugin: path.resolve(
        process.cwd(),
        '../plugin_wishlists/cartridges/plugin_wishlists/cartridge/client/default/'
    )
}
```

The alias `CustomPlugin` allows to retrieve modules through cartridges by using `require('CustomPlugin/default/js/myFile.js');` or `import Foo from CustomPlugin/default/js/myFile`;


### Copying static files

`module.exports.copyConfig` if present, let you specify, which static files you want to copy during the build, for specific cartridge. This feature uses  [CopyWebpackPlugin](https://webpack.js.org/plugins/copy-webpack-plugin/)
The example below is the equivalent of SFRA's `npm run compile:fonts` command.

```js
/**
 * Allows copying files to static folder
 */
 module.exports.copyConfig = {

  "./integrations/link_cybersource/cartridges/int_cybersource_sfra":[
    {
      from: './integrations/link_cybersource/cartridges/int_cybersource_sfra/cartridge/client/default/custom',
      to: 'default/custom'  }
  ],
  "./integrations/link_paypal/cartridges/int_paypal":[
    {
      from: './integrations/link_paypal/cartridges/int_paypal/cartridge/client/precompiled',
      to: 'default/js'  }
  ],
  "./core/org_tumi":[
    {
      from: './core/org_tumi/cartridge/client/default/fonts',
      to: 'default/fonts'  }
  ]
};
```
### Additional SCSS include paths

`module.exports.copyConfig` if present, let you specify custom include paths that you want to be used in compiling SCSS.

```js
/**
 * Allows custom include path config
 */
module.exports.includeConfig = {
  "./cartridges/app_storefront_base": {
    scss: ["my-custom-node_modules"],
  },
};
```

### Setting up for Deployment via build tools

modify the na01-tumi.json  to register the cartridges that are needed for deployments.Also register the different environments to which we need to deploy the code for.

```js
/**
 * Register all the cartridges that need to e deployed into the build process
 */
"cartridges": [
        "./integrations/link_cybersource/cartridges/int_cybersource_sfra",
        "./storefront-reference-architecture/cartridges/app_storefront_base",
        "./storefront-reference-architecture/cartridges/bm_app_storefront_base",
        "./storefront-reference-architecture/cartridges/modules",
        "./integrations/link_paypal/cartridges/bm_paypal",
        "./integrations/link_paypal/cartridges/bm_paypal_configuration",
        "./integrations/link_paypal/cartridges/int_paypal",
        "./integrations/link_paypal/cartridges/paypal_credit_financing_options",
        "./integrations/link_paypal/cartridges/paypal_credit_messaging",
        "./integrations/int_scene7",
        "./integrations/plugin_janrain",
        "./integrations/int_valuetec",
        "./integrations/link_emarsys/cartridges/bm_emarsys",
        "./integrations/link_emarsys/cartridges/emarsys_sfra_changes",
        "./integrations/link_emarsys/cartridges/int_emarsys",
        "./integrations/link_emarsys/cartridges/int_emarsys_sfra",
        "./core/org_tumi"
    ]
```
