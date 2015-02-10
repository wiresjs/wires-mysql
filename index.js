var mysql = require('mysql');
var log4js = require('log4js');
var Class = require("wires-class");


exports.logger = log4js.getLogger("mysql");




var MysqlMongoStyle = {
    get: function(cb) {
        if (!this.pool) {
            cb({
                error: "Connection was not created!"
            });
        } else {
            this.pool.getConnection(cb);
        }
    },
    getPool: function() {
        return this.pool;
    },
    createPool: function(prop) {
        var prop = prop || {};
        var host = prop.host || "localhost";
        var user = prop.user || "root";
        var pass = prop.password || "";
        var db = prop.database || "test";
        var connectionLimit = prop.connectionLimit || 200;

        this.prop = {
            connectionLimit: connectionLimit,
            host: host,
            user: user,
            password: pass,
            database: db
        }
        this.pool = mysql.createPool(this.prop);
    }
}





//Escape('{"id" : 1, "pukka" : "\'\\"\\"\'"}')
exports.connection = MysqlMongoStyle;
exports.operations = require('./operations')

exports.schema = require('./schema');