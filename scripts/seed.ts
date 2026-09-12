import { ensureDemoBot } from "../src/lib/store";

async function main() {
  const bot = await ensureDemoBot();
  console.log(`Seeded ${bot.name} (${bot.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
