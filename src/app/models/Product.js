const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { connect, sql } = require('../../config/db/index');
const Product = new Schema({});

Product.statics = {
    getProducts: async (index, limit) => {
        const pool = await connect;
        const query = `SELECT * FROM Products WHERE IsDeleted = 0 ORDER BY ProductID 
                    OFFSET ${index} ROWS FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    getManagerProduct: async (index, limit) => {
        const pool = await connect;
        const query = `SELECT p.ProductID, p.Title, p.Image, p.Price, c.Title as Title_Cate FROM Products p
                                JOIN Categories c ON p.CategoryID = c.CategoryID
                                WHERE IsDeleted = 0
                                ORDER BY p.ProductID
                                OFFSET ${index} ROWS
                                FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    getProductsOfCategory: async (categoryID, page, limit) => {
        const index = Number((page - 1) * limit);
        const pool = await connect;
        const query = `SELECT p.Title, p.Image, p.Price, p.ProductID FROM Products p 
                    JOIN Categories c ON p.CategoryID = c.CategoryID 
                    WHERE c.CategoryID = ${categoryID} 
                    ORDER BY p.ProductID 
                    OFFSET ${index} ROWS 
                    FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    getProductByID: async (slug) => {
        const pool = await connect;
        const query_product = `SELECT * FROM Products WHERE ProductID = '${slug}'`;
        const data = await pool.request().query(query_product);
        return data.recordset[0];
    },

    getCountProduct: async (deleted) => {
        const query = `SELECT COUNT(*) AS count FROM Products WHERE IsDeleted = ${deleted}`;
        const count = await pool.request().query(query);
        return count.recordset[0].count;
    },

    findProduct: async (query, index, limit) => {
        const pool = await connect;
        const query_product = `SELECT * FROM Products 
                    WHERE TITLE LIKE N'%${query}%' 
                    ORDER BY ProductID 
                    OFFSET ${index} ROWS 
                    FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query_product);
        return data.recordset;
    },

    addProduct: async (title, price, detail, image, categoryId) => {
        const pool = await connect;
        const insert = `INSERT INTO Products 
                                (Title, Price, Detail, Image, CategoryID) 
                                VALUES(@Title, @Price, @Detail, @Image, @CategoryID)`;

        await pool
            .request()
            .input('Title', sql.NVarChar, title)
            .input('Price', sql.Int, Number(price))
            .input('Detail', sql.NVarChar, detail)
            .input('Image', sql.NVarChar, image)
            .input('CategoryID', sql.Int, Number(categoryId))
            .query(insert);
    },

    deleteProduct: async (productID) => {
        const pool = await connect;
        const query = `UPDATE Products SET IsDeleted = 1 WHERE ProductID = ${productID}`;
        await pool.request().query(query);
        return true;
    },

    deleteMultipleProduct: async (productIDs) => {
        const pool = await connect;
        const query = `UPDATE Products SET IsDeleted = 1 WHERE ProductID IN (${productIDs})`;
        await pool.request().query(query);
        return true;
    },

    trashProducts: async (index, limit) => {
        const pool = await connect;
        const query_products = `SELECT p.ProductID, p.Title, p.Image, p.Price, 
                                    c.Title as Title_Cate FROM Products p
                                JOIN Categories c ON p.CategoryID = c.CategoryID
                                WHERE IsDeleted = 1
                                ORDER BY p.ProductID
                                OFFSET ${index} ROWS
                                FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query_products);
        return data.recordset;
    },

    restoreProduct: async (productID) => {
        const pool = await connect;
        const restore_products = `UPDATE Products SET IsDeleted = 0 WHERE ProductID = ${productID}`;
        await pool.request().query(restore_products);
        return true;
    },

    restoreMultipleProduct: async (productIDs) => {
        const pool = await connect;
        const restore_products = `UPDATE Products SET IsDeleted = 0 WHERE ProductID IN (${productIDs})`;
        await pool.request().query(restore_products);
    },

    checkStock: async (product_id) => {
        const pool = await connect;
        const query = `SELECT Stock FROM Products WHERE ProductID = ${product_id}`;
        const data = await pool.request().query(query);
        return data.recordset;
    },
};

module.exports = mongoose.model('Product', Product);
