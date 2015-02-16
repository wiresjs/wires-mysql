wires-mysql
============

## About

An API to mysql database, using mongolike queries

## Usage

### Connection
    var mosql = require('wires-mysql');

    mosql.connection.createPool({
        host : '', user : '', password : '', database : ''
    })

### Schema

All operations require schema, there is an example how to do it:

	var usersSchema = {
	    id: {},
	    name: {},
	    email : {},
	    age : { type : 'int'}
	}

When synced, id is created automatically, it does not matter whether it's preset there or not
It will be created with autoincrement option. 

### Sync schema

Sync accepts a list of objects. 
Let's say, we have
    
    var tables = [{
	    name: "users",
	    schema: schema
	}]

Then kick of sync process:

	var sync = new mosql.schema.Sync(tables);
	sync.start(function() {
		// We are done
	})

### Columns

#### Col length
To specify column length, provide it within parentheses. E.g varchar(255). Default values are below:

Default maxlength 

Type  | Default type
------------- | -------------
varchar | varchar(255)
int  	| int(11)


#### Columns

Along with native mysql column types, here are some helpers

Libarary type  | Mysql type
------------- | -------------
bool 		| tinyint(1)
json  		| varchar(1200)
json-med	| mediumtext
json-large	| longtext

If you are planning on putting javascript object, don't forget to set json column type, otherwise value will  be recognized as a simple string


### Operations

	var Operation = mosql.operations.Operation;

#### Insert

	var insert = Operation.provide("users", "insert", schema);
    insert.setData({
        name: "Test",
        email: "test@example.com",
        age: 31
    });
    insert.request(function(err, newid){
        console.log(err || newid);
    })

#### Update

	var update = Operation.provide("users", "update", schema);
    update.setData({
        name: "Ivan11",
        email: "ivan@sukka.com",
        age: 30
    }).where({id : 1}).request(function(){

    });

#### Select

	var select = Operation.provide("users", "select", schema);
    select.where({
        id: {
            $gt: 1
        }
    }).order({
        id: 'desc'
    }).limit(1).offset(1).group(['name'])
    select.request(function(err, res) {
        console.log(err||res);
    });
