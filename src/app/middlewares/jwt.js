const jwt = require('jsonwebtoken')
// require('dotenv').config();

const generateAccessToken = (uid, role) => jwt.sign({ UserID: uid, Role:role }, process.env.JWT_SECRET)
const generateRefreshToken = (uid) => jwt.sign({ UserID: uid }, process.env.JWT_SECRET, { expiresIn: '7d' })


module.exports = {
    generateAccessToken,
    generateRefreshToken
}