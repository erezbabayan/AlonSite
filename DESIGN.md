# Design System Specification: Editorial Remembrance

## 1. Overview & Creative North Star: "The Digital Sanctuary"
This design system is not a template; it is a curated environment. The Creative North Star is **"The Digital Sanctuary"**—a space that feels as quiet and intentional as a physical memorial garden. We move away from the "web-app" aesthetic by embracing **intentional asymmetry**, high-ratio whitespace, and a complete rejection of harsh structural lines. 

The experience is defined by a sense of weight and history, achieved through high-contrast typography scales (the tension between large, poetic serifs and functional labels) and a layout that breathes. Elements should feel like they are floating on fine parchment, layered with the softness of light through frosted glass.

---

## 2. Colors & Surface Philosophy
The palette avoids the sterile coldness of pure black and white. Instead, we use "Charcoal" (`primary`) and "Parchment" (`surface`) to create a somber yet warm atmosphere.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning or containment. 
*   **Defining Boundaries:** Use background color shifts. A section utilizing `surface-container-low` (#f5f3ee) sitting against the main `surface` (#fbf9f4) provides all the separation necessary.
*   **Signature Textures:** For Hero sections or primary call-to-actions, use a subtle linear gradient from `primary` (#03192e) to `primary-container` (#1a2e44). This adds "soul" and depth, preventing the deep blues from feeling flat or "digital."

### Surface Hierarchy & Nesting
Treat the UI as physical layers of paper. Use the Material tiers to define depth:
*   **Base:** `surface` (#fbf9f4) – The primary canvas.
*   **De-emphasized:** `surface-container-low` (#f5f3ee) – For secondary content blocks.
*   **Emphasized:** `surface-container-highest` (#e4e2dd) – For navigation or interactive surfaces that need to "step forward."

### The "Glass & Gradient" Rule
To elevate the memorial experience, use **Glassmorphism** for floating elements (like a navigation bar or a "Light a Candle" floating action button). 
*   **Spec:** Apply a background of `surface` (#fbf9f4) at 70% opacity with a `backdrop-blur` of 12px. This ensures the photography—the heart of the story—bleeds through the UI, making the system feel integrated with the memory.

---

## 3. Typography: The Editorial Voice
We utilize a classic Hebrew serif hierarchy to convey dignity and timelessness. 

| Level | Token | Font Family | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Noto Serif | 3.5rem | For the name of the deceased. Poetic and bold. |
| **Headline** | `headline-md` | Noto Serif | 1.75rem | For section titles (e.g., "Early Life", "Gallery"). |
| **Title** | `title-lg` | Newsreader | 1.375rem | For sub-headers and story quotes. |
| **Body** | `body-lg` | Newsreader | 1rem | Primary narrative text. Highly readable at length. |
| **Label** | `label-md` | Inter | 0.75rem | Meta-data, dates, and functional UI labels. |

**RTL Note:** All typography must maintain a generous `line-height` (1.6 for body) to accommodate Hebrew diacritics and ensure the text feels "light" on the parchment background.

---

## 4. Elevation & Depth: Tonal Layering
We do not use shadows to create "pop"; we use them to create "atmosphere."

*   **The Layering Principle:** Avoid shadows for static cards. Instead, place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f5f3ee) background. This creates a soft, natural lift.
*   **Ambient Shadows:** For interactive floating elements (like modals), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(27, 28, 25, 0.06)`. The tint is derived from `on-surface` (#1b1c19), not pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use `outline-variant` (#c4c6cd) at 20% opacity. Never use 100% opaque borders.

---

## 5. Components

### Buttons
*   **Primary:** Background: `primary` (#03192e), Text: `on-primary` (#ffffff). Shape: `md` (0.375rem). Transition: 300ms ease-in-out.
*   **Secondary:** Background: `surface-container-highest` (#e4e2dd), Text: `primary`. 
*   **Tertiary (Text-only):** Text: `primary`. Use for less urgent actions like "Read More."

### Input Fields
*   **Style:** Minimalist. No background fill. A single "Ghost Border" at the bottom (1px, 20% opacity `outline-variant`). On focus, the line transitions to `primary` (#03192e) at 100% opacity.
*   **Labels:** Use `label-md` in `on-surface-variant` (#43474d).

### Cards & Story Blocks
*   **Constraint:** Forbid the use of divider lines.
*   **Spacing:** Use vertical white space (32px or 48px) to separate life events.
*   **Imagery:** Photos should have a subtle `xl` (0.75rem) corner radius. For a signature look, use **Asymmetric Bleed**: allow images to extend to the edge of the screen on one side while text remains centered.

### Specialty Component: The "Condolence Scroll"
*   A specialized list for messages. Each entry sits on a `surface-container-low` background. 
*   **Transitions:** Use soft "fade-in and slide-up" animations for new entries to maintain a respectful, slow-paced interaction.

---

## 6. Do’s and Don'ts

### Do
*   **Do** prioritize the photograph. The UI exists to frame the image, not compete with it.
*   **Do** use asymmetrical grids. Place a headline at the right (RTL start) and the body text slightly offset to create a custom, editorial feel.
*   **Do** use `secondary` (#585f65) for dates and meta-information to keep the visual hierarchy clear.

### Don't
*   **Don't** use pure black (#000). Use `primary` (#03192e) for high-contrast text to maintain "warmth."
*   **Don't** use standard "drop shadows" or heavy cards. If it feels like a dashboard, it is wrong.
*   **Don't** use rapid or bouncy animations. Transitions should be "Linear-to-Ease-Out" and slightly longer (400ms-600ms) to feel dignified.
*   **Don't** use dividers or "HR" lines. Let the negative space define the end of a thought.