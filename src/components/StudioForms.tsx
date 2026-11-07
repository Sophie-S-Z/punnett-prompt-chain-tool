"use client";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { editStudio } from "@/app/studio-actions";
import type { Chain, Option, Step } from "@/lib/studio";

type Done = (id?: string) => void;

/** Sends one studio change and reports the result. */
function useStudioAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  function submit(operation: string, form: FormData, done: Done) {
    setError("");
    start(async () => {
      try {
        const result = await editStudio(operation, form);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        done(result.id);
      } catch {
        setError(
          "The connection stopped. Reload the page to see if the change was saved.",
        );
      }
    });
  }
  return { pending, error, setError, submit };
}

function Hidden({ chain, step }: { chain?: Chain; step?: Step }) {
  return (
    <>
      <input type="hidden" name="chain_id" value={chain?.id ?? ""} />
      <input type="hidden" name="revision" value={chain?.revision ?? ""} />
      <input type="hidden" name="step_id" value={step?.id ?? ""} />
    </>
  );
}

/** A form that opens in place of the content it changes. */
function InlineForm({
  operation,
  chain,
  step,
  submitLabel,
  onClose,
  onDone,
  children,
}: {
  operation: string;
  chain?: Chain;
  step?: Step;
  submitLabel: string;
  onClose: () => void;
  onDone: Done;
  children: ReactNode;
}) {
  const { pending, error, setError, submit } = useStudioAction();
  const reduce = useReducedMotion();
  return (
    <motion.form
      initial={false}
      layout="position"
      transition={{ duration: reduce ? 0 : 0.2 }}
      className="inline-form"
      onChange={() => setError("")}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !pending) onClose();
      }}
      onSubmit={(e) => {
        e.preventDefault();
        submit(operation, new FormData(e.currentTarget), onDone);
      }}
    >
      <Hidden chain={chain} step={step} />
      <fieldset disabled={pending}>{children}</fieldset>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="row">
        <button type="submit" className="button" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          className="button ghost"
          disabled={pending}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}

export function StepList({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  return (
    <LayoutGroup id={id}>
      <ol className="steps">{children}</ol>
    </LayoutGroup>
  );
}

/** Moves focus back to the button that opened a form after the form closes. */
function useReturnFocus(open: boolean) {
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);
  return trigger;
}

export function ChainFields({ chain }: { chain?: Chain }) {
  return (
    <>
      <label>
        Name
        <input
          name="name"
          required
          maxLength={150}
          autoFocus
          placeholder="For example, Everyday captions"
          defaultValue={chain?.name ?? ""}
        />
      </label>
      <label>
        Description <span className="optional">Optional</span>
        <textarea
          name="description"
          rows={2}
          maxLength={2000}
          placeholder="What kind of captions this chain writes"
          defaultValue={chain?.description ?? ""}
        />
      </label>
      {chain && <input type="hidden" name="weight" value={chain.weight} />}
    </>
  );
}

export function StepFields({
  step,
  models,
  first,
}: {
  step?: Step;
  models: Option[];
  first: boolean;
}) {
  const hint = useId();
  return (
    <>
      <label>
        Step name
        <input
          name="name"
          required
          maxLength={100}
          autoFocus
          placeholder="For example, Describe the image"
          defaultValue={step?.name ?? ""}
        />
      </label>
      <div className="field-pair">
        <label>
          Input
          <select
            name="input_kind"
            defaultValue={step?.input_kind ?? (first ? "image" : "previous")}
          >
            <option value="image">The image</option>
            <option value="previous">Output of the step before</option>
          </select>
        </label>
        <label>
          Output
          <select name="output_kind" defaultValue={step?.output_kind ?? "text"}>
            <option value="text">Text</option>
            <option value="captions">Captions (2 to 6)</option>
          </select>
        </label>
      </div>
      <label>
        System prompt <span className="optional">Optional</span>
        <textarea
          name="system_prompt"
          rows={3}
          maxLength={12000}
          placeholder="The role and rules for the model"
          defaultValue={step?.system_prompt ?? ""}
        />
      </label>
      <div className="field">
        <label>
          User prompt
          <textarea
            name="user_prompt"
            rows={5}
            required
            maxLength={12000}
            placeholder="What this step must do"
            aria-describedby={hint}
            defaultValue={step?.user_prompt ?? ""}
          />
        </label>
        <small id={hint}>
          The app attaches the image or the output of the step before.
        </small>
      </div>
      <div className="field-pair">
        <div className="field">
          <label>
            Model
            <select
              name="model_id"
              required
              defaultValue={step?.model_id ?? models[0]?.id ?? ""}
            >
              <option value="" disabled>
                Choose a model
              </option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {models.length < 2 && (
            <small>
              <a
                href="https://punnett-observatory.vercel.app/models"
                target="_blank"
                rel="noopener noreferrer"
              >
                Manage models
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            </small>
          )}
        </div>
        <label>
          Temperature
          <input
            name="temperature"
            type="number"
            required
            min={0}
            max={2}
            step={0.1}
            defaultValue={step?.temperature ?? 0.7}
          />
        </label>
      </div>
    </>
  );
}

export function NewChain() {
  const [open, setOpen] = useState(false);
  const trigger = useReturnFocus(open);
  const router = useRouter();
  if (!open)
    return (
      <button
        ref={trigger}
        type="button"
        className="button"
        onClick={() => setOpen(true)}
      >
        New chain
      </button>
    );
  return (
    <InlineForm
      operation="chain.create"
      submitLabel="Create chain"
      onClose={() => setOpen(false)}
      onDone={(id) => {
        setOpen(false);
        router.push(`/chains?chain=${id}`);
        router.refresh();
      }}
    >
      <ChainFields />
    </InlineForm>
  );
}

