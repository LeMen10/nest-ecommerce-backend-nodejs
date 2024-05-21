const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
var { connect, sql } = require('../../config/db/index');
const { generateAccessToken } = require('../middlewares/jwt');
const sendMail = require('../../service/sendMail');
const Order = require('../models/Order');
const User = require('../models/User');

class UserController {
    getUserName = asyncHandler(async (req, res) => {
        try {
            if (req?.headers?.authorization?.startsWith('Bearer')) {
                const token = req.headers.authorization.split(' ')[1];

                if (token === 'undefined') return res.status(200).json({ message: 'No Login' });
                jwt.verify(token, process.env.JWT_SECRET, async (err, decode) => {
                    const pool = await connect;
                    if (err) return res.status(400).json({ success: false, message: 'Invalid access token' });

                    const query_user = `SELECT * FROM Users WHERE UserID = ${decode.UserID}`;
                    const data = await pool.request().query(query_user);
                    if (data.recordset.length === 0) return res.status(200).json({ message: 'No Login' });
                    return res.status(200).json({ success: true, username: data.recordset[0].Username });
                });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    purchase = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const type = req.query.type || req.body.type;
            const data = await Order.purchase(type, UserID);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    orderCancel = asyncHandler(async (req, res) => {
        try {
            const orderDetailID = req.params.id;
            await Order.purchase(orderDetailID);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    register = asyncHandler(async (req, res) => {
        try {
            var pool = await connect;
            const { username, password, email, role } = req.body;
            if (!username || !password || !email || !role)
                return res.status(400).json({ success: false, message: 'Missing inputs' });
            const hash_password = await bcrypt.hash(password, 10);
            const data = await User.checkUser(username, email);
            if (data.length > 0) return res.status(400).json({ success: false, message: 'Account already exists' });
            await User.insertUser(username, hash_password, email, role);
            return res.status(200).json({ success: true, message: 'Sign Up Success' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    login = asyncHandler(async (req, res) => {
        try { 
            const { username, password } = req.body;
            if (!username || !password) return res.status(400).json({ success: false, message: 'Missing inputs' });
            const data = await User.getUserByUsername(username);
            if (data.length > 0 && (await bcrypt.compare(password, data[0].Password))) {
                const accessToken = generateAccessToken(data[0].UserID, data[0].Role);
                return res.status(200).json({ success: true, accessToken, username: data[0].Username });
            } else return res.status(404).json({ success: false, message: 'Not Found' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    forgotPassword = asyncHandler(async (req, res) => {
        try {
            var pool = await connect;
            const email = req.body.email;
            if (!email) throw new Error('Missing email');
            const user = await User.getUserByEmail(email);
            if (user.length == 0) return res.status(400).json({ success: false, message: 'User not found' });
            const resetToken = generateAccessToken(user[0].UserID, user[0].Role);
            // const resetToken = user.createPasswordChangedToken();
            // await user.save();
            const html = `Xin vui lòng nhấn vào link dưới đây để thay đổi mật khẩu của bạn.
                        Link này sẽ hết hạn sau 15p kể từ khi bạn nhận được mail này. 
                        <a href=${`${process.env.BASE_URL_REACTJS}/reset_password/${resetToken}`}>Click here</a>`;

            const data = { email, html };
            const rs = sendMail(data);
            return res.status(200).json({ success: true, rs });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    resetPassword = asyncHandler(async (req, res) => {
        const { password, token } = req.body;
        if (!password || !token) return res.status(400).json({ success: false, message: 'Missing inputs' });
        const password_reset_token = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            password_reset_token,
            password_reset_expires: { $gt: Date.now() },
        });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid reset token' });
        const hashPassword = await bcrypt.hash(password, 10);
        user.password = hashPassword;
        user.password_reset_token = undefined;
        user.passwordChangedAt = Date.now();
        user.password_reset_expires = undefined;
        await user.save();
        return res.status(200).json({
            success: user ? true : false,
            message: user ? 'Updated password' : 'Something went wrong',
            email: user.email,
        });
    });
}

module.exports = new UserController();
