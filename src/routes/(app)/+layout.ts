import { error, redirect } from '@sveltejs/kit';
import { api } from '$lib/api/client';
import { portalOptions } from '$lib/constants/permissions';
import type { LayoutLoad } from './$types';
export const load:LayoutLoad = async({url,depends,fetch})=>{
  depends('api:session');
  let session;
  try {session=await api.getSession(fetch);}
  catch(cause){error(503,cause instanceof Error?cause.message:'API unavailable');}
  if (!session) {
    const params = new URLSearchParams({ redirectTo: url.pathname + url.search });
    const portal = portalOptions.find(option => '/' + option.id === url.pathname);
    if (portal) params.set('portal', portal.id);
    redirect(307, '/login?' + params);
  }
  return session;
};
