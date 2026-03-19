/*
 * osocios.club — ESP32-C3 Super Mini Staff Notification Buzzer
 *
 * Board: "ESP32C3 Dev Module"
 * USB CDC On Boot: Enabled
 *
 * Buzzer on pin 3: pin "3" → Buzzer (+), GND → Buzzer (-)
 *
 * First boot: Creates WiFi "ClubNotify" (password: club1234)
 * Connect and open http://192.168.4.1 to configure.
 *
 * Normal mode: Polls notification API every 5 seconds.
 * Buzzes when members have pending requests.
 *
 * Libraries needed: ArduinoJson (install via Library Manager)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>

#define BUZZER_PIN 3

WebServer server(80);
Preferences prefs;

String wifiSSID;
String wifiPassword;
String notifyUrl;
bool configured = false;
bool lastLightState = false;
unsigned long lastPoll = 0;

// ============================================================
// Buzzer helpers
// ============================================================

void beep(int ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepPattern(int count, int onMs, int offMs) {
  for (int i = 0; i < count; i++) {
    beep(onMs);
    if (i < count - 1) delay(offMs);
  }
}

// ============================================================
// Setup form HTML
// ============================================================

const char FORM_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Setup</title>
  <style>
    body{font-family:sans-serif;background:#111;color:#fff;padding:40px 20px;margin:0;display:flex;justify-content:center}
    .c{background:#1a1a1a;border-radius:16px;padding:32px;max-width:400px;width:100%}
    h1{font-size:18px;margin:0 0 20px}
    label{display:block;font-size:12px;color:#888;margin-bottom:4px}
    input{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #333;background:#222;color:#fff;font-size:14px;margin-bottom:16px}
    button{width:100%;padding:12px;border:none;border-radius:8px;background:#16a34a;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
  </style>
</head>
<body>
  <div class="c">
    <h1>osocios notification setup</h1>
    <form method="POST" action="/save">
      <label>WiFi Name</label>
      <input name="ssid" required>
      <label>WiFi Password</label>
      <input name="pass" type="password">
      <label>Notification URL</label>
      <input name="url" required placeholder="https://osocios.club/api/notify/...">
      <button type="submit">Save & Connect</button>
    </form>
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

void clearConfig() {
  prefs.begin("osocios", false);
  prefs.clear();
  prefs.end();
}

// ============================================================
// AP mode
// ============================================================

void startAPMode() {
  Serial.println("[1] Disconnecting any previous WiFi...");
  WiFi.disconnect(true);
  delay(500);

  Serial.println("[2] Setting mode to WIFI_AP...");
  WiFi.mode(WIFI_AP);
  delay(500);

  Serial.println("[3] Creating access point...");
  WiFi.softAPsetHostname("clubsetup");
  bool ok = WiFi.softAP("ClubNotify", "club1234", 6);
  Serial.printf("[3] Name: ClubNotify\n");
  Serial.printf("[3] Password: club1234\n");
  Serial.printf("[3] Result: %s\n", ok ? "SUCCESS" : "FAILED");
  delay(1000);

  Serial.printf("[4] AP IP: %s\n", WiFi.softAPIP().toString().c_str());
  Serial.println();
  Serial.println(">>> Connect to 'ClubNotify' WiFi (password: club1234) <<<");
  Serial.println(">>> Then open http://192.168.4.1 in browser            <<<");
  Serial.println();

  // Beep twice to indicate AP mode
  beepPattern(2, 100, 200);

  // Captive portal detection — redirect phones to setup page automatically
  server.on("/generate_204", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });       // Android
  server.on("/gen_204", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });             // Android alt
  server.on("/hotspot-detect.html", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); }); // Apple
  server.on("/connecttest.txt", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });     // Windows
  server.on("/success.txt", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });         // Firefox
  server.on("/canonical.html", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });      // Android alt
  server.on("/redirect", HTTP_GET, []() { server.send(200, "text/html", FPSTR(FORM_HTML)); });            // Generic

  server.on("/", HTTP_GET, []() {
    Serial.println("[Web] Setup page opened");
    server.send(200, "text/html", FPSTR(FORM_HTML));
  });

  server.on("/save", HTTP_POST, []() {
    String s = server.arg("ssid");
    String p = server.arg("pass");
    String u = server.arg("url");
    Serial.printf("[Web] Saving: ssid='%s' url='%s'\n", s.c_str(), u.c_str());

    prefs.begin("osocios", false);
    prefs.putString("ssid", s);
    prefs.putString("pass", p);
    prefs.putString("url", u);
    prefs.end();

    server.send(200, "text/html", "<html><body style='background:#111;color:#16a34a;font-family:sans-serif;text-align:center;padding:60px'><h1>Saved!</h1><p style='color:#888'>Restarting...</p></body></html>");
    beepPattern(3, 50, 50);
    delay(2000);
    ESP.restart();
  });

  server.onNotFound([]() {
    Serial.printf("[Web] Unknown path: %s → serving form\n", server.uri().c_str());
    server.send(200, "text/html", FPSTR(FORM_HTML));
  });

  server.begin();
  Serial.println("[AP] Web server started. Waiting...\n");

  int lastClients = -1;
  unsigned long lastStatus = 0;
  while (true) {
    server.handleClient();

    int clients = WiFi.softAPgetStationNum();
    if (clients != lastClients) {
      Serial.printf("[AP] Clients: %d\n", clients);
      lastClients = clients;
    }

    if (millis() - lastStatus > 10000) {
      Serial.printf("[Status] AP running | Clients: %d | Uptime: %lus\n", clients, millis() / 1000);
      lastStatus = millis();
    }

    delay(5);
  }
}

// ============================================================
// Normal mode — connect WiFi and poll API
// ============================================================

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  Serial.printf("[WiFi] Connecting to '%s'", wifiSSID.c_str());

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    beep(500);  // Long beep = connected
  } else {
    Serial.println("\n[WiFi] Failed after 20 seconds!");
    Serial.println("[WiFi] Check WiFi name and password.");
    Serial.println("[WiFi] Clearing config and restarting in AP mode...");
    beepPattern(5, 100, 100);  // Rapid beeps = failed
    clearConfig();
    delay(2000);
    ESP.restart();
  }
}

void pollNotifyAPI() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Poll] WiFi disconnected, reconnecting...");
    WiFi.reconnect();
    return;
  }

  Serial.printf("[Poll] GET %s\n", notifyUrl.c_str());

  HTTPClient http;
  http.begin(notifyUrl);
  http.setTimeout(5000);
  http.addHeader("x-vercel-protection-bypass", "DAZwmcKzj34mmJUWOTEYVFDpHGAU94NO");

  int code = http.GET();

  if (code == 200) {
    String payload = http.getString();
    Serial.printf("[Poll] Response: %s\n", payload.c_str());

    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, payload);

    if (!err) {
      bool light = doc["light"] | false;
      int pending = doc["pending"] | 0;

      Serial.printf("[Poll] Pending: %d → Buzzer: %s\n", pending, light ? "ON" : "OFF");

      // New notification — alert beeps
      if (light && !lastLightState) {
        Serial.println("[Buzz] NEW pending items!");
        beepPattern(3, 100, 200);
        delay(300);
        beep(500);
      }

      // Ongoing reminder — short beep
      if (light && lastLightState) {
        Serial.println("[Buzz] Still pending, reminder");
        beep(100);
      }

      if (!light && lastLightState) {
        Serial.println("[Buzz] All clear!");
      }

      lastLightState = light;
    } else {
      Serial.printf("[Poll] JSON error: %s\n", err.c_str());
    }
  } else {
    Serial.printf("[Poll] HTTP error: %d\n", code);
  }

  http.end();
}

// ============================================================
// Setup & Loop
// ============================================================

void setup() {
  Serial.begin(115200);
  delay(3000);

  Serial.println("\n==========================================");
  Serial.println("  osocios.club — Notification Buzzer");
  Serial.println("  Board: ESP32-C3 Super Mini");
  Serial.printf("  Buzzer: GPIO%d (pin 3)\n", BUZZER_PIN);
  Serial.println("==========================================\n");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  // Startup beep
  Serial.println("[Boot] Startup beep...");
  beep(100);
  delay(500);

  loadConfig();
  Serial.printf("[Boot] Saved SSID: '%s'\n", wifiSSID.c_str());
  Serial.printf("[Boot] Saved URL:  '%s'\n", notifyUrl.c_str());
  Serial.printf("[Boot] Configured: %s\n", configured ? "YES" : "NO");

  if (!configured) {
    Serial.println("[Boot] No config. Starting AP...\n");
    startAPMode();  // Never returns
  }

  Serial.println("[Boot] Config found. Connecting to WiFi...\n");
  connectWiFi();

  Serial.println("\n[Ready] Polling every 5 seconds...\n");
}

void loop() {
  if (millis() - lastPoll >= 5000) {
    pollNotifyAPI();
    lastPoll = millis();
  }
}
