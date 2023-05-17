import type { PageLoad } from './$types';
import { PUBLIC_SERVER_URL } from '$env/static/public';
import type { Page } from '../../../types';
import { error } from '@sveltejs/kit';

export const load = (({ fetch, params }) => {
    const fetchPage = async (id: string) => {
        const res = await fetch(`${PUBLIC_SERVER_URL}page/${id}`)

        if (!res.ok) {
            throw error(404, {
                message: 'Yearbook page not found'
            });
        }
        const data = await res.json();
        console.log({data})
        return data;
    }

    return {
        page: fetchPage(params.id) as Promise<Page>
    }

}) satisfies PageLoad