/* ============================================================
   DENTAL PRACTICE SETTINGS: the details only a dental website needs.
   (Your name, phone, e-mail, hours text and treatments are in js/site-config.js.)
   Keep the quotes "..." around each value. All values shipped are FICTIONAL SAMPLES.
   ============================================================ */
window.DENTAL = {
  /* OPENING HOURS FOR THE "OPEN NOW" STATUS
     timezone: your practice's time zone, as an IANA name, e.g. "America/New_York", "America/Chicago",
       "America/Denver", "America/Los_Angeles", "Europe/London". The status is worked out in the visitor's browser
       for that time zone, so it is right wherever the visitor is.
     openingHours: your regular hours in 24-hour time ("HH:MM"), one or more [open, close] pairs per day;
       [] = closed all day. Keep them the same as business.hours in js/site-config.js (the hours shown as text).
     closedDates: extra days you are closed (holidays), written "YYYY-MM-DD".
     If the time zone or the hours are missing or not valid, the status is simply not shown. */
  timezone: "America/Los_Angeles",
  openingHours: {
    monday: [],
    tuesday: [["09:00", "18:00"]],
    wednesday: [["09:00", "18:00"]],
    thursday: [],
    friday: [["09:00", "18:00"]],
    saturday: [["08:00", "16:00"]],
    sunday: []
  },
  closedDates: [],

  /* ADDRESS FOR SEARCH ENGINES (structured data). Use the same address as contact.address in js/site-config.js.
     country: the two-letter code, e.g. "US". */
  address: {
    street: "3041 Bonita Rd, Suite 101",
    locality: "Chula Vista",
    region: "CA",
    postalCode: "91910",
    country: "US"
  },

  /* DIRECTIONS LINK. "" = a map search for your address (opens in a new tab; no map is embedded in the pages).
     Or paste your practice's own map link, starting with https://. */
  mapLink: "",

  /* EMERGENCY LINE. "" = your main phone number from js/site-config.js.
     If you have a separate after-hours number, enter it as shown to visitors (phone) and in digits (phoneLink). */
  emergency: {
    phone: "",
    phoneLink: ""
  },

  /* YOUR WEBSITE ADDRESS, e.g. "https://www.your-practice.com" (no trailing slash).
     Used for share previews (Open Graph), the canonical link and structured data. "" = left out. */
  siteUrl: "",

  /* STRUCTURED DATA: true adds schema.org "Dentist" information (name, address, phone, hours) for search engines,
     built from these settings. It never includes reviews, ratings or prices. */
  structuredData: true
};
