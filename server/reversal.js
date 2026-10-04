require("dotenv").config();
const { AssetsService } = require("./dist/services/assets");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const assetsService = new AssetsService();

async function run() {
  const user = await prisma.user.findFirst({ where: { status: "ACTIVE" } });
  if (!user) throw new Error("No active user found");

  const targetAssetIds = [
    "cmo04po4v01mxnc0bf2lozkmq",
    "cmo08710702l8nc0bpsa4vzay",
  ];

  console.log("Starting production reversal for:", targetAssetIds);
  const results = await assetsService.reverseRecapAndAugustDepreciation(
    targetAssetIds,
    user.id,
  );
  console.log("Reversal Results:\n", JSON.stringify(results, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
