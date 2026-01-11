"use client";

import { useMemo, useState } from "react";

export type JobUploadsMode = "photos" | "documents";

export type JobUploadsPresignRequest = {
  filename: string;
  contentType: string;
  jobRequestId: string;
  mode: JobUploadsMode;
};

export type JobUploadsPresignResponse = {
  url: string;
  objectKey: string;
  expiresIn: number;
};

type SessionUpload = {
  objectKey: string;
  filename: string;
};

export type JobUploadsProps = {
  jobRequestId: string;
  mode: JobUploadsMode;
  maxFileSizeBytes: number;
  onUploaded: (objectKey: string) => void;
  provider?: string;
  existingObjectKeys?: readonly string[];
  onBlocked?: () => void;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isPresignResponse(value: unknown): value is JobUploadsPresignResponse {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    isNonEmptyString(v.url) &&
    isNonEmptyString(v.objectKey) &&
    typeof v.expiresIn === "number" &&
    Number.isFinite(v.expiresIn) &&
    v.expiresIn > 0
  );
}

function uploadWithProgress(url: string, file: File, contentType: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const pct = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress(pct);
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.onabort = () => reject(new Error("Upload aborted."));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed with status ${xhr.status}.`));
    };

    xhr.send(file);
  });
}

export function JobUploads({
  jobRequestId,
  mode,
  maxFileSizeBytes,
  onUploaded,
  provider,
  existingObjectKeys,
  onBlocked,
}: JobUploadsProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [sessionUploads, setSessionUploads] = useState<SessionUpload[]>([]);

  const blockedReason = useMemo(() => {
    if (provider !== "aws_s3") return "Uploads blocked: FILE_STORAGE_PROVIDER is not aws_s3.";
    if (!isNonEmptyString(jobRequestId)) return "Uploads blocked: jobRequestId is required.";
    if (mode !== "photos" && mode !== "documents") return "Uploads blocked: mode is required.";
    if (typeof maxFileSizeBytes !== "number" || !Number.isFinite(maxFileSizeBytes) || maxFileSizeBytes <= 0) {
      return "Uploads blocked: maxFileSizeBytes is required.";
    }
    if (typeof onUploaded !== "function") return "Uploads blocked: onUploaded callback is required.";
    return null;
  }, [jobRequestId, maxFileSizeBytes, mode, onUploaded, provider]);

  const canUpload = blockedReason === null && !uploading;
  const accept = mode === "photos" ? "image/*" : "application/pdf";

  return (
    <section className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Photos & Documents</h2>
      {blockedReason ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{blockedReason}</div>
      ) : (
        <p className="mb-4 text-sm text-gray-600">Uploads use presigned S3 PUT URLs. Files upload directly to S3; this component emits object keys.</p>
      )}
      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800" htmlFor="job-uploads">
            {mode === "photos" ? "Photos" : "Documents"}
          </label>
          <input
            id="job-uploads"
            name="uploads"
            type="file"
            multiple
            disabled={!canUpload}
            accept={accept}
            onClick={() => {
              if (!canUpload && onBlocked) onBlocked();
            }}
            onChange={async (e: { currentTarget: HTMLInputElement }) => {
              setError(null);
              setProgressPct(null);

              const files = e.currentTarget.files;
              if (!files || files.length === 0) return;

              if (!canUpload) {
                setError(blockedReason ?? "Uploads are blocked.");
                return;
              }

              setUploading(true);
              try {
                const selectedFiles: File[] = Array.from(files);
                for (const file of selectedFiles) {
                  const contentType = file.type;

                  if (mode === "photos") {
                    if (!contentType || !contentType.startsWith("image/")) {
                      throw new Error("Invalid file type. Photos must be images.");
                    }
                  }

                  if (mode === "documents") {
                    if (contentType !== "application/pdf") {
                      throw new Error("Invalid file type. Documents must be PDF.");
                    }
                  }

                  if (file.size <= 0) {
                    throw new Error("Invalid file. File size must be greater than 0.");
                  }

                  if (file.size > maxFileSizeBytes) {
                    throw new Error("File too large.");
                  }

                  const presignBody: JobUploadsPresignRequest = {
                    filename: file.name,
                    contentType: contentType || "application/octet-stream",
                    jobRequestId,
                    mode,
                  };

                  const presignRes = await fetch("/api/storage/presign-upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(presignBody),
                  });

                  if (!presignRes.ok) {
                    const text = await presignRes.text();
                    throw new Error(`Presign failed (${presignRes.status}): ${text || "Unknown error"}`);
                  }

                  const presignJson: unknown = await presignRes.json();
                  if (!isPresignResponse(presignJson)) {
                    throw new Error("Presign response invalid: expected url, objectKey, expiresIn.");
                  }

                  setProgressPct(0);
                  await uploadWithProgress(presignJson.url, file, presignBody.contentType, (pct) => setProgressPct(pct));

                  setSessionUploads((prev: SessionUpload[]) => [{ objectKey: presignJson.objectKey, filename: file.name }, ...prev]);
                  onUploaded(presignJson.objectKey);
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              } finally {
                setUploading(false);
                setProgressPct(null);
                e.currentTarget.value = "";
              }
            }}
            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        {uploading ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
            <div className="font-semibold">Uploading…</div>
            {typeof progressPct === "number" ? <div className="mt-1">{progressPct}%</div> : null}
          </div>
        ) : null}

        {Array.isArray(existingObjectKeys) && existingObjectKeys.length > 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-800">
            <div className="mb-2 font-semibold">Existing</div>
            <ul className="space-y-1">
              {existingObjectKeys.map((k) => (
                <li key={k} className="break-all">
                  {k}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {sessionUploads.length > 0 ? (
          <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-800">
            <div className="mb-2 font-semibold">Uploaded this session</div>
            <ul className="space-y-2">
              {sessionUploads.map((u: SessionUpload) => (
                <li key={u.objectKey} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{u.filename}</div>
                    <div className="break-all text-xs text-gray-600">{u.objectKey}</div>
                  </div>
                  <button
                    type="button"
                    className="shrink-0 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm"
                    onClick={() => {
                      setSessionUploads((prev: SessionUpload[]) => prev.filter((x) => x.objectKey !== u.objectKey));
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
