/* ============================================================
   Form controller (Release Readiness v1.1, Step 3).
   You never need to edit this file: the form setting lives in js/site-config.js (form.endpoint).
   ============================================================ */
/* Source of truth: release/v1.1/shared/lib/forms-core.js, copied unchanged into every template as site/js/site-forms.js.
   Safety rules it enforces:
   - A form is DISCONNECTED unless form.endpoint is a valid endpoint of a supported provider (Formspree first).
     A disconnected form never makes a network request.
   - Sending is an HTTPS POST of the form fields only (no query string, no cookies, no referrer data added).
   - One request at a time (duplicate submissions are ignored), 15-second timeout.
   - A filled honeypot field (_gotcha) is never sent.
   - Success is shown only after a confirmed 2xx JSON response without errors; on any failure the visitor's entries stay
     in the form so they can try again.
   - Nothing is logged to the console and nothing typed into a form is stored in the browser.
   Plain ES5 + UMD: runs from file:// in every browser and in Node for build-time checks. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SiteForms = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var TIMEOUT_MS = 15000;
  var HONEYPOT = "_gotcha";
  // Supported providers. Endpoints must match exactly: https, the provider's host, a form id, nothing else.
  var PROVIDERS = {
    formspree: { label: "Formspree", site: "formspree.io", pattern: /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]{4,32}$/ }
  };
  var REASONS = {
    "not-configured": "No form endpoint is set (form.endpoint is empty).",
    "unsupported-provider": "This form provider is not supported yet. Supported: Formspree.",
    "unsupported-endpoint": "The endpoint is not a Formspree form address (https://formspree.io/f/your-form-id).",
    "invalid-endpoint": "The endpoint does not have the exact form https://formspree.io/f/your-form-id.",
    "not-a-string": "form.endpoint must be text in quotes."
  };

  function providerFor(endpoint) {
    for (var k in PROVIDERS) if (PROVIDERS[k].pattern.test(endpoint)) return k;
    return "";
  }

  // connection(settings) -> { connected, provider, label, endpoint, reason, message }
  // settings: the object returned by SiteSettings.load() (or anything with a .form group).
  function connection(settings) {
    var f = (settings && settings.form) || {}, endpoint = f.endpoint, chosen = f.provider || "";
    function no(reason) { return { connected: false, provider: chosen, label: "", endpoint: "", reason: reason, message: REASONS[reason] }; }
    if (endpoint === undefined || endpoint === null || endpoint === "") return no("not-configured");
    if (typeof endpoint !== "string") return no("not-a-string");
    if (chosen && !PROVIDERS[chosen]) return no("unsupported-provider");
    var detected = providerFor(endpoint);
    if (chosen && detected !== chosen) return no("invalid-endpoint");
    if (!detected) return no(/^https:\/\/formspree\.io\//.test(endpoint) ? "invalid-endpoint" : "unsupported-endpoint");
    return { connected: true, provider: detected, label: PROVIDERS[detected].label, endpoint: endpoint, reason: "", message: "" };
  }

  function buttons(form) { return form.querySelectorAll("button[type=submit], input[type=submit]"); }
  function setButtons(form, disabled) { Array.prototype.forEach.call(buttons(form), function (b) { b.disabled = disabled; }); }

  // attach(form, opts) wires a template form to the controller and returns its connection.
  // opts: settings (loaded settings), validate() -> true to continue (the template shows its own messages when false),
  //       say(message, kind) with kind "info" | "ok" | "warn" | "error", messages { notConnected, failed, success },
  //       onSuccess() after the form was reset, fetch (tests only; defaults to window.fetch).
  function attach(form, opts) {
    opts = opts || {};
    var conn = connection(opts.settings), busy = false, M = opts.messages || {};
    var say = opts.say || function () {};
    form.setAttribute("method", "post");   // never GET: personal details must never end up in a web address
    setButtons(form, false);               // buttons are disabled in the HTML so the form cannot submit without JavaScript
    var notice = opts.settings && opts.settings.form && opts.settings.form.privacyNotice;
    if (typeof notice === "string" && notice) Array.prototype.forEach.call(form.querySelectorAll("[data-form-privacy]"), function (el) { el.textContent = notice; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;                    // duplicate submission while a request is in flight
      if (opts.validate && opts.validate() === false) return;
      if (!conn.connected) { say(M.notConnected || "This form isn't connected yet, so nothing was sent. Please call or email us instead.", "warn"); return; }
      var hp = form.elements[HONEYPOT];
      if (hp && hp.value) { say(M.failed || "Sorry, your message could not be sent. Please call or email us instead.", "error"); return; }
      send();
    });

    function send() {
      var doFetch = opts.fetch || (typeof fetch === "function" ? fetch : null);
      if (!doFetch) { say(M.failed, "error"); return; }
      busy = true; setButtons(form, true); form.setAttribute("aria-busy", "true");
      say(M.sending || "Sending…", "info");
      var ctrl = typeof AbortController === "function" ? new AbortController() : null, timedOut = false;
      var timer = setTimeout(function () { timedOut = true; if (ctrl) ctrl.abort(); }, TIMEOUT_MS);
      var body = new FormData(form);
      var request = { method: "POST", body: body, headers: { Accept: "application/json" }, credentials: "omit", cache: "no-store", redirect: "error", referrerPolicy: "no-referrer" };
      if (ctrl) request.signal = ctrl.signal;
      doFetch(conn.endpoint, request)
        .then(function (r) {
          if (timedOut) throw new Error("timeout");
          if (!r.ok) throw new Error("status");
          return r.json().then(function (data) {
            if (!data || data.ok === false || data.errors) throw new Error("rejected");
          }, function () { throw new Error("unconfirmed"); });
        })
        .then(function () {
          if (timedOut) throw new Error("timeout");
          done();
          form.reset();
          if (opts.onSuccess) opts.onSuccess();
          say(M.success || "Thanks! Your message was sent.", "ok");
        })
        .catch(function (err) {
          done();
          var why = timedOut || (err && err.name === "AbortError") ? "The form service took too long to answer." : "";
          say((why ? why + " " : "") + (M.failed || "Sorry, your message could not be sent. Please call or email us instead.") +
            " Your details are still in the form, so you can try again.", "error");
        });
      function done() { clearTimeout(timer); busy = false; setButtons(form, false); form.removeAttribute("aria-busy"); }
    }
    return conn;
  }

  return { connection: connection, attach: attach, PROVIDERS: PROVIDERS, REASONS: REASONS, HONEYPOT: HONEYPOT, TIMEOUT_MS: TIMEOUT_MS };
});
