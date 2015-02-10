var mysql = require('mysql');
var log4js = require('log4js');
var Class = require("wires-class");
var lib = require('../index');
var _ = require('lodash');
var logger = lib.logger;
var schema = require('../schema')
var builder = require('conmio-mongo-sql');


// Insertion
var Select = Class.extend({

    initialize: function(tableName, schema) {
        this.schema = schema;
        this.tableName = tableName;
        this.query = {
            type: 'select',
            table: tableName
        };
    },
    setData: function() {},
    where: function(where) {
        this.query.where = where;
        return this;
    },
    order: function(order) {
        this.query.order = order;
        return this;
    },
    limit: function(limit) {
        this.query.limit = limit;
        return this;
    },
    offset: function(offset) {
        this.query.offset = offset;
        return this;
    },
    group: function(group) {
        this.query.groupBy = group;
        return this;
    },
    count: function() {
        this.query.columns = [{
            expression: {
                expression: 'COUNT(1) as count'
            }
        }]
        this.obtainSingleKey = "count";
        return this;
    },
    // Mapping results to javascript objects
    // Considering json objects and bools
    mapResults: function(schema, list) {
        _.map(list, function(item) {
            _.each(item, function(value, key) {
                var type;
                if (schema[key] && (type = schema[key].type)) {
                    if (type === "bool") {
                        item[key] = value ? true : false;
                    }
                    if (type.indexOf("json") > -1) {
                        item[key] = JSON.parse(value);
                    }
                }
            });
            return item;
        });

        return list;
    },
    request: function(ready) {
        var self = this;
        var result = builder.sql(this.query);
        var schema = this.schema;
        lib.connection.get(function(err, connection) {
            _.each(result.values, function(value, index) {
                var replacement = "$" + (index + 1);
                result.query = result.query.replace(replacement,
                    connection.escape(_.isObject(value) ? JSON.stringify(value) : value)
                )
            });

            connection.query(result.query, function(err, info) {

                if (err) {
                    logger.error(result.query);
                    logger.error(err);
                    ready(err, null);
                    return;
                }
                var res;
                // IF there was an expression to be fetched
                // Like count
                if (self.obtainSingleKey) {
                    if (info.length > 0) {
                        res = info[0][self.obtainSingleKey]
                    }
                } else {

                    try {
                        res = self.mapResults(schema, info);
                    } catch (e) {
                        logger.error(result.query);
                        ready(e, null);

                        return;
                    }
                }
                connection.release();
                ready ? ready(null, res) : null;
            })
        });
    }
})

module.exports = Select;