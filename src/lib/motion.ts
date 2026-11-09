/** Short, non-bouncing transitions for editing and run feedback. */
export const motionTokens = {
  duration: { fast: 0.16, normal: 0.2 },
  ease: {
    enter: [0.16, 1, 0.3, 1] as [number, number, number, number],
    move: [0.45, 0, 0.55, 1] as [number, number, number, number],
  },
};
