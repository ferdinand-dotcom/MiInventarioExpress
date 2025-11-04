const multer = require('multer');
const path = require('path');

// Configurar dónde se guardarán las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads'); // Carpeta donde se guardan
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Evita nombres repetidos
  }
});

// Validar tipo de archivo y tamaño
function fileFilter(req, file, cb) {
  const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error('Solo se permiten imágenes (.png, .jpg, .jpeg, .webp, .gif)'), false);
  }

  cb(null, true);
}

// Configuración final de multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 } // Máximo 2 MB
});

module.exports = upload;
