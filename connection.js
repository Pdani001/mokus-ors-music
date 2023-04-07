const mysql = require('mysql2/promise');
/**
Example contents of `db.json`
```
{
  "host": "localhost",
  "port": 3306,
  "user": "username",
  "password": "password",
  "database": "database"
}
```
 */
const db = require("./db.json");
const { CurrentDate }  = require("./util.js");
const pool = mysql.createPool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: db.database
});

pool.getConnection((err,connection)=> {
    if(err) throw err;
    console.log(CurrentDate()+'Database connected successfully');
    connection.release();
});

module.exports = pool;