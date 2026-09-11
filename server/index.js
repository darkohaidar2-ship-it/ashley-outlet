import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3008;

app.use(cors());
app.use(express.json());

// Ensure uploads and data folders exist
const uploadsDir = path.join(rootDir, 'uploads');
const dataDir = path.join(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Static serving for uploads
app.use('/uploads', express.static(uploadsDir));

// Multer storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'ashley-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Helper to read DB
function readDB() {
  try {
    const data = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { categories: [], collections: [], models: [] };
  }
}

// Helper to save DB
function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
}

// --- API ROUTES ---

// 1. Get all data
app.get('/api/data', (req, res) => {
  res.json(readDB());
});

// 2. Admin Login
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === 'ashley123ewq') {
    res.json({ success: true, token: 'ashley-admin-token' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 3. Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 4. Categories CRUD
app.post('/api/categories', (req, res) => {
  const db = readDB();
  const newCat = {
    id: 'cat-' + Date.now(),
    name_ku: req.body.name_ku || req.body.name || 'کەتەگۆری نوێ',
    name_en: req.body.name_en || req.body.name || 'New Category',
    name_ar: req.body.name_ar || req.body.name || 'قسم جديد',
    icon: req.body.icon || 'Folder'
  };
  db.categories.push(newCat);
  writeDB(db);
  res.json(newCat);
});

app.put('/api/categories/:id', (req, res) => {
  const db = readDB();
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...req.body };
    writeDB(db);
    res.json(db.categories[index]);
  } else {
    res.status(404).json({ error: 'Category not found' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const db = readDB();
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  // Also clean up collections & models under this category
  db.collections = db.collections.filter(col => col.categoryId !== req.params.id);
  db.models = db.models.filter(m => m.categoryId !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 5. Collections CRUD
app.post('/api/collections', (req, res) => {
  const db = readDB();
  const newCol = {
    id: 'col-' + Date.now(),
    categoryId: req.body.categoryId,
    name: req.body.name || 'New Collection'
  };
  db.collections.push(newCol);
  writeDB(db);
  res.json(newCol);
});

app.put('/api/collections/:id', (req, res) => {
  const db = readDB();
  const index = db.collections.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.collections[index] = { ...db.collections[index], ...req.body };
    writeDB(db);
    res.json(db.collections[index]);
  } else {
    res.status(404).json({ error: 'Collection not found' });
  }
});

app.delete('/api/collections/:id', (req, res) => {
  const db = readDB();
  db.collections = db.collections.filter(c => c.id !== req.params.id);
  db.models = db.models.filter(m => m.collectionId !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// 6. Models CRUD
app.post('/api/models', (req, res) => {
  const db = readDB();
  const newModel = {
    id: 'mod-' + Date.now(),
    categoryId: req.body.categoryId,
    collectionId: req.body.collectionId,
    name: req.body.name,
    sku: req.body.sku || 'ASH-' + Math.floor(1000 + Math.random() * 9000),
    image: req.body.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=80',
    stock: parseInt(req.body.stock) || 1,
    originalPrice: parseFloat(req.body.originalPrice) || 0,
    salePrice: parseFloat(req.body.salePrice) || 0,
    notes: req.body.notes || ''
  };
  db.models.unshift(newModel);
  writeDB(db);
  res.json(newModel);
});

app.put('/api/models/:id', (req, res) => {
  const db = readDB();
  const index = db.models.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    db.models[index] = {
      ...db.models[index],
      ...req.body,
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : db.models[index].stock,
      originalPrice: req.body.originalPrice !== undefined ? parseFloat(req.body.originalPrice) : db.models[index].originalPrice,
      salePrice: req.body.salePrice !== undefined ? parseFloat(req.body.salePrice) : db.models[index].salePrice
    };
    writeDB(db);
    res.json(db.models[index]);
  } else {
    res.status(404).json({ error: 'Model not found' });
  }
});

app.delete('/api/models/:id', (req, res) => {
  const db = readDB();
  db.models = db.models.filter(m => m.id !== req.params.id);
  writeDB(db);
  res.json({ success: true });
});

// Bulk update / save all models from spreadsheet
app.post('/api/models/bulk', (req, res) => {
  const db = readDB();
  if (Array.isArray(req.body.models)) {
    db.models = req.body.models.map((m, index) => ({
      id: m.id || ('mod-' + Date.now() + '-' + index),
      categoryId: m.categoryId || '',
      collectionId: m.collectionId || '',
      name: m.name || '',
      sku: m.sku || '',
      image: m.image || '',
      stock: m.stock !== undefined && m.stock !== '' ? parseInt(m.stock) : 0,
      originalPrice: m.originalPrice !== undefined && m.originalPrice !== '' ? parseFloat(m.originalPrice) : 0,
      salePrice: m.salePrice !== undefined && m.salePrice !== '' ? parseFloat(m.salePrice) : 0,
      notes: m.notes || ''
    }));
    writeDB(db);
    res.json({ success: true, count: db.models.length });
  } else {
    res.status(400).json({ error: 'Expected models array' });
  }
});

// Settings (Logo URL etc.)
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || { logoUrl: '' });
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = { ...(db.settings || {}), ...req.body };
  writeDB(db);
  res.json(db.settings);
});

// Initialize Vite in Middleware mode or serve static production files
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: rootDir
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(rootDir, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==============================================`);
    console.log(`🛋️ ASHLEY OUTLET CATALOG RUNNING`);
    console.log(`🌐 Local URL: http://localhost:${PORT}`);
    console.log(`📲 iPad / Network URL: http://<YOUR_IP>:${PORT}`);
    console.log(`==============================================\n`);
  });
}

startServer();
