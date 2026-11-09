/* ============ team edition: LEAD home, sections, project board, tools & resources, the assistant ============
   tools/split_hub.py adds this file to js/app.js at build time, just before the hub starts, so every
   name the hub defines is already there. It reshapes the single-file hub for the whole team:
   - Home has four tabs: Campaign (today's numbers, then Events, Programming, Meetings and Canvassing),
     My role, Tools & resources, and How LEAD runs (the center calendar, until it's reworked).
   - Every app belongs to one section and wears that section's LEAD logo color.
   - Do now opens a project board in a pop-up, where cards slide between columns.
   - Tools & resources is also its own page: links, Drive folders, the groups, the email signature,
     training, who's who, and (for coordinators and up) the feedback people sent.
   - Calendar switches centers and keeps the center's codes behind the team password and the
     keyholder agreement.
   - Settings shows each person their level and center, and the look.
   - A small assistant in the corner searches the hub, answers quick questions, checks you in, sends
     messages to teammates, takes /feedback, and (once the owner adds a key) answers open questions.
   No personal data in here: names, numbers and links come from the team database or are LEAD's public ones. */

const TM_SECTIONS=[
  {id:"events",name:"Events",tc:"gold",apps:["events","approved","proposals"],blurb:"Where LEAD shows up, and getting ready for it"},
  {id:"programming",name:"Programming",tc:"green",apps:["programs","center"],blurb:"Classes, videos and the center calendar"},
  {id:"meetings",name:"Meetings",tc:"orange",apps:["meetings","tasks","board"],blurb:"What was decided and who does what"},
  {id:"canvassing",name:"Canvassing",tc:"blue",apps:["team","people","letters","map"],blurb:"Signatures, signers, shifts and supporters"}
];
const TM_TABS=[["campaign","Campaign"],["role","My role"],["tools","Tools & resources"]];
const TM_ROLE_APPS=["hours","log"];
const TM_TOOL_APPS=["sig","playbook","org","cultures","settings"];
const TM_RUNS=["center"];
const TM_SOCIAL=[["Website","https://ctlead.org/"],["Facebook","https://www.facebook.com/LatinosforEducationalAdvocacyandDiversity/"],["Instagram","https://www.instagram.com/ctlead/"],["LinkedIn","https://www.linkedin.com/company/CT-LEAD/"],["X","https://twitter.com/ct_lead"]];
const TM_PHONES=[["LEAD office","(860) 206-5495"],["LEAD center","(860) 519-7470"]];
const TM_ROLE_LABEL={exec:"Executive",coord:"Coordinator",asst:"Assistant Coordinator",special:"Special Assignment",canv:"Canvasser",trial:"Trial"};
const TM_LEVELS=[["exec","Executives","gold"],["coord","Coordinators","orange"],["asst","Assistant Coordinators","blue"],["special","Special Assignment","green"],["canv","Canvassers","slate"],["trial","Trial","slate"]];
const TM={presence:[],directory:[],inbox:[],sent:[],feedback:[],activity:[],roster:null,ready:false,askOpen:false,askTab:"ask",thread:[],to:null,ai:undefined};

const tmLeadish=()=>!FB||FB.owner||["exec","coord"].includes(FB.role);
const tmX=()=>(FB&&FB.x)||null;
const tmMe=()=>(FB&&FB.email)||"";
const tmCenters=()=>(FB&&FB.centers)||[{id:"east-hartford",name:"Hartford"}];
const tmCenterName=id=>{if(id==="all")return "All centers";const c=tmCenters().find(x=>x.id===id);return c?c.name:(id||"");};
const tmDemo=()=>!!(typeof REF!=="undefined"&&REF&&(REF.FACTS||[]).some(f=>f&&f.title==="About this demo"));
const tmInitials=s=>String(s||"").split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()||"?";
const tmTab=()=>TM_TABS.some(t=>t[0]===S.home.tab)?S.home.tab:"campaign";
const tmApps=ids=>ids.map(appById).filter(a=>a&&appOK(a));

/* ---------- every app gets a section and that section's color; the strip is regrouped to match ---------- */
(function tmSetupApps(){
  const sec={};TM_SECTIONS.forEach(s=>s.apps.forEach(a=>{sec[a]=s;}));
  ROWS.length=0;
  ROWS.push(["campaign","Campaign"],...TM_SECTIONS.map(s=>[s.id,s.name]),["role","My role"],["tools","Tools & resources"],["runs","How LEAD runs"]);
  APPS.push({id:"resources",row:"tools",tc:"gold",desc:"Links, Drive folders, the Facebook and WhatsApp groups, the email signature and LEAD's contacts."});
  APPS.push({id:"approved",row:"events",tc:"gold",desc:"Events LEAD said yes to that are coming up, each with its readiness checklist."});
  APPS.push({id:"guide",row:"tools",tc:"blue",desc:"How to use LEAD this week: what each part does, what to try, how to give feedback."});
  APPS.forEach(a=>{const s=sec[a.id];
    if(s){a.row=s.id;a.tc=s.tc;}
    else if(a.id==="today"){a.row="campaign";a.tc="blue";}
    else if(TM_ROLE_APPS.includes(a.id)){a.row="role";a.tc="slate";}
    else if(TM_RUNS.includes(a.id)){a.row="programming";a.tc="green";}
    else{a.row="tools";a.tc="gold";}});
  const d=id=>APPS.find(a=>a.id===id);
  if(d("center"))d("center").desc="The center's program calendar and registration, and the keyholder codes.";
  if(d("playbook"))d("playbook").desc="Training: how LEAD works, the script and facts, and the questions still open.";
  if(d("log"))d("log").desc="Your own notes: what happened, what you learned, what's blocking.";
  if(d("org"))d("org").desc="The team by level and center, and who to ask for what.";
  TITLES.resources="Tools & resources";PAGE_CONTEXT.resources="Links, files & contacts";
  TITLES.approved="Approved events";PAGE_CONTEXT.approved="Coming up, with readiness";
  TITLES.guide="How to use LEAD";PAGE_CONTEXT.guide="The demo guide";
  IC.guide='<path d="M5 4.5h8a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H5z"/><path d="M19 4.5h-3v12.5h3z"/><path d="M8 8.5h4M8 11.5h4"/>';
  IC.approved='<path d="M4 7.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M4 10.5h16M8 3.5v4M16 3.5v4"/><path d="M9 15l2 2 4-4"/>';
  TITLES.playbook="Training";PAGE_CONTEXT.playbook="Training center";
  TITLES.log="Notes";PAGE_CONTEXT.log="Your notes";
  TITLES.center="Calendar";PAGE_CONTEXT.center="Programs, registration & codes";
  PAGE_CONTEXT.today="Across your centers";
  IC.resources='<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M8 13h8M8 16h5"/>';
  // Settings and Hours are for everyone now (each person's own hours); B-LEAD deep dive stays the owner's.
  for(const k of Object.keys(VIEWS)){VIEWS[k].hide=VIEWS[k].hide.filter(t=>t!=="settings"&&t!=="hours");if(FB&&!FB.owner)VIEWS[k].hide=[...new Set([...VIEWS[k].hide,"blead"])];}
  if(S.tv==="list")S.tv="board";
  if(S.pb==="howto")S.pb="questions";          // Training opens on the question inbox
  if(!S.home.tab||!TM_TABS.some(t=>t[0]===S.home.tab))S.home.tab="campaign";
  const strip=document.getElementById("appStrip");
  if(strip){
    const btn={};strip.querySelectorAll("[data-tab]").forEach(b=>{btn[b.dataset.tab]=b;});
    if(!btn.resources){const b=document.createElement("button");b.dataset.tab="resources";b.textContent="Tools & resources";b.addEventListener("click",()=>go("resources"));btn.resources=b;}
    if(!btn.approved){const b=document.createElement("button");b.dataset.tab="approved";b.textContent="Approved events";b.addEventListener("click",()=>go("approved"));btn.approved=b;}
    if(!btn.guide){const b=document.createElement("button");b.dataset.tab="guide";b.textContent="How to use LEAD";b.addEventListener("click",()=>go("guide"));btn.guide=b;}
    ["playbook","log","center"].forEach(id=>{const b=btn[id];if(b&&b.firstChild&&b.firstChild.nodeType===3)b.firstChild.nodeValue=TITLES[id]+" ";});
    const groups=[["Campaign",["today"]],...TM_SECTIONS.map(s=>[s.name,s.apps]),["My role",TM_ROLE_APPS],["Tools & resources",["resources","guide",...TM_TOOL_APPS]]];
    const frag=document.createDocumentFragment(),used=new Set();
    for(const [name,ids] of groups){const L=ids.filter(id=>btn[id]);if(!L.length)continue;const g=document.createElement("span");g.className="grp";g.textContent=name;frag.appendChild(g);L.forEach(id=>{frag.appendChild(btn[id]);used.add(id);});}
    Object.keys(btn).filter(id=>!used.has(id)).forEach(id=>frag.appendChild(btn[id]));
    strip.innerHTML="";strip.appendChild(frag);
  }
})();

