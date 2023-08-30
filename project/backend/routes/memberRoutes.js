const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

router.get('/acceptedMembers', memberController.acceptedMembers);

module.exports = router;
