// The accounts every preview and local database is seeded with. All use the
// reserved example.test domain, sign in by email code through the capture
// mailbox, and keep fixed ids so links and journeys can name them. Seam 2
// journeys will read these constants (57b adds tests/e2e/support/accounts.ts).
//
// The super admin role arrives with #59's seeder; until then this is a plain
// account.

export const SEED_ACCOUNTS = {
  superAdmin: {
    id: "01938a00-0000-7000-8000-000000000001",
    name: "Seed Super Admin",
    email: "super-admin@example.test",
  },
  members: [
    {
      id: "01938a00-0000-7000-8000-000000000101",
      name: "Asha Rao",
      email: "member1@example.test",
    },
    {
      id: "01938a00-0000-7000-8000-000000000102",
      name: "Ravi Kumar",
      email: "member2@example.test",
    },
    {
      id: "01938a00-0000-7000-8000-000000000103",
      name: "Meera Iyer",
      email: "member3@example.test",
    },
  ],
} as const;
