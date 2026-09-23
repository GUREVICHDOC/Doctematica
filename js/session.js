"use strict";

(function () {
  var who = document.getElementById("whoami");
  var btn = document.getElementById("logout-btn");
  fetch("/api/auth/me", { credentials: "same-origin" })
    .then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, data: data || {} };
      });
    })
    .then(function (out) {
      if (out.data.authRequired && !out.data.user) {
        window.location.replace("/login");
        return;
      }
      if (out.data.user && who) {
        who.textContent = out.data.user.username;
        var avatar = document.getElementById("who-avatar");
        if (avatar) avatar.textContent = String(out.data.user.username || "").slice(0, 1);
        if (btn) btn.classList.remove("hidden");
      }
    })
    .catch(function () {});

  if (btn) {
    btn.addEventListener("click", function () {
      fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" })
        .then(function () {
          window.location.replace("/login");
        })
        .catch(function () {
          window.location.replace("/login");
        });
    });
  }
})();
