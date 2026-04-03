const STORAGE_KEYS = {
  users: "qm_users",
  authUser: "qm_auth_user",
  theme: "qm_theme",
  lastSelection: "qm_last_selection",
};

const APP_CONFIG = {
  types: {
    Length: ["meter", "cm", "km"],
    Weight: ["kg", "g"],
    Temperature: ["C", "F"],
    Volume: ["liter", "ml"],
  },
  actions: ["Comparison", "Conversion", "Arithmetic"],
  arithmeticOps: ["Add", "Subtract", "Multiply"],
};

class StorageManager {
  static get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  static set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

class Toast {
  static show(message, type = "info") {
    const root = document.getElementById("toastRoot");
    if (!root) return;
    const node = document.createElement("div");
    node.className = `toast ${type === "error" ? "error" : ""}`.trim();
    node.textContent = message;
    root.appendChild(node);
    setTimeout(() => {
      node.remove();
    }, 2600);
  }
}

class AuthService {
  static async fakeRequest(payload) {
    return new Promise((resolve) => {
      setTimeout(() => resolve(payload), 900);
    });
  }

  static getUsers() {
    return StorageManager.get(STORAGE_KEYS.users, []);
  }

  static saveUsers(users) {
    StorageManager.set(STORAGE_KEYS.users, users);
  }

  static login(email, password) {
    return this.fakeRequest().then(() => {
      const users = this.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) throw new Error("Invalid email or password.");
      StorageManager.set(STORAGE_KEYS.authUser, user);
      return user;
    });
  }

  static signup(userData) {
    return this.fakeRequest().then(() => {
      const users = this.getUsers();
      if (users.some((u) => u.email === userData.email)) {
        throw new Error("An account with this email already exists.");
      }
      users.push(userData);
      this.saveUsers(users);
      StorageManager.set(STORAGE_KEYS.authUser, userData);
      return userData;
    });
  }

  static logout() {
    localStorage.removeItem(STORAGE_KEYS.authUser);
  }

  static currentUser() {
    return StorageManager.get(STORAGE_KEYS.authUser, null);
  }
}

class Validator {
  static email(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  static password(value) {
    return value && value.length >= 6;
  }

  static mobile(value) {
    return /^\d{10}$/.test(value);
  }
}

class AuthPage {
  constructor() {
    this.loginForm = document.getElementById("loginForm");
    this.signupForm = document.getElementById("signupForm");
    this.tabButtons = [...document.querySelectorAll(".tab-btn")];
    this.tabIndicator = document.querySelector(".tab-indicator");
    this.toggleButtons = [...document.querySelectorAll(".toggle-pass")];
    this.activeTab = "login";
  }

  init() {
    if (AuthService.currentUser()) {
      window.location.href = "dashboard.html";
      return;
    }
    this.bindTabs();
    this.bindPasswordToggles();
    this.bindForms();
  }

  bindTabs() {
    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.activeTab = btn.dataset.tab;
        this.tabButtons.forEach((b) => b.classList.toggle("active", b === btn));
        document.getElementById("loginForm").classList.toggle("active", this.activeTab === "login");
        document.getElementById("signupForm").classList.toggle("active", this.activeTab === "signup");
        this.tabIndicator.style.transform = this.activeTab === "signup" ? "translateX(100%)" : "translateX(0)";
      });
    });
  }

  bindPasswordToggles() {
    this.toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = document.getElementById(btn.dataset.target);
        const nextType = target.type === "password" ? "text" : "password";
        target.type = nextType;
        btn.textContent = nextType === "password" ? "Show" : "Hide";
      });
    });
  }

  bindForms() {
    this.loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const submitBtn = this.loginForm.querySelector("button[type='submit']");

      if (!Validator.email(email)) return Toast.show("Please enter a valid email.", "error");
      if (!Validator.password(password)) return Toast.show("Password must be at least 6 characters.", "error");

      submitBtn.classList.add("loading");
      submitBtn.textContent = "Logging in...";
      try {
        await AuthService.login(email, password);
        Toast.show("Login successful. Redirecting...");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } catch (err) {
        Toast.show(err.message, "error");
      } finally {
        submitBtn.classList.remove("loading");
        submitBtn.textContent = "Login";
      }
    });

    this.signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const userData = {
        fullName: document.getElementById("signupName").value.trim(),
        email: document.getElementById("signupEmail").value.trim(),
        password: document.getElementById("signupPassword").value.trim(),
        mobile: document.getElementById("signupMobile").value.trim(),
      };
      const submitBtn = this.signupForm.querySelector("button[type='submit']");

      if (!userData.fullName || userData.fullName.length < 2) return Toast.show("Enter your full name.", "error");
      if (!Validator.email(userData.email)) return Toast.show("Please enter a valid email.", "error");
      if (!Validator.password(userData.password)) return Toast.show("Password must be at least 6 characters.", "error");
      if (!Validator.mobile(userData.mobile)) return Toast.show("Mobile number must be 10 digits.", "error");

      submitBtn.classList.add("loading");
      submitBtn.textContent = "Creating...";
      try {
        await AuthService.signup(userData);
        Toast.show("Signup successful. Redirecting...");
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 500);
      } catch (err) {
        Toast.show(err.message, "error");
      } finally {
        submitBtn.classList.remove("loading");
        submitBtn.textContent = "Create Account";
      }
    });
  }
}

