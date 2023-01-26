import { tw } from 'twind';
import { JSX } from 'preact';
import app from '@firebase';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { useRef } from 'preact/hooks';
import { assert } from 'https://deno.land/std@0.170.0/testing/asserts.ts';
import { useSignal } from '@preact/signals';
import { updateProfile } from '../utils/loading_v2.ts';

export default function Signup() {
  const formRef = useRef<HTMLFormElement>(null);
  const error = useSignal<Error | undefined>(undefined);

  const login = (accessToken: string) => {
    assert(formRef.current);
    const tokenEl = formRef.current.elements.namedItem('token') as HTMLInputElement;
    tokenEl.value = accessToken;
    formRef.current.submit();
  };

  const signup = async (e: JSX.TargetedEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value;
    const pwd = (e.currentTarget.elements.namedItem('pwd') as HTMLInputElement).value;

    const auth = getAuth(app);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pwd);
      await updateProfile(result.user.uid, { name, email });
      login(result.user.accessToken);
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err;
      }
    }
  };

  const inputCls = 'p-1 rounded bg-gray-100';
  const buttonCls = 'flex-1 px-4 py-2 rounded-lg bg-green-200';

  return (
    <div class='p-4 flex(& col) w-full gap-4'>
      <form class='hidden' method='post' ref={formRef}>
        <input name='token' />
      </form>

      <form class='flex(& col) gap-2 w-full' id='form' onSubmit={signup}>
        <label for='name'>Name</label>
        <input id='name' name='name' class={inputCls} autoComplete='name' />

        <label for='email'>Email</label>
        <input id='email' name='email' class={inputCls} autoComplete='email' />

        <label for='pwd'>Password</label>
        <input type='password' id='pwd' name='pwd' autoComplete='new-password' class={inputCls} />

        {error.value && <div class='text-red-500 mt-2'>{error.value.message}</div>}

        <input type='submit' value='Sign up' class={tw(buttonCls, error.value ? 'mt-2' : 'mt-4')} />
      </form>
    </div>
  );
}
