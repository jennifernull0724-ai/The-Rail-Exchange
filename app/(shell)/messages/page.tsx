import 'server-only';

import { getServerAuthContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MessagesPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      </main>
    );
  }

  const jobId = typeof searchParams?.jobId === 'string' ? searchParams.jobId : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Messages</h1>
          <div className="text-sm text-gray-500">Role: {auth.role}</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <aside className="bg-white border rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-900">Threads</div>
            <div className="mt-3 text-sm text-gray-700">BLOCKED: Thread list requires persistence.</div>
          </aside>

          <section className="bg-white border rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-900">Conversation</div>
            <div className="mt-2 text-sm text-gray-700">
              {jobId ? (
                <div>Job-scoped thread requested for jobId: {jobId}</div>
              ) : (
                <div>Select a job thread.</div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button type="button" className="rounded-md border px-4 py-2 text-sm">
                Send Message
              </button>
              <button type="button" className="rounded-md border px-4 py-2 text-sm">
                Attach File
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-700">BLOCKED: Messaging backend not implemented.</div>
          </section>
        </div>
      </div>
    </main>
  );
}
