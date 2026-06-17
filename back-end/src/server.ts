import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

// Middlewares globais
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

import { materiaisRoutes } from './routes/materiais.routes';
import { estoqueRoutes } from './routes/estoque.routes';
import { historicoRoutes } from './routes/historico.routes';
import { procedimentosRoutes } from './routes/procedimentos.routes';
import { reposicoesRoutes } from './routes/reposicoes.routes';
import { authRoutes } from './routes/auth.routes';

// Rota de teste
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API de Gestão de Estoque online!' });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/materiais', materiaisRoutes);
app.use('/api/estoque', estoqueRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/procedimentos', procedimentosRoutes);
app.use('/api/reposicoes', reposicoesRoutes);

// Inicialização do servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port} e aceitando conexões de qualquer IP (0.0.0.0)`);
});
