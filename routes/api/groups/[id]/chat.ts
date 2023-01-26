import { Handlers } from '$fresh/server.ts';

import sendNotification from '../../../../utils/admin-messaging.ts';

export const handler: Handlers<never, never> = {
  async POST(req, _) {
    const { ids } = await req.json();
    return sendNotification(ids);
  },
};
