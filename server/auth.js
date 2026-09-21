"use strict";

var crypto = require("crypto");
var bcrypt = require("bcrypt");
var db = require("./db");

var USERNAME_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]+$/;
var PASSWORD_RE = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]+$/;
var EMAIL_RE = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;
var HEBREW_RE = /[\u0590-\u05FF]/;
var USERNAME_MIN = 3;
var USERNAME_MAX = 32;
var PASSWORD_MIN = 8;
var PASSWORD_MAX = 128;
var BCRYPT_ROUNDS = 12;
var SESSION_DAYS = 7;
var COOKIE_NAME = "doctematica_sid";
var DUMMY_HASH = bcrypt.hashSync("doctematica-timing-dummy", 10);

function authEnabled() {
  return db.authEnabled();
}

function sessionSecret() {
  var s = String(process.env.SESSION_SECRET || "").trim();
  if (s) return s;
  if (process.env.NODE_ENV === "production") return "";
  return "dev-only-session-secret";
}

function secureCookies(req) {
  if (process.env.NODE_ENV === "production") return true;
  var proto = String((req && req.headers && req.headers["x-forwarded-proto"]) || "");
  return proto.split(",")[0].trim() === "https";
}

function hasHebrew(s) {
  return HEBREW_RE.test(String(s || ""));
}

function validateUsername(raw) {
  var username = String(raw == null ? "" : raw).trim();
  if (!username) return { ok: false, code: "username_required", message: "יש למלא שם משתמש." };
  if (hasHebrew(username)) {
    return { ok: false, code: "username_hebrew", message: "שם משתמש אינו יכול להכיל עברית. השתמשו באותיות באנגלית, ספרות או תווים מיוחדים." };
  }
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return {
      ok: false,
      code: "username_length",
      message: "שם משתמש חייב להיות בין " + USERNAME_MIN + " ל־" + USERNAME_MAX + " תווים.",
    };
  }
  if (!USERNAME_RE.test(username)) {
    return { ok: false, code: "username_chars", message: "שם משתמש יכול להכיל רק אותיות באנגלית, ספרות ותווים מיוחדים." };
  }
  return { ok: true, username: username, usernameLower: username.toLowerCase() };
}

function validateEmail(raw) {
  var email = String(raw == null ? "" : raw).trim().toLowerCase();
  if (!email) return { ok: false, code: "email_required", message: "יש למלא כתובת אימייל." };
  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return { ok: false, code: "email_invalid", message: "כתובת האימייל אינה תקינה." };
  }
  return { ok: true, email: email };
}

function validatePassword(raw, confirm) {
  var password = String(raw == null ? "" : raw);
  if (!password) return { ok: false, code: "password_required", message: "יש למלא סיסמה." };
  if (hasHebrew(password)) {
    return { ok: false, code: "password_hebrew", message: "הסיסמה אינה יכולה להכיל עברית." };
  }
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return {
      ok: false,
      code: "password_length",
      message: "הסיסמה חייבת להיות בין " + PASSWORD_MIN + " ל־" + PASSWORD_MAX + " תווים.",
    };
  }
  if (!PASSWORD_RE.test(password)) {
    return { ok: false, code: "password_chars", message: "הסיסמה יכולה להכיל רק אותיות באנגלית, ספרות ותווים מיוחדים." };
  }
  if (confirm != null) {
    var confirmPassword = String(confirm);
    if (password !== confirmPassword) {
      return { ok: false, code: "password_mismatch", message: "הסיסמה ואישור הסיסמה אינם זהים." };
    }
  }
  return { ok: true, password: password };
}

function validateSignup(body) {
  body = body || {};
  var u = validateUsername(body.username);
  if (!u.ok) return u;
  var e = validateEmail(body.email);
  if (!e.ok) return e;
  var p = validatePassword(body.password, body.confirmPassword);
  if (!p.ok) return p;
  return {
    ok: true,
    username: u.username,
    usernameLower: u.usernameLower,
    email: e.email,
    password: p.password,
  };
}

