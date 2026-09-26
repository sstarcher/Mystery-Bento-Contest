# 🛠️ Stage-by-Stage Build & Validation Guide

Don't print the entire 70-slat conveyor at once! 

This guide defines an **incremental, staged validation pipeline**. At each stage, you print only a minimal sub-assembly, test physical fit, articulate joints, and verify motor torque before spending time and filament on the full build.

---

## 1. Complete Bill of Materials (BOM) & Print Quantities

For a **34" x 70" table** using **3.5" plates** (57-inch track loop):

### 3D Printed Parts (Prusa CORE One+ / PETG)

| Part | File | Quantity | Infill / Settings | Stage to Print |
| :--- | :--- | :--- | :--- | :--- |
| **Crescent Slat** | `crescent_slat.stl` | **72 total** | 25% Gyroid, Ironing ON, 3 walls | 3 for Stage 1; rest in Stage 6 |
| **Drive Sprocket** | `drive_sprocket.stl` | **1** | 35% Gyroid, 4 perimeters | Stage 2 |
| **Straight Track (Left Lane)** | `straight_track.scad` | **5** | 15% Grid, 3 perimeters | 1 for Stage 3; rest in Stage 6 |
| **Straight Track (Right Lane)** | `straight_track.scad` | **5** | 15% Grid, 3 perimeters | 1 for Stage 3; rest in Stage 6 |
| **Center Utility Spine** | `straight_track.scad` | **5** | 15% Grid | Stage 6 |
| **Drive Turnaround Base** | `turnaround_end.scad` | **2 quadrants** | 25% Gyroid, 4 perimeters | Stage 5 |
| **Idler Turnaround Base** | `turnaround_end.scad` | **2 quadrants** | 25% Gyroid, 4 perimeters | Stage 5 |
| **Table Gripper Feet** | Custom pad | **12–16** | 95A TPU (prevents sliding) | Stage 6 |

### Off-The-Shelf Hardware & Electronics

| Item | Specification | Qty | Purpose |
| :--- | :--- | :--- | :--- |
| **NEMA 17 Stepper Motor** | 42x40mm, 1.5A–1.7A, 5mm D-shaft | 1 | Main belt propulsion |
| **TMC2209 Stepper Driver** | SilentStepStick (BigTreeTech or similar) | 1 | Whisper-quiet motor control |
| **ESP32 Dev Board** | NodeMCU or Seeed Xiao ESP32-S3 | 1 | Wi-Fi / Web app controller |
| **Power Supply** | 12V DC, 3A (barrel jack or terminals) | 1 | Motor and logic power |
| **Capacitor** | 100µF 35V Electrolytic | 1 | Protects TMC2209 from voltage spikes |
| **Idler Bearing** | 608-2RS skate bearing (8x22x7mm) | 1 | Smooth idler turnaround axle |
| **Hinge Pins** | 1.75mm PETG filament cut to 9mm | ~75 pcs | Ultra-low friction vertical chain pins |
| **Fasteners** | M3 x 8mm socket head screws + nuts | ~12 pcs | Motor mount & sprocket set screws |
| **Fasteners** | M8 x 30mm bolt + nyloc nut | 1 pc | Axle for the 608 idler bearing |

---

## 2. The 6-Stage Incremental Validation Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                      STAGED VALIDATION WORKFLOW                        │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│    STAGE 1      │     STAGE 2      │     STAGE 3     │     STAGE 4     │
│  3-Slat Hinge   │  Drive Sprocket  │  Single Track   │  Electronics &  │
│  & Pin Fit      │  Engagement      │  Glide Test     │  Motor Bench    │
│  (~30 min print)│  (~45 min print) │  (~1 hr print)  │  (Zero prints)  │
├─────────────────┴──────────────────┴─────────────────┴─────────────────┤
│                               STAGE 5                                  │
│             Mini-Oval Closed Loop Bench Test (~24 slats)               │
├────────────────────────────────────────────────────────────────────────┤
│                               STAGE 6                                  │
│                 Full Table Scale-Up (Mass Production)                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Stage 1: The 3-Slat Articulation Test
* **Print:** Exactly **3 crescent slats** (`crescent_slat.stl`).
* **Print Time:** $\approx 35\text{ minutes}$.
* **Assembly:**
  1. Cut two $9\,\text{mm}$ lengths of standard $1.75\,\text{mm}$ PETG filament.
  2. Insert the male tongue of Slat 2 into the female rear clevis of Slat 1 from the bottom.
  3. Push the filament piece up through the $2.0\,\text{mm}$ vertical hole until it stops against the blind top deck.
