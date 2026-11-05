import type { SVGProps } from "react";
const paths = {
  arrow: "M7 17 17 7M7 7h10v10",
  upload: "M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5",
  image: "M4 4h16v16H4zM4 15l5-5 4 4 3-3 4 4M8 8h.01",
  plus: "M12 5v14M5 12h14",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  close: "m6 6 12 12M6 18 18 6",
  up: "m6 14 6-6 6 6",
  down: "m6 10 6 6 6-6",
  left: "m14 6-6 6 6 6",
  right: "m10 6 6 6-6 6",
  search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  steps: "M4 4h6v6H4zM14 14h6v6h-6zM10 7h7v7",
  clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};
export function Icon({
  name,
  ...props
}: SVGProps<SVGSVGElement> & { name: keyof typeof paths }) {
  return (
    <svg
      className="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
