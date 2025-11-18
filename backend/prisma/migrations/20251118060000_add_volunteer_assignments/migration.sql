-- CreateTable
CREATE TABLE "VolunteerAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hours" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VolunteerAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "EventDetails" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "VolunteerAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "UserCredentials" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "VolunteerAssignment_eventId_idx" ON "VolunteerAssignment"("eventId");
CREATE INDEX "VolunteerAssignment_volunteerId_idx" ON "VolunteerAssignment"("volunteerId");
