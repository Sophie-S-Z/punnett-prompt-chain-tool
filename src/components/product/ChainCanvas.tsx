"use client";

import { Icon } from "@/components/ui/Icon";
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
import { STEP_SPACING, stepPosition } from "@/lib/chain-canvas";
import { StudioForm, StepFields } from "../StudioForms";

type CanvasStep = Node<
  {
    label: string;
    detail: string;
    step?: Step;
    count: number;
    busy: boolean;
    move: (step: Step, position: number) => void;
    inspect: (id: string) => void;
  },
  "step"
>;

/** A step exposes the same persisted order through pointer and keyboard controls. */
function StepNode({ data, selected }: NodeProps<CanvasStep>) {
  const step = data.step;
  return (
    <div className={`step-node${selected ? " selected" : ""}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span className="eyebrow">
        {step ? `Step ${String(step.position).padStart(2, "0")}` : "Sequence"}
      </span>
      <button
        className="step-label nodrag"
        onClick={() => step && data.inspect(step.id)}
        disabled={!step}
      >
        {data.label}
      </button>
      <p>{data.detail}</p>
      {step && (
        <div className="step-moves nodrag">
          <button
            type="button"
            aria-label={`Move ${step.name} left`}
            disabled={data.busy || step.position === 1}
            onClick={() => data.move(step, step.position - 1)}
          >
            <Icon name="left" />
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
            <Icon name="right" />
          </button>
        </div>
      )}
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { step: StepNode };

/** The flow is derived from saved order; no drawn connection can change a chain. */
export function ChainCanvas({
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

  function move(step: Step, position: number) {
    if (busy) return;
    setNodes(initialNodes);
    if (position === step.position) return;
    const form = new FormData();
    form.set("chain_id", chain.id);
    form.set("revision", String(chain.revision));
    form.set("step_id", step.id);
    form.set("position", String(position));
    setMessage("Saving step order…");
    start(async () => {
      try {
        const result = await editStudio("step.move", form);
        setMessage(
          result.ok
            ? `${step.name} moved to position ${position}.`
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
  const initialNodes: CanvasStep[] = [
    {
      id: "input",
      type: "step",
      position: { x: 0, y: 0 },
      draggable: false,
      data: { ...common, label: "Test images", detail: "Source material" },
    },
    ...chain.steps.map((s) => ({
      id: s.id,
      type: "step" as const,
      position: { x: s.position * STEP_SPACING, y: 0 },
      data: { ...common, label: s.name, detail: s.model, step: s },
    })),
    {
      id: "output",
      type: "step",
      position: { x: (chain.steps.length + 1) * STEP_SPACING, y: 0 },
      draggable: false,
      data: {
        ...common,
        label: "Captions",
        detail: "Saved captions & traces",
      },
    },
  ];
  const [nodes, setNodes, onNodesChange] =
    useNodesState<CanvasStep>(initialNodes);
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
    <section className="chain-panel" aria-label="Prompt chain canvas">
      <header>
        <div>
          <h2>Prompt chain</h2>
        </div>
        <p className="fine">Drag steps to change their order.</p>
      </header>
      <div className="step-canvas">
        <ReactFlow<CanvasStep>
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
              stepPosition(node.position.x, chain.steps.length),
            )
          }
          fitView
          fitViewOptions={{ padding: 0.2, minZoom: 0.35, maxZoom: 0.85 }}
          minZoom={0.2}
          maxZoom={1.5}
          aria-label="Ordered prompt chain. Select a step to inspect it."
        >
          <Background gap={24} color="var(--border)" />
          <Controls showInteractive={false} />
          <MiniMap
            style={{ width: 150, height: 90 }}
            nodeColor="var(--accent)"
            maskColor="transparent"
            pannable
            zoomable
          />
        </ReactFlow>
      </div>
      <p className="fine chain-status" role="status">
        {busy
          ? "Saving step order…"
          : message ||
            "Pan or zoom to explore. Use the arrow buttons to move a step by keyboard."}
      </p>
      {step && (
        <aside className="step-inspector" aria-label="Step details">
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
            label="Edit selected step"
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
