import app from '@firebase';
import { getMessaging, getToken, onMessage as _onMessage } from 'firebase/messaging';
import { Signal } from '@preact/signals-core';
import { EMPTY, Observable } from 'rxjs';
import { Profile } from './model_v2.ts';
import { updateProfile } from './loading_v2.ts';

export function isNotificationsEnabled(profile: Profile) {
  console.log(Notification.permission, profile.fcmToken);
  return Notification.permission === 'granted' && profile.fcmToken !== undefined;
}

const PULIC_VAPID_KEY =
  'BOlwYD9SI1CgIc6tVZgx-YqBwALYKODfLhXQPhxDpjGT6pm23oCEXY8ayjaQLgLGHXcvZfcdZSyptiFKU7nZ0fg';

export async function enableNotifications(profile: Signal<Profile>) {
  await Notification.requestPermission();

  const messaging = getMessaging();
  const fcmToken: string = await getToken(messaging, { vapidKey: PULIC_VAPID_KEY });

  await updateProfile(profile.value.id, { fcmToken });

  profile.value = { ...profile.value, fcmToken };
}

export interface FcmOptions {
  analyticsLabel: string;
  link: string;
}

export interface NotificationPayload {
  body: string;
  icon: string;
  image: string;
  title: string;
}

export interface MessagePayload {
  collapseKey: string;
  data: { [key: string]: string };
  fcmOptions: FcmOptions;
  from: string;
  messageId: string;
  notification: NotificationPayload;
}

export function onMessage() {
  try {
    const messaging = getMessaging(app);
    return new Observable<MessagePayload>((o) => _onMessage(messaging, o));
  } catch (_: unknown) {
    return EMPTY;
  }
}
