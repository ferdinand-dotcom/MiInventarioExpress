const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const upload = require('../middleware/upload');
const Product = require('../models/Product');

const router = Router();

// 📌 Listar productos
router.get('/', async (req, res) => {
  const productos = await Product.find().lean();
  res.render('products/list', { productos });
});

// 📌 Crear producto con validaciones e imagen
router.post(
  '/',
  upload.single('imagen'),
  [
    body('nombre')
      .notEmpty()
      .withMessage('El nombre es obligatorio'),
    body('precio')
      .isFloat({ gt: 0 })
      .withMessage('El precio debe ser un número mayor que 0'),
  ],
  async (req, res) => {
    const errors = validationResult(req);

    // Si hay errores, volver a mostrar la lista con los mensajes
    if (!errors.isEmpty()) {
      const productos = await Product.find().lean();
      return res.status(400).render('products/list', {
        productos,
        errors: errors.array(),
      });
    }

    try {
      const { nombre, precio, descripcion } = req.body;

      await Product.create({
        nombre,
        precio,
        descripcion,
        imagen: req.file ? `/uploads/${req.file.filename}` : '',
      });

      // como en server.js montaste esto en /productos
      res.redirect('/productos');
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).send('Error interno del servidor');
    }
  }
);

module.exports = router;
