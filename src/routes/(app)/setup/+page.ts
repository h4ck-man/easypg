import { loadView } from '$lib/api/load';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
  await parent();
  return { setup: await loadView('/setup', {}, fetch) };
};
