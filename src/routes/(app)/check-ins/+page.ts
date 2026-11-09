import { error } from "@sveltejs/kit";
import { loadView } from "$lib/api/load";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ parent, url, fetch }) => {
  const { scope } = await parent();
  if (scope.role !== "manager" && scope.role !== "organization_admin")
    error(403, "This workspace cannot check residents in.");
  const residentId = url.searchParams.get("residentId");
  const roomId = url.searchParams.get("roomId");
  const [view, profile] = await Promise.all([
    loadView("/check-ins", roomId ? { roomId } : {}, fetch),
    residentId ? loadView("/residents/:id", { id: residentId }, fetch) : null,
  ]);
  return { ...view, registeredResident: profile?.resident ?? null };
};
