import oklchFallback from './postcss-oklch-fallback.js';

const config = {
  plugins: [
    "@tailwindcss/postcss",
    oklchFallback(),
  ],
};

export default config;
