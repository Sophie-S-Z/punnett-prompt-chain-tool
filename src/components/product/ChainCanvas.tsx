"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Handle,
  Position,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { editStudio } from "@/app/studio-actions";
import type { Chain, Step } from "@/lib/studio";
import { STEP_SPACING, stepPosition } from "@/lib/chain-canvas";

type FlowNode = Node<{ label: string; detail: string; step?: Step }, "step">;

function StepNode({ data }: NodeProps<FlowNode>) {
  return (
    <div className={`flow-node${data.step ? "" : " terminal"}`}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <strong>
        {data.step && <span>{data.step.position}</span>}
        {data.label}
      </strong>
      <small>{data.detail}</small>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}
const nodeTypes = { step: StepNode };

function buildNodes(chain: Chain): FlowNode[] {
  return [
    {
      id: "input",
      type: "step",
      position: { x: 0, y: 0 },
      draggable: false,
      data: { label: "Image", detail: "Test input" },
    },
    ...chain.steps.map((s) => ({
      id: s.id,
      type: "step" as const,
      position: { x: s.position * STEP_SPACING, y: 0 },
      data: {
        label: s.name,
        detail:
          s.output_kind === "captions" ? "Writes captions" : "Writes text",
        step: s,
      },
    })),
    {
      id: "output",
      type: "step",
      position: { x: (chain.steps.length + 1) * STEP_SPACING, y: 0 },
      draggable: false,
      data: {
        label:
          chain.steps.at(-1)?.output_kind === "captions" ? "Captions" : "Text",
        detail: "Saved to runs",
      },
    },
  ];
}

/** Shows the saved order. Drag a step sideways to move it. */
export function ChainCanvas({ chain }: { chain: Chain }) {
  const router = useRouter();
  const [busy, start] = useTransition();
  const [message, setMessage] = useState("");
  const initial = buildNodes(chain);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initial);
  const edges = initial.slice(1).map((n, i) => ({
    id: `${initial[i].id}-${n.id}`,
    source: initial[i].id,
    target: n.id,
    ariaLabel: `${initial[i].data.label} to ${n.data.label}`,
  }));

  function move(step: Step, position: number) {
    setNodes(initial);
    if (busy || position === step.position) return;
    const form = new FormData();
    form.set("chain_id", chain.id);
    form.set("revision", String(chain.revision));
    form.set("step_id", step.id);
    form.set("position", String(position));
    start(async () => {
      try {
        const result = await editStudio("step.move", form);
        setMessage(
          result.ok
            ? `Moved ${step.name} to step ${position}.`
            : result.message,
        );
        router.refresh();
      } catch {
        setMessage("The new order was not saved. Reload the page to check it.");
      }
    });
  }

  return (
    <section className="flow" aria-label="Chain diagram">
      <div className="flow-canvas">
        <ReactFlow<FlowNode>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          nodesConnectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          edgesReconnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          nodesDraggable={!busy}
          panOnDrag={chain.steps.length > 2}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          onNodeClick={(_, node) =>
            node.data.step &&
            document.getElementById(`step-${node.id}`)?.scrollIntoView({
              block: "center",
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
            })
          }
          onNodeDragStop={(_, node) =>
            node.data.step &&
            move(
              node.data.step,
              stepPosition(node.position.x, chain.steps.length),
            )
          }
          defaultViewport={{ x: 1, y: 24, zoom: 1 }}
          translateExtent={[
            [-8, -24],
            [(chain.steps.length + 1) * STEP_SPACING + 176, 80],
          ]}
          minZoom={1}
          maxZoom={1}
        />
      </div>
      <p className="hint" role="status">
        {busy ? "Saving the new order…" : message || "Drag a step to move it."}
      </p>
    </section>
  );
}
