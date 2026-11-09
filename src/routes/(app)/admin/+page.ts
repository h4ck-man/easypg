import { loadView } from '$lib/api/load';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, url }) => {
  await parent();
  return {
    view: await loadView('/admin', {
      search: url.searchParams.get('q') ?? '',
      page: url.searchParams.get('page') ?? '1'
    }, fetch)
  };
};
