'use client';

import { useState, type FormEvent } from 'react';

type Result =
	| { ok: true; message: string }
	| { ok: false; message: string };

export function BootstrapAdminForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<Result | null>(null);

	async function onSubmit(event: FormEvent) {
		event.preventDefault();
		setSubmitting(true);
		setResult(null);
		try {
			const res = await fetch('/api/bootstrap/create-admin', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
			if (!res.ok) {
				setResult({ ok: false, message: data?.error ? data.error : `Request failed (${res.status})` });
				return;
			}
			setResult({ ok: true, message: 'System owner created.' });
		} catch (err) {
			setResult({ ok: false, message: err instanceof Error ? err.message : String(err) });
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-gray-900">
					Email
				</label>
				<input
					type="email"
					required
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
					className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-900">
					Password
				</label>
				<input
					type="password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="new-password"
					className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm"
				/>
			</div>
			<div>
				<button
					type="submit"
					disabled={submitting}
					className="inline-flex items-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
				>
					{submitting ? 'Creating…' : 'Create System Owner'}
				</button>
			</div>
			{result ? (
				<div className="text-sm text-gray-900">
					{result.ok ? result.message : `BLOCKED: ${result.message}`}
				</div>
			) : null}
		</form>
	);
}
