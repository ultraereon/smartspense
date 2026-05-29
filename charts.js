/**
 * charts.js
 * Integration with Chart.js to render premium interactive charts.
 * Features dark/light theme adjustments and responsive resizing.
 */

let categoryDoughnutChart = null;
let monthlyComparisonChart = null;

// Design system colors (Hex codes matching CSS custom properties)
function getDynamicColors() {
  const rootStyle = getComputedStyle(document.body);
  
  // Retrieve color tokens from CSS variables
  const primary = rootStyle.getPropertyValue('--primary').trim();
  const secondary = rootStyle.getPropertyValue('--secondary').trim();
  const tertiary = rootStyle.getPropertyValue('--tertiary').trim();
  const accentTeal = rootStyle.getPropertyValue('--accent-teal').trim();
  const accentOrange = rootStyle.getPropertyValue('--accent-orange').trim();
  const accentEmerald = rootStyle.getPropertyValue('--accent-emerald').trim();
  const accentRed = rootStyle.getPropertyValue('--accent-red').trim();
  const textSecondary = rootStyle.getPropertyValue('--text-secondary').trim();

  return {
    Food: rootStyle.getPropertyValue('--color-cat-food').trim() || '#E57373',
    Utilities: rootStyle.getPropertyValue('--color-cat-utilities').trim() || '#4DEEEA',
    Entertainment: rootStyle.getPropertyValue('--color-cat-entertainment').trim() || '#C38FFF',
    Housing: rootStyle.getPropertyValue('--color-cat-housing').trim() || '#FFB74D',
    Transport: rootStyle.getPropertyValue('--color-cat-transport').trim() || '#FFD54F',
    Miscellaneous: rootStyle.getPropertyValue('--color-cat-miscellaneous').trim() || '#C1C9C3',
    Salary: rootStyle.getPropertyValue('--color-cat-salary').trim() || '#81C784',
    Freelance: rootStyle.getPropertyValue('--color-cat-freelance').trim() || '#9AD0EC',
    Investments: rootStyle.getPropertyValue('--color-cat-investments').trim() || '#A4C9FF',
    IncomeDefault: rootStyle.getPropertyValue('--color-cat-salary').trim() || '#81C784'
  };
}

// Theme configurations
const getThemeColors = (isDarkMode) => {
  const rootStyle = getComputedStyle(document.body);
  const text = rootStyle.getPropertyValue('--text-primary').trim() || (isDarkMode ? '#E2E8F0' : '#1E293B');
  const grid = isDarkMode ? 'rgba(148, 163, 184, 0.1)' : 'rgba(71, 85, 105, 0.08)';
  const tooltipBg = rootStyle.getPropertyValue('--surface-container-high').trim() || (isDarkMode ? '#1E293B' : '#FFFFFF');
  const tooltipBorder = rootStyle.getPropertyValue('--outline').trim() || (isDarkMode ? '#334155' : '#E2E8F0');
  
  return {
    text,
    grid,
    tooltipBg,
    tooltipBorder
  };
};

/**
 * Initialize or update the Category Expense Doughnut Chart
 */
function updateCategoryChart(transactions, isDarkMode) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const theme = getThemeColors(isDarkMode);

  // Group expense transactions by category
  const categoryTotals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
    });

  const categories = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);
  const dynColors = getDynamicColors();
  const backgroundColors = categories.map(cat => dynColors[cat] || '#A1A1AA');

  if (categoryDoughnutChart) {
    categoryDoughnutChart.destroy();
  }

  if (categories.length === 0) {
    // Render an empty state chart or handle gracefully
    categoryDoughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['No Data'],
        datasets: [{
          data: [1],
          backgroundColor: [isDarkMode ? '#334155' : '#E2E8F0'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        }
      }
    });
    return;
  }

  categoryDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: categories,
      datasets: [{
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: isDarkMode ? 2 : 1,
        borderColor: isDarkMode ? '#1E293B' : '#FFFFFF',
        hoverOffset: 12
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: theme.text,
            font: {
              family: "'Outfit', 'Inter', sans-serif",
              size: 12,
              weight: '500'
            },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.text,
          bodyColor: theme.text,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
          titleFont: { family: "'Outfit', sans-serif", size: 13, weight: '600' },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ${label}: ₹${value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateScale: true,
        animateRotate: true
      }
    }
  });
}

/**
 * Initialize or update the Monthly Trend Comparison Chart (Bar Chart)
 */
function updateMonthlyTrendChart(allTransactions, isDarkMode) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  const theme = getThemeColors(isDarkMode);

  // Group by month-year
  const monthlyData = {};

  allTransactions.forEach(t => {
    if (!t.date) return;
    const dateObj = new Date(t.date);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expense: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += parseFloat(t.amount);
    } else {
      monthlyData[monthKey].expense += parseFloat(t.amount);
    }
  });

  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort();
  
  // Format labels to Month YYYY (e.g., May 2026)
  const labels = sortedMonths.map(m => {
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  });

  const incomeDataset = sortedMonths.map(m => monthlyData[m].income);
  const expenseDataset = sortedMonths.map(m => monthlyData[m].expense);

  if (monthlyComparisonChart) {
    monthlyComparisonChart.destroy();
  }

  // Draw chart using theme variables dynamically
  const rootStyle = getComputedStyle(document.body);
  const incomeColor = rootStyle.getPropertyValue('--primary').trim() || (isDarkMode ? '#76E0A6' : '#006D3C');
  const expenseColor = rootStyle.getPropertyValue('--tertiary').trim() || (isDarkMode ? '#A4C9FF' : '#005FAF');

  monthlyComparisonChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeDataset,
          backgroundColor: incomeColor,
          borderRadius: 8,
          maxBarThickness: 32
        },
        {
          label: 'Expenses',
          data: expenseDataset,
          backgroundColor: expenseColor,
          borderRadius: 8,
          maxBarThickness: 32
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: theme.text,
            font: { family: "'Outfit', sans-serif", size: 12 }
          }
        },
        y: {
          grid: { color: theme.grid },
          ticks: {
            color: theme.text,
            font: { family: "'Inter', sans-serif", size: 11 },
            callback: value => '₹' + value
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: theme.text,
            font: { family: "'Outfit', sans-serif", size: 12, weight: '500' },
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 10
          }
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleColor: theme.text,
          bodyColor: theme.text,
          borderColor: theme.tooltipBorder,
          borderWidth: 1,
          padding: 12,
          titleFont: { family: "'Outfit', sans-serif", size: 13, weight: '600' },
          bodyFont: { family: "'Inter', sans-serif", size: 12 },
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: ₹${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            }
          }
        }
      }
    }
  });
}

// Attach functions to global scope
window.updateCategoryChart = updateCategoryChart;
window.updateMonthlyTrendChart = updateMonthlyTrendChart;
