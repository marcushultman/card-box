import { useEffect, useState } from 'preact/hooks';

export default function (key: string) {
  const storage = 'localStorage' in window ? window.localStorage : undefined;
  const value = storage?.getItem(key);
  const [date, setDate] = useState<Date>(value ? new Date(value) : new Date());

  useEffect(() => storage?.setItem(key, date.toISOString()), [date]);

  return [date, () => setDate(new Date())] as const;
}
