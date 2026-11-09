<script lang="ts">
  import AppShell from '$lib/components/app-shell/AppShell.svelte';
  import { getNavItems, getMobileNavItems } from '$lib/constants/navigation.js';
  import { invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { api } from '$lib/api/client';
  import { onMount } from 'svelte';

  let { data, children } = $props();

  let pathname = $derived($page.url.pathname);
  let navItems = $derived(data.scope ? getNavItems(data.scope.role) : []);
  let mobileNavItems = $derived(data.scope ? getMobileNavItems(data.scope.role) : []);
  let count = $state<{ scope: string; value: number } | null>(null);
  let attentionScope = $derived(
    navItems.some(item => item.href === '/leaving-soon') && data.scope?.activeHostelId
      ? JSON.stringify([data.scope.userId, data.activeMembershipId, data.scope.role, data.scope.activeHostelId])
      : ''
  );
  let currentRequest: { scope: string; path: string; refreshViews: boolean } | undefined;
  async function refreshAttention(scope: string, path: string, refreshViews = false) {
    if (!scope || document.visibilityState === 'hidden') return;
    if (currentRequest?.scope === scope && currentRequest.path === path) {
      currentRequest.refreshViews ||= refreshViews;
      return;
    }
    const request = { scope, path, refreshViews };
    currentRequest = request;
    try {
      const result = await api.readView('/attention');
      if (currentRequest === request && attentionScope === scope) {
        count = { scope, value: result.dueFollowUps };
        if (request.refreshViews) await invalidate('api:attention');
      }
    } catch {
      if (currentRequest === request && attentionScope === scope) count = null;
    } finally {
      if (currentRequest === request) currentRequest = undefined;
    }
  }

  $effect(() => {
    void refreshAttention(attentionScope, pathname);
  });

  onMount(() => {
    const refresh = () => void refreshAttention(attentionScope, window.location.pathname, true);
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      currentRequest = undefined;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  });
</script>

<AppShell
  {navItems}
  {mobileNavItems}
  currentPath={pathname}
  user={data.user}
  role={data.scope?.role ?? 'resident'}
  activeHostelId={data.scope?.activeHostelId ?? ''}
  hostels={data.hostels ?? []}
  memberships={data.memberships ?? []}
  activeMembershipId={data.activeMembershipId ?? ''}
  attentionCount={count?.scope === attentionScope ? count.value : null}
>
  {@render children()}
</AppShell>
