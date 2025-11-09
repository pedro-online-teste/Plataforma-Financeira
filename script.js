"use strict";

// Constants for localStorage keys
const STORAGE_KEYS = {
    USER_SESSION: "financialAppUserSession",
    TRANSACTIONS: "financialAppTransactions",
    INVESTMENTS: "financialAppInvestments"
};

// Utility Functions
function formatCurrency(value) {
    if (typeof value !== "number" || isNaN(value)) return "R$ 0,00";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        if (isNaN(date)) return "";
        return date.toLocaleDateString("pt-BR");
    } catch {
        return "";
    }
}

function parseDateInput(value) {
    // Parses input type=date or month string in ISO format to Date object
    if (!value) return null;
    try {
        return new Date(value);
    } catch {
        return null;
    }
}

// Session Management
function getUserSession() {
    try {
        const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
        return session ? JSON.parse(session) : null;
    } catch {
        return null;
    }
}

function setUserSession(username) {
    if (typeof username !== "string" || !username.trim()) return;
    const session = { username: username.trim(), loggedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(session));
}

function clearUserSession() {
    localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
}

// Transactions Model
class Transaction {
    constructor({ id, type, amount, date, category }) {
        this.id = id || Transaction.generateId();
        this.type = type; // "income" or "expense"
        this.amount = amount;
        this.date = date;
        this.category = category || "";
    }

    static generateId() {
        return "tx_" + Math.random().toString(36).substr(2, 9);
    }
}

function getTransactions() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        // Validate array items
        return arr
            .filter(
                (t) =>
                    t &&
                    (t.type === "income" || t.type === "expense") &&
                    typeof t.amount === "number" &&
                    t.amount > 0 &&
                    typeof t.date === "string" &&
                    t.date.length > 0
            )
            .map((t) => new Transaction(t));
    } catch {
        return [];
    }
}

function saveTransactions(transactions) {
    if (!Array.isArray(transactions)) return;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

// Investments Model
class Investment {
    constructor({ id, type, amount, date, returns }) {
        this.id = id || Investment.generateId();
        this.type = type;
        this.amount = amount;
        this.date = date;
        this.returns = returns || 0; // percentual 0-100
    }

    static generateId() {
        return "inv_" + Math.random().toString(36).substr(2, 9);
    }
}

function getInvestments() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr
            .filter(
                (i) =>
                    i &&
                    typeof i.type === "string" &&
                    i.type.trim().length > 0 &&
                    typeof i.amount === "number" &&
                    i.amount > 0 &&
                    typeof i.date === "string" &&
                    i.date.length > 0 &&
                    typeof i.returns === "number" &&
                    i.returns >= 0 &&
                    i.returns <= 100
            )
            .map((i) => new Investment(i));
    } catch {
        return [];
    }
}

function saveInvestments(investments) {
    if (!Array.isArray(investments)) return;
    localStorage.setItem(STORAGE_KEYS.INVESTMENTS, JSON.stringify(investments));
}

// DOM Elements
const dom = {
    loginSection: document.getElementById("login-section"),
    loginForm: document.getElementById("login-form"),
    loginError: document.getElementById("login-error"),

    navMenu: document.getElementById("nav-menu"),
    logoutBtn: document.getElementById("logout-btn"),

    dashboardSection: document.getElementById("dashboard-section"),
    totalIncome: document.getElementById("total-income"),
    totalExpenses: document.getElementById("total-expenses"),
    totalInvestments: document.getElementById("total-investments"),
    balance: document.getElementById("balance"),

    transactionForm: document.getElementById("transaction-form"),
    transactionType: document.getElementById("transaction-type"),
    transactionAmount: document.getElementById("transaction-amount"),
    transactionDate: document.getElementById("transaction-date"),
    transactionCategory: document.getElementById("transaction-category"),
    transactionError: document.getElementById("transaction-error"),

    incomeExpenseChartCanvas: document.getElementById("income-expense-chart"),

    reportsSection: document.getElementById("reports-section"),
    reportFilterForm: document.getElementById("report-filter-form"),
    reportMonth: document.getElementById("report-month"),
    reportFilterError: document.getElementById("report-filter-error"),
    reportTableBody: document.querySelector("#report-table tbody"),

    investmentsSection: document.getElementById("investments-section"),
    investmentForm: document.getElementById("investment-form"),
    investmentType: document.getElementById("investment-type"),
    investmentAmount: document.getElementById("investment-amount"),
    investmentDate: document.getElementById("investment-date"),
    investmentReturns: document.getElementById("investment-returns"),
    investmentError: document.getElementById("investment-error"),
    investmentChartCanvas: document.getElementById("investment-chart"),
};

