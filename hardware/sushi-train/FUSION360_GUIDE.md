# Complete Fusion 360 Guide: Sushiro Crescent Slat & Conveyor Belt

This step-by-step guide is designed specifically for **Autodesk Fusion 360** beginners to model the custom crescent slats, drive sprocket, and track system for your home sushi conveyor.

All dimensions are tuned for:
- **3.5-inch sushi saucers**
- **1.75mm PETG filament hinge pins**
- **NEMA 17 stepper motor drive**
- **Prusa CORE One+ print volume**

---

## Part 1: Modeling the Crescent Slat

The magic of the crescent slat is that both curves share the exact same radius, with the rear curve offset downward by the chain pitch ($38\,\text{mm}$).

### Step 1: Set Up User Parameters
In Fusion 360, go to **Modify > Change Parameters** and create these user parameters:
* `slat_width` = `100 mm`
* `slat_pitch` = `38 mm`
* `arc_radius` = `42 mm`
* `deck_thick` = `4 mm`
* `plate_dia`  = `92 mm` (locating rim for 3.5" plates)
* `pin_dia`    = `2.0 mm` (slip fit for 1.75mm filament)
* `clevis_od`  = `12 mm`

### Step 2: The Slat Profile Sketch
1. Click **Create Sketch** and select the **XY Plane (Top)**.
2. Press `C` (Center Diameter Circle):
   * Place the center at the **Origin (0,0)**.
   * Set diameter to `2 * arc_radius` ($84\,\text{mm}$).
3. Draw a vertical construction line straight down from the Origin:
   * Press `L`, click the construction icon (`X`), start at $(0,0)$, go down along the Y-axis, type `slat_pitch` ($38\,\text{mm}$), and click.
4. Press `C` again for the rear curve:
   * Place the center at the bottom of the construction line $(0, -38)$.
   * Set diameter to `2 * (arc_radius + 0.45 mm)` ($84.9\,\text{mm}$). The $+0.45\,\text{mm}$ gives a smooth sliding gap between adjacent slats.
5. Draw a **Center Rectangle**:
   * Click **Create > Rectangle > Center Rectangle**.
   * Snap the center to the midpoint of the construction line $(0, -19)$.
   * Set width to `slat_width` ($100\,\text{mm}$) and height to `100 mm`.
6. Press `T` (Trim tool) to trim away the outer edges of the circles until you have a clean crescent shape.
7. Click **Finish Sketch**.

### Step 3: Extrude the Deck
1. Press `E` (Extrude).
2. Select the crescent profile.
3. Set Distance to `deck_thick` ($4\,\text{mm}$) and click **OK**.

### Step 4: Add the 3.5" Plate Recess Ring
1. Create a sketch on the **Top Face** of the slat.
2. Press `C` (Circle), place the center at $(0, -19\,\text{mm})$.
3. Set diameter to `plate_dia` ($92\,\text{mm}$).
4. Finish Sketch.
5. Press `E` (Extrude), select the circle, set Distance to `-1.0 mm` (Cut operation), and click **OK**.

### Step 5: Model the Hinge Knuckles (Underside)
1. Orbit to the **Bottom Face** of the slat and create a sketch.
2. Draw two circles:
   * Front boss at $(0, 0)$: Diameter `clevis_od` ($12\,\text{mm}$).
   * Rear boss at $(0, -38\,\text{mm})$: Diameter `clevis_od` ($12\,\text{mm}$).
3. Draw the vertical pin holes:
   * Circle at $(0, 0)$ with diameter `pin_dia` ($2.0\,\text{mm}$).
   * Circle at $(0, -38\,\text{mm})$ with diameter `pin_dia` ($2.0\,\text{mm}$).
4. Finish Sketch.
5. **Extrude Rear Female Clevis:**
   * Extrude the rear $12\,\text{mm}$ ring down `-9.5 mm`.
   * On the side of the rear cylinder, make a rectangular cut `4.8 mm` high in the middle (leaving a top ear and bottom ear of $\approx 2.3\,\text{mm}$).
6. **Extrude Front Male Tongue:**
   * Extrude the front $12\,\text{mm}$ ring down `-4.2 mm` positioned in the center $Z$ position so it fits into the rear slot of the preceding slat.

---

## Part 2: Modeling the NEMA 17 Drive Sprocket

The sprocket sits on the motor shaft and has 10 circular pockets that cradle the $12\,\text{mm}$ hinge bosses of the slats.

### Step 1: The Pitch Circle
1. Create a new component in Fusion 360 called `Drive_Sprocket`.
2. Create a sketch on the **XY Plane**.
3. Draw the Pitch Circle:
   * Diameter = `(10 * slat_pitch) / PI` = **$120.96\,\text{mm}$**. Set this circle to **Construction (`X`)**.
4. Draw the Outer Rim Circle:
   * Center at Origin, diameter = **$133\,\text{mm}$**.
5. Draw the Center Hub:
   * Center at Origin, diameter = **$28\,\text{mm}$**.

### Step 2: The Tooth Pocket & Circular Pattern
1. Press `C` (Circle):
   * Place the center on the top quadrant of the dashed pitch circle $(0, 60.48\,\text{mm})$.
   * Set diameter to `13.0 mm` (cradles the $12\,\text{mm}$ hinge knuckle with $1\,\text{mm}$ clearance).
2. Click **Create > Circular Pattern**:
   * Objects: The $13\,\text{mm}$ circle.
   * Center Point: The Origin $(0,0)$.
   * Quantity: `10`.
   * Click **OK**.

### Step 3: NEMA 17 D-Shaft Center Bore
1. Press `C` at the Origin: Diameter = **$5.2\,\text{mm}$** (for standard $5\,\text{mm}$ motor shaft).
2. Press `L` (Line) to cut a flat chord across the circle:
   * Distance from flat chord to the opposite curved side = **$4.6\,\text{mm}$**.
   * Trim away the small rounded segment.

### Step 4: Extrude the Sprocket
1. Press `E`, select the outer rim and teeth profile (excluding the center bore).
2. Extrude up `10 mm`.
3. In the timeline, show the sketch again, select the center hub, and extrude it up `18 mm` (provides meat for an M3 set-screw hole).
4. On the side of the hub, create a hole for an **M3 set-screw** perpendicular to the D-flat.

---

## Part 3: PrusaSlicer Export & Print Settings (Prusa CORE One+)

1. In Fusion 360, right-click the body or component and choose **Save as Mesh** (format: `.3MF` or `.STL`).
2. Open **PrusaSlicer**:
   * Printer: **Prusa CORE One / CORE One+**
   * Filament: **Prusament PETG** (or standard PETG)
   * Print Profile: **0.20mm STRUCTURAL**
3. **Crucial Slicer Settings:**
   * **Ironing:** Enable on *Topmost surface only* for the crescent slats. This creates an injection-molded smooth finish so the sushi plates glide effortlessly.
   * **Infill:** $25\%$ Gyroid for slats and sprocket; $15\%$ Grid for track sections.
   * **Perimeters (Walls):** Set to `4` for the sprocket and hinge knuckles for maximum mechanical strength.

---

## Part 4: Recommended Test Sequence

1. **The 3-Slat Test:**
   * Print just **3 crescent slats** first.
   * Take a piece of your $1.75\,\text{mm}$ filament spool, snip off three $9\,\text{mm}$ lengths, and slide them into the vertical hinge holes from the bottom.
   * Swivel them in your hands. They should rotate smoothly from $0^\circ$ to $90^\circ$ to $180^\circ$ with zero binding and zero gap.
2. **The Sprocket Engagement Test:**
   * Print the 10-tooth drive sprocket.
   * Wrap the 3 connected slats around the sprocket teeth to confirm the hinge pockets engage without climbing or slipping.
