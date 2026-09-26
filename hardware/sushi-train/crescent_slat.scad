// ====================================================================
// SUSHI CONVEYOR - CRESCENT SLAT (3.5" Plate Compatible)
// Designed for Prusa CORE One+ (PETG, 0.20mm layer height)
//
// All dimensions in millimeters (mm).
// Pivot axis is VERTICAL (Z-axis) for horizontal table-top turning.
// ====================================================================

$fn = 100; // High resolution curves for clean 3D printing

// --------------------------------------------------
// USER PARAMETERS
// --------------------------------------------------
slat_width      = 100.0; // Total width across track (fits 3.5" plates)
slat_pitch      = 38.0;  // Distance between pivot centers (mm)
deck_thickness  = 4.0;   // Slat deck thickness (mm)
arc_radius      = 42.0;  // Radius of crescent curve (must >= pitch)
clearance       = 0.45;  // Sliding clearance between overlapping slats

// 3.5" (89mm) Plate Recess Ring
plate_dia       = 92.0;  // 92mm diameter locating rim
recess_depth    = 1.0;   // 1mm drop to prevent saucer sliding off

// Hinge & Pin Parameters (Underneath)
pin_dia         = 2.0;   // Hole diameter for 1.75mm filament pin (+0.25mm slip clearance)
clevis_depth    = 9.5;   // Total hinge depth below deck
clevis_od       = 12.0;  // Outer diameter of hinge cylindrical boss
tongue_thick    = 4.2;   // Thickness of male center tongue
slot_gap        = 4.8;   // Gap of female clevis (0.3mm clearance top & bottom)
flange_thick    = 2.3;   // Thickness of top & bottom ears of female clevis

// --------------------------------------------------
// 2D PROFILE OF THE CRESCENT SLAT
// --------------------------------------------------
module crescent_2d() {
    difference() {
        // Base rectangle intersected with forward convex arc
        intersection() {
            translate([-slat_width/2, -slat_pitch, 0])
                square([slat_width, slat_pitch + arc_radius]);
            
            // Forward convex arc centered at (0, 0)
            circle(r = arc_radius);
        }
        
        // Trailing concave arc centered at (0, -slat_pitch)
        translate([0, -slat_pitch, 0])
            circle(r = arc_radius + clearance);
    }
}

// --------------------------------------------------
// 3D SOLID SLAT ASSEMBLY
// --------------------------------------------------
module crescent_slat() {
    difference() {
        union() {
            // 1. Main Deck
            linear_extrude(height = deck_thickness)
                crescent_2d();
            
            // 2. Male Front Tongue (at origin 0,0, underneath deck)
            // Extends from Z = -(flange_thick + slot_gap - 0.3) to Z = -(flange_thick + 0.3)
            translate([0, 0, -(flange_thick + slot_gap - (slot_gap - tongue_thick)/2)])
                cylinder(r = clevis_od/2, h = tongue_thick);
            
            // Reinforcing web connecting front boss to underside of deck
            translate([-clevis_od/2, -clevis_od/2, -flange_thick - 1])
                cube([clevis_od, clevis_od/2, flange_thick + 1]);
            
            // 3. Female Rear Clevis (at 0, -slat_pitch, underneath deck)
            translate([0, -slat_pitch, -clevis_depth])
                cylinder(r = clevis_od/2, h = clevis_depth);
            
            // Rear web connecting clevis to deck
            translate([-clevis_od/2, -slat_pitch, -clevis_depth])
                cube([clevis_od, clevis_od/2, clevis_depth]);
        }
        
        // --- SUBTRACTIONS (CUTS) ---
        
        // A. Female Clevis Middle Slot (to receive male tongue of next slat)
        translate([-clevis_od, -slat_pitch - clevis_od, -(flange_thick + slot_gap)])
            cube([clevis_od * 2, clevis_od * 2, slot_gap]);
        
        // B. Vertical Hinge Pin Holes (Blind from top for water/food tightness!)
        // Front male pin hole
        translate([0, 0, -clevis_depth - 1])
            cylinder(r = pin_dia/2, h = clevis_depth + deck_thickness);
        
        // Rear female pin hole
        translate([0, -slat_pitch, -clevis_depth - 1])
            cylinder(r = pin_dia/2, h = clevis_depth + deck_thickness);
        
        // C. Plate Locating Recess on top surface
        translate([0, -slat_pitch/2, deck_thickness - recess_depth])
            cylinder(r = plate_dia/2, h = recess_depth + 0.1);
        
        // D. Low-friction underside runner relief (keeps only outer edges contacting track)
        translate([-slat_width/2 + 10, -slat_pitch * 2, -1])
            cube([slat_width - 20, slat_pitch * 4, 1.8]);
    }
}

// Render the single slat
crescent_slat();
