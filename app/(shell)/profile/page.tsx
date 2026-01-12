import 'server-only';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { getServerAuthContext } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedReadUrl } from '@/lib/storage/readUrl';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

declare const process: {
  env: Record<string, string | undefined>;
};

function blockedLine(message: string) {
  return <div className="text-sm text-gray-700">BLOCKED: {message}</div>;
}

function formatDate(value: Date): string {
  return value.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function getExpiryStatus(expirationDate: Date): { label: string; className: string } {
  const now = Date.now();
  const exp = expirationDate.getTime();
  if (Number.isNaN(exp)) return { label: 'UNKNOWN', className: 'bg-gray-100 text-gray-800' };
  if (exp < now) return { label: 'EXPIRED', className: 'bg-red-100 text-red-800' };
  const days = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  if (days <= 30) return { label: `EXPIRING (${days}d)`, className: 'bg-amber-100 text-amber-800' };
  return { label: 'ACTIVE', className: 'bg-green-100 text-green-800' };
}

function isHttpUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function ProfileLayout({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle ? <div className="mt-1 text-sm text-gray-600">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex items-center gap-4 text-sm text-gray-900">{actions}</div> : null}
      </header>
      <div className="grid gap-6">{children}</div>
    </div>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border rounded-lg p-6">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

type ContractorProfileRow = {
  id: string;
  legalName: string;
  dba: string | null;
  businessType: string;
  yearsOperating: number;
  hqCity: string;
  hqState: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

type ContractorServiceRow = { category: string; capability: string };
type ContractorCoverageRow = { states: string[]; regions: string[]; mobileOnly: boolean };
type ContractorEquipmentRow = { type: string; ownership: string; quantity: number; notes: string | null };
type ContractorCertificationRow = { name: string; issuingBody: string; issueDate: Date; expirationDate: Date; documentUrl: string };
type ContractorInsuranceRow = {
  policyType: string;
  carrier: string;
  coverage: string;
  effectiveDate: Date;
  expirationDate: Date;
  documentUrl: string;
};
type ContractorDocumentRow = { name: string; fileUrl: string };

export default async function ProfilePage() {
  let auth: Awaited<ReturnType<typeof getServerAuthContext>> | null = null;
  let authBlockedReason: string | null = null;
  try {
    auth = await getServerAuthContext();
  } catch (err: any) {
    authBlockedReason = err instanceof Error ? err.message : String(err);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        {authBlockedReason ? (
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">BLOCKED: {authBlockedReason}</div>
        ) : (
          <div className="bg-white border rounded-lg p-6 text-sm text-gray-800">
            NOT IMPLEMENTED: Profile UI is not available yet. ({auth?.role ?? 'unknown'})
          </div>
        )}
      </div>
    </main>
  );

  /*
  const isContractor = auth?.role === 'contractor';

  const headerTitle = isContractor ? 'Contractor Profile' : 'Profile';
  const headerSubtitle = isContractor ? `User ID: ${auth?.userId ?? 'unknown'}` : undefined;

  const actions = isContractor ? (
    <>
      <span className="text-gray-500">NOT IMPLEMENTED</span>
    </>
  ) : null;

  let contractor: ContractorProfileRow | null = null;
  let services: ContractorServiceRow[] = [];
  let coverage: ContractorCoverageRow | null = null;
  let equipment: ContractorEquipmentRow[] = [];
  let certifications: ContractorCertificationRow[] = [];
  let insurance: ContractorInsuranceRow[] = [];
  let documents: ContractorDocumentRow[] = [];
  let ratingsCount: number | null = null;

  let dataBlockedReason: string | null = null;

  if (auth && isContractor) {
    try {
      const contractorRows = (await prisma.$queryRaw`
        SELECT
          id,
          "legalName" as "legalName",
          dba,
          "businessType" as "businessType",
          "yearsOperating" as "yearsOperating",
          "hqCity" as "hqCity",
          "hqState" as "hqState",
          "contactName" as "contactName",
          "contactEmail" as "contactEmail",
          "contactPhone" as "contactPhone"
        FROM "ContractorProfile"
        WHERE "userId" = ${auth!.userId}
        LIMIT 1
      `) as ContractorProfileRow[];

      const contractorRow = contractorRows[0] ?? null;
      contractor = contractorRow;

      if (contractorRow) {
        const contractorId = contractorRow.id;
        [services, coverage, equipment, certifications, insurance, documents, ratingsCount] = await Promise.all([
          prisma.$queryRaw`
            SELECT category, capability
            FROM "ContractorService"
            WHERE "contractorId" = ${contractorId}
          ` as Promise<ContractorServiceRow[]>,
          prisma
            .$queryRaw`
              SELECT states, regions, "mobileOnly" as "mobileOnly"
              FROM "ContractorCoverage"
              WHERE "contractorId" = ${contractorId}
              LIMIT 1
            `
            .then((rows) => (rows as ContractorCoverageRow[])[0] ?? null),
          prisma.$queryRaw`
            SELECT type, ownership, quantity, notes
            FROM "ContractorEquipment"
            WHERE "contractorId" = ${contractorId}
            ORDER BY type ASC
          ` as Promise<ContractorEquipmentRow[]>,
          prisma.$queryRaw`
            SELECT
              name,
              "issuingBody" as "issuingBody",
              "issueDate" as "issueDate",
              "expirationDate" as "expirationDate",
              "documentUrl" as "documentUrl"
            FROM "ContractorCertification"
            WHERE "contractorId" = ${contractorId}
            ORDER BY "expirationDate" ASC
          ` as Promise<ContractorCertificationRow[]>,
          prisma.$queryRaw`
            SELECT
              "policyType" as "policyType",
              carrier,
              coverage,
              "effectiveDate" as "effectiveDate",
              "expirationDate" as "expirationDate",
              "documentUrl" as "documentUrl"
            FROM "ContractorInsurance"
            WHERE "contractorId" = ${contractorId}
            ORDER BY "expirationDate" ASC
          ` as Promise<ContractorInsuranceRow[]>,
          prisma.$queryRaw`
            SELECT name, "fileUrl" as "fileUrl"
            FROM "ContractorDocument"
            WHERE "contractorId" = ${contractorId}
            ORDER BY name ASC
          ` as Promise<ContractorDocumentRow[]>,
          prisma
            .$queryRaw`
              SELECT COUNT(*)::int as count
              FROM "ContractorRating"
              WHERE "contractorId" = ${contractorId}
            `
            .then((rows) => (rows as Array<{ count: number }>)[0]?.count ?? 0),
        ]);
      }
    } catch (err: any) {
      dataBlockedReason = err instanceof Error ? err.message : String(err);
    }
  }

  const bucket = process.env.FILE_STORAGE_BUCKET;
  const certsRequireSigning = certifications.some((c) => !isHttpUrl(c.documentUrl));
  const insuranceRequireSigning = insurance.some((p) => !isHttpUrl(p.documentUrl));
  const docsRequireSigning = documents.some((d) => !isHttpUrl(d.fileUrl));

  const canSignCerts = certsRequireSigning ? !!bucket : true;
  const canSignInsurance = insuranceRequireSigning ? !!bucket : true;
  const canSignDocs = docsRequireSigning ? !!bucket : true;

  let signedCerts: Array<ContractorCertificationRow & { href?: string; pdfBlocked?: boolean }> = certifications.map((c) => ({ ...c }));
  let signedInsurance: Array<ContractorInsuranceRow & { href?: string; pdfBlocked?: boolean }> = insurance.map((p) => ({ ...p }));
  let signedDocs: Array<ContractorDocumentRow & { href?: string; pdfBlocked?: boolean }> = documents.map((d) => ({ ...d }));

  if (bucket && (certsRequireSigning || insuranceRequireSigning || docsRequireSigning)) {
    try {
      signedCerts = await Promise.all(
        certifications.map(async (c) => {
          if (isHttpUrl(c.documentUrl)) return { ...c, href: c.documentUrl };
          return { ...c, href: await getSignedReadUrl({ bucket, key: c.documentUrl, expiresInSeconds: 120 }) };
        }),
      );
      signedInsurance = await Promise.all(
        insurance.map(async (p) => {
          if (isHttpUrl(p.documentUrl)) return { ...p, href: p.documentUrl };
          return { ...p, href: await getSignedReadUrl({ bucket, key: p.documentUrl, expiresInSeconds: 120 }) };
        }),
      );
      signedDocs = await Promise.all(
        documents.map(async (d) => {
          if (isHttpUrl(d.fileUrl)) return { ...d, href: d.fileUrl };
          return { ...d, href: await getSignedReadUrl({ bucket, key: d.fileUrl, expiresInSeconds: 120 }) };
        }),
      );
    } catch {
      signedCerts = certifications.map((c) => ({ ...c, pdfBlocked: true }));
      signedInsurance = insurance.map((p) => ({ ...p, pdfBlocked: true }));
      signedDocs = documents.map((d) => ({ ...d, pdfBlocked: true }));
    }
  } else {
    signedCerts = certifications.map((c) => ({ ...c, href: isHttpUrl(c.documentUrl) ? c.documentUrl : undefined, pdfBlocked: !isHttpUrl(c.documentUrl) }));
    signedInsurance = insurance.map((p) => ({ ...p, href: isHttpUrl(p.documentUrl) ? p.documentUrl : undefined, pdfBlocked: !isHttpUrl(p.documentUrl) }));
    signedDocs = documents.map((d) => ({ ...d, href: isHttpUrl(d.fileUrl) ? d.fileUrl : undefined, pdfBlocked: !isHttpUrl(d.fileUrl) }));
  }

  const commonBlocked =
    authBlockedReason ??
    (!auth ? 'Authentication context not available.' : null) ??
    (!isContractor ? `Contractor role required (role: ${auth?.role ?? 'unknown'}).` : null) ??
    dataBlockedReason;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <ProfileLayout title={headerTitle} subtitle={headerSubtitle} actions={actions}>
          <ProfileSection title="Company Information">
            {commonBlocked
              ? blockedLine(`Company Information not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Company Information not available — no records found.')
                : (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Legal name</div>
                      <div className="mt-1">{contractor.legalName}</div>
                    </div>
                    {contractor.dba ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">DBA</div>
                        <div className="mt-1">{contractor.dba}</div>
                      </div>
                    ) : null}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Business type</div>
                      <div className="mt-1">{contractor.businessType}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Years operating</div>
                      <div className="mt-1">{contractor.yearsOperating}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Primary contact</div>
                      <div className="mt-1">
                        {contractor.contactName} · {contractor.contactEmail} · {contractor.contactPhone}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">HQ location</div>
                      <div className="mt-1">
                        {contractor.hqCity}, {contractor.hqState}
                      </div>
                    </div>
                  </div>
                )}
          </ProfileSection>

          <ProfileSection title="Services & Capabilities">
            {commonBlocked
              ? blockedLine(`Services & Capabilities not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Services & Capabilities not available — no records found.')
                : services.length === 0
                  ? blockedLine('Services & Capabilities not available — no records found.')
                  : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Services</div>
                        <div className="mt-1">{Array.from(new Set(services.map((s) => s.category))).sort().join(', ')}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Capabilities</div>
                        <div className="mt-1">{Array.from(new Set(services.map((s) => s.capability))).sort().join(', ')}</div>
                      </div>
                    </div>
                  )}
          </ProfileSection>

          <ProfileSection title="Coverage Area">
            {commonBlocked
              ? blockedLine(`Coverage Area not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Coverage Area not available — no records found.')
                : !coverage
                  ? blockedLine('Coverage Area not available — no records found.')
                  : (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">States / regions served</div>
                      <div className="mt-1">
                        {(coverage.states ?? []).join(', ')}
                        {(coverage.regions ?? []).length > 0 ? ` • ${(coverage.regions ?? []).join(', ')}` : ''}
                      </div>
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mobile crews only</div>
                        <div className="mt-1">{coverage.mobileOnly ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  )}
          </ProfileSection>

          <ProfileSection title="Equipment">
            {commonBlocked
              ? blockedLine(`Equipment not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Equipment not available — no records found.')
                : equipment.length === 0
                  ? blockedLine('Equipment not available — no records found.')
                  : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                            <th className="py-2 pr-4">Type</th>
                            <th className="py-2 pr-4">Ownership</th>
                            <th className="py-2 pr-4">Quantity</th>
                            <th className="py-2">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipment.map((e, idx) => (
                            <tr key={`${e.type}-${idx}`} className="border-t">
                              <td className="py-2 pr-4">{e.type}</td>
                              <td className="py-2 pr-4">{e.ownership}</td>
                              <td className="py-2 pr-4">{e.quantity}</td>
                              <td className="py-2">{e.notes ? e.notes : null}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
          </ProfileSection>

          <ProfileSection title="Certifications">
            {commonBlocked
              ? blockedLine(`Certifications not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Certifications not available — no records found.')
                : certifications.length === 0
                  ? blockedLine('Certifications not available — no records found.')
                  : !canSignCerts
                    ? (
                      <>
                        {blockedLine('Certifications PDF link not available — signed URL configuration missing.')}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Issuer</th>
                                <th className="py-2 pr-4">Issue date</th>
                                <th className="py-2 pr-4">Expiration date</th>
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2">PDF link</th>
                              </tr>
                            </thead>
                            <tbody>
                              {certifications.map((c, idx) => {
                                const status = getExpiryStatus(c.expirationDate);
                                return (
                                  <tr key={`${c.name}-${idx}`} className="border-t">
                                    <td className="py-2 pr-4">{c.name}</td>
                                    <td className="py-2 pr-4">{c.issuingBody}</td>
                                    <td className="py-2 pr-4">{formatDate(c.issueDate)}</td>
                                    <td className="py-2 pr-4">{formatDate(c.expirationDate)}</td>
                                    <td className="py-2 pr-4">
                                      <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                                    </td>
                                    <td className="py-2">BLOCKED</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                    : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <th className="py-2 pr-4">Name</th>
                              <th className="py-2 pr-4">Issuer</th>
                              <th className="py-2 pr-4">Issue date</th>
                              <th className="py-2 pr-4">Expiration date</th>
                              <th className="py-2 pr-4">Status</th>
                              <th className="py-2">PDF link</th>
                            </tr>
                          </thead>
                          <tbody>
                            {signedCerts.map((c, idx) => {
                              const status = getExpiryStatus(c.expirationDate);
                              return (
                                <tr key={`${c.name}-${idx}`} className="border-t">
                                  <td className="py-2 pr-4">{c.name}</td>
                                  <td className="py-2 pr-4">{c.issuingBody}</td>
                                  <td className="py-2 pr-4">{formatDate(c.issueDate)}</td>
                                  <td className="py-2 pr-4">{formatDate(c.expirationDate)}</td>
                                  <td className="py-2 pr-4">
                                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${status.className}`}>{status.label}</span>
                                  </td>
                                  <td className="py-2">
                                    {c.href && !c.pdfBlocked ? (
                                      <a className="underline" href={c.href} target="_blank" rel="noreferrer">
                                        View PDF
                                      </a>
                                    ) : (
                                      'BLOCKED'
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
          </ProfileSection>

          <ProfileSection title="Insurance">
            {commonBlocked
              ? blockedLine(`Insurance not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Insurance not available — no records found.')
                : insurance.length === 0
                  ? blockedLine('Insurance not available — no records found.')
                  : !canSignInsurance
                    ? (
                      <>
                        {blockedLine('Insurance COI PDF link not available — signed URL configuration missing.')}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="py-2 pr-4">Policy type</th>
                                <th className="py-2 pr-4">Carrier</th>
                                <th className="py-2 pr-4">Limits</th>
                                <th className="py-2 pr-4">Effective</th>
                                <th className="py-2 pr-4">Expiration</th>
                                <th className="py-2">COI PDF</th>
                              </tr>
                            </thead>
                            <tbody>
                              {insurance.map((p, idx) => (
                                <tr key={`${p.policyType}-${idx}`} className="border-t">
                                  <td className="py-2 pr-4">{p.policyType}</td>
                                  <td className="py-2 pr-4">{p.carrier}</td>
                                  <td className="py-2 pr-4">{p.coverage}</td>
                                  <td className="py-2 pr-4">{formatDate(p.effectiveDate)}</td>
                                  <td className="py-2 pr-4">{formatDate(p.expirationDate)}</td>
                                  <td className="py-2">BLOCKED</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                    : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <th className="py-2 pr-4">Policy type</th>
                              <th className="py-2 pr-4">Carrier</th>
                              <th className="py-2 pr-4">Limits</th>
                              <th className="py-2 pr-4">Effective</th>
                              <th className="py-2 pr-4">Expiration</th>
                              <th className="py-2">COI PDF</th>
                            </tr>
                          </thead>
                          <tbody>
                            {signedInsurance.map((p, idx) => (
                              <tr key={`${p.policyType}-${idx}`} className="border-t">
                                <td className="py-2 pr-4">{p.policyType}</td>
                                <td className="py-2 pr-4">{p.carrier}</td>
                                <td className="py-2 pr-4">{p.coverage}</td>
                                <td className="py-2 pr-4">{formatDate(p.effectiveDate)}</td>
                                <td className="py-2 pr-4">{formatDate(p.expirationDate)}</td>
                                <td className="py-2">
                                  {p.href && !p.pdfBlocked ? (
                                    <a className="underline" href={p.href} target="_blank" rel="noreferrer">
                                      View PDF
                                    </a>
                                  ) : (
                                    'BLOCKED'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
          </ProfileSection>

          <ProfileSection title="Documents">
            {commonBlocked
              ? blockedLine(`Documents not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Documents not available — no records found.')
                : documents.length === 0
                  ? blockedLine('Documents not available — no records found.')
                  : !canSignDocs
                    ? (
                      <>
                        {blockedLine('Documents PDF link not available — signed URL configuration missing.')}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Type</th>
                                <th className="py-2">PDF link</th>
                              </tr>
                            </thead>
                            <tbody>
                              {documents.map((d, idx) => (
                                <tr key={`${d.name}-${idx}`} className="border-t">
                                  <td className="py-2 pr-4">{d.name}</td>
                                  <td className="py-2 pr-4">BLOCKED</td>
                                  <td className="py-2">BLOCKED</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )
                    : (
                      <>
                        {blockedLine('Document type not available — not stored in database.')}
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                <th className="py-2 pr-4">Name</th>
                                <th className="py-2 pr-4">Type</th>
                                <th className="py-2">PDF link</th>
                              </tr>
                            </thead>
                            <tbody>
                              {signedDocs.map((d, idx) => (
                                <tr key={`${d.name}-${idx}`} className="border-t">
                                  <td className="py-2 pr-4">{d.name}</td>
                                  <td className="py-2 pr-4">BLOCKED</td>
                                  <td className="py-2">
                                    {d.href && !d.pdfBlocked ? (
                                      <a className="underline" href={d.href} target="_blank" rel="noreferrer">
                                        View PDF
                                      </a>
                                    ) : (
                                      'BLOCKED'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
          </ProfileSection>

          <ProfileSection title="Ratings & Reviews">
            {commonBlocked
              ? blockedLine(`Ratings & Reviews not available — ${commonBlocked}`)
              : !contractor
                ? blockedLine('Ratings & Reviews not available — no records found.')
                : ratingsCount === 0
                  ? blockedLine('Ratings & Reviews not available — no records found.')
                  : blockedLine(
                    `Ratings & Reviews not available — ${ratingsCount} rating record(s) exist, but review details are not stored in the database.`,
                  )}
          </ProfileSection>
        </ProfileLayout>
      </div>
    </main>
  );
	*/
}
