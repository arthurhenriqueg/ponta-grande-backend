const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

// Serve arquivos estáticos do build do React
app.use(express.static(path.join(process.cwd(), 'dist')));
// Serve arquivos PDF para download
app.use('/downloads', express.static(path.join(process.cwd(), 'public/downloads')));

// Configuração do multer para salvar na pasta correta
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'public/downloads'));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // mantém o nome original
  }
});
const upload = multer({ storage });

// Listar arquivos
app.get('/api/files', (req, res) => {
  const dir = path.join(process.cwd(), 'public/downloads');
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao listar arquivos' });
    // Só arquivos PDF
    res.json(files.filter(f => f.endsWith('.pdf')));
  });
});

// Upload de arquivo
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  res.json({ fileName: req.file.originalname });
});

// Excluir arquivo
app.delete('/api/delete/:fileName', (req, res) => {
  const filePath = path.join(process.cwd(), 'public/downloads', req.params.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Para qualquer rota que não seja API ou download, retorna o index.html do React
app.get(/^\/(?!api|downloads).*/, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
