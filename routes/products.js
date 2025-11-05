const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const productController = require('../controllers/productController');
const { isAuthenticated } = require('../middlewares/auth'); // asegúrate de tener este middleware

// --------------------
// CONFIGURACIÓN DE MULTER
// --------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5 MB
  fileFilter: function (req, file, cb) {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes (.jpg, .jpeg, .png, .gif, .webp)'));
    }
  }
});

// --------------------
// RUTAS DEL CRUD DE PRODUCTOS
// --------------------

// ✅ LISTAR productos
router.get('/', isAuthenticated, productController.list);

// ✅ FORMULARIO para crear producto
router.get('/nuevo', isAuthenticated, productController.showCreate);

// ✅ CREAR producto
router.post(
  '/',
  isAuthenticated,
  upload.single('imagen'),
  productController.validatorsCreate,
  productController.create
);

// ✅ FORMULARIO para editar producto
router.get('/:id/editar', isAuthenticated, productController.showEdit);

// ✅ ACTUALIZAR producto
router.post(
  '/:id',
  isAuthenticated,
  upload.single('imagen'),
  productController.validatorsUpdate,
  productController.update
);

// ✅ ELIMINAR producto
router.post('/:id/eliminar', isAuthenticated, productController.remove);

// --------------------
module.exports = router;
