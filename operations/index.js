var Class = require('wires-class');

exports.Insert = require('./insert');
exports.Update = require('./update');
exports.Select = require('./select');
exports.Delete = require('./delete');

exports.Operation = Class.extend({
}, {
    provide : function(table, type, schema)
    {
        switch (type) {
            case "insert":
                return new exports.Insert(table)
            case "update":
                return new exports.Update(table)
            case "delete":
                return new exports.Delete(table)
        }
        return new exports.Select(table, schema)
    }
})