// Switching types
// FOr instance user gives us bool type, which is not present in mysql
// So we switch it to tinyint
var switchTypes = function(type) {
    switch (type) {
        case "bool":
            return "tinyint(1)";
        case "json":
            return "varchar(1200)";
        case "json-med":
            return "mediumtext"
        case "json-large":
            return "longtext"
    }
    return type;
}

// Gives default values from a column
var defaultSchemaTypes = function(s) {

    var schema = {
        type: s.type || 'varchar(255)',
        maxLength: null,
        required: s.required || false,
        index: s.index || false
    }
    var length = null;

    schema.type = switchTypes(schema.type);
    var a = schema.type.split("(");

    if (a.length == 2) {
        schema.maxLength = parseInt(a[1])
    }
    schema.type = a[0]
    if (schema.type === "varchar" && schema.maxLength === null) {
        schema.maxLength = 255;
    }

    if (schema.type === "int" && schema.maxLength === null) {
        schema.maxLength = 11;
    }

    if (schema.type === "bigint" && schema.maxLength === null) {
        schema.maxLength = 20;
    }
    if (schema.type === "mediumint" && schema.maxLength === null) {
        schema.maxLength = 9;
    }



    return schema
}

module.exports = defaultSchemaTypes;
