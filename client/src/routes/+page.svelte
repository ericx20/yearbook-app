<script>
	import { onMount } from 'svelte';

    let testMessage = "" 
    async function getTestMessage() {
        try {
            const response = await fetch("http://localhost:3000/")
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