import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: async (url, options = {}) => {
      let clerkToken: string | null = null;
      try {
        if (window.Clerk?.session) {
          clerkToken = await window.Clerk.session.getToken();
        }
      } catch {
        clerkToken = null;
      }

      const headers = new Headers(options?.headers);
      const urlStr = typeof url === 'string' ? url : (url instanceof URL ? url.toString() : url?.url || String(url));
      const isFunctionRequest = urlStr.includes('/functions/v1/');
      const explicitAuthorization = headers.get('Authorization');
      const hasExplicitFunctionToken = isFunctionRequest && explicitAuthorization?.startsWith('Bearer ');

      if (hasExplicitFunctionToken) {
        // Preserve caller-supplied Clerk tokens for Edge Functions.
      } else if (!clerkToken) {
        headers.set('Authorization', `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
      } else {
        // Clerk's third-party auth token lets Supabase RLS authorize the user,
        // including Storage uploads.
        headers.set('Authorization', `Bearer ${clerkToken}`);
      }

      return fetch(url, {
        ...options,
        headers,
      });
    }
  }
});
