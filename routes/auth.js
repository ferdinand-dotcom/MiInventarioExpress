const router = require('express').Router();
const { showLogin, login, loginValidators, logout, ensureAdminSeed } = require('../controllers/authController');

ensureAdminSeed().catch(console.error);

router.get('/login', showLogin);
router.post('/login', loginValidators, login);
router.post('/logout', logout);

module.exports = router;
