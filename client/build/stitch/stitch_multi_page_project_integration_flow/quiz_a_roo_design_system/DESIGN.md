---
name: Quiz-a-roo Design System
colors:
  surface: '#faf9f8'
  surface-dim: '#dadad9'
  surface-bright: '#faf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f2'
  surface-container: '#eeeeed'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e1'
  on-surface: '#1a1c1c'
  on-surface-variant: '#554336'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f0f0'
  outline: '#887364'
  outline-variant: '#dbc2b0'
  surface-tint: '#904d00'
  primary: '#8d4b00'
  on-primary: '#ffffff'
  primary-container: '#b15f00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb77d'
  secondary: '#944a23'
  on-secondary: '#ffffff'
  secondary-container: '#fd9e70'
  on-secondary-container: '#76340e'
  tertiary: '#665f3d'
  on-tertiary: '#ffffff'
  tertiary-container: '#b5ac84'
  on-tertiary-container: '#464021'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#76330d'
  tertiary-fixed: '#ede3b8'
  tertiary-fixed-dim: '#d1c79d'
  on-tertiary-fixed: '#201c02'
  on-tertiary-fixed-variant: '#4d4727'
  background: '#faf9f8'
  on-background: '#1a1c1c'
  surface-variant: '#e3e2e1'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style

The design system is built to evoke feelings of warmth, curiosity, and playfulness. It targets a casual audience looking for an engaging, educational experience that feels accessible and human-centric.

The aesthetic follows a **Tactile Modernism** approach. It leverages the softness of rounded corners and organic, earthy tones to create a space that feels safe and inviting. Unlike sharp, high-tech interfaces, this design system prioritizes a "handmade" digital feel through gentle color transitions, subtle depth, and substantial whitespace. The goal is to make the act of learning and testing knowledge feel less like a clinical exam and more like a cozy, intellectual adventure.

## Colors

The palette is rooted in an earthy, organic spectrum that emphasizes readability and comfort.

- **Primary:** An autumnal orange used for main actions and highlights. It provides energy without being jarring.
- **Secondary:** A deep chocolate brown used for typography and high-contrast navigational elements, grounding the interface.
- **Tertiary:** A soft cream/amber used for card backgrounds and secondary surfaces to reduce visual fatigue.
- **Neutral:** A near-white parchment tone used for the primary application background, maintaining the warm "paper-like" feel.

Color application should follow a 60-30-10 rule to ensure the earthy creams remain dominant, while the primary orange draws the eye to interactive elements.

## Typography

This design system utilizes a trio of contemporary sans-serifs to balance personality with extreme legibility.

- **Headlines:** `Plus Jakarta Sans` is used for its soft, friendly curves and modern geometric construction. It excels in large formats, providing a welcoming "Quiz-a-roo" character.
- **Body:** `Be Vietnam Pro` offers a warm, contemporary feel for long-form questions and descriptions. Its slightly open apertures ensure high readability even on smaller mobile screens.
- **Utility/Labels:** `Work Sans` provides a grounded, professional structure for navigation, buttons, and metadata, ensuring functional elements remain clear and distinct from content.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. 

- **Mobile:** A 4-column system with 16px margins. Content is mostly stacked to prioritize the focus on a single question at a time.
- **Tablet/Desktop:** A 12-column grid with a maximum content width of 1200px. For the trivia interface, a centered "Stage" layout is preferred, where the card spans 8 columns, leaving 2 columns of breathing room on either side.

Spacing follows an 8px base rhythm. Large internal paddings (md to lg) are encouraged within cards to create a sense of "premium space" and reduce cognitive load during timed quizzes.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Soft Ambient Shadows**.

1.  **Level 0 (Floor):** The Neutral Parchment (#FDFCFB) background.
2.  **Level 1 (Cards):** Soft Cream (#FEF3C7) surfaces with a very diffused, low-opacity shadow (Color: Primary-Dark, Alpha: 5%, Blur: 20px). This makes the quiz cards feel like they are resting gently on a surface.
3.  **Level 2 (Active Elements):** Interactive elements like buttons or selected answers use a slight "pop" effect. This is achieved through a subtle inner glow or a secondary, tighter shadow to imply a physical press or lift.

Avoid harsh black shadows or heavy borders; depth should feel atmospheric and natural.

## Shapes

The shape language is consistently **Rounded**. This reinforces the "friendly" brand pillar and removes the "edge" from the competitive aspect of trivia.

- **Standard Containers:** Use the `rounded-lg` (1rem) setting.
- **Primary Buttons & Choice Chips:** Use the `rounded-xl` (1.5rem) or full pill-shape to make them feel highly "tappable" and tactile.
- **Form Inputs:** Mirror the standard container roundedness to maintain a cohesive block-based structure.

## Components

### Buttons
- **Primary:** Solid Primary Orange fill with Secondary Brown text. Heavy roundedness (Pill). 
- **Secondary (Navigation):** Ghost style with a Secondary Brown border (2px) and text.
- **Tertiary:** Text-only with an underline or icon suffix for low-priority actions like "Skip Question."

### Quiz Cards
Cards are the heart of the system. They feature a Tertiary Cream background, `rounded-lg` corners, and generous `md` padding. The question headline should always be the most prominent element.

### Choice Chips (Answer Inputs)
Large, block-level buttons. 
- **Default State:** Cream background with a subtle border.
- **Selected State:** Primary Orange border (3px) with a light tinted fill.
- **Success/Error:** Use the designated accent colors for immediate feedback after selection.

### Progress Indicators
A horizontal bar using a "Track and Fill" metaphor. The track is a muted version of the Tertiary color, while the fill is the Primary Orange. Use rounded ends for the bar to match the shape language.