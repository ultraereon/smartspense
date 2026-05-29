/**
 * app.js
 * Core logic, state management, LocalStorage persistence,
 * and user interactions for the Premium Expense Tracker.
 */

// Application State
let state = {
  transactions: [],
  budgets: {},
  theme: 'dark',
  filters: {
    search: '',
    category: 'all',
    type: 'all',
    month: 'current' // 'current', 'last', 'all' or 'YYYY-MM'
  },
  editingId: null
};

// Initialize the Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  setupMonthSelector();
  setupEventListeners();
  clearTransactionForm();
  handleIncomingShortcut();
  setupSiriUrlBuilder();
  render();
});

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('expense_tracker_theme');
  if (savedTheme) {
    state.theme = savedTheme;
  } else {
    // Check system preference
    state.theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  applyTheme();
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('expense_tracker_theme', state.theme);
  applyTheme();
}

function applyTheme() {
  const body = document.body;
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const themeToggleText = document.getElementById('themeToggleText');
  
  if (state.theme === 'light') {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    if (themeToggleIcon) themeToggleIcon.setAttribute('data-lucide', 'moon');
    if (themeToggleText) themeToggleText.textContent = 'Dark Mode';
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    if (themeToggleIcon) themeToggleIcon.setAttribute('data-lucide', 'sun');
    if (themeToggleText) themeToggleText.textContent = 'Light Mode';
  }
  
  // Re-render icons and update charts since grid colors change
  if (window.lucide) window.lucide.createIcons();
  
  // Update charts if they exist
  if (typeof updateCategoryChart === 'function' && state.transactions.length > 0) {
    updateCharts();
  }
}

// --- Data Management (LocalStorage & Seeding) ---
function loadData() {
  const localTransactions = localStorage.getItem('expense_tracker_transactions');
  const localBudgets = localStorage.getItem('expense_tracker_budgets');
  
  if (localTransactions) {
    state.transactions = JSON.parse(localTransactions);
  } else {
    state.transactions = []; // Start empty by default!
  }

  if (localBudgets) {
    state.budgets = JSON.parse(localBudgets);
  } else {
    state.budgets = { ...window.DEFAULT_BUDGETS };
  }
}

function saveToLocalStorage() {
  localStorage.setItem('expense_tracker_transactions', JSON.stringify(state.transactions));
  localStorage.setItem('expense_tracker_budgets', JSON.stringify(state.budgets));
}

// --- Month Filter Setup ---
function setupMonthSelector() {
  const monthFilter = document.getElementById('filterMonth');
  if (!monthFilter) return;

  // Clear existing options
  monthFilter.innerHTML = '';

  // Add default filters
  const currentOpt = document.createElement('option');
  currentOpt.value = 'current';
  currentOpt.textContent = 'Current Month';
  monthFilter.appendChild(currentOpt);

  const lastOpt = document.createElement('option');
  lastOpt.value = 'last';
  lastOpt.textContent = 'Last Month';
  monthFilter.appendChild(lastOpt);

  const allOpt = document.createElement('option');
  allOpt.value = 'all';
  allOpt.textContent = 'All Time';
  monthFilter.appendChild(allOpt);

  // Dynamically find other months present in data
  const months = new Set();
  state.transactions.forEach(t => {
    if (t.date) {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    }
  });

  // Sort months descending
  const sortedMonths = Array.from(months).sort().reverse();
  
  sortedMonths.forEach(m => {
    const [year, monthVal] = m.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthVal) - 1, 1);
    const label = dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    
    // Avoid duplicating if it matches current or last month
    const curMonthKey = getMonthKey(0);
    const lastMonthKey = getMonthKey(-1);
    
    if (m !== curMonthKey && m !== lastMonthKey) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = label;
      monthFilter.appendChild(opt);
    }
  });

  // Re-apply filter value
  monthFilter.value = state.filters.month;
}