function tokenHash(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function signToken(token) {
  var secret = sessionSecret();
  var mac = crypto.createHmac("sha256", secret).update(token).digest("base64url");
  return token + "." + mac;
}

function readSignedToken(raw) {
  var value = String(raw || "");
  var i = value.lastIndexOf(".");
  if (i < 1) return null;
  var token = value.slice(0, i);
  var mac = value.slice(i + 1);
  var secret = sessionSecret();
  if (!secret) return null;
  var expected = crypto.createHmac("sha256", secret).update(token).digest("base64url");
  var a = Buffer.from(mac);
  var b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return token;
}

function parseCookies(req) {
  var header = String((req && req.headers && req.headers.cookie) || "");
  var out = {};
  header.split(";").forEach(function (part) {
    var p = part.trim();
    if (!p) return;
    var eq = p.indexOf("=");
    if (eq < 0) return;
    var k = p.slice(0, eq).trim();
    var v = p.slice(eq + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function cookieHeader(signed, req, maxAgeSec) {
  var parts = [
    COOKIE_NAME + "=" + encodeURIComponent(signed),
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=" + String(maxAgeSec),
  ];
  if (secureCookies(req)) parts.push("Secure");
  return parts.join("; ");
}

function clearCookieHeader(req) {
  return cookieHeader("", req, 0);
}

function fail(status, code, message) {
  return { status: status, body: { ok: false, error: code, message: message } };
}

function ok(status, body, cookie) {
  return { status: status, body: body, cookie: cookie };
}

function uniqueFail(err) {
  if (!err || String(err.code) !== "23505") return null;
  var detail = String(err.detail || "");
  var constraint = String(err.constraint || "");
  if (constraint.indexOf("username") !== -1 || /username_lower/i.test(detail + constraint)) {
    return fail(409, "username_taken", "שם המשתמש תפוס.");
  }
  if (constraint.indexOf("email") !== -1 || /email/i.test(detail + constraint)) {
    return fail(409, "email_taken", "כתובת האימייל כבר רשומה.");
  }
  return fail(409, "taken", "הפרטים כבר רשומים.");
}

function createSession(userId, req) {
  var token = crypto.randomBytes(32).toString("base64url");
  var hash = tokenHash(token);
  var days = SESSION_DAYS;
  return db
    .query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '7 days') RETURNING id",
      [userId, hash]
    )
    .then(function () {
      var signed = signToken(token);
      return cookieHeader(signed, req, days * 24 * 60 * 60);
    });
}

function readSession(req) {
  if (!authEnabled()) return Promise.resolve(null);
  if (!sessionSecret() && process.env.NODE_ENV === "production") return Promise.resolve(null);
  var cookies = parseCookies(req);
  var token = readSignedToken(cookies[COOKIE_NAME]);
  if (!token) return Promise.resolve(null);
  return db
    .query(
      "SELECT s.id AS session_id, s.expires_at, u.id, u.username, u.email " +
        "FROM sessions s JOIN users u ON u.id = s.user_id " +
        "WHERE s.token_hash = $1 LIMIT 1",
      [tokenHash(token)]
    )
    .then(function (res) {
      var row = res.rows && res.rows[0];
      if (!row) return null;
      if (new Date(row.expires_at).getTime() <= Date.now()) {
        return db.query("DELETE FROM sessions WHERE id = $1", [row.session_id]).then(function () {
          return null;
        });
      }
      return { sessionId: row.session_id, user: db.publicUser(row) };
    });
}

function signup(body, req) {
  if (!authEnabled()) return Promise.resolve(fail(503, "no_db", "מסד הנתונים אינו מוגדר."));
  if (process.env.NODE_ENV === "production" && !String(process.env.SESSION_SECRET || "").trim()) {
    return Promise.resolve(fail(503, "no_secret", "השרת אינו מוכן להתחברות."));
  }
  var v = validateSignup(body);
  if (!v.ok) return Promise.resolve(fail(400, v.code, v.message));
  return bcrypt
    .hash(v.password, BCRYPT_ROUNDS)
    .then(function (hash) {
      return db.query(
        "INSERT INTO users (username, username_lower, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, username, email",
        [v.username, v.usernameLower, v.email, hash]
      );
    })
    .then(function (res) {
      var user = db.publicUser(res.rows[0]);
      return createSession(user.id, req).then(function (cookie) {
        return ok(201, { ok: true, user: user }, cookie);
      });
    })
    .catch(function (err) {
      var mapped = uniqueFail(err);
      if (mapped) return mapped;
      console.error(err && err.message ? err.message : "signup failed");
      return fail(500, "server", "ההרשמה נכשלה. נסו שוב.");
    });
}

function login(body, req) {
  if (!authEnabled()) return Promise.resolve(fail(503, "no_db", "מסד הנתונים אינו מוגדר."));
  if (process.env.NODE_ENV === "production" && !String(process.env.SESSION_SECRET || "").trim()) {
    return Promise.resolve(fail(503, "no_secret", "השרת אינו מוכן להתחברות."));
  }
  body = body || {};
  if (hasHebrew(body.username)) {
    return Promise.resolve(fail(400, "username_hebrew", "שם משתמש אינו יכול להכיל עברית. השתמשו באותיות באנגלית, ספרות או תווים מיוחדים."));
  }
  if (hasHebrew(body.password)) {
    return Promise.resolve(fail(400, "password_hebrew", "הסיסמה אינה יכולה להכיל עברית."));
  }
  var u = validateUsername(body.username);
  var p = validatePassword(body.password);
  var generic = fail(401, "bad_credentials", "שם המשתמש או הסיסמה שגויים.");
  if (!u.ok || !p.ok) {
    return bcrypt.compare("x", DUMMY_HASH).then(function () {
      return generic;
    });
  }
  return db
    .query("SELECT id, username, email, password_hash FROM users WHERE username_lower = $1 LIMIT 1", [u.usernameLower])
    .then(function (res) {
      var row = res.rows && res.rows[0];
      var hash = row ? row.password_hash : DUMMY_HASH;
      return bcrypt.compare(p.password, hash).then(function (match) {
        if (!row || !match) return generic;
        return createSession(row.id, req).then(function (cookie) {
          return ok(200, { ok: true, user: db.publicUser(row) }, cookie);
        });
      });
    })
    .catch(function (err) {
      console.error(err && err.message ? err.message : "login failed");
      return fail(500, "server", "ההתחברות נכשלה. נסו שוב.");
    });
}

function logout(req) {
  var done = ok(200, { ok: true }, clearCookieHeader(req));
  return readSession(req)
    .then(function (session) {
      if (!session) return done;
      return db.query("DELETE FROM sessions WHERE id = $1", [session.sessionId]).then(function () {
        return done;
      });
    })
    .catch(function () {
      return done;
    });
}

function me(req) {
  if (!authEnabled()) {
    return Promise.resolve(ok(200, { ok: true, authRequired: false, user: null }));
  }
  return readSession(req).then(function (session) {
    if (!session) {
      return fail(401, "auth", "יש להתחבר כדי להמשיך.");
    }
    return ok(200, { ok: true, authRequired: true, user: session.user });
  });
}

module.exports = {
  COOKIE_NAME: COOKIE_NAME,
  USERNAME_RE: USERNAME_RE,
  PASSWORD_RE: PASSWORD_RE,
  authEnabled: authEnabled,
  sessionSecret: sessionSecret,
  validateSignup: validateSignup,
  validateUsername: validateUsername,
  validatePassword: validatePassword,
  validateEmail: validateEmail,
  readSession: readSession,
  signup: signup,
  login: login,
  logout: logout,
  me: me,
  cookieHeader: cookieHeader,
};
