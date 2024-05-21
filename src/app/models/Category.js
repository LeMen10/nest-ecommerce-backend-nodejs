const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { connect, sql } = require('../../config/db/index');
const Category = new Schema({});

Category.statics = {

    getCategory: async () => {
        const pool = await connect;
        const query = `SELECT * FROM Categories`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    getCategoryID: async (cate) => {
        const pool = await connect;
        const query = `SELECT CategoryID FROM Categories c WHERE c.Cate = '${cate}'; `;
        const data = await pool.request().query(query);
        return data;
    },
};

module.exports = mongoose.model('Category', Category);
