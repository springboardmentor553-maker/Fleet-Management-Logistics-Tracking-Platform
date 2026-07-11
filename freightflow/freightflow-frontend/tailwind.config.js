/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0E1316",
        surface: "#161C20",
        "surface-raised": "#1E262B",
        border: "#2A343A",
        ink: "#E7ECEE",
        "ink-muted": "#8A969D",
        signal: {
          DEFAULT: "#E8A33D",
          soft: "#3A2E1B",
        },
        status: {
          available: "#3FBF7F",
          transit: "#4C9AFF",
          alert: "#E5484D",
          idle: "#8A969D",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        data: ["IBM Plex Mono", "monospace"],
      },
      letterSpacing: {
        board: "0.14em",
      },
    },
  },
  plugins: [],
};
