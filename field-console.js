const STORAGE_KEY = "ksps_field_audits_v1";
const SETTINGS_KEY = "ksps_pricing_settings_v1";

const DEFAULT_SETTINGS = {
  wage:20,
  burden:0.18,
  minPaidHours:2,
  maxRouteHours:2.5,
  minContribution:500,
  accountMinimum:1500,
  targetMargin:0.35,
  riskReserve:0.05,
  mileageRate:0.76,
  weeksPerMonth:4.33,
  routeOverheadHours:0.25,
  overheadAllocation:40,
  cartCost:200,
  cartLifeMonths:24,
  suppliesPerMonth:50,
  binRecoveryMonths:12,
  easyRate:100,
  standardRate:75,
  complexRate:50, addonAccountMinimum:500, addonMinContribution:250
};

let settings = loadSettings();
let currentAuditId = null;

const $ = id => document.getElementById(id);
const num = id => Number($(id)?.value || 0);
const checked = id => Boolean($(id)?.checked);
const money = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n || 0);
const money2 = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n || 0);
const pct = n => `${((n||0)*100).toFixed(1)}%`;

function loadSettings(){
  const saved = localStorage.getItem(SETTINGS_KEY);
  return saved ? {...DEFAULT_SETTINGS,...JSON.parse(saved)} : {...DEFAULT_SETTINGS};
}
function saveSettings(){
  localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));
}
function loadAudits(){
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function saveAudits(audits){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(audits));
}
function nextAuditId(){
  const audits = loadAudits();
  const max = audits.reduce((m,a)=>Math.max(m,parseInt((a.id||"").replace(/\D/g,""))||0),0);
  return `KSPS-A${String(max+1).padStart(3,"0")}`;
}

function complexity(){
  let score = 0;
  const floors = num("floors");
  score += num("spread");
  score += num("vertical");
  score += num("terrain");
  score += num("disposalDistance");
  score += num("wasteVolume");
  if(floors === 3) score += 1;
  if(floors >= 4) score += 2;
  if(checked("gated")) score += 1;
  if(checked("parking")) score += 1;
  if(checked("longBreezeways")) score += 1;
  if(checked("vehicleTransfer")) score += 1;
  if(checked("overflow")) score += 1;
  if(checked("bulkIssues")) score += 1;
  if(!checked("storageAvailable")) score += 1;

  let label, throughput;
  if(score <= 3){ label="EASY"; throughput=settings.easyRate; }
  else if(score <= 7){ label="STANDARD"; throughput=settings.standardRate; }
  else { label="COMPLEX"; throughput=settings.complexRate; }
  return {score,label,throughput};
}

