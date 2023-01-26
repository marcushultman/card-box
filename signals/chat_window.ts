import { signal } from '@preact/signals';

import { IS_BROWSER } from '$fresh/runtime.ts';
import { Attachment } from '../utils/model_v2.ts';

export function chatVisibilityFromUrl(url: string) {
  return new URL(url).searchParams.has('chat');
}

export default {
  visible: signal(IS_BROWSER && new URLSearchParams(location.search).has('chat')),
  touchOffset: signal(0),
  text: signal<string>(''),
  item: signal<Attachment | null>(null),
};
