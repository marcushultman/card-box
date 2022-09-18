/** @jsx h */
import { h } from 'preact';
import { tw } from '@twind';
import Counter from '../islands/Counter.tsx';
import NewGameForm from '../islands/NewGameForm.tsx';
import { Handlers, PageProps } from '$fresh/server.ts';
import { loadGames } from '../utils/game_engine.ts';

export const handler: Handlers = {
  async GET(_, ctx) {
    return ctx.render(await loadGames());
  },
};

export default function Home({ data }: PageProps<{ id: string }[]>) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md h-screen relative`}>
      <img
        src='/logo.svg'
        height='100px'
        alt='the fresh logo: a sliced lemon dripping with juice'
      />
      <p class={tw`my-6`}>
        Welcome to `fresh`. Try update this message in the ./routes/index.tsx file, and refresh.
      </p>
      <Counter start={3} />

      <p>Games:</p>
      <div>
        {data.map((doc) => (
          <div>
            <a href={`/game/${doc.id}/admin`}>Game {doc.id}</a>
          </div>
        ))}
      </div>

      <NewGameForm />
    </div>
  );
}
