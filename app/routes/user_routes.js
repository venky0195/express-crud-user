const express = require('express');
const router = express.Router()
const userController = require('../controllers/user_controller');
const apiError = require('../middleware/apiError');
const auth = require('../middleware/auth')

router.post('/create_user', (req, res) => {
    userController.createUser(req.body).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
router.get('/get_users', auth, (req, res) => {
    userController.getUsers(req.query).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
router.get('/get_user_by_id/:user_id', auth, (req, res) => {
    userController.getUserById(req.params.user_id).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
router.put('/update_user/:user_id', auth, (req, res) => {
    userController.updateUserById(req.params.user_id, req.body).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
router.delete('/delete_user/:user_id', auth, (req, res) => {
    userController.deleteUserById(req.params.user_id).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
router.post('/login', (req, res) => {
    userController.userLogin(req.body).then((result) => {
        res.send(result)
    }).catch((err) => {
        let httpError = apiError.getError(err)
        res.status(httpError.code).send(httpError.details)
    })
})
module.exports = router