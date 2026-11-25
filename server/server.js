
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Servir los archivos de REBOOT
app.use(express.static(path.join(__dirname, "..")));

// Comprobar que el servidor está funcionando
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "REBOOT"
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`REBOOT funcionando en http://localhost:${PORT}`);
});
