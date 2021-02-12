const _ = require('lodash')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const userModel = require('../models/user_model');
const apiError = require("../middleware/apiError")
/**
 * UserController Module
 * @module UserController
 */
module.exports = {
    createUser: createUser,
    getUsers: getUsers,
    getUserById: getUserById,
    updateUserById: updateUserById,
    deleteUserById: deleteUserById,
    userLogin: userLogin
}

/**
 * createUser - creates an user
 * @param {object} data     object containing user details
 * @returns {promise} userObject    object containing user
 */
function createUser(data) {
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
function getUsers() {
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
function getUserById(user_id) {
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
function updateUserById(user_id, update) {
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
function deleteUserById(user_id) {
    return new Promise((resolve, reject) => {
        userModel.findOneAndRemove({ _id: ObjectId(user_id) }).then((doc) => {
            doc ? resolve({ message: "Successfully deleted the user", data: doc }) : reject(new apiError.NotFound({ message: "Invalid user id passed" }))
        }).catch((err) => {
            reject({ message: err.message, error: err })
        })
    })
}

/**
 * userLogin - validates and login
 * @param {object} requestObject     email and password in an object
 * @returns {promise} confirmation confirmation user details with a token    
 */
function userLogin(requestObject) {
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
