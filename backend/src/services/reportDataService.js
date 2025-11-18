import prisma from "../db/prisma.js";

const toIso = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const normalizeSkills = (skills) => {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  if (typeof skills === "string") {
    try {
      const parsed = JSON.parse(skills);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const resolveVolunteerName = (volunteer) => {
  if (!volunteer) return "Unknown volunteer";
  const profileName = volunteer.profile?.fullName;
  if (profileName) return profileName;
  if (volunteer.username) return volunteer.username;
  return volunteer.email ?? "Unknown volunteer";
};

const normalizeSkillsFilter = (skills) =>
  (Array.isArray(skills) ? skills : typeof skills === "string" ? skills.split(",") : [])
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const filterAssignmentsByDate = (assignments, { startDate, endDate }) => {
  if (!startDate && !endDate) return assignments;
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;
  return assignments.filter((assignment) => {
    const eventDate = assignment.event?.eventDate ?? assignment.assignedAt;
    const dateValue = eventDate instanceof Date ? eventDate : new Date(eventDate);
    if (start && dateValue < start) return false;
    if (end && dateValue > end) return false;
    return true;
  });
};

export async function buildEventsReportData(filters = {}) {
  const { startDate, endDate, eventId } = filters;
  const where = {};
  if (eventId) where.id = eventId;
  if (startDate || endDate) {
    where.eventDate = {};
    if (startDate) where.eventDate.gte = new Date(startDate);
    if (endDate) where.eventDate.lte = new Date(endDate);
  }

  const events = await prisma.eventDetails.findMany({
    where,
    orderBy: { eventDate: "asc" },
  });

  const eventIds = events.map((evt) => evt.id);
  const assignments = eventIds.length
    ? await prisma.volunteerAssignment.findMany({
        where: { eventId: { in: eventIds } },
        include: {
          volunteer: {
            include: { profile: true },
          },
        },
      })
    : [];

  const grouped = new Map();
  assignments.forEach((assignment) => {
    const list = grouped.get(assignment.eventId) ?? [];
    list.push(assignment);
    grouped.set(assignment.eventId, list);
  });

  const eventsRows = events.map((event) => {
    const eventAssignments = grouped.get(event.id) ?? [];
    const completed = eventAssignments.filter((a) => a.status === "completed");
    const completedHours = completed.reduce((sum, a) => sum + (Number(a.hours) || 0), 0);
    const pendingCount = eventAssignments.length - completed.length;
    const volunteerDetails = eventAssignments.map((assignment) => ({
      assignmentId: assignment.id,
      volunteerId: assignment.volunteerId,
      volunteerName: resolveVolunteerName(assignment.volunteer),
      email: assignment.volunteer?.email ?? null,
      status: assignment.status,
      hours: Number(assignment.hours) || 0,
    }));

    return {
      id: event.id,
      name: event.name,
      location: event.location,
      eventDate: toIso(event.eventDate),
      urgency: event.urgency,
      totalAssignments: eventAssignments.length,
      completedAssignments: completed.length,
      pendingAssignments: pendingCount,
      totalHours: completedHours,
      volunteerDetails,
    };
  });

  const completeCount = assignments.filter((a) => a.status === "completed").length;
  const summary = {
    totalEvents: eventsRows.length,
    totalVolunteers: new Set(assignments.map((a) => a.volunteerId)).size,
    totalHours: eventsRows.reduce((sum, evt) => sum + evt.totalHours, 0),
    completedAssignments: completeCount,
    pendingAssignments: assignments.length - completeCount,
  };

  return {
    filters: { startDate: startDate || null, endDate: endDate || null, eventId: eventId || null },
    summary,
    events: eventsRows,
    generatedAt: new Date().toISOString(),
  };
}

export async function buildVolunteersReportData(filters = {}) {
  const { startDate, endDate } = filters;
  const skillsFilter = normalizeSkillsFilter(filters.skills);

  const assignments = await prisma.volunteerAssignment.findMany({
    include: {
      event: true,
      volunteer: {
        include: { profile: true },
      },
    },
    orderBy: { assignedAt: "asc" },
  });

  const windowed = filterAssignmentsByDate(assignments, { startDate, endDate });

  const filtered = skillsFilter.length
    ? windowed.filter((assignment) => {
        const volunteerSkills = normalizeSkills(assignment.volunteer?.profile?.skills).map((s) =>
          s.toLowerCase()
        );
        if (!volunteerSkills.length) return false;
        return volunteerSkills.some((skill) => skillsFilter.includes(skill));
      })
    : windowed;

  const map = new Map();
  filtered.forEach((assignment) => {
    const key = assignment.volunteerId;
    if (!map.has(key)) {
      map.set(key, {
        volunteerId: assignment.volunteerId,
        volunteerName: resolveVolunteerName(assignment.volunteer),
        email: assignment.volunteer?.email ?? null,
        skills: normalizeSkills(assignment.volunteer?.profile?.skills),
        totalHours: 0,
        completedAssignments: 0,
        pendingAssignments: 0,
        events: [],
        lastEventDate: null,
        eventIds: new Set(),
      });
    }

    const target = map.get(key);
    const hours = Number(assignment.hours) || 0;
    if (assignment.status === "completed") {
      target.completedAssignments += 1;
      target.totalHours += hours;
    } else {
      target.pendingAssignments += 1;
    }
    if (assignment.eventId) target.eventIds.add(assignment.eventId);

    const eventDate =
      assignment.event?.eventDate ??
      assignment.completedAt ??
      assignment.assignedAt ??
      null;
    if (!target.lastEventDate || (eventDate && eventDate > target.lastEventDate)) {
      target.lastEventDate = eventDate instanceof Date ? eventDate : eventDate ? new Date(eventDate) : null;
    }

    target.events.push({
      eventId: assignment.eventId,
      eventName: assignment.event?.name ?? "Unscheduled",
      eventDate: toIso(assignment.event?.eventDate),
      status: assignment.status,
      hours,
    });
  });

  const volunteers = Array.from(map.values())
    .map((row) => ({
      volunteerId: row.volunteerId,
      volunteerName: row.volunteerName,
      email: row.email,
      skills: row.skills,
      totalHours: Number(row.totalHours.toFixed(2)),
      totalEvents: row.eventIds.size,
      completedAssignments: row.completedAssignments,
      pendingAssignments: row.pendingAssignments,
      lastEventDate: row.lastEventDate ? row.lastEventDate.toISOString() : null,
      events: row.events,
    }))
    .sort((a, b) =>
      a.volunteerName.localeCompare(b.volunteerName, undefined, { sensitivity: "base" })
    );

  const summary = {
    totalVolunteers: volunteers.length,
    totalHours: volunteers.reduce((sum, v) => sum + v.totalHours, 0),
    totalEvents: new Set(volunteers.flatMap((v) => v.events.map((evt) => evt.eventId))).size,
    completedAssignments: volunteers.reduce((sum, v) => sum + v.completedAssignments, 0),
    pendingAssignments: volunteers.reduce((sum, v) => sum + v.pendingAssignments, 0),
  };

  return {
    filters: {
      startDate: startDate || null,
      endDate: endDate || null,
      skills: skillsFilter,
    },
    summary,
    volunteers,
    generatedAt: new Date().toISOString(),
  };
}
