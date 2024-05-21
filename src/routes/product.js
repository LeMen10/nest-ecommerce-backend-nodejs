const express = require('express')
const router = express.Router()
const verifyAccessToken = require('../app/middlewares/verifyToken')
const productController = require('../app/controllers/ProductController');

router.use('/get-products', productController.get_products);
router.use('/:slug', verifyAccessToken, productController.show);

module.exports = router;