import { tw } from 'twind';
import { JSX } from 'preact';
import app from '@firebase';
import {
  getAuth,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useRef } from 'preact/hooks';
import { assert } from '@std/testing/asserts.ts';
import { useSignal } from '@preact/signals';

export const EMAIL_STORAGE_KEY = 'emailForSignIn';
export const SIGN_IN_PARAM = 'signInLink';

interface Props {
  error?: string;
}

export default function LoginEmail({ error: errorMsg }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const error = useSignal<Error | undefined>(errorMsg ? new Error(errorMsg) : undefined);
  const setError = (err: unknown) => {
    error.value = err instanceof Error ? err : new Error('Unexpected error');
    return null;
  };

  const email = useSignal('');
  const setEmail = (e: JSX.TargetedEvent<HTMLInputElement>) => email.value = e.currentTarget.value;

  const passwordVisible = useSignal(false);
  const showPassword = () => passwordVisible.value = true;

  const sendLink: JSX.MouseEventHandler<HTMLButtonElement> = async (e) => {
    const auth = getAuth(app);
    const url = new URL(location.href);
    url.searchParams.set(SIGN_IN_PARAM, '1');
    const actionCodeSettings = { url: url.href, handleCodeInApp: true };
    if (await sendSignInLinkToEmail(auth, email.value, actionCodeSettings).catch(setError)) {
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email.value);
    }
  };

  const login = (accessToken: string) => {
    assert(formRef.current);
    const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
    tokenEl.value = accessToken;
    formRef.current.submit();
  };

  const loginWithPassword = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();

    const pwd = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;

    const auth = getAuth(app);
    const result = await signInWithEmailAndPassword(auth, email.value, pwd).catch(setError);
    if (result) {
      login(result.user.accessToken);
    }
  };

  const recoverPassword = async () => {
    const auth = getAuth(app);
    const actionCodeSettings = { url: new URL('/login?extra=123', location.href).href };
    await sendPasswordResetEmail(auth, email.value, actionCodeSettings).catch(setError);
  };

  const inputCls = 'p-1 rounded bg-gray-100';
  const buttonCls = 'flex-1 px-4 py-2 rounded-lg bg-green-200';
  const pwdLabelCls = tw(passwordVisible.value || 'hidden');
  const pwdCls = tw(inputCls, passwordVisible.value || 'hidden');

  return (
    <div class='p-4 flex(& col) w-full gap-4'>
      <form class='hidden' method='post' action='/login' ref={formRef}>
        <input name='token' />
      </form>

      <form class='flex(& col) gap-2 w-full' id='form' onSubmit={loginWithPassword}>
        <label for='email'>Email:</label>
        <input
          id='email'
          name='email'
          class={inputCls}
          autoComplete='off'
          value={email.value}
          onChange={setEmail}
        />

        <label for='pwd' class={pwdLabelCls}>Password:</label>
        <input type='password' id='pwd' name='pwd' class={pwdCls} />
      </form>

      {passwordVisible.value && (
        <button class='text-left py-1 underline' onClick={recoverPassword}>Forgot password</button>
      )}

      {error.value && <div class='text-red-500 mt-2'>{error.value.message ?? 'NEPP'}</div>}

      <div class='flex gap-2 justify-evenly'>
        <button class={buttonCls} onClick={sendLink}>Send Link</button>
        {passwordVisible.value
          ? <input type='submit' form='form' value='Login' class={buttonCls} />
          : <button class={buttonCls} onClick={showPassword}>Use Password</button>}
      </div>
    </div>
  );
}
