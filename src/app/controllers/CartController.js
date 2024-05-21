const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');
var { connect } = require('../../config/db/index');

class CartController {
    numberItemsCart = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const count = await Cart.numberItemsCart(UserID);
            return res.status(200).json({ success: true, count });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    });

    addToCart = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const product_id = Number(req.params.id);
            const quantity = Number(req.body.quantity);

            const checkStock = await Product.checkStock(product_id);
            if (checkStock[0].Stock == 0) return res.status(200).json({ message: 'Out of stock' });

            const cart = await Cart.checkDuplicate(UserID, product_id);
            if (cart.length > 0) await Cart.updateCart( UserID, Number(cart[0].Quantity) + quantity, product_id );
            else await Cart.insertCart(UserID, product_id, quantity);

            const data = await Cart.getCountItemCart(UserID);
            return res.status(200).json({ success: true, count: data[0].count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    updateQuantityCart = asyncHandler(async (req, res) => {
        try {
            const { quantity, cartID } = req.body;
            const data = Cart.updateQuantityCart(quantity, cartID);
            if (data) return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteCartItem = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const cartID = req.params.id;
            await Cart.deleteCartItem(cartID, UserID);
            const count = await Cart.numberItemsCart(UserID);
            return res.status(200).json({ success: true, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
}

module.exports = new CartController();
