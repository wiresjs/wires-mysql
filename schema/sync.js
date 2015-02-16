var Class = require("wires-class");
var info = require('./info');
var async = require('async');
var _ = require('lodash');
var lib = require('../index.js');
var logger = lib.logger;
var builder = require('mongo-mysql');
var defaultSchemaTypes = require('./types')



var Sync = Class.extend({
    connection: null,
    initialize: function(tables) {

        this.tables = tables;
    },
    start: function(done) {
        var self = this;
        this.syncDone = done;
        logger.info("Syncing tables");

        lib.connection.get(function(err, connection) {
            self.connection = connection;
            info.getTablesInfo(function(dbTables) {
                logger.info("Tables metadata information retrieved!");
                self.validate(dbTables);
            });
        })

    },
    validate: function(dbTables) {

        var self = this;


        var createList = [];
        var updateList = [];
        _.each(this.tables, function(table) {
            var tableName = table.name;
            var tableSchema = table.schema;

            if (!dbTables[tableName]) {
                createList.push(function(done) {
                    logger.info("Will create table " + tableName);
                    self.createTable(tableName, tableSchema, done)
                })
                dbTables[tableName] = {
                    columns: tableSchema[tableName]
                };

            }
            updateList.push(function(done) {
                self.alterTable(tableName, dbTables[tableName], tableSchema, done)
            });
        });


        // First launch simple table creation proccess
        // We wannt be sure that they are all created, before staring altering them if needed
        async.parallel(createList, function(err, results) {
            // Launch validations
            logger.info("All tables seem to be present");
            logger.info("Kicking validation proccess of");
            async.parallel(updateList, function(err, results) {
                if (err) {
                    logger.error("Errors in query " + JSON.stringify(err));
                } else {
                    var affected = [];
                    _.each(results, function(item) {
                        if (item)
                            affected.push(item);
                    })
                    if (affected.length > 0) {
                        logger.info("Altering affected " + affected.length + (affected.length == 1 ? " table" : "tables"));
                    }
                    logger.info("Sync complete");

                    self.syncDone ? self.syncDone() : null;
                }
                
                self.connection.release();
            });
        })
    },

    // Creating table with minimut data set
    //  Just id and index
    createTable: function(tableName, userSchema, done) {
        var query = ['CREATE TABLE `' + tableName + '` ('];
        query.push('`id` int(11) NOT NULL AUTO_INCREMENT,')
        query.push(' PRIMARY KEY (`id`),')
        query.push(' KEY `id_x` (`id`) USING BTREE')
        query.push(') ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;')

        this.connection.query(query.join('\n'), function(err, rows, fields) {
            logger.info("Table " + tableName + " has been created");

            done(err, rows);
        });
    },
    alterTable: function(tableName, dbSchema, userSchema, done) {


        var addList = [];
        var alterList = [];
        dbSchema.columns = dbSchema.columns || {};
        var alterLog = [];
        _.each(userSchema, function(schema, colName) {
            // If column is not present in db schema
            if (colName !== "id") {

                var schema = defaultSchemaTypes(schema);

                if (!dbSchema.columns[colName]) {

                    addList.push({
                        name: colName,
                        schema: schema
                    })

                } else {
                    var dbColShema = dbSchema.columns[colName];
                    var needAlter = false;
                    
                    // If some of the data types don't match
                    if (dbColShema.dataType !== schema.type) {
                        needAlter = true;
                    }

                    // If maxLength does not match
                    if (dbColShema.maxLength !== schema.maxLength) {
                        needAlter = true;
                    }
                    if (needAlter) {

                        alterList.push({
                            name: colName,
                            schema: schema
                        })
                    }
                }

            }
        });


        var sql = ['ALTER TABLE `' + tableName + '`']

        var getUpdateDict = function(item) {
                return "`" + item.name + "` " + item.schema.type + (item.schema.maxLength !== null ? "(" + item.schema.maxLength + ")" : '');
            }
            // Now, when we have needed list to alter
            // Let's create query
        var addCols = [];
        var modifyCols = [];
        _.each(addList, function(item) {
            var q = 'ADD ' + getUpdateDict(item)
            logger.info(tableName + ": " + q)
            addCols.push(q);
        });

        _.each(alterList, function(item) {
            var q = 'MODIFY COLUMN ' + getUpdateDict(item);
            logger.info(tableName + ": " + q)
            modifyCols.push(q);
        });
        
        if (addCols.length > 0 || modifyCols.length > 0) {
            var opts = [];
            if (addCols.length)
                opts.push(addCols.join(', '))
            if (modifyCols.length)
                opts.push(modifyCols.join(', '))
            sql.push( opts.join(',') )
            var q = sql.join(' ');

            this.connection.query(q, function(err, rows, fields) {
                if ( err ) {
                    logger.error(q);
                }
                done(err, tableName);
            });
        } else {
            done(null, null);
        }


    }
})

module.exports = Sync;