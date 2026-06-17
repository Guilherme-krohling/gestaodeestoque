import { Router } from 'express';
import { ReposicoesController } from '../controllers/ReposicoesController';

export const reposicoesRoutes = Router();

reposicoesRoutes.get('/', ReposicoesController.index);