export function ChainHeader({ chain }: { chain: Chain }) {
  const [editing, setEditing] = useState(false);
  const trigger = useReturnFocus(editing);
  const router = useRouter();
  if (editing)
    return (
      <InlineForm
        operation="chain.update"
        chain={chain}
        submitLabel="Save"
        onClose={() => setEditing(false)}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
      >
        <ChainFields chain={chain} />
      </InlineForm>
    );
  return (
    <header className="chain-header">
      <div>
        <h1>{chain.name}</h1>
        {chain.description && <p>{chain.description}</p>}
      </div>
      <div className="row">
        <button
          ref={trigger}
          type="button"
          className="text-button"
          aria-label="Edit chain name and description"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <DeleteButton
          operation="chain.delete"
          chain={chain}
          label="Delete chain"
          body={`Delete “${chain.name}” and its steps? Past runs keep their prompts and results.`}
        />
      </div>
    </header>
  );
}

export function StepItem({
  chain,
  step,
  models,
}: {
  chain: Chain;
  step: Step;
  models: Option[];
}) {
  const [editing, setEditing] = useState(false);
  const trigger = useReturnFocus(editing);
  const router = useRouter();
  const reduce = useReducedMotion();
  return (
    <motion.li
      initial={false}
      layout={reduce ? false : "position"}
      transition={{ layout: { type: "spring", stiffness: 420, damping: 38 } }}
      className="step"
      id={`step-${step.id}`}
    >
      <span className="step-index" aria-hidden="true">
        {step.position}
      </span>
      <div className="step-body">
        {editing ? (
          <InlineForm
            operation="step.update"
            chain={chain}
            step={step}
            submitLabel="Save step"
            onClose={() => setEditing(false)}
            onDone={() => {
              setEditing(false);
              router.refresh();
            }}
          >
            <StepFields
              step={step}
              models={models}
              first={step.position === 1}
            />
          </InlineForm>
        ) : (
          <>
            <div className="step-head">
              <h3>
                <span className="visually-hidden">Step {step.position}: </span>
                {step.name}
              </h3>
              <p className="meta">
                {step.input_kind === "image" ? "Image" : "Previous output"} to{" "}
                {step.output_kind === "captions" ? "captions" : "text"} ·{" "}
                {step.model} · temperature {step.temperature}
              </p>
            </div>
            <p className="prompt">{step.user_prompt}</p>
            {step.system_prompt && (
              <details className="system-prompt">
                <summary>System prompt</summary>
                <p className="prompt">{step.system_prompt}</p>
              </details>
            )}
            <div className="step-actions">
              <button
                ref={trigger}
                type="button"
                className="text-button"
                aria-label={`Edit ${step.name}`}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <MoveStep chain={chain} step={step} />
              <DeleteButton
                operation="step.delete"
                chain={chain}
                step={step}
                label="Delete"
                accessibleLabel={`Delete ${step.name}`}
                body={`Delete the step “${step.name}”? The steps after it move up.`}
              />
            </div>
          </>
        )}
      </div>
    </motion.li>
  );
}

export function AddStep({ chain, models }: { chain: Chain; models: Option[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useReturnFocus(open);
  const router = useRouter();
  if (chain.steps.length >= 8)
    return <p className="hint">A chain can have up to eight steps.</p>;
  if (!open)
    return (
      <button
        ref={trigger}
        type="button"
        className="add-step"
        onClick={() => setOpen(true)}
      >
        Add step {chain.steps.length + 1}
      </button>
    );
  return (
    <div className="step new">
      <span className="step-index" aria-hidden="true">
        {chain.steps.length + 1}
      </span>
      <div className="step-body">
        <InlineForm
          operation="step.create"
          chain={chain}
          submitLabel="Add step"
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        >
          <StepFields models={models} first={!chain.steps.length} />
        </InlineForm>
      </div>
    </div>
  );
}

function DeleteButton({
  operation,
  chain,
  step,
  label,
  accessibleLabel,
  body,
}: {
  operation: "chain.delete" | "step.delete";
  chain: Chain;
  step?: Step;
  label: string;
  accessibleLabel?: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const { pending, error, setError, submit } = useStudioAction();
  const router = useRouter();
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (pending) return;
        setOpen(value);
        setError("");
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="text-button danger"
          aria-label={accessibleLabel}
        >
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog">
          <Dialog.Title>{label}</Dialog.Title>
          <Dialog.Description>{body}</Dialog.Description>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(operation, new FormData(e.currentTarget), () => {
                setOpen(false);
                if (operation === "chain.delete") router.push("/chains");
                router.refresh();
              });
            }}
          >
            <Hidden chain={chain} step={step} />
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="row end">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="button ghost"
                  disabled={pending}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="button danger"
                disabled={pending}
              >
                {pending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function MoveStep({ chain, step }: { chain: Chain; step: Step }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  function move(position: number) {
    const form = new FormData();
    form.set("chain_id", chain.id);
    form.set("revision", String(chain.revision));
    form.set("step_id", step.id);
    form.set("position", String(position));
    start(async () => {
      try {
        const result = await editStudio("step.move", form);
        if (!result.ok) setError(result.message);
        else {
          setError("");
          router.refresh();
        }
      } catch {
        setError("The new order was not saved. Reload the page to check it.");
      }
    });
  }
  return (
    <>
      <button
        type="button"
        className="text-button"
        aria-label={`Move ${step.name} up`}
        disabled={pending || step.position === 1}
        onClick={() => move(step.position - 1)}
      >
        Move up
      </button>
      <button
        type="button"
        className="text-button"
        aria-label={`Move ${step.name} down`}
        disabled={pending || step.position === chain.steps.length}
        onClick={() => move(step.position + 1)}
      >
        Move down
      </button>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </>
  );
}
