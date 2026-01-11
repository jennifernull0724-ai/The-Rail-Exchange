'use server';

import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function signOut(): Promise<void> {
	try {
		const supabase = getSupabaseServerClient();
		await supabase.auth.signOut();
	} catch {
		// If Supabase isn't configured (or signOut fails), still allow a safe redirect.
	}
	redirect('/login');
}
