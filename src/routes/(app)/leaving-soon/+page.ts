import { loadView } from "$lib/api/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, fetch, depends }) => {
  depends("api:attention");
  await parent();
  return loadView("/leaving-soon", {}, fetch);
};