// Helper to get Year-Month key relative to current date (0 = current, -1 = last, etc.)
function getMonthKey(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Filter transactions by the selected month
function getTransactionsByMonth(transactions, monthFilterVal) {
  if (monthFilterVal === 'all') return transactions;
  
  let targetKey = '';
  if (monthFilterVal === 'current') {
    targetKey = getMonthKey(0);
  } else if (monthFilterVal === 'last') {
    targetKey = getMonthKey(-1);
  } else {
    targetKey = monthFilterVal; // e.g. "2026-05"
  }

  return transactions.filter(t => {
    if (!t.date) return false;
    const tKey = t.date.substring(0, 7); // Gets YYYY-MM
    return tKey === targetKey;
  });
}

// --- Calculation & Reporting ---
function calculateOverview(filteredTransactions) {
  let income = 0;
  let expenses = 0;

  filteredTransactions.forEach(t => {
    const amount = parseFloat(t.amount);
    if (t.type === 'income') {
      income += amount;
    } else {
      expenses += amount;
    }
  });

  const netBalance = income - expenses;
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

  return {
    income,
    expenses,
    netBalance,
    savingsRate: savingsRate > 0 ? Math.round(savingsRate) : 0
  };
}

// --- Render Operations ---
function render() {
  const isLedgerEmpty = state.transactions.length === 0;
  const overlay = document.getElementById('welcomeOverlay');
  const chartsSec = document.getElementById('dashboardChartsSection');
  const welcomeSec = document.getElementById('welcomeFeaturesSection');

  if (isLedgerEmpty) {
    if (chartsSec) chartsSec.classList.add('hidden');
    if (welcomeSec) welcomeSec.classList.remove('hidden');
    
    // First time welcome overlay trigger
    const onboardingShown = localStorage.getItem('smartspense_onboarding_shown');
    if (!onboardingShown) {
      if (overlay) overlay.classList.remove('hidden');
    }
  } else {
    if (overlay) overlay.classList.add('hidden');
    if (chartsSec) chartsSec.classList.remove('hidden');
    if (welcomeSec) welcomeSec.classList.add('hidden');
  }

  const monthTransactions = getTransactionsByMonth(state.transactions, state.filters.month);
  
  // Apply Search & Category filters
  const filtered = monthTransactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(state.filters.search.toLowerCase()) || 
                          t.category.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                          (t.notes && t.notes.toLowerCase().includes(state.filters.search.toLowerCase()));
    
    const matchesCategory = state.filters.category === 'all' || t.category.toLowerCase() === state.filters.category.toLowerCase();
    const matchesType = state.filters.type === 'all' || t.type === state.filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });

  // Calculate Overview based on selected month data
  const overview = calculateOverview(monthTransactions);
  updateOverviewCards(overview);

  // Render Sub-components
  renderTransactionsList(filtered);
  renderBudgets(monthTransactions);
  updateCharts(filtered, monthTransactions);

  // Update SVG Icons
  if (window.lucide) window.lucide.createIcons();
}

function updateOverviewCards(overview) {
  const balanceVal = document.getElementById('overviewBalance');
  const incomeVal = document.getElementById('overviewIncome');
  const expenseVal = document.getElementById('overviewExpense');
  const savingsVal = document.getElementById('overviewSavings');

  // Helper to format currency
  const fmt = (num) => '₹' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (balanceVal) {
    balanceVal.textContent = fmt(overview.netBalance);
    // Dynamic color depending on surplus/deficit
    const card = balanceVal.closest('.kpi-card');
    if (overview.netBalance < 0) {
      card.classList.add('negative-balance');
    } else {
      card.classList.remove('negative-balance');
    }
  }
  if (incomeVal) incomeVal.textContent = fmt(overview.income);
  if (expenseVal) expenseVal.textContent = fmt(overview.expenses);
  if (savingsVal) savingsVal.textContent = overview.savingsRate + '%';
}

function updateCharts(filteredTransactions = null, monthTransactions = null) {
  if (!filteredTransactions) {
    const monthTx = getTransactionsByMonth(state.transactions, state.filters.month);
    filteredTransactions = monthTx;
    monthTransactions = monthTx;
  }

  const isDark = state.theme === 'dark';
  
  if (typeof updateCategoryChart === 'function') {
    // Category doughnut focuses on currently filtered/viewed transactions
    updateCategoryChart(filteredTransactions, isDark);
  }
  if (typeof updateMonthlyTrendChart === 'function') {
    // Trend comparisons always look at historical data
    updateMonthlyTrendChart(state.transactions, isDark);
  }
}

