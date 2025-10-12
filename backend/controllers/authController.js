// controllers/authController.js
const { authSchema } = require("../validations/authSchema");

let users = []; // mock in-memory user list

exports.register = (req, res) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { email, password } = result.data;
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = { id: users.length + 1, email, password };
  users.push(newUser);
  res
    .status(201)
    .json({ message: "User registered successfully", user: newUser });
};

exports.login = (req, res) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { email, password } = result.data;
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res
    .status(200)
    .json({ message: "Login successful", token: "mock-token", user });
};