class UnitMath {
  static toBase(type, value, unit) {
    const n = Number(value);
    const maps = {
      Length: {
        meter: n,
        cm: n / 100,
        km: n * 1000,
      },
      Weight: {
        kg: n,
        g: n / 1000,
      },
      Volume: {
        liter: n,
        ml: n / 1000,
      },
    };
    if (type === "Temperature") {
      return unit === "C" ? n : (n - 32) * (5 / 9);
    }
    return maps[type][unit];
  }

  static fromBase(type, baseValue, targetUnit) {
    const n = Number(baseValue);
    const maps = {
      Length: {
        meter: n,
        cm: n * 100,
        km: n / 1000,
      },
      Weight: {
        kg: n,
        g: n * 1000,
      },
      Volume: {
        liter: n,
        ml: n * 1000,
      },
    };
    if (type === "Temperature") {
      return targetUnit === "C" ? n : n * (9 / 5) + 32;
    }
    return maps[type][targetUnit];
  }

  static convert(type, value, fromUnit, toUnit) {
    const base = this.toBase(type, value, fromUnit);
    return this.fromBase(type, base, toUnit);
  }
}

class DashboardPage {
  constructor() {
    this.user = AuthService.currentUser();
    this.themeToggle = document.getElementById("themeToggle");
    this.logoutBtn = document.getElementById("logoutBtn");
    this.typeChoices = document.getElementById("typeChoices");
    this.actionChoices = document.getElementById("actionChoices");
    this.operationGroup = document.getElementById("operationGroup");
    this.unit1 = document.getElementById("unit1");
    this.unit2 = document.getElementById("unit2");
    this.value1 = document.getElementById("value1");
    this.value2 = document.getElementById("value2");
    this.calcBtn = document.getElementById("calcBtn");
    this.resultText = document.getElementById("resultText");
    this.welcomeText = document.getElementById("welcomeText");

    const saved = StorageManager.get(STORAGE_KEYS.lastSelection, null);
    this.state = {
      type: saved?.type || "Length",
      action: saved?.action || "Comparison",
      operation: saved?.operation || "Add",
    };
  }

  init() {
    if (!this.user) {
      window.location.href = "index.html";
      return;
    }
    this.applyTheme();
    this.bindHeader();
    this.renderChoices();
    this.renderUnits();
    this.renderOperationButtons();
    this.bindCalculator();
    this.updateInputMode();
    this.welcomeText.textContent = `Welcome, ${this.user.fullName || "User"}`;
  }

  applyTheme() {
    const theme = StorageManager.get(STORAGE_KEYS.theme, "dark");
    document.body.classList.toggle("light", theme === "light");
  }

