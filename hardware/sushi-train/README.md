# 🍱 Mystery Bento Contest - Physical Sushi Conveyor Belt

This directory contains all the CAD models, parametric 3D design files, ready-to-print STLs, and manufacturing guides for the **physical tabletop sushi conveyor belt** designed to accompany the [Mystery Bento Contest](https://github.com/sstarcher/Mystery-Bento-Contest) digital experience.

Tuned specifically for:
- **Table Dimensions:** 34" x 70" (leaves ~11.4" of dining depth on each side)
- **Plate Sizing:** 3.5" (89mm) saucers & bento cups
- **3D Printer:** Prusa CORE One+ (250 x 220 x 270 mm, PETG)
- **Drive:** NEMA 17 Stepper Motor + TMC2209 silent driver
- **Chain Mechanics:** Crescent slat continuous loop with vertical 1.75mm filament hinge pins

---

## Project Structure

* **`crescent_slat.stl`**: Ready-to-print binary STL for the 3.5" plate crescent slat. Open directly in PrusaSlicer!
* **`drive_sprocket.stl`**: Ready-to-print binary STL for the 10-tooth NEMA 17 drive sprocket (5mm D-shaft).
* **`FUSION360_GUIDE.md`**: Complete beginner tutorial with sketch constraints, parameters, and step-by-step instructions for Autodesk Fusion 360.
* **`crescent_slat.scad`**: Fully parametric OpenSCAD model of the crescent slat.
* **`drive_sprocket.scad`**: Fully parametric OpenSCAD model of the drive sprocket.
* **`straight_track.scad`**: Modular straight track segment with low-friction glide ribs and dovetail connectors.
* **`turnaround_end.scad`**: 180-degree turnaround end module with NEMA 17 motor mount.
* **`build_models.ps1`**: PowerShell script to re-generate the STL files on demand.

---

## Machine & Hardware Specifications

* **Target Printer:** Prusa CORE One+ (250 x 220 x 270 mm build volume, fully enclosed)
* **Recommended Material:** Prusament PETG (black, white, or marble)
* **Plates:** 3.5" diameter saucers
* **Hinge Pins:** Standard 1.75mm PETG filament cut to ~9mm lengths
* **Motor:** NEMA 17 Stepper Motor (5mm D-shaft) driven by TMC2209 silent stepper driver
* **Table Clearance:** Takes ~11.2" in center, leaving ~11.4" of dining depth on each side.
