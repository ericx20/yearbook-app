<script>
	import { onMount } from 'svelte';
    import { PUBLIC_SERVER_URL } from '$env/static/public';

    let testMessage = "" 
    async function getTestMessage() {
        try {
            const response = await fetch(PUBLIC_SERVER_URL)
            testMessage = await response.text()
        } catch (error) {
            console.error(error)
        }
    }

    onMount(getTestMessage);
</script>


<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
<p>The message: {testMessage}</p>