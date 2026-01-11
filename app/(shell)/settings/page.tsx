import 'server-only';

import { getServerAuthContext } from '@/lib/auth';
import { signOut } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  let auth;
  try {
    auth = await getServerAuthContext();
  } catch (err) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            BLOCKED: {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <div className="text-sm text-gray-500">Role: {auth.role}</div>
        </div>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Account Info</div>
          <div className="mt-2 text-sm text-gray-700">BLOCKED: Account settings not implemented.</div>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Notification Preferences</div>
          <div className="mt-2 text-sm text-gray-700">BLOCKED: Notification settings not implemented.</div>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <div className="text-sm font-semibold text-gray-900">Security</div>
          <div className="mt-2 flex gap-3">
            <form action={signOut}>
              <button type="submit" className="rounded-md border px-4 py-2 text-sm">
                Sign Out
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
