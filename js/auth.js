"use strict";

(function () {
  var loginForm = document.getElementById("login-form");
  var signupForm = document.getElementById("signup-form");
  var tabLogin = document.getElementById("tab-login");
  var tabSignup = document.getElementById("tab-signup");
  var title = document.getElementById("card-title");
  var lead = document.getElementById("card-lead");
  var msg = document.getElementById("msg");
  var HEBREW = /[\u0590-\u05FF]/;
  var USER = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};:'",.<>/?\\|`~]+$/;
  var MAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

  function show(mode) {
    var signup = mode === "signup";
    loginForm.classList.toggle("hidden", signup);
    signupForm.classList.toggle("hidden", !signup);
    tabLogin.classList.toggle("on", !signup);
    tabSignup.classList.toggle("on", signup);
    tabLogin.setAttribute("aria-selected", signup ? "false" : "true");
    tabSignup.setAttribute("aria-selected", signup ? "true" : "false");
    title.textContent = signup ? "צרו חשבון" : "ברוכים הבאים!";
    lead.textContent = signup
      ? "שם משתמש וסיסמה באנגלית, ספרות או תווים מיוחדים בלבד."
      : "המשיכו את מסע המתמטיקה שלכם.";
    hideMsg();
  }

  function hideMsg() {
    msg.hidden = true;
    msg.textContent = "";
    msg.classList.remove("ok");
  }

  function flash(text, ok) {
    msg.hidden = !text;
    msg.textContent = text || "";
    msg.classList.toggle("ok", !!ok);
  }

  function clientSignupError(body) {
    var u = String(body.username || "").trim();
    var e = String(body.email || "").trim();
    var p = String(body.password || "");
    var c = String(body.confirmPassword || "");
    if (!u) return "יש למלא שם משתמש.";
    if (HEBREW.test(u)) return "שם משתמש אינו יכול להכיל עברית. השתמשו באותיות באנגלית, ספרות או תווים מיוחדים.";
    if (u.length < 3 || u.length > 32) return "שם משתמש חייב להיות בין 3 ל־32 תווים.";
    if (!USER.test(u)) return "שם משתמש יכול להכיל רק אותיות באנגלית, ספרות ותווים מיוחדים.";
    if (!e) return "יש למלא כתובת אימייל.";
    if (!MAIL.test(e.toLowerCase())) return "כתובת האימייל אינה תקינה.";
    if (!p) return "יש למלא סיסמה.";
    if (HEBREW.test(p)) return "הסיסמה אינה יכולה להכיל עברית.";
    if (p.length < 8 || p.length > 128) return "הסיסמה חייבת להיות בין 8 ל־128 תווים.";
    if (!USER.test(p)) return "הסיסמה יכולה להכיל רק אותיות באנגלית, ספרות ותווים מיוחדים.";
    if (p !== c) return "הסיסמה ואישור הסיסמה אינם זהים.";
    return "";
  }

  function clientLoginError(body) {
    var u = String(body.username || "").trim();
    var p = String(body.password || "");
    if (!u || !p) return "יש למלא שם משתמש וסיסמה.";
    if (HEBREW.test(u)) return "שם משתמש אינו יכול להכיל עברית. השתמשו באותיות באנגלית, ספרות או תווים מיוחדים.";
    if (HEBREW.test(p)) return "הסיסמה אינה יכולה להכיל עברית.";
    return "";
  }

  function send(url, body, btn) {
    btn.disabled = true;
    return fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var data = {};
          try {
            data = text ? JSON.parse(text) : {};
          } catch (err) {
            data = {};
          }
          return { okHttp: res.ok, data: data };
        });
      })
      .then(function (out) {
        btn.disabled = false;
        if (out.data && out.data.password != null) delete out.data.password;
        if (out.data && out.data.password_hash != null) delete out.data.password_hash;
        if (out.okHttp && out.data && out.data.ok) {
          window.location.replace("/");
          return;
        }
        flash((out.data && out.data.message) || "לא ניתן להשלים את הפעולה.");
      })
      .catch(function () {
        btn.disabled = false;
        flash("השרת לא זמין כרגע. נסו שוב.");
      });
  }

  tabLogin.addEventListener("click", function () {
    show("login");
  });
  tabSignup.addEventListener("click", function () {
    show("signup");
  });

  loginForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var body = {
      username: loginForm.username.value,
      password: loginForm.password.value,
    };
    var err = clientLoginError(body);
    if (err) {
      flash(err);
      return;
    }
    send("/api/auth/login", body, loginForm.querySelector("button"));
  });

  signupForm.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var body = {
      username: signupForm.username.value,
      email: signupForm.email.value,
      password: signupForm.password.value,
      confirmPassword: signupForm.confirmPassword.value,
    };
    var err = clientSignupError(body);
    if (err) {
      flash(err);
      return;
    }
    send("/api/auth/signup", body, signupForm.querySelector("button"));
  });

  fetch("/api/auth/me", { credentials: "same-origin" })
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data && data.user) window.location.replace("/");
    })
    .catch(function () {});
})();
