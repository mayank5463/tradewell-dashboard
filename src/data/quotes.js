// Quotes shown on login greeting + "start investing" empty state.
// "timeOfDay: 'any'" means it can show regardless of morning/afternoon/evening.
export const quotes = [
  { text: "The stock market is a device for transferring money from the impatient to the patient.", timeOfDay: "any" },
  { text: "Good morning — the best trades are made with a calm mind, not a rushed one.", timeOfDay: "morning" },
  { text: "Afternoon check-in: the market doesn't reward guessing, it rewards patience.", timeOfDay: "afternoon" },
  { text: "Evening reflection: review today's trades, not just today's returns.", timeOfDay: "evening" },
  { text: "Every rupee invested today is a lesson bought in advance.", timeOfDay: "any" },
  { text: "You haven't started investing yet — even paper trades teach real habits.", timeOfDay: "emptyState" },
  { text: "The first trade is always the hardest one — start small, learn fast.", timeOfDay: "emptyState" },
];

export const getGreetingQuote = (timeOfDay) => {
  const pool = quotes.filter((q) => q.timeOfDay === timeOfDay || q.timeOfDay === "any");
  return pool[Math.floor(Math.random() * pool.length)];
};

export const getEmptyStateQuote = () => {
  const pool = quotes.filter((q) => q.timeOfDay === "emptyState");
  return pool[Math.floor(Math.random() * pool.length)];
};