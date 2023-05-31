import { GoogleAuth } from 'google_deno_integration';

interface SubRequest {
  url: string;
  headers?: Headers;
  body: unknown;
}

const BOUNDARY = '__END_OF_PART__';

function encodeSubRequest(r: SubRequest) {
  const headers: string[] = [];
  r.headers?.forEach((i, val) => headers.push(`${i}: ${val}`));

  const data = JSON.stringify(r.body);
  return `POST ${r.url} HTTP/1.1
content-length: ${data.length}
content-type: application/json; charset=UTF-8
${headers.join('\n')}

${data}`;
}

function wrapSubRequest(r: SubRequest, t: number) {
  const data = encodeSubRequest(r);
  return `--${BOUNDARY}
content-length: ${data.length}
content-type: application/http
content-id: ${t + 1}
content-transfer-encoding: binary

${data}`;
}

function getMultipartPayload(e: SubRequest[]) {
  const t = e.map((i, s) => wrapSubRequest(i, s)).join('\n') + `\n--${BOUNDARY}--\r\n`;
  return new TextEncoder().encode(t);
}

export interface Credentials {
  clientEmail: string;
  privateKey: string;
  projectId: string;
}

export interface NotificationData {
  title: string;
  body: string;
}

export interface Options {
  notification: NotificationData;
  credentials: Credentials;
}

export async function sendMulticast(tokens: string[], { notification, credentials }: Options) {
  const auth = new GoogleAuth({
    email: credentials.clientEmail,
    scope: ['https://www.googleapis.com/auth/firebase.messaging'],
    key: credentials.privateKey,
  });

  const authToken = await auth.getToken();

  return fetch('https://fcm.googleapis.com/batch', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': `multipart/mixed; boundary=${BOUNDARY}`,
      'Authorization': `Bearer ${authToken}`,
    }),
    body: getMultipartPayload(
      tokens.map((token) => ({
        url: `/v1/projects/${credentials.projectId}/messages:send`,
        body: { message: { token, notification } },
      })),
    ),
  });
}
