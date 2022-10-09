import * as colors from 'twind/colors';
import { Options } from '$fresh/plugins/twind.ts';

export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      colors,
    },
  },
} as Options;
