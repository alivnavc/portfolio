/* @ds-bundle: {"format":3,"namespace":"DesignSystem_ab24c5","components":[],"sourceHashes":{"data.js":"e3a785635394"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DesignSystem_ab24c5 = window.DesignSystem_ab24c5 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// data.js
try { (() => {
// data.js — demo content for the SonicJobs chat assistant "Julie"
window.SONIC_JOBS = [{
  id: "rn-icu",
  title: "Registered Nurse — ICU",
  company: "Sibley Memorial Hospital",
  logo: "SM",
  logoBg: "#1B4DB3",
  location: "Washington, DC",
  distance: "4 mi",
  salary: "$78k–$96k",
  type: "Full-time",
  schedule: "Day shift",
  posted: "2 days ago",
  tags: ["Veteran-friendly", "Sign-on bonus"],
  match: 96,
  proof: "23 applied this week · hiring fast"
}, {
  id: "ma-clinic",
  title: "Medical Assistant",
  company: "Johns Hopkins Community Physicians",
  logo: "JH",
  logoBg: "#0C8A6A",
  location: "Baltimore, MD",
  distance: "11 mi",
  salary: "$44k–$52k",
  type: "Full-time",
  schedule: "Mon–Fri",
  posted: "Today",
  tags: ["No experience OK", "Training provided"],
  match: 91,
  proof: "Replies in ~2 days"
}, {
  id: "pct-night",
  title: "Patient Care Technician",
  company: "Suburban Hospital",
  logo: "SH",
  logoBg: "#B5485A",
  location: "Bethesda, MD",
  distance: "8 mi",
  salary: "$41k–$49k",
  type: "Part-time",
  schedule: "Night shift",
  posted: "5 days ago",
  tags: ["Veteran-friendly", "Weekend premium"],
  match: 88,
  proof: "Only 4 spots left"
}];

// Quick-reply suggestion chips shown on the welcome screen
window.SONIC_SUGGESTIONS = [{
  id: "nursing",
  label: "Nursing jobs near me",
  icon: "briefcase"
}, {
  id: "vet",
  label: "Is this employer veteran-friendly?",
  icon: "shield"
}, {
  id: "remote",
  label: "Remote & flexible roles",
  icon: "pin"
}, {
  id: "apply",
  label: "Help me apply fast",
  icon: "bolt"
}];

// Julie's avatar photo — swap this URL for your own nurse/person image
window.JULIE_AVATAR = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=160&h=160&fit=crop&crop=faces&q=80";

// Lightweight scripted responder for the demo. Returns an array of "turns".
window.sonicRespond = function (text) {
  const t = (text || "").toLowerCase();
  if (/(veteran|vet[- ]friendly|military)/.test(t)) {
    return [{
      kind: "answer",
      title: "Veteran-friendly employers",
      body: "Yes — Sibley Memorial and Suburban Hospital are both verified veteran-friendly employers and recognize military experience (MOS/NEC/AFSC) toward role requirements. I can also translate your service record into civilian skills when you apply.",
      source: "From Johns Hopkins Medicine careers data",
      chips: ["Show veteran-friendly jobs", "Translate my MOS"]
    }];
  }
  if (/(remote|flexible|work from home|hybrid)/.test(t)) {
    return [{
      kind: "text",
      body: "Most clinical roles are on-site, but I found flexible options. Want me to filter to remote & hybrid only?",
      chips: ["Yes, remote only", "Show hybrid too"]
    }];
  }
  if (/(apply|application|1[- ]tap|fast)/.test(t)) {
    return [{
      kind: "answer",
      title: "Apply in one tap",
      body: "I can apply on your behalf — no redirects, no re-typing. I'll reuse your saved profile and answer the employer's screening questions for you. Upload a CV once and you're set for every role.",
      source: "SonicJobs 1-Tap Apply",
      chips: ["Upload my CV", "Find jobs to apply to"]
    }];
  }
  if (/(salary|pay|wage|\$|how much)/.test(t)) {
    return [{
      kind: "text",
      body: "Tell me a target — I'll only show roles that meet it. What's your minimum?",
      chips: ["$40k+", "$60k+", "$80k+"]
    }];
  }
  // default → treat as a job search
  return [{
    kind: "jobs",
    body: "Here are 3 strong matches near Washington, DC. I sorted them by how well they fit your profile.",
    jobs: window.SONIC_JOBS
  }];
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "data.js", error: String((e && e.message) || e) }); }

})();
