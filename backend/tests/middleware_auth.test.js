import jwt from "jsonwebtoken";
import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";
import { signToken, requireAuth, requireRole } from "../src/middleware/auth.js";

// minimal express app to exercise the middleware
const app = express();
app.use(cookieParser());
app.get("/protected", requireAuth, (req, res) =>
  res.json({ ok: true, user: req.user })
);
app.get("/admin", requireAuth, requireRole("admin"), (req, res) =>
  res.json({ ok: true })
);

describe("middleware/auth.js", () => {
  test("signToken returns a JWT with expected payload fields", () => {
    const token = signToken({ id: 1, role: "volunteer" });
    // decode (no signature verification, avoids secret mismatch)
    const decoded = jwt.decode(token);
    expect(typeof token).toBe("string");
    expect(decoded).toBeTruthy();
    expect(decoded.sub).toBe(1); // id is stored as 'sub'
    expect(decoded.role).toBe("volunteer");
    expect(decoded.exp).toBeGreaterThan(decoded.iat);
  });

  test("requireAuth allows valid token (from cookie) and exposes decoded on req.user", async () => {
    const token = signToken({ id: 2, role: "volunteer" });
    const res = await request(app)
      .get("/protected")
      .set("Cookie", [`token=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
    expect(res.body.user.sub).toBe(2); // check 'sub', not 'id'
    expect(res.body.user.role).toBe("volunteer");
  });

  test("requireAuth rejects missing token", async () => {
    const res = await request(app).get("/protected");
    expect(res.statusCode).toBe(401);
  });

  test("requireRole rejects non-admin users", async () => {
    const token = signToken({ id: 3, role: "volunteer" });
    const res = await request(app)
      .get("/admin")
      .set("Cookie", [`token=${token}`]);
    expect(res.statusCode).toBe(403);
  });

  test("requireRole allows admin users", async () => {
    const token = signToken({ id: 4, role: "admin" });
    const res = await request(app)
      .get("/admin")
      .set("Cookie", [`token=${token}`]);
    expect(res.statusCode).toBe(200);
  });
});
