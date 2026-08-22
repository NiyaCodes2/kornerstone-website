\
const STORAGE_KEY = "ksps_leads_v1";

const seedLeads = [
  {
    id:"KSPS-001",
    propertyName:"Westside Flats",
    managementCompany:"Elmington Living",
    propertyType:"Apartment",
    units:"",
    address:"",
    submarket:"Charlotte",
    contactName:"",
    email:"westsideflatsmgr@elmingtonliving.com",
    phone:"",
    status:"Warm Lead",
    followUpDate:"",
    nextAction:"Email manager for NetVendor application",
    notes:"Property cannot currently use valet trash. Keep relationship warm and learn vendor onboarding process."
  },
  {
    id:"KSPS-002",
    propertyName:"Perimeter Pointe",
    managementCompany:"",
    propertyType:"Apartment",
    units:"55",
    address:"",
    submarket:"Charlotte",
    contactName:"",
    email:"",
    phone:"",
    status:"New Lead",
    followUpDate:"",
    nextAction:"Research decision maker",
    notes:"Smaller pilot-property example."
  }
];

let leads = loadLeads();
let editingId = null;

function loadLeads(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) return JSON.parse(raw);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedLeads));
  return [...seedLeads];
}
function saveLeads(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); }
function nextId(){
  const nums = leads.map(l => parseInt((l.id||"").replace(/\D/g,"")) || 0);
  return `KSPS-${String(Math.max(0,...nums)+1).padStart(3,"0")}`;
}

const views = {
  dashboard: document.getElementById("dashboardView"),
  leads: document.getElementById("leadsView"),
  audits: document.getElementById("auditsView"),
  proposals: document.getElementById("proposalsView"),
  clients: document.getElementById("clientsView")
};
const titles = {
  dashboard:"Growth Dashboard",
  leads:"Lead Pipeline",
  audits:"Property Audits",
  proposals:"Proposal Tracker",
  clients:"Active Properties"
};

document.querySelectorAll(".nav-item").forEach(btn=>{
  btn.addEventListener("click",()=>switchView(btn.dataset.view));
});
document.querySelectorAll("[data-jump]").forEach(btn=>{
  btn.addEventListener("click",()=>switchView(btn.dataset.jump));
});

function switchView(name){
  Object.values(views).forEach(v=>v.classList.remove("active"));
  views[name].classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===name));
  document.getElementById("pageTitle").textContent=titles[name];
}

const dlg = document.getElementById("leadDialog");
document.getElementById("addLeadBtn").addEventListener("click",()=>openLead());
document.getElementById("closeDialog").addEventListener("click",()=>dlg.close());
document.getElementById("cancelLeadBtn").addEventListener("click",()=>dlg.close());

function openLead(id=null){
  editingId=id;
  const lead = id ? leads.find(l=>l.id===id) : null;
  document.getElementById("dialogTitle").textContent = lead ? "Edit Lead" : "Add Lead";
  document.getElementById("deleteLeadBtn").style.visibility = lead ? "visible" : "hidden";
  const fields=["propertyName","managementCompany","propertyType","units","address","submarket","contactName","email","phone","status","followUpDate","nextAction","notes"];
  fields.forEach(f=>{
    const el=document.getElementById(f);
    el.value=lead?.[f] ?? (f==="propertyType"?"Apartment":f==="status"?"New Lead":"");
  });
  dlg.showModal();
}

document.getElementById("leadForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const data = {};
  ["propertyName","managementCompany","propertyType","units","address","submarket","contactName","email","phone","status","followUpDate","nextAction","notes"].forEach(f=>{
    data[f]=document.getElementById(f).value.trim();
  });

  if(editingId){
    leads = leads.map(l=>l.id===editingId ? {...l,...data} : l);
  }else{
    leads.unshift({id:nextId(),...data});
  }
  saveLeads();
  renderAll();
  dlg.close();
});

document.getElementById("deleteLeadBtn").addEventListener("click",()=>{
  if(!editingId) return;
  if(confirm("Delete this lead?")){
    leads = leads.filter(l=>l.id!==editingId);
    saveLeads();
    renderAll();
    dlg.close();
  }
});

document.getElementById("searchInput").addEventListener("input", renderTable);
document.getElementById("statusFilter").addEventListener("change", renderTable);

function formatDate(v){
  if(!v) return "—";
  const d=new Date(v+"T12:00:00");
  return d.toLocaleDateString(undefined,{month:"short",day:"numeric"});
}

function renderTable(){
  const q=document.getElementById("searchInput").value.toLowerCase();
  const filter=document.getElementById("statusFilter").value;
  const rows=leads.filter(l=>{
    const hay=[l.propertyName,l.managementCompany,l.contactName,l.submarket,l.id].join(" ").toLowerCase();
    return (!q||hay.includes(q)) && (!filter||l.status===filter);
  });

  const tbody=document.getElementById("leadTableBody");
  tbody.innerHTML=rows.length?rows.map(l=>`
    <tr>
      <td><strong>${escapeHtml(l.id)}</strong></td>
      <td><strong>${escapeHtml(l.propertyName)}</strong><br><small>${escapeHtml(l.submarket||"")}</small></td>
      <td>${escapeHtml(l.managementCompany||"—")}</td>
      <td>${escapeHtml(l.units||"—")}</td>
      <td><span class="status-badge">${escapeHtml(l.status)}</span></td>
      <td>${formatDate(l.followUpDate)}</td>
      <td>${escapeHtml(l.nextAction||"—")}</td>
      <td><button class="row-action" onclick="openLead('${l.id}')">Edit</button></td>
    </tr>`).join(""):`<tr><td colspan="8">No leads found.</td></tr>`;
}

function renderDashboard(){
  document.getElementById("statLeads").textContent=leads.filter(l=>!["Signed","Not a Fit"].includes(l.status)).length;
  const today = new Date(); today.setHours(0,0,0,0);
  document.getElementById("statFollowups").textContent=leads.filter(l=>l.followUpDate && new Date(l.followUpDate+"T12:00:00")<=today).length;
  document.getElementById("statAudits").textContent=leads.filter(l=>l.status==="Audit Scheduled").length;
  document.getElementById("statProposals").textContent=leads.filter(l=>l.status==="Proposal Sent").length;

  document.getElementById("recentLeads").innerHTML=(leads.slice(0,5).map(l=>`
    <div class="mini-row">
      <div><strong>${escapeHtml(l.propertyName)}</strong><small>${escapeHtml(l.managementCompany||l.submarket||"")}</small></div>
      <span class="status-badge">${escapeHtml(l.status)}</span>
    </div>`).join("") || "<p>No leads yet.</p>");

  const followups=leads.filter(l=>l.followUpDate).sort((a,b)=>a.followUpDate.localeCompare(b.followUpDate)).slice(0,5);
  document.getElementById("followupList").innerHTML=(followups.map(l=>`
    <div class="mini-row">
      <div><strong>${escapeHtml(l.propertyName)}</strong><small>${escapeHtml(l.nextAction||"Follow up")}</small></div>
      <span>${formatDate(l.followUpDate)}</span>
    </div>`).join("") || "<p>No follow-ups scheduled yet.</p>");
}

function escapeHtml(s=""){
  return s.replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

function renderAll(){ renderTable(); renderDashboard(); }
renderAll();
