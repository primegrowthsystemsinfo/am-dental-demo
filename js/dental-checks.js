/* ============================================================
   Dental pre-publication checks (this template's own validation layer).
   You never need to edit this file.
   - On the Smile Gallery page it finds cases that are still demonstration placeholders
     (data-case-placeholder), so the page can keep its warning banner until all are replaced.
   - When docs/check-before-publishing.html opens a page (?check-site=1), it reports placeholders,
     sample-content labels and the dental settings to the checker.
   It adds to, and never changes, the shared checker (js/site-content.js and docs/checker.js).
   Plain ES5 + UMD: runs from a double-clicked file (file://) and in Node for tests.
   ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.DentalChecks = api;
    if (root.document) api.reportToChecker(root);
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function text(el) { return (el && el.textContent || "").replace(/\s+/g, " ").trim(); }

  // placeholders(document) -> { count, titles: ["Whitening: sample case", ...] }
  function placeholders(doc) {
    var titles = [];
    // A case still needs replacing while it is flagged as demonstration content (data-case-demo for the AI-generated
    // demonstrations, data-case-placeholder for placeholder graphics), or while it still shows a demonstration image
    // (images/ai-demo-* or images/smile-gallery/placeholder-*), even if the flag was deleted.
    each(doc.querySelectorAll("[data-case]"), function (c) {
      var flagged = c.hasAttribute("data-case-demo") || c.hasAttribute("data-case-placeholder"), img = false;
      each(c.querySelectorAll("img"), function (i) {
        var s = (i.getAttribute("src") || "") + " " + (i.getAttribute("srcset") || "");
        if (/(^|[\/\s])(placeholder-|ai-demo-)[\w-]*\.(svg|png|jpe?g|webp|avif)/i.test(s)) img = true;
      });
      if (!flagged && !img) return;
      var t = c.querySelector(".case-title, h2, h3");
      titles.push(text(t) || c.id || "Untitled case");
    });
    return { count: titles.length, titles: titles };
  }

  // Visible "sample" labels left on a page (fictional team, sample wording, demonstration notice).
  function sampleNotes(doc) {
    var out = [];
    each(doc.querySelectorAll("[data-sample-note]"), function (el) { if (!el.closest("[hidden]")) out.push(text(el)); });
    return out;
  }

  var DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  function validZone(tz) {
    if (typeof tz !== "string" || !tz) return false;
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date()); return true; } catch (e) { return false; }
  }
  function hhmm(t) { return /^([01]\d|2[0-3]):[0-5]\d$/.test(t || ""); }

  // settings(SITE, DENTAL) -> [{ level, area, message, where }] about js/dental-config.js
  function settings(SITE, D) {
    var out = [], add = function (level, area, message, where) { out.push({ level: level, area: area, message: message, where: where || "" }); };
    var W = "js/dental-config.js → ";
    if (!D || typeof D !== "object") { add("fix", "Dental settings", "js/dental-config.js is missing or could not be read, so the opening-hours status and structured data are off.", "site/js/dental-config.js"); return out; }
    if (!validZone(D.timezone)) add("fix", "Opening hours", "The time zone is missing or not a valid name (for example \"America/Chicago\"), so the \"Open now\" status is hidden.", W + "timezone");
    var H = D.openingHours, bad = [];
    if (!H || typeof H !== "object") bad.push("openingHours");
    else DAYS.forEach(function (d) {
      var list = H[d];
      if (!Array.isArray(list)) { bad.push(d); return; }
      list.forEach(function (iv) { if (!Array.isArray(iv) || !hhmm(iv[0]) || !hhmm(iv[1]) || iv[1] <= iv[0]) bad.push(d); });
    });
    if (bad.length) add("fix", "Opening hours", "Opening hours need a list of [\"HH:MM\", \"HH:MM\"] pairs for every day (check: " + bad.join(", ") + "). Until then the \"Open now\" status is hidden.", W + "openingHours");
    else add("review", "Opening hours", "Check that openingHours (used for the \"Open now\" status and search engines) says the same as the hours shown on the pages.", W + "openingHours / js/site-config.js → business.hours");
    (Array.isArray(D.closedDates) ? D.closedDates : []).forEach(function (d) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) add("fix", "Opening hours", "Closed date \"" + d + "\" must be written YYYY-MM-DD.", W + "closedDates");
    });
    var A = D.address || {}, addr = SITE && SITE.contact && SITE.contact.address || "";
    if (/Sample Avenue|00000/.test((A.street || "") + " " + (A.postalCode || "") + " " + addr)) add("fix", "Business details", "The address is still the template's fictional sample.", "js/site-config.js → contact.address and " + W + "address");
    else if (A.street && addr && addr.indexOf(A.street) === -1) add("review", "Business details", "The street in js/dental-config.js (" + A.street + ") doesn't appear in contact.address (" + addr + "). Use the same address in both.", W + "address");
    if (D.siteUrl && !/^https:\/\/[^\s/?#]+\.[^\s/?#]+\/?$/.test(D.siteUrl)) add("fix", "Search and sharing", "siteUrl must be your full web address starting with https://, for example https://www.your-practice.com", W + "siteUrl");
    else if (!D.siteUrl) add("review", "Search and sharing", "siteUrl is empty: share previews use relative image paths and pages have no canonical link. Add your web address once you know it.", W + "siteUrl");
    if (D.mapLink && !/^https:\/\/\S+$/.test(D.mapLink)) add("fix", "Business details", "mapLink must start with https:// (or be \"\" to use a map search for your address).", W + "mapLink");
    var E = D.emergency || {};
    if ((E.phone && !E.phoneLink) || (!E.phone && E.phoneLink)) add("fix", "Emergency line", "Give both the emergency phone as shown and its digits (phoneLink), or leave both empty to use your main number.", W + "emergency");
    else if (E.phoneLink && !/^\+?[0-9]{6,15}$/.test(E.phoneLink)) add("fix", "Emergency line", "emergency.phoneLink must be digits only (with an optional leading +).", W + "emergency.phoneLink");
    add("review", "Emergency guidance", "Read the emergency wording on Treatments, Patient Info and Contact and adjust it to your practice (after-hours number, when to call 911).", "site/patients.html#emergency");
    return out;
  }

  // reportItems(reports) -> items for the dental pages' own reports (placeholders, sample labels)
  function reportItems(reports) {
    var out = [], add = function (level, area, message, where) { out.push({ level: level, area: area, message: message, where: where || "" }); };
    var gallery = reports.filter(function (r) { return r.page === "smile-gallery.html"; })[0];
    if (!gallery) add("review", "Smile Gallery", "Could not open smile-gallery.html to look for placeholder cases.", "site/smile-gallery.html");
    else if (gallery.placeholders.count) {
      add("fix", "Smile Gallery", gallery.placeholders.count + " gallery case" + (gallery.placeholders.count > 1 ? "s are" : " is") + " still demonstration content: AI-generated simulations or placeholders, not patients or treatment results (" + gallery.placeholders.titles.join("; ") + "). Before the gallery can be published as your practice's results, replace each with authentic photos of your own patients, used with their written authorisation, or delete the case. The page shows a warning banner until none is left.", "site/smile-gallery.html → data-case-demo / data-case-placeholder");
    } else add("ok", "Smile Gallery", "No AI demonstration cases or placeholders are left in the Smile Gallery.", "");
    // The same label on several pages (the footer notice) is reported once, with every page it is on.
    var byText = {}, order = [];
    reports.forEach(function (r) {
      (r.sampleNotes || []).forEach(function (t) {
        if (!byText[t]) { byText[t] = []; order.push(t); }
        if (byText[t].indexOf(r.page) === -1) byText[t].push(r.page);
      });
    });
    order.forEach(function (t) {
      var pages = byText[t];
      add("fix", "Sample content", "Still marked as a sample on " + (pages.length > 2 ? pages.length + " pages" : pages.join(" and ")) + ": “" + t + "”",
        (pages.length > 2 ? "site/*.html" : "site/" + pages[0]) + " → data-sample-note");
    });
    if (!order.length && reports.length) add("ok", "Sample content", "No sample-content labels are left on the pages.", "");
    return out;
  }

  // In checker mode (?check-site=1 inside the checker page), post this page's dental report to the checker.
  function reportToChecker(win) {
    if (!win || win.parent === win || !/[?&]check-site=1/.test(win.location.search)) return;
    win.addEventListener("load", function () {
      setTimeout(function () {
        var doc = win.document;
        win.parent.postMessage({ type: "dental-check", page: win.location.pathname.split("/").pop(), placeholders: placeholders(doc), sampleNotes: sampleNotes(doc) }, "*");
      }, 150);
    });
  }

  return { placeholders: placeholders, sampleNotes: sampleNotes, settings: settings, reportItems: reportItems, reportToChecker: reportToChecker };
});