function renderTransactionsList(list) {
  const tbody = document.getElementById('transactionTableBody');
  const emptyState = document.getElementById('emptyStateContainer');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (list.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  // Sort: default to newest date first
  const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

  sorted.forEach(t => {
    const tr = document.createElement('tr');
    tr.className = `transaction-row ${t.type}`;
    
    const formattedAmount = `${t.type === 'income' ? '+' : '-'}₹${parseFloat(t.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

    const dateFormatted = new Date(t.date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const categoryIcon = getCategoryIcon(t.category);

    tr.innerHTML = `
      <td class="col-date">${dateFormatted}</td>
      <td class="col-desc">
        <div class="desc-content">
          <span class="desc-title">${escapeHTML(t.description)}</span>
          ${t.notes ? `<span class="desc-notes">${escapeHTML(t.notes)}</span>` : ''}
        </div>
      </td>
      <td class="col-cat">
        <span class="category-badge cat-${t.category.toLowerCase()}">
          <i data-lucide="${categoryIcon}"></i>
          ${t.category}
        </span>
      </td>
      <td class="col-amount amount-${t.type}">${formattedAmount}</td>
      <td class="col-actions">
        <button class="btn-action edit" onclick="editTransaction('${t.id}')" title="Edit Transaction">
          <i data-lucide="edit-3"></i>
        </button>
        <button class="btn-action delete" onclick="deleteTransaction('${t.id}')" title="Delete Transaction">
          <i data-lucide="trash-2"></i>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBudgets(monthTransactions) {
  const budgetList = document.getElementById('budgetProgressList');
  if (!budgetList) return;

  budgetList.innerHTML = '';

  // Sum spending in current active month
  const categorySpending = {};
  monthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + parseFloat(t.amount);
    });

  // Get active budget categories
  const categories = Object.keys(state.budgets);

  categories.forEach(cat => {
    const limit = state.budgets[cat];
    const spent = categorySpending[cat] || 0;
    const percent = Math.min((spent / limit) * 100, 100);
    const isOver = spent > limit;
    
    // Status colors: Red if over, Orange if >= 85%, Green otherwise
    let barColor = 'var(--accent-teal)';
    if (isOver) {
      barColor = 'var(--accent-red)';
    } else if (percent >= 85) {
      barColor = 'var(--accent-orange)';
    }

    const budgetItem = document.createElement('div');
    budgetItem.className = 'budget-item';
    budgetItem.innerHTML = `
      <div class="budget-meta">
        <span class="budget-cat-name">${cat}</span>
        <span class="budget-values">
          <strong>₹${spent.toLocaleString(undefined, {maximumFractionDigits:0})}</strong> 
          / ₹${limit.toLocaleString(undefined, {maximumFractionDigits:0})}
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${percent}%; background-color: ${barColor}"></div>
      </div>
      ${isOver ? `<span class="budget-warning">Over budget by ₹${(spent - limit).toFixed(2)}</span>` : ''}
    `;

    budgetList.appendChild(budgetItem);
  });

  // Populate dynamic category selector in Budget Editor modal
  const budgetCatSelect = document.getElementById('budgetSelectCategory');
  if (budgetCatSelect && budgetCatSelect.children.length === 0) {
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      budgetCatSelect.appendChild(opt);
    });
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  // Theme Toggle
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Month Filter
  const monthFilter = document.getElementById('filterMonth');
  if (monthFilter) {
    monthFilter.addEventListener('change', (e) => {
      state.filters.month = e.target.value;
      render();
    });
  }

  // Type Filter
  const typeFilter = document.getElementById('filterType');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      state.filters.type = e.target.value;
      render();
    });
  }

  // Category Filter
  const catFilter = document.getElementById('filterCategory');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      render();
    });
  }

  // Search Input (Debounced)
  const searchInput = document.getElementById('searchQuery');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.filters.search = e.target.value;
        render();
      }, 250);
    });
  }

  // Add/Edit Transaction Form
  const form = document.getElementById('transactionForm');
  if (form) {
    form.addEventListener('submit', handleTransactionSubmit);
    
    // Dynamic Form Category Selection based on Type (Income vs Expense)
    const typeSelect = document.getElementById('txType');
    typeSelect.addEventListener('change', handleFormTypeChange);
  }

  // Reset form button
  const resetFormBtn = document.getElementById('btnResetForm');
  if (resetFormBtn) {
    resetFormBtn.addEventListener('click', clearTransactionForm);
  }

  // Budget Edit Form
  const budgetForm = document.getElementById('budgetEditForm');
  if (budgetForm) {
    budgetForm.addEventListener('submit', handleBudgetSubmit);
    
    // Load current budget value when category changes in budget form
    const budgetSelectCat = document.getElementById('budgetSelectCategory');
    const budgetInputVal = document.getElementById('budgetValue');
    
    if (budgetSelectCat && budgetInputVal) {
      const updateBudgetInputValue = () => {
        const cat = budgetSelectCat.value;
        budgetInputVal.value = state.budgets[cat] || '';
      };
      
      budgetSelectCat.addEventListener('change', updateBudgetInputValue);
      // Trigger initially
      setTimeout(updateBudgetInputValue, 100);
    }
  }

  // CSV Export
  const btnExportCSV = document.getElementById('btnExportCSV');
  if (btnExportCSV) btnExportCSV.addEventListener('click', exportToCSV);

  // Backup Export
  const btnBackupExport = document.getElementById('btnBackupExport');
  if (btnBackupExport) btnBackupExport.addEventListener('click', exportToJSON);

  // Backup Import
  const fileImportInput = document.getElementById('fileImportBackup');
  if (fileImportInput) {
    fileImportInput.addEventListener('change', importFromJSON);
  }

  // Wipe Data / Factory Reset
  const btnFactoryReset = document.getElementById('btnFactoryReset');
  if (btnFactoryReset) {
    btnFactoryReset.addEventListener('click', handleFactoryReset);
  }

}

