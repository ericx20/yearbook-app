<script lang="ts">
    import { PUBLIC_SERVER_URL } from '$env/static/public';
	import { onMount } from 'svelte';
    import type { Canvas } from '../../types';
    import { AppBar, AppShell } from '@skeletonlabs/skeleton';

    let status: 'loading' | 'loaded' | 'error' = 'loading'
    let id = "";

    $: shareableLink = `${window.location.host}/sign/${id}`

    async function createPage() {
        const canvas: Canvas = []

        const response = await fetch(`${PUBLIC_SERVER_URL}page/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ canvas })
        })
        return response;
    }

    onMount(async () => {
        const response = await createPage()
        if (response.ok) {
            status = 'loaded'
            id = (await response.json())._id;
        } else {
            status = 'error'
        }
    })
</script>

<AppShell>
    <svelte:fragment slot="header">
        <AppBar>
            <h1 class="h1">Create a Yearbook</h1>
        </AppBar>
    <slot>
        {#if status === 'loaded'}
            <p>Yearbook created! Share this link with your friends!</p>
            <p>{shareableLink}</p>
        {/if}
    </slot>

    </svelte:fragment>
</AppShell>