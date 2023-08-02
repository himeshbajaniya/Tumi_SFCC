module.exports = {

    "root": true,
    "extends": "airbnb-base/legacy",
    "rules": {
        "import/no-unresolved": "off",
        "indent": ["error", 4, { "SwitchCase": 1, "VariableDeclarator": 1 }],
        "func-names": "off",
        "require-jsdoc": "error",
        "valid-jsdoc": ["error", { "preferType": { "Boolean": "boolean", "Number": "number", "object": "Object", "String": "string" }, "requireReturn": false}],
        "vars-on-top": "off",
        "global-require": "off",
        "no-shadow": ["error", { "allow": ["err", "callback"]}],
        "max-len": "off",
        "linebreak-style": ["error", process.platform === 'win32' ? 'windows' : 'unix']
    }

};