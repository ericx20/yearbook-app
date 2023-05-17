<script>
    import { page } from '$app/stores';
</script>

<div class="h-screen">
    <h1>{$page.error?.message}</h1>
</div>