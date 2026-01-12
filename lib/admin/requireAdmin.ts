import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function requireAdmin() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('401_UNAUTHENTICATED');

  const { data } = await supabase.from('users').select('role').eq('id', user.id).single();

  if (!data || data.role !== 'admin') {
    throw new Error('403_ADMIN_ONLY');
  }

  return user;
}
