import { createGroup } from '../utils/loading_v2.ts';
import { RULES_DB } from '../utils/rules.ts';

export default function NewGameForm({ userId }: { userId: string }) {
  const onSubmit = async (e: Event) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    window.location.replace(`/groups/${await createGroup(userId)}`);
  };

  return (
    <form class='flex flex-col p-2 items-center space-y-2' onSubmit={onSubmit}>
      <h2>New game</h2>
      <select class='self-stretch' name='rules'>
        {Object.entries(RULES_DB).map(([id, { name }]) => <option value={id}>{name}</option>)}
      </select>
      <input class='py-2 px-6 bg-blue-400 rounded-full' type='submit' value='Create Game' />
    </form>
  );
}
