import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent }) => {
  const session = await parent();
  if (!['manager', 'organization_admin'].includes(session.scope.role)) error(403, 'Use an assigned supervisor workspace to add residents.');
  return {};
};
