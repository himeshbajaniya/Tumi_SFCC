"use strict";

const path = require("path");

/**
 * Allows to configure aliases for you require loading
 */
module.exports.aliasConfig = {
  // enter all aliases to configure

  alias: {
    base: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './storefront-reference-architecture/cartridges/app_storefront_base/cartridge/client/default/'
    ),
    baseTumiUs: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './core/org_tumi/cartridge/client/default/'
    ),
    cybersource: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './integrations/link_cybersource/cartridges/int_cybersource_sfra/cartridge/client/default/'
    ),
    wishlist: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './integrations/plugin_wishlists/cartridges/plugin_wishlists/cartridge/client/default/'
    ),
    valuetec: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './integrations/int_valuetec/cartridge/client/default/'
    ),
    pixlee: path.resolve(
      process.cwd(), // eslint-disable-next-line max-len
      './integrations/plugin_pixlee/cartridges/int_pixlee_sfra/cartridge/client/default'
    )
  }
};

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
  ],
  "./integrations/plugin_turnto/cartridges/int_turnto_sfra_v5":[
    {
      from: './integrations/plugin_turnto/cartridges/int_turnto_sfra_v5/cartridge/client/default/css',
      to: 'default/css'  }
  ],
  "./integrations/plugin_turnto/cartridges/int_turnto_core_v5":[
    {
      from: './integrations/plugin_turnto/cartridges/int_turnto_core_v5/cartridge/client/default/css',
      to: 'default/css'  }
  ]
};

/**
 * Allows custom include path config
 */
module.exports.includeConfig = {
  "./storefront-reference-architecture/cartridges/app_storefront_base": {
    scss: ["my-custom-node_modules"],
  },
};

/**
 * Exposes cartridges included in the project
 */
module.exports.cartridges = [
  "./integrations/link_cybersource/cartridges/int_cybersource_sfra",
  "./integrations/link_klarnapayments/cartridges/int_klarna_payments",
  "./integrations/link_klarnapayments/cartridges/int_klarna_payments_sfra",
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
  "./integrations/plugin_wishlists/cartridges/plugin_wishlists",
  "./integrations/plugin_turnto/cartridges/int_turnto_core_v5",
  "./integrations/plugin_turnto/cartridges/int_turnto_sfra_v5",
  "./integrations/link_signified/cartridges/int_signifyd",
  "./integrations/link_signified/cartridges/int_signifyd_sfra",
  "./integrations/plugin-applepay-master/cartridges/plugin_applepay",
  "./integrations/plugin_instorepickup/cartridges/plugin_instorepickup",
  "./integrations/plugin_productcompare-master/cartridges/plugin_productcompare",
  "./core/org_tumi",
  "./core/org_tumi_ca",
  "./core/org_tumi_specialMarkets",
  "./core/plugin_sfra_override",
  "./core/plugin_sitemap-master/cartridges/plugin_sitemap",
  "./core/bc_tumi_processorder",
  "./integrations/plugin_pixlee/cartridges/int_pixlee_sfra",
  "./integrations/plugin_pixlee/cartridges/int_pixlee",
  "./integrations/plugin_pixlee/cartridges/int_pixlee_core",
  "./core"

];

/**
 * Lint options
 */
module.exports.lintConfig = {
  eslintFix: true,
  stylelintFix: true,
};
