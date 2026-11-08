"use client";
import { useState, useRef } from "react";
import { uploadStudioImage } from "@/app/upload-actions";
import { prepareUpload } from "@/lib/image-upload";
import type { Option } from "@/lib/studio";
export function ImageUpload({
  disabled,
  onBusy,
  onUploaded,
}: {
  disabled: boolean;
  onBusy: (value: boolean) => void;
  onUploaded: (image: Option) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="upload-image">
      <label>
        Upload your own image
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={disabled || busy}
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            if (!file) return;
            setError("");
            if (
              file.size > 8 * 1024 * 1024 ||
              !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
                file.type,
              )
            ) {
              setError("Choose a JPEG, PNG, WebP, or GIF under 8 MB.");
              e.currentTarget.value = "";
              return;
            }
            setBusy(true);
            onBusy(true);
            try {
              const prepared = await prepareUpload(file);
              const form = new FormData();
              form.set(
                "image",
                new File([prepared], file.name, { type: prepared.type }),
              );
              const result = await uploadStudioImage(form);
              if (!result.ok) setError(result.message);
              else onUploaded({ id: result.id, label: result.label });
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : "The upload failed. Try again.",
              );
            } finally {
              setBusy(false);
              onBusy(false);
              if (input.current) input.current.value = "";
            }
          }}
        />
      </label>
      <p className="hint">
        JPEG, PNG, WebP, or GIF. Up to 8 MB. Images are resized before upload
        and saved for future runs. Animated images use a still frame.
      </p>
      {busy && <p role="status">Uploading...</p>}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </div>
  );
}
