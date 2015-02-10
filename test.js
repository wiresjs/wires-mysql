var mongomysql = require('./index');
var conn = mongomysql.connection;

var Operation = mongomysql.operations.Operation;
conn.createPool({
    database: "domain"
})



var schema1 = {
    id: {},
    date: {
        defaults: function() {
            return new Date().getTime();
        },
        type: 'bigint'
    },
    test_id: {
        required: true,
        type: 'int'
    },
    stats: {
        'type': 'json'
    }
}

var tables = [{
    name: "report",
    schema: schema1
}]

var sync = new mongomysql.schema.Sync(tables);
sync.start(function() {



});