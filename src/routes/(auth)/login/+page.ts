import { config } from '$lib/api/config';
import { portalFromHostname, portalOptions } from '$lib/constants/permissions';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ url }) => {
  const portal = portalOptions.find(option => option.id === url.searchParams.get('portal'))?.id ?? portalFromHostname(url.hostname);
  return { mode: config.mode, user: null, scope: null, portal };
};
