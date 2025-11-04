const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');

exports.validatorsCreate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('descripcion').optional().isLength({ max: 500 }).withMessage('Descripción muy larga')
];

exports.validatorsUpdate = [
  body('nombre').trim().notEmpty().withMessage('Nombre requerido'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
  body('descripcion').optional().isLength({ max: 500 }).withMessage('Descripción muy larga')
];

exports.list = async (req, res) => {
  const productos = await Product.find().sort({ createdAt: -1 }).lean();
  res.render('products/list', { title: 'Productos', productos });
};

exports.showCreate = (req, res) => {
  res.render('products/create', { title: 'Nuevo producto' });
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('products/create', { errors: errors.array(), old: req.body });
  }
  const imagen = req.file ? `/uploads/${req.file.filename}` : '';
  const { nombre, precio, descripcion } = req.body;
  await Product.create({ nombre, precio, descripcion, imagen });
  res.redirect('/productos');
};

exports.showEdit = async (req, res) => {
  const p = await Product.findById(req.params.id).lean();
  if (!p) return res.status(404).send('Producto no encontrado');
  res.render('products/edit', { title: 'Editar producto', p });
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const p = await Product.findById(req.params.id).lean();
    return res.status(400).render('products/edit', { errors: errors.array(), p });
  }
  const data = {
    nombre: req.body.nombre,
    precio: req.body.precio,
    descripcion: req.body.descripcion,
  };
  if (req.file) data.imagen = `/uploads/${req.file.filename}`;
  await Product.findByIdAndUpdate(req.params.id, data);
  res.redirect('/productos');
};

exports.remove = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect('/productos');
};
