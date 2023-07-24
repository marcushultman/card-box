import { Signal, useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import Switch from '../components/Switch.tsx';
import {
  disableNotifications,
  enableNotifications,
  isNotificationsEnabled,
} from '../utils/messaging.ts';
import { Profile } from '../utils/model_v2.ts';

export interface Props {
  profile: Profile;
  error: Signal<string | null>;
}

export default function ChatNotificationSetting({ profile: profileValue, error }: Props) {
  const profile = useSignal(profileValue);
  const checked = useSignal(false);

  useEffect(() => {
    checked.value = isNotificationsEnabled(profile.value);
  }, []);

  const toggle = async () => {
    if (!checked.value) {
      try {
        await enableNotifications(profile);
        error.value = null;
      } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : String(err);
        setTimeout(() => checked.value = false, 150);
      }
    } else {
      await disableNotifications(profile);
    }
    checked.value = !checked.value;
  };

  return (
    <div class='flex items-center'>
      <div class='flex-1'>
        <div>Notifications</div>
        <div class='pt-1 text-xs'>Get push notifications for chat messages or game events</div>
      </div>
      <Switch checked={checked.value} onChange={toggle} />
    </div>
  );
}
