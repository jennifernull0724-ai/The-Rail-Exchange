'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function AdminLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
        } finally {
          router.push('/login');
          router.refresh();
        }
      }}
      className="rounded-md border border-[#1F2A44] bg-transparent px-3 py-1.5 text-sm text-[#E5E7EB]"
    >
      {busy ? 'Logging out…' : 'Logout'}
    </button>
  );
}
