import { JSX } from 'preact';
import { tw } from 'twind';
import { Variant } from '../utils/rules.ts';

interface Props<T extends EventTarget> extends JSX.HTMLAttributes<T> {
  variant: Variant;
}

export function Card({ variant, class: cls, ...props }: Props<HTMLImageElement>) {
  const cardCls = tw('h-28 object-contain rounded-lg', cls);
  return <img class={cardCls} src={variant.image} {...props} />;
}
