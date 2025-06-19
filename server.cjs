const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());

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

// Listar arquivos
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

// Upload de arquivo
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('Nenhum arquivo enviado.');
  res.json({ fileName: req.file.originalname });
});

// Excluir arquivo
app.delete('/api/delete/:fileName', (req, res) => {
  const filePath = path.join(process.cwd(), 'downloads', req.params.fileName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
