import { Router } from 'express';
import { MateriaisController } from '../controllers/MateriaisController';

export const materiaisRoutes = Router();

materiaisRoutes.get('/', MateriaisController.index);
materiaisRoutes.post('/', MateriaisController.create);
materiaisRoutes.delete('/:id', MateriaisController.delete);
