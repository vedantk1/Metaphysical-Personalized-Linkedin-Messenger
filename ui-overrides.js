(() => {
  const THEME_KEY = "themePreference";
  const VALID_THEMES = new Set(["system", "light", "dark"]);
  const VALID_MODELS = new Set(["gpt-5", "gpt-5-mini", "gpt-5-nano"]);
  const DEFAULT_MODEL = "gpt-5-mini";

  function normalizeTheme(theme) {
    return VALID_THEMES.has(theme) ? theme : "system";
  }

  function applyTheme(theme) {
    if (!document.body) {
      return;
    }
    const normalizedTheme = normalizeTheme(theme);
    document.body.classList.remove("theme-system", "theme-light", "theme-dark");
    document.body.classList.add(`theme-${normalizedTheme}`);
  }

  function normalizeModel(model) {
    return VALID_MODELS.has(model) ? model : DEFAULT_MODEL;
  }

  function ensureModelPreference() {
    const normalizedModel = normalizeModel(localStorage.getItem("model"));
    localStorage.setItem("model", normalizedModel);
    return normalizedModel;
  }

  function debounce(fn, delayMs) {
    let timerId = null;
    return () => {
      if (timerId) {
        window.clearTimeout(timerId);
      }
      timerId = window.setTimeout(() => {
        fn();
      }, delayMs);
    };
  }

  function readTasksFromDom() {
    const rows = document.querySelectorAll("#task-list .task-row");
    return Array.from(rows)
      .map((row) => {
        const columns = row.querySelectorAll("p");
        return {
          key: (columns[0]?.textContent || "").trim(),
          value: (columns[1]?.textContent || "").trim()
        };
      })
      .filter((task) => task.key && task.value);
  }

  function persistSettingsFromDom() {
    const apiInput = document.getElementById("openAiApiInput");
    const userProfile = document.getElementById("userProfile");
    const systemPrompt = document.getElementById("systemPrompt");

    if (apiInput) {
      localStorage.setItem("apiKey", apiInput.value.trim());
    }
    if (userProfile) {
      localStorage.setItem("userProfile", userProfile.value.trim());
    }
    if (systemPrompt) {
      localStorage.setItem("systemPrompt", systemPrompt.value.trim());
    }

    localStorage.setItem("tasks", JSON.stringify(readTasksFromDom()));
  }

  function initThemeSelector() {
    const themeSelect = document.getElementById("themeSelect");
    if (!themeSelect) {
      return;
    }

    const activeTheme = normalizeTheme(localStorage.getItem(THEME_KEY));
    themeSelect.value = activeTheme;
    themeSelect.addEventListener("change", (event) => {
      const nextTheme = normalizeTheme(event.target.value);
      localStorage.setItem(THEME_KEY, nextTheme);
      applyTheme(nextTheme);
    });
  }

  function initPopupOverrides() {
    const modelDropdown = document.getElementById("modelDropdown");
    const activeModel = ensureModelPreference();
    if (modelDropdown) {
      modelDropdown.value = activeModel;
      modelDropdown.addEventListener("change", (event) => {
        const nextModel = normalizeModel(event.target.value);
        event.target.value = nextModel;
        localStorage.setItem("model", nextModel);
      });
    }
  }

  function initSettingsOverrides() {
    const saveRow = document.querySelector(".settings-save-row");
    if (saveRow) {
      saveRow.hidden = true;
    }

    initThemeSelector();

    const debouncedSave = debounce(persistSettingsFromDom, 120);

    const autoSaveIds = ["openAiApiInput", "userProfile", "systemPrompt"];
    autoSaveIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) {
        return;
      }
      element.addEventListener("input", debouncedSave);
      element.addEventListener("change", debouncedSave);
    });

    const addTaskButton = document.getElementById("addTaskButton");
    if (addTaskButton) {
      addTaskButton.addEventListener("click", () => {
        window.setTimeout(persistSettingsFromDom, 0);
      });
    }

    const removeAllTasksButton = document.getElementById("removeAllTasksButton");
    if (removeAllTasksButton) {
      removeAllTasksButton.addEventListener("click", () => {
        window.setTimeout(persistSettingsFromDom, 0);
      });
    }

    const defaultPromptButton = document.getElementById("default-system-prompt-button");
    if (defaultPromptButton) {
      defaultPromptButton.addEventListener("click", () => {
        window.setTimeout(persistSettingsFromDom, 0);
      });
    }

    const taskList = document.getElementById("task-list");
    if (taskList) {
      taskList.addEventListener("click", () => {
        window.setTimeout(persistSettingsFromDom, 0);
      });
    }
  }

  function init() {
    ensureModelPreference();
    applyTheme(localStorage.getItem(THEME_KEY));

    if (document.body.classList.contains("popup")) {
      initPopupOverrides();
      return;
    }

    if (document.body.classList.contains("settings")) {
      initSettingsOverrides();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
