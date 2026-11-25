
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const HISTORY_KEY = "reboot_history_v1";
  const PC_KEY = "reboot_pc_v1";

  let lang = localStorage.getItem("reboot_lang") || "es";
  let currentView = "dashboard";
  let wizard = { category: "slow", step: 0, answers: [] };
  let lastResult = null;
  let history = loadHistory();
  let pc = loadPC();
  let toastTimer;
  let currentSolution = null;

  function t(key, fallback = key) {
    return window.REBOOT_I18N?.[lang]?.[key]
      || window.REBOOT_I18N?.es?.[key]
      || fallback;
  }

  function text(value, fallback = "") {
    if (typeof value === "string" && value.trim()) return value;
    return fallback;
  }

  function loadHistory() {
    try {
      const data = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function loadPC() {
    try {
      return JSON.parse(localStorage.getItem(PC_KEY) || "null");
    } catch {
      return null;
    }
  }

  function savePC() {
    localStorage.setItem(PC_KEY, JSON.stringify(pc));
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function showToast(message) {
    const element = $("#toast");
    if (!element) return;

    element.textContent = message;
    element.classList.add("show");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      element.classList.remove("show");
    }, 2600);
  }

  function categoryName(id) {
    const category = window.REBOOT_DIAGNOSTICS?.categories?.[id];
    return text(category?.[lang], text(category?.es, id));
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat(
      lang === "es" ? "es-CL" : "en-US",
      { dateStyle: "medium", timeStyle: "short" }
    ).format(new Date(date));
  }

  function severityLabel(severity) {
    const labels = {
      es: { low: "BAJA", medium: "MEDIA", high: "ALTA" },
      en: { low: "LOW", medium: "MEDIUM", high: "HIGH" }
    };

    return labels[lang]?.[severity] || labels[lang].medium;
  }

  // NAVEGACIÓN

  function setView(view) {
    currentView = view;

    $$(".view").forEach(element => {
      element.classList.toggle("active", element.id === `view-${view}`);
    });

    $$(".nav-item").forEach(element => {
      element.classList.toggle("active", element.dataset.view === view);
    });

    const breadcrumb = $("#pageCrumb");

    if (breadcrumb) {
      const names = {
        dashboard: t("navDashboard", "Panel general"),
        myPC: t("navMyPC", "Mi PC"),
        diagnosis: t("navDiagnosis", "Diagnóstico"),
        solutions: t("navSolutions", "Soluciones"),
        history: t("navHistory", "Historial"),
        monitor: t("navMonitor", "Componentes")
      };

      breadcrumb.textContent = names[view] || view;
    }

    $("#sidebar")?.classList.remove("open");

    if (view === "dashboard") renderDashboard();
    if (view === "myPC") renderPC();
    if (view === "diagnosis") renderWizard();
    if (view === "solutions") renderSolutions();
    if (view === "history") renderHistory();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // IDIOMA

  function applyLanguage() {
    document.documentElement.lang = lang;

    $$("[data-i18n]").forEach(element => {
      const key = element.dataset.i18n;
      const translation = t(key, "");

      if (translation) {
        element.textContent = translation;
      }
    });

    $$("[data-i18n-placeholder]").forEach(element => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    const languageButton = $("#languageButton");

    if (languageButton) {
      languageButton.innerHTML =
        (lang === "es" ? "ES" : "EN") + " <span>⌄</span>";
    }

    renderDashboard();
    renderPC();

    if (currentView === "diagnosis") renderWizard();
    if (currentView === "solutions") renderSolutions();
    if (currentView === "history") renderHistory();

    if (currentSolution) {
      renderSolutionDetail(currentSolution);
    }
  }

  // PANEL PRINCIPAL

  function renderDashboard() {
    const total = $("#statTotal");
    const issues = $("#statIssues");
    const resolved = $("#statResolved");
    const last = $("#statLast");

    if (total) total.textContent = history.length;
    if (issues) issues.textContent = history.filter(item => item.issue).length;
    if (resolved) resolved.textContent = history.filter(item => item.resolved).length;

    if (last) {
      last.textContent = history[0]
        ? new Intl.DateTimeFormat(
            lang === "es" ? "es-CL" : "en-US",
            { dateStyle: "short" }
          ).format(new Date(history[0].date))
        : "—";
    }

    const host = $("#recentList") || $("#dashboardHistory");
    if (!host) return;

    if (!history.length) {
      host.innerHTML = `
        <div class="empty-state">
          <span>◷</span>
          <strong>${esc(t("noDiagnoses", "Todavía no hay diagnósticos"))}</strong>
          <p>${esc(t("startFirst", "Realiza tu primer diagnóstico para comenzar."))}</p>
        </div>
      `;
      return;
    }

    host.innerHTML = history.slice(0, 4).map(item => `
      <div class="recent-item">
        <span class="recent-icon">
          ${window.REBOOT_DIAGNOSTICS.categories[item.category]?.icon || "⌕"}
        </span>

        <div>
          <strong>${esc(categoryName(item.category))}</strong>
          <small>${dateLabel(item.date)}</small>
        </div>

        <span class="severity ${esc(item.severity)}">
          ${severityLabel(item.severity)}
        </span>
      </div>
    `).join("");
  }

  // MI PC

  function renderPC() {
    const preview = $("#pcPreview");
    if (!preview) return;

    if (!pc) {
      preview.innerHTML = `
        <div class="empty-state">
          <span>▣</span>
          <strong>${esc(t("noPC", "Todavía no has registrado tu PC"))}</strong>
          <p>${esc(t("noPCSub", "Registra tu equipo para personalizar los diagnósticos."))}</p>
        </div>
      `;
      return;
    }

    preview.innerHTML = `
      <div class="device-preview">
        <div class="device-preview-icon">▣</div>
        <div>
          <small>${esc(t("savedPC", "Equipo registrado"))}</small>
          <h3>${esc(pc.brand)}</h3>
          <p>${esc(pc.model || (lang === "es" ? "Modelo no indicado" : "Model not specified"))}</p>
        </div>
      </div>
    `;

    const brand = $("#pcBrand");
    const model = $("#pcModel");

    if (brand && !brand.value) brand.value = pc.brand;
    if (model && !model.value) model.value = pc.model || "";
  }

  function handlePCSubmit(event) {
    event.preventDefault();

    const brand = $("#pcBrand")?.value.trim();
    const model = $("#pcModel")?.value.trim() || "";

    if (!brand) {
      showToast(t("pcRequired", "Selecciona la marca de tu PC."));
      return;
    }

    pc = { brand, model };
    savePC();
    renderPC();

    showToast(t("pcSaved", "Los datos de tu PC se guardaron correctamente."));
  }

  // DIAGNÓSTICO

  function startDiagnosis(category) {
    wizard = {
      category: category || "slow",
      step: 0,
      answers: []
    };

    setView("diagnosis");
  }

  function renderWizard() {
    const categories = window.REBOOT_DIAGNOSTICS?.categories;

    if (!categories) {
      showToast("No se pudieron cargar las preguntas del diagnóstico.");
      return;
    }

    const category = categories[wizard.category];

    if (!category) {
      wizard.category = "other";
      renderWizard();
      return;
    }

    const questions = Array.isArray(category.questions)
      ? category.questions
      : [];

    if (!questions.length) {
      $("#wizardContent").innerHTML = `
        <div class="empty-state">
          <strong>${lang === "es" ? "No hay preguntas disponibles." : "No questions available."}</strong>
          <p>${lang === "es" ? "Intenta seleccionar otra categoría." : "Try another category."}</p>
        </div>
      `;
      return;
    }

    wizard.step = Math.max(0, Math.min(wizard.step, questions.length - 1));

    const question = questions[wizard.step];

    if (!question) return;

    const questionTitle = text(
      question[lang],
      text(question.es, lang === "es" ? "Pregunta no disponible" : "Question unavailable")
    );

    const options = Array.isArray(question.options)
      ? question.options.filter(option =>
          Array.isArray(option) && option[0] && (option[1] || option[2])
        )
      : [];

    const percentage = Math.round(
      ((wizard.step + 1) / questions.length) * 100
    );

    const stepLabel = $("#stepLabel");
    const stepPercent = $("#stepPercent");
    const stepProgress = $("#stepProgress");
    const content = $("#wizardContent");

    if (stepLabel) {
      stepLabel.textContent =
        (lang === "es" ? "PASO" : "STEP") +
        ` ${wizard.step + 1} ${lang === "es" ? "DE" : "OF"} ${questions.length}`;
    }

    if (stepPercent) stepPercent.textContent = percentage + "%";
    if (stepProgress) stepProgress.style.width = percentage + "%";

    if (!content) return;

    content.innerHTML = `
      <h2 class="wizard-question">${esc(questionTitle)}</h2>

      <p class="wizard-hint">
        ${lang === "es"
          ? "Selecciona la opción que mejor describa lo que ocurre."
          : "Choose the option that best describes what is happening."}
      </p>

      <div class="choice-grid">
        ${options.map(([value, spanish, english]) => {
          const optionText = text(
            lang === "es" ? spanish : english,
            text(spanish, text(english, lang === "es" ? "Opción no disponible" : "Option unavailable"))
          );

          return `
            <button
              type="button"
              class="choice ${wizard.answers[wizard.step] === value ? "selected" : ""}"
              data-answer="${esc(value)}"
            >
              <strong>${esc(optionText)}</strong>
              <small>
                ${value === "unsure"
                  ? (lang === "es"
                      ? "Puedes continuar si no lo sabes."
                      : "You can continue if you are unsure.")
                  : (lang === "es"
                      ? "Seleccionar esta respuesta"
                      : "Select this answer")}
              </small>
            </button>
          `;
        }).join("")}
      </div>
    `;

    $$(".choice", content).forEach(button => {
      button.addEventListener("click", () => {
        wizard.answers[wizard.step] = button.dataset.answer;
        renderWizard();
      });
    });

    const backButton = $("#backStep");
    const nextButton = $("#nextStep");

    if (backButton) {
      backButton.disabled = wizard.step === 0;
    }

    if (nextButton) {
      nextButton.textContent =
        wizard.step === questions.length - 1
          ? (lang === "es" ? "Analizar respuestas ↗" : "Analyze answers ↗")
          : t("continue", lang === "es" ? "Continuar" : "Continue");
    }
  }

  function solution(id) {
    const item = window.REBOOT_DIAGNOSTICS.solutions.find(
      element => element.id === id
    ) || window.REBOOT_DIAGNOSTICS.solutions[0];

    return item?.[lang]?.steps || item?.es?.steps || [];
  }

  function analyze(category, answers) {
    const a = answers;
    let severity = "medium";
    let causes = [];
    let steps = [];

    if (category === "slow") {
      if (a[1] === "many" || a[1] === "several") {
        causes.push(lang === "es"
          ? "Demasiadas aplicaciones abiertas pueden consumir memoria y procesador."
          : "Many open applications may consume memory and processor resources.");
      }

      if (a[2] === "yes") {
        causes.push(lang === "es"
          ? "El poco espacio libre puede afectar actualizaciones y funcionamiento."
          : "Low free storage may affect updates and system operation.");
      }

      if (a[0] === "startup") {
        causes.push(lang === "es"
          ? "Muchas aplicaciones de inicio pueden prolongar el arranque."
          : "Too many startup apps may increase boot time.");
      }

      if (!causes.length) {
        causes.push(lang === "es"
          ? "Puede existir una carga elevada de recursos, aplicaciones en segundo plano o mantenimiento pendiente."
          : "High resource use, background apps, or pending maintenance may be involved.");
      }

      severity = a[1] === "many" && a[2] === "yes" ? "high" : "medium";
      steps = solution("slow");

    } else if (category === "network") {
      if (a[1] === "no") {
        causes.push(lang === "es"
          ? "Si varios dispositivos fallan, el problema podría estar en el router o proveedor."
          : "If multiple devices fail, the router or internet provider may be involved.");
      }

      if (a[1] === "yes") {
        causes.push(lang === "es"
          ? "Si otros dispositivos funcionan, revisa la configuración de red de este equipo."
          : "If other devices work, check this device's network configuration.");
      }

      if (a[0] === "one") {
        causes.push(lang === "es"
          ? "El problema podría estar limitado a una aplicación o servicio."
          : "The issue may be limited to one application or service.");
      }

      if (!causes.length) {
        causes.push(lang === "es"
          ? "Puede haber una interrupción de red, señal débil o configuración incorrecta."
          : "A network outage, weak signal, or incorrect configuration may be involved.");
      }

      severity = a[0] === "none" ? "high" : "medium";
      steps = solution("network");

    } else if (category === "startup") {
      if (a[0] === "loop" || a[0] === "black") {
        causes.push(lang === "es"
          ? "El patrón puede estar relacionado con el arranque, controladores o hardware."
          : "The pattern may be related to boot configuration, drivers, or hardware.");
      }

      if (a[1] === "yes") {
        causes.push(lang === "es"
          ? "Un cambio o actualización reciente podría estar relacionado."
          : "A recent change or update may be related.");
      }

      if (!causes.length) {
        causes.push(lang === "es"
          ? "Puede haber aplicaciones de inicio, actualizaciones o archivos del sistema involucrados."
          : "Startup apps, updates, or system files may be involved.");
      }

      severity = a[0] === "loop" || a[0] === "black" ? "high" : "medium";
      steps = solution("startup");

    } else if (category === "storage") {
      if (a[0] === "updates" || a[0] === "files") {
        causes.push(lang === "es"
          ? "El espacio disponible podría ser insuficiente para guardar datos o instalar actualizaciones."
          : "Available space may be insufficient to save data or install updates.");
      }

      if (a[2] === "yes") {
        causes.push(lang === "es"
          ? "El disco casi lleno es un indicador directo de falta de espacio."
          : "A nearly full drive is a direct indicator of low storage.");
      }

      if (!causes.length) {
        causes.push(lang === "es"
          ? "Conviene revisar qué categorías de archivos ocupan más espacio."
          : "Review which file categories use the most storage.");
      }

      severity = a[2] === "yes" ? "high" : "medium";
      steps = solution("storage");

    } else if (category === "overheating") {
      if (a[0] === "idle") {
        causes.push(lang === "es"
          ? "El calentamiento incluso en reposo merece una revisión técnica."
          : "Heating even while idle deserves technical inspection.");
      }

      if (a[2] === "soft" || a[2] === "blocked") {
        causes.push(lang === "es"
          ? "La ventilación podría estar obstruida por la superficie o ubicación."
          : "Airflow may be blocked by the surface or placement.");
      }

      if (!causes.length) {
        causes.push(lang === "es"
          ? "La carga de trabajo, ventilación o acumulación de polvo podrían influir."
          : "Workload, airflow, or dust buildup may contribute.");
      }

      severity = a[0] === "idle" ? "high" : "medium";
      steps = solution("overheating");

    } else {
      causes.push(lang === "es"
        ? "Se necesita más información para identificar la causa. Revisa los síntomas y consulta una guía específica."
        : "More information is needed to identify the cause. Review the symptoms and consult a specific guide.");

      severity = "low";
      steps = solution("security");
    }

    const summary = lang === "es"
      ? "Este resultado es orientativo y se basa únicamente en tus respuestas. No se han realizado pruebas físicas ni cambios en tu equipo."
      : "This result is guidance based only on your answers. No physical tests or changes have been made to your PC.";

    return {
      category,
      severity,
      issue: true,
      causes,
      steps,
      summary,
      answers,
      pc: pc ? { ...pc } : null,
      date: new Date().toISOString()
    };
  }

  // RESULTADO

  function showResult(result) {
    lastResult = result;

    const dialog = $("#resultDialog");
    const content = $("#resultContent");

    if (!dialog || !content) {
      showToast(lang === "es"
        ? "No se encontró la ventana del resultado."
        : "The result window could not be found.");
      return;
    }

    const title = categoryName(result.category);

    content.innerHTML = `
      <h2 class="result-title">
        ${lang === "es" ? "Análisis de" : "Analysis of"} ${esc(title.toLowerCase())}
      </h2>

      ${result.pc ? `
        <div class="result-meta">
          <span class="meta-chip">
            ${esc(result.pc.brand)} ${esc(result.pc.model)}
          </span>
        </div>
      ` : ""}

      <p class="result-summary">${esc(result.summary)}</p>

      <div class="result-meta">
        <span class="meta-chip">
          ${lang === "es" ? "GRAVEDAD" : "SEVERITY"}:
          ${severityLabel(result.severity)}
        </span>

        <span class="meta-chip">
          ${lang === "es" ? "DIAGNÓSTICO LOCAL" : "LOCAL DIAGNOSIS"}
        </span>

        <span class="meta-chip">${dateLabel(result.date)}</span>
      </div>

      <div class="result-section">
        <h3>${lang === "es" ? "Posibles causas" : "Possible causes"}</h3>
        <ul>${result.causes.map(cause => `<li>${esc(cause)}</li>`).join("")}</ul>
      </div>

      <div class="result-section">
        <h3>${lang === "es" ? "Próximos pasos recomendados" : "Recommended next steps"}</h3>
        <ol>${result.steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol>
      </div>

      <div class="result-actions">
        <button class="button primary" id="saveResult">
          ${lang === "es" ? "Guardar diagnóstico" : "Save diagnosis"}
        </button>
      </div>
    `;

    dialog.showModal();

    $("#saveResult").addEventListener("click", () => {
      history.unshift({
        ...result,
        id: makeId(),
        resolved: false
      });

      saveHistory();
      renderDashboard();
      renderHistory();

      showToast(lang === "es"
        ? "Diagnóstico guardado en este navegador."
        : "Diagnosis saved in this browser.");

      dialog.close();
    });
  }

  function makeId() {
    return window.crypto?.randomUUID?.()
      || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  // CENTRO DE SOLUCIONES

  function renderSolutions(filter = "") {
    const host = $("#solutionGrid");
    if (!host) return;

    currentSolution = null;

    const query = filter.toLowerCase();

    const items = window.REBOOT_DIAGNOSTICS.solutions.filter(item => {
      const title = text(item[lang]?.title, item.es?.title || "");
      const desc = text(item[lang]?.desc, item.es?.desc || "");

      return (title + " " + desc).toLowerCase().includes(query);
    });

    host.innerHTML = items.map(item => `
      <article class="solution-card">
        <span class="solution-symbol">${esc(item.icon)}</span>
        <h3>${esc(text(item[lang]?.title, item.es?.title))}</h3>
        <p>${esc(text(item[lang]?.desc, item.es?.desc))}</p>

        <button type="button" data-solution="${esc(item.id)}">
          ${lang === "es" ? "Ver pasos →" : "View steps →"}
        </button>
      </article>
    `).join("") || `
      <div class="empty-state">
        ${lang === "es" ? "No se encontraron soluciones." : "No solutions found."}
      </div>
    `;

    $$("[data-solution]", host).forEach(button => {
      button.addEventListener("click", () => {
        showSolution(button.dataset.solution);
      });
    });
  }

  function renderSolutionDetail(id) {
    const item = window.REBOOT_DIAGNOSTICS.solutions.find(
      element => element.id === id
    );

    const content = $("#solutionContent");
    if (!item || !content) return;

    const title = text(item[lang]?.title, item.es?.title || "");
    const desc = text(item[lang]?.desc, item.es?.desc || "");
    const steps = item[lang]?.steps || item.es?.steps || [];

    content.innerHTML = `
      <button
        type="button"
        class="button secondary solution-back"
        id="backToSolutions"
      >
        ← ${lang === "es" ? "Volver a soluciones" : "Back to solutions"}
      </button>

      <h2 class="result-title">${esc(title)}</h2>
      <p class="result-summary">${esc(desc)}</p>

      <div class="result-section">
        <h3>${lang === "es" ? "Pasos recomendados" : "Recommended steps"}</h3>
        <ol>${steps.map(step => `<li>${esc(step)}</li>`).join("")}</ol>
      </div>
    `;

    $("#backToSolutions")?.addEventListener("click", () => {
      closeSolution();
    });
  }

  function showSolution(id) {
    const item = window.REBOOT_DIAGNOSTICS.solutions.find(
      element => element.id === id
    );

    if (!item) return;

    currentSolution = id;
    renderSolutionDetail(id);

    const dialog = $("#solutionDialog");

    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }

  function closeSolution() {
    const dialog = $("#solutionDialog");

    if (dialog?.open) {
      dialog.close();
    }

    currentSolution = null;
    renderSolutions($("#solutionSearch")?.value || "");
  }

  // HISTORIAL

  function renderHistory() {
    const host = $("#historyList");
    if (!host) return;

    if (!history.length) {
      host.innerHTML = `
        <div class="panel empty-state">
          <span>◷</span>
          <strong>${esc(t("noDiagnoses", "Todavía no hay diagnósticos"))}</strong>
          <p>${esc(t("startFirst", "Realiza tu primer diagnóstico para comenzar."))}</p>
        </div>
      `;
      return;
    }

    host.innerHTML = history.map(item => `
      <article class="history-card">
        <span class="recent-icon">
          ${window.REBOOT_DIAGNOSTICS.categories[item.category]?.icon || "⌕"}
        </span>

        <div>
          <strong>${esc(categoryName(item.category))}</strong>
          <small>
            ${dateLabel(item.date)} · ${
              item.resolved
                ? (lang === "es" ? "Resuelto" : "Resolved")
                : (lang === "es" ? "Pendiente" : "Open")
            }
          </small>
          ${item.pc ? `<small>${esc(item.pc.brand)} ${esc(item.pc.model)}</small>` : ""}
        </div>

        <span class="severity ${esc(item.severity)}">
          ${severityLabel(item.severity)}
        </span>

        <div class="history-actions">
          <button type="button" class="small-action" data-resolve="${esc(item.id)}">
            ${item.resolved
              ? (lang === "es" ? "Reabrir" : "Reopen")
              : (lang === "es" ? "Resolver" : "Resolve")}
          </button>

          <button type="button" class="small-action" data-delete="${esc(item.id)}">
            ✕
          </button>
        </div>
      </article>
    `).join("");

    $$("[data-resolve]", host).forEach(button => {
      button.addEventListener("click", () => {
        const item = history.find(
          element => element.id === button.dataset.resolve
        );

        if (!item) return;

        item.resolved = !item.resolved;
        saveHistory();
        renderHistory();
        renderDashboard();
      });
    });

    $$("[data-delete]", host).forEach(button => {
      button.addEventListener("click", () => {
        history = history.filter(
          item => item.id !== button.dataset.delete
        );

        saveHistory();
        renderHistory();
        renderDashboard();
      });
    });
  }

  // AVANZAR Y RETROCEDER EN EL DIAGNÓSTICO

  function nextStep() {
    const category = window.REBOOT_DIAGNOSTICS.categories[wizard.category];

    if (!category) return;

    if (!wizard.answers[wizard.step]) {
      showToast(lang === "es"
        ? "Selecciona una respuesta para continuar."
        : "Select an answer to continue.");
      return;
    }

    if (wizard.step < category.questions.length - 1) {
      wizard.step++;
      renderWizard();
    } else {
      showResult(analyze(wizard.category, wizard.answers));
    }
  }

  function previousStep() {
    if (wizard.step > 0) {
      wizard.step--;
      renderWizard();
      return;
    }

    setView("dashboard");
  }

  // INICIO

  function init() {
    $$(".nav-item").forEach(button => {
      button.addEventListener("click", () => {
        setView(button.dataset.view);
      });
    });

    $$("[data-go]").forEach(button => {
      button.addEventListener("click", () => {
        setView(button.dataset.go);
      });
    });

    $$("[data-diagnosis]").forEach(button => {
      button.addEventListener("click", () => {
        startDiagnosis(button.dataset.diagnosis);
      });
    });

    $$("[data-action='new-diagnosis']").forEach(button => {
      button.addEventListener("click", () => {
        startDiagnosis("slow");
      });
    });

    $("#pcForm")?.addEventListener("submit", handlePCSubmit);

    $("#editPCButton")?.addEventListener("click", () => {
      $("#pcBrand")?.focus();
      $("#pcForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    $("#nextStep")?.addEventListener("click", nextStep);
    $("#backStep")?.addEventListener("click", previousStep);

    $("#languageButton")?.addEventListener("click", () => {
      lang = lang === "es" ? "en" : "es";
      localStorage.setItem("reboot_lang", lang);
      applyLanguage();
    });

    $("#solutionSearch")?.addEventListener("input", event => {
      renderSolutions(event.target.value);
    });

    $("#clearHistory")?.addEventListener("click", () => {
      const confirmed = confirm(lang === "es"
        ? "¿Borrar todo el historial guardado en este navegador?"
        : "Delete all history saved in this browser?");

      if (!confirmed) return;

      history = [];
      saveHistory();
      renderHistory();
      renderDashboard();
    });

    $("#closeResult")?.addEventListener("click", () => {
      $("#resultDialog")?.close();
    });

    $("#closeSolution")?.addEventListener("click", closeSolution);

    $("#solutionDialog")?.addEventListener("click", event => {
      if (event.target === $("#solutionDialog")) {
        closeSolution();
      }
    });

    $("#mobileMenu")?.addEventListener("click", () => {
      $("#sidebar")?.classList.toggle("open");
    });

    renderDashboard();
    renderPC();
    renderSolutions();
    renderWizard();
    applyLanguage();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
