/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "echo-black": "#0a0a0f",
        "echo-dark": "#12121a",
        "echo-surface": "#1a1a2e",
        "echo-border": "#2d2d4a",
        "echo-gold": "#c9a84c",
        "echo-red": "#8b2020",
        "echo-text": "#e8e0d0",
        "echo-muted": "#8a8090",
      },
      fontFamily: {
        "serif-display": ["Cinzel", "Georgia", "serif"],
        "body-text": ["Crimson Text", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