// Handle Form type select change (Salary/Freelance/Investments for Income; food/utilities/etc for Expense)
function handleFormTypeChange() {
  const type = document.getElementById('txType').value;
  const categorySelect = document.getElementById('txCategory');
  if (!categorySelect) return;

  categorySelect.innerHTML = '';

  const options = type === 'income' 
    ? ['Salary', 'Freelance', 'Investments', 'Miscellaneous']
    : ['Food', 'Utilities', 'Entertainment', 'Housing', 'Transport', 'Miscellaneous'];

  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt;
    el.textContent = opt;
    categorySelect.appendChild(el);
  });
}

// Clear transaction input form
function clearTransactionForm() {
  const form = document.getElementById('transactionForm');
  if (!form) return;
  form.reset();
  state.editingId = null;
  
  // Reset form layout/labels
  document.getElementById('txFormSubmitBtn').innerHTML = '<i data-lucide="plus"></i> Add Transaction';
  document.getElementById('formTitle').textContent = 'Add Transaction';
  document.getElementById('btnResetForm').classList.add('hidden');
  
  // Set default date to today
  document.getElementById('txDate').valueAsDate = new Date();
  
  handleFormTypeChange(); // ensure category options match type
  if (window.lucide) window.lucide.createIcons();
}

// Create or update a transaction
function handleTransactionSubmit(e) {
  e.preventDefault();

  const desc = document.getElementById('txDescription').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const type = document.getElementById('txType').value;
  const category = document.getElementById('txCategory').value;
  const date = document.getElementById('txDate').value;
  const notes = document.getElementById('txNotes').value.trim();

  if (!desc || isNaN(amount) || amount <= 0 || !date) {
    alert('Please fill out all required fields with valid values.');
    return;
  }

  const transactionData = {
    id: state.editingId || 'tx-' + Date.now(),
    description: desc,
    amount: amount,
    type: type,
    category: category,
    date: date,
    notes: notes || null
  };

  if (state.editingId) {
    // Editing existing
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx !== -1) {
      state.transactions[idx] = transactionData;
    }
  } else {
    // Creating new
    state.transactions.push(transactionData);
  }

  saveToLocalStorage();
  setupMonthSelector(); // In case a transaction is added to a new month
  clearTransactionForm();
  render();
  
  // Show visual toast notification (optional premium detail)
  showToast(state.editingId ? 'Transaction updated successfully!' : 'Transaction added successfully!');
}

// Edit handler (triggered from button onclick)
function editTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;

  state.editingId = id;

  // Populating form values
  document.getElementById('txDescription').value = tx.description;
  document.getElementById('txAmount').value = tx.amount;
  document.getElementById('txType').value = tx.type;
  
  // Populate category options for this type and select it
  handleFormTypeChange();
  document.getElementById('txCategory').value = tx.category;
  
  document.getElementById('txDate').value = tx.date;
  document.getElementById('txNotes').value = tx.notes || '';

  // Update layout button visual
  document.getElementById('txFormSubmitBtn').innerHTML = '<i data-lucide="check"></i> Update';
  document.getElementById('formTitle').textContent = 'Edit Transaction';
  document.getElementById('btnResetForm').classList.remove('hidden');

  // Scroll to form on mobile view
  document.getElementById('transactionFormSection').scrollIntoView({ behavior: 'smooth' });

  if (window.lucide) window.lucide.createIcons();
}

