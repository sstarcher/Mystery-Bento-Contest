#include <WiFi.h>
#include <WebServer.h>

// ====================================================================
// MYSTERY BENTO CONTEST - SUSHI BELT CONTROLLER FIRMWARE
// Target MCU: ESP32 Dev Module / ESP32-S3
// Driver:     TMC2209 SilentStepStick (StealthChop2)
// Motor:      NEMA 17 Stepper (200 steps/rev, 1/16 microstepping)
// ====================================================================

// --- PIN DEFINITIONS ---
const int PIN_STEP   = 18;
const int PIN_DIR    = 19;
const int PIN_ENABLE = 21;

// --- BELT CALIBRATION CONSTANTS ---
// NEMA 17: 200 full steps * 16 microsteps = 3200 pulses per motor revolution
const float STEPS_PER_REV = 3200.0;
// 10-tooth sprocket with 38mm pitch = 380mm travel per revolution
const float MM_PER_REV    = 380.0; 

// --- OPERATIONAL STATE ---
float target_rpm    = 15.0;  // 15 RPM = ~9.5 cm/sec (Sushiro Pace)
bool  is_running    = false;
unsigned long step_interval_micros = 1000;

WebServer server(80);

// Hardware Timer for Jitter-Free Silent Stepping
hw_timer_t *timer = NULL;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

void IRAM_ATTR onStepTimer() {
    portENTER_CRITICAL_ISR(&timerMux);
    if (is_running) {
        digitalWrite(PIN_STEP, HIGH);
        delayMicroseconds(2);
        digitalWrite(PIN_STEP, LOW);
    }
    portEXIT_CRITICAL_ISR(&timerMux);
}

void setBeltSpeedRPM(float rpm) {
    target_rpm = rpm;
    if (rpm <= 0.1) {
        is_running = false;
        digitalWrite(PIN_ENABLE, HIGH); // Disable motor coils (freewheel/cool)
        return;
    }
    
    // Calculate microseconds between step pulses
    float steps_per_second = (rpm / 60.0) * STEPS_PER_REV;
    step_interval_micros = (unsigned long)(1000000.0 / steps_per_second);
    
    timerAlarmWrite(timer, step_interval_micros, true);
    digitalWrite(PIN_ENABLE, LOW); // Enable motor coils
    is_running = true;
}

void setup() {
    Serial.begin(115200);
    
    pinMode(PIN_STEP, OUTPUT);
    pinMode(PIN_DIR, OUTPUT);
    pinMode(PIN_ENABLE, OUTPUT);

    // Initial state: Forward direction, motor disabled
    digitalWrite(PIN_DIR, HIGH);
    digitalWrite(PIN_ENABLE, HIGH); 

    // Wi-Fi Access Point configuration
    WiFi.softAP("Sushi-Conveyor-Control", "bento1234");
    Serial.println("Wi-Fi AP started. IP: " + WiFi.softAPIP().toString());

    // Setup 1MHz Hardware Step Timer
    timer = timerBegin(0, 80, true);
    timerAttachInterrupt(timer, &onStepTimer, true);

    // --- REST API ENDPOINTS ---
    
    // GET /status
    server.on("/status", HTTP_GET, []() {
        String json = "{\"running\":" + String(is_running ? "true" : "false") + 
                      ",\"rpm\":" + String(target_rpm) + 
                      ",\"speed_cms\":" + String((target_rpm * MM_PER_REV) / 600.0) + "}";
        server.send(200, "application/json", json);
    });

    // POST /start
    server.on("/start", HTTP_POST, []() {
        setBeltSpeedRPM(15.0);
        server.send(200, "text/plain", "Belt Started at 15 RPM");
    });

    // POST /stop
    server.on("/stop", HTTP_POST, []() {
        setBeltSpeedRPM(0);
        server.send(200, "text/plain", "Belt Stopped");
    });

    // POST /speed?rpm=18
    server.on("/speed", HTTP_POST, []() {
        if (server.hasArg("rpm")) {
            float new_rpm = server.arg("rpm").toFloat();
            setBeltSpeedRPM(new_rpm);
            server.send(200, "text/plain", "Speed updated to " + String(new_rpm) + " RPM");
        } else {
            server.send(400, "text/plain", "Missing rpm query parameter");
        }
    });

    server.begin();
    Serial.println("HTTP Server running on port 80");
}

void loop() {
    server.handleClient();
}
