var Class = require("wires-class");
var lib = require('../index.js');
var async = require('async');
var _ = require('lodash');
var Types = require('./types');


var Info = Class.extend({}, {
    tables: null,
    getTablesInfo: function(cb) {
        var self = this;

        if (self.tables === null) {
            this._getInfo(function(tables) {
                self.tables = tables;
                cb(self.tables);
            })
        } else {
        	cb(self.tables);
        }
    },

    // Fetching all needed information using only one query
    _getInfo: function(callback) {
        var dbName = lib.connection.prop.database;

        var query = "select * from information_schema.columns where table_schema = '" + dbName + "'" +
            " order by table_name,ordinal_position;";

        lib.connection.pool.query(query, function(err, rows, fields) {
            var tables = {}
            var conventionalError = false;
            _.each(rows, function(item) {
                var tableName = item["TABLE_NAME"]
                var columnName = item["COLUMN_NAME"];
                var validType = Types({type: item["COLUMN_TYPE"]});
                if (tableName && columnName) {
                    if (!tables[tableName]) {
                        tables[tableName] = {
                            columns: {}
                        }
                    }
                    tables[tableName].columns[columnName] = {
                        type: item["COLUMN_TYPE"],
                        dataType: validType.type,
                        maxLength: validType.maxLength
                    }
                } else {
                    conventionalError = true;
                }
            })
            if (conventionalError) {
                lib.logger.warn("information_schema did not return conventional data!");
                lib.logger.warn("Check this query: " + query);
            }
            callback(tables);
        })
    }
})

module.exports = Info;