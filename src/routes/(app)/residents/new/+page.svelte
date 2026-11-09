<script lang="ts">
  import type { PageData } from "./$types";
  import RegistrationForm from "./RegistrationForm.svelte";

  let { data }: { data: PageData } = $props();
  let hostel = $derived(
    data.hostels.find(({ id }) => id === data.scope.activeHostelId),
  );
</script>

{#key data.scope.activeHostelId}
  <RegistrationForm {hostel} />
{/key}
