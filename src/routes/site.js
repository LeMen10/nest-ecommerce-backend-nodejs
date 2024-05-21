const express = require('express');
const router = express.Router();
const siteController = require('../app/controllers/SiteController');
const verifyAccessToken = require('../app/middlewares/verifyToken');

router.use('/delete-canceled-order', verifyAccessToken, siteController.deleteCanceledOrder);
router.use('/update-active-address', verifyAccessToken, siteController.updateActiveAddress);
router.use('/update-status-order', verifyAccessToken, siteController.updateStatusOrder);
router.use('/update-address', verifyAccessToken, siteController.updateAddress);
router.use('/get-address', verifyAccessToken, siteController.getAddressUser);
router.use('/save-order', verifyAccessToken, siteController.saveOrder);
router.use('/cancel', verifyAccessToken, siteController.cancelPayment);
router.use('/checkout', verifyAccessToken, siteController.checkout);
router.use('/payment', verifyAccessToken, siteController.payment);
router.use('/success', verifyAccessToken, siteController.success);
router.use('/about', verifyAccessToken, siteController.about);
router.use('/cart', verifyAccessToken, siteController.cart);
router.use('/category', siteController.category);
router.use('/contact', siteController.contact);
router.use('/search', siteController.search);
router.use('/shop', siteController.shop);
router.use('/', siteController.index);

module.exports = router;