function calculate(){
 const units=Math.max(1,num("units")), nights=Math.max(1,num("serviceNights")), carts=Math.max(1,num("carts")), binCost=Math.max(0,num("binCost")), startupCost=Math.max(0,num("startupCost")), binOption=$("binOption").value, accountType=$("accountType").value, cx=complexity(), serviceDaysMonth=nights*settings.weeksPerMonth;
 let productiveHours,totalLaborHours,collectors,routeHoursPerCollector,paidHoursPerCollector,paidLaborHoursPerServiceDay,miles;
 if(accountType==="addon"){totalLaborHours=Math.max(.25,num("addonHours"));productiveHours=totalLaborHours;collectors=1;routeHoursPerCollector=totalLaborHours;paidHoursPerCollector=totalLaborHours;paidLaborHoursPerServiceDay=totalLaborHours;miles=Math.max(0,num("addonMiles"));}
 else{miles=Math.max(0,num("businessMiles"));productiveHours=units/cx.throughput;totalLaborHours=productiveHours+settings.routeOverheadHours;collectors=Math.max(1,Math.ceil(totalLaborHours/settings.maxRouteHours));routeHoursPerCollector=totalLaborHours/collectors;paidHoursPerCollector=Math.max(routeHoursPerCollector,settings.minPaidHours);paidLaborHoursPerServiceDay=collectors*paidHoursPerCollector;}
 const wages=paidLaborHoursPerServiceDay*serviceDaysMonth*settings.wage,payrollBurden=wages*settings.burden,loadedLabor=wages+payrollBurden,mileage=miles*serviceDaysMonth*settings.mileageRate,cartAllocation=carts*settings.cartCost/settings.cartLifeMonths,supplies=settings.suppliesPerMonth,binRecovery=binOption==="finance"?units*binCost/settings.binRecoveryMonths:0,directCost=loadedLabor+mileage+cartAllocation+supplies+binRecovery,riskReserve=directCost*settings.riskReserve,trueCost=directCost+riskReserve+settings.overheadAllocation;
 const minContribution=accountType==="addon"?settings.addonMinContribution:settings.minContribution,accountMinimum=accountType==="addon"?settings.addonAccountMinimum:settings.accountMinimum,contributionFloor=trueCost+minContribution,marginFloor=trueCost/(1-settings.targetMargin),accountFloor=accountMinimum,pricingFloor=Math.max(contributionFloor,marginFloor,accountFloor),engineQuote=Math.ceil(pricingFloor/25)*25,overrideActive=checked("overrideToggle")&&num("overridePrice")>0,monthlyQuote=overrideActive?num("overridePrice"):engineQuote,perDoor=monthlyQuote/units,contribution=monthlyQuote-trueCost,margin=monthlyQuote?contribution/monthlyQuote:0,annualValue=monthlyQuote*12,upfrontBins=binOption==="property"?units*binCost:0,implementationFee=100+startupCost+upfrontBins,healthy=contribution>=minContribution&&margin>=settings.targetMargin&&monthlyQuote>=accountMinimum,belowEngine=overrideActive&&monthlyQuote<engineQuote;
 return {...cx,accountType,units,nights,carts,miles,productiveHours,totalLaborHours,collectors,routeHoursPerCollector,paidHoursPerCollector,paidLaborHoursPerServiceDay,serviceDaysMonth,wages,payrollBurden,loadedLabor,mileage,cartAllocation,supplies,binRecovery,directCost,riskReserve,trueCost,contributionFloor,marginFloor,accountFloor,pricingFloor,engineQuote,monthlyQuote,perDoor,contribution,margin,annualValue,implementationFee,healthy,overrideActive,belowEngine,minContribution,accountMinimum};
}
function updateQuote(){
  const r = calculate();
  $("complexityLabel").textContent = r.label;
  $("complexityMeta").textContent = `Score ${r.score} • ${r.throughput} doors / labor-hour`;
  $("scoreFill").style.width = `${Math.min(100,12 + r.score*8)}%`;
  $("laborHours").textContent = `${r.totalLaborHours.toFixed(1)} h`;
  $("collectors").textContent = r.collectors;
  $("collectorWhy").textContent = `${r.routeHoursPerCollector.toFixed(1)} route h each • ${settings.minPaidHours} h pay floor`;
  $("paidHours").textContent = `${r.paidLaborHoursPerServiceDay.toFixed(1)} h`;
  $("daysPerMonth").textContent = r.serviceDaysMonth.toFixed(1);
  $("monthlyQuote").textContent = money(r.monthlyQuote);
  $("perDoor").textContent = money2(r.perDoor);
  $("trueCost").textContent = money(r.trueCost);
  $("contribution").textContent = money(r.contribution);
  $("margin").textContent = pct(r.margin);
  $("annualValue").textContent = money(r.annualValue);
  $("implementationFee").textContent = money(r.implementationFee);
  $("contributionFloor").textContent = money(r.contributionFloor);
  $("marginFloor").textContent = money(r.marginFloor);
  $("accountFloor").textContent = money(r.accountFloor);
  $("healthBadge").textContent = r.healthy ? "QUOTE READY" : "REVIEW ECONOMICS";
  $("healthBadge").classList.toggle("review",!r.healthy); $("addonFields").classList.toggle("hidden",$("accountType").value!=="addon"); $("overrideFields").classList.toggle("hidden",!checked("overrideToggle")); if(checked("overrideToggle")&&!$("overridePrice").value)$("overridePrice").value=r.engineQuote; $("overrideWarning").textContent=r.belowEngine?`⚠ Below engine recommendation of ${money(r.engineQuote)}. New contribution: ${money(r.contribution)} • margin: ${pct(r.margin)}.`:(r.overrideActive?`Override active. Engine recommendation: ${money(r.engineQuote)}.`:"");
}

