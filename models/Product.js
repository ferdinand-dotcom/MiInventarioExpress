const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  precio: { type: Number, required: true, min: 0 },
  descripcion: { type: String, default: '' },
  imagen: { type: String, default: '' } // ruta relativa /uploads/...
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
