require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');

const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const { ensureAuth } = require('./middleware/auth');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// --- Conexión a BD ---
connectDB();

// --- Handlebars ---
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

// --- Middlewares básicos ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Sesiones ---
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
    secure: false, // pon true si usas HTTPS detrás de proxy
  },
});
app.use(sessionMiddleware);

// Exponer usuario en las vistas
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// --- Rutas ---
app.get('/', ensureAuth, (req, res) => res.redirect('/productos'));
app.use('/', authRoutes);
app.use('/productos', ensureAuth, productRoutes);
app.get('/chat', ensureAuth, (req, res) =>
  res.render('chat/index', { title: 'Chat en tiempo real' })
);

// --- Socket.io + sesiones ---
// Comparte la sesión de Express con Socket.io
io.engine.use((req, res, next) => {
  sessionMiddleware(req, res, next);
});

io.on('connection', (socket) => {
  const sess = socket.request.session;
  if (!sess || !sess.user) {
    socket.disconnect(true);
    return;
  }

  const username = sess.user.username;
  socket.join('chat');

  io.to('chat').emit('chat:system', `${username} se ha unido al chat`);

  socket.on('chat:message', (msg) => {
    io.to('chat').emit('chat:message', {
      from: username,
      text: msg,
      at: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    io.to('chat').emit('chat:system', `${username} salió del chat`);
  });
});

// --- Arranque ---
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`MiInventarioExpress en http://localhost:${PORT}`);
});
