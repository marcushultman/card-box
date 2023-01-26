import { useEffect, useState } from 'preact/hooks';

export default function (key: string) {
  const value = localStorage.getItem(key);
  const [date, setDate] = useState<Date>(value ? new Date(value) : new Date());

  useEffect(() => {
    localStorage.setItem(key, date.toISOString());
  }, [date]);

  return [date, () => setDate(new Date())] as const;
}
