const NO_ERROR = 0;
const UNKNOWN_ERROR = 1;
const INVALID_USERNAME = 2;
const INVALID_PASSWORD = 3;
const INVALID_USERNAME_OR_PASSWORD = 4;
const INVALID_USERNAME_OCCUPIED = 5;

module.exports = {
    UNKNOWN_ERROR,
    INVALID_USERNAME,
    INVALID_USERNAME_OCCUPIED,
    INVALID_PASSWORD,
    INVALID_USERNAME_OR_PASSWORD,
    success: function(data = null) {
        return {
            success: true,
            data: data
        }
    },
    fail: function(data = null, reason = NO_ERROR) {
        return {
            success: false,
            data: data,
            reason: reason
        }
    }
};