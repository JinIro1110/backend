const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/checkLogin', authController.checkLogin);
router.post('/logout', authController.logout);
router.post('/searchId', authController.searchId);
router.post('/searchPassword', authController.searchPassword);
router.get('/verifyToken/:token', authController.verifyToken);
router.post('/updatePassword', authController.updatePassword);

module.exports = router;