  bindHeader() {
    this.themeToggle.addEventListener("click", () => {
      const isLight = document.body.classList.toggle("light");
      StorageManager.set(STORAGE_KEYS.theme, isLight ? "light" : "dark");
      Toast.show(`Switched to ${isLight ? "Light" : "Dark"} mode`);
    });

    this.logoutBtn.addEventListener("click", () => {
      AuthService.logout();
      Toast.show("Logged out successfully.");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 400);
    });
  }

  renderChoices() {
    this.typeChoices.innerHTML = "";
    this.actionChoices.innerHTML = "";

    Object.keys(APP_CONFIG.types).forEach((type) => {
      const btn = this.makeChoiceButton(type, this.state.type === type, () => {
        this.state.type = type;
        this.renderChoices();
        this.renderUnits();
      });
      this.typeChoices.appendChild(btn);
    });

    APP_CONFIG.actions.forEach((action) => {
      const btn = this.makeChoiceButton(action, this.state.action === action, () => {
        this.state.action = action;
        this.renderChoices();
        this.renderOperationButtons();
        this.updateInputMode();
      });
      this.actionChoices.appendChild(btn);
    });
  }

  makeChoiceButton(label, active, onClick) {
    const btn = document.createElement("button");
    btn.className = `choice-btn ${active ? "active" : ""}`.trim();
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  renderUnits() {
    const units = APP_CONFIG.types[this.state.type];
    this.unit1.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
    this.unit2.innerHTML = units.map((u) => `<option value="${u}">${u}</option>`).join("");
    this.saveState();
  }

  renderOperationButtons() {
    this.operationGroup.innerHTML = "";
    if (this.state.action !== "Arithmetic") {
      this.operationGroup.style.display = "none";
      this.saveState();
      return;
    }

    this.operationGroup.style.display = "flex";
    APP_CONFIG.arithmeticOps.forEach((op) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `op-btn ${this.state.operation === op ? "active" : ""}`.trim();
      btn.textContent = op;
      btn.addEventListener("click", () => {
        this.state.operation = op;
        this.renderOperationButtons();
      });
      this.operationGroup.appendChild(btn);
    });
    this.saveState();
  }

  updateInputMode() {
    const conversion = this.state.action === "Conversion";
    this.value2.disabled = conversion;
    this.value2.placeholder = conversion ? "Not required for conversion" : "Enter second value";
  }

  bindCalculator() {
    this.calcBtn.addEventListener("click", () => {
      const n1 = Number(this.value1.value);
      const n2 = Number(this.value2.value);
      const u1 = this.unit1.value;
      const u2 = this.unit2.value;

      if (Number.isNaN(n1)) {
        return Toast.show("Please enter Value 1.", "error");
      }

      try {
        let output = "";
        if (this.state.action === "Conversion") {
          const converted = UnitMath.convert(this.state.type, n1, u1, u2);
          output = `${n1} ${u1} = ${this.round(converted)} ${u2}`;
        }

        if (this.state.action === "Comparison") {
          if (Number.isNaN(n2)) return Toast.show("Please enter Value 2 for comparison.", "error");
          const a = UnitMath.toBase(this.state.type, n1, u1);
          const b = UnitMath.toBase(this.state.type, n2, u2);
          if (Math.abs(a - b) < 1e-9) output = "Result: Equal";
          else output = a > b ? "Result: Value 1 is Greater" : "Result: Value 2 is Greater";
        }

        if (this.state.action === "Arithmetic") {
          if (Number.isNaN(n2)) return Toast.show("Please enter Value 2 for arithmetic.", "error");
          const bToU1 = UnitMath.convert(this.state.type, n2, u2, u1);
          let result = 0;
          if (this.state.operation === "Add") result = n1 + bToU1;
          if (this.state.operation === "Subtract") result = n1 - bToU1;
          if (this.state.operation === "Multiply") result = n1 * bToU1;
          output = `${this.state.operation}: ${this.round(result)} ${u1}`;
        }

        this.resultText.textContent = output;
        this.saveState();
        Toast.show("Calculation complete.");
      } catch {
        Toast.show("Unable to calculate. Please verify inputs.", "error");
      }
    });
  }

  round(value) {
    return Number.parseFloat(Number(value).toFixed(4));
  }

  saveState() {
    StorageManager.set(STORAGE_KEYS.lastSelection, this.state);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;
  if (page === "auth") new AuthPage().init();
  if (page === "dashboard") new DashboardPage().init();
});
