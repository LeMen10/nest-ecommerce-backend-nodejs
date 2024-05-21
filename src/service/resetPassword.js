const asyncHandler = require('express-async-handler');
require('dotenv').config();

const createPasswordChangedToken = asyncHandler(async () => {
    const resetToken = crypto.randomBytes(32).toString('hex');
    password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
    password_reset_expires = Date.now() + 15 * 60 * 1000;
    return resetToken;
});
module.exports = createPasswordChangedToken;