// Navigation & Views
const views = {
    login: dom.loginSection,
    dashboard: dom.dashboardSection,
    reports: dom.reportsSection,
    investments: dom.investmentsSection,
};

function showView(viewName) {
    Object.entries(views).forEach(([key, section]) => {
        if (key === viewName) {
            section.classList.remove("hidden");
            section.setAttribute("tabindex", "-1");
            section.focus();
        } else {
            section.classList.add("hidden");
            section.removeAttribute("tabindex");
        }
    });
    // Update aria-selected on nav buttons
    if (dom.navMenu) {
        [...dom.navMenu.querySelectorAll("button[data-view]")].forEach((btn) => {
            btn.setAttribute("aria-selected", btn.dataset.view === viewName ? "true" : "false");
        });
    }
}

function updateNavVisibility(loggedIn) {
    if (loggedIn) {
        dom.navMenu.classList.remove("hidden");
    } else {
        dom.navMenu.classList.add("hidden");
    }
}

// Chart instances
let incomeExpenseChart = null;
let investmentChart = null;

// Initialize charts
function initIncomeExpenseChart() {
    if (incomeExpenseChart) incomeExpenseChart.destroy();

    incomeExpenseChart = new Chart(dom.incomeExpenseChartCanvas.getContext("2d"), {
        type: "bar",
        data: {
            labels: [], // meses
            datasets: [
                {
                    label: "Receitas",
                    backgroundColor: "#27ae60",
                    data: [],
                },
                {
                    label: "Despesas",
                    backgroundColor: "#ff1900ff",
                    data: [],
                },
            ],
        },
        options: {
            responsive: true,
           maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return formatCurrency(value);
                        },
                    },
                },
            },
            interaction: {
                mode: "index",
                intersect: false,
            },
            plugins: {
                legend: {
                    position: "top",
                },
                tooltip: {
                    callbacks: {
                        label: (context) => formatCurrency(context.parsed.y),
                    },
                },
            },
        },
    });
}

function updateIncomeExpenseChart(transactions) {
    // Agrupar receitas e despesas por mês (ex: "2024-06")
    const monthlyData = {};
    transactions.forEach(({ type, amount, date }) => {
        const dt = new Date(date);
        if (isNaN(dt)) return;
        const monthKey = dt.toISOString().slice(0, 7);
        if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };
        if (type === "income") monthlyData[monthKey].income += amount;
        else if (type === "expense") monthlyData[monthKey].expense += amount;
    });

    // Ordenar meses
    const months = Object.keys(monthlyData).sort();

    const incomeData = months.map((m) => monthlyData[m].income);
    const expenseData = months.map((m) => monthlyData[m].expense);

    incomeExpenseChart.data.labels = months.map((m) => {
        const [year, month] = m.split("-");
        return `${month}/${year}`;
    });
    incomeExpenseChart.data.datasets[0].data = incomeData;
    incomeExpenseChart.data.datasets[1].data = expenseData;
    incomeExpenseChart.update();
}
function initInvestmentChart() {
    if (investmentChart) investmentChart.destroy();

    investmentChart = new Chart(dom.investmentChartCanvas.getContext("2d"), {
        type: "pie",
        data: {
            labels: [],

            datasets: [
                {
                    label: "Investimentos",
                    backgroundColor: [],
                    data: [],
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "right",
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || "";
                            const value = context.parsed || 0;
                            return `${label}: ${formatCurrency(value)}`;
                        },
                    },
                },
            },
        },
    });
}

