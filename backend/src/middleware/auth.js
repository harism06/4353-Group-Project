import jwt from "jsonwebtoken";

function getToken(req) {
  const c = req.cookies?.token;
  if (c) return c;
  const h = req.header("authorization");
  if (!h) return undefined;
  const [s, t] = h.split(" ");
  return s?.toLowerCase() === "bearer" ? t : undefined;
}

export function requireAuth(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    req.user = claims; // { sub, role }
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.role !== role)
      return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function signToken({ id, role }) {
  return jwt.sign({ sub: id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "1h",
  });
}
