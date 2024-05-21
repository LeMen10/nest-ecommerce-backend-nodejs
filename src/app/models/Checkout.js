const { connect, sql } = require('../../config/db/index');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Checkout = new Schema({});

Checkout.statics = {
    getCheckout: async (UserID, data_id) => {
        const pool = await connect;
        const query_checkout = `SELECT c.CartID, p.ProductID, p.Price, 
                                    c.Quantity, p.Image, p.Title
                                FROM Carts c JOIN Products p ON c.ProductID = p.ProductID 
                                WHERE UserID = ${UserID} AND c.ProductID IN (${data_id})`;

        const data = await pool.request().query(query_checkout);
        return data.recordset;
    },

};

module.exports = mongoose.model('Checkout', Checkout);
