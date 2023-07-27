import { Signal } from '@preact/signals-core';

export interface Props {
  error: Signal<string | null>;
}

export default function ErrorMessage({ error }: Props) {
  if (!error.value) {
    return null;
  }
  return <div class='my-2 text-red-500'>Error: {error.value}</div>;
}
