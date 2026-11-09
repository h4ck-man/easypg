<script lang="ts">
  import PortalDashboard from '$lib/components/portals/PortalDashboard.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<PortalDashboard view={data.view} activeHostelId={data.scope.activeHostelId} />
