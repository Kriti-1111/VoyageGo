// driver.js
const roleAuth = require('./roleMiddleware');
module.exports = roleAuth(['driver', 'admin']);