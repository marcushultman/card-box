/** @jsx h */
import { h } from 'preact';
import { tw } from '@twind';
import Counter from '../islands/Counter.tsx';
import NewGameForm from '../islands/NewGameForm.tsx';
import { Handlers, PageProps } from '$fresh/server.ts';
import { loadGames } from '../utils/game_engine.ts';

interface State {
  username: string;
}

interface Data extends State {
  gameDocs: { id: string }[];
}

export const handler: Handlers<Data, State> = {
  async GET(_, ctx) {
    return ctx.render({ ...ctx.state, gameDocs: await loadGames() });
  },
};

export default function Home({ data: { gameDocs, username } }: PageProps<Data>) {
  return (
    <div class={tw`p-4 mx-auto max-w-screen-md h-screen relative`}>
      <img
        src='/logo.svg'
        height='100px'
        alt='the fresh logo: a sliced lemon dripping with juice'
      />
      <p class={tw`my-6`}>
        Hi{' '}
        {username}, Welcome to `fresh`. Try update this message in the ./routes/index.tsx file, and
        refresh.
      </p>
      <Counter start={3} />

      <p>Games:</p>
      <div>
        {gameDocs.map((doc) => (
          <div>
            <a href={`/game/${doc.id}/admin`}>Game {doc.id}</a>
          </div>
        ))}
      </div>

      <NewGameForm />
    </div>
  );
}
