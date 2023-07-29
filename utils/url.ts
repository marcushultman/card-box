export function urlWithPath(
  url: string | URL,
  pathname: string,
  searchParams: Record<string, string> | URLSearchParams = {},
) {
  const outUrl = new URL(url);
  outUrl.pathname = pathname;
  for (const [key, value] of new URLSearchParams(searchParams)) {
    outUrl.searchParams.append(key, value);
  }
  return outUrl;
}
