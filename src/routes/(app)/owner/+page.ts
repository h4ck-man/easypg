import { loadView } from '$lib/api/load';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent, url, depends }) => {
  depends("api:attention");
  await parent();
  return {
    view: await loadView('/owner', {
      search: url.searchParams.get('q') ?? '',
      page: url.searchParams.get('page') ?? '1'
    }, fetch)
  };
};
