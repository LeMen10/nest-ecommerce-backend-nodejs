const express = require('express');
const router = express.Router();
const userController = require('../app/controllers/UserController');
const verifyAccessToken = require('../app/middlewares/verifyToken');

router.use('/order-cancel/:id', verifyAccessToken, userController.orderCancel);
router.use('/purchase', verifyAccessToken, userController.purchase);
router.use('/forgot_password', userController.forgotPassword);
router.use('/reset_password', userController.resetPassword);
router.get('/get-username', userController.getUserName);
router.post('/register', userController.register);
router.post('/login', userController.login);

module.exports = router;
