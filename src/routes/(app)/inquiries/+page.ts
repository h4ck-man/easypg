import { error } from "@sveltejs/kit";
import { loadView } from "$lib/api/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, fetch }) => {
  const { scope } = await parent();
  if (scope.role !== "manager" && scope.role !== "organization_admin")
    error(403, "This workspace cannot manage enquiries.");
  return loadView("/inquiries", {}, fetch);
};
