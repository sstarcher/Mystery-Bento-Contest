# 🍱 Mystery Bento Contest - Physical Sushi Conveyor Belt

This directory contains all the CAD models, parametric 3D design files, ready-to-print STLs, and manufacturing guides for the **physical tabletop sushi conveyor belt** designed to accompany the [Mystery Bento Contest](https://github.com/sstarcher/Mystery-Bento-Contest) digital experience.

Tuned specifically for:
- **Table Dimensions:** 34" x 70" (leaves ~11.4" of dining depth on each side)
- **Plate Sizing:** 3.5" (89mm) saucers & bento cups
- **3D Printer:** Prusa CORE One+ (250 x 220 x 270 mm, PETG)
- **Drive:** NEMA 17 Stepper Motor + TMC2209 silent driver
- **Chain Mechanics:** Crescent slat continuous loop with vertical 1.75mm filament hinge pins

---

## 📚 Essential Guides & Manuals

* **[🛠️ Staged Build & Validation Guide](BUILD_AND_VALIDATION_GUIDE.md)**: **Start here!** Outlines the 6-stage incremental print-and-test workflow, complete BOM, and pass/fail checklists so you can validate fit and function *before* printing all 72 slats.
* **[⚡ Electronics, Motor Wiring & ESP32 Firmware Guide](ELECTRONICS_AND_FIRMWARE.md)**: Full wiring schematic, TMC2209 current tuning ($V_{ref}$), stepper coil pairing, and web app REST API.
* **[📐 Fusion 360 Modeling Guide](FUSION360_GUIDE.md)**: Beginner CAD tutorial covering sketch constraints, parameters, and modeling steps in Autodesk Fusion 360.
* **[💻 ESP32 Firmware (`sushi_belt_controller.ino`)](firmware/sushi_belt_controller/sushi_belt_controller.ino)**: Ready-to-flash Arduino sketch with hardware timer pulses and Wi-Fi REST endpoints.

---

## 📦 Directory Structure

```
hardware/sushi-train/
├── BUILD_AND_VALIDATION_GUIDE.md  <-- 6-Stage incremental test workflow & BOM
├── ELECTRONICS_AND_FIRMWARE.md     <-- Wiring diagram, TMC2209 tuning & API
├── FUSION360_GUIDE.md             <-- Beginner CAD tutorial for Fusion 360
├── README.md                      <-- Overview and hardware specifications
├── build_models.ps1               <-- PowerShell STL generator script
├── crescent_slat.stl              <-- 3.5" plate crescent slat (PrusaSlicer ready)
├── drive_sprocket.stl             <-- 10-tooth NEMA 17 drive sprocket (5mm D-shaft)
├── crescent_slat.scad             <-- Parametric source with 1.75mm filament hinges
├── drive_sprocket.scad            <-- Parametric source for drive sprocket
├── straight_track.scad            <-- Low-friction straight track with glide ribs
├── turnaround_end.scad            <-- 180° turnaround with motor mount
└── firmware/
    └── sushi_belt_controller/
        └── sushi_belt_controller.ino <-- ESP32 firmware sketch
```

---

## ⚙️ Hardware Specifications Summary

* **Target Printer:** Prusa CORE One+ ($250 \times 220 \times 270\,\text{mm}$ build volume, enclosed)
* **Recommended Material:** Prusament PETG (black, white, or marble)
* **Target Table:** $34" \times 70"$ (Conveyor width $\approx 11.2"$, leaves $11.4"$ on each side for dining)
* **Total Track Length:** $57\text{ inches}$ ($5\times$ straight segments + Drive + Idler)
* **Chain Length:** 72 crescent slats connected by $1.75\,\text{mm}$ filament pins
* **Motor & Driver:** NEMA 17 Stepper Motor ($5\,\text{mm}$ D-shaft) + TMC2209 SilentStepStick
