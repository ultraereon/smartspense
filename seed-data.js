/**
 * seed-data.js
 * Rich seed data for the Premium Expense Tracker to ensure
 * a beautiful first-time experience with populated dashboard charts and metrics.
 */

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-indexed

// Helper to get a date string YYYY-MM-DD relative to current month/year
const relativeDate = (day, monthOffset = 0) => {
  const date = new Date(currentYear, currentMonth + monthOffset, day);
  // Ensure we don't accidentally set a future date if day exceeds current month's limits
  return date.toISOString().split('T')[0];
};

const DEFAULT_BUDGETS = {
  'Food': 400,
  'Utilities': 200,
  'Entertainment': 150,
  'Housing': 1200,
  'Transport': 150,
  'Miscellaneous': 100
};

const SEED_TRANSACTIONS = [
  // Last Month's Transactions (to populate historical charts)
  {
    id: 'seed-lm-1',
    description: 'Monthly Salary',
    amount: 4500,
    type: 'income',
    category: 'Salary',
    date: relativeDate(1, -1),
    notes: 'Regular salary deposit.'
  },
  {
    id: 'seed-lm-2',
    description: 'Apartment Rent',
    amount: 1100,
    type: 'expense',
    category: 'Housing',
    date: relativeDate(1, -1),
    notes: 'Monthly rent payment.'
  },
  {
    id: 'seed-lm-3',
    description: 'Power & Gas Utility',
    amount: 145.50,
    type: 'expense',
    category: 'Utilities',
    date: relativeDate(5, -1),
    notes: 'Electricity bill.'
  },
  {
    id: 'seed-lm-4',
    description: 'Supermarket Groceries',
    amount: 185.30,
    type: 'expense',
    category: 'Food',
    date: relativeDate(7, -1),
    notes: 'Weekly grocery haul.'
  },
  {
    id: 'seed-lm-5',
    description: 'Freelance Web Design',
    amount: 750,
    type: 'income',
    category: 'Freelance',
    date: relativeDate(12, -1),
    notes: 'Landing page design client payment.'
  },
  {
    id: 'seed-lm-6',
    description: 'Concert Tickets',
    amount: 120,
    type: 'expense',
    category: 'Entertainment',
    date: relativeDate(15, -1),
    notes: 'Rock concert tickets with friends.'
  },
  {
    id: 'seed-lm-7',
    description: 'Weekly Gas',
    amount: 60,
    type: 'expense',
    category: 'Transport',
    date: relativeDate(18, -1),
    notes: 'Gas tank refill.'
  },
  {
    id: 'seed-lm-8',
    description: 'Dinner Date',
    amount: 75.40,
    type: 'expense',
    category: 'Food',
    date: relativeDate(22, -1),
    notes: 'Sushi dinner.'
  },
  {
    id: 'seed-lm-9',
    description: 'Streaming Subscriptions',
    amount: 29.99,
    type: 'expense',
    category: 'Entertainment',
    date: relativeDate(25, -1),
    notes: 'Netflix and Spotify family plan.'
  },

  // Current Month's Transactions
  {
    id: 'seed-cm-1',
    description: 'Monthly Salary',
    amount: 4500,
    type: 'income',
    category: 'Salary',
    date: relativeDate(1, 0),
    notes: 'Regular salary deposit.'
  },
  {
    id: 'seed-cm-2',
    description: 'Apartment Rent',
    amount: 1100,
    type: 'expense',
    category: 'Housing',
    date: relativeDate(1, 0),
    notes: 'Monthly rent payment.'
  },
  {
    id: 'seed-cm-3',
    description: 'Weekly Groceries',
    amount: 142.10,
    type: 'expense',
    category: 'Food',
    date: relativeDate(3, 0),
    notes: 'Supermarket shopping.'
  },
  {
    id: 'seed-cm-4',
    description: 'Internet Bill',
    amount: 69.99,
    type: 'expense',
    category: 'Utilities',
    date: relativeDate(5, 0),
    notes: 'Fios high-speed internet.'
  },
  {
    id: 'seed-cm-5',
    description: 'Coffee and Bakery',
    amount: 12.50,
    type: 'expense',
    category: 'Food',
    date: relativeDate(8, 0),
    notes: 'Catching up with a colleague.'
  },
  {
    id: 'seed-cm-6',
    description: 'Uber Ride',
    amount: 24.50,
    type: 'expense',
    category: 'Transport',
    date: relativeDate(11, 0),
    notes: 'Ride back home in heavy rain.'
  },
  {
    id: 'seed-cm-7',
    description: 'Side Hustle App Sales',
    amount: 320,
    type: 'income',
    category: 'Investments',
    date: relativeDate(14, 0),
    notes: 'Stripe payout for micro-SaaS app.'
  },
  {
    id: 'seed-cm-8',
    description: 'Movie Night',
    amount: 45,
    type: 'expense',
    category: 'Entertainment',
    date: relativeDate(16, 0),
    notes: 'IMAX tickets and popcorn.'
  },
  {
    id: 'seed-cm-9',
    description: 'Gym Membership',
    amount: 55,
    type: 'expense',
    category: 'Utilities',
    date: relativeDate(20, 0),
    notes: 'Monthly fitness center dues.'
  },
  {
    id: 'seed-cm-10',
    description: 'Farmers Market Organics',
    amount: 88.20,
    type: 'expense',
    category: 'Food',
    date: relativeDate(22, 0),
    notes: 'Fresh veggies, fruits and local honey.'
  },
  {
    id: 'seed-cm-11',
    description: 'New Mechanical Keyboard',
    amount: 135,
    type: 'expense',
    category: 'Miscellaneous',
    date: relativeDate(24, 0),
    notes: 'Developer workstation upgrade.'
  }
];

// Export to window object for standalone script inclusion
window.DEFAULT_BUDGETS = DEFAULT_BUDGETS;
window.SEED_TRANSACTIONS = SEED_TRANSACTIONS;
