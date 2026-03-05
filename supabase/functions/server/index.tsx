import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize admin on first request
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await auth.initializeAdmin();
    initialized = true;
  }
}

// Health check endpoint
app.get("/make-server-787f7306/health", (c) => {
  return c.json({ status: "ok" });
});

// Auth endpoints
app.post("/make-server-787f7306/auth/login", async (c) => {
  try {
    await ensureInitialized();
    const { password } = await c.req.json();
    const isValid = await auth.verifyCredentials(password);
    
    await auth.logLoginAttempt(isValid, c.req.header("x-forwarded-for"));
    
    if (isValid) {
      await auth.logAudit("LOGIN", "Auth", "Successful login");
      return c.json({ success: true });
    } else {
      return c.json({ success: false, error: "Invalid credentials" }, 401);
    }
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get("/make-server-787f7306/auth/profile", async (c) => {
  try {
    await ensureInitialized();
    const profile = await auth.getAdminProfile();
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    // Don't send password hash
    const { password, ...safeProfile } = profile;
    return c.json({ profile: safeProfile });
  } catch (error) {
    console.error("Get profile error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.put("/make-server-787f7306/auth/profile", async (c) => {
  try {
    const updates = await c.req.json();
    await auth.updateAdminProfile(updates);
    await auth.logAudit("UPDATE_PROFILE", "Auth", `Updated profile fields: ${Object.keys(updates).join(", ")}`);
    return c.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-787f7306/auth/audit-logs", async (c) => {
  try {
    const logs = await auth.getAuditLogs();
    return c.json({ logs });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-787f7306/auth/login-attempts", async (c) => {
  try {
    const attempts = await auth.getLoginAttempts();
    return c.json({ attempts });
  } catch (error) {
    console.error("Get login attempts error:", error);
    return c.json({ error: error.message }, 500);
  }
});

// Generic data endpoints
app.get("/make-server-787f7306/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const data = await kv.get(`allegra_${key}`);
    return c.json({ data: data || [] });
  } catch (error) {
    console.error(`Get data error for ${c.req.param("key")}:`, error);
    return c.json({ error: error.message }, 500);
  }
});

app.post("/make-server-787f7306/data/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const { data } = await c.req.json();
    await kv.set(`allegra_${key}`, data);
    await auth.logAudit("UPDATE_DATA", key, `Updated ${key} data`);
    return c.json({ success: true });
  } catch (error) {
    console.error(`Set data error for ${c.req.param("key")}:`, error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);