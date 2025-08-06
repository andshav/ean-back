const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

const UPLOAD_DIR = "./uploads";
const XLSX_FILE = path.join(UPLOAD_DIR, "ean_codes.xlsx");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Получить текущий список кодов
app.get("/api/codes", (req, res) => {
  if (!fs.existsSync(XLSX_FILE)) return res.json([]);
  const wb = xlsx.readFile(XLSX_FILE);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const codes = xlsx.utils
    .sheet_to_json(ws, { header: 1 })
    .map((row) => row[0])
    .filter(Boolean);
  res.json(codes);
});

// Скачать текущий xlsx
app.get("/api/codes/download", (req, res) => {
  if (!fs.existsSync(XLSX_FILE)) return res.status(404).send("Not found");
  res.download(XLSX_FILE, "ean_codes.xlsx");
});

// Загрузить новый xlsx (старый переименовать)
const upload = multer({ dest: "uploads/" });
app.post("/api/codes/upload", upload.single("file"), (req, res) => {
  console.log(req.query);
  if (!req.file) return res.status(400).send("No file");
  if (fs.existsSync(XLSX_FILE)) {
    const timestamp = Date.now();
    fs.renameSync(
      XLSX_FILE,
      XLSX_FILE.replace(".xlsx", `_old_${timestamp}.xlsx`)
    );
  }
  fs.renameSync(req.file.path, XLSX_FILE);
  res.json({ success: true });
});

app.post("/api/codes/update", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).send("No file");
  fs.renameSync(req.file.path, XLSX_FILE);
  res.json({ success: true });
});

const PORT = 443;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
