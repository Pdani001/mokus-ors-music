const mysql = require('mysql2/promise');
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