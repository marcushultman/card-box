import { JSX } from 'preact';
import app from '@firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRef } from 'preact/hooks';
import { assert } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

export default function LoginGoogle(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const formRef = useRef<HTMLFormElement>(null);

  const login = async () => {
    assert(formRef.current);

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    // todo: handle failure
    const result = await signInWithPopup(auth, provider);
    const { accessToken } = result.user;

    const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
    tokenEl.value = accessToken;

    formRef.current.submit();
  };

  return (
    <div {...props}>
      <form class='hidden' method='post' ref={formRef}>
        <input name='token' />
      </form>

      <button class='w-48' onClick={login}>
        <img src='/public/btn_google_signin_light_normal_web@2x.png' />
      </button>
    </div>
  );
}
