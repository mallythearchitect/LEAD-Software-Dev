/* LEAD Ops Hub — made-up demo data for mock-ups and previews.
   Every name, address, phone number and email here is invented: phone numbers use the
   555-01xx range set aside for fiction and emails use example.org. Spread across all 7 centers
   so the coordinator and executive views have something to add up. */
import { CENTERS, CANVASS } from "./lead-core.js";

const FIRST = ["Ana", "Luis", "Maya", "Jordan", "Keisha", "Carlos", "Priya", "Devon", "Rosa", "Andre", "Lena", "Marcus", "Sofia", "Tariq", "Elena", "Jamal", "Nadia", "Victor", "Grace", "Omar", "Isabel", "Darius", "Camila", "Malik", "Yesenia", "Brandon", "Aaliyah", "Diego", "Monique", "Kevin"];
const LAST = ["Rivera", "Johnson", "Santos", "Williams", "Ortiz", "Brown", "Mendez", "Davis", "Reyes", "Thompson", "Cruz", "Jackson", "Morales", "Harris", "Vega", "Robinson", "Castillo", "Walker", "Flores", "Lewis", "Ramos", "Young", "Torres", "King", "Diaz", "Wright", "Perez", "Green", "Rosario", "Hall"];
const STREETS = ["Example Ave", "Sample St", "Maple Demo Rd", "Placeholder Ln", "Test Park Dr", "Mockingbird Way", "Model Ct"];
const EVENT_NAMES = ["Community Resource Fair", "Family Literacy Night", "Fall Farmers Market", "Library Family Day", "Church Harvest Festival", "Youth Basketball Tournament", "Neighborhood Town Hall", "Holiday Toy Drive", "Back-to-School Bash", "Cultural Heritage Night"];
const ORG_KINDS = [["Organization", "Neighborhood association"], ["Church", "Community church"], ["Business", "Family-owned restaurant"], ["School", "Public elementary school"], ["Organization", "Youth sports league"], ["Business", "Barber shop"], ["Education Leader", "Principal"], ["Organization", "Parent group"]];
const COMMS = ["Latino", "Black", "Parents", "Youth", "Faith", "Caribbean", "Brazilian"];
const TASKS = [["Confirm tabling spot for the resource fair", "Events"], ["Follow up with two Board of Champions invitees", "Board of Champions"], ["Drop flyers at three barber shops", "B-LEAD"], ["Call the parent group about the info night", "Charters & leaders"], ["Order more clipboards and pens", "Other"], ["Book the community room for the training", "Events"]];
const PLAYBOOK = [
  ["How to open a conversation at a table", "Smile, stand in front of the table, and lead with the kids: \"Do you have children in school here?\" Keep the first ask small.", "How LEAD works"],
  ["What to bring to every event", "Clipboards, pens, petition sheets, flyers, the banner, a sign-in sheet and water. Count sheets before and after.", "How LEAD works"],
  ["After a shift", "Log the shift the same day: where, hours, signatures collected and anything a coordinator should know.", "Libertas canvassing"],
  ["Who to call if something goes wrong", "Your center's coordinator first. For anything about safety, leave the event and call them right away.", "How LEAD works"],
];

function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pad = n => String(n).padStart(2, "0");
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const CODES = { "east-hartford": "eh", "new-britain": "nb", waterbury: "wb", danbury: "db", bridgeport: "bp", "new-haven": "nh", norwich: "nw" };

