// Quick sanity check for Prisma weddingRepository (no DB connection needed)
// Run: node scripts/check-wedding-repo.js
import assert from "node:assert/strict";
import weddingRepository from "../src/repositories/wedding.repository.js";

const expectedMethods = [
  "create",
  "findAll",
  "findById",
  "findByIdOrThrow",
  "findBySlug",
  "updateById",
  "deleteById",
  "count",
  "getDashboardSummary",
];

for (const method of expectedMethods) {
  assert.equal(typeof weddingRepository[method], "function", `Missing ${method}`);
}

await assert.rejects(
  () => weddingRepository.findById("not-a-uuid"),
  (err) => err.statusCode === 400
);

console.log("Prisma weddingRepository check passed!");
