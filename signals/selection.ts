import { computed, signal } from '@preact/signals';

export type Selection = { surface: string; item: string; itemVariant: number };

const globalSelection = signal<Selection | undefined>(undefined);

export default globalSelection;
export const selectedItem = computed(() => globalSelection.value?.item);
