const express = require('express')
const router = express.Router()
const adminController = require('../app/controllers/AdminController');

router.use('/get-category', adminController.getCategory);
router.get('/get-username', adminController.getUserName);

router.use('/restore-multiple-users', adminController.restoreMultipleUser);
router.use('/delete-multiple-users', adminController.deleteMultipleUser);
router.use('/count-user-deleted', adminController.getCountUserDeleted);
router.use('/restore-user/:id', adminController.restoreUser);
router.use('/delete-user/:id', adminController.deleteUser);
router.use('/find-user/:id', adminController.findUser);
router.use('/edit-user/:id', adminController.editUser);
router.use('/trash-users', adminController.trashUsers);
router.use('/get-users', adminController.getUsers);

router.use('/restore-multiple-products', adminController.restoreMultipleProduct);
router.use('/delete-multiple-products', adminController.deleteMultipleProduct);
router.use('/count-product-deleted', adminController.getCountProductDeleted);
router.use('/restore-product/:id', adminController.restoreProduct);
router.use('/delete-product/:id', adminController.deleteProduct);
router.use('/find-product/:id', adminController.findProduct);
router.use('/edit-product/:id', adminController.editProduct);
router.use('/find-product/:id', adminController.findProduct);
router.use('/trash-products', adminController.trashProducts);
router.use('/get-products', adminController.getProduct);
router.use('/add-product', adminController.addProduct);

router.use('/update-status-order/:id', adminController.updateStatusOrder);
router.use('/order-statistics', adminController.orderStatistics);
router.use('/get-number-order', adminController.getNumberOrder);
router.use('/get-orders', adminController.getOrders);

module.exports = router;