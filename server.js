const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Le mot de passe et la clé de session viennent des variables d'environnement
// (à définir dans le dashboard Render, jamais dans le code)
const SITE_PASSWORD = process.env.SITE_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-moi-en-prod';

if (!SITE_PASSWORD) {
  console.warn('ATTENTION: la variable d\'environnement SITE_PASSWORD n\'est pas définie.');
}

app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12, // 12h de session
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// La page de login et ses assets doivent rester accessibles sans être connecté
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.post('/login', (req, res) => {
  const submitted = req.body.password || '';
  if (SITE_PASSWORD && submitted === SITE_PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// Middleware de garde : tout le reste nécessite une session valide
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) {
    return next();
  }
  return res.redirect('/login');
}

app.use(requireAuth);

// Une fois authentifié, on sert le cours
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cours.html'));
});

// Sert d'éventuels autres fichiers statiques protégés (images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
