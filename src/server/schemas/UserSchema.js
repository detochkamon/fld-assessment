const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    fullname: {
        type: String,
        default: 'Anonymous'
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        default: Date.now
    }
});
UserSchema.methods = {
    checkPassword: function(password) {
        return bcrypt.compareSync(password, this.password);
    },
    hashPassword: function() {
        const salt = bcrypt.genSaltSync(10);
        this.password = bcrypt.hashSync(this.password, salt);
    }
};
module.exports = UserSchema;