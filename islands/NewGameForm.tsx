import { ArrowLeftIcon, CheckIcon, PaperAirplaneIcon } from '../utils/icons/24/outline.ts';
import { tw } from 'twind';
import { JSX, RefObject } from 'preact';
import { createGroup, searchProfileOp } from '../utils/loading_v2.ts';
import { EMPTY, fromEvent, map, of, switchMap } from 'rxjs';
import { useEffect, useRef } from 'preact/hooks';
import { Signal, signal, useComputed, useSignal } from '@preact/signals';
import { Profile } from '../utils/model_v2.ts';

function fromInputRef(ref: RefObject<HTMLInputElement>) {
  const events = ref.current
    ? fromEvent<JSX.TargetedEvent<HTMLInputElement>>(ref.current, 'input')
    : EMPTY;
  return events.pipe(map((e) => e.currentTarget.value));
}

export default function NewGameForm({ userId }: { userId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const searchResult = useSignal<Record<string, Profile & { selected: Signal<boolean> }>>({});

  const selectedUsers = useComputed(() =>
    Object.values(searchResult.value).filter(({ selected }) => selected.value)
  );

  const onCreateGroup = async () =>
    window.location.replace(
      `/groups/${await createGroup([...selectedUsers.value.map(({ id }) => id), userId])}`,
    );

  useEffect(() => {
    const sub = fromInputRef(inputRef)
      .pipe(switchMap((text) => text.length >= 3 ? searchProfileOp(text) : of([])))
      .subscribe((profiles) =>
        searchResult.value = Object.fromEntries([
          ...profiles
            .filter(({ id }) => id !== userId)
            .map((profile) => [profile.id, { ...profile, selected: signal(false) }]),
          ...Object.entries(searchResult.value).filter(([_, { selected }]) => selected.value),
        ])
      );
    return () => sub.unsubscribe();
  }, [inputRef]);

  const userRowCls = 'flex items-center gap-2 py-1 px-2 focus:outline-none';

  return (
    <div class='fixed w-screen h-full'>
      <div class='flex pt-2 px-2 items-center'>
        <a class='p-2' href='javascript:history.back()'>
          <ArrowLeftIcon className={tw`w-6`} />
        </a>
        <div class='flex-1 py-2 text(lg center) mr-10'>New group</div>
        <button class='p-2' onClick={onCreateGroup}>
          <PaperAirplaneIcon className={tw`w-6`} />
        </button>
      </div>

      <div class='flex(& col)'>
        <div class='p-2 flex items-center'>
          <div class='text-gray-500 mr-2'>To:</div>
          <input
            class='flex-1 border rounded-full outline-none px-2 py-1'
            placeholder='Type name or email...'
            ref={inputRef}
          />
        </div>
        <hr />
      </div>

      <div class='flex(& col)'>
        {Object.values(searchResult.value).map(({ id, name, img, selected }) => (
          <button
            class={tw(userRowCls, selected.value && 'bg-blue-100')}
            onClick={() => selected.value = !selected.value}
          >
            <img
              class='w-12 h-12 rounded-full'
              src={img ?? 'https://via.placeholder.com/64/884444/ffffff'}
              alt={id}
            />
            <div class='text-left flex-1'>{name}</div>
            {selected.value && <CheckIcon className='w-6 h-6' />}
          </button>
        ))}
      </div>
    </div>
  );
}
