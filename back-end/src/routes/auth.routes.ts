import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

export const authRoutes = Router();

authRoutes.post('/login', AuthController.login);
authRoutes.get('/me', AuthController.me);
authRoutes.post('/logout', AuthController.logout);
