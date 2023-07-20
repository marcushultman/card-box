import app from '@firebase';
import {
  getAuth,
  getRedirectResult,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { useEffect, useRef } from 'preact/hooks';
import { assert } from '@std/testing/asserts.ts';
import { EMAIL_STORAGE_KEY } from './LoginEmail.tsx';
import { UserIcon } from '../utils/icons/24/outline.ts';

export const LOGIN_TYPE = 'loginType';

export default function FinishLogin({ type }: { type: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const onError = (err?: unknown) => {
    const message = err instanceof Error ? err.message : `Unexpected error: ${err}`;
    location.replace(`/login/email?error=${message}`);
  };

  const login = (accessToken: string) => {
    assert(formRef.current);
    const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
    tokenEl.value = accessToken;
    formRef.current.submit();
  };

  const loginFromLink = async (email: string) => {
    const auth = getAuth(app);
    const result = await signInWithEmailLink(auth, email, location.href).catch(onError);
    if (result) {
      login(result.user.accessToken);
    }
  };

  const loginWithGoogle = async () => {
    const auth = getAuth(app);
    const result = await getRedirectResult(auth).catch(onError);
    if (result) {
      login(result.user.accessToken);
    }
  };

  useEffect(() => {
    const auth = getAuth(app);
    if (type === 'email') {
      const email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
      if (!email) {
        onError();
      } else if (!isSignInWithEmailLink(auth, window.location.href)) {
        onError();
      } else {
        loginFromLink(email);
      }
    } else if (type === 'google') {
      loginWithGoogle();
    } else {
      onError();
    }
  }, []);

  return (
    <div class='fixed flex(& col) gap-4 items-center justify-center w-full h-full'>
      <form class='hidden' method='post' action='/login' ref={formRef}>
        <input name='token' />
      </form>
      <div class='w-12 h-12 animate-bounce'>
        <UserIcon />
      </div>
      <div class='animate-pulse'>Signing in...</div>
    </div>
  );
}