// Delete handler (triggered from button onclick)
function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;

  state.transactions = state.transactions.filter(t => t.id !== id);
  saveToLocalStorage();
  setupMonthSelector();
  render();
  showToast('Transaction deleted.');
  
  // If we were editing the deleted transaction, clear the form
  if (state.editingId === id) {
    clearTransactionForm();
  }
}

// Update Category Budgets
function handleBudgetSubmit(e) {
  e.preventDefault();

  const category = document.getElementById('budgetSelectCategory').value;
  const value = parseFloat(document.getElementById('budgetValue').value);

  if (isNaN(value) || value < 0) {
    alert('Please enter a valid budget amount.');
    return;
  }

  state.budgets[category] = value;
  saveToLocalStorage();
  render();
  showToast(`Updated budget for ${category} to ₹${value}`);
}

// --- Data Export & Import Functions ---

// Export transactions list to CSV file
function exportToCSV() {
  const currentMonthTx = getTransactionsByMonth(state.transactions, state.filters.month);
  
  if (currentMonthTx.length === 0) {
    alert('No transactions to export in the selected filter range.');
    return;
  }

  let csvContent = 'data:text/csv;charset=utf-8,';
  // Headers
  csvContent += 'Date,Description,Type,Category,Amount,Notes\r\n';

  currentMonthTx.forEach(t => {
    const row = [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.type,
      t.category,
      t.amount,
      t.notes ? `"${t.notes.replace(/"/g, '""')}"` : ''
    ].join(',');
    csvContent += row + '\r\n';
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const filename = `expenses_export_${state.filters.month}_${new Date().toISOString().substring(0, 10)}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Backup current state to a JSON file
function exportToJSON() {
  const exportState = {
    transactions: state.transactions,
    budgets: state.budgets,
    version: '1.0.0'
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportState, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  const filename = `budget_backup_${new Date().toISOString().substring(0, 10)}.json`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Restore state from JSON file
function importFromJSON(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const importedData = JSON.parse(evt.target.result);
      
      // Basic structure validation
      if (!importedData.transactions || !Array.isArray(importedData.transactions) || !importedData.budgets) {
        throw new Error('Invalid file structure. Make sure this is a backup JSON exported from the app.');
      }

      state.transactions = importedData.transactions;
      state.budgets = importedData.budgets;
      saveToLocalStorage();
      setupMonthSelector();
      render();
      showToast('Backup restored successfully!');
      
      // Reset file input
      e.target.value = '';
    } catch (err) {
      alert('Error parsing JSON backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// Wipes database and resets to clean onboarding state
function handleFactoryReset() {
  if (!confirm('CAUTION: This will delete ALL your current transactions and budgets, and reset the application to a fresh onboarding state. Proceed?')) return;

  localStorage.removeItem('expense_tracker_transactions');
  localStorage.removeItem('expense_tracker_budgets');
  localStorage.removeItem('smartspense_onboarding_shown'); // Clear flag to trigger overlay again
  
  loadData();
  setupMonthSelector();
  clearTransactionForm();
  render();
  showToast('Database reset to empty onboarding state.');
}

// --- Helpers ---

// Get icon name corresponding to a category for Lucide Icon updates
function getCategoryIcon(category) {
  const iconMap = {
    Salary: 'banknote',
    Freelance: 'laptop',
    Investments: 'trending-up',
    Food: 'utensils',
    Utilities: 'zap',
    Entertainment: 'film',
    Housing: 'home',
    Transport: 'car',
    Miscellaneous: 'help-circle'
  };
  return iconMap[category] || 'help-circle';
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="info" class="toast-icon"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Trigger animations
  setTimeout(() => toast.classList.add('visible'), 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Set up edit/delete globals so they can be triggered from onclick strings
window.editTransaction = editTransaction;
window.deleteTransaction = deleteTransaction;

// --- Guided Tour & Demo Seeding Operations ---
let tourState = {
  active: false,
  currentStep: 0,
  steps: [
    {
      elementId: 'overviewBalance',
      title: 'Dynamic KPI Metrics',
      description: 'See your real-time Net Balance, overall income, and monthly expenditure as you record transactions. It turns red in a deficit.',
      placement: 'bottom'
    },
    {
      elementId: 'transactionFormSection',
      title: 'Ledger Records Form',
      description: 'Record your earnings and expenses. Selecting "Income" or "Expense" dynamically changes the available categories.',
      placement: 'right'
    },
    {
      elementId: 'budgetProgressList',
      title: 'Target Budgets Tracker',
      description: 'Define spending limits per category. SmartSpense warns you with green, orange, and red indicators based on your actual outgoings.',
      placement: 'left'
    },
    {
      elementId: 'btnExportCSV',
      title: 'Data Portability',
      description: 'Generate spreadsheet reports, download complete backup snapshots of your data, or upload files to restore details.',
      placement: 'top'
    },
    {
      elementId: 'transactionTableBody',
      title: 'Ledger Registry',
      description: 'Review dates, categories, and amounts. You can edit transactions inline or delete entries instantly.',
      placement: 'top'
    }
  ]
};

function startTour() {
  tourState.active = true;
  tourState.currentStep = 0;
  document.body.classList.add('tutorial-overlay-active');
  const box = document.getElementById('tutorialBox');
  if (box) box.classList.remove('hidden');
  renderTourStep();
}

function endTour() {
  tourState.active = false;
  document.body.classList.remove('tutorial-overlay-active');
  const box = document.getElementById('tutorialBox');
  if (box) box.classList.add('hidden');
  
  // Clear highlights
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
}

function renderTourStep() {
  const step = tourState.steps[tourState.currentStep];
  const targetEl = document.getElementById(step.elementId) || document.querySelector('.' + step.elementId);
  
  // Remove previous highlights
  document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  
  if (!targetEl) {
    nextTourStep();
    return;
  }
  
  // Highlight target
  targetEl.classList.add('tour-highlight');
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Update text
  document.getElementById('tourStepIndicator').textContent = `Step ${tourState.currentStep + 1} of ${tourState.steps.length}`;
  document.getElementById('tourTitle').textContent = step.title;
  document.getElementById('tourDescription').textContent = step.description;
  
  // Position box
  positionTourBox(targetEl, step.placement);
  
  // Prev button disabled on first step
  document.getElementById('btnTourPrev').disabled = tourState.currentStep === 0;
  
  // Next button turns to Finish on last step
  document.getElementById('btnTourNext').innerHTML = tourState.currentStep === tourState.steps.length - 1 
    ? 'Finish <i data-lucide="check"></i>' 
    : 'Next <i data-lucide="chevron-right"></i>';
    
  if (window.lucide) window.lucide.createIcons();
}

function positionTourBox(targetEl, placement) {
  const box = document.getElementById('tutorialBox');
  if (!box) return;
  
  const targetRect = targetEl.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  
  let top = 0;
  let left = 0;
  const padding = 15;
  
  box.className = 'tutorial-box';
  
  switch(placement) {
    case 'bottom':
      top = targetRect.bottom + padding + window.scrollY;
      left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2) + window.scrollX;
      box.classList.add('arrow-top');
      break;
    case 'top':
      top = targetRect.top - boxRect.height - padding + window.scrollY;
      left = targetRect.left + (targetRect.width / 2) - (boxRect.width / 2) + window.scrollX;
      box.classList.add('arrow-bottom');
      break;
    case 'left':
      top = targetRect.top + (targetRect.height / 2) - (boxRect.height / 2) + window.scrollY;
      left = targetRect.left - boxRect.width - padding + window.scrollX;
      box.classList.add('arrow-right');
      break;
    case 'right':
      top = targetRect.top + (targetRect.height / 2) - (boxRect.height / 2) + window.scrollY;
      left = targetRect.right + padding + window.scrollX;
      box.classList.add('arrow-left');
      break;
  }
  
  // Constrain bounds
  if (left < padding) left = padding;
  if (left + boxRect.width > window.innerWidth - padding) {
    left = window.innerWidth - boxRect.width - padding;
  }
  if (top < padding) top = padding;
  
  box.style.top = `${top}px`;
  box.style.left = `${left}px`;
  box.style.position = 'absolute';
}

function nextTourStep() {
  if (tourState.currentStep < tourState.steps.length - 1) {
    tourState.currentStep++;
    renderTourStep();
  } else {
    endTour();
    showToast('Tour completed! You are ready to go.');
  }
}

function prevTourStep() {
  if (tourState.currentStep > 0) {
    tourState.currentStep--;
    renderTourStep();
  }
}

function loadDemoData() {
  state.transactions = [...window.SEED_TRANSACTIONS];
  state.budgets = { ...window.DEFAULT_BUDGETS };
  saveToLocalStorage();
  setupMonthSelector();
  render();
  showToast('Demo database loaded successfully!');
}

// Window resize positioning update listener
window.addEventListener('resize', () => {
  if (tourState.active) {
    const step = tourState.steps[tourState.currentStep];
    const targetEl = document.getElementById(step.elementId) || document.querySelector('.' + step.elementId);
    if (targetEl) {
      positionTourBox(targetEl, step.placement);
    }
  }
});

// Onboarding Welcome Overlay controllers
function dismissWelcomeOverlay() {
  const overlay = document.getElementById('welcomeOverlay');
  if (overlay) overlay.classList.add('hidden');
  localStorage.setItem('smartspense_onboarding_shown', 'true');
}

function startTourFromOverlay() {
  dismissWelcomeOverlay();
  startTour();
}

// Export tour functions globally at end of evaluation
window.startTour = startTour;
window.endTour = endTour;
window.nextTourStep = nextTourStep;
window.prevTourStep = prevTourStep;
window.loadDemoData = loadDemoData;
window.startTourFromOverlay = startTourFromOverlay;
window.dismissWelcomeOverlay = dismissWelcomeOverlay;

// --- Siri Shortcuts Integration ---
function handleIncomingShortcut() {
  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get('action');
  
  if (action !== 'add-tx') return;

  const desc = urlParams.get('description') || urlParams.get('desc');
  const amountStr = urlParams.get('amount');
  const type = urlParams.get('type') || 'expense';
  let category = urlParams.get('category');
  const notes = urlParams.get('notes');
  const dateStr = urlParams.get('date');
  const auto = urlParams.get('auto') === 'true';

  if (!desc || !amountStr) {
    showToast('Siri Shortcut Error: Description and Amount are required.');
    // Clean up URL parameters to keep screen clean
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  // Clean amountStr of any currency symbols, commas, or spaces (e.g. "Rs. 2,500.00" -> "2500.00")
  const cleanAmountStr = amountStr.replace(/[^\d.-]/g, '');
  const amount = parseFloat(cleanAmountStr);
  if (isNaN(amount) || amount <= 0) {
    showToast('Siri Shortcut Error: Invalid Amount.');
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  // Validate type
  const validTypes = ['income', 'expense'];
  const finalType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'expense';

  // Validate and map category
  const incomeCategories = ['Salary', 'Freelance', 'Investments', 'Miscellaneous'];
  const expenseCategories = ['Food', 'Utilities', 'Entertainment', 'Housing', 'Transport', 'Miscellaneous'];
  const validCategories = finalType === 'income' ? incomeCategories : expenseCategories;
  
  // Find case-insensitive match or fallback to Miscellaneous
  let finalCategory = 'Miscellaneous';
  if (category) {
    const matched = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
    if (matched) {
      finalCategory = matched;
    }
  }

  // Date validation
  let finalDate = dateStr;
  if (!finalDate || isNaN(Date.parse(finalDate))) {
    finalDate = new Date().toISOString().split('T')[0]; // Default to today's date YYYY-MM-DD
  }

  if (auto) {
    // Add transaction automatically
    const transactionData = {
      id: 'tx-' + Date.now(),
      description: desc.trim(),
      amount: amount,
      type: finalType,
      category: finalCategory,
      date: finalDate,
      notes: notes ? notes.trim() : null
    };

    state.transactions.push(transactionData);
    saveToLocalStorage();
    setupMonthSelector();
    
    // Custom Siri Toast with premium animation
    showSiriSuccessToast(`Added via Siri Shortcut`, `${desc} — ₹${amount.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
    
    // Clean up URL query parameters to avoid duplicate submission on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    // Pre-fill the form for user review
    document.getElementById('txDescription').value = desc.trim();
    document.getElementById('txAmount').value = amount;
    document.getElementById('txType').value = finalType;
    
    // Trigger category dropdown refresh based on type
    handleFormTypeChange();
    document.getElementById('txCategory').value = finalCategory;
    document.getElementById('txDate').value = finalDate;
    if (notes) {
      document.getElementById('txNotes').value = notes.trim();
    }

    // Scroll form into view
    const formSec = document.getElementById('transactionFormSection');
    if (formSec) {
      setTimeout(() => {
        formSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }

    // Custom Siri Toast explaining action
    showSiriSuccessToast(`Pre-filled via Siri Shortcut`, `Review details and click Add Transaction to save.`);

    // Clean up URL query parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function showSiriSuccessToast(title, message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast siri-shortcut-toast';
  toast.innerHTML = `
    <div class="siri-pulse-container">
      <div class="siri-pulse"></div>
      <i data-lucide="zap" class="siri-toast-icon"></i>
    </div>
    <div class="siri-toast-content">
      <div class="siri-toast-title">${title}</div>
      <div class="siri-toast-message">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  // Trigger animations
  setTimeout(() => toast.classList.add('visible'), 10);

  // Remove toast
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function setupSiriUrlBuilder() {
  const siriDesc = document.getElementById('siriDesc');
  const siriAmount = document.getElementById('siriAmount');
  const siriType = document.getElementById('siriType');
  const siriCategory = document.getElementById('siriCategory');
  const siriAuto = document.getElementById('siriAuto');
  const siriGeneratedUrl = document.getElementById('siriGeneratedUrl');
  const btnCopySiriUrl = document.getElementById('btnCopySiriUrl');
  const btnTestSiriUrl = document.getElementById('btnTestSiriUrl');
  const siriGuideToggle = document.getElementById('siriGuideToggle');
  const siriGuideSection = document.getElementById('siriGuideSection');

  if (!siriDesc || !siriAmount || !siriType || !siriCategory || !siriAuto || !siriGeneratedUrl) return;

  // Handle Siri Type change (dynamically load categories)
  const handleSiriTypeChange = () => {
    const type = siriType.value;
    siriCategory.innerHTML = '';
    const options = type === 'income' 
      ? ['Salary', 'Freelance', 'Investments', 'Miscellaneous']
      : ['Food', 'Utilities', 'Entertainment', 'Housing', 'Transport', 'Miscellaneous'];

    options.forEach(opt => {
      const el = document.createElement('option');
      el.value = opt;
      el.textContent = opt;
      siriCategory.appendChild(el);
    });
    updateSiriUrl();
  };

  const updateSiriUrl = () => {
    const base = window.location.origin + window.location.pathname;
    const desc = encodeURIComponent(siriDesc.value.trim() || 'Coffee');
    const amount = parseFloat(siriAmount.value) || 150;
    const type = siriType.value;
    const cat = siriCategory.value;
    const auto = siriAuto.checked;
    
    const url = `${base}?action=add-tx&amount=${amount}&desc=${desc}&category=${cat}&type=${type}&auto=${auto}`;
    siriGeneratedUrl.value = url;
  };

  // Event Listeners for builder changes
  siriType.addEventListener('change', handleSiriTypeChange);
  siriDesc.addEventListener('input', updateSiriUrl);
  siriAmount.addEventListener('input', updateSiriUrl);
  siriCategory.addEventListener('change', updateSiriUrl);
  siriAuto.addEventListener('change', updateSiriUrl);

  // Initialize category options and url
  handleSiriTypeChange();

  // Copy button
  if (btnCopySiriUrl) {
    btnCopySiriUrl.addEventListener('click', () => {
      siriGeneratedUrl.select();
      siriGeneratedUrl.setSelectionRange(0, 99999); // For mobile devices
      navigator.clipboard.writeText(siriGeneratedUrl.value)
        .then(() => {
          const originalHTML = btnCopySiriUrl.innerHTML;
          btnCopySiriUrl.innerHTML = '<i data-lucide="check"></i> Copied!';
          btnCopySiriUrl.classList.add('copied');
          if (window.lucide) window.lucide.createIcons();
          setTimeout(() => {
            btnCopySiriUrl.innerHTML = originalHTML;
            btnCopySiriUrl.classList.remove('copied');
            if (window.lucide) window.lucide.createIcons();
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          showToast('Could not copy automatically. Please copy manually.');
        });
    });
  }

  // Test button
  if (btnTestSiriUrl) {
    btnTestSiriUrl.addEventListener('click', () => {
      // Run it in the current window to demonstrate the action!
      window.location.href = siriGeneratedUrl.value;
    });
  }

  // Guide Toggle Drawer
  if (siriGuideToggle && siriGuideSection) {
    siriGuideToggle.addEventListener('click', () => {
      siriGuideSection.classList.toggle('hidden');
      const icon = siriGuideToggle.querySelector('i');
      if (icon) {
        const isHidden = siriGuideSection.classList.contains('hidden');
        icon.setAttribute('data-lucide', isHidden ? 'chevron-down' : 'chevron-up');
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }
}
