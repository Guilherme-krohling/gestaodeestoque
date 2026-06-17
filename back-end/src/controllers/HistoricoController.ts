import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const HistoricoController = {
  index: async (req: Request, res: Response): Promise<any> => {
    const historico = await prisma.historico.findMany({
      orderBy: { criado_em: 'desc' }
    });
    return res.json(historico);
  },
  
  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const historico = await prisma.historico.create({
        data: req.body
      });
      return res.status(201).json(historico);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
  
  update: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const historico = await prisma.historico.update({
        where: { id },
        data: req.body
      });
      return res.json(historico);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
  
  delete: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      await prisma.historico.delete({
        where: { id }
      });
      return res.status(204).send();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
};
