import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const ReposicoesController = {
  index: async (req: Request, res: Response): Promise<any> => {
    const reposicoes = await prisma.reposicao.findMany({
      orderBy: { criado_em: 'desc' }
    });
    return res.json(reposicoes);
  }
};
