import { terser } from 'rollup-plugin-terser';

export default {
  input: './reticool.js',
  output: {
    file: 'reticool.min.js',
    format: 'iife'
  },
  plugins: [terser()]
}
