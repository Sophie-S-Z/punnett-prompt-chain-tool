# Week 8: prompt chain tool

Due: Thursday, November 5, 2026, 2:00 PM EST.

## Requirements

| Requirement | Where |
| --- | --- |
| Superadmin only | `src/proxy.ts`, `src/lib/admin.ts`, and every server action check `profiles.is_superadmin` through `punnett_admin_access`. |
| Create, update, delete a chain | "New chain" in the chain list. "Edit" and "Delete chain" next to the chain name. |
| Create, update, delete a step | "Add step" under the steps. "Edit" and "Delete" on each step. Forms open in place. |
| Reorder steps | "Move up" and "Move down" on each step. Drag a step in the chain diagram. |
| Generate media from a chain | "Test this chain" at the bottom of the chain page. Each step's output goes to the next step. The last step writes captions. |
| View media from one chain | "Past runs" opens `/runs?chain=…`. The title shows the chain name. |
| Dark, light, system | Theme menu in the top bar. Dark is the default. System follows the OS setting. |

## Feedback from the November 5 review

- Removed all biology and sequence wording.
- Removed icons, the command palette, the minimap, the revision number, the "Example starter" label, the mix controls, and the footer.
- Removed all-caps labels and full stops in headings. The product name appears once.
- Moved "Test this chain" to the bottom of the page. The image choice starts empty.
- Step and chain forms open in place. They do not open a new page.
- The chain diagram shows only for chains with two or more steps.
- The chain search shows only when there are more than ten chains.
- The runs page shows the chain name.
- Placeholder text is larger and has more contrast.

## How to check it

1. Open the commit URL in a private window. You see the Google sign-in, with no Vercel login.
2. Sign in with a superadmin account.
3. Create a chain. Add a step that reads the image and writes text.
4. Add a second step that reads the output of the step before and writes captions.
5. Edit a prompt. Reload the page. The change stays.
6. Move a step with "Move down". Then drag it back in the diagram. Reload. The order stays.
7. Choose one to three images under "Test this chain". Select "Run".
8. Select "See the results". Check each step's output and prompts.
9. Switch between Dark, Light, and System.
10. Delete a step and then the chain. Past runs stay on the Runs page.
11. Sign out. Open `/chains`. The app sends you to the sign-in page.
