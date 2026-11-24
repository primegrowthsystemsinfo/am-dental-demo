/* ============================================================
   YOUR PRACTICE DETAILS: edit this file (and js/dental-config.js).
   Everything below appears automatically on every page
   (header, footer, contact page, call buttons, treatment lists).
   Keep the quotes "..." around each value.
   All details shipped with the template are FICTIONAL SAMPLES:
   replace every one of them before you publish.
   ============================================================ */
window.SITE = {
  schemaVersion: 2, // settings layout version: leave it as it is

  business: {
    name: "AM Dental",
    tagline: "Friendly, caring family dentistry in Chula Vista.",
    city: "Chula Vista, CA",
    // Opening hours as shown on the pages, one ["days", "times"] pair per row.
    // Also update openingHours in js/dental-config.js: it drives the "Open now" status and must say the same.
    hours: [
      ["Monday", "Closed"],
      ["Tuesday – Wednesday", "9:00 AM – 6:00 PM"],
      ["Thursday", "Closed"],
      ["Friday", "9:00 AM – 6:00 PM"],
      ["Saturday", "8:00 AM – 4:00 PM"],
      ["Sunday", "Closed"]
    ]
  },

  contact: {
    // Shown as written; "phoneLink" is the same number in digits only, used for tap-to-call.
    phone: "(619) 591-9222",
    phoneLink: "+16195919222",
    email: "",
    // Street address shown in the footer and on the contact page. Also fill in address in js/dental-config.js.
    address: "3041 Bonita Rd, Suite 101, Chula Vista, CA 91910"
  },

  // Leave a link empty ("") to hide that icon. google: a link to your practice's own Google reviews.
  social: {
    facebook: "",
    instagram: "",
    google: "https://www.google.com/maps/search/?api=1&query=AM+Dental+3041+Bonita+Rd+Chula+Vista+CA"
  },

  /* TREATMENTS (Treatments page, Home page cards)
     id: don't change it (the pages use it). name and blurb are shown everywhere; cardName / cardText are the shorter
     wording on the Home page cards. No prices are shown: dental fees depend on each patient's needs.
     Delete a treatment's block to hide it on every page. To add one, copy a row in treatments.html and give it a new id. */
  services: [
    { id: "checkups", name: "Check-ups & cleanings", cardName: "Check-ups & cleaning",
      blurb: "Regular exams and a professional clean to keep teeth and gums healthy.",
      cardText: "Keep your smile healthy with regular preventive care." },
    { id: "children", name: "Children's dentistry",
      blurb: "Relaxed, friendly visits that help children feel at home in the dental chair." },
    { id: "fillings", name: "Fillings", cardName: "Fillings",
      blurb: "Repair small areas of decay and help protect the tooth from further damage.",
      cardText: "Restore the function and natural look of your teeth." },
    { id: "crowns", name: "Dental crowns", cardName: "Crowns",
      blurb: "A custom cap that strengthens and protects a damaged or weakened tooth.",
      cardText: "Natural-looking protection for damaged teeth." },
    { id: "bridges", name: "Dental bridges",
      blurb: "A fixed way to replace one or more missing teeth next to healthy ones." },
    { id: "implants", name: "Dental implants",
      blurb: "We'll explain whether an implant suits you, and plan it with you or refer you to a specialist." },
    { id: "whitening", name: "Teeth whitening", cardName: "Whitening",
      blurb: "Professional whitening, in the office or at home, after a check that it's right for you.",
      cardText: "Brighten your smile with a professional treatment." },
    { id: "veneers", name: "Veneers",
      blurb: "Thin, custom-made shells that can change the shape or shade of front teeth." },
    { id: "bonding", name: "Cosmetic bonding",
      blurb: "Tooth-coloured material to repair small chips, gaps or uneven edges." },
    { id: "aligners", name: "Clear aligners", cardName: "Clear aligners",
      blurb: "A series of removable, clear trays that gradually move teeth.",
      cardText: "A discreet, removable way to straighten teeth." },
    { id: "toothache", name: "Toothache care", cardName: "Emergency care",
      blurb: "Prompt care to find the cause of the pain and make you comfortable.",
      cardText: "Prompt care when something hurts or breaks." },
    { id: "broken-tooth", name: "Broken or chipped tooth",
      blurb: "Care after an accident or a bite on something hard." }
  ],

  /* PAGE TEXT (optional). "" keeps the text built into the page. Text only: a headline you replace
     loses its italic accent word. Keys: heroTitle, heroText (Home), aboutText (About), ctaTitle, ctaText (Home closing band). */
  content: {
    heroTitle: "",
    heroText: "",
    aboutText: "",
    ctaTitle: "",
    ctaText: ""
  },

  /* MENU LABELS (optional). "" keeps the built-in label. (Home, About and Contact; the other menu labels are edited in the pages.) */
  navigation: {
    labels: { home: "", about: "", contact: "" }
  },

  /* LOGO AND FAVICON (optional). Put the files in the images folder.
     logo.image: e.g. "images/logo.png" ("" = the template's built-in leaf mark). height: logo height in pixels (24-96).
     showName: false shows only the logo image (then logo.alt, or the practice name, describes it).
     favicon.image: the small browser-tab icon, e.g. "images/favicon.png" (.png, .svg or .ico). */
  branding: {
    logo: { image: "", alt: "", height: 40, showName: true },
    favicon: { image: "" }
  },

  /* COLOURS AND FONTS (optional). "" keeps the approved design.
     colors: six-digit hex codes. primary = buttons and links (sea-glass green), accent = the sand bands,
     text, background, surface (mist-blue panels). Check readability with docs/check-before-publishing.html.
     fonts: a Google Fonts family name, e.g. "Lora". */
  theme: {
    colors: { primary: "", accent: "", text: "", background: "", surface: "" },
    fonts: { heading: "", body: "" }
  },

  /* OPTIONAL SECTIONS. Set a section to false to hide it, e.g. sections: { "home.team": false }.
     This template's sections: "home.trust", "home.firstVisit", "home.comfort", "home.team", "home.insurance",
     "home.gallery", "home.cta", "about.values", "about.office", "about.access", "patients.children", "patients.faq" */
  sections: { "home.gallery": false },

  /* APPOINTMENT REQUEST FORM
     The form does NOT send anything until you connect a form service.
     1. Create a free form at Formspree (formspree.io). Other form services are not supported yet.
     2. Paste the form's endpoint URL below, for example:
        endpoint: "https://formspree.io/f/abcdwxyz"
     The address must be exactly https://formspree.io/f/ followed by your form id; anything else keeps
     the form disconnected. Until then, visitors see a clear "not connected yet" notice and nothing is sent.
     The form asks for no health information. It is a REQUEST: your team confirms every appointment. */
  form: {
    endpoint: "",
    successMessage: "Thank you. Your request was sent. This is not a confirmed appointment yet: we'll call or e-mail you within one business day to agree a time.",
    privacyNotice: ""
  },

  /* PRIVACY PAGE (privacy.html)
     The privacy page is a TEMPLATE, not legal advice. Fill in these details, adjust the page text so it matches
     how your practice really handles information, and have it reviewed by a qualified professional.
     Details left empty stay highlighted on the page as "[Complete: ...]". */
  privacy: {
    legalName: "",         // legal name of the practice ("" = the name above)
    contactEmail: "",      // e-mail for privacy requests ("" = the e-mail above)
    mailingAddress: "",    // postal address for privacy requests
    effectiveDate: "",     // date the policy takes effect, written YYYY-MM-DD
    retention: "",         // how long you keep appointment requests, e.g. "24 months"
    usCalifornia: false,   // true shows the optional United States / California section
    euUk: false,           // true shows the optional EU / UK section
    reviewed: false        // true only after the policy is complete and checked (hides the reminder banner)
  }
};
