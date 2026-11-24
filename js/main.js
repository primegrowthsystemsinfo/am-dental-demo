/* Site behaviour for Willowmere Family Dental. You normally don't need to edit this file:
   practice details live in js/site-config.js and js/dental-config.js. */
(function () {
  "use strict";
  var SS = window.SiteSettings, S = SS.load(window.SITE), D = window.DENTAL || {};
  var B = S.business || {}, C = S.contact || {};
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var checking = /[?&]check-site=1/.test(location.search);

  /* ---------- Practice details from the settings ---------- */
  function fill() {
    $$("[data-site]").forEach(function (el) {
      var v = SS.text(S, el.getAttribute("data-site"));
      if (typeof v === "string" && v) el.textContent = v;
    });
    $$('[data-site-link="phone"]').forEach(function (a) { if (C.phoneLink) a.setAttribute("href", "tel:" + C.phoneLink); });
    $$('[data-site-link="email"]').forEach(function (a) { if (C.email) a.setAttribute("href", "mailto:" + C.email); });
    $$("[data-site-hours]").forEach(function (dl) {
      if (!Array.isArray(B.hours)) return;
      dl.innerHTML = "";
      B.hours.forEach(function (row) {
        var dt = document.createElement("dt"), dd = document.createElement("dd");
        dt.textContent = row[0]; dd.textContent = row[1];
        dl.appendChild(dt); dl.appendChild(dd);
      });
    });
    $$("[data-social]").forEach(function (a) {
      var url = S.social && S.social[a.getAttribute("data-social")];
      if (url && /^https:\/\//.test(url)) { a.href = url; a.hidden = false; } else { a.hidden = true; }
    });
    var social = $(".footer-social");
    if (social && !social.querySelector("a:not([hidden])")) social.hidden = true;
    $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

    // Emergency line: dental.emergency, or the main phone number
    var E = D.emergency || {}, ePhone = E.phone && E.phoneLink ? E.phone : C.phone, eLink = E.phone && E.phoneLink ? E.phoneLink : C.phoneLink;
    $$("[data-emergency-phone]").forEach(function (el) { if (ePhone) el.textContent = ePhone; });
    $$("[data-emergency-link]").forEach(function (a) { if (eLink && /^\+?[0-9]{6,15}$/.test(eLink)) a.setAttribute("href", "tel:" + eLink); });

    // Directions: the practice's own map link, or a map search for the address (opens in a new tab)
    var map = typeof D.mapLink === "string" && /^https:\/\/\S+$/.test(D.mapLink) ? D.mapLink
      : C.address ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.address) : "";
    $$("[data-directions]").forEach(function (a) { if (map) a.setAttribute("href", map); else a.hidden = true; });
  }

  /* ---------- Header and mobile menu ---------- */
  function nav() {
    var header = $(".site-header"), btn = $(".nav-toggle"), menu = document.getElementById("site-menu");
    if (header) {
      var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
      window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    }
    if (!btn || !menu) return;
    var outside = [$("main"), $(".site-footer"), $(".action-bar")].filter(Boolean);
    function set(open) {
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      document.body.classList.toggle("menu-open", open);
      outside.forEach(function (el) { if (open) el.setAttribute("inert", ""); else el.removeAttribute("inert"); });
    }
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("menu-open")) { set(false); btn.focus(); }
    });
    var mq = window.matchMedia("(min-width: 1024px)");
    var onMq = function () { if (mq.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener("change", onMq); else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---------- "Open now" status from dental.openingHours (in the practice's time zone) ---------- */
  var DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  var DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  function minutes(t) {
    var m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(t || "");
    return m ? (+m[1]) * 60 + (+m[2]) : -1;
  }
  // The weekly schedule as { sunday: [[480, 1020]], ... } in minutes, or null when anything is missing or invalid.
  function schedule() {
    var H = D.openingHours, out = {}, any = false;
    if (!H || typeof H !== "object") return null;
    for (var i = 0; i < DAYS.length; i++) {
      var list = H[DAYS[i]];
      if (!Array.isArray(list)) return null;
      out[DAYS[i]] = [];
      for (var j = 0; j < list.length; j++) {
        var o = minutes(list[j] && list[j][0]), c = minutes(list[j] && list[j][1]);
        if (o < 0 || c < 0 || c <= o) return null;
        out[DAYS[i]].push([o, c]); any = true;
      }
      out[DAYS[i]].sort(function (a, b) { return a[0] - b[0]; });
    }
    return any ? out : null;
  }
  // Date and time now in the practice's time zone, or null if the time zone is not valid.
  function zoneNow(tz, date) {
    try {
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
      var p = {}; parts.forEach(function (x) { p[x.type] = x.value; });
      var y = +p.year, mo = +p.month, d = +p.day, h = +p.hour % 24, mi = +p.minute;
      if (!y || !mo || !d || isNaN(h) || isNaN(mi)) return null;
      return { y: y, m: mo, d: d, min: h * 60 + mi, dow: new Date(Date.UTC(y, mo - 1, d)).getUTCDay() };
    } catch (e) { return null; }
  }
  function iso(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return t.toISOString().slice(0, 10); }
  function clock(min) {
    var h = Math.floor(min / 60), m = min % 60, ap = h < 12 ? "am" : "pm", h12 = h % 12 || 12;
    return h12 + ":" + (m < 10 ? "0" : "") + m + " " + ap;
  }
  // status(now) -> { open, text } or null (status not shown)
  function hoursStatus(date) {
    var tz = typeof D.timezone === "string" ? D.timezone : "", W = schedule();
    if (!tz || !W) return null;
    var n = zoneNow(tz, date || new Date());
    if (!n) return null;
    var closed = Array.isArray(D.closedDates) ? D.closedDates : [];
    var todayIso = iso(n.y, n.m, n.d);
    var today = closed.indexOf(todayIso) === -1 ? W[DAYS[n.dow]] : [];
    for (var i = 0; i < today.length; i++) {
      if (n.min >= today[i][0] && n.min < today[i][1]) {
        var left = today[i][1] - n.min;
        return { open: true, text: (left <= 30 ? "Open now · closes soon, at " : "Open now · until ") + clock(today[i][1]) };
      }
      if (n.min < today[i][0]) return { open: false, text: "Closed now · opens today at " + clock(today[i][0]) };
    }
    for (var k = 1; k <= 14; k++) {
      var t = new Date(Date.UTC(n.y, n.m - 1, n.d + k)), dow = t.getUTCDay(), list = W[DAYS[dow]];
      if (!list.length || closed.indexOf(t.toISOString().slice(0, 10)) !== -1) continue;
      return { open: false, text: "Closed now · opens " + (k === 1 ? "tomorrow" : DAY_NAMES[dow]) + " at " + clock(list[0][0]) };
    }
    return null;
  }
  function renderStatus() {
    var st = hoursStatus();
    $$("[data-hours-status]").forEach(function (p) {
      if (!st) { p.hidden = true; return; }
      var t = p.querySelector("[data-hours-status-text]");
      if (t) t.textContent = st.text;
      p.classList.toggle("is-open", st.open);
      p.hidden = false;
    });
  }

  /* ---------- Appointment request form ---------- */
  function form() {
    var f = $("form[data-contact]");
    if (!f) return;
    var status = f.querySelector(".form-status"), notice = $("[data-form-notice]"), reachErr = $("[data-reach-error]");
    var conn = SiteForms.connection(S);
    if (!conn.connected && notice) notice.hidden = false;
    var phone = f.elements.phone, email = f.elements.email;
    function say(msg, kind) { status.textContent = msg; status.className = "form-status is-" + kind; }
    function clearReach() { if (reachErr) reachErr.hidden = true; [phone, email].forEach(function (i) { i.removeAttribute("aria-invalid"); }); }
    [phone, email].forEach(function (i) { i.addEventListener("input", clearReach); });
    SiteForms.attach(f, {
      settings: S,
      say: say,
      validate: function () {
        clearReach();
        var name = f.elements.name;
        if (!name.value.trim()) { name.value = ""; }
        if (!name.checkValidity()) { name.reportValidity(); name.focus(); return false; }
        if (!phone.value.trim() && !email.value.trim()) {
          if (reachErr) reachErr.hidden = false;
          [phone, email].forEach(function (i) { i.setAttribute("aria-invalid", "true"); });
          phone.focus();
          return false;
        }
        if (!f.checkValidity()) { f.reportValidity(); return false; }
        return true;
      },
      messages: {
        notConnected: "This form isn't connected to an e-mail service yet, so your request was NOT sent. Please call us instead.",
        failed: "Sorry, your request could not be sent. Please call us instead.",
        success: S.form.successMessage || "Thank you. Your request was sent. We'll contact you to confirm a time."
      }
    });
  }

  /* ---------- Smile Gallery: comparison sliders, filters, side-by-side view ---------- */
  function compare(box) {
    var frame = box.querySelector(".compare-frame"), range = box.querySelector(".compare-range");
    if (!frame || !range) return;
    var pos = 50;
    function set(v) {
      pos = Math.max(0, Math.min(100, Math.round(v)));
      frame.style.setProperty("--pos", pos + "%");
      frame.classList.toggle("is-before-small", pos < 18);   // a side this narrow hides its label
      frame.classList.toggle("is-after-small", pos > 82);
      range.value = String(pos);
      range.setAttribute("aria-valuetext", (100 - pos) + " percent after, " + pos + " percent before");
    }
    function fromX(x) { var r = frame.getBoundingClientRect(); if (r.width) set((x - r.left) / r.width * 100); }
    range.addEventListener("input", function () { set(+range.value); });
    range.addEventListener("keydown", function (e) {
      var step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 }[e.key];
      if (step) { e.preventDefault(); set(pos + step); }
      else if (e.key === "Home") { e.preventDefault(); set(0); }
      else if (e.key === "End") { e.preventDefault(); set(100); }
    });
    range.addEventListener("focus", function () { box.classList.add("is-focused"); });
    range.addEventListener("blur", function () { box.classList.remove("is-focused"); });
    // Mouse: drag anywhere or click to jump. Touch and pen: a sideways drag moves the line, a vertical swipe still scrolls
    // the page (touch-action: pan-y), and a tap jumps.
    var drag = null;
    frame.addEventListener("pointerdown", function (e) {
      if (box.closest(".is-side")) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, active: e.pointerType === "mouse", touch: e.pointerType !== "mouse" };
      if (drag.active) { e.preventDefault(); fromX(e.clientX); box.classList.add("is-dragging"); }
      try { frame.setPointerCapture(e.pointerId); } catch (err) {}
    });
    frame.addEventListener("pointermove", function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.active && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) { drag.active = true; box.classList.add("is-dragging"); }
      if (drag.active) fromX(e.clientX);
    });
    function end(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.type === "pointerup" && drag.touch && !drag.active && Math.abs(e.clientX - drag.x) < 8 && Math.abs(e.clientY - drag.y) < 8) fromX(e.clientX);
      drag = null; box.classList.remove("is-dragging");
    }
    frame.addEventListener("pointerup", end);
    frame.addEventListener("pointercancel", end);
    frame.addEventListener("lostpointercapture", function () { drag = null; box.classList.remove("is-dragging"); });
    set(+range.value || 50);
  }
  function gallery() {
    var list = $("[data-cases]");
    if (!list) return;
    var cases = $$("[data-case]", list);
    $$("[data-compare]", list).forEach(compare);

    // Placeholder banner: visible while any case is still a demonstration placeholder
    var ph = window.DentalChecks ? window.DentalChecks.placeholders(document) : { count: 0 };
    $$("[data-placeholder-banner]").forEach(function (b) { b.hidden = ph.count === 0; });
    $$("[data-placeholder-count]").forEach(function (el) {
      el.textContent = ph.count ? "(" + ph.count + " of " + cases.length + (cases.length === 1 ? " case" : " cases") + " still to replace.)" : "";
    });

    // Filters with counts; a category with no cases hides its button
    var bar = $("[data-case-filters]"), status = $("[data-case-status]"), empty = $("[data-cases-empty]");
    function catOf(c) { return (c.getAttribute("data-case-category") || "").split(/\s+/); }
    function show(want) {
      var n = 0;
      cases.forEach(function (c) { var on = want === "all" || catOf(c).indexOf(want) !== -1; c.hidden = !on; if (on) n++; });
      if (empty) empty.hidden = n > 0;
      if (status) status.textContent = n + (n === 1 ? " case shown" : " cases shown");
    }
    if (bar) {
      $$("[data-case-filter]", bar).forEach(function (b) {
        var cat = b.getAttribute("data-case-filter");
        var n = cat === "all" ? cases.length : cases.filter(function (c) { return catOf(c).indexOf(cat) !== -1; }).length;
        var count = b.querySelector("[data-count]");
        if (count) count.textContent = String(n);
        if (cat !== "all" && !n) b.hidden = true;
      });
      bar.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-case-filter]");
        if (!btn) return;
        $$("[data-case-filter]", bar).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        show(btn.getAttribute("data-case-filter"));
      });
    }
    // Side-by-side view for everyone who prefers not to drag
    var toggle = $("[data-compare-toggle]");
    if (toggle) toggle.addEventListener("click", function () {
      var on = toggle.getAttribute("aria-pressed") !== "true";
      toggle.setAttribute("aria-pressed", String(on));
      list.classList.toggle("is-side", on);
      $$("[data-compare-hint]").forEach(function (h) { h.hidden = on; });
    });
  }

  /* ---------- Search and sharing: structured data, canonical link, share previews ---------- */
  function seo() {
    var site = typeof D.siteUrl === "string" && /^https:\/\/[^\s/?#]+\.[^\s/?#]+$/.test(D.siteUrl.replace(/\/+$/, "")) ? D.siteUrl.replace(/\/+$/, "") : "";
    var file = location.pathname.split("/").pop() || "index.html";
    var og = function (prop) { return $('meta[property="og:' + prop + '"]'); };
    if (og("site_name") && B.name) og("site_name").setAttribute("content", B.name);
    if (site) {
      var url = site + "/" + (file === "index.html" ? "" : file);
      var link = $('link[rel="canonical"]') || document.head.appendChild(Object.assign(document.createElement("link"), { rel: "canonical" }));
      link.setAttribute("href", url);
      var u = og("url") || document.head.appendChild(Object.assign(document.createElement("meta"), {}));
      u.setAttribute("property", "og:url"); u.setAttribute("content", url);
      var im = og("image");
      if (im && !/^https?:/.test(im.getAttribute("content"))) im.setAttribute("content", site + "/" + im.getAttribute("content"));
    }
    var el = $("script[data-dental-schema]");
    if (!el) return;
    if (D.structuredData === false) { el.parentNode.removeChild(el); return; }
    var data = { "@context": "https://schema.org", "@type": "Dentist", name: B.name };
    if (B.tagline) data.description = B.tagline;
    if (site) { data.url = site + "/"; data.image = site + "/images/family-reception-1200.jpg"; }
    if (C.phone) data.telephone = C.phone;
    if (C.email) data.email = C.email;
    var A = D.address || {};
    if (A.street || A.locality) {
      data.address = { "@type": "PostalAddress" };
      [["street", "streetAddress"], ["locality", "addressLocality"], ["region", "addressRegion"], ["postalCode", "postalCode"], ["country", "addressCountry"]].forEach(function (k) {
        if (typeof A[k[0]] === "string" && A[k[0]]) data.address[k[1]] = A[k[0]];
      });
    }
    var W = schedule();
    if (W) {
      var groups = [];
      [1, 2, 3, 4, 5, 6, 0].forEach(function (i) {
        W[DAYS[i]].forEach(function (iv) {
          var key = iv[0] + "-" + iv[1], g = groups.filter(function (x) { return x.key === key; })[0];
          if (!g) groups.push(g = { key: key, days: [], o: iv[0], c: iv[1] });
          g.days.push(DAY_NAMES[i]);
        });
      });
      var hm = function (m) { var h = Math.floor(m / 60), mi = m % 60; return (h < 10 ? "0" : "") + h + ":" + (mi < 10 ? "0" : "") + mi; };
      data.openingHoursSpecification = groups.map(function (g) { return { "@type": "OpeningHoursSpecification", dayOfWeek: g.days, opens: hm(g.o), closes: hm(g.c) }; });
    }
    el.textContent = JSON.stringify(data, null, 2);
  }

  /* ---------- Gentle reveal on scroll ---------- */
  function reveal() {
    var items = $$(".reveal");
    var all = function () { items.forEach(function (el) { el.classList.add("is-visible"); }); };
    if (checking || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { all(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    items.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-visible"); else io.observe(el);
    });
    window.addEventListener("beforeprint", all);
  }

  fill();
  nav();
  renderStatus();
  setInterval(renderStatus, 60000);
  form();
  gallery();
  seo();
  reveal();
  // For tests and the pre-publication checker: the status calculation for any moment
  window.WillowmereHours = { status: hoursStatus };
})();
