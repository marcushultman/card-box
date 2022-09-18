/** @jsx h */
import { h } from 'preact';
import { tw } from '@twind';
import { createGame } from '../utils/game_engine.ts';

export default function NewGameForm() {
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    window.location.replace(`/game/${await createGame()}/admin`);
  };

  return (
    <form class={tw`flex flex-col p-2 items-center space-y-2`} onSubmit={onSubmit}>
      <h2>New game</h2>
      <select class={tw`self-stretch`}>
        <option>Love letter</option>
      </select>
      <input class={tw`py-2 px-6 bg-blue-400 rounded-full`} type='submit' value='Create Game' />
    </form>
  );
}
