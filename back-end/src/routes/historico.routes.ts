import { Router } from 'express';
import { HistoricoController } from '../controllers/HistoricoController';

export const historicoRoutes = Router();

historicoRoutes.get('/', HistoricoController.index);
historicoRoutes.post('/', HistoricoController.create);
historicoRoutes.put('/:id', HistoricoController.update);
historicoRoutes.delete('/:id', HistoricoController.delete);
