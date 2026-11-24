/* ============================================================
   Content and appearance settings (Release Readiness v1.1, Step 4).
   You never need to edit this file: everything it uses lives in js/site-config.js.
   ============================================================ */
/* Source of truth: release/v1.1/shared/lib/content-core.js, copied unchanged into every template as site/js/site-content.js.
   Runs by itself before js/main.js. Every feature is OPTIONAL: when a setting is missing or empty the page keeps the
   content and look built into the HTML, so a template with no new settings looks exactly as approved.
   Page hooks it understands (added to the templates' HTML):
     data-item="services:<id>" / "packages:<id>" / "addOns:<id>"  a card or row for one item; data-field="name | blurb |
       tagline | unit | price | prices | points" marks its parts (data-format="plus" shows "+$35"). An item missing from
       the settings list is hidden. select[data-items="services,packages"]: option texts follow the lists.
     data-home-size="<n>"           label of a home-size button (Cleaning Luxury)
     data-content="<key>"           a piece of page text that content.<key> can replace (text only)
     data-gallery                   the gallery list rebuilt from gallery.items; [data-filters] buttons from gallery.categories
     data-section="<id>"            an optional section, hidden when sections.<id> is false
     <meta name="theme-map">        which of the template's CSS colour/font tokens each theme setting changes
   Plain ES5 + UMD: runs from file:// in every browser and in Node for tests. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else {
    root.SiteContent = api;
    if (root.document && root.SiteSettings) api.apply(root.SiteSettings.load(root.SITE), root.document);
  }
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var PAGES = { home: "index.html", services: "services.html", gallery: "gallery.html", about: "about.html", contact: "contact.html" };
  var DEFAULT_LABELS = { home: "Home", services: "Services", gallery: "Gallery", about: "About", contact: "Contact" };
  var LISTS = ["services", "packages", "addOns"];
  var HEX = /^#[0-9a-fA-F]{6}$/, FONT = /^[A-Za-z0-9][A-Za-z0-9 ]{1,39}$/, PATH = /^[\w./-]+$/;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function isStr(v) { return typeof v === "string" && v !== ""; }
  function hide(el) { el.style.display = "none"; el.setAttribute("data-hidden-by-settings", ""); }
  function safePath(p) { return isStr(p) && PATH.test(p) && p.indexOf("..") === -1 && p.charAt(0) !== "/"; }
  function money(S, n) { return ((S.pricing && S.pricing.currency) || "$") + Math.round(n).toLocaleString("en-US"); }
  function find(list, id) { for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i]; return null; }

  /* ---------- Services, packages, add-ons and their prices ---------- */
  function items(S, doc) {
    each(doc.querySelectorAll("[data-item]"), function (box) {
      var ref = box.getAttribute("data-item").split(":"), list = S[ref[0]];
      if (LISTS.indexOf(ref[0]) === -1 || !Array.isArray(list)) return; // not set: keep the page as built
      var item = find(list, ref[1]);
      if (!item) { hide(box); return; }
      each(box.querySelectorAll("[data-field]"), function (f) {
        if (f.closest("[data-item]") !== box) return;
        var key = f.getAttribute("data-field"), v = item[key];
        if (key === "price") { if (typeof v === "number") f.textContent = (f.getAttribute("data-format") === "plus" ? "+" : "") + money(S, v); }
        else if (key === "prices") {
          var sizes = Array.isArray(S.homeSizes) ? S.homeSizes : null;
          if (!sizes || !v || typeof v !== "object") return;
          var vals = sizes.map(function (sz) { return v[sz.id]; });
          if (vals.some(function (x) { return typeof x !== "number"; })) return;
          f.setAttribute("data-prices", vals.map(function (x) { return Math.round(x).toLocaleString("en-US"); }).join(" | "));
          f.textContent = money(S, vals[0]);
        } else if (key === "points") {
          if (!Array.isArray(v) || !f.firstElementChild) return;
          var tpl = f.firstElementChild.cloneNode(true);
          each(Array.prototype.slice.call(tpl.childNodes), function (n) { if (n.nodeType === 3) tpl.removeChild(n); });
          f.innerHTML = "";
          v.forEach(function (p) { var li = tpl.cloneNode(true); li.appendChild(doc.createTextNode(p)); f.appendChild(li); });
        } else if (typeof v === "string" && (v !== "" || key === "unit")) f.textContent = v;
      });
    });
    each(doc.querySelectorAll("[data-home-size]"), function (b) {
      var sz = Array.isArray(S.homeSizes) ? S.homeSizes[+b.getAttribute("data-home-size")] : null;
      if (sz && isStr(sz.name)) b.textContent = sz.name;
    });
    each(doc.querySelectorAll("select[data-items]"), function (sel) {
      var names = sel.getAttribute("data-items").split(","), lists = names.map(function (n) { return S[n.trim()]; });
      if (names.length === 1 && names[0] === "homeSizes") {
        if (!Array.isArray(S.homeSizes)) return;
        each(Array.prototype.slice.call(sel.options), function (o) { if (o.value !== "") sel.removeChild(o); });   // keep only the "Choose" placeholder
        S.homeSizes.forEach(function (sz) { var o = doc.createElement("option"); o.textContent = sz.name; sel.appendChild(o); });
        return;
      }
      if (!lists.some(Array.isArray)) return;
      var all = [], seen = {};
      lists.forEach(function (l) { if (Array.isArray(l)) l.forEach(function (it) { if (it && it.id && !seen[it.id]) { seen[it.id] = 1; all.push(it); } }); });
      var other = sel.querySelector('option[value="other"]'), have = {};
      each(Array.prototype.slice.call(sel.options), function (o) {
        if (!o.value || o.value === "other") return;
        var it = seen[o.value] ? find(all, o.value) : null;
        if (it) { o.textContent = it.formLabel || it.name; have[o.value] = 1; }
        else sel.removeChild(o);   // removed from the settings
      });
      all.forEach(function (it) {
        if (have[it.id]) return;
        var o = doc.createElement("option"); o.value = it.id; o.textContent = it.formLabel || it.name;
        sel.insertBefore(o, other || null);
      });
    });
  }

  /* ---------- Page text ---------- */
  function content(S, doc) {
    var C = S.content || {};
    each(doc.querySelectorAll("[data-content]"), function (el) { var v = C[el.getAttribute("data-content")]; if (isStr(v)) el.textContent = v; });
  }

  /* ---------- Gallery photos and filter buttons ---------- */
  function gallery(S, doc) {
    var G = S.gallery || {}, list = doc.querySelector("[data-gallery]");
    if (!list || !Array.isArray(G.items) || !G.items.length) return;
    var first = list.querySelector("[data-lightbox]");
    if (!first) return;
    var itemEl = first; while (itemEl.parentElement && itemEl.parentElement !== list) itemEl = itemEl.parentElement;
    var tpl = itemEl.cloneNode(true);
    each(Array.prototype.slice.call(list.children), function (c) { list.removeChild(c); });
    G.items.forEach(function (g) {
      if (!g || !safePath(g.image)) return;
      var node = tpl.cloneNode(true), a = node.matches("[data-lightbox]") ? node : node.querySelector("[data-lightbox]"), img = node.querySelector("img");
      each(node.querySelectorAll("source"), function (s) { s.parentNode.removeChild(s); });
      a.setAttribute("href", g.image);
      a.setAttribute("data-caption", g.caption || g.alt || "");
      if (img) { img.src = g.image; img.removeAttribute("srcset"); img.removeAttribute("sizes"); img.removeAttribute("width"); img.removeAttribute("height"); img.alt = g.alt || ""; img.setAttribute("loading", "lazy"); }
      each(node.querySelectorAll("span, figcaption"), function (c) { if (!c.querySelector("img, svg")) c.textContent = g.caption || ""; });
      var catEl = node.hasAttribute("data-category") ? node : node.querySelector("[data-category]") || node;
      catEl.setAttribute("data-category", g.category || "");
      list.appendChild(node);
    });
    var bar = doc.querySelector("[data-filters]");
    if (!bar) return;
    var cats = Array.isArray(G.categories) ? G.categories : [];
    var btns = bar.querySelectorAll("button[data-filter]"), allBtn = null, tplBtn = null;
    each(btns, function (b) { if (b.getAttribute("data-filter") === "all") allBtn = b; else if (!tplBtn) tplBtn = b; });
    each(btns, function (b) { if (b !== allBtn) b.parentNode.removeChild(b); });
    if (!tplBtn) return;
    cats.forEach(function (c) {
      if (!c || !isStr(c.id) || !isStr(c.name)) return;
      var b = tplBtn.cloneNode(true); b.setAttribute("data-filter", c.id); b.setAttribute("aria-pressed", "false"); b.textContent = c.name;
      bar.appendChild(b);
    });
    if (!cats.length && allBtn) bar.style.display = "none";
  }

  /* ---------- Menu labels ---------- */
  function navigation(S, doc) {
    var L = (S.navigation && S.navigation.labels) || {};
    Object.keys(PAGES).forEach(function (k) {
      if (!isStr(L[k])) return;
      each(doc.querySelectorAll('header a[href="' + PAGES[k] + '"], footer a[href="' + PAGES[k] + '"], nav a[href="' + PAGES[k] + '"]'), function (a) {
        if (a.textContent.trim() === DEFAULT_LABELS[k]) a.textContent = L[k];
      });
    });
  }

  /* ---------- Logo and favicon ---------- */
  function branding(S, doc) {
    var B = S.branding || {}, logo = B.logo || {}, name = (S.business && S.business.name) || "";
    if (safePath(logo.image)) {
      each(doc.querySelectorAll("a.brand, a.wordmark"), function (a) {
        var img = doc.createElement("img");
        img.className = "brand-logo"; img.src = logo.image;
        img.alt = logo.showName === false ? (logo.alt || name) : "";   // next to the visible name the image is decorative
        if (typeof logo.height === "number") img.style.height = logo.height + "px";
        var mark = a.querySelector(":scope > svg");
        if (mark) a.replaceChild(img, mark); else a.insertBefore(img, a.firstChild);
        a.classList.add("has-logo");
        if (logo.showName === false) each(a.querySelectorAll(":scope > span, :scope > svg"), function (s) { s.style.display = "none"; });
      });
    }
    var fav = B.favicon || {};
    if (safePath(fav.image)) {
      var link = doc.querySelector('link[rel~="icon"]') || doc.head.appendChild(doc.createElement("link"));
      var ext = fav.image.split(".").pop().toLowerCase();
      link.setAttribute("rel", "icon"); link.setAttribute("href", fav.image);
      link.setAttribute("type", ext === "svg" ? "image/svg+xml" : ext === "ico" ? "image/x-icon" : ext === "png" ? "image/png" : "image/" + ext);
    }
  }

  /* ---------- Colours and fonts ---------- */
  function theme(S, doc) {
    var T = S.theme || {}, meta = doc.querySelector('meta[name="theme-map"]'), map;
    if (!meta) return;
    try { map = JSON.parse(meta.getAttribute("content")); } catch (e) { return; }
    var style = doc.documentElement.style, colors = T.colors || {}, fonts = T.fonts || {};
    Object.keys(map.colors || {}).forEach(function (key) {
      var hex = colors[key];
      if (!HEX.test(hex || "")) return;
      var tokens = map.colors[key];
      Object.keys(tokens).forEach(function (tok) {
        var mode = tokens[tok];
        style.setProperty(tok, mode === "darker" ? "color-mix(in srgb, " + hex + " 78%, #000)" : mode === "lighter" ? "color-mix(in srgb, " + hex + " 72%, #fff)"
          : mode === "gradient" ? "linear-gradient(135deg, color-mix(in srgb, " + hex + " 75%, #fff) 0%, " + hex + " 55%, color-mix(in srgb, " + hex + " 80%, #000) 100%)" : hex);
      });
    });
    Object.keys(map.fonts || {}).forEach(function (key) {
      var fam = fonts[key];
      if (!FONT.test(fam || "")) return;
      var q = fam.trim().replace(/ +/g, "+");
      // Regular and bold load separately, so a family without a bold style still loads its regular style.
      ["", ":wght@700"].forEach(function (w) {
        var l = doc.createElement("link"); l.rel = "stylesheet"; l.href = "https://fonts.googleapis.com/css2?family=" + q + w + "&display=swap"; doc.head.appendChild(l);
      });
      map.fonts[key].forEach(function (tok) { style.setProperty(tok, '"' + fam.trim() + '", ' + (key === "heading" ? "Georgia, serif" : "system-ui, sans-serif")); });
    });
  }

  /* ---------- Optional sections ---------- */
  function sections(S, doc) {
    var V = S.sections || {};
    each(doc.querySelectorAll("[data-section]"), function (el) { if (V[el.getAttribute("data-section")] === false) hide(el); });
  }

  /* ---------- Report for the pre-publication checker (only when it opens this page in a frame) ---------- */
  function report(S, win) {
    if (!win || win.parent === win || !/[?&]check-site=1/.test(win.location.search)) return;
    var doc = win.document;
    win.addEventListener("load", function () {
      // Lazy images below the fold never load in a hidden frame: load them all, then wait (max 3 s) before reporting.
      Array.prototype.forEach.call(doc.images, function (i) { i.loading = "eager"; });
      var waited = 0;
      (function wait() {
        var pending = Array.prototype.some.call(doc.images, function (i) { return !i.complete; });
        if (pending && waited < 3000) { waited += 150; return setTimeout(wait, 150); }
        send();
      })();
    });
    function send() {
      setTimeout(function () {
        var vis = function (e) { return e.getClientRects().length > 0 && !e.closest("[hidden]"); };
        var msg = { type: "site-check", page: win.location.pathname.split("/").pop(), title: doc.title,
          brokenImages: Array.prototype.filter.call(doc.images, function (i) { return i.complete && i.naturalWidth === 0 && i.getAttribute("src"); }).map(function (i) { return i.getAttribute("src"); }),
          privacyTodos: Array.prototype.filter.call(doc.querySelectorAll(".pp-todo"), vis).map(function (e) { return e.textContent.trim(); }),
          sampleNotes: Array.prototype.filter.call(doc.querySelectorAll("[data-sample-note], [data-area-note]"), vis).map(function (e) { return e.textContent.trim(); }),
          formNotice: !!doc.querySelector("[data-form-notice]:not([hidden])"),
          hiddenSections: Array.prototype.map.call(doc.querySelectorAll("[data-section][data-hidden-by-settings]"), function (e) { return e.getAttribute("data-section"); }) };
        win.parent.postMessage(msg, "*");
      }, 100);
    }
  }

  function apply(S, doc) {
    doc = doc || document;
    items(S, doc); content(S, doc); gallery(S, doc); navigation(S, doc); branding(S, doc); theme(S, doc); sections(S, doc);
    if (typeof window !== "undefined" && doc === window.document) report(S, window);
  }

  return { apply: apply, PAGES: PAGES, DEFAULT_LABELS: DEFAULT_LABELS, money: money };
});
