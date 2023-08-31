const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');

router.get('/recruitPage', recruitmentController.recruitPage);

module.exports = router;