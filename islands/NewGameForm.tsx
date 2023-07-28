import {
  ArrowLeftIcon,
  CheckIcon,
  PaperAirplaneIcon,
  ShareIcon,
} from '../utils/icons/24/outline.ts';
import { tw } from 'twind';
import { JSX, RefObject } from 'preact';
import { createGroup, makeGroupId, searchProfileOp } from '../utils/loading_v2.ts';
import { EMPTY, fromEvent, map, of, switchMap } from 'rxjs';
import { useEffect, useRef } from 'preact/hooks';
import { Signal, signal, useComputed, useSignal } from '@preact/signals';
import { Profile } from '../utils/model_v2.ts';
import TopBar, { TopBarAction, TopBarAnchor, TopBarButton } from '../components/TopBar.tsx';
import { __asyncDelegator } from 'https://esm.sh/v124/tslib@2.5.0/deno/tslib.mjs';
import { UserCircleIcon, UserIcon } from '../utils/icons/24/solid.ts';

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

  const onCreateGroup = async () => {
    const users = [...selectedUsers.value.map(({ id }) => id), userId];
    window.location.replace(`/groups/${await createGroup(users)}`);
  };

  useEffect(() => {
    const sub = fromInputRef(inputRef)
      .pipe(switchMap((text) => text.length >= 3 ? searchProfileOp(text) : of([])))
      .subscribe((profiles) =>
        searchResult.value = Object.fromEntries([
          ...profiles
            .filter(({ id }) => id !== userId) // filter out self
            .map((profile) => [profile.id, { ...profile, selected: signal(false) }]),
          ...Object.entries(searchResult.value).filter(([_, { selected }]) => selected.value),
        ])
      );
    return () => sub.unsubscribe();
  }, [inputRef]);

  const userRowCls = 'flex items-center gap-2 py-1 px-2 focus:outline-none';

  const copyInvite = (url: string) => navigator.clipboard.writeText(url);
  const shareInvite = (url: string) => navigator.share({ url });

  const shareOrCopy = () => {
    const url = new URL('/', location.href);
    url.searchParams.set('invite', btoa(JSON.stringify({ groupId: makeGroupId(), userId })));
    navigator.canShare?.() ? shareInvite(url.toString()) : copyInvite(url.toString());
  };

  const topbarAction = selectedUsers.value.length
    ? { icon: () => <PaperAirplaneIcon />, action: () => onCreateGroup() }
    : { icon: () => <ShareIcon />, action: () => shareOrCopy() };

  return (
    <div class='fixed w-screen h-full'>
      <TopBar title='New group'>
        <TopBarAction href='javascript:history.back()'>
          <ArrowLeftIcon />
        </TopBarAction>
        <TopBarButton onClick={topbarAction.action}>
          {topbarAction.icon()}
        </TopBarButton>

        <div class='p-2 flex items-center gap-2'>
          <div class='text-gray-500'>To:</div>
          <input
            class='flex-1 border rounded-full outline-none px-2 py-1'
            placeholder='Type name or email'
            ref={inputRef}
          />
        </div>
      </TopBar>

      <div class='flex(& col)'>
        {Object.values(searchResult.value).map(({ id, name, img, selected }) => (
          <button
            class={tw(userRowCls, selected.value && 'bg-blue-100')}
            onClick={() => selected.value = !selected.value}
          >
            {img
              ? (
                <img
                  class='w-12 h-12 rounded-full'
                  src={img}
                  alt={id}
                />
              )
              : <UserIcon className={tw`w-12 h-12 p-2 rounded-full bg-gray-600 text-white`} />}
            <div class='text-left flex-1'>{name}</div>
            {selected.value && <CheckIcon className={tw`w-6 h-6`} />}
          </button>
        ))}
      </div>
    </div>
  );
}
