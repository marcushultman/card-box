import { Signal } from '@preact/signals-core';
import { JSX } from 'preact';
import { Token } from 'twind';

export function uw(className: JSX.Signalish<Token>): Token {
  return className instanceof Signal ? className.value : className;
}