export function demoBundle(today = new Date()) {
  const r = rng(20261108);
  const pick = a => a[Math.floor(r() * a.length)];
  const person = () => `${pick(FIRST)} ${pick(LAST)}`;
  const tiers = [], docs = {};
  const put = (col, id, d) => { (docs[col] = docs[col] || {})[id] = d; };
  const t0 = iso(today);

  // organisation-wide pieces
  tiers.push({ tier: "core", center: "all", data: {
    REF: { FACTS: [{ title: "About this demo", items: ["Everything in this hub right now is made up for previews.", "Real work starts once each center adds its own people, events and shifts."] }] },
    LT_meta: { goal: 20, gala: iso(addDays(today, 34)), phases: [], built: t0, zones: [], help: ["<b>The ask.</b> One page, signed, addressed to the State Board of Education."],
      letter_body: "I am writing in support of a new public school option for families in our community. (Demo letter.)", verified: 0, unverified: 0,
      letter_head: "[Organization Letterhead, if applicable]", letter_sign: "Sincerely,\n\n[Your Name]\n\n[Your Title / Organization]" },
    CV: { orgs: [{ id: "demo-petition", name: "Demo School Petition", short: "Demo petition", city: "Connecticut", goal: 3500, color: "#2f6fe0", desc: "A made-up signature campaign for mock-ups.", active: true, primary: true }], spots: [], sheets: {} },
  } });
  PLAYBOOK.forEach(([title, body, lane], i) => put("playbook", "demo-pb" + i, { title, body, lane, order: i + 1, status: "confirmed", source: "Demo", createdAt: t0, updatedAt: t0 }));
  put("questions", "demo-q1", { q: "Which events can we table at for free?", answer: "", askWho: "Your coordinator", lane: "How LEAD works", status: "open", createdAt: t0 });
  put("questions", "demo-q2", { q: "How many signatures does each center need by the deadline?", answer: "500 each (demo number).", askWho: "", lane: "Libertas canvassing", status: "answered", createdAt: t0 });
  put("meta", "settings", { sigGoal: 3500, goalDate: iso(addDays(today, 37)), manual: 0, links: [] });

  CENTERS.forEach((c, ci) => {
    const p = CODES[c.id] || c.id.slice(0, 2), city = c.city.replace(/, CT$/, ""), area = ci % 2 ? "203" : "860";
    const phone = n => `(${area}) 555-01${pad(n % 100)}`;
    const addr = () => `${100 + Math.floor(r() * 899)} ${pick(STREETS)}, ${city}, CT`;
    const jitter = () => (r() - 0.5) * 0.04;

    // events, meetings, schools
    const events = EVENT_NAMES.slice(0, 7).map((name, i) => ({
      id: `${p}-e${i + 1}`, name: `${name} (demo)`, date: iso(addDays(today, 2 + i * 5 + ci % 3)), time: pick(["10:00 AM", "1:00 PM", "5:30 PM", "6:00 PM"]),
      recurring: "", venue: `${city} Community Center`, address: addr(), town: city, lat: c.ll[0] + jitter(), lng: c.ll[1] + jitter(),
      host: `${city} Neighbors (demo)`, community: [pick(COMMS), pick(COMMS)].filter((v, k, a) => a.indexOf(v) === k), event_type: pick(["Festival", "Workshop", "Meeting", "Civic", "Sports"]),
      why: "Made-up event for previews.", can_table: r() > 0.3, cost: "free", url: "", priority: r() > 0.5 ? "High" : "Medium" }));
    tiers.push({ tier: "core", center: c.id, data: {
      REF: { EVENTS: events,
        MEETINGS: [{ body: `${city} Board of Education (demo)`, schedule: "Monthly, 2nd Tuesday, 7 PM", next_dates: [iso(addDays(today, 9)), iso(addDays(today, 37))], location: `${city} City Hall`, url: "", notes: "Public comment at the start of each meeting." }],
        SCHOOLS: [{ name: `${city} Demo Elementary`, kind: "Public (K-5)", town: city, address: addr(), phone: phone(90), grades: "K-5", enrollment: "420", demo: "Made-up school", leaders: ["Principal (demo)"], dates: "", calendar: "", board: "", notes: "Demo record.", source: "" }] },
      CV: { spots: [{ date: iso(addDays(today, 3 + ci)), name: `Saturday market (${city})`, loc: `${city} Green`, time: "10:00 AM", link: "" }] },
    } });

    // canvass: team, signers, shifts
    const team = Array.from({ length: 5 }, (_, k) => ({ id: `${p}-cv${k + 1}`, name: person(), phone: phone(10 + k), email: `canvasser${k + 1}.${p}@example.org`, area: pick(["Downtown", "North End", "Library", "Door to door"]), availability: pick(["Weekends", "Evenings", "Weekday mornings"]), center: c.id, paperwork: r() > 0.3 }));
    team.forEach(t => { const { id, ...d } = t; put("team", id, d); });
    const signers = Array.from({ length: 35 + ci * 3 }, (_, k) => {
      const tm = pick(team);
      return { id: `${p}-s${k + 1}`, name: person(), address: addr(), c: tm.id, date: iso(addDays(today, -Math.floor(r() * 30))), sheet: `${p.toUpperCase()}-${pad(1 + Math.floor(k / 12))}`, row: 1 + k % 12, conf: pick(["high", "med", "low"]), location: pick(events).name, signed: r() > 0.2, note: "" };
    });
    tiers.push({ tier: "canvass", center: c.id, data: { CV_signers: signers } });
    for (let k = 0; k < 8; k++) {
      const tm = pick(team), d = addDays(today, -Math.floor(r() * 28));
      put("shifts", `${p}-sh${k + 1}`, { area: tm.area, back: Math.floor(r() * 4), c: tm.id, center: c.id, date: iso(d), file: "", hrs: 2, notes: "", org: "demo-petition", out: 10 + Math.floor(r() * 10), sigs: 3 + Math.floor(r() * 12), time: "10 am - 12 pm", uploaded: false, where: `${pick(events).name}`, who: tm.name, _by: "demo@example.org" });
    }

    // people & orgs, board, letters
    const targets = ORG_KINDS.map(([type, subtype], i) => ({
      id: `${p}-t${i + 1}`, name: `${city} ${pick(["Youth Alliance", "Family Network", "Unity Church", "Corner Café", "Parents United", "Sports Club", "Arts Collective", "Learning Center"])} (demo)`,
      type, subtype, community: [pick(COMMS)], town: city, address: addr(), contact_name: person(), role: type === "Church" ? "Pastor" : type === "School" ? "Principal" : "Director",
      phone: phone(30 + i), email: `contact${i + 1}.${p}@example.org`, website: "", social: "", reach: "", why: "Made-up contact for previews.", priority: pick(["High", "Medium", "Low"]) }));
    const board = { invite: Array.from({ length: 3 }, (_, i) => ({ name: person(), title: pick(["Pastor", "Business owner", "Parent leader", "Coach"]), phone: phone(60 + i), email: `champion${i + 1}.${p}@example.org`, category: `${city} community leaders` })), flyer: [] };
    const letters = Array.from({ length: 4 }, (_, i) => ({ id: `${p}-L${i + 1}`, name: `${city} ${pick(["Boys & Girls Club", "Faith Center", "Small Business Assoc.", "Parent Council"])} (demo)`, person: person(), role: "Director", lane: pick(["Education Services", "Faith", "Business", "Civic"]), town: city, zone: "", zone_label: "", address: addr(), email: `letters${i + 1}.${p}@example.org`, phone: phone(70 + i), website: "", instagram: "", facebook: "", linkedin: "", booking: "", hook: "Demo lead.", edu_tie: "", why_fit: "Serves families in the area.", gatekeeper: "low", storefront: r() > 0.5, hours: "", ages: "", owned_by: "", audience: "", source: "", verified: false, notes: "", added: "Demo", flag: "", priority: pick(["A", "B", "C"]), score: Math.round(r() * 20), email_subject: "A letter for local kids (demo)", email_body: "Hi,\n\nThis is a demo email.", call_script: "Demo call script.", dm_text: "Demo message." }));
    tiers.push({ tier: "contacts", center: c.id, data: { REF_TARGETS: targets, REF_BOARD: board, BL_leads: [], BL_patch: {}, LT_contacts: letters, CENTER: { acct0: `${p}-center@example.org`, acct1: `${p}-laptops@example.org` } } });
    put("edits", `${p}-t1`, { status: "Supporter", notes: "Said yes to a table at their next event (demo).", next_step: "Send the flyer", next_date: iso(addDays(today, 4)), center: c.id });
    put("edits", `${p}-e1`, { approved: true, center: c.id });
    put("edits", `${p}-e2`, { approved: true, assess: { q1: 2, q2: 2, q3: 1, q4: 2, q5: 2 }, center: c.id });
    put("edits", `${p}-t2`, { status: "Contacted", notes: "", next_step: "Call back", next_date: iso(addDays(today, 6)), center: c.id });

    // work
    TASKS.slice(0, 4 + ci % 3).forEach(([title, section], i) => put("tasks", `${p}-tk${i + 1}`, { title, section, status: pick(["todo", "todo", "doing", "waiting", "done"]), due: iso(addDays(today, i * 2 - 1)), priority: pick(["High", "Medium", "Medium", "Low"]), notes: "", createdAt: t0, repeat: "", dow: 4, doneOn: "", fixed: false, center: c.id }));
    put("meetings", `${p}-m1`, { title: `${city} team check-in (demo)`, date: iso(addDays(today, -3)), time: "15:00", where: `${city} center`, with: "Center team", notes: "Went over the week's events.", takeaways: "Two new tabling spots confirmed.", next: "Next check-in in two weeks", createdAt: t0, center: c.id });
    put("meetings", `${p}-m2`, { title: `${city} coordinator sync (demo)`, date: iso(addDays(today, 1 + ci % 3)), time: ["10:00", "13:30", "16:00"][ci % 3], where: `${city} center`, with: "Coordinator and assistant coordinators", notes: "", takeaways: "", next: "", createdAt: t0, center: c.id });
    if (c.id === "east-hartford") {
      put("meetings", `${p}-m3`, { title: "Interval House partnership check-in (demo)", date: t0, time: "14:00", where: "Interval House, Hartford", with: "Community education team", notes: "Agenda: co-hosting a family safety workshop at the center, and flyers for the November calendar.", takeaways: "", next: "Send the November program flyer\nConfirm a workshop date in December", createdAt: t0, center: c.id });
      put("meetings", `${p}-m4`, { title: "Town hall prep (demo)", date: iso(addDays(today, 5)), time: "18:00", where: "East Hartford Public Library", with: "Volunteers", notes: "", takeaways: "", next: "", createdAt: t0, center: c.id });
    }
  });

  return { kind: "lead-hub-bundle", version: 1, label: "Demo data (made up, all 7 centers)", private: false, tiers, docs };
}

export const DEMO_CANVASS_COLLECTIONS = CANVASS;
