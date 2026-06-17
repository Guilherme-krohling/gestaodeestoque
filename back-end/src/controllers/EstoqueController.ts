import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const EstoqueController = {
  index: async (req: Request, res: Response): Promise<any> => {
    const estoque = await prisma.estoque.findMany({
      include: {
        material: true
      },
      orderBy: { criado_em: 'desc' }
    });
    // O front espera que 'materiais' contenha as infos do material também
    const mapped = estoque.map(e => ({
      ...e,
      materiais: e.material
    }));
    return res.json(mapped);
  },
  
  create: async (req: Request, res: Response): Promise<any> => {
    try {
      const estoque = await prisma.estoque.create({
        data: req.body
      });
      return res.status(201).json(estoque);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  },
  
  update: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params;
      const estoque = await prisma.estoque.update({
        where: { id },
        data: req.body
      });
      return res.json(estoque);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
};
