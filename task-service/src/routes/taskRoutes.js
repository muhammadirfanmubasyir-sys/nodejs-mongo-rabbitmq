const express = require('express');
const ctrl = require('../controllers/taskController');

const router = express.Router();

router.route('/').get(ctrl.getTasks).post(ctrl.createTask);
router.route('/:id').get(ctrl.getTaskById);

module.exports = router;
