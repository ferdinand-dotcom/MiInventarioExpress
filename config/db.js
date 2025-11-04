const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/miinventarioexpress';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB conectado');
  } catch (err) {
    console.error('Error de conexión MongoDB', err);
    process.exit(1);
  }
};

module.exports = connectDB;
