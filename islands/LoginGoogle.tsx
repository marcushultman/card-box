import { JSX } from 'preact';
import app from '@firebase';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { useRef } from 'preact/hooks';
import { assert } from '@std/testing/asserts.ts';
import { LOGIN_TYPE } from '../utils/login_constants.ts';

const usePopup = true;

function searchParamValues() {
  if (!window.location) {
    return null;
  }
  const { searchParams } = new URL(window.location.href);
  const inputs = [];
  for (const [key, value] of searchParams.entries()) {
    inputs.push(<input name={key} value={value} />);
  }
  return inputs;
}

export default function LoginGoogle(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const formRef = useRef<HTMLFormElement>(null);

  const login = async () => {
    assert(formRef.current);

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    const url = new URL(location.href);
    url.searchParams.set(LOGIN_TYPE, 'redirect');
    window.history.replaceState(null, '', url);

    if (usePopup) {
      // todo: handle failure
      const result = await signInWithPopup(auth, provider);
      const { accessToken } = result.user;

      const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
      tokenEl.value = accessToken;

      formRef.current.submit();
    } else {
      await signInWithRedirect(auth, provider);
    }
  };

  return (
    <div {...props}>
      <form class='hidden' method='post' action='/login' ref={formRef}>
        {searchParamValues()}
        <input name='token' />
      </form>

      <button class='w-48' onClick={login}>
        <img src='/public/btn_google_signin_light_normal_web@2x.png' />
      </button>
    </div>
  );
}
