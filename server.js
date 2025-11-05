// --- Dependencias base ---
require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');

// --- Conexión a la BD ---
const connectDB = require('./config/db');

// --- Rutas y middlewares ---
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const { isAuthenticated } = require('./middleware/auth'); // lo tienes así ahora

// --- Inicialización del servidor ---
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// --- Conectar BD ---
connectDB();

// --- Configurar Handlebars ---
const hbs = exphbs.create({
  extname: '.hbs',
  helpers: {
    json: (ctx) => JSON.stringify(ctx),
    eq: (a, b) => a === b,
  },
});
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
app.set('views', path.join(__dirname, 'views'));

// --- Middlewares generales ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Configuración de sesiones ---
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'changeme',
  resave: false,
  saveUninitialized: false,
  store: process.env.MONGODB_URI
    ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
    : undefined,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 8, // 8 horas
    secure: false,
  },
});
app.use(sessionMiddleware);

// --- Exponer usuario en las vistas ---
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --- Rutas ---
app.get('/', isAuthenticated, (req, res) => res.redirect('/productos'));
app.use('/', authRoutes);
app.use('/productos', isAuthenticated, productRoutes);
app.get('/chat', isAuthenticated, (req, res) =>
  res.render('chat/index', { title: 'Chat en tiempo real' })
);

// --- Socket.io + sesiones (solo chat, sin bot) ---
// compartimos la sesión de express con socket.io
io.engine.use((req, res, next) => {
  sessionMiddleware(req, res, next);
});

io.on('connection', (socket) => {
  // recuperar la sesión del usuario
  const sess = socket.request.session;
  if (!sess || !sess.user) {
    // si no hay sesión, no entra al chat
    socket.disconnect(true);
    return;
  }

  const username = sess.user.username;

  // lo metemos a una sala (por si luego quieres salas)
  socket.join('chat');

  // avisamos a todos que se unió
  io.to('chat').emit('chat:system', `${username} se ha unido al chat`);

  // cuando este usuario envía un mensaje
  socket.on('chat:message', (msg) => {
    // acá asumimos que el cliente manda un STRING (ya lo dejamos así en la vista)
    if (typeof msg !== 'string' || msg.trim() === '') return;

    io.to('chat').emit('chat:message', {
      from: username,
      text: msg,
      at: new Date().toLocaleTimeString(),
    });
  });

  // cuando se desconecta
  socket.on('disconnect', () => {
    io.to('chat').emit('chat:system', `${username} salió del chat`);
  });
});

// --- Arranque ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 MiInventarioExpress corriendo en http://localhost:${PORT}`);
});
