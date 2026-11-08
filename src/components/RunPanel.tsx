"use client";
import { motion, useReducedMotion } from "motion/react";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUpload } from "./ImageUpload";
import { runStudio } from "@/app/studio-actions";
import { validateChain, type Chain, type Option } from "@/lib/studio";

type Result = {
  ok: boolean;
  message: string;
  id?: string;
  image: string;
};

const MAX_IMAGES = 3;
const FIRST_VIEW = 12;

/** Runs the chain on up to three saved images, one after another. */
export function RunPanel({
  chain,
  images,
}: {
  chain: Chain;
  images: Option[];
}) {
  const [uploaded, setUploaded] = useState<Option[]>([]);
  const [uploading, setUploading] = useState(false);
  const options = [
    ...uploaded,
    ...images.filter((i) => !uploaded.some((u) => u.id === i.id)),
  ];
  const [chosen, setChosen] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [pending, start] = useTransition();
  const [results, setResults] = useState<Result[]>([]);
  const [progress, setProgress] = useState("");
  const requests = useRef(new Map<string, string>());
  const router = useRouter();
  const issue = validateChain(chain);
  const reduce = useReducedMotion();
  const label = (id: string) => options.find((i) => i.id === id)?.label ?? "";
  const visible = showAll ? options : options.slice(0, FIRST_VIEW);

  function toggle(id: string, on: boolean) {
    setChosen((old) => (on ? [...old, id] : old.filter((x) => x !== id)));
    requests.current.clear();
    setResults([]);
  }

  function run() {
    if (pending || uploading || !chosen.length || issue) return;
    setResults([]);
    start(async () => {
      for (const [index, imageId] of chosen.entries()) {
        setProgress(
          chosen.length > 1
            ? `Running image ${index + 1} of ${chosen.length}…`
            : "Running…",
        );
        const form = new FormData();
        form.set("chain_id", chain.id);
        form.set("image_id", imageId);
        form.set("use_mix", "false");
        if (!requests.current.has(imageId))
          requests.current.set(imageId, crypto.randomUUID());
        form.set("request_id", requests.current.get(imageId)!);
        try {
          const next = await runStudio(form);
          setResults((old) => [...old, { ...next, image: imageId }]);
          if (next.id || next.ok) requests.current.delete(imageId);
          router.refresh();
          // Stop at the first failure so the remaining images do not use quota.
          if (!next.ok) break;
        } catch {
          setResults((old) => [
            ...old,
            {
              ok: false,
              image: imageId,
              message:
                "The connection stopped. Check Runs before you try again. The other images did not run.",
            },
          ]);
          break;
        }
      }
      setProgress("");
    });
  }

  return (
    <section className="test" aria-labelledby="test-title">
      <div className="section-head">
        <h2 id="test-title">Test this chain</h2>
        <Link href={`/runs?chain=${chain.id}`}>Past runs</Link>
      </div>
      {issue ? (
        <p className="hint">{issue}</p>
      ) : (
        <>
          <ImageUpload
            disabled={pending}
            onBusy={setUploading}
            onUploaded={(image) => {
              setUploaded((old) => [image, ...old]);
              setChosen((old) =>
                old.length < MAX_IMAGES ? [...old, image.id] : old,
              );
              setResults([]);
              requests.current.clear();
            }}
          />
          <fieldset className="image-picker" disabled={pending || uploading}>
            <legend>
              Choose up to {MAX_IMAGES} images
              {chosen.length > 0 && (
                <span className="count"> · {chosen.length} chosen</span>
              )}
            </legend>
            <div className="image-grid">
              {visible.map((image) => {
                const on = chosen.includes(image.id);
                return (
                  <label
                    key={image.id}
                    className={`image-choice${on ? " on" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      disabled={!on && chosen.length >= MAX_IMAGES}
                      onChange={(e) => toggle(image.id, e.target.checked)}
                    />
                    <Image
                      src={`/asset/${image.id}`}
                      alt=""
                      width={160}
                      height={120}
                      unoptimized
                      loading="lazy"
                    />
                    <span>{image.label}</span>
                  </label>
                );
              })}
            </div>
            {options.length > FIRST_VIEW && (
              <button
                type="button"
                className="text-button"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show fewer" : `Show all ${options.length} images`}
              </button>
            )}
          </fieldset>
          <div className="row">
            <button
              type="button"
              className="button"
              disabled={pending || uploading || !chosen.length}
              onClick={run}
            >
              {pending
                ? "Running…"
                : chosen.length > 1
                  ? `Run on ${chosen.length} images`
                  : "Run"}
            </button>
            <p className="hint">
              Images go to Gemini. Each person can start ten runs a day.
            </p>
          </div>
        </>
      )}
      <div aria-live="polite" className="results">
        {pending && (
          <p role="status" className="hint">
            {progress} Longer chains can take a few minutes.
          </p>
        )}
        {results.map((result, index) => (
          <motion.p
            initial={reduce ? false : { opacity: 0.8, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            key={result.id ?? index}
            className={result.ok ? "success" : "error"}
            role={result.ok ? "status" : "alert"}
          >
            <span>{label(result.image)}: </span>
            {result.ok ? "Finished." : result.message}{" "}
            {result.id && (
              <Link href={`/runs?q=${result.id}`}>See the results</Link>
            )}
          </motion.p>
        ))}
      </div>
    </section>
  );
}
