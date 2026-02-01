import { PrismaPg } from 'node_modules/@prisma/adapter-pg';
import { Category, PrismaClient } from 'src/generated/prisma/client';
import * as suggestions from 'src/suggestion/seed';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const allSuggestions: { category: Category; value: string }[] = [
    ...suggestions.actions_past.map((s) => ({
      category: Category.PAST_ACTION,
      value: s,
    })),
    ...suggestions.actions_present.map((s) => ({
      category: Category.PRESENT_ACTION,
      value: s,
    })),
    ...suggestions.statements.map((s) => ({
      category: Category.STATEMENT,
      value: s,
    })),
    ...suggestions.male_names.map((s) => ({
      category: Category.MALE_NAME,
      value: s,
    })),
    ...suggestions.female_names.map((s) => ({
      category: Category.FEMALE_NAME,
      value: s,
    })),
  ];

  await prisma.suggestion.createMany({
    data: allSuggestions,
  });
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
