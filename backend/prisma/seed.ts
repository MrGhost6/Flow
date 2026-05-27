import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding FLOW database...");

  // Seed spending categories
  const categories = [
    { name: "Food & Dining", icon: "🍽️", color: "#FF6B6B", isSystem: true },
    { name: "Transportation", icon: "🚗", color: "#4ECDC4", isSystem: true },
    { name: "Shopping", icon: "🛍️", color: "#FFE66D", isSystem: true },
    { name: "Entertainment", icon: "🎬", color: "#A8E6CF", isSystem: true },
    { name: "Bills & Utilities", icon: "📄", color: "#FF8A5C", isSystem: true },
    { name: "Healthcare", icon: "🏥", color: "#EA5455", isSystem: true },
    { name: "Education", icon: "📚", color: "#7367F0", isSystem: true },
    { name: "Travel", icon: "✈️", color: "#28C76F", isSystem: true },
    { name: "Groceries", icon: "🛒", color: "#F1952B", isSystem: true },
    { name: "Salary", icon: "💰", color: "#00CFFD", isSystem: true },
    { name: "Investment", icon: "📈", color: "#0D6EFD", isSystem: true },
    { name: "Transfer", icon: "🔄", color: "#6F42C1", isSystem: true },
    { name: "Other", icon: "📦", color: "#6C757D", isSystem: true },
  ];

  for (const cat of categories) {
    await prisma.spendingCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Seed merchant categories (MCC codes)
  const merchantCategories = [
    { code: "5812", name: "Restaurants", description: "Eating places and restaurants" },
    { code: "5813", name: "Bars & Nightclubs", description: "Drinking places" },
    { code: "5411", name: "Grocery Stores", description: "Grocery stores and supermarkets" },
    { code: "4900", name: "Utilities", description: "Electric, gas, water utilities" },
    { code: "4121", name: "Taxis & Rideshares", description: "Taxicabs and rideshare services" },
    { code: "5311", name: "Department Stores", description: "Department stores" },
    { code: "5651", name: "Clothing Stores", description: "Family clothing stores" },
    { code: "7832", name: "Movie Theaters", description: "Motion picture theaters" },
    { code: "7997", name: "Gyms & Fitness", description: "Health clubs and fitness centers" },
    { code: "4722", name: "Travel Agencies", description: "Travel agencies and tour operators" },
    { code: "8099", name: "Healthcare", description: "Health practitioners and medical services" },
    { code: "8211", name: "Education", description: "Schools and educational services" },
  ];

  for (const mc of merchantCategories) {
    await prisma.merchantCategory.upsert({
      where: { code: mc.code },
      update: {},
      create: mc,
    });
  }

  // Seed admin user (password: "admin123")
  const bcrypt = await import("bcryptjs");
  const adminHash = await bcrypt.hash("Admin@2026Secure!", 12);

  await prisma.adminUser.upsert({
    where: { email: "admin@flow.finance" },
    update: {},
    create: {
      email: "admin@flow.finance",
      passwordHash: adminHash,
      name: "System Administrator",
      role: "SUPER_ADMIN",
      isSuperAdmin: true,
      permissions: {
        create: [
          { module: "users", canRead: true, canWrite: true, canDelete: true },
          { module: "transactions", canRead: true, canWrite: true, canDelete: false },
          { module: "cards", canRead: true, canWrite: true, canDelete: true },
          { module: "kyc", canRead: true, canWrite: true, canDelete: false },
          { module: "support", canRead: true, canWrite: true, canDelete: false },
          { module: "analytics", canRead: true, canWrite: false, canDelete: false },
        ],
      },
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
