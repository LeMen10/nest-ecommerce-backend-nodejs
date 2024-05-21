const mongoose = require('mongoose');
const { connect, sql } = require('../../config/db/index');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const User = new Schema({});

User.statics = {
    isCorrectPassword: async (password) => {
        return await bcrypt.compare(password, this.password);
    },

    createPasswordChangedToken: () => {
        const resetToken = crypto.randomBytes(32).toString('hex');
        this.password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        this.password_reset_expires = Date.now() + 15 * 60 * 1000;
        return resetToken;
    },

    getUsers: async (index, limit) => {
        const pool = await connect;
        const query = `SELECT u.UserID, u.Email, u.Role, a.FullName, a.Phone FROM Users u
                            JOIN Address a ON u.UserID = a.UserID
                            WHERE u.IsDeleted = 0 AND a.Active = 1
                            ORDER BY UserID
                            OFFSET ${index} ROWS
                            FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    getUserByUsername: async (username) => {
        const pool = await connect;
        const query_username = `SELECT * FROM Users WHERE Username = '${username}'`;
        const data = await pool.request().query(query_username);
        return data.recordset;
    },

    getUserByEmail: async (email) => {
        const pool = await connect;
        const query_username = `SELECT * FROM Users WHERE Email = '${email}'`;
        const data = await pool.request().query(query_username);
        return data.recordset;
    },

    getCountUser: async (deleted) => {
        const pool = await connect;
        const query = `SELECT COUNT(*) AS count FROM Users WHERE IsDeleted = ${deleted}`;
        const data = await pool.request().query(query);
        return data.recordset[0].count;
    },

    insertUser: async (username, hash_password, email, role) => {
        const pool = await connect;
        const query = `INSERT INTO Users (Username, Password, Email, Role) 
                            VALUES(@Username, @Password, @Email, @Role)`;
        await pool
            .request()
            .input('Username', sql.NVarChar, username)
            .input('Password', sql.NVarChar, hash_password)
            .input('Email', sql.NVarChar, email)
            .input('Role', sql.NVarChar, role)
            .query(query);
    },

    checkUser: async (username, email) => {
        const pool = await connect;
        const query_username = `SELECT * FROM Users WHERE Username = N'${username}' OR Email = N'${email}'`;
        const data = await pool.request().query(query_username);
        return data.recordset;
    },

    findUser: async (productID) => {
        const pool = await connect;
        const query = `SELECT * FROM Users WHERE ProductID = ${productID}`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    deleteUser: async (userID) => {
        const pool = await connect;
        const query = `UPDATE Users SET IsDeleted = 1 WHERE UserID = ${userID}`;
        await pool.request().query(query);
        return true;
    },

    deleteMultipleUser: async (userIDs) => {
        const pool = await connect;
        const query = `UPDATE Users SET IsDeleted = 1 WHERE UserID IN (${userIDs})`;
        await pool.request().query(query);
        return true;
    },

    trashUsers: async (index, limit) => {
        const pool = await connect;
        const query = `SELECT u.UserID, u.Email, u.Role, a.FullName, a.Phone 
                            FROM Users u JOIN Address a ON u.UserID = a.UserID
                            WHERE u.IsDeleted = 1 AND a.Active = 1
                            ORDER BY UserID
                            OFFSET ${index} ROWS
                            FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    restoreUser: async (userID) => {
        const pool = await connect;
        const query = `UPDATE Users SET IsDeleted = 0 WHERE UserID = ${userID}`;
        await pool.request().query(query);
        return true;
    },

    restoreMultipleUser: async (userIDs) => {
        const pool = await connect;
        const query = `UPDATE Users SET IsDeleted = 0 WHERE UserID IN (${userIDs})`;
        await pool.request().query(query);
        return true;
    },

    getAddressUser: async (userID) => {
        const pool = await connect;
        const query = `SELECT * FROM Address WHERE UserID = ${userID}`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    checkNumberOfUserAddress: async (userID) => {
        const pool = await connect;
        const query = `SELECT COUNT(*) AS count FROM Address WHERE UserID = '${userID}'`;
        const data = await pool.request().query(query);
        return data.recordset[0];
    },

    insertAddress: async (userID, active, full_name, phone, specific_address, ward, district, city) => {
        const pool = await connect;
        const insert = `INSERT INTO Address 
                                (City, District, Ward, SpecificAddress, Phone, FullName, UserID, Active) 
                                VALUES(@City, @District, @Ward, @SpecificAddress, 
                                @Phone, @FullName, ${userID}, ${active})`;

        await pool
            .request()
            .input('City', sql.NVarChar, city)
            .input('District', sql.NVarChar, district)
            .input('Ward', sql.NVarChar, ward)
            .input('SpecificAddress', sql.NVarChar, specific_address)
            .input('Phone', sql.NVarChar, phone)
            .input('FullName', sql.NVarChar, full_name)
            .query(insert);
    },
};

module.exports = mongoose.model('User', User);
