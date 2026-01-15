module.exports = {
  content: ["./index.html", "./src/renderer/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  variants: {
      extend: {
          opacity: [
              "disabled"
          ],
          backgroundColor: [
              "disabled"
          ],
          cursor: [
              "disabled"
          ]
      }
  },
  plugins: [],
};
