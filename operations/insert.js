var mysql = require('mysql');
var log4js = require('log4js');
var Class = require("wires-class");
var lib = require('../index');
var _ = require('lodash');
var logger = lib.logger;
var schema = require('../schema')
    // Insertion
var Insert = Class.extend({

    initialize: function(tableName, data) {
        this.tableName = tableName;
        this.data = data;

        this.query = ["INSERT INTO `" + tableName + "`"]
    },
    setData : function(data)
    {
        this.data = data;
        return this;
    },
    request: function(ready) {

        var self = this;
        lib.connection.get(function(err, connection) {
            var values = [];
            var keys = [];
            _.each(self.data, function(value, key) {
            	// If it's a json - stringify it right away
                if (_.isObject(value)) {
                    values.push(connection.escape(JSON.stringify(value)))
                } else {
                    values.push(connection.escape(value))
                }
                keys.push('`' + key + '`');
            });

            self.query.push('(');
            self.query.push(keys.join(', '));
            self.query.push(')');

            self.query.push('VALUES');
            self.query.push('(');
            self.query.push(values.join(', '));
            self.query.push(')');

            var q = self.query.join(' ');
            
            connection.query(q, function(err, info) {
                
            	var newid = err ? null : info.insertId;
                if ( err ){
                    logger.error(err);
                    logger.error(q);
                }
                connection.release();
                ready ? ready(err, newid) : null;
            })
        });
    }
})

module.exports = Insert;