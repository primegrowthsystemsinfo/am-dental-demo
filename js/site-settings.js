/* ============================================================
   Site settings library (settings schema v2).
   You never need to edit this file: your business details live in js/site-config.js.
   It reads js/site-config.js, accepts both the current (v2) layout and the
   original v1.0 layout, and gives the rest of the site one consistent view.
   ============================================================ */
/* Source of truth: release/v1.1/shared/lib/settings-core.js. Copied unchanged into every template as
   site/js/site-settings.js by tools/settings/sync-shared.mjs (which also checks the copies stay identical).
   Plain ES5 so it runs from a double-clicked file (file://) in every browser, and in Node for build-time checks. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SiteSettings = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var SCHEMA_VERSION = 2;

  // Defaults for settings groups that may be left out of site-config.js (values here are the schema defaults).
  // Active: privacy and the form provider/notice (Step 3); content, gallery, navigation, branding, theme and sections
  // (Step 4: empty values keep the page as built). Reserved for a later step: seo.
  function reservedDefaults() {
    return {
      branding: { logo: { image: "", alt: "", height: 40, showName: true }, favicon: { image: "" } },
      content: {},
      theme: { colors: {}, fonts: {} },
      gallery: { categories: [], items: [] },
      navigation: { labels: {} },
      sections: {},
      seo: { siteUrl: "", siteName: "", defaultDescription: "", socialImage: "", pages: {}, noindex: false },
      privacy: { legalName: "", contactEmail: "", mailingAddress: "", effectiveDate: "", retention: "",
        usCalifornia: false, euUk: false, reviewed: false },
      form: { provider: "", privacyNotice: "" }
    };
  }
  var FORM_DEFAULT_KEYS = ["provider", "privacyNotice"];

  // The text hooks used in the pages (data-site="...") and where each lives in the v2 settings.
  var TEXT_PATHS = {
    businessName: "business.name",
    tagline: "business.tagline",
    city: "business.city",
    phone: "contact.phone",
    email: "contact.email",
    address: "contact.address",
    serviceArea: "serviceArea.summary"
  };

  function isObj(v) { return v !== null && typeof v === "object" && !Array.isArray(v); }

  // Copies only the keys that are present, so "not set" stays distinguishable from "set to empty".
  function present(o) {
    var out = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && o[k] !== undefined) out[k] = o[k];
    return out;
  }
  function copy(o) { return isObj(o) ? present(o) : {}; }

  function version(raw) {
    if (!isObj(raw)) return 0;
    return typeof raw.schemaVersion === "number" ? raw.schemaVersion : 1;
  }

  // v1.0 templates named the highlighted package three ways (featured / hot / popular); v2 uses "featured".
  function packagesFromV1(list) {
    if (!Array.isArray(list)) return list;
    return list.map(function (p) {
      if (!isObj(p) || (p.hot === undefined && p.popular === undefined)) return p;
      var out = present(p), flag = p.featured !== undefined ? p.featured : p.hot !== undefined ? p.hot : p.popular;
      delete out.hot; delete out.popular;
      out.featured = flag;
      return out;
    });
  }

  // Original v1.0 layout (flat keys) -> v2 layout. Nothing is dropped: every v1.0 key has a v2 home.
  function fromV1(s) {
    var area = s.serviceArea;
    var areaV2 = isObj(area) ? present(area) : present({ summary: area });
    var v2 = present({
      schemaVersion: SCHEMA_VERSION,
      business: present({ name: s.businessName, tagline: s.tagline, city: s.city, hours: s.hours }),
      contact: present({ phone: s.phone, phoneLink: s.phoneLink, email: s.email, address: s.address }),
      social: s.social,
      serviceArea: areaV2,
      pricing: present({ currency: s.currency, sampleNote: s.samplePriceNote }),
      services: s.services,
      packages: packagesFromV1(s.packages),
      features: s.features,
      vehicleSizes: s.vehicleSizes,
      addOns: s.addOns,
      estimator: s.estimator,
      form: s.form
    });
    return v2;
  }

  // Returns the settings in the v2 layout, without defaults added. Never changes the object passed in.
  function migrate(raw) {
    var v = version(raw);
    if (v === 0) return { schemaVersion: SCHEMA_VERSION };
    if (v === 1) return fromV1(raw);
    var out = present(raw);
    out.schemaVersion = SCHEMA_VERSION;
    return out;
  }

  // Returns a complete v2 settings object for the site scripts: every section exists (so scripts never need
  // to check for missing sections), values that are not set stay undefined, and the reserved sections carry
  // their defaults. Never throws, never changes the object passed in.
  function load(raw) {
    var m = migrate(raw), d = reservedDefaults();
    var out = {
      schemaVersion: SCHEMA_VERSION,
      sourceVersion: version(raw),
      business: copy(m.business),
      contact: copy(m.contact),
      social: copy(m.social),
      serviceArea: copy(m.serviceArea),
      pricing: copy(m.pricing),
      services: m.services,
      packages: m.packages,
      features: m.features,
      vehicleSizes: m.vehicleSizes,
      homeSizes: m.homeSizes,
      addOns: m.addOns,
      estimator: m.estimator,
      form: copy(m.form)
    };
    for (var k in d) {
      if (k === "form") continue;
      out[k] = isObj(m[k]) ? fill(d[k], m[k]) : d[k];
    }
    FORM_DEFAULT_KEYS.forEach(function (key) { if (out.form[key] === undefined) out.form[key] = d.form[key]; });
    return out;
  }
  function fill(defaults, given) {
    var out = present(given);
    for (var k in defaults) {
      if (out[k] === undefined) out[k] = defaults[k];
      else if (isObj(defaults[k]) && isObj(out[k]) && Object.keys(defaults[k]).length) out[k] = fill(defaults[k], out[k]);
    }
    return out;
  }

  // get(settings, "contact.phone") -> value or undefined
  function get(settings, path) {
    var parts = String(path).split("."), v = settings;
    for (var i = 0; i < parts.length; i++) {
      if (v === null || v === undefined) return undefined;
      v = v[parts[i]];
    }
    return v;
  }

  // Value for a page text hook (data-site="businessName" etc.).
  function text(settings, key) {
    var path = TEXT_PATHS[key];
    return path ? get(settings, path) : undefined;
  }

  return {
    SCHEMA_VERSION: SCHEMA_VERSION,
    TEXT_PATHS: TEXT_PATHS,
    reservedDefaults: reservedDefaults,
    version: version,
    migrate: migrate,
    load: load,
    get: get,
    text: text
  };
});
