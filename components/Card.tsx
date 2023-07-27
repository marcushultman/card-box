import { JSX } from 'preact';
import { tw } from 'twind';
import { Variant } from '../utils/rules.ts';
import { uw } from '../utils/preact/twind.ts';

interface Props<T extends EventTarget> extends JSX.HTMLAttributes<T> {
  variant: Variant;
}

export function Card({ variant, className, ...props }: Props<HTMLImageElement>) {
  const cardCls = tw('h-28 object-contain rounded-lg', uw(className));
  return <img class={cardCls} src={variant.image} {...props} />;
}
