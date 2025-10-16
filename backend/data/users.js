// Shared user data store
// This will be used by both auth and user profile modules
let users = [
  {
    id: 1,
    email: "alice@test.com",
    password: "password123",
    fullName: "Alice Johnson",
    address1: "123 Main St",
    address2: "",
    city: "Houston",
    state: "TX",
    zipCode: "77001",
    skills: ["Cooking", "Event Planning"],
    preferences: "Prefer morning events",
    availability: ["2025-10-20", "2025-10-21"],
  },
  {
    id: 2,
    email: "bob@test.com",
    password: "password123",
    fullName: "Bob Smith",
    address1: "456 Oak Ave",
    address2: "Apt 2B",
    city: "Dallas",
    state: "TX",
    zipCode: "75201",
    skills: ["Driving", "Customer Service"],
    preferences: "",
    availability: ["2025-10-22", "2025-10-23"],
  },
  {
    id: 3,
    email: "charlie@test.com",
    password: "password123",
    fullName: "Charlie Brown",
    address1: "789 Elm Rd",
    address2: "",
    city: "Houston",
    state: "TX",
    zipCode: "77002",
    skills: ["Organization", "Administrative"],
    preferences: "Available weekends only",
    availability: ["2025-10-25", "2025-10-26"],
  },
];

module.exports = users;
