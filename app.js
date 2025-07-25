const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = require("./swagger.json");

const userRoutes = require("./src/routes/userRoutes");

const app = express();

// CORS configuration - more permissive for debugging
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());

// Swagger UI setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rotas
app.use("/", userRoutes);

// Inicialização
const PORT = process.env.PORT || 3000;

// Middleware global de tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
