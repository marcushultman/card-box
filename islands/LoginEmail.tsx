import { tw } from 'twind';
import { JSX } from 'preact';
import app from '@firebase';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { useRef } from 'preact/hooks';
import { assert } from '@std/testing/asserts.ts';
import { batch, useSignal } from '@preact/signals';
import { updateProfile } from '../utils/loading_v2.ts';

export const EMAIL_STORAGE_KEY = 'emailForSignIn';
export const SIGN_IN_PARAM = 'signInLink';

interface Props {
  error?: string;
}

export default function LoginEmail({ error: errorMsg }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  const error = useSignal<Error | undefined>(errorMsg ? new Error(errorMsg) : undefined);
  const setError = (err: unknown) => {
    error.value = err instanceof Error ? err : new Error(`Unexpected error: ${err}`);
  };

  const email = useSignal('');
  const setEmail = (e: JSX.TargetedEvent<HTMLInputElement>) =>
    batch(() => {
      recoverySent.value = false;
      email.value = e.currentTarget.value;
    });

  const passwordVisible = useSignal(false);
  const usePassword = () => passwordVisible.value = true;

  const recoverySent = useSignal(false);

  const sendLink: JSX.MouseEventHandler<HTMLButtonElement> = async (e) => {
    error.value = undefined;
    const auth = getAuth(app);
    const url = new URL(location.href);
    url.searchParams.set(SIGN_IN_PARAM, '1');
    const actionCodeSettings = { url: url.href, handleCodeInApp: true };
    try {
      await sendSignInLinkToEmail(auth, email.value, actionCodeSettings);
      window.localStorage.setItem(EMAIL_STORAGE_KEY, email.value);
    } catch (err: unknown) {
      setError(err);
    }
  };

  const login = (accessToken: string) => {
    assert(formRef.current);
    const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
    tokenEl.value = accessToken;
    formRef.current.submit();
  };

  const signup = async (auth: unknown, email: string, pwd: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pwd);
      await updateProfile(result.user.uid, { email });
      login(result.user.accessToken);
    } catch (err: unknown) {
      setError(err);
    }
  };

  const loginWithPassword = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();
    error.value = undefined;

    const pwd = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;

    const auth = getAuth(app);
    try {
      const result = await signInWithEmailAndPassword(auth, email.value, pwd);
      if (result) {
        login(result.user.accessToken);
      }
    } catch (err: unknown) {
      if ((err as FirebaseError).code === 'auth/user-not-found') {
        signup(auth, email.value, pwd);
      } else {
        setError(err);
      }
    }
  };

  const forgotPwd = async () => {
    error.value = undefined;
    recoverySent.value = true;
    const auth = getAuth(app);
    const actionCodeSettings = { url: new URL('/login?extra=123', location.href).href };
    await sendPasswordResetEmail(auth, email.value, actionCodeSettings).catch(setError);
  };

  const inputCls = 'p-1 rounded bg-gray-100';
  const buttonCls = 'flex-1 px-4 py-2 rounded-lg';
  const grayBtnCls = tw(buttonCls, 'bg-gray-200');
  const greenBtnCls = tw(buttonCls, 'bg-green-200');
  const pwdLabelCls = tw(passwordVisible.value || 'hidden');
  const pwdCls = tw(inputCls, passwordVisible.value || 'hidden');
  const forgotPwdCls =
    tw`text-left py-1 underline focus:outline-none disabled:(opacity-50 cursor-not-allowed)`;

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

      <div class='flex gap-2 items-center'>
        {passwordVisible.value && (
          <button class={forgotPwdCls} onClick={forgotPwd} disabled={!email.value.length}>
            Forgot password
          </button>
        )}
        {recoverySent.value && <span class='italic'>Email sent</span>}
      </div>

      {error.value && <div class='text-red-500 mt-2'>{error.value.message}</div>}

      <div class='flex gap-2 justify-evenly'>
        {passwordVisible.value
          ? <input type='submit' form='form' value='Login' class={greenBtnCls} />
          : <button class={grayBtnCls} onClick={usePassword}>Use Password</button>}
        <button class={greenBtnCls} onClick={sendLink}>Send Link</button>
      </div>
    </div>
  );
}
