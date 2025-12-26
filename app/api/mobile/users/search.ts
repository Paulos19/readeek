// Backend: pages/api/mobile/users/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma'; // Ajuste o caminho para seu prisma client

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { query } = req.query;
  
  if (!query || typeof query !== 'string' || query.length < 2) {
    return res.status(200).json([]); // Retorna vazio se for muito curto
  }

  try {
    // Opcional: Pegar ID do usuário logado para priorizar quem ele segue
    // const userId = await getUserIdFromToken(req);

    const users = await prisma.user.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }, // Busca insensível a maiúsculas
        // Se quiser restringir apenas a seguidores/seguindo, adicione a lógica aqui
      },
      take: 5, // Limita a 5 resultados
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
}