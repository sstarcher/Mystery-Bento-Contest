// ====================================================================
// SUSHI CONVEYOR - 180-DEGREE TURNAROUND END MODULE
// Compatible with NEMA 17 Motor (Drive) or 608 Bearing (Idler)
// Designed for Prusa CORE One+ (Fits 250x220mm Bed in Two Quadrants)
// ====================================================================

$fn = 100;

// Dimensions matching Straight Track & Slat
pitch_radius    = 60.5;   // Radius to center of chain (matches 10-tooth sprocket)
slat_width      = 100.0;  // Slat width
track_base_th   = 3.5;
side_wall_th    = 4.0;
side_wall_h     = 18.0;

inner_wall_r    = pitch_radius - slat_width/2 - 1.5; // ~9.0mm
outer_wall_r    = pitch_radius + slat_width/2 + 2.0; // ~112.5mm
slot_r          = pitch_radius;                     // Guide slot radius
slot_w          = 15.0;

// NEMA 17 Dimensions
nema17_width    = 42.3;
nema17_hole_spc = 31.04;
nema17_center_d = 22.5;

module turnaround_quadrant_drive() {
    difference() {
        union() {
            // 90-degree curved floor
            rotate_extrude(angle = 90) {
                translate([inner_wall_r, 0])
                    square([outer_wall_r - inner_wall_r, track_base_th]);
            }
            
            // Outer curved guard wall
            rotate_extrude(angle = 90) {
                translate([outer_wall_r, 0])
                    square([side_wall_th, side_wall_h]);
            }
            
            // Inner hub wall
            rotate_extrude(angle = 90) {
                translate([inner_wall_r - side_wall_th, 0])
                    square([side_wall_th, side_wall_h]);
            }
            
            // Raised glide rib along the curve
            rotate_extrude(angle = 90) {
                translate([pitch_radius + 30, track_base_th])
                    square([2.0, 1.5]);
                translate([pitch_radius - 30, track_base_th])
                    square([2.0, 1.5]);
            }
            
            // Center NEMA 17 Motor Mount Plate
            translate([0, 0, 0])
                cylinder(r = inner_wall_r + 2, h = track_base_th);
        }
        
        // 1. Curved Hinge Guide Slot
        rotate_extrude(angle = 90) {
            translate([slot_r - slot_w/2, -1])
                square([slot_w, track_base_th + 3]);
        }
        
        // 2. NEMA 17 Center Pilot Hole (22mm)
        translate([0, 0, -1])
            cylinder(r = nema17_center_d/2, h = track_base_th + 3);
        
        // 3. NEMA 17 M3 Mounting Bolt Holes
        for (dx = [-nema17_hole_spc/2, nema17_hole_spc/2]) {
            for (dy = [-nema17_hole_spc/2, nema17_hole_spc/2]) {
                translate([dx, dy, -1])
                    cylinder(r = 1.7, h = track_base_th + 3);
            }
        }
    }
}

// Render single 90-degree quadrant (print 2 for a full 180-degree turn)
turnaround_quadrant_drive();
