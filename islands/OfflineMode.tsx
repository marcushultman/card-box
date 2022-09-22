import { useState } from 'preact/hooks';
import { tw } from 'twind';
import { content } from 'twind/content';
import { goOffline, goOnline } from '../utils/game_engine.ts';

export default function OfflineMode() {
  const [online, setOnlineState] = useState(true);

  const setOnline = (online: boolean) => {
    setOnlineState(online);
    online ? goOnline() : goOffline();
  };

  return (
    <div class='flex gap-2 items-center w-36'>
      <label class='relative inline-block w-16 h-9'>
        <input checked={online} onClick={() => setOnline(!online)} class='opacity-0 w-0 h-0' />
        <div
          class={tw(
            'absolute cursor-pointer inset-0 bg-[#ccc] duration-400 rounded-3xl before:(absolute w-7 h-7 left-1 bottom-1 bg-white transition-400 rounded-full)',
            tw`before:(${content('""')})`,
            online && 'bg-[#a3e635] before:(translate-x-7)',
          )}
        />
      </label>
      <b>{online ? 'Online' : 'Offline'}</b>
    </div>
  );
}
