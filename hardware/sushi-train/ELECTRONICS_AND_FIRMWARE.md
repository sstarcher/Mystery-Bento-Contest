# ⚡ Electronics, Motor Wiring & ESP32 Firmware Guide

This guide covers how to wire the **NEMA 17 Stepper Motor**, configure the **TMC2209 silent stepper driver**, tune motor current ($V_{ref}$), and flash the **ESP32 controller** to connect with your web app.

---

## 1. Complete System Wiring Schematic

```
                          ┌──────────────────────────┐
                          │    12V 3A DC POWER       │
                          │      SUPPLY BRICK        │
                          └─────────────┬────────────┘
                                        │ +12V (VIN)
                                        │  GND
                    ┌───────────────────┴────────────────────┐
                    │                                        │
           ┌────────▼─────────┐                    ┌────────▼─────────┐
           │   100µF 35V CAP  │                    │   ESP32 DEV BD   │
           │ (Across VMOT/GND)│                    │                  │
           └────────┬─────────┘                    │  3V3  ───────────┼──────┐ (3.3V Logic)
                    │                              │  GND  ───────────┼──┐   │
           ┌────────▼─────────┐                    │  GPIO 18 (STEP) ─┼──┼───┼──┐
           │ TMC2209 DRIVER   │                    │  GPIO 19 (DIR)  ─┼──┼───┼──┼──┐
           │                  │                    │  GPIO 21 (EN)   ─┼──┼───┼──┼──┼──┐
           │  VMOT  ◄─────────┴────────────────────┘                  │  │   │  │  │  │
           │  GND   ◄─────────────────────────────────────────────────┴──┘   │  │  │  │
           │  VDD   ◄────────────────────────────────────────────────────────┘  │  │  │
           │  STEP  ◄───────────────────────────────────────────────────────────┘  │  │
           │  DIR   ◄──────────────────────────────────────────────────────────────┘  │
           │  EN    ◄─────────────────────────────────────────────────────────────────┘
           │                  │
           │  1A, 1B, 2A, 2B  │
           └────────┬─────────┘
                    │ 4 Motor Wires
           ┌────────▼─────────┐
           │  NEMA 17 STEPPER │
           │   (5mm D-Shaft)  │
           └──────────────────┘
```

> [!CAUTION]
> **Always connect a 100µF capacitor across VMOT and GND** as close to the TMC2209 driver as possible. Unplugging the motor while powered or turning the belt by hand generates back-EMF spikes that will permanently destroy the driver without this capacitor!

---

## 2. Step-by-Step Wiring Connections

### A. NEMA 17 Motor Coil Identification
Stepper motors have two independent coils (Phase A and Phase B). You must wire Coil A to `1A/1B` and Coil B to `2A/2B`.
* **Quick Test without a Multimeter:**
  1. Take the 4 motor wires. Touch any two bare wire tips together.
  2. Try spinning the motor shaft with your fingers.
  3. If you feel sudden magnetic resistance, **those two wires belong to the same coil!** Label them `1A` and `1B`. The other two wires are `2A` and `2B`.

### B. Pinout Connection Table

| TMC2209 Pin | Connects To | Wire Color / Notes |
| :--- | :--- | :--- |
| **VMOT** | 12V DC Positive (+) | Motor power rail |
| **GND (Power)** | 12V DC Negative (-) | Common system ground |
| **VDD** | ESP32 `3V3` Pin | Logic supply (3.3V) |
| **GND (Logic)**| ESP32 `GND` Pin | Must share ground with 12V supply |
| **STEP** | ESP32 `GPIO 18` | Pulses control speed/position |
| **DIR** | ESP32 `GPIO 19` | High = Forward, Low = Reverse |
| **EN** | ESP32 `GPIO 21` | Pull LOW to enable, HIGH to coast |
| **1A / 1B** | Motor Coil 1 | First pair of stepper wires |
| **2A / 2B** | Motor Coil 2 | Second pair of stepper wires |
| **MS1 / MS2** | Set to HIGH or Jumpers | Default 1/16 microstepping with interpolation |

