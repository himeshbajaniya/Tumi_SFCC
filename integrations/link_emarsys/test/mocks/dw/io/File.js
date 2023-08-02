'use strict';
var Collection = require('../util/Collection');

class File {
    static get IMPEX() { return 'IMPEX'}
    static get STATIC() { return 'STATIC'}
    static get SEPARATOR() { return '/'}
    static get TEMP() { return 'TEMP'}

    constructor(absPath) {
        this.fullPath = absPath;
        this.name = 'test';
        this.path = 'src/test/test';
        this.rootDirectoryType = 'IMPEX';
    }

    exists() {
        return true;
    }
    mkdirs() {
        return true;
    }
    isDirectory() {
        return true;
    }
    list() {
        return ['Test.csv','Test.gh'];
    }
    listFiles(data) {
        return {
            data: data,
            iterator: function() {
                var i = 0;
                return {
                    items: ['Test.csv','Test2.gh'],
                    hasNext: function() {
                        return i < this.items.length;
                    },
                    
                    next: function() {
                        this.item = this.items[i++];
                        return {
                            item: this.item,
                            isFile: () => this.item ? true : false,
                            remove: () => {
                                this.item = null;
                                return this.item == null ? true : false;}
                        }
                    },
            };
            }
        }
    }
}

module.exports = File;