* **Pass/Fail Validation Checklist:**
  - [ ] **Pin Fit:** Does the filament slide in smoothly with light finger pressure? (If too tight: bump hole compensation in slicer by $+0.05\,\text{mm}$. If too loose: check slicer extrusion multiplier).
  - [ ] **Articulation:** Can you swivel the slats $180^\circ$ left and right?
  - [ ] **Gap Inspection:** When turning, does the convex nose stay flush inside the concave rear curve without binding or pinching?
  - [ ] **Plate Recess:** Place your 3.5" saucer on the top. Does it seat cleanly into the $1\,\text{mm}$ recess ring?

---

### Stage 2: Drive Sprocket & Tooth Pitch Test
* **Print:** **1x Drive Sprocket** (`drive_sprocket.stl`).
* **Print Time:** $\approx 45\text{ minutes}$.
* **Assembly:**
  1. Slide the sprocket bore over the NEMA 17 motor's $5\,\text{mm}$ D-shaft.
  2. Thread an M3 set-screw into the hub nut pocket and lightly tighten against the flat of the shaft.
* **Pass/Fail Validation Checklist:**
  - [ ] **Shaft Fit:** Does the sprocket slide onto the motor shaft snugly without wobble?
  - [ ] **Tooth Engagement:** Take your 3 assembled slats from Stage 1 and wrap them around the sprocket circumference.
  - [ ] **Pitch Match:** Do the cylindrical hinge bosses drop cleanly into the sprocket pockets without climbing the teeth?

---

### Stage 3: Track Section Glide & Friction Test
* **Print:** **1x Straight Track Left Lane** + **1x Straight Track Right Lane** (`straight_track.scad`).
* **Print Time:** $\approx 1.5\text{ hours}$.
* **Assembly:**
  1. Push the Left and Right lanes together along the center seam.
  2. Connect their dovetails (if testing multi-segment joints).
* **Pass/Fail Validation Checklist:**
  - [ ] **Dovetail Tolerance:** Do the interlocking tabs snap together firmly without cracking?
  - [ ] **Glide Test:** Place the 3 connected slats from Stage 1 into the track channel. Tilt the track to a $15^\circ$ angle—do the slats slide freely down the track under gravity?
  - [ ] **Rail Clearance:** Ensure the slat underside rides exclusively on the **two raised guide ribs**, with the center hinge boss floating cleanly inside the center slot without rubbing the bottom.

---

### Stage 4: Electronics & Motor Bench Test (Zero 3D Prints)
* **Goal:** Verify that your ESP32, TMC2209 driver, and NEMA 17 motor work seamlessly and silently before installing them into a chassis.
* **Procedure:** Wire the electronics on a solderless breadboard according to the [Electronics & Firmware Guide](file:///hardware/sushi-train/ELECTRONICS_AND_FIRMWARE.md).
* **Pass/Fail Validation Checklist:**
  - [ ] **Silent Running:** In TMC2209 `StealthChop2` mode, is the motor rotation whisper-quiet at 15 RPM?
  - [ ] **Torque Check:** Can you pinch the shaft with two fingers without easily stalling it?
  - [ ] **Thermal Check:** Run the motor for 15 minutes. The motor should stay warm to the touch ($< 50^\circ\text{C}$), not scalding hot. (If hot, lower the driver $V_{ref}$).

---

### Stage 5: The "Mini-Oval" Closed Loop Bench Test
* **Print:** 
  * 2x Drive Turnaround Quadrants
  * 2x Idler Turnaround Quadrants
  * Print 18 more slats (for a total of $\approx 24\text{ slats}$).
* **Assembly:**
  1. Snap the Drive turnaround directly to the Idler turnaround (or with just 1 straight segment in between).
  2. Pin all 24 slats together into a complete closed loop.
  3. Mount the NEMA 17 motor and sprocket to the Drive turnaround.
  4. Mount a 608 skate bearing with an M8 bolt on the Idler turnaround.
* **Pass/Fail Validation Checklist:**
  - [ ] **Continuous Circulation:** Power on the motor. Does the chain loop circulate continuously for 10 minutes without catching or skipping teeth?
  - [ ] **Under-Load Test:** Place three 3.5" plates with sushi/weights on the moving belt. Does the belt continue gliding at a steady $\sim 8\,\text{cm/s}$?

---

### Stage 6: Full Table Scale-Up (Mass Production)
Once Stages 1 through 5 pass without issues:
1. Load your Prusa CORE One+ with PETG.
2. Queue the remaining **6 batches of slats** (10 per plate).
3. Queue the remaining **4 pairs of straight tracks**.
4. Print the center utility covers and TPU anti-slip feet.
5. Snap the entire 57" track together on your dining table, drop in the full 72-slat chain, and connect the ESP32 to your web app!
