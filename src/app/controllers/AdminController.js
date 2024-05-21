const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const orderDetails = require('../models/orderDetails');
const { connect, sql } = require('../../config/db/index');
const Category = require('../models/Category');

class AdminController {
    login = asyncHandler(async (req, res) => {
        try {
            var pool = await connect;
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ success: false, message: 'Missing inputs' });
            const query_username = `SELECT * FROM Users WHERE Username = '${username}'`;
            const data = await pool.request().query(query_username);
            if (data.recordset.length > 0 && data.recordset[0].Role === 'admin') {
                const accessToken = generateAccessToken(data.recordset[0].UserID, data.recordset[0].Role);
                return res.status(200).json({ success: true, accessToken, username: data.recordset[0].Username });
            } else return res.status(404).json({ success: false, message: 'Not Found' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    getUserName = asyncHandler(async (req, res) => {
        try {
            if (req?.headers?.authorization?.startsWith('Bearer')) {
                const token = req.headers.authorization.split(' ')[1];

                if (token === 'undefined') return res.status(400).json({ success: false, message: 'No Login' });
                jwt.verify(token, process.env.JWT_SECRET, async (err, decode) => {
                    const pool = await connect;
                    if (err) return res.status(400).json({ success: false, message: 'Invalid access token' });

                    const query_user = `SELECT * FROM Users WHERE UserID = ${decode.UserID}`;
                    const data = await pool.request().query(query_user);
                    if (data.recordset[0].Role !== decode.Role) return res.status(404).json({ message: 'Not Found' });
                    return res.status(200).json({ success: true, data: data.recordset[0].Username });
                });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    // category
    getCategory = asyncHandler(async (req, res) => {
        try {
            const data = Category.getCategory();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // product
    addProduct = asyncHandler(async (req, res) => {
        try {
            const { title, price, detail, image, categoryId } = req.body;
            await Product.addProduct(title, price, detail, image, categoryId);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.log(error)
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    getProduct = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = await Product.getManagerProduct(index, limit);
            let count = await Product.getCountProduct(0);
            count = Math.ceil(count / limit);
            return res.status(200).json({ success: true, data, count});
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    editProduct = asyncHandler(async (req, res) => {
        try {
            const pool = await connect;
            const productID = req.params.id;
            const { title, price, detail, image, categoryId } = req.body;
            const update_product = `UPDATE Products 
                                    SET Title = ${title}, Price = ${price}, Detail = ${detail}, 
                                    Image = ${image}, CategoryID = ${categoryId}
                                    WHERE ProductID = ${productID}`;

            await pool.request().query(update_product);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    findProduct = asyncHandler(async (req, res) => {
        try {
            const pool = await connect;
            const productID = req.params.id;
            const query_product = `SELECT * FROM Products WHERE ProductID = ${productID}`;
            const data = await pool.request().query(query_product);
            if (data.recordset.length == 0) res.status(404).json({ success: true, message: 'Not Found' });
            return res.status(200).json({ success: true, data: data.recordset });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    getCountProductDeleted = asyncHandler(async (req, res) => {
        try {
            const count = await Product.getCountProduct(1);
            return res.status(200).json({ success: true, count});
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteProduct = asyncHandler(async (req, res) => {
        try {
            const productID = req.params.id;
            const data =  await Product.deleteProduct(productID);
            if (data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteMultipleProduct = asyncHandler(async (req, res) => {
        try {
            const productIDs = req.body.data.join(',');
            const data =  await Product.deleteMultipleProduct(productIDs);
            if (data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    trashProducts = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = await Product.trashProducts(index, limit);
            const count = Math.ceil(data / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    restoreProduct = asyncHandler(async (req, res) => {
        try {
            const productID = req.params.id;
            const data = await Product.restoreProduct(productID);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    restoreMultipleProduct = asyncHandler(async (req, res) => {
        try {
            const productIDs = req.body.data.join(',');
            const data = await Product.restoreMultipleProduct(productIDs);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // user
    getUsers = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = await User.getUsers(index, limit);
            let count = await User.getCountUser(0);
            count = Math.ceil(count / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // chua sua
    editUser = asyncHandler(async (req, res) => {
        try {
            const pool = await connect;
            const productID = req.params.id;
            const { title, price, detail, image, categoryId } = req.body;
            const update_product = `UPDATE Products 
                                    SET Title = ${title}, Price = ${price}, Detail = ${detail}, 
                                    Image = ${image}, CategoryID = ${categoryId}
                                    WHERE ProductID = ${productID}`;

            await pool.request().query(update_product);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    findUser = asyncHandler(async (req, res) => {
        try {
            const productID = req.params.id;
            const data = User.findUser(productID);
            if (data.recordset.length === 0) res.status(404).json({ success: true, message: 'Not Found' });
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    getCountUserDeleted = asyncHandler(async (req, res) => {
        try {
            let data = await User.getCountUser(1);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteUser = asyncHandler(async (req, res) => {
        try {
            const userID = req.params.id;
            const data = await User.deleteUser(userID);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteMultipleUser = asyncHandler(async (req, res) => {
        try {
            const userIDs = req.body.data.join(',');
            const data = await User.deleteMultipleUser(userIDs);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    trashUsers = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = User.trashUsers(index, limit);
            const count = Math.ceil(data.length / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    restoreUser = asyncHandler(async (req, res) => {
        try {
            const userID = req.params.id;
            const data = await User.restoreUser(userID);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    restoreMultipleUser = asyncHandler(async (req, res) => {
        try {
            const userIDs = req.body.data.join(',');
            const data = await User.restoreMultipleUser(userIDs);
            if(data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    // order
    getOrders = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = await Order.getOrders(index, limit);
            let count = await Order.getCountOrder();
            count = Math.ceil(count / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    getNumberOrder = asyncHandler(async (req, res) => {
        try {
            const data = await Order.getOrderStatistics();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    updateStatusOrder = asyncHandler(async (req, res) => {
        try {
            const orderDetailID = req.params.id;
            const status = req.body.status;
            const data = await Order.updateStatusOrder(orderDetailID, status);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    orderStatistics = asyncHandler(async (req, res) => {
        try {
            const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
            const data = await Order.getOrderStatisticsByYear();
            const months = [];
            const orderDetailCountsPerMonth = [];

            allMonths.forEach((month) => {
                const resultForMonth = data.find((x) => x.Month === month);
                const orderDetailCount = resultForMonth ? resultForMonth.OrderDetailCount : 0;
                months.push(month);
                orderDetailCountsPerMonth.push(orderDetailCount);
            });
            return res.status(200).json({ success: true, months, orderDetailCountsPerMonth });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
}

module.exports = new AdminController();