function serializeAudit(){
  const r = calculate();
  const pains = [...document.querySelectorAll(".pain:checked")].map(x=>x.value);
  return {
    id: currentAuditId || nextAuditId(),
    savedAt:new Date().toISOString(),
    propertyName:$("propertyName").value.trim(),
    managementCompany:$("managementCompany").value.trim(),
    propertyType:$("propertyType").value,
    units:num("units"),
    address:$("address").value.trim(),
    contactName:$("contactName").value.trim(),
    contactEmail:$("contactEmail").value.trim(),
    accountType:$("accountType").value, routeCluster:$("routeCluster").value.trim(), addonHours:num("addonHours"), addonMiles:num("addonMiles"), serviceSchedule:$("serviceSchedule").value,
    serviceNights:num("serviceNights"),
    serviceWindow:$("serviceWindow").value.trim(),
    services:{
      valet:checked("svcValet"),bulk:checked("svcBulk"),support:checked("svcSupport")
    },
    layout:{
      buildings:num("buildings"),floors:num("floors"),spread:$("spread").value,vertical:$("vertical").value,
      corridor:$("corridor").value,terrain:$("terrain").value,gated:checked("gated"),
      parking:checked("parking"),longBreezeways:checked("longBreezeways")
    },
    waste:{
      disposalType:$("disposalType").value,disposalCount:num("disposalCount"),
      disposalDistance:$("disposalDistance").value,wasteVolume:$("wasteVolume").value,
      businessMiles:num("businessMiles"),carts:num("carts"),vehicleTransfer:checked("vehicleTransfer"),
      overflow:checked("overflow"),bulkIssues:checked("bulkIssues"),storageAvailable:checked("storageAvailable")
    },
    vendor:{
      existing:$("existingVendor").value,expiration:$("contractExpiration").value,pains
    },
    notes:$("notes").value.trim(),
    bins:{
      option:$("binOption").value,cost:num("binCost"),startupCost:num("startupCost"),
      equipmentNotes:$("equipmentNotes").value.trim()
    },
    quote:r
  };
}

function saveCurrentAudit(event){
  event.preventDefault();
  if(!$("propertyName").value.trim()){
    toast("Property name is required.");
    $("propertyName").focus();
    return;
  }
  const data = serializeAudit();
  currentAuditId = data.id;
  $("auditIdLabel").textContent = data.id;
  const audits = loadAudits();
  const idx = audits.findIndex(a=>a.id===data.id);
  if(idx >= 0) audits[idx] = data; else audits.unshift(data);
  saveAudits(audits);
  renderSaved();
  toast(`Saved ${data.id} • ${money(data.quote.monthlyQuote)}/month`);
}

function populateAudit(a){
  currentAuditId = a.id;
  $("auditIdLabel").textContent = a.id;
  $("propertyName").value=a.propertyName||"";
  $("managementCompany").value=a.managementCompany||"";
  $("propertyType").value=a.propertyType||"Apartment Community";
  $("units").value=a.units||150;
  $("address").value=a.address||"";
  $("contactName").value=a.contactName||"";
  $("contactEmail").value=a.contactEmail||"";
  $("accountType").value=a.accountType||"standalone"; $("routeCluster").value=a.routeCluster||""; $("addonHours").value=a.addonHours||0.5; $("addonMiles").value=a.addonMiles||1; $("serviceSchedule").value=a.serviceSchedule||"Night";
  $("serviceNights").value=a.serviceNights||4;
  $("serviceWindow").value=a.serviceWindow||"7 PM–12 AM";
  $("svcValet").checked=a.services?.valet??true;
  $("svcBulk").checked=a.services?.bulk??false;
  $("svcSupport").checked=a.services?.support??false;

  $("buildings").value=a.layout?.buildings||6;
  $("floors").value=a.layout?.floors||3;
  $("spread").value=a.layout?.spread??"1";
  $("vertical").value=a.layout?.vertical??"2";
  $("corridor").value=a.layout?.corridor||"Exterior / Garden Style";
  $("terrain").value=a.layout?.terrain??"0";
  $("gated").checked=a.layout?.gated??false;
  $("parking").checked=a.layout?.parking??false;
  $("longBreezeways").checked=a.layout?.longBreezeways??false;

  $("disposalType").value=a.waste?.disposalType||"Dumpster";
  $("disposalCount").value=a.waste?.disposalCount||1;
  $("disposalDistance").value=a.waste?.disposalDistance??"1";
  $("wasteVolume").value=a.waste?.wasteVolume??"0";
  $("businessMiles").value=a.waste?.businessMiles||0;
  $("carts").value=a.waste?.carts||2;
  $("vehicleTransfer").checked=a.waste?.vehicleTransfer??false;
  $("overflow").checked=a.waste?.overflow??false;
  $("bulkIssues").checked=a.waste?.bulkIssues??false;
  $("storageAvailable").checked=a.waste?.storageAvailable??true;

  $("existingVendor").value=a.vendor?.existing||"Unknown";
  $("contractExpiration").value=a.vendor?.expiration||"";
  document.querySelectorAll(".pain").forEach(x=>x.checked=(a.vendor?.pains||[]).includes(x.value));
  $("notes").value=a.notes||"";
  $("binOption").value=a.bins?.option||"none";
  $("binCost").value=a.bins?.cost||0;
  $("startupCost").value=a.bins?.startupCost||0;
  $("equipmentNotes").value=a.bins?.equipmentNotes||"";
  updateQuote();
  switchTab("audit");
  window.scrollTo({top:0,behavior:"smooth"});
}

