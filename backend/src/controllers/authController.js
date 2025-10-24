import bcrypt from "bcryptjs";
import prisma from "../db/prisma.js";
import { authSchema } from "../validations/authSchema.js";
function computeRoleFor(email) {
  return process.env.SEED_ADMIN_EMAIL && email === process.env.SEED_ADMIN_EMAIL
    ? "admin"
    : "volunteer";
}

// REGISTER
export const register = async (req, res) => {
  // validate input with zod
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { email, password, username } = result.data;

  try {
    // check if user already exists (by email or username)
    const existingUser = await prisma.userCredentials.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user in DB
    const newUser = await prisma.userCredentials.create({
      data: {
        username: username ?? email.split("@")[0],
        email,
        password: hashedPassword,
      },
    });

    const role = computeRoleFor(newUser.email);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
export const login = async (req, res) => {
  const result = authSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.errors });
  }

  const { email, password, identifier } = result.data;
  const loginField = email || identifier;

  try {
    const user = await prisma.userCredentials.findFirst({
      where: {
        OR: [{ email: loginField }, { username: loginField }],
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const role = computeRoleFor(user.email);

    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, username: user.username, role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
