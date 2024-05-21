const Cart = require('../models/Cart');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Checkout = require('../models/Checkout');
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');
var paypal = require('paypal-rest-sdk');
const { connect, sql } = require('../../config/db/index');
const { Query } = require('mongoose');
require('dotenv').config();

paypal.configure({
    mode: 'sandbox',
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
});

class SiteController {
    index = asyncHandler(async (req, res) => {
        return res.status(200).json({
            success: true,
        });
    });

    category = asyncHandler(async (req, res) => {
        try {
            const data = await Category.getCategory();
            return res.status(200).json({ success: true, data });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    shop = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const cate = req.query._cate || req.body._cate;
            const index = Number((page - 1) * limit);
            let data = {};

            if (cate !== 'null') {
                const cateData = await Category.getCategoryID(cate);
                if (cateData.length === 0) return res.status(400).json({ success: false });
                data = await Product.getProductsOfCategory(cateData.CategoryID, page, index);
                console.log(1);
            } else data = await Product.getProducts(index, limit);
            console.log(2);

            const count = Math.ceil(data.length / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    search = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const query = req.query._query || req.body._query;
            const index = Number((page - 1) * limit);
            const data = await Product.findProduct(query, index, limit);
            const count = Math.ceil(data.length / limit);
            return res.status(200).json({ success: true, data, count });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    cart = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            let price_total = 0;
            const data = await Cart.getCart(UserID);
            data.map((i) => {
                price_total += i.Quantity * i.Price;
            });
            return res.status(200).json({ success: true, data, price_total });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    about(req, res) {
        res.status(200).json({ success: true });
    }

    contact(req, res) {
        res.status(200).json({ success: true });
    }

    checkout = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const data_id = req.body.data.join(',');

            console.log(UserID, data_id);
            const data = await Checkout.getCheckout(UserID, data_id);
            let price_total = 0;
            data.map((i) => {
                price_total += i.Quantity * i.Price;
            });
            return res.status(200).json({ success: true, data, price_total });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    updateAddress = asyncHandler(async (req, res) => {
        try {
            const { full_name, phone, specific_address, ward, district, city } = req.body;
            const { UserID } = req.user;
            let active = 0;
            const count = await User.checkNumberOfUserAddress(UserID);
            if (count.count === 0) active = 1;
            await User.insertAddress(UserID, active, full_name, phone, specific_address, ward, district, city);
            return res.status(200).json({ success: true });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    getAddressUser = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            let address_active = [];
            const data = await User.getAddressUser(UserID);
            
            data.map((item) => { if (item.Active === true) address_active.push(item); });
            return res.status(200).json({ success: true, data, address_active });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    updateActiveAddress = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const data_id = req.body.data_id;
            let address_active = [];
            await Order.updateActiveAddress(data_id);

            const data = await User.getAddressUser(UserID);
            data.map((item) => { if (item.Active === true) address_active.push(item); });
            return res.status(200).json({ success: true, address_active });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    saveOrder = asyncHandler(async (req, res) => {
        try {
            const { UserID } = req.user;
            const { addressID, payment, order_details } = req.body;
            let OrderID;
            const data = await Order.saveOrder(addressID, UserID, payment);
            if (data.length > 0) OrderID = data[0].OrderID;
            await Order.saveOrderDetail(order_details, OrderID);
            return res.status(200).json({ success: true, OrderID });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    payment(req, res) {
        let product_list = [];
        const { priceTotal, OrderID, products } = req.body;

        products.map((item) => {
            product_list.push({
                name: item.Title,
                sku: item.ProductID,
                price: `${item.Price}`,
                currency: 'USD',
                quantity: item.Quantity,
            });
        });

        var create_payment_json = {
            intent: 'sale',
            payer: {
                payment_method: 'paypal',
            },
            redirect_urls: {
                return_url: `${process.env.BASE_URL_REACTJS}/success?total=${priceTotal}&order_id=${OrderID}`,
                cancel_url: `${process.env.BASE_URL_REACTJS}/cancel?order_id=${OrderID}`,
            },
            transactions: [
                {
                    item_list: {
                        items: product_list,
                    },
                    amount: {
                        currency: 'USD',
                        total: `${priceTotal}`,
                    },
                    description: 'This is the payment description.',
                },
            ],
        };

        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                for (let i = 0; i < payment.links.length; i++) {
                    if (payment.links[i].rel === 'approval_url') {
                        res.send(payment.links[i].href);
                    }
                }
            }
        });
    }

    success(req, res) {
        const payerId = req.body.PayerID;
        const paymentId = req.body.paymentId;
        const totalOrder = req.body.totalOrder;

        const execute_payment_json = {
            payer_id: payerId,
            transactions: [
                {
                    amount: {
                        currency: 'USD',
                        total: `${totalOrder}`,
                    },
                },
            ],
        };

        paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                res.status(200).json({ success: true });
            }
        });
    };

    cancelPayment(req, res) {
        return res.status(200).json({ success: true, message: 'Cancelled' });
    };

    updateStatusOrder = asyncHandler(async (req, res) => {
        try {
            const orderID = req.body.order_id;
            await Order.updateStatusOrder(orderID)
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    deleteCanceledOrder = asyncHandler(async (req, res) => {
        try {
            const orderID = req.body.order_id;
            await Order.deleteOrderDetail(orderID);
            await Order.deleteOrder(orderID);
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
}

module.exports = new SiteController();
