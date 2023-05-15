<script lang="ts">
    import { AppBar, AppShell } from '@skeletonlabs/skeleton';
</script>

<AppShell>
    <svelte:fragment slot="header">
        <AppBar>
            <h1 class="h1">Online Yearbook Signing</h1>
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