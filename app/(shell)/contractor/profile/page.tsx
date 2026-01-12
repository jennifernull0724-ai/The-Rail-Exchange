import 'server-only';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ContractorProfilePage() {
  redirect('/profile');
}
