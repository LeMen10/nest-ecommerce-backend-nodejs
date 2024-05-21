const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderDetails = new Schema({});

Order.statics = {
    
};

module.exports = mongoose.model('orderDetails', orderDetails);
