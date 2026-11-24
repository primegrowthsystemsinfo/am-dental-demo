/* ============================================================
   Privacy page filler (Release Readiness v1.1, Step 3).
   You never need to edit this file: the privacy details live in js/site-config.js (privacy: { ... }).
   ============================================================ */
/* Source of truth: release/v1.1/shared/lib/privacy-page.js, copied unchanged into every template as site/js/site-privacy.js.
   Does nothing on pages without [data-pp] hooks. On privacy.html it:
   - fills the details from the settings (legal name, contact e-mail, mailing address, effective date, retention period,
     form provider); a detail that is not set keeps its highlighted "[Complete: ...]" marker;
   - shows the optional US/California and EU/UK sections only when switched on in the settings;
   - keeps the "complete and review this page" banner until privacy.reviewed is true.
   The page text itself is ordinary HTML in privacy.html, so it can be edited and is readable without JavaScript. */
(function (root, factory) {
  var api = factory(typeof require === "function" && typeof module === "object" ? require("./forms-core.js") : root.SiteForms);
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.SitePrivacy = api;
    // Runs by itself at the end of the page (scripts load after the content); a no-op on pages without [data-pp] hooks.
    if (root.document && root.SiteSettings) api.render(root.SiteSettings.load(root.SITE), root.document);
  }
})(typeof window !== "undefined" ? window : this, function (forms) {
  "use strict";

  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  function date(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m || +m[2] < 1 || +m[2] > 12) return "";
    return MONTHS[+m[2] - 1] + " " + (+m[3]) + ", " + m[1];
  }

  // values(settings) -> the text for every [data-pp] hook ("" = still to complete)
  function values(S) {
    var P = S.privacy || {}, B = S.business || {}, C = S.contact || {};
    var conn = forms ? forms.connection(S) : { connected: false };
    return {
      legalName: P.legalName || B.name || "",
      contactEmail: P.contactEmail || C.email || "",
      mailingAddress: P.mailingAddress || "",
      effectiveDate: date(P.effectiveDate),
      retention: P.retention || "",
      formProvider: conn.connected ? conn.label + " (" + forms.PROVIDERS[conn.provider].site + ")" : ""
    };
  }

  function render(S, doc) {
    doc = doc || document;
    var hooks = doc.querySelectorAll("[data-pp]");
    if (!hooks.length) return null;
    var P = S.privacy || {}, V = values(S);
    Array.prototype.forEach.call(hooks, function (el) {
      var v = V[el.getAttribute("data-pp")];
      if (v) { el.textContent = v; el.classList.remove("pp-todo"); }
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-pp-link=email]"), function (a) {
      if (V.contactEmail) a.setAttribute("href", "mailto:" + V.contactEmail);
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-pp-section]"), function (sec) {
      sec.hidden = P[sec.getAttribute("data-pp-section")] !== true;
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-pp-banner]"), function (b) { b.hidden = P.reviewed === true; });
    return V;
  }

  return { render: render, values: values, formatDate: date };
});
