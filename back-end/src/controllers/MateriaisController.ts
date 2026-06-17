import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const MateriaisController = {
  index: async (req: Request, res: Response): Promise<any> => {
    const materiais = await prisma.material.findMany({
      orderBy: { nome: 'asc' }
    });
    return res.json(materiais);
  },
  
  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const data = { ...req.body };
      if (data.estoque_minimo) {
        data.estoque_minimo = parseInt(data.estoque_minimo, 10);
      }
      const material = await prisma.material.create({ data });
      return res.status(201).json(material);
    } catch (e: any) {
      console.error("Erro ao salvar material:", e);
      return res.status(400).json({ error: e.message });
    }
  },
  
  delete: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      await prisma.material.delete({
        where: { id }
      });
      return res.status(204).send();
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
};
