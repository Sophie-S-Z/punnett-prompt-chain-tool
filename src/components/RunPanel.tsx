"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { runStudio } from "@/app/studio-actions";
import { validateChain, type Chain, type Option } from "@/lib/studio";
import { RecordImage } from "./RecordImage";
type Result = { ok: boolean; message: string; id?: string };
export function RunPanel({
  chain,
  images,
  runsHref,
}: {
  chain: Chain;
  images: Option[];
  runsHref: string;
}) {
  const [image, setImage] = useState("");
  const [mix, setMix] = useState(false);
  const [additional, setAdditional] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState("");
  const requests = useRef(new Map<string, string>());
  const router = useRouter();
  const issue = mix ? null : validateChain(chain);
  const selected = [image, ...additional].filter(Boolean);
  return (
    <section className="panel run-panel">
      <p className="eyebrow">Try the sequence</p>
      <h2>Run on a test set</h2>
      <p>
        Choose up to three images. Each image gets its own saved run and step
        outputs.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (pending || !image) return;
          const source = new FormData(e.currentTarget);
          setResults([]);
          start(async () => {
            for (const [index, imageId] of selected.entries()) {
              setProgress(`Running image ${index + 1} of ${selected.length}…`);
              const form = new FormData();
              form.set("chain_id", chain.id);
              form.set("image_id", imageId);
              form.set("use_mix", String(source.get("use_mix") === "true"));
              if (!requests.current.has(imageId))
                requests.current.set(imageId, crypto.randomUUID());
              form.set("request_id", requests.current.get(imageId)!);
              try {
                const next = await runStudio(form);
                setResults((saved) => [...saved, next]);
                if (next.id || next.ok) requests.current.delete(imageId);
                router.refresh();
                // Stop at the first failed or ambiguous result to avoid spending more quota.
                if (!next.ok) break;
              } catch {
                setResults((saved) => [
                  ...saved,
                  {
                    ok: false,
                    message:
                      "Connection interrupted. Check run history before trying again. Remaining images were not started.",
                  },
                ]);
                break;
              }
            }
            setProgress("");
          });
        }}
      >
        <fieldset disabled={pending} className="record-fields">
          <label>
            Source image *
            <select
              aria-label="Source image *"
              name="image_id"
              value={image}
              required
              onChange={(e) => {
                setImage(e.target.value);
                setAdditional([]);
                requests.current.clear();
                setResults([]);
              }}
            >
              <option value="">Choose an image</option>
              {images.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </label>
          {image && (
            <RecordImage id={image} large alt="Selected source image" />
          )}
          {image && images.length > 1 && !mix && (
            <details className="test-set-picker">
              <summary>Add test images ({additional.length} of 2)</summary>
              <div className="test-image-options">
                {images
                  .filter((i) => i.id !== image)
                  .map((i) => (
                    <label className="checkbox" key={i.id}>
                      <input
                        type="checkbox"
                        checked={additional.includes(i.id)}
                        disabled={
                          !additional.includes(i.id) && additional.length >= 2
                        }
                        onChange={(e) => {
                          setAdditional((old) =>
                            e.target.checked
                              ? [...old, i.id]
                              : old.filter((id) => id !== i.id),
                          );
                          requests.current.clear();
                          setResults([]);
                        }}
                      />
                      {i.label}
                    </label>
                  ))}
              </div>
              <small>
                The same chain runs on every selected image, one at a time. A
                failure stops the test set.
              </small>
            </details>
          )}
          <label className="checkbox">
            <input
              name="use_mix"
              type="checkbox"
              value="true"
              checked={mix}
              onChange={(e) => {
                setMix(e.target.checked);
                setAdditional([]);
                requests.current.clear();
                setResults([]);
              }}
            />
            Use prompt chain mix
          </label>
          <small>
            {mix
              ? "Choose a chain randomly using saved relative weights. The run records which chain was selected."
              : "Run the chain shown in this editor."}
          </small>
          {issue && <p className="error">{issue}</p>}
          <button
            type="submit"
            className="button"
            disabled={!!issue || !images.length}
          >
            {pending
              ? "Running steps…"
              : additional.length
                ? `Run on ${selected.length} test images`
                : "Generate captions"}
          </button>
        </fieldset>
      </form>
      {!images.length && (
        <p>
          No available images.{" "}
          <a
            href="https://punnett-selection.vercel.app/create"
            target="_blank"
            rel="noreferrer"
          >
            Upload in the caption studio ↗
          </a>
        </p>
      )}
      <p className="fine">
        Selected images are sent to Gemini. Up to eight steps · ten runs per
        person in 24 hours · no automatic retries.
      </p>
      <div aria-live="polite">
        {pending && (
          <p role="status">
            {progress} Saved outputs appear in run history. Each image can take
            a few minutes.
          </p>
        )}
        {results.map((result, index) => (
          <p
            key={result.id ?? index}
            className={result.ok ? "success" : "error"}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}{" "}
            {result.id && (
              <Link href={`${runsHref}?q=${result.id}`}>View this run →</Link>
            )}
          </p>
        ))}
      </div>
      <Link href={`${runsHref}?chain=${chain.id}`}>
        View this chain’s run history →
      </Link>
    </section>
  );
}