function newAudit(){
  $("auditForm").reset();
  currentAuditId = nextAuditId();
  $("auditIdLabel").textContent=currentAuditId;
  $("units").value=150;
  $("accountType").value="standalone"; $("routeCluster").value=""; $("addonHours").value=0.5; $("addonMiles").value=1; $("serviceSchedule").value="Night";
  $("serviceNights").value=4;
  $("serviceWindow").value="7 PM–12 AM";
  $("svcValet").checked=true;
  $("buildings").value=6;
  $("floors").value=3;
  $("spread").value="1";
  $("vertical").value="2";
  $("terrain").value="0";
  $("disposalCount").value=1;
  $("disposalDistance").value="1";
  $("wasteVolume").value="0";
  $("businessMiles").value=0;
  $("carts").value=2;
  $("storageAvailable").checked=true;
  $("binOption").value="none";
  $("binCost").value=0;
  $("startupCost").value=0;
  updateQuote();
  switchTab("audit");
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderSaved(){
  const audits=loadAudits();
  const host=$("savedAuditList");
  if(!audits.length){
    host.innerHTML=`<div class="saved-card"><h3>No audits saved yet.</h3><div class="meta">Complete a property walkthrough and save it here.</div></div>`;
    return;
  }
  host.innerHTML=audits.map(a=>`
    <article class="saved-card">
      <div>
        <div class="meta">${a.id} • ${new Date(a.savedAt).toLocaleDateString()}</div>
        <h3>${escapeHtml(a.propertyName||"Untitled Property")}</h3>
        <div class="meta">${a.units||0} units • ${a.quote?.label||""} • ${a.quote?.collectors||1} collector${(a.quote?.collectors||1)>1?"s":""}</div>
      </div>
      <div class="quote">${money(a.quote?.monthlyQuote||0)} <span class="meta">/ mo</span></div>
      <div class="meta">${money2(a.quote?.perDoor||0)}/door • ${pct(a.quote?.margin||0)} margin</div>
      <div class="card-actions">
        <button onclick="openAudit('${a.id}')">Open</button>
        <button onclick="copySaved('${a.id}')">Copy Quote</button>
        <button onclick="deleteAudit('${a.id}')">Delete</button>
      </div>
    </article>
  `).join("");
}

function openAudit(id){
  const a=loadAudits().find(x=>x.id===id);
  if(a) populateAudit(a);
}
function deleteAudit(id){
  if(!confirm("Delete this saved audit from this device?")) return;
  saveAudits(loadAudits().filter(a=>a.id!==id));
  renderSaved();
  toast("Audit deleted.");
}
async function copySaved(id){
  const a=loadAudits().find(x=>x.id===id);
  if(!a) return;
  await navigator.clipboard.writeText(summaryText(a));
  toast("Quote summary copied.");
}
function summaryText(a=serializeAudit()){
  return `KSPS PROPERTY QUOTE SUMMARY
${a.propertyName || "Property"}
${a.units} serviceable units
${a.serviceNights} service days/week • ${a.serviceSchedule}
Route complexity: ${a.quote.label} (score ${a.quote.score})
Estimated labor: ${a.quote.totalLaborHours.toFixed(1)} labor-hours/service day
Recommended collectors: ${a.quote.collectors}
Suggested monthly quote: ${money(a.quote.monthlyQuote)}
Suggested per-door rate: ${money2(a.quote.perDoor)}
One-time implementation: ${money(a.quote.implementationFee)}
Projected monthly contribution: ${money(a.quote.contribution)}
Projected margin: ${pct(a.quote.margin)}

INTERNAL ESTIMATE — subject to final KSPS proposal and contract terms.`;
}

function clientSummaryText(a=serializeAudit()){return `KORNERSTONE PROPERTY SOLUTIONS\nPROPERTY WASTE SERVICE PROPOSAL\n\nPrepared for: ${a.propertyName||"Property"}\nFrequency: ${a.serviceNights} service days/week\nService Window: ${a.serviceWindow}\nServiceable Residences: ${a.units}\n\nMONTHLY SERVICE INVESTMENT: ${money(a.quote.monthlyQuote)}\n${money2(a.quote.perDoor)} per residence/month\nONE-TIME IMPLEMENTATION: ${money(a.quote.implementationFee)}\n\nPricing valid for 30 days and subject to final property verification and an executed service agreement.`;}
function generateClientQuote(){const a=serializeAudit();$("pProperty").textContent=a.propertyName||"Property";$("pDate").textContent=new Date().toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});$("pProposalId").textContent=a.id;$("pFrequency").textContent=`${a.serviceNights} service days / week`;$("pWindow").textContent=a.serviceWindow||a.serviceSchedule;$("pUnits").textContent=a.units.toLocaleString();$("pMonthly").textContent=money(a.quote.monthlyQuote);$("pPerDoor").textContent=`${money2(a.quote.perDoor)} per serviceable residence / month`;$("pImplementation").textContent=money(a.quote.implementationFee);$("quoteModal").classList.remove("hidden");document.body.style.overflow="hidden";}
function closeClientQuote(){$("quoteModal").classList.add("hidden");document.body.style.overflow="";}
function escapeHtml(s=""){
  return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}
