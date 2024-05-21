const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { connect, sql } = require('../../config/db/index');
const { saveOrder } = require('../controllers/SiteController');

const Order = new Schema({});

Order.statics = {
    getOrders: async (index, limit) => {
        const pool = await connect;
        const query_order = `SELECT od.Status, od.Quantity, od.Price, od.OrderDetailID, 
                                    od.PaymentStatus, o.CreateDate, a.FullName 
                                FROM Orders o 
                                JOIN OrderDetail od ON o.OrderID = od.OrderID 
                                JOIN Address a ON o.AddressID = a.AddressID 
                                ORDER BY o.CreateDate DESC 
                                OFFSET ${index} ROWS 
                                FETCH NEXT ${limit} ROWS ONLY;`;
        const data = await pool.request().query(query_order);
        return data.recordset;
    },

    getCountOrder: async () => {
        const pool = await connect;
        const count = `SELECT COUNT(*) AS count FROM Orders`;
        const data = await pool.request().query(count);
        return data.recordset[0].count;
    },

    getOrderStatistics: async () => {
        const pool = await connect;
        const query = `SELECT COUNT(*) AS allOrder,
                        COUNT(CASE WHEN Status = N'Đang xử lý' THEN 1 END) AS processing,
                        COUNT(CASE WHEN Status = N'Đang giao hàng' THEN 1 END) AS delivering,
                        COUNT(CASE WHEN Status = N'Đã hoàn thành' THEN 1 END) AS complete 
                        FROM OrderDetail;`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    updateStatusOrder: async (status, orderDetailID) => {
        const pool = await connect;
        const update_status =
            status === 'Hoàn thành'
                ? `UPDATE OrderDetail SET Status = ${status} , PaymentStatus = "Đã thanh toán"
                    WHERE OrderDetailID = ${orderDetailID}`
                : `UPDATE OrderDetail SET Status = ${status} 
                    WHERE OrderDetailID = ${orderDetailID}`;
        const data = await pool.request().query(update_status);
        return data.recordset;
    },

    getOrderStatisticsByYear: async () => {
        const pool = await connect;
        const query = `SELECT
                            YEAR(o.CreateDate) AS Year,
                            MONTH(o.CreateDate) AS Month,
                            COUNT(*) AS OrderDetailCount
                        FROM Orders o JOIN OrderDetail od ON o.OrderID = od.OrderID
                        WHERE YEAR(o.CreateDate) = 2024
                        GROUP BY YEAR(o.CreateDate), MONTH(o.CreateDate)
                        ORDER BY Year, Month`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    purchase: async (type, userID) => {
        const pool = await connect;
        let status;
        if (type == 'noted') status = 'Đang xử lý';
        else if (type == 'cancelled') status = 'Đã hủy';
        else if (type == 'complete') status = 'Hoàn thành';
        else if (type == 'delivering') status = 'Đang giao hàng';

        const query = `SELECT od.Status, od.Quantity, od.Price, od.OrderDetailID, 
                                    p.Title, p.Image 
                                FROM Orders o 
                                JOIN OrderDetail od ON o.OrderID = od.OrderID
                                JOIN Products p ON od.ProductID = p.ProductID
                                WHERE o.UserID = ${userID}  AND od.Status = N'${status}'
                                ORDER BY o.CreateDate DESC`;
        const data = await pool.request().query(query);
        return data.recordset;
    },

    orderCancel: async () => {
        const pool = await connect;
        const update_status = `UPDATE OrderDetail SET Status = 'Đã hủy' 
                                WHERE OrderDetailID = ${orderDetailID}`;
        await pool.request().query(update_status);
    },

    saveOrder: async (addressID, userID, payment) => {
        const query = `INSERT INTO Orders (AddressID, Payment, UserID)
                            OUTPUT INSERTED.OrderID
                            VALUES (@AddressID, @Payment, @UserID)`;
        const save_order = await pool
            .request()
            .input('AddressID', sql.Int, Number(addressID))
            .input('UserID', sql.Int, userID)
            .input('Payment', sql.NVarChar, payment)
            .query(query);
        const data = await pool.request().query(save_order);
        return data.recordset;
    },

    saveOrderDetail: async (order_details, orderID) => {
        const pool = await connect;
        let query;
        order_details.map(async (item) => {
            query = `INSERT INTO OrderDetail 
                                    (PaymentStatus, Price, ProductID, Quantity, Status, OrderId)
                                    VALUES (@PaymentStatus, @Price, @ProductID, @Quantity, @Status, @OrderID)`;
            await pool
                .request()
                .input('PaymentStatus', sql.NVarChar, item.PaymentStatus)
                .input('Price', sql.Int, item.Price)
                .input('ProductID', sql.Int, item.ProductID)
                .input('Quantity', sql.Int, item.Quantity)
                .input('Status', sql.NVarChar, item.Status)
                .input('OrderID', sql.Int, orderID)
                .query(query);
        });
    },

    updateStatusOrder: async (orderID) => {
        const pool = await connect;
        const update_status = `UPDATE OrderDetail SET PaymentStatus = 'Đã thanh toán' 
                                WHERE OrderID = ${orderID}`;
        await pool.request().query(update_status);
    },

    deleteOrderDetail: async (orderID) => {
        const pool = await connect;
        const query = `DELETE From OrderDetail WHERE OrderID = ${orderID}`;
        await pool.request().query(query);
    },
    
    deleteOrder: async (orderID) => {
        const pool = await connect;
        const query = `DELETE From Orders WHERE OrderID = ${orderID}`;
        await pool.request().query(query);
    },

    updateActiveAddress: async (dataID) => {
        const pool = await connect;
        const query = `UPDATE Address
                        SET Active = CASE
                            WHEN AddressID = ${dataID} THEN ${1}
                            ELSE ${0}
                        END
                        WHERE UserID = ${UserID}`
        await pool.request().query(query);
    }
};

module.exports = mongoose.model('Order', Order);
