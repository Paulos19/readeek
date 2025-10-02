import { PrismaClient, InsigniaType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  const insignia1 = await prisma.insignia.create({
    data: {
      name: 'Leitor Voraz',
      description: 'Concedida aos leitores mais dedicados da comunidade.',
      imageUrl: '/insignias/i1.svg', // Certifique-se que tem este ficheiro em public/insignias/
      type: InsigniaType.PREMIUM,
      price: 150,
    },
  });

  const insignia2 = await prisma.insignia.create({
    data: {
      name: 'Pioneiro Literário',
      description: 'Para os primeiros membros a juntarem-se à Readeek.',
      imageUrl: '/insignias/i2.svg', // Certifique-se que tem este ficheiro em public/insignias/
      type: InsigniaType.PREMIUM,
      price: 200,
    },
  });
  
  console.log({ insignia1, insignia2 });
  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });