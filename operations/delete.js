var mysql = require('mysql');
var log4js = require('log4js');
var Class = require("wires-class");
var lib = require('../index');
var _ = require('lodash');
var logger = lib.logger;
var schema = require('../schema')
var builder = require('conmio-mongo-sql');



var Delete = Class.extend({

    initialize: function(tableName, data) {
        this.tableName = tableName;
        this.query = {
            type: 'delete',
            table: tableName
        };
    },
    setData : function(data)
    {
        this.query.updates = data;
        return this;
    },
    where: function(where) {
        this.query.where = where;
        return this;
    },
    request: function(ready) {
        var self = this;
        var result = builder.sql(this.query);
        
        lib.connection.get(function(err, connection) {
            _.each(result.values, function(value, index) {
                var replacement = "$" + (index + 1);
                result.query = result.query.replace( replacement, 
                     connection.escape(_.isObject(value) ? JSON.stringify(value) : value)
                )
            });
             connection.query(result.query, function(err, info) {
                if ( err ){
                    logger.error(err);
                    logger.error(result.query);
                }
                connection.release();
                ready ? ready(err, info) : null;
            })
        });
    }
})

module.exports = Delete;