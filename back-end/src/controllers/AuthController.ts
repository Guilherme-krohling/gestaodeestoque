import { Request, Response } from 'express';

export const AuthController = {
  login: async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;
    
    // Usuário mockado para o front não ficar travado
    if (email?.trim().toLowerCase() === 'admin@dogliotti.com' && password === '123456') {
      const mockToken = "mock_jwt_token_12345";
      return res.json({ token: mockToken, user: { email, role: 'admin' } });
    }
    
    return res.status(401).json({ error: 'Credenciais inválidas' });
  },
  
  me: async (req: Request, res: Response): Promise<any> => {
    // Retorna mock user se Authorization header existe
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Não autorizado' });
    }
    
    return res.json({ email: 'admin@dogliotti.com', role: 'admin' });
  },
  
  logout: async (req: Request, res: Response): Promise<any> => {
    return res.json({ success: true });
  }
};
