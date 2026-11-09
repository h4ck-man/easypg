import { error, redirect } from '@sveltejs/kit';
import { api } from '$lib/api/client';
import { portalFromHostname, portalHome } from '$lib/constants/permissions';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ url, fetch, depends }) => {
  const portal = portalFromHostname(url.hostname);
  // Named hosts express a preference; the portal layout and API check access.
  if (portal) redirect(307, '/' + portal);

  depends('api:session');
  let session;
  try {
    session = await api.getSession(fetch);
  } catch (cause) {
    error(503, cause instanceof Error ? cause.message : 'API unavailable');
  }
  redirect(307, session ? portalHome(session.scope.role) : '/login');
};
