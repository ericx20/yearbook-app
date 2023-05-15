import type { PageLoad } from './$types';
import { PUBLIC_SERVER_URL } from '$env/static/public';

export const load = (({ fetch, params }) => {
    const fetchPage = async (id: string) => {
        const res = await fetch(`${PUBLIC_SERVER_URL}page/${id}`)
        const data = await res.json();
        console.log({data})
        return data;
    }

    return {
        page: fetchPage(params.id)
    }

}) satisfies PageLoad