function toast(msg){
  $("toast").textContent=msg;
  $("toast").classList.add("show");
  clearTimeout(window._toast);
  window._toast=setTimeout(()=>$("toast").classList.remove("show"),2300);
}
function switchTab(name){
  document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===name));
  $(name).classList.add("active");
  if(name==="saved") renderSaved();
  if(name==="settings") populateSettings();
}

function populateSettings(){
  const map={
    sWage:"wage",sBurden:"burden",sMinPaid:"minPaidHours",sMaxRoute:"maxRouteHours",
    sMinContribution:"minContribution",sAccountMin:"accountMinimum",sMargin:"targetMargin",
    sRisk:"riskReserve",sMileage:"mileageRate",sWeeks:"weeksPerMonth",sRouteOverhead:"routeOverheadHours",
    sOverhead:"overheadAllocation",sCartCost:"cartCost",sCartLife:"cartLifeMonths",
    sSupplies:"suppliesPerMonth",sBinRecovery:"binRecoveryMonths",sEasyRate:"easyRate",
    sStandardRate:"standardRate",sComplexRate:"complexRate"
  };
  for(const [id,key] of Object.entries(map)) $(id).value=settings[key];
}
function readSettings(){
  const map={
    sWage:"wage",sBurden:"burden",sMinPaid:"minPaidHours",sMaxRoute:"maxRouteHours",
    sMinContribution:"minContribution",sAccountMin:"accountMinimum",sMargin:"targetMargin",
    sRisk:"riskReserve",sMileage:"mileageRate",sWeeks:"weeksPerMonth",sRouteOverhead:"routeOverheadHours",
    sOverhead:"overheadAllocation",sCartCost:"cartCost",sCartLife:"cartLifeMonths",
    sSupplies:"suppliesPerMonth",sBinRecovery:"binRecoveryMonths",sEasyRate:"easyRate",
    sStandardRate:"standardRate",sComplexRate:"complexRate"
  };
  for(const [id,key] of Object.entries(map)) settings[key]=Number($(id).value);
  saveSettings();
  updateQuote();
  toast("Pricing assumptions saved.");
}

document.querySelectorAll(".tab").forEach(t=>t.addEventListener("click",()=>switchTab(t.dataset.tab)));
document.querySelectorAll("#auditForm input,#auditForm select,#auditForm textarea").forEach(el=>{
  el.addEventListener("input",updateQuote);
  el.addEventListener("change",updateQuote);
});
$("auditForm").addEventListener("submit",saveCurrentAudit);
$("resetAudit").addEventListener("click",newAudit);
$("newAuditTop").addEventListener("click",newAudit);
$("newAuditSaved").addEventListener("click",newAudit);
$("saveSettings").addEventListener("click",readSettings);
$("copySummary").addEventListener("click",async()=>{
  await navigator.clipboard.writeText(summaryText());
  toast("Internal quote summary copied.");
});
$("generateQuote").addEventListener("click",generateClientQuote); $("closeQuote").addEventListener("click",closeClientQuote); $("printQuote").addEventListener("click",()=>window.print()); $("copyClientQuote").addEventListener("click",async()=>{await navigator.clipboard.writeText(clientSummaryText());toast("Client quote summary copied.");});

currentAuditId=nextAuditId();
$("auditIdLabel").textContent=currentAuditId;
populateSettings();
updateQuote();
renderSaved();

window.openAudit=openAudit;
window.deleteAudit=deleteAudit;
window.copySaved=copySaved;
