const _ = require('lodash')
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
// const ObjectId = mongoose.Types.ObjectId

const user_schema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, maxlength: 50 },
    phone_no: { type: String, maxlength: 12 },
    user_name: { type: String, maxlength: 50 },
    role: { type: String, enum: ['ADMIN', 'USER', 'MAINTAINER'] },
    password: { type: String, required: true }
}, {
    timestamps: true
});

// expose enum on the model, and provide an internal convenience reference 
var reasons = (user_schema.statics.failedLogin = {
    NOT_FOUND: 0,
    PASSWORD_INCORRECT: 1,
    PASSWORD_INVALID: 2
});


user_schema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (
        err,
        isMatch
    ) {
        if (err) return err;
        cb(null, isMatch);
    });
};

user_schema.statics.getAuthenticated = function (email, password, cb) {
    this.findOne({
        "email": email
    }, (err, user) => {
        if (err) return cb(err);
        // make sure the user exists
        if (_.isEmpty(user)) {
            return cb(null, null, reasons.NOT_FOUND);
        }
        //if password null
        if (!password) {
            return cb(null, null, reasons.PASSWORD_INVALID);
        }
        user.comparePassword(password, (err, isMatch) => {
            if (err) return cb(err);
            // check if the password was a match
            if (isMatch) {
                return cb(null, user);
            }
            return cb(null, null, reasons.PASSWORD_INCORRECT);
        });
    });
};


module.exports = mongoose.model("Users", user_schema, "Users");