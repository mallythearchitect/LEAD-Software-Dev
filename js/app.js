/* LEAD — team edition.
   This file holds no personal data. People, contacts, signers and saved work load from the
   team database after sign-in (js/gate.js). FB describes the signed-in person; it is null when
   the page runs as a single local file. */
const FB=window.__FB||null;
function ME(){const m=(FB&&FB.me)||{};const name=m.name||"";return {name,first:name.split(/\s+/)[0]||"",title:m.title||"",phone:m.phone||"",email:m.workEmail||m.email||"",place:m.place||"LEAD Greater Hartford",town:m.town||"East Hartford",city:m.city||"East Hartford, CT"};}
function SIGN_LINES(){const m=ME();return [m.name,m.place,m.phone].filter(Boolean).join("\n");}
function CTA(k){const c=(window.__D&&window.__D.CENTER)||{};return c[k]||"(ask your coordinator)";}

/* ============ constants ============ */
const STATUSES=["Prospect","Contacted","Supporter","Champion","Declined"];
const SLABEL={Prospect:"Not reached yet",Contacted:"Talked to",Supporter:"Supports us",Champion:"Champion",Declined:"Said no"};
const SVAR={Prospect:"var(--notyet)",Contacted:"var(--talked)",Supporter:"var(--supports)",Champion:"var(--champion)",Declined:"var(--declined)"};
const LANES=["B-LEAD","Charters & leaders","Libertas canvassing","My role","How LEAD works"];
const PB_STATUS={confirmed:["Confirmed","green"],guess:["Best guess","sand"],unknown:["Unknown","red"]};
const LOG_TAGS=["note","learned","did","blocker","idea"];
const DOW=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const TITLES={today:"Today",tasks:"Tasks",map:"Map",people:"People & orgs",events:"Events",team:"Canvass",board:"Board of Champions",playbook:"Playbook",org:"Who's who",meetings:"Meetings",programs:"Programs & videos",log:"Log",hours:"Hours & invoices",settings:"Settings",cultures:"Cultures",proposals:"Proposals"};
const TSECTIONS=["B-LEAD","Charters & leaders","Libertas canvassing","Board of Champions","Events","My role","Other"];
const TSTATUS=[["todo","To do"],["doing","Doing"],["waiting","Waiting on someone"],["done","Done"]];
const PARTNER_TYPES=[["","None yet"],["Collaboration","Collaboration (MOU)"],["Sponsor","Sponsor"],["Program","Program partner"]];
const MOU=[["","No MOU"],["Discussed","MOU discussed"],["Drafted","MOU drafted"],["Signed","MOU signed"]];
const GIVES=[["advocate","Will advocate at the LOB"],["host","Hosts or co-hosts programs"],["flyers","Shares our flyers"],["space","Offers space"],["signatures","Collects signatures"]];
const PROGRAMS=["Financial Literacy","ESOL","Citizenship","Educational Options","Civic Engagement","Universal History","Health and Wellbeing","Other"];
const ASSESS_Q=[["q1","Who's there","Families or the people who reach them: 2. Some: 1. Barely: 0."],["q2","Our role","We present or table: 2. We can work the room: 1. Just attend: 0."],["q3","Calendar fit","Clear on your calendar: 2. Movable conflict: 1. Hard conflict: 0."],["q4","Leads to","A real next step (grant, hearing, partner): 2. Maybe: 1. Nothing: 0."],["q5","Cost to get in","Free and close: 2. Some cost or drive: 1. Expensive or far: 0."]];
const TOWN_ALIAS={"Milford (statewide)":"Statewide","Statewide (Hartford area)":"Statewide","Bloomfield/Hartford":"Bloomfield","Farmington (Hartford market)":"Farmington","Windsor/Hartford":"Windsor"};

/* ============ state ============ */
const S={tab:"home",db:undefined,canWrite:true,loaded:{},
  edits:{},added:{},geo:{},tasks:[],team:[],shifts:[],playbook:[],questions:[],org:[],due:[],log:[],board:[],meetings:[],sessions:[],videos:[],hours:[],proposals:[],settings:null,
  pf:{q:"",lane:"",status:"",comm:"",type:"",town:"",pri:""},ps:{key:"priority",dir:1},
  ef:{q:"",town:"",etype:"",comm:"",table:"",past:false},
  mf:{lane:"",status:"",town:""},
  pb:"howto",pbLane:"",pbStatus:"",orgQ:"",tv:"list",tSec:"",tDone:false,calMonth:""};
const $=(s,el=document)=>el.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=p=>(p||"x")+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const linkify=s=>esc(s).replace(/(https?:\/\/[^\s)]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');

/* ============ dates ============ */
function todayISO(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function parseISO(s){if(!s)return null;const [y,m,d]=String(s).slice(0,10).split("-").map(Number);if(!y||!m||!d)return null;return new Date(y,m-1,d);}
function daysFromToday(s){const d=parseISO(s);if(!d)return null;return Math.round((d-parseISO(todayISO()))/86400000);}
function fmtDate(s,y){const d=parseISO(s);if(!d)return "";return DOW[d.getDay()]+" "+MON[d.getMonth()]+" "+d.getDate()+(y?" "+d.getFullYear():"");}
function fmtLong(s){const d=parseISO(s);return ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]+", "+["January","February","March","April","May","June","July","August","September","October","November","December"][d.getMonth()]+" "+d.getDate();}
function addDays(s,n){const d=parseISO(s);d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function nextDow(dow){const t=parseISO(todayISO());return addDays(todayISO(),(dow-t.getDay()+7)%7);}
function rel(n){if(n===null)return "";if(n===0)return "today";if(n===1)return "tomorrow";if(n===-1)return "yesterday";return n<0?Math.abs(n)+" days ago":"in "+n+" days";}
function weekKey(d){const x=parseISO(d);if(!x)return "";x.setDate(x.getDate()-x.getDay());return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");}

/* ============ toast ============ */
let toastT;function toast(m){let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast";document.body.appendChild(t);}t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},2200);}
function copyText(txt,ok){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(txt).then(()=>toast(ok||"Copied"),()=>showCopyBox(txt));}else showCopyBox(txt);}
function showCopyBox(txt){openSheet("Copy this",`<textarea style="width:100%;min-height:200px;background:var(--surface2);border:1px solid var(--line);border-radius:6px;padding:8px" readonly>${esc(txt)}</textarea>`);const ta=$("#overlay textarea");ta.focus();ta.select();}

/* ============ db ============ */
const LOCAL=!(window.claude&&typeof window.claude.use==="function");
const LKEY="lead_hub_v1";
function localDB(){
  let store=null;try{store=JSON.parse(localStorage.getItem(LKEY)||"null");}catch(e){store=null;}
  if(!store||typeof store!=="object"){store={};const seed=(typeof LOCAL_SEED!=="undefined"&&LOCAL_SEED)||{};for(const [c,docs] of Object.entries(seed))store[c]=JSON.parse(JSON.stringify(docs));persist();}
  function persist(){try{localStorage.setItem(LKEY,JSON.stringify(store));}catch(e){toast("Couldn't save in this browser. Download a backup.");}}
  const subs={};const fire=c=>(subs[c]||[]).forEach(fn=>fn());
  const sub=(c,fn)=>{(subs[c]=subs[c]||[]).push(fn);setTimeout(fn,0);return ()=>{subs[c]=(subs[c]||[]).filter(x=>x!==fn);};};
  const docRef=(c,id)=>({id,path:c+"/"+id,
    set:async d=>{store[c]=store[c]||{};store[c][id]=JSON.parse(JSON.stringify(d));persist();fire(c);},
    delete:async()=>{if(store[c]&&store[c][id]){delete store[c][id];persist();fire(c);}},
    get:async()=>({id,exists:!!(store[c]&&store[c][id]),data:()=>store[c]&&store[c][id]}),
    onSnapshot:next=>sub(c,()=>next({id,exists:!!(store[c]&&store[c][id]),data:()=>store[c]&&store[c][id]}))});
  return {collection:c=>({doc:id=>docRef(c,id||uid()),add:async d=>{const r=docRef(c,uid());await r.set(d);return r;},onSnapshot:next=>sub(c,()=>{const docs=Object.entries(store[c]||{}).map(([id,d])=>({id,exists:true,data:()=>d}));next({docs,size:docs.length,empty:!docs.length});})}),
    doc:path=>{const [c,id]=path.split("/");return docRef(c,id);},
    _all:()=>JSON.parse(JSON.stringify(store)),_replace:o=>{store=o;persist();Object.keys(subs).forEach(fire);}};
}
function dl(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type||"text/plain;charset=utf-8"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);}
function copyOrDl(text,name,ok){if(LOCAL)dl(name,text,name.endsWith(".csv")?"text/csv;charset=utf-8":name.endsWith(".json")?"application/json":"text/plain;charset=utf-8");else copyText(text,ok);}
async function useCap(n){try{return window.claude&&window.claude.use?(await window.claude.use(n)):null;}catch(e){return null;}}
async function write(col,id,data){
  if(!S.db){toast(FB?"Still connecting. Try again in a moment.":"Not connected. Open this page signed in to claude.ai.");return false;}
  try{await S.db.collection(col).doc(id).set(data);return true;}
  catch(e){if(FB&&e&&e.code==="permission-denied"){toast("Your level can't change that. Ask your coordinator.");return false;}if(e&&e.code==="invalid_argument"&&S.canWrite!==false){S.canWrite=false;setStatus();}toast("Couldn't save: "+(e&&e.message||"unknown"));return false;}
}
async function remove(col,id){if(!S.db)return false;try{await S.db.collection(col).doc(id).delete();return true;}catch(e){toast(FB&&e&&e.code==="permission-denied"?"Your level can't delete that.":"Couldn't delete: "+(e&&e.message||""));return false;}}
function setStatus(){const d=$("#dot"),t=$("#statusText");if(FB){d.className=S.db?"on":"";t.textContent=S.db?"Saved for the team":"Connecting…";return;}
  if(LOCAL&&S.db){d.className="on";t.textContent="Saved in this browser";return;}
  if(S.db===undefined){d.className="";t.textContent="Connecting…";return;}
  if(S.db===null){d.className="off";t.textContent="Not connected";return;}
  if(S.canWrite===false){d.className="off";t.textContent="Read only";return;}
  const all=["edits","added","tasks","team","shifts","playbook","questions","org","due","log","board","meetings","sessions","videos","hours","proposals","settings","letters"].every(k=>S.loaded[k]);
  d.className=all?"on":"";t.textContent=all?"Saved to your hub":"Loading…";}
function subscribe(){
  const lists={tasks:"tasks",team:"team",shifts:"shifts",playbook:"playbook",questions:"questions",org:"people",due:"due",log:"log",board:"board",meetings:"meetings",sessions:"sessions",videos:"videos",hours:"hours",proposals:"proposals",ready:"ready",signers:"signers",cvdocs:"cv",letters:"letters"};
  for(const [k,col] of Object.entries(lists)){S.db.collection(col).onSnapshot(sn=>{S[k]=sn.docs.map(d=>({id:d.id,...d.data()}));S.loaded[k]=true;setStatus();render();},e=>toast(col+": "+(e&&e.message||"")));}
  S.db.collection("edits").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>o[d.id]=d.data());S.edits=o;S.loaded.edits=true;setStatus();render();},e=>toast("edits: "+(e&&e.message||"")));
  S.db.collection("added").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>o[d.id]={id:d.id,...d.data()});S.added=o;S.loaded.added=true;setStatus();render();},e=>toast("added: "+(e&&e.message||"")));
  S.db.collection("geo").onSnapshot(sn=>{const o={};sn.docs.forEach(d=>o[d.id]=d.data());S.geo=o;if(S.tab==="map")render();},e=>{});
  S.db.doc("meta/settings").onSnapshot(sn=>{S.settings=sn.exists?sn.data():{sigGoal:500,goalDate:"2026-11-03",manual:0,links:[],rate:27,invoicedThrough:"",nextInvoiceNo:1};S.loaded.settings=true;setStatus();render();},e=>toast("settings: "+(e&&e.message||"")));
}
async function boot(){if(FB){S.db=FB.db;S.canWrite=true;setStatus();subscribe();return;}if(LOCAL){S.db=localDB();S.canWrite=true;setStatus();subscribe();return;}S.db=undefined;setStatus();render();const user=await useCap("user");const db=await useCap("db");S.db=db||null;if(user){try{const w=await user.can("data.write");if(w===false)S.canWrite=false;}catch(e){}}setStatus();if(S.db)subscribe();else render();}

/* ============ data access ============ */
function laneOf(t){if(t.lane)return t.lane;const st=(t.subtype||"").toLowerCase();return (t.type==="School"||t.type==="Education Leader"||/board of ed|boe|superintendent|charter|school/.test(st))?"Charters & leaders":"B-LEAD";}
function townOf(x){const t=x.town||"";return TOWN_ALIAS[t]||t;}
function merge(rec){const e=S.edits[rec.id]||{};return {...rec,status:e.status||"Prospect",signatures:+e.signatures||0,q_charter:e.q_charter||"",q_options:e.q_options||"",notes:e.notes||"",owner:e.owner||"",last_contact:e.last_contact||"",next_step:e.next_step||"",next_date:e.next_date||""};}
function allT(){return REF.TARGETS.map(merge).concat(Object.values(S.added).filter(a=>a.kind!=="event").map(merge));}
function allE(){return REF.EVENTS.map(merge).concat(Object.values(S.added).filter(a=>a.kind==="event").map(merge));}
function getRec(id){const a=S.added[id];if(a)return merge(a);const t=REF.TARGETS.find(x=>x.id===id);if(t)return merge(t);const e=REF.EVENTS.find(x=>x.id===id);return e?merge(e):null;}
function isEvent(r){return r.kind==="event"||("date" in r&&!("type" in r));}
function sigTotals(){const T=allT(),E=allE();const t=T.reduce((s,x)=>s+x.signatures,0),e=E.reduce((s,x)=>s+x.signatures,0),po=(typeof cvPrimary==="function")?cvPrimary():"",l=S.shifts.filter(x=>!po||!x.org||x.org===po).reduce((s,x)=>s+(+x.sigs||0),0),m=+(S.settings&&S.settings.manual)||0;return {t,e,l,m,all:t+e+l+m};}
async function saveEdit(id,patch){const cur=S.edits[id]||{};const next={...cur,...patch};S.edits[id]=next;render();if($("#overlay .drawer"))openDetail(id,true);return write("edits",id,next);}

function uninvoiced(){const st=S.settings||{};const thr=st.invoicedThrough||"";const L=S.hours.filter(h=>!thr||h.date>thr);const h=L.reduce((a,x)=>a+(+x.hours||0),0);return {h:Math.round(h*100)/100,amt:Math.round(h*(+st.rate||27)*100)/100,rows:L};}
function assessOf(r){const a=(S.edits[r.id]||{}).assess||{};const score=["q1","q2","q3","q4","q5"].reduce((t,k)=>t+(a[k]===undefined||a[k]===""?0:+a[k]),0);const answered=["q1","q2","q3","q4","q5"].filter(k=>a[k]!==undefined&&a[k]!=="").length;
  let d=null,label="",cls="";if(a.hold==="Yes"){d="HOLD";label="Needs approval first";cls="hold";}else if(a.skip==="Yes"){d="SKIP";label="No one LEAD needs is there";cls="skip";}else if(answered===5){if(score>=8){d="GO";label="Must attend";cls="go";}else if(score>=5){d="GO IF IT FITS";label="Partaking";cls="fit";}else{d="SKIP";label="Write the reason";cls="skip";}}
  return {...a,score,answered,decision:d,label,cls};}
function aiPrompt(r){const a=assessOf(r);const d=(S.edits[r.id]||{}).debrief||{};const yn=v=>v||"not answered";
  return `You are helping ${ME().name||"a LEAD team member"}, who works for LEAD (Leaders for Educational Advocacy and Diversity) in ${ME().city}, decide whether an event is worth their time. LEAD's goals at events: network first, then push LEAD's free family programs (financial literacy, ESOL, citizenship, educational options). ${ME().first||"They"} also collect${ME().first?"s":""} petition signatures of support for a proposed Libertas Academy charter school (goal 500 by Nov 3, 2026) and recruits "Champions" (community leaders who will show up when a charter needs support). He stays neutral at political events before Nov 3.\n\nEvent: ${r.name}\nWhen: ${[r.date?fmtDate(r.date,true):"",r.time||""].filter(Boolean).join(", ")||"unknown"}\nWhere: ${[r.venue,r.address,townOf(r)].filter(Boolean).join(", ")||"unknown"}\nHost: ${r.host||"unknown"}\nWho's there: ${a.who||r.community&&r.community.join(", ")||"unknown"}\nCan LEAD table: ${r.can_table===true?"yes":r.can_table===false?"no table listed":"not stated"}\nCost: ${r.cost||"unknown"}\nWhy it was on the list: ${r.why||""}\nLink: ${r.url||"none"}\n\n${ME().first||"My"}'s checks: commits LEAD before approval: ${yn(a.hold)}; no one LEAD needs in the room: ${yn(a.skip)}; political or candidate-hosted before Nov 3: ${yn(a.warn)}.\nHis scores (0 to 2 each): who's there ${a.q1??"-"}, our role ${a.q2??"-"}, calendar fit ${a.q3??"-"}, leads to ${a.q4??"-"}, cost to get in ${a.q5??"-"}. Total ${a.score}/10.\nHis notes: ${r.notes||"none"}${a.reason?"\nReason noted: "+a.reason:""}\n\nWrite a short, plain-language assessment (120 to 200 words) he can paste into an email to his supervisor Kelly: whether to go and in what role, who specifically to meet and what to ask them, what to bring, one risk, and the single next step. No headings, no bullet lists, no hype. Use first person as ${ME().first||"the team member"}.`;}
async function aiAssess(r){const btn=$("#aiBtn"),busy=$("#aiBusy"),ta=$("#aiText");if(LOCAL){copyText(aiPrompt(r),"Prompt copied. Paste it into Claude, then paste the answer back here.");return;}
  const sample=await useCap("sample");if(!sample){toast("AI isn't available in this view. Copying the prompt instead.");copyText(aiPrompt(r));return;}
  btn.disabled=true;busy.classList.remove("hide");try{const res=await sample(aiPrompt(r),{modelTier:"default",onText:({text})=>{ta.value=text;busy.textContent="Writing…";}});ta.value=res.text;const a={...((S.edits[r.id]||{}).assess||{})};a.ai=res.text;await saveEdit(r.id,{assess:a});toast("Write-up saved with the event");}
  catch(e){toast(e&&e.code==="not_granted"?"AI was declined for this page. Copying the prompt instead.":"Couldn't write it: "+(e&&e.message||"error"));if(e&&e.code==="not_granted")copyText(aiPrompt(r));}
  finally{busy.classList.add("hide");busy.textContent="Thinking…";btn.disabled=false;}}
function assessText(r){const a=assessOf(r);const yn=v=>v==="Yes"?"Yes":v==="No"?"No":"—";const line=(k,i)=>`  ${i+1}. ${k[1].padEnd(28,".")} ${a[k[0]]===undefined||a[k[0]]===""?"–":a[k[0]]} / 2`;
  return `EVENT ASSESSMENT\nAssessed by:  ${ME().name} · ${ME().place} · ${fmtDate(todayISO(),true)}\nEvent:        ${r.name}${r.date?" ("+fmtDate(r.date,true)+(r.time?", "+r.time:"")+")":""}\nWho's there:  ${a.who||"—"}\n\nCHECKS\n  Hold    — commits LEAD before approval ........ ${yn(a.hold)}\n  Skip    — no one LEAD needs in the room ....... ${yn(a.skip)}\n  Warning — election-season event ............... ${yn(a.warn)}${a.warn==="Yes"?"\n  WARNING: Candidate-hosted or political event before Nov 3, 2026. Attend as an observer and keep LEAD neutral.":""}\n\nSCORE\n${ASSESS_Q.map(line).join("\n")}\n  ----------------------------------------------------------------\n  TOTAL                          ${a.score} / 10\n\nDECISION:   ${a.decision||"(not finished)"}${a.decision==="GO"?" (8–10)":a.decision==="GO IF IT FITS"?" (5–7)":""}\nLABEL:      ${a.label||"—"}\nREASON:     ${a.reason||"—"}\nNEXT STEP:  ${r.next_step||"—"}\n`;}
function introEmail(r){const who=r.contact_name||r.name;const first=who.split(",")[0].trim();
  return `Subject: ${ME().place} – working together\n\nHi ${first},\n\nMy name is ${ME().name}, and I'm with LEAD in ${ME().town} (Leaders for Educational Advocacy and Diversity). We run free family programs: financial literacy, ESOL, citizenship support, and help with educational options.\n\nI'd like to find a time to talk about how ${r.contact_name?r.name:"you"} and LEAD could work together. A few ways we partner: collaborating on programs, offering space and resources at our center to host events, and showing up for each other's work in the community.\n\nWould you have 15 minutes in the next two weeks?\n\nBest,\n${SIGN_LINES()}\n`;}
function tableEmail(r){return `Subject: ${r.name} – community resource table\n\nHi${r.host?" "+r.host.split(",")[0]:""},\n\nMy name is ${ME().name}, and I'm with LEAD in ${ME().town}. I came across ${r.name}${r.date?" on "+fmtDate(r.date,true):""} and wanted to reach out.\n\nLEAD runs free programs for families, including financial literacy, ESOL and citizenship support. We're considering taking part as a community resource and would love to have a table.\n\nA few quick questions:\n- Is there space for community resource tables?\n- Is there a sign-up form, fee or deadline?\n- Would there be a chance to briefly share LEAD's family programs?\n\nThank you for your time. I look forward to hearing from you.\n\nBest,\n${SIGN_LINES()}\n`;}
function weekStart(){return weekKey(todayISO());}
function debriefOf(r){return (S.edits[r.id]||{}).debrief||null;}
function hasDebrief(r){const d=debriefOf(r);return !!(d&&(d.connected||d.conversations||d.accomplished||d.followups));}
function needsReport(){const t0=todayISO(),cut=addDays(t0,-10);return allE().filter(e=>e.date&&e.date<t0&&e.date>=cut&&!hasDebrief(e)&&(["GO","GO IF IT FITS"].includes(assessOf(e).decision)||(S.edits[e.id]&&S.edits[e.id].went))).sort((a,b)=>a.date<b.date?1:-1);}
function bullets(t){return (t||"").split("\n").map(x=>x.trim()).filter(Boolean).map(x=>"• "+x.replace(/^[•\-*]\s*/,"")).join("\n");}
function eventReportBlock(e){const d=debriefOf(e)||{};const when=[e.date?fmtDate(e.date,true):"",e.time||""].filter(Boolean).join(", ");const where=[e.venue,townOf(e)].filter(Boolean).join(", ");
  const acc=[d.accomplished||"",e.signatures?`Signatures collected: ${e.signatures}`:""].filter(Boolean).join("\n");
  return `${e.name}${when?" — "+when:""}${where?" — "+where:""}\n\nWho I connected with:\n${bullets(d.connected)||"• (none logged yet)"}\n\nConversations about LEAD:\n${(d.conversations||"").trim()||"(none logged yet)"}\n\nWhat I accomplished:\n${acc.trim()||"(none logged yet)"}\n\nRelationships to follow up on:\n${bullets(d.followups)||"• (none yet)"}`;}
function reportText(ids){const evs=ids.map(id=>getRec(id)).filter(Boolean).sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);if(!evs.length)return "";
  const names=evs.map(e=>e.name);const title=names.length===1?names[0]:names.length===2?names.join(" and "):names.slice(0,-1).join(", ")+" and "+names[names.length-1];
  const allFU=[...new Set(evs.flatMap(e=>(debriefOf(e)||{}).followups?((debriefOf(e)||{}).followups.split("\n").map(x=>x.trim().replace(/^[•\-*]\s*/,"")).filter(Boolean)):[]))];
  return `Subject: Report – ${title}\n\nHi Kelly,\n\nHere's the short report on ${title}.\n\n${evs.map(eventReportBlock).join("\n\n––––––––––\n\n")}${allFU.length>1&&evs.length>1?`\n\n––––––––––\n\nFollow-ups I'd suggest overall:\n${allFU.map(x=>"• "+x.replace(/^[•\-*]\s*/,"")).join("\n")}`:""}\n\nBest,\n${SIGN_LINES()}\n`;}
function reportSheet(pre){const t0=todayISO();const list=allE().filter(e=>!e.date||(e.date>=addDays(t0,-45)&&e.date<=addDays(t0,14))).sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const checked=new Set(pre&&pre.length?pre:list.filter(hasDebrief).map(e=>e.id));
  openSheet("Report for Kelly",`<p class="small muted">Pick the events to include. Each one needs its "After the event" notes filled in from its page; the report pulls from those.</p><div class="rep-list">${list.map(e=>`<label><input type="checkbox" value="${e.id}" ${checked.has(e.id)?"checked":""}><span><div>${esc(e.name)}</div><div class="s">${fmtDate(e.date)}${hasDebrief(e)?", notes done":", no notes yet"}${e.signatures?", "+e.signatures+" sigs":""}</div></span></label>`).join("")||`<p class="empty">No events in the last 45 days.</p>`}</div>`,
    {btns:`<button class="btn pri" id="repCopy">Copy report</button><button class="btn" id="repPreview">Preview</button><button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  const ids=()=>[...document.querySelectorAll("#overlay .rep-list input:checked")].map(i=>i.value);
  $("#repCopy").addEventListener("click",()=>{const t=reportText(ids());if(!t){toast("Pick at least one event");return;}copyText(t,"Report copied. Paste into Gmail.");});
  $("#repPreview").addEventListener("click",()=>{const t=reportText(ids());if(!t){toast("Pick at least one event");return;}showCopyBox(t);});}

/* ============ navigation ============ */
function go(tab,keep){if(tab==="more"){moreSheet();return;}document.documentElement.dataset.mode=tab==="home"?"home":"app";if(tab==="proposals"&&!keep)S.prop=null;S.tab=tab;document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false"));if(!["people","events"].includes(tab)){$("#q").value="";}else{$("#q").value=tab==="people"?S.pf.q:S.ef.q;}render();window.scrollTo({top:0});}
document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.tab)));
function moreSheet(){openSheet("More",`${viewSelect("light")}<div class="rows">${["ready","blead","proposals","cultures","map","team","letters","board","center","playbook","org","meetings","programs","log","hours","sig","settings"].filter(tabOK).map(t=>`<div class="row" data-go="${t}"><div class="n">${TITLES[t]}</div></div>`).join("")}</div>`);document.querySelectorAll("#overlay [data-go]").forEach(b=>b.addEventListener("click",()=>{closeOverlay();go(b.dataset.go);}));}
window.claude?.hot?.snapshot?.(()=>({tab:S.tab,pb:S.pb}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){const had=$("#overlay").innerHTML.trim();closeOverlay();if(!had&&S.tab!=="home"&&!isTyping(e.target)&&!e.defaultPrevented)go("home");}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();const i=S.tab==="home"?$("#hq"):qIn;if(i){i.focus();i.select();}}});

/* ============ desk controls ============ */
const THEME_KEY="lead_hub_theme",RAIL_KEY="lead_hub_rail";
function setTheme(theme){const root=document.documentElement;root.dataset.theme=theme;try{localStorage.setItem(THEME_KEY,theme);}catch(e){}const dark=theme==="dark";const b=$("#themeToggle");b.textContent=dark?"☀":"☾";b.title=dark?"Use light theme":"Use dark theme";b.setAttribute("aria-label",b.title);}
function setRail(compact){const root=document.documentElement;root.dataset.rail=compact?"compact":"full";localStorage.setItem(RAIL_KEY,compact?"compact":"full");const b=$("#railToggle");if(b){b.textContent=compact?"›":"‹";b.title=compact?"Expand navigation":"Collapse navigation";b.setAttribute("aria-label",b.title);}}
setTheme((()=>{try{const t=localStorage.getItem(THEME_KEY);if(t)return t;}catch(e){}const h=document.documentElement.dataset.theme;if(h==="dark"||h==="light")return h;return window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";})());
$("#themeToggle").addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark"));
const PAGE_CONTEXT={today:"Campaign command center",tasks:"Project management",map:"Field coverage",people:"Relationship pipeline",events:"Community calendar",team:"Signatures, signers & shifts",board:"Champion network",playbook:"Operating knowledge",org:"Organization map",meetings:"Decisions & follow-through",programs:"Program momentum",log:"Field notes",hours:"Work & invoices",settings:"Hub preferences",cultures:"Know who's in the room",proposals:"Partner requests"};
function updateChrome(){
  const context=$("#pageContext"),pulse=$("#dailyPulse");if(context)context.textContent=PAGE_CONTEXT[S.tab]||"LEAD Ops Hub";if(!pulse)return;
  const sg=sigTotals(),goal=(S.settings||{}).sigGoal||500,remaining=Math.max(0,goal-sg.all),due=S.tasks.filter(x=>x.status!=="done"&&x.repeat!=="weekly").length,follow=allT().concat(allE()).filter(x=>x.next_date&&daysFromToday(x.next_date)!==null&&daysFromToday(x.next_date)<=7&&x.status!=="Declined").length;
  pulse.innerHTML=`<span class="pulse-label">At a glance</span><button data-jump="today"><b>${sg.all}</b> / ${goal} signatures</button><button data-jump="people" class="vh-canv"><b>${allT().filter(x=>x.status==="Champion").length}</b> champions</button><button data-jump="tasks" class="vh-exec vh-canv"><b>${due}</b> open tasks</button><button data-jump="events"><b>${follow}</b> follow-ups this week</button><span class="pulse-live"><i></i>${remaining?remaining+" to goal":"Goal reached"}</span>`;
  pulse.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.jump)));
}



/* ============ global search ============ */
const qIn=$("#q"),qRes=$("#qres");
qIn.addEventListener("input",()=>{const v=qIn.value.trim();
  if(S.tab==="people"){S.pf.q=v.toLowerCase();render();return;}
  if(S.tab==="events"){S.ef.q=v.toLowerCase();render();return;}
  if(!v){qRes.classList.add("hide");return;}
  qRes.innerHTML=homeHits(v);qRes.classList.remove("hide");
  qRes.querySelectorAll("button[data-hit]").forEach(b=>b.addEventListener("click",()=>{qRes.classList.add("hide");qIn.value="";openHit(b.dataset.hit);}));});
document.addEventListener("click",e=>{if(!e.target.closest(".search"))qRes.classList.add("hide");});
$("#addBtn").addEventListener("click",()=>{const t=S.tab;if(t==="center"){ctPaste();return;}if(t==="ready"){rdNewSheet();return;}if(t==="sig"){toast("Nothing to add here. Fill in your details on the left.");return;}if(t==="proposals"){propNew();return;}if(t==="events")addForm("event");else if(t==="team")cvAdd();else if(t==="letters")ltAddForm();else if(t==="board")boardForm();else if(t==="playbook")(S.pb==="questions"?qForm():pbForm());else if(t==="org")orgForm();else if(t==="meetings")meetingForm();else if(t==="programs")sessionForm();else if(t==="hours")hoursForm();else if(t==="log")go("log");else if(t==="today"||t==="tasks")taskForm();else addForm("target");});

/* ============ render ============ */
function render(){
  migrateDue();
  $("#pageTitle").textContent=TITLES[S.tab]||"";$("#footNote").textContent=(LOCAL&&!FB)?"Local file. Back up from Settings.":"";
  $("#cPeople").textContent=allT().length;$("#cEvents").textContent=allE().filter(e=>!e.date||e.date>=todayISO()||e.recurring).length;$("#cTeam").textContent=(typeof cvCount==="function"?cvCount():0)||"";{const _cl=$("#cLetters");if(_cl)_cl.textContent=(typeof ltCount==="function"?ltCount():0)||"";}$("#cBoard").textContent=(REF.BOARD.invite.length+S.board.length);$("#cTasks").textContent=S.tasks.filter(t=>t.status!=="done").length||"";$("#cPlaybook").textContent=S.playbook.length||"";$("#cOrg").textContent=S.org.length||"";$("#cLog").textContent=S.log.length||"";$("#cMeet").textContent=S.meetings.length||"";$("#cProg").textContent=(S.sessions.length+S.videos.length)||"";$("#cHours").textContent=uninvoiced().h?uninvoiced().h+"h":"";
  const _cb=$("#cBlead");if(_cb)_cb.textContent=BL_COUNT();const _cc=$("#cCult");if(_cc)_cc.textContent=CU_G.length;const _cp=$("#cProp");if(_cp)_cp.textContent=S.proposals.filter(propOpen).length||"";const _cr=$("#cReady");if(_cr)_cr.textContent=RD_COUNT()||"";
  const v=$("#view");const _ae=document.activeElement;const _keep=(_ae&&_ae.id&&v.contains(_ae))?{id:_ae.id,s:_ae.selectionStart,e:_ae.selectionEnd}:null;v.innerHTML=viewBanner()+({today:rToday,tasks:rTasks,map:rMap,people:rPeople,events:rEvents,team:rCanvass,board:rBoard,playbook:rPlaybook,org:rOrg,meetings:rMeetings,programs:rPrograms,log:rLog,hours:rHours,settings:rSettings,cultures:rCultures,proposals:rProposals,blead:rBlead,ready:rReady,sig:rSig,center:rCenter,home:rHome,letters:rLetters,resources:rResources,approved:rApproved})[S.tab]();
  bind(v);propBind(v);blBind(v);rdBind(v);sgBind(v);ctBind(v);homeBind(v);cvBind(v);ltBind(v);updateChrome();shellChrome();
  if(_keep){const n=document.getElementById(_keep.id);if(n&&document.activeElement!==n){try{n.focus({preventScroll:true});if(_keep.s!=null)n.setSelectionRange(_keep.s,_keep.e);}catch(e){}}}
}
const ld=()=>S.db===null?"Open this page signed in to claude.ai to load your saved work.":"Loading…";
const noMapTiles=()=>LOCAL?"":"Live map tiles can't load on a hosted page, so this is a schematic: ";
function statusPill(s){return `<span class="pill st-${s}"><i></i>${SLABEL[s]||s}</span>`;}

/* ---------- Today ---------- */
function migrateDue(){if(FB&&!FB.owner)return;if(!S.db||!S.loaded.due||!S.loaded.tasks||S._migrated)return;S._migrated=true;const have=new Set(S.tasks.map(t=>t.fromDue).filter(Boolean));S.due.forEach(d=>{if(have.has(d.id))return;write("tasks","tk_"+d.id,{title:d.title,section:/schedule|invoice/i.test(d.title)?"My role":/Champions/i.test(d.title)?"Board of Champions":/Connect|table/i.test(d.title)?"Events":"B-LEAD",status:d.done?"done":"todo",due:d.date||"",repeat:d.repeat||"",dow:d.dow??4,doneOn:d.doneOn||"",priority:d.fixed?"High":"Medium",notes:d.note||"",fixed:!!d.fixed,fromDue:d.id,createdAt:todayISO()});});}
function taskDue(t){if(t.repeat==="weekly"){const nd=nextDow(Number(t.dow??4));return {date:nd,days:daysFromToday(nd),done:!!(t.doneOn&&t.doneOn>=nd),standing:true};}return {date:t.due||"",days:t.due?daysFromToday(t.due):null,done:t.status==="done",standing:false};}
function dueSoon(){const out=[];for(const t of S.tasks){const x=taskDue(t);if(x.standing){out.push({...t,_date:x.date,_days:x.days,_done:x.done,_standing:true});continue;}if(t.status==="done")continue;if(x.days===null||x.days>14)continue;out.push({...t,_date:x.date,_days:x.days,_done:false});}return out.sort((a,b)=>a._days-b._days);}
function dueSoonLegacy(){const out=[];for(const d of S.due){if(d.repeat==="weekly"){const nd=nextDow(Number(d.dow??4));out.push({...d,_date:nd,_days:daysFromToday(nd),_done:!!(d.doneOn&&d.doneOn>=nd),_standing:true});}else{if(d.done)continue;const n=daysFromToday(d.date);if(n===null||n>14)continue;out.push({...d,_date:d.date,_days:n,_done:false});}}return out.sort((a,b)=>a._days-b._days);}
function followUps(){const T=allT().concat(allE());return T.filter(x=>x.next_date&&x.status!=="Declined").map(x=>({...x,_days:daysFromToday(x.next_date)})).filter(x=>x._days<=7).sort((a,b)=>a._days-b._days);}
function quiet(){const T=allT().filter(x=>["Contacted","Supporter"].includes(x.status)&&x.last_contact);return T.map(x=>({...x,_q:-daysFromToday(x.last_contact)})).filter(x=>x._q>=7&&!(x.next_date&&daysFromToday(x.next_date)>0)).sort((a,b)=>b._q-a._q);}
/* ---------- community pages ---------- */
const COMMUNITY=[{"id": "fb", "name": "LEAD Facebook group", "short": "FB", "kind": "Facebook group", "url": "https://www.facebook.com/share/g/14uuz7ZrYeH/", "note": "Community page on Facebook"}, {"id": "wa", "name": "LEAD WhatsApp group", "short": "WA", "kind": "WhatsApp group", "url": "https://chat.whatsapp.com/Ke84LKVaHTw9KbKErrDZM0", "note": "Group chat invite link"}];
const CMTY_QR={"fb": "<svg viewBox=\"0 0 41 41\" xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"crispEdges\" role=\"img\" aria-label=\"QR code\"><rect width=\"41\" height=\"41\" fill=\"var(--qr-bg)\"/><path d=\"M4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM14 4h1v1h-1zM20 4h1v1h-1zM22 4h1v1h-1zM23 4h1v1h-1zM24 4h1v1h-1zM27 4h1v1h-1zM30 4h1v1h-1zM31 4h1v1h-1zM32 4h1v1h-1zM33 4h1v1h-1zM34 4h1v1h-1zM35 4h1v1h-1zM36 4h1v1h-1zM4 5h1v1h-1zM10 5h1v1h-1zM13 5h1v1h-1zM15 5h1v1h-1zM19 5h1v1h-1zM22 5h1v1h-1zM26 5h1v1h-1zM28 5h1v1h-1zM30 5h1v1h-1zM36 5h1v1h-1zM4 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM14 6h1v1h-1zM15 6h1v1h-1zM18 6h1v1h-1zM23 6h1v1h-1zM24 6h1v1h-1zM25 6h1v1h-1zM26 6h1v1h-1zM27 6h1v1h-1zM30 6h1v1h-1zM32 6h1v1h-1zM33 6h1v1h-1zM34 6h1v1h-1zM36 6h1v1h-1zM4 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM10 7h1v1h-1zM12 7h1v1h-1zM13 7h1v1h-1zM16 7h1v1h-1zM19 7h1v1h-1zM22 7h1v1h-1zM23 7h1v1h-1zM25 7h1v1h-1zM28 7h1v1h-1zM30 7h1v1h-1zM32 7h1v1h-1zM33 7h1v1h-1zM34 7h1v1h-1zM36 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM10 8h1v1h-1zM12 8h1v1h-1zM16 8h1v1h-1zM18 8h1v1h-1zM19 8h1v1h-1zM20 8h1v1h-1zM24 8h1v1h-1zM25 8h1v1h-1zM27 8h1v1h-1zM28 8h1v1h-1zM30 8h1v1h-1zM32 8h1v1h-1zM33 8h1v1h-1zM34 8h1v1h-1zM36 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM15 9h1v1h-1zM18 9h1v1h-1zM21 9h1v1h-1zM22 9h1v1h-1zM23 9h1v1h-1zM25 9h1v1h-1zM28 9h1v1h-1zM30 9h1v1h-1zM36 9h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h1v1h-1zM28 10h1v1h-1zM30 10h1v1h-1zM31 10h1v1h-1zM32 10h1v1h-1zM33 10h1v1h-1zM34 10h1v1h-1zM35 10h1v1h-1zM36 10h1v1h-1zM12 11h1v1h-1zM14 11h1v1h-1zM15 11h1v1h-1zM16 11h1v1h-1zM18 11h1v1h-1zM20 11h1v1h-1zM23 11h1v1h-1zM24 11h1v1h-1zM25 11h1v1h-1zM26 11h1v1h-1zM28 11h1v1h-1zM4 12h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM8 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM13 12h1v1h-1zM15 12h1v1h-1zM16 12h1v1h-1zM17 12h1v1h-1zM20 12h1v1h-1zM21 12h1v1h-1zM23 12h1v1h-1zM26 12h1v1h-1zM27 12h1v1h-1zM28 12h1v1h-1zM30 12h1v1h-1zM31 12h1v1h-1zM32 12h1v1h-1zM33 12h1v1h-1zM34 12h1v1h-1zM4 13h1v1h-1zM7 13h1v1h-1zM8 13h1v1h-1zM9 13h1v1h-1zM11 13h1v1h-1zM14 13h1v1h-1zM16 13h1v1h-1zM17 13h1v1h-1zM20 13h1v1h-1zM21 13h1v1h-1zM22 13h1v1h-1zM23 13h1v1h-1zM27 13h1v1h-1zM30 13h1v1h-1zM31 13h1v1h-1zM33 13h1v1h-1zM34 13h1v1h-1zM35 13h1v1h-1zM36 13h1v1h-1zM4 14h1v1h-1zM6 14h1v1h-1zM8 14h1v1h-1zM10 14h1v1h-1zM14 14h1v1h-1zM17 14h1v1h-1zM18 14h1v1h-1zM19 14h1v1h-1zM20 14h1v1h-1zM21 14h1v1h-1zM24 14h1v1h-1zM26 14h1v1h-1zM28 14h1v1h-1zM29 14h1v1h-1zM32 14h1v1h-1zM34 14h1v1h-1zM5 15h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM13 15h1v1h-1zM14 15h1v1h-1zM15 15h1v1h-1zM17 15h1v1h-1zM19 15h1v1h-1zM21 15h1v1h-1zM22 15h1v1h-1zM23 15h1v1h-1zM27 15h1v1h-1zM29 15h1v1h-1zM30 15h1v1h-1zM32 15h1v1h-1zM33 15h1v1h-1zM34 15h1v1h-1zM35 15h1v1h-1zM36 15h1v1h-1zM5 16h1v1h-1zM8 16h1v1h-1zM9 16h1v1h-1zM10 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM14 16h1v1h-1zM15 16h1v1h-1zM18 16h1v1h-1zM19 16h1v1h-1zM20 16h1v1h-1zM23 16h1v1h-1zM24 16h1v1h-1zM25 16h1v1h-1zM26 16h1v1h-1zM27 16h1v1h-1zM28 16h1v1h-1zM29 16h1v1h-1zM32 16h1v1h-1zM33 16h1v1h-1zM35 16h1v1h-1zM36 16h1v1h-1zM4 17h1v1h-1zM5 17h1v1h-1zM8 17h1v1h-1zM11 17h1v1h-1zM12 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM16 17h1v1h-1zM17 17h1v1h-1zM19 17h1v1h-1zM21 17h1v1h-1zM22 17h1v1h-1zM25 17h1v1h-1zM29 17h1v1h-1zM31 17h1v1h-1zM34 17h1v1h-1zM35 17h1v1h-1zM36 17h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM8 18h1v1h-1zM10 18h1v1h-1zM12 18h1v1h-1zM14 18h1v1h-1zM16 18h1v1h-1zM18 18h1v1h-1zM19 18h1v1h-1zM20 18h1v1h-1zM21 18h1v1h-1zM24 18h1v1h-1zM29 18h1v1h-1zM30 18h1v1h-1zM31 18h1v1h-1zM32 18h1v1h-1zM33 18h1v1h-1zM34 18h1v1h-1zM35 18h1v1h-1zM4 19h1v1h-1zM5 19h1v1h-1zM11 19h1v1h-1zM12 19h1v1h-1zM15 19h1v1h-1zM17 19h1v1h-1zM19 19h1v1h-1zM25 19h1v1h-1zM26 19h1v1h-1zM29 19h1v1h-1zM30 19h1v1h-1zM31 19h1v1h-1zM32 19h1v1h-1zM34 19h1v1h-1zM4 20h1v1h-1zM5 20h1v1h-1zM7 20h1v1h-1zM8 20h1v1h-1zM9 20h1v1h-1zM10 20h1v1h-1zM12 20h1v1h-1zM13 20h1v1h-1zM14 20h1v1h-1zM16 20h1v1h-1zM17 20h1v1h-1zM18 20h1v1h-1zM19 20h1v1h-1zM21 20h1v1h-1zM26 20h1v1h-1zM28 20h1v1h-1zM29 20h1v1h-1zM31 20h1v1h-1zM32 20h1v1h-1zM33 20h1v1h-1zM36 20h1v1h-1zM4 21h1v1h-1zM7 21h1v1h-1zM11 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM20 21h1v1h-1zM22 21h1v1h-1zM23 21h1v1h-1zM24 21h1v1h-1zM25 21h1v1h-1zM27 21h1v1h-1zM28 21h1v1h-1zM29 21h1v1h-1zM30 21h1v1h-1zM31 21h1v1h-1zM33 21h1v1h-1zM34 21h1v1h-1zM36 21h1v1h-1zM5 22h1v1h-1zM9 22h1v1h-1zM10 22h1v1h-1zM12 22h1v1h-1zM13 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM19 22h1v1h-1zM22 22h1v1h-1zM24 22h1v1h-1zM25 22h1v1h-1zM30 22h1v1h-1zM31 22h1v1h-1zM32 22h1v1h-1zM34 22h1v1h-1zM4 23h1v1h-1zM5 23h1v1h-1zM13 23h1v1h-1zM14 23h1v1h-1zM15 23h1v1h-1zM18 23h1v1h-1zM19 23h1v1h-1zM23 23h1v1h-1zM24 23h1v1h-1zM25 23h1v1h-1zM26 23h1v1h-1zM27 23h1v1h-1zM30 23h1v1h-1zM31 23h1v1h-1zM32 23h1v1h-1zM33 23h1v1h-1zM34 23h1v1h-1zM35 23h1v1h-1zM36 23h1v1h-1zM4 24h1v1h-1zM8 24h1v1h-1zM9 24h1v1h-1zM10 24h1v1h-1zM11 24h1v1h-1zM13 24h1v1h-1zM16 24h1v1h-1zM17 24h1v1h-1zM22 24h1v1h-1zM23 24h1v1h-1zM25 24h1v1h-1zM28 24h1v1h-1zM29 24h1v1h-1zM32 24h1v1h-1zM33 24h1v1h-1zM35 24h1v1h-1zM4 25h1v1h-1zM7 25h1v1h-1zM8 25h1v1h-1zM9 25h1v1h-1zM11 25h1v1h-1zM12 25h1v1h-1zM14 25h1v1h-1zM15 25h1v1h-1zM16 25h1v1h-1zM19 25h1v1h-1zM20 25h1v1h-1zM21 25h1v1h-1zM24 25h1v1h-1zM25 25h1v1h-1zM26 25h1v1h-1zM27 25h1v1h-1zM29 25h1v1h-1zM30 25h1v1h-1zM33 25h1v1h-1zM34 25h1v1h-1zM36 25h1v1h-1zM4 26h1v1h-1zM10 26h1v1h-1zM11 26h1v1h-1zM13 26h1v1h-1zM18 26h1v1h-1zM23 26h1v1h-1zM25 26h1v1h-1zM26 26h1v1h-1zM29 26h1v1h-1zM34 26h1v1h-1zM35 26h1v1h-1zM4 27h1v1h-1zM6 27h1v1h-1zM9 27h1v1h-1zM11 27h1v1h-1zM13 27h1v1h-1zM14 27h1v1h-1zM17 27h1v1h-1zM20 27h1v1h-1zM23 27h1v1h-1zM24 27h1v1h-1zM25 27h1v1h-1zM26 27h1v1h-1zM28 27h1v1h-1zM29 27h1v1h-1zM30 27h1v1h-1zM33 27h1v1h-1zM34 27h1v1h-1zM35 27h1v1h-1zM4 28h1v1h-1zM10 28h1v1h-1zM11 28h1v1h-1zM12 28h1v1h-1zM15 28h1v1h-1zM18 28h1v1h-1zM21 28h1v1h-1zM22 28h1v1h-1zM23 28h1v1h-1zM26 28h1v1h-1zM27 28h1v1h-1zM28 28h1v1h-1zM29 28h1v1h-1zM30 28h1v1h-1zM31 28h1v1h-1zM32 28h1v1h-1zM33 28h1v1h-1zM35 28h1v1h-1zM36 28h1v1h-1zM12 29h1v1h-1zM13 29h1v1h-1zM14 29h1v1h-1zM15 29h1v1h-1zM17 29h1v1h-1zM20 29h1v1h-1zM21 29h1v1h-1zM22 29h1v1h-1zM23 29h1v1h-1zM24 29h1v1h-1zM27 29h1v1h-1zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h1v1h-1zM36 29h1v1h-1zM4 30h1v1h-1zM5 30h1v1h-1zM6 30h1v1h-1zM7 30h1v1h-1zM8 30h1v1h-1zM9 30h1v1h-1zM10 30h1v1h-1zM13 30h1v1h-1zM14 30h1v1h-1zM16 30h1v1h-1zM19 30h1v1h-1zM20 30h1v1h-1zM21 30h1v1h-1zM24 30h1v1h-1zM26 30h1v1h-1zM27 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h1v1h-1zM35 30h1v1h-1zM4 31h1v1h-1zM10 31h1v1h-1zM12 31h1v1h-1zM16 31h1v1h-1zM21 31h1v1h-1zM22 31h1v1h-1zM23 31h1v1h-1zM24 31h1v1h-1zM27 31h1v1h-1zM28 31h1v1h-1zM32 31h1v1h-1zM33 31h1v1h-1zM34 31h1v1h-1zM35 31h1v1h-1zM36 31h1v1h-1zM4 32h1v1h-1zM6 32h1v1h-1zM7 32h1v1h-1zM8 32h1v1h-1zM10 32h1v1h-1zM12 32h1v1h-1zM13 32h1v1h-1zM15 32h1v1h-1zM17 32h1v1h-1zM18 32h1v1h-1zM19 32h1v1h-1zM20 32h1v1h-1zM23 32h1v1h-1zM24 32h1v1h-1zM25 32h1v1h-1zM26 32h1v1h-1zM28 32h1v1h-1zM29 32h1v1h-1zM30 32h1v1h-1zM31 32h1v1h-1zM32 32h1v1h-1zM33 32h1v1h-1zM35 32h1v1h-1zM36 32h1v1h-1zM4 33h1v1h-1zM6 33h1v1h-1zM7 33h1v1h-1zM8 33h1v1h-1zM10 33h1v1h-1zM12 33h1v1h-1zM13 33h1v1h-1zM14 33h1v1h-1zM15 33h1v1h-1zM16 33h1v1h-1zM18 33h1v1h-1zM19 33h1v1h-1zM21 33h1v1h-1zM22 33h1v1h-1zM25 33h1v1h-1zM27 33h1v1h-1zM29 33h1v1h-1zM32 33h1v1h-1zM33 33h1v1h-1zM34 33h1v1h-1zM36 33h1v1h-1zM4 34h1v1h-1zM6 34h1v1h-1zM7 34h1v1h-1zM8 34h1v1h-1zM10 34h1v1h-1zM12 34h1v1h-1zM15 34h1v1h-1zM17 34h1v1h-1zM19 34h1v1h-1zM20 34h1v1h-1zM21 34h1v1h-1zM24 34h1v1h-1zM27 34h1v1h-1zM28 34h1v1h-1zM29 34h1v1h-1zM30 34h1v1h-1zM31 34h1v1h-1zM33 34h1v1h-1zM34 34h1v1h-1zM4 35h1v1h-1zM10 35h1v1h-1zM17 35h1v1h-1zM18 35h1v1h-1zM19 35h1v1h-1zM25 35h1v1h-1zM27 35h1v1h-1zM28 35h1v1h-1zM32 35h1v1h-1zM33 35h1v1h-1zM34 35h1v1h-1zM4 36h1v1h-1zM5 36h1v1h-1zM6 36h1v1h-1zM7 36h1v1h-1zM8 36h1v1h-1zM9 36h1v1h-1zM10 36h1v1h-1zM12 36h1v1h-1zM13 36h1v1h-1zM14 36h1v1h-1zM15 36h1v1h-1zM16 36h1v1h-1zM19 36h1v1h-1zM20 36h1v1h-1zM21 36h1v1h-1zM26 36h1v1h-1zM27 36h1v1h-1zM28 36h1v1h-1zM30 36h1v1h-1zM31 36h1v1h-1zM33 36h1v1h-1zM35 36h1v1h-1z\" fill=\"var(--qr-fg)\"/></svg>", "wa": "<svg viewBox=\"0 0 41 41\" xmlns=\"http://www.w3.org/2000/svg\" shape-rendering=\"crispEdges\" role=\"img\" aria-label=\"QR code\"><rect width=\"41\" height=\"41\" fill=\"var(--qr-bg)\"/><path d=\"M4 4h1v1h-1zM5 4h1v1h-1zM6 4h1v1h-1zM7 4h1v1h-1zM8 4h1v1h-1zM9 4h1v1h-1zM10 4h1v1h-1zM13 4h1v1h-1zM14 4h1v1h-1zM15 4h1v1h-1zM16 4h1v1h-1zM17 4h1v1h-1zM18 4h1v1h-1zM21 4h1v1h-1zM22 4h1v1h-1zM23 4h1v1h-1zM25 4h1v1h-1zM26 4h1v1h-1zM27 4h1v1h-1zM30 4h1v1h-1zM31 4h1v1h-1zM32 4h1v1h-1zM33 4h1v1h-1zM34 4h1v1h-1zM35 4h1v1h-1zM36 4h1v1h-1zM4 5h1v1h-1zM10 5h1v1h-1zM17 5h1v1h-1zM18 5h1v1h-1zM19 5h1v1h-1zM21 5h1v1h-1zM25 5h1v1h-1zM26 5h1v1h-1zM28 5h1v1h-1zM30 5h1v1h-1zM36 5h1v1h-1zM4 6h1v1h-1zM6 6h1v1h-1zM7 6h1v1h-1zM8 6h1v1h-1zM10 6h1v1h-1zM12 6h1v1h-1zM13 6h1v1h-1zM14 6h1v1h-1zM16 6h1v1h-1zM17 6h1v1h-1zM19 6h1v1h-1zM21 6h1v1h-1zM22 6h1v1h-1zM25 6h1v1h-1zM27 6h1v1h-1zM30 6h1v1h-1zM32 6h1v1h-1zM33 6h1v1h-1zM34 6h1v1h-1zM36 6h1v1h-1zM4 7h1v1h-1zM6 7h1v1h-1zM7 7h1v1h-1zM8 7h1v1h-1zM10 7h1v1h-1zM12 7h1v1h-1zM13 7h1v1h-1zM15 7h1v1h-1zM16 7h1v1h-1zM18 7h1v1h-1zM20 7h1v1h-1zM24 7h1v1h-1zM25 7h1v1h-1zM26 7h1v1h-1zM27 7h1v1h-1zM28 7h1v1h-1zM30 7h1v1h-1zM32 7h1v1h-1zM33 7h1v1h-1zM34 7h1v1h-1zM36 7h1v1h-1zM4 8h1v1h-1zM6 8h1v1h-1zM7 8h1v1h-1zM8 8h1v1h-1zM10 8h1v1h-1zM12 8h1v1h-1zM19 8h1v1h-1zM21 8h1v1h-1zM22 8h1v1h-1zM25 8h1v1h-1zM26 8h1v1h-1zM30 8h1v1h-1zM32 8h1v1h-1zM33 8h1v1h-1zM34 8h1v1h-1zM36 8h1v1h-1zM4 9h1v1h-1zM10 9h1v1h-1zM12 9h1v1h-1zM13 9h1v1h-1zM15 9h1v1h-1zM18 9h1v1h-1zM19 9h1v1h-1zM20 9h1v1h-1zM21 9h1v1h-1zM24 9h1v1h-1zM26 9h1v1h-1zM28 9h1v1h-1zM30 9h1v1h-1zM36 9h1v1h-1zM4 10h1v1h-1zM5 10h1v1h-1zM6 10h1v1h-1zM7 10h1v1h-1zM8 10h1v1h-1zM9 10h1v1h-1zM10 10h1v1h-1zM12 10h1v1h-1zM14 10h1v1h-1zM16 10h1v1h-1zM18 10h1v1h-1zM20 10h1v1h-1zM22 10h1v1h-1zM24 10h1v1h-1zM26 10h1v1h-1zM28 10h1v1h-1zM30 10h1v1h-1zM31 10h1v1h-1zM32 10h1v1h-1zM33 10h1v1h-1zM34 10h1v1h-1zM35 10h1v1h-1zM36 10h1v1h-1zM12 11h1v1h-1zM19 11h1v1h-1zM22 11h1v1h-1zM25 11h1v1h-1zM26 11h1v1h-1zM27 11h1v1h-1zM28 11h1v1h-1zM4 12h1v1h-1zM6 12h1v1h-1zM7 12h1v1h-1zM8 12h1v1h-1zM9 12h1v1h-1zM10 12h1v1h-1zM14 12h1v1h-1zM15 12h1v1h-1zM18 12h1v1h-1zM19 12h1v1h-1zM20 12h1v1h-1zM21 12h1v1h-1zM24 12h1v1h-1zM26 12h1v1h-1zM28 12h1v1h-1zM30 12h1v1h-1zM31 12h1v1h-1zM32 12h1v1h-1zM33 12h1v1h-1zM34 12h1v1h-1zM5 13h1v1h-1zM6 13h1v1h-1zM7 13h1v1h-1zM9 13h1v1h-1zM11 13h1v1h-1zM12 13h1v1h-1zM14 13h1v1h-1zM15 13h1v1h-1zM22 13h1v1h-1zM23 13h1v1h-1zM24 13h1v1h-1zM27 13h1v1h-1zM28 13h1v1h-1zM30 13h1v1h-1zM31 13h1v1h-1zM33 13h1v1h-1zM34 13h1v1h-1zM36 13h1v1h-1zM9 14h1v1h-1zM10 14h1v1h-1zM12 14h1v1h-1zM15 14h1v1h-1zM19 14h1v1h-1zM20 14h1v1h-1zM22 14h1v1h-1zM28 14h1v1h-1zM30 14h1v1h-1zM32 14h1v1h-1zM34 14h1v1h-1zM35 14h1v1h-1zM4 15h1v1h-1zM5 15h1v1h-1zM7 15h1v1h-1zM11 15h1v1h-1zM12 15h1v1h-1zM15 15h1v1h-1zM16 15h1v1h-1zM18 15h1v1h-1zM19 15h1v1h-1zM20 15h1v1h-1zM25 15h1v1h-1zM29 15h1v1h-1zM30 15h1v1h-1zM32 15h1v1h-1zM33 15h1v1h-1zM34 15h1v1h-1zM36 15h1v1h-1zM4 16h1v1h-1zM5 16h1v1h-1zM6 16h1v1h-1zM8 16h1v1h-1zM10 16h1v1h-1zM12 16h1v1h-1zM13 16h1v1h-1zM16 16h1v1h-1zM19 16h1v1h-1zM22 16h1v1h-1zM25 16h1v1h-1zM26 16h1v1h-1zM29 16h1v1h-1zM31 16h1v1h-1zM33 16h1v1h-1zM35 16h1v1h-1zM4 17h1v1h-1zM6 17h1v1h-1zM7 17h1v1h-1zM11 17h1v1h-1zM13 17h1v1h-1zM14 17h1v1h-1zM15 17h1v1h-1zM18 17h1v1h-1zM19 17h1v1h-1zM20 17h1v1h-1zM24 17h1v1h-1zM27 17h1v1h-1zM30 17h1v1h-1zM34 17h1v1h-1zM35 17h1v1h-1zM36 17h1v1h-1zM4 18h1v1h-1zM6 18h1v1h-1zM8 18h1v1h-1zM10 18h1v1h-1zM11 18h1v1h-1zM12 18h1v1h-1zM15 18h1v1h-1zM17 18h1v1h-1zM21 18h1v1h-1zM22 18h1v1h-1zM23 18h1v1h-1zM25 18h1v1h-1zM28 18h1v1h-1zM29 18h1v1h-1zM30 18h1v1h-1zM33 18h1v1h-1zM34 18h1v1h-1zM35 18h1v1h-1zM5 19h1v1h-1zM9 19h1v1h-1zM11 19h1v1h-1zM12 19h1v1h-1zM13 19h1v1h-1zM14 19h1v1h-1zM16 19h1v1h-1zM18 19h1v1h-1zM20 19h1v1h-1zM23 19h1v1h-1zM24 19h1v1h-1zM25 19h1v1h-1zM27 19h1v1h-1zM28 19h1v1h-1zM29 19h1v1h-1zM30 19h1v1h-1zM31 19h1v1h-1zM32 19h1v1h-1zM33 19h1v1h-1zM34 19h1v1h-1zM7 20h1v1h-1zM10 20h1v1h-1zM11 20h1v1h-1zM12 20h1v1h-1zM15 20h1v1h-1zM21 20h1v1h-1zM23 20h1v1h-1zM24 20h1v1h-1zM26 20h1v1h-1zM29 20h1v1h-1zM31 20h1v1h-1zM32 20h1v1h-1zM34 20h1v1h-1zM36 20h1v1h-1zM6 21h1v1h-1zM7 21h1v1h-1zM8 21h1v1h-1zM9 21h1v1h-1zM11 21h1v1h-1zM12 21h1v1h-1zM13 21h1v1h-1zM15 21h1v1h-1zM16 21h1v1h-1zM17 21h1v1h-1zM18 21h1v1h-1zM20 21h1v1h-1zM21 21h1v1h-1zM22 21h1v1h-1zM23 21h1v1h-1zM24 21h1v1h-1zM27 21h1v1h-1zM30 21h1v1h-1zM31 21h1v1h-1zM33 21h1v1h-1zM34 21h1v1h-1zM35 21h1v1h-1zM5 22h1v1h-1zM9 22h1v1h-1zM10 22h1v1h-1zM11 22h1v1h-1zM15 22h1v1h-1zM16 22h1v1h-1zM17 22h1v1h-1zM18 22h1v1h-1zM19 22h1v1h-1zM20 22h1v1h-1zM21 22h1v1h-1zM24 22h1v1h-1zM25 22h1v1h-1zM26 22h1v1h-1zM31 22h1v1h-1zM32 22h1v1h-1zM34 22h1v1h-1zM35 22h1v1h-1zM4 23h1v1h-1zM5 23h1v1h-1zM7 23h1v1h-1zM12 23h1v1h-1zM13 23h1v1h-1zM14 23h1v1h-1zM15 23h1v1h-1zM16 23h1v1h-1zM21 23h1v1h-1zM22 23h1v1h-1zM25 23h1v1h-1zM26 23h1v1h-1zM28 23h1v1h-1zM30 23h1v1h-1zM31 23h1v1h-1zM32 23h1v1h-1zM33 23h1v1h-1zM34 23h1v1h-1zM35 23h1v1h-1zM36 23h1v1h-1zM7 24h1v1h-1zM9 24h1v1h-1zM10 24h1v1h-1zM12 24h1v1h-1zM16 24h1v1h-1zM17 24h1v1h-1zM18 24h1v1h-1zM20 24h1v1h-1zM24 24h1v1h-1zM29 24h1v1h-1zM32 24h1v1h-1zM33 24h1v1h-1zM36 24h1v1h-1zM4 25h1v1h-1zM5 25h1v1h-1zM6 25h1v1h-1zM11 25h1v1h-1zM13 25h1v1h-1zM14 25h1v1h-1zM19 25h1v1h-1zM21 25h1v1h-1zM22 25h1v1h-1zM25 25h1v1h-1zM26 25h1v1h-1zM27 25h1v1h-1zM31 25h1v1h-1zM36 25h1v1h-1zM4 26h1v1h-1zM7 26h1v1h-1zM8 26h1v1h-1zM9 26h1v1h-1zM10 26h1v1h-1zM12 26h1v1h-1zM18 26h1v1h-1zM19 26h1v1h-1zM20 26h1v1h-1zM21 26h1v1h-1zM24 26h1v1h-1zM25 26h1v1h-1zM32 26h1v1h-1zM34 26h1v1h-1zM35 26h1v1h-1zM4 27h1v1h-1zM6 27h1v1h-1zM7 27h1v1h-1zM8 27h1v1h-1zM11 27h1v1h-1zM14 27h1v1h-1zM15 27h1v1h-1zM16 27h1v1h-1zM19 27h1v1h-1zM25 27h1v1h-1zM26 27h1v1h-1zM29 27h1v1h-1zM30 27h1v1h-1zM33 27h1v1h-1zM34 27h1v1h-1zM4 28h1v1h-1zM8 28h1v1h-1zM9 28h1v1h-1zM10 28h1v1h-1zM11 28h1v1h-1zM12 28h1v1h-1zM13 28h1v1h-1zM15 28h1v1h-1zM16 28h1v1h-1zM17 28h1v1h-1zM18 28h1v1h-1zM19 28h1v1h-1zM21 28h1v1h-1zM26 28h1v1h-1zM28 28h1v1h-1zM29 28h1v1h-1zM30 28h1v1h-1zM31 28h1v1h-1zM32 28h1v1h-1zM33 28h1v1h-1zM34 28h1v1h-1zM12 29h1v1h-1zM14 29h1v1h-1zM16 29h1v1h-1zM19 29h1v1h-1zM20 29h1v1h-1zM22 29h1v1h-1zM23 29h1v1h-1zM24 29h1v1h-1zM25 29h1v1h-1zM26 29h1v1h-1zM28 29h1v1h-1zM32 29h1v1h-1zM34 29h1v1h-1zM4 30h1v1h-1zM5 30h1v1h-1zM6 30h1v1h-1zM7 30h1v1h-1zM8 30h1v1h-1zM9 30h1v1h-1zM10 30h1v1h-1zM13 30h1v1h-1zM17 30h1v1h-1zM19 30h1v1h-1zM20 30h1v1h-1zM22 30h1v1h-1zM24 30h1v1h-1zM25 30h1v1h-1zM27 30h1v1h-1zM28 30h1v1h-1zM30 30h1v1h-1zM32 30h1v1h-1zM34 30h1v1h-1zM35 30h1v1h-1zM4 31h1v1h-1zM10 31h1v1h-1zM12 31h1v1h-1zM13 31h1v1h-1zM15 31h1v1h-1zM16 31h1v1h-1zM17 31h1v1h-1zM20 31h1v1h-1zM23 31h1v1h-1zM25 31h1v1h-1zM27 31h1v1h-1zM28 31h1v1h-1zM32 31h1v1h-1zM33 31h1v1h-1zM34 31h1v1h-1zM4 32h1v1h-1zM6 32h1v1h-1zM7 32h1v1h-1zM8 32h1v1h-1zM10 32h1v1h-1zM12 32h1v1h-1zM17 32h1v1h-1zM22 32h1v1h-1zM25 32h1v1h-1zM28 32h1v1h-1zM29 32h1v1h-1zM30 32h1v1h-1zM31 32h1v1h-1zM32 32h1v1h-1zM33 32h1v1h-1zM35 32h1v1h-1zM36 32h1v1h-1zM4 33h1v1h-1zM6 33h1v1h-1zM7 33h1v1h-1zM8 33h1v1h-1zM10 33h1v1h-1zM12 33h1v1h-1zM13 33h1v1h-1zM14 33h1v1h-1zM18 33h1v1h-1zM19 33h1v1h-1zM20 33h1v1h-1zM21 33h1v1h-1zM24 33h1v1h-1zM25 33h1v1h-1zM28 33h1v1h-1zM29 33h1v1h-1zM32 33h1v1h-1zM33 33h1v1h-1zM34 33h1v1h-1zM35 33h1v1h-1zM36 33h1v1h-1zM4 34h1v1h-1zM6 34h1v1h-1zM7 34h1v1h-1zM8 34h1v1h-1zM10 34h1v1h-1zM12 34h1v1h-1zM13 34h1v1h-1zM14 34h1v1h-1zM15 34h1v1h-1zM23 34h1v1h-1zM25 34h1v1h-1zM26 34h1v1h-1zM30 34h1v1h-1zM31 34h1v1h-1zM34 34h1v1h-1zM4 35h1v1h-1zM10 35h1v1h-1zM15 35h1v1h-1zM20 35h1v1h-1zM23 35h1v1h-1zM24 35h1v1h-1zM25 35h1v1h-1zM28 35h1v1h-1zM30 35h1v1h-1zM32 35h1v1h-1zM33 35h1v1h-1zM34 35h1v1h-1zM4 36h1v1h-1zM5 36h1v1h-1zM6 36h1v1h-1zM7 36h1v1h-1zM8 36h1v1h-1zM9 36h1v1h-1zM10 36h1v1h-1zM12 36h1v1h-1zM13 36h1v1h-1zM16 36h1v1h-1zM18 36h1v1h-1zM21 36h1v1h-1zM22 36h1v1h-1zM23 36h1v1h-1zM24 36h1v1h-1zM26 36h1v1h-1zM27 36h1v1h-1zM28 36h1v1h-1zM29 36h1v1h-1zM30 36h1v1h-1zM31 36h1v1h-1zM33 36h1v1h-1zM35 36h1v1h-1z\" fill=\"var(--qr-fg)\"/></svg>"};
const cmtyLink=id=>COMMUNITY.find(c=>c.id===id);
const cmtyShortUrl=u=>u.replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"");
function cmtyMsg(){return "Join the LEAD community:\n"+COMMUNITY.map(c=>c.kind+": "+c.url).join("\n");}
function cmtyBlock(){return `<section class="sec cmty"><div class="h"><h2>Our community pages</h2><span class="meta">share at tables and in follow-ups</span><button class="btn sm" data-cmty="copy-all">Copy invite message</button></div>
  <div class="cmty-list">${COMMUNITY.map(c=>`<div class="cmty-item"><span class="cmty-mark ${c.id}">${c.short}</span><div><div class="n">${esc(c.name)}</div><div class="d">${esc(cmtyShortUrl(c.url))}</div></div><div class="cmty-acts"><a class="btn sm pri" href="${esc(c.url)}" target="_blank" rel="noopener">Open</a><button class="btn sm" data-cmty="copy" data-id="${c.id}">Copy link</button><button class="btn sm" data-cmty="qr" data-id="${c.id}">QR code</button></div></div>`).join("")}</div></section>`;}
function cmtySheet(id){const c=cmtyLink(id);if(!c)return;openSheet(c.name,`<p class="small muted" style="margin:4px 0 0;text-align:center">Scan with a phone camera to join</p><div class="qrbox">${CMTY_QR[id]}</div><div class="qrurl">${esc(c.url)}</div>`,{btns:`<button class="btn" data-cmty="copy" data-id="${c.id}">Copy link</button><a class="btn pri" href="${esc(c.url)}" target="_blank" rel="noopener" style="text-decoration:none;color:#fff">Open</a><button class="btn ghost" data-close="1">Close</button>`});}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cmty]");if(!b)return;e.preventDefault();e.stopPropagation();const a=b.dataset.cmty,c=cmtyLink(b.dataset.id);
  if(a==="copy"&&c)copyText(c.url,c.kind+" link copied");else if(a==="copy-all")copyText(cmtyMsg(),"Invite message copied");else if(a==="qr")cmtySheet(b.dataset.id);},true);
function rToday(){
  const T=allT(),E=allE(),st=S.settings||{},goal=st.sigGoal||500,sg=sigTotals(),pct=Math.min(1,sg.all/goal),gd=st.goalDate?daysFromToday(st.goalDate):null;
  const counts={};STATUSES.forEach(s=>counts[s]=0);T.forEach(t=>counts[t.status]++);
  const lane={};T.forEach(t=>{const l=laneOf(t);lane[l]=lane[l]||{n:0,c:0};lane[l].n++;if(t.status==="Champion")lane[l].c++;});
  const d=dueSoon(),fu=followUps(),qt=quiet(),oq=S.questions.filter(q=>q.status!=="answered"),pc={confirmed:0,guess:0,unknown:0};S.playbook.forEach(p=>pc[p.status||"guess"]++);
  const cn=T.filter(t=>t.status==="Prospect"&&t.priority==="High"&&(t.phone||t.email)).sort((a,b)=>a.name.localeCompare(b.name)).slice(0,8);
  const t0=todayISO();const days=[];for(let i=0;i<7;i++)days.push(addDays(t0,i));
  const road=`<div class="track"><i class="fill" style="width:${(pct*100).toFixed(1)}%"></i>${[100,250,500].map(m=>`<span class="tick ${m===goal?"end":""}" style="left:${Math.min(100,m/goal*100).toFixed(1)}%"><em>${m}</em></span>`).join("")}<b class="pin" style="left:${(pct*100).toFixed(1)}%"></b></div>`;
  return `
  <div class="road">
    <div><div class="big num">${sg.all}<small>of ${goal}</small></div><div class="lbl">signatures of support so far</div></div>
    <div class="days"><div class="big num">${gd===null?"—":gd}</div><div class="lbl">${st.goalDate?"days to "+fmtDate(st.goalDate):"no goal date"}</div></div>
    ${road}
    <div class="src"><span><b class="num">${sg.t}</b> from people &amp; orgs</span><span><b class="num">${sg.e}</b> at events</span><span><b class="num">${sg.l}</b> canvasser shifts</span><span><b class="num">${sg.m}</b> walk-ups / online <button data-act="manual">edit</button></span></div>
  </div>

  ${(()=>{const ws=weekStart(),we=addDays(ws,6);const vids=S.videos.filter(v=>v.date>=ws&&v.date<=we).length;const cls=S.sessions.filter(x=>x.date>=ws&&x.date<=we);const under=cls.filter(x=>(+x.participants||0)<10).length;const hw=S.hours.filter(h=>h.date>=ws&&h.date<=we).reduce((a,h)=>a+(+h.hours||0),0);const ui=uninvoiced();
    return `<div class="strip"><div data-go2="hours" class="vh-exec vh-canv vh-coord"><b class="num">${Math.round(hw*10)/10}h</b><span>this week, ${ui.h}h not invoiced yet ($${ui.amt})</span></div><div data-go2="programs" class="${vids?"okv":"warnv"}"><b class="num">${vids}</b><span>video${vids===1?"":"s"} this week, LEAD wants 1</span></div><div data-go2="programs" class="${under?"warnv":""}"><b class="num">${cls.length}</b><span>class${cls.length===1?"":"es"} this week${under?", "+under+" under 10 people":""}</span></div></div>`;})()}

  ${cmtyBlock()}

  <div class="two vh-canv">
    <section class="sec do"><div class="h"><h2>Do now</h2><span class="meta">${d.filter(x=>!x._done).length+fu.length+needsReport().length+rdDue().length+(tabOK("proposals")?propDue().length:0)} items</span><button class="btn sm" data-act="task-add">+ Task</button><button class="btn sm ghost" data-act="go-tasks">All tasks</button></div>
      <div class="rows">
      ${d.map(x=>`<div class="row ${x._done?"done":""} static"><button class="ck ${x._done?"on":""}" data-act="task-done" data-id="${x.id}" aria-label="Done"></button><div><div class="n" data-act="task-edit" data-id="${x.id}" style="cursor:pointer">${esc(x.title)}</div><div class="d">${x._standing?"every "+DOW[Number(x.dow??4)]:esc(x.section||"")}${x.notes?", "+esc(x.notes):""}</div></div><div class="r" style="${x._days<0&&!x._done?"color:var(--red)":""}">${fmtDate(x._date)}<br>${rel(x._days)}</div></div>`).join("")}
      ${tabOK("proposals")?propDue().map(p=>{const s=propScore(p);return `<div class="row" data-act="prop-open" data-id="${p.id}"><span class="ck" style="border-style:dashed;border-color:var(--blue)"></span><div><div class="n">Review the proposal: ${esc(propName(p))}</div><div class="d">${s.filled} of 8 parts in, ${s.rated} rated</div></div><div class="r">${p.received?rel(daysFromToday(p.received)):""}</div></div>`;}).join(""):""}
      ${rdDoNow()}
      ${needsReport().map(e=>`<div class="row" data-open="${e.id}"><span class="ck" style="border-style:dashed;border-color:var(--orange)"></span><div><div class="n">Write the report: ${esc(e.name)}</div><div class="d">Kelly wants who you met, conversations about LEAD, what you got done, who to follow up with</div></div><div class="r" style="color:var(--orange)">${fmtDate(e.date)}<br>${rel(daysFromToday(e.date))}</div></div>`).join("")}
      ${fu.map(x=>`<div class="row" data-open="${x.id}"><span class="ck" style="border-style:dashed"></span><div><div class="n">${esc(x.name)}</div><div class="d">${esc(x.next_step||"follow up")}</div></div><div class="r" style="${x._days<0?"color:var(--red)":""}">${fmtDate(x.next_date)}<br>${rel(x._days)}</div></div>`).join("")}
      ${!d.length&&!fu.length&&!needsReport().length&&!rdDue().length&&!(tabOK("proposals")&&propDue().length)?`<p class="empty">${S.loaded.tasks?"Nothing due in the next two weeks. Add a task.":ld()}</p>`:""}
      </div>
      ${qt.length?`<h3 style="margin-top:14px">Gone quiet (${qt.length})</h3><div class="rows">${qt.slice(0,5).map(x=>`<div class="row" data-open="${x.id}"><div><div class="n">${esc(x.name)}</div><div class="d">${SLABEL[x.status]}, last touch ${fmtDate(x.last_contact)}</div></div><div class="r" style="color:var(--orange)">${x._q} days</div></div>`).join("")}</div>`:""}
    </section>
    <section class="sec"><div class="h"><h2>Call next</h2><span class="meta">high priority, not reached, has a phone or email</span></div>
      <div class="rows">${cn.map(t=>`<div class="row" data-open="${t.id}"><div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.contact_name?t.contact_name+(t.role?", "+t.role:""):t.subtype||t.type)}</div></div><div class="r num wrap">${esc((t.phone||t.email||"").split(";")[0].trim())}</div></div>`).join("")||`<p class="empty">Everyone high-priority has been reached. Nice.</p>`}</div>
    </section>
  </div>

  <section class="sec"><div class="h"><h2>This week</h2><span class="meta">green = you can table · color bar = LEAD center program · ✦ = celebration</span></div>
    <div class="week">${days.map((dd,i)=>{const evs=E.filter(e=>e.date===dd||(e.end_date&&e.date<=dd&&e.end_date>=dd)).sort((a,b)=>(a.time||"").localeCompare(b.time||""));return `<div class="day ${i===0?"today":""}"><div class="d"><b>${parseISO(dd).getDate()}</b>${DOW[parseISO(dd).getDay()]}</div>${evs.slice(0,4).map(e=>`<div class="ev ${e.can_table===true?"table":""}" data-open="${e.id}">${esc(e.name)}<div class="t">${esc((e.time||"").split("–")[0].split(" - ")[0].trim())} ${esc(townOf(e))}</div></div>`).join("")||(ctrOn(dd).length||ctrClosedOn(dd)?"":`<div class="muted" style="font-size:12px">—</div>`)}${evs.length>4?`<button class="ev more" data-act="week-more">+${evs.length-4} more</button>`:""}${ctrWeekChips(dd)}${cuWeekChips(dd)}</div>`;}).join("")}</div>
  </section>

  <section class="sec vh-canv"><div class="h"><h2>Where everyone stands</h2><span class="meta">${T.length} people &amp; orgs</span></div>
    <div class="pipe">${STATUSES.map(s=>`<i style="width:${counts[s]/T.length*100}%;background:${SVAR[s]}"></i>`).join("")}</div>
    <div class="pipe-key">${STATUSES.map(s=>`<button data-act="st-filter" data-s="${s}"><i style="background:${SVAR[s]}"></i><b>${counts[s]}</b> ${SLABEL[s]}</button>`).join("")}</div>
    <div class="small muted" style="margin-top:8px">${Object.entries(lane).map(([l,v])=>`<span style="margin-right:16px"><b style="color:var(--ink)">${esc(l)}</b> ${v.n} people &amp; orgs, ${v.c} Champions</span>`).join("")}</div>
  </section>

  <div class="two vh-canv">
    <section class="sec"><div class="h"><h2>Still don't know</h2><span class="meta">${oq.length} open</span><button class="btn sm" data-act="q-add">+ Question</button></div>
      <div class="rows">${oq.slice(0,6).map(q=>`<div class="row" data-act="q-open" data-id="${q.id}"><div><div class="n" style="font-weight:500">${esc(q.q)}</div></div><div class="r">ask ${esc(q.askWho||"?")}</div></div>`).join("")||`<p class="empty">${S.loaded.questions?"No open questions.":ld()}</p>`}</div>
      ${oq.length>6?`<div class="small" style="margin-top:8px"><a href="#" data-act="pb-go" data-v="questions">All ${oq.length} questions</a></div>`:""}
    </section>
    <section class="sec"><div class="h"><h2>Playbook confidence</h2><span class="meta">${pc.confirmed} of ${S.playbook.length} confirmed</span></div>
      <div class="chips" style="margin-bottom:8px"><span class="pill green">${pc.confirmed} confirmed</span><span class="pill sand">${pc.guess} best guess</span><span class="pill red">${pc.unknown} unknown</span></div>
      <div class="rows">${S.playbook.filter(p=>p.status!=="confirmed").slice(0,5).map(p=>`<div class="row" data-act="pb-open" data-id="${p.id}"><div><div class="n">${esc(p.title)}</div></div><div class="r"><span class="pill ${PB_STATUS[p.status||"guess"][1]}">${PB_STATUS[p.status||"guess"][0]}</span></div></div>`).join("")||`<p class="empty">${S.loaded.playbook?"Everything confirmed.":ld()}</p>`}</div>
    </section>
  </div>

  <section class="sec"><div class="h"><h2>Tools and files</h2><button class="btn sm" data-act="links-edit">Edit</button></div>
    <div class="links">${(st.links||[]).map(l=>l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener"><div class="n">${esc(l.name)}</div><div class="d">${esc(l.note||"")}</div></a>`:`<span class="nolink"><div class="n" style="color:var(--ink)">${esc(l.name)}</div><div class="d">${esc(l.note||"")}</div></span>`).join("")||`<p class="empty">No links yet.</p>`}</div>
  </section>`;
}

/* ---------- Tasks ---------- */
function taskSort(a,b){const da=taskDue(a).date||"9999",db=taskDue(b).date||"9999";if(da!==db)return da<db?-1:1;const p={High:0,Medium:1,Low:2};return (p[a.priority]??1)-(p[b.priority]??1);}
function rTasks(){
  const v=S.tv;let html=`<div class="toolrow"><div class="tviews">${[["board","Board"],["list","List"],["cal","Calendar"]].map(([k,l])=>`<button data-tv="${k}" aria-pressed="${v===k}">${l}</button>`).join("")}</div>
    ${v!=="cal"?`<select data-tsec><option value="">All sections</option>${TSECTIONS.map(x=>`<option ${S.tSec===x?"selected":""}>${x}</option>`).join("")}</select><button class="chip" data-act="t-done-toggle" aria-pressed="${S.tDone}">Show done</button>`:""}
    <span class="sp"></span><span class="small muted">${S.tasks.filter(t=>t.status!=="done").length} open</span></div>
  <form class="capture" id="capture"><input name="t" placeholder="Add a task and press Enter. Type a date like 10/20 at the end to set it due." autocomplete="off"><select name="sec">${TSECTIONS.map(x=>`<option ${S.tSec===x?"selected":""}>${x}</option>`).join("")}</select></form>`;
  const T=S.tasks.filter(t=>(!S.tSec||t.section===S.tSec)&&(S.tDone||t.status!=="done"));
  if(v==="list"){
    const g={};T.sort(taskSort).forEach(t=>(g[t.section||"Other"]=g[t.section||"Other"]||[]).push(t));
    html+=Object.entries(g).map(([sec,L])=>`<div class="sec" style="margin-top:18px"><div class="h"><h2>${esc(sec)}</h2><span class="meta">${L.filter(t=>t.status!=="done").length} open</span></div><div class="rows">${L.map(trow).join("")}</div></div>`).join("")||`<p class="empty">${S.loaded.tasks?"No tasks here. Add one above.":ld()}</p>`;
  } else if(v==="board"){
    html+=`<div class="board">${TSTATUS.map(([k,l])=>`<div class="col" data-col="${k}"><h3>${l}<span class="num">${T.filter(t=>t.status===k).length}</span></h3>${T.filter(t=>t.status===k).sort(taskSort).map(t=>{const x=taskDue(t);return `<div class="tcard" draggable="true" data-tid="${t.id}" data-act="task-edit" data-id="${t.id}"><div>${esc(t.title)}</div><div class="d">${x.date?fmtDate(x.date)+(x.days!==null&&x.days<0&&t.status!=="done"?" · overdue":""):""}${t.waitingOn?" · waiting on "+esc(t.waitingOn):""}</div><div class="sec">${esc(t.section||"")}</div></div>`;}).join("")}</div>`).join("")}</div>`;
  } else html+=rCalendar();
  return html;
}
function trow(t){const x=taskDue(t);const subs=(t.subtasks||[]);const cls=x.days!==null&&!x.done?(x.days<0?"over":x.days<=2?"soon":""):"";
  return `<div class="trow ${x.done?"done":""}" data-act="task-edit" data-id="${t.id}"><button class="ck ${x.done?"on":""}" data-act="task-done" data-id="${t.id}" aria-label="Done"></button><div><div class="n">${esc(t.title)}${t.priority==="High"?' <span class="pill orange">high</span>':""}${t.status==="waiting"?` <span class="pill sand">waiting${t.waitingOn?" on "+esc(t.waitingOn):""}</span>`:t.status==="doing"?' <span class="pill blue">doing</span>':""}</div><div class="d">${x.standing?"every "+DOW[Number(t.dow??4)]:""}${subs.length?(x.standing?" · ":"")+subs.filter(s=>s.done).length+"/"+subs.length+" subtasks":""}${t.notes?" · "+esc(t.notes.slice(0,80)):""}</div></div><div class="r ${cls}">${x.date?fmtDate(x.date)+"<br>"+rel(x.days):""}</div></div>`;}
function rCalendar(){
  const base=S.calMonth||todayISO().slice(0,7);const [y,m]=base.split("-").map(Number);const first=new Date(y,m-1,1);const start=addDays(base+"-01",-first.getDay());const t0=todayISO();
  const cells=[];for(let i=0;i<42;i++){const d=addDays(start,i);cells.push(d);}
  const E=allE();const Ti=S.tasks;
  const prev=new Date(y,m-2,1),next=new Date(y,m,1);const key=dt=>dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
  return `<div class="calnav"><button class="btn sm" data-cal="${key(prev)}">‹</button><h2>${MON[m-1]} ${y}</h2><button class="btn sm" data-cal="${key(next)}">›</button><button class="btn sm ghost" data-cal="${todayISO().slice(0,7)}">Today</button></div>
  ${cuMonthStrip(y,m)}<div class="cal">${DOW.map(d=>`<div class="dow">${d}</div>`).join("")}${cells.map(d=>{const inM=d.slice(0,7)===base;const evs=E.filter(e=>e.date===d||(e.end_date&&e.date<=d&&e.end_date>=d));const tks=Ti.filter(t=>{const x=taskDue(t);return x.date===d&&!(t.repeat==="weekly"&&x.done);});const items=[...tks.map(t=>({k:"t",t})),...evs.map(e=>({k:"e",e}))];
    return `<div class="cell ${inM?"":"out"} ${d===t0?"today":""}"><div class="dn">${parseISO(d).getDate()}</div>${items.slice(0,4).map(it=>it.k==="e"?`<button class="ev ${assessOf(it.e).cls==="go"?"go":""}" data-open="${it.e.id}" title="${esc(it.e.name)}">${it.e.url?"🔗 ":""}${esc(it.e.name)}</button>`:`<button class="tk ${taskDue(it.t).done?"done":""} ${taskDue(it.t).days<0&&!taskDue(it.t).done?"over":""}" data-act="task-edit" data-id="${it.t.id}" title="${esc(it.t.title)}">${esc(it.t.title)}</button>`).join("")}${items.length>4?`<div class="more">+${items.length-4} more</div>`:""}${ctrCellChips(d)}${cuCellChips(d)}</div>`;}).join("")}</div>
  <p class="small muted" style="margin-top:8px">Blue = event (🔗 has a source link; open it from the event page). Green = scored Go. Grey = task. Red = overdue. Color bar = LEAD center program; dark = center closed. ✦ = celebration from the culture guides or a LEAD city (pick the cities above).</p>`;
}
function parseCapture(txt){let due="";const m=txt.match(/\s(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*$/);if(m){const t=parseISO(todayISO());let yy=m[3]?(m[3].length===2?2000+Number(m[3]):Number(m[3])):t.getFullYear();let d=new Date(yy,Number(m[1])-1,Number(m[2]));if(!m[3]&&d<t)d=new Date(yy+1,Number(m[1])-1,Number(m[2]));due=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");txt=txt.slice(0,m.index).trim();}
  const low=txt.match(/\s(today|tomorrow)\s*$/i);if(low){due=low[1].toLowerCase()==="today"?todayISO():addDays(todayISO(),1);txt=txt.slice(0,low.index).trim();}return {title:txt,due};}
function taskForm(t,pre){const isNew=!t||!t.id;t=t||pre||{};const subs=(t.subtasks||[]).map(s=>(s.done?"[x] ":"")+s.t).join("\n");
  form({title:isNew?"New task":"Task",fields:[{key:"title",label:"Task",required:true,wide:true},{key:"section",label:"Section",type:"select",options:TSECTIONS,default:S.tSec||"B-LEAD"},{key:"status",label:"Status",type:"select",options:TSTATUS,default:"todo"},{key:"due",label:"Due",type:"date"},{key:"priority",label:"Priority",type:"select",options:["High","Medium","Low"],default:"Medium"},{key:"repeat",label:"Repeats",type:"select",options:[["","No"],["weekly","Every week"]]},{key:"dow",label:"Day (if weekly)",type:"select",options:DOW.map((n,i)=>[String(i),n]),default:"4"},{key:"waitingOn",label:"Waiting on",placeholder:"Kelly, a partner…"},{key:"linkText",label:"Linked to",placeholder:"an event, person, or meeting name"},{key:"subs",label:"Subtasks (one per line, start with [x] when done)",type:"textarea",rows:3,wide:true},{key:"notes",label:"Notes",type:"textarea",rows:3,wide:true}],
    values:{...t,dow:String(t.dow??4),subs},
    onSave:async v=>{const subtasks=v.subs.split("\n").map(x=>x.trim()).filter(Boolean).map(x=>({t:x.replace(/^\[x\]\s*/i,""),done:/^\[x\]/i.test(x)}));return write("tasks",t.id||uid("tk"),{title:v.title,section:v.section,status:v.status,due:v.due,priority:v.priority,repeat:v.repeat,dow:Number(v.dow),waitingOn:v.waitingOn,linkText:v.linkText,subtasks,notes:v.notes,doneOn:t.doneOn||"",fromDue:t.fromDue||"",createdAt:t.createdAt||todayISO(),doneAt:v.status==="done"?(t.doneAt||todayISO()):""});},
    onDelete:isNew?null:()=>remove("tasks",t.id)});}
async function toggleTask(id){const t=S.tasks.find(x=>x.id===id);if(!t)return;if(t.repeat==="weekly"){const nd=nextDow(Number(t.dow??4));await write("tasks",id,{...t,doneOn:(t.doneOn&&t.doneOn>=nd)?"":nd});}else await write("tasks",id,{...t,status:t.status==="done"?"todo":"done",doneAt:t.status==="done"?"":todayISO()});}

/* ---------- Map ---------- */
let LEAF=null;// null = not tried, "loading", "ok", "fail"
function loadLeaflet(){if(LEAF)return;LEAF="loading";const css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.appendChild(css);const js=document.createElement("script");js.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";js.onload=()=>{LEAF="ok";if(S.tab==="map")render();};js.onerror=()=>{LEAF="fail";if(S.tab==="map")render();};document.head.appendChild(js);setTimeout(()=>{if(LEAF==="loading"){LEAF="fail";if(S.tab==="map")render();}},12000);}
function jitter(id){let h=0;for(const ch of String(id))h=(h*31+ch.charCodeAt(0))>>>0;return [((h%1000)/1000-0.5)*0.022,(((h>>10)%1000)/1000-0.5)*0.03];}
function coordsOf(x){if(x.lat&&x.lng)return {lat:+x.lat,lng:+x.lng,exact:true};const g=S.geo&&S.geo[x.id];if(g&&g.lat)return {lat:+g.lat,lng:+g.lng,exact:true};const c=REF.CENTROIDS[townOf(x)];if(!c)return null;const [dy,dx]=jitter(x.id);return {lat:c[0]+dy,lng:c[1]+dx,exact:false};}
function rLeaflet(){
  const f=S.mf;const T=allT().filter(t=>(!f.lane||laneOf(t)===f.lane)&&(!f.status||t.status===f.status)&&(!f.town||townOf(t)===f.town));
  const E=f.status||f.lane?[]:allE().filter(e=>(!f.town||townOf(e)===f.town)&&(!e.date||e.date>=todayISO()||e.recurring));
  const towns=[...new Set(allT().map(townOf))].sort();const missing=allT().concat(allE()).filter(x=>{const c=coordsOf(x);return c&&!c.exact&&x.address;}).length;
  if(LEAF!=="ok"){loadLeaflet();if(LEAF==="fail")return `<p class="note">The map library couldn't load (no internet?). Showing the schematic instead.</p>`+rSchematic();}
  return `<div class="toolrow">
    <select data-mf="lane"><option value="">Both lanes</option><option ${f.lane==="B-LEAD"?"selected":""}>B-LEAD</option><option ${f.lane==="Charters & leaders"?"selected":""}>Charters &amp; leaders</option></select>
    <select data-mf="status"><option value="">Any status</option>${STATUSES.map(s=>`<option value="${s}" ${f.status===s?"selected":""}>${SLABEL[s]}</option>`).join("")}</select>
    <select data-mf="town"><option value="">Any town</option>${towns.map(t=>`<option ${f.town===t?"selected":""}>${esc(t)}</option>`).join("")}</select>
    <span class="sp"></span><span class="small muted">${T.length} people &amp; orgs${E.length?", "+E.length+" events":""}</span>
    ${missing?`<button class="btn sm" data-act="geocode" ${S.geocoding?"disabled":""}>${S.geocoding?"Finding addresses… "+S.geocoding:"Find exact spots ("+missing+")"}</button>`:""}
  </div>
  ${LEAF==="ok"?`<div id="lmap"></div>`:`<div id="lmap" style="display:grid;place-items:center" class="muted">Loading map…</div>`}
  <div class="mapkey">${STATUSES.map(s=>`<span><i style="background:${SVAR[s]}"></i>${SLABEL[s]}</span>`).join("")}<span><i class="hollow"></i>placed at town center (address not found yet)</span><span><i class="ev"></i>event</span><span>Click a pin to open it. Map tiles need internet.</span></div>`;
}
const CARTO_KEY_DEFAULT="cb1_4aq7_1_fa0069f5d5547083871c5f6d";
function mapKey(){return ((S.settings&&S.settings.mapKey)||CARTO_KEY_DEFAULT).trim();}
function mapKeyForm(){const st=S.settings||{};form({title:"Map key",fields:[{key:"mapKey",label:"CARTO Basemaps key",wide:true,placeholder:CARTO_KEY_DEFAULT}],values:{mapKey:st.mapKey||""},extra:`<p class="small muted">Used for the street map tiles in the downloaded file. Leave it blank to use the key built into the hub.</p>`,onSave:async v=>write("meta","settings",{...st,mapKey:(v.mapKey||"").trim()})});}
function initLeaflet(){const el=$("#lmap");if(!el||LEAF!=="ok"||!window.L)return;
  const dark=document.documentElement.dataset.theme==="dark"||(document.documentElement.dataset.theme!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
  const v=S.mapView||{center:[41.76,-72.67],zoom:11};const map=L.map(el,{zoomControl:true}).setView(v.center,v.zoom);
  L.tileLayer(`https://{s}.basemaps.cartocdn.com/${dark?"dark_all":"light_all"}/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(mapKey())}`,{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',subdomains:"abcd",maxZoom:19}).addTo(map);
  map.on("moveend",()=>{S.mapView={center:[map.getCenter().lat,map.getCenter().lng],zoom:map.getZoom()};});
  const f=S.mf;const T=allT().filter(t=>(!f.lane||laneOf(t)===f.lane)&&(!f.status||t.status===f.status)&&(!f.town||townOf(t)===f.town));
  const E=f.status||f.lane?[]:allE().filter(e=>(!f.town||townOf(e)===f.town)&&(!e.date||e.date>=todayISO()||e.recurring));
  const SHEX={Prospect:"#8b97ab",Contacted:"#2f6fe0",Supporter:"#e8870f",Champion:"#2f9e44",Declined:"#c23b3b"};
  T.forEach(t=>{const c=coordsOf(t);if(!c)return;const col=SHEX[t.status]||SHEX.Prospect;L.circleMarker([c.lat,c.lng],{radius:c.exact?7:6,color:col,weight:2,fillColor:c.exact?col:"#ffffff",fillOpacity:c.exact?.9:.35}).addTo(map).bindTooltip(t.name).on("click",()=>openDetail(t.id));});
  E.forEach(e=>{const c=coordsOf(e);if(!c)return;L.marker([c.lat,c.lng],{icon:L.divIcon({className:"evpin",html:"<i></i>",iconSize:[12,12],iconAnchor:[6,6]})}).addTo(map).bindTooltip(e.name+(e.date?", "+fmtDate(e.date):"")).on("click",()=>openDetail(e.id));});
}
async function geocodeMissing(){if(S.geocoding)return;const list=allT().concat(allE()).filter(x=>{const c=coordsOf(x);return c&&!c.exact&&x.address;});if(!list.length){toast("Nothing left to find");return;}
  S.geocoding=`0 of ${list.length}`;render();let done=0,found=0;
  for(const x of list){const q=x.address+(/CT/.test(x.address)?"":", "+townOf(x)+", CT");try{const r=await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q="+encodeURIComponent(q),{headers:{"Accept":"application/json"}});const j=await r.json();if(j&&j[0]){await write("geo",x.id,{lat:+j[0].lat,lng:+j[0].lon,q});found++;}else{await write("geo",x.id,{miss:true,q});}}catch(e){toast("Address lookup stopped: "+(e&&e.message||"network"));break;}
    done++;S.geocoding=`${done} of ${list.length}`;if(S.tab==="map"){const b=$("[data-act=geocode]");if(b)b.textContent="Finding addresses… "+S.geocoding;}await new Promise(r=>setTimeout(r,1100));}
  S.geocoding="";toast(`Found ${found} of ${done} addresses`);render();}
function rMap(){if(LOCAL)return rLeaflet();return rSchematic();}
function rSchematic(){
  const f=S.mf;const T=allT().filter(t=>(!f.lane||laneOf(t)===f.lane)&&(!f.status||t.status===f.status));
  const by={};T.forEach(t=>{const k=townOf(t);(by[k]=by[k]||[]).push(t);});
  const towns=Object.keys(by).filter(k=>REF.CENTROIDS[k]);const other=Object.keys(by).filter(k=>!REF.CENTROIDS[k]);
  const lats=towns.map(k=>REF.CENTROIDS[k][0]),lngs=towns.map(k=>REF.CENTROIDS[k][1]);
  const minLa=Math.min(...lats,41.64),maxLa=Math.max(...lats,41.87),minLo=Math.min(...lngs,-72.85),maxLo=Math.max(...lngs,-72.5);
  const W=640,H=520,P=50;const X=lo=>P+(lo-minLo)/(maxLo-minLo)*(W-2*P),Y=la=>H-P-(la-minLa)/(maxLa-minLa)*(H-2*P);
  const river=[[41.93,-72.63],[41.86,-72.64],[41.80,-72.655],[41.765,-72.665],[41.74,-72.655],[41.715,-72.64],[41.68,-72.625],[41.64,-72.62]];
  const sel=f.town;const list=sel?(by[sel]||[]):[];
  const svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Towns with people and orgs">
    <path class="river" d="${river.map((p,i)=>(i?"L":"M")+X(p[1]).toFixed(1)+" "+Y(p[0]).toFixed(1)).join(" ")}"/>
    <text class="rlbl" x="${X(-72.62)+8}" y="${Y(41.66)}">Connecticut River</text>
    ${towns.sort((a,b)=>by[b].length-by[a].length).map(k=>{const [la,lo]=REF.CENTROIDS[k];const n=by[k].length;const r=10+Math.sqrt(n)*3.3;const ch=by[k].filter(t=>t.status==="Champion").length;return `<g class="town ${sel===k?"on":""}" data-town="${esc(k)}" transform="translate(${X(lo).toFixed(1)},${Y(la).toFixed(1)})"><circle r="${r.toFixed(1)}"/>${ch?`<circle r="${(r+4).toFixed(1)}" fill="none" stroke="var(--champion)" stroke-width="2.5" stroke-dasharray="${(2*Math.PI*(r+4)*ch/n).toFixed(1)} 999"/>`:""}<text class="c">${n}</text><text y="${(r+13).toFixed(0)}" text-anchor="middle">${esc(k)}</text></g>`;}).join("")}
  </svg>`;
  return `<p class="muted small">${noMapTiles()}Each town sits at its real position, sized by how many people and orgs are there. A green arc shows the share that are Champions. Tap a town for the list; every record has a directions link.</p>
  <div class="toolrow">
    <select data-mf="lane"><option value="">Both lanes</option><option ${f.lane==="B-LEAD"?"selected":""}>B-LEAD</option><option ${f.lane==="Charters & leaders"?"selected":""}>Charters &amp; leaders</option></select>
    <select data-mf="status"><option value="">Any status</option>${STATUSES.map(s=>`<option value="${s}" ${f.status===s?"selected":""}>${SLABEL[s]}</option>`).join("")}</select>
    ${sel?`<button class="chip" aria-pressed="true" data-act="town-clear">${esc(sel)} ×</button>`:""}
    ${other.length?`<span class="small muted">Not on the map: ${other.map(k=>`<a href="#" data-act="town-pick" data-v="${esc(k)}">${esc(k)} (${by[k].length})</a>`).join(", ")}</span>`:""}
  </div>
  <div class="mapwrap"><div class="schem">${svg}</div>
    <div><h2>${sel?esc(sel)+" ("+list.length+")":"Pick a town"}</h2>
      <div class="rows" style="margin-top:8px">${list.sort((a,b)=>({High:0,Medium:1,Low:2}[a.priority]-{High:0,Medium:1,Low:2}[b.priority])||a.name.localeCompare(b.name)).map(t=>`<div class="row" data-open="${t.id}"><div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.subtype||t.type)}${t.address?", "+esc(t.address.split(",")[0]):""}</div></div><div class="r">${statusPill(t.status)}</div></div>`).join("")||`<p class="empty">${sel?"No one here with these filters.":"Towns are sized by count. Hartford and East Hartford hold most of the list."}</p>`}</div>
    </div></div>`;
}

/* ---------- People & orgs ---------- */
function peopleList(){const f=S.pf;let T=allT().filter(t=>(!f.lane||laneOf(t)===f.lane)&&(!f.status||t.status===f.status)&&(!f.comm||(t.community||[]).includes(f.comm))&&(!f.type||t.type===f.type)&&(!f.town||townOf(t)===f.town)&&(!f.pri||t.priority===f.pri)&&(!f.q||[t.name,t.subtype,t.contact_name,t.role,t.town,t.address,t.notes,t.why,t.reach,t.email,t.phone,t.type].join(" ").toLowerCase().includes(f.q)));
  const pr={High:0,Medium:1,Low:2},so=s=>STATUSES.indexOf(s);const k=S.ps.key,dir=S.ps.dir;
  T.sort((a,b)=>{let x,y;if(k==="priority"){x=pr[a.priority]??9;y=pr[b.priority]??9;}else if(k==="status"){x=so(a.status);y=so(b.status);}else if(k==="signatures"){x=-a.signatures;y=-b.signatures;}else if(k==="town"){x=townOf(a);y=townOf(b);}else{x=(a[k]||"").toString().toLowerCase();y=(b[k]||"").toString().toLowerCase();}if(x<y)return -dir;if(x>y)return dir;return a.name.localeCompare(b.name);});return T;}
function rPeople(){
  const f=S.pf,T=peopleList(),all=allT();
  const comms=[...new Set(all.flatMap(t=>t.community||[]))].sort(),types=[...new Set(all.map(t=>t.type))].sort(),towns=[...new Set(all.map(townOf))].sort();
  const H=[["name","Name"],["type","Type"],["community","Community"],["town","Town"],["priority","Priority"],["status","Status"],["signatures","Sigs"],["next_step","Next step"]];
  return `<div class="toolrow">
    <div class="chips"><button class="chip" data-pf="lane" data-v="" aria-pressed="${!f.lane}">Both lanes</button><button class="chip" data-pf="lane" data-v="B-LEAD" aria-pressed="${f.lane==="B-LEAD"}">B-LEAD</button><button class="chip" data-pf="lane" data-v="Charters & leaders" aria-pressed="${f.lane==="Charters & leaders"}">Charters &amp; leaders</button></div>
    <span class="sp"></span><span class="small muted">${T.length} of ${all.length}</span></div>
  <div class="toolrow" style="margin-top:0">
    <div class="chips">${STATUSES.map(s=>`<button class="chip" data-pf="status" data-v="${f.status===s?"":s}" aria-pressed="${f.status===s}"><span class="dot" style="background:${SVAR[s]}"></span>${SLABEL[s]}</button>`).join("")}</div>
    <select data-pf="comm"><option value="">Any community</option>${comms.map(c=>`<option ${f.comm===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-pf="type"><option value="">Any type</option>${types.map(c=>`<option ${f.type===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-pf="town"><option value="">Any town</option>${towns.map(c=>`<option ${f.town===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-pf="pri"><option value="">Any priority</option>${["High","Medium","Low"].map(c=>`<option ${f.pri===c?"selected":""}>${c}</option>`).join("")}</select>
    ${(f.lane||f.status||f.comm||f.type||f.town||f.pri||f.q)?`<button class="btn sm ghost" data-act="pf-clear">Clear</button>`:""}
    <button class="btn sm" data-act="copy-csv">${LOCAL?"Download CSV":"Copy CSV"}</button>
  </div>
  <div class="tablewrap"><table><thead><tr>${H.map(([k,l])=>`<th data-sort="${k}" class="${S.ps.key===k?"on":""}">${l}${S.ps.key===k?(S.ps.dir>0?" ↑":" ↓"):""}</th>`).join("")}</tr></thead>
  <tbody>${T.map(t=>`<tr class="cl" data-open="${t.id}"><td><div class="n">${esc(t.name)}</div><div class="s">${esc(t.contact_name?t.contact_name+(t.role?", "+t.role:""):t.subtype||"")}</div></td><td>${esc(t.type)}</td><td class="s">${esc((t.community||[]).join(", "))}</td><td>${esc(townOf(t))}</td><td class="pri-${t.priority}">${esc(t.priority||"")}</td><td>${statusPill(t.status)}</td><td class="num">${t.signatures||""}</td><td class="s">${esc(t.next_step||"")}${t.next_date?`<br><span class="${daysFromToday(t.next_date)<0?"":"muted"}" style="${daysFromToday(t.next_date)<0?"color:var(--red)":""}">${fmtDate(t.next_date)}</span>`:""}</td></tr>`).join("")}</tbody></table></div>
  ${!T.length?`<p class="empty">No one matches. Clear a filter.</p>`:""}`;
}

/* ---------- Events ---------- */
function rEvents(){
  const f=S.ef,t0=todayISO();let E=allE();
  const towns=[...new Set(E.map(townOf))].filter(Boolean).sort(),types=[...new Set(E.map(e=>e.event_type).filter(Boolean))].sort(),comms=[...new Set(E.flatMap(e=>e.community||[]))].sort();
  E=E.filter(e=>(!f.town||townOf(e)===f.town)&&(!f.etype||e.event_type===f.etype)&&(!f.comm||(e.community||[]).includes(f.comm))&&(f.table===""||(f.table==="yes"?e.can_table===true:f.table==="maybe"?e.can_table==null:e.can_table===false))&&(!f.q||[e.name,e.venue,e.host,e.town,e.address,e.notes,e.why,e.event_type].join(" ").toLowerCase().includes(f.q))&&(!f.nw||e.added)&&(!f.n26||e.bl26)&&(!f.bl||isBlead(e))&&(f.past||!e.date||e.date>=t0||(e.end_date&&e.end_date>=t0)));
  E.sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  let cur="",html="";
  E.forEach(e=>{const wk=weekKey(e.date);if(wk!==cur){cur=wk;html+=`<div class="wk"><h3>${wk?"Week of "+fmtDate(wk,true):"No date"}</h3></div>`;}
    const dn=daysFromToday(e.date);html+=`<div class="card" data-open="${e.id}"><div class="n">${esc(e.name)}${e.added?' <span class="pill blue">new</span>':""}</div><div class="s">${fmtDate(e.date)}${e.end_date&&e.end_date!==e.date?" to "+fmtDate(e.end_date):""}${e.time?", "+esc(e.time):""}, ${esc(e.venue||e.address||townOf(e))}</div><div class="s">${e.owner_type?`<b>${esc(e.owner_type)}</b> · `:""}${esc(e.why||"")}${e.url?` <a class="lnk" href="${esc(e.url)}" target="_blank" rel="noopener" data-stop="1">source ↗</a>`:""}</div><div class="r">${rdPill(e)}${hasDebrief(e)?`<span class="pill green">notes done</span><br>`:""}${(()=>{const a=assessOf(e);return a.decision?`<span class="pill ${a.cls==="go"?"green":a.cls==="fit"?"blue":a.cls==="hold"?"orange":"red"}">${a.decision==="GO IF IT FITS"?"if it fits":a.decision.toLowerCase()}</span><br>`:"";})()}${e.can_table===true?`<span class="pill green">table</span>`:e.can_table===false?`<span class="pill grey">no table</span>`:`<span class="pill sand">table?</span>`}${e.signatures?`<div class="num small" style="margin-top:4px">${e.signatures} sigs</div>`:""}${dn!==null&&dn>=0&&dn<=7?`<div class="small" style="color:var(--blue);margin-top:4px">${rel(dn)}</div>`:""}</div></div>`;});
  return `<div class="toolrow">
    <div class="chips"><button class="chip" data-ef="table" data-v="" aria-pressed="${f.table===""}">All</button><button class="chip" data-ef="table" data-v="yes" aria-pressed="${f.table==="yes"}">Can table</button><button class="chip" data-ef="table" data-v="maybe" aria-pressed="${f.table==="maybe"}">Ask about a table</button></div>
    <select data-ef="town"><option value="">Any town</option>${towns.map(c=>`<option ${f.town===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-ef="etype"><option value="">Any kind</option>${types.map(c=>`<option ${f.etype===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-ef="comm"><option value="">Any community</option>${comms.map(c=>`<option ${f.comm===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <button class="chip" data-ef="bl" data-v="${f.bl?"":"1"}" aria-pressed="${!!f.bl}">B-LEAD connections</button><button class="chip" data-ef="nw" data-v="${f.nw?"":"1"}" aria-pressed="${!!f.nw}">New Oct 20</button><button class="chip" data-ef="n26" data-v="${f.n26?"":"1"}" aria-pressed="${!!f.n26}">New Oct 26</button><button class="chip" data-ef="past" data-v="${f.past?"":"1"}" aria-pressed="${f.past}">Show past</button>
    <span class="sp"></span><span class="small muted">${E.length}</span><button class="btn sm pri" data-act="report-sheet">Report for Kelly</button></div>
  <div class="cards">${html||`<p class="empty">No events match.</p>`}</div>`;
}

/* ---------- Canvasser paperwork ---------- */
const PW_ACH_B64="JVBERi0xLjQKJSBjcmVhdGVkIGJ5IFBpbGxvdyBQREYgZHJpdmVyCjQgMCBvYmo8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNSAwIFIKPj5lbmRvYmoKNSAwIG9iajw8Ci9UeXBlIC9QYWdlcwovQ291bnQgMQovS2lkcyBbIDIgMCBSIF0KPj5lbmRvYmoKMSAwIG9iajw8Ci9UeXBlIC9YT2JqZWN0Ci9TdWJ0eXBlIC9JbWFnZQovV2lkdGggMTE2NQovSGVpZ2h0IDE1MDgKL0ZpbHRlciAvRENURGVjb2RlCi9CaXRzUGVyQ29tcG9uZW50IDgKL0NvbG9yU3BhY2UgL0RldmljZVJHQgovTGVuZ3RoIDExOTgwMAo+PnN0cmVhbQr/2P/gABBKRklGAAEBAAABAAEAAP/bAEMACAYGBwYFCAcHBwkJCAoMFA0MCwsMGRITDxQdGh8eHRocHCAkLicgIiwjHBwoNyksMDE0NDQfJzk9ODI8LjM0Mv/bAEMBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/AABEIBeQEjQMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APf6KKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4hnH9m/wDbX/2Su5rhviL/AMw3/tr/AOyUAdzRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXDfEX/mG/9tf/AGSu5rhviL/zDf8Atr/7JQB3NFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRR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FFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFcN8Rf+Yb/ANtf/ZK7muG+Iv8AzDf+2v8A7JQB3NFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUZqjqesafo9sbjULuK3j7GRsE/QdT+FAF3NRXN1b2cDT3M0cMSjLPIwUD8TXmGs/F6KSVrXQrcliDi6nXgcdk7/AI/lXlura9qmuT+bqV7LcHsGOFX6KOBVKN3YHouY9f1/4vaXYbodJha/mHHmHKRD8ep/L8a5r/hdGs/9A2x/8f8A8a88hmghQk24llPeQnaPoBjJ+vHtQ17OwxlFH+xGq/yFXyoz5meh/wDC6NZ/6Btj/wCP/wCNH/C6NZ/6Btj/AOP/AONeaEknJ617b4A8FeGLnRrXWBG9/LIMk3I+VGBwQF6cH1zQ0kgTbItC8b+NfETA2Og2fkk8zy70jH4k8/hmvRrEXoth9veBpz18hSFH5kk1YVFRQqqFUcAAcCnYrNstIKKKKQwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8AMN/7a/8AsldzXDfEX/mG/wDbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBGXcpGSMjGRXL3vw88O6jctcXtvcXEzdXlupGP6tXU0UAefa38PfDOl6PdXlrYtHPEhMbGZzg/QmqPirwB4c0rwhfX9tp7i6ihBRvOc4YkDOM+9dL4+uvs/hwpn/WzIv4A7v6V0iSI1sshI2Fd2T0xipUvfZtKD9jF92/0Pk3pSojSOERSzE4CgZJr6je50N/vy6e31KGkjuNCicPHJp6OOjKUBrX2qMPYy7HiGg/DHxBrJWSeEWFsf47jhiPZOv54r2nwt4ch8L6MunQ3Es6hy5aTHU9cAdB7VpQ39pcPsguoZHxnajgnFWKlyuHJy7i0VXub61s033NxFCvrIwUfrVaDXdKuZBHDqNs7noolGTU3Roqc2rpGjRSZz0paZAUUhYKCSQAOSSelYs/jDw7bSmObWrFXBwR5wOPyoA26KqWOp2OpxGWxvILlB1aKQNj8qtZB7igBaKKr3l/a6fbNcXlxFBCvV5GCgfnQBYoqK2uYru2juLeRZIZVDo6nIYHoaloAKKinuoLZQ1xPHEpOAZHC5/OoP7W03/oIWv/f5f8aALlFNV1dQyMGVhkEHIIqKe8trXH2i4iiLdPMcLn86AJ6KggvbW5Yrb3MMrAZIjkDY/Kp6ACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/ADDf+2v/ALJXc1w3xF/5hv8A21/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAMfXtAg1+CGGeWSNI5N5CY+bjGKNQh/s/wrcwiRnENqyhnxkgKcZrXrI8UPs8MaifWBh+YxUSSSbNqcpScYN6XPGbS0nvrpLa2jMkz/dQcZ79/pWr/wAIfr3/AEDn/wC+l/xqnoup/wBj6rDfeV5pizhM7c5BH9a66L4mzb/3umps/wBmU5/lXBTVNr32fU4mWJjL9zBNWDwV4f1XTdeNxeWbRReSy7iwPOR6H2rqfFPiBdA03zFAa4kysSn19T7CptD8RWOvQl7ViJE+/E4wy1578QLtp/ErQZO23jVQPcjJ/mK6ZNU6funj04TxeMtWVrbowydS17Uf+Wt3dSduvH9BU2oeHNW0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pqEGfKuYUmTPXDAEZ/Ordc/4J3r4K0aGWCeGWGziikjnhaN1ZUAIIYA9a6Cqe5K2CiiikMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf8Atr/7JXc1w3xF/wCYb/21/wDZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAE7UUtGKAExRS0UAJRS0UAJRS0UAJRS0UAcpe+Hdd1PxE73uuRv4dLpIunJagOWXBCtJ1K7hk+vTpXVYoxS0AFJS0UAJRS0UAJiilooASilooASilooASuP0Xwxqdh491nxFcS2hh1OOKMwRsxaLy1wDkjDZ/CuxoxR1uHkJRS0UAJRilooASilooASilooASilooASilooASloooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/wDMN/7a/wDsldzXDfEX/mG/9tf/AGSgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiijNABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVw3xF/wCYb/21/wDZK7muG+Iv/MN/7a/+yUAdzRRRQAUUUUAFFFFABRRRQAUUUUAFFFFA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0/w5HZSXwnK3lyltF5MZf526Zx0FbVVrCzj0/TrayiLNHbxLEpY5JCgAZ/KrNABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAVw3xF/5hv/bX/wBkrua4b4i/8w3/ALa/+yUAdzRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFACUYpaKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBKWiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigBKWiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv8AzDf+2v8A7JXc1w3xF/5hv/bX/wBkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooprbtp2kBscEjIzQA6iuL8G+JNa13XvEVlqDWAg0q7+zIbeB0aTgncSXIHbjFb+ua0mj28AVBLd3cy29rDnHmSN6nsAAST6A0AatFctL4qNn4il0S5R5LqLTzdgRWz4uCM52nkLjGMEkkn250fC2uReI/D1tqkL7lm3Z/dNHhgSCMNzwRjPfFAGxRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFcddaj4rW58SRQvoyxW8aPp88gk2xk/eWbHVsDPy+o9avJrt7YW+jz61BFCt+scM2wEfZ7hhwpz/CT8o7g4znPAB0dFFIelAC0Vy3hTxHc6r/bC6m9rG9nqkljEYwUDhQuOGY8nJrpZZ4oIzJNIkaDqzsAB+NAElFN8xAoYsu04wc8HPSozdW6wtMZ4hEpILlxtB6dfrQBNRXL+M/EN7oOn6ddaf9mkW5v4LaTzVLZSRgMqQRyPxroluoGSRxPEVjz5hDjCY659KAJqKqrqNk0DTreW5hU4aQSj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ItL1HTRZO9nqUjS3cctxLJ5jt1bLMSDwORjpWtZWMGn2iWtuHESDA3yM7fizEk/iaOlg6nB6t4Sh8XReI4FlNtqNtqizWN2vDQSi3hwcjse//wBYVW8EeKLrWvEV7FrUJstX0rT/ALPqAIwu4OT5g7YI5/8ArYru9N0DT9Iuru5s0nWW7fzJzJdSyB2wBnDsQDgAcdhUh0XTzqc+om1T7VcQC3mfH+sjBJAI79T+dLb+vIDzGxvri21Lwbd2N1e3EF/eSwzahcylTfoUds+VkgLwNucEY4GK0U0/+1fGHjmyu73UWtreG3aGJb2VViZomYkYb15x09q6aHwB4aghtIYrCRUs5fOth9rm/cNz9w78qOT8o4PpV1PCukR3uo3iQ3C3GpKEunF3NmQAYH8Xy4HAximx3PNrWa7Xwb4F8QtqF9JqdzfWsE8z3LkSRuSrKUztxjHbORnrk1pompeNLvxPapqsdldWN89vCcyCS0VQNjqFcDnk5I55HQYrrR4G8PrpNjpa2k4srGUTW0QvZv3bg5BB354PQZwKbqfgDwvrGrLql/pMc16FCtL5jrvA6BwCA/8AwIGm9xGtpDu+kWbSXaXknkruuUXaspxy4Hoev41epqIsaBEUKqjAAGABTqQIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8AMN/7a/8AsldzXDfEX/mG/wDbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKA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6bZ2QkOX+zQLHvPqdoGavCgAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/tr/7JXc1w3xF/5hv/AG1/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAEpaKKACiiigApKWigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/wAw3/tr/wCyV3NcN8Rf+Yb/ANtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/AMw3/tr/AOyV3NcN8Rf+Yb/21/8AZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf8Atr/7JXc1w3xF/wCYb/21/wDZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf+2v/sldzXDfEX/mG/8AbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAorM8Qa1B4e0C+1a4G6O1iMmwHBc9lHuTgfjS6BrVv4h0Cx1e1/wBTdwrIBnO0nqp9wcj8KANKikzRmgBaKTNGaAFopM0ZoAWikzTJpo4IXmldY40UszscBQOpJoAkopqSLIiuhDKwyCO4rj/GPje68JahpVsNHS9TU7gW0DrdbCJDgDcChwOeoJ6UAdlRUcLStEpmREkI+ZUYsAfYkDP5CpM0AFFclL4t1K6ub9dB0RNTh0+7FpcZuxDIXwC2wFSCF3DqwzziusB/CgBaKTNGaAFopM0ZoAWikzUctzDDJFHLKiPM2yNWOC5wTgepwCfwoAlorMlv9STxFBYppRfTngaSS/8APUCNweE2dTn1rSzQAtFJmigBaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8AMN/7a/8AsldzXDfEX/mG/wDbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiimsWCNsALY4BOAT9aAON8Va1p8fiLTdMv1uXtoAbydYLOW4DNysSsI1bAzubn+4K5r4Uatb6dr2veD42nFrDKb3TRcQPC3kOfmXa4DfKcducmu18L6brNldavda0tkbi9uvNRrWd5NsYUKiHci42gfiSTxWH4r8Ja/f+PtD8S6GdOibT1aOf7RcOjXEbdUwsZA6tzk9aFo/UHqjQg1O78TeKtZ0u2v5rGy0ny4na3C+ZNK67jkspwqjAwBknPOOKz7nV/E3hzR7DTNVvLS51fUtT+xWl2qcCI8iR1wAXCg8DjOPeo9S8HeJ9P8YXPiTwjqGnQyaiiC/stQDtCzKMBlKDOcfTv61a8ReBtR8R+GYYbrWdmvW9yt7BeRx7Y4pVHCqmThMcdSe5z0pdA6mh9h8QaV4ggul1k3mh+Q5vYrwL5quBlWj2IOvcHj0rG8NXmueOfCkniCDW7jTZbl5TYwQxxtHEqsVXeGUlySuTz34xWvoGn+MJZFbxXqOmPHEpCwaZG6iYkY3SM3Xj+EADPPaqPh7wvrvg21vNK0Z9Pu9KkleW0+1yvHJa7uSpCowkUHkcqabA5Wbx5rGreC/D2rxzvY6h/bkWm30cOPLk+YhuDngjH05rqdV1PULP4ueHtNhvZhYX1rcST25IKFkX5SOMj86rX3w0dPAtjoul3sf2+zvk1EXFwpCTzhix3AcgHOOM4AHWrMvhfxHqHjbQ/El5daXbmwilikt4VkkBDgA4Y7cnrzgY44NC3/AK7A/wCvvKWnXviHWPiD4p0CTxBNb2Vilu0LW9vEJE3qWwCykd+cgngYI5zzGu6zqXiH4C6zcajeyteWN01rJNFiP7QFlVfmAHQhuQMdK7nR/Dmt6d498Ra/LHp7W+pxxLDGty+9TGm0bv3eOfYnHvWJZ/DvWn+G2veGL6awjub+5kuYZoJXdAWcOA2UUjkY4zU9Bp6nf6FaGz0e2jNzPcZRW3TMCRwOOAOK8/8Ai5/yGvAn/Yci/wDQlrv9Cj1SHSoY9W+yC5RQpFozMnAx1YAnPXoMdOetcn8QPCviDxNqmgz6YNMSHSr1bsm5uZFaQgg7cLGQOh5yatv3k/MlfCHjDV9dsfHnhbTNO1QW9pqbTpNGbdXxsTIIJ5zz9MgZz0o0K/1WPx7r3hS81e5vbZLOO6t7iRY1mi3cMMooB55HHFWPEHhzXdX8X+GNZhi05ItJaVpo3un3OZFCkLiPtjqcZ9qW08O65bfErVPEjR6c1ndWa2sUYuX8wFTkFh5eOfYnHvUrb7xs574bxDT4vGGpTX960VlrV4zx71KyBVBLMMcn8q09Dn8ReLvBI8Rwa3NY310sktnbRRxmCIBiFRgyktnHJz34xVzwV4X1jRV1631mLTpLfVb6a8/0e4dyokABQho19OufwpmgeGPEXhPSLjQtLnsLnTgzmynupXSW2ViTtZQhEmCSR8y59qNbW8kHX5nM3/xA13U/hxoPiHTbiOxvLjUY7K7h8oOrHeVbBOSAcducHr3rU8by+KvCPg/VNVj8UvczG5iMIayiXylZgpQdcjnIPUY/GpNX+HV5F4K0bw5oLWjLY3kd3LNdzNGZGVizcKjfeJ/D3rZ+IHh7V/Ffg6TSLFbGK5meNnaedwibXDcEISenoKp/r/kCMbxFeeJdB8SeGzB4geePV7g2k8E9tH5UZK5DRhQGGOeCxz3NXNPv9X0r4pf8I9davcalY3emm8Q3McYeKRX2kAoqjaR2xUvinw94g1rU/DV3aRaYg0q6FzMst1IN5xgquIj27nH0qW48O6zN8TLXxGq2AsYrBrNl+0P5vzNu3AeXjj0zS6/eLocx4n8Sa9oGgapql3rYTWrW53xabahJoVt/MAUSAIWXcpPzMQc9D2qfxTBJf/FnwWwvryFbi2uXCxSACMiPOVBGMnPJqIfDrxOfAOseFXvdJYXUzzJfN5hlnJcP+9GODxjcC3HGO9bmp+FvEF1q/hbW7d9MF/pKSxXEMkkgidXUL8rBScjHcDPtRHpf+tBsffavqtn8V9E0Vb9m026sppZIWjTJZBgHdjPv1qPQNU1Hxxea9PFqtzptjYXr2NtHarHuZkA3SOXVs5J4HAx1zUt94c1+5+I+j+IlXTWtLG1e3kUzyK7l+rBdhAx6bj9adpvhbVfC/iHVrzQjZ3GnapL9ols7uVoTDMfvMjKj5B9CB9aOn9dwOWn8ceJB4D8WCS8jh1zw7ceS11HApWdc4Vtp4BIz29K0dS1jX9El8H6pJrUtzHq11Da3Vm0MaxYkXO5MLuBB7ljn2HFWNR+H1/J4K8QafazWkusa9OZ7qeZmjiQkggLhWJCgYGevJ9ql1/wp4g1XTvCdvAmmI+j3UFzcb7qTDmMY2oRF365OPpQt/u/4IP8Az/4B6DRTVLbRuABxyAc06gAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/ADDf+2v/ALJXc1w3xF/5hv8A21/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooASilooASilooASjFLRQAlFLRQAlFLRQAlFLRQAUUUUAJRilooAKSlooASloooAKMUUUAJijFLRQAmKMUtFABiiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/7a/+yV3NcN8Rf+Yb/wBt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jFLRQAlGKWigAooooASilooASilooATFGKWigBMUUtFACYopaKAEopaKAEopaKAEopaKAExRS0UAJiilooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/wDMN/7a/wDsldzXDfEX/mG/9tf/AGSgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoqlfavpumGIahqFpaGVtsYuJlj3n0GSMmpL2/s9Otmub67gtbdess8gRR+JOKALNFQ211b3lulxazxTwSDKSROGVh6gjg1NQAUUUUAFFFFABRRRQAUUVC91BHcRW7zRrNKGaOMsAzBcZIHfGR+dAE1FFFABRRSZoAWiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/tr/7JXc1w3xF/5hv/AG1/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA5D4iaRa69oNrpV4G+z3V9DG5U4YZPUe9cha67fad4e8Q+BPE8m/U7TTZ2srl+l9bhGwR6sAMH6exrv8AxLY6rfjTxpkVm3kXkVxKbmdo/lQ5IG1G5P4VmfEHwPD420ERBlt9Ut8vaXAJ+RiMFSeu09D+dJbD6o0L/Vb+xlsrOysY/Ja3aWW9uGKQQBcAKSO5z7cA9axZviJJ/wAK9tPFVtpiSiaZYZIDcY2ky+USp2/Nz9OKvat4f1i58U6XqMDWVzYWts0TWd27KI5SRiZQFIZgBjnHsRmsD/hBPEC/DkeGQ+mPPHfeesxnkVWTz/N5Hlkg9sc/U0yVsbZ8Ua8nis+HpNIsftM1obu3lW7Yxqobawc7M5GR0HOe3WoLP4hCXSIXurNYtTfUJdOM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UUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABXDfEX/mG/9tf/AGSu5rhviL/zDf8Atr/7JQB3NFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBka/4Z0nxRZLZ6vBJcW6sH8tbiSMEjoTsYZx71EPCOjG+trya3nup7U7oDd3c04ib+8qyMQD74zW5RQBh3fhHQ77VLjUriyLXNzEIZyszqsyAYAdAwV/xBqKLwRoEP9l7LWcDSsmy/0yY+TkY4+fnjjnPHHSuhooA5yXwN4fmj1SOS1uGXVWDXo+2z/viOOfn444wMcVMfB+if2lY6gLecXljD5EEy3kwZY/7pw/zD/ezW7RQAhAIIIBB7Vg2vg/StPaQaebuygkYu9va3UkcRJ6kKDhf+A4rfooAw77wlomoxWcVzaybLKYTwLHcSRhZAc7/lYZbJPJyeTUs3h/TP7Y/tv7I7aikQj3pM48xV5UMu4K2D0LA4rXxRigDk9FjuNd15PEOoaJNpclrbta28d1sMrbmBdvlJwvyqBz3aujt7C2tbi6uIY9st04kmbcTuYKFHXpwo4HFWcUUAc6fBekKl3HEb2GK8keW5ihvJUSVnJLZAbjOf4cVavPC2jX2mWenTWKra2TpJbJC7RGFl+6VZCCCPY1sUUAYM/g3QLi/lvZLAmaaAW822aRVmjAwFdQ218D+8DTV8E+H0g02FbOQLpoYWhF1LuiBGCu7dkqQANpJGBjFdBRQBzV/4A8LanrR1e80eGS9bG99zBZMdN6g7W6DqDXSAAAADAHalooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv8AzDf+2v8A7JXc1w3xF/5hv/bX/wBkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/wC2v/sldzXDfEX/AJhv/bX/ANkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/7a/+yV3NcN8Rf+Yb/wBtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/wAw3/tr/wCyV3NcN8Rf+Yb/ANtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/AMw3/tr/AOyV3NcN8Rf+Yb/21/8AZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf8Atr/7JXc1w3xF/wCYb/21/wDZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf+2v/sldzXDfEX/mG/8AbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8AMN/7a/8AsldzXDfEX/mG/wDbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/wDMN/7a/wDsldzXDfEX/mG/9tf/AGSgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/ALa/+yV3NcN8Rf8AmG/9tf8A2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/tr/7JXc1w3xF/5hv/AG1/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/ADDf+2v/ALJXc1w3xF/5hv8A21/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv8AzDf+2v8A7JXc1w3xF/5hv/bX/wBkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/wC2v/sldzXDfEX/AJhv/bX/ANkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/7a/+yV3NcN8Rf+Yb/wBtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/wAw3/tr/wCyV3NcN8Rf+Yb/ANtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/AMw3/tr/AOyV3NcN8Rf+Yb/21/8AZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf8Atr/7JXc1w3xF/wCYb/21/wDZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/zDf+2v/sldzXDfEX/mG/8AbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8AMN/7a/8AsldzXDfEX/mG/wDbX/2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/wDMN/7a/wDsldzXDfEX/mG/9tf/AGSgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/ALa/+yV3NcN8Rf8AmG/9tf8A2SgDuaKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAK4b4i/8w3/tr/7JXc1w3xF/5hv/AG1/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/ADDf+2v/ALJXc1w3xF/5hv8A21/9koA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv8AzDf+2v8A7JXc1w3xF/5hv/bX/wBkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/wC2v/sldzXDfEX/AJhv/bX/ANkoA7miiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACuG+Iv/MN/7a/+yV3NcN8Rf+Yb/wBtf/ZKAO5ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigArhviL/wAw3/tr/wCyUUUAf//ZCmVuZHN0cmVhbQplbmRvYmoKMiAwIG9iajw8Ci9SZXNvdXJjZXMgPDwKL1Byb2NTZXQgWyAvUERGIC9JbWFnZUMgXQovWE9iamVjdCA8PAovaW1hZ2UgMSAwIFIKPj4KPj4KL01lZGlhQm94IFsgMCAwIDYxMi4wIDc5Mi4xODU0MDc3MjUzMjE5IF0KL0NvbnRlbnRzIDMgMCBSCi9UeXBlIC9QYWdlCi9QYXJlbnQgNSAwIFIKPj5lbmRvYmoKMyAwIG9iajw8Ci9MZW5ndGggNDcKPj5zdHJlYW0KcSA2MTIuMDAwMDAwIDAgMCA3OTIuMTg1NDA4IDAgMCBjbSAvaW1hZ2UgRG8gUQoKZW5kc3RyZWFtCmVuZG9iago2IDAgb2JqPDwKL1RpdGxlICj+/wA1ADAAQwBBAE4ALQBBAEMASAAtAFAAYQB5AG0AZQBuAHQALQBSAGUAcQB1AGUAcwB0AC0ARgBvAHIAbSkKL0NyZWF0aW9uRGF0ZSAoRDoyMDI2MTEwMjE0NTMwNVopCi9Nb2REYXRlIChEOjIwMjYxMTAyMTQ1MzA1WikKPj5lbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNiBmIAowMDAwMDAwMTQ0IDAwMDAwIG4gCjAwMDAxMjAxMTQgMDAwMDAgbiAKMDAwMDEyMDI4OCAwMDAwMCBuIAowMDAwMDAwMDQwIDAwMDAwIG4gCjAwMDAwMDAwODcgMDAwMDAgbiAKMDAwMDEyMDM4MyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9Sb290IDQgMCBSCi9TaXplIDcKL0luZm8gNiAwIFIKPj4Kc3RhcnR4cmVmCjEyMDUzNwolJUVPRg==";
const PW_ACH_THUMB="data:image/jpeg;base64,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";
const PW_ACH_NAME="50CAN-ACH-Payment-Request-Form.pdf";
const PW_W9_URL="https://www.irs.gov/pub/irs-pdf/fw9.pdf";
const PW_ITEMS=[["w9","W-9"],["ach","ACH form"],["chk","Voided check"]];
function pwOf(c){return (c&&c.pw)||{};}
function pwReady(c){if(c&&c.paperwork)return true;const p=pwOf(c);return PW_ITEMS.every(([k])=>p[k]);}
function pwMissing(c){if(c&&c.paperwork)return [];const p=pwOf(c);return PW_ITEMS.filter(([k])=>!p[k]).map(([,l])=>l);}
function teamRest(c){const o={...(c||{})};delete o.id;return o;}
function pwChips(c){const p=pwOf(c);return `<div class="pw-chips vh-canv">${PW_ITEMS.map(([k,l])=>`<button class="pw-chip${p[k]?" on":""}" data-act="pw-tog" data-id="${c.id}" data-k="${k}" title="${p[k]?"Received "+esc(fmtDate(p[k])):"Tap when you have it"}" aria-pressed="${!!p[k]}">${l}</button>`).join("")}</div>`;}
function pwRing(done,n){const r=26,C=2*Math.PI*r,f=n?done/n:0;return `<svg class="pw-ring" viewBox="0 0 62 62" aria-hidden="true"><circle class="bg" cx="31" cy="31" r="${r}"/>${done?`<circle class="fg" cx="31" cy="31" r="${r}" stroke-dasharray="${(C*f).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 31 31)"/>`:""}<text x="31" y="32">${done}</text></svg>`;}
function pwSection(){
  const n=S.team.length,done=S.team.filter(pwReady).length;
  return `<section class="sec" style="margin-top:0"><div class="h"><h2>Paperwork to get paid</h2><span class="meta">Tap a form for the steps</span></div>
    <div class="pw-grid">
      <button class="pw-tile" data-act="pw-doc" data-id="ach"><span class="pw-thumb"><img src="${PW_ACH_THUMB}" alt=""></span><div><b>50CAN ACH form</b><span>Direct deposit</span></div><span class="go">Open</span></button>
      <button class="pw-tile" data-act="pw-doc" data-id="w9"><span class="pw-thumb"><span class="pw-w9"><span class="f"><small>Form</small>W-9</span><i></i><i></i><i class="s"></i><i></i><i class="s"></i></span></span><div><b>IRS Form W-9</b><span>Tax info</span></div><span class="go">Open</span></button>
      <button class="pw-tile vh-canv" data-act="pw-status">${pwRing(done,n)}<div><b>${n?(done===n?"Everyone's ready":`${n-done} still missing forms`):"No canvassers yet"}</b><span>${n?`${done} of ${n} ready to be paid`:"Add a canvasser to track forms"}</span></div></button>
    </div></section>`;
}
function pwAchBlob(){const b=atob(PW_ACH_B64),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return new Blob([u],{type:"application/pdf"});}
async function pwSaveAch(){
  if(LOCAL){const a=document.createElement("a");a.href=URL.createObjectURL(pwAchBlob());a.download=PW_ACH_NAME;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);return;}
  const d=await useCap("downloads");
  if(!d){toast("Saving files isn't available in this view. Open the hub on claude.ai.");return;}
  try{await d.save({filename:PW_ACH_NAME,data:pwAchBlob()});toast("Form saved");}
  catch(e){const c=e&&e.code;if(c==="declined")return;if(c==="rate_limited"){toast("A save is already open. Finish that one first.");return;}toast("Couldn't save the form. Try again from claude.ai.");}
}
function pwDoc(key){
  if(key==="ach"){
    openSheet("50CAN ACH Payment Request Form",`<div class="pw-sheet"><img class="pw-big" src="${PW_ACH_THUMB}" alt="The blank 50CAN ACH Payment Request Form">
      <p class="lede">How 50CAN pays you by direct deposit.</p>
      <ol><li>Write your full name in the first line, inside the quotes, and next to Consultant Name.</li>
      <li>Sign and date it.</li>
      <li>Mark Checking or Saving. Fill in the name on the account, bank name, routing number, account number, and the bank's city and state.</li>
      <li>Attach a voided check from that same account.</li>
      <li>Give it to your LEAD coordinator with your W-9.</li></ol>
      <p class="note">This form has your bank numbers. Hand it over in person or by email, never in a group chat.</p>
      <p class="tip">On iPhone: save the form, open it in Files, and tap the pen to type and sign.</p></div>`,
      {btns:`<button class="btn pri" id="pwSaveBtn">Save the form (PDF)</button><button class="btn ghost" data-close="1">Close</button>`});
    const b=document.getElementById("pwSaveBtn");if(b)b.addEventListener("click",pwSaveAch);
  }else{
    openSheet("IRS Form W-9",`<div class="pw-sheet">
      <p class="lede">Gives 50CAN your tax info so they can pay you as a contractor and report it at tax time.</p>
      <ol><li>Line 1: your full legal name.</li>
      <li>Box 3a: check Individual/sole proprietor.</li>
      <li>Lines 5 and 6: your address.</li>
      <li>Part I: your Social Security number.</li>
      <li>Part II: sign and date.</li>
      <li>Give it to your LEAD coordinator with your ACH form.</li></ol>
      <p class="note">The W-9 has your Social Security number. Hand it over in person or by email, never in a group chat.</p>
      <p class="tip">The link opens the current W-9 on IRS.gov. You can type into it before you sign.</p></div>`,
      {btns:`<a class="btn pri" href="${PW_W9_URL}" target="_blank" rel="noopener">Open the W-9 on IRS.gov</a><button class="btn ghost" data-close="1">Close</button>`});
  }
}
async function pwToggle(id,k){
  const c=S.team.find(x=>x.id===id);if(!c)return false;
  const p={...pwOf(c)};p[k]=p[k]?"":todayISO();
  const ok=await write("team",id,{...teamRest(c),pw:p});
  if(ok){c.pw=p;render();}
  return ok;
}
function pwStatus(){
  const T=[...S.team].sort((a,b)=>(pwReady(a)-pwReady(b))||String(a.name||"").localeCompare(String(b.name||"")));
  openSheet("Paperwork by canvasser",`<div class="pw-sheet"><p class="lede">Tap a form when you have it. A canvasser is ready to be paid once all three are in.</p>
    <div>${T.map(c=>`<div class="pw-who"><div><div class="n">${esc(c.name)}</div><div class="small muted">${pwReady(c)?"Ready to be paid":"Missing: "+esc(pwMissing(c).join(", "))}</div></div>${pwChips(c)}</div>`).join("")||`<p class="empty">Add your canvassers first.</p>`}</div></div>`);
  document.querySelectorAll("#overlay .pw-chip").forEach(b=>b.addEventListener("click",async()=>{if(await pwToggle(b.dataset.id,b.dataset.k))pwStatus();}));
}

/* ---------- Team ---------- */
function rTeam(){
  const per={};S.shifts.forEach(e=>{per[e.who]=per[e.who]||{shifts:0,sigs:0,hrs:0,out:0,back:0};const p=per[e.who];p.shifts++;p.sigs+=+e.sigs||0;p.hrs+=+e.hrs||0;p.out+=+e.out||0;p.back+=+e.back||0;});
  const tot=Object.values(per).reduce((a,p)=>({sigs:a.sigs+p.sigs,hrs:a.hrs+p.hrs,out:a.out+p.out,back:a.back+p.back}),{sigs:0,hrs:0,out:0,back:0});
  const log=[...S.shifts].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  return `${pwSection()}<div class="two">
    <section class="sec"><div class="h"><h2>Canvassers</h2><button class="btn sm" data-act="team-add">+ Canvasser</button></div>
      <div class="rows">${S.team.map(c=>`<div class="row" data-act="team-edit" data-id="${c.id}"><div><div class="n">${esc(c.name)}</div><div class="d">${esc([c.phone,c.area].filter(Boolean).join(", "))}</div>${pwChips(c)}</div><div class="r num">${(per[c.name]||{sigs:0}).sigs} sigs<br>${(per[c.name]||{hrs:0}).hrs} hrs</div></div>`).join("")||`<p class="empty">${S.loaded.team?"Add your canvassers to start logging shifts.":ld()}</p>`}</div>
    </section>
    <section class="sec"><div class="h"><h2>Totals</h2></div>
      <div class="totals"><div><b class="num">${tot.sigs}</b><span>signatures from shifts</span></div><div><b class="num">${tot.hrs}</b><span>hours</span></div><div><b class="num">${tot.out-tot.back}</b><span>sheets still out</span></div><div><b class="num">${S.shifts.length}</b><span>shifts logged</span></div></div>
      <div class="chips"><button class="btn sm pri" data-act="report">Copy daily report for Kelly</button><button class="btn sm" data-act="log-csv">${LOCAL?"Download log (CSV)":"Copy log as CSV"}</button></div>
    </section>
  </div>
  <section class="sec"><div class="h"><h2>Log a shift</h2></div>
    <form class="form" id="shiftForm">
      <div class="f"><label>Date</label><input type="date" name="date" value="${todayISO()}"></div>
      <div class="f"><label>Canvasser</label><select name="who">${S.team.map(c=>`<option>${esc(c.name)}</option>`).join("")||`<option value="">Add a canvasser first</option>`}</select></div>
      <div class="f" style="grid-column:span 2"><label>Where (location, event, church)</label><input name="where"></div>
      <div class="f"><label>Sheets out</label><input type="number" name="out" min="0" value="0"></div>
      <div class="f"><label>Sheets back</label><input type="number" name="back" min="0" value="0"></div>
      <div class="f"><label>Signatures</label><input type="number" name="sigs" min="0" value="0"></div>
      <div class="f"><label>Hours</label><input type="number" name="hrs" min="0" step="0.5" value="0"></div>
      <div class="f wide"><label>Notes</label><input name="notes"></div>
      <div class="wide"><button class="btn pri" type="submit" ${S.canWrite===false||!S.team.length?"disabled":""}>Add to log</button></div>
    </form>
  </section>
  <section class="sec"><div class="h"><h2>Shift log</h2><span class="meta">${log.length}</span></div>
    <div class="tablewrap"><table><thead><tr><th>Date</th><th>Canvasser</th><th>Where</th><th>Out</th><th>Back</th><th>Sigs</th><th>Hrs</th><th>Notes</th><th></th></tr></thead><tbody>
    ${log.map(e=>`<tr><td class="num">${fmtDate(e.date)}</td><td>${esc(e.who)}</td><td>${esc(e.where||"")}</td><td class="num">${e.out||0}</td><td class="num">${e.back||0}</td><td class="num"><b>${e.sigs||0}</b></td><td class="num">${e.hrs||0}</td><td class="s">${esc(e.notes||"")}</td><td><button class="btn sm ghost" data-act="shift-del" data-id="${e.id}">Delete</button></td></tr>`).join("")||`<tr><td colspan="9" class="empty">No shifts yet.</td></tr>`}
    </tbody></table></div>
  </section>`;
}

/* ---------- Board of Champions ---------- */
function rBoard(){
  const inv=REF.BOARD.invite,fly=REF.BOARD.flyer;const cats=[...new Set(inv.map(r=>r.category))];const fcats=[...new Set(fly.map(r=>r.category))];
  const mine=[...S.board].sort((a,b)=>(a.createdAt||"")<(b.createdAt||"")?1:-1);
  const row=r=>`<div class="row static"><div><div class="n" style="${r.name?"":"color:var(--muted);font-weight:500"}">${esc(r.name||"Name still needed")}</div><div class="d">${esc(r.title)}</div></div><div class="r num wrap">${esc(r.phone||"")}${r.phone&&r.email?"<br>":""}${esc(r.email||"")}</div></div>`;
  return `  <section class="sec"><div class="h"><h2>Names I'm adding</h2><span class="meta">${mine.filter(m=>!m.onSheet).length} not yet on Kelly's sheet</span><button class="btn sm pri" data-act="board-add">+ Name</button></div>
    <div class="rows">${mine.map(m=>`<div class="row" data-act="board-edit" data-id="${m.id}"><div><div class="n">${esc(m.name)}</div><div class="d">${esc(m.title||"")}${m.category?", "+esc(m.category):""}${m.phone||m.email?", "+esc([m.phone,m.email].filter(Boolean).join(" "))+"":""}</div></div><div class="r">${m.onSheet?`<span class="pill green">on her sheet</span>`:`<span class="pill orange">add to sheet</span>`}</div></div>`).join("")||`<p class="empty">${S.loaded.board?"Community leaders you want on the board go here first, then onto Kelly's sheet.":ld()}</p>`}</div>
  </section>
  <section class="sec"><div class="h"><h2>Already on Kelly's invite list</h2><span class="meta">${inv.length} rows</span></div>
    ${cats.map(c=>`<h3 style="margin:14px 0 4px">${esc(c)}</h3><div class="rows">${inv.filter(r=>r.category===c).map(row).join("")}</div>`).join("")}
  </section>
  <section class="sec"><div class="h"><h2>Flyer and newsletter list</h2><span class="meta">${fly.length} rows, people who can share LEAD's flyers with their community</span></div>
    ${fcats.map(c=>`<h3 style="margin:14px 0 4px">${esc(c)}</h3><div class="rows">${fly.filter(r=>r.category===c).map(row).join("")}</div>`).join("")}
  </section>`;
}

/* ---------- Playbook ---------- */
function rPlaybook(){
  const sub=S.pb;const nav=[["howto","How-tos"],["questions","Open questions"],["facts","Script & facts"],["meetings","Hearings & meetings"],["schools","Schools & leaders"]];
  let html=`<div class="subnav">${nav.map(([k,l])=>`<button data-act="pb-go" data-v="${k}" aria-pressed="${sub===k}">${l}</button>`).join("")}</div>`;
  if(sub==="howto"){
    let L=S.playbook.filter(p=>(!S.pbLane||p.lane===S.pbLane)&&(!S.pbStatus||p.status===S.pbStatus)).sort((a,b)=>(a.order??99)-(b.order??99)||a.title.localeCompare(b.title));
    html+=`<p class="muted small">The SOP LEAD doesn't have, written as you learn it. Sand background means it's still a guess; a red edge means there's no process yet.</p>
    <div class="toolrow"><select data-act="pb-lane"><option value="">All lanes</option>${LANES.map(l=>`<option ${S.pbLane===l?"selected":""}>${l}</option>`).join("")}</select><select data-act="pb-status"><option value="">Any status</option>${Object.entries(PB_STATUS).map(([k,v])=>`<option value="${k}" ${S.pbStatus===k?"selected":""}>${v[0]}</option>`).join("")}</select><span class="sp"></span><button class="btn sm pri" data-act="pb-add">+ How-to</button></div>
    <div>${L.map(p=>`<div class="entry ${p.status||"guess"}" data-act="pb-open" data-id="${p.id}"><div class="t">${esc(p.title)}</div><div><span class="pill ${PB_STATUS[p.status||"guess"][1]}">${PB_STATUS[p.status||"guess"][0]}</span></div><div class="b">${esc(p.body||"")}</div><div class="m">${esc(p.lane||"")}${p.source?", from "+esc(p.source):""}${p.updatedAt?", updated "+fmtDate(p.updatedAt):""}</div>${/branch/i.test(p.title||"")?`<div class="cu-links">Culture guides: ${CU_G.map(g=>cuBtn(g.key)).join(" ")}</div>`:""}</div>`).join("")||`<p class="empty">${S.loaded.playbook?"Nothing here yet.":ld()}</p>`}</div>`;
  } else if(sub==="questions"){
    const open=S.questions.filter(q=>q.status!=="answered"),ans=S.questions.filter(q=>q.status==="answered");
    html+=`<div class="toolrow"><span class="muted small">Things you still don't know about how LEAD runs. Once answered, turn it into a how-to.</span><span class="sp"></span><button class="btn sm pri" data-act="q-add">+ Question</button></div>
    <div>${open.map(q=>`<div class="entry" data-act="q-open" data-id="${q.id}"><div class="t" style="font-weight:500">${esc(q.q)}</div><div><span class="pill grey">ask ${esc(q.askWho||"?")}</span></div><div class="m">${esc(q.lane||"")}${q.createdAt?", asked "+fmtDate(q.createdAt):""}</div></div>`).join("")||`<p class="empty">No open questions.</p>`}</div>
    ${ans.length?`<h3 style="margin:18px 0 4px">Answered (${ans.length})</h3><div>${ans.map(q=>`<div class="entry" data-act="q-open" data-id="${q.id}"><div class="t" style="font-weight:500">${esc(q.q)}</div><div><span class="pill green">answered</span></div><div class="b">${esc(q.answer||"")}</div></div>`).join("")}</div>`:""}`;
  } else if(sub==="facts"){
    html+=`<p class="muted small">From the Champion Playbook, Oct 5. Reference only; edit the Word file if the facts change.</p><div class="facts">${REF.FACTS.map(f=>`<h3>${esc(f.title)}</h3><ul>${f.items.map(i=>`<li>${linkify(i)}</li>`).join("")}</ul>`).join("")}</div>`;
  } else if(sub==="meetings"){
    const t0=todayISO();
    html+=`<p class="muted small">Public bodies whose meetings matter for a charter: where the hearing happens, who comments on the file, and when you can speak.</p>
    ${REF.MEETINGS.map(m=>{const nd=(m.next_dates||[]).filter(d=>d>=t0);return `<div class="meet"><div class="n">${esc(m.body)}</div><div class="s">${esc(m.schedule)}</div><div class="s">${esc(m.location||"")}</div>${(m.next_dates||[]).length?`<div class="dates">${m.next_dates.map(d=>`<span class="${d===nd[0]?"next":""} ${d<t0?"muted":""}">${fmtDate(d,true)}</span>`).join("")}</div>`:""}${m.notes?`<div class="s" style="margin-top:6px">${linkify(m.notes)}</div>`:""}${m.url?`<div class="s" style="margin-top:4px"><a href="${esc(m.url)}" target="_blank" rel="noopener">Source</a></div>`:""}</div>`;}).join("")}`;
  } else {
    html+=`<p class="muted small">Charter schools and education leaders in Greater Hartford: who runs them, when enrollment opens, and where their families gather.</p>
    ${REF.SCHOOLS.map(s=>`<div class="meet"><div class="n">${esc(s.name)}</div><div class="s">${esc([s.kind,s.town,s.grades?"grades "+s.grades:"",s.enrollment].filter(Boolean).join(", "))}</div>${s.demo?`<div class="s">${esc(s.demo)}</div>`:""}${s.address?`<div class="s">${esc(s.address)}${s.phone?", "+esc(s.phone):""}</div>`:""}${(s.leaders||[]).length?`<div class="s" style="margin-top:6px;color:var(--ink)">${s.leaders.map(esc).join("<br>")}</div>`:""}${s.dates?`<div class="s" style="margin-top:6px"><b>Dates:</b> ${esc(s.dates)}</div>`:""}${s.notes?`<div class="s" style="margin-top:4px">${linkify(s.notes)}</div>`:""}<div class="s" style="margin-top:4px">${[s.calendar?`<a href="${esc(s.calendar)}" target="_blank" rel="noopener">Calendar</a>`:"",s.board?`<a href="${esc(s.board)}" target="_blank" rel="noopener">Site</a>`:"",s.source?`<a href="${esc(s.source)}" target="_blank" rel="noopener">Source</a>`:""].filter(Boolean).join(" · ")}</div></div>`).join("")}`;
  }
  return html;
}

/* ---------- Who's who ---------- */
function rOrg(){
  const q=S.orgQ.toLowerCase();const L=S.org.filter(p=>!q||[p.name,p.org,p.role,p.askFor,p.notes,(p.links||[]).map(l=>l.name).join(" ")].join(" ").toLowerCase().includes(q)).sort((a,b)=>(a.order??99)-(b.order??99)||(a.name||"").localeCompare(b.name||""));
  const g={};L.forEach(p=>(g[p.group||"LEAD"]=g[p.group||"LEAD"]||[]).push(p));
  return `<div class="toolrow"><input type="search" id="orgQ" placeholder="Search" value="${esc(S.orgQ)}"><span class="sp"></span><button class="btn sm pri" data-act="org-add">+ Person or group</button></div>
  <p class="muted small">Who's who inside LEAD and around it, who decides what, and what to go to each of them for. The outreach contacts live under People &amp; orgs.</p>
  ${Object.entries(g).map(([k,ps])=>`<h3 style="margin:16px 0 4px">${esc(k)}</h3><div class="rows">${ps.map(p=>`<div class="row" data-act="org-open" data-id="${p.id}"><div><div class="n">${esc(p.name)}${p.confirmed?"":` <span class="pill sand">unconfirmed</span>`}</div><div class="d">${esc(p.role||"")}${p.org?", "+esc(p.org):""}</div>${p.askFor?`<div class="d" style="color:var(--ink)">Go to them for: ${esc(p.askFor)}</div>`:""}${p.notes?`<div class="d">${esc(p.notes)}</div>`:""}${(p.links||[]).length?`<div class="d org-links">${p.links.map(l=>l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener" data-stoprow="1">${esc(l.name)}</a>`:esc(l.name)).join(" · ")}</div>`:""}</div><div class="r num wrap">${esc(p.phone||"")}${p.phone&&p.email?"<br>":""}${esc(p.email||"")}</div></div>`).join("")}</div>`).join("")||`<p class="empty">${S.loaded.org?"No one yet.":ld()}</p>`}`;
}

/* ---------- Meetings ---------- */
function rMeetings(){
  const L=[...S.meetings].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const lines=t=>(t||"").split("\n").map(x=>x.trim()).filter(Boolean);
  return `<div class="toolrow"><span class="muted small">What you heard in the room. Takeaways can go straight into the Playbook or the question list; next steps become dates.</span><span class="sp"></span><button class="btn sm pri" data-act="mtg-add">+ Meeting</button></div>
  ${L.map(m=>`<div class="mtg"><div class="n" data-act="mtg-open" data-id="${m.id}">${esc(m.title||"Meeting")}</div><div class="s">${fmtDate(m.date,true)}${m.time?" · "+esc(tmClock(m.time)):""}${m.with?", with "+esc(m.with):""}${m.where?", "+esc(m.where):""}</div>
    ${m.notes?`<div class="notes">${esc(m.notes)}</div>`:""}
    ${lines(m.takeaways).length?`<h4>Takeaways</h4><ul>${lines(m.takeaways).map((t,i)=>`<li><span>${esc(t)}</span><span class="acts">${S.canWrite===false?"":`<button class="btn sm ghost" data-act="mtg-pb" data-id="${m.id}" data-i="${i}">→ Playbook</button><button class="btn sm ghost" data-act="mtg-q" data-id="${m.id}" data-i="${i}">→ Question</button>`}</span></li>`).join("")}</ul>`:""}
    ${lines(m.next).length?`<h4>Next steps</h4><ul>${lines(m.next).map((t,i)=>`<li><span>${esc(t)}</span><span class="acts">${S.canWrite===false?"":`<button class="btn sm ghost" data-act="mtg-due" data-id="${m.id}" data-i="${i}">→ Task</button>`}</span></li>`).join("")}</ul>`:""}
  </div>`).join("")||`<p class="empty">${S.loaded.meetings?"No meetings logged yet.":ld()}</p>`}`;
}
function meetingForm(m){const isNew=!m;m=m||{};form({title:isNew?"New meeting":"Edit meeting",fields:[{key:"title",label:"What it was",required:true,wide:true},{key:"date",label:"Date",type:"date",default:todayISO()},{key:"with",label:"With"},{key:"where",label:"Where",wide:true},{key:"notes",label:"Notes",type:"textarea",rows:6,wide:true},{key:"takeaways",label:"Takeaways (one per line)",type:"textarea",rows:4,wide:true},{key:"next",label:"Next steps (one per line)",type:"textarea",rows:3,wide:true}],values:m,onSave:async v=>write("meetings",m.id||uid("m"),{...v,createdAt:m.createdAt||todayISO()}),onDelete:isNew?null:()=>remove("meetings",m.id)});}

/* ---------- Programs & videos ---------- */
function rPrograms(){
  const ses=[...S.sessions].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1),vids=[...S.videos].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  const ws=weekStart();const last4=addDays(ws,-21);const v4=vids.filter(v=>v.date>=last4).length;const recent=ses.slice(0,10);const avg=recent.length?Math.round(recent.reduce((a,x)=>a+(+x.participants||0),0)/recent.length):0;
  return `<p class="muted small">LEAD's own numbers from the meeting notes: at least 10 people in a class, at least one video a week. Log what actually happened so you can show it.</p>
  <div class="strip"><div class="${v4>=4?"okv":"warnv"}"><b class="num">${v4} of 4</b><span>weeks with a video, last 4 weeks</span></div><div class="${recent.length&&avg<10?"warnv":recent.length?"okv":""}"><b class="num">${recent.length?avg:"—"}</b><span>average people per class, last ${recent.length||"0"} classes</span></div><div><b class="num">${ses.filter(x=>(+x.participants||0)>=10).length} of ${ses.length}</b><span>classes that hit 10</span></div></div>
  <div class="two">
  <section class="sec"><div class="h"><h2>Classes and sessions</h2><button class="btn sm pri" data-act="ses-add">+ Class</button></div>
    <div class="rows">${ses.map(x=>`<div class="row" data-act="ses-open" data-id="${x.id}"><div><div class="n">${esc(x.program||"Class")}${x.topic?": "+esc(x.topic):""}</div><div class="d">${fmtDate(x.date)}${x.where?", "+esc(x.where):""}${x.notes?", "+esc(x.notes):""}</div></div><div class="r"><span class="pill ${(+x.participants||0)>=10?"green":"orange"}">${+x.participants||0} people</span></div></div>`).join("")||`<p class="empty">${S.loaded.sessions?"No classes logged.":ld()}</p>`}</div>
  </section>
  <section class="sec"><div class="h"><h2>Videos</h2><button class="btn sm pri" data-act="vid-add">+ Video</button></div>
    <div class="rows">${vids.map(x=>`<div class="row" data-act="vid-open" data-id="${x.id}"><div><div class="n">${esc(x.topic||"Video")}</div><div class="d">${fmtDate(x.date)}${x.where?", "+esc(x.where):""}${x.url?` <a href="${esc(x.url)}" target="_blank" rel="noopener">open</a>`:""}</div></div><div class="r"><span class="pill ${x.status==="posted"?"green":"grey"}">${esc(x.status||"posted")}</span></div></div>`).join("")||`<p class="empty">${S.loaded.videos?"No videos logged.":ld()}</p>`}</div>
  </section></div>`;
}
function sessionForm(x){const isNew=!x;x=x||{};form({title:isNew?"Log a class":"Edit class",fields:[{key:"date",label:"Date",type:"date",default:todayISO()},{key:"program",label:"Program",type:"select",options:PROGRAMS},{key:"topic",label:"Topic or session",wide:true},{key:"participants",label:"People who came",type:"number"},{key:"where",label:"Where",default:ME().place},{key:"notes",label:"Notes",type:"textarea",rows:2,wide:true}],values:x,onSave:async v=>write("sessions",x.id||uid("ss"),{...v,participants:Number(v.participants)||0}),onDelete:isNew?null:()=>remove("sessions",x.id)});}
function videoForm(x){const isNew=!x;x=x||{};form({title:isNew?"Log a video":"Edit video",fields:[{key:"date",label:"Date",type:"date",default:todayISO()},{key:"status",label:"Status",type:"select",options:["posted","scheduled","filming","idea"],default:"posted"},{key:"topic",label:"Topic",required:true,wide:true},{key:"where",label:"Posted where",placeholder:"Instagram, Facebook, TikTok"},{key:"url",label:"Link"}],values:x,onSave:async v=>write("videos",x.id||uid("v"),v),onDelete:isNew?null:()=>remove("videos",x.id)});}

/* ---------- Hours & invoices ---------- */
function rHours(){
  const st=S.settings||{};const ui=uninvoiced();const L=[...S.hours].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);const thr=st.invoicedThrough;
  return `<div class="strip"><div><b class="num">${ui.h}h</b><span>not invoiced yet${thr?", since "+fmtDate(thr):""}</span></div><div><b class="num">$${ui.amt}</b><span>at $${+st.rate||27}/hr</span></div><div><b class="num">#${st.nextInvoiceNo||1}</b><span>next invoice number</span></div></div>
  <div class="toolrow"><button class="btn sm pri" data-act="hrs-add">+ Hours</button><button class="btn sm" data-act="hrs-copy">Copy invoice lines</button><button class="btn sm" data-act="hrs-invoiced">Mark invoiced through today</button><button class="btn sm ghost" data-act="hrs-settings">Rate and numbering</button></div>
  <p class="muted small">Log every LEAD shift here so the invoice writes itself. Project line on the invoice: East Hartford Libertas Canvasser. Cadence and who receives it are still open questions.</p>
  <div class="tablewrap"><table><thead><tr><th>Date</th><th>Hours</th><th>What</th><th>Lane</th><th></th></tr></thead><tbody>
  ${L.map(h=>`<tr class="${thr&&h.date<=thr?"":""}"><td class="num">${fmtDate(h.date)}${thr&&h.date<=thr?` <span class="pill grey">invoiced</span>`:""}</td><td class="num"><b>${h.hours}</b></td><td>${esc(h.what||"")}</td><td class="s">${esc(h.lane||"")}</td><td><button class="btn sm ghost" data-act="hrs-open" data-id="${h.id}">Edit</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">${S.loaded.hours?"No hours logged yet.":ld()}</td></tr>`}
  </tbody></table></div>`;
}
function hoursForm(h){const isNew=!h;h=h||{};form({title:isNew?"Log hours":"Edit hours",fields:[{key:"date",label:"Date",type:"date",default:todayISO()},{key:"hours",label:"Hours",type:"number",placeholder:"6.4"},{key:"what",label:"What you did",wide:true},{key:"lane",label:"Lane",type:"select",options:["Libertas canvassing","B-LEAD","Charters & leaders","Center / admin","Events"]}],values:h,onSave:async v=>write("hours",h.id||uid("h"),{...v,hours:Number(v.hours)||0}),onDelete:isNew?null:()=>remove("hours",h.id)});}
function rateForm(){const st=S.settings||{};form({title:"Rate and numbering",fields:[{key:"rate",label:"Hourly rate ($)",type:"number",default:27},{key:"nextInvoiceNo",label:"Next invoice number",type:"number",default:1},{key:"invoicedThrough",label:"Invoiced through (date)",type:"date"}],values:st,onSave:async v=>write("meta","settings",{...st,rate:Number(v.rate)||27,nextInvoiceNo:Number(v.nextInvoiceNo)||1,invoicedThrough:v.invoicedThrough})});}
function invoiceText(){const st=S.settings||{};const ui=uninvoiced();const rows=[...ui.rows].sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);
  return `Invoice #${st.nextInvoiceNo||1} — ${ME().name}\nProject: East Hartford Libertas Canvasser (LEAD, via 50CAN)\nRate: $${+st.rate||27}/hr\n\n${rows.map(h=>`${h.date}  ${String(h.hours).padStart(5)} h  ${h.what||""}`).join("\n")}\n\nTotal hours: ${ui.h}\nAmount due: $${ui.amt}\n`;}

/* ---------- Log ---------- */
function rLog(){
  const days={};S.log.forEach(e=>(days[e.date||"undated"]=days[e.date||"undated"]||[]).push(e));const keys=Object.keys(days).sort().reverse();
  return `<div class="quick"><textarea id="quickText" placeholder="What happened, what you learned, what's blocking. One line is fine."></textarea><div class="side"><select id="quickTag">${LOG_TAGS.map(t=>`<option>${t}</option>`).join("")}</select><button class="btn pri" data-act="log-add" ${S.canWrite===false?"disabled":""}>Add</button></div></div>
  <p class="muted small">Daily notes. Anything that turns out to be "how it works" moves up into the Playbook; anything unclear becomes a question.</p>
  ${keys.map(k=>`<h3 style="margin:18px 0 2px">${k==="undated"?"Undated":fmtDate(k,true)}</h3>${days[k].sort((a,b)=>(a.createdAt||"")<(b.createdAt||"")?1:-1).map(e=>`<div class="lg" data-act="log-open" data-id="${e.id}"><div>${esc(e.text)}</div><div><span class="pill ${({learned:"green",blocker:"red",did:"blue",idea:"sand"})[e.tag]||"grey"}">${esc(e.tag||"note")}</span></div>${S.canWrite===false?"":`<div class="acts"><button class="btn sm ghost" data-act="log-pb" data-id="${e.id}">→ Playbook</button><button class="btn sm ghost" data-act="log-q" data-id="${e.id}">→ Question</button><button class="btn sm ghost" data-act="log-task" data-id="${e.id}">→ Task</button></div>`}</div>`).join("")}`).join("")||`<p class="empty">${S.loaded.log?"Nothing logged yet.":ld()}</p>`}`;
}

/* ---------- Settings ---------- */
function rSettings(){const st=S.settings||{};
  return `<section class="sec" style="margin-top:0"><div class="h"><h2>View</h2></div>${viewSelect("light")}<p class="small muted">A preview of the hub for each role. Same data in every view. Real logins and permissions come with the full build.</p></section>
  <section class="sec"><div class="h"><h2>Goal</h2></div><div class="rows"><div class="row" data-act="goal-edit"><div><div class="n">${st.sigGoal||500} signatures by ${st.goalDate?fmtDate(st.goalDate,true):"(no date)"}</div><div class="d">Walk-ups and online signatures counted by hand: ${st.manual||0}</div></div><div class="r">Edit</div></div></div></section>
  <section class="sec"><div class="h"><h2>Tools and files</h2></div><div class="rows"><div class="row" data-act="links-edit"><div><div class="n">${(st.links||[]).length} links</div><div class="d">${esc((st.links||[]).map(l=>l.name).join(", "))}</div></div><div class="r">Edit</div></div></div></section>
  <section class="sec"><div class="h"><h2>Map</h2></div><div class="rows"><div class="row" data-act="mapkey-edit"><div><div class="n">CARTO Basemaps key ${(st.mapKey?"(your own)":"(built in)")}</div><div class="d num">${esc(mapKey().slice(0,8))}…${esc(mapKey().slice(-4))} · removes the "API key required" mark from the street map in the downloaded file</div></div><div class="r">Edit</div></div></div></section>
  <section class="sec"><div class="h"><h2>Invoicing</h2></div><div class="rows"><div class="row" data-act="hrs-settings"><div><div class="n">$${+st.rate||27}/hr, next invoice #${st.nextInvoiceNo||1}</div><div class="d">${st.invoicedThrough?"Invoiced through "+fmtDate(st.invoicedThrough,true):"Nothing marked invoiced yet"}</div></div><div class="r">Edit</div></div></div></section>
  <section class="sec"><div class="h"><h2>Backup</h2></div><p class="muted small">${FB?"Everything is saved in the team database, so everyone sees the same thing. Download a backup now and then for safekeeping.":LOCAL?"Everything you enter is saved in this browser only. Download a backup now and then; restore it on another computer or after a browser reset.":"Everything you've entered lives in this hub. Copy a backup now and then, and paste it back here if you ever need to restore."}</p><div class="chips"><button class="btn" data-act="backup">${LOCAL?"Download backup":"Copy backup"}</button>${LOCAL?`<button class="btn" data-act="restore-file">Restore from a file</button>`:""}<button class="btn" data-act="restore">${LOCAL?"Paste a backup":"Restore from backup"}</button></div></section>
  <section class="sec"><div class="h"><h2>What's built in</h2></div><p class="muted small">${REF.TARGETS.length} people &amp; orgs and ${REF.EVENTS.length} events from the Champion Network research (Oct 5), ${REF.BOARD.invite.length+REF.BOARD.flyer.length} names from Kelly's Board of Champions spreadsheet, ${REF.SCHOOLS.length} schools, ${REF.MEETINGS.length} public bodies, the Oct 26 B-LEAD deep dive (${BL.meta.leads_new} new leads, ${BL.meta.leads_enriched} enriched, ${BL.meta.events} events and ${BL.meta.visits} visiting speakers), and the Script &amp; facts from the Champion Playbook, plus ${CV.signers.length} petition signers transcribed from the Libertas signature sheets (Nov 3 and Nov 5), plus ${LT.contacts.length} letter-of-support contacts for Libertas. Your statuses, notes, signatures, team log and how-tos are saved on top of that and survive updates to the page.</p></section>`;
}

/* ============ detail drawer ============ */
function closeOverlay(){$("#overlay").innerHTML="";}
function openSheet(title,inner,opts={}){$("#overlay").innerHTML=`<div class="modal" id="modal"><div class="sheet"><h2>${esc(title)}</h2>${inner}<div class="btns">${opts.btns||`<button class="btn ghost" data-close="1">Close</button>`}</div></div></div>`;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeOverlay();});document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));}
function openDetail(id,keep){
  const r=getRec(id);if(!r)return;const ev=isEvent(r);const o=$("#overlay");const scrollTop=keep&&o.querySelector(".drawer")?o.querySelector(".drawer").scrollTop:0;
  const prev={};if(keep){["detailForm","debriefForm"].forEach(fid=>{const f=document.getElementById(fid);if(f)new FormData(f).forEach((v,k)=>prev[fid+":"+k]=v);});const _ai=document.getElementById("aiText");if(_ai)prev["ai:text"]=_ai.value;}
  const mapsQ=encodeURIComponent([r.venue,r.address,(!r.address||!/\bCT\b/.test(r.address))?townOf(r)+" CT":""].filter(Boolean).join(", "));
  const kv=[];
  if(ev){kv.push(["When",[fmtDate(r.date,true),r.end_date&&r.end_date!==r.date?"to "+fmtDate(r.end_date,true):"",r.time,r.recurring?"(repeats)":""].filter(Boolean).join(" ")]);kv.push(["Where",[r.venue,r.address].filter(Boolean).join(", ")]);if(r.host)kv.push(["Host",r.host]);if(r.owner_type)kv.push(["Run by",r.owner_type]);kv.push(["Table",r.can_table===true?"Yes, orgs can table":r.can_table===false?"No table sign-up listed":"Not stated, ask"]);if(r.cost)kv.push(["Cost",r.cost]);}
  else{kv.push(["What",[r.subtype||r.type,laneOf(r)].filter(Boolean).join(", ")]);if(r.contact_name)kv.push(["Contact",r.contact_name+(r.role?", "+r.role:"")]);if(r.address)kv.push(["Address",r.address]);if(r.reach)kv.push(["Reach",r.reach]);}
  if(r.bl){const b=r.bl;kv.push(["Deep dive",`${blLanePill(b.lane)} ${blPriPill(b.pri)}${b.hold?' <span class="pill orange">hold until Nov 3</span>':""}${b.verify?' <span class="pill sand">verify</span>':""}`,true]);if(b.angle)kv.push(["LEAD angle",b.angle]);if(b.programs&&b.programs!==r.reach)kv.push(["Programs",b.programs]);if(b.charter&&b.charter!=="Unknown")kv.push(["Charter signal",b.charter+(b.evidence?" — "+b.evidence:"")]);if(b.reason)kv.push(["Priority why",b.reason]);if(b.guests)kv.push(["Guests",b.guests]);if(b.booking)kv.push(["Booking",`<a href="${esc(b.booking)}" target="_blank" rel="noopener">${esc(b.booking.replace(/^https?:\/\/(www\.)?/,"").slice(0,50))}</a>`,true]);if(b.note)kv.push(["Verify",b.note]);}
  if(r.visit){const v=r.visit;kv.push(["Who",v.person+(v.known_for?" — "+v.known_for:"")]);if(v.edu)kv.push(["Education",v.edu]);if(v.approach)kv.push(["How to reach",linkify(v.approach),true]);kv.push(["Fit",v.fit||""]);}
  if(r.bl26&&!r.visit){if(r.audience)kv.push(["Who shows up",r.audience]);if(r.contact)kv.push(["Organizer",linkify(r.contact),true]);if(r.thai)kv.push(["Heads up","Falls in the Nov 13–28 window"]);}
  if(r.phone)kv.push(["Phone",`<span class="num">${esc(r.phone)}</span> <button class="btn sm ghost" data-copy="${esc(r.phone)}">copy</button>`,true]);
  if(r.email)kv.push(["Email",`${esc(r.email)} <button class="btn sm ghost" data-copy="${esc(r.email)}">copy</button>`,true]);
  if(r.website)kv.push(["Site",`<a href="${esc(r.website)}" target="_blank" rel="noopener">${esc(r.website.replace(/^https?:\/\//,"").replace(/\/$/,""))}</a>`,true]);
  if(r.url&&ev)kv.push(["Link",`<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//,"").slice(0,60))}</a>`,true]);
  if(r.social)kv.push(["Social",r.social.split("|").map(s=>`<a href="${esc(s.trim())}" target="_blank" rel="noopener">${esc(s.trim().replace(/^https?:\/\/(www\.)?/,"").split("/")[0])}</a>`).join(" "),true]);
  if(r.why)kv.push(["Why",r.why]);
  if((r.community||[]).length)kv.push(["Community",r.community.join(", ")]);
  {const _ck=cuKeysFor(r);if(_ck.length)kv.push(["Culture guide",_ck.map(k=>cuBtn(k)).join(" "),true]);}
  if(r.source_url)kv.push(["Source",`<a href="${esc(r.source_url)}" target="_blank" rel="noopener">${esc(r.source_url.replace(/^https?:\/\/(www\.)?/,"").slice(0,50))}</a>`,true]);
  const html=`<div class="scrim" data-close="1"></div><div class="drawer" role="dialog" aria-label="${esc(r.name)}">
    <div class="top"><div><h2>${esc(r.name)}</h2><div class="small muted">${esc(townOf(r))}${r.priority?", "+r.priority+" priority":""}${S.added[id]?", added by you":""}</div></div><button class="x" data-close="1" aria-label="Close">×</button></div>
    <div class="kv">${kv.map(([k,v,h])=>`<div>${k}</div><div>${h?v:esc(v)}</div>`).join("")}</div>
    <div class="chips">${(r.address||r.venue)?`<a class="btn sm" href="https://www.google.com/maps/dir/?api=1&destination=${mapsQ}" target="_blank" rel="noopener">Directions</a>`:""}${S.added[id]?`<button class="btn sm" data-act="added-edit" data-id="${id}">Edit details</button><button class="btn sm danger" data-act="added-del" data-id="${id}">Delete</button>`:""}</div>
    <div class="edit"><h3>Status</h3>
      <div class="stpick">${STATUSES.map(s=>`<button data-st="${s}" aria-pressed="${r.status===s}"><i style="background:${SVAR[s]}"></i>${SLABEL[s]}</button>`).join("")}</div>
      ${ev?"":`<div class="yn"><span>Supports public charter schools?</span><span class="opts">${["Yes","Maybe","No"].map(v=>`<button data-yn="q_charter" data-v="${v}" aria-pressed="${r.q_charter===v}">${v}</button>`).join("")}</span></div>
      <div class="yn"><span>Supports families having options?</span><span class="opts">${["Yes","Maybe","No"].map(v=>`<button data-yn="q_options" data-v="${v}" aria-pressed="${r.q_options===v}">${v}</button>`).join("")}</span></div>`}
      ${ev?"":(()=>{const e=S.edits[id]||{};const gives=e.gives||[];return `<h3 style="margin-top:14px">Partnership</h3>
      <div class="fields" style="margin-top:6px"><div class="f"><label>Type</label><select data-pt="ptype">${PARTNER_TYPES.map(([v,l])=>`<option value="${v}" ${(e.ptype||"")===v?"selected":""}>${l}</option>`).join("")}</select></div><div class="f"><label>MOU</label><select data-pt="mou">${MOU.map(([v,l])=>`<option value="${v}" ${(e.mou||"")===v?"selected":""}>${l}</option>`).join("")}</select></div></div>
      <div class="small muted" style="margin-top:8px">Support goes both ways. What they give:</div>
      <div class="ck2">${GIVES.map(([v,l])=>`<label><input type="checkbox" data-give="${v}" ${gives.includes(v)?"checked":""}>${l}</label>`).join("")}</div>`;})()}
      ${ev?(()=>{const a=assessOf(r);const yn=(k)=>`<span class="opts">${["Yes","No"].map(v=>`<button data-as="${k}" data-v="${v}" aria-pressed="${a[k]===v}">${v}</button>`).join("")}</span>`;const pts=(k)=>`<span class="opts">${[0,1,2].map(v=>`<button data-as="${k}" data-v="${v}" aria-pressed="${String(a[k])===String(v)}">${v}</button>`).join("")}</span>`;
        return `<h3 style="margin-top:14px">Is it worth the time?</h3><div class="assess">
        <div class="q"><div>Would it commit LEAD before approval?<small>Hold: stops the review until someone signs off.</small></div>${yn("hold")}</div>
        <div class="q"><div>Is no one LEAD needs in the room?<small>Skip: write who is there so the reason is on record.</small></div>${yn("skip")}</div>
        <div class="q"><div>Political or candidate-hosted before Nov 3?<small>Warning only: go as an observer, keep LEAD neutral.</small></div>${yn("warn")}</div>
        ${ASSESS_Q.map(([k,l,h],i)=>`<div class="q"><div>${i+1}. ${l}<small>${h}</small></div>${pts(k)}</div>`).join("")}
        <div class="fields" style="margin-top:8px"><div class="f wide"><label>Who's there</label><input data-asf="who" value="${esc(a.who||"")}" placeholder="Families, small business owners, pastors…"></div><div class="f wide"><label>Reason (required for a Skip)</label><input data-asf="reason" value="${esc(a.reason||"")}"></div></div>
        <div class="verdict ${a.cls}"><div class="big">${a.decision||a.score+"/10"}</div><div>${a.decision?a.label+(a.answered===5?", "+a.score+" of 10":""):(5-a.answered)+" question"+(5-a.answered===1?"":"s")+" left"}. A guide, not the answer.</div></div>
        <div class="ai"><div class="chips"><button class="btn sm pri" data-act="ai-assess" id="aiBtn">${LOCAL?"Copy prompt for Claude":"Write it up with AI"}</button><button class="btn sm" data-act="copy-ai">Copy write-up</button><button class="btn sm ghost" data-act="copy-assess">Copy the scored version</button><button class="btn sm ghost" data-act="copy-table">Table request email</button></div>
        <div class="busy hide" id="aiBusy">Thinking…</div>
        <textarea id="aiText" placeholder="${LOCAL?"Paste Claude's write-up here, or write your own. Saved with the event.":"The write-up lands here. Edit it, then copy. Saved with the event."}">${esc(a.ai||"")}</textarea></div></div>
        ${(()=>{const d=debriefOf(r)||{};const went=!!(S.edits[id]&&S.edits[id].went);return `<h3 style="margin-top:18px">After the event</h3>
        <p class="small muted" style="margin:0 0 6px">What Kelly asked for: who you actually connected with, what conversations you had about LEAD, what you accomplished, and relationships to follow up on.</p>
        <div class="ck2"><label><input type="checkbox" data-went="1" ${went?"checked":""}>I went to this</label></div>
        <form class="fields" id="debriefForm" style="margin-top:8px">
          <div class="f wide"><label>Who I connected with (one per line: name, org, what they do)</label><textarea name="connected">${esc(d.connected||"")}</textarea>
            <div class="picker"><input id="pickPerson" placeholder="Add someone from People &amp; orgs…" autocomplete="off" style="margin-top:6px"><div class="pl hide" id="pickList"></div></div></div>
          <div class="f wide"><label>Conversations about LEAD</label><textarea name="conversations">${esc(d.conversations||"")}</textarea></div>
          <div class="f wide"><label>What I accomplished</label><textarea name="accomplished" placeholder="Signatures are added automatically from the counter below.">${esc(d.accomplished||"")}</textarea></div>
          <div class="f wide"><label>Relationships to follow up on (one per line: who, and the next step)</label><textarea name="followups">${esc(d.followups||"")}</textarea></div>
          <div class="f wide" style="flex-direction:row;gap:8px;flex-wrap:wrap"><button class="btn pri" type="submit" ${S.canWrite===false?"disabled":""}>Save notes</button><button class="btn" type="button" data-act="copy-report">Copy this event's report</button><button class="btn" type="button" data-act="report-sheet-from">Report with other events</button></div>
        </form>`;})()}`;})():`<div class="chips" style="margin-top:12px"><button class="btn sm" data-act="copy-intro">Copy intro email</button></div>`}
      <h3 style="margin-top:14px">Signatures from here</h3>
      <div class="sig"><button data-sig="-1">−</button><span class="v num">${r.signatures}</span><button data-sig="1">+</button><button data-sig="5" style="width:auto;padding:0 10px">+5</button><button data-sig="10" style="width:auto;padding:0 10px">+10</button></div>
      <form class="fields" id="detailForm">
        <div class="f"><label>Next step</label><input name="next_step" value="${esc(r.next_step)}"></div>
        <div class="f"><label>By when</label><input type="date" name="next_date" value="${esc(r.next_date)}"></div>
        <div class="f"><label>Last touch</label><input type="date" name="last_contact" value="${esc(r.last_contact)}"></div>
        <div class="f"><label>Owner</label><input name="owner" value="${esc(r.owner)}" placeholder="me, a canvasser, Kelly"></div>
        <div class="f wide"><label>Notes</label><textarea name="notes">${esc(r.notes)}</textarea></div>
        <div class="f wide" style="flex-direction:row;gap:8px;flex-wrap:wrap"><button class="btn pri" type="submit" ${S.canWrite===false?"disabled":""}>Save</button><button class="btn" type="button" data-act="touch">Touched today</button></div>
      </form>
    </div></div>`;
  o.innerHTML=html;const dr=o.querySelector(".drawer");if(scrollTop)dr.scrollTop=scrollTop;
  if(keep){Object.entries(prev).forEach(([key,v])=>{if(key==="ai:text"){const el=document.getElementById("aiText");if(el&&el.value!==v)el.value=v;return;}const [fid,k]=key.split(":");const f=document.getElementById(fid);const el=f&&f.elements[k];if(el&&el.value!==v)el.value=v;});}
  o.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  o.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>copyText(b.dataset.copy)));
  o.querySelectorAll("[data-st]").forEach(b=>b.addEventListener("click",()=>saveEdit(id,{status:b.dataset.st,last_contact:(b.dataset.st!=="Prospect"&&!r.last_contact)?todayISO():r.last_contact})));
  o.querySelectorAll("[data-yn]").forEach(b=>b.addEventListener("click",()=>saveEdit(id,{[b.dataset.yn]:r[b.dataset.yn]===b.dataset.v?"":b.dataset.v})));
  o.querySelectorAll("[data-sig]").forEach(b=>b.addEventListener("click",()=>saveEdit(id,{signatures:Math.max(0,r.signatures+Number(b.dataset.sig))})));
  o.querySelectorAll("[data-pt]").forEach(el=>el.addEventListener("change",()=>saveEdit(id,{[el.dataset.pt]:el.value})));
  o.querySelectorAll("[data-give]").forEach(el=>el.addEventListener("change",()=>{const cur=(S.edits[id]||{}).gives||[];const next=el.checked?[...new Set(cur.concat(el.dataset.give))]:cur.filter(x=>x!==el.dataset.give);saveEdit(id,{gives:next});}));
  o.querySelectorAll("[data-as]").forEach(b=>b.addEventListener("click",()=>{const a={...((S.edits[id]||{}).assess||{})};const k=b.dataset.as,v=b.dataset.v;a[k]=String(a[k])===String(v)?"":(k.startsWith("q")?Number(v):v);saveEdit(id,{assess:a});}));
  o.querySelectorAll("[data-asf]").forEach(el=>el.addEventListener("change",()=>{const a={...((S.edits[id]||{}).assess||{})};a[el.dataset.asf]=el.value.trim();saveEdit(id,{assess:a});}));
  const ca=o.querySelector("[data-act=copy-assess]");if(ca)ca.addEventListener("click",()=>copyText(assessText(r),"Assessment copied"));
  const ab=o.querySelector("[data-act=ai-assess]");if(ab)ab.addEventListener("click",()=>aiAssess(r));
  const cai=o.querySelector("[data-act=copy-ai]");if(cai)cai.addEventListener("click",()=>{const t=$("#aiText").value.trim();if(!t){toast("Nothing written yet");return;}copyText(t,"Write-up copied");});
  const at=$("#aiText");if(at)at.addEventListener("change",()=>{const a={...((S.edits[id]||{}).assess||{})};a.ai=at.value.trim();saveEdit(id,{assess:a});});
  const df=$("#debriefForm");if(df){
    const readDF=()=>{const fd=new FormData(df);const d={...(debriefOf(r)||{})};["connected","conversations","accomplished","followups"].forEach(k=>d[k]=(fd.get(k)||"").toString().trim());d.updatedAt=todayISO();return d;};
    df.addEventListener("submit",async e=>{e.preventDefault();if(await saveEdit(id,{debrief:readDF(),went:true}))toast("Notes saved");});
    o.querySelector("[data-went]").addEventListener("change",e=>saveEdit(id,{went:e.target.checked}));
    o.querySelector("[data-act=copy-report]").addEventListener("click",async()=>{await saveEdit(id,{debrief:readDF(),went:true});copyText(reportText([id]),"Report copied. Paste into Gmail.");});
    o.querySelector("[data-act=report-sheet-from]").addEventListener("click",async()=>{await saveEdit(id,{debrief:readDF(),went:true});reportSheet([id]);});
    const pk=$("#pickPerson"),pl=$("#pickList");pk.addEventListener("input",()=>{const q=pk.value.trim().toLowerCase();if(!q){pl.classList.add("hide");return;}const hits=allT().filter(t=>[t.name,t.contact_name,t.subtype].join(" ").toLowerCase().includes(q)).slice(0,8);pl.innerHTML=hits.map(t=>`<button type="button" data-pid="${t.id}">${esc(t.contact_name?t.contact_name+", "+t.name:t.name)}<span class="muted"> ${esc(t.role||t.subtype||"")}</span></button>`).join("")||`<button type="button" disabled>No match</button>`;pl.classList.remove("hide");
      pl.querySelectorAll("[data-pid]").forEach(b=>b.addEventListener("click",()=>{const t=allT().find(x=>x.id===b.dataset.pid);const line=[t.contact_name||t.name,t.contact_name?t.name:"",t.role||t.subtype||""].filter(Boolean).join(", ");const ta=df.elements.connected;ta.value=(ta.value.trim()?ta.value.trim()+"\n":"")+line;pk.value="";pl.classList.add("hide");const d={...(debriefOf(r)||{})};d.links=[...new Set((d.links||[]).concat(t.id))];saveEdit(id,{debrief:{...d,...Object.fromEntries(["connected","conversations","accomplished","followups"].map(k=>[k,(df.elements[k].value||"").trim()]))}});}));});
  }
  const ct=o.querySelector("[data-act=copy-table]");if(ct)ct.addEventListener("click",()=>copyText(tableEmail(r),"Email copied. Paste into Gmail."));
  const ci=o.querySelector("[data-act=copy-intro]");if(ci)ci.addEventListener("click",()=>copyText(introEmail(r),"Email copied. Paste into Gmail."));
  $("#detailForm").addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(e.target);const p={};["next_step","next_date","last_contact","owner","notes"].forEach(k=>p[k]=(fd.get(k)||"").toString().trim());if(await saveEdit(id,p))toast("Saved");});
  o.querySelector("[data-act=touch]").addEventListener("click",()=>saveEdit(id,{last_contact:todayISO(),status:r.status==="Prospect"?"Contacted":r.status}).then(ok=>ok&&toast("Logged a touch today")));
  const ae=o.querySelector("[data-act=added-edit]");if(ae)ae.addEventListener("click",()=>addForm(ev?"event":"target",S.added[id]));
  const ad=o.querySelector("[data-act=added-del]");if(ad){let armed=false;ad.addEventListener("click",async()=>{if(!armed){armed=true;ad.textContent="Tap again to delete";return;}await remove("added",id);await remove("edits",id);closeOverlay();});}
}

/* ============ forms ============ */
function form({title,fields,values={},onSave,onDelete,extra=""}){
  const inner=`<form id="sheetForm"><div class="fields">${fields.map(f=>{const v=values[f.key]??f.default??"";const lab=`<label for="f-${f.key}">${esc(f.label)}</label>`;const cls=`class="f ${f.wide?"wide":""}"`;
    if(f.type==="select")return `<div ${cls}>${lab}<select id="f-${f.key}" name="${f.key}">${f.options.map(o=>{const [val,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}" ${String(v)===String(val)?"selected":""}>${esc(l)}</option>`;}).join("")}</select></div>`;
    if(f.type==="textarea")return `<div ${cls}>${lab}<textarea id="f-${f.key}" name="${f.key}" ${f.rows?`style="min-height:${f.rows*22}px"`:""}>${esc(v)}</textarea></div>`;
    return `<div ${cls}>${lab}<input id="f-${f.key}" name="${f.key}" type="${f.type||"text"}" value="${esc(v)}" ${f.required?"required":""} ${f.placeholder?`placeholder="${esc(f.placeholder)}"`:""}></div>`;}).join("")}</div>${extra}
    <div class="btns"><button class="btn pri" type="submit" ${S.canWrite===false?"disabled":""}>Save</button><button class="btn ghost" type="button" data-close="1">Cancel</button>${onDelete?`<span style="flex:1"></span><button class="btn danger" type="button" id="delBtn">Delete</button>`:""}</div></form>`;
  openSheet(title,inner,{btns:""});
  const fm=$("#sheetForm");fm.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(fm);const out={};fields.forEach(f=>out[f.key]=(fd.get(f.key)??"").toString().trim());const ok=await onSave(out);if(ok!==false)closeOverlay();});
  if(onDelete){let armed=false;$("#delBtn").addEventListener("click",async()=>{if(!armed){armed=true;$("#delBtn").textContent="Tap again to delete";return;}const ok=await onDelete();if(ok!==false)closeOverlay();});}
  fm.querySelector("input,select,textarea")?.focus();
}
function addForm(kind,rec){const isNew=!rec;rec=rec||{};const towns=Object.keys(REF.CENTROIDS);
  if(kind==="event")form({title:isNew?"New event":"Edit event",fields:[{key:"name",label:"Event",required:true,wide:true},{key:"date",label:"Date",type:"date"},{key:"time",label:"Time",placeholder:"6:00 PM – 8:00 PM"},{key:"venue",label:"Venue"},{key:"town",label:"Town",type:"select",options:towns.concat(["Statewide"])},{key:"address",label:"Address",wide:true},{key:"host",label:"Host"},{key:"event_type",label:"Kind",placeholder:"Fair, Service, Meeting…"},{key:"can_table",label:"Can we table?",type:"select",options:[["","Not stated"],["yes","Yes"],["no","No"]]},{key:"url",label:"Link"},{key:"why",label:"Why it matters",type:"textarea",rows:2,wide:true},{key:"community",label:"Community (comma separated)",wide:true}],
    values:{...rec,can_table:rec.can_table===true?"yes":rec.can_table===false?"no":"",community:(rec.community||[]).join(", ")},
    onSave:async v=>{const id=rec.id||uid("e");return write("added",id,{kind:"event",name:v.name,date:v.date,time:v.time,venue:v.venue,town:v.town,address:v.address,host:v.host,event_type:v.event_type,can_table:v.can_table==="yes"?true:v.can_table==="no"?false:null,url:v.url,why:v.why,community:v.community?v.community.split(",").map(s=>s.trim()).filter(Boolean):[],priority:rec.priority||"Medium",createdAt:rec.createdAt||todayISO()});},onDelete:isNew?null:async()=>{await remove("added",rec.id);await remove("edits",rec.id);closeOverlay();}});
  else form({title:isNew?"New person or org":"Edit details",fields:[{key:"name",label:"Name",required:true,wide:true},{key:"type",label:"Type",type:"select",options:["Organization","Business","Church","Elected Official","Education Leader","Community Leader","School","Media","Program","Venue"]},{key:"subtype",label:"What kind",placeholder:"Pastor, NRZ, bakery…"},{key:"lane",label:"Lane",type:"select",options:["B-LEAD","Charters & leaders"]},{key:"priority",label:"Priority",type:"select",options:["High","Medium","Low"],default:"Medium"},{key:"contact_name",label:"Contact name"},{key:"role",label:"Their role"},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"town",label:"Town",type:"select",options:towns.concat(["Statewide"])},{key:"address",label:"Address"},{key:"website",label:"Website",wide:true},{key:"why",label:"Why they matter",type:"textarea",rows:2,wide:true},{key:"community",label:"Community (comma separated)",wide:true}],
    values:{...rec,community:(rec.community||[]).join(", ")},
    onSave:async v=>{const id=rec.id||uid("t");return write("added",id,{kind:"target",...v,community:v.community?v.community.split(",").map(s=>s.trim()).filter(Boolean):["General"],createdAt:rec.createdAt||todayISO()});},onDelete:isNew?null:async()=>{await remove("added",rec.id);await remove("edits",rec.id);closeOverlay();}});
}
function teamForm(c){const isNew=!c;c=c||{};form({title:isNew?"New canvasser":"Edit canvasser",fields:[{key:"name",label:"Name",required:true,wide:true},{key:"phone",label:"Phone"},{key:"area",label:"Area they cover"}],values:c,onSave:async v=>write("team",c.id||uid("c"),{...teamRest(c),name:v.name,phone:v.phone,area:v.area}),onDelete:isNew?null:()=>remove("team",c.id)});}
function boardForm(m){const isNew=!m;m=m||{};form({title:isNew?"Name for the Board of Champions":"Edit",fields:[{key:"name",label:"Name",required:true,wide:true},{key:"title",label:"Title and organization",wide:true},{key:"category",label:"Category",type:"select",options:["Faith leader","Non-profit leader","Organization leader","Board of Education","Instructor","School or district","Business","Other"]},{key:"onSheet",label:"On Kelly's sheet?",type:"select",options:[["","Not yet"],["1","Yes"]]},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"note",label:"Why them",type:"textarea",rows:2,wide:true}],values:{...m,onSheet:m.onSheet?"1":""},onSave:async v=>write("board",m.id||uid("b"),{...v,onSheet:!!v.onSheet,createdAt:m.createdAt||todayISO()}),onDelete:isNew?null:()=>remove("board",m.id)});}
function pbForm(p){const isNew=!p;p=p||{};form({title:isNew?"New how-to":"Edit how-to",fields:[{key:"title",label:"What it covers",required:true,wide:true},{key:"status",label:"Status",type:"select",options:Object.entries(PB_STATUS).map(([k,v])=>[k,v[0]]),default:"guess"},{key:"lane",label:"Lane",type:"select",options:LANES},{key:"body",label:"How it works (steps, rules, what's still unknown)",type:"textarea",rows:7,wide:true},{key:"source",label:"Where this came from",placeholder:"Kelly, HR form, my own rule"},{key:"order",label:"Order (lower = higher)",type:"number",default:50}],values:p,onSave:async v=>write("playbook",p.id||uid("p"),{title:v.title,status:v.status,lane:v.lane,body:v.body,source:v.source,order:Number(v.order)||50,updatedAt:todayISO(),createdAt:p.createdAt||todayISO()}),onDelete:isNew?null:()=>remove("playbook",p.id)});}
function qForm(q,pre){const isNew=!q;q=q||pre||{};form({title:isNew?"New question":"Question",fields:[{key:"q",label:"What you don't know",required:true,type:"textarea",rows:3,wide:true},{key:"askWho",label:"Who to ask",default:"Kelly"},{key:"lane",label:"Lane",type:"select",options:LANES},{key:"answer",label:"Answer (fill in when you get it)",type:"textarea",rows:4,wide:true},{key:"status",label:"Status",type:"select",options:[["open","Open"],["answered","Answered"]],default:"open"}],values:q,extra:(!isNew&&q.answer)?`<p class="small muted">Once it's answered, add it to the Playbook with + How-to.</p>`:"",onSave:async v=>{const status=v.answer&&v.status==="open"?"answered":v.status;return write("questions",q.id||uid("q"),{q:v.q,askWho:v.askWho,lane:v.lane,answer:v.answer,status,createdAt:q.createdAt||todayISO(),answeredAt:status==="answered"?(q.answeredAt||todayISO()):""});},onDelete:isNew?null:()=>remove("questions",q.id)});}
function orgForm(p){const isNew=!p;p=p||{};form({title:isNew?"New person or group":"Edit",fields:[{key:"name",label:"Name",required:true,wide:true},{key:"role",label:"Role or title"},{key:"org",label:"Organization"},{key:"group",label:"Group",type:"select",options:["LEAD","50CAN network","Libertas","Board of Champions","Other"]},{key:"confirmed",label:"Role confirmed?",type:"select",options:[["1","Yes"],["","Not yet"]]},{key:"askFor",label:"Go to them for",type:"textarea",rows:2,wide:true},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"notes",label:"Notes",type:"textarea",rows:3,wide:true},{key:"linksText",label:"Links (one per line: name | link)",type:"textarea",rows:3,wide:true},{key:"order",label:"Order",type:"number",default:50}],values:{...p,confirmed:p.confirmed?"1":"",linksText:(p.links||[]).map(l=>l.name+" | "+(l.url||"")).join("\n")},onSave:async v=>write("people",p.id||uid("o"),{name:v.name,role:v.role,org:v.org,group:v.group,confirmed:!!v.confirmed,askFor:v.askFor,phone:v.phone,email:v.email,notes:v.notes,links:(v.linksText||"").split("\n").map(x=>x.trim()).filter(Boolean).map(x=>{const i=x.lastIndexOf("|");return i>-1?{name:x.slice(0,i).trim()||x.slice(i+1).trim(),url:x.slice(i+1).trim()}:(/^https?:\/\//.test(x)?{name:x,url:x}:{name:x,url:""});}),order:Number(v.order)||50}),onDelete:isNew?null:()=>remove("people",p.id)});}
function dueForm(d){const isNew=!d||!d.id;d=d||{};form({title:isNew?"New date":"Edit date",fields:[{key:"title",label:"What",required:true,wide:true},{key:"repeat",label:"Repeats",type:"select",options:[["","One time"],["weekly","Every week"]]},{key:"dow",label:"Day of week (if weekly)",type:"select",options:DOW.map((n,i)=>[String(i),n]),default:"4"},{key:"date",label:"Date (if one time)",type:"date"},{key:"fixed",label:"Fixed date (meeting, deadline)?",type:"select",options:[["","No"],["1","Yes"]]},{key:"note",label:"Note",wide:true}],values:{...d,fixed:d.fixed?"1":"",dow:String(d.dow??4)},onSave:async v=>write("due",d.id||uid("d"),{title:v.title,repeat:v.repeat,dow:Number(v.dow),date:v.date,fixed:!!v.fixed,note:v.note,done:!!d.done,doneOn:d.doneOn||""}),onDelete:isNew?null:()=>remove("due",d.id)});}
function logForm(e){form({title:"Edit note",fields:[{key:"text",label:"Note",type:"textarea",rows:4,required:true,wide:true},{key:"tag",label:"Tag",type:"select",options:LOG_TAGS},{key:"date",label:"Date",type:"date"}],values:e,onSave:async v=>write("log",e.id,{...e,text:v.text,tag:v.tag,date:v.date}),onDelete:()=>remove("log",e.id)});}
function linksForm(){const st=S.settings||{};const links=st.links||[];const slots=Array.from({length:12},(_,i)=>links[i]||{name:"",url:"",note:""});
  form({title:"Tools and files",fields:slots.flatMap((l,i)=>[{key:"n"+i,label:"Name "+(i+1)},{key:"u"+i,label:"Link",placeholder:"https://"}]),values:Object.fromEntries(slots.flatMap((l,i)=>[["n"+i,l.name],["u"+i,l.url]])),extra:`<p class="small muted">A file on your computer has no link. Keep the name and leave the link blank so it's still listed.</p>`,
    onSave:async v=>{const out=[];for(let i=0;i<12;i++){if(v["n"+i])out.push({name:v["n"+i],url:v["u"+i],note:(links[i]&&links[i].name===v["n"+i])?links[i].note||"":""});}return write("meta","settings",{...st,links:out});}});}
function goalForm(){const st=S.settings||{};form({title:"Goal and hand-counted signatures",fields:[{key:"sigGoal",label:"Goal",type:"number",default:500},{key:"goalDate",label:"Goal date",type:"date"},{key:"manual",label:"Walk-ups / online (counted by hand)",type:"number",default:0}],values:st,onSave:async v=>write("meta","settings",{...st,sigGoal:Number(v.sigGoal)||500,goalDate:v.goalDate,manual:Number(v.manual)||0})});}

/* ============ actions ============ */
function dailyReport(){const t0=todayISO(),Lg=S.shifts,td=Lg.filter(e=>e.date===t0),tot=Lg.reduce((a,e)=>a+(+e.sigs||0),0),all=sigTotals().all,goal=(S.settings||{}).sigGoal||500;const per={};Lg.forEach(e=>{per[e.who]=(per[e.who]||0)+(+e.sigs||0);});
  return `Libertas petition — daily report ${fmtLong(t0)}\n\nToday: ${td.reduce((a,e)=>a+(+e.sigs||0),0)} signatures across ${td.length} shift${td.length===1?"":"s"}\n${td.map(e=>`• ${e.who} — ${e.where||"(location not noted)"}: ${e.sigs||0} sigs, ${e.out||0} sheets out / ${e.back||0} back${e.notes?" — "+e.notes:""}`).join("\n")}\n\nTo date: ${all} of ${goal} signatures (${tot} from canvasser shifts)\nBy canvasser: ${Object.entries(per).map(([k,v])=>`${k} ${v}`).join(", ")||"—"}\nSheets still out: ${Lg.reduce((a,e)=>a+(+e.out||0)-(+e.back||0),0)}\n\nNext: `;}
function csvCell(v){v=v==null?"":String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function peopleCSV(){const cols=["name","type","subtype","community","town","address","contact_name","role","phone","email","website","priority","status","signatures","q_charter","q_options","next_step","next_date","last_contact","owner","notes","why"];return [cols.join(",")].concat(peopleList().map(t=>cols.map(c=>csvCell(Array.isArray(t[c])?t[c].join("; "):t[c])).join(","))).join("\n");}
function backupJSON(){return JSON.stringify({v:3,at:new Date().toISOString(),edits:S.edits,added:S.added,geo:S.geo,tasks:S.tasks,team:S.team,shifts:S.shifts,playbook:S.playbook,questions:S.questions,people:S.org,due:S.due,log:S.log,board:S.board,meetings:S.meetings,sessions:S.sessions,videos:S.videos,hours:S.hours,proposals:S.proposals,ready:S.ready,signers:S.signers,cv:S.cvdocs,letters:S.letters,settings:S.settings},null,1);}
async function restoreFrom(txt){let o;try{o=JSON.parse(txt);}catch(e){toast("That isn't a backup. Paste the whole text.");return;}
  const jobs=[];const yn=v=>{v=String(v||"").toLowerCase();return v.startsWith("y")?"Yes":v.startsWith("n")?"No":v.startsWith("m")?"Maybe":"";};
  const isCN=Array.isArray(o.added)||("geocache" in o)||(Array.isArray(o.log)&&o.log[0]&&"who" in o.log[0]);
  if(isCN){
    Object.entries(o.edits||{}).forEach(([id,d])=>{const cur=S.edits[id]||{};jobs.push(write("edits",id,{...cur,...d,q_charter:yn(d.q_charter||d.yn1||cur.q_charter),q_options:yn(d.q_options||d.yn2||cur.q_options)}));});
    (o.added||[]).forEach(a=>{const {id,...rest}=a;if(!id)return;if(!rest.kind)rest.kind=(rest.date&&!rest.type)?"event":"target";jobs.push(write("added",id,rest));});
    (o.team||[]).forEach((c,i)=>{if(c&&c.name)jobs.push(write("team",c.id||("c"+i),{name:c.name,phone:c.phone||"",area:c.area||""}));});
    (o.log||[]).forEach(e=>{const {id,...rest}=e;if(rest.who)jobs.push(write("shifts",id||uid("s"),rest));});
    const gc=o.geocache||{};if(Object.keys(gc).length){allT().concat(allE()).forEach(x=>{const g=gc[x.address||""];if(g&&g.lat&&!(x.lat&&x.lng))jobs.push(write("geo",x.id,{lat:+g.lat,lng:+(g.lng||g.lon),q:x.address}));});}
    if(o.manual!=null)jobs.push(write("meta","settings",{...(S.settings||{}),manual:+o.manual||0}));
  } else {
    const lists={tasks:"tasks",team:"team",shifts:"shifts",playbook:"playbook",questions:"questions",people:"people",due:"due",log:"log",board:"board",meetings:"meetings",sessions:"sessions",videos:"videos",hours:"hours",proposals:"proposals",ready:"ready",signers:"signers",cv:"cv",letters:"letters"};
    for(const [k,col] of Object.entries(lists)){(o[k]||[]).forEach(d=>{const {id,...rest}=d;if(id)jobs.push(write(col,id,rest));});}
    Object.entries(o.edits||{}).forEach(([id,d])=>jobs.push(write("edits",id,d)));
    Object.entries(o.added||{}).forEach(([id,d])=>{const {id:_i,...rest}=d;jobs.push(write("added",id,rest));});
    Object.entries(o.geo||{}).forEach(([id,d])=>jobs.push(write("geo",id,d)));
    if(o.settings)jobs.push(write("meta","settings",o.settings));
  }
  if(!jobs.length){toast("Nothing to restore in that text.");return;}
  await Promise.all(jobs);toast("Restored "+jobs.length+" records"+(isCN?" from the Champion Network backup":""));}

function bind(v){
  cuBindAll(v);
  v.querySelectorAll("[data-open]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("[data-act]")||e.target.closest("[data-stop]"))return;openDetail(el.dataset.open);}));
  v.querySelectorAll("[data-go2]").forEach(el=>el.addEventListener("click",()=>go(el.dataset.go2)));
  v.querySelectorAll("[data-tv]").forEach(el=>el.addEventListener("click",()=>{S.tv=el.dataset.tv;render();}));
  v.querySelectorAll("[data-cal]").forEach(el=>el.addEventListener("click",()=>{S.calMonth=el.dataset.cal;render();}));
  const ts=v.querySelector("[data-tsec]");if(ts)ts.addEventListener("change",()=>{S.tSec=ts.value;render();});
  const cap=$("#capture");if(cap)cap.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(cap);const raw=(fd.get("t")||"").toString().trim();if(!raw)return;const {title,due}=parseCapture(raw);const ok=await write("tasks",uid("tk"),{title,section:fd.get("sec"),status:"todo",due,priority:"Medium",repeat:"",dow:4,waitingOn:"",linkText:"",subtasks:[],notes:"",doneOn:"",createdAt:todayISO(),doneAt:""});if(ok){cap.elements.t.value="";toast("Added");}});
  v.querySelectorAll(".tcard").forEach(c=>{c.addEventListener("dragstart",e=>{c.classList.add("dragging");e.dataTransfer.setData("text/plain",c.dataset.tid);});c.addEventListener("dragend",()=>c.classList.remove("dragging"));});
  v.querySelectorAll(".col").forEach(col=>{col.addEventListener("dragover",e=>{e.preventDefault();col.classList.add("over");});col.addEventListener("dragleave",()=>col.classList.remove("over"));col.addEventListener("drop",async e=>{e.preventDefault();col.classList.remove("over");const id=e.dataTransfer.getData("text/plain");const t=S.tasks.find(x=>x.id===id);if(t&&t.status!==col.dataset.col)await write("tasks",id,{...t,status:col.dataset.col,doneAt:col.dataset.col==="done"?todayISO():""});});});
  v.querySelectorAll("[data-pf]").forEach(el=>{const k=el.dataset.pf;if(el.tagName==="SELECT")el.addEventListener("change",()=>{S.pf[k]=el.value;render();});else el.addEventListener("click",()=>{S.pf[k]=el.dataset.v;render();});});
  v.querySelectorAll("[data-ef]").forEach(el=>{const k=el.dataset.ef;if(el.tagName==="SELECT")el.addEventListener("change",()=>{S.ef[k]=el.value;render();});else el.addEventListener("click",()=>{S.ef[k]=k==="past"?!!el.dataset.v:el.dataset.v;render();});});
  v.querySelectorAll("[data-mf]").forEach(el=>el.addEventListener("change",()=>{S.mf[el.dataset.mf]=el.value;render();}));
  v.querySelectorAll("[data-sort]").forEach(el=>el.addEventListener("click",()=>{const k=el.dataset.sort;if(S.ps.key===k)S.ps.dir*=-1;else{S.ps.key=k;S.ps.dir=1;}render();}));
  v.querySelectorAll(".schem .town").forEach(el=>el.addEventListener("click",()=>{S.mf.town=S.mf.town===el.dataset.town?"":el.dataset.town;render();}));
  if($("#lmap"))initLeaflet();
  const sf=$("#shiftForm");if(sf)sf.addEventListener("submit",async e=>{e.preventDefault();const fd=new FormData(sf);if(!fd.get("who")){toast("Add a canvasser first");return;}const ok=await write("shifts",uid("s"),{date:fd.get("date")||todayISO(),who:fd.get("who"),where:(fd.get("where")||"").toString().trim(),out:+fd.get("out")||0,back:+fd.get("back")||0,sigs:+fd.get("sigs")||0,hrs:+fd.get("hrs")||0,notes:(fd.get("notes")||"").toString().trim()});if(ok)toast("Logged");});
  const oq=$("#orgQ");if(oq)oq.addEventListener("input",()=>{S.orgQ=oq.value;const p=oq.selectionStart;render();const n=$("#orgQ");n.focus();n.setSelectionRange(p,p);});
  v.querySelectorAll("[data-act]").forEach(el=>{const a=el.dataset.act,id=el.dataset.id;const H={
    "manual":goalForm,"mapkey-edit":mapKeyForm,"goal-edit":goalForm,"links-edit":linksForm,
    "task-add":()=>taskForm(),"task-edit":()=>taskForm(S.tasks.find(x=>x.id===id)),"task-done":()=>toggleTask(id),"go-tasks":()=>go("tasks"),"t-done-toggle":()=>{S.tDone=!S.tDone;render();},
    "due-add":()=>dueForm(),"due-edit":()=>dueForm(S.due.find(x=>x.id===id)),
    "due-done":async()=>{const d=S.due.find(x=>x.id===id);if(!d)return;if(d.repeat==="weekly"){const nd=nextDow(Number(d.dow??4));await write("due",d.id,{...d,doneOn:(d.doneOn&&d.doneOn>=nd)?"":nd});}else await write("due",d.id,{...d,done:!d.done});},
    "st-filter":()=>{S.pf={q:"",lane:"",status:el.dataset.s,comm:"",type:"",town:"",pri:""};go("people");},
    "q-add":()=>qForm(),"q-open":()=>qForm(S.questions.find(x=>x.id===id)),
    "pb-add":()=>pbForm(),"pb-open":()=>pbForm(S.playbook.find(x=>x.id===id)),"pb-go":e=>{e.preventDefault();S.pb=el.dataset.v;if(S.tab!=="playbook")go("playbook");else render();},
    "week-more":()=>{S.ef={q:"",town:"",etype:"",comm:"",table:"",past:false};go("events");},
    "town-clear":()=>{S.mf.town="";render();},"town-pick":e=>{e.preventDefault();S.mf.town=el.dataset.v;render();},
    "pf-clear":()=>{S.pf={q:"",lane:"",status:"",comm:"",type:"",town:"",pri:""};$("#q").value="";render();},
    "copy-csv":()=>copyOrDl(peopleCSV(),"lead-people-orgs-"+todayISO()+".csv","CSV copied. Paste into a sheet."),
    "team-add":()=>teamForm(),"team-edit":()=>teamForm(S.team.find(x=>x.id===id)),
    "pw-doc":()=>pwDoc(id),"pw-status":()=>pwStatus(),"pw-tog":()=>pwToggle(id,el.dataset.k),
    "shift-del":async()=>{if(el.dataset.armed){await remove("shifts",id);}else{el.dataset.armed="1";el.textContent="Tap again";}},
    "report":()=>copyText(dailyReport(),"Report copied. Paste into an email."),"log-csv":()=>copyOrDl(["date,who,where,out,back,sigs,hrs,notes"].concat(S.shifts.map(e=>["date","who","where","out","back","sigs","hrs","notes"].map(c=>csvCell(e[c])).join(","))).join("\n"),"canvass-log-"+todayISO()+".csv","Log copied as CSV"),
    "board-add":()=>boardForm(),"board-edit":()=>boardForm(S.board.find(x=>x.id===id)),
    "pb-lane":null,"pb-status":null,
    "org-add":()=>orgForm(),"org-open":()=>orgForm(S.org.find(x=>x.id===id)),
    "log-add":async()=>{const t=$("#quickText").value.trim();if(!t)return;const ok=await write("log",uid("l"),{text:t,tag:$("#quickTag").value,date:todayISO(),createdAt:new Date().toISOString()});if(ok){$("#quickText").value="";toast("Logged");}},
    "log-open":()=>logForm(S.log.find(x=>x.id===id)),
    "log-pb":e=>{e.stopPropagation();const l=S.log.find(x=>x.id===id);pbForm({body:l.text,status:"guess",source:"Log, "+fmtDate(l.date),title:""});},
    "log-q":e=>{e.stopPropagation();const l=S.log.find(x=>x.id===id);qForm(null,{q:l.text,askWho:"Kelly"});},
    "mtg-add":()=>meetingForm(),"mtg-open":()=>meetingForm(S.meetings.find(x=>x.id===id)),
    "mtg-pb":()=>{const m=S.meetings.find(x=>x.id===id);const t=(m.takeaways||"").split("\n").map(x=>x.trim()).filter(Boolean)[+el.dataset.i];pbForm({title:"",body:t,status:"confirmed",source:(m.title||"Meeting")+", "+fmtDate(m.date),lane:"How LEAD works"});},
    "mtg-q":()=>{const m=S.meetings.find(x=>x.id===id);const t=(m.takeaways||"").split("\n").map(x=>x.trim()).filter(Boolean)[+el.dataset.i];qForm(null,{q:t,askWho:"Kelly"});},
    "mtg-due":()=>{const m=S.meetings.find(x=>x.id===id);const t=(m.next||"").split("\n").map(x=>x.trim()).filter(Boolean)[+el.dataset.i];taskForm(null,{title:t,notes:"From "+(m.title||"meeting"),linkText:m.title||""});},
    "log-task":e=>{e.stopPropagation();const l=S.log.find(x=>x.id===id);taskForm(null,{title:l.text,notes:"From the log, "+fmtDate(l.date)});},
    "ses-add":()=>sessionForm(),"ses-open":()=>sessionForm(S.sessions.find(x=>x.id===id)),"vid-add":()=>videoForm(),"vid-open":()=>videoForm(S.videos.find(x=>x.id===id)),
    "hrs-add":()=>hoursForm(),"hrs-open":()=>hoursForm(S.hours.find(x=>x.id===id)),"hrs-settings":()=>rateForm(),
    "hrs-copy":()=>copyText(invoiceText(),"Invoice lines copied"),
    "hrs-invoiced":async()=>{const st=S.settings||{};if(!uninvoiced().h){toast("Nothing to invoice");return;}if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to confirm";return;}await write("meta","settings",{...st,invoicedThrough:todayISO(),nextInvoiceNo:(+st.nextInvoiceNo||1)+1});toast("Marked invoiced through today");},
    "geocode":()=>geocodeMissing(),"report-sheet":()=>reportSheet(),
    "backup":()=>copyOrDl(backupJSON(),"lead-ops-hub-backup-"+todayISO()+".json","Backup copied. Save it somewhere safe."),
    "restore-file":()=>{const inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";inp.onchange=()=>{const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>restoreFrom(String(rd.result));rd.readAsText(f);};inp.click();},
    "restore":()=>{openSheet("Restore from backup",`<p class="small muted">Paste a backup you copied from this hub.</p><textarea id="restoreTxt" style="width:100%;min-height:180px;background:var(--surface2);border:1px solid var(--line);border-radius:6px;padding:8px"></textarea>`,{btns:`<button class="btn pri" id="restoreBtn">Restore</button><button class="btn ghost" data-close="1">Cancel</button>`});document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));$("#restoreBtn").addEventListener("click",async()=>{await restoreFrom($("#restoreTxt").value);closeOverlay();});},
  }[a]||propAct(a,id,el);
    if(a==="pb-lane"){el.addEventListener("change",()=>{S.pbLane=el.value;render();});return;}
    if(a==="pb-status"){el.addEventListener("change",()=>{S.pbStatus=el.value;render();});return;}
    if(H)el.addEventListener("click",e=>{e.stopPropagation();H(e);});});
}



const EV_PATCH={"e40":{"time":"4:00 PM – 6:00 PM","venue":"Urban League of Greater Hartford parking lot (Woodland & Sargeant)","address":"140 Woodland St, Hartford, CT 06105","url":"https://allevents.in/hartford/urban-league-trunk-or-treat-2026/200030397459900","update_note":"the Urban League's own page says Fri Oct 30 (4–6 or 5–7 PM, 140 Woodland St); allevents says Oct 23. Confirm with events@ulgh.org or (860) 527-0147 ext. 160"},"e41":{"time":"9:00 AM – 12:00 PM","venue":"American Job Center (AJC) – Hartford","address":"60 Weston St, Hartford, CT","url":"https://www.accesshealthct.com/enrollment-events/"},"e42":{"time":"1:00 PM – 3:00 PM (rain date Sun Oct 25)","venue":"East Hartford Town Green","address":"1047 Main St, East Hartford, CT 06108","url":"https://www.easthartfordct.gov/parks-recreation/events/230911"},"e43":{"time":"11:00 AM – 1:00 PM (trick-or-treat from 11:30)","url":"https://www.downtownmanchester.org/annual-events/"},"e44":{"time":"During regular museum hours","address":"250 Columbus Blvd, Hartford, CT 06103","url":"https://ctsciencecenter.org/event/ofrenda-installation"},"e46":{"time":"5:30 PM – 7:30 PM","url":"https://firsttowndowntown.org/about/programs/nightmare-on-broad-st/"},"e47":{"time":"4:00 PM – 7:00 PM","url":"https://www.ccsu.edu/event/lalcc-open-house-0"},"e48":{"time":"6:00 PM – 8:30 PM","venue":"Crossroads Community Cathedral – East Hartford campus","address":"1492 Silver Lane, East Hartford, CT 06118","url":"https://www.myccc.church/event/24479594-2026-10-30-harvest-festival-2026"},"e49":{"time":"5:30 PM – 7:30 PM","venue":"Joseph O. Goodwin Elementary School","address":"1235 Forbes Street, East Hartford, CT 06118","url":"https://allevents.in/east-hartford/ehs-1st-annual-spooktacular-a-sensory-friendly-and-adaptive-night/100002002652152498"},"e52":{"time":"6:00 AM – 8:00 PM","url":"https://patch.com/connecticut/across-ct/key-2026-voting-deadlines-connecticut"},"e57":{"time":"7:30 AM – 11:00 AM","venue":"Riverside Park","address":"20 Leibert Road, Hartford, CT","url":"https://riverfront.org/events/run-for-the-riverfront-5k/"},"e60":{"time":"11:00 AM – 2:00 PM","venue":"East Hartford Senior Center","url":"https://www.easthartfordct.gov/calendar-by-event-type/1452%2B1453%2B1454?month=2026-11"},"e61":{"time":"8:00 AM check-in; 10:00 AM race start","venue":"Hartford HealthCare Community Stage at Mortensen Riverfront Plaza","address":"300 Columbus Boulevard, Hartford, CT","url":"https://riverfront.org/events/hhc5k/"},"e66":{"address":"111 Founders Plaza, East Hartford, CT","url":"https://riverfront.org/events/bigmo26/"},"e69":{"time":"10:00 AM – 2:00 PM","address":"75 Laurel St, Hartford, CT 06106","url":"https://allevents.in/hartford/knox-harvest-market/200030626091421"},"e70":{"time":"10:00 AM","venue":"Main Street, Manchester","url":"https://www.manchesterroadrace.com/"},"e72":{"url":"https://www.downtownmanchester.org/annual-events/"},"e76":{"time":"5:30 PM – 7:00 PM","venue":"East Hartford Town Green","address":"1047 Main St, East Hartford, CT 06108","url":"https://www.easthartfordct.gov/parks-recreation/events/230916"},"e77":{"time":"9:00 AM – 4:00 PM","url":"https://www.ccsu.edu/event/latinos-citizenship-symposium"},"e78":{"time":"5K starts 10:30 AM","venue":"Start on Burr St; finish/cookies at Blue Back Square","address":"Burr St, West Hartford, CT 06107","url":"https://www.hartfordmarathon.com/blue-back-mitten-run/"},"e83":{"time":"6:00 PM carol sing/tree lighting; 6:30 PM parade (postpones to Sun Dec 13 in bad weather)","venue":"Windsor Town Green; parade starts on Capen Street","url":"https://firsttowndowntown.org/about/programs/carolsingtorchlightparade/"},"e88":{"url":"https://firstnighthartford.org/"}},EV_DROP=[];
(function(){Object.assign(REF.CENTROIDS,{Vernon:[41.8187,-72.4795],Middletown:[41.5623,-72.6506],Southington:[41.5965,-72.8776]});const drop=new Set(EV_DROP);for(let i=REF.EVENTS.length-1;i>=0;i--){const e=REF.EVENTS[i];if(drop.has(e.id)){REF.EVENTS.splice(i,1);continue;}const pt=EV_PATCH[e.id];if(pt){const {update_note,...rest}=pt;Object.assign(e,rest);if(update_note)e.why=(e.why?e.why+' ':'')+'(Updated Oct 20: '+update_note+')';}if(/\bNRZ\b|NERA|Revitalization/i.test(e.name)&&e.date>='2026-10-20'){e.priority='Low';if(!/NRZ outreach is off/.test(e.why||''))e.why='NRZ outreach is off for LEAD as of Oct 8. '+(e.why||'');}}REF.EVENTS.push(...EV_NEW);})();
function isBlead(e){return (e.community||[]).some(c=>/black|west indian|african|caribbean/i.test(c))||/black|caribbean|west indian|african|people of color|\bpoc\b|minority/i.test(e.owner_type||'');}
/* ============ proposals: outside groups asking to run something with LEAD ============ */
const PROP_SECS=[
  ["s1","Organization Overview","Your organization's name, mission, and a brief description of the services you provide.","Org"],
  ["s2","Program/Event Description","The purpose of your proposed program or event, including planned activities and intended outcomes.","Program"],
  ["s3","Community Impact","How the initiative will benefit East Hartford and Greater Hartford residents and align with CT LEAD's mission.","Impact"],
  ["s4","Target Audience","The population you intend to serve and the anticipated number of participants.","Audience"],
  ["s5","Proposed Dates & Times","Preferred dates, event duration, frequency, and any setup or breakdown requirements.","Dates"],
  ["s6","Facility & Resource Needs","Requested spaces, equipment, seating arrangements, accessibility considerations, and any additional support needed from CT LEAD.","Space"],
  ["s7","Financial Considerations","Whether the event will be free or ticketed, any participant fees, and anticipated funding or sponsorship arrangements.","Money"],
  ["s8","Partnership Opportunities","How CT LEAD may be involved beyond providing space, including outreach, promotion, program development, or other collaborative efforts.","Partner"]
];
const PROP_KEYS=PROP_SECS.map(s=>s[0]);
const PROP_Q={
  s1:["Mission fits LEAD's","Education, families, culture, health or civic work: 2. Related but indirect: 1. Unrelated, or mainly selling something: 0."],
  s2:["Fits a LEAD pillar","Clearly one of the five pillars: 2. Loosely: 1. None of them: 0."],
  s3:["Serves our area","East Hartford residents directly: 2. Greater Hartford or regional: 1. Outside the area, or not said: 0."],
  s4:["Right people, enough of them","Families, parents or students, and 10 or more expected: 2. One of the two: 1. Neither: 0."],
  s5:["Fits the center's calendar","Clear dates and light setup: 2. Flexible or unclear: 1. Conflicts, or heavy setup: 0."],
  s6:["What it asks of LEAD","Space only, or a light ask: 2. Some equipment or staff time: 1. A heavy ask: 0."],
  s7:["Free for families","Free: 2. Small fee, or still finding a sponsor: 1. Ticketed, or asks LEAD to pay: 0."],
  s8:["Goes beyond space","Co-runs it, promotes LEAD, or brings Champions: 2. Some promotion: 1. Space only: 0."]
};
const PROP_PILLARS=["","Educational Options","History & culture","Health & Wellbeing","Financial Literacy","Civic Engagement","None of these"];
const PROP_ST=[["new","New","blue","var(--blue)"],["review","Reviewing","grey","var(--notyet)"],["info","Waiting on them","orange","var(--orange)"],["exec","Sent to exec","sand","var(--sand-ink)"],["yes","Approved","green","var(--green)"],["no","Declined","red","var(--red)"]];
const PROP_STL=Object.fromEntries(PROP_ST.map(x=>[x[0],x]));
S.proposals=S.proposals||[];S.prop=null;S.pdraft={};S.pf2="open";

function propById(id){return S.proposals.find(p=>p.id===id)||null;}
function propText(p,k){const d=S.pdraft[p.id+":"+k];return String(d!=null?d:((p.a||{})[k]||"")).trim();}
function propName(p){return p.org||"Untitled proposal";}
function propScore(p){
  const r=p.r||{};const rated=PROP_KEYS.filter(k=>r[k]!==undefined&&r[k]!==""&&r[k]!==null);
  const score=rated.reduce((t,k)=>t+(+r[k]||0),0);
  const filled=PROP_KEYS.filter(k=>propText(p,k).length>=3);const missing=PROP_KEYS.filter(k=>!filled.includes(k));
  const f=p.flags||{};let v="",label="",cls="";
  if(f.political==="Yes"){v="HOLD";label="Political or campaign content. Send it to the exec team before anything is promised; LEAD stays neutral.";cls="hold";}
  else if(rated.length<8){v="";label=(8-rated.length)+" of 8 parts still to rate";cls="";}
  else if(score>=13){v="STRONG FIT";label="Recommend it to the exec team.";cls="go";}
  else if(score>=9){v="FIT WITH CONDITIONS";label="Recommend it once the low parts are fixed.";cls="fit";}
  else if(score>=5){v="WEAK FIT";label="Only worth it if it fills a real gap.";cls="hold";}
  else{v="NOT A FIT";label="Decline politely and keep the connection.";cls="skip";}
  return {score,rated:rated.length,filled:filled.length,missing,v,label,cls};
}
function propOpen(p){return !["yes","no"].includes(p.status||"new");}
function propDue(){return S.proposals.filter(p=>(p.status||"new")==="new"||((p.status==="review")&&propScore(p).rated<8)).sort((a,b)=>(a.received||"")<(b.received||"")?-1:1);}

/* ---------- reading the text ---------- */
function propPillarGuess(s){const P=[["Financial Literacy",/financ|money|budget|credit|\btax|banking|small business|entrepreneur|startup|saving|invest/i],["Civic Engagement",/citizenship|immigra|civic|advoca|voter registration|community engagement|town hall|know your rights/i],["Health & Wellbeing",/health|wellness|zumba|pilates|fitness|mental|nutrition|exercise|yoga|senior|support group/i],["Educational Options",/english|\besl\b|esol|tutor|school|college|career|classes|literacy|stem|coding|youth program|education/i],["History & culture",/heritage|cultur|history|celebrat|festival|\bart\b|music|dance/i]];const hit=P.find(([,re])=>re.test(s));return hit?hit[0]:"";}
function propPeople(s){const re=/(?<![\w-])(\d{1,4})(?:\s*(?:-|–|to)\s*(\d{1,4}))?\s*\+?\s*(people|participants|attendees|families|students|guests|parents|kids|children|youth|seniors|residents|adults)\b/gi;let best=null,m;while((m=re.exec(String(s||"")))){const n=+(m[2]||m[1]);if(!best||n>best.n)best={n,txt:m[0]};}return best;}
function propHints(p){
  const t=k=>propText(p,k);const all=PROP_KEYS.map(t).join("\n");const H={};const add=(k,s,c)=>(H[k]=H[k]||[]).push([s,c||""]);
  const pg=propPillarGuess(t("s2")+" "+t("s1"));if(pg)add("s2","Sounds like "+pg);
  if(/east hartford/i.test(all))add("s3","Names East Hartford");else if(/hartford/i.test(all))add("s3","Names Hartford, not East Hartford");else if(all)add("s3","No town named","warn");
  const pp=propPeople(t("s4")||all);if(pp)add("s4","Expects "+pp.txt);else if(all)add("s4","No headcount given","warn");
  if(/famil|parent|student|youth|kids|children/i.test(t("s4")))add("s4","Names families or students");
  if(/week|month|recurring|every |series|ongoing/i.test(t("s5")))add("s5","Repeats");
  if(/projector|screen|microphone|\bmic\b|sound|speaker|tables?\b|chairs?\b|kitchen|wi-?fi|\bav\b|a\/v/i.test(t("s6")))add("s6","Asks for equipment");
  if(/staff|volunteers? from|support from|childcare|set ?up help/i.test(t("s6")))add("s6","Asks for LEAD people","warn");
  if(/\bfree\b|no cost|no charge/i.test(t("s7")))add("s7","Says free");
  if(/\$\s?\d|\bfees?\b|ticket|charge|cost per|tuition/i.test(t("s7")))add("s7","Mentions a cost","warn");
  if(/sponsor|grant|fund/i.test(t("s7")))add("s7","Mentions funding");
  if(/promot|flyer|social media|outreach|co-?host|volunteer|newsletter|champion|share/i.test(t("s8")))add("s8","Offers promotion or outreach");
  const pol=/\b(candidate|campaign|election|endorse\w*|vote for|political|rally|ballot)\b/i.exec(all);if(pol)add("flag","The text says “"+pol[0]+"”","warn");
  const sell=/\b(sell|selling|sales pitch|purchase|buy our|our products?|paid membership|consultation fee)\b/i.exec(all);if(sell)add("sell","The text says “"+sell[0]+"”","warn");
  return H;
}
const PROP_LABELS=[
  ["s1",/^(organi[sz]ation(al)?\s+overview|organi[sz]ation(al)?\s+(info|information|background)|about\s+(us|our\s+organi[sz]ation)|who\s+we\s+are|organi[sz]ation)/i],
  ["s2",/^(program\s*\/\s*event\s+description|program\s+or\s+event\s+description|program\s+description|event\s+description|program\s*\/\s*event|description)/i],
  ["s3",/^(community\s+impact|impact)/i],
  ["s4",/^(target\s+audience|audience|population\s+served)/i],
  ["s5",/^(proposed\s+dates?(\s*(&|and)\s*times?)?|dates?\s*(&|and)\s*times?|dates?|schedule|timeline)/i],
  ["s6",/^(facility\s*(&|and)\s*resource\s+needs|facility\s+needs|facilities|facility|resource\s+needs|space\s+needs|resources)/i],
  ["s7",/^(financial\s+considerations|financials?|budget|costs?|funding)/i],
  ["s8",/^(partnership\s+opportunities|partnership|collaboration)/i]
];
function splitProposal(txt){
  const lines=String(txt||"").replace(/\r/g,"").split("\n");
  const pass=(numbered)=>{const out={},pre=[];let cur=null,found=0;
    for(const raw of lines){let ln=raw.replace(/^\s*(?:[#>•*\-]+\s*)?/,"");let num=null;const m=ln.match(/^(\d)\s*[.)]\s+/);if(m){num=+m[1];ln=ln.slice(m[0].length);}ln=ln.replace(/^[*_]+/,"");
      let key=null,rest="";
      if(!numbered){for(const [k,re] of PROP_LABELS){const mm=ln.match(re);if(!mm)continue;const after=ln.slice(mm[0].length).replace(/^[*_]+/,"");const am=after.match(/^\s*[:\-–—]\s*/);if(am||!after.trim()){key=k;rest=am?after.slice(am[0].length):"";break;}}}
      else if(num&&num>=1&&num<=8){key="s"+num;const c=ln.indexOf(":");rest=c>-1&&c<70?ln.slice(c+1):ln;}
      if(key){cur=key;found++;out[key]=(out[key]?out[key]+"\n":"")+rest.replace(/^[*_]+|[*_]+$/g,"").trim();continue;}
      if(cur)out[cur]=(out[cur]?out[cur]+"\n":"")+raw.trim();else pre.push(raw.trim());}
    PROP_KEYS.forEach(k=>{if(out[k])out[k]=out[k].replace(/\n{3,}/g,"\n\n").trim();});
    return {out,pre:pre.join("\n").trim(),found};};
  let r=pass(false);if(r.found<2){const n=pass(true);if(n.found>=3)r=n;}
  if(r.found<2)return {a:{s2:String(txt||"").trim()},pre:"",found:0};
  const a=r.out;if(r.pre&&!a.s1){a.s1=r.pre;r.pre="";}
  return {a,pre:r.pre,found:r.found};
}

/* ---------- saving ---------- */
async function propSave(id,patch){const cur=propById(id)||{};const next={...cur,...patch,updatedAt:new Date().toISOString()};delete next.id;
  const i=S.proposals.findIndex(p=>p.id===id);if(i>-1)S.proposals[i]={id,...next};else S.proposals.push({id,...next});
  await new Promise(r=>setTimeout(r,0));render();return write("proposals",id,next);}
function propNew(pre){
  form({title:"New proposal",fields:[
    {key:"org",label:"Organization",required:true,wide:true},{key:"contact_name",label:"Contact name"},{key:"received",label:"Received",type:"date",default:todayISO()},
    {key:"email",label:"Email"},{key:"phone",label:"Phone"},
    {key:"raw",label:"Paste what they sent (optional)",type:"textarea",rows:8,wide:true,placeholder:"Paste the whole email or proposal. If it uses the 8 headings, each part drops into place."}],
    values:pre||{},extra:`<p class="small muted">You can also leave this blank and type each part in on the next screen.</p>`,
    onSave:async v=>{const id=uid("pr");let a={},notes="",found=0;if(v.raw){const sp=splitProposal(v.raw);a=sp.a;found=sp.found;if(sp.pre)notes="Before the first heading:\n"+sp.pre;}
      const rec={org:v.org,contact_name:v.contact_name,email:v.email,phone:v.phone,received:v.received||todayISO(),status:"new",a,r:{},pillar:"",flags:{},tags:{},title:"",date:"",time:"",people:"",notes,raw:v.raw||"",createdAt:todayISO()};
      const ok=await propSave(id,rec);if(!ok)return false;S.prop=id;S.tab!=="proposals"?go("proposals",true):render();window.scrollTo({top:0});
      if(v.raw)toast(found>=2?`Sorted into ${PROP_KEYS.filter(k=>a[k]).length} of 8 parts`:"No headings found, so the text is under Program/Event Description. Try Read it with AI.");return true;}});
}
function propExample(){const id=uid("pr");return propSave(id,{org:"EXAMPLE: Riverside Youth Coding Club",contact_name:"Sample Contact",email:"",phone:"",received:todayISO(),status:"new",title:"Family Coding Nights (example)",date:"",time:"",people:"",pillar:"",flags:{},tags:{},r:{},notes:"This is a made-up proposal so you can see how the meter works. Delete it when you're done.",raw:"",createdAt:todayISO(),
  a:{s1:"Riverside Youth Coding Club is a volunteer nonprofit that teaches middle schoolers to build simple apps and websites. Our mission is to open tech careers to kids who don't see them at school.",
    s2:"Four Thursday evening sessions where students and a parent build a small website together. Activities: a short lesson, paired coding, and a showcase on the last night. Outcome: every family leaves with a working site and a list of free programs to keep going.",
    s3:"Most of our families live in Hartford and East Hartford. The sessions bring parents into their kids' learning, which fits LEAD's work on educational options.",
    s4:"Middle school students and one parent each. We expect 12 families (about 24 people).",
    s5:"Thursdays in January, 6:00 to 7:30 PM. 20 minutes of setup.",
    s6:"One classroom, 12 tables with power, Wi-Fi, and a screen for the lesson.",
    s7:"",
    s8:"We'll put LEAD's logo on our flyers and share LEAD's family programs at each session."}}).then(ok=>{if(ok){S.prop=id;render();}});}

/* ---------- AI ---------- */
function propAIPrompt(p){const raw=p.raw||PROP_SECS.map(([k,l])=>`${l}: ${propText(p,k)}`).join("\n\n");
  return `You are helping ${ME().name||"a LEAD team member"}, who works at CT LEAD (Leaders for Educational Advocacy and Diversity) in ${ME().town}, Connecticut, review a proposal from an outside organization that wants to run a program or event with LEAD or at the LEAD center.

LEAD's mission: expand educational options and opportunities in Connecticut and build an equitable, healthy, educated, civically engaged community. LEAD's five pillars: Educational Options, History & culture, Health & Wellbeing, Financial Literacy, Civic Engagement. LEAD's own target for a class is at least 10 people. LEAD stays politically neutral.

LEAD asks for eight parts:
${PROP_SECS.map(([k,l,d])=>`${k}: ${l}. ${d}`).join("\n")}

Rate each part 0, 1 or 2 with this rubric:
${PROP_KEYS.map(k=>`${k}: ${PROP_Q[k][0]}. ${PROP_Q[k][1]}`).join("\n")}

Rules: put the organization's own words into each part; do not invent facts. If a part is not covered, leave it "" and rate it 0 with the reason "Not in the proposal." Each reason is one short, plain sentence.

Return only JSON in this shape:
{"org":"","contact_name":"","email":"","phone":"","title":"name of the program or event","pillar":"one of the five pillars, or None of these","sections":{"s1":"","s2":"","s3":"","s4":"","s5":"","s6":"","s7":"","s8":""},"ratings":{"s1":{"r":0,"why":""},"s2":{"r":0,"why":""},"s3":{"r":0,"why":""},"s4":{"r":0,"why":""},"s5":{"r":0,"why":""},"s6":{"r":0,"why":""},"s7":{"r":0,"why":""},"s8":{"r":0,"why":""}},"political":"Yes or No","selling":"Yes or No"}

The proposal:
"""
${raw}
"""`;}
function propApplyAI(p,res){if(!res||typeof res!=="object"){toast("That answer wasn't in the expected shape.");return;}
  const sec=res.sections||{},rt=res.ratings||{};const a={...(p.a||{})};const blob=PROP_KEYS.filter(k=>(a[k]||"").trim()).length<=1;
  PROP_KEYS.forEach(k=>{const v=String(sec[k]||"").trim();if(v&&(blob||!(a[k]||"").trim()))a[k]=v;});
  const ai={};PROP_KEYS.forEach(k=>{const x=rt[k];if(x&&x.r!==undefined&&x.r!==null&&x.r!=="")ai[k]={r:Math.max(0,Math.min(2,Math.round(+x.r||0))),why:String(x.why||"").slice(0,240)};});
  const patch={a,ai};["org","contact_name","email","phone","title"].forEach(k=>{if(!p[k]&&res[k])patch[k]=String(res[k]).trim();});
  if(!p.pillar&&PROP_PILLARS.includes(res.pillar))patch.pillar=res.pillar;
  const f={...(p.flags||{})};if(!f.political&&/^y/i.test(res.political||""))f.political="Yes";if(!f.selling&&/^y/i.test(res.selling||""))f.selling="Yes";patch.flags=f;
  PROP_KEYS.forEach(k=>delete S.pdraft[p.id+":"+k]);
  propSave(p.id,patch).then(ok=>ok&&toast("AI read it. Check each part, then Use AI ratings if they look right."));}
async function propAI(p){const btn=$("#prAiBtn");
  if(!p.raw&&!PROP_KEYS.some(k=>propText(p,k))){toast("Paste or type the proposal first");return;}
  const sample=LOCAL?null:await useCap("sample");
  if(!sample||typeof sample.json!=="function"){copyText(propAIPrompt(p),"Prompt copied. Paste it into Claude, then paste the answer back.");propPasteAI(p);return;}
  if(btn){btn.disabled=true;btn.textContent="Reading…";}
  try{const res=await sample.json(propAIPrompt(p),{modelTier:"default"});propApplyAI(propById(p.id)||p,res);}
  catch(e){if(e&&e.code==="not_granted"){toast("AI was declined for this page. Copying the prompt instead.");copyText(propAIPrompt(p));propPasteAI(p);}else toast("Couldn't read it: "+(e&&e.message||"error"));}
  finally{const b=$("#prAiBtn");if(b){b.disabled=false;b.textContent="Read it with AI";}}}
function propPasteAI(p){openSheet("Paste Claude's answer",`<p class="small muted">The prompt is on your clipboard. Paste it into Claude, copy the JSON it sends back, and paste it here.</p><textarea id="prAiPaste" style="width:100%;min-height:200px;background:var(--surface2);border:1px solid var(--line);border-radius:6px;padding:8px"></textarea>`,{btns:`<button class="btn pri" id="prAiApply">Fill it in</button><button class="btn" id="prAiCopy">Copy the prompt again</button><button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  $("#prAiCopy").addEventListener("click",()=>copyText(propAIPrompt(p),"Prompt copied"));
  $("#prAiApply").addEventListener("click",()=>{const t=$("#prAiPaste").value;const s=t.indexOf("{"),e=t.lastIndexOf("}");let o=null;try{o=JSON.parse(t.slice(s,e+1));}catch(err){toast("That isn't the JSON answer. Paste everything Claude sent.");return;}closeOverlay();propApplyAI(propById(p.id)||p,o);});}

/* ---------- text you can send ---------- */
function propRequestText(){return `Subject: Proposal for a program at CT LEAD

Hi [Name],

Thank you for your interest in working with CT LEAD (Leaders for Educational Advocacy and Diversity). To help us review your request, please send a brief proposal outlining the following information:

${PROP_SECS.map(([,l,d],i)=>`${i+1}. ${l}: ${d}`).join("\n")}

Best,
${ME().name}
${ME().place}`;}
function propSummary(p){const s=propScore(p),f=p.flags||{},tg=p.tags||{},r=p.r||{};const lab=k=>PROP_SECS.find(x=>x[0]===k)[1];
  const focus=[tg.blead?"B-LEAD":"",tg.charter?"Charter schools & education leaders":""].filter(Boolean).join(", ");
  return `PROPOSAL REVIEW: ${propName(p)}${p.title?" | "+p.title:""}
Reviewed by ${ME().name}, ${ME().place}, ${fmtDate(todayISO(),true)}
Received: ${p.received?fmtDate(p.received,true):"(no date)"}${p.contact_name||p.email||p.phone?"\nContact: "+[p.contact_name,p.email,p.phone].filter(Boolean).join(", "):""}
Pillar: ${p.pillar||"(not picked)"}${focus?"\nFocus areas: "+focus:""}${p.people?"\nExpected participants: "+p.people:""}${p.date?"\nProposed date: "+fmtDate(p.date,true)+(p.time?", "+p.time:""):""}

Fit: ${s.score}/16${s.v?", "+s.v:""}. ${s.label}
Parts answered: ${s.filled} of 8${s.missing.length?" (missing: "+s.missing.map(lab).join(", ")+")":""}
Political or campaign content: ${f.political||"not checked"} | Sells to attendees: ${f.selling||"not checked"}

${PROP_SECS.map(([k,l],i)=>`${i+1}. ${l} — ${r[k]===undefined||r[k]===""?"not rated":r[k]+"/2"} (${PROP_Q[k][0]})\n${propText(p,k)||"(not in the proposal)"}`).join("\n\n")}${(p.notes||"").trim()?"\n\nNotes:\n"+p.notes.trim():""}
`;}
function propAskText(p){const s=propScore(p);const first=(p.contact_name||"").split(/[ ,]/)[0]||"there";
  return `Subject: Your proposal to CT LEAD – a few more details

Hi ${first},

Thank you for sending your proposal${p.title?" for "+p.title:""}. To finish our review, could you send a little more on the following:

${s.missing.map(k=>{const x=PROP_SECS.find(y=>y[0]===k);return `• ${x[1]}: ${x[2]}`;}).join("\n")}

Once we have these, we'll review it with our team and follow up.

Best,
${ME().name}
${ME().place} (Leaders for Educational Advocacy and Diversity)`;}

/* ---------- pages ---------- */
function propMini(p){const s=propScore(p),r=p.r||{};const mc=s.cls==="go"?"var(--green)":s.cls==="fit"?"var(--blue)":s.cls==="hold"?"var(--orange)":s.cls==="skip"?"var(--red)":"var(--notyet)";
  return `<span class="pr-mini" style="--mc:${mc}"><span class="pbar">${PROP_KEYS.map(k=>`<i class="${String(r[k])==="2"?"f":String(r[k])==="1"?"h":""}"></i>`).join("")}</span><b>${s.score}/16</b></span>`;}
function propStPill(p){const x=PROP_STL[p.status||"new"]||PROP_ST[0];return `<span class="pill ${x[2]}">${x[1]}</span>`;}
function rProposals(){if(S.prop){const p=propById(S.prop);if(p)return rProposal(p);S.prop=null;}
  const f=S.pf2;const L=S.proposals.filter(p=>f==="all"||(f==="open"?propOpen(p):f==="yes"?p.status==="yes":p.status==="no")).sort((a,b)=>(b.received||"").localeCompare(a.received||""));
  const n={open:S.proposals.filter(propOpen).length,yes:S.proposals.filter(p=>p.status==="yes").length,no:S.proposals.filter(p=>p.status==="no").length,all:S.proposals.length};
  return `<p class="muted small pr-intro">When an outside group asks to run something with LEAD or use the center, LEAD asks for an 8-part proposal. Paste what they send, rate each part 0 to 2, and the meter scores the fit out of 16. Copy the summary for the exec team, or ask the group for the parts they left out.</p>
  <div class="toolrow"><button class="btn sm pri" data-act="prop-new">+ New proposal</button><button class="btn sm" data-act="prop-request">Copy the request</button>
    <div class="chips">${[["open","Open"],["yes","Approved"],["no","Declined"],["all","All"]].map(([k,l])=>`<button class="chip" data-act="prop-f" data-v="${k}" aria-pressed="${f===k}">${l} <span class="num">${n[k]}</span></button>`).join("")}</div>
    <span class="sp"></span></div>
  ${L.length?`<div class="rows pr-list">${L.map(p=>{const s=propScore(p);return `<div class="row" data-act="prop-open" data-id="${p.id}"><div style="min-width:0"><div class="n">${esc(propName(p))}</div><div class="d">${esc(p.title||p.pillar||propText(p,"s2").slice(0,90)||"No description yet")}${p.received?" · received "+fmtDate(p.received):""} · ${s.filled} of 8 parts</div></div><div class="r pr-r">${propMini(p)}${s.v?`<span class="pill ${({go:"green",fit:"blue",hold:"orange",skip:"red"})[s.cls]||"grey"}">${s.v.toLowerCase()}</span>`:""}${propStPill(p)}</div></div>`;}).join("")}</div>`
  :!S.loaded.proposals?`<p class="empty">${ld()}</p>`:`<div class="pr-empty"><h2>${n.all?"Nothing in this list":"No proposals yet"}</h2><p class="muted">${n.all?"Switch the filter above to see the rest.":"Proposals you add show up here with their fit score and status. To start, send a group the request with <b>Copy the request</b>, then paste their answer with <b>+ New proposal</b>."}</p>${n.all?"":`<div class="chips"><button class="btn sm pri" data-act="prop-new">+ New proposal</button><button class="btn sm" data-act="prop-example">Load a made-up example</button></div>`}</div>`}
  <section class="sec"><div class="h"><h2>How the meter scores</h2><span class="meta">one question per part, 0 to 2 each</span></div>
    <div class="pr-key">${PROP_SECS.map(([k,l],i)=>`<div><b>${i+1}. ${esc(PROP_Q[k][0])}</b><span>${esc(PROP_Q[k][1])}</span></div>`).join("")}</div>
    <p class="small muted" style="margin-top:10px">13 to 16: strong fit. 9 to 12: fit with conditions. 5 to 8: weak fit. Under 5: not a fit. Political or campaign content puts it on hold for the exec team, whatever the score.</p></section>`;
}
function rProposal(p){const s=propScore(p),r=p.r||{},f=p.flags||{},tg=p.tags||{},H=propHints(p),ai=p.ai||{};const id=p.id;
  const yn=k=>`<span class="opts">${["Yes","No"].map(v=>`<button data-prf="${k}" data-v="${v}" aria-pressed="${f[k]===v}">${v}</button>`).join("")}</span>`;
  const hint=k=>(H[k]||[]).map(([t,c])=>`<span class="${c}">${esc(t)}</span>`).join("");
  const val=k=>{const d=S.pdraft[id+":"+k];return d!=null?d:((p.a||{})[k]||"");};
  const fv=k=>{const d=S.pdraft[id+":f:"+k];return d!=null?d:(p[k]||"");};
  const hasAI=PROP_KEYS.some(k=>ai[k]);
  return `<button class="pr-back" data-act="prop-back">‹ All proposals</button>
  <div class="pr-head"><div style="flex:1;min-width:0"><h2 class="pr-h">${esc(propName(p))}</h2><div class="muted small">${esc([p.title,p.contact_name,p.received?"received "+fmtDate(p.received,true):""].filter(Boolean).join(" · "))}</div></div></div>
  <div class="stpick pr-st" style="margin-top:10px">${PROP_ST.map(([k,l,,c])=>`<button data-prst="${k}" aria-pressed="${(p.status||"new")===k}"><i style="background:${c}"></i>${l}</button>`).join("")}</div>

  <div class="meter ${s.cls}" role="group" aria-label="Alignment meter">
    <div class="sc num">${s.score}<small>/16</small></div>
    <div class="vd">${s.v?`<b>${s.v}</b>`:`<b class="muted">Rate all 8 parts</b>`}<span>${esc(s.label)}</span></div>
    <div class="segs">${PROP_SECS.map(([k,l,,ab])=>{const v=r[k];const miss=!propText(p,k);return `<button class="seg" data-prjump="${k}" title="${esc(l)}: ${v===undefined||v===""?"not rated":v+" of 2"}${miss?", not answered":""}"><span class="t ${miss?"miss":""}"><i style="width:${v===undefined||v===""?0:(+v)*50}%"></i></span><em>${ab} ${v===undefined||v===""?"–":v}</em></button>`;}).join("")}</div>
    <div class="meta"><span><b>${s.filled} of 8</b> parts answered${s.missing.length?": missing "+s.missing.map(k=>PROP_SECS.find(x=>x[0]===k)[3]).join(", "):""}</span><span><b>${s.rated} of 8</b> rated</span>${f.political==="Yes"?`<span class="warnt">Political content</span>`:""}${f.selling==="Yes"?`<span class="warnt">Sells to attendees</span>`:""}${tg.blead?`<span>B-LEAD</span>`:""}${tg.charter?`<span>Charter schools</span>`:""}</div>
  </div>

  <div class="chips pr-acts"><button class="btn sm pri" data-act="prop-summary">Copy summary for exec</button><button class="btn sm" data-act="prop-ask" ${s.missing.length?"":"disabled"}>Ask for the missing parts${s.missing.length?" ("+s.missing.length+")":""}</button><button class="btn sm" data-act="prop-ai" id="prAiBtn">${LOCAL?"Read it with Claude":"Read it with AI"}</button>${hasAI?`<button class="btn sm" data-act="prop-useai">Use AI ratings</button>`:""}${p.eventId&&getRec(p.eventId)?`<button class="btn sm" data-act="prop-ev-open">Open the event</button>`:`<button class="btn sm" data-act="prop-ev" ${tabOK("events")?"":"hidden"}>Add to Events</button>`}${p.targetId&&getRec(p.targetId)?`<button class="btn sm" data-act="prop-t-open">Open the org</button>`:`<button class="btn sm" data-act="prop-t" ${tabOK("people")?"":"hidden"}>Add org to People &amp; orgs</button>`}</div>

  <section class="sec"><div class="h"><h2>The basics</h2></div>
    <div class="fields pr-fields">
      <div class="f"><label for="prf-org">Organization</label><input id="prf-org" data-prk="org" value="${esc(fv("org"))}"></div>
      <div class="f"><label for="prf-title">Program or event name</label><input id="prf-title" data-prk="title" value="${esc(fv("title"))}"></div>
      <div class="f"><label for="prf-contact_name">Contact</label><input id="prf-contact_name" data-prk="contact_name" value="${esc(fv("contact_name"))}"></div>
      <div class="f"><label for="prf-received">Received</label><input id="prf-received" type="date" data-prk="received" value="${esc(fv("received"))}"></div>
      <div class="f"><label for="prf-email">Email</label><input id="prf-email" data-prk="email" value="${esc(fv("email"))}"></div>
      <div class="f"><label for="prf-phone">Phone</label><input id="prf-phone" data-prk="phone" value="${esc(fv("phone"))}"></div>
      <div class="f"><label for="prf-pillar">LEAD pillar</label><select id="prf-pillar" data-prk="pillar">${PROP_PILLARS.map(x=>`<option value="${esc(x)}" ${(p.pillar||"")===x?"selected":""}>${x||"Not picked"}</option>`).join("")}</select></div>
      <div class="f"><label for="prf-people">Expected participants</label><input id="prf-people" data-prk="people" inputmode="numeric" value="${esc(fv("people"))}" placeholder="${(()=>{const pp=propPeople(propText(p,"s4"));return pp?pp.n:"";})()}"></div>
      <div class="f"><label for="prf-date">First date (for Events)</label><input id="prf-date" type="date" data-prk="date" value="${esc(fv("date"))}"></div>
      <div class="f"><label for="prf-time">Time</label><input id="prf-time" data-prk="time" value="${esc(fv("time"))}" placeholder="6:00 PM – 7:30 PM"></div>
    </div>
    <div class="assess" style="margin-top:12px">
      <div class="q"><div>Political or campaign content?<small>Yes puts it on hold for the exec team. LEAD can't look like it's endorsing anyone.</small><div class="pr-hints">${hint("flag")}</div></div>${yn("political")}</div>
      <div class="q"><div>Sells a product or service to the people who come?<small>Doesn't change the score. It goes in the summary so the exec team sees it.</small><div class="pr-hints">${hint("sell")}</div></div>${yn("selling")}</div>
    </div>
    <div class="ck2" style="margin-top:10px"><label><input type="checkbox" id="prt-blead" data-prt="blead" ${tg.blead?"checked":""}>Reaches B-LEAD communities</label><label><input type="checkbox" id="prt-charter" data-prt="charter" ${tg.charter?"checked":""}>Touches charter schools or education leaders</label></div>
  </section>

  <section class="sec"><div class="h"><h2>The 8 parts</h2><span class="meta">LEAD's wording under each heading</span></div>
  ${PROP_SECS.map(([k,l,d],i)=>{const v=val(k),q=PROP_Q[k],a=ai[k];return `<div class="pr-sec" id="pr-${k}">
    <h3><span class="n">${i+1}</span>${esc(l)}</h3><p class="ask">${esc(d)}</p>
    <textarea id="pra-${k}" data-pra="${k}" class="${String(v).trim()?"":"empty"}" placeholder="Not in the proposal yet">${esc(v)}</textarea>
    <div class="assess"><div class="q"><div>${esc(q[0])}<small>${esc(q[1])}</small><div class="pr-hints">${hint(k)}${a?`<span class="ai">AI: ${a.r} · ${esc(a.why)}</span>`:""}</div></div><span class="opts">${[0,1,2].map(n=>`<button data-prr="${k}" data-v="${n}" aria-pressed="${String(r[k])===String(n)}">${n}</button>`).join("")}</span></div></div>
  </div>`;}).join("")}
  </section>

  <section class="sec"><div class="h"><h2>Notes</h2></div>
    <textarea id="prn-notes" class="pr-notes" data-prk="notes" placeholder="Questions for the group, what Kelly said, conditions for a yes">${esc(fv("notes"))}</textarea>
    ${p.raw?`<details class="pr-raw"><summary>What they sent (original text)</summary><pre>${esc(p.raw)}</pre></details>`:""}
    <div class="chips" style="margin-top:14px"><button class="btn sm danger" data-act="prop-del">Delete proposal</button></div>
  </section>`;
}
function propBind(v){if(S.tab!=="proposals"||!S.prop)return;const p=propById(S.prop);if(!p)return;const id=p.id;
  v.querySelectorAll("[data-pra]").forEach(ta=>{const k=ta.dataset.pra,key=id+":"+k;
    ta.addEventListener("input",()=>{S.pdraft[key]=ta.value;ta.classList.toggle("empty",!ta.value.trim());});
    ta.addEventListener("change",async()=>{const val=ta.value;const cur=propById(id)||p;const ok=await propSave(id,{a:{...(cur.a||{}),[k]:val.trim()}});if(ok&&S.pdraft[key]===val)delete S.pdraft[key];});});
  v.querySelectorAll("[data-prk]").forEach(el=>{const k=el.dataset.prk,key=id+":f:"+k;
    if(el.tagName!=="SELECT")el.addEventListener("input",()=>{S.pdraft[key]=el.value;});
    el.addEventListener("change",async()=>{const val=el.value;const ok=await propSave(id,{[k]:val.trim()});if(ok&&S.pdraft[key]===val)delete S.pdraft[key];});});
  v.querySelectorAll("[data-prr]").forEach(b=>b.addEventListener("click",()=>{const cur=propById(id)||p;const r={...(cur.r||{})};const k=b.dataset.prr,n=+b.dataset.v;if(String(r[k])===String(n))delete r[k];else r[k]=n;const st=(cur.status||"new")==="new"?"review":cur.status;propSave(id,{r,status:st});}));
  v.querySelectorAll("[data-prf]").forEach(b=>b.addEventListener("click",()=>{const cur=propById(id)||p;const f={...(cur.flags||{})};const k=b.dataset.prf;f[k]=f[k]===b.dataset.v?"":b.dataset.v;propSave(id,{flags:f});}));
  v.querySelectorAll("[data-prt]").forEach(c=>c.addEventListener("change",()=>{const cur=propById(id)||p;propSave(id,{tags:{...(cur.tags||{}),[c.dataset.prt]:c.checked}});}));
  v.querySelectorAll("[data-prst]").forEach(b=>b.addEventListener("click",()=>propSave(id,{status:b.dataset.prst})));
  v.querySelectorAll("[data-prjump]").forEach(b=>b.addEventListener("click",()=>{const el=document.getElementById("pr-"+b.dataset.prjump);if(el){el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});const ta=el.querySelector("textarea");if(ta)setTimeout(()=>ta.focus({preventScroll:true}),350);}}));
}
function propAct(a,id,el){const p=S.prop?propById(S.prop):null;
  const H={
    "prop-new":()=>propNew(),"prop-example":()=>propExample(),
    "prop-request":()=>copyText(propRequestText(),"Request copied. Paste it into your reply."),
    "prop-f":()=>{S.pf2=el.dataset.v;render();},
    "prop-open":()=>goProp(id),"prop-back":()=>{S.prop=null;render();window.scrollTo({top:0});},
    "prop-summary":()=>p&&copyText(propSummary(p),"Summary copied. Paste it into an email to the exec team."),
    "prop-ask":()=>{if(!p)return;if(!propScore(p).missing.length){toast("All 8 parts are answered");return;}copyText(propAskText(p),"Email copied. Paste it into your reply.");if((p.status||"new")!=="info")propSave(p.id,{status:"info"});},
    "prop-ai":()=>p&&propAI(p),
    "prop-useai":()=>{if(!p)return;const r={...(p.r||{})};let n=0;PROP_KEYS.forEach(k=>{const x=(p.ai||{})[k];if(x&&(r[k]===undefined||r[k]===""||r[k]===null)){r[k]=x.r;n++;}});if(!n){toast("Every part already has your rating");return;}propSave(p.id,{r,status:(p.status||"new")==="new"?"review":p.status}).then(ok=>ok&&toast(`Used ${n} AI rating${n===1?"":"s"}. Change any you disagree with.`));},
    "prop-ev":async()=>{if(!p)return;if(!p.date){toast("Add the first date under The basics first");const d=$("#prf-date");if(d){d.scrollIntoView({block:"center"});d.focus();}return;}
      const tg=p.tags||{};const eid=uid("e");const ok=await write("added",eid,{kind:"event",name:p.title||(propName(p)+" program"),date:p.date,time:p.time||"",venue:ME().place,town:ME().town,address:"",host:propName(p)+(p.contact_name?", "+p.contact_name:""),event_type:"Partner program",can_table:null,url:"",why:("Partner proposal ("+(p.pillar||"pillar not picked")+"). "+propText(p,"s2")).slice(0,400),community:tg.blead?["Black"]:[],priority:"Medium",createdAt:todayISO()});
      if(ok){await propSave(p.id,{eventId:eid});toast("Added to Events");}},
    "prop-ev-open":()=>p&&openDetail(p.eventId),
    "prop-t":async()=>{if(!p)return;const tg=p.tags||{};const tid=uid("t");const ok=await write("added",tid,{kind:"target",name:propName(p),type:"Organization",subtype:"Sent a program proposal",lane:tg.charter&&!tg.blead?"Charters & leaders":"B-LEAD",priority:"Medium",contact_name:p.contact_name||"",role:"",phone:p.phone||"",email:p.email||"",town:"",address:"",website:"",why:"Sent LEAD a program proposal"+(p.received?" on "+fmtDate(p.received,true):"")+(p.title?": "+p.title:""),community:tg.blead?["Black"]:["General"],createdAt:todayISO()});
      if(ok){await propSave(p.id,{targetId:tid});toast("Added to People & orgs");}},
    "prop-t-open":()=>p&&openDetail(p.targetId),
    "prop-del":async()=>{if(!p)return;if(!el.dataset.armed){el.dataset.armed="1";el.textContent="Tap again to delete";return;}const ok=await remove("proposals",p.id);if(ok){S.proposals=S.proposals.filter(x=>x.id!==p.id);S.prop=null;render();toast("Deleted");}}
  };return H[a];}
function goProp(id){S.prop=id;go("proposals",true);window.scrollTo({top:0});}

/* ============ views (Exec / Coordinator / Assistant Coordinator / Canvasser) ============ */
const VIEWS={
  exec:{label:"Exec",hide:["tasks","team","log","hours","settings"]},
  coord:{label:"Coordinator",hide:["hours"]},
  asst:{label:"Assistant Coordinator",hide:[]},
  canv:{label:"Canvasser",hide:["center","ready","sig","blead","proposals","tasks","people","board","org","meetings","log","hours","settings"]}
};
const VIEW_ORDER=["exec","coord","asst","canv"];
const VIEW_NOTE={
  exec:"Exec view (preview). Same data underneath, showing the big-picture pages. Which numbers an exec wants, and how each is calculated, is still the open question.",
  coord:"Coordinator view (preview). Everything the assistant coordinator sees, minus their hours and invoices.",
  canv:"Canvasser view (preview). The script, the map, events, the team log, programs and the culture guides."
};
const VKEY="lead_hub_view"+(FB?":"+FB.email:"");
S.view=(()=>{try{const v=localStorage.getItem(VKEY);return VIEWS[v]?v:"asst";}catch(e){return "asst";}})();
function tabOK(t){return !(VIEWS[S.view]||VIEWS.asst).hide.includes(t);}
function viewSelect(cls){return `<div class="viewsw ${cls||""}"><label>View</label><select data-viewsel aria-label="Switch view">${(FB?FB.views:VIEW_ORDER).map(k=>`<option value="${k}" ${S.view===k?"selected":""}>${VIEWS[k].label}</option>`).join("")}</select></div>`;}
function applyView(){
  document.documentElement.dataset.view=S.view;
  document.querySelectorAll(".appstrip [data-tab]").forEach(b=>{if(b.dataset.tab==="more")return;b.hidden=!tabOK(b.dataset.tab);});
  document.querySelectorAll(".appstrip .grp").forEach(gr=>{let n=gr.nextElementSibling,any=false;while(n&&!n.classList.contains("grp")&&!n.classList.contains("foot")){if(n.dataset&&n.dataset.tab&&!n.hidden)any=true;n=n.nextElementSibling;}gr.hidden=!any;});
  document.querySelectorAll("[data-viewsel]").forEach(s=>{s.value=S.view;});
}
function setView(v){if(FB&&!FB.views.includes(v))v=FB.views[0];if(!VIEWS[v])v="asst";S.view=v;try{localStorage.setItem(VKEY,v);}catch(e){}applyView();closeOverlay();if(!tabOK(S.tab))go("home");else render();toast(VIEWS[v].label+" view");}
function viewBanner(){if(FB&&!FB.owner)return "";return S.view!=="asst"&&VIEW_NOTE[S.view]?`<div class="note viewnote">${esc(VIEW_NOTE[S.view])}</div>`:"";}
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-viewsel]");if(s)setView(s.value);});

/* ============ cultures ============ */
const CU_G=CU.guides,CU_BY=Object.fromEntries(CU_G.map(g=>[g.key,g])),CU_KEYS=CU_G.map(g=>g.key),CU_LATIN=["PR","DR","MEX","COL","ECO","PER"];
const CU_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const CU_LV={family:"Family",work:"Work",adult:"Adult",no:"No"};
const CU_LVHELP={family:"Anyone, kids present",work:"Adults; mild themes, no profanity",adult:"Not for LEAD events",no:"Never"};
const CU_TOPICS=[
  {group:"The basics",items:[["quick","Quick picture",1,null],["history","History",2,null],["ct-history","Connecticut history",2,/connecticut/i]]},
  {group:"Daily life",items:[["family","Family and respect",3,/family/i],["faith","Faith",3,/faith/i],["gather","Where people gather",3,/gather/i],["food","Food",3,/^food/i],["sports","Sports",3,/sports/i],["talk","Talking and phrases",3,/talking/i],["school","Education goals",3,/education/i],["avoid","Things to avoid",3,/avoid/i]]},
  {group:"Music",items:[["genres","Genres",4,/genres/i],["eras","Big names by era",4,/big names/i],["party","Family party vs. club",4,/what plays/i],["dances","Dances",4,/dances/i],["content","Content watch",4,/content/i],["songs","Starter playlist",8,null]]},
  {group:"People and place",items:[["calendar","Celebrations",3,/celebrations/i],["media","Media figures",5,null],["inct","In Connecticut",6,null],["center","At the LEAD center",7,null],["sources","Sources",9,null]]}
];
const CU_TOPIC=Object.fromEntries(CU_TOPICS.flatMap(g=>g.items.map(([id,label,n,re])=>[id,{id,label,n,re}])));
const CU_CITIES=["Hartford","East Hartford","New Britain","New Haven","Bridgeport","Waterbury","Danbury","Norwich"];
const CU_CITYSEL=[["area","Hartford + East Hartford"],["all","All LEAD cities"]].concat(CU_CITIES.map(c=>[c,c])).concat([["none","Guide dates only"],["off","Hide celebrations"]]);
const CU_KEY="lead_hub_cu";
S.cu=(()=>{let o={};try{o=JSON.parse(localStorage.getItem(CU_KEY)||"{}")||{};}catch(e){o={};}
  return {view:"home",guide:"B",sub:"",hl:"",q:"",pq:"",topic:CU_TOPIC[o.topic]?o.topic:"calendar",tk:Array.isArray(o.tk)?o.tk:CU_KEYS.slice(),ck:Array.isArray(o.ck)?o.ck:CU_KEYS.concat(["LAT","MULTI"]),pk:Array.isArray(o.pk)?o.pk:CU_KEYS.slice(),plv:o.plv||"all",city:CU_CITYSEL.some(x=>x[0]===o.city)?o.city:"area",chk:o.chk!==false,from:o.from||"now"};})();
function cuSave(){const c=S.cu;try{localStorage.setItem(CU_KEY,JSON.stringify({topic:c.topic,tk:c.tk,ck:c.ck,pk:c.pk,plv:c.plv,city:c.city,chk:c.chk,from:c.from}));}catch(e){}}

const cuStripes=g=>g.stripes.map(([c,w])=>`<i style="background:${c};flex:${w}"></i>`).join("");
const cuKC=k=>CU_BY[k]?`--kc:var(--k-${k})`:"--kc:var(--muted)";
const cuName=k=>CU_BY[k]?CU_BY[k].name:k==="LAT"?"Latino":k==="MULTI"?"Multicultural":k;
const cuChip=k=>`<span class="kchip" style="${cuKC(k)}">${esc(cuName(k))}</span>`;
const cuBtn=(k,label,sub)=>`<button class="kchip" data-cu="${k}"${sub?` data-cusub="${sub}"`:""} style="${cuKC(k)}">${esc(label||cuName(k))}</button>`;
const cuFold=s=>String(s||"").normalize("NFKD").replace(/[̀-ͯ]/g,"").toLowerCase();
const cuSecOf=(g,n)=>g.secs.find(s=>s.n===n);
function cuTopicHTML(g,t){const s=cuSecOf(g,t.n);if(!s)return "";if(!t.re)return (s.pre||"")+s.subs.map(x=>`<h3>${esc(x.title)}</h3>${x.html}`).join("");return s.subs.filter(x=>t.re.test(x.title)).map(x=>x.html).join("");}
function cuCalSub(k){const g=CU_BY[k],s=g&&cuSecOf(g,3);if(!s)return "";const j=s.subs.findIndex(x=>/celebrations/i.test(x.title));return j<0?"s3":"s3-"+j;}

/* which culture guides a hub contact belongs to */
function cuKeysFor(r){
  const txt=[r.name,r.subtype,r.type,r.why,r.reach,r.notes].filter(Boolean).join(" ");
  const out=new Set();
  const pats=[["PR",/puerto ric|boricua/i],["DR",/dominican/i],["BR",/brazil/i],["MEX",/mexic/i],["COL",/colombia/i],["ECO",/ecuador/i],["PER",/\bperu|peruvian/i],["B",/haiti|jamaic|caribbean|west indian|african|nigeria|ghana|liberia|cape verd|black|naacp|\bAME\b/i]];
  pats.forEach(([k,re])=>{if(re.test(txt))out.add(k);});
  const com=r.community||[];
  if(com.some(c=>/black|west indian|african|caribbean/i.test(c)))out.add("B");
  if(com.some(c=>/latino|hispanic/i.test(c))&&!CU_LATIN.some(k=>out.has(k))&&!out.has("BR"))CU_LATIN.forEach(k=>out.add(k));
  return CU_KEYS.filter(k=>out.has(k));
}
function cuPeople(k){return allT().filter(t=>cuKeysFor(t).includes(k));}

/* ---------- dates: turn guide "when" text into real days ---------- */
const CU_MI={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
const CU_DW={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
const cuISO=(y,m,d)=>{const x=new Date(y,m-1,d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0");};
function cuNthDow(y,m,n,dw){if(n>0){const f=new Date(y,m-1,1).getDay();return cuISO(y,m,1+((dw-f+7)%7)+7*(n-1));}const last=new Date(y,m,0);return cuISO(y,m,last.getDate()-((last.getDay()-dw+7)%7));}
function cuWhen(when,y){
  const w=String(when||"").toLowerCase().replace(/\s+/g," ").trim();
  const yr=w.match(/\b(20\d\d)\b/);if(yr&&+yr[1]!==y)return null;
  if(/^thanksgiving/.test(w))return {s:cuNthDow(y,11,4,4)};
  let m=w.match(/^(\d)(?:st|nd|rd|th) (sun|mon|tue|wed|thu|fri|sat)[a-z]*\.? (?:of )?([a-z]{3})/);
  if(m&&CU_MI[m[3]])return {s:cuNthDow(y,CU_MI[m[3]],+m[1],CU_DW[m[2]])};
  m=w.match(/^last (sun|mon|tue|wed|thu|fri|sat)[a-z]* (?:of )?([a-z]{3})/);
  if(m&&CU_MI[m[2]])return {s:cuNthDow(y,CU_MI[m[2]],-1,CU_DW[m[1]])};
  m=w.match(/^([a-z]+)\.? (\d{1,2})\b(?:\s*[–-]\s*(?:([a-z]+)\.? )?(\d{1,2})\b)?/);
  if(m){const mo=CU_MI[m[1].slice(0,3)];if(!mo)return null;const out={s:cuISO(y,mo,+m[2])};if(m[4]){const mo2=m[3]?CU_MI[m[3].slice(0,3)]:mo;if(mo2)out.e=cuISO(mo2<mo?y+1:y,mo2,+m[4]);}return out;}
  return null;
}
const CU_YC={};
function cuYear(y){if(CU_YC[y])return CU_YC[y];const L=[];CU.cal.forEach((c,i)=>{const r=cuWhen(c.when,y);if(r)L.push({id:"g"+i,k:[c.k],name:c.what,s:r.s,e:r.e||""});});return CU_YC[y]=L;}
function cuCityOK(city,sel){if(sel==="all")return true;if(sel==="area")return city==="Hartford"||city==="East Hartford";if(sel==="none"||sel==="off")return false;return city===sel;}
function celebsOn(d){
  const sel=S.cu.city;if(sel==="off"||!d)return [];const y=+d.slice(0,4);
  const g=cuYear(y).filter(x=>x.s===d).map(x=>({id:x.id,k:x.k,name:x.name+(x.e?" (to "+fmtDate(x.e)+")":"")}));
  const c=CELEB.map((x,i)=>({x,i})).filter(o=>o.x.date===d&&cuCityOK(o.x.city,sel)).map(o=>({id:"c"+o.i,k:o.x.communities||[],name:o.x.name+" · "+o.x.city}));
  return c.concat(g);
}
function celebsLoose(y,m){
  const sel=S.cu.city;if(sel==="off")return [];const exact=new Set(cuYear(y).map(x=>x.id));
  const g=CU.cal.map((c,i)=>({c,i})).filter(o=>o.c.m===m&&!exact.has("g"+o.i)).map(o=>({id:"g"+o.i,k:[o.c.k],name:o.c.what,when:o.c.when}));
  const c=CELEB.map((x,i)=>({x,i})).filter(o=>!o.x.date&&+o.x.month===m&&cuCityOK(o.x.city,sel)).map(o=>({id:"c"+o.i,k:o.x.communities||[],name:o.x.name+" · "+o.x.city,when:o.x.date_text}));
  return c.concat(g);
}
function cuCellChips(d,max){const L=celebsOn(d);const n=max||3;return L.slice(0,n).map(x=>`<button class="cel" data-cel="${x.id}" style="${cuKC(x.k[0])}" title="${esc(x.name)}">✦ ${esc(x.name)}</button>`).join("")+(L.length>n?`<div class="more">+${L.length-n} celebrations</div>`:"");}
function cuWeekChips(d){return cuCellChips(d,2);}
function cuMonthStrip(y,m){const L=celebsLoose(y,m);const sel=S.cu.city;
  return `<div class="cu-strip"><span class="lbl">Celebrations</span><select data-celcity aria-label="Which cities' celebrations to show">${CU_CITYSEL.map(([v,l])=>`<option value="${v}" ${sel===v?"selected":""}>${esc(l)}</option>`).join("")}</select>${sel==="off"?"":L.length?`<span class="lbl">Sometime in ${CU_MONTHS[m-1]}:</span>${L.map(x=>`<button class="celx" data-cel="${x.id}" style="${cuKC(x.k[0])}" title="${esc(x.when||"")}">${esc(x.name)}</button>`).join("")}`:""}</div>`;}

function celebById(id){if(!id)return null;const n=+id.slice(1);if(id[0]==="g"){const c=CU.cal[n];return c?{src:"guide",k:[c.k],name:c.what,c}:null;}const x=CELEB[n];return x?{src:"city",k:x.communities||[],name:x.name,c:x}:null;}
function celebSheet(id){
  const it=celebById(id);if(!it)return;const c=it.c,kv=[];
  if(it.src==="guide"){kv.push(["When",esc(c.when)]);if(c.note)kv.push(["Note",esc(c.note)]);kv.push(["From","The "+esc(CU_BY[c.k].name)+" culture guide. Use it for any LEAD city with this community."]);}
  else{kv.push(["When",c.date?esc(fmtDate(c.date,true)):esc(c.date_text||"")+(c.date_status!=="confirmed"?' <span class="pill sand">date to confirm</span>':"")]);kv.push(["City",esc(c.city||"")]);
    if(c.venue||c.address)kv.push(["Where",esc([c.venue,c.address].filter(Boolean).join(", "))]);if(c.organizer)kv.push(["Organizer",esc(c.organizer)]);if(c.notes)kv.push(["Why go",esc(c.notes)]);
    if(c.url)kv.push(["Link",`<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.url.replace(/^https?:\/\/(www\.)?/,"").slice(0,64))}</a>`]);}
  const guides=it.k.filter(k=>CU_BY[k]);
  const canAdd=it.src==="city"&&c.date&&S.canWrite!==false&&tabOK("events");
  openSheet(it.name,`<div class="kv">${kv.map(([a,b])=>`<div>${a}</div><div>${b}</div>`).join("")}</div>${guides.length?`<div class="chips">${guides.map(k=>cuBtn(k,"Open the "+CU_BY[k].name+" guide",it.src==="guide"?cuCalSub(k):"")).join("")}</div>`:""}`,
    {btns:`${canAdd?`<button class="btn pri" id="celAdd">Add to Events</button>`:""}<button class="btn ghost" data-close="1">Close</button>`});
  const b=$("#celAdd");if(b)b.addEventListener("click",async()=>{const com=new Set();(c.communities||[]).forEach(k=>{if(k==="B")com.add("Black");else if(k==="MULTI")com.add("Multi");else com.add("Latino");});
    const ok=await write("added",uid("e"),{kind:"event",name:c.name,date:c.date,time:"",venue:c.venue||"",town:c.city||"",address:c.address||"",host:c.organizer||"",event_type:"Celebration",can_table:null,url:c.url||"",why:c.notes||"",community:[...com],priority:"Medium",createdAt:todayISO()});
    if(ok){closeOverlay();toast("Added to Events");}});
}

function cuGo(k,sub){closeOverlay();S.cu.view="guide";if(CU_BY[k])S.cu.guide=k;S.cu.sub=sub||"";if(S.tab!=="cultures")go("cultures");else{render();window.scrollTo({top:0});}}
document.addEventListener("click",e=>{
  const cel=e.target.closest("[data-cel]");if(cel){e.preventDefault();e.stopPropagation();celebSheet(cel.dataset.cel);return;}
  const cu=e.target.closest("[data-cu]");if(cu){e.preventDefault();e.stopPropagation();cuGo(cu.dataset.cu,cu.dataset.cusub||"");return;}
  const st=e.target.closest("a[data-stoprow]");if(st)e.stopPropagation();
},true);
document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const cel=e.target.closest&&e.target.closest("[data-cel][role=button]");if(cel){e.preventDefault();celebSheet(cel.dataset.cel);}});

/* ---------- the page ---------- */
function rCultures(){
  const c=S.cu;const nav=[["home","Communities"],["guide","Guides"],["topics","Topics"],["calendar","Celebrations"],["playlist","Playlist"]];
  const body=({home:cuHome,guide:cuGuide,topics:cuTopics,calendar:cuCal,playlist:cuPlay})[c.view]||cuHome;
  return `<div class="cu ${c.chk?"":"nochk"}">
  <div class="subnav cu-nav">${nav.map(([k,l])=>`<button data-cuv="${k}" aria-pressed="${c.view===k}">${l}</button>`).join("")}</div>
  <div class="toolrow cu-tools"><input type="search" id="cuQ" placeholder="Search all eight guides and the city celebrations" value="${esc(c.q)}" autocomplete="off" aria-label="Search the culture guides"><span class="sp"></span><label class="cu-chk"><input type="checkbox" id="cuChk" ${c.chk?"checked":""}> Show "check" marks</label></div>
  <div id="cuRes"></div>
  ${body()}</div>`;
}
function cuHome(){
  return `<p class="muted small" style="margin:2px 0 12px">Eight culture guides for LEAD: history, faith, food, music, the calendar, and how to show up. Open one community, read one topic across all eight, or see every celebration by city. Sand <mark class="chk">check</mark> marks are facts still to verify.</p>
  <div class="cu-banner">${CU_G.map(g=>`<button class="band" data-cu="${g.key}" aria-label="Open the ${esc(g.name)} guide">${cuStripes(g)}</button>`).join("")}</div>
  <div class="cu-comms">${CU_G.map(g=>{const n=cuPeople(g.key).length;const cc=CELEB.filter(x=>(x.communities||[]).includes(g.key)).length;
    return `<button class="cu-comm" data-cu="${g.key}" style="${cuKC(g.key)}"><span class="flagbar">${cuStripes(g)}</span><span class="txt"><b>${esc(g.name)}</b><span class="ppl">${esc(g.people)}</span><span class="ln">${esc(g.line)}</span><span class="cu-dates">${g.dates.map(d=>`<span>${esc(d.replace(" · "," — "))}</span>`).join("")}</span><span class="meta">${n} people &amp; orgs in the hub · ${cc} celebrations in LEAD cities</span></span></button>`;}).join("")}</div>`;
}
function cuGuide(){
  const g=CU_BY[S.cu.guide]||CU_G[0];const i=CU_G.indexOf(g),prev=CU_G[(i+CU_G.length-1)%CU_G.length],next=CU_G[(i+1)%CU_G.length];
  const ppl=cuPeople(g.key);
  const cel=CELEB.map((x,j)=>({x,id:"c"+j})).filter(o=>(o.x.communities||[]).includes(g.key)).sort((a,b)=>CU_CITIES.indexOf(a.x.city)-CU_CITIES.indexOf(b.x.city)||((a.x.date||"")+String(a.x.month).padStart(2,"0")).localeCompare((b.x.date||"")+String(b.x.month).padStart(2,"0")));
  const byCity={};cel.forEach(o=>(byCity[o.x.city]=byCity[o.x.city]||[]).push(o));
  const toc=g.secs.map(s=>`<a class="sec" href="#" data-cujump="s${s.n}">${esc(s.title)}</a>${s.subs.map((x,j)=>`<a class="sub" href="#" data-cujump="s${s.n}-${j}">${esc(x.title)}</a>`).join("")}`).join("")+(cel.length?`<a class="sec" href="#" data-cujump="cities">In LEAD cities</a>`:"");
  return `<div class="cu-switch">${CU_G.map(x=>`<button data-cu="${x.key}" aria-pressed="${x.key===g.key}" style="${cuKC(x.key)}"><span class="sw">${cuStripes(x)}</span>${esc(x.name)}</button>`).join("")}</div>
  <div class="cu-ghead" style="${cuKC(g.key)}"><span class="flagbar">${cuStripes(g)}</span><div><h2 class="cu-h">${esc(g.name)}</h2><div class="ppl">${esc(g.people)}</div><p>${esc(g.line)}</p><div class="cu-dates">${g.dates.map(d=>`<span>${esc(d.replace(" · "," — "))}</span>`).join("")}</div>
    <div class="chips" style="margin-top:10px"><button class="btn sm" data-cupeople="${g.key}">${ppl.length} people &amp; orgs in the hub</button><button class="btn sm" data-cuv="calendar" data-cuk="${g.key}">${esc(g.name)} celebrations</button><button class="btn sm ghost" data-cubranch="1">LEAD branches in the Playbook</button></div></div></div>
  <div class="cu-body" style="${cuKC(g.key)}">
    <nav class="cu-toc" aria-label="Sections">${toc}</nav>
    <select class="cu-tocsel" id="cuTocSel" aria-label="Jump to a section">${g.secs.map(s=>`<option value="s${s.n}">${esc(s.title)}</option>${s.subs.map((x,j)=>`<option value="s${s.n}-${j}">   ${esc(x.title)}</option>`).join("")}`).join("")}${cel.length?`<option value="cities">In LEAD cities</option>`:""}</select>
    <article class="cu-read">
      ${g.secs.map(s=>`<section id="cu-s${s.n}"><h2>${esc(s.title)}</h2><div class="cu-prose">${s.pre||""}</div>${s.subs.map((x,j)=>`<div id="cu-s${s.n}-${j}"><h3>${esc(x.title)}</h3><div class="cu-prose">${x.html}</div></div>`).join("")}</section>`).join("")}
      ${cel.length?`<section id="cu-cities"><h2>Celebrations in LEAD cities</h2><p class="muted small">Found by searching each city LEAD is in. "Date to confirm" means the date comes from past years.</p>${Object.entries(byCity).map(([city,L])=>`<h3>${esc(city)}</h3><div class="rows">${L.map(o=>`<div class="row" data-cel="${o.id}" role="button" tabindex="0"><div><div class="n">${esc(o.x.name)}</div><div class="d">${esc(o.x.notes||"")}</div></div><div class="r wrap">${o.x.date?esc(fmtDate(o.x.date,true)):esc(o.x.date_text||CU_MONTHS[(+o.x.month||1)-1])}${o.x.date?"":'<br><span class="pill sand">to confirm</span>'}</div></div>`).join("")}</div>`).join("")}</section>`:""}
      <div class="cu-pager"><button class="btn" data-cu="${prev.key}">‹ ${esc(prev.name)}</button><button class="btn" data-cu="${next.key}">${esc(next.name)} ›</button></div>
    </article>
  </div>`;
}
function cuToggles(list,key,extra){const keys=CU_KEYS.concat(extra||[]);return `<div class="cu-tog"><span class="lbl">Communities</span>${keys.map(k=>`<button data-cutog="${key}" data-k="${k}" aria-pressed="${list.includes(k)}" style="${cuKC(k)}">${CU_BY[k]?`<span class="sw">${cuStripes(CU_BY[k])}</span>`:""}${esc(cuName(k))}</button>`).join("")}<button class="mini" data-cutog="${key}" data-k="*" data-all="${keys.join(",")}">${list.length>=keys.length?"Clear":"All"}</button></div>`;}
function cuTopics(){
  const t=CU_TOPIC[S.cu.topic]||CU_TOPIC.calendar;
  const blocks=CU_G.filter(g=>S.cu.tk.includes(g.key)).map(g=>{const h=cuTopicHTML(g,t);return `<div class="cu-block" style="${cuKC(g.key)}"><div class="who"><button data-cu="${g.key}" data-cusub="s${t.n}"><span class="bar">${cuStripes(g)}</span><b>${esc(g.name)}</b><span>${esc(g.people)}</span></button></div><div class="cu-prose">${h||'<p class="muted">This guide has no section on this topic.</p>'}</div></div>`;}).join("");
  return `<h2 class="cu-h2">${esc(t.label)}</h2><p class="muted small">One topic across the communities. Pick a topic, or switch communities on and off.</p>
  <div class="cu-tg">${CU_TOPICS.map(gr=>`<div><h3>${esc(gr.group)}</h3><div class="chips">${gr.items.map(([id,label])=>`<button class="chip" data-cutopic="${id}" aria-pressed="${id===t.id}">${esc(label)}</button>`).join("")}</div></div>`).join("")}</div>
  ${cuToggles(S.cu.tk,"tk")}<div>${blocks||'<p class="empty">Turn on at least one community.</p>'}</div>`;
}
function cuDayNum(x){if(x.date)return +x.date.slice(8,10);const m=String(x.when||"").match(/\b(\d{1,2})\b/);return m?+m[1]:40;}
function cuCal(){
  const c=S.cu,now=new Date().getMonth()+1;const order=c.from==="now"?[...Array(12)].map((_,i)=>((now-1+i)%12)+1):[...Array(12)].map((_,i)=>i+1);
  const keys=c.ck,sel=c.city==="off"?"none":c.city;
  const g=CU.cal.map((x,i)=>({id:"g"+i,m:x.m,when:x.when,k:[x.k],name:x.what,note:x.note})).filter(x=>keys.includes(x.k[0]));
  const ct=CELEB.map((x,i)=>({id:"c"+i,m:x.date?+x.date.slice(5,7):+x.month,when:x.date?fmtDate(x.date,true):(x.date_text||""),date:x.date,k:x.communities||[],name:x.name,note:x.notes,city:x.city,usual:!x.date})).filter(x=>cuCityOK(x.city,sel)&&x.k.some(k=>keys.includes(k)));
  const all=ct.concat(g);
  const months=order.map(m=>{const L=all.filter(x=>x.m===m).sort((a,b)=>cuDayNum(a)-cuDayNum(b));
    return `<div class="cu-month ${m===now?"now":""}"><h3>${CU_MONTHS[m-1]}${m===now?"<small>this month</small>":""}</h3><div>${L.map(x=>`<div class="cu-ev" data-cel="${x.id}" role="button" tabindex="0" style="${cuKC(x.k[0])}"><span class="when">${esc(x.when)}</span><span class="ks">${x.k.map(cuChip).join(" ")}</span><div><div class="what">${esc(x.name)}</div>${x.city?`<div class="note2"><b>${esc(x.city)}</b>${x.usual?' · <span class="pill sand">date to confirm</span>':""}</div>`:""}${x.note?`<div class="note2">${esc(x.note)}</div>`:""}</div></div>`).join("")||'<p class="muted small" style="margin:6px 0">Nothing for the communities and cities you picked.</p>'}</div></div>`;}).join("");
  return `<h2 class="cu-h2">Celebrations</h2><p class="muted small">The culture guides' dates for every community, plus the celebrations found in each city LEAD is in. Click one for details; dated city ones can go straight into Events.</p>
  <div class="toolrow"><select id="cuCity" aria-label="Which cities">${CU_CITYSEL.filter(x=>x[0]!=="off").map(([v,l])=>`<option value="${v}" ${sel===v?"selected":""}>${esc(l)}</option>`).join("")}</select><div class="chips"><button class="chip" data-cufrom="now" aria-pressed="${c.from==="now"}">Start from this month</button><button class="chip" data-cufrom="jan" aria-pressed="${c.from==="jan"}">January first</button></div><span class="sp"></span><span class="small muted">${all.length} dates</span></div>
  ${cuToggles(c.ck,"ck",["LAT","MULTI"])}<div class="cu-months">${months}</div>`;
}
function cuPlay(){
  const c=S.cu,q=cuFold(c.pq);const yt=s=>"https://www.youtube.com/results?search_query="+encodeURIComponent(s.t+" "+String(s.a).split(/\s*(?:&|,|feat\.|ft\.|\/)\s*/)[0]);
  const rows=CU.songs.filter(s=>c.pk.includes(s.k)&&(c.plv==="all"||s.lv===c.plv)&&(!q||cuFold(s.t+" "+s.a+" "+s.g+" "+s.n).includes(q)));
  const cnt=l=>CU.songs.filter(s=>c.pk.includes(s.k)&&s.lv===l).length;
  return `<h2 class="cu-h2">Starter playlists</h2><p class="muted small">The songs from the end of each guide, with the room each one fits. <span class="lv l-family">Family</span> anyone, kids present. <span class="lv l-work">Work</span> adults, mild themes. <span class="lv l-adult">Adult</span> not for LEAD events. <span class="lv l-no">No</span> never. For a timed mix, use the LEAD Mix Builder.</p>
  <div class="toolrow"><input type="search" id="cuPq" placeholder="Search songs, artists, genres" value="${esc(c.pq)}"><div class="chips">${[["all","All"],["family","Family "+cnt("family")],["work","Work "+cnt("work")],["adult","Adult "+cnt("adult")],["no","No "+cnt("no")]].map(([k,l])=>`<button class="chip" data-cuplv="${k}" aria-pressed="${c.plv===k}">${l}</button>`).join("")}</div><span class="sp"></span><span class="small muted">${rows.length} songs</span></div>
  ${cuToggles(c.pk,"pk")}
  <div class="cu-tw"><table class="cu-ptable"><thead><tr><th>Song</th><th>Community</th><th>Level</th><th>Year</th><th>Why</th><th></th></tr></thead><tbody>
  ${rows.map(s=>`<tr><td><div class="t">${esc(s.t)}</div><div class="muted small">${esc(s.a)}${s.g?" — "+esc(s.g):""}</div></td><td>${cuChip(s.k)}</td><td><span class="lv l-${s.lv}" title="${esc(CU_LVHELP[s.lv]||"")}">${CU_LV[s.lv]||esc(s.lv)}</span></td><td class="num">${esc(s.y||"")}</td><td class="small">${esc(s.n||"")}</td><td><a href="${yt(s)}" target="_blank" rel="noopener">Listen</a></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No songs match.</td></tr>'}
  </tbody></table></div>`;
}

/* ---------- search inside the guides ---------- */
let CU_IDX=null;
function cuIndex(){if(CU_IDX)return CU_IDX;CU_IDX=[];const tmp=document.createElement("div");
  for(const g of CU_G)for(const s of g.secs){if(s.pre){tmp.innerHTML=s.pre;CU_IDX.push({k:g.key,sec:s.title,sub:null,id:"s"+s.n,text:tmp.textContent});}s.subs.forEach((x,j)=>{tmp.innerHTML=x.html;CU_IDX.push({k:g.key,sec:s.title,sub:x.title,id:"s"+s.n+"-"+j,text:tmp.textContent});});}
  CU_IDX.forEach(it=>it.f=cuFold(it.text));return CU_IDX;}
function cuSearch(raw){const box=$("#cuRes");if(!box)return;S.cu.q=raw;const q=cuFold(raw.trim());if(q.length<2){box.innerHTML="";return;}
  const hits=[];for(const it of cuIndex()){let i=it.f.indexOf(q);if(i<0)continue;let n=0,j=i;while(j>=0){n++;j=it.f.indexOf(q,j+q.length);}hits.push({it,i,n});}hits.sort((a,b)=>b.n-a.n);
  const cel=CELEB.map((x,i)=>({x,i})).filter(o=>cuFold([o.x.name,o.x.city,o.x.notes,o.x.venue,o.x.organizer].join(" ")).includes(q)).slice(0,8);
  const total=hits.reduce((a,h)=>a+h.n,0);
  box.innerHTML=`<div class="cu-hits"><div class="hd">${total||cel.length?`${total} mention${total===1?"":"s"} in ${hits.length} section${hits.length===1?"":"s"}${cel.length?`, ${cel.length} city celebration${cel.length===1?"":"s"}`:""}`:"No matches. Try a shorter word or a different spelling."}<button class="btn sm ghost" id="cuResX">Close</button></div>
  ${cel.map(o=>`<button data-cel="c${o.i}"><div class="where">${(o.x.communities||[]).map(cuChip).join(" ")}<span>${esc(o.x.city)} · ${esc(o.x.date?fmtDate(o.x.date,true):o.x.date_text||"")}</span></div><div class="snip">${esc(o.x.name)}</div></button>`).join("")}
  ${hits.slice(0,30).map(h=>{const t=h.it.text,a=Math.max(0,h.i-70),b=Math.min(t.length,h.i+q.length+90);const snip=(a>0?"…":"")+esc(t.slice(a,h.i))+"<mark>"+esc(t.slice(h.i,h.i+q.length))+"</mark>"+esc(t.slice(h.i+q.length,b))+(b<t.length?"…":"");
    return `<button data-cuhit="${h.it.k}|${h.it.id}"><div class="where">${cuChip(h.it.k)}<span>${esc(h.it.sec)}${h.it.sub?" › "+esc(h.it.sub):""}</span>${h.n>1?`<span class="muted">${h.n}×</span>`:""}</div><div class="snip">${snip}</div></button>`;}).join("")}</div>`;
  box.querySelectorAll("[data-cuhit]").forEach(b=>b.addEventListener("click",()=>{const [k,id]=b.dataset.cuhit.split("|");S.cu.view="guide";S.cu.guide=k;S.cu.sub=id;S.cu.hl=raw.trim();S.cu.q="";render();}));
  const x=$("#cuResX");if(x)x.addEventListener("click",()=>{S.cu.q="";box.innerHTML="";const i=$("#cuQ");if(i)i.value="";});
}
function cuHighlight(el,q){if(!el||!q)return;const fq=cuFold(q);const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);let first=null;
  for(const n of nodes){const f=cuFold(n.nodeValue);const i=f.indexOf(fq);if(i<0||n.parentNode.closest("mark"))continue;try{const r=document.createRange();r.setStart(n,i);r.setEnd(n,Math.min(n.nodeValue.length,i+q.length));const m=document.createElement("mark");m.className="hit";r.surroundContents(m);if(!first)first=m;}catch(e){}}
  if(first)first.scrollIntoView({block:"center"});}

/* ---------- wiring ---------- */
function cuBindAll(v){
  const cc=v.querySelector("[data-celcity]");if(cc)cc.addEventListener("change",()=>{S.cu.city=cc.value;cuSave();render();});
  if(S.tab!=="cultures")return;
  const c=S.cu;
  v.querySelectorAll("[data-cuv]").forEach(b=>b.addEventListener("click",()=>{c.view=b.dataset.cuv;if(b.dataset.cuk){c.ck=[b.dataset.cuk];cuSave();}c.sub="";render();window.scrollTo({top:0});}));
  v.querySelectorAll("[data-cutopic]").forEach(b=>b.addEventListener("click",()=>{c.topic=b.dataset.cutopic;cuSave();render();}));
  v.querySelectorAll("[data-cutog]").forEach(b=>b.addEventListener("click",()=>{const key=b.dataset.cutog,k=b.dataset.k;let list=c[key];
    if(k==="*"){const all=b.dataset.all.split(",");list=list.length>=all.length?[]:all;}else list=list.includes(k)?list.filter(x=>x!==k):list.concat([k]);c[key]=list;cuSave();render();}));
  v.querySelectorAll("[data-cuplv]").forEach(b=>b.addEventListener("click",()=>{c.plv=b.dataset.cuplv;cuSave();render();}));
  v.querySelectorAll("[data-cufrom]").forEach(b=>b.addEventListener("click",()=>{c.from=b.dataset.cufrom;cuSave();render();}));
  v.querySelectorAll("[data-cupeople]").forEach(b=>b.addEventListener("click",()=>{S.pf={...S.pf,comm:b.dataset.cupeople==="B"?"Black":"Latino",q:""};go("people");}));
  v.querySelectorAll("[data-cubranch]").forEach(b=>b.addEventListener("click",()=>{S.pb="howto";S.pbLane="";S.pbStatus="";go("playbook");setTimeout(()=>{const p=S.playbook.find(x=>/branch/i.test(x.title||""));const el=p&&document.querySelector(`.entry[data-id="${p.id}"]`);if(el){el.scrollIntoView({block:"center"});el.classList.add("cu-flash");}},60);}));
  const city=$("#cuCity");if(city)city.addEventListener("change",()=>{c.city=city.value;cuSave();render();});
  const chk=$("#cuChk");if(chk)chk.addEventListener("change",()=>{c.chk=chk.checked;cuSave();const w=v.querySelector(".cu");if(w)w.classList.toggle("nochk",!c.chk);});
  const q=$("#cuQ");if(q){q.addEventListener("input",()=>cuSearch(q.value));q.addEventListener("keydown",e=>{if(e.key==="Escape"){q.value="";cuSearch("");}if(e.key==="Enter"){const f=$("#cuRes [data-cuhit], #cuRes [data-cel]");if(f)f.click();}});if(c.q)cuSearch(c.q);}
  const pq=$("#cuPq");if(pq)pq.addEventListener("input",()=>{c.pq=pq.value;const pos=pq.selectionStart;render();const n=$("#cuPq");if(n){n.focus();n.setSelectionRange(pos,pos);}});
  const jump=id=>{const el=document.getElementById("cu-"+id);if(el){el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});el.classList.remove("cu-flash");void el.offsetWidth;el.classList.add("cu-flash");}};
  v.querySelectorAll("[data-cujump]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();jump(a.dataset.cujump);}));
  const ts=$("#cuTocSel");if(ts)ts.addEventListener("change",()=>jump(ts.value));
  if(c.view==="guide"&&(c.sub||c.hl)){const sub=c.sub,hl=c.hl;c.sub="";c.hl="";setTimeout(()=>{const el=sub&&document.getElementById("cu-"+sub);if(el){el.scrollIntoView();el.classList.add("cu-flash");}if(hl)cuHighlight(el||v.querySelector(".cu-read"),hl);},30);}
}

/* ============ B-LEAD deep dive (added Oct 26, 2026) ============
   New leads, events and visiting speakers from the Oct 26 research pass.
   Everything here is layered on REF the same way the Oct 20 additions were:
   records are pushed into REF.TARGETS / REF.EVENTS so statuses, notes, search,
   map and the detail drawer keep working; this page is just a focused view. */

const BL_LANES=["Faith","Civic & Youth","Business","Creators","Education","Media & Culture","Education Sector","Podcast"];
const BL_LC={"Faith":"#7442d6","Civic & Youth":"#2f9e44","Business":"#e8870f","Education":"#2f6fe0","Media & Culture":"#b8246a","Creators":"#d6336c","Education Sector":"#0e7a6f","Podcast":"#a87a00"};
const BL_PRI={A:"High",B:"Medium",C:"Low"};
(function(){
  Object.assign(REF.CENTROIDS,BL.centroids||{});
  for(const [id,p] of Object.entries(BL.patch||{})){const t=REF.TARGETS.find(x=>x.id===id);if(!t)continue;for(const [k,v] of Object.entries(p)){if(k==="bl"){t.bl=v;continue;}if(v&&!t[k])t[k]=v;}}
  REF.TARGETS.push(...BL.leads);
  REF.EVENTS.push(...BL.events);
  TITLES.blead="B-LEAD deep dive";PAGE_CONTEXT.blead="Black community & education network";
})();
S.bl={tab:"over",lane:"",pri:"",status:"",charter:"",town:"",verify:false,isnew:"",q:"",edpoc:false,edq:"",edlane:"",vm:"",vfit:"",vq:"",evcat:"",evth:"",evq:"",pq:""};
function blAll(){return allT().filter(t=>t.bl);}
function blEv(){return allE().filter(e=>e.bl26&&!e.visit);}
function blVis(){return allE().filter(e=>e.visit);}
function blLaneDot(l){return `<span class="dot" style="background:${BL_LC[l]||"var(--muted)"}"></span>`;}
function blLanePill(l){return `<span class="kchip" style="--kc:${BL_LC[l]||"var(--muted)"}">${esc(l)}</span>`;}
function blPriPill(p){return `<span class="pill ${p==="A"?"orange":p==="B"?"blue":"grey"}">${p==="A"?"A · go first":p==="B"?"B":"C"}</span>`;}
function blCharter(c){if(!c||c==="Unknown")return `<span class="muted small">unknown</span>`;const cls=/Support/.test(c)?"green":/Skeptic|Oppos/.test(c)?"red":"sand";return `<span class="pill ${cls}">${esc(c)}</span>`;}
function blFlags(x){const b=x.bl||{},v=x.visit||{};const out=[];if(x.thai)out.push(`<span class="pill red">Away window</span>`);if(x.hold||b.hold||v.hold)out.push(`<span class="pill orange">hold until Nov 3</span>`);if(b.verify)out.push(`<span class="pill sand">verify</span>`);if(x.tbc)out.push(`<span class="pill sand">date not confirmed</span>`);if(x.isnew===false||(b.enriched))out.push(`<span class="pill grey">already in hub · enriched</span>`);return out.join(" ");}
function blSrc(u){return u?` <a class="lnk" href="${esc(u)}" target="_blank" rel="noopener" data-stop="1">source ↗</a>`:"";}
function blFirst(n){return (n||"").replace(/^(Rev\.|Dr\.|Pastor|Bishop|Elder|Min\.|Imam|Hon\.)\s+/i,"").split(/[,—–-]/)[0].trim().split(" ")[0];}
function blLeadsFiltered(){const f=S.bl;let L=blAll();const q=(f.q||"").toLowerCase();
  return L.filter(t=>{const b=t.bl;return (!f.lane||b.lane===f.lane||(b.lanes||[]).includes(f.lane))&&(!f.pri||b.pri===f.pri)&&(!f.status||t.status===f.status)&&(!f.charter||(f.charter==="Known"?(b.charter&&b.charter!=="Unknown"):b.charter===f.charter))&&(!f.town||townOf(t)===f.town)&&(!f.verify||b.verify)&&(!f.isnew||(f.isnew==="new"?!b.enriched:b.enriched))&&(!q||[t.name,t.subtype,t.contact_name,t.role,t.town,b.angle,b.programs,t.why,t.email,b.org,b.title,b.show].join(" ").toLowerCase().includes(q));})
   .sort((a,b)=>{const p={A:0,B:1,C:2};const x=p[a.bl.pri]??3,y=p[b.bl.pri]??3;if(x!==y)return x-y;const s=STATUSES.indexOf(a.status)-STATUSES.indexOf(b.status);if(s)return s;return a.name.localeCompare(b.name);});}
function blIsEdu(t){const b=t.bl||{};return b.lane==="Education"||b.lane==="Education Sector"||(b.lanes||[]).some(l=>/Education/.test(l))||t.type==="School"||t.type==="Education Leader";}
function blPodcasts(){return blAll().filter(t=>t.bl.lane==="Podcast"||(t.bl.lanes||[]).includes("Podcast"));}
function blPitch(t){const b=t.bl||{};const who=t.contact_name?blFirst(t.contact_name):"there";const show=b.show||t.name;
  return `Subject: A conversation for ${show} – LEAD, Connecticut\n\nHi ${who},\n\nI'm ${ME().name} with LEAD, Leaders for Educational Advocacy and Diversity, a parent-founded nonprofit in East Hartford, Connecticut. We run free family programs (financial literacy, citizenship, educational options) and we're building B-LEAD, our network in Greater Hartford's Black community.\n\n${b.angle?b.angle.replace(/\s+$/,"")+"\n\n":""}Two ideas: a short recorded conversation for our weekly video, or one of our parent leaders as a guest on ${show}. Happy to work around your format.\n\nWhat are your thoughts?\n\n${SIGN_LINES()}\n`;}
function blInvite(e){const v=e.visit||{};const who=blFirst(v.person)||"there";
  return `Subject: While you're in Connecticut – LEAD, East Hartford\n\nHi ${who},\n\nI'm ${ME().name} with LEAD, Leaders for Educational Advocacy and Diversity, a parent-founded nonprofit in East Hartford, Connecticut. I saw you'll be at ${e.venue||e.town||"the event"}${e.date?" on "+fmtDate(e.date,true):""}${v.event_name?" for "+v.event_name:""}.\n\nWe run free family programs and are building B-LEAD, our network in Greater Hartford's Black community. ${v.why?v.why.replace(/\s+$/,"")+" ":""}\n\nWould you have 20 minutes while you're here, or a short recorded conversation for our weekly video? Happy to work around your schedule.\n\nWhat are your thoughts?\n\n${SIGN_LINES()}\n`;}
function blStrip(){const L=blAll(),E=blEv(),V=blVis();const A=L.filter(t=>t.bl.pri==="A").length,edu=L.filter(blIsEdu),eduPoc=edu.filter(t=>t.bl.poc!==false).length,pods=blPodcasts().length,ver=L.filter(t=>t.bl.pri==="A"&&t.bl.verify).length,champ=L.filter(t=>t.status==="Champion"||t.status==="Supporter").length,touched=L.filter(t=>t.status!=="Prospect").length;
  const tile=(n,l,tab,cls)=>`<div class="${cls||""}" data-bl="${tab}"><b>${n}</b><span>${l}</span></div>`;
  return `<div class="strip" style="grid-template-columns:repeat(4,minmax(0,1fr))">${tile(L.length,"leads in the deep dive","leads")}${tile(A,"A priority · go first","leads","warnv")}${tile(`${eduPoc}<small style="font-size:13px;color:var(--muted)"> / 50</small>`,"education contacts, people of color","edu",eduPoc>=50?"okv":"")}${tile(pods,"podcast hosts","pod")}${tile(V.length,"people visiting CT","visit")}${tile(E.length,"events through Mar 2027","ev")}${tile(touched,"reached so far","leads",touched?"okv":"")}${tile(ver,"A rows: confirm the name first","leads",ver?"warnv":"")}</div>`;}
function blPipe(){const L=blAll();const c={};STATUSES.forEach(s=>c[s]=0);L.forEach(t=>c[t.status]=(c[t.status]||0)+1);const n=L.length||1;
  return `<div class="pipe">${STATUSES.map(s=>`<i style="width:${(c[s]/n*100).toFixed(1)}%;background:${SVAR[s]}" title="${SLABEL[s]}: ${c[s]}"></i>`).join("")}</div><div class="pipe-key">${STATUSES.map(s=>`<button data-blf="status" data-v="${s}" data-tab="leads"><i style="background:${SVAR[s]}"></i>${SLABEL[s]} <b>${c[s]}</b></button>`).join("")}</div>`;}
function blRow(t){const b=t.bl||{};return `<tr class="cl" data-open="${t.id}"><td><div class="n">${esc(t.name)}</div><div class="s">${esc(t.contact_name?t.contact_name+(t.role?", "+t.role:""):(b.title?b.title+(b.org?", "+b.org:""):t.subtype||""))}</div></td><td>${blLanePill(b.lane)}${(b.lanes||[]).filter(l=>l!==b.lane).map(l=>" "+blLanePill(l)).join("")}</td><td>${esc(townOf(t))}</td><td>${blPriPill(b.pri)}</td><td>${blCharter(b.charter)}</td><td>${statusPill(t.status)}</td><td class="s">${esc(t.next_step||"")}${t.next_date?`<br><span class="muted">${fmtDate(t.next_date)}</span>`:""}${blFlags(t)?`<div style="margin-top:3px">${blFlags(t)}</div>`:""}</td><td class="s">${blSrc(t.source_url)}</td></tr>`;}
function blOver(){const L=blAll(),E=blEv(),V=blVis(),t0=todayISO(),soon=addDays(t0,21);
  const open=L.filter(t=>t.status==="Prospect"&&t.bl.pri==="A"&&!t.bl.hold);
  const byLane=BL_LANES.map(l=>[l,open.filter(t=>t.bl.lane===l).slice(0,4)]).filter(([,x])=>x.length);
  const up=E.concat(V).filter(e=>e.date&&e.date>=t0&&e.date<=soon).sort((a,b)=>a.date<b.date?-1:1).slice(0,10);
  return `${blStrip()}
  <section class="sec"><div class="h"><h2>Where the deep dive stands</h2><span class="meta">statuses you set in the drawer, same as People &amp; orgs</span></div>${blPipe()}</section>
  <div class="note" style="margin-top:18px"><b>Rules that shape this list.</b> No candidate or campaign contact before the Nov 3 election (held ones are tagged). Out of the country Nov 13–28 (events in that window are tagged). LEAD is not a big charter proponent, so don't overstate it; lead with community and angle in to educational options. Every row here has a source link; "verify" means the newest source was older than 2025, so confirm the name before you send.</div>
  <section class="sec"><div class="h"><h2>Start here: A priority, not reached yet</h2><span class="meta">${open.length} open · top 4 per lane</span></div>
    ${byLane.map(([l,x])=>`<h3 style="margin:14px 0 4px">${blLaneDot(l)}${esc(l)}</h3><div class="rows">${x.map(t=>`<div class="row" data-open="${t.id}"><div><div class="n">${esc(t.name)}</div><div class="d">${esc(t.contact_name?t.contact_name+(t.role?", "+t.role:""):t.subtype||"")} · ${esc(townOf(t))}${t.bl.angle?" · "+esc(t.bl.angle):""}</div></div><div class="r">${blCharter(t.bl.charter)}</div></div>`).join("")}</div>`).join("")||`<p class="empty">Nothing open. Everyone A-priority has been reached.</p>`}
    <div class="chips" style="margin-top:10px"><button class="chip" data-bl="leads">All leads →</button><button class="chip" data-bl="edu">Education 50+ →</button><button class="chip" data-bl="pod">Podcasts →</button></div></section>
  <section class="sec"><div class="h"><h2>Next 3 weeks</h2><span class="meta">${up.length} events and visits</span></div><div class="rows">${up.map(e=>`<div class="row" data-open="${e.id}"><div><div class="n">${esc(e.name)}</div><div class="d">${fmtDate(e.date)}${e.time?", "+esc(e.time):""} · ${esc(e.venue||e.town||"")}${e.visit?" · "+esc(e.visit.fit||""):""}</div></div><div class="r">${e.thai?`<span class="pill red">away</span>`:e.visit?`<span class="pill blue">visit</span>`:e.can_table===true?`<span class="pill green">table</span>`:`<span class="pill sand">table?</span>`}</div></div>`).join("")||`<p class="empty">Nothing dated in the next three weeks.</p>`}</div></section>`;}
function blLeads(){const f=S.bl,L=blLeadsFiltered(),all=blAll();const towns=[...new Set(all.map(townOf))].filter(Boolean).sort();
  return `<div class="toolrow"><div class="chips"><button class="chip" data-blf="lane" data-v="" aria-pressed="${!f.lane}">All lanes</button>${BL_LANES.map(l=>`<button class="chip" data-blf="lane" data-v="${f.lane===l?"":l}" aria-pressed="${f.lane===l}">${blLaneDot(l)}${l} <span class="muted">${all.filter(t=>t.bl.lane===l||(t.bl.lanes||[]).includes(l)).length}</span></button>`).join("")}</div></div>
  <div class="toolrow" style="margin-top:0"><div class="chips">${["A","B","C"].map(p=>`<button class="chip" data-blf="pri" data-v="${f.pri===p?"":p}" aria-pressed="${f.pri===p}">${p==="A"?"A · go first":p==="B"?"B · solid":"C · long shot"}</button>`).join("")}</div>
    <select data-blf="status"><option value="">Any status</option>${STATUSES.map(s=>`<option value="${s}" ${f.status===s?"selected":""}>${SLABEL[s]}</option>`).join("")}</select>
    <select data-blf="charter"><option value="">Charter signal: any</option><option value="Known" ${f.charter==="Known"?"selected":""}>Known either way</option><option value="Supportive" ${f.charter==="Supportive"?"selected":""}>Supportive</option><option value="Mixed" ${f.charter==="Mixed"?"selected":""}>Mixed</option><option value="Skeptical/Opposed" ${f.charter==="Skeptical/Opposed"?"selected":""}>Skeptical / opposed</option><option value="Unknown" ${f.charter==="Unknown"?"selected":""}>Unknown</option></select>
    <select data-blf="town"><option value="">Any town</option>${towns.map(c=>`<option ${f.town===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select data-blf="isnew"><option value="">New and enriched</option><option value="new" ${f.isnew==="new"?"selected":""}>New to the hub</option><option value="enriched" ${f.isnew==="enriched"?"selected":""}>Already in hub, enriched</option></select>
    <button class="chip" data-blf="verify" data-v="${f.verify?"":"1"}" aria-pressed="${f.verify}">Needs a check</button>
    <input type="search" data-blq="q" value="${esc(f.q)}" placeholder="Search these leads" aria-label="Search these leads">
    <span class="sp"></span><span class="small muted">${L.length} of ${all.length}</span>${(f.lane||f.pri||f.status||f.charter||f.town||f.verify||f.q||f.isnew)?`<button class="btn sm ghost" data-act="bl-clear">Clear</button>`:""}<button class="btn sm" data-act="bl-csv">${LOCAL?"Download CSV":"Copy CSV"}</button></div>
  <div class="tablewrap"><table><thead><tr><th>Name</th><th>Lane</th><th>Town</th><th>Priority</th><th>Charter signal</th><th>Status</th><th>Next step</th><th></th></tr></thead><tbody>${L.map(blRow).join("")}</tbody></table></div>${!L.length?`<p class="empty">No one matches. Clear a filter.</p>`:""}`;}
function blEdu(){const f=S.bl;let L=blAll().filter(blIsEdu);const poc=L.filter(t=>t.bl.poc!==false);const q=(f.edq||"").toLowerCase();
  let V=(f.edpoc?poc:L).filter(t=>(!f.edlane||t.bl.lane===f.edlane||(t.bl.lanes||[]).includes(f.edlane))&&(!q||[t.name,t.contact_name,t.role,t.bl.title,t.bl.org,t.town,t.subtype].join(" ").toLowerCase().includes(q)));
  V.sort((a,b)=>{const p={A:0,B:1,C:2};const x=p[a.bl.pri]??3,y=p[b.bl.pri]??3;if(x!==y)return x-y;return a.name.localeCompare(b.name);});
  const pct=Math.min(100,Math.round(poc.length/50*100));
  return `<div class="road" style="padding:16px 20px 14px;grid-template-columns:minmax(0,1fr) auto;margin-bottom:6px"><div><div class="big">${poc.length}<small>of 50</small></div><div class="lbl">education-sector contacts, people of color, with a source link</div></div><div class="days"><div class="big">${L.length}</div><div class="lbl">education contacts in all</div></div><div class="track"><div class="fill" style="width:${pct}%"></div><div class="pin" style="left:${pct}%"></div></div><div class="src"><span><b>${L.filter(t=>t.type==="School"||/charter/i.test(t.subtype||"")).length}</b> charter schools &amp; networks</span><span><b>${L.filter(t=>/professor|faculty|dean|universit|college/i.test([t.subtype,t.role,t.bl.title].join(" "))).length}</b> higher ed</span><span><b>${L.filter(t=>/advocacy|nonprofit|network|coalition|foundation/i.test([t.subtype,t.bl.org].join(" "))).length}</b> advocacy &amp; nonprofits</span><span><b>${L.filter(t=>t.bl.charter&&t.bl.charter!=="Unknown").length}</b> with a known charter stance</span></div></div>
  <div class="toolrow"><div class="chips"><button class="chip" data-blf="edlane" data-v="" aria-pressed="${!f.edlane}">All</button><button class="chip" data-blf="edlane" data-v="${f.edlane==="Education"?"":"Education"}" aria-pressed="${f.edlane==="Education"}">${blLaneDot("Education")}Greater Hartford</button><button class="chip" data-blf="edlane" data-v="${f.edlane==="Education Sector"?"":"Education Sector"}" aria-pressed="${f.edlane==="Education Sector"}">${blLaneDot("Education Sector")}Statewide &amp; beyond</button><button class="chip" data-blf="edpoc" data-v="${f.edpoc?"":"1"}" aria-pressed="${f.edpoc}">People of color only</button></div><input type="search" data-blq="edq" value="${esc(f.edq)}" placeholder="Search" aria-label="Search education contacts"><span class="sp"></span><span class="small muted">${V.length}</span><button class="btn sm" data-act="bl-csv-edu">${LOCAL?"Download CSV":"Copy CSV"}</button></div>
  <div class="tablewrap"><table><thead><tr><th>Name</th><th>Role</th><th>Town</th><th>Type</th><th>Priority</th><th>Charter signal</th><th>Status</th><th></th></tr></thead><tbody>${V.map(t=>`<tr class="cl" data-open="${t.id}"><td><div class="n">${esc(t.contact_name&&t.type!=="School"?t.contact_name:t.name)}</div><div class="s">${esc(t.contact_name&&t.type!=="School"?(t.name!==t.contact_name?t.name:(t.bl.org||"")):(t.contact_name||""))}${t.bl.poc===false?` <span class="pill sand">background not confirmed</span>`:""}</div></td><td class="s">${esc(t.role||t.bl.title||"")}${t.bl.org&&t.bl.org!==t.name?`<br>${esc(t.bl.org)}`:""}</td><td>${esc(townOf(t))}</td><td class="s">${esc(t.subtype||t.type)}</td><td>${blPriPill(t.bl.pri)}</td><td>${blCharter(t.bl.charter)}</td><td>${statusPill(t.status)}${t.bl.hold?`<br><span class="pill orange">hold until Nov 3</span>`:""}${t.bl.verify?`<br><span class="pill sand">verify</span>`:""}</td><td class="s">${blSrc(t.source_url)}</td></tr>`).join("")}</tbody></table></div>${!V.length?`<p class="empty">No one matches.</p>`:""}`;}
function blPod(){const f=S.bl;const q=(f.pq||"").toLowerCase();const P=blPodcasts().filter(t=>!q||[t.name,t.contact_name,t.bl.show,t.bl.angle,t.bl.guests,t.town].join(" ").toLowerCase().includes(q)).sort((a,b)=>{const p={A:0,B:1,C:2};return (p[a.bl.pri]??3)-(p[b.bl.pri]??3)||a.name.localeCompare(b.name);});
  return `<div class="note" style="margin-bottom:12px">Two asks per host: a short recorded conversation for LEAD's weekly video, or a LEAD parent leader as a guest on their show. "Copy pitch" gives you the short, confident version; adjust the one line about their show before sending.</div>
  <div class="toolrow"><input type="search" data-blq="pq" value="${esc(f.pq)}" placeholder="Search hosts and shows" aria-label="Search podcasts"><span class="sp"></span><span class="small muted">${P.length} hosts</span></div>
  <div class="cards">${P.map(t=>{const b=t.bl;return `<div class="card" data-open="${t.id}"><div class="n">${esc(b.show||t.name)}${b.show&&b.show!==t.name?` <span class="muted" style="font-weight:400">· ${esc(t.contact_name||t.name)}</span>`:""}</div><div class="s">${esc([t.role,b.org,townOf(t)].filter(Boolean).join(" · "))}</div><div class="s">${esc(t.why||"")}</div>${b.guests?`<div class="s"><b>Guests:</b> ${esc(b.guests)}</div>`:""}${b.angle?`<div class="s"><b>Angle:</b> ${esc(b.angle)}</div>`:""}<div class="chips" style="margin-top:6px"><button class="btn sm" data-act="bl-pitch" data-id="${t.id}">Copy pitch</button>${b.booking?`<a class="btn sm" href="${esc(b.booking)}" target="_blank" rel="noopener" data-stop="1" style="text-decoration:none">Booking page ↗</a>`:""}${t.email?`<button class="btn sm ghost" data-copy="${esc(t.email)}">copy email</button>`:""}${blSrc(t.source_url)}</div><div class="r">${blPriPill(b.pri)}<br>${statusPill(t.status)}${b.verify?`<br><span class="pill sand">verify</span>`:""}</div></div>`;}).join("")||`<p class="empty">No hosts match.</p>`}</div>`;}
function blVisit(){const f=S.bl,t0=todayISO();const q=(f.vq||"").toLowerCase();let V=blVis().filter(e=>(!f.vm||(e.date||"").slice(0,7)===f.vm)&&(!f.vfit||(e.visit.fit||"")===f.vfit)&&(!q||[e.name,e.visit.person,e.visit.known_for,e.visit.why,e.venue,e.town,e.host].join(" ").toLowerCase().includes(q))).sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  const months=[...new Set(blVis().map(e=>(e.date||"").slice(0,7)).filter(Boolean))].sort();const fits=[...new Set(blVis().map(e=>e.visit.fit).filter(Boolean))].sort();
  let cur="",html="";V.forEach(e=>{const v=e.visit;const m=(e.date||"").slice(0,7);if(m!==cur){cur=m;html+=`<div class="wk"><h3>${m?MON[+m.slice(5,7)-1]+" "+m.slice(0,4):"No date"}</h3></div>`;}
    html+=`<div class="card" data-open="${e.id}"><div class="n">${esc(v.person)}${v.poc?"":""} <span class="muted" style="font-weight:400">· ${esc(v.known_for||"")}</span></div><div class="s">${fmtDate(e.date)}${e.end_date&&e.end_date!==e.date?" to "+fmtDate(e.end_date):""}${e.time?", "+esc(e.time):""} · ${esc(v.event_name||"")}${e.venue?" · "+esc(e.venue):""}${e.town?", "+esc(e.town):""}${e.cost?" · "+esc(e.cost):""}</div>${v.edu?`<div class="s"><b>Education:</b> ${esc(v.edu)}</div>`:""}${v.why?`<div class="s"><b>Why LEAD cares:</b> ${esc(v.why)}</div>`:""}${v.approach?`<div class="s"><b>How to reach:</b> ${linkify(v.approach)}</div>`:""}<div class="chips" style="margin-top:6px"><button class="btn sm" data-act="bl-invite" data-id="${e.id}">Copy invite</button>${e.url?`<a class="lnk" href="${esc(e.url)}" target="_blank" rel="noopener" data-stop="1">event page ↗</a>`:""}${blFlags(e)}</div><div class="r"><span class="pill blue">${esc(v.fit||"Meet")}</span><br>${blPriPill(v.pri||"B")}${e.date&&e.date<t0?`<br><span class="pill grey">past</span>`:""}</div></div>`;});
  return `<div class="note" style="margin-bottom:12px">People coming into Connecticut this season. Go to meet them, invite them to speak, or ask for a recorded conversation. Each one has the event page; "How to reach" is the route (host contact, publicist, speaker bureau). Items in an away window are tagged; ask a teammate to cover those.</div>
  <div class="toolrow"><div class="chips"><button class="chip" data-blf="vm" data-v="" aria-pressed="${!f.vm}">All months</button>${months.map(m=>`<button class="chip" data-blf="vm" data-v="${f.vm===m?"":m}" aria-pressed="${f.vm===m}">${MON[+m.slice(5,7)-1]} ${m.slice(2,4)}</button>`).join("")}</div><select data-blf="vfit"><option value="">Any fit</option>${fits.map(x=>`<option ${f.vfit===x?"selected":""}>${esc(x)}</option>`).join("")}</select><input type="search" data-blq="vq" value="${esc(f.vq)}" placeholder="Search" aria-label="Search visits"><span class="sp"></span><span class="small muted">${V.length}</span></div><div class="cards">${html||`<p class="empty">No visits match.</p>`}</div>`;}
function blEvents(){const f=S.bl,t0=todayISO();const q=(f.evq||"").toLowerCase();let E=blEv().filter(e=>(!f.evcat||e.event_type===f.evcat)&&(f.evth===""||(f.evth==="away"?e.thai:!e.thai))&&(!q||[e.name,e.venue,e.host,e.town,e.why,e.event_type,e.audience].join(" ").toLowerCase().includes(q))).sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  const cats=[...new Set(blEv().map(e=>e.event_type).filter(Boolean))].sort();let cur="",html="";
  E.forEach(e=>{const wk=weekKey(e.date);if(wk!==cur){cur=wk;html+=`<div class="wk"><h3>${wk?"Week of "+fmtDate(wk,true):"No date"}</h3></div>`;}
    html+=`<div class="card" data-open="${e.id}"><div class="n">${esc(e.name)}</div><div class="s">${fmtDate(e.date)}${e.end_date&&e.end_date!==e.date?" to "+fmtDate(e.end_date):""}${e.time?", "+esc(e.time):""}${e.recurring?" · "+esc(e.recurring):""} · ${esc(e.venue||e.address||townOf(e))}${e.host?" · "+esc(e.host):""}${e.cost?" · "+esc(e.cost):""}</div><div class="s">${esc(e.why||"")}${e.audience?` <span class="muted">(${esc(e.audience)})</span>`:""}</div>${e.contact?`<div class="s"><b>Contact:</b> ${linkify(e.contact)}</div>`:""}<div class="chips" style="margin-top:6px">${e.url?`<a class="lnk" href="${esc(e.url)}" target="_blank" rel="noopener" data-stop="1">info / register ↗</a>`:""}${blFlags(e)}</div><div class="r"><span class="kchip" style="--kc:var(--blue)">${esc(e.event_type||"")}</span><br>${e.can_table===true?`<span class="pill green">table</span>`:e.can_table===false?`<span class="pill grey">no table</span>`:`<span class="pill sand">table?</span>`}${e.date&&e.date<t0?`<br><span class="pill grey">past</span>`:""}</div></div>`;});
  return `<div class="toolrow"><div class="chips"><button class="chip" data-blf="evcat" data-v="" aria-pressed="${!f.evcat}">All kinds</button>${cats.map(c=>`<button class="chip" data-blf="evcat" data-v="${f.evcat===c?"":c}" aria-pressed="${f.evcat===c}">${esc(c)}</button>`).join("")}</div></div><div class="toolrow" style="margin-top:0"><div class="chips"><button class="chip" data-blf="evth" data-v="${f.evth==="here"?"":"here"}" aria-pressed="${f.evth==="here"}">While I'm here</button><button class="chip" data-blf="evth" data-v="${f.evth==="away"?"":"away"}" aria-pressed="${f.evth==="away"}">While I'm away</button></div><input type="search" data-blq="evq" value="${esc(f.evq)}" placeholder="Search" aria-label="Search events"><span class="sp"></span><span class="small muted">${E.length}</span><button class="btn sm" data-act="bl-open-events">Open in Events</button></div><div class="cards">${html||`<p class="empty">No events match.</p>`}</div>`;}
function blHow(){const m=BL.meta||{};
  return `<section class="sec" style="margin-top:0"><div class="h"><h2>How to work this list</h2></div><div class="facts">
  <h3>What's in it</h3><ul><li>${m.leads_new||0} new people and organizations plus ${m.leads_enriched||0} already in the hub now carrying deep-dive details (lane, priority, charter signal, LEAD angle). ${m.events||0} dated events through March 2027 and ${m.visits||0} people visiting Connecticut. Built ${m.built||""} from public sources; every row links to one.</li><li>Lanes: Faith, Civic &amp; Youth, Business (owners named), Creators (photographers, DJs, designers, artists, pages), Education (Greater Hartford), Media &amp; Culture, Education Sector (statewide leaders of color), Podcast.</li><li>Priority: A = reach plus an education, youth or family angle, go first. B = solid reach or event value. C = long shot, work when the A and B rows are moving.</li></ul>
  <h3>Order of operations</h3><ul><li>Week 1 (before Nov 3): faith, civic and business A rows, plus every event in the next three weeks. Nothing political.</li><li>Nov 4–12: education A rows and the statewide education-sector list, now that elected officials and candidates are off hold.</li><li>Any weeks you're away: podcast pitches and emails can still go out; hand event coverage to a teammate.</li><li>December: lock the February B-LEAD event. Pick co-hosts from Media &amp; Culture and Faith, a speaker from Visiting CT, and 2–3 podcast hosts to record it.</li><li>January: session opens; move Supporters toward Champion with one concrete ask (show up at the LOB, sign the letter, host a program).</li></ul>
  <h3>Working a row</h3><ul><li>Open the row, read the LEAD angle, then set the status in the drawer. Use the intro email in the drawer for organizations; the podcast and visit pitches have their own buttons.</li><li>Charter signal is only what a source showed. "Unknown" is most rows; ask the two qualifying questions in person and record the answers in the drawer.</li><li>"Verify" means the newest source was older than 2025. A 30-second check of the site or a phone call before sending.</li><li>Education 50+ counts people of color in the education lanes who have a source link. The bar on that tab is the target you set (50).</li></ul>
  ${(m.gaps||[]).length?`<h3>Found, but no public contact yet (${m.gaps.length})</h3><p class="small muted">These came up in the research with a source but no phone, email, site or page to reach them through. Get them through a member intro or the event organizer rather than cold.</p>${BL_LANES.filter(l=>m.gaps.some(g=>g.lane===l)).map(l=>`<details style="margin:6px 0"><summary style="cursor:pointer">${blLaneDot(l)}${esc(l)} <span class="muted">(${m.gaps.filter(g=>g.lane===l).length})</span></summary><ul>${m.gaps.filter(g=>g.lane===l).map(g=>`<li><b>${esc(g.name)}</b>${g.route?` — ${esc(g.route)}`:""}</li>`).join("")}</ul></details>`).join("")}`:""}
  <h3>What this list is not</h3><ul><li>Not an endorsement list. The Nov 3 hold stays on anyone running or in office until the election passes; then they are partners like anyone else.</li><li>Not a replacement for People &amp; orgs: these rows live there too, with the same statuses. This page is the focused view.</li></ul></div></section>`;}
function rBlead(){const b=S.bl;const nav=[["over","Overview"],["leads","Leads"],["edu","Education 50+"],["pod","Podcasts"],["visit","Visiting CT"],["ev","Events"],["how","How to work it"]];
  return `<div class="subnav">${nav.map(([k,l])=>`<button data-bl="${k}" aria-pressed="${b.tab===k}">${l}</button>`).join("")}</div>`+({over:blOver,leads:blLeads,edu:blEdu,pod:blPod,visit:blVisit,ev:blEvents,how:blHow})[b.tab]();}
function blCSV(rows){const H=["Name","Contact","Role","Lane","Type","Town","Priority","Charter signal","Charter evidence","Status","Email","Phone","Website","Source","LEAD angle","Programs","Verify"];
  const body=rows.map(t=>[t.name,t.contact_name,t.role||t.bl.title,t.bl.lane,t.subtype||t.type,townOf(t),t.bl.pri,t.bl.charter,t.bl.evidence,t.status,t.email,t.phone,t.website,t.source_url,t.bl.angle,t.bl.programs,t.bl.verify?"check":""].map(csvCell).join(","));
  return [H.join(",")].concat(body).join("\n");}
function blBind(v){if(S.tab!=="blead")return;
  v.querySelectorAll("[data-bl]").forEach(el=>el.addEventListener("click",()=>{S.bl.tab=el.dataset.bl;render();}));
  v.querySelectorAll("[data-blf]").forEach(el=>{const h=()=>{const k=el.dataset.blf;const val=el.tagName==="SELECT"?el.value:el.dataset.v;S.bl[k]=(k==="verify"||k==="edpoc")?!!val:val;if(el.dataset.tab)S.bl.tab=el.dataset.tab;render();};el.addEventListener(el.tagName==="SELECT"?"change":"click",h);});
  v.querySelectorAll("[data-blq]").forEach(el=>el.addEventListener("input",()=>{S.bl[el.dataset.blq]=el.value;render();}));
  v.querySelectorAll("[data-act='bl-open-events']").forEach(el=>el.addEventListener("click",()=>{S.ef.n26="1";S.ef.past=false;go("events");}));
  v.querySelectorAll("[data-act='bl-clear']").forEach(el=>el.addEventListener("click",()=>{Object.assign(S.bl,{lane:"",pri:"",status:"",charter:"",town:"",verify:false,isnew:"",q:""});render();}));
  v.querySelectorAll("[data-act='bl-csv']").forEach(el=>el.addEventListener("click",()=>copyOrDl(blCSV(blLeadsFiltered()),"blead-leads.csv","Copied the list")));
  v.querySelectorAll("[data-act='bl-csv-edu']").forEach(el=>el.addEventListener("click",()=>copyOrDl(blCSV(blAll().filter(blIsEdu)),"blead-education-contacts.csv","Copied the list")));
  v.querySelectorAll("[data-act='bl-pitch']").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();const t=getRec(el.dataset.id);if(t)showCopyBox(blPitch(t));}));
  v.querySelectorAll("[data-act='bl-invite']").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();const t=getRec(el.dataset.id);if(t)showCopyBox(blInvite(t));}));
  v.querySelectorAll("[data-copy]").forEach(el=>{if(el.closest(".drawer"))return;el.addEventListener("click",e=>{e.stopPropagation();copyText(el.dataset.copy,"Copied");});});
}
function BL_COUNT(){return blAll().length;}


/* ============ Event readiness (added Oct 28, 2026) ============
   Kelly Sheehan's "Event Readiness & Accountability Checklist" (Oct 28, 2026) as a working
   checklist, one per event. Stored in the "ready" collection; the doc id is "rd_<event id>"
   when it belongs to a hub event, so the event drawer can find it.
   Kelly's rule: nothing assumed. Every responsibility has an owner, a deadline and confirmation.
   "Not needed" is something you choose for a row; nothing starts out as not needed. */
const RD_ROLES=[["lead","Event lead / day-of point person"],["cover","Coverage person (backup if lead or staff is unavailable)"],["hostcomm","Host / partner communication"],["staff","Staff scheduling / event coverage"],["promo","Online promotion / social media"],["greet","Welcome / greeting guests"],["speak","Speaking / LEAD representative"],["open","Opening the center / building access"],["reg","Registration / day-of check-in"],["outreach","Participant outreach / contacting participants"],["tickets","Tickets purchasing"],["names","Names submitted (attendee / staff list to host)"],["legis","Legislative / elected official invitations"],["photo","Photos / media"],["sound","Sound check"],["setup","Setup"],["bin","Event bin / banner / tent / chairs"],["materials","Materials preparation & transport"],["cat_order","Catering - order / confirmation"],["cat_pick","Catering - pickup / delivery"],["cat_setup","Catering - food setup"],["waivers","Waivers, protocols & insurance paperwork"],["invoices","Invoices - submitted / payment follow-up"],["breakdown","Breakdown / cleanup"],["close","Closing / locking up"]];
const RD_LOG=[["purpose","Purpose, agenda, and expectations confirmed"],["runshow","Run of show / most recent host meeting notes shared with the full event team"],["times","Staff arrival and departure times confirmed"],["coverbrief","Coverage person identified and briefed in case of absences"],["wear","What to wear communicated to all staff (attire / branded shirts / weather-appropriate)","wear"],["layout","Room layout, tables, chairs, signage, registration area, and food area confirmed"],["floorplan","Floor plan visual created and shared with the event team and host","floor"],["binpacked","Event bin packed (supplies, signage, sign-in sheets, pens, tape, etc.)"],["tent","Banner, tent, and chairs reserved, packed, and transport assigned"],["av","AV / microphones / technology confirmed"],["soundck","Sound check scheduled and completed before doors open","sound"],["parking","Parking, loading, transportation, and access instructions confirmed"],["matlist","Materials list finalized, packed, and transportation assigned"],["lockup","Opening and closing / lock-up responsibilities confirmed"]];
const RD_CT=[["lead","Event lead"],["cover","Coverage person"],["host","Host / partner"],["partner2","Additional partner"],["insurance","Insurance partner"],["facil","Instructor / facilitator"],["venue","Venue / building contact"]];
const RD_PCHK=[["writing","Partner roles and responsibilities agreed in writing"],["coi_ok","Insurance partner confirmed and certificate of insurance (COI) on file"],["shared","Partner and event lead contact info shared with the full event team"]];
const RD_PP=[["waivers","Liability waivers signed by all participants"],["protocol","Instructor protocol signed"],["coi","Insurance partner / COI confirmed"],["inv_sub","Invoices submitted"],["inv_paid","Invoices paid"]];
const RD_XCHK=[["tixdist","Tickets purchased and distributed","tix"],["namesfinal","Final names list submitted to host / venue"],["waiverneed","Participants who need waivers identified"]];
const RD_LEG=[["owner","Invite list owner"],["sentby","Invitations sent by"],["followup","Follow-up owner"],["confirmed","Attendance confirmed by"]];
const RD_SECS=[["s1","Responsibility assignments"],["s2","Event details & logistics"],["s3","Partner & event lead details"],["s4","Paperwork, waivers & invoices"],["s5","Participant outreach, registration & tickets"],["s6","Legislative / elected official invitations"]];
const RD_SHORT={s1:"Responsibilities",s2:"Logistics",s3:"Partners",s4:"Paperwork",s5:"Outreach & tickets",s6:"Elected officials"};
const RD_ELECTION="2026-11-03";
TITLES.ready="Event readiness";PAGE_CONTEXT.ready="Owners, deadlines, confirmation";
TITLES.sig="Email signature";PAGE_CONTEXT.sig="Gmail signature builder";
S.ready=[];S.rdDraft={};S.rd={open:null,tab:"list",confirmDel:false,allGaps:false,jump:"",past:false};

/* ---------- data ---------- */
function rdAll(){const m={};S.ready.forEach(d=>{m[d.id]=d;});Object.entries(S.rdDraft).forEach(([id,d])=>{m[id]={...d,id};});return Object.values(m);}
function rdDoc(id){if(!id)return null;if(S.rdDraft[id])return {...S.rdDraft[id],id};return S.ready.find(d=>d.id===id)||null;}
function rdForEvent(eid){return rdDoc("rd_"+eid);}
function rdActive(d){return !d.date||d.date>=todayISO();}
function rdGet(o,path){return path.split(".").reduce((a,k)=>a==null?undefined:a[k],o);}
function rdSetPath(o,path,val){const ks=path.split(".");let c=o;for(let i=0;i<ks.length-1;i++){if(c[ks[i]]==null||typeof c[ks[i]]!=="object")c[ks[i]]={};c=c[ks[i]];}c[ks[ks.length-1]]=val;}
const RD_T={};
function rdEdit(id,path,val,now){const cur=rdDoc(id);if(!cur)return;const d=JSON.parse(JSON.stringify(cur));rdSetPath(d,path,val);d.updatedAt=new Date().toISOString();S.rdDraft[id]=d;clearTimeout(RD_T[id]);RD_T[id]=setTimeout(()=>rdFlush(id),now?0:700);}
async function rdFlush(id){const d=S.rdDraft[id];if(!d)return;const {id:_x,...rest}=d;const ok=await write("ready",id,rest);if(ok&&S.rdDraft[id]===d)delete S.rdDraft[id];}
function rdBlank(){const t=new Date().toISOString();return {eventId:"",name:"",date:"",time:"",location:"",expected:"",roles:{},chk:{},na:{},ct:{},pp:{},out:{},leg:{},wear:"",soundTime:"",floor:"",wOn:"",wOf:"",invoice:"",noReg:false,noTix:false,noLeg:false,createdAt:t,updatedAt:t};}
function rdCreate(eid,fromId,manual){const d=rdBlank();let id;
  if(eid){const e=getRec(eid);if(!e)return;id="rd_"+eid;if(rdDoc(id)){rdOpen(id);return;}d.eventId=eid;d.name=e.name||"";d.date=(e.date&&e.date>=todayISO())?e.date:"";d.time=e.time||"";d.location=[e.venue,e.address].filter(Boolean).join(", ")||townOf(e)||"";if(e.host)d.ct.host={name:e.host};}
  else{id=uid("rd");Object.assign(d,manual||{});}
  if(fromId){const src=rdDoc(fromId);if(src){Object.entries(src.roles||{}).forEach(([k,r])=>{if(r&&r.who)d.roles[k]={who:r.who};});Object.entries(src.na||{}).forEach(([k,v])=>{if(v&&k.startsWith("role:"))d.na[k]=true;});["lead","cover"].forEach(k=>{const c=(src.ct||{})[k];if(c&&c.name)d.ct[k]={name:c.name,phone:c.phone||"",email:c.email||""};});}}
  S.rdDraft[id]={...d,id};clearTimeout(RD_T[id]);RD_T[id]=setTimeout(()=>rdFlush(id),0);rdOpen(id);toast("Checklist started");}
function rdOpen(id,jump){S.rd.open=id;S.rd.jump=jump||"";S.rd.confirmDel=false;S.rd.allGaps=false;go("ready",true);}
async function rdDelete(id){clearTimeout(RD_T[id]);delete S.rdDraft[id];S.ready=S.ready.filter(d=>d.id!==id);S.rd.open=null;S.rd.confirmDel=false;render();await remove("ready",id);toast("Checklist deleted");}

/* ---------- scoring: what's ready, what's missing ---------- */
function rdOver(due){const n=daysFromToday(due);return n===null?0:-n;}
function rdRoleGap(r,t0){const p=[];if(!r.who)p.push("no owner");if(!r.due)p.push("no deadline");else if(!r.ok&&r.due<t0)p.push("overdue "+rdOver(r.due)+"d");if(!r.ok)p.push("not confirmed");return p.join(", ");}
function rdScore(d){
  const t0=todayISO(),na=d.na||{},chk=d.chk||{},R=d.roles||{},C=d.ct||{},P=d.pp||{},O=d.out||{},G=d.leg||{};
  const secs={};RD_SECS.forEach(([s])=>secs[s]={t:0,d:0});const gaps=[];let overdue=0,noOwner=0,unconf=0;
  const item=(s,ok,g)=>{secs[s].t++;if(ok)secs[s].d++;else if(g)gaps.push({s,...g});};
  [["name","Event name"],["date","Date"],["location","Location"],["expected","Expected attendance"]].forEach(([k,l])=>item("s1",!!String(d[k]||"").trim(),{t:l+" not filled in",el:"rd-h-"+k}));
  RD_ROLES.forEach(([k,l])=>{if(na["role:"+k])return;const r=R[k]||{};const done=!!(r.who&&r.due&&r.ok);const late=!!(r.due&&!r.ok&&r.due<t0);if(!r.who)noOwner++;if(late)overdue++;if(!r.ok)unconf++;
    item("s1",done,{t:l+": "+rdRoleGap(r,t0),el:"rd-r-"+k+"-"+(!r.who?"who":!r.due?"due":"ok"),late});});
  RD_LOG.forEach(([k,l])=>{if(na["chk:"+k])return;item("s2",!!chk[k],{t:l,el:"rd-c-"+k});});
  RD_CT.forEach(([k,l])=>{if(na["ct:"+k])return;const c=C[k]||{};item("s3",!!(c.name&&(c.phone||c.email)),{t:l+": "+(!c.name?"no name":"no phone or email"),el:"rd-ct-"+k+"-"+(!c.name?"name":"phone")});});
  RD_PCHK.forEach(([k,l])=>{if(na["chk:"+k])return;item("s3",!!chk[k],{t:l,el:"rd-c-"+k});});
  RD_PP.forEach(([k,l])=>{if(na["pp:"+k])return;const p=P[k]||{};const late=!!(p.due&&!p.ok&&p.due<t0);if(late)overdue++;if(!p.owner&&!p.ok)noOwner++;
    item("s4",!!p.ok,{t:l+": "+[!p.owner?"no owner":"",!p.due?"no due date":late?"overdue "+rdOver(p.due)+"d":"","not done"].filter(Boolean).join(", "),el:"rd-pp-"+k+"-"+(!p.owner?"owner":!p.due?"due":"ok"),late});});
  if(!na["pp:waivers"]&&(+d.wOf||0)>0&&(+d.wOn||0)<(+d.wOf||0))gaps.push({s:"s4",t:"Waivers on file: "+(+d.wOn||0)+" of "+(+d.wOf),el:"rd-w-on"});
  if(!d.noReg){
    item("s5",!!O.listowner,{t:"Participant list owner not set",el:"rd-o-listowner"});
    item("s5",!!O.expected,{t:"Expected count not set",el:"rd-o-expected"});
    item("s5",!!O.method,{t:"Outreach method not set",el:"rd-o-method"});
    item("s5",!!(O.remindDate&&O.remindWho),{t:"Final reminder: "+(!O.remindDate?"no date":"no one assigned"),el:!O.remindDate?"rd-o-reminddate":"rd-o-remindwho"});
    if(!d.noTix){item("s5",!!(O.tixWho&&O.tixQty),{t:"Tickets: "+(!O.tixWho?"no one buying them":"no quantity"),el:!O.tixWho?"rd-o-tixwho":"rd-o-tixqty"});item("s5",!!O.tixDl,{t:"Ticket purchase deadline not set",el:"rd-o-tixdl"});}
    item("s5",!!O.namesWho,{t:"No one assigned to submit names",el:"rd-o-nameswho"});
    item("s5",!!O.namesDl,{t:"Name submission deadline not set",el:"rd-o-namesdl"});
    RD_XCHK.forEach(([k,l,tix])=>{if(tix&&d.noTix)return;if(na["chk:"+k])return;const dl=k==="tixdist"?O.tixDl:k==="namesfinal"?O.namesDl:"";const late=!!(dl&&!chk[k]&&dl<t0);if(late)overdue++;item("s5",!!chk[k],{t:l+(late?" (deadline passed)":""),el:"rd-c-"+k,late});});
  }
  if(!d.noLeg)RD_LEG.forEach(([k,l])=>item("s6",!!String(G[k]||"").trim(),{t:l+" not set",el:"rd-g-"+k}));
  const total=RD_SECS.reduce((a,[s])=>a+secs[s].t,0),done=RD_SECS.reduce((a,[s])=>a+secs[s].d,0);
  const order=Object.fromEntries(RD_SECS.map(([s],i)=>[s,i]));gaps.sort((a,b)=>(b.late?1:0)-(a.late?1:0)||order[a.s]-order[b.s]);
  return {secs,total,done,pct:total?Math.round(done/total*100):0,gaps,overdue,noOwner,unconf};}
/* Dated items still open: roles, paperwork and the two outreach deadlines. */
function rdItems(d){const t0=todayISO(),na=d.na||{},out=[];
  RD_ROLES.forEach(([k,l])=>{if(na["role:"+k])return;const r=(d.roles||{})[k]||{};if(r.due&&!r.ok)out.push({d,label:l,who:r.who||"",due:r.due,late:r.due<t0,el:"rd-r-"+k+"-ok"});});
  RD_PP.forEach(([k,l])=>{if(na["pp:"+k])return;const p=(d.pp||{})[k]||{};if(p.due&&!p.ok)out.push({d,label:l,who:p.owner||"",due:p.due,late:p.due<t0,el:"rd-pp-"+k+"-ok"});});
  const O=d.out||{},chk=d.chk||{};if(!d.noReg){if(!d.noTix&&O.tixDl&&!chk.tixdist&&!(d.na||{})["chk:tixdist"])out.push({d,label:"Tickets purchased and distributed",who:O.tixWho||"",due:O.tixDl,late:O.tixDl<t0,el:"rd-c-tixdist"});if(O.namesDl&&!chk.namesfinal&&!(d.na||{})["chk:namesfinal"])out.push({d,label:"Final names list to host / venue",who:O.namesWho||"",due:O.namesDl,late:O.namesDl<t0,el:"rd-c-namesfinal"});}
  return out.sort((a,b)=>a.due<b.due?-1:1);}
function rdDue(){if(!tabOK("ready"))return [];const t0=todayISO(),wk=addDays(t0,7);
  return rdAll().filter(rdActive).map(d=>{const its=rdItems(d).filter(x=>x.due<=wk);const sc=rdScore(d);const soon=d.date&&daysFromToday(d.date)<=7&&sc.pct<100;return (its.length||soon)?{d,its,sc}:null;}).filter(Boolean).sort((a,b)=>(a.d.date||"9")<(b.d.date||"9")?-1:1);}
function rdDoNow(){return rdDue().map(({d,its,sc})=>{const late=its.filter(x=>x.late).length;const nx=its.find(x=>!x.late)||its[0];
  const desc=[late?late+" overdue":"",its.length-late?(its.length-late)+" due this week":"",(sc.total-sc.done)+" open in all"].filter(Boolean).join(", ");
  return `<div class="row" data-rd-go="${d.id}"><span class="ck" style="border-style:dashed;border-color:var(--blue)"></span><div><div class="n">Get ready: ${esc(d.name||"Untitled event")}</div><div class="d">${desc}${nx?", next: "+esc(nx.label)+(nx.who?" ("+esc(nx.who)+")":""):""}</div></div><div class="r" style="${late?"color:var(--red)":""}">${d.date?fmtDate(d.date)+"<br>"+rel(daysFromToday(d.date)):""}</div></div>`;}).join("");}
function rdPill(e){if(!tabOK("ready"))return "";const d=rdForEvent(e.id);if(!d)return "";const sc=rdScore(d);return `<span class="pill ${sc.pct===100?"green":sc.overdue?"red":"blue"}">ready ${sc.pct}%</span><br>`;}
function RD_COUNT(){return rdAll().filter(d=>rdActive(d)&&rdScore(d).pct<100).length;}
function rdPeople(){const s=new Set([ME().name].filter(Boolean));(S.org||[]).forEach(p=>p&&p.name&&s.add(p.name));(S.team||[]).forEach(p=>p&&p.name&&s.add(p.name));rdAll().forEach(d=>{Object.values(d.roles||{}).forEach(r=>r&&r.who&&s.add(r.who));Object.values(d.pp||{}).forEach(p=>p&&p.owner&&s.add(p.owner));});return [...s].filter(Boolean).sort((a,b)=>a.localeCompare(b));}

/* ---------- plain-text copies ---------- */
function rdWhen(d){return [d.date?fmtDate(d.date,true):"",d.time||""].filter(Boolean).join(", ");}
function rdAssignText(d){const na=d.na||{},by={};const add=(w,x)=>{const k=(w||"").trim()||"__none";(by[k]=by[k]||[]).push(x);};
  RD_ROLES.forEach(([k,l])=>{if(na["role:"+k])return;const r=(d.roles||{})[k]||{};add(r.who,l+(r.due?" (due "+fmtDate(r.due)+")":"")+(r.ok?" - confirmed":""));});
  RD_PP.forEach(([k,l])=>{if(na["pp:"+k])return;const p=(d.pp||{})[k]||{};if(p.owner||!p.ok)add(p.owner,l+(p.due?" (due "+fmtDate(p.due)+")":"")+(p.ok?" - done":""));});
  const names=Object.keys(by).filter(k=>k!=="__none").sort();
  return `Event readiness: ${d.name||"Untitled event"}${rdWhen(d)?"\nWhen: "+rdWhen(d):""}${d.location?"\nWhere: "+d.location:""}\n\nHere's who owns what. Please reply to confirm yours.\n\n`+names.map(w=>w+"\n"+by[w].map(x=>"• "+x).join("\n")).join("\n\n")+(by.__none?`${names.length?"\n\n":""}Still needs an owner:\n`+by.__none.map(x=>"• "+x).join("\n"):"")+"\n";}
function rdGapsText(d){const sc=rdScore(d);const secName=Object.fromEntries(RD_SECS.map(([s,n],i)=>[s,(i+1)+". "+n]));const grp={};sc.gaps.forEach(g=>{(grp[g.s]=grp[g.s]||[]).push(g.t+(g.late&&!/overdue|passed/.test(g.t)?" (overdue)":""));});
  return `Subject: Readiness – ${d.name||"event"}\n\nHi Kelly,\n\nWhere ${d.name||"the event"}${d.date?" ("+fmtDate(d.date,true)+")":""} stands: ${sc.done} of ${sc.total} items ready (${sc.pct}%).${sc.overdue?" "+sc.overdue+" overdue.":""}\n\n`+(sc.gaps.length?"Still open:\n\n"+RD_SECS.filter(([s])=>grp[s]).map(([s])=>secName[s]+"\n"+grp[s].map(x=>"• "+x).join("\n")).join("\n\n"):"Everything that applies is owned, dated and confirmed.")+`\n\nBest,\n${SIGN_LINES()}\n`;}
function rdFullText(d){const na=d.na||{},chk=d.chk||{},R=d.roles||{},C=d.ct||{},P=d.pp||{},O=d.out||{},G=d.leg||{};const box=(on,isNa)=>isNa?"[n/a]":on?"[x]":"[ ]";const v=x=>(x==null||x==="")?"—":x;
  const L=[];L.push("EVENT READINESS & ACCOUNTABILITY CHECKLIST","Nothing assumed. Every responsibility has an owner, a deadline, and confirmation.","");
  L.push("1. RESPONSIBILITY ASSIGNMENTS",`Event: ${v(d.name)}`,`Date / time: ${v(rdWhen(d))}`,`Location: ${v(d.location)}`,`Event lead: ${v((R.lead||{}).who)}`,`Host / partner contact: ${v((C.host||{}).name)}`,`Expected attendance: ${v(d.expected)}`,"");
  RD_ROLES.forEach(([k,l])=>{const r=R[k]||{};L.push(`${box(r.ok,na["role:"+k])} ${l} — ${na["role:"+k]?"not needed":v(r.who)+", due "+(r.due?fmtDate(r.due):"—")+(r.ok?", confirmed":"")}`);});
  L.push("","2. EVENT DETAILS & LOGISTICS");RD_LOG.forEach(([k,l,x])=>{L.push(`${box(chk[k],na["chk:"+k])} ${l}${x==="wear"&&d.wear?": "+d.wear:""}${x==="sound"&&d.soundTime?" (time: "+d.soundTime+")":""}`);if(x==="floor"&&d.floor)L.push("    Floor plan notes: "+d.floor.replace(/\n/g,"\n    "));});
  L.push("","3. PARTNER & EVENT LEAD DETAILS");RD_CT.forEach(([k,l])=>{const c=C[k]||{};L.push(na["ct:"+k]?`${l}: not needed`:`${l}: ${v(c.name)} · ${v(c.phone)} · ${v(c.email)}${c.notes?" · "+c.notes:""}`);});RD_PCHK.forEach(([k,l])=>L.push(`${box(chk[k],na["chk:"+k])} ${l}`));
  L.push("","4. PAPERWORK, WAIVERS & INVOICES");RD_PP.forEach(([k,l])=>{const p=P[k]||{};L.push(`${box(p.ok,na["pp:"+k])} ${l} — ${na["pp:"+k]?"not needed":"owner "+v(p.owner)+", due "+(p.due?fmtDate(p.due):"—")+(p.done?", completed "+fmtDate(p.done):"")}`);});L.push(`Waivers on file: ${d.wOn||"__"} of ${d.wOf||"__"} participants · Invoice # / amount: ${v(d.invoice)}`);
  L.push("","5. PARTICIPANT OUTREACH, REGISTRATION & TICKETS");if(d.noReg)L.push("Not needed for this event.");else{L.push(`Participant list owner: ${v(O.listowner)}`,`Expected / confirmed: ${v(O.expected)} / ${v(O.confirmed)}`,`Outreach method(s): ${v(O.method)}`,`Final reminder: ${O.remindDate?fmtDate(O.remindDate):"—"}, by ${v(O.remindWho)}`);if(d.noTix)L.push("Tickets: none for this event");else L.push(`Tickets purchased by: ${v(O.tixWho)}, quantity ${v(O.tixQty)}`,`Ticket purchase deadline: ${O.tixDl?fmtDate(O.tixDl):"—"}`);L.push(`Names submitted to host / venue by: ${v(O.namesWho)}`,`Name submission deadline: ${O.namesDl?fmtDate(O.namesDl):"—"}`);RD_XCHK.forEach(([k,l,t])=>{if(t&&d.noTix)return;L.push(`${box(chk[k],na["chk:"+k])} ${l}`);});}
  L.push("","6. LEGISLATIVE / ELECTED OFFICIAL INVITATIONS");if(d.noLeg)L.push("No elected officials invited.");else RD_LEG.forEach(([k,l])=>L.push(`${l}: ${v(G[k])}`));
  const sc=rdScore(d);L.push("",`Ready: ${sc.done} of ${sc.total} (${sc.pct}%)`);return L.join("\n");}
function rdPersonText(name,items){const first=(name||"").split(" ")[0]||"there";return `Hi ${first},\n\nHere's what you own for upcoming LEAD events:\n\n`+items.map(x=>`• ${x.label} – ${x.d.name||"event"}${x.due?" (due "+fmtDate(x.due)+")":""}`).join("\n")+`\n\nPlease reply to confirm each one, or tell me what you need.\n\nThanks,\n${ME().first}\n`;}

/* ---------- list views ---------- */
function rReady(){const r=S.rd;if(r.open){const d=rdDoc(r.open);if(d)return rdDetail(d);r.open=null;}
  const nav=[["list","Checklists"],["people","By person"],["due","Due this week"]];
  return `<div class="rd"><div class="rd-top"><div><p class="rd-rule">Nothing assumed. Every responsibility has an owner, a deadline, and confirmation.</p><div class="rd-src">Kelly Sheehan's Event Readiness &amp; Accountability Checklist, Oct 28, 2026</div></div><button class="btn pri" data-rd-new="1">+ New checklist</button></div>
  <div class="subnav" style="margin-top:12px">${nav.map(([k,l])=>`<button data-rd-tab="${k}" aria-pressed="${r.tab===k}">${l}</button>`).join("")}</div>
  ${({list:rdListView,people:rdPeopleView,due:rdDueView})[r.tab]()}</div>`;}
function rdListView(){const t0=todayISO();const all=rdAll().sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);const act=all.filter(rdActive),past=all.filter(d=>!rdActive(d)).reverse();
  const sc=act.map(rdScore);const od=sc.reduce((a,s)=>a+s.overdue,0),no=sc.reduce((a,s)=>a+s.noOwner,0),wk=act.reduce((a,d)=>a+rdItems(d).filter(x=>!x.late&&x.due<=addDays(t0,7)).length,0);
  const card=d=>{const s=rdScore(d);const dn=d.date?daysFromToday(d.date):null;return `<div class="rd-card" data-rd-go="${d.id}"><div><div class="n">${esc(d.name||"Untitled event")}</div><div class="s">${[d.date?fmtDate(d.date,true)+(dn!==null&&dn>=0?", "+rel(dn):""):"No date yet",d.location].filter(Boolean).map(esc).join(" · ")}</div>
    <div class="rd-bar ${s.pct===100?"ok":s.overdue?"late":""}"><i style="width:${s.pct}%"></i></div>
    <div class="pills">${s.pct===100?`<span class="pill green">Ready</span>`:""}${s.overdue?`<span class="pill red">${s.overdue} overdue</span>`:""}${s.noOwner?`<span class="pill orange">${s.noOwner} with no owner</span>`:""}${s.unconf&&s.pct<100?`<span class="pill grey">${s.unconf} not confirmed</span>`:""}</div></div>
    <div class="r"><b class="num">${s.pct}%</b><span>${s.done} of ${s.total}</span></div></div>`;};
  const have=new Set(all.map(d=>d.eventId).filter(Boolean));
  const sug=allE().filter(e=>e.date&&e.date>=t0&&e.date<=addDays(t0,45)&&!have.has(e.id)&&(["GO","GO IF IT FITS"].includes(assessOf(e).decision)||(S.edits[e.id]&&S.edits[e.id].went)||e.added)).sort((a,b)=>a.date<b.date?-1:1).slice(0,5);
  return `<div class="strip"><div data-rd-tab="due" class="${od?"warnv":""}"><b class="num">${od}</b><span>overdue across ${act.length} checklist${act.length===1?"":"s"}</span></div><div data-rd-tab="people" class="${no?"warnv":""}"><b class="num">${no}</b><span>job${no===1?"":"s"} with no owner</span></div><div data-rd-tab="due"><b class="num">${wk}</b><span>due in the next 7 days</span></div></div>
  <section class="sec"><div class="h"><h2>Upcoming</h2><span class="meta">${act.length}</span></div><div>${act.map(card).join("")||`<p class="empty">${!S.loaded.ready?ld():"No checklists yet. Press + New checklist, or open any event and choose Start readiness checklist."}</p>`}</div></section>
  ${sug.length?`<section class="sec"><div class="h"><h2>Events that could use one</h2><span class="meta">Marked go, attended or added by you, next 45 days</span></div>${sug.map(e=>`<div class="rd-sug"><div><div style="font-weight:600">${esc(e.name)}</div><div class="small muted">${fmtDate(e.date,true)}${e.time?", "+esc(e.time):""}${e.venue?" · "+esc(e.venue):""}</div></div><button class="btn sm" data-rd-start="${e.id}">Start checklist</button></div>`).join("")}</section>`:""}
  ${past.length?`<section class="sec"><div class="h"><h2>Past</h2><button class="btn sm ghost" data-rd-past="1">${S.rd.past?"Hide":"Show"} ${past.length}</button></div>${S.rd.past?past.map(card).join(""):""}</section>`:""}`;}
function rdPeopleView(){const m={};rdAll().filter(rdActive).forEach(d=>{const na=d.na||{};
    RD_ROLES.forEach(([k,l])=>{if(na["role:"+k])return;const r=(d.roles||{})[k]||{};const w=(r.who||"").trim();(m[w]=m[w]||[]).push({d,label:l,due:r.due,ok:!!r.ok,el:"rd-r-"+k+"-"+(w?"ok":"who")});});
    RD_PP.forEach(([k,l])=>{if(na["pp:"+k])return;const p=(d.pp||{})[k]||{};const w=(p.owner||"").trim();(m[w]=m[w]||[]).push({d,label:l,due:p.due,ok:!!p.ok,el:"rd-pp-"+k+"-"+(w?"ok":"owner")});});});
  const keys=Object.keys(m).filter(k=>k).sort((a,b)=>a.localeCompare(b));const none=(m[""]||[]).filter(x=>!x.ok);if(!keys.length&&!none.length)return `<p class="empty">Assign people on a checklist and they show up here, with everything they own across events.</p>`;
  const t0=todayISO();const row=x=>`<div class="rd-item" data-rd-go="${x.d.id}" data-rd-jumpto="${x.el}"><div class="n">${esc(x.label)}</div><div class="d">${esc(x.d.name||"Untitled event")}${x.d.date?", "+fmtDate(x.d.date):""}</div><div class="r ${x.due&&!x.ok&&x.due<t0?"late":""}">${x.ok?`<span class="pill green">confirmed</span>`:x.due?(x.due<t0?"overdue, ":"due ")+fmtDate(x.due):`<span class="pill sand">no deadline</span>`}</div></div>`;
  const byDoc={};none.forEach(x=>{(byDoc[x.d.id]=byDoc[x.d.id]||[]).push(x);});
  const noneHtml=none.length?`<section class="rd-person"><div class="h"><h3>No owner yet</h3><span class="meta">${none.length} job${none.length===1?"":"s"} across ${Object.keys(byDoc).length} checklist${Object.keys(byDoc).length===1?"":"s"}</span></div>${Object.values(byDoc).map(L=>`<div class="rd-item" data-rd-go="${L[0].d.id}" data-rd-jumpto="${L[0].el}"><div class="n">${L.length} job${L.length===1?"":"s"} with no owner</div><div class="d">${esc(L[0].d.name||"Untitled event")}${L[0].d.date?", "+fmtDate(L[0].d.date):""}: ${esc(L.slice(0,3).map(x=>x.label.split(" (")[0]).join(", "))}${L.length>3?" and more":""}</div><div class="r" style="color:var(--orange)">Assign</div></div>`).join("")}</section>`:"";
  return (keys.length?"":`<p class="empty">No one is assigned yet.</p>`)+keys.map(k=>{const L=m[k],open=L.filter(x=>!x.ok).sort((a,b)=>(a.due||"9")<(b.due||"9")?-1:1),conf=L.length-open.length;
    return `<section class="rd-person"><div class="h"><h3>${k?esc(k):"No owner yet"}</h3><span class="meta">${open.length} open${conf?", "+conf+" confirmed":""}</span>${k&&open.length?`<button class="btn sm" data-rd-pcopy="${esc(k)}">Copy their list</button>`:""}</div>${open.map(row).join("")||`<p class="empty">All confirmed.</p>`}</section>`;}).join("")+noneHtml;}
function rdDueView(){const t0=todayISO(),wk=addDays(t0,7);const L=rdAll().filter(rdActive).flatMap(rdItems).filter(x=>x.due<=wk);
  if(!L.length)return `<p class="empty">Nothing with a deadline in the next 7 days. Items show up here once they have a deadline and aren't confirmed yet.</p>`;
  return `<div style="margin-top:6px">${L.map(x=>`<div class="rd-item" data-rd-go="${x.d.id}" data-rd-jumpto="${x.el}"><div class="n">${esc(x.label)}${x.who?" · <b>"+esc(x.who)+"</b>":` · <span style="color:var(--orange)">no owner</span>`}</div><div class="d">${esc(x.d.name||"Untitled event")}${x.d.date?", "+fmtDate(x.d.date):""}</div><div class="r ${x.late?"late":""}">${x.late?"overdue "+rdOver(x.due)+"d":fmtDate(x.due)+", "+rel(daysFromToday(x.due))}</div></div>`).join("")}</div>`;}

/* ---------- one checklist ---------- */
function rdIn(id,path,val,attrs){return `<input id="${id}" data-rdf="${path}" value="${esc(val==null?"":val)}" ${attrs||""}>`;}
function rdNa(key,on){return `<button class="rd-na" data-rdna="${key}" aria-pressed="${!!on}" title="${on?"Mark as needed again":"Mark as not needed for this event"}">Not needed</button>`;}
function rdDetail(d){const sc=rdScore(d),t0=todayISO(),na=d.na||{},chk=d.chk||{},R=d.roles||{},C=d.ct||{},P=d.pp||{},O=d.out||{},G=d.leg||{};
  const ev=d.eventId?getRec(d.eventId):null;const dn=d.date?daysFromToday(d.date):null;
  const secMeta=s=>{const x=sc.secs[s];return x.t?`<span class="meta ${x.d===x.t?"full":""}">${x.d} of ${x.t} ready</span>`:`<span class="meta">not needed</span>`;};
  const secHead=(i,s,extra)=>`<div class="h"><span class="k">${i}</span><h2>${RD_SECS[i-1][1]}</h2>${secMeta(s)}${extra||""}</div>`;
  const pcls=sc.pct===100?"ok":sc.overdue?"late":"";
  const gapList=S.rd.allGaps?sc.gaps:sc.gaps.slice(0,12);const secNo=Object.fromEntries(RD_SECS.map(([s],i)=>[s,i+1]));
  const ckRow=(k,l,extra)=>{const isNa=!!na["chk:"+k],on=!!chk[k];return `<div class="rd-ck ${isNa?"is-na":on?"is-done":""}" id="rdrow-c-${k}"><label for="rd-c-${k}"><input type="checkbox" id="rd-c-${k}" data-rdf="chk.${k}" ${on?"checked":""} ${isNa?"disabled":""}><span>${esc(l)}</span></label>${extra||""}${rdNa("chk:"+k,isNa)}</div>`;};
  const roleRow=([k,l])=>{const r=R[k]||{},isNa=!!na["role:"+k];const done=!!(r.who&&r.due&&r.ok),late=!!(r.due&&!r.ok&&r.due<t0);const flag=isNa?"":done?"":rdRoleGap(r,t0);const dis=isNa?"disabled":"";
    return `<div class="rd-row rl ${isNa?"is-na":done?"is-done":late?"is-late":""}" id="rdrow-${k}"><div class="rd-l"><span class="rd-dot"></span><span>${esc(l)}${flag?`<small class="rd-flag ${late?"late":""}">${flag}</small>`:""}</span></div>
      ${rdIn("rd-r-"+k+"-who","roles."+k+".who",r.who,`list="rdPeople" placeholder="Who" autocomplete="off" aria-label="${esc(l)}: assigned to" ${dis}`)}${rdIn("rd-r-"+k+"-due","roles."+k+".due",r.due,`type="date" aria-label="${esc(l)}: deadline" ${dis}`)}
      <label class="rd-ok"><input type="checkbox" id="rd-r-${k}-ok" data-rdf="roles.${k}.ok" ${r.ok?"checked":""} ${dis}>Confirmed</label>${rdNa("role:"+k,isNa)}</div>`;};
  const ctRow=([k,l])=>{const c=C[k]||{},isNa=!!na["ct:"+k];const ok=!!(c.name&&(c.phone||c.email));const dis=isNa?"disabled":"";const hint=k==="lead"?(R.lead||{}).who:k==="cover"?(R.cover||{}).who:"";
    return `<div class="rd-row ct ${isNa?"is-na":ok?"is-done":""}" id="rdrow-ct-${k}"><div class="rd-l"><span class="rd-dot"></span><span>${esc(l)}${!isNa&&!ok?`<small class="rd-flag">${!c.name?"no name":"no phone or email"}</small>`:""}</span></div>
      ${rdIn("rd-ct-"+k+"-name","ct."+k+".name",c.name,`placeholder="${esc(hint?hint+" (from assignments)":"Name / organization")}" aria-label="${esc(l)}: name" ${dis}`)}${rdIn("rd-ct-"+k+"-phone","ct."+k+".phone",c.phone,`type="tel" placeholder="Phone" aria-label="${esc(l)}: phone" ${dis}`)}${rdIn("rd-ct-"+k+"-email","ct."+k+".email",c.email,`type="email" placeholder="Email" aria-label="${esc(l)}: email" ${dis}`)}${rdIn("rd-ct-"+k+"-notes","ct."+k+".notes",c.notes,`placeholder="${k==="insurance"?"Policy / certificate #":"Notes"}" aria-label="${esc(l)}: notes" ${dis}`)}${rdNa("ct:"+k,isNa)}</div>`;};
  const ppRow=([k,l])=>{const p=P[k]||{},isNa=!!na["pp:"+k];const late=!!(p.due&&!p.ok&&p.due<t0);const dis=isNa?"disabled":"";
    return `<div class="rd-row pp ${isNa?"is-na":p.ok?"is-done":late?"is-late":""}" id="rdrow-pp-${k}"><div class="rd-l"><span class="rd-dot"></span><span>${esc(l)}${!isNa&&!p.ok?`<small class="rd-flag ${late?"late":""}">${[!p.owner?"no owner":"",late?"overdue "+rdOver(p.due)+"d":!p.due?"no due date":""].filter(Boolean).join(", ")||"not done"}</small>`:""}</span></div>
      ${rdIn("rd-pp-"+k+"-owner","pp."+k+".owner",p.owner,`list="rdPeople" placeholder="Owner" autocomplete="off" aria-label="${esc(l)}: owner" ${dis}`)}${rdIn("rd-pp-"+k+"-due","pp."+k+".due",p.due,`type="date" aria-label="${esc(l)}: due date" ${dis}`)}${rdIn("rd-pp-"+k+"-done","pp."+k+".done",p.done,`type="date" aria-label="${esc(l)}: completed on" ${dis}`)}
      <label class="rd-ok"><input type="checkbox" id="rd-pp-${k}-ok" data-rdf="pp.${k}.ok" ${p.ok?"checked":""} ${dis}>Done</label>${rdNa("pp:"+k,isNa)}</div>`;};
  const preElection=t0<=RD_ELECTION;
  return `<div class="rd"><button class="btn sm ghost rd-back" data-rd-back="1">← All checklists</button>
  <div class="rd-head"><div><p class="rd-eyebrow">Event readiness &amp; accountability</p><h2>${esc(d.name||"Untitled event")}</h2><div class="small muted" style="margin-top:4px">${[rdWhen(d)||"No date yet",d.location].filter(Boolean).map(esc).join(" · ")}${dn!==null&&dn>=0?" · "+rel(dn):""}${ev?` · <button type="button" class="rd-link" data-open="${ev.id}">Open the event</button>`:""}</div></div>
    <div class="rd-pct ${pcls}"><b class="num">${sc.pct}%</b><span>${sc.done} of ${sc.total} ready</span></div></div>
  <div class="rd-bar ${pcls}"><i style="width:${sc.pct}%"></i></div>
  <div class="rd-acts"><button class="btn sm pri" data-rd-copy="assign">Copy who owns what</button><button class="btn sm" data-rd-copy="gaps">Copy status for Kelly</button><button class="btn sm" data-rd-copy="full">Copy full checklist</button>${LOCAL?`<button class="btn sm" data-rd-print="1">Print</button>`:""}<span class="sp"></span>${S.rd.confirmDel?`<span class="rd-confirm">Delete this checklist for good?<button class="btn sm danger" data-rd-delyes="1">Delete</button><button class="btn sm ghost" data-rd-delno="1">Keep it</button></span>`:`<button class="btn sm ghost" data-rd-del="1">Delete</button>`}</div>
  <div class="rd-secnav">${RD_SECS.map(([s,n],i)=>{const x=sc.secs[s];return `<button data-rd-jump="rd-${s}" class="${x.t&&x.d===x.t?"full":""}"><b>${i+1}</b>${esc(RD_SHORT[s])}<span class="c">${x.t?x.d+"/"+x.t:"n/a"}</span></button>`;}).join("")}</div>
  ${sc.gaps.length?`<details class="rd-gaps" open><summary>${sc.gaps.length} open item${sc.gaps.length===1?"":"s"}${sc.overdue?", "+sc.overdue+" overdue":""}</summary><ul>${gapList.map(g=>`<li class="${g.late?"late":""}"><b>${secNo[g.s]}</b><button data-rd-jump="${g.el}">${esc(g.t)}</button></li>`).join("")}</ul>${sc.gaps.length>12?`<button class="more" data-rd-allgaps="1">${S.rd.allGaps?"Show fewer":"Show all "+sc.gaps.length}</button>`:""}</details>`:`<div class="rd-allset">Everything that applies is owned, dated and confirmed.</div>`}

  <section class="rd-sec" id="rd-s1">${secHead(1,"s1")}
    <div class="rd-grid"><div class="f wide"><label for="rd-h-name">Event</label>${rdIn("rd-h-name","name",d.name,"")}</div>
      <div class="f"><label for="rd-h-date">Date</label>${rdIn("rd-h-date","date",d.date,`type="date"`)}</div><div class="f"><label for="rd-h-time">Time</label>${rdIn("rd-h-time","time",d.time,`placeholder="e.g. 5:30 – 8 PM"`)}</div>
      <div class="f wide"><label for="rd-h-location">Location</label>${rdIn("rd-h-location","location",d.location,"")}</div>
      <div class="f"><label for="rd-h-lead">Event lead</label>${rdIn("rd-h-lead","roles.lead.who",(R.lead||{}).who,`list="rdPeople" autocomplete="off"`)}</div><div class="f"><label for="rd-h-host">Host / partner contact</label>${rdIn("rd-h-host","ct.host.name",(C.host||{}).name,"")}</div><div class="f"><label for="rd-h-expected">Expected attendance</label>${rdIn("rd-h-expected","expected",d.expected,`type="number" min="0" inputmode="numeric"`)}</div></div>
    <div class="rd-hd rl" style="margin-top:14px"><span>Responsibility</span><span>Assigned to</span><span>Deadline</span><span>Confirmed</span><span></span></div>
    ${RD_ROLES.map(roleRow).join("")}</section>

  <section class="rd-sec" id="rd-s2">${secHead(2,"s2")}
    ${RD_LOG.map(([k,l,x])=>ckRow(k,l,x==="wear"?rdIn("rd-wear","wear",d.wear,`class="rd-x" placeholder="Attire, shirts, weather" aria-label="What to wear"`):x==="sound"?rdIn("rd-soundtime","soundTime",d.soundTime,`type="time" class="rd-x sm" aria-label="Sound check time"`):"")+(x==="floor"?`<div class="rd-ta"><label for="rd-floor">Floor plan sketch / notes</label><textarea id="rd-floor" data-rdf="floor" placeholder="Doors, tables, registration, food, where the banner goes">${esc(d.floor||"")}</textarea></div>`:"")).join("")}</section>

  <section class="rd-sec" id="rd-s3">${secHead(3,"s3")}
    <div class="rd-hd ct"><span>Role</span><span>Name / organization</span><span>Phone</span><span>Email</span><span>Notes</span><span></span></div>
    ${RD_CT.map(ctRow).join("")}
    <div class="rd-sub">Confirmed with partners</div>${RD_PCHK.map(([k,l])=>ckRow(k,l)).join("")}</section>

  <section class="rd-sec" id="rd-s4">${secHead(4,"s4")}
    <div class="rd-hd pp"><span>Item</span><span>Owner</span><span>Due date</span><span>Completed</span><span>Done</span><span></span></div>
    ${RD_PP.map(ppRow).join("")}
    <div class="rd-grid"><div class="f"><label for="rd-w-on">Waivers on file</label><div class="pair">${rdIn("rd-w-on","wOn",d.wOn,`type="number" min="0" inputmode="numeric" aria-label="Waivers on file"`)}<span class="small muted" style="align-self:center">of</span>${rdIn("rd-w-of","wOf",d.wOf,`type="number" min="0" inputmode="numeric" aria-label="Participants"`)}</div></div><div class="f"><label for="rd-inv">Invoice # / amount</label>${rdIn("rd-inv","invoice",d.invoice,"")}</div></div></section>

  <section class="rd-sec" id="rd-s5">${secHead(5,"s5")}
    <div class="rd-tog"><label><input type="checkbox" id="rd-noreg" data-rdf="noReg" ${d.noReg?"checked":""}>No registration or outreach for this event</label>${d.noReg?"":`<label><input type="checkbox" id="rd-notix" data-rdf="noTix" ${d.noTix?"checked":""}>No tickets for this event</label>`}</div>
    ${d.noReg?`<p class="rd-skip">Marked as not needed. Untick above if that changes.</p>`:`<div class="rd-grid">
      <div class="f"><label for="rd-o-listowner">Participant list owner</label>${rdIn("rd-o-listowner","out.listowner",O.listowner,`list="rdPeople" autocomplete="off"`)}</div>
      <div class="f"><label for="rd-o-expected">Expected / confirmed</label><div class="pair">${rdIn("rd-o-expected","out.expected",O.expected,`type="number" min="0" inputmode="numeric" aria-label="Expected"`)}${rdIn("rd-o-confirmed","out.confirmed",O.confirmed,`type="number" min="0" inputmode="numeric" aria-label="Confirmed" placeholder="Confirmed"`)}</div></div>
      <div class="f"><label for="rd-o-method">Outreach method(s)</label>${rdIn("rd-o-method","out.method",O.method,`placeholder="Calls, texts, flyers, Facebook group"`)}</div>
      <div class="f"><label for="rd-o-reminddate">Final reminder date / completed by</label><div class="pair">${rdIn("rd-o-reminddate","out.remindDate",O.remindDate,`type="date" aria-label="Final reminder date"`)}${rdIn("rd-o-remindwho","out.remindWho",O.remindWho,`list="rdPeople" autocomplete="off" placeholder="Who" aria-label="Final reminder completed by"`)}</div></div>
      ${d.noTix?"":`<div class="f"><label for="rd-o-tixwho">Tickets purchased by / quantity</label><div class="pair">${rdIn("rd-o-tixwho","out.tixWho",O.tixWho,`list="rdPeople" autocomplete="off" aria-label="Tickets purchased by"`)}${rdIn("rd-o-tixqty","out.tixQty",O.tixQty,`type="number" min="0" inputmode="numeric" placeholder="Qty" aria-label="Ticket quantity" style="max-width:90px"`)}</div></div>
      <div class="f"><label for="rd-o-tixdl">Ticket purchase deadline</label>${rdIn("rd-o-tixdl","out.tixDl",O.tixDl,`type="date"`)}</div>`}
      <div class="f"><label for="rd-o-nameswho">Names submitted to host / venue by</label>${rdIn("rd-o-nameswho","out.namesWho",O.namesWho,`list="rdPeople" autocomplete="off"`)}</div>
      <div class="f"><label for="rd-o-namesdl">Name submission deadline</label>${rdIn("rd-o-namesdl","out.namesDl",O.namesDl,`type="date"`)}</div></div>
      <div style="margin-top:10px">${RD_XCHK.filter(([k,l,t])=>!(t&&d.noTix)).map(([k,l])=>ckRow(k,l)).join("")}</div>`}</section>

  <section class="rd-sec" id="rd-s6">${secHead(6,"s6")}
    ${preElection?`<div class="note" style="margin-top:10px">Election hold: no candidate or campaign invitations before Nov 3. Check with Kelly before inviting any official who is on the ballot.</div>`:""}
    <div class="rd-tog"><label><input type="checkbox" id="rd-noleg" data-rdf="noLeg" ${d.noLeg?"checked":""}>No elected officials invited to this event</label></div>
    ${d.noLeg?`<p class="rd-skip">Marked as not needed. Untick above if that changes.</p>`:`<div class="rd-grid">${RD_LEG.map(([k,l])=>`<div class="f"><label for="rd-g-${k}">${l}</label>${rdIn("rd-g-"+k,"leg."+k,G[k],`list="rdPeople" autocomplete="off"`)}</div>`).join("")}</div>`}</section>

  <p class="rd-foot">From Kelly Sheehan's Event Readiness &amp; Accountability Checklist (Oct 28, 2026).${d.updatedAt?" Last change "+esc(new Date(d.updatedAt).toLocaleString([],{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}))+".":""}</p>
  <datalist id="rdPeople">${rdPeople().map(n=>`<option value="${esc(n)}"></option>`).join("")}</datalist></div>`;}

/* ---------- new checklist ---------- */
function rdNewSheet(pre){const t0=todayISO();const have=new Set(rdAll().map(d=>d.eventId).filter(Boolean));
  const rk=e=>e.date&&e.date>=t0?"0"+e.date:e.recurring?"1"+e.name:"2"+e.name;const ev=allE().filter(e=>(!e.date||e.date>=t0||e.recurring)&&!have.has(e.id)).sort((a,b)=>rk(a)<rk(b)?-1:1).slice(0,250);const src=rdAll().sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
  openSheet("New readiness checklist",`<div class="fields"><div class="f wide"><label for="rdn-ev">Event</label><select id="rdn-ev"><option value="">Not in the hub yet (type it in)</option>${ev.map(e=>`<option value="${e.id}" ${pre===e.id?"selected":""}>${esc((e.date&&e.date>=t0?fmtDate(e.date)+" · ":e.recurring?"Repeats · ":"No date · ")+e.name)}</option>`).join("")}</select></div>
    <div class="f wide" data-rdn-man="1"><label for="rdn-name">Event name</label><input id="rdn-name" placeholder="e.g. Family Financial Literacy Night"></div><div class="f" data-rdn-man="1"><label for="rdn-date">Date</label><input id="rdn-date" type="date"></div>
    <div class="f ${src.length?"":"hide"}"><label for="rdn-from">Copy owners from</label><select id="rdn-from"><option value="">Start blank</option>${src.map(d=>`<option value="${d.id}">${esc(d.name||"Untitled")}</option>`).join("")}</select></div></div>
    <p class="small muted" style="margin-top:10px">Copying brings over who owns each job. Deadlines and confirmations start fresh, so nothing is assumed.</p>`,{btns:`<button class="btn pri" id="rdn-go">Start checklist</button><button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  const sync=()=>{const m=!$("#rdn-ev").value;document.querySelectorAll("#overlay [data-rdn-man]").forEach(x=>x.classList.toggle("hide",!m));};$("#rdn-ev").addEventListener("change",sync);sync();
  $("#rdn-go").addEventListener("click",()=>{const eid=$("#rdn-ev").value,from=$("#rdn-from").value;if(!eid){const n=$("#rdn-name").value.trim();if(!n){toast("Pick an event or type its name");$("#rdn-name").focus();return;}const dt=$("#rdn-date").value;closeOverlay();rdCreate("",from,{name:n,date:dt});return;}closeOverlay();rdCreate(eid,from);});}

/* ---------- event drawer: show readiness for that event ---------- */
function rdDrawer(id){if(!tabOK("ready"))return;const r=getRec(id);if(!r||!isEvent(r))return;const dr=$("#overlay .drawer");if(!dr||dr.querySelector(".rd-dr"))return;const at=dr.querySelector(".edit");if(!at)return;
  const d=rdForEvent(id);const sc=d?rdScore(d):null;const box=document.createElement("div");box.className="rd-dr";
  box.innerHTML=`<div><h3>Event readiness</h3><div class="small muted">${d?`${sc.pct}% ready, ${sc.done} of ${sc.total}${sc.overdue?`, <span style="color:var(--red)">${sc.overdue} overdue</span>`:""}${sc.noOwner?`, ${sc.noOwner} with no owner`:""}`:"Kelly's checklist: owners, deadlines, confirmation"}</div></div><button class="btn sm ${d?"":"pri"}" type="button">${d?"Open checklist":"Start readiness checklist"}</button>`;
  box.querySelector("button").addEventListener("click",()=>{closeOverlay();if(d)rdOpen(d.id);else rdCreate(id);});at.parentNode.insertBefore(box,at);}
{const _od=openDetail;openDetail=function(id,keep){_od(id,keep);try{rdDrawer(id);}catch(e){}};}
{const _go=go;go=function(tab,keep){if(tab==="ready"&&!keep){S.rd.open=null;S.rd.confirmDel=false;}_go(tab,keep);};}

/* ---------- events ---------- */
function rdBind(v){
  v.querySelectorAll("[data-rd-go]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("a,button:not([data-rd-go])"))return;e.stopPropagation();rdOpen(el.dataset.rdGo,el.dataset.rdJumpto||"");}));
  if(S.tab!=="ready")return;const id=S.rd.open;
  v.querySelectorAll("[data-rd-tab]").forEach(el=>el.addEventListener("click",()=>{S.rd.tab=el.dataset.rdTab;render();}));
  v.querySelectorAll("[data-rd-new]").forEach(el=>el.addEventListener("click",()=>rdNewSheet()));
  v.querySelectorAll("[data-rd-start]").forEach(el=>el.addEventListener("click",()=>rdCreate(el.dataset.rdStart)));
  v.querySelectorAll("[data-rd-past]").forEach(el=>el.addEventListener("click",()=>{S.rd.past=!S.rd.past;render();}));
  v.querySelectorAll("[data-rd-pcopy]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();const n=el.dataset.rdPcopy;const L=rdAll().filter(rdActive).flatMap(d=>{const na=d.na||{};return RD_ROLES.filter(([k])=>!na["role:"+k]).map(([k,l])=>({d,label:l,r:(d.roles||{})[k]||{}})).filter(x=>(x.r.who||"").trim()===n&&!x.r.ok).map(x=>({d:x.d,label:x.label,due:x.r.due})).concat(RD_PP.filter(([k])=>!na["pp:"+k]).map(([k,l])=>({d,label:l,p:(d.pp||{})[k]||{}})).filter(x=>(x.p.owner||"").trim()===n&&!x.p.ok).map(x=>({d:x.d,label:x.label,due:x.p.due})));}).sort((a,b)=>(a.due||"9")<(b.due||"9")?-1:1);copyText(rdPersonText(n,L),"Copied "+n.split(" ")[0]+"'s list");}));
  if(!id)return;
  v.querySelectorAll("[data-rd-back]").forEach(el=>el.addEventListener("click",()=>{S.rd.open=null;S.rd.confirmDel=false;render();window.scrollTo({top:0});}));
  v.querySelectorAll("[data-rdf]").forEach(el=>{const path=el.dataset.rdf;
    if(el.type==="checkbox")el.addEventListener("change",()=>{rdEdit(id,path,el.checked,true);render();});
    else el.addEventListener("input",()=>{rdEdit(id,path,el.type==="number"?(el.value===""?"":el.value):el.value);});});
  v.querySelectorAll("[data-rdna]").forEach(el=>el.addEventListener("click",()=>{const d=rdDoc(id);const k=el.dataset.rdna;rdEdit(id,"na."+k,!((d.na||{})[k]),true);render();}));
  v.querySelectorAll("[data-rd-jump]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();rdJump(el.dataset.rdJump);}));
  v.querySelectorAll("[data-rd-allgaps]").forEach(el=>el.addEventListener("click",()=>{S.rd.allGaps=!S.rd.allGaps;render();}));
  v.querySelectorAll("[data-rd-copy]").forEach(el=>el.addEventListener("click",()=>{const d=rdDoc(id);if(!d)return;const k=el.dataset.rdCopy;copyText(k==="assign"?rdAssignText(d):k==="gaps"?rdGapsText(d):rdFullText(d),k==="assign"?"Copied. Paste it in the team chat or an email.":k==="gaps"?"Copied. Paste into an email to Kelly.":"Checklist copied");}));
  v.querySelectorAll("[data-rd-print]").forEach(el=>el.addEventListener("click",()=>{try{window.print();}catch(e){}}));
  v.querySelectorAll("[data-rd-del]").forEach(el=>el.addEventListener("click",()=>{S.rd.confirmDel=true;render();}));
  v.querySelectorAll("[data-rd-delno]").forEach(el=>el.addEventListener("click",()=>{S.rd.confirmDel=false;render();}));
  v.querySelectorAll("[data-rd-delyes]").forEach(el=>el.addEventListener("click",()=>rdDelete(id)));
  if(S.rd.jump){const j=S.rd.jump;S.rd.jump="";setTimeout(()=>rdJump(j),30);}
}
function rdJump(elId){const el=document.getElementById(elId);if(!el)return;const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;el.scrollIntoView({block:el.tagName==="SECTION"?"start":"center",behavior:reduce?"auto":"smooth"});if(/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)&&!el.disabled){try{el.focus({preventScroll:true});}catch(e){}}}

/* ============ Email signature (added Oct 28, 2026) ============
   LEAD's signature builder, moved into the hub. The HTML it copies is the same table layout
   as LEAD-Email-Signature.html, so it pastes the same way into Gmail. Details are kept in this
   browser only (they belong to whoever is using the page). */
const SG_KEY="leadSig2";
S.sg=(()=>{const def={name:ME().name,title:ME().title,phone:ME().phone,email:ME().email,layout:"side",fbMode:"main",fbUrl:""};try{const s=JSON.parse(localStorage.getItem(SG_KEY)||"null");if(s&&typeof s==="object")Object.keys(def).forEach(k=>{if(s[k]!=null&&s[k]!=="")def[k]=String(s[k]);});}catch(e){}return def;})();
function sgSave(){try{localStorage.setItem(SG_KEY,JSON.stringify(S.sg));}catch(e){}}
const SG_NAVY="#13397A",SG_BLUE="#2457D6";
const SG_IMG={logo:"https://ctlead.org/wp-content/uploads/2026/01/logo-lead-768x768.png",fb:"https://img.icons8.com/ios-glyphs/100/F26522/facebook-circled.png",tw:"https://img.icons8.com/ios-glyphs/100/F26522/twitter-circled.png",li:"https://img.icons8.com/ios-glyphs/100/F26522/linkedin-circled.png",ig:"https://img.icons8.com/ios-glyphs/100/F26522/instagram-circle.png",phone:"https://img.icons8.com/ios-filled/100/2457D6/phone.png",mail:"https://img.icons8.com/ios-filled/100/2457D6/new-post.png",link:"https://img.icons8.com/ios-filled/100/2457D6/link.png"};
const SG_LINKS={fb:"https://www.facebook.com/LatinosforEducationalAdvocacyandDiversity/",tw:"https://twitter.com/ct_lead",li:"https://www.linkedin.com/company/CT-LEAD/",ig:"https://www.instagram.com/ctlead/",site:"https://ctlead.org/"};
function sgTel(p){let d=String(p).replace(/\D/g,"");if(d.length===10)d="1"+d;return "tel:+"+d;}
function sgData(){const s=S.sg;let fb=SG_LINKS.fb;if(s.fbMode==="center"&&/^https?:\/\//i.test((s.fbUrl||"").trim()))fb=s.fbUrl.trim();
  return {name:(s.name||"").trim()||"Your Full Name",title:(s.title||"").trim()||"Your Title",phone:(s.phone||"").trim()||"Office Number",email:(s.email||"").trim()||"yourname@ctlead.org",fb,layout:s.layout};}
function sgHTML(d){
  const F="font-family:Arial,Helvetica,sans-serif;";const T='<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">';
  // The logo file has built-in transparent space; the icon row is indented to line up with the visible logo.
  const icon=(href,src,alt,last)=>'<td valign="middle" style="padding:0 '+(last?0:7)+'px 0 0;"><a href="'+esc(href)+'" target="_blank" style="text-decoration:none;"><img src="'+src+'" width="26" height="26" alt="'+alt+'" style="display:block;width:26px;height:26px;border:0;"></a></td>';
  const row=(src,alt,href,text,color)=>'<tr><td width="28" valign="middle" style="padding:4px 10px 4px 0;width:28px;"><img src="'+src+'" width="18" height="18" alt="'+alt+'" style="display:block;width:18px;height:18px;border:0;"></td><td valign="middle" style="padding:4px 0;'+F+'font-size:14px;font-weight:bold;line-height:20px;white-space:nowrap;"><a href="'+esc(href)+'" target="_blank" style="color:'+color+';text-decoration:underline;">'+text+'</a></td></tr>';
  const logo=px=>'<a href="'+SG_LINKS.site+'" target="_blank"><img src="'+SG_IMG.logo+'" width="'+px+'" height="'+px+'" alt="LEAD - Leaders for Educational Advocacy and Diversity" style="display:block;width:'+px+'px;height:'+px+'px;border:0;"></a>';
  const icons=T+'<tr>'+icon(d.fb,SG_IMG.fb,"Facebook")+icon(SG_LINKS.tw,SG_IMG.tw,"X / Twitter")+icon(SG_LINKS.li,SG_IMG.li,"LinkedIn")+icon(SG_LINKS.ig,SG_IMG.ig,"Instagram",true)+'</tr></table>';
  const info=extra=>T+'<tr><td colspan="2" style="padding:0;font-family:Georgia,\'Times New Roman\',serif;font-size:17px;font-weight:bold;line-height:26px;color:'+SG_NAVY+';letter-spacing:0.3px;white-space:nowrap;">'+esc(d.name.toUpperCase())+'</td></tr>'+
    '<tr><td colspan="2" style="padding:0 0 8px 0;'+F+'font-size:12px;font-weight:bold;line-height:16px;color:'+SG_NAVY+';white-space:nowrap;">'+esc(d.title.toUpperCase())+'</td></tr>'+
    '<tr><td colspan="2" style="padding:0 0 8px 0;"><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;"><tr><td style="border-top:1px solid '+SG_BLUE+';font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td></tr>'+
    row(SG_IMG.phone,"Phone",sgTel(d.phone),esc(d.phone),SG_BLUE)+row(SG_IMG.mail,"Email","mailto:"+d.email,esc(d.email),SG_BLUE)+row(SG_IMG.link,"Website",SG_LINKS.site,"CTLEAD.ORG",SG_NAVY)+(extra||"")+'</table>';
  if(d.layout==="side")return T+'<tr><td valign="middle" style="padding:0;">'+T+'<tr><td style="border-right:1px solid '+SG_BLUE+';padding:2px 24px 2px 0;">'+info('<tr><td colspan="2" style="padding:12px 0 0 0;">'+icons+'</td></tr>')+'</td></tr></table></td><td valign="middle" style="padding:0 0 0 2px;">'+logo(200)+'</td></tr></table>';
  return T+'<tr><td colspan="2" style="padding:0;">'+logo(160)+'</td></tr><tr><td valign="top" style="padding:0 30px 0 18px;">'+icons+'</td><td valign="top" style="padding:0;">'+info()+'</td></tr></table>';}
function sgPlain(d){return d.name.toUpperCase()+"\n"+d.title.toUpperCase()+"\n"+d.phone+"\n"+d.email+"\nCTLEAD.ORG";}
function sgEmailOK(){return /@ctlead\.org$/i.test((S.sg.email||"").trim());}
function rSig(){const s=S.sg;const f=(k,l,attrs,hint)=>`<div class="f"><label for="sg-${k}">${l}</label><input id="sg-${k}" data-sg="${k}" value="${esc(s[k]||"")}" ${attrs||""}>${hint?`<div class="sg-hint">${hint}</div>`:""}</div>`;
  return `<p class="muted" style="margin:4px 0 0;max-width:68ch">Fill in your details, copy the signature, and paste it into Gmail. It uses LEAD's logo, social icons and links.</p>
  <div class="sg-grid"><section class="sec" style="margin-top:14px"><div class="h"><h2>Your details</h2></div><div class="fields">
    ${f("name","Full name",`autocomplete="name"`)}${f("title","Job title","","Use your current approved title.")}${f("phone","Office phone",`type="tel"`,"East Hartford center (HQ): (860) 206-5495")}
    <div class="f"><label for="sg-email">LEAD email</label><input id="sg-email" data-sg="email" type="email" value="${esc(s.email||"")}" placeholder="yourname@ctlead.org" autocomplete="email"><div class="sg-warn" id="sgEmailWarn" ${sgEmailOK()?"hidden":""}>Add your @ctlead.org email before copying.</div></div>
    <div class="f"><label for="sg-layout">Layout</label><select id="sg-layout" data-sg="layout"><option value="side" ${s.layout==="side"?"selected":""}>Side by side (info left, logo right)</option><option value="stacked" ${s.layout==="stacked"?"selected":""}>Stacked (logo on top)</option></select></div>
    <div class="f"><label for="sg-fbMode">Facebook icon links to</label><select id="sg-fbMode" data-sg="fbMode"><option value="main" ${s.fbMode!=="center"?"selected":""}>LEAD's main Facebook page</option><option value="center" ${s.fbMode==="center"?"selected":""}>My center's Facebook group</option></select></div>
    <div class="f" id="sgFbWrap" ${s.fbMode==="center"?"":"hidden"}><label for="sg-fbUrl">Center Facebook group link</label><input id="sg-fbUrl" data-sg="fbUrl" type="url" value="${esc(s.fbUrl||"")}" placeholder="https://www.facebook.com/groups/..."></div>
  </div></section>
  <section class="sec" style="margin-top:14px;min-width:0"><div class="h"><h2>Preview</h2></div>
    <div class="sg-warn" id="sgImgWarn" hidden>${LOCAL?"The logo and icons didn't load. Check that you're online.":"This page can't show the logo and icons, but the copied signature still links to them, so they show up in Gmail. To see them here, open the downloaded hub file in Chrome."}</div>
    <div class="sg-paper"><p class="dash">--</p><div id="sgSig">${sgHTML(sgData())}</div></div>
    <div class="chips" style="margin-top:12px"><button class="btn pri" data-sg-copy="rich">Copy signature</button><button class="btn" data-sg-copy="code">Copy HTML code</button></div>
    <p class="sg-hint" style="margin-top:8px">Images load from ctlead.org and icons8.com, so you need to be online to see them.</p></section></div>
  <section class="sec"><div class="h"><h2>Put it in Gmail</h2></div><ol class="sg-steps">
    <li>Click <b>Copy signature</b> above.</li><li>In Gmail (signed in to your LEAD account), click the gear at top right, then <b>See all settings</b>.</li>
    <li>On the <b>General</b> tab, scroll to <b>Signature</b>. Delete any old LEAD signature, then click <b>Create new</b> and name it "LEAD".</li>
    <li>Click in the signature box and paste (<kbd>Ctrl</kbd>+<kbd>V</kbd> or <kbd>Cmd</kbd>+<kbd>V</kbd>).</li><li>Under <b>Signature defaults</b>, choose "LEAD" for new emails and for replies/forwards.</li>
    <li>Scroll to the bottom and click <b>Save Changes</b>.</li><li>Send yourself a test email and click every icon and link.</li></ol>
    <p class="sg-hint" style="margin-top:6px">If the paste comes in plain or the images break, use <b>Copy HTML code</b> in a different mail app, or open the downloaded hub file in Chrome and copy again.</p></section>`;}
function sgPreview(){const box=$("#sgSig");if(!box)return;box.innerHTML=sgHTML(sgData());const w=$("#sgEmailWarn");if(w)w.hidden=sgEmailOK();const fw=$("#sgFbWrap");if(fw)fw.hidden=S.sg.fbMode!=="center";sgWatchImgs();}
function sgWatchImgs(){const box=$("#sgSig");if(!box)return;box.querySelectorAll("img").forEach(im=>{const bad=()=>{const w=$("#sgImgWarn");if(w)w.hidden=false;};im.addEventListener("error",bad);if(im.complete&&im.naturalWidth===0&&im.src)bad();});}
function sgSelectCopy(el){const r=document.createRange();r.selectNodeContents(el);const s=window.getSelection();s.removeAllRanges();s.addRange(r);let ok=false;try{ok=document.execCommand("copy");}catch(e){}s.removeAllRanges();return ok;}
function sgBind(v){if(S.tab!=="sig")return;sgWatchImgs();
  v.querySelectorAll("[data-sg]").forEach(el=>{const h=()=>{S.sg[el.dataset.sg]=el.value;sgSave();sgPreview();};el.addEventListener("input",h);el.addEventListener("change",h);});
  v.querySelectorAll("[data-sg-copy]").forEach(el=>el.addEventListener("click",()=>{const d=sgData(),html=sgHTML(d);
    if(el.dataset.sgCopy==="code"){copyText(html,"HTML code copied");return;}
    const done=()=>toast(sgEmailOK()?"Copied. Paste it into Gmail's signature box.":"Copied, but your LEAD email is still blank.");
    const fall=()=>{if(sgSelectCopy($("#sgSig")))done();else toast("Copy blocked. Select the preview with your mouse and copy it.");};
    try{if(navigator.clipboard&&window.ClipboardItem){navigator.clipboard.write([new ClipboardItem({"text/html":new Blob([html],{type:"text/html"}),"text/plain":new Blob([sgPlain(d)],{type:"text/plain"})})]).then(done,fall);}else fall();}catch(e){fall();}}));}

/* ============ EH Center (access, logins, codes) ============
   Built in: account emails, network names, how to sign in.
   NOT built in: passwords and PINs. Those live only in the browser they are added to
   (localStorage key below). They are never written to the hub's saved data, backups or exports. */
const CT_KEY="lead_hub_center_codes";
const CT_ICONS={
  door:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.3 10.5V7.6a3.7 3.7 0 0 1 7.4 0v2.9"/><circle cx="12" cy="15.4" r="1.2"/><path d="M12 16.6v1.6"/></svg>',
  wifi:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.6 9.2a13.6 13.6 0 0 1 18.8 0"/><path d="M5.6 12.6a9.3 9.3 0 0 1 12.8 0"/><path d="M8.7 16a4.8 4.8 0 0 1 6.6 0"/><circle cx="12" cy="19.3" r="1.1"/></svg>',
  mac:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="5" width="15" height="10.5" rx="1.6"/><path d="M2.5 18.6h19"/><path d="M10 18.6l.6-1.3h2.8l.6 1.3"/></svg>',
  cart:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3.5" width="16" height="12" rx="1.6"/><path d="M4 7.6h16M4 11.6h16"/><path d="M7 15.5v3M17 15.5v3"/><circle cx="7" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>',
  eb:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7h17v3.2a1.8 1.8 0 0 0 0 3.6V17h-17v-3.2a1.8 1.8 0 0 0 0-3.6z"/><path d="M14.5 7.4v1.4M14.5 11.3v1.4M14.5 15.2v1.4"/></svg>'
};
const CT_TILES=[
  {id:"door",name:"Door lockbox",sub:"Getting into the center",tone:"orange",line:"Lockbox at the door",
   fields:[{k:"door.pin",l:"Lockbox PIN",secret:1}]},
  {id:"wifi",name:"Wi-Fi",sub:"Center network",tone:"blue",line:"LEAD 1 · LEAD 2 · LEAD 3",
   fields:[{l:"Networks",chips:["LEAD 1","LEAD 2","LEAD 3"],note:"Same password for all three"},{k:"wifi.pw",l:"Password",secret:1}]},
  {id:"mac",name:"Laptop & iCloud",sub:"Center laptop and desktop",tone:"violet",line:""+CTA("acct1")+"",
   fields:[{l:"iCloud / email",v:""+CTA("acct1")+"",copy:1},{k:"mac.pw",l:"Password",secret:1},{k:"mac.dpin",l:"Desktop PIN",secret:1},{k:"mac.lpin",l:"Laptop PIN",secret:1}]},
  {id:"cart",name:"Computer cart",sub:"Shared laptops on the cart",tone:"green",line:"Microsoft account",
   fields:[{k:"cart.pin",l:"Login screen PIN",secret:1},{l:"Microsoft account",v:""+CTA("acct0")+"",copy:1},{k:"cart.pw",l:"Password",secret:1}]},
  {id:"eb",name:"Eventbrite",sub:"Event sign-ups",tone:"sand",line:"Sign in with Google",
   fields:[{l:"Account",v:""+CTA("acct1")+"",copy:1},{l:"How to sign in",v:"Continue with Google, using the "+CTA("acct1")+" Gmail. No separate password."}],
   link:"https://www.eventbrite.com/signin/",linkLabel:"Open Eventbrite"}
];
const CT_BY=Object.fromEntries(CT_TILES.map(t=>[t.id,t]));
const CT_SECRETS=CT_TILES.flatMap(t=>t.fields.filter(f=>f.secret).map(f=>f.k));
TITLES.center="EH Center";PAGE_CONTEXT.center="Access, logins & codes";
S.ctMem=null;S.ctShow={};S.ctOpen=null;

/* ---------- device-only store ---------- */
function ctLoad(){if(S.ctMem)return S.ctMem;let o={};try{o=JSON.parse(localStorage.getItem(CT_KEY)||"{}")||{};}catch(e){o={};}if(typeof o!=="object"||Array.isArray(o))o={};S.ctMem=o;return o;}
function ctSave(o){S.ctMem=o;try{if(Object.keys(o).length)localStorage.setItem(CT_KEY,JSON.stringify(o));else localStorage.removeItem(CT_KEY);return true;}catch(e){toast("This browser won't keep codes after you close it.");return false;}}
function ctGet(k){const v=ctLoad()[k];return typeof v==="string"?v:"";}
function ctCount(){return CT_SECRETS.filter(k=>ctGet(k)).length;}
function ctTileReady(t){const ks=t.fields.filter(f=>f.secret).map(f=>f.k);return ks.every(k=>ctGet(k));}

/* ---------- paste the "EH information" doc ---------- */
function ctParse(txt){const out={};let sec=null;
  const lines=String(txt||"").split(/\r?\n/).map(l=>l.replace(/^[\s•●▪◦○■\-*·]+/,"").trim()).filter(Boolean);
  for(const l of lines){const m=l.match(/^([^:]{1,40}?)\s*:\s*(.+)$/);
    if(!m){const h=l.toLowerCase();
      if(/eventbrite/.test(h))sec="eb";else if(/wi-?\s?fi/.test(h))sec="wifi";else if(/cart/.test(h))sec="cart";else if(/box\s?lock|lock\s?box|door/.test(h))sec="door";else if(/icloud|laptop/.test(h))sec="mac";
      continue;}
    const k=m[1].toLowerCase(),v=m[2].trim();if(!v)continue;
    if(sec==="mac"){if(/desktop/.test(k))out["mac.dpin"]=v;else if(/laptop/.test(k))out["mac.lpin"]=v;else if(/pass/.test(k))out["mac.pw"]=v;}
    else if(sec==="wifi"){if(/pass/.test(k))out["wifi.pw"]=v;}
    else if(sec==="cart"){if(/pin/.test(k))out["cart.pin"]=v;else if(/pass/.test(k))out["cart.pw"]=v;}
    else if(sec==="door"){if(/pin|code|combo/.test(k))out["door.pin"]=v;}
  }
  return out;}

/* ---------- page ---------- */
function ctTile(t){const ready=t.fields.some(f=>f.secret)?ctTileReady(t):null;
  const pill=ready===null?`<span class="pill blue"><i></i>No code needed</span>`:ready?`<span class="pill green"><i></i>On this device</span>`:`<span class="pill sand"><i></i>Add code</span>`;
  return `<button class="ct-tile tone-${t.tone}" data-ct-tile="${t.id}" id="ct-tile-${t.id}"><span class="ct-ic">${CT_ICONS[t.id]}</span><span class="t">${esc(t.name)}</span><span class="l">${esc(t.line)}</span>${pill}</button>`;}
function rCenter(){const n=ctCount(),N=CT_SECRETS.length;
  return `${rCtrCal()}<section class="ct">
    <div class="ct-band">
      <div class="ct-meter" role="img" aria-label="${n} of ${N} codes saved on this device">${CT_SECRETS.map(k=>`<i class="${ctGet(k)?"on":""}"></i>`).join("")}</div>
      <div class="ct-bt"><b class="num">${n}/${N}</b> codes on this device</div>
      <span class="sp"></span>
      <button class="btn sm ${n?"":"pri"}" data-ct="paste" id="ct-paste-btn">Paste from doc</button>
      ${n?`<button class="btn sm ghost" data-ct="forget" id="ct-forget-btn">Forget</button>`:""}
      <button class="btn sm ghost ct-q" data-ct="why" id="ct-why-btn" aria-label="How the codes are kept" title="How the codes are kept">?</button>
    </div>
    <div class="ct-grid">${CT_TILES.map(ctTile).join("")}</div>
  </section>`;}
function ctBind(v){if(S.tab!=="center")return;
  v.querySelectorAll("[data-ct-tile]").forEach(b=>b.addEventListener("click",()=>ctSheet(b.dataset.ctTile)));
  v.querySelectorAll("[data-ct]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.ct;
    if(a==="paste")ctPaste();else if(a==="why")ctWhy();
    else if(a==="forget"){if(!b.dataset.armed){b.dataset.armed="1";b.textContent="Tap again to forget";return;}ctSave({});S.ctShow={};toast("Codes removed from this device");render();}}));}

/* ---------- tile sheet ---------- */
function ctRow(f,id){
  if(f.chips)return `<div class="ct-r"><div class="ct-l">${esc(f.l)}</div><div class="ct-v"><span class="ct-chips">${f.chips.map(c=>`<span>${esc(c)}</span>`).join("")}</span>${f.note?`<div class="small muted">${esc(f.note)}</div>`:""}</div></div>`;
  if(!f.secret)return `<div class="ct-r"><div class="ct-l">${esc(f.l)}</div><div class="ct-v">${esc(f.v)}</div>${f.copy?`<div class="ct-acts"><button class="btn sm" data-ctc="${esc(f.v)}">Copy</button></div>`:""}</div>`;
  const val=ctGet(f.k);
  if(!val)return `<div class="ct-r"><div class="ct-l">${esc(f.l)}</div><div class="ct-v none">Not on this device yet</div><div class="ct-acts"><button class="btn sm" data-cts="edit">Add</button></div></div>`;
  const shown=!!S.ctShow[f.k];
  return `<div class="ct-r"><div class="ct-l">${esc(f.l)}</div><div class="ct-v code">${shown?esc(val):"••••••••"}</div><div class="ct-acts"><button class="btn sm ghost" data-ctshow="${f.k}">${shown?"Hide":"Show"}</button><button class="btn sm" data-ctk="${f.k}">Copy</button></div></div>`;}
function ctSheet(id,edit){const t=CT_BY[id];if(!t)return;if(S.ctOpen!==id){S.ctShow={};S.ctOpen=id;}
  const secrets=t.fields.filter(f=>f.secret);
  const head=`<div class="ct-shead tone-${t.tone}"><span class="ct-ic sm">${CT_ICONS[t.id]}</span><span class="small muted">${esc(t.sub)}</span></div>`;
  let body,btns;
  if(edit){
    body=`${head}<p class="small muted">Saved in this browser only. Leave a box empty to remove that code.</p><div class="ct-edit">${secrets.map(f=>`<div class="f"><label for="ctf-${f.k.replace(".","-")}">${esc(f.l)}</label><input id="ctf-${f.k.replace(".","-")}" data-ctf="${f.k}" value="${esc(ctGet(f.k))}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></div>`).join("")}</div>`;
    btns=`<button class="btn pri" data-cts="save">Save on this device</button><button class="btn ghost" data-cts="cancel">Cancel</button>`;
  }else{
    body=`${head}<div class="ct-rows">${t.fields.map(f=>ctRow(f,id)).join("")}</div>`;
    btns=`${secrets.length?`<button class="btn" data-cts="edit">Edit codes</button>`:""}${t.id==="wifi"&&ctGet("wifi.pw")?`<button class="btn" data-cts="guest">Copy for a guest</button>`:""}${t.link?`<a class="btn" href="${t.link}" target="_blank" rel="noopener">${esc(t.linkLabel)} ↗</a>`:""}<button class="btn ghost" data-close="1">Close</button>`;
  }
  openSheet(t.name,body,{btns});
  const o=$("#overlay");
  o.querySelectorAll("[data-ctc]").forEach(b=>b.addEventListener("click",()=>copyText(b.dataset.ctc,"Copied")));
  o.querySelectorAll("[data-ctk]").forEach(b=>b.addEventListener("click",()=>copyText(ctGet(b.dataset.ctk),"Copied")));
  o.querySelectorAll("[data-ctshow]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.ctshow;S.ctShow[k]=!S.ctShow[k];ctSheet(id);}));
  o.querySelectorAll("[data-cts]").forEach(b=>b.addEventListener("click",()=>{const a=b.dataset.cts;
    if(a==="edit")ctSheet(id,true);
    else if(a==="cancel")ctSheet(id);
    else if(a==="guest")copyText(`Wi-Fi: LEAD 1, LEAD 2 or LEAD 3\nPassword: ${ctGet("wifi.pw")}`,"Copied for a guest");
    else if(a==="save"){const cur={...ctLoad()};o.querySelectorAll("[data-ctf]").forEach(inp=>{const v=inp.value.trim();if(v)cur[inp.dataset.ctf]=v;else delete cur[inp.dataset.ctf];});ctSave(cur);toast("Saved on this device");render();ctSheet(id);}
  }));
  if(edit){const first=o.querySelector("[data-ctf]");if(first)first.focus();}
}

/* ---------- paste + explainer ---------- */
function ctPaste(){
  openSheet("Paste the EH information doc",`<p class="small muted">In the Google Doc, select all and copy, then paste below. Only the passwords and PINs are kept, in this browser.</p><textarea id="ctPasteBox" class="ct-pastebox" placeholder="Paste the doc here" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea><div class="small muted" id="ctPasteHint" aria-live="polite"></div>`,
    {btns:`<button class="btn pri" id="ctFill">Fill codes</button><button class="btn ghost" data-close="1">Cancel</button>`});
  const box=$("#ctPasteBox"),hint=$("#ctPasteHint");box.focus();
  box.addEventListener("input",()=>{const n=Object.keys(ctParse(box.value)).length;hint.textContent=box.value.trim()?(n?`Found ${n} of ${CT_SECRETS.length} codes`:"No codes found yet. Paste the whole doc, headings included."):"";});
  $("#ctFill").addEventListener("click",()=>{const found=ctParse(box.value);const n=Object.keys(found).length;
    if(!n){toast("No codes found. Paste the whole doc, headings included.");return;}
    ctSave({...ctLoad(),...found});box.value="";closeOverlay();render();toast(`Filled ${n} of ${CT_SECRETS.length} codes on this device`);});}
function ctWhy(){openSheet("How the codes are kept",`<div class="ct-why">
  <p>The hub is a web page with a link. Anything built into it goes wherever the link or the file goes, old versions included.</p>
  <p>So passwords and PINs stay only in the browser you add them to:</p>
  <ul><li>They are not in the hub's saved data, backups or exports.</li><li>Anyone you share the hub with sees blanks.</li><li>Add them once per device with <b>Paste from doc</b>, or <b>Edit codes</b> on a tile.</li></ul>
  <p class="muted">Built in: the account emails, the Wi-Fi network names and how to sign in to Eventbrite.</p></div>`);}

/* ---------- search ---------- */
const CT_WORDS={door:"door lockbox lock box key building access open center pin code",wifi:"wifi wi-fi internet network password",mac:"laptop desktop icloud apple email computer pin password mac",cart:"computer cart laptops microsoft pin password",eb:"eventbrite tickets rsvp registration sign up"};
function ctSearch(q){if(!q||q.length<2)return [];const hits=CT_TILES.filter(t=>(t.name+" "+CT_WORDS[t.id]+" eh center").toLowerCase().includes(q)).map(t=>({id:"ctr:"+t.id,n:t.name,k:"EH Center"}));return hits.slice(0,3);}

/* ============ EH Center: monthly program calendar ============
   Source: LEAD Greater Hartford Community Center monthly calendar flyer (November 2026, added Nov 3, 2026).
   Registration link = the flyer's "Hartford Program Registration" QR code (decodes to a Google Form).
   To add a month: add a key under CTR.months with the same shape. Shows on the EH Center page,
   the Today week strip, Tasks > Calendar and search. Kept out of the Events list on purpose:
   Events is the outreach pipeline; these are LEAD's own classes. */
const CTR={
  center:{name:"LEAD Greater Hartford Community Center",addr:"1064 Main Street, East Hartford, CT 06108",phone:"(860) 519-7470",tel:"+18605197470",site:"https://www.leadct.org",siteLabel:"leadct.org",reg:"https://forms.gle/pbwAS1fD6NfowXA8A",social:"@CTLEAD"},
  away:[],
  months:{
    "2026-11":{src:"LEAD's November 2026 monthly calendar flyer",added:"2026-11-03",
      programs:[
        {id:"sb",name:"Salsa & Bachata Classes",short:"Salsa & Bachata",when:"Tuesdays & Wednesdays",time:"4:30 – 6:30 PM",start:"16:30",end:"18:30",color:"#c2600e",icon:"dance",blurb:"Learn, practice, and show off your moves!",pillar:"Health and Wellbeing",
          dates:["2026-11-03","2026-11-04","2026-11-10","2026-11-17","2026-11-18","2026-11-24","2026-11-25"]},
        {id:"hnc",name:"Her Next Chapter: Women Empowerment",short:"Her Next Chapter",when:"Every other Wednesday",time:"6:00 – 7:30 PM",start:"18:00",end:"19:30",color:"#c2307c",icon:"woman",blurb:"Support, grow and connect with other women.",pillar:"Health and Wellbeing",
          dates:["2026-11-04","2026-11-18"]},
        {id:"mil",name:"Music is Life: Women's Healing Circle",short:"Healing Circle",when:"1st Thursday monthly",time:"6:00 – 8:00 PM",start:"18:00",end:"20:00",color:"#7a4fc0",icon:"lotus",blurb:"A supportive space for women to connect, heal, and be empowered.",pillar:"Health and Wellbeing",
          dates:["2026-11-05"]},
        {id:"d2b",name:"From Dream to Business",short:"Dream to Business",when:"Fridays",time:"6:00 – 8:00 PM",start:"18:00",end:"20:00",color:"#8e2a55",icon:"case",blurb:"Support, resources, and guidance for aspiring entrepreneurs.",pillar:"Financial Literacy",
          dates:["2026-11-06"],final:"2026-11-06"},
        {id:"cit",name:"Citizenship Class",short:"Citizenship",sub:"Programa para la Ciudadanía",when:"Saturdays",time:"12:00 – 1:00 PM",start:"12:00",end:"13:00",color:"#0d7f78",icon:"group",blurb:"Preparation, resources, and support on your path to citizenship.",pillar:"Citizenship",
          dates:["2026-11-07","2026-11-14"],final:"2026-11-14"},
        {id:"gn",name:"Game Night",short:"Game Night",sub:"with EH Town Youth Services",when:"Tuesday, Nov 17 (one night)",time:"6:00 – 8:00 PM",start:"18:00",end:"20:00",color:"#c62828",icon:"pad",blurb:"Games, community and youth engagement.",pillar:"Other",
          dates:["2026-11-17"]}
      ],
      closed:[{date:"2026-11-11",name:"Veterans Day"},{date:"2026-11-26",end:"2026-11-27",name:"Thanksgiving Break"}]}
  }
};
const CTR_ICONS={
  dance:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6.2l10-2.2v12"/><circle cx="6.6" cy="18" r="2.4"/><circle cx="16.6" cy="16" r="2.4"/><path d="M9 9.6l10-2.2"/></svg>',
  woman:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.4" r="3.4"/><path d="M5.5 20.5c.7-4.3 3.3-6.9 6.5-6.9s5.8 2.6 6.5 6.9"/><path d="M8.7 8.8c-.4 2.2-1.4 3.5-2.6 4.1M15.3 8.8c.4 2.2 1.4 3.5 2.6 4.1"/></svg>',
  lotus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 18.5c-1.4-3.4-1.4-7.4 0-11.5 1.4 4.1 1.4 8.1 0 11.5z"/><path d="M12 18.5c-3.4-.6-5.6-3.6-5.6-7.3 2.4.6 4.4 2.3 5.6 4.6"/><path d="M12 18.5c3.4-.6 5.6-3.6 5.6-7.3-2.4.6-4.4 2.3-5.6 4.6"/><path d="M12 18.5c-4.2.5-7.4-.7-9-3.2 2-.6 4.1-.3 5.9.9M12 18.5c4.2.5 7.4-.7 9-3.2-2-.6-4.1-.3-5.9.9"/></svg>',
  case:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V5.8a1.3 1.3 0 0 1 1.3-1.3h3.4A1.3 1.3 0 0 1 15 5.8v1.7"/><path d="M3.5 12.5h17"/><path d="M11 12.5v1.7h2v-1.7"/></svg>',
  group:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="2.8"/><circle cx="5.6" cy="10" r="2.1"/><circle cx="18.4" cy="10" r="2.1"/><path d="M7.4 19.5c0-2.9 2-5.1 4.6-5.1s4.6 2.2 4.6 5.1"/><path d="M2 18.8c0-2.2 1.5-3.9 3.6-3.9.9 0 1.7.3 2.3.8M22 18.8c0-2.2-1.5-3.9-3.6-3.9-.9 0-1.7.3-2.3.8"/></svg>',
  pad:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8h9.6a4 4 0 0 1 4 4.6l-.6 3.6a2.4 2.4 0 0 1-4.1 1.2l-1.6-1.9H9.5l-1.6 1.9a2.4 2.4 0 0 1-4.1-1.2l-.6-3.6A4 4 0 0 1 7.2 8z"/><path d="M7.6 11v3M6.1 12.5h3"/><circle cx="15.6" cy="11.6" r=".7"/><circle cx="17.4" cy="13.4" r=".7"/></svg>',
  closed:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.4"/><path d="M6.1 6.1l11.8 11.8"/></svg>'
};
S.ctrMonth=null;
PAGE_CONTEXT.center="Programs calendar, access & codes";

/* ---------- lookups ---------- */
function ctrMonths(){return Object.keys(CTR.months).sort();}
function ctrProgs(){return ctrMonths().flatMap(k=>CTR.months[k].programs.map(p=>({...p,_m:k})));}
function ctrProg(id,m){const L=ctrProgs().filter(p=>p.id===id);return (m&&L.find(p=>p._m===m))||L[L.length-1]||null;}
function ctrClosedOn(d){for(const k of ctrMonths()){const c=(CTR.months[k].closed||[]).find(c=>d>=c.date&&d<=(c.end||c.date));if(c)return c;}return null;}
function ctrAwayOn(d){return (CTR.away||[]).find(a=>d>=a.from&&d<=a.to)||null;}
function ctrOn(d){const m=CTR.months[d.slice(0,7)];if(!m)return [];return m.programs.filter(p=>p.dates.includes(d)).map(p=>({...p,_m:d.slice(0,7)})).sort((a,b)=>a.start<b.start?-1:1);}
function ctrMonthPick(){const ms=ctrMonths();const cur=todayISO().slice(0,7);if(S.ctrMonth&&CTR.months[S.ctrMonth])return S.ctrMonth;if(CTR.months[cur])return cur;const past=ms.filter(k=>k<=cur);return past.length?past[past.length-1]:ms[0];}
function ctrStart(p){const [h,m]=p.start.split(":").map(Number);return (h%12||12)+(m?":"+String(m).padStart(2,"0"):"")+(h<12?" AM":" PM");}
function ctrNext(p){const t0=todayISO();return p.dates.find(d=>d>=t0)||null;}
function ctrLeft(p){const t0=todayISO();return p.dates.filter(d=>d>=t0).length;}

/* ---------- chips used on Today and Tasks > Calendar ---------- */
function ctrWeekChips(dd){const c=ctrClosedOn(dd);
  return (c?`<div class="ev ctr closed" data-ctrday="${dd}">Center closed<div class="t">${esc(c.name)}</div></div>`:"")+ctrOn(dd).map(p=>`<div class="ev ctr" style="--pc:${p.color}" data-ctr="${p.id}" data-d="${dd}">${esc(p.short)}${p.final===dd?" · final":""}<div class="t">${ctrStart(p)} · LEAD center</div></div>`).join("");}
function ctrCellChips(d){const c=ctrClosedOn(d);
  return (c?`<button class="ev ctr closed" data-ctrday="${d}" title="Center closed: ${esc(c.name)}">Closed</button>`:"")+ctrOn(d).map(p=>`<button class="ev ctr" style="--pc:${p.color}" data-ctr="${p.id}" data-d="${d}" title="${esc(p.name)}, ${esc(p.time)}">${esc(p.short)}</button>`).join("");}

/* ---------- the calendar on the EH Center page ---------- */
function ctrTile(p,mk){const left=p.dates.filter(d=>d>=todayISO()).length,nx=ctrNext(p);const done=!left;
  return `<button class="cc-tile ${done?"done":""}" style="--pc:${p.color}" data-ctr="${p.id}" data-m="${mk}"><span class="cc-ic">${CTR_ICONS[p.icon]}</span><span class="cc-tn">${esc(p.short)}</span><span class="cc-tw">${esc(p.when.replace(" (one night)",""))} · ${ctrStart(p)}</span><span class="cc-tb"><b class="num">${done?"✓":left}</b><span>${done?"done this month":left===1?"session left":"sessions left"}</span></span>${p.final?`<span class="cc-fin">${done?"ended":"ends"} ${fmtDate(p.final).slice(4)}</span>`:nx&&daysFromToday(nx)<=1?`<span class="cc-fin now">${rel(daysFromToday(nx))}</span>`:""}</button>`;}
function rCtrCal(){const mk=ctrMonthPick();if(!mk)return "";const M=CTR.months[mk];const [y,m]=mk.split("-").map(Number);const ms=ctrMonths();const i=ms.indexOf(mk);
  const t0=todayISO();const first=new Date(y,m-1,1);const start=addDays(mk+"-01",-first.getDay());const last=new Date(y,m,0).getDate();const rows=Math.ceil((first.getDay()+last)/7);
  const all=M.programs.flatMap(p=>p.dates.map(d=>({p,d}))).sort((a,b)=>(a.d+a.p.start)<(b.d+b.p.start)?-1:1);const left=all.filter(x=>x.d>=t0);
  const nx=left[0];const closedDays=(M.closed||[]).reduce((n,c)=>n+1+(c.end?Math.round((parseISO(c.end)-parseISO(c.date))/864e5):0),0);
  const cells=[];for(let k=0;k<rows*7;k++){const d=addDays(start,k);const inM=d.slice(0,7)===mk;const c=inM&&ctrClosedOn(d);const its=inM?ctrOn(d):[];const aw=inM&&ctrAwayOn(d);
    cells.push(`<div class="cc-cell ${inM?"":"out"} ${d===t0?"today":""} ${inM&&d<t0?"past":""} ${c?"closed":""} ${aw?"away":""} ${its.length||c?"has":""}" ${inM&&(its.length||c||aw)?`data-ctrday="${d}"`:""}><div class="cc-dn"><b>${parseISO(d).getDate()}</b>${aw&&!c?`<i class="cc-aw">away</i>`:""}</div>${c?`<div class="cc-closed"><span class="cc-ic sm">${CTR_ICONS.closed}</span><span>${esc(c.name)}</span></div>`:""}${its.map(p=>`<button class="cc-ch ${p.final===d?"fin":""}" style="--pc:${p.color}" data-ctr="${p.id}" data-d="${d}" data-m="${mk}"><span class="l">${esc(p.short)}</span><span class="tm">${ctrStart(p)}</span></button>`).join("")}</div>`);}
  return `<section class="cc">
    <div class="cc-band">
      <div class="cc-kpi"><b class="num">${left.length}</b><span>of ${all.length} sessions left</span></div>
      <div class="cc-kpi"><b class="num">${M.programs.length}</b><span>programs</span></div>
      <div class="cc-kpi"><b class="num">${closedDays}</b><span>days closed</span></div>
      ${nx?`<button class="cc-next" style="--pc:${nx.p.color}" data-ctr="${nx.p.id}" data-d="${nx.d}" data-m="${mk}"><span class="cc-ic sm">${CTR_ICONS[nx.p.icon]}</span><span><span class="k">Next at the center · ${esc(rel(daysFromToday(nx.d)))}</span><span class="n">${esc(nx.p.short)}, ${fmtDate(nx.d)} · ${ctrStart(nx.p)}</span></span></button>`:`<span class="cc-kpi"><span>Nothing left this month</span></span>`}
      <span class="sp"></span>
      <a class="btn sm pri" href="${CTR.center.reg}" target="_blank" rel="noopener">Registration form ↗</a>
      <button class="btn sm ghost ct-q" data-ctrinfo="1" aria-label="Center details" title="Center details">i</button>
    </div>
    <div class="calnav">${ms.length>1?`<button class="btn sm" data-ctrm="${ms[i-1]||""}" ${i>0?"":"disabled"} aria-label="Previous month">‹</button>`:""}<h2>${["January","February","March","April","May","June","July","August","September","October","November","December"][m-1]} ${y} at the center</h2>${ms.length>1?`<button class="btn sm" data-ctrm="${ms[i+1]||""}" ${i<ms.length-1?"":"disabled"} aria-label="Next month">›</button>`:""}</div>
    <div class="cc-tiles">${M.programs.map(p=>ctrTile(p,mk)).join("")}</div>
    <div class="cc-cal">${DOW.map(d=>`<div class="cc-dow">${d}</div>`).join("")}${cells.join("")}</div>
    <div class="cc-key"><span><i class="k-closed"></i>Center closed</span><span><i class="k-away"></i>You're away</span><span><i class="k-fin"></i>Final class</span><span><i class="k-today"></i>Today</span></div>
  </section>
  <div class="cc-div"><h2>Access, logins &amp; codes</h2></div>`;}

/* ---------- popups ---------- */
function ctrGcal(p,d){const f=(dd,t)=>dd.replace(/-/g,"")+"T"+t.replace(":","")+"00";const q=new URLSearchParams({action:"TEMPLATE",text:p.name+" (LEAD)",dates:f(d,p.start)+"/"+f(d,p.end),ctz:"America/New_York",location:CTR.center.name+", "+CTR.center.addr,details:p.blurb+(p.sub?"\n"+p.sub:"")+"\nRegister: "+CTR.center.reg+"\n"+CTR.center.phone+" · "+CTR.center.site});return "https://calendar.google.com/calendar/render?"+q.toString();}
function ctrInvite(p,d){const t0=todayISO();const rest=p.dates.filter(x=>x>=t0);
  return [`${p.name} at LEAD`+(p.sub?` (${p.sub})`:""),`${p.when.replace(" (one night)","")}, ${p.time}`,d?`Next: ${fmtDate(d)}`+(p.final===d?" (final class)":""):"",rest.length>1?`Also: ${rest.filter(x=>x!==d).map(x=>fmtDate(x).slice(4)).join(", ")}`:"",p.blurb,`${CTR.center.name}, ${CTR.center.addr}`,`Sign up: ${CTR.center.reg}`,`Questions: ${CTR.center.phone} · ${CTR.center.siteLabel}`].filter(Boolean).join("\n");}
function ctrLog(p,d){form({title:"Log a class",fields:[{key:"date",label:"Date",type:"date"},{key:"program",label:"Program",type:"select",options:PROGRAMS},{key:"topic",label:"Topic or session",wide:true},{key:"participants",label:"People who came",type:"number"},{key:"where",label:"Where"},{key:"notes",label:"Notes",type:"textarea",rows:2,wide:true}],
  values:{date:d,program:p.pillar,topic:p.name,where:ME().place},onSave:async v=>{const ok=await write("sessions",uid("ss"),{...v,participants:Number(v.participants)||0});if(ok)toast("Logged. It counts on Programs & videos.");return ok;}});}
function ctrSheet(id,d,mk){const p=ctrProg(id,mk||(d&&d.slice(0,7)));if(!p)return;const t0=todayISO();if(!d||!p.dates.includes(d))d=ctrNext(p)||p.dates[p.dates.length-1];
  const logged=S.sessions.filter(x=>x.date===d&&(x.topic||"").toLowerCase().includes(p.short.toLowerCase().split(" ")[0])).length;
  const inner=`<div class="cc-sh" style="--pc:${p.color}">
    <div class="cc-shead"><span class="cc-ic">${CTR_ICONS[p.icon]}</span><div><div class="cc-when">${esc(p.when)} · ${esc(p.time)}</div>${p.sub?`<div class="small muted">${esc(p.sub)}</div>`:""}</div></div>
    <p class="cc-blurb">${esc(p.blurb)}</p>
    <div class="cc-dates">${p.dates.map(x=>{const aw=ctrAwayOn(x);return `<button class="cc-dt ${x<t0?"past":""} ${x===d?"sel":""} ${p.final===x?"fin":""}" data-ctrpick="${x}" title="${aw?"You're away ("+esc(aw.label)+")":""}"><b>${parseISO(x).getDate()}</b><span>${DOW[parseISO(x).getDay()]}</span>${p.final===x?`<em>final</em>`:aw?`<em class="aw">away</em>`:x===t0?`<em>today</em>`:""}</button>`;}).join("")}</div>
    <div class="ct-rows">
      <div class="ct-r"><div class="ct-l">Picked</div><div class="ct-v">${fmtDate(d,true)}, ${esc(p.time)} · ${esc(rel(daysFromToday(d)))}${logged?` · <span class="pill green">logged</span>`:""}</div></div>
      <div class="ct-r"><div class="ct-l">Where</div><div class="ct-v">${esc(CTR.center.name)}, ${esc(CTR.center.addr)}</div><div class="ct-acts"><a class="btn sm" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CTR.center.addr)}" target="_blank" rel="noopener">Map</a></div></div>
      <div class="ct-r"><div class="ct-l">Sign up</div><div class="ct-v">Hartford Program Registration form</div><div class="ct-acts"><a class="btn sm" href="${CTR.center.reg}" target="_blank" rel="noopener">Open</a></div></div>
      <div class="ct-r"><div class="ct-l">Questions</div><div class="ct-v">${esc(CTR.center.phone)} · ${esc(CTR.center.siteLabel)}</div><div class="ct-acts"><a class="btn sm" href="tel:${CTR.center.tel}">Call</a></div></div>
    </div>
    <p class="small muted" style="margin-top:10px">From ${esc(CTR.months[p._m].src)}.</p></div>`;
  openSheet(p.name,inner,{btns:`<button class="btn pri" id="ccLog">Log this class</button><button class="btn" id="ccInv">Copy invite</button><a class="btn" href="${ctrGcal(p,d)}" target="_blank" rel="noopener">Add to Google Calendar</a><button class="btn ghost" data-close="1">Close</button>`});
  document.querySelectorAll("#overlay [data-ctrpick]").forEach(b=>b.addEventListener("click",()=>ctrSheet(p.id,b.dataset.ctrpick,p._m)));
  $("#ccLog").addEventListener("click",()=>ctrLog(p,d));
  $("#ccInv").addEventListener("click",()=>copyText(ctrInvite(p,d),"Invite copied"));}
function ctrDaySheet(d){const its=ctrOn(d),c=ctrClosedOn(d),aw=ctrAwayOn(d);
  const inner=`${c?`<div class="cc-dclosed"><span class="cc-ic sm">${CTR_ICONS.closed}</span><div><b>Center closed</b><div class="small">${esc(c.name)}${c.end?`, ${fmtDate(c.date).slice(4)} to ${fmtDate(c.end).slice(4)}`:""}</div></div></div>`:""}
    ${aw?`<p class="small" style="margin:6px 0 10px"><span class="pill red">away</span> You're away (${esc(aw.label)}) this day.</p>`:""}
    <div class="ct-rows">${its.map(p=>`<div class="ct-r cc-drow" style="--pc:${p.color}" data-ctr="${p.id}" data-d="${d}"><div class="ct-l"><i class="cc-dot"></i>${esc(p.time)}</div><div class="ct-v">${esc(p.name)}${p.final===d?' <span class="pill orange">final class</span>':""}</div><div class="ct-acts"><span class="btn sm ghost">Open</span></div></div>`).join("")||(c?"":`<p class="empty">Nothing on the center calendar.</p>`)}</div>`;
  openSheet(fmtDate(d,true),inner);}
function ctrInfo(){const c=CTR.center;const mk=ctrMonthPick();
  openSheet("LEAD center details",`<div class="ct-rows">
    <div class="ct-r"><div class="ct-l">Center</div><div class="ct-v">${esc(c.name)}</div></div>
    <div class="ct-r"><div class="ct-l">Address</div><div class="ct-v">${esc(c.addr)}</div><div class="ct-acts"><button class="btn sm" data-cccopy="${esc(c.addr)}">Copy</button></div></div>
    <div class="ct-r"><div class="ct-l">Phone</div><div class="ct-v">${esc(c.phone)}</div><div class="ct-acts"><a class="btn sm" href="tel:${c.tel}">Call</a></div></div>
    <div class="ct-r"><div class="ct-l">Website</div><div class="ct-v">${esc(c.siteLabel)}</div><div class="ct-acts"><a class="btn sm" href="${c.site}" target="_blank" rel="noopener">Open</a></div></div>
    <div class="ct-r"><div class="ct-l">Registration (flyer QR)</div><div class="ct-v">${esc(c.reg.replace("https://",""))}</div><div class="ct-acts"><button class="btn sm" data-cccopy="${esc(c.reg)}">Copy</button><a class="btn sm" href="${c.reg}" target="_blank" rel="noopener">Open</a></div></div>
    <div class="ct-r"><div class="ct-l">Social</div><div class="ct-v">${esc(c.social)} on Facebook, Instagram, LinkedIn, YouTube</div></div>
  </div><p class="small muted" style="margin-top:10px">From ${esc(CTR.months[mk].src)}. Send the next month's flyer to add it.</p>`);
  document.querySelectorAll("#overlay [data-cccopy]").forEach(b=>b.addEventListener("click",()=>copyText(b.dataset.cccopy,"Copied")));}

/* ---------- search ---------- */
function ctrSearch(q){if(!q||q.length<2)return [];const seen=new Set();return ctrProgs().slice().reverse().filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return [p.name,p.sub||"",p.when,p.blurb,"center class program calendar lead"].join(" ").toLowerCase().includes(q);}).slice(0,3).map(p=>({id:"ctrp:"+p.id,n:p.name,k:"EH Center calendar, "+p.when.replace(" (one night)","")+" "+ctrStart(p)}));}

/* ---------- clicks (anywhere in the hub) ---------- */
document.addEventListener("click",e=>{const t=e.target;if(!t||!t.closest)return;if(t.closest("#overlay .sheet")&&!t.closest("[data-ctr]"))return;
  const pr=t.closest("[data-ctr]");if(pr){e.preventDefault();ctrSheet(pr.dataset.ctr,pr.dataset.d,pr.dataset.m);return;}
  const dy=t.closest("[data-ctrday]");if(dy){e.preventDefault();ctrDaySheet(dy.dataset.ctrday);return;}
  const mo=t.closest("[data-ctrm]");if(mo&&mo.dataset.ctrm){S.ctrMonth=mo.dataset.ctrm;render();return;}
  if(t.closest("[data-ctrinfo]")){ctrInfo();}});

/* ============ console home (added Nov 3, 2026) ============
   Home is a console: a row picker, one row of app tiles, and a preview panel for the chosen tile.
   Arrow keys, a tap, a swipe of the tile row or a game controller move between tiles; Enter or Open goes in;
   Esc (or the controller's B) comes back. Everything inside an app is unchanged. */
const IC={
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  tasks:'<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.5l2.6 2.6L16.5 9"/>',
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.2a3.2 3.2 0 0 1 0 6.3M21 20c0-2.6-1.6-4.8-4-5.6"/>',
  events:'<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h3v3H8z"/>',
  ready:'<path d="M9 4h6v3H9z"/><path d="M15 5.5h2.5A1.5 1.5 0 0 1 19 7v12.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V7a1.5 1.5 0 0 1 1.5-1.5H9"/><path d="M8.5 13.5l2.2 2.2 4.8-4.8"/>',
  proposals:'<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  blead:'<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>',
  map:'<path d="M9 4L3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
  team:'<path d="M5 21l2.5-6 3 1.5 1-4.5-3-2.5L5 11"/><circle cx="13" cy="4.5" r="1.8"/><path d="M8.5 9.5l3-2.5 3.5 2 2 3.5 3 .5M11.5 12l3 3-1.5 6"/>',
  board:'<circle cx="12" cy="9" r="5.5"/><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5"/>',
  center:'<path d="M3 21h18M5 21V9l7-5 7 5v12"/><path d="M10 21v-5h4v5M9 11h.01M15 11h.01"/>',
  playbook:'<path d="M2.5 5.5c2.5-1.3 6-1.3 9.5.5 3.5-1.8 7-1.8 9.5-.5v13c-2.5-1.3-6-1.3-9.5.5-3.5-1.8-7-1.8-9.5-.5z"/><path d="M12 6v13"/>',
  org:'<rect x="9" y="3" width="6" height="4.5" rx="1"/><rect x="3" y="16.5" width="6" height="4.5" rx="1"/><rect x="15" y="16.5" width="6" height="4.5" rx="1"/><path d="M12 7.5V12M6 16.5V12h12v4.5"/>',
  cultures:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.6-4-9s1.4-6.5 4-9z"/>',
  meetings:'<path d="M20 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z"/><path d="M8 8h8M8 12h5"/>',
  programs:'<rect x="2.5" y="5" width="14" height="14" rx="2.5"/><path d="M16.5 10l5-3v10l-5-3"/><path d="M8 9.5v5l4-2.5z"/>',
  log:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  hours:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  sig:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'
};
const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]||""}</svg>`;
const ROWS=[["campaign","Campaign"],["runs","How LEAD runs"],["role","My role"],["community","Community"]];
const APPS=[
  {id:"today",row:"campaign",tc:"blue",desc:"Signatures to goal, what's due, who to call next and this week's events."},
  {id:"tasks",row:"campaign",tc:"slate",desc:"Everything on your list, as a list, a board or a calendar, by section."},
  {id:"people",row:"campaign",tc:"sky",desc:"Every person and organization in the pipeline, from not reached yet to Champion."},
  {id:"events",row:"campaign",tc:"indigo",desc:"The community calendar: where to show up, where you can table, and the reports you owe Kelly."},
  {id:"ready",row:"campaign",tc:"teal",desc:"Kelly's readiness checklist for each event: roles, contacts, tickets and names, each with an owner and a due date."},
  {id:"proposals",row:"campaign",tc:"violet",desc:"Partner requests scored on eight parts, with what's missing and what to ask for."},
  {id:"blead",row:"campaign",tc:"brick",desc:"The Black community lane: leads, education contacts, podcast hosts, visitors and events through March 2027."},
  {id:"map",row:"campaign",tc:"pine",desc:"People, organizations and events pinned by town across Greater Hartford."},
  {id:"team",row:"campaign",tc:"plum",desc:"Signatures against the goal, every signer on file, the shift log, canvassers and their paperwork, by campaign and by center."},
  {id:"board",row:"campaign",tc:"green",desc:"Names for Kelly's Board of Champions sheet. Add contacts only; Kelly sends every invitation."},
  {id:"center",row:"runs",tc:"indigo",desc:"The East Hartford center: this month's programs and calendar, logins and door codes."},
  {id:"playbook",row:"runs",tc:"brick",desc:"How LEAD works, confirmed or still a best guess, and the questions nobody has answered yet."},
  {id:"org",row:"runs",tc:"sky",desc:"Who's who at LEAD and who to ask for what."},
  {id:"cultures",row:"runs",tc:"violet",desc:"Guides to the communities LEAD serves, their celebrations, and what to know before you walk in."},
  {id:"meetings",row:"runs",tc:"teal",desc:"What you heard in the room: takeaways and next steps."},
  {id:"programs",row:"runs",tc:"plum",desc:"Classes and videos against LEAD's own numbers: 10 people a class, one video a week."},
  {id:"log",row:"runs",tc:"slate",desc:"Daily field notes: what happened, what you learned, what's blocking."},
  {id:"hours",row:"role",tc:"green",desc:"Your LEAD shifts, logged so the invoice writes itself."},
  {id:"sig",row:"role",tc:"blue",desc:"Your LEAD email signature, ready to paste into Gmail."},
  {id:"settings",row:"role",tc:"slate",desc:"Signature goal and date, links, backups, and how the hub saves."},
  {id:"fb",row:"community",tc:"blue",lt:"FB",ext:true,name:"Facebook group",desc:"LEAD's community page on Facebook. Share it at tables and in follow-ups."},
  {id:"wa",row:"community",tc:"green",lt:"WA",ext:true,name:"WhatsApp group",desc:"LEAD's group chat. Share the invite at tables and in follow-ups."}
];
TITLES.home="Home";
const appName=a=>a.name||TITLES[a.id]||a.id;
const appById=id=>APPS.find(a=>a.id===id);
const appOK=a=>a.ext||tabOK(a.id);
const rowApps=r=>APPS.filter(a=>a.row===r&&appOK(a));
const tileFace=a=>a.lt?`<span class="lt">${a.lt}</span>`:icon(a.id);
S.home=(()=>{try{return JSON.parse(localStorage.getItem("lead_hub_home")||"null")||{row:"campaign",pick:{}};}catch(e){return {row:"campaign",pick:{}};}})();
if(!S.home.pick)S.home.pick={};S.hq="";
function homeSave(){try{localStorage.setItem("lead_hub_home",JSON.stringify(S.home));}catch(e){}}
function homeRows(){return ROWS.filter(([k])=>rowApps(k).length);}
function homeApp(){let rows=homeRows();if(!rows.find(([k])=>k===S.home.row))S.home.row=rows[0][0];const L=rowApps(S.home.row);return L.find(a=>a.id===S.home.pick[S.home.row])||L[0];}

/* ---------- live figures per app ---------- */
const needRow=x=>`<button class="need" ${x.attr||""}><i class="${x.dot||""}"></i><span class="n">${esc(x.n)}</span>${x.d?`<span class="d">${esc(x.d)}</span>`:""}${x.r?`<span class="r ${x.late?"late":""}">${esc(x.r)}${x.r2?`<br>${esc(x.r2)}`:""}</span>`:""}</button>`;
function heroFor(id){
  const t0=todayISO(),st=S.settings||{};const H={figs:[],needs:[],title:"Needs you",more:null,extra:""};
  const fig=(v,l,c)=>H.figs.push({v,l,c});
  const dueX=(days,date)=>({r:date?fmtDate(date):"",r2:rel(days),late:days!==null&&days<0,dot:days!==null&&days<0?"late":days!==null&&days<=2?"soon":""});
  if(id==="today"){
    const goal=st.sigGoal||500,sg=sigTotals(),gd=st.goalDate?daysFromToday(st.goalDate):null;
    const d=dueSoon().filter(x=>!x._done),fu=followUps(),nr=needsReport(),rd=rdDue(),pd=tabOK("proposals")?propDue():[];
    const ln=(typeof ltTodayNeeds==="function"&&tabOK("letters"))?ltTodayNeeds():[];const n=d.length+fu.length+nr.length+rd.length+pd.length+ln.length;
    fig(`${sg.all}<small>of ${goal}</small>`,"signatures of support so far");
    fig(gd===null?"—":gd,st.goalDate?"days to "+fmtDate(st.goalDate):"no goal date set");
    fig(n,"things on your plate in the next two weeks",n?"warn":"ok");
    const pct=Math.min(1,sg.all/goal);
    H.extra=`<div><div class="track"><i class="fill" style="width:${(pct*100).toFixed(1)}%"></i>${[100,250].filter(m=>m<goal).map(m=>`<i class="tick" style="left:${(m/goal*100).toFixed(1)}%"></i>`).join("")}</div><div class="trackkey"><span>0</span><span>${sg.t} people &amp; orgs · ${sg.e} events · ${sg.l} shifts · ${sg.m} walk-ups</span><span>${goal}</span></div></div>`;
    nr.forEach(e=>H.needs.push({n:"Write the report: "+e.name,d:"Who you met, conversations, follow-ups",...dueX(daysFromToday(e.date),e.date),dot:"soon",late:false,attr:`data-open="${e.id}"`}));
    rd.forEach(({d,its})=>H.needs.push({n:"Get ready: "+(d.name||"Untitled event"),d:its.length?its.length+" checklist item"+(its.length===1?"":"s")+" due this week":"Event within a week",...dueX(d.date?daysFromToday(d.date):null,d.date),attr:`data-rd-go="${d.id}"`}));
    d.forEach(x=>H.needs.push({n:x.title,d:x._standing?"every "+DOW[Number(x.dow??4)]:(x.section||""),...dueX(x._days,x._date),attr:`data-htask="${x.id}"`}));
    fu.forEach(x=>H.needs.push({n:x.name,d:x.next_step||"follow up",...dueX(x._days,x.next_date),attr:`data-open="${x.id}"`}));
    pd.forEach(p=>{const s=propScore(p);H.needs.push({n:"Review the proposal: "+propName(p),d:`${s.filled} of 8 parts in, ${s.rated} rated`,dot:"info",attr:`data-hprop="${p.id}"`});});
    ln.forEach(x=>H.needs.push(x));H.title="Do now";
  }else if(id==="tasks"){
    const open=S.tasks.filter(t=>t.status!=="done").map(t=>({t,x:taskDue(t)}));
    const over=open.filter(o=>!o.x.done&&o.x.days!==null&&o.x.days<0).length,wk=open.filter(o=>!o.x.done&&o.x.days!==null&&o.x.days>=0&&o.x.days<=7).length;
    fig(open.length,"open");fig(over,"overdue",over?"warn":"");fig(wk,"due in the next 7 days");fig(open.filter(o=>o.t.status==="doing").length,"in progress");
    open.sort((a,b)=>taskSort(a.t,b.t)).forEach(({t,x})=>H.needs.push({n:t.title,d:t.section||"",...dueX(x.days,x.date),r:x.date?fmtDate(x.date):"no date",attr:`data-htask="${t.id}"`}));
    H.title="Next up";
  }else if(id==="people"){
    const T=allT(),c={};STATUSES.forEach(s=>c[s]=0);T.forEach(t=>c[t.status]=(c[t.status]||0)+1);
    fig(T.length,"people & orgs");fig(c.Champion,"Champions","ok");fig(c.Supporter,"support us");fig(c.Prospect,"not reached yet");
    let L=T.filter(t=>t.status==="Prospect"&&t.priority==="High"&&(t.phone||t.email)).sort((a,b)=>a.name.localeCompare(b.name));
    L.forEach(t=>H.needs.push({n:t.name,d:t.contact_name?t.contact_name+(t.role?", "+t.role:""):(t.subtype||t.type||""),r:(t.phone||t.email||"").split(";")[0].trim(),dot:"info",attr:`data-open="${t.id}"`}));
    quiet().forEach(x=>H.needs.push({n:x.name,d:"Gone quiet, last touch "+fmtDate(x.last_contact),r:x._q+" days",dot:"soon",attr:`data-open="${x.id}"`}));
    H.title="Call next";
  }else if(id==="events"){
    const E=allE().filter(e=>e.date&&e.date>=t0).sort((a,b)=>a.date<b.date?-1:1),nr=needsReport();
    const in30=E.filter(e=>daysFromToday(e.date)<=30);
    fig(E.filter(e=>daysFromToday(e.date)<=6).length,"this week");fig(in30.length,"in the next 30 days");fig(in30.filter(e=>e.can_table===true).length,"you can table at","ok");fig(nr.length,"reports owed to Kelly",nr.length?"warn":"");
    nr.forEach(e=>H.needs.push({n:"Write the report: "+e.name,d:"After the event notes",r:fmtDate(e.date),dot:"soon",attr:`data-open="${e.id}"`}));
    E.forEach(e=>H.needs.push({n:e.name,d:[(e.time||"").split("–")[0].split(" - ")[0].trim(),townOf(e)].filter(Boolean).join(" · "),...dueX(daysFromToday(e.date),e.date),dot:e.can_table===true?"ok":"",late:false,attr:`data-open="${e.id}"`}));
    H.title="Coming up";
  }else if(id==="ready"){
    const L=rdAll().filter(rdActive),due=rdDue();const late=due.reduce((a,o)=>a+o.its.filter(x=>x.late).length,0);
    fig(L.length,"active checklists");fig(RD_COUNT(),"not fully ready yet",RD_COUNT()?"warn":"ok");fig(late,"items overdue",late?"warn":"");
    const seen=new Set();due.forEach(({d,its,sc})=>{seen.add(d.id);const l=its.filter(x=>x.late).length;H.needs.push({n:d.name||"Untitled event",d:[l?l+" overdue":"",its.length-l?(its.length-l)+" due this week":"",(sc.total-sc.done)+" open in all"].filter(Boolean).join(", "),r:d.date?fmtDate(d.date):"",late:!!l,dot:l?"late":"soon",attr:`data-rd-go="${d.id}"`});});
    L.filter(d=>!seen.has(d.id)).sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1).forEach(d=>{const sc=rdScore(d);H.needs.push({n:d.name||"Untitled event",d:sc.pct+"% ready",r:d.date?fmtDate(d.date):"",dot:sc.pct===100?"ok":"",attr:`data-rd-go="${d.id}"`});});
    H.title="Get ready";
  }else if(id==="proposals"){
    const P=S.proposals,due=propDue();
    fig(P.filter(propOpen).length,"open");fig(due.length,"waiting on your review",due.length?"warn":"");fig(P.filter(p=>p.status==="yes").length,"said yes to","ok");
    due.forEach(p=>{const s=propScore(p);H.needs.push({n:propName(p),d:`${s.filled} of 8 parts in, ${s.rated} rated`,r:p.received?rel(daysFromToday(p.received)):"",dot:"info",attr:`data-hprop="${p.id}"`});});
    H.title="To review";
  }else if(id==="blead"){
    const L=blAll(),A=L.filter(t=>t.bl.pri==="A");
    fig(L.length,"leads");fig(A.length,"A priority, go first");fig(L.filter(t=>t.status!=="Prospect").length,"reached so far","ok");fig(blEv().length,"events through Mar 2027");
    A.filter(t=>t.status==="Prospect").forEach(t=>{const b=t.bl||{};H.needs.push({n:t.name,d:t.contact_name?t.contact_name+(t.role?", "+t.role:""):(b.title?b.title+(b.org?", "+b.org:""):t.subtype||""),r:townOf(t),dot:b.verify?"soon":"info",attr:`data-open="${t.id}"`});});
    H.title="A priority, not reached";
  }else if(id==="map"){
    const T=allT(),by={};T.forEach(t=>{const w=townOf(t);if(!w)return;by[w]=by[w]||{n:0,c:0};by[w].n++;if(t.status==="Champion")by[w].c++;});
    fig(Object.keys(by).length,"towns");fig(T.length,"people & orgs pinned");fig(allE().filter(e=>e.date&&e.date>=t0).length,"upcoming events");
    Object.entries(by).sort((a,b)=>b[1].n-a[1].n).forEach(([w,v])=>H.needs.push({n:w,d:v.c?v.c+" Champion"+(v.c===1?"":"s"):"no Champions yet",r:v.n+" people & orgs",dot:v.c?"ok":"",attr:`data-hmap="${esc(w)}"`}));
    H.title="Most people & orgs";
  }else if(id==="team"){
    const sg=sigTotals(),goal=st.sigGoal||500,shs=S.shifts,on=(typeof cvSigners==="function")?cvSigners():[],rev=on.filter(s=>typeof cvReview==="function"&&cvReview(s)).length,fu=(typeof cvFollowDue==="function")?cvFollowDue():[];
    const nosig=shs.filter(s=>s.sigs==null||s.sigs===""),pend=shs.filter(s=>(+s.sigs||0)>0&&!s.uploaded);const pr=S.team.filter(c=>pwReady(c)||c.paperwork).length;
    fig(`${sg.l}<small>of ${goal}</small>`,"signatures logged from shifts",sg.l>=goal?"ok":"");fig(on.length,"signers on file");fig(rev,"signers to check against the sheet",rev?"warn":"ok");fig(pr+" / "+S.team.length,"paperwork complete",pr===S.team.length?"ok":"warn");
    fu.forEach(s=>H.needs.push({n:(s.name||"Signer")+": follow up",d:s.crm||s.tags&&s.tags.join(", ")||"",...dueX(daysFromToday(s.follow),s.follow),attr:`data-go2="team"`}));
    nosig.forEach(e=>H.needs.push({n:"Count the sheets: "+(e.where||"shift"),d:(e.who||"")+" has no signature count yet",r:fmtDate(e.date),dot:"soon",attr:`data-go2="team"`}));
    pend.forEach(e=>H.needs.push({n:"Upload the sheets: "+(e.where||"shift"),d:`${e.who||""} · ${+e.sigs||0} signatures not uploaded`,r:fmtDate(e.date),dot:"info",attr:`data-go2="team"`}));
    if(!H.needs.length)[...shs].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1).slice(0,5).forEach(e=>H.needs.push({n:e.who||"Shift",d:`${+e.sigs||0} signatures · ${e.where||""}`,r:fmtDate(e.date),attr:`data-go2="team"`}));
    H.title=H.needs.length&&(fu.length||nosig.length||pend.length)?"Needs you":"Latest shifts";
  }else if(id==="letters"&&typeof ltAll==="function"){
    const L=ltAll(),c=k=>L.filter(x=>ltSt(x)===k).length,goal=ltGoal(),dg=daysFromToday(ltGala());
    fig(`${c("signed")}<small>of ${goal}</small>`,"letters signed",c("signed")>=goal?"ok":"");fig(c("promised"),"promised");fig(L.filter(x=>LT_ASKED.includes(ltSt(x))).length,"asked so far");fig(dg===null?"—":Math.max(0,dg),"days to the Gala");
    ltNeeds().forEach(x=>H.needs.push(x));H.title="Do next";
  }else if(id==="board"){
    const inv=REF.BOARD.invite,miss=inv.filter(r=>!r.name);
    fig(inv.length+S.board.length,"on the list");fig(miss.length,"names still needed",miss.length?"warn":"ok");fig(S.board.length,"you added");
    miss.forEach(r=>H.needs.push({n:r.title,d:r.category||"",dot:"soon",attr:`data-go2="board"`}));
    H.title="Names still needed";
  }else if(id==="center"){
    const m=CTR.months[t0.slice(0,7)];const wk=[];for(let i=0;i<7;i++){const dd=addDays(t0,i);ctrOn(dd).forEach(p=>wk.push({p,dd}));}
    const aw=ctrAwayOn(t0)||(CTR.away||[]).find(a=>a.from>t0);
    fig(m?m.programs.length:0,"programs this month");fig(wk.length,"sessions in the next 7 days");fig(`${ctCount()}<small>of ${CT_SECRETS.length}</small>`,"logins and codes saved on this device");
    const cl=[];for(let i=0;i<7;i++){const dd=addDays(t0,i),c=ctrClosedOn(dd);if(c&&!cl.find(x=>x.c===c))cl.push({c,dd});}
    cl.forEach(({c,dd})=>H.needs.push({n:"Center closed"+(c.label?": "+c.label:""),d:c.note||"",r:fmtDate(dd),dot:"late",attr:`data-ctrday="${dd}"`}));
    wk.forEach(({p,dd})=>H.needs.push({n:p.short||p.name,d:p.time||ctrStart(p),...dueX(daysFromToday(dd),dd),late:false,dot:"",attr:`data-ctr="${p.id}" data-d="${dd}" data-m="${p._m}"`}));
    if(aw)H.needs.unshift({n:"You're away: "+aw.label,d:fmtDate(aw.from)+" to "+fmtDate(aw.to),dot:"info",attr:`data-go2="center"`});
    H.title="At the center this week";
  }else if(id==="playbook"){
    const pc={confirmed:0,guess:0,unknown:0};S.playbook.forEach(p=>pc[p.status||"guess"]=(pc[p.status||"guess"]||0)+1);const oq=S.questions.filter(q=>q.status!=="answered");
    fig(S.playbook.length,"entries");fig(pc.confirmed,"confirmed","ok");fig(pc.guess+pc.unknown,"best guesses or unknown");fig(oq.length,"open questions",oq.length?"warn":"");
    oq.forEach(q=>H.needs.push({n:q.q,d:"ask "+(q.askWho||"?"),dot:"soon",attr:`data-hq="${q.id}"`}));
    H.title="Still don't know";
  }else if(id==="org"){
    const L=[...S.org].sort((a,b)=>(a.order??99)-(b.order??99)||(a.name||"").localeCompare(b.name||""));
    fig(L.length,"people at LEAD");fig(new Set(L.map(p=>p.group||"LEAD")).size,"groups");
    L.forEach(p=>H.needs.push({n:p.name||"",d:[p.role,p.askFor?"ask for "+p.askFor:""].filter(Boolean).join(" · "),attr:`data-go2="org"`}));
    H.title="Who's who";
  }else if(id==="cultures"){
    const seen=new Set();let n=0;
    for(let i=0;i<=30;i++){const dd=addDays(t0,i);celebsOn(dd).forEach(x=>{if(seen.has(x.id))return;seen.add(x.id);n++;H.needs.push({n:x.name,d:(x.k||[]).map(k=>{try{return cuName(k);}catch(e){return k;}}).join(", "),...dueX(i,dd),late:false,dot:"info",attr:`data-cel="${x.id}"`});});}
    fig(CU_G.length,"community guides");fig(n,"celebrations in the next 30 days");
    H.title="Celebrations coming up";
  }else if(id==="meetings"){
    const L=[...S.meetings].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1);
    fig(L.length,"meetings logged");fig(L[0]&&L[0].date?Math.max(0,-daysFromToday(L[0].date)):"—","days since the last one");
    L.forEach(m=>H.needs.push({n:m.title||"Meeting",d:[m.with?"with "+m.with:"",m.where||""].filter(Boolean).join(", "),r:fmtDate(m.date),attr:`data-go2="meetings"`}));
    H.title="Recent";
  }else if(id==="programs"){
    const ws=weekStart(),we=addDays(ws,6),vids=S.videos.filter(v=>v.date>=ws&&v.date<=we).length,cls=S.sessions.filter(x=>x.date>=ws&&x.date<=we),under=cls.filter(x=>(+x.participants||0)<10).length;
    fig(vids,"videos this week, LEAD wants 1",vids?"ok":"warn");fig(cls.length,"classes this week");fig(under,"classes under 10 people",under?"warn":"");
    [...S.sessions].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1).forEach(x=>H.needs.push({n:x.program||"Class",d:[x.topic,(+x.participants||0)+" people"].filter(Boolean).join(" · "),r:fmtDate(x.date),dot:(+x.participants||0)>=10?"ok":"soon",attr:`data-go2="programs"`}));
    H.title="Latest classes";
  }else if(id==="log"){
    const L=[...S.log].sort((a,b)=>((b.date||"")+(b.createdAt||"")).localeCompare((a.date||"")+(a.createdAt||"")));
    fig(L.length,"notes");fig(L.filter(e=>e.tag==="blocker").length,"blockers",L.some(e=>e.tag==="blocker")?"warn":"");fig(L.filter(e=>e.tag==="learned").length,"things learned","ok");
    L.forEach(e=>H.needs.push({n:e.text||"",d:e.tag||"note",r:e.date?fmtDate(e.date):"",dot:e.tag==="blocker"?"late":e.tag==="learned"?"ok":"",attr:`data-go2="log"`}));
    H.title="Latest notes";
  }else if(id==="hours"){
    const ws=weekStart(),we=addDays(ws,6),ui=uninvoiced(),hw=Math.round(S.hours.filter(h=>h.date>=ws&&h.date<=we).reduce((a,h)=>a+(+h.hours||0),0)*10)/10;
    fig(hw+"<small>h</small>","this week");fig(ui.h+"<small>h</small>","not invoiced yet",ui.h?"warn":"");fig("$"+ui.amt,"waiting to invoice at $"+(+st.rate||27)+"/hr");
    [...S.hours].sort((a,b)=>(a.date||"")<(b.date||"")?1:-1).forEach(h=>H.needs.push({n:(+h.hours||0)+"h"+(h.what?" · "+h.what:""),d:h.lane||"",r:fmtDate(h.date),attr:`data-go2="hours"`}));
    H.title="Latest shifts";
  }else if(id==="sig"){
    H.title="How it works";H.calm="Fill in your details, check the preview, then copy it into Gmail's signature box.";
  }else if(id==="settings"){
    fig(st.sigGoal||500,"signature goal");fig(st.goalDate?fmtDate(st.goalDate):"—","goal date");fig("$"+(+st.rate||27),"hourly rate");
    H.title="Saving";H.calm=($("#statusText")||{}).textContent+". Back up or restore everything from Settings.";
  }
  return H;
}

/* ---------- the Home render ---------- */
function rHome(){
  const now=new Date(),h=now.getHours(),hello=h<12?"Good morning":h<17?"Good afternoon":"Good evening";
  const st=S.settings||{},goal=st.sigGoal||500,sg=sigTotals(),pct=Math.min(1,sg.all/goal);
  const rows=homeRows(),a=homeApp(),L=rowApps(S.home.row),idx=L.indexOf(a);
  const badge={};try{badge.today=dueSoon().filter(x=>!x._done&&x._days!==null&&x._days<=0).length+needsReport().length;badge.tasks=S.tasks.filter(t=>{if(t.status==="done")return false;const x=taskDue(t);return !x.done&&x.days!==null&&x.days<0;}).length;badge.events=needsReport().length;badge.ready=rdDue().length;badge.proposals=tabOK("proposals")?propDue().length:0;badge.playbook=S.questions.filter(q=>q.status!=="answered").length;}catch(e){}
  const rowBadge=k=>rowApps(k).reduce((s,x)=>s+(badge[x.id]||0),0);
  let H;try{H=heroFor(a.id);}catch(e){H={figs:[],needs:[],title:"Needs you"};}
  const cm=a.ext?cmtyLink(a.id):null;
  const side=cm?`<h3>Scan to join</h3><div class="hero-qr">${CMTY_QR[a.id]||""}</div><p>${esc(cm.url)}</p>`
    :`<h3><span>${esc(H.title)}</span>${H.needs.length?`<b>${H.needs.length}</b>`:""}</h3>${H.needs.slice(0,5).map(needRow).join("")||`<p class="calm">${esc(H.calm||(S.db===undefined?"Loading…":"Nothing waiting here. Open the app to add or review."))}</p>`}${H.needs.length>5?`<div class="more"><button data-go2="${a.id}">See all ${H.needs.length} in ${esc(appName(a))} ›</button></div>`:""}`;
  const acts=cm?`<a class="open-btn" id="heroOpen" href="${esc(cm.url)}" target="_blank" rel="noopener">Open the group ↗ <kbd>Enter</kbd></a><button class="ghost-btn" data-cmty="copy" data-id="${a.id}">Copy link</button><button class="ghost-btn" data-cmty="copy-all">Copy invite message</button>`
    :`<button class="open-btn" id="heroOpen" data-go2="${a.id}">Open ${esc(appName(a))} <kbd>Enter</kbd></button>`;
  return `<div class="console">
  <div class="c-top">
    <div><p class="c-date" id="hClock">${esc(homeClock())}</p><h1 class="c-hello">${hello}${ME().first?", "+esc(ME().first)+".":"."} <span>Here's the campaign.</span></h1></div>
    <button class="c-road" data-go2="today" aria-label="Open Today: ${sg.all} of ${goal} signatures"><span class="l"><span>Signatures of support</span><b>${sg.all}<small> / ${goal}</small></b></span><span class="track" style="display:block"><i class="fill" style="width:${(pct*100).toFixed(1)}%"></i></span></button>
  </div>
  <div class="c-search">${icon("search")}<input type="search" id="hq" placeholder="Find a person, event, task or app" autocomplete="off" aria-label="Find a person, event, task or app" value="${esc(S.hq)}"><span class="hint">press <kbd>/</kbd></span><div class="results ${S.hq?"":"hide"}" id="hqres">${S.hq?homeHits(S.hq):""}</div></div>
  <div class="c-rows" role="tablist" aria-label="Rows">${rows.map(([k,l])=>`<button role="tab" data-hrow="${k}" aria-selected="${k===S.home.row}">${l}${rowBadge(k)?` <small>${rowBadge(k)}</small>`:""}</button>`).join("")}</div>
  <div class="c-tiles" id="hTiles" role="toolbar" aria-label="${esc(ROWS.find(r=>r[0]===S.home.row)[1])} apps">${L.map(x=>`<button class="tile" id="tile-${x.id}" data-tile="${x.id}" style="--tc:var(--t-${x.tc})" aria-current="${x===a}" title="${esc(appName(x))}"><span class="face">${tileFace(x)}${badge[x.id]?`<span class="bdg">${badge[x.id]}</span>`:""}${x.ext?`<span class="ext">↗</span>`:""}</span><span class="lbl">${esc(appName(x))}</span></button>`).join("")}</div>
  <section class="hero" style="--tc:var(--t-${a.tc})" aria-live="polite">
    <div class="hero-main">
      <div class="hero-head"><span class="hero-ic">${tileFace(a)}</span><div><p class="hero-eb">${esc(ROWS.find(r=>r[0]===a.row)[1])} · ${idx+1} of ${L.length}</p><h2 class="hero-name">${esc(appName(a))}</h2></div></div>
      <p class="hero-desc">${esc(a.desc)}</p>
      ${H.figs.length?`<div class="hero-figs">${H.figs.map(f=>`<div><b class="num ${f.c||""}">${f.v}</b><span>${esc(f.l)}</span></div>`).join("")}</div>`:""}
      ${H.extra||""}
      <div class="hero-acts">${acts}</div>
    </div>
    <div class="hero-side">${side}</div>
  </section>
  <p class="c-hint"><span><kbd>←</kbd><kbd>→</kbd> choose</span><span><kbd>↑</kbd><kbd>↓</kbd> change row</span><span><kbd>Enter</kbd> opens</span><span><kbd>Esc</kbd> comes back here</span><span><kbd>/</kbd> search</span><span>a game controller works too</span></p>
</div>`;
}
function homeClock(){const d=new Date();return fmtLong(todayISO())+" · "+d.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});}
setInterval(()=>{const c=$("#hClock");if(c&&S.tab==="home")c.textContent=homeClock();},20000);

/* ---------- search (shared by Home and the bar) ---------- */
function searchHits(v){const q=v.toLowerCase();
  return allT().filter(t=>[t.name,t.contact_name,t.subtype,t.town].join(" ").toLowerCase().includes(q)).slice(0,6).map(t=>({id:t.id,n:t.name,k:(t.subtype||t.type||"")+", "+townOf(t)}))
    .concat(allE().filter(e=>[e.name,e.venue,e.host].join(" ").toLowerCase().includes(q)).slice(0,4).map(e=>({id:e.id,n:e.name,k:"Event, "+fmtDate(e.date)})))
    .concat(S.tasks.filter(t=>(t.title||"").toLowerCase().includes(q)).slice(0,3).map(t=>({id:"task:"+t.id,n:t.title,k:"Task"+(t.section?", "+t.section:"")})))
    .concat(tabOK("proposals")?S.proposals.filter(p=>[p.org,p.title,p.contact_name].join(" ").toLowerCase().includes(q)).slice(0,3).map(p=>({id:"prop:"+p.id,n:propName(p),k:"Proposal"+(p.title?", "+p.title:"")})):[])
    .concat((typeof cvSigners==="function"&&tabOK("team")&&S.view!=="canv")?cvSigners().filter(s=>[s.name,s.phone,s.email,s.address].join(" ").toLowerCase().includes(q)).slice(0,4).map(s=>({id:"sg:"+s.id,n:s.name||"(no name)",k:"Signer, "+(s.town||s.townGuess||"town unknown")+(s.date?", "+fmtDate(s.date):"")})):[])
    .concat((typeof ltAll==="function"&&tabOK("letters"))?ltAll().filter(c=>[c.name,c.person,c.address].join(" ").toLowerCase().includes(q)).slice(0,4).map(c=>({id:"lt:"+c.id,n:c.name,k:"Letter of support, "+LT_SM[ltSt(c)][1]+(c.person?", "+c.person:"")})):[])
    .concat(COMMUNITY.filter(c=>[c.name,c.kind,"community page group link"].join(" ").toLowerCase().includes(q)).map(c=>({id:"cmty:"+c.id,n:c.name,k:"Community page, QR and link"})))
    .concat(tabOK("center")?ctSearch(q):[]).concat(tabOK("center")?ctrSearch(q):[]);}
function openHit(id){
  if(id.startsWith("app:")){const a=appById(id.slice(4));if(a&&a.ext){S.home.row=a.row;S.home.pick[a.row]=a.id;homeSave();go("home");}else go(id.slice(4));return;}
  if(id.startsWith("task:")){const t=S.tasks.find(x=>x.id===id.slice(5));if(t)taskForm(t);return;}
  if(id.startsWith("sg:")){S.cv.sub="signers";go("team");cvDrawer(id.slice(3));return;}
  if(id.startsWith("lt:")){go("letters");ltDrawer(id.slice(3));return;}
  if(id.startsWith("prop:"))goProp(id.slice(5));else if(id.startsWith("cmty:"))cmtySheet(id.slice(5));else if(id.startsWith("ctrp:")){go("center");ctrSheet(id.slice(5));}else if(id.startsWith("ctr:")){go("center");ctSheet(id.slice(4));}else openDetail(id);}
function homeHits(v){const q=v.trim().toLowerCase();if(!q)return "";
  const apps=APPS.filter(a=>appOK(a)&&(appName(a)+" "+a.desc).toLowerCase().includes(q)).slice(0,4);
  const hits=searchHits(q);
  return apps.map(a=>`<button data-hit="app:${a.id}"><span class="app-hit"><span class="ti" style="--tc:var(--t-${a.tc})">${a.lt?`<b style="font:800 10px var(--display)">${a.lt}</b>`:icon(a.id)}</span><span><div>${esc(appName(a))}</div><div class="k">App, ${esc(ROWS.find(r=>r[0]===a.row)[1])}</div></span></span></button>`).join("")
    +hits.map(h=>`<button data-hit="${esc(h.id)}"><div>${esc(h.n)}</div><div class="k">${esc(h.k)}</div></button>`).join("")
    ||`<button disabled><div class="k">Nothing matches "${esc(v.trim())}"</div></button>`;}

/* ---------- moving around Home ---------- */
function homePick(id){const a=appById(id);if(!a)return;S.home.row=a.row;S.home.pick[a.row]=id;homeSave();render();}
function homeOpen(){const a=homeApp();if(!a)return;if(a.ext){const l=$("#heroOpen");if(l)l.click();return;}go(a.id);}
function homeMove(dx,dy){
  if(dy){const rows=homeRows().map(r=>r[0]);let i=rows.indexOf(S.home.row)+dy;i=Math.max(0,Math.min(rows.length-1,i));S.home.row=rows[i];homeSave();render();focusTile();return;}
  const L=rowApps(S.home.row),a=homeApp();let i=L.indexOf(a)+dx;i=Math.max(0,Math.min(L.length-1,i));S.home.pick[S.home.row]=L[i].id;homeSave();render();focusTile();}
function focusTile(){const t=$("#hTiles [aria-current=true]");if(t)t.focus({preventScroll:true});}
function centerTile(smooth){const row=$("#hTiles"),t=row&&row.querySelector("[aria-current=true]");if(!t)return;const x=t.offsetLeft-row.clientWidth/2+t.offsetWidth/2;row.style.scrollBehavior=smooth?"":"auto";row.scrollLeft=Math.max(0,x);}
const isTyping=el=>!!(el&&(el.closest&&el.closest("input,textarea,select,[contenteditable=true]")));
function homeBind(v){
  if(S.tab!=="home")return;
  centerTile(false);
  v.querySelectorAll("[data-hrow]").forEach(b=>b.addEventListener("click",()=>{S.home.row=b.dataset.hrow;homeSave();render();}));
  v.querySelectorAll("[data-tile]").forEach(b=>b.addEventListener("click",()=>{const a=homeApp();if(a&&a.id===b.dataset.tile)homeOpen();else homePick(b.dataset.tile);}));
  const hq=$("#hq"),hr=$("#hqres");
  if(hq){hq.addEventListener("input",()=>{S.hq=hq.value;const h=homeHits(S.hq);hr.innerHTML=h;hr.classList.toggle("hide",!S.hq.trim());});
    hq.addEventListener("keydown",e=>{if(e.key==="Enter"){const f=hr.querySelector("[data-hit]");if(f){e.preventDefault();hq.blur();f.click();}}else if(e.key==="Escape"&&!$("#overlay").innerHTML.trim()){S.hq="";hq.value="";hr.classList.add("hide");hq.blur();e.stopPropagation();}});
    hr.addEventListener("click",e=>{const b=e.target.closest("[data-hit]");if(!b)return;const id=b.dataset.hit;S.hq="";hq.value="";hr.classList.add("hide");openHit(id);});}
}
/* links from the preview panel into the right place */
document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;
  const tk=t.closest("[data-htask]");if(tk){const x=S.tasks.find(y=>y.id===tk.dataset.htask);if(x)taskForm(x);return;}
  const pr=t.closest("[data-hprop]");if(pr){goProp(pr.dataset.hprop);return;}
  const hq=t.closest("[data-hq]");if(hq){const x=S.questions.find(y=>y.id===hq.dataset.hq);if(x)qForm(x);return;}
  const hm=t.closest("[data-hmap]");if(hm){S.mf.town=hm.dataset.hmap;go("map");return;}
  if(S.tab==="home"&&!t.closest(".c-search"))(document.getElementById("hqres")||{classList:{add(){}}}).classList.add("hide");
});
document.addEventListener("keydown",e=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  const typing=isTyping(e.target),overlay=$("#overlay").innerHTML.trim();
  if(e.key==="/"&&!typing&&!overlay){const i=S.tab==="home"?$("#hq"):$("#q");if(i){e.preventDefault();i.focus();i.select();}return;}
  if(S.tab!=="home"||typing||overlay)return;
  const k=e.key;
  if(k==="ArrowRight"||k==="ArrowLeft"){e.preventDefault();homeMove(k==="ArrowRight"?1:-1,0);}
  else if(k==="ArrowDown"||k==="ArrowUp"){e.preventDefault();homeMove(0,k==="ArrowDown"?1:-1);}
  else if(k==="Enter"){const ae=document.activeElement;if(ae&&ae!==document.body&&!ae.closest(".tile"))return;e.preventDefault();homeOpen();}
});
/* swipe the tile row: the tile that lands in the middle becomes the chosen one */
let swipeT;document.addEventListener("scroll",e=>{const row=e.target;if(!row||row.id!=="hTiles"||S.tab!=="home")return;clearTimeout(swipeT);swipeT=setTimeout(()=>{if(!row.isConnected||row.dataset.drag!=="1")return;row.dataset.drag="";const mid=row.scrollLeft+row.clientWidth/2;let best=null,bd=1e9;row.querySelectorAll("[data-tile]").forEach(t=>{const d=Math.abs(t.offsetLeft+t.offsetWidth/2-mid);if(d<bd){bd=d;best=t;}});if(best&&best.getAttribute("aria-current")!=="true")homePick(best.dataset.tile);},160);},true);
document.addEventListener("touchstart",e=>{const row=e.target.closest&&e.target.closest("#hTiles");if(row)row.dataset.drag="1";},{passive:true});

/* ---------- game controller: d-pad or left stick moves, A opens, B comes back ---------- */
let GP=0;const gpHeld={};
function gpTick(){const pads=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];if(!pads.length){GP=0;return;}const p=pads[0],now=performance.now();
  const on=i=>!!(p.buttons[i]&&p.buttons[i].pressed),ax=p.axes[0]||0,ay=p.axes[1]||0;
  const fire=(key,down,fn)=>{if(!down){delete gpHeld[key];return;}const t=gpHeld[key];if(t===undefined||now-t>240){gpHeld[key]=now;fn();}};
  const ov=$("#overlay").innerHTML.trim();
  if(S.tab==="home"&&!ov){fire("l",on(14)||ax<-.6,()=>homeMove(-1,0));fire("r",on(15)||ax>.6,()=>homeMove(1,0));fire("u",on(12)||ay<-.6,()=>homeMove(0,-1));fire("d",on(13)||ay>.6,()=>homeMove(0,1));fire("a",on(0),homeOpen);}
  fire("b",on(1),()=>{if(ov)closeOverlay();else if(S.tab!=="home")go("home");});
  GP=requestAnimationFrame(gpTick);}
window.addEventListener("gamepadconnected",()=>{if(!GP)GP=requestAnimationFrame(gpTick);});

function shellChrome(){const root=document.documentElement;root.dataset.mode=S.tab==="home"?"home":"app";if(S.tab==="home")return;
  const a=appById(S.tab),ic=$("#crumbIc");if(a&&ic){ic.innerHTML=tileFace(a);ic.style.setProperty("--tc",`var(--t-${a.tc})`);}
  const ctx=$("#pageContext");if(ctx&&a){const rn=(ROWS.find(r=>r[0]===a.row)||[])[1]||"";ctx.textContent=PAGE_CONTEXT[S.tab]?rn+" · "+PAGE_CONTEXT[S.tab]:rn;}
  if(a&&!a.ext&&(S.home.row!==a.row||S.home.pick[a.row]!==a.id)){S.home.row=a.row;S.home.pick[a.row]=a.id;homeSave();}
  const strip=$("#appStrip"),cur=strip&&strip.querySelector("[aria-current=page]");if(cur&&(cur.offsetLeft<strip.scrollLeft||cur.offsetLeft+cur.offsetWidth>strip.scrollLeft+strip.clientWidth))strip.scrollLeft=Math.max(0,cur.offsetLeft-strip.clientWidth/2+cur.offsetWidth/2);}


/* ============ Canvass: signers, shifts, team, goals (folded in from LEAD-Canvass-CRM, Nov 4) ============ */
TITLES.team="Canvass";PAGE_CONTEXT.team="Signatures, signers & shifts";
const CV_KEY="lead_hub_cv";
const CV_AREAS=['Bushnell Park','Downtown / Main St','Transit / UConn','Caribbean Fest','Black & Latino Expo','Parade','Library / Bus station','CREC event','Trunk or Treat','Capital Community College','Door to door','Other'];
const CV_SLABEL={Prospect:"Signed only",Contacted:"Talked to",Supporter:"Supports us",Champion:"Champion",Declined:"Do not contact"};
const cvPill=k=>`<span class="pill st-${k}"><i></i>${CV_SLABEL[k]||k}</span>`;
const CV_GEOS=["Hartford","Greater Hartford","Outside the area","Unknown"];
const CV_GEOC={"Hartford":"var(--green)","Greater Hartford":"var(--blue)","Outside the area":"var(--orange)","Unknown":"var(--line)"};
const CV_MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CV_HSTREETS=['asylum','park st','park street','park ter','woodland','capitol','charter oak','vine','garden','franklin','trumbull','blue hills','farmington','hillside','pearl','washington','barbour','pratt','lincoln','cleveland','clark','standish','nelton','kensington','oxford','new britain ave','laurel','granby','preston','gold','baltic','kent','buckingham','brainard','albany','putnam','branford','lewis','roosevelt','prospect','madison','seyms','cabot','high st','goodwin','capen','belden','edgewood','colonial','bedford','nelson','annawan','wethersfield ave','hudson','wells','sisson','nilan','zion','evergreen','gillett','maple ave','ida','adelaide','ella grasso','bishop','parker','russ','hamilton','columbus','cooper','charlotte','collins','sherman','benton','owen','plainfield','chadwick','bushnell','imlay','earle','van block','roxbury','cedar','magnolia','congress','wooster','linden','spring','mortson','wadsworth','arch','warrenton','monroe','lawrence','glendale','amity','greenfield','allyn','morgan','sterling','love ln','sigourney','homestead','lafayette','hawthorn','jefferson','judson','kenyon','marshall','martin','oakland','ridgefield','sargeant','sherbrooke','tower','tremont','westbourne','winship','keney','milford','pliny','catherine','chapel','allen pl','columbia','francis','freeman','girard','hebron','irving','niles','retreat','seymour','warren','webster','williams','flatbush','hungerford','campfield','cornwall','deerfield','elmer','ely','harbison','babcock','ashley','grand st','brown st','mather','wyllys','westland','affleck','bond','broad st','enfield st','vernon st','huntington','ward','sanford','edwards','elliott','kane','sumner','whitney','cone','center st','crescent','fairfield ave','new park','bartholomew','grafton','hawthorne','newfield','ridgewood','south whitney','waverly','west blvd','white st','harvard','flower','orange','howard','julius','mountain','barry sq','rocky ridge','campbell','elmwood','bonner','brookfield','cherry','clifford','dart','east st','mansfield','newington ave','norwich','putnam heights','squire','vernon'];
const CV_GHT=['east hartford','west hartford','wethersfield','newington','bloomfield','windsor','windsor locks','manchester','glastonbury','new britain','farmington','rocky hill','south windsor','east windsor','enfield','simsbury','avon','berlin','plainville','bristol','southington','canton','granby','east granby','suffield','ellington','vernon','tolland','bolton','marlborough','hebron','andover','coventry','columbia','mansfield','somers','stafford','willington','burlington','cromwell','middletown','portland','meriden'];

S.signers=S.signers||[];S.cvdocs=S.cvdocs||[];
S.cv={sub:"over",org:"libertas",center:"east-hartford",r0:"",r1:"",chart:0,fc:"",fm:"",q:"",sc:"",sl:"",st:"",sd:"",sg:"",sf:"",ss:"date",sStatus:"",sel:null};
try{Object.assign(S.cv,JSON.parse(localStorage.getItem(CV_KEY)||"{}"),{sel:null});}catch(e){}
function cvSave(){try{localStorage.setItem(CV_KEY,JSON.stringify({sub:S.cv.sub,org:S.cv.org,center:S.cv.center,chart:S.cv.chart}));}catch(e){}}

/* ---------- data ---------- */
function cvDoc(k){const d=S.cvdocs.find(x=>x.id===k);return d?d.list:null;}
function cvOrgs(){return cvDoc("orgs")||CV.orgs;}
function cvCenters(){return cvDoc("centers")||CV.centers;}
function cvOrg(id){return cvOrgs().find(o=>o.id===id);}
function cvCenter(id){return cvCenters().find(c=>c.id===id);}
function cvPrimary(){const o=cvOrgs().find(x=>x.primary)||cvOrgs()[0];return o?o.id:"libertas";}
function cvHome(){const c=cvCenters().find(x=>x.active!==false)||cvCenters()[0];return c?c.id:"east-hartford";}
function cvGoal(o){const st=S.settings||{};return o&&o.primary?(+st.sigGoal||+o.goal||0):(+(o&&o.goal)||0);}
function cvGoalDate(o){const st=S.settings||{};return o&&o.primary?(st.goalDate||""):(o&&o.goalDate||"");}
function cvOrgOf(x){return x.org||cvPrimary();}
function cvCenterOf(x){return x.center||cvHome();}
function cvSigners(){const over={};S.signers.forEach(d=>over[d.id]=d);const seen=new Set();const out=[];
  for(const s of CV.signers){seen.add(s.id);const p=over[s.id];const r=p?{...s,...p,id:s.id}:s;if(r.deleted)continue;out.push(cvNorm(r));}
  S.signers.forEach(d=>{if(seen.has(d.id)||d.deleted)return;out.push(cvNorm({...d}));});return out;}
function cvNorm(r){return {org:"libertas",center:"east-hartford",town:"",phone:"",email:"",location:"",note:"",tags:[],crm:"",follow:"",verified:false,geo:"",townGuess:"",townBasis:"",townCands:[],status:"Prospect",signed:true,address:"",name:"",c:"",date:"",...r};}
function cvSigner(id){return cvSigners().find(s=>s.id===id);}
async function cvSetSigner(id,patch){const seed=CV.signers.find(s=>s.id===id);const cur=S.signers.find(d=>d.id===id)||{};const {id:_i,...rest}=cur;const next=seed?{...rest,...patch}:{...cvNorm({...rest,...patch})};delete next.id;return write("signers",id,next);}
const cvCanv=id=>S.team.find(c=>c.id===id);
const cvCName=id=>{const c=cvCanv(id);return c?c.name:"";};
const cvShiftWho=s=>s.who||cvCName(s.c)||"—";
const cvNum=s=>s.sigs==null||s.sigs===""?null:+s.sigs;
const cvSum=a=>a.reduce((t,s)=>t+(+s.sigs||0),0);
const cvD=d=>{if(!d)return "—";const [y,m,dd]=String(d).split("-");return `${+m}/${+dd}`;};
const cvDl=d=>d?fmtDate(d):"No date";
const cvSlug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"x";
const cvInOrg=x=>S.cv.org==="all"||cvOrgOf(x)===S.cv.org;
const cvInCenter=x=>S.cv.center==="all"||cvCenterOf(x)===S.cv.center;
const cvInRange=x=>{if(!S.cv.r0&&!S.cv.r1)return true;const d=x.date||"";if(!d)return !S.cv.r0;return (!S.cv.r0||d>=S.cv.r0)&&(!S.cv.r1||d<=S.cv.r1);};
const cvShifts=()=>S.shifts.filter(x=>cvInOrg(x)&&cvInCenter(x)&&cvInRange(x));
const cvSg=()=>cvSigners().filter(x=>cvInOrg(x)&&cvInCenter(x)&&cvInRange(x));
const cvTeam=()=>S.team.filter(c=>S.cv.center==="all"||cvCenterOf(c)===S.cv.center);
const cvGoalNow=()=>S.cv.org==="all"?cvOrgs().filter(o=>o.active!==false).reduce((t,o)=>t+cvGoal(o),0):cvGoal(cvOrg(S.cv.org));
const cvAccent=()=>S.cv.org==="all"?"var(--blue)":(cvOrg(S.cv.org)||{}).color||"var(--blue)";
const cvTown=s=>s.town||s.townGuess||"";
const cvNormName=n=>(n||"").toLowerCase().replace(/\?/g,"").replace(/[^a-z]/g,"");
function cvDups(list){const m={};list.forEach(s=>{const k=cvNormName(s.name);if(k.length>5)(m["n:"+k]=m["n:"+k]||[]).push(s.id);const p=(s.phone||"").replace(/\D/g,"");if(p.length>=10)(m["p:"+p]=m["p:"+p]||[]).push(s.id);});const d={};Object.values(m).forEach(g=>{if(g.length>1)g.forEach(id=>{d[id]=d[id]||new Set();g.forEach(o=>{if(o!==id)d[id].add(o);});});});return d;}
function cvAutoGeo(s){const tw=cvTown(s).toLowerCase(),ad=(s.address||"").toLowerCase();const basis=s.town?(s.townBasis||"town written"):(s.townBasis||"");
  if(tw==="hartford")return ["Hartford",basis];if(tw)return [CV_GHT.includes(tw)?"Greater Hartford":"Outside the area",basis];
  if(!ad)return ["Unknown","no address"];if(/\b(east|west|e\.?|w\.?)\s*(hartford|htfd|hfd)\b/.test(ad))return ["Greater Hartford","address says "+(/\b(east|e)/.test(ad)?"East":"West")+" Hartford"];if(/\b(hartford|htfd|hfd|hartfrd)\b/.test(ad))return ["Hartford","address says Hartford"];const hit=CV_HSTREETS.find(st=>new RegExp("(^|\\s)"+st.replace(/ /g,"\\s+")+"(\\s|$|,)").test(ad));if(hit)return ["Hartford","Hartford street: "+hit];
  if(/\bmain\b/.test(ad))return ["Unknown","Main St could be any town"];return ["Unknown","street not recognized"];}
const cvGeo=s=>s.geoLock&&s.geo?s.geo:cvAutoGeo(s)[0];
const cvReview=s=>!s.verified&&(s.conf==="low"||!s.name||/\?/.test(s.name+s.address+s.phone+s.email));
const cvStatusOf=s=>STATUSES.includes(s.status)?s.status:"Prospect";
function cvGuessArea(l){l=(l||"").toLowerCase();
  if(l.includes("carib"))return "Caribbean Fest";if(l.includes("expo"))return "Black & Latino Expo";if(l.includes("parade"))return "Parade";
  if(l.includes("crec"))return "CREC event";if(l.includes("trunk"))return "Trunk or Treat";if(l.includes("library")||l.includes("bus station"))return "Library / Bus station";
  if(l.includes("community college")||l.includes("capital college"))return "Capital Community College";if(l.includes("bushnell"))return "Bushnell Park";
  if(l.includes("downtown")||l.includes("main st")||l.includes("old state")||l.includes("corridor")||l.includes("food court")||l.includes("capitol"))return "Downtown / Main St";
  if(l.includes("transit")||l.includes("uconn"))return "Transit / UConn";if(l.includes("door"))return "Door to door";return "Other";}
function cvAllDates(){return [...new Set([...S.shifts,...cvSigners()].filter(x=>cvInOrg(x)&&cvInCenter(x)).map(x=>x.date).filter(Boolean))].sort();}
function cvOnFileFor(sh,sg){return sg.filter(x=>x.c===sh.c&&x.date===sh.date).length;}
function cvFollowDue(){const t0=todayISO();return cvSigners().filter(s=>s.follow&&s.follow<=t0&&cvStatusOf(s)!=="Declined");}
function cvCount(){return S.shifts.filter(s=>cvNum(s)===null||((+s.sigs||0)>0&&!s.uploaded)).length+cvFollowDue().length;}

/* ---------- tooltip ---------- */
function cvTipEl(){let t=$("#cvtip");if(!t){t=document.createElement("div");t.id="cvtip";t.className="cv-tip";document.body.appendChild(t);document.addEventListener("mousemove",e=>{if(t.style.display==="block")cvMoveTip(e);});}return t;}
function cvShowTip(e,html){const t=cvTipEl();t.innerHTML=html;t.style.display="block";cvMoveTip(e);}
function cvMoveTip(e){const t=cvTipEl();const w=t.offsetWidth,h=t.offsetHeight;let x=e.clientX+14,y=e.clientY+14;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y+h>innerHeight-8)y=e.clientY-h-14;t.style.left=x+"px";t.style.top=y+"px";}
function cvHideTip(){const t=$("#cvtip");if(t)t.style.display="none";}

/* ---------- page ---------- */
function rCanvass(){
  if(S.view==="canv"&&S.cv.sub==="signers")S.cv.sub="over";const sub=S.cv.sub;const nav=[["over","Overview"],["signers","Signers"],["shifts","Shifts"],["team","Team"],["spots","Where to canvass"]];
  let h=`<div class="subnav">${nav.map(([k,l])=>`<button data-act="cv-sub" data-v="${k}" aria-pressed="${sub===k}" class="${k==="signers"?"vh-canv":""}">${l}</button>`).join("")}</div>`;
  h+=cvBand();
  if(sub==="over")h+=cvOverview();else if(sub==="signers")h+=cvSignersView();else if(sub==="shifts")h+=cvShiftsView();else if(sub==="team")h+=cvTeamView();else h+=cvSpotsView();
  return h;}
function cvBand(){
  const o=S.cv.org==="all"?null:cvOrg(S.cv.org),c=S.cv.center==="all"?null:cvCenter(S.cv.center);
  const orgs=cvOrgs().filter(x=>x.active!==false),cents=cvCenters().filter(x=>x.active!==false);
  return `<div class="cv-band">
    <div class="cv-sw"><span class="lbl">Campaign</span>${orgs.map(x=>`<button data-act="cv-org" data-id="${x.id}" aria-pressed="${S.cv.org===x.id}" style="--oc:${x.color||"var(--blue)"}"><i class="dot"></i>${esc(x.short||x.name)}</button>`).join("")}${orgs.length>1?`<button data-act="cv-org" data-id="all" aria-pressed="${S.cv.org==="all"}">All</button>`:""}<button class="ghost" data-act="cv-orgs">Manage</button></div>
    <div class="cv-sw"><span class="lbl">Center</span>${cents.map(x=>`<button data-act="cv-center" data-id="${x.id}" aria-pressed="${S.cv.center===x.id}" style="--oc:var(--violet)">${esc(x.short||x.name)}</button>`).join("")}${cents.length>1?`<button data-act="cv-center" data-id="all" aria-pressed="${S.cv.center==="all"}">All</button>`:""}<button class="ghost" data-act="cv-centers">Manage</button></div>
    <span class="sp"></span>
    <span class="small muted">${o?esc(o.name):"All campaigns"} · ${c?esc(c.short||c.name):"All centers"}</span>
  </div>${cvTimeline()}`;}
function cvTimeline(){const ds=cvAllDates();if(ds.length<2)return "";
  const i0=S.cv.r0?Math.max(0,ds.findIndex(d=>d>=S.cv.r0)):0;let i1=S.cv.r1?ds.findIndex(d=>d>S.cv.r1):-1;i1=i1<0?ds.length-1:Math.max(0,i1-1);const pct=i=>i/(ds.length-1)*100;
  return `<div class="cv-tl"><span class="lbl">Timeline</span><div class="cv-range"><div class="track"></div><div class="fill" style="left:${pct(i0)}%;width:${pct(i1)-pct(i0)}%"></div><input type="range" data-cvr="0" min="0" max="${ds.length-1}" value="${i0}" aria-label="From"><input type="range" data-cvr="1" min="0" max="${ds.length-1}" value="${i1}" aria-label="To"></div><span class="lab">${(S.cv.r0||S.cv.r1)?`${cvD(ds[i0])} → ${cvD(ds[i1])}`:`All time · ${cvD(ds[0])} → ${cvD(ds[ds.length-1])}`}</span>${(S.cv.r0||S.cv.r1)?`<button class="btn sm ghost" data-act="cv-rall">All time</button>`:""}</div>`;}

/* ---------- overview ---------- */
function cvOverview(){
  const sh=cvShifts(),sg=cvSg(),goal=cvGoalNow(),t0=todayISO();
  const total=cvSum(sh),logged=sh.filter(s=>cvNum(s)!==null);const pct=goal?Math.min(100,Math.round(total/goal*100)):0;
  const withContact=sg.filter(s=>s.phone||s.email).length,review=sg.filter(cvReview).length,dups=Object.keys(cvDups(sg)).length,follow=sg.filter(s=>s.follow&&s.follow<=t0&&cvStatusOf(s)!=="Declined").length;
  const pend=sh.filter(s=>(+s.sigs||0)>0&&!s.uploaded).length,nosig=sh.filter(s=>cvNum(s)===null).length;
  const r=15,C=2*Math.PI*r;
  const ring=`<svg class="ring ${pct>=100?"":"go"}" viewBox="0 0 36 36" aria-hidden="true"><circle class="bg" cx="18" cy="18" r="${r}"/><circle class="fg" cx="18" cy="18" r="${r}" stroke-dasharray="${(C*pct/100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 18 18)"/></svg>`;
  const area=sg.length?Math.round(sg.filter(s=>["Hartford","Greater Hartford"].includes(cvGeo(s))).length/sg.length*100)+"%":"—";
  const tile=(k,v,l,cls,x)=>`<div class="${cls||""} ${x?"hasring":""}" data-act="cv-tile" data-k="${k}"><b class="num">${v}</b><span>${l}</span>${x||""}</div>`;
  let h=`<div class="strip cv-strip">
    ${tile("goal",total.toLocaleString(),goal?`signatures logged · ${pct}% of ${goal.toLocaleString()} goal`:"signatures logged · no goal set",pct>=100?"okv":"",ring)}
    ${tile("onfile",sg.length.toLocaleString(),`signers on file · ${sg.filter(s=>s.signed).length} signed`)}
    ${tile("paper",(sg.length-total>=0?"+":"")+(sg.length-total),`on paper vs logged · ${sg.length} rows, ${total} logged`,sg.length-total?"warnv":"")}
    ${tile("avg",logged.length?(cvSum(logged)/logged.length).toFixed(1):"0",`per shift · ${sh.length} shifts, ${logged.length} counted`)}
    ${tile("reach",sg.length?Math.round(withContact/sg.length*100)+"%":"—",`reachable · ${withContact} with a phone or email`)}
    ${tile("geo",area,`Hartford area · ${sg.filter(s=>cvGeo(s)==="Hartford").length} Hartford, ${sg.filter(s=>cvGeo(s)==="Greater Hartford").length} nearby, ${sg.filter(s=>cvGeo(s)==="Unknown").length} unknown`)}
    ${tile("pipe",sg.filter(s=>["Supporter","Champion"].includes(cvStatusOf(s))).length,`supporters · ${sg.filter(s=>cvStatusOf(s)==="Champion").length} champions, ${sg.filter(s=>cvStatusOf(s)==="Contacted").length} contacted`,sg.some(s=>["Supporter","Champion"].includes(cvStatusOf(s)))?"okv":"")}
    ${tile("team",new Set(logged.map(s=>s.c||s.who)).size,`active canvassers · of ${cvTeam().length} on the roster`)}
  </div>
  <div class="cv-attn">
    <button class="${review?"warn":"ok"}" data-act="cv-attn" data-k="review"><b class="num">${review}</b><span>signers to check<br>(unclear handwriting)</span></button>
    <button class="${dups?"warn":"ok"}" data-act="cv-attn" data-k="dup"><b class="num">${dups}</b><span>possible duplicate<br>records</span></button>
    <button class="${follow?"bad":"ok"}" data-act="cv-attn" data-k="follow"><b class="num">${follow}</b><span>follow-ups due</span></button>
    <button class="${nosig?"warn":"ok"}" data-act="cv-attn" data-k="nosig"><b class="num">${nosig}</b><span>shifts with no<br>signature count</span></button>
    <button class="${pend?"warn":"ok"}" data-act="cv-attn" data-k="pend"><b class="num">${pend}</b><span>shifts awaiting<br>upload</span></button>
  </div>`;
  h+=cvStage();
  h+=`<div class="chips" style="margin-top:14px"><button class="btn sm pri" data-act="cv-report">Copy update for Kelly</button><button class="btn sm" data-act="cv-csv">${LOCAL?"Download signers (CSV)":"Copy signers as CSV"}</button><button class="btn sm" data-act="cv-src">Source sheets on file</button></div>`;
  return h;}
const cvChartFilter=x=>(!S.cv.fc||(x.c||"")===S.cv.fc)&&(!S.cv.fm||(x.date||"").slice(0,7)===S.cv.fm);
const CV_CHARTS=[
 {id:"leader",t:"Signatures by canvasser",d:"from the shift log · tap a bar for that person",when:()=>true,r:(el,L)=>{const sh=cvShifts().filter(cvChartFilter);const m={};sh.forEach(s=>{const k=s.c||s.who;m[k]=(m[k]||0)+(+s.sigs||0);});
   cvHbars(el,Object.entries(m).map(([c,v])=>({k:cvCName(c)||c,v,c,n:sh.filter(s=>(s.c||s.who)===c).length})).filter(r=>r.v>0).sort((a,b)=>b.v-a.v),"var(--blue)",r=>cvPerson(r.c),r=>`<b>${esc(r.k)}</b><span>${r.v} signatures · ${r.n} shifts · ${(r.v/r.n).toFixed(1)} per shift</span>`);}},
 {id:"onfileLeader",t:"Signers on file by canvasser",d:"counted from the signature sheets, not the log",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);const m={};sg.forEach(s=>{m[s.c||""]=(m[s.c||""]||0)+1;});
   cvHbars(el,Object.entries(m).map(([c,v])=>({k:c?cvCName(c)||c:"Collector not written",v,c,n:new Set(sg.filter(s=>(s.c||"")===c).map(s=>s.date)).size})).sort((a,b)=>b.v-a.v),"var(--green)",r=>{if(r.c)cvPerson(r.c);},r=>`<b>${esc(r.k)}</b><span>${r.v} signers on file · ${r.n} day${r.n===1?"":"s"}</span>`);}},
 {id:"cum",t:"Running total vs goal",d:"logged signatures over time · hover for the day",when:()=>true,r:(el,L)=>cvCum(el,cvShifts().filter(cvChartFilter))},
 {id:"onfile",t:"Signers on file by location",d:"where each petition sheet was collected · tap to open that list",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);const m={};sg.forEach(s=>{const k=s.location||"Not written";m[k]=(m[k]||0)+1;});
   cvHbars(el,Object.entries(m).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v),"var(--green)",r=>{S.cv.sl=r.k==="Not written"?"":r.k;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers on file</span>`);}},
 {id:"byday",t:"Signers on file by day",d:"sheets transcribed, split by collector",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);const days=[...new Set(sg.map(s=>s.date||""))].sort();const people=[...new Set(sg.map(s=>s.c||""))];const cols=["var(--blue)","var(--orange)","var(--green)","var(--violet)","var(--t-plum)","var(--t-teal)"];
   const series=people.slice(0,6).map((c,i)=>({name:c?cvCName(c)||c:"Not written",color:cols[i],vals:days.map(d=>sg.filter(s=>(s.c||"")===c&&(s.date||"")===d).length)}));
   cvVbars(el,days.map(d=>d?cvD(d):"No date"),series,(i,j)=>`<b>${days[i]?cvDl(days[i]):"No date"}</b><span>${series[j].name}: ${series[j].vals[i]} signers</span>`);L(series);}},
 {id:"logged",t:"Logged vs on file",d:"per day: what the log says vs rows transcribed from the sheets",when:()=>cvSg().length>0,r:(el,L)=>{const sh=cvShifts().filter(cvChartFilter),sg=cvSg().filter(cvChartFilter);let keys=[...new Set([...sh.map(s=>s.date),...sg.map(s=>s.date)].filter(Boolean))].sort();
   const series=[{name:"Logged in the shift log",color:"var(--blue)",vals:keys.map(d=>cvSum(sh.filter(s=>s.date===d)))},{name:"Rows on file",color:"var(--green)",vals:keys.map(d=>sg.filter(s=>s.date===d).length)}];
   const keep=keys.map((k,i)=>series[1].vals[i]>0);keys=keys.filter((k,i)=>keep[i]);series.forEach(s=>s.vals=s.vals.filter((v,i)=>keep[i]));
   cvVbars(el,keys.map(cvD),series,(i,j)=>`<b>${cvDl(keys[i])}</b><span>${series[0].name}: ${series[0].vals[i]}</span><span>${series[1].name}: ${series[1].vals[i]}</span>`);L(series);}},
 {id:"area",t:"Signatures by area",d:"from the shift log",when:()=>true,r:(el,L)=>{const sh=cvShifts().filter(cvChartFilter);const m={};sh.forEach(s=>{const a=s.area||cvGuessArea(s.where);m[a]=(m[a]||0)+(+s.sigs||0);});
   cvHbars(el,Object.entries(m).map(([k,v])=>({k,v,n:sh.filter(s=>(s.area||cvGuessArea(s.where))===k).length})).filter(r=>r.v>0).sort((a,b)=>b.v-a.v),"var(--green)",null,r=>`<b>${esc(r.k)}</b><span>${r.v} signatures · ${r.n} shifts · ${(r.v/r.n).toFixed(1)} per shift</span>`);}},
 {id:"week",t:"Signatures by week",d:"from the shift log",when:()=>true,r:(el,L)=>cvWeek(el,cvShifts().filter(cvChartFilter))},
 {id:"towns",t:"Signers by town",d:"written on the sheet, or worked out from the street · tap to filter",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);const m={};sg.forEach(s=>{const k=cvTown(s)||"Not written";m[k]=(m[k]||0)+1;});
   cvHbars(el,Object.entries(m).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,12),"var(--violet)",r=>{S.cv.st=r.k==="Not written"?"":r.k;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers</span>`);}},
 {id:"geo",t:"Hartford area or not",d:"from the town written, or a Hartford street lookup when none was written · tap to filter",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);
   cvHbars(el,CV_GEOS.map(g=>({k:g,v:sg.filter(s=>cvGeo(s)===g).length})),"var(--orange)",r=>{S.cv.sg=r.k;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers · ${sg.length?Math.round(r.v/sg.length*100):0}%</span>`);}},
 {id:"outside",t:"Where the non-Hartford signers are",d:"towns outside the city, written or worked out · tap to filter",when:()=>cvSg().some(s=>cvGeo(s)!=="Hartford"&&cvTown(s)),r:(el,L)=>{const sg=cvSg().filter(cvChartFilter).filter(s=>cvTown(s)&&cvGeo(s)!=="Hartford");const m={};sg.forEach(s=>{m[cvTown(s)]=(m[cvTown(s)]||0)+1;});
   cvHbars(el,Object.entries(m).map(([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,15),"var(--orange)",r=>{S.cv.st=r.k;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers · ${CV_GHT.includes(r.k.toLowerCase())?"Greater Hartford":"outside the area"}</span>`);}},
 {id:"pipe",t:"Signer pipeline",d:"same statuses as People & orgs · tap to open that list",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);
   cvHbars(el,STATUSES.map(k=>({k:CV_SLABEL[k]||k,v:sg.filter(s=>cvStatusOf(s)===k).length,s:k})),"var(--t-plum)",r=>{S.cv.sStatus=r.s;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers</span>`);}},
 {id:"reach",t:"Contact coverage",d:"can we reach them again?",when:()=>cvSg().length>0,r:(el,L)=>{const sg=cvSg().filter(cvChartFilter);const rows=[{k:"Phone only",v:sg.filter(s=>s.phone&&!s.email).length,f:"phone"},{k:"Email only",v:sg.filter(s=>s.email&&!s.phone).length,f:"email"},{k:"Both",v:sg.filter(s=>s.phone&&s.email).length,f:"phone"},{k:"Neither",v:sg.filter(s=>!s.phone&&!s.email).length,f:"nocontact"},{k:"Needs a check",v:sg.filter(cvReview).length,f:"review"}];
   cvHbars(el,rows,"var(--t-teal)",r=>{S.cv.sf=r.f;cvGo("signers");},r=>`<b>${esc(r.k)}</b><span>${r.v} signers · ${sg.length?Math.round(r.v/sg.length*100):0}%</span>`);}},
 {id:"orgs",t:"Campaigns vs goal",d:"logged signatures per campaign",when:()=>S.cv.org==="all",r:(el,L)=>{const rows=cvOrgs().filter(o=>o.active!==false).map(o=>({k:o.name,v:cvSum(S.shifts.filter(s=>cvOrgOf(s)===o.id&&cvInCenter(s)&&cvChartFilter(s))),g:cvGoal(o),color:o.color,id:o.id}));
   cvHbars(el,rows,"var(--blue)",r=>{S.cv.org=r.id;cvSave();render();},r=>`<b>${esc(r.k)}</b><span>${r.v} of ${r.g} goal (${r.g?Math.round(r.v/r.g*100):0}%)</span>`,true);}},
 {id:"centers",t:"Centers",d:"logged signatures per center",when:()=>S.cv.center==="all"&&cvCenters().filter(c=>c.active!==false).length>1,r:(el,L)=>{const rows=cvCenters().filter(c=>c.active!==false).map(c=>({k:c.name,v:cvSum(S.shifts.filter(s=>cvCenterOf(s)===c.id&&cvInOrg(s)&&cvChartFilter(s))),id:c.id}));
   cvHbars(el,rows,"var(--violet)",r=>{S.cv.center=r.id;cvSave();render();},r=>`<b>${esc(r.k)}</b><span>${r.v} signatures</span>`);}},
];
function cvAvail(){return CV_CHARTS.filter(c=>c.when());}
function cvStep(n){const a=cvAvail();S.cv.chart=(S.cv.chart+n+a.length)%a.length;cvSave();cvRenderStage();}
function cvStage(){const a=cvAvail();if(S.cv.chart>=a.length)S.cv.chart=0;const ch=a[S.cv.chart];
  const sh=cvShifts(),sg=cvSg();const ms=[...new Set([...sh.map(s=>s.date),...sg.map(s=>s.date)].map(d=>(d||"").slice(0,7)).filter(Boolean))].sort();
  return `<div class="cv-stage"><div class="head"><div class="chips">${a.map((c,i)=>`<button class="chip" data-act="cv-chip" data-i="${i}" aria-pressed="${i===S.cv.chart}">${c.t}</button>`).join("")}</div><div class="nav"><button class="btn sm" data-act="cv-prev" aria-label="Previous chart">‹</button><button class="btn sm" data-act="cv-next" aria-label="Next chart">›</button></div></div>
  <div class="ttl"><b id="cvChTitle">${esc(ch.t)}</b><span id="cvChDesc">${esc(ch.d)}</span></div>
  <div class="filters"><span class="small muted">Show</span><select data-act="cv-fc"><option value="">All canvassers</option>${cvTeam().map(c=>`<option value="${c.id}" ${S.cv.fc===c.id?"selected":""}>${esc(c.name)}</option>`).join("")}</select><select data-act="cv-fm"><option value="">All months</option>${ms.map(m=>`<option value="${m}" ${S.cv.fm===m?"selected":""}>${CV_MON[+m.slice(5)-1]} ${m.slice(0,4)}</option>`).join("")}</select>${(S.cv.fc||S.cv.fm)?`<button class="btn sm ghost" data-act="cv-fclear">Clear</button>`:""}</div>
  <div class="body" id="cvChBody"></div><div class="legend" id="cvChLegend"></div></div>`;}
function cvRenderStage(){const a=cvAvail();if(S.cv.chart>=a.length)S.cv.chart=0;const ch=a[S.cv.chart];const body=$("#cvChBody");if(!body)return;
  document.querySelectorAll("[data-act='cv-chip']").forEach(b=>b.setAttribute("aria-pressed",String(+b.dataset.i===S.cv.chart)));const on=document.querySelector("[data-act='cv-chip'][aria-pressed='true']");if(on)on.scrollIntoView({inline:"nearest",block:"nearest"});
  $("#cvChTitle").textContent=ch.t;$("#cvChDesc").textContent=ch.d;const lg=$("#cvChLegend");lg.innerHTML="";
  ch.r(body,series=>{lg.innerHTML=series.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join("");});}
function cvHbars(el,rows,color,onClick,tipFn,perColor){
  if(!rows.length){el.innerHTML='<p class="empty">Nothing to show for this view.</p>';return;}
  const nar=innerWidth<640;const W=nar?440:760,rh=nar?24:28,L=nar?118:170,R=nar?40:50,H=Math.max(rows.length*rh+8,120);const max=Math.max(...rows.map(r=>r.v),1);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img">`;
  rows.forEach((r,i)=>{const y=i*rh+4,w=Math.max(2,(W-L-R)*r.v/max);
    s+=`<g class="cv-bar" data-i="${i}"><rect x="0" y="${y}" width="${W}" height="${rh-2}" fill="transparent"/><text x="${L-8}" y="${y+(nar?16:17)}" text-anchor="end" class="cv-lin">${esc(r.k.length>(nar?16:26)?r.k.slice(0,nar?15:25)+"…":r.k)}</text><rect x="${L}" y="${y+6}" width="${w}" height="${rh-12}" rx="4" fill="${perColor&&r.color?r.color:color}"/>${r.g?`<line x1="${L+(W-L-R)*Math.min(r.g,max)/max}" x2="${L+(W-L-R)*Math.min(r.g,max)/max}" y1="${y+2}" y2="${y+rh-4}" stroke="var(--ink)" stroke-dasharray="3 3"/>`:""}<text x="${L+w+8}" y="${y+17}" class="cv-lval">${r.v}</text></g>`;});
  el.innerHTML=s+"</svg>";
  el.querySelectorAll(".cv-bar").forEach(g=>{const r=rows[+g.dataset.i];g.addEventListener("mousemove",e=>cvShowTip(e,tipFn(r)));g.addEventListener("mouseleave",cvHideTip);g.addEventListener("click",()=>{cvHideTip();onClick&&onClick(r);});});}
function cvTicks(max){const raw=Math.max(max,1)/4,p=Math.pow(10,Math.floor(Math.log10(raw))),n=[1,2,2.5,5,10].find(x=>x*p>=raw)*p;const t=[];for(let v=0;v<=max+n-1e-9;v+=n)t.push(Math.round(v*100)/100);return t;}
function cvVbars(el,labels,series,tipFn){
  if(!labels.length){el.innerHTML='<p class="empty">Nothing to show for this view.</p>';return;}
  const W=760,H=280,L=40,B=30,T=12,R=10,n=labels.length,gw=(W-L-R)/n,max=Math.max(1,...series.flatMap(s=>s.vals)),ticks=cvTicks(max),top=ticks[ticks.length-1];
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img"><g class="cv-axis">`;ticks.forEach(t=>{const y=T+(H-T-B)*(1-t/top);s+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}"/><text x="${L-6}" y="${y+4}" text-anchor="end">${t}</text>`;});s+="</g>";
  const bw=Math.max(3,(gw-6)/series.length-2);
  labels.forEach((lab,i)=>{s+=`<g class="cv-bar" data-i="${i}"><rect x="${L+i*gw}" y="${T}" width="${gw}" height="${H-T-B}" fill="transparent"/>`;
    series.forEach((se,j)=>{const v=se.vals[i],h=(H-T-B)*v/top,x=L+i*gw+3+j*(bw+2),y=H-B-h;s+=`<rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="3" fill="${se.color}" data-j="${j}"/>`;if(v>0&&bw>18)s+=`<text x="${x+bw/2}" y="${y-4}" text-anchor="middle" class="cv-lval">${v}</text>`;});
    if(n<=12||i%2===0)s+=`<text x="${L+i*gw+gw/2}" y="${H-9}" text-anchor="middle" class="cv-lin" style="font-size:10px">${esc(lab)}</text>`;s+="</g>";});
  el.innerHTML=s+"</svg>";
  el.querySelectorAll(".cv-bar").forEach(g=>{const i=+g.dataset.i;g.addEventListener("mousemove",e=>{const j=e.target.dataset.j!=null?+e.target.dataset.j:0;cvShowTip(e,tipFn(i,j));});g.addEventListener("mouseleave",cvHideTip);});}
function cvWeek(el,fs){const dated=fs.filter(s=>s.date);if(!dated.length){el.innerHTML='<p class="empty">No dated shifts.</p>';return;}
  const m={};dated.forEach(s=>{const w=weekKey(s.date);m[w]=m[w]||{v:0,n:0};m[w].v+=(+s.sigs||0);m[w].n++;});const ws=Object.keys(m).sort();
  const rows=[];for(let d=ws[0];d<=ws[ws.length-1];d=addDays(d,7)){rows.push({k:d,v:m[d]?m[d].v:0,n:m[d]?m[d].n:0});}
  cvVbars(el,rows.map(r=>cvD(r.k)),[{name:"Signatures",color:"var(--violet)",vals:rows.map(r=>r.v)}],i=>`<b>Week of ${cvDl(rows[i].k)}</b><span>${rows[i].v} signatures · ${rows[i].n} shifts</span>`);}
function cvCum(el,fs){const goal=cvGoalNow();const dated=fs.filter(s=>s.date&&(+s.sigs||0)>0).sort((a,b)=>a.date<b.date?-1:1);const undated=cvSum(fs.filter(s=>!s.date));
  if(!dated.length){el.innerHTML='<p class="empty">No dated shifts.</p>';return;}
  const byDay={};dated.forEach(s=>{byDay[s.date]=(byDay[s.date]||0)+(+s.sigs);});const days=Object.keys(byDay).sort();let run=undated;const pts=days.map(d=>{run+=byDay[d];return {d,v:run,day:byDay[d]};});
  const W=760,H=280,L=44,R=14,T=14,B=28;const t0=parseISO(days[0]).getTime(),t1=parseISO(days[days.length-1]).getTime(),span=Math.max(t1-t0,864e5);
  const maxV=Math.max(run,goal),ticks=cvTicks(maxV),top=ticks[ticks.length-1];const X=d=>L+(W-L-R)*(parseISO(d).getTime()-t0)/span,Y=v=>T+(H-T-B)*(1-v/top);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img"><g class="cv-axis">`;ticks.forEach(t=>{s+=`<line x1="${L}" x2="${W-R}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${L-6}" y="${Y(t)+4}" text-anchor="end">${t}</text>`;});s+="</g>";
  if(goal){const gy=Y(goal);s+=`<line x1="${L}" x2="${W-R}" y1="${gy}" y2="${gy}" stroke="var(--green)" stroke-dasharray="4 4" stroke-width="1.5"/><text x="${W-R}" y="${gy-5}" text-anchor="end" fill="var(--green)" font-size="11" font-family="var(--body)">Goal ${goal}</text>`;}
  const path=pts.map((p,i)=>(i?"L":"M")+X(p.d).toFixed(1)+" "+Y(p.v).toFixed(1)).join(" ");
  s+=`<path d="${path} L${X(pts[pts.length-1].d).toFixed(1)} ${Y(0)} L${X(pts[0].d).toFixed(1)} ${Y(0)} Z" fill="var(--blue)" opacity=".12"/><path d="${path}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round"/>`;
  [...new Set(days.map(d=>d.slice(0,7)))].forEach(m=>{const x=Math.max(L,X(m+"-01"));s+=`<text x="${x+3}" y="${H-8}" class="cv-lin" style="font-size:10px">${CV_MON[+m.slice(5)-1]}</text>`;});
  const lp=pts[pts.length-1];s+=`<circle cx="${X(lp.d)}" cy="${Y(lp.v)}" r="4" fill="var(--blue)" stroke="var(--surface)" stroke-width="2"/><text x="${X(lp.d)-8}" y="${Y(lp.v)-9}" text-anchor="end" class="cv-lval">${lp.v}</text>`;
  s+=`<line id="cvxh" x1="0" x2="0" y1="${T}" y2="${H-B}" stroke="var(--muted)" opacity="0"/><circle id="cvxhd" r="4" fill="var(--blue)" stroke="var(--surface)" stroke-width="2" opacity="0"/><rect id="cvhit" x="${L}" y="${T}" width="${W-L-R}" height="${H-T-B}" fill="transparent"/></svg>`;
  el.innerHTML=s;const svg=el.querySelector("svg"),hit=el.querySelector("#cvhit"),xh=el.querySelector("#cvxh"),xhd=el.querySelector("#cvxhd");
  hit.addEventListener("mousemove",e=>{const r=svg.getBoundingClientRect();const mx=(e.clientX-r.left)/r.width*W;let bi=0,bd=1e9;pts.forEach((p,i)=>{const d=Math.abs(X(p.d)-mx);if(d<bd){bd=d;bi=i;}});const p=pts[bi];
    xh.setAttribute("x1",X(p.d));xh.setAttribute("x2",X(p.d));xh.setAttribute("opacity",".6");xhd.setAttribute("cx",X(p.d));xhd.setAttribute("cy",Y(p.v));xhd.setAttribute("opacity","1");
    cvShowTip(e,`<b>${cvDl(p.d)}</b><span>+${p.day} that day</span><span>${p.v} running total${goal?" · "+Math.round(p.v/goal*100)+"% of goal":""}</span>`);});
  hit.addEventListener("mouseleave",()=>{xh.setAttribute("opacity","0");xhd.setAttribute("opacity","0");cvHideTip();});
  if(undated)el.insertAdjacentHTML("beforeend",`<p class="muted small" style="margin:6px 0 0">Starts at ${undated}: signatures from shifts with no date.</p>`);}

/* ---------- popups ---------- */
function cvGoalSheet(){const sh=cvShifts(),total=cvSum(sh),goal=cvGoalNow();const byM={};sh.forEach(s=>{if(s.date)byM[s.date.slice(0,7)]=(byM[s.date.slice(0,7)]||0)+(+s.sigs||0);});const o=S.cv.org==="all"?null:cvOrg(S.cv.org);
  openSheet(`${total} signatures logged`,`<p class="small muted">${goal?(goal-total>0?(goal-total)+" to go · goal "+goal+(o&&cvGoalDate(o)?" by "+fmtDate(cvGoalDate(o),true):""):"Goal of "+goal+" passed by "+(total-goal)):"No goal set yet."}${o&&o.primary?" The goal is the same one on the Today page and in Settings.":""}</p>
  ${S.cv.org==="all"?cvOrgs().filter(x=>x.active!==false).map(x=>`<div class="cv-orgrow"><i class="dot" style="background:${x.color}"></i><b>${esc(x.name)}</b><span class="num muted small">${cvSum(S.shifts.filter(s=>cvOrgOf(s)===x.id&&cvInCenter(s)))} / ${cvGoal(x)}</span></div>`).join(""):""}
  <div class="rows" style="margin-top:8px">${Object.keys(byM).sort().map(m=>`<div class="row static"><div class="n">${CV_MON[+m.slice(5)-1]} ${m.slice(0,4)}</div><div class="r num">${byM[m]}</div></div>`).join("")}<div class="row static"><div class="n">No date</div><div class="r num">${cvSum(sh.filter(s=>!s.date))}</div></div></div>`,
  {btns:`${o?`<button class="btn" data-act="cv-goal-edit">Edit goal</button>`:""}<button class="btn ghost" data-close="1">Close</button>`});
  const b=$("#overlay [data-act='cv-goal-edit']");if(b)b.addEventListener("click",()=>cvOrgForm(S.cv.org));}
function cvPaperSheet(){const sh=cvShifts(),sg=cvSg();const days=[...new Set([...sh.map(s=>s.date),...sg.map(s=>s.date)].filter(Boolean))].sort();
  const rows=days.map(d=>({d,l:cvSum(sh.filter(s=>s.date===d)),p:sg.filter(s=>s.date===d).length})).filter(r=>r.l||r.p);const und={l:cvSum(sh.filter(s=>!s.date)),p:sg.filter(s=>!s.date).length};
  const diff=(p,l)=>`<b style="color:${p-l>0?"var(--green)":p-l<0?"var(--orange)":"inherit"}">${p-l>0?"+":""}${p-l}</b>`;
  openSheet("On paper vs logged",`<p class="small muted">Rows transcribed from the signature sheets vs the count in the shift log, by day. Positive means more on paper than logged.</p><div class="rows">
  <div class="row static"><div class="d">Day</div><div class="r">paper · logged · diff</div></div>${rows.map(r=>`<div class="row static"><div class="n">${cvDl(r.d)}</div><div class="r num">${r.p} · ${r.l} · ${diff(r.p,r.l)}</div></div>`).join("")}
  ${und.l||und.p?`<div class="row static"><div class="n">No date</div><div class="r num">${und.p} · ${und.l} · ${diff(und.p,und.l)}</div></div>`:""}<div class="row static"><div class="n"><b>Total</b></div><div class="r num"><b>${sg.length} · ${cvSum(sh)} · ${diff(sg.length,cvSum(sh))}</b></div></div></div>`);}
function cvRankSheet(){const l=cvShifts().filter(s=>cvNum(s)!==null).sort((a,b)=>b.sigs-a.sigs);
  openSheet("Shifts ranked",`<p class="small muted">${l.length} shifts with a count</p><div class="cv-list">${l.map(s=>`<div class="s"><div class="dt">${cvD(s.date)}</div><div>${esc(cvShiftWho(s))} · ${esc(s.where||"")}</div><div class="sg num">${s.sigs}</div></div>`).join("")}</div>`);}
function cvListSheet(k){const list=cvShifts().filter(s=>k==="pend"?((+s.sigs||0)>0&&!s.uploaded):cvNum(s)===null);
  openSheet(k==="pend"?"Awaiting upload":"No count yet",`<p class="small muted">${list.length} shifts</p><div class="cv-list">${list.map(s=>`<div class="s"><div class="dt">${cvD(s.date)}</div><div>${esc(cvShiftWho(s))} · ${esc(s.where||"")}</div><div class="sg num">${s.sigs??"—"}</div></div>`).join("")||'<p class="empty">All clear.</p>'}</div>`,{btns:`<button class="btn" data-act="cv-go-shifts">Open the shift log</button><button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay [data-act='cv-go-shifts']").addEventListener("click",()=>{closeOverlay();cvGo("shifts");});}
function cvSrcSheet(){openSheet("Source sheets",`<p class="small muted">Scanned petition PDFs transcribed into this database. Scan each sheet once, into the bulk file.</p><div class="rows">${Object.entries(CV.sheets||{}).map(([k,v])=>`<div class="row static"><div><div class="n">Set ${k}</div><div class="d">${esc(v)}</div></div><div class="r num">${CV.signers.filter(s=>(s.sheet||"")[0]===k).length} rows</div></div>`).join("")}</div>`);}
function cvReport(){const t0=todayISO(),sh=cvShifts(),sg=cvSg(),goal=cvGoalNow(),total=cvSum(sh),o=S.cv.org==="all"?null:cvOrg(S.cv.org),c=S.cv.center==="all"?null:cvCenter(S.cv.center);
  const wk=weekKey(t0);const thisWk=sh.filter(s=>s.date&&weekKey(s.date)===wk);const per={};sh.forEach(s=>{const k=cvShiftWho(s);per[k]=(per[k]||0)+(+s.sigs||0);});
  const nosig=sh.filter(s=>cvNum(s)===null).length,pend=sh.filter(s=>(+s.sigs||0)>0&&!s.uploaded).length;
  return `${o?o.name:"Signature campaigns"} · ${c?c.name:"all centers"} · update ${fmtLong(t0)}\n\nSignatures logged: ${total}${goal?` of ${goal} (${Math.round(total/goal*100)}%)`:""}\nSigners on file (sheets scanned and entered): ${sg.length}\nThis week: ${cvSum(thisWk)} signatures across ${thisWk.length} shift${thisWk.length===1?"":"s"}\n\nBy canvasser: ${Object.entries(per).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(", ")||"—"}\nWhere signers live: ${sg.filter(s=>cvGeo(s)==="Hartford").length} Hartford, ${sg.filter(s=>cvGeo(s)==="Greater Hartford").length} Greater Hartford, ${sg.filter(s=>cvGeo(s)==="Outside the area").length} outside the area, ${sg.filter(s=>cvGeo(s)==="Unknown").length} unknown\nReachable again: ${sg.filter(s=>s.phone||s.email).length} with a phone or email\n${nosig||pend?`\nStill open: ${[nosig?nosig+" shift"+(nosig===1?"":"s")+" with no count":"",pend?pend+" shift"+(pend===1?"":"s")+" awaiting upload":""].filter(Boolean).join(", ")}\n`:""}\nNext: `;}
function cvCSV(){const {l}=cvSignerList();const cols=["name","address","town","town_guess","town_basis","area","phone","email","status","tags","follow","notes","date","collector","location","campaign","center","sheet","row","signed","confidence","verified","reader_note"];
  const row=s=>[s.name,s.address,s.town,s.townGuess||"",s.townBasis||"",cvGeo(s),s.phone,s.email,cvStatusOf(s),(s.tags||[]).join("; "),s.follow,s.crm,s.date,cvCName(s.c),s.location,(cvOrg(cvOrgOf(s))||{}).name||"",(cvCenter(cvCenterOf(s))||{}).name||"",s.sheet,s.row,s.signed?"yes":"no",s.conf,s.verified?"yes":"no",s.note].map(csvCell).join(",");
  copyOrDl(cols.join(",")+"\n"+l.map(row).join("\n"),`signers-${todayISO()}.csv`,`${l.length} signers copied as CSV`);}

/* ---------- signers ---------- */
function cvSignerList(){const sg=cvSg();const dups=cvDups(sg);const q=(S.cv.q||"").trim().toLowerCase();const f=S.cv;
  let l=sg.filter(s=>(!f.sc||(s.c||"")===f.sc)&&(!f.sl||s.location===f.sl)&&(!f.st||cvTown(s)===f.st)&&(!f.sd||s.date===f.sd)&&(!f.sg||cvGeo(s)===f.sg)&&(!f.sStatus||cvStatusOf(s)===f.sStatus)
    &&(!q||[s.name,s.address,s.phone,s.email,s.town,s.crm,s.note,(s.tags||[]).join(" ")].join(" ").toLowerCase().includes(q))
    &&(!f.sf||(f.sf==="review"?cvReview(s):f.sf==="dup"?!!dups[s.id]:f.sf==="nocontact"?(!s.phone&&!s.email):f.sf==="phone"?!!s.phone:f.sf==="email"?!!s.email:f.sf==="follow"?!!s.follow:f.sf==="guess"?(!s.town&&!!s.townGuess):f.sf==="multi"?((s.townCands||[]).length>1&&!s.town):f.sf==="notown"?!cvTown(s):true)));
  const so={date:(a,b)=>(b.date||"")<(a.date||"")?-1:(b.date||"")>(a.date||"")?1:String(a.id).localeCompare(String(b.id),undefined,{numeric:true}),name:(a,b)=>(a.name||"~").localeCompare(b.name||"~"),town:(a,b)=>(cvTown(a)||"~").localeCompare(cvTown(b)||"~")||(a.name||"").localeCompare(b.name||""),status:(a,b)=>STATUSES.indexOf(cvStatusOf(a))-STATUSES.indexOf(cvStatusOf(b))};
  return {l:l.sort(so[f.ss]||so.date),dups};}
function cvSignersView(){const sg=cvSg();const f=S.cv;
  const opt=(k,vals,cur,lab)=>`<select data-act="cv-f" data-k="${k}"><option value="">${lab}</option>${vals.map(v=>`<option value="${esc(v[0])}" ${String(v[0])===String(cur)?"selected":""}>${esc(v[1])}</option>`).join("")}</select>`;
  const {l,dups}=cvSignerList();
  let h=`<div class="cv-tools"><input type="search" id="cvq" data-act="cv-q" placeholder="Search name, address, phone, email…" value="${esc(f.q)}" aria-label="Search signers">
    ${opt("sc",[...new Set(sg.map(s=>s.c||""))].map(c=>[c,c?cvCName(c)||c:"Collector not written"]),f.sc,"Any collector")}
    ${opt("sl",[...new Set(sg.map(s=>s.location).filter(Boolean))].sort().map(v=>[v,v]),f.sl,"Any location")}
    ${opt("st",[...new Set(sg.map(cvTown).filter(Boolean))].sort().map(v=>[v,v]),f.st,"Any town")}
    ${opt("sd",[...new Set(sg.map(s=>s.date).filter(Boolean))].sort().reverse().map(v=>[v,cvDl(v)]),f.sd,"Any date")}
    ${opt("sg",CV_GEOS.map(g=>[g,g]),f.sg,"Anywhere")}
    ${opt("sf",[["review","Needs a check"],["dup","Possible duplicates"],["nocontact","No phone or email"],["phone","Has phone"],["email","Has email"],["follow","Follow-up set"],["guess","Town is a guess"],["multi","Town has several matches"],["notown","No town at all"]],f.sf,"All records")}
    ${opt("ss",[["date","Newest first"],["name","Name A–Z"],["town","Town"],["status","Status"]],f.ss,"Sort")}
    ${(f.sc||f.sl||f.st||f.sd||f.sg||f.sf||f.q||f.sStatus)?`<button class="btn sm ghost" data-act="cv-clear">Clear</button>`:""}
    <button class="btn sm pri" data-act="cv-add-signer">+ Signer</button></div>
  <div class="chips" style="margin-bottom:10px"><button class="chip" data-act="cv-status" data-s="" aria-pressed="${!f.sStatus}">All ${sg.length}</button>${STATUSES.map(k=>`<button class="chip" data-act="cv-status" data-s="${k}" aria-pressed="${f.sStatus===k}"><span class="dot" style="background:var(--${k.toLowerCase()==="prospect"?"notyet":k.toLowerCase()==="contacted"?"talked":k.toLowerCase()==="supporter"?"supports":k.toLowerCase()==="champion"?"champion":"declined"})"></span>${CV_SLABEL[k]||k} ${sg.filter(s=>cvStatusOf(s)===k).length}</button>`).join("")}</div>
  <div class="tablewrap"><table class="cv-table"><thead><tr><th>Name</th><th>Address</th><th>Contact</th><th>Collected</th><th>Status</th><th></th></tr></thead><tbody>
  ${l.slice(0,400).map(s=>`<tr class="cl ${S.cv.sel===s.id?"sel":""}" data-act="cv-open" data-id="${s.id}">
    <td><span class="n">${esc(s.name)||'<span class="muted">(no name)</span>'}</span>${(s.tags||[]).length?`<span class="sub">${esc(s.tags.join(", "))}</span>`:""}</td>
    <td>${esc(s.address)||'<span class="muted">—</span>'}<span class="sub">${s.town?esc(s.town)+" · ":s.townGuess?"<i>"+esc(s.townGuess)+"?</i> · ":""}<i class="cv-geo" style="background:${CV_GEOC[cvGeo(s)]}"></i>${cvGeo(s)}</span></td>
    <td>${s.phone?esc(s.phone):""}${s.phone&&s.email?"<br>":""}${s.email?`<span class="small">${esc(s.email)}</span>`:""}${!s.phone&&!s.email?'<span class="muted">—</span>':""}</td>
    <td>${cvD(s.date)} · ${esc(cvCName(s.c)||"—")}<span class="sub">${esc(s.location||"")}${S.cv.center==="all"?" · "+esc((cvCenter(cvCenterOf(s))||{}).short||""):""}</span></td>
    <td>${cvPill(cvStatusOf(s))}${s.follow?`<span class="sub">follow-up ${cvD(s.follow)}</span>`:""}</td>
    <td>${cvReview(s)?'<span class="flag" title="Unclear handwriting: check against the sheet">⚠ check</span> ':""}${dups[s.id]?'<span class="flag" title="Another record has the same name or phone">⧉ dup</span>':""}</td></tr>`).join("")||`<tr><td colspan="6" class="empty">No signers match.</td></tr>`}
  </tbody></table></div><p class="muted small" style="margin-top:8px">${l.length} of ${sg.length} signers${l.length>400?" · showing the first 400, narrow the filters to see the rest":""}</p>`;
  return h;}
function cvDrawer(id,keep){const s=cvSigner(id);if(!s)return;S.cv.sel=id;document.querySelectorAll(".cv-table tr.cl").forEach(t=>t.classList.toggle("sel",t.dataset.id===id));
  const {l,dups}=cvSignerList();const idx=l.findIndex(x=>x.id===id);const dl=[...(dups[id]||[])].map(i=>cvSigner(i)).filter(Boolean);const ag=cvAutoGeo(s);const st=cvStatusOf(s);
  const o=$("#overlay");const top=keep&&o.querySelector(".drawer")?o.querySelector(".drawer").scrollTop:0;
  o.innerHTML=`<div class="scrim"></div><div class="drawer cv-dr" id="cvDrawer"><div class="top"><div><h2>${esc(s.name)||"(no name)"}</h2><div class="muted small">${cvDl(s.date)} · ${esc(cvCName(s.c)||"collector not written")} · ${esc(s.location||"—")} · ${esc((cvCenter(cvCenterOf(s))||{}).name||"")}</div></div><button class="x" data-act="cv-close" aria-label="Close">×</button></div>
  <div class="stpick" id="cvSt">${STATUSES.map(k=>`<button data-s="${k}" aria-pressed="${st===k}" class="${st===k?"on":""}"><span class="pill st-${k}"><i></i>${CV_SLABEL[k]||k}</span></button>`).join("")}</div>
  <label for="cvN">Name</label><input id="cvN" value="${esc(s.name)}">
  <label for="cvA">Address</label><input id="cvA" value="${esc(s.address)}">
  <div class="two"><div><label for="cvT">Town</label><input id="cvT" value="${esc(s.town)}" list="cvTowns" placeholder="${esc(s.townGuess||"")}">${!s.town&&s.townGuess?`<div class="guess"><b>Likely ${esc(s.townGuess)}</b>: ${esc(s.townBasis)}<div class="cv-seg" style="margin-top:6px"><button class="btn sm" data-town="${esc(s.townGuess)}">Use ${esc(s.townGuess)}</button>${(s.townCands||[]).filter(c=>c!==s.townGuess).map(c=>`<button class="btn sm" data-town="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>`:(s.townBasis&&s.townBasis!=="town written")?`<div class="guess">${esc(s.townBasis)}</div>`:""}</div><div><label for="cvP">Phone</label><input id="cvP" value="${esc(s.phone)}"></div></div>
  <datalist id="cvTowns">${[...new Set(cvSigners().map(x=>x.town).filter(Boolean))].map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
  <label for="cvE">Email</label><input id="cvE" value="${esc(s.email)}">
  <label for="cvGeo">Area <span style="text-transform:none;letter-spacing:0;font-weight:500">· auto: ${ag[0]} (${esc(ag[1])})</span></label><select id="cvGeo"><option value="">Auto (${ag[0]})</option>${CV_GEOS.map(g=>`<option ${s.geoLock&&s.geo===g?"selected":""}>${g}</option>`).join("")}</select>
  <div class="two"><div><label for="cvF">Follow-up date</label><input type="date" id="cvF" value="${esc(s.follow)}"></div><div><label for="cvG">Tags (comma separated)</label><input id="cvG" value="${esc((s.tags||[]).join(", "))}" placeholder="parent, volunteer…"></div></div>
  <label for="cvC">Notes</label><textarea id="cvC" placeholder="What did they say? Who are they? Next step…">${esc(s.crm)}</textarea>
  <div class="two"><div><label for="cvO">Campaign</label><select id="cvO">${cvOrgs().map(x=>`<option value="${x.id}" ${x.id===cvOrgOf(s)?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div><div><label for="cvCe">Center</label><select id="cvCe">${cvCenters().map(c=>`<option value="${c.id}" ${c.id===cvCenterOf(s)?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div></div>
  <div class="two"><div><label for="cvCv">Collected by</label><select id="cvCv"><option value="">Not written</option>${S.team.map(c=>`<option value="${c.id}" ${c.id===s.c?"selected":""}>${esc(c.name)}</option>`).join("")}</select></div><div><label for="cvD">Date</label><input type="date" id="cvD" value="${esc(s.date)}"></div></div>
  <label for="cvL">Location collected</label><input id="cvL" value="${esc(s.location)}" list="cvLocs"><datalist id="cvLocs">${[...new Set(cvSigners().map(x=>x.location).filter(Boolean))].map(t=>`<option value="${esc(t)}">`).join("")}</datalist>
  <div class="src"><div><span>Source</span><span>${s.sheet?`sheet ${esc(s.sheet)}, row ${s.row}`:"added by hand"}</span></div><div><span>Signed</span><span>${s.signed?"yes":"no mark"}</span></div><div><span>Transcription</span><span>${esc(s.conf||"—")} confidence${s.verified?" · checked":""}</span></div>${s.note?`<div><span>Reader note</span><span>${esc(s.note)}</span></div>`:""}
    ${dl.length?`<div><span>Possible duplicate of</span><span>${dl.map(d=>`<a href="#" data-go-signer="${d.id}">${esc(d.name)||d.id} (${cvD(d.date)})</a>`).join(", ")}</span></div>`:""}
    <label style="display:flex;align-items:center;gap:7px;margin:8px 0 0;text-transform:none;letter-spacing:0;font-weight:500;font-size:13px;color:var(--ink)"><input type="checkbox" id="cvV" ${s.verified?"checked":""} style="width:auto;accent-color:var(--green)">Checked against the sheet: name and contact are right</label></div>
  <div class="acts"><button class="btn sm danger" data-act="cv-del">Delete</button>${["Supporter","Champion"].includes(st)?`<button class="btn sm" data-act="cv-promote" title="Create a People & orgs record from this signer">Add to People &amp; orgs</button>`:""}<span class="sp"></span><button class="btn sm" data-act="cv-prev" ${idx<=0?"disabled":""}>‹ Prev</button><button class="btn sm" data-act="cv-next" ${idx<0||idx>=l.length-1?"disabled":""}>Next ›</button><button class="btn pri" data-act="cv-save" ${S.canWrite===false?"disabled":""}>Save</button></div></div>`;
  const d=$("#cvDrawer");if(top)d.scrollTop=top;
  o.querySelector(".scrim").addEventListener("click",cvCloseDrawer);$("#overlay [data-act='cv-close']").addEventListener("click",cvCloseDrawer);
  o.querySelectorAll("#cvSt button").forEach(b=>b.addEventListener("click",()=>{o.querySelectorAll("#cvSt button").forEach(x=>{x.classList.remove("on");x.setAttribute("aria-pressed","false");});b.classList.add("on");b.setAttribute("aria-pressed","true");}));
  o.querySelectorAll("[data-go-signer]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();cvDrawer(a.dataset.goSigner);}));
  const collect=()=>{const p={name:$("#cvN").value.trim(),address:$("#cvA").value.trim(),town:$("#cvT").value.trim(),phone:$("#cvP").value.trim(),email:$("#cvE").value.trim(),follow:$("#cvF").value,tags:$("#cvG").value.split(",").map(x=>x.trim()).filter(Boolean),crm:$("#cvC").value.trim(),org:$("#cvO").value,center:$("#cvCe").value,c:$("#cvCv").value,date:$("#cvD").value,location:$("#cvL").value.trim(),verified:$("#cvV").checked,geoLock:!!$("#cvGeo").value,geo:$("#cvGeo").value||"",status:(o.querySelector("#cvSt button.on")||{}).dataset?.s||"Prospect"};if(p.town&&s.townBasis&&!/written|confirmed/.test(s.townBasis))p.townBasis="confirmed: "+s.townBasis;return p;};
  o.querySelectorAll("[data-town]").forEach(b=>b.addEventListener("click",async()=>{$("#cvT").value=b.dataset.town;await cvSetSigner(id,collect());cvDrawer(id,true);}));
  $("#overlay [data-act='cv-save']").addEventListener("click",async()=>{if(await cvSetSigner(id,collect())){toast("Saved");cvDrawer(id,true);}});
  $("#overlay [data-act='cv-prev']").addEventListener("click",async()=>{await cvSetSigner(id,collect());cvDrawer(l[idx-1].id);});
  $("#overlay [data-act='cv-next']").addEventListener("click",async()=>{await cvSetSigner(id,collect());cvDrawer(l[idx+1].id);});
  $("#overlay [data-act='cv-del']").addEventListener("click",async()=>{if(!confirm(`Delete ${s.name||"this record"}?`))return;if(CV.signers.find(x=>x.id===id))await write("signers",id,{deleted:true});else await remove("signers",id);cvCloseDrawer();toast("Deleted");});
  const pr=$("#overlay [data-act='cv-promote']");if(pr)pr.addEventListener("click",()=>cvPromote(s));}
function cvCloseDrawer(){closeOverlay();S.cv.sel=null;document.querySelectorAll(".cv-table tr.sel").forEach(t=>t.classList.remove("sel"));}
async function cvPromote(s){const id="sg_"+s.id;if(S.added[id]){openDetail(id);return;}const town=cvTown(s)||"Hartford";const towns=Object.keys(REF.CENTROIDS);
  const ok=await write("added",id,{kind:"target",name:s.name,type:"Community Leader",subtype:"Petition signer",lane:"B-LEAD",priority:"Medium",contact_name:"",role:"",phone:s.phone,email:s.email,town:towns.includes(town)?town:"Hartford",address:s.address,website:"",why:`Signed the ${(cvOrg(cvOrgOf(s))||{}).name||"petition"} signature of support on ${cvDl(s.date)}${s.location?" at "+s.location:""}; marked ${cvStatusOf(s)} in Canvass.`,community:["General"],createdAt:todayISO()});
  if(ok){await write("edits",id,{status:cvStatusOf(s)==="Champion"?"Champion":"Supporter",notes:s.crm||""});toast("Added to People & orgs");openDetail(id);}}
function cvNewSigner(){const id=uid("sg");const s=cvNorm({id,org:S.cv.org==="all"?cvPrimary():S.cv.org,center:S.cv.center==="all"?cvHome():S.cv.center,c:cvTeam()[0]?cvTeam()[0].id:"",date:todayISO(),sheet:"",row:null,conf:"high",verified:true});
  const {id:_i,...rest}=s;write("signers",id,rest).then(ok=>{if(ok){toast("Signer added");cvDrawer(id);}});}

/* ---------- shifts ---------- */
function cvShiftsView(){const sh=cvShifts().slice().sort((a,b)=>{const x=a.date||"9999",y=b.date||"9999";return x<y?-1:x>y?1:String(a.id).localeCompare(String(b.id),undefined,{numeric:true});});const sg=cvSg();const seen={};
  const opts=(list,cur,blank)=>`${blank?`<option value="">${blank}</option>`:""}${list.map(([v,l])=>`<option value="${esc(v)}" ${String(v)===String(cur)?"selected":""}>${esc(l)}</option>`).join("")}`;
  return `<section class="sec" style="margin-top:12px"><div class="h"><h2>Shift log</h2><span class="meta">${sh.length} shifts · edit any cell · "On file" counts rows transcribed from that canvasser's sheets that day</span><button class="btn sm pri" data-act="cv-add-shift">+ Shift</button></div>
  <div class="tablewrap"><table class="cv-log"><thead><tr><th>Date</th><th>Canvasser</th><th>Shift / location</th><th>Time</th><th>Area</th><th>Campaign</th><th>Sigs</th><th>On file</th><th title="Signatures uploaded">Up</th><th></th><th></th></tr></thead><tbody>
  ${sh.map(s=>{const k=(s.c||s.who)+"|"+s.date;const of=seen[k]?"":(cvOnFileFor(s,sg)||"");seen[k]=1;return `<tr data-id="${s.id}">
    <td><input type="date" data-f="date" value="${esc(s.date||"")}"></td>
    <td><select data-f="c">${opts(S.team.map(c=>[c.id,c.name]),s.c,s.c?"":(s.who||"—"))}</select></td>
    <td><input data-f="where" value="${esc(s.where||"")}" style="min-width:230px"></td>
    <td><input data-f="time" value="${esc(s.time||"")}" style="min-width:90px"></td>
    <td><select data-f="area">${opts(CV_AREAS.map(a=>[a,a]),s.area||cvGuessArea(s.where))}</select></td>
    <td><select data-f="org">${opts(cvOrgs().map(o=>[o.id,o.short||o.name]),cvOrgOf(s))}</select></td>
    <td><input type="number" min="0" data-f="sigs" value="${s.sigs??""}" placeholder="—"></td>
    <td class="num muted" style="text-align:right">${of}</td>
    <td style="text-align:center"><input type="checkbox" data-f="uploaded" ${s.uploaded?"checked":""}></td>
    <td><button class="ic ${s.notes||s.file?"has":""}" data-act="cv-notes" data-id="${s.id}" title="${esc(s.notes||"Add a note")}">✎</button></td>
    <td><button class="ic" data-act="cv-shift-del" data-id="${s.id}" title="Delete shift">✕</button></td></tr>`;}).join("")||`<tr><td colspan="11" class="empty">No shifts yet. Add one, or log today's.</td></tr>`}
  </tbody><tfoot><tr><td colspan="6" style="text-align:right">Total</td><td style="text-align:right;padding-right:12px" class="num">${cvSum(sh)}</td><td style="text-align:right" class="num">${sg.length}</td><td colspan="3"></td></tr></tfoot></table></div>
  <div class="chips" style="margin-top:12px"><button class="btn sm pri" data-act="cv-daily">Copy daily report for Kelly</button><button class="btn sm" data-act="cv-log-csv">${LOCAL?"Download log (CSV)":"Copy log as CSV"}</button></div></section>`;}
function cvShiftRest(s){const o={...s};delete o.id;return o;}
function cvNotes(id){const s=S.shifts.find(x=>x.id===id);if(!s)return;openSheet(s.where||"Shift",`<p class="small muted">${esc(cvShiftWho(s))} · ${cvDl(s.date)}${s.time?" · "+esc(s.time):""} · ${s.sigs??"—"} sigs</p><div class="fields"><div class="f wide"><label for="cvNT">Notes</label><textarea id="cvNT" style="min-height:80px">${esc(s.notes||"")}</textarea></div><div class="f wide"><label for="cvNF">Signature file / link name</label><input id="cvNF" value="${esc(s.file||"")}"></div></div>`,
  {btns:`<button class="btn pri" data-act="cv-notes-save">Save</button><button class="btn ghost" data-close="1">Cancel</button>`});
  $("#overlay [data-act='cv-notes-save']").addEventListener("click",async()=>{if(await write("shifts",id,{...cvShiftRest(s),notes:$("#cvNT").value.trim(),file:$("#cvNF").value.trim()})){closeOverlay();toast("Saved");}});}
function cvShiftForm(){const cl=cvTeam().length?cvTeam():S.team;const last=S.shifts[S.shifts.length-1];
  form({title:"Log a shift",fields:[{key:"c",label:"Canvasser",type:"select",options:cl.map(c=>[c.id,c.name]),default:last?last.c:""},{key:"date",label:"Date",type:"date",default:todayISO()},{key:"where",label:"Shift / location (event, street, church)",required:true,wide:true,placeholder:"Downtown Hartford, Main St transit hub"},{key:"time",label:"Time",placeholder:"10am – 2pm"},{key:"sigs",label:"Signatures",type:"number",placeholder:"blank if not counted"},{key:"org",label:"Campaign",type:"select",options:cvOrgs().filter(o=>o.active!==false).map(o=>[o.id,o.name]),default:S.cv.org==="all"?cvPrimary():S.cv.org},{key:"area",label:"Area",type:"select",options:[["","Work it out from the location"]].concat(CV_AREAS.map(a=>[a,a]))},{key:"hrs",label:"Hours worked",type:"number"},{key:"uploaded",label:"Signatures uploaded?",type:"select",options:[["","Not yet"],["1","Yes"]]},{key:"notes",label:"Notes",type:"textarea",rows:2,wide:true}],
    onSave:async v=>{const c=cvCanv(v.c);if(!cl.length){toast("Add a canvasser first.");return false;}return write("shifts",uid("s"),{who:c?c.name:"",c:v.c,org:v.org,center:c&&c.center?c.center:(S.cv.center==="all"?cvHome():S.cv.center),date:v.date,where:v.where,time:v.time,area:v.area||cvGuessArea(v.where),sigs:v.sigs===""?null:+v.sigs,hrs:+v.hrs||0,out:0,back:0,uploaded:!!v.uploaded,notes:v.notes,file:""});}});}

/* ---------- team ---------- */
function cvTeamView(){const sh=cvShifts(),sg=cvSg();
  const rows=cvTeam().map(c=>{const s=sh.filter(x=>(x.c||x.who)===c.id||x.who===c.name);return {c,s,v:cvSum(s),f:sg.filter(x=>x.c===c.id).length};}).sort((a,b)=>b.v-a.v||b.f-a.f||a.c.name.localeCompare(b.c.name));
  return `${pwSection()}<section class="sec"><div class="h"><h2>Canvassers</h2><span class="meta">${rows.length} on the roster · tap for shifts and paperwork</span><button class="btn sm pri" data-act="cv-add-canv">+ Canvasser</button></div>
  <div class="cv-people">${rows.map(r=>`<button class="cv-person" data-act="cv-person" data-id="${r.c.id}"><span class="n">${esc(r.c.name)}</span><span class="t num">${r.v}</span><span class="m"><i class="dot" style="background:${pwReady(r.c)||r.c.paperwork?"var(--green)":"var(--line)"}"></i>${r.s.length} shift${r.s.length===1?"":"s"}${r.f?` · ${r.f} on file`:""}</span>${S.cv.center==="all"&&r.c.center?`<span class="m">${esc((cvCenter(r.c.center)||{}).short||"")}</span>`:""}</button>`).join("")||`<p class="empty">${S.loaded.team?"Add your canvassers to start logging shifts.":ld()}</p>`}</div></section>`;}
function cvPerson(id){const c=cvCanv(id);if(!c)return;const sh=S.shifts.filter(s=>(s.c===id||(!s.c&&s.who===c.name))&&cvInOrg(s)).sort((a,b)=>(a.date||"")<(b.date||"")?-1:1);const v=cvSum(sh),logged=sh.filter(s=>cvNum(s)!==null);const f=cvSigners().filter(s=>s.c===id&&cvInOrg(s)).length;const ready=pwReady(c)||c.paperwork;
  openSheet(c.name,`<p class="small muted">${v} signatures logged · ${sh.length} shift${sh.length===1?"":"s"}${logged.length?" · "+(v/logged.length).toFixed(1)+" per shift":""}${f?" · "+f+" signers on file":""}${c.center?" · "+esc((cvCenter(c.center)||{}).name||""):""}</p>
  <div class="kv"><div>Phone</div><div>${c.phone?`<a href="tel:${esc(c.phone.replace(/\D/g,""))}">${esc(c.phone)}</a>`:"—"}</div><div>Email</div><div>${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:"—"}</div><div>Availability</div><div>${esc(c.availability||"")||"—"}</div><div>Paperwork</div><div><span class="pill ${ready?"green":"orange"}">${ready?"Ready to be paid":"Missing: "+pwMissing(c).join(", ")}</span></div></div>
  <div class="cv-list">${sh.map(s=>`<div class="s"><div class="dt">${cvD(s.date)}</div><div>${esc(s.where||"")}${s.time?` <span class="muted">· ${esc(s.time)}</span>`:""}${s.notes?`<div class="nt">${esc(s.notes)}</div>`:""}</div><div class="sg num">${s.sigs??"—"}</div></div>`).join("")||'<p class="empty">No shifts logged.</p>'}</div>`,
  {btns:`${f?`<button class="btn" data-act="cv-p-signers">See their signers</button>`:""}<button class="btn" data-act="cv-p-edit">Edit</button><button class="btn ghost" data-close="1">Close</button>`});
  const e=$("#overlay [data-act='cv-p-edit']");e.addEventListener("click",()=>cvCanvForm(c));const g=$("#overlay [data-act='cv-p-signers']");if(g)g.addEventListener("click",()=>{closeOverlay();S.cv.sc=id;cvGo("signers");});}
function cvCanvForm(c){const isNew=!c;c=c||{};
  form({title:isNew?"New canvasser":"Edit canvasser",fields:[{key:"name",label:"Name",required:true,wide:true},{key:"phone",label:"Phone"},{key:"email",label:"Email"},{key:"center",label:"Center",type:"select",options:cvCenters().map(x=>[x.id,x.name]),default:S.cv.center==="all"?cvHome():S.cv.center},{key:"availability",label:"Availability"},{key:"area",label:"Area they cover"},{key:"paperwork",label:"Paperwork in (W-9, ACH, voided check)?",type:"select",options:[["","Track each form below"],["1","All in"]]}],
    values:{...c,paperwork:c.paperwork?"1":""},onSave:async v=>write("team",c.id||uid("c"),{...teamRest(c),name:v.name,phone:v.phone,email:v.email,center:v.center,availability:v.availability,area:v.area,paperwork:!!v.paperwork}),onDelete:isNew?null:async()=>{const n=S.shifts.filter(s=>s.c===c.id).length;if(!confirm(`Delete ${c.name}${n?" and their "+n+" shifts":""}? Signers they collected stay.`))return;for(const s of S.shifts.filter(x=>x.c===c.id))await remove("shifts",s.id);await remove("team",c.id);closeOverlay();}});}

/* ---------- where to canvass ---------- */
function cvSpotsView(){const t0=todayISO();const E=allE().filter(e=>e.date&&e.date>=t0).sort((a,b)=>a.date<b.date?-1:1);const can=E.filter(e=>e.can_table===true),maybe=E.filter(e=>e.can_table!==true&&e.can_table!==false&&daysFromToday(e.date)<=30);
  const row=e=>`<div class="row" data-open="${e.id}"><div class="cv-date">${cvD(e.date)}<small>${fmtDate(e.date).slice(0,3)}</small></div><div><div class="n">${esc(e.name)}</div><div class="d">${esc([e.venue,townOf(e),(e.time||"").split("–")[0].split(" - ")[0].trim()].filter(Boolean).join(" · "))}</div></div><div class="r">${e.can_table===true?`<span class="pill green">can table</span>`:`<span class="pill sand">ask</span>`}</div></div>`;
  const past=(CV.spots||[]).slice().sort((a,b)=>a.date<b.date?-1:1);
  return `<section class="sec cv-spots" style="margin-top:12px"><div class="h"><h2>Where you can table</h2><span class="meta">upcoming events from the Events app marked "can table" · tap one for the details and the after-event report</span><button class="btn sm" data-go2="events">Open Events</button></div><div class="rows">${can.map(row).join("")||'<p class="empty">Nothing marked "can table" coming up. Open Events and mark the ones that allow a table.</p>'}</div></section>
  <section class="sec cv-spots"><div class="h"><h2>Worth asking</h2><span class="meta">next 30 days, tabling not stated yet</span></div><div class="rows">${maybe.slice(0,12).map(row).join("")||'<p class="empty">Nothing in the next 30 days without an answer.</p>'}</div></section>
  <section class="sec"><div class="h"><h2>What worked</h2><span class="meta">from the shift notes</span></div><div class="rows">${S.shifts.filter(s=>s.notes).sort((a,b)=>(a.date||"")<(b.date||"")?1:-1).slice(0,12).map(s=>`<div class="row static"><div><div class="n">${esc(s.where||"")}</div><div class="d">${esc(s.notes)}</div></div><div class="r num">${cvD(s.date)} · ${s.sigs??"—"} sigs</div></div>`).join("")||'<p class="empty">Notes on shifts show up here.</p>'}</div></section>
  <section class="sec"><div class="h"><h2>Spots from the August sheet</h2><span class="meta">${past.length} places the team canvassed in the first weeks</span></div><div class="rows">${past.map(e=>`<div class="row static"><div class="cv-date">${cvD(e.date)}<small>${fmtDate(e.date).slice(0,3)}</small></div><div><div class="n">${esc(e.name)}</div><div class="d">${esc([e.loc,e.time].filter(Boolean).join(" · "))}${/^https?:/.test(e.link||"")?` <a class="lnk" href="${esc(e.link)}" target="_blank" rel="noopener">link ↗</a>`:""}</div></div><div class="r"></div></div>`).join("")}</div></section>`;}

/* ---------- campaigns & centers ---------- */
function cvOrgsSheet(){openSheet("Campaigns",`<p class="small muted">Who you're collecting signatures for. Each has its own goal; the main campaign's goal is the one on the Today page and in Settings.</p>
  ${cvOrgs().map(o=>`<div class="cv-orgrow"><i class="dot" style="background:${o.color}"></i><b>${esc(o.name)}${o.primary?' <span class="pill blue">main</span>':""}${o.active===false?' <span class="pill grey">archived</span>':""}</b><span class="muted small num">${cvSum(S.shifts.filter(s=>cvOrgOf(s)===o.id))} / ${cvGoal(o)}</span><button class="btn sm" data-e="${o.id}">Edit</button></div>`).join("")}`,
  {btns:`<button class="btn" data-act="cv-org-new">+ New campaign</button><button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay [data-act='cv-org-new']").addEventListener("click",()=>cvOrgForm(null));document.querySelectorAll("#overlay [data-e]").forEach(b=>b.addEventListener("click",()=>cvOrgForm(b.dataset.e)));}
function cvOrgForm(id){const o=id?cvOrg(id):null;const cur=o||{name:"",short:"",city:"",goal:500,goalDate:"",color:["#e8870f","#2f9e44","#7968f7","#b8246a","#0e7a6f","#c23b3b"][cvOrgs().length%6],desc:"",active:true};
  form({title:o?"Edit campaign":"New campaign",fields:[{key:"name",label:"Name",required:true,wide:true,placeholder:"e.g. Capital Prep Harbor"},{key:"short",label:"Short name"},{key:"city",label:"City"},{key:"goal",label:"Signature goal",type:"number"},{key:"goalDate",label:"By when",type:"date"},{key:"color",label:"Color",type:"color"},{key:"active",label:"Status",type:"select",options:[["1","Active"],["","Archived"]]},{key:"desc",label:"Notes",type:"textarea",rows:2,wide:true}],
    values:{...cur,goal:cvGoal(cur),goalDate:cvGoalDate(cur),active:cur.active!==false?"1":""},
    onSave:async v=>{const list=cvOrgs().map(x=>({...x}));const rec={name:v.name,short:v.short||v.name.split(" ")[0],city:v.city,goal:+v.goal||0,goalDate:v.goalDate,color:v.color,desc:v.desc,active:!!v.active};
      if(o){Object.assign(list.find(x=>x.id===o.id),rec);if(o.primary)await write("meta","settings",{...(S.settings||{}),sigGoal:+v.goal||0,goalDate:v.goalDate});}
      else{let sid=cvSlug(v.name),i=2;while(list.find(x=>x.id===sid))sid=cvSlug(v.name)+"-"+i++;list.push({id:sid,...rec,primary:!list.length});S.cv.org=sid;cvSave();}
      return write("cv","orgs",{list});}});}
function cvCentersSheet(){openSheet("Centers",`<p class="small muted">LEAD centers that run canvassing. Canvassers, shifts and signers belong to a center, so one database serves every center and a coordinator sees their own.</p>
  ${cvCenters().map(c=>`<div class="cv-orgrow"><i class="dot" style="background:${c.active!==false?"var(--violet)":"var(--line)"}"></i><b>${esc(c.name)}${c.active===false?' <span class="pill grey">not canvassing yet</span>':""}</b><span class="muted small">${S.team.filter(x=>cvCenterOf(x)===c.id).length} canvassers · ${cvSigners().filter(x=>cvCenterOf(x)===c.id).length} on file</span><button class="btn sm" data-e="${c.id}">Edit</button></div>`).join("")}`,
  {btns:`<button class="btn" data-act="cv-center-new">+ New center</button><button class="btn ghost" data-close="1">Close</button>`});
  $("#overlay [data-act='cv-center-new']").addEventListener("click",()=>cvCenterForm(null));document.querySelectorAll("#overlay [data-e]").forEach(b=>b.addEventListener("click",()=>cvCenterForm(b.dataset.e)));}
function cvCenterForm(id){const c=id?cvCenter(id):null;const cur=c||{name:"",short:"",city:"",lead:"",active:true};
  form({title:c?"Edit center":"New center",fields:[{key:"name",label:"Name",required:true,wide:true,placeholder:"e.g. Waterbury Center"},{key:"short",label:"Short name"},{key:"city",label:"City"},{key:"lead",label:"Coordinator",wide:true},{key:"active",label:"Canvassing?",type:"select",options:[["1","Yes, show in the switcher"],["","Not yet"]]}],
    values:{...cur,active:cur.active!==false?"1":""},
    onSave:async v=>{const list=cvCenters().map(x=>({...x}));const rec={name:v.name,short:v.short||v.name.replace(/ center$/i,""),city:v.city,lead:v.lead,active:!!v.active};
      if(c)Object.assign(list.find(x=>x.id===c.id),rec);else{let sid=cvSlug(v.name),i=2;while(list.find(x=>x.id===sid))sid=cvSlug(v.name)+"-"+i++;list.push({id:sid,...rec});}
      return write("cv","centers",{list});}});}

/* ---------- moving around ---------- */
function cvGo(sub){S.cv.sub=sub;cvSave();if(S.tab!=="team")go("team");else{render();window.scrollTo({top:0});}}
function cvAdd(){const s=S.cv.sub;if(s==="signers")cvNewSigner();else if(s==="team")cvCanvForm(null);else cvShiftForm();}
function cvBind(v){if(S.tab!=="team")return;
  v.querySelectorAll("[data-act]").forEach(el=>{const a=el.dataset.act,id=el.dataset.id;const on=fn=>el.addEventListener("click",fn);
    if(a==="cv-sub")on(()=>cvGo(el.dataset.v));
    else if(a==="cv-org")on(()=>{S.cv.org=id;S.cv.fc=S.cv.fm="";cvSave();render();});
    else if(a==="cv-center")on(()=>{S.cv.center=id;S.cv.fc="";cvSave();render();});
    else if(a==="cv-orgs")on(cvOrgsSheet);else if(a==="cv-centers")on(cvCentersSheet);
    else if(a==="cv-rall")on(()=>{S.cv.r0=S.cv.r1="";render();});
    else if(a==="cv-tile")on(()=>{const k=el.dataset.k;if(k==="goal")cvGoalSheet();else if(k==="onfile"){S.cv.sf="";cvGo("signers");}else if(k==="avg")cvRankSheet();else if(k==="reach"){S.cv.sf="nocontact";cvGo("signers");}else if(k==="pipe"){S.cv.sStatus="Supporter";cvGo("signers");}else if(k==="paper")cvPaperSheet();else if(k==="geo"){S.cv.chart=cvAvail().findIndex(c=>c.id==="geo");cvSave();cvRenderStage();const st=$(".cv-stage");if(st)st.scrollIntoView({behavior:"smooth"});}else if(k==="team")cvGo("team");});
    else if(a==="cv-attn")on(()=>{const k=el.dataset.k;if(k==="review"){S.cv.sf="review";cvGo("signers");}else if(k==="dup"){S.cv.sf="dup";cvGo("signers");}else if(k==="follow"){S.cv.sf="follow";cvGo("signers");}else cvListSheet(k);});
    else if(a==="cv-chip")on(()=>{S.cv.chart=+el.dataset.i;cvSave();cvRenderStage();});
    else if(a==="cv-prev")on(()=>cvStep(-1));else if(a==="cv-next")on(()=>cvStep(1));
    else if(a==="cv-fc")el.addEventListener("change",()=>{S.cv.fc=el.value;cvRenderStage();});
    else if(a==="cv-fm")el.addEventListener("change",()=>{S.cv.fm=el.value;cvRenderStage();});
    else if(a==="cv-fclear")on(()=>{S.cv.fc=S.cv.fm="";render();});
    else if(a==="cv-report")on(()=>copyText(cvReport(),"Update copied. Paste it into an email."));
    else if(a==="cv-daily")on(()=>copyText(dailyReport(),"Report copied. Paste it into an email."));
    else if(a==="cv-csv")on(cvCSV);else if(a==="cv-src")on(cvSrcSheet);
    else if(a==="cv-log-csv")on(()=>copyOrDl(["date,canvasser,where,time,area,campaign,sigs,uploaded,notes"].concat(cvShifts().map(s=>[s.date,cvShiftWho(s),s.where,s.time,s.area,cvOrgOf(s),s.sigs??"",s.uploaded?"yes":"no",s.notes].map(csvCell).join(","))).join("\n"),"shift-log.csv","Log copied as CSV"));
    else if(a==="cv-f")el.addEventListener("change",()=>{S.cv[el.dataset.k]=el.value;render();});
    else if(a==="cv-q")el.addEventListener("input",()=>{S.cv.q=el.value;render();});
    else if(a==="cv-clear")on(()=>{Object.assign(S.cv,{q:"",sc:"",sl:"",st:"",sd:"",sg:"",sf:"",sStatus:""});render();});
    else if(a==="cv-status")on(()=>{S.cv.sStatus=el.dataset.s;render();});
    else if(a==="cv-open")on(()=>cvDrawer(id));
    else if(a==="cv-add-signer")on(cvNewSigner);else if(a==="cv-add-shift")on(cvShiftForm);else if(a==="cv-add-canv")on(()=>cvCanvForm(null));
    else if(a==="cv-person")on(()=>cvPerson(id));else if(a==="cv-notes")on(()=>cvNotes(id));
    else if(a==="cv-shift-del")on(async()=>{const s=S.shifts.find(x=>x.id===id);if(s&&confirm(`Delete "${s.where||"this shift"}" (${cvShiftWho(s)})?`)){await remove("shifts",id);toast("Deleted");}});
  });
  v.querySelectorAll(".cv-log [data-f]").forEach(inp=>inp.addEventListener("change",async()=>{const tr=inp.closest("tr");const s=S.shifts.find(x=>x.id===tr.dataset.id);if(!s)return;const f=inp.dataset.f;const n={...cvShiftRest(s)};
    if(f==="uploaded")n.uploaded=inp.checked;else if(f==="sigs")n.sigs=inp.value===""?null:+inp.value;else if(f==="c"){n.c=inp.value;const c=cvCanv(inp.value);if(c){n.who=c.name;if(c.center)n.center=c.center;}}else n[f]=inp.value;
    if(f==="where"&&(!s.area||s.area==="Other"))n.area=cvGuessArea(n.where);await write("shifts",s.id,n);}));
  const ds=cvAllDates();v.querySelectorAll("[data-cvr]").forEach(r=>r.addEventListener("input",()=>{let a=+v.querySelector("[data-cvr='0']").value,b=+v.querySelector("[data-cvr='1']").value;if(a>b)[a,b]=[b,a];S.cv.r0=a===0?"":ds[a];S.cv.r1=b===ds.length-1?"":ds[b];render();}));
  if(S.cv.sub==="over")cvRenderStage();
  const q=$("#cvq");if(q&&S.cv.q&&document.activeElement!==q){}}
document.addEventListener("keydown",e=>{if(S.tab!=="team"||S.cv.sub!=="over"||$("#overlay").innerHTML.trim()||/INPUT|SELECT|TEXTAREA/.test((e.target||{}).tagName||""))return;if(e.key==="ArrowRight")cvStep(1);if(e.key==="ArrowLeft")cvStep(-1);});

/* ============ Letters of support: Libertas (folded in from LEAD-Libertas-Letters, Nov 5) ============ */
TITLES.letters="Letters of support";PAGE_CONTEXT.letters="Libertas letters of support";
APPS.splice(Math.max(0,APPS.findIndex(a=>a.id==="team")+1),0,{id:"letters",row:"campaign",tc:"brick",desc:"20 letters of support for Libertas by the Gala: who to ask, the email, script and letter for each, and who has signed."});
IC.letters='<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.6 7.2l8.4 6 8.4-6"/><path d="M15.5 17.5l1.8 1.8 3.4-3.6"/>';
VIEWS.canv.hide.push("letters");
const LT_KEY="lead_hub_lt",LT_OLD="libertas-letters-v1",LT_OLD_DONE="lead_hub_lt_imported";
const LT_ST=[["new","Not started","var(--notyet)"],["contacted","Contacted","var(--talked)"],["replied","Replied","var(--lt-replied)"],["meeting","Meeting set","var(--violet)"],["promised","Letter promised","var(--supports)"],["signed","Letter signed","var(--champion)"],["declined","Declined","var(--declined)"]];
const LT_SM=Object.fromEntries(LT_ST.map(s=>[s[0],s]));
const LT_ASKED=["contacted","replied","meeting","promised","signed"];
const LT_CHL={walk:"Walk in",email:"Email",phone:"Call",dm:"DM",web:"Website form"};
const LT_SIGNOFF=(()=>{const m=ME();return [m.name,[m.title,m.place].filter(Boolean).join(" · "),[m.phone,m.email].filter(Boolean).join(" · ")].filter(Boolean).join("\n");})();
S.letters=S.letters||[];
S.lt={sub:"list",q:"",lane:"",town:"",pri:"",ch:"",kind:"",status:"",zone:"",A:false,sel:null,dtab:"",n:150};
try{const o=JSON.parse(localStorage.getItem(LT_KEY)||"{}");if(["list","route","today"].includes(o.sub))S.lt.sub=o.sub;}catch(e){}
function ltSave(){try{localStorage.setItem(LT_KEY,JSON.stringify({sub:S.lt.sub}));}catch(e){}}
LT.contacts.forEach(c=>{c.letter=LT.meta.letter_head+"\n\n"+LT.meta.letter_body+"\n\n"+LT.meta.letter_sign;});

/* ---------- data ---------- */
let _ltM={ref:null,m:{}};
function ltMap(){if(_ltM.ref!==S.letters)_ltM={ref:S.letters,m:Object.fromEntries(S.letters.map(d=>[d.id,d]))};return _ltM.m;}
function ltDoc(id){return ltMap()[id]||{};}
function ltSt(c){return ltDoc(c.id).status||"new";}
function ltAt(c){return ltDoc(c.id).at||"";}
function ltGoal(){return +(S.settings||{}).ltGoal||LT.meta.goal;}
function ltGalaEv(){return allE().find(e=>/gala/i.test(e.name||"")&&/lead/i.test(e.name||"")&&e.date)||null;}
function ltGala(){const st=S.settings||{};if(st.ltGala)return st.ltGala;const e=ltGalaEv();return e?e.date:LT.meta.gala;}
function ltAll(){const out=LT.contacts.slice();S.letters.forEach(d=>{if(d.custom&&!d.deleted)out.push(ltCustom(d));});return out;}
function ltGet(id){const c=LT.contacts.find(x=>x.id===id);if(c)return c;const d=ltMap()[id];return d&&d.custom&&!d.deleted?ltCustom(d):null;}
async function ltSet(id,patch){const cur=ltDoc(id);const {id:_i,...rest}=cur;const next={...rest,...patch};const ok=await write("letters",id,next);
  if(ok){const L=S.letters.slice();const i=L.findIndex(d=>d.id===id);if(i>=0)L[i]={id,...next};else L.push({id,...next});S.letters=L;}return ok;}
function ltCh(c){if(c.storefront&&c.address)return "walk";if(c.email)return "email";if(c.phone)return "phone";if(c.instagram||c.facebook||c.linkedin)return "dm";return "web";}
function ltRoutes(c){return [["walk","Walk in",!!(c.storefront&&c.address)],["email","Email",!!c.email],["phone","Call",!!c.phone],["dm","DM",!!(c.instagram||c.facebook||c.linkedin)],["web","Web form",!(c.email||c.phone||(c.storefront&&c.address)||c.instagram||c.facebook||c.linkedin)&&!!(c.website||c.booking)]].filter(r=>r[2]);}
function ltCustom(d){const name=d.name||"(no name)",town=d.town||"Hartford",first=(d.person||"").trim().split(/\s+/)[0]||"";
  const c={lane:"Added by hand",zone:"other",zone_label:town,town,priority:"B",score:0,verified:true,storefront:false,gatekeeper:"",hook:"",why_fit:"",edu_tie:"",notes:"",owned_by:"",ages:"",hours:"",flag:"",source:"",website:"",instagram:"",facebook:"",linkedin:"",booking:"",person:"",role:"",address:"",email:"",phone:"",...d,id:d.id,name,town,custom:true,added:"added by hand"+(d.createdAt?" "+fmtDate(d.createdAt):"")};
  const z=LT.meta.zones.find(z=>z.label.toLowerCase()===town.toLowerCase());if(z){c.zone=z.id;c.zone_label=z.label;}
  c.email_subject=`A letter for Hartford kids — 15 minutes with ${name}`;
  c.email_body=`Hi ${first||"there"},\n\n[One line recognizing what ${name} does for Hartford.] [One line commending it.]\n\nI'm ${ME().name}${ME().title?", "+ME().title:""} at ${ME().place} (Leaders for Educational Advocacy and Diversity), and I'm working with Libertas Academy, a free public 6–12 college-prep school out of Springfield, on its application to open a Hartford school as early as 2028. Every one of its graduates who applied to a four-year college was accepted, and its middle school ranked #1 in Massachusetts for math growth on the most recent MCAS.\n\nBefore the State says yes, it wants to see that Hartford's own community is behind it, and that's where ${name} comes in. I'm asking you for a one-page letter of support. There's a simple template, and I'd like to meet for 15 minutes to walk through the school, answer your questions, and help develop the letter with you.\n\nOur mission is to make sure every kid in Hartford has an option, and a letter from you brings that closer. Do you have 15 minutes this week or next, at your place or on a call?\n\n${LT_SIGNOFF}`;
  c.call_script=`${c.storefront&&c.address?"WALK IN — "+c.address:"CALL"+(c.phone?" — "+c.phone:"")}\n\n"Hi, I'm ${ME().first} with LEAD here in ${ME().town}. Is ${first||"the owner"} in? … Got 60 seconds?\n\nLibertas Academy, a free public middle and high school from Springfield, is applying to open in Hartford. Every one of their graduates who applied to a four-year college got in.\n\nThe State wants letters from Hartford businesses and people saying the city's behind it. I'm asking ${name} for a one-page letter of support. There's a simple template, and I'd sit down with you for 15 minutes to walk through the school and help put the letter together. When's a good time this week or next?"\n\nBEFORE YOU LEAVE: their name, best number or email, and the meeting time (or when to come back). Set the status here.`;
  c.dm_text=`Hey — ${ME().first} with LEAD here in ${ME().town} (Leaders for Educational Advocacy and Diversity). Libertas Academy, a free public 6–12 school out of Springfield (every graduate who applied to a four-year college got in), is applying to open in Hartford. The State wants letters from local businesses and people showing the city's behind it. I'm asking ${name} for a one-page letter of support. There's a simple template, and I'll help you put it together. Our mission is to make sure every kid in Hartford has an option, and your letter brings that closer. Got 15 minutes this week or next to talk it through?`;
  c.letter=LT.meta.letter_head+"\n\n"+LT.meta.letter_body+"\n\n"+LT.meta.letter_sign;
  return c;}

/* ---------- filters ---------- */
function ltMatch(c,skip){const f=S.lt,s=ltSt(c);
  if(skip!=="status"&&f.status&&s!==f.status)return false;
  if(skip!=="lane"&&f.lane&&c.lane!==f.lane)return false;
  if(skip!=="town"&&f.town&&c.town!==f.town)return false;
  if(f.pri&&c.priority!==f.pri)return false;if(f.A&&c.priority!=="A")return false;
  if(f.ch&&ltCh(c)!==f.ch)return false;
  if(f.kind==="store"&&!c.storefront)return false;if(f.kind==="online"&&c.storefront)return false;
  if(skip!=="zone"&&f.zone&&c.zone!==f.zone)return false;
  if(f.q){const q=f.q.toLowerCase();if(![c.name,c.person,c.role,c.address,c.hook,c.edu_tie,c.lane,c.zone_label,c.town,c.notes,ltDoc(c.id).note].join(" ").toLowerCase().includes(q))return false;}
  return true;}
function ltSort(a){const pr={A:0,B:1,C:2};return a.slice().sort((x,y)=>((pr[x.priority]??3)-(pr[y.priority]??3))||((y.score||0)-(x.score||0))||x.name.localeCompare(y.name));}
function ltVis(){return ltSort(ltAll().filter(c=>ltMatch(c)));}
function ltFiltered(){const f=S.lt;return !!(f.q||f.lane||f.town||f.pri||f.ch||f.kind||f.status||f.zone||f.A);}
function ltClear(){Object.assign(S.lt,{q:"",lane:"",town:"",pri:"",ch:"",kind:"",status:"",zone:"",A:false,n:150});}

/* ---------- People & orgs link ---------- */
const ltNorm=x=>String(x||"").toLowerCase().replace(/\(.*?\)/g,"").replace(/&/g,"and").replace(/\bthe\b/g,"").replace(/[^a-z0-9]/g,"");
let _ltP={a:null,e:null,m:{}};
function ltPeople(){if(_ltP.a!==S.added||_ltP.e!==S.edits){const m={};allT().forEach(t=>{const k=ltNorm(t.name);if(k&&!m[k])m[k]=t;});_ltP={a:S.added,e:S.edits,m};}return _ltP.m;}
function ltPerson(c){const d=ltDoc(c.id);if(d.pid){const r=getRec(d.pid);if(r)return r;}if(S.added["lt_"+c.id])return getRec("lt_"+c.id);return ltPeople()[ltNorm(c.name)]||null;}
async function ltPromote(c){const id="lt_"+c.id;if(S.added[id]){closeOverlay();openDetail(id);return;}
  const towns=Object.keys(REF.CENTROIDS||{}),st=ltSt(c),d=ltDoc(c.id);
  const ok=await write("added",id,{kind:"target",name:c.name,type:c.storefront?"Business":"Organization",subtype:c.lane||"Letter of support",lane:"Libertas canvassing",priority:c.priority==="A"?"High":"Medium",contact_name:c.person||"",role:c.role||"",phone:c.phone||"",email:c.email||"",town:towns.includes(c.town)?c.town:"Hartford",address:c.address||"",website:c.website||"",why:`Libertas letter of support: ${LT_SM[st][1].toLowerCase()}${d.at?" ("+fmtDate(d.at)+")":""}. ${c.why_fit||""}`.trim(),community:["General"],createdAt:todayISO()});
  if(!ok)return;await write("edits",id,{...(S.edits[id]||{}),status:["promised","signed"].includes(st)?"Supporter":"Contacted",notes:d.note||"",last_contact:d.at||todayISO()});
  await ltSet(c.id,{pid:id});toast("Added to People & orgs");closeOverlay();openDetail(id);}
async function ltMarkSupporter(p){await write("edits",p.id,{...(S.edits[p.id]||{}),status:"Supporter",last_contact:todayISO()});toast(p.name+" now shows Supports us in People & orgs");}

/* ---------- needs (home console, Today) ---------- */
function ltAge(c){const a=ltAt(c);return a?-daysFromToday(a):999;}
function ltNeeds(){const L=ltSort(ltAll()),out=[],t0=todayISO();
  const row=(c,n,d,r,dot)=>({n,d,r:r||"",dot:dot||"",attr:`data-ltopen="${c.id}"`});
  L.filter(c=>ltSt(c)==="replied").forEach(c=>out.push(row(c,"Answer: "+c.name,"They replied. Lock in the 15 minutes today.",ltAt(c)?rel(daysFromToday(ltAt(c))):"","soon")));
  L.filter(c=>ltSt(c)==="meeting").sort((a,b)=>(ltDoc(a.id).meet||"9")<(ltDoc(b.id).meet||"9")?-1:1).forEach(c=>{const m=ltDoc(c.id).meet;const dd=m?daysFromToday(m):null;out.push({...row(c,"Meet: "+c.name,"Bring the one-pager and the template",m?fmtDate(m):"no date set",dd!==null&&dd<0?"late":dd!==null&&dd<=2?"soon":"info"),late:dd!==null&&dd<0});});
  L.filter(c=>ltSt(c)==="promised").forEach(c=>out.push(row(c,"Pick up: "+c.name,"Letter promised. Go get it signed.",ltAt(c)?fmtDate(ltAt(c)):"","ok")));
  L.filter(c=>ltSt(c)==="contacted"&&ltAge(c)>=3).slice(0,8).forEach(c=>out.push(row(c,"Follow up: "+c.name,LT_CHL[ltCh(c)]+" · asked "+rel(daysFromToday(ltAt(c))),"","")));
  L.filter(c=>ltSt(c)==="new"&&c.priority==="A").slice(0,6).forEach(c=>out.push(row(c,c.name,"A list · "+LT_CHL[ltCh(c)]+" · "+(c.zone_label||c.town),"","info")));
  return out;}
function ltTodayNeeds(){return ltNeeds().filter(x=>/^Answer|^Meet/.test(x.n)&&(x.dot==="soon"||x.dot==="late"||/^Answer/.test(x.n)));}
function ltCount(){return ltAll().filter(c=>{const s=ltSt(c);return s==="replied"||(s==="contacted"&&ltAge(c)>=3)||(s==="meeting"&&ltDoc(c.id).meet&&daysFromToday(ltDoc(c.id).meet)<=1);}).length;}

/* ---------- page ---------- */
function rLetters(){const L=ltAll();
  let h=ltOldBanner();
  h+=ltRoad(L)+ltTiles(L);
  h+=`<div class="lt-viz"><div class="lt-panel"><h3>Pipeline <small>tap a stage</small></h3><div class="lt-bars">${ltBars(LT_ST.map(s=>({k:s[0],l:s[1],v:L.filter(c=>ltSt(c)===s[0]).length,c:s[2],on:S.lt.status===s[0]})),"status")}</div></div>
    <div class="lt-panel"><h3>By lane <small>in this view</small></h3><div class="lt-bars">${ltBars(ltCountBy(L,"lane"),"lane")}</div></div>
    <div class="lt-panel"><h3>By town <small>in this view</small></h3><div class="lt-bars">${ltBars(ltCountBy(L,"town"),"town")}</div></div></div>`;
  h+=`<div class="lt-panel lt-mapp"><h3>Where they are <small>tap a zone · number = contacts in this view</small></h3>${ltMapSVG(L)}<div class="mapkey"><span><i style="background:var(--blue-soft);border:1px solid var(--blue)"></i>Hartford neighborhood</span><span><i style="background:var(--surface2);border:1px solid var(--line)"></i>Nearby town</span><span><i style="background:var(--blue)"></i>Selected</span></div></div>`;
  h+=ltTools(L);
  const v=ltVis();
  h+=`<p class="lt-count"><span><b>${v.length}</b> of ${L.length}${ltFilterWords()}</span><span>${S.lt.sub==="list"?"sorted: priority, then fit":S.lt.sub==="route"?"storefronts by zone and street":"what to do next"}</span></p>`;
  h+=S.lt.sub==="route"?ltRouteView(v):S.lt.sub==="today"?ltTodayView():ltListView(v);
  h+=`<div class="chips lt-acts"><button class="btn sm pri" data-act="lt-report">Update for Kelly</button><button class="btn sm" data-act="lt-help">How to work it</button><button class="btn sm" data-act="lt-goal">Goal &amp; Gala date</button><button class="btn sm" data-act="lt-csv">${LOCAL?"Download progress (CSV)":"Copy progress as CSV"}</button><button class="btn sm" data-act="lt-import">Bring in progress from the old Letters file</button></div>
  <p class="muted small" style="margin-top:8px">${L.length} contacts · ${LT.meta.verified} verified on the business's own page, ${LT.meta.unverified} to verify · built ${esc(LT.meta.built)}, folded into the hub Nov 5. Statuses and notes save with the rest of the hub and ride in hub backups.</p>`;
  return h;}
function ltCountBy(L,k){const by={};L.filter(c=>ltMatch(c,k)).forEach(c=>{const x=c[k]||"—";by[x]=(by[x]||0)+1;});return Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([x,v])=>({k:x,l:x,v,on:S.lt[k]===x}));}
function ltBars(rows,dim){const max=Math.max(1,...rows.map(r=>r.v));const any=rows.some(r=>r.on);
  return rows.map(r=>`<button class="lt-bar ${r.on?"on":""}" data-act="lt-bar" data-dim="${dim}" data-k="${esc(r.k)}" aria-pressed="${!!r.on}"><span class="l">${esc(r.l)}</span><span class="t"><i style="width:${(r.v/max*100).toFixed(1)}%;background:${r.c||(any&&!r.on?"var(--line)":"var(--blue)")}"></i></span><span class="v num">${r.v}</span></button>`).join("")||`<p class="empty">Nothing in this view.</p>`;}
function ltFilterWords(){const f=S.lt,p=[];if(f.zone)p.push((LT.meta.zones.find(z=>z.id===f.zone)||{}).label||f.zone);if(f.lane)p.push(f.lane);if(f.town)p.push(f.town);if(f.status)p.push(LT_SM[f.status][1]);if(f.pri)p.push("priority "+f.pri);if(f.A)p.push("A list");if(f.ch)p.push(LT_CHL[f.ch]);if(f.kind)p.push(f.kind==="store"?"storefronts":"online");if(f.q)p.push(`"${f.q}"`);return p.length?" · "+esc(p.join(" · ")):"";}

function ltRoad(L){const goal=ltGoal(),gala=ltGala(),ph=LT.meta.phases;const cnt=k=>L.filter(c=>ltSt(c)===k).length;
  const signed=cnt("signed"),prom=cnt("promised"),meet=cnt("meeting"),asked=L.filter(c=>LT_ASKED.includes(ltSt(c))).length;
  const start=parseISO(ph[0].from),end=parseISO(gala)||parseISO(LT.meta.gala),span=Math.max(86400000,end-start),now=parseISO(todayISO());
  const pos=Math.min(1,Math.max(0,(now-start)/span));const dGala=daysFromToday(gala),dThai=daysFromToday(ph[1].from);
  const r=30,C=2*Math.PI*r,ps=Math.min(1,signed/goal),pp=Math.min(1-ps,prom/goal);
  const ring=`<svg class="lt-ring" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="${r}" class="bg"/>${pp>0?`<circle cx="38" cy="38" r="${r}" class="pr" stroke-dasharray="${(C*pp).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-C*ps).toFixed(1)}" transform="rotate(-90 38 38)"/>`:""}${ps>0?`<circle cx="38" cy="38" r="${r}" class="sg" stroke-dasharray="${(C*ps).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 38 38)"/>`:""}</svg>`;
  const segs=ph.map((p,i)=>{const f=parseISO(p.from),t=i===ph.length-1?end:parseISO(p.to);const w=Math.max(0,(Math.min(t,end)-f)/span*100);return `<div class="seg s${i}" style="width:${w.toFixed(2)}%" title="${esc(p.label)}"><span class="lg">${esc(p.short)}</span><span class="sm">${esc(p.tiny)}</span></div>`;}).join("");
  const need=Math.max(0,goal-signed-prom);
  const line=dThai>0?`<b>${dThai} day${dThai===1?"":"s"}</b> of field and online asks before ${esc(ph[1].tiny||"the next phase")}. Need <b>${need}</b> more promised or signed; aim to leave with ${goal} promised.`:dGala>0?`Collecting. <b>${Math.max(0,goal-signed)}</b> letters still to pick up before the Gala.`:`Gala week. Close it out.`;
  const ev=ltGalaEv();
  return `<div class="road lt-road">
    <div class="lt-head">${ring}<div><div class="big num">${signed}<small>of ${goal} letters signed</small></div><div class="lbl">${prom} promised · ${meet} meeting${meet===1?"":"s"} set · ${asked} asked of ${L.length}</div></div></div>
    <div class="days"><div class="big num">${dGala===null?"—":Math.max(0,dGala)}</div><div class="lbl">days to the Gala · ${fmtDate(gala)}</div></div>
    <div class="lt-phases"><div class="lt-trk">${segs}<i class="now" style="left:${(pos*100).toFixed(2)}%"><em>today</em></i></div><div class="lt-ends"><span>${fmtDate(ph[0].from)}</span><span>${esc(ph[1].tiny||"")} ${fmtDate(ph[1].from)}–${fmtDate(ph[1].to)}</span><span>${ev?esc(ev.name):"Gala"} ${fmtDate(gala)}</span></div></div>
    <div class="src"><span>${line}</span><span>Petition: <b>${sigTotals().all}</b> of ${(S.settings||{}).sigGoal||500} signatures</span></div>
  </div>`;}
function ltTiles(L){const cnt=k=>L.filter(c=>ltSt(c)===k).length;const f=S.lt;
  const T=[["all","All contacts",L.length,"var(--blue)",!ltFiltered()],["A","A list, go first",L.filter(c=>c.priority==="A").length,"var(--orange)",f.A],["contacted","Contacted",cnt("contacted"),"var(--talked)"],["replied","Replied",cnt("replied"),"var(--lt-replied)"],["meeting","Meetings set",cnt("meeting"),"var(--violet)"],["promised","Promised",cnt("promised"),"var(--supports)"],["signed","Signed",cnt("signed"),"var(--champion)"],["declined","Declined",cnt("declined"),"var(--declined)"]];
  return `<div class="strip lt-strip">${T.map(t=>`<div data-act="lt-tile" data-k="${t[0]}" class="${(t[4]||f.status===t[0])&&t[0]!=="all"?"on":""}" style="--lc:${t[3]}"><b class="num">${t[2]}</b><span><i class="dot"></i>${t[1]}</span></div>`).join("")}</div>`;}
function ltMapSVG(L){const counts={};L.filter(c=>ltMatch(c,"zone")).forEach(c=>counts[c.zone]=(counts[c.zone]||0)+1);
  return `<svg class="lt-map" viewBox="0 0 1000 620" role="img" aria-label="Contacts by Hartford neighborhood and nearby town"><path class="river" d="M 712 0 C 700 120, 735 220, 715 330 S 690 520, 705 620"/><text class="rlbl" x="724" y="608">Connecticut River</text>
    ${LT.meta.zones.map(z=>{const n=counts[z.id]||0;return `<g class="zone ${z.hartford?"hf":""} ${S.lt.zone===z.id?"on":""} ${n?"":"z0"}" data-act="lt-zone" data-k="${z.id}" tabindex="0" role="button" aria-label="${esc(z.label)}: ${n}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="10"/><text class="c" x="${z.x+12}" y="${z.y+31}">${n}</text><text class="n${z.label.length>15?" sm":""}" x="${z.x+12}" y="${z.y+z.h-12}">${esc(z.label)}</text></g>`;}).join("")}</svg>`;}
function ltTools(L){const f=S.lt;const lanes=[...new Set(L.map(c=>c.lane))].sort();const towns=Object.entries(L.reduce((o,c)=>(o[c.town]=(o[c.town]||0)+1,o),{})).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  const sel=(k,opts,lab)=>`<select data-act="lt-f" data-k="${k}" aria-label="${esc(lab)}"><option value="">${esc(lab)}</option>${opts.map(o=>`<option value="${esc(o[0])}" ${f[k]===o[0]?"selected":""}>${esc(o[1])}</option>`).join("")}</select>`;
  return `<div class="cv-tools lt-tools"><input type="search" id="ltq" data-act="lt-q" placeholder="Search name, person, street, hook…" value="${esc(f.q)}" aria-label="Search letter contacts">
    ${sel("lane",lanes.map(x=>[x,x]),"All lanes")}${sel("town",towns.map(x=>[x,x]),"All towns")}${sel("pri",[["A","A, start here"],["B","B, second wave"],["C","C, later"]],"Any priority")}${sel("ch",[["walk","Walk in"],["email","Email"],["phone","Call"],["dm","DM"]],"Any channel")}${sel("kind",[["store","Storefronts"],["online","Online only"]],"Storefront + online")}
    <div class="tviews">${[["list","Contacts"],["route","Route"],["today","Today"]].map(([k,l])=>`<button data-act="lt-sub" data-k="${k}" aria-pressed="${f.sub===k}">${l}</button>`).join("")}</div>
    ${ltFiltered()?`<button class="btn sm ghost" data-act="lt-clear">Clear</button>`:""}<button class="btn sm pri" data-act="lt-add">+ Contact</button></div>
  <div class="chips lt-stchips">${LT_ST.map(s=>`<button class="chip" data-act="lt-status" data-k="${s[0]}" aria-pressed="${f.status===s[0]}"><span class="dot" style="background:${s[2]}"></span>${s[1]} ${L.filter(c=>ltSt(c)===s[0]).length}</button>`).join("")}${f.zone?`<button class="chip" data-act="lt-zone" data-k="${f.zone}" aria-pressed="true">${esc((LT.meta.zones.find(z=>z.id===f.zone)||{}).label||f.zone)} ✕</button>`:""}${f.A?`<button class="chip" data-act="lt-tile" data-k="A" aria-pressed="true">A list ✕</button>`:""}</div>`;}
function ltStPill(s){const x=LT_SM[s]||LT_SM.new;return `<span class="pill lt-st" style="--lc:${x[2]}"><i></i>${x[1]}</span>`;}
function ltPriPill(p){return `<span class="pill ${p==="A"?"orange":p==="B"?"blue":"grey"}">${p}</span>`;}
function ltListView(v){if(!v.length)return `<p class="empty">Nothing matches. Clear a filter.</p>`;const n=Math.min(v.length,S.lt.n);
  return `<div class="tablewrap"><table class="cv-table lt-table"><thead><tr><th>Contact</th><th>Where</th><th>Reach</th><th>Pri</th><th>Status</th></tr></thead><tbody>
  ${v.slice(0,n).map(c=>{const d=ltDoc(c.id),p=ltPerson(c);return `<tr class="cl ${S.lt.sel===c.id?"sel":""}" data-act="lt-open" data-id="${c.id}">
    <td><span class="n">${esc(c.name)}</span><span class="sub">${esc([c.person,c.role].filter(Boolean).join(" · ")||c.lane)}${c.verified?"":` · <b class="lt-vf">verify</b>`}${c.added==="LEAD contact list"?` · <b class="lt-wm">warm</b>`:""}${p?` · <span class="lt-po" title="Also in People &amp; orgs">● People &amp; orgs</span>`:""}</span></td>
    <td>${esc(c.zone_label||c.town)}<span class="sub">${esc(c.lane)}</span></td>
    <td><span class="lt-rts">${ltRoutes(c).map(r=>`<i class="${r[0]===ltCh(c)?"best":""}">${r[1]}</i>`).join("")}</span></td>
    <td>${ltPriPill(c.priority)}</td>
    <td>${ltStPill(ltSt(c))}${d.meet&&ltSt(c)==="meeting"?`<span class="sub">meet ${fmtDate(d.meet)}</span>`:d.at?`<span class="sub">${fmtDate(d.at)}</span>`:""}</td></tr>`;}).join("")}
  </tbody></table></div>${v.length>n?`<div class="chips" style="margin-top:10px"><button class="btn sm" data-act="lt-more">Show all ${v.length}</button></div>`:""}`;}
function ltMaps(c){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent((c.name||"")+" "+(c.address||"")+(c.address&&!/CT/i.test(c.address)?" "+c.town+" CT":""));}
function ltRouteView(v){const st=v.filter(c=>c.storefront&&c.address);if(!st.length)return `<p class="empty">No storefronts in this view.</p>`;
  const by={};st.forEach(c=>{const k=c.zone_label||c.town;(by[k]=by[k]||[]).push(c);});const street=a=>((a||"").replace(/^[\d\-]+[A-Za-z]?\s+/,"").split(",")[0]||"");
  return Object.keys(by).sort((a,b)=>by[b].length-by[a].length).map(z=>{const rows=by[z].sort((a,b)=>street(a.address).localeCompare(street(b.address))||(a.address||"").localeCompare(b.address||""));
    return `<section class="sec lt-zone"><div class="h"><h2>${esc(z)}</h2><span class="meta">${rows.length} door${rows.length===1?"":"s"}</span></div><div class="rows">${rows.map(c=>`<div class="row" data-act="lt-open" data-id="${c.id}"><div class="n">${esc(c.name)}${c.person?` <span class="muted small">· ${esc(c.person)}</span>`:""}</div><div class="r"><a class="lnk" href="${ltMaps(c)}" target="_blank" rel="noopener" data-stop="1">Maps ↗</a></div><div class="d">${esc(c.address)}${c.hours?" · "+esc(c.hours):""} · ${ltStPill(ltSt(c))}</div></div>`).join("")}</div></section>`;}).join("");}
function ltTodayView(){const L=ltSort(ltAll());const dm=c=>ltDoc(c.id).meet||"";
  const secs=[["Meetings","Bring the one-pager and the template; leave with a promised letter",L.filter(c=>ltSt(c)==="meeting").sort((a,b)=>(dm(a)||"9")<(dm(b)||"9")?-1:1)],
    ["Pick up","Letters promised: go get them signed",L.filter(c=>ltSt(c)==="promised")],
    ["Answer","They replied: lock in the meeting time today",L.filter(c=>ltSt(c)==="replied")],
    ["Follow up","Contacted 3+ days ago, no reply yet",L.filter(c=>ltSt(c)==="contacted"&&ltAge(c)>=3)],
    ["Start here","A list, not contacted yet",L.filter(c=>ltSt(c)==="new"&&c.priority==="A").slice(0,25)],
    ["Then","B list, not contacted yet",L.filter(c=>ltSt(c)==="new"&&c.priority==="B").slice(0,20)]];
  return secs.map(([t,s,l])=>`<section class="sec"><div class="h"><h2>${esc(t)}</h2><span class="meta">${esc(s)} · ${l.length}</span></div><div class="rows">${l.length?l.map(c=>`<div class="row" data-act="lt-open" data-id="${c.id}"><div class="n">${esc(c.name)}</div><div class="r">${esc(LT_CHL[ltCh(c)])}${dm(c)&&ltSt(c)==="meeting"?" · "+fmtDate(dm(c)):ltAt(c)?" · "+fmtDate(ltAt(c)):""}</div><div class="d">${esc([c.person,c.zone_label||c.town,c.lane].filter(Boolean).join(" · "))}</div></div>`).join(""):`<p class="empty">Nothing here.</p>`}</div></section>`).join("");}

/* ---------- old file import ---------- */
function ltOldLocal(){try{if(localStorage.getItem(LT_OLD_DONE))return null;const o=JSON.parse(localStorage.getItem(LT_OLD)||"null");if(!o||typeof o!=="object")return null;const ids=Object.keys(o).filter(k=>o[k]&&(o[k].status&&o[k].status!=="new"||o[k].note));return ids.length?{o,ids}:null;}catch(e){return null;}}
function ltOldBanner(){const x=ltOldLocal();if(!x||!S.loaded.letters)return "";const fresh=x.ids.filter(id=>!ltDoc(id).status&&!ltDoc(id).note);if(!fresh.length)return "";
  return `<div class="note lt-old"><b>Found your progress from the old Letters file on this device</b> (${fresh.length} contact${fresh.length===1?"":"s"} with a status or notes). <button class="btn sm pri" data-act="lt-old-in">Bring it in</button> <button class="btn sm ghost" data-act="lt-old-skip">Not now</button></div>`;}
async function ltImportState(o){const st=o&&(o.state||o);if(!st||typeof st!=="object"){toast("That isn't a Letters progress file.");return;}
  const jobs=[];Object.entries(st).forEach(([id,v])=>{if(!v||typeof v!=="object"||!ltGet(id))return;const cur=ltDoc(id);const p={};if(v.status&&v.status!=="new")p.status=v.status;if(v.at)p.at=v.at;if(v.note)p.note=cur.note&&cur.note!==v.note?cur.note+"\n"+v.note:v.note;if(Object.keys(p).length)jobs.push(ltSet(id,p));});
  if(!jobs.length){toast("Nothing new in that file.");return;}await Promise.all(jobs);try{localStorage.setItem(LT_OLD_DONE,"1");}catch(e){}toast("Brought in "+jobs.length+" contact"+(jobs.length===1?"":"s"));render();}
function ltImportFile(){const inp=document.createElement("input");inp.type="file";inp.accept=".json,application/json";inp.onchange=()=>{const f=inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{ltImportState(JSON.parse(String(rd.result)));}catch(e){toast("Couldn't read that file.");}};rd.readAsText(f);};inp.click();}

/* ---------- drawer ---------- */
function ltLinks(c){const ig=h=>h?(h.startsWith("http")?h:"https://www.instagram.com/"+h.replace(/^@/,"")):"",strip=u=>String(u).replace(/^https?:\/\/(www\.)?/,"").replace(/\/$/,"");
  const L=[];if(c.email)L.push([ltMail(c),"Email",c.email]);if(c.phone)L.push(["tel:"+c.phone.replace(/[^\d+]/g,""),"Call",c.phone]);if(c.address)L.push([ltMaps(c),"Walk in",c.address,1]);
  if(c.instagram)L.push([ig(c.instagram),"Instagram","@"+c.instagram.replace(/^@/,"").replace(/^https?:\/\/(www\.)?instagram\.com\//,"").replace(/\/$/,""),1]);if(c.booking)L.push([c.booking,"Booking",strip(c.booking),1]);if(c.website)L.push([c.website,"Website",strip(c.website),1]);if(c.facebook)L.push([c.facebook,"Facebook",strip(c.facebook),1]);if(c.linkedin)L.push([c.linkedin,"LinkedIn",strip(c.linkedin),1]);
  return L.length?`<div class="lt-links">${L.map(([u,k,v,ext])=>`<a href="${esc(u)}" ${ext?'target="_blank" rel="noopener"':""}><b>${k}</b><span>${esc(v)}</span></a>`).join("")}</div>`:"";}
function ltMail(c){return `mailto:${encodeURIComponent(c.email||"")}?subject=${encodeURIComponent(c.email_subject)}&body=${encodeURIComponent(c.email_body)}`;}
function ltDrawer(id,keep){const c=ltGet(id);if(!c)return;S.lt.sel=id;document.querySelectorAll(".lt-table tr.cl").forEach(t=>t.classList.toggle("sel",t.dataset.id===id));
  const d=ltDoc(id),st=ltSt(c),ch=ltCh(c),p=ltPerson(c);if(!S.lt.dtab||!keep)S.lt.dtab=ch==="walk"||(!c.email&&c.phone)?"call":"email";const tab=S.lt.dtab;
  const list=ltVis(),idx=list.findIndex(x=>x.id===id);
  const o=$("#overlay");const top=keep&&o.querySelector(".drawer")?o.querySelector(".drawer").scrollTop:0;
  const tags=[ltPriPill(c.priority),`<span class="pill grey">${esc(c.lane)}</span>`,`<span class="pill grey">${esc(c.zone_label||c.town)}</span>`,`<span class="pill grey">${c.storefront?"Storefront":"Online"}</span>`,c.gatekeeper?`<span class="pill grey">Gatekeeper: ${esc(c.gatekeeper)}</span>`:"",c.verified?`<span class="pill green">Contact verified</span>`:`<span class="pill sand">Verify the contact first</span>`,c.added==="LEAD contact list"?`<span class="pill green">Warm: already in a LEAD conversation</span>`:"",c.flag?`<span class="pill red">${esc(c.flag)}</span>`:""].join("");
  const kv=[["Best route",`<b>${esc(LT_CHL[ch])}</b>${c.hours?" · "+esc(c.hours):""}`],["Why they fit",esc(c.why_fit)],["Background",esc(c.hook)],c.edu_tie&&c.edu_tie!=="none found"?["Kids / schools",esc(c.edu_tie)]:null,c.notes?["Notes",esc(c.notes)]:null,c.owned_by?["Owned by",esc(c.owned_by)]:null,c.ages?["Ages served",esc(c.ages)]:null].filter(x=>x&&x[1]);
  const msg=tab==="email"?{t:`Subject: ${c.email_subject}\n\n${c.email_body}`,a:`${c.email?`<a class="btn pri" href="${ltMail(c)}">Open in mail ↗</a>`:""}<button class="btn" data-copy="email">Copy email</button><button class="btn" data-copy="subject">Copy subject</button>`}
    :tab==="call"?{t:c.call_script,a:`${c.phone?`<a class="btn pri" href="tel:${esc(c.phone.replace(/[^\d+]/g,""))}">Call ${esc(c.phone)}</a>`:""}<button class="btn" data-copy="call">Copy script</button>`}
    :tab==="dm"?{t:c.dm_text,a:`<button class="btn" data-copy="dm">Copy DM</button>`}
    :{t:c.letter,a:`<button class="btn pri" data-act="lt-docx">Download letter (.docx)</button><button class="btn" data-copy="letter">Copy letter</button>`,n:"Libertas template #5, blanks left for them. Bring it to the meeting with the one-pager and fill it in together."};
  const pbox=p?`<div class="lt-pbox"><span>In People &amp; orgs as <b>${esc(p.name)}</b> ${statusPill(p.status)}</span><span class="sp"></span>${["promised","signed"].includes(st)&&["Prospect","Contacted"].includes(p.status)?`<button class="btn sm" data-act="lt-mark-sup">Mark "Supports us"</button>`:""}<button class="btn sm" data-act="lt-person">Open</button></div>`
    :["replied","meeting","promised","signed"].includes(st)?`<div class="lt-pbox"><span class="muted">Not in People &amp; orgs yet.</span><span class="sp"></span><button class="btn sm" data-act="lt-promote">Add to People &amp; orgs</button></div>`:"";
  o.innerHTML=`<div class="scrim"></div><div class="drawer lt-dr" id="ltDrawer" role="dialog" aria-label="${esc(c.name)}">
    <div class="top"><div><h2>${esc(c.name)}</h2><div class="muted small">${esc([c.person,c.role].filter(Boolean).join(" · ")||"No contact name on file")}</div></div><button class="x" data-act="lt-close" aria-label="Close">×</button></div>
    <div class="chips lt-tags">${tags}</div>
    ${ltLinks(c)}
    <div class="kv">${kv.map(([k,v])=>`<div>${k}</div><div>${v}</div>`).join("")}</div>
    ${pbox}
    <div class="subnav lt-dtabs">${[["email","Email"],["call",c.storefront?"Walk-in / call":"Call"],["dm","DM"],["letter","Letter"]].map(([k,l])=>`<button data-dt="${k}" aria-pressed="${tab===k}">${l}</button>`).join("")}</div>
    <div class="lt-msg">${esc(msg.t)}</div><div class="acts" style="margin-top:8px">${msg.a}</div>${msg.n?`<p class="muted small">${msg.n}</p>`:""}
    <h3 class="lt-h3">Status</h3>
    <div class="stpick" id="ltSt">${LT_ST.map(s=>`<button data-s="${s[0]}" aria-pressed="${st===s[0]}"><i style="background:${s[2]}"></i>${s[1]}</button>`).join("")}</div>
    <div class="lt-meta">${d.at?`<span>Last touched ${fmtDate(d.at)} (${rel(daysFromToday(d.at))})</span>`:"<span>Not touched yet</span>"}<label>Meeting <input type="date" id="ltMeet" value="${esc(d.meet||"")}"></label></div>
    <h3 class="lt-h3">Notes</h3>
    <textarea id="ltNote" class="lt-note" placeholder="Who you spoke to, what they said, when to come back…">${esc(d.note||"")}</textarea>
    <p class="muted small">Source: ${c.source?`<a href="${esc(c.source)}" target="_blank" rel="noopener">${esc(String(c.source).replace(/^https?:\/\/(www\.)?/,"").slice(0,70))}</a>`:"—"}${c.added?` · added ${esc(c.added)}`:""}</p>
    <div class="acts">${c.custom?`<button class="btn sm danger" data-act="lt-del">Delete</button>`:""}<span class="sp"></span><button class="btn sm" data-act="lt-prev" ${idx<=0?"disabled":""}>‹ Prev</button><button class="btn sm" data-act="lt-next" ${idx<0||idx>=list.length-1?"disabled":""}>Next ›</button></div>
  </div>`;
  const dr=$("#ltDrawer");if(top)dr.scrollTop=top;
  const close=()=>{closeOverlay();S.lt.sel=null;document.querySelectorAll(".lt-table tr.sel").forEach(t=>t.classList.remove("sel"));};
  o.querySelector(".scrim").addEventListener("click",close);dr.querySelector("[data-act='lt-close']").addEventListener("click",close);
  dr.querySelectorAll("[data-dt]").forEach(b=>b.addEventListener("click",()=>{S.lt.dtab=b.dataset.dt;ltDrawer(id,true);}));
  dr.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.copy;const t=k==="email"?`Subject: ${c.email_subject}\n\n${c.email_body}`:k==="subject"?c.email_subject:k==="call"?c.call_script:k==="dm"?c.dm_text:c.letter;copyText(t,{email:"Email",subject:"Subject",call:"Script",dm:"DM",letter:"Letter"}[k]+" copied");}));
  dr.querySelectorAll("#ltSt button").forEach(b=>b.addEventListener("click",async()=>{if(S.canWrite===false){toast("Read only");return;}const s=b.dataset.s;const patch={status:s,at:todayISO()};if(await ltSet(id,patch)){ltDrawer(id,true);if(S.tab==="letters")render();}}));
  const nt=$("#ltNote");let tm;const saveNote=()=>{clearTimeout(tm);const v=nt.value;if(v!==(ltDoc(id).note||""))ltSet(id,{note:v});};nt.addEventListener("input",()=>{clearTimeout(tm);tm=setTimeout(saveNote,900);});nt.addEventListener("change",saveNote);nt.addEventListener("blur",saveNote);
  $("#ltMeet").addEventListener("change",async e=>{const v=e.target.value;const p={meet:v};if(v&&!["meeting","promised","signed"].includes(ltSt(c))){p.status="meeting";p.at=todayISO();}if(await ltSet(id,p)){ltDrawer(id,true);if(S.tab==="letters")render();}});
  const on=(a,fn)=>{const el=dr.querySelector(`[data-act='${a}']`);if(el)el.addEventListener("click",fn);};
  on("lt-docx",()=>ltDocx(c));on("lt-promote",()=>ltPromote(c));on("lt-person",()=>{closeOverlay();openDetail(p.id);});on("lt-mark-sup",async()=>{await ltMarkSupporter(p);ltDrawer(id,true);});
  on("lt-prev",()=>{saveNote();ltDrawer(list[idx-1].id);});on("lt-next",()=>{saveNote();ltDrawer(list[idx+1].id);});
  on("lt-del",async()=>{if(!confirm(`Delete ${c.name}?`))return;await ltSet(id,{deleted:true});close();toast("Deleted");render();});}

/* ---------- .docx (store-only zip, no libraries) ---------- */
const LT_CRC=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c;}return t;})();
function ltCrc(u){let c=-1;for(let i=0;i<u.length;i++)c=LT_CRC[(c^u[i])&255]^(c>>>8);return (c^-1)>>>0;}
function ltZip(files){const enc=new TextEncoder(),parts=[],cd=[];let off=0;const u16=v=>[v&255,(v>>8)&255],u32=v=>[v&255,(v>>8)&255,(v>>16)&255,(v>>>24)&255];
  for(const f of files){const n=enc.encode(f.name),d=f.data,c=ltCrc(d);const lh=new Uint8Array([0x50,0x4b,3,4,...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0)]);
    parts.push(lh,n,d);cd.push(new Uint8Array([0x50,0x4b,1,2,...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(c),...u32(d.length),...u32(d.length),...u16(n.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(off)]),n);off+=lh.length+n.length+d.length;}
  const cdLen=cd.reduce((a,b)=>a+b.length,0);const end=new Uint8Array([0x50,0x4b,5,6,...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cdLen),...u32(off),...u16(0)]);
  return new Blob([...parts,...cd,end],{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});}
async function ltDocx(c){const x=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const body=c.letter.split("\n\n").map(p=>`<w:p><w:pPr><w:spacing w:after="200" w:line="276" w:lineRule="auto"/></w:pPr>`+p.split("\n").map((l,i)=>`${i?'<w:r><w:br/></w:r>':''}<w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="23"/></w:rPr><w:t xml:space="preserve">${x(l)}</w:t></w:r>`).join("")+`</w:p>`).join("");
  const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1296" w:right="1440" w:bottom="1296" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;
  const e=new TextEncoder();const blob=ltZip([{name:"[Content_Types].xml",data:e.encode(ct)},{name:"_rels/.rels",data:e.encode(rels)},{name:"word/document.xml",data:e.encode(doc)}]);
  const name=`Letter of Support - ${c.name.replace(/[^\w\- ]+/g,"").trim()}.docx`;
  if(LOCAL){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},800);return;}
  const dcap=await useCap("downloads");if(!dcap){toast("Saving files isn't available in this view.");return;}
  try{await dcap.save({filename:name,data:blob});toast("Letter saved");}catch(err){if(err&&err.code==="declined")return;toast("Couldn't save the letter. Try again.");}}

/* ---------- sheets ---------- */
function ltReport(){const L=ltAll(),cnt=k=>L.filter(c=>ltSt(c)===k).length,signed=cnt("signed"),prom=cnt("promised"),asked=L.filter(c=>ltSt(c)!=="new").length,goal=ltGoal(),gala=ltGala();
  const names=k=>L.filter(c=>ltSt(c)===k).map(c=>"• "+c.name+(c.person?" ("+c.person+")":"")).join("\n");
  return `Libertas letters of support: update ${fmtLong(todayISO())}\n\nGoal: ${goal} letters by the Gala (${fmtDate(gala)}).\nSigned: ${signed}\nPromised (collecting): ${prom}\nMeetings set: ${cnt("meeting")}\nReplied, in conversation: ${cnt("replied")}\nAsked so far: ${asked} of ${L.length} contacts\nDeclined: ${cnt("declined")}\n${signed?`\nSigned:\n${names("signed")}\n`:""}${prom?`\nPromised:\n${names("promised")}\n`:""}\nNext: ${daysFromToday(LT.meta.phases[1].from)>0?"finishing in-person and online asks before "+fmtDate(LT.meta.phases[1].from)+", then: "+(LT.meta.phases[1].label||"following up")+".":"collecting signed letters and following up on the rest before the Gala."}\n\n${ME().first}`;}
function ltReportSheet(){const t=ltReport();openSheet("Update for Kelly",`<div class="lt-msg">${esc(t)}</div>`,{btns:`<button class="btn pri" id="ltRc">Copy</button><a class="btn" href="mailto:?subject=${encodeURIComponent("Libertas letters of support: update")}&body=${encodeURIComponent(t)}">Open in mail ↗</a><button class="btn ghost" data-close="1">Close</button>`});document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));$("#ltRc").addEventListener("click",()=>copyText(t,"Update copied"));}
function ltHelp(){openSheet("How to work it",`<div class="lt-help">${LT.meta.help.map(p=>`<p>${p}</p>`).join("")}</div>`);}
function ltGoalSheet(){const st=S.settings||{},ev=ltGalaEv();openSheet("Goal & Gala date",`<div class="fields"><div class="f"><label for="ltG">Letters to collect</label><input type="number" id="ltG" min="1" value="${ltGoal()}"></div><div class="f"><label for="ltD">Gala date</label><input type="date" id="ltD" value="${esc(ltGala())}"></div></div><p class="muted small" style="margin-top:10px">${ev?`The date comes from "${esc(ev.name)}" in Events unless you set one here.`:"Add the Gala to Events and the date follows it."}</p>`,{btns:`<button class="btn pri" id="ltGs">Save</button>${st.ltGala?`<button class="btn" id="ltGr">Use the Events date</button>`:""}<button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  $("#ltGs").addEventListener("click",async()=>{const g=+$("#ltG").value||LT.meta.goal,dd=$("#ltD").value;const n={...(S.settings||{}),ltGoal:g};if(dd&&dd!==(ev?ev.date:LT.meta.gala))n.ltGala=dd;else delete n.ltGala;if(await write("meta","settings",n)){closeOverlay();toast("Saved");}});
  const r=$("#ltGr");if(r)r.addEventListener("click",async()=>{const n={...(S.settings||{})};delete n.ltGala;if(await write("meta","settings",n)){closeOverlay();toast("Following the Events date");}});}
function ltAddForm(){const towns=[...new Set(LT.contacts.map(c=>c.town))].sort();
  openSheet("Add a contact",`<div class="fields"><div class="f wide"><label for="la1">Business or organization</label><input id="la1"></div><div class="f"><label for="la2">Person</label><input id="la2"></div><div class="f"><label for="la3">Role</label><input id="la3" placeholder="Owner, director…"></div><div class="f"><label for="la4">Email</label><input id="la4" type="email"></div><div class="f"><label for="la5">Phone</label><input id="la5"></div><div class="f wide"><label for="la6">Address</label><input id="la6"></div><div class="f"><label for="la7">Town</label><input id="la7" list="laT" value="Hartford"><datalist id="laT">${towns.map(t=>`<option value="${esc(t)}">`).join("")}</datalist></div><div class="f"><label for="la8">Priority</label><select id="la8"><option>A</option><option selected>B</option><option>C</option></select></div><div class="f wide"><label for="la9">Background (how you know them, why they fit)</label><textarea id="la9"></textarea></div><label class="f wide" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="la10" style="width:auto"> Storefront (walk in)</label></div><p class="muted small" style="margin-top:8px">The email, script and DM fill in from the standard ask. Add the recognition and commendation lines yourself.</p>`,{btns:`<button class="btn pri" id="laS">Add</button><button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  $("#laS").addEventListener("click",async()=>{const name=$("#la1").value.trim();if(!name){toast("Add a name");return;}const id=uid("lc");
    const ok=await ltSet(id,{custom:true,name,person:$("#la2").value.trim(),role:$("#la3").value.trim(),email:$("#la4").value.trim(),phone:$("#la5").value.trim(),address:$("#la6").value.trim(),town:$("#la7").value.trim()||"Hartford",priority:$("#la8").value,hook:$("#la9").value.trim(),storefront:$("#la10").checked,createdAt:todayISO()});
    if(ok){closeOverlay();toast("Added");render();ltDrawer(id);}});}
function ltCSV(){const cols=["name","person","role","lane","town","priority","status","last_touched","meeting","email","phone","address","notes"];
  return [cols.join(",")].concat(ltSort(ltAll()).map(c=>{const d=ltDoc(c.id);return [c.name,c.person,c.role,c.lane,c.town,c.priority,LT_SM[ltSt(c)][1],d.at||"",d.meet||"",c.email,c.phone,c.address,d.note||""].map(csvCell).join(",");})).join("\n");}

/* ---------- binding ---------- */
function ltBind(v){if(S.tab!=="letters")return;
  v.querySelectorAll("[data-act]").forEach(el=>{const a=el.dataset.act;if(!/^lt-/.test(a))return;const k=el.dataset.k,on=fn=>el.addEventListener("click",e=>{if(e.target.closest("[data-stop]"))return;fn(e);});
    if(a==="lt-tile")on(()=>{if(k==="all")ltClear();else if(k==="A")S.lt.A=!S.lt.A;else S.lt.status=S.lt.status===k?"":k;S.lt.n=150;render();});
    else if(a==="lt-bar")on(()=>{const dm=el.dataset.dim;S.lt[dm]=S.lt[dm]===k?"":k;S.lt.n=150;render();});
    else if(a==="lt-zone"){const f=()=>{S.lt.zone=S.lt.zone===k?"":k;S.lt.n=150;render();};el.addEventListener("click",f);el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();f();}});}
    else if(a==="lt-status")on(()=>{S.lt.status=S.lt.status===k?"":k;render();});
    else if(a==="lt-f")el.addEventListener("change",()=>{S.lt[k]=el.value;S.lt.n=150;render();});
    else if(a==="lt-q")el.addEventListener("input",()=>{S.lt.q=el.value.trim();render();});
    else if(a==="lt-sub")on(()=>{S.lt.sub=k;ltSave();render();});
    else if(a==="lt-clear")on(()=>{ltClear();render();});
    else if(a==="lt-more")on(()=>{S.lt.n=9999;render();});
    else if(a==="lt-open")on(()=>ltDrawer(el.dataset.id));
    else if(a==="lt-add")on(ltAddForm);else if(a==="lt-report")on(ltReportSheet);else if(a==="lt-help")on(ltHelp);else if(a==="lt-goal")on(ltGoalSheet);
    else if(a==="lt-csv")on(()=>copyOrDl(ltCSV(),"libertas-letters-"+todayISO()+".csv","Progress copied as CSV"));
    else if(a==="lt-import")on(ltImportFile);
    else if(a==="lt-old-in")on(()=>{const x=ltOldLocal();if(x)ltImportState(x.o);});
    else if(a==="lt-old-skip")on(()=>{try{localStorage.setItem(LT_OLD_DONE,"1");}catch(e){}render();});
  });}
document.addEventListener("click",e=>{const x=e.target.closest&&e.target.closest("[data-ltopen]");if(!x)return;e.preventDefault();e.stopPropagation();const id=x.dataset.ltopen;if(S.tab!=="letters")go("letters");ltDrawer(id);},true);


/* ============ Canvass lock: signer and canvasser details behind a second password (Nov 5) ============ */
const CVL_LOCK=(typeof CV_LOCK!=="undefined"&&CV_LOCK)?CV_LOCK:null;
let CVL_OPEN=!CVL_LOCK,CVL_TEAM=null;
const CVL_KEY=CVL_LOCK?"lead_hub_sg_"+CVL_LOCK.salt:"";
function cvlB64(s){const b=atob(s),u=new Uint8Array(b.length);for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u;}
function cvlTo64(buf){const u=new Uint8Array(buf);let s="";for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);}
async function cvlOpenWith(key){const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:cvlB64(CVL_LOCK.iv)},key,cvlB64(CVL_LOCK.data));
  const o=JSON.parse(await new Response(new Blob([pt]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
  CV.signers.splice(0,CV.signers.length,...(o.signers||[]));CVL_TEAM=o.team||{};CVL_OPEN=true;render();}
async function cvlUnlock(pw,keep){const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);
  const key=await crypto.subtle.deriveKey({name:"PBKDF2",salt:cvlB64(CVL_LOCK.salt),iterations:CVL_LOCK.it,hash:"SHA-256"},base,{name:"AES-GCM",length:256},true,["decrypt"]);
  await cvlOpenWith(key);if(keep){try{localStorage.setItem(CVL_KEY,cvlTo64(await crypto.subtle.exportKey("raw",key)));}catch(e){}}}
function cvlForget(){try{localStorage.removeItem(CVL_KEY);}catch(e){}CV.signers.splice(0);CVL_TEAM=null;CVL_OPEN=false;closeOverlay();render();toast("Canvass details locked on this device");}
function cvlSheet(){openSheet("Unlock Canvass",`<p class="small muted">The names, addresses and phones of the ${CVL_LOCK.n.toLocaleString()} people who signed, and the canvassers' contact details, are behind a second password.</p><div class="fields"><div class="f wide"><label for="sgPw">Canvass password</label><input type="password" id="sgPw" autocomplete="off"></div></div><label style="display:flex;gap:8px;align-items:center;margin-top:10px;font-size:14px"><input type="checkbox" id="sgKeep" style="width:auto"> Keep unlocked on this device</label><p class="small" id="sgErr" style="color:var(--red);min-height:18px;margin-top:8px"></p>`,{btns:`<button class="btn pri" id="sgGo">Unlock</button><button class="btn ghost" data-close="1">Cancel</button>`});
  document.querySelectorAll("#overlay [data-close]").forEach(b=>b.addEventListener("click",closeOverlay));
  const go=async()=>{const b=$("#sgGo");b.disabled=true;b.textContent="Unlocking…";try{await cvlUnlock($("#sgPw").value,$("#sgKeep").checked);closeOverlay();toast("Canvass unlocked");}catch(e){b.disabled=false;b.textContent="Unlock";$("#sgErr").textContent="That password didn't work.";}};
  $("#sgGo").addEventListener("click",go);$("#sgPw").addEventListener("keydown",e=>{if(e.key==="Enter")go();});setTimeout(()=>{const i=$("#sgPw");if(i)i.focus();},50);}
if(CVL_LOCK){
  rCanvass=(orig=>function(){if(!CVL_OPEN)return `<div class="sg-lock"><div class="sg-ic" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg></div><h2>Canvass is locked</h2><p>${CVL_LOCK.n.toLocaleString()} signers' names, addresses and phones, and the canvassers' contact details, need the Canvass password.</p><button class="btn pri" data-sgunlock="1">Unlock Canvass</button></div>`;
    return orig()+`<p class="small muted sg-open">Canvass is unlocked on this device · <a href="#" data-sgforget="1">Lock it</a></p>`;})(rCanvass);
  render=(orig=>function(){if(CVL_OPEN&&CVL_TEAM)S.team.forEach(c=>{const t=CVL_TEAM[c.id];if(t){if(!c.phone&&t.phone)c.phone=t.phone;if(!c.email&&t.email)c.email=t.email;}});return orig();})(render);
  document.addEventListener("click",e=>{const t=e.target;if(!t.closest)return;if(t.closest("[data-sgunlock]")){e.preventDefault();cvlSheet();return;}if(t.closest("[data-sgforget]")){e.preventDefault();cvlForget();}});
  $("#addBtn").addEventListener("click",e=>{if(S.tab==="team"&&!CVL_OPEN){e.stopImmediatePropagation();cvlSheet();}},true);
  (()=>{let saved=null;try{saved=localStorage.getItem(CVL_KEY);}catch(e){}if(saved)crypto.subtle.importKey("raw",cvlB64(saved),{name:"AES-GCM"},false,["decrypt"]).then(cvlOpenWith).catch(()=>{try{localStorage.removeItem(CVL_KEY);}catch(e){}});})();
}



/* ============ team edition: levels, views and centers (set up before the hub starts) ============ */
const OWNER_ONLY_TABS=["hours","log","settings"];
function fbSetupViews(){
  if(!FB)return;
  const allTabs=[...document.querySelectorAll(".appstrip [data-tab]")].map(b=>b.dataset.tab);
  VIEWS.trial={label:"Trial",hide:[...new Set(VIEWS.canv.hide)]};
  VIEW_NOTE.trial="Trial view: what someone on a trial period sees.";
  const ok=new Set([...(FB.pages||[]),"today","home"]);
  VIEWS.special={label:"Special assignment",hide:allTabs.filter(t=>!ok.has(t))};
  if(!FB.owner)for(const k of Object.keys(VIEWS))VIEWS[k].hide=[...new Set([...VIEWS[k].hide,...OWNER_ONLY_TABS])];
  let savedView=null;try{savedView=localStorage.getItem(VKEY);}catch(e){}
  if(!savedView||!FB.views.includes(S.view))S.view=FB.views[0];
  document.querySelectorAll("[data-viewsel]").forEach(sel=>{sel.innerHTML=FB.views.map(k=>`<option value="${k}">${esc((VIEWS[k]||{}).label||k)}</option>`).join("");const lab=sel.closest(".viewpick,.viewsw");if(lab)lab.hidden=FB.views.length<2;});
  if(S.cv)S.cv.center=FB.cvCenter||"all";
  const sm=document.querySelector(".brand-txt small");if(sm)sm.textContent=FB.centerLabel||"";
}
fbSetupViews();

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
    ["playbook","log","center"].forEach(id=>{const b=btn[id];if(b&&b.firstChild&&b.firstChild.nodeType===3)b.firstChild.nodeValue=TITLES[id]+" ";});
    const groups=[["Campaign",["today"]],...TM_SECTIONS.map(s=>[s.name,s.apps]),["My role",TM_ROLE_APPS],["Tools & resources",["resources",...TM_TOOL_APPS]]];
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
    cards.push(tmMetric({l:"Next event",v:ne?esc(daysFromToday(ne.date)===0?"Today":daysFromToday(ne.date)===1?"Tomorrow":MON[d.getMonth()]+" "+d.getDate()):"—",s:ne?esc((ne.name||"Event")+(ne.time?" · "+ne.time:"")+" · "+townOf(ne)):"Nothing on the calendar yet",act:ne?"ev-next":"",go:ne?"":"events",tc:"gold"}));}
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

/* ---------- Approved events: what LEAD said yes to, coming up, with readiness ---------- */
function tmEventTileRd(e){const d=rdForEvent(e.id),sc=d?rdScore(d):null;
  return tmEventTile(e).replace('<button class="ev-tile"','<div class="ev-tile has-acts"').replace(/<\/button>$/,'')+`<span class="ev-acts"><button class="btn sm ${sc?"":"pri"}" data-act="noop" data-tm="rd" data-id="${e.id}">${sc?`Readiness ${sc.pct}%`:"Start readiness"}</button>${sc&&sc.overdue?`<span class="pill red">${sc.overdue} overdue</span>`:""}${d&&d.submittedAt?`<span class="pill green">submitted</span>`:""}${tmLeadish()&&S.canWrite!==false?`<button class="btn sm ghost" data-act="noop" data-tm="approve" data-id="${e.id}" data-on="1">Unapprove</button>`:""}</span></div>`;}
function rApproved(){
  const t0=todayISO(),E=allE().filter(e=>e.date&&(e.date>=t0||(e.end_date&&e.end_date>=t0))).sort((a,b)=>(a.date||"9")<(b.date||"9")?-1:1);
  const ok=E.filter(tmApproved),rest=E.filter(e=>!tmApproved(e)).slice(0,24);
  return `<div class="toolrow"><span class="muted small">Events LEAD said yes to. Each one gets a readiness checklist; submit it to the coordinators when it's ready.</span><span class="sp"></span><span class="small muted">${ok.length}</span></div>
  ${ok.length?`<div class="ev-grid" style="margin-top:12px">${ok.map(tmEventTileRd).join("")}</div>`:`<p class="empty">Nothing approved and coming up yet.${tmLeadish()?" Approve one below.":""}</p>`}
  ${tmLeadish()&&rest.length?`<h3 class="ev-wk">Coming up, not approved yet</h3><div class="rows">${rest.map(e=>`<div class="row" data-open="${e.id}"><div><div class="n">${esc(e.name)}</div><div class="d">${esc([fmtDate(e.date),e.time,townOf(e)].filter(Boolean).join(" · "))}</div></div><div class="r">${S.canWrite===false?"":`<button class="btn sm" data-act="noop" data-tm="approve" data-id="${e.id}" data-on="0">Approve</button>`}</div></div>`).join("")}</div>`:""}`;
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
  if(k==="help")return tmSay("bot",`I can:<ul><li>answer <b>when's the next meeting</b>, <b>what's on today</b>, <b>who's in</b>, <b>how many signatures</b></li><li><b>search</b> people, events, tasks and apps: just type a name</li><li><b>message Iris: running late</b>, or <b>message a coordinator</b></li><li><b>check me in</b> / <b>check me out</b></li><li><b>/feedback</b> for the training or demo form</li><li><b>/inquiry</b> followed by a question, to reason over the hub's data${tmAIOn()?"":" (once the owner adds the key)"}</li></ul>`);
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
  if(t==="/feedback"||t==="/help"||t.startsWith("/inquiry")||t==="/in"||t==="/out"){
    if(t==="/feedback")return tmFeedback();
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

/* ============ start ============ */
function start(saved){if(saved&&saved.tab)S.tab=saved.tab;if(saved&&saved.pb)S.pb=saved.pb;applyView();if(!tabOK(S.tab))S.tab="home";go(S.tab);boot();}
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
