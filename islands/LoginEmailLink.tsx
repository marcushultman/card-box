import { tw } from 'twind';
import { JSX } from 'preact';
import app from '@firebase';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useEffect, useRef } from 'preact/hooks';
import { assert } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { EMAIL_STORAGE_KEY } from './LoginEmail.tsx';
import { UserIcon } from '../utils/icons/24/outline.ts';

export default function LoginEmailLink() {
  const formRef = useRef<HTMLFormElement>(null);
  const onError = (err?: unknown) => {
    const message = err instanceof Error ? err.message : 'Unexpected error';
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

  useEffect(() => {
    const auth = getAuth(app);
    const email = window.localStorage.getItem(EMAIL_STORAGE_KEY);
    if (email && isSignInWithEmailLink(auth, window.location.href)) {
      loginFromLink(email);
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
        <UserIcon className='' />
      </div>
      <div class='animate-pulse'>Signing in...</div>
    </div>
  );
}