function updateInvestmentChart(investments) {
    // Agrupar por tipo e somar valores
    const grouped = {};
    investments.forEach(({ type, amount }) => {
        if (!grouped[type]) grouped[type] = 0;
        grouped[type] += amount;
    });

    const labels = Object.keys(grouped);
    const data = labels.map((label) => grouped[label]);
    const backgroundColors = labels.map(() => getRandomColor());

    investmentChart.data.labels = labels;
    investmentChart.data.datasets[0].data = data;
    investmentChart.data.datasets[0].backgroundColor = backgroundColors;
    investmentChart.update();
}

function getRandomColor() {
    // Gera cor pastel randômica para gráficos
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 70%)`;
}

// Render Dashboard Summary
function renderDashboardSummary(transactions, investments) {
    const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((acc, t) => acc + t.amount, 0);
    const totalInvestments = investments.reduce((acc, i) => acc + i.amount, 0);
    const balance = totalIncome - totalExpenses;

    dom.totalIncome.textContent = formatCurrency(totalIncome);
    dom.totalExpenses.textContent = formatCurrency(totalExpenses);
    dom.totalInvestments.textContent = formatCurrency(totalInvestments);
    dom.balance.textContent = formatCurrency(balance);
}

// Render Reports Table
function renderReportTable(transactions, yearMonth) {
    // yearMonth = "YYYY-MM"
    dom.reportTableBody.innerHTML = "";
    if (!yearMonth) return;

    const filtered = transactions.filter((t) => t.date.startsWith(yearMonth));
    if (filtered.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 4;
        td.textContent = "Nenhuma transação para o mês selecionado.";
        td.style.textAlign = "center";
        tr.appendChild(td);
        dom.reportTableBody.appendChild(tr);
        return;
    }

    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    filtered.forEach(({ id, date, type, category, amount }) => {
        const tr = document.createElement("tr");
        tr.setAttribute("data-id", id);

        const tdDate = document.createElement("td");
        tdDate.textContent = formatDate(date);
        tr.appendChild(tdDate);

        const tdType = document.createElement("td");
        tdType.textContent = type === "income" ? "Receita" : "Despesa";
        tr.appendChild(tdType);

        const tdCategory = document.createElement("td");
        tdCategory.textContent = category || "-";
        tr.appendChild(tdCategory);

        const tdAmount = document.createElement("td");
        tdAmount.textContent = formatCurrency(amount);
        tr.appendChild(tdAmount);

        dom.reportTableBody.appendChild(tr);
    });
}

// Form Validation Helpers
function validateLoginForm(username) {
    if (!username || typeof username !== "string") return "Usuário inválido.";
    const trimmed = username.trim();
    if (trimmed.length < 3) return "Usuário deve ter ao menos 3 caracteres.";
    if (trimmed.length > 30) return "Usuário deve ter no máximo 30 caracteres.";
    return "";
}

function validateTransactionForm(type, amount, date) {
    if (type !== "income" && type !== "expense") return "Tipo inválido.";
    if (typeof amount !== "number" || amount <= 0) return "Valor deve ser maior que zero.";
    if (!date || isNaN(new Date(date))) return "Data inválida.";
    return "";
}

function validateInvestmentForm(type, amount, date, returns) {
    if (!type || typeof type !== "string" || type.trim().length === 0) return "Tipo de investimento obrigatório.";
    if (typeof amount !== "number" || amount <= 0) return "Valor deve ser maior que zero.";
    if (!date || isNaN(new Date(date))) return "Data inválida.";
    if (typeof returns !== "number" || returns < 0 || returns > 100) return "Retornos devem estar entre 0 e 100.";
    return "";
}

// Event Handlers
function handleLoginSubmit(event) {
    event.preventDefault();
    dom.loginError.textContent = "";
    const username = dom.loginForm.username.value;

    const error = validateLoginForm(username);
    if (error) {
        dom.loginError.textContent = error;
        dom.loginForm.username.focus();
        return;
    }

    setUserSession(username);
    initApp();
}

function handleLogout() {
    clearUserSession();
    showView("login");
    updateNavVisibility(false);
}

function handleNavClick(event) {
    const btn = event.target.closest("button[data-view]");
    if (!btn) return;
    const view = btn.dataset.view;
    if (!view || !views.hasOwnProperty(view)) return;
    showView(view);
}

function handleTransactionSubmit(event) {
    event.preventDefault();
    dom.transactionError.textContent = "";

    const type = dom.transactionType.value;
    const amountRaw = dom.transactionAmount.value;
    const date = dom.transactionDate.value;
    const category = dom.transactionCategory.value.trim();

    const amount = parseFloat(amountRaw);

    const error = validateTransactionForm(type, amount, date);
    if (error) {
        dom.transactionError.textContent = error;
        return;
    }

    const transactions = getTransactions();
    transactions.push(new Transaction({ type, amount, date, category }));
    saveTransactions(transactions);

    dom.transactionForm.reset();
    updateDashboard();
    updateIncomeExpenseChart(transactions);
}

function handleReportFilterSubmit(event) {
    event.preventDefault();
    dom.reportFilterError.textContent = "";

    const yearMonth = dom.reportMonth.value;
    if (!yearMonth) {
        dom.reportFilterError.textContent = "Por favor, selecione um mês válido.";
        dom.reportMonth.focus();
        return;
    }

    const transactions = getTransactions();
    renderReportTable(transactions, yearMonth);
}

function handleInvestmentSubmit(event) {
    event.preventDefault();
    dom.investmentError.textContent = "";

    const type = dom.investmentType.value.trim();
    const amountRaw = dom.investmentAmount.value;
    const date = dom.investmentDate.value;
    const returnsRaw = dom.investmentReturns.value;

    const amount = parseFloat(amountRaw);
    const returns = returnsRaw === "" ? 0 : parseFloat(returnsRaw);

    const error = validateInvestmentForm(type, amount, date, returns);
    if (error) {
        dom.investmentError.textContent = error;
        return;
    }

    const investments = getInvestments();
    investments.push(new Investment({ type, amount, date, returns }));
    saveInvestments(investments);

    dom.investmentForm.reset();
    updateDashboard();
    updateInvestmentChart(investments);
}

// Initial Setup & Helpers
function updateDashboard() {
    const transactions = getTransactions();
    const investments = getInvestments();
    renderDashboardSummary(transactions, investments);
    updateIncomeExpenseChart(transactions);
    updateInvestmentChart(investments);
}

function setMaxDateInputs() {
    const today = new Date().toISOString().split("T")[0];
    dom.transactionDate.setAttribute("max", today);
    dom.investmentDate.setAttribute("max", today);
    dom.reportMonth.setAttribute("max", today.slice(0, 7));
}

// Initialize Application
function initApp() {
    const session = getUserSession();
    if (!session) {
        showView("login");
        updateNavVisibility(false);
        return;
    }
    updateNavVisibility(true);
    showView("dashboard");
    updateDashboard();
}

// Attach Event Listeners
function attachEventListeners() {
    dom.loginForm.addEventListener("submit", handleLoginSubmit);
    dom.logoutBtn.addEventListener("click", handleLogout);
    dom.navMenu.addEventListener("click", handleNavClick);
    dom.transactionForm.addEventListener("submit", handleTransactionSubmit);
    dom.reportFilterForm.addEventListener("submit", handleReportFilterSubmit);
    dom.investmentForm.addEventListener("submit", handleInvestmentSubmit);
}

// On DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    setMaxDateInputs();
    attachEventListeners();
    initIncomeExpenseChart();
    initInvestmentChart();
    initApp();
});
