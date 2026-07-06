const express = require('express');
const ctrl = require('../controllers/userController');

const router = express.Router();

router.route('/').get(ctrl.getUsers).post(ctrl.createUser);
router.route('/id/:id').get(ctrl.getUserById).delete(ctrl.deleteUserById);
router.route('/email/:email').get(ctrl.getUserByEmail).delete(ctrl.deleteUserByEmail);
router.route('/:id').put(ctrl.updateUser);

module.exports = router;
