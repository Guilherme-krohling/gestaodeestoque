import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const ProcedimentosController = {
  index: async (req: Request, res: Response): Promise<any> => {
    const procedimentos = await prisma.procedimento.findMany({
      orderBy: { nome: 'asc' }
    });
    return res.json(procedimentos);
  },
  
  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const procedimento = await prisma.procedimento.create({
        data: req.body
      });
      return res.status(201).json(procedimento);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
  
  delete: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      await prisma.procedimento.delete({
        where: { id }
      });
      return res.status(204).send();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
};
