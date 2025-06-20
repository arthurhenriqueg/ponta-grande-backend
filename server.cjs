const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve arquivos PDF para download
app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

// Configuração do multer para salvar na pasta correta
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'downloads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// --- INÍCIO: Endpoints de arquivos ---
app.get('/api/files', (req, res) => {
  const dir = path.join(process.cwd(), 'downloads');
  fs.readdir(dir, (err, files) => {
    if (err) {
      console.error("Erro ao listar arquivos:", err);
      return res.status(500).json({ error: 'Erro ao listar arquivos' });
    }
    res.json(files.filter(f => f.endsWith('.pdf')));
  });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  res.json({ fileName: req.file.originalname });
});

app.delete('/api/delete/:fileName', (req, res) => {
  const filePath = path.join(process.cwd(), 'downloads', req.params.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});
// --- FIM: Endpoints de arquivos ---

// --- INÍCIO: Endpoint de health check para uptime ---
app.get('/api/ping', (req, res) => {
  res.send('pong');
});
// --- FIM: Endpoint de health check para uptime ---

// --- INÍCIO: Persistência de setores e demandas no backend ---
const DATA_FILE = path.join(process.cwd(), 'action-plan-data.json');

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
    return { items: [], categorias: [] };
  } catch (e) {
    return { items: [], categorias: [] };
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

app.get('/api/action-plan', (req, res) => {
  const data = readData();
  res.json(data);
});

app.post('/api/action-plan', (req, res) => {
  const { items, categorias } = req.body;
  if (!Array.isArray(items) || !Array.isArray(categorias)) {
    return res.status(400).json({ error: 'Dados inválidos' });
  }
  writeData({ items, categorias });
  res.json({ ok: true });
});
// --- FIM: Persistência de setores e demandas no backend ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