---

## 3. TMC2209 Current Tuning ($V_{ref}$)

Before running the motor under load, set the reference voltage ($V_{ref}$) on the tiny potentiometer of the TMC2209 using a small flathead screwdriver:

1. Connect the driver to 12V and GND (motor disconnected).
2. Set your digital multimeter to **DC Volts (2V range)**.
3. Place the **Black probe on system GND**.
4. Touch the **Red probe to the metal screw of the potentiometer** (or the tiny $V_{ref}$ test pad).
5. **Target Voltage:**
   * For standard $1.5\text{A}$ NEMA 17 motors, adjust until the meter reads:
     $$\mathbf{V_{ref} = 0.85\text{V to } 0.95\text{V}}$$
   * This delivers $\approx 0.65\text{A RMS}$ ($0.9\text{A peak}$), which gives plenty of torque to drive 70+ sushi plates while keeping the motor and driver completely cool.

---

## 4. ESP32 Firmware Code (`sushi_belt_controller.ino`)

Flash this sketch onto your ESP32 using the **Arduino IDE** or **PlatformIO**. It runs the motor silently in the background using hardware interrupts while serving a local REST/WebSocket API to connect with your web app.

```cpp
#include <WiFi.h>
#include <WebServer.h>

// --- PIN DEFINITIONS ---
const int PIN_STEP   = 18;
const int PIN_DIR    = 19;
const int PIN_ENABLE = 21;

// --- BELT CALIBRATION CONSTANTS ---
// NEMA 17: 200 steps/rev * 16 microsteps = 3200 steps/rev
const float STEPS_PER_REV = 3200.0;
// 10-tooth sprocket on 38mm pitch = 380mm per revolution
const float MM_PER_REV    = 380.0; 

// --- OPERATIONAL VARIABLES ---
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
        delayMicroseconds(2); // Short pulse
        digitalWrite(PIN_STEP, LOW);
    }
    portEXIT_CRITICAL_ISR(&timerMux);
}

void setBeltSpeedRPM(float rpm) {
    target_rpm = rpm;
    if (rpm <= 0.1) {
        is_running = false;
        digitalWrite(PIN_ENABLE, HIGH); // Disable motor coils
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

    // Setup Wi-Fi Access Point (or connect to home router)
    WiFi.softAP("Sushi-Conveyor-Control", "bento1234");
    Serial.println("Wi-Fi AP started. IP: " + WiFi.softAPIP().toString());

    // Setup Hardware Step Timer
    timer = timerBegin(0, 80, true); // 80MHz / 80 = 1MHz tick (1 microsecond)
    timerAttachInterrupt(timer, &onStepTimer, true);

    // --- REST API ENDPOINTS FOR WEB APP ---
    
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
```

---

## 5. Connecting with Your Web App (Frontend JavaScript)

In your [Mystery Bento Contest](https://github.com/sstarcher/Mystery-Bento-Contest) React/Vite app, you can trigger the physical conveyor with standard `fetch()` requests whenever in-game events occur:

```typescript
// Example: Send commands from your React frontend to the ESP32
const ESP32_IP = "http://192.168.4.1"; // Or your ESP32's local mDNS name

export async function startConveyor() {
  try {
    await fetch(`${ESP32_IP}/start`, { method: "POST" });
  } catch (err) {
    console.error("Conveyor offline:", err);
  }
}

export async function stopConveyor() {
  try {
    await fetch(`${ESP32_IP}/stop`, { method: "POST" });
  } catch (err) {
    console.error("Conveyor offline:", err);
  }
}

// Pause for 8 seconds when a player clicks a bento morsel, then resume
export async function pauseForPickup(seconds: number = 8) {
  await stopConveyor();
  setTimeout(() => {
    startConveyor();
  }, seconds * 1000);
}
```
