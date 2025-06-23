// fileManager.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

class FileManager {
  constructor(uploadDir = "./upload/files/images") {
    this.UPLOAD_DIR = uploadDir;
    this.initializeUploadDirectory();
    this.setupMulter();
  }

  // Inizializza la directory di upload
  initializeUploadDirectory() {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      console.log(`📁 Directory creata: ${this.UPLOAD_DIR}`);
    }
  }

  // Configurazione multer
  setupMulter() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.UPLOAD_DIR);
      },
      filename: (req, file, cb) => {
        // TODO esempio da modificare in call in base all'id prodotto
        const uniqueName = `img_${Date.now()}_${Math.floor(Math.random() * 1000)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

    this.upload = multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
          cb(null, true);
        } else {
          cb(new Error("Solo immagini permesse!"), false);
        }
      },
    });
  }

  // Gestisce l'upload di un'immagine
  handleUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Nessuna immagine ricevuta",
        });
      }

      console.log("✅ IMMAGINE SALVATA:", req.file.filename);

      return {
        success: true,
        message: "Immagine caricata con successo",
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/upload/files/images/${req.file.filename}`,
      };
    } catch (error) {
      console.error("❌ ERRORE UPLOAD:", error);
      res.status(500).json({
        success: false,
        message: "Errore nel salvataggio",
      });
    }
  }

  // Serve un'immagine specifica - TODO: fare query al db per poter recuperare id e nome immagine
  serveImage(req, res) {
    const filename = req.params.filename;
    const filepath = path.join(this.UPLOAD_DIR, filename);

    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ error: "Immagine non trovata" });
    }
  }

  // Lista tutte le immagini
  listImages(req, res) {
    try {
      const files = fs
        .readdirSync(this.UPLOAD_DIR)
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map((file) => ({
          filename: file,
          url: `/upload/files/images/${file}`,
          stats: fs.statSync(path.join(this.UPLOAD_DIR, file)),
        }));

      res.json(files);
    } catch (error) {
      console.error("❌ ERRORE LISTA IMMAGINI:", error);
      res.status(500).json({ error: "Errore nel leggere le immagini" });
    }
  }

  // Elimina un'immagine
  deleteImage(req, res) {
    try {
      const filename = req.params.filename;
      const filepath = path.join(this.UPLOAD_DIR, filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log("🗑️ IMMAGINE ELIMINATA:", filename);
        res.json({
          success: true,
          message: "Immagine eliminata con successo",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Immagine non trovata",
        });
      }
    } catch (error) {
      console.error("❌ ERRORE ELIMINAZIONE:", error);
      res.status(500).json({
        success: false,
        message: "Errore nell'eliminazione",
      });
    }
  }

  // Ottieni statistiche directory
  getDirectoryStats(req, res) {
    try {
      const files = fs.readdirSync(this.UPLOAD_DIR);
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
      );

      let totalSize = 0;
      imageFiles.forEach((file) => {
        const stats = fs.statSync(path.join(this.UPLOAD_DIR, file));
        totalSize += stats.size;
      });

      res.json({
        totalImages: imageFiles.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        directory: this.UPLOAD_DIR,
      });
    } catch (error) {
      console.error("❌ ERRORE STATISTICHE:", error);
      res.status(500).json({ error: "Errore nel recuperare le statistiche" });
    }
  }

  // Utility per formattare byte
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Getter per middleware multer
  getUploadMiddleware() {
    return this.upload.single("file");
  }
}

module.exports = FileManager;
