import 'server-only';

import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MessagesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  void searchParams;
  notFound();
}
