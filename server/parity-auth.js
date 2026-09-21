"use strict";

var http = require("http");
var path = require("path");
var spawn = require("child_process").spawn;
var auth = require("./auth");

var PORT = Number(process.env.DOCTEMATICA_AUTH_PORT || 8788);
var HOST = "127.0.0.1";

function fail(id, detail) {
  return { ok: false, id: id, detail: detail };
}

function addCheck(checks, item) {
  checks.push(item && item.ok ? item : item);
}

function request(method, apiPath, body, cookie) {
  var payload = body == null ? "" : JSON.stringify(body);
  return new Promise(function (resolve, reject) {
    var req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: apiPath,
        method: method,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Cookie: cookie || "",
        },
      },
      function (res) {
        var chunks = [];
        res.on("data", function (c) {
          chunks.push(c);
        });
        res.on("end", function () {
          var text = Buffer.concat(chunks).toString("utf8");
          var data = null;
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = { parseError: true, text: text };
          }
          var setCookie = res.headers["set-cookie"] || [];
          resolve({
            status: res.statusCode,
            data: data,
            cookie: setCookie[0] || "",
            location: res.headers.location || "",
            raw: text,
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function followGet(apiPath, cookie) {
  return new Promise(function (resolve, reject) {
    var req = http.request(
      {
        hostname: HOST,
        port: PORT,
        path: apiPath,
        method: "GET",
        headers: { Cookie: cookie || "" },
      },
      function (res) {
        var chunks = [];
        res.on("data", function (c) {
          chunks.push(c);
        });
        res.on("end", function () {
          resolve({
            status: res.statusCode,
            location: res.headers.location || "",
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function waitHealth(timeoutMs) {
  var started = Date.now();
  return new Promise(function (resolve, reject) {
    function tick() {
      var req = http.get("http://" + HOST + ":" + PORT + "/health", function (res) {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
          return;
        }
        retry();
      });
      req.on("error", retry);
      req.setTimeout(400, function () {
        req.destroy();
        retry();
      });
    }
    function retry() {
      if (Date.now() - started > timeoutMs) {
        reject(new Error("API did not become ready on port " + PORT));
        return;
      }
      setTimeout(tick, 80);
    }
    tick();
  });
}

function noSecrets(obj, id) {
  var raw = JSON.stringify(obj);
  if (/password_hash/i.test(raw) || /"password"\s*:/.test(raw)) {
    return fail(id, "secrets leaked: " + raw.slice(0, 200));
  }
  return { ok: true, id: id };
}

function localValidation() {
  var checks = [];
  var hebUser = auth.validateUsername("יונתן");
  checks.push(
    hebUser && !hebUser.ok
      ? { ok: true, id: "local-username-hebrew" }
      : fail("local-username-hebrew", JSON.stringify(hebUser))
  );
  var hebPass = auth.validatePassword("סיסמה1234");
  checks.push(
    hebPass && !hebPass.ok
      ? { ok: true, id: "local-password-hebrew" }
      : fail("local-password-hebrew", JSON.stringify(hebPass))
  );
  var mismatch = auth.validateSignup({
    username: "okuser",
    email: "ok@example.com",
    password: "password1",
    confirmPassword: "password2",
  });
  checks.push(
    mismatch && mismatch.code === "password_mismatch"
      ? { ok: true, id: "local-mismatch" }
      : fail("local-mismatch", JSON.stringify(mismatch))
  );
  var takenCase = auth.validateUsername("Yonatan");
  checks.push(
    takenCase && takenCase.ok && takenCase.usernameLower === "yonatan"
      ? { ok: true, id: "local-username-lower" }
      : fail("local-username-lower", JSON.stringify(takenCase))
  );
  return checks;
}

async function httpSuite() {
  var checks = [];
  function add(item) {
    checks.push(item.ok ? item : item);
  }
  var stamp = Date.now();
  var user = "User" + stamp;
  var pass = "Secret!99";
  var email = "user" + stamp + "@example.com";

  var signup = await request("POST", "/api/auth/signup", {
    username: user,
    email: email,
    password: pass,
    confirmPassword: pass,
  });
  add(
    signup.status === 201 && signup.data && signup.data.ok && signup.data.user && signup.data.user.username === user
      ? { ok: true, id: "signup-ok" }
      : fail("signup-ok", JSON.stringify({ status: signup.status, data: signup.data }))
  );
  add(noSecrets(signup.data, "signup-no-hash"));
  var cookie = signup.cookie && signup.cookie.split(";")[0];

  var taken = await request("POST", "/api/auth/signup", {
    username: user,
    email: "other" + stamp + "@example.com",
    password: pass,
    confirmPassword: pass,
  });
  add(
    taken.status === 409 && taken.data && taken.data.error === "username_taken"
      ? { ok: true, id: "username-taken" }
      : fail("username-taken", JSON.stringify(taken.data))
  );

  var takenCase = await request("POST", "/api/auth/signup", {
    username: user.toLowerCase(),
    email: "case" + stamp + "@example.com",
    password: pass,
    confirmPassword: pass,
  });
  add(
    takenCase.status === 409 && takenCase.data && takenCase.data.error === "username_taken"
      ? { ok: true, id: "username-taken-case" }
      : fail("username-taken-case", JSON.stringify(takenCase.data))
  );

  var takenEmail = await request("POST", "/api/auth/signup", {
    username: "other" + stamp,
    email: email.toUpperCase(),
    password: pass,
    confirmPassword: pass,
  });
  add(
    takenEmail.status === 409 && takenEmail.data && takenEmail.data.error === "email_taken"
      ? { ok: true, id: "email-taken" }
      : fail("email-taken", JSON.stringify(takenEmail.data))
  );

  var hebU = await request("POST", "/api/auth/signup", {
    username: "שםשל" + stamp,
    email: "he" + stamp + "@example.com",
    password: pass,
    confirmPassword: pass,
  });
  add(
    hebU.status === 400 && hebU.data && hebU.data.error === "username_hebrew"
      ? { ok: true, id: "signup-hebrew-user" }
      : fail("signup-hebrew-user", JSON.stringify(hebU.data))
  );

  var hebP = await request("POST", "/api/auth/signup", {
    username: "ascii" + stamp,
    email: "hep" + stamp + "@example.com",
    password: "סיסמה1234",
    confirmPassword: "סיסמה1234",
  });
  add(
    hebP.status === 400 && hebP.data && hebP.data.error === "password_hebrew"
      ? { ok: true, id: "signup-hebrew-pass" }
      : fail("signup-hebrew-pass", JSON.stringify(hebP.data))
  );

  var mismatch = await request("POST", "/api/auth/signup", {
    username: "mis" + stamp,
    email: "mis" + stamp + "@example.com",
    password: pass,
    confirmPassword: pass + "x",
  });
  add(
    mismatch.status === 400 && mismatch.data && mismatch.data.error === "password_mismatch"
      ? { ok: true, id: "signup-mismatch" }
      : fail("signup-mismatch", JSON.stringify(mismatch.data))
  );

  var badLogin = await request("POST", "/api/auth/login", { username: user, password: "Wrong!99" });
  add(
    badLogin.status === 401 && badLogin.data && badLogin.data.error === "bad_credentials"
      ? { ok: true, id: "login-bad-password" }
      : fail("login-bad-password", JSON.stringify(badLogin.data))
  );
  add(noSecrets(badLogin.data, "login-bad-no-hash"));

  var login = await request("POST", "/api/auth/login", { username: user, password: pass });
  add(
    login.status === 200 && login.data && login.data.ok && login.cookie
      ? { ok: true, id: "login-ok" }
      : fail("login-ok", JSON.stringify({ status: login.status, data: login.data }))
  );
  add(noSecrets(login.data, "login-no-hash"));
  cookie = (login.cookie && login.cookie.split(";")[0]) || cookie;

  var me = await request("GET", "/api/auth/me", null, cookie);
  add(
    me.status === 200 && me.data && me.data.user && me.data.user.username === user
      ? { ok: true, id: "me-after-login" }
      : fail("me-after-login", JSON.stringify(me.data))
  );
  add(noSecrets(me.data, "me-no-hash"));

  var app = await followGet("/", cookie);
  add(
    app.status === 200 && app.body.indexOf("Doctematica") !== -1 && app.body.indexOf("id=\"topics\"") !== -1
      ? { ok: true, id: "app-with-session" }
      : fail("app-with-session", "status=" + app.status)
  );

  var anonApp = await followGet("/", "");
  add(
    anonApp.status === 302 && anonApp.location === "/login"
      ? { ok: true, id: "app-requires-auth" }
      : fail("app-requires-auth", "status=" + anonApp.status + " loc=" + anonApp.location)
  );

  var mathAnon = await request("POST", "/api/equations", {
    intent: "check",
    subtopic: "basic",
    start: "x-4=3",
    history: ["x-4=3"],
    previous: "x-4=3",
    typed: "x=7",
  });
  add(
    mathAnon.status === 401
      ? { ok: true, id: "math-requires-auth" }
      : fail("math-requires-auth", "status=" + mathAnon.status)
  );

  var mathOk = await request(
    "POST",
    "/api/equations",
    {
      intent: "check",
      subtopic: "basic",
      start: "x-4=3",
      history: ["x-4=3"],
      previous: "x-4=3",
      typed: "x=7",
    },
    cookie
  );
  add(
    mathOk.status === 200 && mathOk.data && mathOk.data.ok
      ? { ok: true, id: "math-with-session" }
      : fail("math-with-session", JSON.stringify({ status: mathOk.status, data: mathOk.data }))
  );

  var loggedOut = await request("POST", "/api/auth/logout", {}, cookie);
  add(loggedOut.status === 200 && loggedOut.data && loggedOut.data.ok ? { ok: true, id: "logout-ok" } : fail("logout-ok", JSON.stringify(loggedOut.data)));

  var meAfter = await request("GET", "/api/auth/me", null, cookie);
  add(
    meAfter.status === 401
      ? { ok: true, id: "me-after-logout" }
      : fail("me-after-logout", JSON.stringify({ status: meAfter.status, data: meAfter.data }))
  );

  var appAfter = await followGet("/", cookie);
  add(
    appAfter.status === 302 && appAfter.location === "/login"
      ? { ok: true, id: "app-after-logout" }
      : fail("app-after-logout", "status=" + appAfter.status + " loc=" + appAfter.location)
  );

  return checks;
}

async function main() {
  var checks = localValidation();
  var url = String(process.env.DATABASE_URL || "").trim();
  var pglite = process.env.DOCTEMATICA_PGLITE === "1" || !url;
  var child = spawn(process.execPath, [path.join(__dirname, "api.js")], {
    env: Object.assign({}, process.env, {
      DOCTEMATICA_API_PORT: String(PORT),
      SESSION_SECRET: process.env.SESSION_SECRET || "test-session-secret",
      NODE_ENV: "test",
      DOCTEMATICA_PGLITE: pglite ? "1" : "",
      DATABASE_URL: pglite ? "" : url,
    }),
    stdio: ["ignore", "pipe", "pipe"],
  });
    child.stderr.on("data", function (buf) {
      process.stderr.write(buf);
    });
    var finished = false;
    child.on("exit", function (code) {
      if (!finished && code) {
        console.error("API exited with code " + code);
        process.exitCode = 1;
      }
    });
    try {
      await waitHealth(12000);
      checks = checks.concat(await httpSuite());
    } finally {
      finished = true;
      child.kill();
    }
  var failed = checks.filter(function (c) {
    return !c.ok;
  });
  var passed = checks.length - failed.length;
  console.log("parity-auth: passed " + passed + ", failed " + failed.length);
  failed.forEach(function (f) {
    console.log("FAIL " + f.id + " " + (f.detail || ""));
  });
  if (failed.length) process.exitCode = 1;
}

main().catch(function (err) {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
