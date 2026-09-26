// ====================================================================
// SUSHI CONVEYOR - DRIVE SPROCKET FOR NEMA 17 MOTOR
// Designed for Prusa CORE One+ (PETG, 4 perimeters, 25% infill)
//
// Drives the 38mm-pitch crescent chain around the 180-degree turnaround.
// ====================================================================

$fn = 90;

// --------------------------------------------------
// SPROCKET PARAMETERS
// --------------------------------------------------
slat_pitch     = 38.0;   // Matches crescent slat pitch (mm)
num_teeth      = 10;     // 10 teeth gives ~121mm pitch diameter (~221mm outer turnaround)
sprocket_thick = 10.0;   // Height of the sprocket disc (mm)
pocket_dia     = 13.0;   // Pocket cutout for 12mm hinge boss (+1mm clearance)
flange_lip     = 2.0;    // Bottom shelf flange to support the chain vertically

// NEMA 17 Shaft Interface
shaft_dia      = 5.2;    // 5mm shaft (+0.2mm 3D print clearance)
shaft_flat     = 4.6;    // Flat-to-round distance for D-shaft
hub_dia        = 28.0;   // Reinforced center hub diameter
hub_height     = 18.0;   // Total hub height (includes set screw area)
setscrew_dia   = 3.2;    // M3 set screw hole
nut_width      = 5.6;    // M3 hex nut trap width
nut_thick      = 2.6;    // M3 hex nut trap thickness

// Pitch Diameter Calculations
pitch_circ   = num_teeth * slat_pitch;
pitch_dia    = pitch_circ / PI;       // ~120.96 mm
pitch_radius = pitch_dia / 2;         // ~60.48 mm
outer_radius = pitch_radius + 6.0;    // Tip of teeth

module drive_sprocket() {
    difference() {
        union() {
            // Main Sprocket Disc
            cylinder(r = outer_radius, h = sprocket_thick);
            
            // Center reinforced hub extending upward
            cylinder(r = hub_dia/2, h = hub_height);
            
            // Bottom chain support shelf (prevents chain from slipping down)
            cylinder(r = outer_radius + 4, h = flange_lip);
        }
        
        // 1. Cut the tooth pockets around circumference
        for (i = [0 : num_teeth - 1]) {
            rotate([0, 0, i * (360 / num_teeth)]) {
                // Tooth pocket centered on pitch radius
                translate([pitch_radius, 0, -1])
                    cylinder(r = pocket_dia/2, h = sprocket_thick + 2);
                
                // Funnel lead-in for smooth tooth engagement
                translate([pitch_radius + 4, 0, -1])
                    rotate([0, 0, 45])
                        cube([pocket_dia * 0.8, pocket_dia * 0.8, sprocket_thick + 2], center=true);
            }
        }
        
        // 2. NEMA 17 D-Shaft Center Bore
        translate([0, 0, -1])
            intersection() {
                cylinder(r = shaft_dia/2, h = hub_height + 2);
                translate([-shaft_dia/2, -shaft_dia/2, 0])
                    cube([shaft_flat, shaft_dia, hub_height + 2]);
            }
        
        // 3. M3 Set Screw Hole & Nut Pocket in the Hub
        translate([0, 0, hub_height - 5]) {
            rotate([0, 90, 0]) {
                // Screw shaft hole
                cylinder(r = setscrew_dia/2, h = hub_dia/2 + 2);
                
                // Hex nut capture pocket
                translate([0, 0, 7])
                    rotate([0, 0, 30])
                        cylinder(r = nut_width / (2 * cos(30)), h = nut_thick, $fn=6);
            }
        }
        
        // 4. Weight reduction & aesthetic lightening cutouts
        for (a = [0 : 4]) {
            rotate([0, 0, a * (360 / 5) + 18]) {
                translate([pitch_radius * 0.55, 0, -1])
                    cylinder(r = 12, h = sprocket_thick + 2);
            }
        }
    }
}

drive_sprocket();
