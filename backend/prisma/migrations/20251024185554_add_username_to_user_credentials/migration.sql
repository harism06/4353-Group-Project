/*
  Warnings:

  - Added the required column `username` to the `UserCredentials` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserCredentials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'volunteer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_UserCredentials" ("createdAt", "email", "id", "password", "role") SELECT "createdAt", "email", "id", "password", "role" FROM "UserCredentials";
DROP TABLE "UserCredentials";
ALTER TABLE "new_UserCredentials" RENAME TO "UserCredentials";
CREATE UNIQUE INDEX "UserCredentials_username_key" ON "UserCredentials"("username");
CREATE UNIQUE INDEX "UserCredentials_email_key" ON "UserCredentials"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
