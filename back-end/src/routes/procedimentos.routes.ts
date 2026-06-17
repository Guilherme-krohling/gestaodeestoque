import { Router } from 'express';
import { ProcedimentosController } from '../controllers/ProcedimentosController';

export const procedimentosRoutes = Router();

procedimentosRoutes.get('/', ProcedimentosController.index);
procedimentosRoutes.post('/', ProcedimentosController.create);
procedimentosRoutes.delete('/:id', ProcedimentosController.delete);
