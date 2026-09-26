// ====================================================================
// SUSHI CONVEYOR - MODULAR STRAIGHT TRACK SEGMENT
// Designed for Prusa CORE One+ (Fits 250x220mm Bed Flat Without Supports)
//
// Features:
// - Two low-friction sliding rails to minimize motor strain.
// - Center hinge guide slot (14mm wide).
// - Interlocking dovetail ends for snap-together tool-less assembly.
// - Split-lane side joints with central utility channel (for LEDs/wires).
// ====================================================================

$fn = 60;

// --------------------------------------------------
// TRACK PARAMETERS
// --------------------------------------------------
segment_length = 200.0; // 200mm length fits standard bed
slat_width     = 100.0; // Slat width
lane_clearance = 3.0;   // 1.5mm gap on each side
channel_width  = slat_width + lane_clearance; // 103mm

track_base_th  = 3.0;   // Floor thickness
side_wall_th   = 4.0;   // Outer wall thickness
side_wall_h    = 18.0;  // Outer guard wall height
slot_width     = 14.5;  // Center slot width for hinge lugs
slot_depth     = 11.0;  // Center slot depth

dovetail_w     = 16.0;  // Interlocking dovetail width
dovetail_neck  = 10.0;  // Dovetail neck width
dovetail_h     = 10.0;  // Dovetail length
dovetail_clr   = 0.25;  // 0.25mm slip-fit clearance for 3D printing

// --------------------------------------------------
// DOVETAIL TAB MODULE
// --------------------------------------------------
module dovetail_tab(clr = 0.0) {
    linear_extrude(height = side_wall_h - 2) {
        polygon(points=[
            [-dovetail_neck/2 + clr, 0],
            [-dovetail_w/2 + clr, dovetail_h - clr],
            [dovetail_w/2 - clr, dovetail_h - clr],
            [dovetail_neck/2 - clr, 0]
        ]);
    }
}

// --------------------------------------------------
// SINGLE STRAIGHT LANE MODULE (LEFT OR RIGHT)
// --------------------------------------------------
module straight_lane_half(is_left = true) {
    difference() {
        union() {
            // Main floor and outer wall body
            cube([channel_width + side_wall_th, segment_length, track_base_th]);
            
            // Outer guide wall
            translate([0, 0, 0])
                cube([side_wall_th, segment_length, side_wall_h]);
            
            // Inner guide wall (dividing island edge)
            translate([channel_width, 0, 0])
                cube([side_wall_th, segment_length, side_wall_h]);
            
            // Raised low-friction glide ribs (Slats ride on these two thin ridges)
            translate([side_wall_th + 15, 0, track_base_th])
                cube([2.0, segment_length, 1.5]);
            translate([channel_width - 15, 0, track_base_th])
                cube([2.0, segment_length, 1.5]);
            
            // Male Dovetail Interlock Tab at the end (+Y)
            translate([side_wall_th + channel_width/2, segment_length, 0])
                dovetail_tab(clr = 0.0);
        }
        
        // --- SUBTRACTIONS ---
        
        // 1. Center Hinge Guide Channel
        translate([side_wall_th + channel_width/2 - slot_width/2, -1, -1])
            cube([slot_width, segment_length + 2, slot_depth]);
        
        // 2. Female Dovetail Socket at start (Y = 0)
        translate([side_wall_th + channel_width/2, 0, -0.1])
            mirror([0, 1, 0])
                dovetail_tab(clr = -dovetail_clr);
        
        // 3. Screw mounting / table grip foot counter-bores (optional)
        for (y = [30, segment_length - 30]) {
            translate([side_wall_th + 8, y, -0.5])
                cylinder(r = 2.0, h = track_base_th + 2);
            translate([channel_width - 4, y, -0.5])
                cylinder(r = 2.0, h = track_base_th + 2);
        }
    }
}

// Render Left Lane Segment
straight_lane_half(is_left = true);
