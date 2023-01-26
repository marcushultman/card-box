import { useSignal } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import Switch from '../components/Switch.tsx';
import { enableNotifications, isNotificationsEnabled } from '../utils/messaging.ts';
import { Profile } from '../utils/model_v2.ts';

export default function ChatNotificationSetting({ profile: profileValue }: { profile: Profile }) {
  const profile = useSignal(profileValue);
  const checked = useSignal(false);

  useEffect(() => {
    checked.value = isNotificationsEnabled(profile.value);
  }, []);

  const toggle = async () => {
    if (!checked.value) {
      try {
        await enableNotifications(profile);
      } catch (_: unknown) {
        setTimeout(() => checked.value = false, 150);
      }
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
