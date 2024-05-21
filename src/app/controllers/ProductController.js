const Product = require('../models/Product');
const asyncHandler = require('express-async-handler');

class ProductController {
    show = asyncHandler(async (req, res) => {
        try {
            const slug = req.params.slug;
            const product = await Product.getProductByID(slug);
            return res.status(200).json({ success: true, product });
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });

    get_products = asyncHandler(async (req, res) => {
        try {
            const page = parseInt(req.query._page) || parseInt(req.body._page);
            const limit = parseInt(req.query._limit) || parseInt(req.body._limit);
            const index = Number((page - 1) * limit);
            const data = await Product.getProducts(index, limit);
            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.log(error);
            return res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    });
}

module.exports = new ProductController();
