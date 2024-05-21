const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { connect, sql } = require('../../config/db/index');

const Cart = new Schema({});

Cart.statics = {
    getCart: async (UserID) => {
        const pool = await connect;
        const query_cart = `SELECT Carts.CartID, Products.ProductID, Products.Price, 
                                Carts.Quantity, Products.Image, Products.Title
                            FROM Carts JOIN Products ON Carts.ProductID = Products.ProductID 
                            WHERE UserID = ${UserID}`;

        const data = await pool.request().query(query_cart);
        return data.recordset;
    },

    getCountItemCart: async (userID) => {
        const pool = await connect;
        const query = `SELECT COUNT(*) AS count FROM Carts WHERE UserID = '${userID}'`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    checkDuplicate: async (userID, product_id) => {
        const pool = await connect;
        const query = `SELECT * FROM Carts WHERE UserID = ${userID} AND ProductID = ${product_id}`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    insertCart: async (userID, quantity, product_id) => {
        const pool = await connect;
        const query = `INSERT INTO Carts (UserID, ProductID, Quantity) 
                    VALUES( ${userID}, ${product_id}, ${quantity})`;
        await pool.request().query(query);
    },

    updateCart: async (userID, quantity, product_id) => {
        const pool = await connect;
        const query = `UPDATE Carts SET Quantity = ${Number(quantity)} 
                    WHERE UserID = ${userID} AND ProductID = ${product_id}`;
        await pool.request().query(query);
    },

    numberItemsCart: async (UserID) => {
        const pool = await connect;
        const query_cart = `SELECT COUNT(*) AS count FROM Carts WHERE UserID = ${UserID}`;
        const data = await pool.request().query(query_cart);
        const count = data.recordset[0].count || 0;
        return count;
    },

    updateQuantityCart: async (quantity, cartID) => {
        const pool = await connect;
        const update_cart = `UPDATE Carts SET Quantity = ${quantity} 
                            WHERE CartID = ${cartID}`;
        await pool.request().query(update_cart);
        return true;
    },

    deleteCartItem: async (cartID, UserID) => {
        const pool = await connect;
        const delete_cart = `DELETE FROM Carts WHERE CartID = ${cartID} AND UserID = ${UserID}`;
        await pool.request().query(delete_cart);
        return true;
    },
};

module.exports = mongoose.model('Cart', Cart);
