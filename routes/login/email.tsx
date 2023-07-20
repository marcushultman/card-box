import { PageProps } from '$fresh/server.ts';
import TopBar from '../../components/TopBar.tsx';
import LoginEmail from '../../islands/LoginEmail.tsx';
import FinishLogin, { LOGIN_TYPE } from '../../islands/FinishLogin.tsx';
import { ArrowLeftIcon } from '../../utils/icons/24/outline.ts';

export default function ({ url }: PageProps) {
  const loginType = url.searchParams.get(LOGIN_TYPE);
  const error = url.searchParams.get('error') ?? undefined;

  if (loginType && !error) {
    return <FinishLogin type={loginType} />;
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
