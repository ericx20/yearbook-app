<script lang="ts">
    import { PUBLIC_SERVER_URL } from '$env/static/public';
    import type { Canvas } from '../types';

    async function createPage() {
        // for now: create a page with an arbitrary canvas
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
</script>

<h1>Create a page!</h1>
<button on:click="{createPage}">Do it now!</button>