<script lang="ts">
    import { AppBar, AppShell } from '@skeletonlabs/skeleton';
</script>

<AppShell class="h-screen">
    <svelte:fragment slot="header">
        <AppBar>
            <h2 class="h2">Online Yearbook Signing</h2>
        </AppBar>
    <slot>
        <div class="grid grid-cols-3 gap-4 p-4">
            <a href="/create" class="card card-hover h-52 grid place-content-center">
                <p>Create a signing page</p>
            </a>
        </div>
    </slot>

    </svelte:fragment>
</AppShell>