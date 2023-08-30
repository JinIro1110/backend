const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authController = require('../controllers/authController');

router.post('/postsboard', projectController.postsboard);
router.get('/showfield', projectController.showfield);
router.get('/showMajorFields', projectController.showMajorFields);
router.get('/showMajorFields/:majorFieldId/subFields', projectController.showSubFields);
router.post('/createProjects', projectController.createProjects);
router.get('/recruitPage', projectController.recruitPage);
module.exports = router;