import { Router } from 'express';
import { EstoqueController } from '../controllers/EstoqueController';

export const estoqueRoutes = Router();

estoqueRoutes.get('/', EstoqueController.index);
estoqueRoutes.post('/', EstoqueController.create);
estoqueRoutes.put('/:id', EstoqueController.update);
