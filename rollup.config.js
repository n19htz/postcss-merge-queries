import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';

import packageJson from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      exports: 'default',
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
      exports: 'default',
    },
  ],
  external: ['postcss'],
  plugins: [del({ targets: 'build/*' }), typescript(), terser()],
};
