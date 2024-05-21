const express = require('express');
const router = express.Router();
const cartController = require('../app/controllers/CartController');
const verifyAccessToken = require('../app/middlewares/verifyToken');

router.use('/number-items-cart', verifyAccessToken, cartController.numberItemsCart);
router.use('/add-to-cart/:id', verifyAccessToken, cartController.addToCart);
router.use('/update-quantity', verifyAccessToken, cartController.updateQuantityCart);
router.use('/delete-item-cart/:id', verifyAccessToken, cartController.deleteCartItem);

module.exports = router;
