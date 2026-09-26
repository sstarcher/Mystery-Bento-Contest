# 🍱 Mystery Bento Contest

> An after-hours pixel-art food stall where curious conveyor selections charge a magical Bento Meter, unlocking automated persona contests, announcer drama, and cosmetic kitchen curios.

Repository: [sstarcher/Mystery-Bento-Contest](https://github.com/sstarcher/Mystery-Bento-Contest)  
Origin: Built with [Replit](https://replit.com/@sstarcher/Mystery-Bento-Contest)

---

## 🌟 Overview

**Mystery Bento** is an interactive, browser-based pixel-art spectacle. Players sit at an after-hours sushi and bento counter, picking morsels from a conveyor belt to charge the mystical **Mystery Bento Meter**. Once fully charged, the stall transforms into the **Persona Contest**: a seeded, deterministic 5-act race where kitchen personalities navigate obstacle-laden tracks to claim victory and award unique, collectible kitchen curios.

---

## 🛠️ Creation & Tooling Pipeline

This project was built using a modern AI-assisted "vibe coding" and creative production workflow:

| Tool | Purpose | Usage in Mystery Bento |
| :--- | :--- | :--- |
| **[Replit](https://replit.com/)** | **Vibe Coding & Development** | Fast, cloud-native full-stack prototyping, real-time code iteration, and live preview environments. |
| **[Perplexity](https://www.perplexity.ai/)** | **Ideation & World-Building** | Brainstorming core mechanics, contestant personas, lore, dialogue, and game loop concepts. |
| **[Scenario](https://app.scenario.com/)** | **Image Generation** | Generating consistent pixel-art aesthetic assets, restaurant environments, portraits, and backgrounds. |
| **[AutoSprite](https://www.autosprite.io/app)** | **Sprites & Animations** | Creating multi-frame contestant sprite sheets (walk, run, jump, fall, victory animations). |
| **[Photopea](https://www.photopea.com/)** | **Image Editing & Splicing** | Browser-based graphic design for sprite-sheet alignment, cell slicing, alpha channel masking, and texture optimization. |
| **[ElevenLabs](https://elevenlabs.io/)** | **Voice & Audio Generation** | High-energy, characterful announcer commentary clips and audio effects for race intros and victory scenes. |

---

## 🎮 Key Features & Gameplay

### 1. The Conveyor & Bento Meter
- **Morsel Selection:** Pick from dynamic illustrated delicacies passing along the conveyor belt.
- **Meter Progression:** Each morsel charges the meter by a randomized 7–16% with in-world chef feedback.
- **Hidden Long-Press:** A hidden press-and-hold interaction (mouse, touch, or Enter/Space for 1.5s) can instantly surge the meter to full.

### 2. The 5-Act Persona Contest
Once charged, witness a spectator-only race simulation:
1. **Arrival & Introduction:** Announcer introduces the featured contestants.
2. **Warm-Up:** Competitors take their starting positions.
3. **The Main Course:** Racers dodge course obstacles (checkpoints at 18%, 40%, 62%, and 83%).
4. **Final Stretch:** Continuous momentum calculation toward the finish threshold (~98.7%).
5. **Winner Reveal:** The champion performs their unique cooking sequence and is awarded a curio.

### 3. The 12 Kitchen Personas
Compete with an eclectic roster of food-themed contestants, each with unique traits, portraits, movement sets, and curio lines:
- **Pip Porridge** *(Speed)*
- **Lady Sencha** *(Focus)*
- **Captain Toro** *(Balance)*
- **Nori Nib** *(Patience)*
- **Tilda Tofu** *(Repair)*
- **Rollo Radish** *(Shortcut Luck)*
- **Miso Mallow** *(Calm)*
- **Uma Udon** *(Strength)*
- **Panko Puff** *(Investigation)*
- **Saffy Sashimi** *(Precision)*
- **Kiku Kettle** *(Invention)*
- **Bibi Bento** *(Preparation)*

### 4. Curios Shelf & Contest Ledger
- **36 Cosmetic Curios:** Collect all 3 keepsake items for every competitor.
- **Local Persistence:** Meter states, collected curios, and race logs are stored locally in `localStorage` without requiring user accounts or external databases.

---

## 💻 Technical Architecture

- **Frontend:** React 19, TypeScript 5.9, Vite, Tailwind CSS
- **UI Components:** Radix UI primitives, Lucide Icons, Framer Motion
- **Monorepo:** Managed with `pnpm` workspaces
- **Zero-Backend Dependency:** Runs as a client-side web artifact; all simulations, state, and assets execute in the browser.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (v9+)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sstarcher/Mystery-Bento-Contest.git
   cd Mystery-Bento-Contest
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm --filter @workspace/mystery-bento run dev
   ```
   Open your browser to the local Vite URL (default port: `24283` or `5173`).

4. **Build for production:**
   ```bash
   pnpm --filter @workspace/mystery-bento run build
   ```

---

## 🧪 Verification & Audit Suite

The project includes an extensive test suite ensuring asset integrity, deterministic race outcomes, and sprite boundary validation:

```bash
# Verify race timing, momentum model, and obstacle synchronization
pnpm --filter @workspace/mystery-bento run verify:race

# Verify movement and cooking sprite-sheet boundaries
pnpm --filter @workspace/mystery-bento run verify:sprites

# Verify curio sizing, placement, and art footprints
pnpm --filter @workspace/mystery-bento run verify:curios

# Verify canonical asset inventory and runtime URLs
pnpm --filter @workspace/mystery-bento run verify:assets
```

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
