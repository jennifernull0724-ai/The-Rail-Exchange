import 'server-only';

import { notFound, redirect } from 'next/navigation';

import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = { params: { id: string } };

async function updateJob(jobId: string, formData: FormData) {
  'use server';

  const auth = await getServerAuthContext();
  if (auth.disabled) {
    throw new Error('Access denied: user disabled.');
  }
  // Admin is read-only per product rules.
  if (auth.role !== 'logistics') {
    throw new Error('Access denied: logistics role required.');
  }

  const title = String(formData.get('title') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const scopeDescription = String(formData.get('scopeDescription') ?? '').trim();
  const descriptionFull = String(formData.get('descriptionFull') ?? '').trim();

  if (!title || !address || !city || !state || !scopeDescription || !descriptionFull) {
    throw new Error('Missing required fields.');
  }

  await prisma.jobRequest.update({
    where: { id: jobId },
    data: { title, address, city, state, scopeDescription, descriptionFull },
  });

  redirect(`/jobs/${encodeURIComponent(jobId)}`);
}

export default async function EditJobPage({ params }: PageProps) {
  const job = await prisma.jobRequest.findUnique({ where: { id: params.id } });
  if (!job) notFound();

  let auth;
  try {
    auth = await getServerAuthContext();
  } catch {
    redirect('/login');
  }

  if (auth.disabled) {
    return (
      <main className="min-h-screen bg-[#0B1220]">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-[16px] font-semibold text-[#E5E7EB]">Edit Job</h1>
          <div className="border border-[#1F2A44] bg-[#111A2E] p-3 text-[12px] text-[#E5E7EB]">BLOCKED: User disabled.</div>
        </div>
      </main>
    );
  }

  if (auth.role !== 'logistics') {
    return (
      <main className="min-h-screen bg-[#0B1220]">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <h1 className="text-[16px] font-semibold text-[#E5E7EB]">Edit Job</h1>
          <div className="border border-[#1F2A44] bg-[#111A2E] p-3 text-[12px] text-[#E5E7EB]">BLOCKED: Logistics access required.</div>
        </div>
      </main>
    );
  }

  const action = updateJob.bind(null, job.id);

  return (
    <main className="min-h-screen bg-[#0B1220]">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <h1 className="text-[16px] font-semibold text-[#E5E7EB]">Edit Job</h1>

        <form action={action} className="border border-[#1F2A44] bg-[#111A2E] p-6 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              defaultValue={job.title}
              className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              defaultValue={job.address}
              className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="city">City</label>
              <input
                id="city"
                name="city"
                defaultValue={job.city}
                className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
                required
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="state">State</label>
              <input
                id="state"
                name="state"
                defaultValue={job.state}
                className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="scopeDescription">Scope</label>
            <textarea
              id="scopeDescription"
              name="scopeDescription"
              defaultValue={job.scopeDescription}
              className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[#E5E7EB]" htmlFor="descriptionFull">Description</label>
            <textarea
              id="descriptionFull"
              name="descriptionFull"
              defaultValue={job.descriptionFull}
              className="mt-1 w-full border border-[#1F2A44] bg-[#0B1220] p-2 text-[#E5E7EB]"
              rows={6}
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <a href={`/jobs/${encodeURIComponent(job.id)}`} className="text-[12px] text-[#9CA3AF] underline">Cancel</a>
            <button type="submit" className="h-9 bg-[#2563EB] px-4 text-[12px] font-semibold text-white hover:bg-[#1D4ED8]">Save</button>
          </div>
        </form>
      </div>
    </main>
  );
}