/* ---------- small helpers ---------- */
function tm24(t){                                   // "2:30 PM", "14:30", "10 am - 12 pm" → "14:30" (the start), or ""
  const m=String(t||"").trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])?\.?m?\.?/i);if(!m)return "";
  let h=+m[1];const mi=+(m[2]||0),ap=(m[3]||"").toLowerCase();if(ap==="p"&&h<12)h+=12;if(ap==="a"&&h===12)h=0;if(h>23||mi>59)return "";
  return String(h).padStart(2,"0")+":"+String(mi).padStart(2,"0");
}
function tmClock(t){const x=tm24(t);if(!x)return String(t||"");const [h,m]=x.split(":").map(Number);return (h%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(h<12?" AM":" PM");}
function tmNow(){const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");}
function tmWhen(date,time){const n=daysFromToday(date);const day=n===0?"Today":n===1?"Tomorrow":fmtDate(date);return day+(time?" · "+tmClock(time):"");}
function tmUpcoming(){const t0=todayISO(),now=tmNow();
  return S.meetings.filter(m=>m.date&&(m.date>t0||(m.date===t0&&(!tm24(m.time)||tm24(m.time)>=now))))
    .sort((a,b)=>(a.date+(tm24(a.time)||"99"))<(b.date+(tm24(b.time)||"99"))?-1:1);}
function tmNextMeeting(){return tmUpcoming()[0]||null;}
function tmMine(m){const me=tmMe(),f=(ME().first||"").toLowerCase();return !!((me&&m.by===me)||(m.mine&&m.by===me)||(f&&f.length>2&&(m.with||"").toLowerCase().split(/[^a-z]+/).includes(f)));}
function tmProgramsOn(d){
  const out=[];
  try{ctrOn(d).forEach(p=>out.push({n:p.name||p.short,t:ctrStart(p),k:"Center program"}));}catch(e){}
  S.sessions.filter(x=>x.date===d).forEach(x=>out.push({n:[x.program,x.topic].filter(Boolean).join(": ")||"Class",t:"",k:"Class"}));
  return out;
}
function tmNextEvent(){const t0=todayISO();return allE().filter(e=>e.date&&(e.date>=t0||(e.end_date&&e.end_date>=t0))).sort((a,b)=>(a.date+(tm24(a.time)||"99"))<(b.date+(tm24(b.time)||"99"))?-1:1)[0]||null;}
const tmApproved=e=>{const a=assessOf(e);return !!((S.edits[e.id]||{}).approved||["GO","GO IF IT FITS"].includes(a.decision)||rdForEvent(e.id));};
const tmProposalFormUrl=()=>((S.settings||{}).proposalForm||"").trim()||"proposal.html";
function tmSigsToday(){const t0=todayISO();return S.shifts.filter(x=>x.date===t0).reduce((a,x)=>a+(+x.sigs||0),0);}
function tmSigsByCenter(){
  const m={},add=(c,n)=>{n=+n||0;if(!n)return;c=c||"";m[c]=(m[c]||0)+n;};
  allT().forEach(x=>add(x.center,x.signatures));allE().forEach(x=>add(x.center,x.signatures));
  const po=(typeof cvPrimary==="function")?cvPrimary():"";S.shifts.filter(x=>!po||!x.org||x.org===po).forEach(x=>add(x.center,x.sigs));
  return m;
}
function tmDoNow(){
  const out=[];
  try{
    if(tabOK("tasks"))dueSoon().filter(x=>!x._done).forEach(x=>out.push({kind:"task",id:x.id,n:x.title,d:x._standing?"every "+DOW[Number(x.dow??4)]:(x.section||"Task"),date:x._date,days:x._days}));
    if(tabOK("proposals"))propDue().forEach(p=>out.push({kind:"proposal",id:p.id,n:"Review the proposal: "+propName(p),d:"Partner request",days:p.received?daysFromToday(p.received):null}));
    rdDue().forEach(({d,its})=>out.push({kind:"ready",id:d.id,n:"Get ready: "+(d.name||"Untitled event"),d:its.length?its.length+" checklist item"+(its.length===1?"":"s")+" due this week":"Event within a week",date:d.date,days:d.date?daysFromToday(d.date):null}));
    needsReport().forEach(e=>out.push({kind:"report",id:e.id,n:"Write the report: "+e.name,d:"Who you met, what came of it, who to follow up with",date:e.date,days:daysFromToday(e.date)}));
    followUps().forEach(x=>out.push({kind:"follow",id:x.id,n:x.name,d:x.next_step||"Follow up",date:x.next_date,days:x._days}));
  }catch(e){console.warn("[hub] do now",e);}
  return out;
}
const TM_KIND={task:"Task",proposal:"Proposal",ready:"Readiness",report:"Report",follow:"Follow-up"};
function tmDue(x){if(x.days===null||x.days===undefined)return "";return `<span class="${x.days<0?"late":x.days<=2?"soon":""}">${esc(x.date?fmtDate(x.date):"")}${x.date?" · ":""}${esc(rel(x.days))}</span>`;}
function tmInToday(){const t0=todayISO();let L=TM.presence.filter(p=>p.date===t0&&p.in);
  if(FB&&!tmLeadish())L=L.filter(p=>!p.center||p.center==="all"||p.center===FB.center);
  else if(FB&&FB.viewCenters&&FB.viewCenters.length&&FB.viewCenters.length<tmCenters().length)L=L.filter(p=>!p.center||p.center==="all"||FB.viewCenters.includes(p.center));
  return L;}
const tmAmIn=()=>TM.presence.some(p=>p.id===tmMe()&&p.date===todayISO()&&p.in);
async function tmCheckIn(on){
  const x=tmX();if(!x){toast("Checking in works on the team site.");return;}
  try{await x.setPresence(on);toast(on?"Checked in. Your team can see you're in today.":"Checked out.");tmLog("checkin",on?"checked in at the office":"checked out");}
  catch(e){toast("Couldn't check in: "+((e&&e.code)==="permission-denied"?"the database isn't set up for check-ins yet.":(e&&e.message)||e));}
}
function tmRepaint(){if(TM.ready&&["home","resources","org"].includes(S.tab)){if($("#overlay").innerHTML.trim())TM.dirty=true;else render();}tmAskPaint();}
(function tmWatch(){
  const x=tmX();if(!x)return;
  try{x.watchPresence(todayISO(),L=>{TM.presence=L;tmRepaint();});}catch(e){console.warn("[hub] check-ins",e);}
  try{x.watchDirectory(L=>{TM.directory=L.filter(p=>p.id!==tmMe());tmRepaint();});}catch(e){console.warn("[hub] team list",e);}
  try{x.watchInbox(L=>{TM.inbox=L;tmAskPaint();});}catch(e){console.warn("[hub] messages",e);}
  try{x.watchSent(L=>{TM.sent=L;tmAskPaint();});}catch(e){console.warn("[hub] messages",e);}
  if(x.watchFeedback){try{x.watchFeedback(L=>{TM.feedback=L;tmRepaint();});}catch(e){console.warn("[hub] feedback",e);}}
  try{x.watchActivity(L=>{TM.activity=L;tmAskPaint();});}catch(e){console.warn("[hub] activity",e);}
  try{x.joinDirectory().catch(e=>console.warn("[hub] team list entry",e&&e.code||e));}catch(e){}
  // a quiet heartbeat while the tab is open, so teammates can see who's active (like a green dot)
  const beat=()=>{if(document.visibilityState==="visible"){try{x.joinDirectory().catch(()=>{});}catch(e){}}};
  setInterval(beat,4*60*1000);document.addEventListener("visibilitychange",beat);
  try{x.listRoster().then(L=>{TM.roster=L||[];tmRepaint();}).catch(e=>{TM.roster=[];console.warn("[hub] name list",e&&e.code||e);});}catch(e){TM.roster=[];}
})();
/* One line in the team's activity feed. Short, no details that shouldn't travel. */
function tmLog(kind,text){const x=tmX();if(!x||!x.logActivity)return;try{x.logActivity({kind,text:String(text).slice(0,300)}).catch(()=>{});}catch(e){}}
const tmActive=p=>!!(p&&p.at&&Date.now()-p.at<10*60*1000);
function tmSeen(p){if(!p||!p.at)return "";const m=Math.round((Date.now()-p.at)/60000);if(m<10)return "active now";if(m<60)return `seen ${m} min ago`;const h=Math.round(m/60);if(h<24)return `seen ${h} hr ago`;return "seen "+new Date(p.at).toLocaleDateString([],{month:"short",day:"numeric"});}
const tmDot=p=>`<i class="tw-dot ${tmActive(p)?"on":""}" title="${esc(tmSeen(p))}"></i>`;
/* Everyone on the team, by level: people who have signed in, plus names from the owner's list who haven't yet. */
function tmTeam(){
  const dir=tmPeople(),roster=TM.roster||[];
  const norm=s=>String(s||"").toLowerCase().replace(/[^a-z\s]/g," ").replace(/\s+/g," ").trim();
  const seen=dir.map(p=>norm(p.name));
  const onList=r=>{const n=norm(r.name);if(!n)return true;return seen.some(s=>s===n||(n.split(" ").length===1&&s.split(" ")[0]===n));};
  return TM_LEVELS.map(([role,label,tc])=>({role,label,tc,
    in:dir.filter(p=>p.role===role).sort((a,b)=>(a.name||"").localeCompare(b.name||"")),
    pending:roster.filter(r=>r.role===role&&!onList(r)).sort((a,b)=>(a.name||"").localeCompare(b.name||""))}));
}

/* ---------- Home ---------- */
function tmHome(){
  const now=new Date(),h=now.getHours(),hello=h<12?"Good morning":h<17?"Good afternoon":"Good evening",first=ME().first;
  const tab=tmTab();
  const tabs=TM_TABS.map(([k,l])=>`<button role="tab" data-htab="${k}" aria-selected="${k===tab}" id="htab-${k}" aria-controls="hpanel">${esc(l)}</button>`).join("");
  const body=tab==="role"?tmRole():tab==="tools"?tmTools(true):tab==="runs"?tmRuns():tmCampaign();
  return `<div class="console th">
  <div class="c-top"><div><p class="c-date" id="hClock">${esc(homeClock())}</p><h1 class="c-hello">${hello}${first?", "+esc(first):""}.</h1></div></div>
  <div class="c-search">${icon("search")}<input type="search" id="hq" placeholder="Find a person, event, task or app" autocomplete="off" aria-label="Find a person, event, task or app" value="${esc(S.hq)}"><span class="hint">press <kbd>/</kbd></span><div class="results ${S.hq?"":"hide"}" id="hqres">${S.hq?homeHits(S.hq):""}</div></div>
  <div class="c-rows th-tabs" role="tablist" aria-label="Home">${tabs}</div>
  <div class="th-body" id="hpanel" role="tabpanel" aria-labelledby="htab-${tab}">${body}</div>
  ${tmFoot()}
</div>`;
}
function tmMetric(o){const tag=o.go||o.act?"button":"div";const attr=o.go?`data-go2="${o.go}"`:o.act?`data-tm="${o.act}"`:"";
  return `<${tag} ${attr} class="th-m ${o.cls||""}" style="--tc:var(--t-${o.tc||"blue"})"><span class="l">${esc(o.l)}</span><b class="num">${o.v}</b><span class="s">${o.s||""}</span></${tag}>`;}

function tmTodayPanel(){
  const st=S.settings||{},goal=st.sigGoal||500,sg=sigTotals(),pct=Math.min(1,sg.all/goal),t0=todayISO();
  const mt=S.meetings.filter(m=>m.date===t0),nx=tmNextMeeting(),pr=tmProgramsOn(t0),inn=tmInToday(),plus=tmSigsToday();
  const cards=[];
  cards.push(tmMetric({l:"Signatures so far",v:`${sg.all}<small> / ${goal}</small>`,s:`<span class="th-bar"><i style="width:${(pct*100).toFixed(1)}%"></i></span>${plus?`+${plus} logged today`:"as of today"}`,go:tabOK("team")?"team":"today",tc:"blue"}));
  if(tabOK("meetings")){
    cards.push(tmMetric({l:"Meetings today",v:mt.length,s:mt.length?esc(mt.slice(0,2).map(m=>(m.time?tmClock(m.time)+" ":"")+(m.title||"Meeting")).join(" · ")):"Nothing on the calendar",act:"mtg-today",tc:"orange"}));
  }
  if(tabOK("events")){const ne=tmNextEvent();const d=ne?parseISO(ne.date):null;
    const dn=ne?daysFromToday(ne.date):null;
    cards.push(tmMetric({l:dn!==null&&dn<0?"Happening now":"Next event",v:ne?esc(dn<=0?"Today":dn===1?"Tomorrow":MON[d.getMonth()]+" "+d.getDate()):"—",s:ne?esc((ne.name||"Event")+(ne.time?" · "+ne.time:"")+" · "+townOf(ne)+(dn<0&&ne.end_date?" · through "+fmtDate(ne.end_date):"")):"Nothing on the calendar yet",act:ne?"ev-next":"",go:ne?"":"events",tc:"gold"}));}
  cards.push(tmMetric({l:"Programs today",v:pr.length,s:pr.length?esc(pr.slice(0,3).map(p=>p.n+(p.t?" ("+p.t+")":"")).join(" · ")):"No classes or center programs today",go:tabOK("programs")?"programs":tabOK("center")?"center":"",tc:"green"}));
  cards.push(tmMetric({l:"In the office",v:tmX()?inn.length:"—",s:tmX()?(inn.length?esc(inn.slice(0,4).map(p=>(p.name||"").split(/\s+/)[0]).join(", "))+(inn.length>4?` +${inn.length-4}`:""):"Nobody checked in yet")+` · <u>${tmAmIn()?"Check out":"I'm in today"}</u>`:"Check-ins work on the team site",act:tmX()?(tmAmIn()?"out":"in"):"",tc:"gold"}));
  let byc="";
  if(FB&&tmLeadish()){
    const m=tmSigsByCenter(),keys=Object.keys(m).filter(Boolean).sort((a,b)=>m[b]-m[a]);
    if(keys.length>1)byc=`<div class="th-byc" aria-label="Signatures by center"><span class="l">By center</span>${keys.map(k=>`<span><b class="num">${m[k]}</b> ${esc(tmCenterName(k))}</span>`).join("")}</div>`;
  }
  return `<section class="th-today" aria-label="Today">
    <div class="th-h"><h2>Today</h2><span class="meta">${esc(FB?FB.centerLabel||"":"")}${tmDemo()?` <span class="pill sand">Demo data</span>`:""}</span><span class="sp"></span>${tabOK("today")?`<button class="btn sm" data-go2="today">Open Today</button>`:""}</div>
    <div class="th-ms">${cards.join("")}</div>${byc}
  </section>`;
}
function tmSectionStat(s){
  const t0=todayISO(),ws=weekStart(),we=addDays(ws,6);let stat="";
  try{
    if(s.id==="events"){const n=allE().filter(e=>e.date&&e.date>=t0&&e.date<=addDays(t0,6)).length;stat=`<b class="num">${n}</b> in the next 7 days`;}
    else if(s.id==="programming"){const n=tmProgramsOn(t0).length,c=S.sessions.filter(x=>x.date>=ws&&x.date<=we).length;stat=`<b class="num">${n}</b> today · ${c} class${c===1?"":"es"} this week`;}
    else if(s.id==="meetings"){const nx=tmNextMeeting(),open=S.tasks.filter(t=>t.status!=="done").length;stat=nx?`Next: <b>${esc(tmWhen(nx.date,nx.time))}</b>`:`<b class="num">${open}</b> open tasks`;}
    else if(s.id==="canvassing"){const sg=sigTotals();stat=`<b class="num">${sg.all}</b> signatures`;}
  }catch(e){}
  return stat;
}
function tmSectionBlock(s){
  const L=tmApps(s.apps);if(!L.length)return "";
  const cnt=id=>{const el=document.querySelector(`.appstrip [data-tab="${id}"] .cnt`);return el&&el.textContent?`<small>${esc(el.textContent)}</small>`:"";};
  return `<section class="th-sec2" style="--tc:var(--t-${s.tc})" aria-label="${esc(s.name)}">
    <div class="th-sec2-h"><span class="th-chip">${icon(L[0].id)}</span><div><h2>${esc(s.name)}</h2><p>${esc(s.blurb)}</p></div><span class="sp"></span><span class="th-stat">${tmSectionStat(s)}</span></div>
    <div class="th-icons">${L.map(a=>`<button class="tile" data-go2="${a.id}" style="--tc:var(--t-${a.tc})" title="${esc(appName(a))}"><span class="face">${tileFace(a)}</span><span class="lbl">${esc(appName(a))}${cnt(a.id)}</span></button>`).join("")}</div>
  </section>`;
}
function tmSectionCard(s){
  const L=tmApps(s.apps);if(!L.length)return "";
  const t0=todayISO(),ws=weekStart(),we=addDays(ws,6);let stat="";
  try{
    if(s.id==="events"){const n=allE().filter(e=>e.date&&e.date>=t0&&e.date<=addDays(t0,6)).length;stat=`<b class="num">${n}</b> in the next 7 days`;}
    else if(s.id==="programming"){const n=tmProgramsOn(t0).length,c=S.sessions.filter(x=>x.date>=ws&&x.date<=we).length;stat=`<b class="num">${n}</b> today · ${c} class${c===1?"":"es"} this week`;}
    else if(s.id==="meetings"){const nx=tmNextMeeting(),open=S.tasks.filter(t=>t.status!=="done").length;stat=nx?`Next: <b>${esc(tmWhen(nx.date,nx.time))}</b>`:`<b class="num">${open}</b> open tasks`;}
    else if(s.id==="canvassing"){const sg=sigTotals();stat=`<b class="num">${sg.all}</b> signatures`;}
  }catch(e){}
  const cnt=id=>{const el=document.querySelector(`.appstrip [data-tab="${id}"] .cnt`);return el&&el.textContent?`<span class="cnt">${esc(el.textContent)}</span>`:"";};
  return `<section class="th-sec" style="--tc:var(--t-${s.tc})">
    <button class="th-sec-h" data-go2="${L[0].id}"><span class="th-chip">${icon(L[0].id)}</span><span><b>${esc(s.name)}</b><small>${esc(s.blurb)}</small></span></button>
    <p class="th-stat">${stat}</p>
    <div class="th-apps">${L.map(a=>`<button data-go2="${a.id}"><span class="ic">${icon(a.id)}</span><span class="n">${esc(appName(a))}</span>${cnt(a.id)}</button>`).join("")}</div>
  </section>`;
}
function tmDoNowBlock(max){
  if(!tabOK("tasks"))return "";
  const L=tmDoNow(),n=max||7;
  return `<section class="sec th-do"><div class="h"><h2>Do now</h2>${tmDemo()?`<span class="pill sand">Demo</span>`:""}<span class="meta">${L.length} item${L.length===1?"":"s"}</span><span class="sp"></span><button class="btn sm" data-tm="board">Board</button><button class="btn sm" data-act="task-add">+ Task</button></div>
    <div class="rows">${L.slice(0,n).map(x=>`<button class="row th-do-r" data-tm="board" data-k="${x.kind}" data-id="${esc(x.id)}"><span class="kind k-${x.kind}">${TM_KIND[x.kind]}</span><span class="txt"><span class="n">${esc(x.n)}</span><span class="d">${esc(x.d||"")}</span></span><span class="r">${tmDue(x)}</span></button>`).join("")||`<p class="empty">${S.loaded.tasks?"Nothing due in the next two weeks.":ld()}</p>`}</div>
    ${L.length>n?`<div class="small" style="margin-top:8px"><button class="linkbtn" data-tm="board">See all ${L.length} on the board</button></div>`:""}
  </section>`;
}
function tmWeek(){
  const E=allE(),t0=todayISO(),days=[];for(let i=0;i<7;i++)days.push(addDays(t0,i));
  const when=t=>{const x=tm24(t);return x?tmClock(t).replace(":00",""):"";};
  const chip=e=>`<button class="wk-ev" data-open="${e.id}" style="--tc:var(--t-${TM_EV_TONE[e.event_type]||"blue"})"><span class="t">${esc(when(e.time)||(e.can_table===true?"table":""))}</span><span class="n">${esc(e.name)}</span></button>`;
  const prog=(p,dd)=>`<button class="wk-ev prog" data-ctr="${p.id}" data-d="${dd}" style="--tc:${p.color}"><span class="t">${esc(ctrStart(p).replace(":00",""))}</span><span class="n">${esc(p.short)}</span></button>`;
  return `<section class="sec th-week"><div class="h"><h2>This week</h2><span class="sp"></span>${tabOK("center")?`<button class="btn sm" data-go2="center">Calendar</button>`:""}${tabOK("events")?`<button class="btn sm ghost" data-go2="events">All events</button>`:""}</div>
    <div class="wk">${days.map((dd,i)=>{const d=parseISO(dd);const evs=E.filter(e=>e.date===dd||(e.end_date&&e.date<=dd&&e.end_date>=dd)).sort((a,b)=>(tm24(a.time)||"99")<(tm24(b.time)||"99")?-1:1);let progs=[];try{progs=ctrOn(dd);}catch(e){}
      const n=evs.length+progs.length;return `<div class="wk-day ${i===0?"today":""}"><div class="wk-h"><small>${DOW[d.getDay()]}</small><b>${d.getDate()}</b></div><div class="wk-list">${evs.slice(0,3).map(chip).join("")}${progs.slice(0,2).map(p=>prog(p,dd)).join("")}${n>5?`<button class="wk-more" data-act="week-more">+${n-5} more</button>`:""}${!n?`<span class="wk-none">—</span>`:""}</div></div>`;}).join("")}</div>
  </section>`;
}
function tmMeetingsBlock(mine){
  if(!tabOK("meetings"))return "";
  let L=tmUpcoming().filter(m=>!mine||tmMine(m)).slice(0,6);const fell=mine&&!L.length;if(fell)L=tmUpcoming().slice(0,6);
  return `<section class="sec"><div class="h"><h2>${mine&&!fell?"My meetings":"Meetings coming up"}</h2><span class="meta">${mine?(fell?"the team's, until one is flagged as yours":"yours, by name or flagged as mine"):esc(FB?FB.centerLabel||"":"")}</span><span class="sp"></span><button class="btn sm" data-act="mtg-add">+ Meeting</button><button class="btn sm ghost" data-go2="meetings">All</button></div>
    <div class="rows">${L.map(m=>`<div class="row" data-tm="mtg" data-id="${m.id}"><div><div class="n">${esc(m.title||"Meeting")}</div><div class="d">${esc([m.where,m.with].filter(Boolean).join(" · "))}${m.center&&tmLeadish()?` · ${esc(tmCenterName(m.center))}`:""}</div></div><div class="r">${esc(tmWhen(m.date,m.time))}</div></div>`).join("")||`<p class="empty">${mine?"No meetings of yours coming up. Add one and flag it as yours.":"No meetings coming up."}</p>`}</div>
  </section>`;
}
function tmCampaign(){
  return `${tmTodayPanel()}
  <div class="th-secs2">${TM_SECTIONS.map(tmSectionBlock).join("")}</div>
  ${tmWeek()}
  ${tmMeetingsBlock(false)}`;
}
function tmMeetingsTodaySheet(){const t0=todayISO(),key=m=>tm24(m.time)||"99";
  const L=S.meetings.filter(m=>m.date===t0).sort((a,b)=>key(a)<key(b)?-1:1),up=tmUpcoming().filter(m=>m.date!==t0).slice(0,5);
  const row=m=>`<div class="row" data-ms="open" data-id="${m.id}"><div><div class="n">${esc(m.title||"Meeting")}</div><div class="d">${esc([m.where,m.with?"with "+m.with:""].filter(Boolean).join(" · "))}</div></div><div class="r">${esc(m.date===t0?(m.time?tmClock(m.time):"today"):tmWhen(m.date,m.time))}</div></div>`;
  openSheet("Meetings today",`<div class="ms">${L.length?`<div class="rows">${L.map(row).join("")}</div>`:`<p class="empty">No meetings today.</p>`}${up.length?`<h3>Coming up</h3><div class="rows">${up.map(row).join("")}</div>`:""}</div>`,
    {btns:`${S.canWrite===false?"":`<button class="btn" data-ms="add">+ Meeting</button>`}<button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay").querySelectorAll("[data-ms]").forEach(b=>b.onclick=()=>{if(b.dataset.ms==="add")meetingForm();else{closeOverlay();tmMeetingSheet(b.dataset.id);}});}
function tmRole(){
  const t0=todayISO(),ws=weekStart(),we=addDays(ws,6),up=tabOK("meetings")?tmUpcoming():[];
  const myNx=up.find(tmMine)||null,nx=myNx||up[0]||null;
  const own=S.tasks.filter(t=>t.section==="My role"&&t.status!=="done"),teamOpen=S.tasks.filter(t=>t.section!=="My role"&&t.status!=="done");
  const mine=(own.length?own:teamOpen).map(t=>({...t,_x:taskDue(t)})).sort((a,b)=>(a._x.date||"9")<(b._x.date||"9")?-1:1);
  const dueNow=mine.filter(t=>t._x.days!==null&&t._x.days<=0).length;
  const cards=[];
  if(tabOK("meetings")){const day=nx?tmWhen(nx.date,""):"";cards.push(tmMetric({l:myNx?"My next meeting":"Next team meeting",v:nx?esc(nx.time?tmClock(nx.time):day):"—",s:nx?esc((nx.title||"Meeting")+(nx.time?" · "+day:"")):"Nothing scheduled",go:"meetings",tc:"orange"}));}
  cards.push(tmMetric({l:own.length?"My tasks":"Open tasks",v:mine.length,s:dueNow?`<span class="late">${dueNow} due today or late</span>`:own.length?"open, in My role":"at your center · yours show here once you add some",go:tabOK("tasks")?"tasks":"",tc:"blue"}));
  if(tabOK("hours")){const hw=S.hours.filter(x=>x.date>=ws&&x.date<=we).reduce((a,x)=>a+(+x.hours||0),0),ui=uninvoiced();
    cards.push(tmMetric({l:"Hours this week",v:Math.round(hw*10)/10,s:FB&&FB.owner?`${ui.h}h not invoiced yet ($${ui.amt})`:(hw?"logged by you":"Log your hours in Hours"),go:"hours",tc:"slate"}));}
  cards.push(tmMetric({l:"Today",v:esc(fmtDate(t0)),s:tmX()?(tmAmIn()?"You're checked in · <u>Check out</u>":"<u>I'm in the office today</u>"):"",act:tmX()?(tmAmIn()?"out":"in"):"",tc:"gold"}));
  const tiles=tmApps([...TM_ROLE_APPS,"tasks","center","sig"]);
  return `<section class="th-today"><div class="th-h"><h2>My day</h2><span class="meta">${esc([ME().title,FB&&FB.center&&FB.center!=="all"?tmCenterName(FB.center):""].filter(Boolean).join(" · "))}</span></div><div class="th-ms">${cards.join("")}</div></section>
  <div class="th-two">
    <section class="sec do"><div class="h"><h2>${own.length?"My tasks":"Open tasks"}</h2><span class="meta">${mine.length} open${own.length?"":" · the team's, until you add your own"}</span><span class="sp"></span><button class="btn sm" data-tm="my-task">+ Task</button></div>
      <div class="rows">${mine.slice(0,8).map(t=>`<div class="row static"><button class="ck" data-act="task-done" data-id="${t.id}" aria-label="Done"></button><div><div class="n" data-act="task-edit" data-id="${t.id}" style="cursor:pointer">${esc(t.title)}</div><div class="d">${esc(t.notes||"")}</div></div><div class="r">${t._x.date?esc(fmtDate(t._x.date))+"<br>"+esc(rel(t._x.days)):""}</div></div>`).join("")||`<p class="empty">Nothing on your own list. Tasks in the "My role" section only show for you.</p>`}</div>
    </section>
    ${tmMeetingsBlock(true)}
  </div>
  ${tmDoNowBlock(5)}
  ${(()=>{const tl=FB&&FB.owner?S.playbook.find(p=>tmPbIs(p,TM_PB_ROLE)):null;return tl?`<section class="sec"><div class="h"><h2>${esc(tl.title)}</h2><span class="meta">only you see this</span></div><p class="ms-notes" style="font-size:14px">${linkify(tl.body||"")}</p></section>`:"";})()}
  ${tiles.length?`<section class="sec"><div class="h"><h2>Mine</h2></div><div class="th-apps th-apps-big">${tiles.map(a=>`<button data-go2="${a.id}" style="--tc:var(--t-${a.tc})"><span class="ic">${icon(a.id)}</span><span class="n">${esc(appName(a))}</span><span class="d">${esc(a.desc)}</span></button>`).join("")}</div></section>`:""}`;
}
function tmLinkList(list,empty){return (list||[]).length?`<div class="links">${list.map(l=>l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener"><div class="n">${esc(l.name)}</div><div class="d">${esc(l.note||cmtyShortUrl(l.url))}</div></a>`:`<span class="nolink"><div class="n" style="color:var(--ink)">${esc(l.name)}</div><div class="d">${esc(l.note||"")}</div></span>`).join("")}</div>`:`<p class="empty">${empty}</p>`;}
function tmTools(onHome){
  const st=S.settings||{},edit=tmLeadish();
  const card=(id,title,desc,btn,tc)=>`<button class="th-tool" data-go2="${id}" style="--tc:var(--t-${tc||"gold"})"><span class="ic">${icon(id)}</span><span><b>${esc(title)}</b><small>${esc(desc)}</small></span><span class="go">${btn}</span></button>`;
  const fbCard=`<button class="th-tool" data-tm="feedback" style="--tc:var(--t-orange)"><span class="ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/></svg></span><span><b>Give feedback</b><small>On a training session or on this week's demo. Two minutes.</small></span><span class="go">Open ›</span></button>`;
  return `${onHome?"":`<p class="muted" style="margin:2px 0 0">Everything the team shares: links, Drive folders, the groups, training, who's who and LEAD's own pages.</p>`}
  <div class="th-tools">
    ${card("guide","How to use LEAD","The demo guide: what each part does, what to try, how to give feedback","Read it ›","blue")}
    ${tabOK("sig")?card("sig","Email signature","Your LEAD signature for Gmail, with the logo and social links","Make yours ›","blue"):""}
    ${tabOK("playbook")?card("playbook","Training","How LEAD works, the script and facts, open questions","Open ›","green"):""}
    ${tabOK("org")?card("org","Who's who","The team by level and center","Open ›","orange"):""}
    ${tabOK("cultures")?card("cultures","Cultures","Guides to the communities LEAD serves","Open ›","gold"):""}
    ${fbCard}
    ${tabOK("settings")?card("settings","Settings","Your level and center, and the look","Open ›","slate"):""}
  </div>
  ${cmtyBlock()}
  ${(()=>{const cp=S.playbook.find(p=>tmPbIs(p,TM_PB_TOOLS));return cp?`<section class="sec"><div class="h"><h2>Community partners</h2><span class="meta">warm intros and proof when pitching a new partner</span></div><p class="ms-notes" style="font-size:14px">${linkify(cp.body||"")}</p></section>`:"";})()}
  <div class="th-two">
    <section class="sec"><div class="h"><h2>Tools and files</h2><span class="sp"></span>${edit?`<button class="btn sm" data-act="links-edit">Edit</button>`:""}</div>${(()=>{const reg=(typeof CTR!=="undefined"&&CTR.center&&CTR.center.reg)?[{name:"Program registration form",url:CTR.center.reg,note:"The sign-up form for the center's programs"}]:[];const team=(st.links||[]).filter(l=>/registration|board of champions|sign.?up/i.test(l.name||""));const mine=(st.links||[]).filter(l=>!team.includes(l));const owner=!!(FB&&FB.owner);return tmLinkList(reg.concat(team),"The registration form shows here once the center's calendar is loaded.")+(owner&&mine.length?`<h3 class="ev-wk">Only you see these</h3>`+tmLinkList(mine,""):"");})()}</section>
    <section class="sec"><div class="h"><h2>Drive folders</h2><span class="sp"></span>${edit?`<button class="btn sm" data-tm="drive-edit">Edit</button>`:""}</div>${tmLinkList(st.drive,"No Drive folders yet."+(edit?" Add shared folders with Edit.":" Your coordinator adds these."))}</section>
  </div>
  ${tmFeedbackList()}`;
}
function rResources(){return tmTools(false);}
function tmRuns(){
  const L=tmApps(TM_RUNS);if(!L.length)return `<p class="empty">Nothing here for your level.</p>`;
  const a=homeApp(),idx=L.indexOf(a);let H;try{H=heroFor(a.id);}catch(e){H={figs:[],needs:[],title:"Needs you"};}
  const side=`<h3><span>${esc(H.title)}</span>${H.needs.length?`<b>${H.needs.length}</b>`:""}</h3>${H.needs.slice(0,5).map(needRow).join("")||`<p class="calm">${esc(H.calm||"Nothing waiting here. Open it to add or review.")}</p>`}${H.needs.length>5?`<div class="more"><button data-go2="${a.id}">See all ${H.needs.length} in ${esc(appName(a))} ›</button></div>`:""}`;
  return `<p class="th-note">How LEAD runs is being reworked. Training, Who's who and Cultures moved to Tools &amp; resources; the center calendar lives here for now.</p>
  <div class="c-tiles" id="hTiles" role="toolbar" aria-label="How LEAD runs apps">${L.map(x=>`<button class="tile" id="tile-${x.id}" data-tile="${x.id}" style="--tc:var(--t-${x.tc})" aria-current="${x===a}" title="${esc(appName(x))}"><span class="face">${tileFace(x)}</span><span class="lbl">${esc(appName(x))}</span></button>`).join("")}</div>
  <section class="hero" style="--tc:var(--t-${a.tc})" aria-live="polite">
    <div class="hero-main">
      <div class="hero-head"><span class="hero-ic">${tileFace(a)}</span><div><p class="hero-eb">How LEAD runs · ${idx+1} of ${L.length}</p><h2 class="hero-name">${esc(appName(a))}</h2></div></div>
      <p class="hero-desc">${esc(a.desc)}</p>
      ${H.figs.length?`<div class="hero-figs">${H.figs.map(f=>`<div><b class="num ${f.c||""}">${f.v}</b><span>${esc(f.l)}</span></div>`).join("")}</div>`:""}
      ${H.extra||""}
      <div class="hero-acts"><button class="open-btn" id="heroOpen" data-go2="${a.id}">Open ${esc(appName(a))} <kbd>Enter</kbd></button></div>
    </div>
    <div class="hero-side">${side}</div>
  </section>`;
}
/* the bottom of Home: who to call, who's who, where LEAD posts, where the files are */
function tmPeople(){const me=FB&&FB.me&&FB.me.name?[{id:tmMe(),name:FB.me.name,role:FB.role,center:FB.center,me:true}]:[];return TM.directory.concat(me);}
function tmFoot(){
  const st=S.settings||{},team=tmTeam();
  const names=r=>{const g=team.find(t=>t.role===r);return g?g.in.map(p=>p.name).concat(g.pending.map(p=>p.name)):[];};
  const ex=names("exec"),co=names("coord");
  const list=(L,empty)=>L.length?`<ul>${L.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>`:`<p class="muted small">${empty}</p>`;
  return `<footer class="th-foot" aria-label="LEAD contacts and links">
    <div><h3>Contact LEAD</h3><ul>${TM_PHONES.map(([l,p])=>`<li>${esc(l)}: <a href="tel:${p.replace(/\D/g,"")}">${esc(p)}</a></li>`).join("")}<li><a href="https://ctlead.org/" target="_blank" rel="noopener">ctlead.org</a></li></ul></div>
    <div><h3>Executives</h3>${list(ex,tmX()?"Shows up as executives sign in.":"Listed on the team site.")}</div>
    <div><h3>Coordinators</h3>${list(co,tmX()?"Shows up as coordinators sign in.":"Listed on the team site.")}</div>
    <div><h3>Follow LEAD</h3><ul>${TM_SOCIAL.map(([l,u])=>`<li><a href="${u}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join("")}${COMMUNITY.map(c=>`<li><a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.kind)}</a></li>`).join("")}</ul></div>
  </footer>`;
}
function tmDriveForm(){const st=S.settings||{};const L=st.drive||[];const slots=Array.from({length:10},(_,i)=>L[i]||{name:"",url:""});
  form({title:"Drive folders",fields:slots.flatMap((l,i)=>[{key:"n"+i,label:"Name "+(i+1)},{key:"u"+i,label:"Link",placeholder:"https://drive.google.com/…"}]),values:Object.fromEntries(slots.flatMap((l,i)=>[["n"+i,l.name],["u"+i,l.url]])),
    extra:`<p class="small muted">Shared Google Drive folders everyone on the team should be able to find. People still need access in Drive itself.</p>`,
    onSave:async v=>{const out=[];for(let i=0;i<10;i++){if(v["n"+i])out.push({name:v["n"+i],url:(v["u"+i]||"").trim()});}return write("meta","settings",{...st,drive:out});}});}

/* ---------- Today (the app): the road, Do now, who to call, this week ---------- */
rToday=function(){
  const T=allT(),st=S.settings||{},goal=st.sigGoal||500,sg=sigTotals(),pct=Math.min(1,sg.all/goal),gd=st.goalDate?daysFromToday(st.goalDate):null;
  const cn=T.filter(t=>t.status==="Prospect"&&t.priority==="High"&&(t.phone||t.email)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8);
  const road=`<div class="track"><i class="fill" style="width:${(pct*100).toFixed(1)}%"></i>${[100,250,500].map(m=>`<span class="tick ${m===goal?"end":""}" style="left:${Math.min(100,m/goal*100).toFixed(1)}%"><em>${m}</em></span>`).join("")}<b class="pin" style="left:${(pct*100).toFixed(1)}%"></b></div>`;
  return `<div class="road">
    <div><div class="big num">${sg.all}<small>of ${goal}</small></div><div class="lbl">signatures of support so far${tmDemo()?' <span class="pill sand">Demo data</span>':""}</div></div>
    <div class="days"><div class="big num">${gd===null?"—":gd}</div><div class="lbl">${st.goalDate?"days to "+fmtDate(st.goalDate):"no goal date"}</div></div>
    ${road}
    <div class="src"><span><b class="num">${sg.t}</b> from people &amp; orgs</span><span><b class="num">${sg.e}</b> at events</span><span><b class="num">${sg.l}</b> canvasser shifts</span><span><b class="num">${sg.m}</b> walk-ups / online ${tmLeadish()?`<button data-act="manual">edit</button>`:""}</span></div>
  </div>
  <div class="two">${tmDoNowBlock()}
    <section class="sec"><div class="h"><h2>Call next</h2><span class="meta">high priority, not reached, has a phone or email</span></div>
      <div class="rows">${cn.map(t=>`<div class="row" data-open="${t.id}"><div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.contact_name?t.contact_name+(t.role?", "+t.role:""):t.subtype||t.type)}</div></div><div class="r num wrap">${esc((t.phone||t.email||"").split(";")[0].trim())}</div></div>`).join("")||`<p class="empty">Everyone high-priority has been reached. Nice.</p>`}</div>
    </section>
  </div>
  ${tmWeek()}
  ${tmMeetingsBlock(false)}`;
};

/* ---------- Settings: your level and center, the look; the owner's tools underneath ---------- */
const tmOwnerSettings=rSettings;
rSettings=function(){
  const me=ME(),lead=!!(FB&&tmLeadish()),theme=document.documentElement.dataset.theme==="dark"?"dark":"light";
  const level=FB?(FB.owner?"Owner · ":"")+(FB.roleLabel||""):"Assistant Coordinator";
  const centerLine=FB?(FB.center&&FB.center!=="all"?tmCenterName(FB.center):"All centers"):"East Hartford";
  const canPick=!!(FB&&tmX()&&tmX().setCenter&&!FB.center);
  const you=`<section class="sec" style="margin-top:0"><div class="h"><h2>You</h2></div>
    <div class="ts-you"><span class="acct-av" style="width:46px;height:46px;font-size:15px">${esc(tmInitials(me.name))}</span><div><div class="ts-lv">${esc(level)}</div><div class="muted">${esc(me.name)}${FB?" · "+esc(FB.email):""}</div></div></div>
    <div class="ts-row"><b>Your center</b>${canPick?`<select id="tsCenter" data-tm="set-center"><option value="">Pick your center</option>${tmCenters().map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select>`:`<span class="pill blue">${esc(centerLine)}</span><span class="small muted">${FB?"To change it, ask the hub's owner.":""}</span>`}</div>
    ${lead&&tmX()&&tmX().setViewCenters?`<div class="ts-row" style="align-items:flex-start;flex-direction:column"><b>Centers to show</b><div class="ts-cents">${tmCenters().map(c=>`<label><input type="checkbox" data-tm-cent value="${c.id}" ${!FB.viewCenters.length||FB.viewCenters.includes(c.id)?"checked":""}> ${esc(c.name)}</label>`).join("")}</div><div class="ts-row"><button class="btn sm" data-tm="cents-all">All</button><button class="btn sm pri" data-tm="cents-save">Show these</button><span class="small muted" id="tsNote" role="status"></span></div></div>`:""}
  </section>`;
  const look=`<section class="sec"><div class="h"><h2>Look</h2></div><div class="ts-row"><div class="ts-seg" role="group" aria-label="Theme"><button data-tm="theme" data-v="light" aria-pressed="${theme==="light"}">Light</button><button data-tm="theme" data-v="dark" aria-pressed="${theme==="dark"}">Dark</button></div>${FB&&FB.views.length>1?viewSelect("light"):""}</div><p class="small muted" style="margin-top:8px">The hub remembers your choice on this device.</p></section>`;
  let owner="";
  if(FB&&FB.owner){owner=`<h3 style="margin:26px 0 -16px">Owner tools</h3>`+tmOwnerSettings().replace(/<section class="sec" style="margin-top:0">[\s\S]*?<\/section>/,"");}
  else if(!FB)owner=tmOwnerSettings().replace(/<section class="sec" style="margin-top:0">[\s\S]*?<\/section>/,"");
  return you+look+owner;
};

/* ---------- Who's who: the team by level, from the team list and the owner's name list ---------- */
const tmOwnerOrg=rOrg;
rOrg=function(){
  const x=tmX();
  if(x&&TM.roster===null){TM.roster=[];x.listRoster().then(L=>{TM.roster=L||[];if(S.tab==="org")render();}).catch(e=>{console.warn("[hub] name list",e&&e.code||e);});}
  const card=(p,pending)=>`<div class="tw-p ${pending?"pending":""}"><span class="tw-av">${esc(tmInitials(p.name))}${pending?"":tmDot(p)}</span><div style="min-width:0"><b>${esc(p.name)}${p.me?" (you)":""}</b><small>${esc([p.center?tmCenterName(p.center):"",pending?"hasn't signed in yet":tmSeen(p)].filter(Boolean).join(" · "))}</small></div>${!pending&&!p.me&&x?`<button class="btn sm" data-tm="msg" data-id="${esc(p.id)}" data-name="${esc(p.name)}">Message</button>`:""}</div>`;
  const levels=tmTeam().map(g=>{if(!g.in.length&&!g.pending.length)return "";
    return `<section class="tw-lv" style="--tc:var(--t-${g.tc})"><h3><i></i>${esc(g.label)}<span class="muted" style="font-weight:500;text-transform:none;letter-spacing:0">${g.in.length+g.pending.length}</span></h3><div class="tw-grid">${g.in.map(p=>card(p,false)).join("")}${g.pending.map(r=>card(r,true)).join("")}</div></section>`;}).join("");
  const intro=`<p class="muted small" style="margin:2px 0 0">The team by level, from the owner's list. A green dot means they have LEAD open right now. Tap Message to send someone a note through the assistant.</p>`;
  const mine=FB&&FB.owner?`<h3 style="margin:28px 0 6px">Who to ask for what</h3>`+tmOwnerOrg():"";
  return intro+(levels||`<p class="empty">${x?"Nobody is on the team list yet. People appear here as they sign in.":"The team list lives on the team site."}</p>`)+mine;
};

/* ---------- Calendar: the center's programs and registration, and the keyholder codes ---------- */
S.cal={center:"",codes:null};
function tmCalCenter(){if(S.cal.center)return S.cal.center;const f=FB?(FB.center&&FB.center!=="all"?FB.center:(FB.viewCenters&&FB.viewCenters[0])||"east-hartford"):"east-hartford";return f;}
rCenter=function(){
  const c=tmCalCenter(),has=c==="east-hartford";          // the built-in program calendar is East Hartford's
  const sel=`<div class="cs-bar"><label class="sr" for="calCenter">Center</label><select id="calCenter" data-tm="cal-center">${tmCenters().map(x=>`<option value="${x.id}" ${x.id===c?"selected":""}>${esc(x.name)}</option>`).join("")}</select><span class="muted small">${has?"Programs, registration and the keyholder codes":"No calendar for this center yet. Each center's programs are added separately."}</span></div>`;
  return sel+(has?rCtrCal()+tmCodes(c):`<p class="empty">Nothing here yet for ${esc(tmCenterName(c))}.</p>`);
};
function tmCodes(center){
  const C=S.cal.codes&&S.cal.codes.center===center?S.cal.codes:null;
  const tiles=[["door","Door lockbox","Lockbox PIN at the door","orange"],["wifi","Wi-Fi","Password for the center network","blue"],["mac","Laptop & iCloud","Center laptop and desktop","violet"],["cart","Computer cart","Shared laptops on the cart","green"]];
  if(!C)return `<section class="ct"><div class="cs-lock"><span class="ct-ic">${CT_ICONS.door}</span><div><b>Door, Wi-Fi and computer codes</b><div class="small muted">For keyholders at this center. You'll type the team password and confirm you signed the keyholder agreement.</div></div><span class="sp"></span><button class="btn pri" data-tm="codes-open">Show the codes</button></div></section>`;
  const L=tiles.filter(([k])=>C.codes[k]);
  return `<section class="ct"><div class="cs-lock"><span class="ct-ic">${CT_ICONS.door}</span><div><b>Codes for ${esc(tmCenterName(center))}</b><div class="small muted">Shown on this screen only. They disappear when you leave the page.</div></div><span class="sp"></span><button class="btn" data-tm="codes-hide">Hide</button></div>
    <div class="ct-grid">${L.map(([k,n,sub,tone])=>`<div class="ct-tile tone-${tone}"><span class="ct-ic">${CT_ICONS[k]}</span><span class="t">${esc(n)}</span><span class="l">${esc(sub)}</span><span class="ct-code"><code>${esc(C.codes[k])}</code><button class="btn sm" data-tm="copy" data-v="${esc(C.codes[k])}">Copy</button></span></div>`).join("")||`<p class="empty">No codes were added for this center.</p>`}</div></section>`;
}
async function tmDecrypt(doc,pw){
  const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(doc.salt),iterations:doc.it||600000,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
  const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(doc.iv)},key,b64(doc.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
function tmCodesOpen(center){
  const x=tmX();
  openSheet("Keyholder codes",`<div class="cs-gate"><p class="small muted" style="margin:0 0 10px">These codes are for keyholders at ${esc(tmCenterName(center))}. Type the team password and confirm the agreement; the codes show on the Calendar page until you leave it.</p>
    <label for="csPw" class="small" style="font-weight:600;display:block;margin-bottom:4px">Team password</label><input type="password" id="csPw" autocomplete="current-password">
    <label class="ck"><input type="checkbox" id="csAgree"> I signed the keyholder agreement and I won't share these codes.</label><div class="cs-err" id="csErr" role="alert"></div></div>`,
    {btns:`<button class="btn pri" id="csGo">Show the codes</button><button class="btn ghost" data-close="1">Cancel</button>`});
  const go=$("#csGo"),pw=$("#csPw"),ag=$("#csAgree"),er=$("#csErr");pw.focus();
  const run=async()=>{
    if(!ag.checked){er.textContent="Tick the box first.";return;}
    if(!pw.value){er.textContent="Type the team password.";pw.focus();return;}
    go.disabled=true;go.textContent="Checking…";er.textContent="";
    try{
      if(!x)throw Object.assign(new Error("offline"),{none:true});
      const doc=await x.getCodes(center);if(!doc||!doc.ct)throw Object.assign(new Error("none"),{none:true});
      const codes=await tmDecrypt(doc,pw.value);
      S.cal.codes={center,codes};closeOverlay();render();toast("Codes shown. Hide them when you're done.");
    }catch(e){
      go.disabled=false;go.textContent="Show the codes";
      er.textContent=e&&e.none?"No codes have been added for this center yet.":(e&&e.code==="permission-denied")?"Your level can't see this center's codes.":"That password didn't work. Check it and try again.";
      pw.select();
    }
  };
  go.onclick=run;pw.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();run();}};
}
const tmGo=go;
go=function(tab,keep){if(tab!=="center")S.cal.codes=null;return tmGo(tab,keep);};

/* ---------- Meetings: a time, and "mine" ---------- */
meetingForm=function(m){const isNew=!m;m=m||{};
  form({title:isNew?"New meeting":"Edit meeting",fields:[{key:"title",label:"What it is",required:true,wide:true},{key:"date",label:"Date",type:"date",default:todayISO()},{key:"time",label:"Time",placeholder:"2:00 PM"},{key:"mine",label:"Whose",type:"select",options:[["","The team's"],["1","Mine"]]},{key:"with",label:"With"},{key:"where",label:"Where",wide:true},{key:"notes",label:"Notes",type:"textarea",rows:5,wide:true},{key:"takeaways",label:"Takeaways (one per line)",type:"textarea",rows:3,wide:true},{key:"next",label:"Next steps (one per line)",type:"textarea",rows:3,wide:true}],
    values:{...m,mine:m.mine?"1":""},
    onSave:async v=>{const ok=await write("meetings",m.id||uid("m"),{...m,...v,mine:v.mine==="1",by:m.by||tmMe(),createdAt:m.createdAt||todayISO()});if(ok)tmLog("meeting",`${isNew?"added":"updated"} the meeting "${v.title}"${v.date?" for "+fmtDate(v.date):""}`);return ok;},onDelete:isNew?null:()=>remove("meetings",m.id)});};

/* ---------- the project board (Do now → pop-up) ---------- */
S.pm={focus:"",back:false};
function tmBoard(focus){
  if(focus!==undefined)S.pm.focus=focus||"";
  const ov=$("#overlay"),keepScroll=ov.querySelector(".pm-board")?ov.querySelector(".pm-board").scrollLeft:0;
  const t0=todayISO(),cut=addDays(t0,-14);
  const T=S.tasks.filter(t=>t.status!=="done"||(t.doneAt&&t.doneAt>=cut));
  const others=tmDoNow().filter(x=>x.kind!=="task");
  const card=t=>{const x=taskDue(t),i=TSTATUS.findIndex(s=>s[0]===(t.status||"todo"));return `<div class="pm-card ${t.id===S.pm.focus?"focus":""} ${x.days!==null&&x.days<0&&t.status!=="done"?"late":""}" draggable="true" data-pmid="${t.id}" tabindex="0">
      <div class="t">${esc(t.title)}</div>
      <div class="m">${t.section?`<span>${esc(t.section)}</span>`:""}${x.date?`<span>${esc(fmtDate(x.date))}</span>`:""}${t.waitingOn?`<span>waiting on ${esc(t.waitingOn)}</span>`:""}${t.priority==="High"?`<span class="hi">High</span>`:""}</div>
      <div class="mv"><button data-pmmv="-1" ${i<=0?"disabled":""} aria-label="Move left">‹</button><button data-pmopen aria-label="Open the task">Open</button><button data-pmmv="1" ${i>=TSTATUS.length-1?"disabled":""} aria-label="Move right">›</button></div>
    </div>`;};
  ov.innerHTML=`<div class="modal pm-modal" id="modal"><div class="sheet pm-sheet" role="dialog" aria-modal="true" aria-labelledby="pmTitle">
    <div class="pm-head"><h2 id="pmTitle">Project board</h2>${tmDemo()?`<span class="pill sand">Demo</span>`:""}<span class="meta">Drag cards between columns, or use ‹ ›</span><span class="sp"></span><button class="btn sm pri" data-pm="add">+ Task</button>${tabOK("tasks")?`<button class="btn sm" data-pm="tasks">All tasks</button>`:""}<button class="btn sm ghost" data-close="1">Close</button></div>
    <div class="pm-board">${TSTATUS.map(([k,l])=>{const L=T.filter(t=>(t.status||"todo")===k).sort(taskSort);return `<div class="pm-col" data-col="${k}"><h3>${esc(l)}<span class="num">${L.length}</span></h3><div class="pm-cards">${L.map(card).join("")||`<p class="pm-empty">Nothing here</p>`}</div></div>`;}).join("")}</div>
    ${others.length?`<div class="pm-also"><h3>Also waiting on you</h3><div class="pm-also-l">${others.map(x=>`<div class="pm-o"><span class="kind k-${x.kind}">${TM_KIND[x.kind]}</span><span class="n">${esc(x.n)}</span>${tmDue(x)}<span class="sp"></span><button class="btn sm" data-pmo="open" data-k="${x.kind}" data-id="${esc(x.id)}">Open</button><button class="btn sm" data-pmo="track" data-k="${x.kind}" data-id="${esc(x.id)}">Put on the board</button></div>`).join("")}</div></div>`:""}
  </div></div>`;
  const b=ov.querySelector(".pm-board");if(b)b.scrollLeft=keepScroll;
  $("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeOverlay();});
  ov.querySelectorAll("[data-close]").forEach(x=>x.addEventListener("click",closeOverlay));
  const move=async(id,to)=>{const t=S.tasks.find(x=>x.id===id);if(!t||!to||t.status===to)return;S.pm.focus=id;const ok=await write("tasks",id,{...t,status:to,doneAt:to==="done"?todayISO():""});if(ok){tmLog("task",`moved "${t.title}" to ${(TSTATUS.find(s=>s[0]===to)||[])[1]||to}`);tmBoard();}};
  ov.querySelectorAll(".pm-card").forEach(c=>{
    c.addEventListener("dragstart",e=>{c.classList.add("dragging");e.dataTransfer.setData("text/plain",c.dataset.pmid);e.dataTransfer.effectAllowed="move";});
    c.addEventListener("dragend",()=>c.classList.remove("dragging"));
    c.addEventListener("click",e=>{const mv=e.target.closest("[data-pmmv]");if(mv){const t=S.tasks.find(x=>x.id===c.dataset.pmid);const i=TSTATUS.findIndex(s=>s[0]===(t&&t.status||"todo"))+Number(mv.dataset.pmmv);if(TSTATUS[i])move(c.dataset.pmid,TSTATUS[i][0]);return;}
      const t=S.tasks.find(x=>x.id===c.dataset.pmid);if(t){S.pm.back=true;taskForm(t);}});
    c.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const t=S.tasks.find(x=>x.id===c.dataset.pmid);if(t){S.pm.back=true;taskForm(t);}}});
  });
  ov.querySelectorAll(".pm-col").forEach(col=>{
    col.addEventListener("dragover",e=>{e.preventDefault();col.classList.add("over");});
    col.addEventListener("dragleave",e=>{if(!col.contains(e.relatedTarget))col.classList.remove("over");});
    col.addEventListener("drop",e=>{e.preventDefault();col.classList.remove("over");move(e.dataTransfer.getData("text/plain"),col.dataset.col);});
  });
  ov.querySelectorAll("[data-pm]").forEach(x=>x.addEventListener("click",()=>{if(x.dataset.pm==="add"){S.pm.back=true;taskForm(null,{status:"todo"});}else{closeOverlay();go("tasks");}}));
  ov.querySelectorAll("[data-pmo]").forEach(x=>x.addEventListener("click",async()=>{
    const it=tmDoNow().find(y=>y.kind===x.dataset.k&&String(y.id)===x.dataset.id);if(!it)return;
    if(x.dataset.pmo==="open"){closeOverlay();tmOpenItem(it);return;}
    const ok=await write("tasks",uid("tk"),{title:it.n,section:"Other",status:"todo",due:it.date||"",priority:"Medium",repeat:"",dow:4,waitingOn:"",linkText:it.kind==="follow"||it.kind==="report"?it.n:"",subtasks:[],notes:it.d||"",doneOn:"",createdAt:todayISO(),doneAt:""});
    if(ok){toast("On the board");tmLog("task",`put "${it.n}" on the board`);tmBoard();}
  }));
  const f=ov.querySelector(".pm-card.focus");if(f)f.scrollIntoView({block:"nearest",inline:"center"});
}
function tmOpenItem(x){
  if(x.kind==="task"){const t=S.tasks.find(y=>y.id===x.id);if(t)taskForm(t);}
  else if(x.kind==="proposal")goProp(x.id);
  else if(x.kind==="ready")rdOpen(x.id,"");
  else openDetail(x.id);
}
/* come back to the board after editing a card from it */
const tmCloseOverlay=closeOverlay;
closeOverlay=function(){tmCloseOverlay();if(TM.dirty){TM.dirty=false;if(["home","resources","org"].includes(S.tab))render();}if(S.pm&&S.pm.back){S.pm.back=false;setTimeout(()=>{if(!$("#overlay").innerHTML.trim())tmBoard();},0);}};

/* ---------- Home navigation: the tabs, and the How LEAD runs tiles ---------- */
homeApp=function(){const L=tmApps(TM_RUNS);return L.find(a=>a.id===S.home.runs)||L[0];};
homePick=function(id){S.home.runs=id;homeSave();render();};
homeOpen=function(){if(tmTab()!=="runs")return;const a=homeApp();if(a)go(a.id);};
homeMove=function(dx,dy){
  const i=TM_TABS.findIndex(t=>t[0]===tmTab());
  if(dy||tmTab()!=="runs"){const n=TM_TABS[Math.max(0,Math.min(TM_TABS.length-1,i+(dy||dx)))][0];if(n!==tmTab()){S.home.tab=n;homeSave();render();const b=document.getElementById("htab-"+n);if(b)b.focus();}return;}
  const L=tmApps(TM_RUNS);let j=L.indexOf(homeApp())+dx;j=Math.max(0,Math.min(L.length-1,j));if(L[j])homePick(L[j].id);
};
rHome=tmHome;

const tmHomeBind=homeBind;
homeBind=function(v){tmHomeBind(v);TM.ready=true;tmBind(v);};
function tmBind(v){
  v.querySelectorAll("[data-htab]").forEach(b=>b.addEventListener("click",()=>{S.home.tab=b.dataset.htab;homeSave();render();}));
  const tq=v.querySelector("#tqIn");if(tq)tq.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();tmAskQuestion(v);}});
  v.querySelectorAll("select[data-tm]").forEach(sel=>sel.addEventListener("change",async()=>{const a=sel.dataset.tm;
    if(a==="cal-center"){S.cal.center=sel.value;S.cal.codes=null;render();}
    else if(a==="set-center"&&sel.value){const x=tmX();try{await x.setCenter(sel.value);toast("Center saved");location.reload();}catch(e){toast("Couldn't save your center: "+((e&&e.message)||e));}}
  }));
  v.querySelectorAll("button[data-tm],a[data-tm],div[data-tm]").forEach(b=>b.addEventListener("click",async e=>{const a=b.dataset.tm;if(e.target.closest("[data-stop]"))return;
    if(a==="board"){e.preventDefault();tmBoard(b.dataset.k==="task"?b.dataset.id:"");}
    else if(a==="in"||a==="out")tmCheckIn(a==="in");
    else if(a==="drive-edit")tmDriveForm();
    else if(a==="my-task")taskForm(null,{section:"My role",status:"todo"});
    else if(a==="feedback")tmFeedback();
    else if(a==="codes-open")tmCodesOpen(tmCalCenter());
    else if(a==="codes-hide"){S.cal.codes=null;render();}
    else if(a==="copy")copyText(b.dataset.v,"Copied");
    else if(a==="theme"){setTheme(b.dataset.v);render();}
    else if(a==="msg"){TM.to={id:b.dataset.id,name:b.dataset.name};TM.askTab="ask";tmAskToggle(true);tmSay("bot",`Writing to <b>${esc(b.dataset.name)}</b>. Type your message and press Send.`);}
    else if(a==="mtg")tmMeetingSheet(b.dataset.id);
    else if(a==="mtg-today")tmMeetingsTodaySheet();
    else if(a==="sig-unlock")tmSignersGate();
    else if(a==="tk-toggle"){const c=b.closest(".tk");const on=c.classList.toggle("open");b.setAttribute("aria-expanded",String(on));}
    else if(a==="ev-next"){const ne=tmNextEvent();if(ne)openDetail(ne.id);}
    else if(a==="rd"){const id=b.dataset.id;const d=rdForEvent(id);if(d)rdOpen(d.id);else rdCreate(id);}
    else if(a==="approve"){const id=b.dataset.id,on=b.dataset.on==="1";const ok=await saveEdit(id,{approved:!on});if(ok!==false){toast(on?"Taken off the approved list":"Approved");tmLog("event",(on?"took \"":"approved \"")+(getRec(id)||{}).name+"\""+(on?"\" off the approved list":""));}}
    else if(a==="mtg-next"){const nx=tmNextMeeting();if(nx)tmMeetingSheet(nx.id);}
    else if(a==="q-ask")tmAskQuestion(v);
    else if(a==="q-answer")tmAnswerQuestion(b.dataset.id);
    else if(a==="q-howto")tmQuestionToHowto(b.dataset.id);
    else if(a==="prog")tmProgramSheet(b.dataset.id);
    else if(a==="rd-submit")tmRdSubmit(b.dataset.id);
    else if(a==="rd-print")window.print();
    else if(a==="cents-all")v.querySelectorAll("[data-tm-cent]").forEach(c=>{c.checked=true;});
    else if(a==="cents-save"){const list=[...v.querySelectorAll("[data-tm-cent]")].filter(c=>c.checked).map(c=>c.value),note=v.querySelector("#tsNote");if(!list.length){note.textContent="Pick at least one center.";return;}b.disabled=true;note.textContent="Saving…";try{await tmX().setViewCenters(list);location.reload();}catch(er){b.disabled=false;note.textContent="Couldn't save: "+((er&&er.message)||er);}}
  }));
}

/* ---------- Events as tiles ---------- */
const TM_EV_EMOJI={Meeting:"🤝",Workshop:"🛠️",Festival:"🎉",Other:"📌",Hearing:"🏛️",Family:"👨‍👩‍👧",Holiday:"🎊",Networking:"🥂",Sports:"🏀","Open House":"🏠",Expo:"🏷️",Fundraiser:"💛",Forum:"🎤",Worship:"⛪",Service:"🤲",Fair:"🎪",Gala:"✨",Market:"🧺",Parade:"🎺",Concert:"🎶",Health:"🩺"};
const TM_EV_TONE={Meeting:"blue",Workshop:"green",Festival:"gold",Other:"slate",Hearing:"indigo",Family:"orange",Holiday:"plum",Networking:"violet",Sports:"teal","Open House":"sky",Expo:"brick",Fundraiser:"gold",Forum:"indigo",Worship:"violet",Service:"pine",Fair:"gold",Gala:"plum",Market:"green"};
function tmEventEmoji(e){const n=((e.name||"")+" "+(e.venue||"")).toLowerCase();
  const by=[["library","📚"],["church|parish|iglesia|temple|mosque|ministr","⛪"],["school|academy|pta|college","🏫"],["market|farmers","🧺"],["town hall|council|hearing|board of ed|legislat","🏛️"],["parade","🎺"],["concert|music|jazz|salsa|dance","🎶"],["health|clinic|wellness|vaccine","🩺"],["food|dinner|lunch|breakfast|potluck|cook|feast","🍲"],["job|career|hiring","💼"],["clean|park|garden|tree|trail","🌳"],["basketball|soccer|baseball|tournament|\\b5k\\b|race","🏀"],["toy|holiday|thanksgiving|christmas|navidad|turkey","🎁"],["art|paint|craft|mural","🎨"],["movie|film","🎬"],["youth|teen|kids|family|back.to.school","👨‍👩‍👧"],["gala|awards|celebration|anniversary","✨"],["vote|election|civic|forum","🗳️"],["fair|expo|festival|fest\\b","🎪"]];
  for(const [re,em] of by)if(new RegExp(re).test(n))return em;
  return TM_EV_EMOJI[e.event_type]||"📅";}
function tmEventTile(e){const t0=todayISO(),dn=daysFromToday(e.date),d=e.date?parseISO(e.date):null;
  const a=assessOf(e);const pills=[rdPill(e).replace("<br>",""),hasDebrief(e)?`<span class="pill green">notes done</span>`:"",a.decision?`<span class="pill ${a.cls==="go"?"green":a.cls==="fit"?"blue":a.cls==="hold"?"orange":"red"}">${a.decision==="GO IF IT FITS"?"if it fits":a.decision.toLowerCase()}</span>`:"",e.can_table===true?`<span class="pill green">table</span>`:e.can_table===false?"":`<span class="pill sand">table?</span>`].filter(Boolean).join("");
  return `<button class="ev-tile" data-open="${e.id}" style="--tc:var(--t-${TM_EV_TONE[e.event_type]||"blue"})">
    <span class="ev-em">${tmEventEmoji(e)}</span>
    <span class="ev-when">${d?`<b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small>`:`<small>TBD</small>`}</span>
    <span class="ev-body"><b class="ev-n">${esc(e.name)}${e.added?' <span class="pill blue">new</span>':""}</b><span class="ev-s">${esc([e.time,e.venue||townOf(e)].filter(Boolean).join(" · "))}</span><span class="ev-s">${esc([e.event_type,e.host].filter(Boolean).join(" · "))}${dn!==null&&dn>=0&&dn<=7?` <em>${esc(rel(dn))}</em>`:""}</span><span class="ev-pills">${pills}${e.signatures?`<span class="pill grey">${e.signatures} sigs</span>`:""}</span></span>
  </button>`;}
rEvents=function(){
  const f=S.ef,t0=todayISO();let E=allE();
  const towns=[...new Set(E.map(townOf))].filter(Boolean).sort(),types=[...new Set(E.map(e=>e.event_type).filter(Boolean))].sort();
  E=E.filter(e=>(!f.town||townOf(e)===f.town)&&(!f.etype||e.event_type===f.etype)&&(f.table===""||(f.table==="yes"?e.can_table===true:f.table==="maybe"?e.can_table==null:e.can_table===false))&&(!f.q||[e.name,e.venue,e.host,e.town,e.address,e.notes,e.why,e.event_type].join(" ").toLowerCase().includes(f.q))&&(f.past||!e.date||e.date>=t0||(e.end_date&&e.end_date>=t0)));
  E.sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  const groups=[];E.forEach(e=>{const wk=weekKey(e.date);let g=groups[groups.length-1];if(!g||g.wk!==wk){g={wk,L:[]};groups.push(g);}g.L.push(e);});
  return `<div class="toolrow ev-tools">
    <div class="chips"><button class="chip" data-ef="table" data-v="" aria-pressed="${f.table===""}">All</button><button class="chip" data-ef="table" data-v="yes" aria-pressed="${f.table==="yes"}">Can table</button><button class="chip" data-ef="table" data-v="maybe" aria-pressed="${f.table==="maybe"}">Ask about a table</button><button class="chip" data-ef="past" data-v="${f.past?"":"1"}" aria-pressed="${!!f.past}">Past too</button></div>
    <select data-ef="town"><option value="">Any town</option>${towns.map(c=>`<option ${f.town===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-ef="etype"><option value="">Any kind</option>${types.map(c=>`<option ${f.etype===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <span class="sp"></span><span class="small muted">${E.length}</span>${tmLeadish()?`<button class="btn sm" data-act="report-sheet">Event report</button>`:""}</div>
  ${groups.map(g=>`<h3 class="ev-wk">${g.wk?"Week of "+esc(fmtDate(g.wk,true)):"No date yet"}</h3><div class="ev-grid">${g.L.map(tmEventTile).join("")}</div>`).join("")||`<p class="empty">No events match.</p>`}`;
};

/* ---------- the event pop-up: the basics up top; status, notes and the report folded away ---------- */
S.evMore={};
const tmOpenDetail0=openDetail;
openDetail=function(id,keep){tmOpenDetail0(id,keep);
  try{const dr=$("#overlay .drawer"),ed=dr&&dr.querySelector(".edit");const r=getRec(id);if(!ed||!r||!isEvent(r)||ed.closest("details.ev-more"))return;
    const rdBox=dr.querySelector(".rd-dr");
    if(!tmApproved(r)&&r.date&&r.date>=todayISO()){const box=document.createElement("div");box.className="rd-dr ev-prop";box.innerHTML=`<div><h3>Needs approval first</h3><div class="small muted">An event LEAD hasn't said yes to yet. Send the proposal; once it's approved, the readiness checklist opens here.</div></div><a class="btn sm pri" href="${esc(tmProposalFormUrl())}" target="_blank" rel="noopener">Submit a proposal</a>`;if(rdBox)rdBox.replaceWith(box);else ed.parentNode.insertBefore(box,ed);}
    const det=document.createElement("details");det.className="ev-more";det.open=!!S.evMore[id];
    det.innerHTML=`<summary><span>More: status, notes and the after-event report</span><small>${FB&&FB.owner?"and your assessment tools":""}</small></summary>`;
    ed.parentNode.insertBefore(det,ed);det.appendChild(ed);det.addEventListener("toggle",()=>{S.evMore[id]=det.open;});
    if(!(FB&&FB.owner)){ed.querySelectorAll(".assess,.ai").forEach(x=>{x.style.display="none";});ed.querySelectorAll("h3").forEach(h=>{if(/worth the time/i.test(h.textContent))h.style.display="none";});}
  }catch(e){}};

/* ---------- "LEAD was updated": open tabs get told when a new build is live ---------- */
(function tmVersionWatch(){
  const src=(document.querySelector('script[src*="gate.js?v="]')||{}).src||"",cur=(src.match(/v=(\d+)/)||[])[1];if(!cur)return;let shown=false;
  async function check(){if(shown||document.visibilityState!=="visible")return;try{const t=await (await fetch(location.pathname||"/",{cache:"no-store"})).text();const m=t.match(/gate\.js\?v=(\d+)/);if(m&&m[1]!==cur){shown=true;tmUpdateBanner();}}catch(e){}}
  setInterval(check,5*60*1000);document.addEventListener("visibilitychange",()=>setTimeout(check,800));
})();
function tmUpdateBanner(){if(document.getElementById("updBar"))return;const b=document.createElement("div");b.id="updBar";b.className="upd-bar";b.setAttribute("role","status");
  b.innerHTML=`<span>LEAD was updated.</span><button class="btn sm pri" id="updGo">Refresh</button><button class="btn sm ghost" id="updNo" aria-label="Later">Later</button>`;document.body.appendChild(b);
  b.querySelector("#updGo").onclick=()=>location.reload();b.querySelector("#updNo").onclick=()=>b.remove();}

/* ---------- How to use LEAD: the demo guide, inside the app ---------- */
function rGuide(){
  const lead=tmLeadish(),owner=!!(FB&&FB.owner);
  const go2=(id,label)=>tabOK(id)||id==="home"?`<button class="btn sm" data-go2="${id}">${esc(label||TITLES[id]||id)}</button>`:"";
  const sec=(title,body)=>`<section class="gd-sec"><h2>${esc(title)}</h2>${body}</section>`;
  const li=items=>`<ul class="gd-list">${items.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  return `<div class="gd">
  <div class="gd-hero"><img src="img/lead-logo.png" alt="LEAD" class="gd-logo"><div><h1>How to use LEAD</h1><p>The team's hub for ${esc(FB&&FB.centerLabel||"your center")}: what's happening, what's due, who's doing what, and how LEAD runs. Tap any button to jump there.</p><div class="chips" style="margin-top:10px"><a class="btn sm pri" href="https://claude.ai/artifact/EpCCenW6LpkZXFbcUHkfpE" target="_blank" rel="noopener">Open the screenshot walkthrough ↗</a></div></div></div>
  ${sec("Getting in",li([
    "Open <b>lead.thebiggercanvas.com</b>. Type the team password your coordinator gave you (tick <i>keep this device unlocked</i> on your own phone or laptop, not on a shared computer), then <b>Continue with Google</b>.",
    "First time: you'll see <i>Waiting to be let in</i>. The owner lets you in from the owner page; the page opens by itself when that happens.",
    "Assistant coordinators pick their center once. Coordinators and executives pick which centers to look at under <b>Settings</b>.",
    "Signing out locks the device again. The ‹ LEAD button at the top left always goes back."]))}
  ${sec("Home",li([
    "<b>Campaign</b>: today's numbers (signatures, meetings today, the next event, programs today, who's in the office), then the four sections as icons, then <b>This week</b> and the meetings coming up. Tap <i>Meetings today</i> or <i>Next event</i> for a pop-up. Tap <i>I'm in today</i> to check in.",
    "<b>My role</b>: your next meeting, your tasks, your hours this week, check-in, <b>Do now</b> with the board, and your own tools.",
    "<b>Tools & resources</b>: this guide, the email signature, Training, Who's who, Cultures, feedback, Settings, the groups, partners, the registration form and Drive."])+`<div class="chips">${go2("home","Home")}</div>`)}
  ${sec("Events",li([
    "<b>Events</b> are tiles: an emoji for the kind, the date, place and pills (<i>table</i> = we can set up a table; <i>ready 40%</i> = a readiness checklist is started). Tap one for the details, directions and the readiness button. Status, notes and the after-event report sit under <i>More</i>.",
    "<b>Approved events</b>: what LEAD said yes to and is coming up. <b>Start readiness</b> opens the checklist: six steps down the side; fill them in, then <b>Submit to the coordinators</b> at the bottom.",
    "<b>Proposals</b>: when an outside group asks to run something with LEAD, their 8-part proposal goes here, one card per part, with a fit score."])+`<div class="chips">${go2("events")}${go2("approved")}${go2("proposals")}</div>`)}
  ${sec("Programming",li([
    "<b>Programs & videos</b>: the center's programs as tiles. Tap one for its upcoming dates, the classes logged and its videos; <b>+ Class</b> and <b>+ Video</b> file under that program. LEAD's marks: 10 people a class, a video a week.",
    "<b>Calendar</b>: the month at the center, the next session, the registration form. Keyholders: <i>Show the codes</i> at the bottom asks for the team password and the keyholder agreement."])+`<div class="chips">${go2("programs")}${go2("center")}</div>`)}
  ${sec("Meetings",li([
    "<b>Meetings</b> are tiles; tap one to read the notes, takeaways and next steps, <b>Edit</b> to change it. Add a meeting with a time so it shows on Today. A takeaway can become a how-to or a question; a next step can become a task.",
    "<b>Tasks</b> open on the board: drag cards between To do, Doing, Waiting and Done. The list shows cards with a chevron for notes and steps.",
    "<b>Board of Champions</b>: names for the board, added here first."])+`<div class="chips">${go2("meetings")}${go2("tasks")}${go2("board")}</div>`)}
  ${sec("Canvassing",li([
    "<b>Canvass</b>: the campaign switcher at the top (each center has its own), the overview, shifts, the team and where to canvass. <b>Signers</b> asks for the team password once per visit before any names show.",
    "<b>People & orgs</b>: everyone in the pipeline, from not reached yet to Champion. <b>Letters</b>: letters of support. <b>Map</b>: everything pinned by town; tap a pin for directions."])+`<div class="chips">${go2("team")}${go2("people")}${go2("letters")}${go2("map")}</div>`)}
  ${sec("Ask LEAD (bottom right)",li([
    "Tap it and type: <i>when's the next meeting</i>, <i>what's on today</i>, <i>who's in</i>, <i>how many signatures</i>, or any name to search.",
    "<b>message Iris: running 10 late</b> sends her a note (the <b>Messages</b> tab holds them; the badge shows unread). <i>message a coordinator</i> gives you a list.",
    "<b>check me in</b> / <b>check me out</b>. The <b>Activity</b> tab shows who's in and the latest check-ins, cards moved, meetings added, messages and feedback.",
    "<b>/feedback</b> opens the training and demo forms. <b>/guide</b> opens this page. <b>/help</b> lists everything. <b>/inquiry</b> + a question reasons over the hub's data"+(tmAIOn()?"":" (once the owner connects it)")+"."]))}
  ${sec("Training and Who's who",li([
    "<b>Training</b> is an inbox: type what you want training on and send it; coordinators answer, and answers become how-tos. The other tabs hold the how-tos, the script and facts, hearings and schools.",
    "<b>Who's who</b>: the team by level. A green dot means they have LEAD open right now. <b>Message</b> opens the assistant with them picked."])+`<div class="chips">${go2("playbook")}${go2("org")}</div>`)}
  ${sec("Feedback",li([
    "<b>Give feedback</b> (Tools & resources, or <b>/feedback</b>): the <b>Training</b> form after a session, the <b>Software demo</b> form after trying the app. Two or three minutes; your name is filled in.",
    lead?"You can read every response under Tools & resources → <b>Feedback</b>, with averages per question.":"Coordinators, executives and the owner read the responses."])+`<div class="chips"><button class="btn sm pri" data-tm="feedback">Give feedback</button></div>`)}
  ${sec("Try these this week",li([
    "Get in on your phone and tick <i>keep this device unlocked</i>.","Check in with <i>I'm in today</i>.","Open an event, then its readiness checklist, and fill in one step.","Move a card on the board.","Add a meeting with a time and watch Today change.","Log a class or a video under a program.","Send a teammate a message from Who's who.","Ask Ask LEAD a question.","Send <b>/feedback</b> → Software demo."]))}
  ${sec("What's demo and what's real",li([
    "Everything marked <b>Demo</b> is made up: names, phone numbers (555-01xx), emails (example.org). Real data is loaded where a center has it.",
    "Messages and activity stay inside LEAD; nothing texts or emails anyone. The green dot means <i>has LEAD open</i>, not a true presence system.",
    "Ask LEAD answers from the hub's own data only. If the hub is out of date, so is the answer.",
    "The readiness checklist, approvals and feedback are live and shared. Hours are yours alone.",
    "Found something confusing or broken? That's exactly what the demo feedback form is for."]))}
  ${sec("Questions",`<p>Ask your coordinator, or use Ask LEAD → <b>message a coordinator</b>.${owner?" You're the owner: the owner page (under your name) is where people are let in, levels and centers change, and data loads.":""}</p>`)}
  </div>`;
}

/* ---------- Approved events: what LEAD said yes to, coming up, with readiness ---------- */
function tmEventTileRd(e){const d=rdForEvent(e.id),sc=d?rdScore(d):null;
  return tmEventTile(e).replace('<button class="ev-tile"','<div class="ev-tile has-acts"').replace(/<\/button>$/,'')+`<span class="ev-acts"><button class="btn sm ${sc?"":"pri"}" data-act="noop" data-tm="rd" data-id="${e.id}">${sc?`Readiness ${sc.pct}%`:"Start readiness"}</button>${sc&&sc.overdue?`<span class="pill red">${sc.overdue} overdue</span>`:""}${d&&d.submittedAt?`<span class="pill green">submitted</span>`:""}${tmLeadish()&&S.canWrite!==false?`<button class="btn sm ghost" data-act="noop" data-tm="approve" data-id="${e.id}" data-on="1">Unapprove</button>`:""}</span></div>`;}
function rApproved(){
  const t0=todayISO(),E=allE().filter(e=>e.date&&(e.date>=t0||(e.end_date&&e.end_date>=t0))).sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  const ok=E.filter(tmApproved),rest=E.filter(e=>!tmApproved(e)).slice(0,24);
  return `<div class="toolrow"><span class="muted small">Events LEAD said yes to. Each one gets a readiness checklist; submit it to the coordinators when it's ready.</span><span class="sp"></span><span class="small muted">${ok.length}</span></div>
  ${ok.length?`<div class="ev-grid" style="margin-top:12px">${ok.map(tmEventTileRd).join("")}</div>`:`<p class="empty">Nothing approved and coming up yet.${tmLeadish()?" Approve one below.":""}</p>`}
  ${rest.length?`<h3 class="ev-wk">Coming up, not approved yet</h3><div class="rows">${rest.map(e=>`<div class="row" data-open="${e.id}"><div><div class="n">${esc(e.name)}</div><div class="d">${esc([fmtDate(e.date),e.time,townOf(e)].filter(Boolean).join(" · "))}</div></div><div class="r"><a class="btn sm" href="${esc(tmProposalFormUrl())}" target="_blank" rel="noopener" data-act="noop">Submit a proposal</a>${tmLeadish()&&S.canWrite!==false?` <button class="btn sm" data-act="noop" data-tm="approve" data-id="${e.id}" data-on="0">Approve</button>`:""}</div></div>`).join("")}</div>`:""}`;
}

/* ---------- Meetings as tiles, opened in a clean sheet ---------- */
function tmMeetingEmoji(m){const n=(m.title||"").toLowerCase();
  const by=[["coordinator|sync|check.?in|stand.?up","🧭"],["partner","🤝"],["town hall|hearing|council|legislat","🏛️"],["board","📋"],["training|workshop","🎓"],["interview|hiring","💼"],["volunteer","🙌"],["budget|finance|invoice","💵"],["event|festival|fair","🎉"],["school|parent|pta","🏫"]];
  for(const [re,em] of by)if(new RegExp(re).test(n))return em;return "🗣️";}
function tmMeetingTile(m){const d=m.date?parseISO(m.date):null,lines=t=>(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
  return `<button class="ev-tile mt" data-tm="mtg" data-id="${m.id}" style="--tc:var(--t-${tmMine(m)?"gold":"orange"})">
    <span class="ev-em">${tmMeetingEmoji(m)}</span>
    <span class="ev-when">${d?`<b>${d.getDate()}</b><small>${MON[d.getMonth()]}</small>`:`<small>TBD</small>`}</span>
    <span class="ev-body"><b class="ev-n">${esc(m.title||"Meeting")}</b><span class="ev-s">${esc([m.time?tmClock(m.time):"",m.where].filter(Boolean).join(" · "))}</span><span class="ev-s">${esc([m.with?"with "+m.with:"",m.center&&tmLeadish()?tmCenterName(m.center):""].filter(Boolean).join(" · "))}</span><span class="ev-pills">${tmMine(m)?`<span class="pill sand">mine</span>`:""}${lines(m.takeaways).length?`<span class="pill blue">${lines(m.takeaways).length} takeaway${lines(m.takeaways).length===1?"":"s"}</span>`:""}${lines(m.next).length?`<span class="pill grey">${lines(m.next).length} next step${lines(m.next).length===1?"":"s"}</span>`:""}</span></span>
  </button>`;}
rMeetings=function(){
  const t0=todayISO(),key=m=>(m.date||"")+(tm24(m.time)||"99");
  const up=S.meetings.filter(m=>m.date&&m.date>=t0).sort((a,b)=>key(a)<key(b)?-1:1),past=S.meetings.filter(m=>!m.date||m.date<t0).sort((a,b)=>key(a)<key(b)?1:-1);
  return `<div class="toolrow"><span class="muted small">What was decided and what's next. Tap a meeting to read it; takeaways can go to Training, questions or tasks.</span><span class="sp"></span><button class="btn sm pri" data-act="mtg-add">+ Meeting</button></div>
  ${up.length?`<h3 class="ev-wk">Coming up</h3><div class="ev-grid">${up.map(tmMeetingTile).join("")}</div>`:""}
  ${past.length?`<h3 class="ev-wk">Past</h3><div class="ev-grid">${past.slice(0,30).map(tmMeetingTile).join("")}</div>`:""}
  ${!up.length&&!past.length?`<p class="empty">${S.loaded.meetings?"No meetings yet. Add one.":ld()}</p>`:""}`;
};
function tmMeetingSheet(id){const m=S.meetings.find(x=>x.id===id);if(!m)return;const lines=t=>(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
  const li=(arr,kind)=>arr.map((t,i)=>`<li><span>${esc(t)}</span>${S.canWrite===false?"":`<span class="acts">${kind==="take"?`<button class="btn sm ghost" data-ms="pb" data-i="${i}">→ Training</button><button class="btn sm ghost" data-ms="q" data-i="${i}">→ Question</button>`:`<button class="btn sm ghost" data-ms="task" data-i="${i}">→ Task</button>`}</span>`}</li>`).join("");
  openSheet(m.title||"Meeting",`<div class="ms"><div class="ms-top"><span class="ev-em big">${tmMeetingEmoji(m)}</span><div><div class="ms-when">${esc(tmWhen(m.date,m.time))}</div><div class="muted small">${esc([m.where,m.with?"with "+m.with:"",m.center&&tmLeadish()?tmCenterName(m.center):""].filter(Boolean).join(" · "))}</div></div></div>
    ${m.notes?`<h3>Notes</h3><p class="ms-notes">${esc(m.notes)}</p>`:""}
    ${lines(m.takeaways).length?`<h3>Takeaways</h3><ul class="ms-list">${li(lines(m.takeaways),"take")}</ul>`:""}
    ${lines(m.next).length?`<h3>Next steps</h3><ul class="ms-list">${li(lines(m.next),"next")}</ul>`:""}
    ${!m.notes&&!lines(m.takeaways).length&&!lines(m.next).length?`<p class="muted small" style="margin-top:12px">No notes yet. Tap Edit to add what was said and what's next.</p>`:""}</div>`,
    {btns:`${S.canWrite===false?"":`<button class="btn pri" data-ms="edit">Edit</button>`}<button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay").querySelectorAll("[data-ms]").forEach(b=>b.onclick=()=>{const a=b.dataset.ms,i=+b.dataset.i;
    if(a==="edit")meetingForm(m);
    else if(a==="pb")pbForm({title:"",body:lines(m.takeaways)[i],status:"confirmed",source:(m.title||"Meeting")+", "+fmtDate(m.date),lane:"How LEAD works"});
    else if(a==="q")qForm(null,{q:lines(m.takeaways)[i],askWho:""});
    else if(a==="task")taskForm(null,{title:lines(m.next)[i],notes:"From "+(m.title||"Meeting")+", "+fmtDate(m.date)});});}

/* ---------- Readiness lives inside the event: steps down the side, real names, one Submit ---------- */
rdPeople=function(){const s=new Set([ME().name].filter(Boolean));tmTeam().forEach(g=>{g.in.forEach(p=>{if(p.name)s.add(p.name);});g.pending.forEach(p=>{if(p.name)s.add(p.name);});});return [...s].sort((a,b)=>a.localeCompare(b));};
const tmRdDetail=rdDetail;
rdDetail=function(d){const sc=rdScore(d);
  const sub=d.submittedAt?`<span class="muted small">Submitted ${esc(fmtDate(d.submittedAt))}${d.submittedBy?" by "+esc(String(d.submittedBy).split("@")[0]):""}</span>`:`<span class="muted small">Fill in each step, then submit to the coordinators.</span>`;
  return tmRdDetail(d)+`<div class="rd-submit"><div><b>${sc.pct}% ready</b> · ${sc.total-sc.done} open${sc.overdue?` · <span class="late">${sc.overdue} overdue</span>`:""}</div>${sub}<span class="sp"></span><button class="btn" data-tm="rd-print">Print</button>${S.canWrite===false?"":`<button class="btn pri" data-tm="rd-submit" data-id="${esc(d.id)}">${d.submittedAt?"Submit again":"Submit to the coordinators"}</button>`}</div>`;};
async function tmRdSubmit(id){const d=rdDoc(id);if(!d)return;const sc=rdScore(d),x=tmX();
  const coords=TM.directory.filter(p=>["coord","exec"].includes(p.role));
  const text=`Readiness checklist submitted: ${d.name||"Untitled event"}${d.date?" ("+fmtDate(d.date)+")":""}. ${sc.pct}% ready, ${sc.total-sc.done} open${sc.overdue?", "+sc.overdue+" overdue":""}. Open the event in LEAD to see it.`;
  let sent=0;if(x){for(const p of coords){try{await x.sendMessage(p,text);sent++;}catch(e){}}}
  const {id:_i,...rest}=d;const ok=await write("ready",id,{...rest,submittedAt:todayISO(),submittedBy:tmMe()});
  if(!ok)return;tmLog("ready",`submitted the readiness checklist for "${d.name||"an event"}"`);
  toast(sent?`Submitted. Sent to ${sent} coordinator${sent===1?"":"s"}.`:"Submitted and logged in Activity. No coordinator has signed in yet to message.");render();}

/* ---------- Programming: the center's programs, with the classes and videos for each ---------- */
function tmPrograms(){
  const map=new Map();
  Object.values((typeof CTR!=="undefined"&&CTR.months)||{}).forEach(M=>(M.programs||[]).forEach(p=>{if(!map.has(p.short))map.set(p.short,{key:p.short,name:p.name,short:p.short,when:p.when,time:p.time,color:p.color,icon:p.icon,blurb:p.blurb,dates:[]});map.get(p.short).dates.push(...(p.dates||[]));}));
  [...S.sessions.map(x=>x.program),...S.videos.map(x=>x.program)].filter(Boolean).forEach(n=>{if(![...map.values()].some(p=>p.name===n||p.short===n))map.set(n,{key:n,name:n,short:n,when:"",time:"",color:"",icon:"",blurb:"",dates:[]});});
  return [...map.values()];}
const tmProgOf=(p,x)=>x.program===p.name||x.program===p.short;
const tmProgOptions=()=>{const names=tmPrograms().map(p=>p.name);PROGRAMS.forEach(n=>{if(!names.includes(n))names.push(n);});return names;};
function tmProgEmoji(n){n=String(n||"").toLowerCase();const by=[["salsa|bachata|dance|zumba","💃"],["chapter|book|read|literacy","📖"],["heal|wellness|yoga|circle","🧘"],["business|dream|entrepreneur|financ","💼"],["citizen|esol|english|civic","🗽"],["game|night|social","🎲"],["history","🏺"],["health","🩺"],["educat|school|college|option","🎓"]];for(const [re,em] of by)if(new RegExp(re).test(n))return em;return "📚";}
function tmProgIcon(p){return p.icon&&typeof CTR_ICONS!=="undefined"&&CTR_ICONS[p.icon]?CTR_ICONS[p.icon]:`<em>${tmProgEmoji(p.name)}</em>`;}
rPrograms=function(){
  const P=tmPrograms(),t0=todayISO(),ws=weekStart(),last4=addDays(ws,-21),vids=S.videos,ses=S.sessions;
  const v4=vids.filter(v=>v.date>=last4).length;
  const tile=p=>{const next=p.dates.filter(d=>d>=t0).sort()[0];const nv=vids.filter(x=>tmProgOf(p,x)).length,ns=ses.filter(x=>tmProgOf(p,x)).length;
    return `<button class="pg-tile" data-tm="prog" data-id="${esc(p.key)}" style="--pc:${p.color||"var(--lead-blue)"}"><span class="pg-ic">${tmProgIcon(p)}</span><span class="pg-body"><b>${esc(p.name)}</b><span class="pg-s">${esc([p.when,p.time].filter(Boolean).join(" · ")||"Logged classes")}</span>${next?`<span class="pg-s">Next: ${esc(tmWhen(next,""))}</span>`:""}<span class="pg-counts"><i>${ns} class${ns===1?"":"es"}</i><i>${nv} video${nv===1?"":"s"}</i></span></span></button>`;};
  return `<div class="toolrow"><span class="muted small">The center's programs, with the classes logged and the videos for each. LEAD's marks: 10 people a class, a video a week.</span><span class="sp"></span><button class="btn sm" data-act="ses-add">+ Class</button><button class="btn sm pri" data-act="vid-add">+ Video</button></div>
  <div class="strip"><div class="${v4>=4?"okv":"warnv"}"><b class="num">${v4} of 4</b><span>weeks with a video, last 4 weeks</span></div><div><b class="num">${ses.filter(x=>(+x.participants||0)>=10).length} of ${ses.length}</b><span>classes that hit 10 people</span></div><div><b class="num">${vids.length}</b><span>videos in the library</span></div></div>
  <div class="pg-grid">${P.map(tile).join("")||`<p class="empty">No programs yet. Add a class or a video.</p>`}</div>`;
};
function tmProgramSheet(key){const p=tmPrograms().find(x=>x.key===key);if(!p)return;const t0=todayISO();
  const up=[...new Set(p.dates.filter(d=>d>=t0))].sort().slice(0,6),vids=S.videos.filter(x=>tmProgOf(p,x)).sort((a,b)=>(a.date||"")<(b.date||"")?1:-1),ses=S.sessions.filter(x=>tmProgOf(p,x)).sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  openSheet(p.name,`<div class="ms"><div class="ms-top"><span class="pg-ic big" style="--pc:${p.color||"var(--lead-blue)"}">${tmProgIcon(p)}</span><div><div class="ms-when">${esc([p.when,p.time].filter(Boolean).join(" · ")||"Logged classes")}</div><div class="muted small">${esc(p.blurb||"")}</div></div></div>
    ${up.length?`<h3>Coming up</h3><div class="pg-dates">${up.map(d=>`<span>${esc(fmtDate(d,true))}</span>`).join("")}</div>`:""}
    <h3>Videos <span class="muted">${vids.length}</span></h3><div class="rows">${vids.map(v=>`<div class="row" data-ms="vid" data-id="${v.id}"><div><div class="n">${esc(v.topic||"Video")}</div><div class="d">${fmtDate(v.date)}${v.where?" · "+esc(v.where):""}</div></div><div class="r">${v.url?`<a class="btn sm" href="${esc(v.url)}" target="_blank" rel="noopener" data-stop="1">Watch</a> `:""}<span class="pill ${v.status==="posted"?"green":"grey"}">${esc(v.status||"posted")}</span></div></div>`).join("")||`<p class="empty">No videos for this program yet.</p>`}</div>
    <h3>Classes logged <span class="muted">${ses.length}</span></h3><div class="rows">${ses.slice(0,8).map(x=>`<div class="row" data-ms="ses" data-id="${x.id}"><div><div class="n">${esc(x.topic||p.name)}</div><div class="d">${fmtDate(x.date)}${x.where?" · "+esc(x.where):""}</div></div><div class="r"><span class="pill ${(+x.participants||0)>=10?"green":"orange"}">${+x.participants||0} people</span></div></div>`).join("")||`<p class="empty">No classes logged yet.</p>`}</div></div>`,
    {btns:`${S.canWrite===false?"":`<button class="btn pri" data-ms="addvid">+ Video</button><button class="btn" data-ms="addses">+ Class</button>`}<button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay").querySelectorAll("[data-ms]").forEach(b=>b.addEventListener("click",e=>{if(e.target.closest("[data-stop]"))return;const a=b.dataset.ms,id=b.dataset.id;
    if(a==="addvid")videoForm(null,{program:p.name});else if(a==="addses")sessionForm(null,{program:p.name});
    else if(a==="vid")videoForm(S.videos.find(v=>v.id===id));else if(a==="ses")sessionForm(S.sessions.find(v=>v.id===id));}));}
videoForm=function(x,pre){const isNew=!x||!x.id;x=x||pre||{};form({title:isNew?"Log a video":"Edit video",fields:[{key:"program",label:"Program",type:"select",options:[["","(none)"],...tmProgOptions().map(n=>[n,n])]},{key:"date",label:"Date",type:"date",default:todayISO()},{key:"status",label:"Status",type:"select",options:["posted","scheduled","filming","idea"],default:"posted"},{key:"topic",label:"Topic",required:true,wide:true},{key:"where",label:"Posted where",placeholder:"Instagram, Facebook, TikTok"},{key:"url",label:"Link",wide:true}],values:x,onSave:async v=>write("videos",x.id||uid("v"),v),onDelete:isNew?null:()=>remove("videos",x.id)});};
sessionForm=function(x,pre){const isNew=!x||!x.id;x=x||pre||{};form({title:isNew?"Log a class":"Edit class",fields:[{key:"date",label:"Date",type:"date",default:todayISO()},{key:"program",label:"Program",type:"select",options:tmProgOptions()},{key:"topic",label:"Topic or session",wide:true},{key:"participants",label:"People who came",type:"number"},{key:"where",label:"Where",default:ME().place},{key:"notes",label:"Notes",type:"textarea",rows:2,wide:true}],values:x,onSave:async v=>write("sessions",x.id||uid("ss"),{...v,participants:Number(v.participants)||0}),onDelete:isNew?null:()=>remove("sessions",x.id)});};

/* ---------- Training: ask how to do something; answers become how-tos ---------- */
const TM_PB_TEAM=["LEAD branches","Partner pitch","What we offer a partner","LEAD's numbers","Camera policy","Door and table script","Canvassing rules","Shifts and the schedule"];
const TM_PB_TOOLS=["LEAD's community partners"];
const TM_PB_ROLE=["The three lanes"];
const TM_PB_TRIM={"Shifts and the schedule":2};
const TM_FACT_HIDE=["Assumptions to confirm","Kelly's three lanes"];
const tmPbIs=(p,list)=>list.some(x=>String(p.title||"").toLowerCase().startsWith(x.toLowerCase()));
function tmPbText(t){return String(t||"").replace(/I'm \S+ with LEAD/g,"I'm "+(ME().first||"[your name]")+" with LEAD");}
function tmPbBody(p){let b=String(p.body||"");const tr=Object.entries(TM_PB_TRIM).find(([k])=>String(p.title||"").toLowerCase().startsWith(k.toLowerCase()));if(tr)b=b.split("\n").slice(0,tr[1]).join("\n");return tmPbText(b);}
const tmPbTeam=p=>!!p.team||tmPbIs(p,TM_PB_TEAM);
const tmPlaybook0=rPlaybook;
rPlaybook=function(){
  const subs=["questions","howto","facts","meetings","schools"];if(!subs.includes(S.pb))S.pb="questions";const sub=S.pb;
  const nav=[["questions","Ask & answers"],["howto","How-tos"],["facts","Script & facts"],["meetings","Hearings & meetings"],["schools","Schools & leaders"]];
  let html=`<div class="subnav">${nav.map(([k,l])=>`<button data-act="pb-go" data-v="${k}" aria-pressed="${sub===k}">${l}</button>`).join("")}</div>`;
  if(sub==="questions")html+=tmTrainingInbox();
  else if(sub==="howto")html+=tmHowtos();
  else if(sub==="facts")html+=tmFacts();
  else{const full=tmPlaybook0();html+=full.slice(full.indexOf("</div>")+6);}
  return html;};
function tmTrainingInbox(){
  const me=tmMe(),lead=tmLeadish(),owner=!!(FB&&FB.owner);
  const all=S.questions.filter(q=>q.team).sort((a,b)=>(a.createdAt||"")<(b.createdAt||"")?1:-1);
  const open=all.filter(q=>q.status!=="answered"),ans=all.filter(q=>q.status==="answered");
  const mine=owner?S.questions.filter(q=>!q.team):[];
  const card=q=>`<div class="tq ${q.status==="answered"?"done":""}"><div class="tq-q">${esc(q.q)}</div><div class="tq-m">${esc([q.name||(q.team?"":"your note"),q.createdAt?"asked "+fmtDate(q.createdAt):"",!q.team&&q.askWho?"ask "+q.askWho:""].filter(Boolean).join(" · "))}</div>${q.answer?`<div class="tq-a">${linkify(q.answer)}${q.answeredBy?`<small>${esc(q.answeredBy)}${q.answeredAt?" · "+esc(fmtDate(q.answeredAt)):""}</small>`:""}</div>`:""}<div class="tq-acts">${S.canWrite===false?"":`${lead?`<button class="btn sm ${q.answer?"":"pri"}" data-tm="q-answer" data-id="${q.id}">${q.answer?"Edit the answer":"Answer"}</button>`:""}${lead&&q.answer?`<button class="btn sm" data-tm="q-howto" data-id="${q.id}">Make it a how-to</button>`:""}${owner||q.by===me?`<button class="btn sm ghost" data-act="q-open" data-id="${q.id}">Edit</button>`:""}`}</div></div>`;
  return `<div class="tq-ask"><label for="tqIn">What do you want training on?</label><p class="muted small" style="margin:-4px 0 10px">Send in anything you want to learn or can't find: how to log a shift, what to say at a table, how approvals work. Coordinators answer here, and answers become how-tos.</p><div class="tq-row"><input id="tqIn" placeholder="I want to learn how to…" autocomplete="off"><button class="btn pri" data-tm="q-ask">Send</button></div></div>
  <h3 class="ev-wk">Requests from the team · ${open.length}</h3>${open.map(card).join("")||`<p class="empty">No requests yet. Be the first.</p>`}
  <h3 class="ev-wk">Answered · ${ans.length}</h3>${ans.map(card).join("")||`<p class="empty">Answers show here once a coordinator replies.</p>`}
  ${mine.length?`<details class="ht" style="margin-top:18px"><summary><span class="ht-t">Your own open questions and notes</span><span class="ht-l">only you see these · ${mine.length}</span></summary><div class="ht-b">${mine.map(card).join("")}</div></details>`:""}`;}
async function tmAskQuestion(v){const i=v.querySelector("#tqIn");if(!i)return;const q=i.value.trim();if(!q){i.focus();return;}
  const ok=await write("questions",uid("q"),{q,askWho:"",lane:"",answer:"",status:"open",createdAt:todayISO(),team:true,by:tmMe(),name:ME().name,center:FB?FB.center||"":""});
  if(ok){i.value="";toast("Sent. A coordinator will answer here.");tmLog("question","asked for training on: "+q.slice(0,120));}}
function tmAnswerQuestion(id){const q=S.questions.find(x=>x.id===id);if(!q)return;
  openSheet("Answer",`<div class="ms"><p class="tq-q" style="margin:0 0 10px">${esc(q.q)}</p><textarea id="tqAns" class="gf-ta" style="min-height:120px" placeholder="Write the answer the way you'd say it">${esc(q.answer||"")}</textarea></div>`,
    {btns:`<button class="btn pri" id="tqSave">Save answer</button><button class="btn ghost" data-close="1">Cancel</button>`});
  $("#tqSave").onclick=async()=>{const a=$("#tqAns").value.trim();if(!a){$("#tqAns").focus();return;}
    const ok=await write("questions",id,{...q,answer:a,status:"answered",answeredAt:q.answeredAt||todayISO(),answeredBy:ME().name});
    if(ok){closeOverlay();toast("Answered");tmLog("question","answered: "+q.q.slice(0,100));}};}
async function tmQuestionToHowto(id){const q=S.questions.find(x=>x.id===id);if(!q||!q.answer)return;
  const ok=await write("playbook",uid("pb"),{title:q.q.replace(/\?+$/,""),body:q.answer,status:"confirmed",lane:"How LEAD works",team:true,by:tmMe(),createdAt:todayISO(),source:"Asked by "+(q.name||"a teammate")});
  if(ok){toast("Added to the how-tos");tmLog("howto","added the how-to \""+q.q.slice(0,80)+"\"");}}
function tmHowtos(){
  const owner=!!(FB&&FB.owner),L=S.playbook.filter(tmPbTeam).sort((a,b)=>(a.order??99)-(b.order??99)||(a.title||"").localeCompare(b.title||""));
  const lanes=[...new Set(L.map(p=>p.lane||"How LEAD works"))];
  const card=p=>`<details class="ht"><summary><span class="ht-t">${esc(p.title)}</span>${p.source?`<span class="ht-l">${esc(p.source)}</span>`:""}</summary><div class="ht-b">${linkify(tmPbBody(p)).replace(/\n/g,"<br>")}${(owner||tmLeadish())&&S.canWrite!==false?`<div class="chips" style="margin-top:10px"><button class="btn sm ghost" data-act="pb-open" data-id="${p.id}">Edit</button></div>`:""}</div></details>`;
  const priv=owner?S.playbook.filter(p=>!tmPbTeam(p)&&!tmPbIs(p,TM_PB_TOOLS)&&!tmPbIs(p,TM_PB_ROLE)):[];
  return `<div class="toolrow"><span class="muted small">How LEAD does things. Open one to read it.</span><span class="sp"></span>${tmLeadish()&&S.canWrite!==false?`<button class="btn sm pri" data-act="pb-add">+ How-to</button>`:""}</div>
  ${lanes.map(l=>`<h3 class="ev-wk">${esc(l)}</h3>${L.filter(p=>(p.lane||"How LEAD works")===l).map(card).join("")}`).join("")||`<p class="empty">No how-tos yet. Answered questions can become one.</p>`}
  ${priv.length?`<h3 class="ev-wk">Only you see these (your own notes)</h3>${priv.map(card).join("")}`:""}`;}
function tmFacts(){const owner=!!(FB&&FB.owner);const F=(REF.FACTS||[]).filter(f=>owner||!TM_FACT_HIDE.some(x=>String(f.title||"").startsWith(x)));
  return `<p class="muted small">The script, and the facts to say out loud.</p><div class="facts">${F.map(f=>`<h3>${esc(f.title)}</h3><ul>${(f.items||[]).map(i=>`<li>${linkify(tmPbText(i))}</li>`).join("")}</ul>`).join("")||`<p class="empty">Nothing here yet.</p>`}</div>`;}

/* ---------- moving around: the phone's back button works, and ‹ LEAD goes up one level first ---------- */
TM.fromPop=false;
const tmGoNav=go;
go=function(tab,keep){const prev=S.tab;tmGoNav(tab,keep);if(!TM.fromPop&&tab!==prev){try{history.pushState({tab},"",location.pathname+location.search+(tab==="home"?"":"#"+tab));}catch(e){}}};
window.addEventListener("popstate",e=>{const t=(e.state&&e.state.tab)||"home";TM.fromPop=true;try{if(t!==S.tab)go(t);}finally{TM.fromPop=false;}});
try{history.replaceState({tab:S.tab},"",location.pathname+location.search+(S.tab==="home"?"":"#"+S.tab));}catch(e){}
(function(){const hb=document.getElementById("homeBtn");if(!hb)return;hb.addEventListener("click",e=>{const up=document.querySelector("#view [data-rd-back], #view .pr-back, #view [data-act=\"prop-back\"]");if(up){e.stopImmediatePropagation();e.preventDefault();up.click();}},true);})();

/* ---------- Canvass: signers stay behind the team password ---------- */
S.cv.unlocked=(()=>{try{return sessionStorage.getItem("lead_cv_unlock")==="1";}catch(e){return false;}})();
const tmSigners0=cvSignersView;
cvSignersView=function(){if(FB&&!S.cv.unlocked)return `<div class="cs-lock" style="margin-top:14px"><span class="ct-ic">${CT_ICONS.door}</span><div><b>Signers are behind the team password</b><div class="small muted">Names, addresses and phone numbers of the people who signed. Type the team password once per visit.</div></div><span class="sp"></span><button class="btn pri" data-tm="sig-unlock">Show signers</button></div>`;return tmSigners0();};
const tmDrawer0=cvDrawer;
cvDrawer=function(id,keep){if(FB&&!S.cv.unlocked){tmSignersGate(()=>tmDrawer0(id,keep));return;}return tmDrawer0(id,keep);};
function tmSignersGate(after){
  openSheet("Signers",`<div class="cs-gate"><p class="small muted" style="margin:0 0 10px">The people who signed are private. Type the team password to see them on this device for this visit.</p><label for="sgPw" class="small" style="font-weight:600;display:block;margin-bottom:4px">Team password</label><input type="password" id="sgPw" autocomplete="current-password"><div class="cs-err" id="sgErr" role="alert"></div></div>`,
    {btns:`<button class="btn pri" id="sgGo">Show signers</button><button class="btn ghost" data-close="1">Cancel</button>`});
  const go=$("#sgGo"),pw=$("#sgPw"),er=$("#sgErr");pw.focus();
  const run=async()=>{if(!pw.value){er.textContent="Type the team password.";pw.focus();return;}go.disabled=true;go.textContent="Checking…";
    const ok=tmX()&&tmX().verifyPassword?await tmX().verifyPassword(pw.value):false;
    if(!ok){go.disabled=false;go.textContent="Show signers";er.textContent="That password didn't work. Check it and try again.";pw.select();return;}
    S.cv.unlocked=true;try{sessionStorage.setItem("lead_cv_unlock","1");}catch(e){}closeOverlay();if(after)after();else render();};
  go.onclick=run;pw.onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();run();}};}

/* ---------- Tasks as cards: a chevron for more, the title for the pop-up ---------- */
const TM_SEC_TONE={"B-LEAD":"brick","Charters & leaders":"indigo","Libertas canvassing":"blue","Board of Champions":"gold","Events":"gold","My role":"green","Other":"slate"};
trow=function(t){const x=taskDue(t),subs=t.subtasks||[],done=subs.filter(s=>s.done).length,late=x.days!==null&&!x.done&&x.days<0,soon=x.days!==null&&!x.done&&x.days>=0&&x.days<=2;
  return `<div class="tk ${x.done?"done":""} ${late?"late":soon?"soon":""}" style="--tc:var(--t-${TM_SEC_TONE[t.section]||"slate"})">
    <div class="tk-top"><button class="ck ${x.done?"on":""}" data-act="task-done" data-id="${t.id}" aria-label="Done"></button><button class="tk-title" data-act="task-edit" data-id="${t.id}">${esc(t.title)}</button><button class="tk-chev" data-act="noop" data-tm="tk-toggle" aria-expanded="false" aria-label="More">›</button></div>
    <div class="tk-meta">${x.date?`<span class="${late?"late":soon?"soon":""}">${esc(fmtDate(x.date))}${x.days!==null?" · "+esc(rel(x.days)):""}</span>`:""}${t.repeat==="weekly"?`<span>every ${DOW[Number(t.dow??4)]}</span>`:""}${t.section?`<span>${esc(t.section)}</span>`:""}${t.priority==="High"?`<span class="hi">High</span>`:""}${t.waitingOn?`<span>waiting on ${esc(t.waitingOn)}</span>`:""}${subs.length?`<span>${done}/${subs.length} steps</span>`:""}</div>
    <div class="tk-more">${t.notes?`<p>${linkify(t.notes)}</p>`:""}${subs.length?`<ul>${subs.map(s=>`<li class="${s.done?"done":""}">${esc(s.t)}</li>`).join("")}</ul>`:""}${t.linkText?`<p class="muted small">Linked to ${esc(t.linkText)}</p>`:""}${!t.notes&&!subs.length&&!t.linkText?`<p class="muted small">No notes yet. Tap the title to add some.</p>`:""}</div>
  </div>`;};

/* ---------- Proposals: one column, like the form the group filled in ---------- */
rProposal=function(p){const s=propScore(p),r=p.r||{},f=p.flags||{},tg=p.tags||{},ai=p.ai||{},id=p.id;
  const val=k=>{const d=S.pdraft[id+":"+k];return d!=null?d:((p.a||{})[k]||"");};
  const fv=k=>{const d=S.pdraft[id+":f:"+k];return d!=null?d:(p[k]||"");};
  const yn=k=>`<span class="opts">${["Yes","No"].map(v=>`<button data-prf="${k}" data-v="${v}" aria-pressed="${f[k]===v}">${v}</button>`).join("")}</span>`;
  const field=(k,l,type,ph)=>`<div class="gf-card"><label class="gf-q" for="prf-${k}">${esc(l)}</label><input id="prf-${k}" class="gf-in" data-prk="${k}" ${type?`type="${type}"`:""} value="${esc(fv(k))}" ${ph?`placeholder="${esc(ph)}"`:""}></div>`;
  const cls={go:"green",fit:"blue",hold:"orange",skip:"red"}[s.cls]||"";
  const hasAI=PROP_KEYS.some(k=>ai[k]);
  return `<button class="pr-back" data-act="prop-back">‹ All proposals</button>
  <div class="gf">
    <div class="gf-card gf-head"><div class="gf-bar"></div><h2>${esc(propName(p))}</h2><p class="muted" style="margin:4px 0 0">${esc([p.title,p.contact_name,p.received?"received "+fmtDate(p.received,true):""].filter(Boolean).join(" · "))||"The 8 parts LEAD asks a group for, and how well it fits."}</p>
      <div class="gf-status">${PROP_ST.map(([k,l,,c])=>`<button data-prst="${k}" aria-pressed="${(p.status||"new")===k}"><i style="background:${c}"></i>${l}</button>`).join("")}</div>
      <div class="gf-score"><b class="num ${cls}">${s.score}<small>/16</small></b><span>${s.v?`<b>${esc(s.v)}</b> · `:""}${esc(s.label||"")}${s.label?" · ":""}${s.filled} of 8 parts in, ${s.rated} rated</span></div>
      <div class="chips gf-acts"><button class="btn sm pri" data-act="prop-summary">Copy summary for exec</button><button class="btn sm" data-act="prop-ask" ${s.missing.length?"":"disabled"}>Ask for the missing parts${s.missing.length?" ("+s.missing.length+")":""}</button>
        <details class="gf-more"><summary class="btn sm">More</summary><div class="chips"><button class="btn sm" data-act="prop-ai" id="prAiBtn">Read it with AI</button>${hasAI?`<button class="btn sm" data-act="prop-useai">Use AI ratings</button>`:""}${p.eventId&&getRec(p.eventId)?`<button class="btn sm" data-act="prop-ev-open">Open the event</button>`:`<button class="btn sm" data-act="prop-ev" ${tabOK("events")?"":"hidden"}>Add to Events</button>`}${p.targetId&&getRec(p.targetId)?`<button class="btn sm" data-act="prop-t-open">Open the org</button>`:`<button class="btn sm" data-act="prop-t" ${tabOK("people")?"":"hidden"}>Add org to People &amp; orgs</button>`}<button class="btn sm danger" data-act="prop-del">Delete proposal</button></div></details></div>
    </div>
    ${field("org","Organization")}${field("title","Program or event name")}${field("contact_name","Contact person")}${field("email","Email","email")}${field("phone","Phone","tel")}${field("received","Date received","date")}
    <div class="gf-card"><label class="gf-q" for="prf-pillar">LEAD pillar</label><select id="prf-pillar" class="gf-in" data-prk="pillar">${PROP_PILLARS.map(x=>`<option value="${esc(x)}" ${(p.pillar||"")===x?"selected":""}>${x||"Not picked"}</option>`).join("")}</select></div>
    ${PROP_SECS.map(([k,l,d],i)=>{const v=val(k),q=PROP_Q[k],a=ai[k];return `<div class="gf-card" id="pr-${k}"><div class="gf-q"><span class="n">${i+1}</span>${esc(l)}</div><p class="gf-help">${esc(d)}</p>
      <textarea id="pra-${k}" data-pra="${k}" class="gf-ta ${String(v).trim()?"":"empty"}" placeholder="Their answer">${esc(v)}</textarea>
      <div class="gf-rate"><span>${esc(q[0])}<small>${esc(q[1])}</small>${a?`<small class="ai">AI: ${esc(String(a.r))} · ${esc(a.why||"")}</small>`:""}</span><span class="opts">${[0,1,2].map(n=>`<button data-prr="${k}" data-v="${n}" aria-pressed="${String(r[k])===String(n)}">${n}</button>`).join("")}</span></div></div>`;}).join("")}
    <div class="gf-card"><div class="gf-q">For the calendar</div><div class="gf-grid3"><div><label class="small muted" for="prf-people">Expected participants</label><input id="prf-people" class="gf-in" data-prk="people" inputmode="numeric" value="${esc(fv("people"))}"></div><div><label class="small muted" for="prf-date">First date</label><input id="prf-date" class="gf-in" type="date" data-prk="date" value="${esc(fv("date"))}"></div><div><label class="small muted" for="prf-time">Time</label><input id="prf-time" class="gf-in" data-prk="time" value="${esc(fv("time"))}" placeholder="6:00 PM – 7:30 PM"></div></div></div>
    <div class="gf-card"><div class="gf-q">Two quick checks</div><div class="gf-row"><span>Political or campaign content?<small>A yes puts it on hold for the exec team.</small></span>${yn("political")}</div><div class="gf-row"><span>Sells a product or service to the people who come?<small>Goes in the summary; doesn't change the score.</small></span>${yn("selling")}</div><div class="ck2"><label><input type="checkbox" id="prt-blead" data-prt="blead" ${tg.blead?"checked":""}>Reaches B-LEAD communities</label><label><input type="checkbox" id="prt-charter" data-prt="charter" ${tg.charter?"checked":""}>Touches charter schools or education leaders</label></div></div>
    <div class="gf-card"><label class="gf-q" for="prn-notes">Notes</label><textarea id="prn-notes" class="gf-ta pr-notes" data-prk="notes" placeholder="Questions for the group, conditions for a yes">${esc(fv("notes"))}</textarea>${p.raw?`<details class="pr-raw"><summary>What they sent (original text)</summary><pre>${esc(p.raw)}</pre></details>`:""}</div>
  </div>`;};

/* ---------- feedback: training sessions and the software demo ---------- */
const TM_FEEDBACK={
  training:{title:"Training feedback",blurb:"About a presentation or training session (about 40 minutes).",qs:[
    {k:"session",t:"text",q:"Which session or presentation?",ph:"Topic or date"},
    {k:"overall",t:"scale",q:"Overall, how useful was it?",lo:"Not useful",hi:"Very useful"},
    {k:"clear",t:"scale",q:"How clear was it?",lo:"Confusing",hi:"Very clear"},
    {k:"pace",t:"one",q:"The pace was…",o:["Too slow","About right","Too fast"]},
    {k:"length",t:"one",q:"The length was…",o:["Too short","About right","Too long"]},
    {k:"useful",t:"long",q:"What was the most useful part?"},
    {k:"confusing",t:"long",q:"What was confusing, or what would you change?"},
    {k:"ready",t:"scale",q:"How ready do you feel to use what was covered?",lo:"Not ready",hi:"Ready now"},
    {k:"next",t:"long",q:"What should the next session cover?"},
    {k:"else",t:"long",q:"Anything else?"}]},
  demo:{title:"Software demo feedback",blurb:"About trying LEAD (this app) this week. The more specific, the better.",qs:[
    {k:"device",t:"many",q:"What did you use it on?",o:["Phone","Laptop or desktop","Tablet"]},
    {k:"signin",t:"scale",q:"How easy was it to get in (team password, then Google)?",lo:"Hard",hi:"Easy"},
    {k:"find",t:"scale",q:"How easy was it to find things?",lo:"Hard",hi:"Easy"},
    {k:"pages",t:"many",q:"Which parts did you actually use?",o:["Home","Today","Events","Canvass","Meetings","Tasks / board","Calendar","Tools & resources","Ask LEAD"]},
    {k:"best",t:"long",q:"What was the most useful part, and why?"},
    {k:"worst",t:"long",q:"What was confusing, slow or in the way?"},
    {k:"problems",t:"many",q:"Did you hit any of these?",o:["Slow to load","Something broke or showed an error","Hard to read on my screen","Couldn't find my center's data","Worked fine"]},
    {k:"missing",t:"long",q:"What's missing that you need for your work?"},
    {k:"daily",t:"one",q:"Would you use this most days?",o:["Yes","Maybe","No"]},
    {k:"more",t:"long",q:"What would make you use it more?"},
    {k:"speed",t:"scale",q:"Compared with how you work now, this feels…",lo:"Slower",hi:"Faster"},
    {k:"overall",t:"scale",q:"Overall rating",lo:"1",hi:"5"},
    {k:"else",t:"long",q:"Anything else? Ideas welcome."}]}
};
function tmFeedback(kind){
  if(!kind){
    openSheet("Feedback",`<p class="muted small" style="margin:0">Two or three minutes. Only coordinators, executives and the hub's owner can read responses.</p><div class="fb-pick"><button data-fb="training"><b>Training</b><small>About a presentation or training session</small></button><button data-fb="demo"><b>Software demo</b><small>About trying the LEAD app this week</small></button></div>`);
    document.querySelectorAll("#overlay [data-fb]").forEach(b=>b.onclick=()=>tmFeedback(b.dataset.fb));return;
  }
  const F=TM_FEEDBACK[kind];
  const q=(x,i)=>{const id=`fbq${i}`,lab=`<span class="lq" id="${id}l">${i+1}. ${esc(x.q)}</span>`;
    if(x.t==="text")return `<div class="fb-q"><label for="${id}">${i+1}. ${esc(x.q)}</label><input type="text" id="${id}" name="${x.k}" placeholder="${esc(x.ph||"")}"></div>`;
    if(x.t==="long")return `<div class="fb-q"><label for="${id}">${i+1}. ${esc(x.q)}</label><textarea id="${id}" name="${x.k}"></textarea></div>`;
    if(x.t==="scale")return `<div class="fb-q" role="group" aria-labelledby="${id}l">${lab}<div class="fb-opts fb-scale">${[1,2,3,4,5].map(n=>`<label><input type="radio" name="${x.k}" value="${n}">${n}</label>`).join("")}</div><div class="fb-ends"><span>${esc(x.lo)}</span><span>${esc(x.hi)}</span></div></div>`;
    return `<div class="fb-q" role="group" aria-labelledby="${id}l">${lab}<div class="fb-opts">${x.o.map(o=>`<label><input type="${x.t==="many"?"checkbox":"radio"}" name="${x.k}" value="${esc(o)}">${esc(o)}</label>`).join("")}</div></div>`;};
  openSheet(F.title,`<p class="muted small" style="margin:0">${esc(F.blurb)}</p><form id="fbForm" class="fb-form"><div class="fb-q"><label for="fbName">Your name</label><input type="text" id="fbName" name="_name" value="${esc(ME().name)}" required></div>${F.qs.map(q).join("")}</form>`,
    {btns:`<button class="btn pri" id="fbSend">Send feedback</button><button class="btn ghost" data-close="1">Cancel</button>`});
  $("#fbSend").onclick=async()=>{
    const fd=new FormData($("#fbForm")),answers={};
    F.qs.forEach(x=>{const v=fd.getAll(x.k).map(s=>String(s).trim()).filter(Boolean);if(v.length)answers[x.k]=x.t==="many"?v:v[0];});
    const name=(fd.get("_name")||"").toString().trim();
    if(!name){toast("Add your name");$("#fbName").focus();return;}
    if(!Object.keys(answers).length){toast("Answer at least one question");return;}
    const x=tmX();if(!x){toast("Feedback is saved on the team site.");return;}
    const b=$("#fbSend");b.disabled=true;b.textContent="Sending…";
    try{await x.sendFeedback({kind,name,answers});closeOverlay();toast("Thank you. Your feedback is in.");tmSay("bot","Thanks, your feedback went through.");tmLog("feedback",`sent ${kind==="demo"?"software demo":"training"} feedback`);}
    catch(e){b.disabled=false;b.textContent="Send feedback";toast("Couldn't send: "+((e&&e.code)==="permission-denied"?"the database isn't set up for feedback yet.":(e&&e.message)||e));}
  };
}
function tmFeedbackList(){
  const x=tmX();if(!x||!x.watchFeedback)return "";
  const L=[...TM.feedback].sort((a,b)=>(b.at||0)-(a.at||0));
  const when=t=>t?new Date(t).toLocaleDateString([],{month:"short",day:"numeric"})+" "+new Date(t).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}):"";
  const avg=kind=>{const F=TM_FEEDBACK[kind],R=L.filter(r=>r.kind===kind);if(!R.length)return "";
    return `<div class="fb-avg"><b>${esc(F.title)}</b> · ${R.length} response${R.length===1?"":"s"}${F.qs.filter(q=>q.t==="scale").map(q=>{const v=R.map(r=>+((r.answers||{})[q.k])).filter(n=>n>0);return v.length?` · ${esc(q.q.replace(/[?.…]+$/,""))}: <b>${(v.reduce((a,b)=>a+b,0)/v.length).toFixed(1)}</b>/5`:"";}).join("")}</div>`;};
  const one=r=>{const F=TM_FEEDBACK[r.kind]||{qs:[]},A=r.answers||{};
    return `<details class="fb-r"><summary><b>${esc(r.name||r.by||"")}</b><span class="pill ${r.kind==="demo"?"blue":"sand"}">${r.kind==="demo"?"Demo":"Training"}</span><span class="muted small">${esc([TM_ROLE_LABEL[r.role]||"",r.center?tmCenterName(r.center):"",when(r.at)].filter(Boolean).join(" · "))}</span></summary>
      <dl>${F.qs.filter(q=>A[q.k]!==undefined).map(q=>`<dt>${esc(q.q)}</dt><dd>${esc(Array.isArray(A[q.k])?A[q.k].join(", "):A[q.k])}</dd>`).join("")}</dl></details>`;};
  return `<section class="sec"><div class="h"><h2>Feedback</h2><span class="meta">${L.length} response${L.length===1?"":"s"} · coordinators and up can see this</span></div>${avg("demo")}${avg("training")}${L.slice(0,40).map(one).join("")||`<p class="empty">Nothing yet. Responses from /feedback show up here.</p>`}</section>`;
}

/* ---------- the assistant in the corner ---------- */
const TM_QUICK=[["next","When's the next meeting?"],["today","What's on today?"],["whoin","Who's in the office?"],["sigs","How many signatures?"],["feedback","Give feedback"],["msg-coord","Message a coordinator"],["msg-exec","Message an executive"],["msg-any","Message a teammate"],["search","Search the hub"]];
function tmAskMount(){
  if(document.getElementById("askBtn"))return;
  const b=document.createElement("button");b.id="askBtn";b.className="ask-btn";b.type="button";b.setAttribute("aria-haspopup","dialog");b.setAttribute("aria-controls","askPanel");b.title="Ask LEAD";
  b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/></svg><span>Ask LEAD</span><i class="ask-n" id="askN" hidden></i>`;
  const p=document.createElement("section");p.id="askPanel";p.className="ask-panel";p.hidden=true;p.setAttribute("role","dialog");p.setAttribute("aria-label","LEAD assistant");
  document.body.append(b,p);
  b.addEventListener("click",()=>tmAskToggle());
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&TM.askOpen&&!$("#overlay").innerHTML.trim()){tmAskToggle(false);b.focus();}});
  if(!TM.thread.length)TM.thread.push({who:"bot",html:`Hi${ME().first?" "+esc(ME().first):""}. Ask about today, search the hub, or send a teammate a message. Type <b>/feedback</b> to give feedback, or <b>/help</b> for the list.`});
  tmAskPaint();
}
function tmAskToggle(on){TM.askOpen=on===undefined?!TM.askOpen:on;const p=$("#askPanel"),b=$("#askBtn");if(!p)return;p.hidden=!TM.askOpen;b.setAttribute("aria-expanded",String(TM.askOpen));document.documentElement.classList.toggle("ask-on",TM.askOpen);if(TM.askOpen){tmAskPaint();const i=$("#askIn");if(i)i.focus({preventScroll:true});}}
const tmUnread=()=>TM.inbox.filter(m=>!m.read).length;
function tmAskPaint(){
  const n=$("#askN");if(n){const u=tmUnread();n.hidden=!u;n.textContent=u;}
  const p=$("#askPanel");if(!p||p.hidden)return;
  const tab=TM.askTab,u=tmUnread();
  const head=`<div class="ask-h"><b>Ask LEAD</b><div class="ask-tabs" role="tablist"><button role="tab" aria-selected="${tab==="ask"}" data-ask-tab="ask">Assistant</button>${tmX()?`<button role="tab" aria-selected="${tab==="msgs"}" data-ask-tab="msgs">Messages${u?` <i>${u}</i>`:""}</button><button role="tab" aria-selected="${tab==="act"}" data-ask-tab="act">Activity</button>`:""}</div><button class="ask-x" data-ask-min aria-label="${TM.askMin?"Expand":"Minimize"}" title="${TM.askMin?"Expand":"Minimize"}">${TM.askMin?"▴":"▾"}</button><button class="ask-x" data-ask-close aria-label="Close">×</button></div>`;
  p.classList.toggle("min",!!TM.askMin);
  let body;
  if(tab==="msgs")body=tmAskMsgs();
  else if(tab==="act")body=tmAskActivity();
  else body=`<div class="ask-log" id="askLog" aria-live="polite">${TM.thread.map(m=>`<div class="ask-m ${m.who}">${m.html}</div>`).join("")}</div>
    <div class="ask-quick">${TM_QUICK.filter(([k])=>tmX()||!(k.startsWith("msg")||k==="feedback")).map(([k,l])=>`<button data-ask-q="${k}">${esc(l)}</button>`).join("")}</div>
    <form class="ask-f" id="askF"><input id="askIn" autocomplete="off" placeholder="${TM.to?"Message for "+esc(TM.to.name)+"…":"Ask a question, search, or type /help"}" aria-label="Ask LEAD"><button class="btn pri sm" type="submit">${TM.to?"Send":"Go"}</button></form>
    ${TM.to?`<p class="ask-to">To ${esc(TM.to.name)} · <button class="linkbtn" data-ask-cancel>cancel</button></p>`:""}`;
  const keep=(document.activeElement&&document.activeElement.id==="askIn")?$("#askIn").value:null;
  p.innerHTML=head+body;
  if(keep!==null){const i=$("#askIn");if(i){i.value=keep;i.focus();}}
  const log=$("#askLog");if(log)log.scrollTop=log.scrollHeight;
  p.querySelector("[data-ask-close]").onclick=()=>tmAskToggle(false);
  p.querySelector("[data-ask-min]").onclick=()=>{TM.askMin=!TM.askMin;tmAskPaint();};
  p.querySelector(".ask-h").addEventListener("click",e=>{if(TM.askMin&&!e.target.closest("button")){TM.askMin=false;tmAskPaint();}});
  p.querySelectorAll("[data-ask-tab]").forEach(x=>x.onclick=()=>{TM.askTab=x.dataset.askTab;tmAskPaint();if(TM.askTab==="msgs")tmMarkRead();});
  p.querySelectorAll("[data-ask-q]").forEach(x=>x.onclick=()=>tmAskQuick(x.dataset.askQ));
  p.querySelectorAll("[data-ask-ci]").forEach(x=>x.onclick=()=>tmCheckIn(x.dataset.askCi==="1"));
  p.querySelectorAll("[data-ask-go]").forEach(x=>x.onclick=()=>{tmAskToggle(false);const id=x.dataset.askGo;if(id.startsWith("tab:"))go(id.slice(4));else openHit(id);});
  p.querySelectorAll("[data-ask-to]").forEach(x=>x.onclick=()=>{const q=TM.directory.find(d=>d.id===x.dataset.askTo);if(q){TM.to=q;TM.askTab="ask";tmSay("bot",`Writing to <b>${esc(q.name)}</b>. Type your message and press Send.`);}});
  p.querySelectorAll("[data-ask-reply]").forEach(x=>x.onclick=()=>{const m=TM.inbox.find(y=>y.id===x.dataset.askReply);if(m){TM.to={id:m.from,name:m.fromName||m.from};TM.askTab="ask";tmAskPaint();}});
  const c=p.querySelector("[data-ask-cancel]");if(c)c.onclick=()=>{TM.to=null;tmAskPaint();};
  const f=$("#askF");if(f)f.onsubmit=e=>{e.preventDefault();const i=$("#askIn"),t=i.value.trim();if(!t)return;i.value="";tmAsk(t);};
}
function tmSay(who,html){TM.thread.push({who,html});if(TM.thread.length>60)TM.thread.splice(1,TM.thread.length-60);tmAskPaint();return TM.thread[TM.thread.length-1];}
function tmAskMsgs(){
  const all=TM.inbox.map(m=>({...m,_in:true})).concat(TM.sent.map(m=>({...m,_in:false}))).sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,40);
  const when=t=>{if(!t)return "";const d=new Date(t);return d.toLocaleDateString([],{month:"short",day:"numeric"})+" "+d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});};
  return `<div class="ask-log ask-inbox">${all.map(m=>`<div class="ask-msg ${m._in?"in":"out"} ${m._in&&!m.read?"new":""}"><div class="w">${m._in?"From <b>"+esc(m.fromName||m.from)+"</b>":"To <b>"+esc(m.toName||m.to)+"</b>"} · ${esc(when(m.at))}</div><div class="t">${esc(m.text)}</div>${m._in?`<button class="linkbtn" data-ask-reply="${esc(m.id)}">Reply</button>`:""}</div>`).join("")||`<p class="muted small" style="padding:10px">No messages yet. Messages you send and get show here.</p>`}</div>
    <div class="ask-quick">${["msg-coord","msg-exec","msg-any"].map(k=>`<button data-ask-q="${k}">${esc(TM_QUICK.find(q=>q[0]===k)[1])}</button>`).join("")}</div>`;
}
function tmAskActivity(){
  const L=[...TM.activity].sort((a,b)=>(b.at||0)-(a.at||0)).slice(0,40);
  const when=t=>{if(!t)return "";const m=Math.round((Date.now()-t)/60000);if(m<1)return "just now";if(m<60)return m+" min ago";const h=Math.round(m/60);if(h<24)return h+" hr ago";return new Date(t).toLocaleDateString([],{month:"short",day:"numeric"});};
  const dot=p=>{const d=TM.directory.find(x=>x.id===p.by)||(p.by===tmMe()&&FB?{at:Date.now()}:null);return d?tmDot(d):"";};
  const inn=tmInToday();
  return `<div class="ask-log ask-inbox">
    <div class="ask-msg out"><div class="w">In the office today</div><div class="t">${inn.length?esc(inn.map(p=>p.name).join(", ")):"Nobody has checked in yet."}</div></div>
    ${L.map(a=>`<div class="ask-msg act"><div class="w"><span class="tw-av act-av">${esc(tmInitials(a.name))}${dot(a)}</span><b>${esc(a.by===tmMe()?"You":(a.name||""))}</b> · ${esc(when(a.at))}${a.center?" · "+esc(tmCenterName(a.center)):""}</div><div class="t">${esc(a.text)}</div></div>`).join("")||`<p class="muted small" style="padding:10px">Nothing yet. Check-ins, cards moved on the board, meetings added, messages and feedback show up here.</p>`}
  </div>
  <div class="ask-quick"><button data-ask-ci="${tmAmIn()?"0":"1"}">${tmAmIn()?"Check me out":"Check me in"}</button><button data-ask-q="whoin">Who's in?</button></div>`;
}
async function tmMarkRead(){const x=tmX();if(!x)return;for(const m of TM.inbox.filter(m=>!m.read)){try{await x.markRead(m.id);}catch(e){}}}
function tmPeoplePick(role,label){
  const L=TM.directory.filter(p=>!role||p.role===role).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  if(!L.length)return tmSay("bot",`I don't see any ${label} on the team list yet. People show up after they sign in to the team site.`);
  tmSay("bot",`Who should get it?<div class="ask-people">${L.slice(0,30).map(p=>`<button data-ask-to="${esc(p.id)}">${tmDot(p)}${esc(p.name)}<small>${esc([TM_ROLE_LABEL[p.role]||"",tmCenterName(p.center),tmSeen(p)].filter(Boolean).join(" · "))}</small></button>`).join("")}</div>`);
}
function tmAskQuick(k){
  const q=TM_QUICK.find(x=>x[0]===k);
  if(k==="feedback"){tmFeedback();return;}
  if(k==="msg-coord")return tmPeoplePick("coord","coordinators");
  if(k==="msg-exec")return tmPeoplePick("exec","executives");
  if(k==="msg-any")return tmPeoplePick("","teammates");
  if(k==="search"){tmSay("bot","What should I look for? Type a name, an event, a school or a task.");const i=$("#askIn");if(i)i.focus();return;}
  if(q)tmSay("me",esc(q[1]));
  tmAnswer(k);
}
function tmAnswer(k){
  const t0=todayISO();
  if(k==="next"){const nx=tabOK("meetings")?tmNextMeeting():null;return tmSay("bot",nx?`Next meeting: <b>${esc(nx.title||"Meeting")}</b>, ${esc(tmWhen(nx.date,nx.time))}${nx.where?", "+esc(nx.where):""}. <button class="linkbtn" data-ask-go="tab:meetings">Open Meetings</button>`:"No meeting on the calendar. Add one in Meetings with a date and time.");}
  if(k==="today"){const pr=tmProgramsOn(t0),ev=allE().filter(e=>e.date===t0),mt=tabOK("meetings")?S.meetings.filter(m=>m.date===t0):[];
    return tmSay("bot",(ev.length+pr.length+mt.length)?`Today: ${[mt.length?mt.length+" meeting"+(mt.length===1?"":"s"):"",ev.length?ev.length+" event"+(ev.length===1?"":"s"):"",pr.length?pr.length+" program"+(pr.length===1?"":"s"):""].filter(Boolean).join(", ")}.<ul>${mt.map(m=>`<li>${esc((m.time?tmClock(m.time)+" ":"")+(m.title||"Meeting"))}</li>`).join("")}${ev.slice(0,5).map(e=>`<li><button class="linkbtn" data-ask-go="${esc(e.id)}">${esc(e.name)}</button>${e.time?" · "+esc(e.time):""}</li>`).join("")}${pr.slice(0,5).map(p=>`<li>${esc(p.n)}${p.t?" · "+esc(p.t):""}</li>`).join("")}</ul>`:"Nothing on the calendar for today.");}
  if(k==="whoin"){if(!tmX())return tmSay("bot","Check-ins work on the team site.");const L=tmInToday();return tmSay("bot",(L.length?`In the office today: ${L.map(p=>`<b>${esc(p.name)}</b>${p.center?" ("+esc(tmCenterName(p.center))+")":""}`).join(", ")}.`:"Nobody has checked in today.")+` <button class="linkbtn" data-ask-ci="${tmAmIn()?"0":"1"}">${tmAmIn()?"Check me out":"Check me in"}</button>`);}
  if(k==="sigs"){const st=S.settings||{},g=st.sigGoal||500,sg=sigTotals(),pl=tmSigsToday();return tmSay("bot",`<b>${sg.all}</b> of ${g} signatures so far${pl?`, ${pl} logged today`:""}.`);}
  if(k==="help")return tmSay("bot",`Type <b>/guide</b> for the demo guide. I can:<ul><li>answer <b>when's the next meeting</b>, <b>what's on today</b>, <b>who's in</b>, <b>how many signatures</b></li><li><b>search</b> people, events, tasks and apps: just type a name</li><li><b>message Iris: running late</b>, or <b>message a coordinator</b></li><li><b>check me in</b> / <b>check me out</b></li><li><b>/feedback</b> for the training or demo form</li><li><b>/inquiry</b> followed by a question, to reason over the hub's data${tmAIOn()?"":" (once the owner adds the key)"}</li></ul>`);
}
async function tmSend(to,text){
  const x=tmX();if(!x)return tmSay("bot","Messages work on the team site.");
  try{await x.sendMessage(to,text);tmSay("bot",`Sent to <b>${esc(to.name)}</b>. They'll see it in Messages next time they open LEAD.`);tmLog("message","sent a message to "+to.name);}
  catch(e){tmSay("bot","Couldn't send it: "+esc((e&&e.code)==="permission-denied"?"the database isn't set up for messages yet.":(e&&e.message)||String(e)));}
}
function tmFindPeople(q){const n=q.toLowerCase().trim();if(!n)return [];return TM.directory.map(p=>{const nm=(p.name||"").toLowerCase();const s=nm===n?1:nm.split(/\s+/).some(w=>w===n)?0.9:nm.startsWith(n)?0.8:nm.includes(n)?0.6:0;return {p,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).map(x=>x.p);}
function tmAsk(text){
  tmSay("me",esc(text));
  if(TM.to){const to=TM.to;TM.to=null;tmSend(to,text);return;}
  const t=text.toLowerCase();
  if(t==="/feedback"||t==="/help"||t.startsWith("/inquiry")||t==="/in"||t==="/out"||t==="/guide"){
    if(t==="/feedback")return tmFeedback();
    if(t==="/guide"){tmAskToggle(false);return go("guide");}
    if(t==="/help")return tmAnswer("help");
    if(t==="/in")return tmCheckIn(true);
    if(t==="/out")return tmCheckIn(false);
    const q=text.slice(8).trim();if(!q)return tmSay("bot","Type the question after /inquiry, like <b>/inquiry which events this week can we table at?</b>");
    return tmInquiry(q);
  }
  let m=text.match(/^(?:message|msg|text|tell|send(?: a message to)?)\s+(.+?)(?:\s*[:,-]\s+|\s+that\s+)(.+)$/i)||text.match(/^(?:message|msg|text|tell)\s+(\S+)\s+(.+)$/i);
  if(m||/^(message|msg|text|tell)\b/i.test(t)){
    if(!tmX())return tmSay("bot","Messages work on the team site.");
    const who=m?m[1]:text.replace(/^(message|msg|text|tell)\s*/i,""),body=m?m[2]:"";
    if(/^(a |the |my )?coord/i.test(who))return tmPeoplePick("coord","coordinators");
    if(/^(an |the |my )?exec/i.test(who))return tmPeoplePick("exec","executives");
    const L=tmFindPeople(who);
    if(!L.length)return tmSay("bot",`I couldn't find "${esc(who)}" on the team list. <button class="linkbtn" data-ask-q="msg-any">Show everyone</button>`);
    if(L.length>1&&!body)return tmSay("bot",`Which one?<div class="ask-people">${L.slice(0,8).map(p=>`<button data-ask-to="${esc(p.id)}">${esc(p.name)}<small>${esc(tmCenterName(p.center))}</small></button>`).join("")}</div>`);
    if(!body){TM.to=L[0];return tmSay("bot",`Writing to <b>${esc(L[0].name)}</b>. Type your message and press Send.`);}
    return tmSend(L[0],body);
  }
  if(/next meeting|when.*meeting/.test(t))return tmAnswer("next");
  if(/who.*(is in|in the office|checked in)|in the office/.test(t))return tmAnswer("whoin");
  if(/signature|how many sig/.test(t))return tmAnswer("sigs");
  if(/^(what'?s|whats) (on )?today|^today\??$/.test(t))return tmAnswer("today");
  if(/^check (me )?in\b|^i'?m in\b/.test(t))return tmCheckIn(true);
  if(/^check (me )?out\b/.test(t))return tmCheckIn(false);
  if(/^(help|what can you do)\b/.test(t))return tmAnswer("help");
  const looksLikeQuestion=/\?$|^(what|which|who|when|where|how|why|should|can|is|are|do|does|did|will)\b/.test(t)||text.split(/\s+/).length>4;
  if(looksLikeQuestion&&tmAIOn())return tmInquiry(text);
  const q=text.replace(/^(search|find|look up|lookup|where is|who is)\s+(for\s+)?/i,"").replace(/[?.!]+$/,"").trim();
  const found=tmSearch(q);
  if(!found)return tmSay("bot",`Nothing in the hub matches "${esc(q)}". Try a shorter word${tmAIOn()?", or ask a full question":""}.`);
  tmSay("bot",`Here's what I found for "${esc(q)}":${found}`);
}
function tmSearch(q){
  let hits=[];try{hits=searchHits(q.toLowerCase());}catch(e){}
  const apps=APPS.filter(a=>appOK(a)&&!a.ext&&(appName(a)+" "+a.desc).toLowerCase().includes(q.toLowerCase())).slice(0,3);
  const ppl=tmFindPeople(q).slice(0,3);
  if(!hits.length&&!apps.length&&!ppl.length)return "";
  return `<ul>${apps.map(a=>`<li><button class="linkbtn" data-ask-go="tab:${a.id}">${esc(appName(a))}</button> <span class="muted">app</span></li>`).join("")}${hits.slice(0,8).map(h=>`<li><button class="linkbtn" data-ask-go="${esc(h.id)}">${esc(h.n)}</button> <span class="muted">${esc(h.k)}</span></li>`).join("")}${ppl.map(p=>`<li><button class="linkbtn" data-ask-to="${esc(p.id)}">${esc(p.name)}</button> <span class="muted">teammate · message</span></li>`).join("")}</ul>`;
}

/* ---------- /inquiry: reasoning over the hub's data with Claude (the owner adds the key on the owner page) ---------- */
const tmAIOn=()=>!!(TM.ai&&TM.ai.key);
(function tmLoadAI(){try{const x=tmX();if(!x||!x.getAI){TM.ai=null;return;}x.getAI().then(c=>{TM.ai=c&&c.key?c:null;}).catch(()=>{TM.ai=null;});}catch(e){TM.ai=null;}})();
const TM_AI_SYSTEM="You are LEAD's assistant inside the team's hub. LEAD is Leaders for Educational Advocacy and Diversity, a community organization in Connecticut; the people asking are organizers at its centers. Answer in plain, short sentences. Use only the hub data provided with the question; when the answer isn't in it, say so and name the hub page where it would be. Never invent names, numbers, dates or phone numbers. Don't repeat the data back; answer the question, then stop. Stay under 120 words unless a list is asked for. Plain text, no markdown headings.";
function tmAIContext(q){
  const t0=todayISO(),words=q.toLowerCase().split(/[^a-z0-9']+/).filter(w=>w.length>2),parts=[];
  const hit=s=>{const x=String(s||"").toLowerCase();return words.some(w=>x.includes(w));};
  const st=S.settings||{},sg=sigTotals();
  parts.push(`Now: ${fmtLong(t0)}, ${new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}. Asking: ${ME().name||"a teammate"} (${FB?FB.roleLabel:"Assistant Coordinator"}${FB&&FB.centerLabel?", looking at "+FB.centerLabel:""}).`);
  parts.push(`Signatures of support: ${sg.all} of a ${st.sigGoal||500} goal${st.goalDate?" by "+fmtDate(st.goalDate):""} (${sg.t} from people & orgs, ${sg.e} at events, ${sg.l} from canvass shifts, ${sg.m} counted by hand).`);
  const up=tmUpcoming().slice(0,8);if(up.length)parts.push("Meetings coming up: "+up.map(m=>`${m.title||"Meeting"} (${tmWhen(m.date,m.time)}${m.where?", "+m.where:""}${m.with?", with "+m.with:""})`).join("; ")+".");
  const past=S.meetings.filter(m=>m.date&&m.date<=t0&&(hit(m.title)||hit(m.notes)||hit(m.takeaways))).slice(0,3);past.forEach(m=>parts.push(`Meeting notes, ${m.title} (${fmtDate(m.date)}): ${(m.notes||"").slice(0,300)} Takeaways: ${(m.takeaways||"").slice(0,300)} Next: ${(m.next||"").slice(0,200)}`));
  const ev=allE().filter(e=>e.date&&e.date>=t0).sort((a,b)=>a.date<b.date?-1:1);
  const evSel=ev.filter(e=>e.date<=addDays(t0,13)).slice(0,10).concat(ev.filter(e=>hit(e.name)||hit(e.venue)||hit(e.host)).slice(0,5));
  if(evSel.length)parts.push("Events: "+[...new Set(evSel)].map(e=>`${e.name} (${fmtDate(e.date)}${e.time?" "+e.time:""}, ${townOf(e)}${e.venue?", "+e.venue:""}${e.can_table===true?", we can table":e.can_table===false?", no tabling":""})`).join("; ")+".");
  const pr=tmProgramsOn(t0);if(pr.length)parts.push("Programs today: "+pr.map(p=>p.n+(p.t?" at "+p.t:"")).join("; ")+".");
  try{const wk=[];for(let i=0;i<7;i++){const d=addDays(t0,i);ctrOn(d).forEach(p=>wk.push(`${p.short||p.name} ${fmtDate(d)} ${ctrStart(p)}`));}if(wk.length)parts.push("Center programs this week: "+wk.slice(0,14).join("; ")+".");}catch(e){}
  const due=tmDoNow().slice(0,12);if(due.length)parts.push("Due soon: "+due.map(x=>`${TM_KIND[x.kind]}: ${x.n}${x.date?" ("+fmtDate(x.date)+")":""}`).join("; ")+".");
  let hits=[];try{hits=searchHits(q.toLowerCase());}catch(e){}
  const T=allT();
  hits.slice(0,8).forEach(h=>{const r=T.find(x=>x.id===h.id);if(r)parts.push(`${r.name} (${r.subtype||r.type||""}, ${townOf(r)}): status ${r.status||""}${r.contact_name?", contact "+r.contact_name+(r.role?" ("+r.role+")":""):""}${r.phone?", phone "+r.phone:""}${r.email?", email "+r.email:""}${r.next_step?", next step: "+r.next_step:""}${r.next_date?" by "+fmtDate(r.next_date):""}${r.notes?". Notes: "+String(r.notes).slice(0,200):""}`);else parts.push(`${h.n} (${h.k})`);});
  const pb=S.playbook.filter(p=>hit(p.title)||hit(p.body)).slice(0,4);pb.forEach(p=>parts.push(`How-to, ${p.title}: ${String(p.body||"").slice(0,400)}`));
  const oq=S.questions.filter(x=>x.status!=="answered"&&hit(x.q)).slice(0,3);if(oq.length)parts.push("Open questions nobody has answered yet: "+oq.map(x=>x.q).join(" | "));
  if(tmX()){const inn=tmInToday();parts.push("In the office today: "+(inn.length?inn.map(p=>p.name).join(", "):"nobody checked in")+".");
    const dir=tmPeople();if(dir.length)parts.push("Team: "+TM_LEVELS.map(([r,l])=>{const L=dir.filter(p=>p.role===r);return L.length?`${l}: ${L.map(p=>p.name+(p.center?" ("+tmCenterName(p.center)+")":"")).join(", ")}`:"";}).filter(Boolean).join(". ")+".");}
  let out="";for(const p of parts){if(out.length+p.length>9000)break;out+=p+"\n";}
  return out;
}
async function tmInquiry(q){
  if(!tmAIOn()){const found=tmSearch(q);return tmSay("bot",(found?`The question-answering part isn't connected yet, but here's what matches in the hub:${found}`:"The question-answering part isn't connected yet (the owner adds the key on the owner page). Try a name or a word to search the hub."));}
  let used=0;try{used=+(sessionStorage.getItem("lead_ai_n")||0);}catch(e){}
  if(used>=60)return tmSay("bot","That's a lot of questions for one sitting. Give it a rest and try again later.");
  const bubble=tmSay("bot",`<span class="gate-spin" aria-hidden="true"></span>Thinking…`);
  try{
    const body={model:TM.ai.model||"claude-sonnet-5-5",max_tokens:1500,system:TM_AI_SYSTEM,output_config:{effort:"low"},fallbacks:"default",
      messages:[{role:"user",content:"Hub data:\n"+tmAIContext(q)+"\nQuestion: "+q}]};
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"content-type":"application/json","x-api-key":TM.ai.key,"anthropic-version":"2026-10-21","anthropic-beta":"server-side-fallback-2026-07-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify(body)});
    if(!r.ok){let d="";try{d=(await r.json()).error.message;}catch(e){}throw new Error(r.status===401?"the key isn't accepted. Ask the owner to check it.":r.status===429?"too many questions right now. Try again in a minute.":r.status===402||/credit|billing/i.test(d)?"the spending limit has been reached.":d||("error "+r.status));}
    const j=await r.json();
    try{sessionStorage.setItem("lead_ai_n",String(used+1));}catch(e){}
    const text=j.stop_reason==="refusal"?"I can't help with that one.":j.content.filter(b=>b.type==="text").map(b=>b.text).join("\n").trim()||"I didn't get an answer back. Try asking another way.";
    bubble.html=esc(text).replace(/\n/g,"<br>");
    const found=tmSearch(q);if(found&&/\b(who|where|phone|email|contact|call)\b/i.test(q))bubble.html+=`<div class="muted small" style="margin-top:6px">In the hub:</div>${found}`;
    if(j.usage)console.info("[hub] inquiry tokens",j.usage.input_tokens,"in,",j.usage.output_tokens,"out");
  }catch(e){bubble.html="Couldn't get an answer: "+esc((e&&e.message)||String(e));}
  tmAskPaint();
}
tmAskMount();
