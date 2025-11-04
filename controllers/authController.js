const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

exports.showLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesión' });
};

exports.loginValidators = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida')
];

exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', { errors: errors.array(), old: req.body });
  }
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).render('auth/login', { errors: [{ msg: 'Credenciales inválidas' }], old: req.body });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).render('auth/login', { errors: [{ msg: 'Credenciales inválidas' }], old: req.body });
  }
  req.session.user = { id: user._id, username: user.username };
  res.redirect('/productos');
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};

// util: crear admin si no existe (para pruebas)
exports.ensureAdminSeed = async () => {
  const exists = await User.findOne({ username: 'admin' });
  if (!exists) {
    const hash = await bcrypt.hash('admin123', 10);
    await User.create({ username: 'admin', password: hash });
    console.log('Usuario admin creado: admin / admin123');
  }
};
