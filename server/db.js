"use strict";

var fs = require("fs");
var path = require("path");

var pool = null;
var pglite = null;
var migrated = false;

function databaseUrl() {
  return String(process.env.DATABASE_URL || "").trim();
}

function usePglite() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.DOCTEMATICA_PGLITE === "1" || databaseUrl() === "pglite";
}

function authEnabled() {
  return !!databaseUrl() || usePglite();
}

function sslOption() {
  var url = databaseUrl();
  if (/localhost|127\.0\.0\.1/.test(url)) return false;
  if (process.env.DATABASE_SSL === "0") return false;
  return { rejectUnauthorized: false };
}

function getPool() {
  if (usePglite() || !databaseUrl()) return null;
  if (!pool) {
    var pg = require("pg");
    pool = new pg.Pool({
      connectionString: databaseUrl(),
      ssl: sslOption(),
      max: 8,
    });
    pool.on("error", function (err) {
      console.error(err && err.message ? err.message : err);
    });
  }
  return pool;
}

function query(text, params) {
  if (pglite) {
    return pglite.query(text, params || []);
  }
  var p = getPool();
  if (!p) return Promise.reject(new Error("database not configured"));
  return p.query(text, params);
}

function schemaSql() {
  return fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
}

function migrate() {
  if (!authEnabled()) return Promise.resolve(false);
  if (migrated) return Promise.resolve(true);
  if (usePglite()) {
    var PGlite = require("@electric-sql/pglite").PGlite;
    return PGlite.create().then(function (client) {
      pglite = client;
      return pglite.exec(schemaSql());
    }).then(function () {
      migrated = true;
      return true;
    });
  }
  return query(schemaSql(), []).then(function () {
    migrated = true;
    return true;
  });
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    email: row.email,
  };
}

module.exports = {
  authEnabled: authEnabled,
  getPool: getPool,
  query: query,
  migrate: migrate,
  publicUser: publicUser,
};
