"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { editStudio } from "@/app/studio-actions";
import type { Chain, Option, Step } from "@/lib/studio";
import { GENE_SPACING, strandPosition } from "@/lib/strand";
import { StudioForm, StepFields } from "../StudioForms";

type Gene = Node<
  {
    label: string;
    detail: string;
    step?: Step;
    count: number;
    busy: boolean;
    move: (step: Step, position: number) => void;
    inspect: (id: string) => void;
  },
  "gene"
>;

/** A gene exposes the same persisted order through pointer and keyboard controls. */
function GeneNode({ data, selected }: NodeProps<Gene>) {
  const step = data.step;
  return (
    <div className={`gene-node${selected ? " selected" : ""}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span className="eyebrow">
        {step ? `Gene ${String(step.position).padStart(2, "0")}` : "Sequence"}
      </span>
      <button
        className="gene-label nodrag"
        onClick={() => step && data.inspect(step.id)}
        disabled={!step}
      >
        {data.label}
      </button>
      <p>{data.detail}</p>
      {step && (
        <div className="gene-moves nodrag">
          <button
            type="button"
            aria-label={`Move ${step.name} left`}
            disabled={data.busy || step.position === 1}
            onClick={() => data.move(step, step.position - 1)}
          >
            ←
          </button>
          <span>
            {step.input_kind === "image" ? "Image" : "Text"} →{" "}
            {step.output_kind === "captions" ? "Captions" : "Text"}
          </span>
          <button
            type="button"
            aria-label={`Move ${step.name} right`}
            disabled={data.busy || step.position === data.count}
            onClick={() => data.move(step, step.position + 1)}
          >
            →
          </button>
        </div>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { gene: GeneNode };

/** The strand is derived from saved order; no drawn connection can change a chain. */
export function GeneStrand({
  chain,
  models,
}: {
  chain: Chain;
  models: Option[];
}) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [message, setMessage] = useState("");
  const [inspected, setInspected] = useState<string | null>(null);
  const step = chain.steps.find((s) => s.id === inspected);

  function move(gene: Step, position: number) {
    if (busy) return;
    setNodes(initialNodes);
    if (position === gene.position) return;
    const form = new FormData();
    form.set("chain_id", chain.id);
    form.set("revision", String(chain.revision));
    form.set("step_id", gene.id);
    form.set("position", String(position));
    setMessage("Saving gene order…");
    start(async () => {
      try {
        const result = await editStudio("step.move", form);
        setMessage(
          result.ok
            ? `${gene.name} moved to position ${position}.`
            : result.message,
        );
        router.refresh();
      } catch {
        setMessage("Order could not be saved. Reload to check it.");
      }
    });
  }

  const common = {
    count: chain.steps.length,
    busy,
    move,
    inspect: setInspected,
  };
  const initialNodes: Gene[] = [
    {
      id: "input",
      type: "gene",
      position: { x: 0, y: 0 },
      draggable: false,
      data: { ...common, label: "Test images", detail: "Source material" },
    },
    ...chain.steps.map((s) => ({
      id: s.id,
      type: "gene" as const,
      position: { x: s.position * GENE_SPACING, y: 0 },
      data: { ...common, label: s.name, detail: s.model, step: s },
    })),
    {
      id: "output",
      type: "gene",
      position: { x: (chain.steps.length + 1) * GENE_SPACING, y: 0 },
      draggable: false,
      data: {
        ...common,
        label: "Specimens",
        detail: "Saved captions & traces",
      },
    },
  ];
  const [nodes, setNodes, onNodesChange] = useNodesState<Gene>(initialNodes);
  const displayedNodes = nodes.map((n) => ({
    ...n,
    data: { ...n.data, ...common },
  }));
  const edges = initialNodes.slice(1).map((n, i) => ({
    id: `${initialNodes[i].id}-${n.id}`,
    source: initialNodes[i].id,
    target: n.id,
    type: "smoothstep",
  }));

  return (
    <section className="strand-panel" aria-label="Genome strand">
      <header>
        <div>
          <p className="eyebrow">Genome map</p>
          <h2>Follow the strand</h2>
        </div>
        <p className="fine">Drag a gene to re-sequence the chain.</p>
      </header>
      <div className="gene-canvas">
        <ReactFlow<Gene>
          nodes={displayedNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          edgesReconnectable={false}
          deleteKeyCode={null}
          nodesDraggable={!busy}
          onNodeClick={(_, node) => node.data.step && setInspected(node.id)}
          onNodeDragStop={(_, node) =>
            node.data.step &&
            move(
              node.data.step,
              strandPosition(node.position.x, chain.steps.length),
            )
          }
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.35, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={1.5}
          aria-label="Ordered prompt chain. Select a gene to inspect it."
        >
          <Background gap={24} color="var(--border)" />
          <Controls showInteractive={false} />
          <MiniMap
            style={{ width: 150, height: 90 }}
            nodeColor="var(--glow)"
            maskColor="transparent"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
      <p className="fine strand-status" role="status">
        {busy
          ? "Saving gene order…"
          : message ||
            "Pan or zoom to explore. Use the arrow buttons to move a gene by keyboard."}
      </p>
      {step && (
        <aside className="gene-inspector" aria-label="Gene inspector">
          <div className="row-actions">
            <h3>
              {step.position}. {step.name}
            </h3>
            <button
              type="button"
              className="text-button"
              onClick={() => setInspected(null)}
            >
              Close inspector
            </button>
          </div>
          <p className="fine">
            {step.model} · temperature {step.temperature}
          </p>
          <dl className="prompt-text">
            <dt>System prompt</dt>
            <dd>{step.system_prompt || "No system prompt"}</dd>
            <dt>User prompt</dt>
            <dd>{step.user_prompt}</dd>
          </dl>
          <StudioForm
            operation="step.update"
            chain={chain}
            step={step}
            base="/chains"
            label="Edit selected gene"
          >
            <StepFields
              step={step}
              models={models}
              first={step.position === 1}
            />
          </StudioForm>
        </aside>
      )}
    </section>
  );
}
