import base from '../tailwind.config.js';

/** Same theme as the product; scan both the product source and the film source for classes. */
export default {
  ...base,
  content: ['../src/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
};
