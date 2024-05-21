require('dotenv').config();
const sql = require('mssql');

var config = {
    user: 'sa',
    password: '%fz(puQNG4prd$',
    server: 'localhost',
    database: 'nest_sern',
    trustServerCertificate: true,
    driver: 'msnodesqlv8',
    options: {
        enableArithAbort: true,
        encrypt: true,
    },
};

const connect = new sql.ConnectionPool(config)
    .connect()
    .then((pool) => {
        return pool;
    })
    .catch((err) => {
        console.log(err);
    })
    .finally(() => {
        sql.close();
    });

module.exports = { connect, sql };
