/*
 * ESP32-C3 Super Mini — LED Test
 *
 * This board does NOT have a controllable LED on GPIO2.
 * The red LED is just a power indicator — always on when plugged in.
 *
 * We'll test GPIO8 (built-in LED on some C3 boards)
 * and GPIO3 (a safe general-purpose pin) so you can
 * connect an external LED.
 *
 * WIRING for external LED (no transistor needed for testing):
 *   Pin labeled "3" on the board → 220Ω resistor → LED long leg (+)
 *   LED short leg (-) → pin labeled "GND"
 *
 * Open Serial Monitor at 115200 baud to see debug output.
 * Tools → Serial Monitor → set baud to 115200
 *
 * IMPORTANT: In Arduino IDE, select board:
 *   "ESP32C3 Dev Module" (NOT "ESP32-WROOM-DA Module")
 */

#define LED_PIN 3     // GPIO3 — external LED pin
#define ONBOARD_LED 8 // GPIO8 — built-in LED on some C3 boards

int cycle = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);  // Extra time for C3 USB serial to initialize

  Serial.println();
  Serial.println("==========================================");
  Serial.println("  ESP32-C3 Super Mini — LED TEST");
  Serial.println("==========================================");
  Serial.println();
  Serial.printf("  Chip model:    %s\n", ESP.getChipModel());
  Serial.printf("  CPU frequency: %d MHz\n", ESP.getCpuFreqMHz());
  Serial.printf("  Testing pins:  GPIO%d (external) + GPIO%d (onboard)\n", LED_PIN, ONBOARD_LED);
  Serial.println();

  pinMode(LED_PIN, OUTPUT);
  pinMode(ONBOARD_LED, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(ONBOARD_LED, LOW);

  Serial.println("[OK] Pins configured");
  Serial.println();
  Serial.println("Both pins will blink together.");
  Serial.println("Connect external LED: pin 3 → 220ohm → LED(+) → LED(-) → GND");
  Serial.println();
}

void loop() {
  cycle++;

  Serial.printf("[Cycle %d] ON\n", cycle);
  digitalWrite(LED_PIN, HIGH);
  digitalWrite(ONBOARD_LED, HIGH);
  delay(2000);

  Serial.printf("[Cycle %d] OFF\n", cycle);
  digitalWrite(LED_PIN, LOW);
  digitalWrite(ONBOARD_LED, LOW);
  delay(1000);
}
