/*
 * osocios.club — ESP32 Staff Notification Light
 *
 * Lights up an LED when club members have pending requests
 * (quest verifications, service orders).
 *
 * First boot: Creates WiFi AP "osocios-light-XXXX" with captive portal
 * to configure WiFi credentials and club notification URL.
 *
 * Normal mode: Polls the notification API every 5 seconds.
 * LED on = pending requests, LED off = all clear.
 *
 * Hardware:
 *   ESP32 GPIO2 -> 1kΩ resistor -> NPN base
 *   3.3V -> LED anode -> 220Ω resistor -> NPN collector
 *   NPN emitter -> GND
 *
 * Hold BOOT button for 5 seconds to reset config and enter AP mode.
 *
 * Libraries needed (install via Arduino Library Manager):
 *   - ArduinoJson by Benoit Blanchon
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// --- Pin config ---
#define LED_PIN 2
#define BOOT_PIN 0  // BOOT button on most ESP32 boards

// --- Timing ---
#define POLL_INTERVAL_MS 5000
#define RESET_HOLD_MS 5000
#define BLINK_FAST_MS 150
#define BLINK_SLOW_MS 2000

// --- State ---
Preferences prefs;
WebServer server(80);

String wifiSSID;
String wifiPassword;
String notifyUrl;

bool configured = false;
bool lastLightState = false;
unsigned long lastPoll = 0;
unsigned long bootBtnDown = 0;

// ============================================================
// Captive Portal HTML
// ============================================================

const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>osocios light setup</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #111; color: #fff;
           display: flex; justify-content: center; padding: 40px 20px; margin: 0; }
    .card { background: #1a1a1a; border-radius: 16px; padding: 32px; max-width: 400px; width: 100%; }
    h1 { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
    p { font-size: 13px; color: #888; margin: 0 0 24px; }
    label { display: block; font-size: 12px; color: #888; margin-bottom: 4px; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 8px;
            border: 1px solid #333; background: #222; color: #fff; font-size: 14px;
            margin-bottom: 16px; outline: none; }
    input:focus { border-color: #16a34a; }
    button { width: 100%; padding: 12px; border: none; border-radius: 8px;
             background: #16a34a; color: #fff; font-size: 14px; font-weight: 600;
             cursor: pointer; }
    button:hover { background: #15803d; }
    .ok { text-align: center; color: #16a34a; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>osocios notification light</h1>
    <p>Connect this device to your club's WiFi network.</p>
    <form method="POST" action="/save">
      <label>WiFi Network Name</label>
      <input name="ssid" required placeholder="Your WiFi SSID">
      <label>WiFi Password</label>
      <input name="pass" type="password" required placeholder="WiFi password">
      <label>Notification URL</label>
      <input name="url" required placeholder="https://osocios.club/api/notify/...">
      <button type="submit">Save & Connect</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

const char SAVED_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Saved</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: #111; color: #fff;
           display: flex; justify-content: center; align-items: center;
           min-height: 100vh; margin: 0; }
    .ok { text-align: center; }
    h1 { color: #16a34a; font-size: 20px; }
    p { color: #888; font-size: 14px; }
  </style>
</head>
<body>
  <div class="ok">
    <h1>Saved!</h1>
    <p>Device is restarting and connecting to WiFi...</p>
  </div>
</body>
</html>
)rawliteral";

// ============================================================
// Config management
// ============================================================

void loadConfig() {
  prefs.begin("osocios", true);
  wifiSSID = prefs.getString("ssid", "");
  wifiPassword = prefs.getString("pass", "");
  notifyUrl = prefs.getString("url", "");
  prefs.end();
  configured = wifiSSID.length() > 0 && notifyUrl.length() > 0;
}

void saveConfig(String ssid, String pass, String url) {
  prefs.begin("osocios", false);
  prefs.putString("ssid", ssid);
  prefs.putString("pass", pass);
  prefs.putString("url", url);
  prefs.end();
}

void clearConfig() {
  prefs.begin("osocios", false);
  prefs.clear();
  prefs.end();
}

// ============================================================
// AP mode (captive portal)
// ============================================================

void startAPMode() {
  // Generate AP name with last 4 of MAC
  uint8_t mac[6];
  WiFi.macAddress(mac);
  char apName[24];
  snprintf(apName, sizeof(apName), "osocios-light-%02X%02X", mac[4], mac[5]);

  WiFi.mode(WIFI_AP);
  WiFi.softAP(apName);

  Serial.printf("AP started: %s\n", apName);
  Serial.printf("Portal at: http://192.168.4.1\n");

  server.on("/", HTTP_GET, []() {
    server.send(200, "text/html", FPSTR(PORTAL_HTML));
  });

  // Captive portal redirect for any other path
  server.onNotFound([]() {
    server.sendHeader("Location", "http://192.168.4.1/");
    server.send(302, "text/plain", "");
  });

  server.on("/save", HTTP_POST, []() {
    String ssid = server.arg("ssid");
    String pass = server.arg("pass");
    String url = server.arg("url");

    if (ssid.length() > 0 && url.length() > 0) {
      saveConfig(ssid, pass, url);
      server.send(200, "text/html", FPSTR(SAVED_HTML));
      delay(2000);
      ESP.restart();
    } else {
      server.sendHeader("Location", "/");
      server.send(302, "text/plain", "");
    }
  });

  server.begin();

  // Blink LED rapidly to indicate AP mode
  while (true) {
    server.handleClient();
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    delay(300);
  }
}

// ============================================================
// Normal mode (poll & light)
// ============================================================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  Serial.printf("Connecting to %s", wifiSSID.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
    // Slow blink while connecting
    digitalWrite(LED_PIN, attempts % 2);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\nConnected! IP: %s\n", WiFi.localIP().toString().c_str());
    digitalWrite(LED_PIN, LOW);
  } else {
    Serial.println("\nFailed to connect. Starting AP mode...");
    startAPMode();
  }
}

void pollNotifyAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    // Slow blink for WiFi disconnect
    static unsigned long lastBlink = 0;
    if (millis() - lastBlink > BLINK_SLOW_MS) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      lastBlink = millis();
    }
    // Try to reconnect
    WiFi.reconnect();
    return;
  }

  HTTPClient http;
  http.begin(notifyUrl);
  http.setTimeout(5000);

  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (!err) {
      bool light = doc["light"] | false;
      int pending = doc["pending"] | 0;

      Serial.printf("Pending: %d, Light: %s\n", pending, light ? "ON" : "OFF");

      // New notification — blink 3 times then stay on
      if (light && !lastLightState) {
        for (int i = 0; i < 3; i++) {
          digitalWrite(LED_PIN, HIGH);
          delay(BLINK_FAST_MS);
          digitalWrite(LED_PIN, LOW);
          delay(BLINK_FAST_MS);
        }
      }

      digitalWrite(LED_PIN, light ? HIGH : LOW);
      lastLightState = light;
    }
  } else {
    Serial.printf("HTTP error: %d\n", code);
    // Don't change LED state on error — keep last known state
  }

  http.end();
}

// ============================================================
// Reset button check
// ============================================================

void checkResetButton() {
  if (digitalRead(BOOT_PIN) == LOW) {
    if (bootBtnDown == 0) {
      bootBtnDown = millis();
    } else if (millis() - bootBtnDown > RESET_HOLD_MS) {
      Serial.println("Reset button held — clearing config...");
      clearConfig();
      // Fast blink to confirm reset
      for (int i = 0; i < 10; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(100);
        digitalWrite(LED_PIN, LOW);
        delay(100);
      }
      ESP.restart();
    }
  } else {
    bootBtnDown = 0;
  }
}

// ============================================================
// Arduino setup & loop
// ============================================================

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- osocios notification light ---");

  pinMode(LED_PIN, OUTPUT);
  pinMode(BOOT_PIN, INPUT_PULLUP);
  digitalWrite(LED_PIN, LOW);

  loadConfig();

  if (!configured) {
    Serial.println("No config found. Starting AP mode...");
    startAPMode();  // Never returns
  }

  Serial.printf("Config loaded. URL: %s\n", notifyUrl.c_str());
  connectWiFi();
}

void loop() {
  checkResetButton();

  if (millis() - lastPoll >= POLL_INTERVAL_MS) {
    pollNotifyAPI();
    lastPoll = millis();
  }
}
