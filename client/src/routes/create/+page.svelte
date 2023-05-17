<script lang="ts">
    import { PUBLIC_SERVER_URL } from '$env/static/public';
	import { onMount } from 'svelte';
    import type { Canvas } from '../../types';
    import { AppBar, AppShell, ProgressRadial } from '@skeletonlabs/skeleton';

    // form
    let name = ""
    let pin = ""


    let status: 'input' | 'loading' | 'loaded' | 'error' = 'input'
    let id = "";

    let baseUrl = "";
    $: shareableLink = `${baseUrl}/sign/${id}`

    onMount(() => {
        baseUrl = window.location.origin
    })

    async function handleCreate() {
        status = 'loading'
        const response = await createPage(name, pin);
        if (response.ok) {
            status = 'loaded'
            id = (await response.json())._id;
        } else {
            status = 'error'
        }

    }

    async function createPage(name: string, pin: string) {
        const canvas: Canvas = []

        const response = await fetch(`${PUBLIC_SERVER_URL}page/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ canvas, name, pin })
        })
        return response;
    }
</script>

<AppShell class="h-screen">
    <svelte:fragment slot="header">
        <AppBar>
            <h2 class="h2">Create Signing Page</h2>
        </AppBar>
    </svelte:fragment>
    <slot>
        <div class="h-full flex justify-center items-center">
            <div class="card bg-purple-200 p-12 space-y-4 w-[25rem]">
                {#if status === 'input'}
                    <p>Enter your name</p>
                    <div>
                        <input bind:value={name}>
                    </div>
                    <p>Enter a secret PIN</p>
                    <div>
                        <input type="password" bind:value={pin}/>
                    </div>
                    <button type="button" class="btn variant-filled" on:click={handleCreate}>Create</button>
                {:else if status === 'loading'}
                    <ProgressRadial class="m-auto" stroke={100} meter="stroke-primary-500" track="stroke-primary-500/30" />
                {:else if status === 'loaded'}
                    <p>Signing page created!</p>
                    <p>Share this link with your friends!</p>
                    <a href={shareableLink} target="_blank">{shareableLink}</a>
                {:else}
                    <p>Something went wrong!</p>
                {/if}
            <!-- <p>{shareableLink}</p> -->
        </div>
        <!-- {#if status === 'loaded'}
            <p>Yearbook created! Share this link with your friends!</p>
            <p>{shareableLink}</p>
        {/if} -->
    </slot>
</AppShell>

<style>
    input {
        width: 100%;
        height: 2rem;
        padding: 0.5rem;
        border-radius: 1rem;
    }
</style>