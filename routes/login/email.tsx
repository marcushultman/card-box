import { PageProps } from '$fresh/server.ts';
import TopBar from '../../components/TopBar.tsx';
import LoginEmail, { SIGN_IN_PARAM } from '../../islands/LoginEmail.tsx';
import LoginEmailLink from '../../islands/LoginEmailLink.tsx';
import { ArrowLeftIcon } from '../../utils/icons/24/outline.ts';

export default function ({ url }: PageProps) {
  const isSignIn = url.searchParams.has(SIGN_IN_PARAM);
  const error = url.searchParams.get('error') ?? undefined;

  if (isSignIn && !error) {
    return <LoginEmailLink />;
  }
  return (
    <div class='flex(& col)'>
      <TopBar title='[Card-Box]'>
        <a class='p-2 w-10 h-10' href='javascript:history.back()'>
          <ArrowLeftIcon />
        </a>
      </TopBar>
      <LoginEmail error={error} />
    </div>
  );
}
