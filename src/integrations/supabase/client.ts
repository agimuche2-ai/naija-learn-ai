import { createClient as createNewClient } from '@/lib/client';
import type { Database } from './types';

// Bridged to the new official client in src/lib/client.ts
let _supabase: ReturnType<typeof createNewClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createNewClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createNewClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});

