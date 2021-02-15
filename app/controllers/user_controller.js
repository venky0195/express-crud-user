const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const userModel = require('../models/user_model');
const apiError = require("../middleware/apiError")
const sgMail = require('@sendgrid/mail');
/**
 * UserController Module
 * @module UserController
 */
module.exports = class userController {
    /**
     * createUser - creates an user
     * @param {object} data     object containing user details
     * @returns {promise} userObject    object containing user
     */
    static createUser(data) {
        return new Promise((resolve, reject) => {
            userModel.findOne({ "email": data.email })
                .then((email) => {
                    if (email) {
                        return reject(new apiError.Conflict({ message: "This email address is already registered" }));
                    } else {
                        data.password = bcrypt.hashSync(data.password, bcrypt.genSaltSync(8))
                        const user_data = new userModel(data);
                        return user_data.save()
                    }
                }).then((data) => {
                    if (data) {
                        resolve({ message: "successfully created a user" });
                    }
                }).catch(err => {
                    reject({ message: err.message, error: err });
                })
        });
    }

    /**
     * getUsers - gets user details
     * @returns {promise} userObject    object containing users
     */
    static getUsers() {
        return new Promise((resolve, reject) => {
            userModel.find().then((doc) => {
                resolve({ message: "Successfully retrieved the users", data: doc })
            }).catch((err) => {
                reject({ message: err.message, error: err })
            })
        })
    }

    /**
     * getUserById - gets particular user details 
     * @param {string} user_id     user id of the user to be retrieved
     * @returns {promise} userObject    object containing user
     */
    static getUserById(user_id) {
        return new Promise((resolve, reject) => {
            userModel.findOne({ _id: ObjectId(user_id) }).then((doc) => {
                resolve({ message: "Successfully retrieved user", data: doc })
            }).catch((err) => {
                reject({ message: err.message, error: err })
            })
        })
    }

    /**
     * updateUserById - updates particular user details 
     * @param {string} user_id     user id of the user to be retrieved
     * @param {object} update      object containing update data
     * @returns {promise} userObject    object containing user
     */
    static updateUserById(user_id, update) {
        if (update && update.password) {
            update.password = bcrypt.hashSync(update.password, bcrypt.genSaltSync(8))
        }
        return new Promise((resolve, reject) => {
            userModel.findOneAndUpdate({ _id: ObjectId(user_id) }, { $set: update }).then((doc) => {
                doc ? resolve({ message: "Successfully updated the user", data: doc }) : reject(new apiError.NotFound({ message: "Invalid user id passed" }))
            }).catch((err) => {
                reject({ message: err.message, error: err })
            })
        })
    }

    /**
     * deleteUserById - deletes particular user 
     * @param {string} user_id     user id of the user to be deleted
     * @returns {promise} confirmation    delete status
     */
    static deleteUserById(user_id) {
        return new Promise((resolve, reject) => {
            userModel.findOneAndRemove({ _id: ObjectId(user_id) }).then((doc) => {
                doc ? resolve({ message: "Successfully deleted the user", data: doc }) : reject(new apiError.NotFound({ message: "Invalid user id passed" }))
            }).catch((err) => {
                reject({ message: err.message, error: err })
            })
        })
    }

    /**
     * ForgotPassword - sends a link to reset the password
     * @param {string} email     email id of the user
     * @param {string} origin   origin of the user
     * @returns {promise} confirmation   password reset link sent or not
     */
    static forgotPassword(email, origin) {
        return new Promise((resolve, reject) => {
            let resetpasswordurl = origin;
            let useremail = userModel.findOne({ 'email': email });
            if (!useremail) reject(new apiError.NotFound({ message: "Email not found" }))
            const token = jwt.sign({
                email: email
            }, process.env.JWT_KEY, {
                expiresIn: '1h'
            });
            userModel.findOneAndUpdate(
                { 'email': email },
                {
                    $set: {
                        resetPasswordToken: token
                    }
                }).then((user) => {
                    if (!user) {
                        reject(new apiError.NotFound({ message: "User Not Found or invalid  email id" }))

                    } else {
                        const emaildata = {
                            to: email,
                            from: 'venkatesh.g@zibtek.in',
                            subject: 'Reset password',
                            html: '<h3><b>Reset Password</b></h3>' +
                                '<p>You have requested to reset your password. Click on this link to reset your password:</p>' +
                                '<a href=' + resetpasswordurl + '/' + 'reset-password?key=' + token + '">' + resetpasswordurl + 'reset-password/' + +'/' + token + '</a>' +
                                +'<br>' +
                                '<p>If you did not request to have your password reset, you can safely delete and ignore this email.<p>'
                                + '<br>'
                        };
                        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                        sgMail.send(emaildata).then(() => {
                            resolve({
                                message: `Email has been sent to ${email}`,
                                resetPasswordToken: token
                            });
                        }).catch((err) => {
                            reject({ message: err })
                        });

                    }
                }).catch((error) => {
                    reject(error);
                });
        });
    }

    /**
     * resetPassword - resets the password of the user
     * @param {requestObject} object     token and password
     * @returns {promise} confirmation   password reset successful or not
     */
    static resetPassword(requestObject) {
        return new Promise((resolve, reject) => {
            userModel.findOne({ resetPasswordToken: requestObject.resetPasswordToken })
                .then((userData) => {
                    if (!userData) {
                        reject(new apiError.BadRequest({ message: "Invalid Token" }))
                    } else {
                        let passwordhash = requestObject.password;
                        passwordhash = bcrypt.hashSync(passwordhash, bcrypt.genSaltSync(8))
                        userModel.findOneAndUpdate({
                            resetPasswordToken: requestObject.resetPasswordToken
                        }, {
                            $set: {
                                'password': passwordhash,
                                resetPasswordToken: ''
                            }
                        })
                            .then(() => {
                                resolve({
                                    message: 'Successfully updated your password '
                                });
                            })
                            .catch((err) => {
                                reject({
                                    message: 'failed to update password',
                                    error: err
                                });
                            });
                    }
                });
        });
    }

    /**
     * userLogin - validates and login
     * @param {object} requestObject     email and password in an object
     * @returns {promise} confirmation confirmation user details with a token    
     */
    static userLogin(requestObject) {
        let password = requestObject.password;
        let email = requestObject.email;
        return new Promise((resolve, reject) => {
            userModel.getAuthenticated(email, password, async (err, user, reason) => {
                if (err) {
                    reject(err);
                }
                if (user) {
                    const token = jwt.sign({
                        email: user.email,
                        _id: user._id,
                    }, process.env.JWT_KEY);
                    resolve({
                        user: user,
                        token: token
                    });

                } else {
                    var reasons = userModel.failedLogin;
                    switch (reason) {
                        case reasons.NOT_FOUND:
                            reject(new apiError.NotFound({ message: "User not found" }))
                            break;
                        case reasons.PASSWORD_INCORRECT:
                            reject(new apiError.BadRequest({ message: "Password is incorrect" }))
                            break;
                        case reasons.PASSWORD_INVALID:
                            reject(new apiError.BadRequest({ message: "Password is Invalid : password filled can't be empty" }))
                            break;
                    }
                }
            });
        });
    }
}