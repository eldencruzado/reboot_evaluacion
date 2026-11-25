(() => {
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const STORAGE_KEY = "reboot_history_v1";
let lang = localStorage.getItem("reboot_lang") || "es";
let currentView = "dashboard";
let wizard = {category:"slow",step:0,answers:[]};
let lastResult = null;
let history = loadHistory();
let toastTimer;

function t(key){return (window.REBOOT_I18N[lang]||window.REBOOT_I18N.es)[key] || key}
function loadHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}}
function saveHistory(){localStorage.setItem(STORAGE_KEY,JSON.stringify(history))}
function showToast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
function setView(view){currentView=view;$$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("#pageCrumb").textContent=view.toUpperCase();$("#sidebar").classList.remove("open");if(view==="diagnosis")renderWizard();if(view==="solutions")renderSolutions();if(view==="history")renderHistory();if(view==="dashboard")renderDashboard();window.scrollTo({top:0,behavior:"smooth"})}
function applyLanguage(){document.documentElement.lang=lang;$$("[data-i18n]").forEach(el=>{const key=el.dataset.i18n;if(t(key))el.textContent=t(key)});$$("[data-i18n-placeholder]").forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));$("#languageButton").innerHTML=(lang==="es"?"ES":"EN")+" <span>⌄</span>";renderDashboard();if(currentView==="diagnosis")renderWizard();if(currentView==="solutions")renderSolutions();if(currentView==="history")renderHistory()}
function categoryName(id){const c=REBOOT_DIAGNOSTICS.categories[id];return c?.[lang]||c?.es||id}
function dateLabel(date){return new Intl.DateTimeFormat(lang==="es"?"es-CL":"en-US",{dateStyle:"medium",timeStyle:"short"}).format(new Date(date))}
function severityLabel(s){return lang==="es"?({low:"BAJA",medium:"MEDIA",high:"ALTA"}[s]||"MEDIA"):({low:"LOW",medium:"MEDIUM",high:"HIGH"}[s]||"MEDIUM")}
function renderDashboard(){
  $("#statTotal").textContent=history.length;
  $("#statIssues").textContent=history.filter(x=>x.issue).length;
  $("#statResolved").textContent=history.filter(x=>x.resolved).length;
  $("#statLast").textContent=history[0]?new Intl.DateTimeFormat(lang==="es"?"es-CL":"en-US",{dateStyle:"short"}).format(new Date(history[0].date)):"—";
  const host=$("#dashboardHistory");
  if(!history.length){host.innerHTML=`<div class="empty-state"><span>◷</span><strong>${t("noDiagnoses")}</strong><p>${t("startFirst")}</p></div>`;return}
  host.innerHTML=history.slice(0,4).map(item=>`<div class="recent-item"><span class="recent-icon">${REBOOT_DIAGNOSTICS.categories[item.category]?.icon||"⌕"}</span><div><strong>${esc(categoryName(item.category))}</strong><small>${dateLabel(item.date)}</small></div><span class="severity ${item.severity}">${severityLabel(item.severity)}</span></div>`).join("");
}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function startDiagnosis(category){wizard={category:category||"slow",step:0,answers:[]};setView("diagnosis")}
function renderWizard(){
 const cat=REBOOT_DIAGNOSTICS.categories[wizard.category];const q=cat.questions[wizard.step];const pct=Math.round((wizard.step+1)/cat.questions.length*100);
 $("#stepLabel").textContent=(lang==="es"?"PASO":"STEP")+` ${wizard.step+1} ${lang==="es"?"DE":"OF"} ${cat.questions.length}`;$("#stepPercent").textContent=pct+"%";$("#stepProgress").style.width=pct+"%";
 $("#wizardContent").innerHTML=`<h2 class="wizard-question">${esc(q[lang])}</h2><p class="wizard-hint">${lang==="es"?"Selecciona la opción que mejor describa lo que ocurre.":"Choose the option that best describes what is happening."}</p><div class="choice-grid">${q.options.map(([value,es,en])=>`<button class="choice ${wizard.answers[wizard.step]===value?"selected":""}" data-answer="${value}"><strong>${esc(lang==="es"?es:en)}</strong><small>${value==="unsure"?(lang==="es"?"Puedes continuar si no lo sabes.":"You can continue if you are unsure."):(lang==="es"?"Seleccionar esta respuesta":"Select this answer")}</small></button>`).join("")}</div>`;
 $$(".choice").forEach(btn=>btn.addEventListener("click",()=>{wizard.answers[wizard.step]=btn.dataset.answer;renderWizard()}));
 $("#backStep").disabled=wizard.step===0;$("#nextStep").textContent=wizard.step===cat.questions.length-1?(lang==="es"?"Analizar respuestas ↗":"Analyze answers ↗"):t("continue");
}
function analyze(category,answers){
 let severity="medium",issue=true,causes=[],steps=[],summary="";
 const a=answers;
 if(category==="slow"){
   if(a[1]==="many"||a[1]==="several")causes.push(lang==="es"?"Demasiadas aplicaciones abiertas pueden consumir memoria y procesador.":"Many open applications may consume memory and processor resources.");
   if(a[2]==="yes")causes.push(lang==="es"?"El poco espacio libre puede afectar actualizaciones y funcionamiento.":"Low free storage may affect updates and system operation.");
   if(a[0]==="startup")causes.push(lang==="es"?"Muchas aplicaciones de inicio pueden prolongar el arranque.":"Too many startup apps may increase boot time.");
   if(!causes.length)causes.push(lang==="es"?"Puede existir una carga elevada de recursos, aplicaciones en segundo plano o mantenimiento pendiente.":"High resource use, background apps, or pending maintenance may be involved.");
   severity=(a[1]==="many"&&a[2]==="yes")?"high":"medium";steps=solution("slow");
 }else if(category==="network"){
   if(a[1]==="no")causes.push(lang==="es"?"Si varios dispositivos fallan, el problema podría estar en el router o proveedor.":"If multiple devices fail, the router or internet provider may be involved.");
   if(a[1]==="yes")causes.push(lang==="es"?"Si otros dispositivos funcionan, revisa la configuración de red de este equipo.":"If other devices work, check this device's network configuration.");
   if(a[0]==="one")causes.push(lang==="es"?"El problema podría estar limitado a una aplicación o servicio.":"The issue may be limited to one application or service.");
   if(!causes.length)causes.push(lang==="es"?"Puede haber una interrupción de red, señal débil o configuración incorrecta.":"A network outage, weak signal, or incorrect configuration may be involved.");
   severity=a[0]==="none"?"high":"medium";steps=solution("network");
 }else if(category==="startup"){
   if(a[0]==="loop"||a[0]==="black")causes.push(lang==="es"?"El patrón puede estar relacionado con el arranque, controladores o hardware.":"The pattern may be related to boot configuration, drivers, or hardware.");
   if(a[1]==="yes")causes.push(lang==="es"?"Un cambio o actualización reciente podría estar relacionado.":"A recent change or update may be related.");
   if(!causes.length)causes.push(lang==="es"?"Puede haber aplicaciones de inicio, actualizaciones o archivos del sistema involucrados.":"Startup apps, updates, or system files may be involved.");
   severity=(a[0]==="loop"||a[0]==="black")?"high":"medium";steps=solution("startup");
 }else if(category==="storage"){
   if(a[0]==="updates"||a[0]==="files")causes.push(lang==="es"?"El espacio disponible podría ser insuficiente para guardar datos o instalar actualizaciones.":"Available space may be insufficient to save data or install updates.");
   if(a[2]==="yes")causes.push(lang==="es"?"El disco casi lleno es un indicador directo de falta de espacio.":"A nearly full drive is a direct indicator of low storage.");
   if(!causes.length)causes.push(lang==="es"?"Conviene revisar qué categorías de archivos ocupan más espacio.":"Review which file categories use the most storage.");
   severity=a[2]==="yes"?"high":"medium";steps=solution("storage");
 }else if(category==="overheating"){
   if(a[0]==="idle")causes.push(lang==="es"?"El calentamiento incluso en reposo merece una revisión técnica.":"Heating even while idle deserves technical inspection.");
   if(a[2]==="soft"||a[2]==="blocked")causes.push(lang==="es"?"La ventilación podría estar obstruida por la superficie o ubicación.":"Airflow may be blocked by the surface or placement.");
   if(!causes.length)causes.push(lang==="es"?"La carga de trabajo, ventilación o acumulación de polvo podrían influir.":"Workload, airflow, or dust buildup may contribute.");
   severity=a[0]==="idle"?"high":"medium";steps=solution("overheating");
 }else{
   causes.push(lang==="es"?"Se necesita más información para identificar la causa. Revisa los síntomas y consulta una guía específica.":"More information is needed to identify the cause. Review the symptoms and consult a specific guide.");
   severity="low";steps=solution("security");
 }
 summary=lang==="es"?"Este resultado es orientativo y se basa únicamente en las respuestas seleccionadas. No se han realizado pruebas físicas ni cambios en tu equipo.":"This result is guidance based only on the answers selected. No physical tests or changes have been made to your device.";
 return {category,severity,issue,causes,steps,summary,answers,date:new Date().toISOString()};
}
function solution(id){const item=REBOOT_DIAGNOSTICS.solutions.find(x=>x.id===id)||REBOOT_DIAGNOSTICS.solutions[0];return item[lang].steps}
function showResult(result){
 lastResult=result;const title=categoryName(result.category);const dialog=$("#resultDialog");
 $("#resultContent").innerHTML=`<h2 class="result-title">${lang==="es"?"Análisis de":"Analysis of"} ${esc(title.toLowerCase())}</h2><p class="result-summary">${esc(result.summary)}</p><div class="result-meta"><span class="meta-chip">${lang==="es"?"GRAVEDAD":"SEVERITY"}: ${severityLabel(result.severity)}</span><span class="meta-chip">${lang==="es"?"MOTOR LOCAL":"LOCAL ENGINE"}</span><span class="meta-chip">${dateLabel(result.date)}</span></div><div class="result-section"><h3>${lang==="es"?"Posibles causas":"Possible causes"}</h3><ul>${result.causes.map(c=>`<li>${esc(c)}</li>`).join("")}</ul></div><div class="result-section"><h3>${lang==="es"?"Próximos pasos recomendados":"Recommended next steps"}</h3><ol>${result.steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div><div class="ai-box"><strong>✦ ${lang==="es"?"REBOOT AI":"REBOOT AI"}</strong><p>${lang==="es"?"Puedes solicitar una explicación adicional a la IA si el servidor y la clave API están configurados.":"You can request an additional AI explanation if the server and API key are configured."}</p></div><div class="result-actions"><button class="button primary" id="saveResult">${lang==="es"?"Guardar diagnóstico":"Save diagnosis"}</button><button class="button ghost" id="askAI">${lang==="es"?"Consultar IA":"Ask AI"}</button></div>`;
 dialog.showModal();
 $("#saveResult").addEventListener("click",()=>{history.unshift({...result,id:crypto.randomUUID(),resolved:false});saveHistory();renderDashboard();renderHistory();showToast(lang==="es"?"Diagnóstico guardado en este navegador.":"Diagnosis saved in this browser.");dialog.close()});
 $("#askAI").addEventListener("click",()=>askAI(result));
}
async function askAI(result){
 const btn=$("#askAI");btn.disabled=true;btn.textContent=lang==="es"?"Consultando...":"Thinking...";
 try{const res=await fetch("/api/ai-diagnosis",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({language:lang,category:categoryName(result.category),answers:result.answers,causes:result.causes,summary:result.summary})});const data=await res.json();if(!res.ok)throw new Error(data.error||"AI unavailable");let box=$(".ai-box");box.innerHTML=`<strong>✦ REBOOT AI</strong><p>${esc(data.answer)}</p>`}
 catch(err){$(".ai-box").innerHTML=`<strong>✦ ${lang==="es"?"IA NO CONFIGURADA":"AI NOT CONFIGURED"}</strong><p>${esc(lang==="es"?"El motor local sigue funcionando. Para activar la IA, configura OPENAI_API_KEY en el archivo .env y ejecuta el servidor.":"The local engine still works. To enable AI, configure OPENAI_API_KEY in .env and run the server.")}</p>`}
 finally{btn.disabled=false;btn.textContent=lang==="es"?"Consultar IA":"Ask AI"}
}
function renderSolutions(filter=""){
 const q=filter.toLowerCase();const items=REBOOT_DIAGNOSTICS.solutions.filter(x=>(x[lang].title+" "+x[lang].desc).toLowerCase().includes(q));
 $("#solutionGrid").innerHTML=items.map(x=>`<article class="solution-card"><span class="solution-symbol">${x.icon}</span><h3>${esc(x[lang].title)}</h3><p>${esc(x[lang].desc)}</p><button data-solution="${x.id}">${lang==="es"?"Ver pasos →":"View steps →"}</button></article>`).join("")||`<div class="empty-state">${lang==="es"?"No se encontraron soluciones.":"No solutions found."}</div>`;
 $$("[data-solution]").forEach(b=>b.addEventListener("click",()=>showSolution(b.dataset.solution)));
}
function showSolution(id){const item=REBOOT_DIAGNOSTICS.solutions.find(x=>x.id===id);$("#solutionContent").innerHTML=`<h2 class="result-title">${esc(item[lang].title)}</h2><p class="result-summary">${esc(item[lang].desc)}</p><div class="result-section"><h3>${lang==="es"?"Pasos recomendados":"Recommended steps"}</h3><ol>${item[lang].steps.map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div>`;$("#solutionDialog").showModal()}
function renderHistory(){
 const host=$("#historyList");if(!history.length){host.innerHTML=`<div class="panel empty-state"><span>◷</span><strong>${t("noDiagnoses")}</strong><p>${t("startFirst")}</p></div>`;return}
 host.innerHTML=history.map(item=>`<article class="history-card"><span class="recent-icon">${REBOOT_DIAGNOSTICS.categories[item.category]?.icon||"⌕"}</span><div><strong>${esc(categoryName(item.category))}</strong><small>${dateLabel(item.date)} · ${item.resolved?(lang==="es"?"Resuelto":"Resolved"):(lang==="es"?"Pendiente":"Open")}</small></div><span class="severity ${item.severity}">${severityLabel(item.severity)}</span><div class="history-actions"><button class="small-action" data-resolve="${item.id}">${item.resolved?(lang==="es"?"Reabrir":"Reopen"):(lang==="es"?"Resolver":"Resolve")}</button><button class="small-action" data-delete="${item.id}">✕</button></div></article>`).join("");
 $$("[data-resolve]").forEach(b=>b.addEventListener("click",()=>{const item=history.find(x=>x.id===b.dataset.resolve);item.resolved=!item.resolved;saveHistory();renderHistory();renderDashboard()}));
 $$("[data-delete]").forEach(b=>b.addEventListener("click",()=>{history=history.filter(x=>x.id!==b.dataset.delete);saveHistory();renderHistory();renderDashboard()}));
}
function nextStep(){const cat=REBOOT_DIAGNOSTICS.categories[wizard.category];if(!wizard.answers[wizard.step]){showToast(lang==="es"?"Selecciona una respuesta para continuar.":"Select an answer to continue.");return}if(wizard.step<cat.questions.length-1){wizard.step++;renderWizard()}else showResult(analyze(wizard.category,wizard.answers))}
function init(){
 $$(".nav-item").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
 $$("[data-go]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.go)));
 $$("[data-diagnosis]").forEach(b=>b.addEventListener("click",()=>startDiagnosis(b.dataset.diagnosis)));
 $("#nextStep").addEventListener("click",nextStep);$("#backStep").addEventListener("click",()=>{wizard.step=Math.max(0,wizard.step-1);renderWizard()});
 $("#languageButton").addEventListener("click",()=>{lang=lang==="es"?"en":"es";localStorage.setItem("reboot_lang",lang);applyLanguage()});
 $("#solutionSearch").addEventListener("input",e=>renderSolutions(e.target.value));
 $("#clearHistory").addEventListener("click",()=>{if(confirm(lang==="es"?"¿Borrar todo el historial guardado en este navegador?":"Delete all history saved in this browser?")){history=[];saveHistory();renderHistory();renderDashboard()}});
 $("#closeResult").addEventListener("click",()=>$("#resultDialog").close());$("#closeSolution").addEventListener("click",()=>$("#solutionDialog").close());
 $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
 renderDashboard();renderSolutions();renderWizard();applyLanguage();
}
document.addEventListener("DOMContentLoaded",init);
})();