'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Role = 'contractor' | 'logistics';

type Props = {
	initialRole: Role | null;
};

export default function CreateAccountClient({ initialRole }: Props) {
	const router = useRouter();

	const [role, setRole] = useState<Role | null>(initialRole);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const step: 1 | 2 = role ? 2 : 1;

	return (
		<main className="mx-auto max-w-md px-4 py-12 space-y-6">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
				<p className="text-sm text-gray-700">Create your user and select a role before billing.</p>
			</div>

			{step === 1 ? (
				<section className="bg-white border rounded-lg p-6 space-y-4">
					<div className="text-sm font-semibold text-gray-900">Step 1 — Choose role</div>
					<div className="grid gap-3">
						<button
							type="button"
							onClick={() => {
								setError(null);
								setRole('logistics');
							}}
							className="text-left rounded-md border bg-white p-4 hover:bg-gray-50"
						>
							<div className="text-sm font-semibold text-gray-900">Logistics</div>
							<div className="mt-1 text-sm text-gray-700">Post job requests and manage listings.</div>
						</button>
						<button
							type="button"
							onClick={() => {
								setError(null);
								setRole('contractor');
							}}
							className="text-left rounded-md border bg-white p-4 hover:bg-gray-50"
						>
							<div className="text-sm font-semibold text-gray-900">Contractor</div>
							<div className="mt-1 text-sm text-gray-700">Browse listings and respond to work opportunities.</div>
						</button>
					</div>
				</section>
			) : null}

			{step === 2 ? (
				<form
					className="space-y-4 bg-white border rounded-lg p-6"
					onSubmit={async (e) => {
						e.preventDefault();
						setError(null);

						if (!role) {
							setError('Role is required.');
							return;
						}

						const emailTrimmed = email.trim().toLowerCase();
						const pw = password;
						const confirm = confirmPassword;
						if (!emailTrimmed) {
							setError('Email is required.');
							return;
						}
						if (!pw) {
							setError('Password is required.');
							return;
						}
						if (!confirm) {
							setError('Confirm Password is required.');
							return;
						}
						if (pw !== confirm) {
							setError('Passwords do not match.');
							return;
						}

						setSubmitting(true);
						try {
							const res = await fetch('/api/auth/signup', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ email: emailTrimmed, password: pw, role }),
							});

							if (!res.ok) {
								const text = await res.text();
								try {
									const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
									if (parsed && typeof parsed.message === 'string' && parsed.message.trim()) {
										setError(parsed.message);
										return;
									}
									if (parsed && typeof parsed.error === 'string' && parsed.error.trim()) {
										setError(parsed.error);
										return;
									}
								} catch {
									// ignore
								}
								setError(text || `Signup failed (status ${res.status}).`);
								return;
							}

							router.push('/login');
						} finally {
							setSubmitting(false);
						}
					}}
				>
					<div className="flex items-center justify-between gap-3">
						<div className="text-sm font-semibold text-gray-900">Step 2 — Account details</div>
						<button
							type="button"
							onClick={() => {
								setError(null);
								setRole(null);
							}}
							className="text-xs rounded-md border bg-white px-3 py-2 text-gray-900"
						>
							Change role
						</button>
					</div>

					<div className="text-sm text-gray-700">
						Role: <span className="font-semibold">{role}</span>
					</div>

					{error ? (
						<div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
					) : null}

					<div>
						<label className="block text-sm font-medium text-gray-800">Email</label>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-800">Password</label>
						<input
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-800">Confirm Password</label>
						<input
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={submitting}
						className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
					>
						{submitting ? 'Creating…' : 'Create Account'}
					</button>
				</form>
			) : null}
		</main>
	);
}
