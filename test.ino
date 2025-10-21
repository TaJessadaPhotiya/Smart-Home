#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// --- WiFi Setup ---
#define AP_SSID "ESP32-Setup"
#define AP_PASSWORD "45120"
const unsigned long CONNECT_TIMEOUT = 15000; // 15 วินาที
WebServer web(80);
Preferences prefs;

// --- Relay Pins ---
const int relay1 = 25;
const int relay2 = 26;
const int relay3 = 27;
const int relay4 = 14; // เปลี่ยนเป็น GPIO ที่ใช้งานได้
const int relay5 = 12; // เปลี่ยนเป็น GPIO ที่ใช้งานได้

// --- Server URL ---
const char *serverURL = "https://qrcodebackend.tagifood.com/device";

// --- HTML Pages ---
const char PAGE_INDEX[] PROGMEM = R"rawliteral(
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>ESP32 WiFi Setup</title>
<style>
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);
    margin: 0; padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
.card {
    background: #fff;
    padding: 30px 25px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    max-width: 400px;
    width: 90%;
    text-align: center;
    animation: fadeIn 0.8s ease-in-out;
}
h2 {
    margin-bottom: 20px;
    color: #333;
}
input[type=text], input[type=password] {
    width: 100%;
    padding: 12px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-sizing: border-box;
    transition: 0.3s;
}
input[type=text]:focus, input[type=password]:focus {
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0,123,255,0.5);
    outline: none;
}
button {
    padding: 12px 20px;
    margin-top: 10px;
    border: none;
    border-radius: 8px;
    background: #007bff;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    width: 100%;
    transition: 0.3s;
}
button:hover {
    background: #0056b3;
}
.note {
    font-size: 13px;
    color: #666;
    margin-top: 15px;
    line-height: 1.4;
}
@keyframes fadeIn {
    from {opacity: 0; transform: translateY(-20px);}
    to {opacity: 1; transform: translateY(0);}
}
</style>
</head>
<body>
<div class="card">
<h2>ตั้งค่าการเชื่อมต่อ Wi-Fi</h2>
<form action="/save" method="POST">
<label>SSID</label>
<input type="text" name="ssid" id="ssid" placeholder="ชื่อ Wi-Fi (SSID)" required maxlength="64"/>
<label>Password</label>
<input type="password" name="pass" id="pass" placeholder="รหัสผ่าน (ถ้ามี)" maxlength="64"/>
<button type="submit">บันทึกและเชื่อมต่อ</button>
</form>
<div class="note">
หลังบันทึก บอร์ดจะพยายามเชื่อมต่อ Wi-Fi และรีบูตอัตโนมัติหากเชื่อมต่อสำเร็จ
</div>
</div>
</body>
</html>
)rawliteral";

const char PAGE_SAVING[] PROGMEM = R"rawliteral(
<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>กำลังบันทึก...</title>
<style>
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #74ebd5 0%, #ACB6E5 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}
.card {
    background: #fff;
    padding: 25px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    text-align: center;
    animation: fadeIn 0.8s ease-in-out;
}
p {
    font-size: 16px;
    color: #333;
}
@keyframes fadeIn {
    from {opacity: 0; transform: translateY(-20px);}
    to {opacity: 1; transform: translateY(0);}
}
</style>
</head>
<body>
<div class="card">
<p>กำลังบันทึกข้อมูลและพยายามเชื่อมต่อ...<br>กรุณารอสักครู่</p>
</div>
</body>
</html>
)rawliteral";

// --- Relay Setup ---
void setupRelay()
{
    pinMode(relay1, OUTPUT);
    pinMode(relay2, OUTPUT);
    pinMode(relay3, OUTPUT);
    pinMode(relay4, OUTPUT);
    pinMode(relay5, OUTPUT);

    digitalWrite(relay1, LOW);
    digitalWrite(relay2, LOW);
    digitalWrite(relay3, LOW);
    digitalWrite(relay4, LOW);
    digitalWrite(relay5, LOW);
}

// --- Web Handlers ---
void handleRoot() { web.send(200, "text/html", PAGE_INDEX); }

void handleSave()
{
    if (web.method() != HTTP_POST)
    {
        web.send(405, "text/plain", "Method Not Allowed");
        return;
    }

    String ssid = web.arg("ssid");
    ssid.trim();
    String pass = web.arg("pass");
    pass.trim();
    if (ssid.length() == 0)
    {
        web.send(400, "text/plain", "SSID missing");
        return;
    }

    web.send(200, "text/html", PAGE_SAVING);

    // บันทึก Preferences
    prefs.begin("wifi", false);
    prefs.putString("ssid", ssid);
    prefs.putString("pass", pass);
    prefs.end();
    Serial.printf("Saved SSID: %s\n", ssid.c_str());

    // พยายามเชื่อมต่อใหม่
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(100);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long start = millis();
    while (millis() - start < CONNECT_TIMEOUT)
    {
        if (WiFi.status() == WL_CONNECTED)
        {
            Serial.println("Connected to new WiFi!");
            delay(2000);
            ESP.restart();
            return;
        }
        delay(200);
    }
    Serial.println("Failed to connect with provided credentials.");
}

void handleNotFound() { web.send(404, "text/plain", "Not Found"); }

void startAPMode()
{
    Serial.println("Start AP mode...");
    WiFi.mode(WIFI_AP);
    if (strlen(AP_PASSWORD) >= 8)
        WiFi.softAP(AP_SSID, AP_PASSWORD);
    else
        WiFi.softAP(AP_SSID);
    Serial.print("AP IP: ");
    Serial.println(WiFi.softAPIP());
    web.on("/", HTTP_GET, handleRoot);
    web.on("/save", HTTP_POST, handleSave);
    web.onNotFound(handleNotFound);
    web.begin();
    Serial.println("WebServer started at 192.168.4.1");
}

bool tryConnectFromPrefs()
{
    prefs.begin("wifi", true);
    String ssid = prefs.getString("ssid", "");
    String pass = prefs.getString("pass", "");
    prefs.end();

    if (ssid.length() == 0)
    {
        Serial.println("No stored SSID found.");
        return false;
    }

    Serial.print("Trying stored WiFi: ");
    Serial.println(ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());

    unsigned long start = millis();
    while (millis() - start < CONNECT_TIMEOUT)
    {
        if (WiFi.status() == WL_CONNECTED)
        {
            Serial.print("Connected! IP: ");
            Serial.println(WiFi.localIP());
            return true;
        }
        delay(200);
    }
    Serial.println("Stored credentials failed to connect.");
    return false;
}

// --- Setup / Loop ---
void setup()
{
    Serial.begin(115200);
    delay(100);
    setupRelay();

    bool connected = tryConnectFromPrefs();
    if (!connected)
        startAPMode();
    else
        Serial.println("Proceed with normal operation (start relay control)");
}

unsigned long lastHttp = 0;
const unsigned long HTTP_INTERVAL = 1000; // 1 วินาที

void loop()
{
    web.handleClient();

    if (WiFi.status() == WL_CONNECTED && millis() - lastHttp >= HTTP_INTERVAL)
    {
        lastHttp = millis();

        HTTPClient http;
        http.begin(serverURL);
        int httpCode = http.GET();
        if (httpCode == 200)
        {
            String payload = http.getString();
            StaticJsonDocument<512> doc;
            DeserializationError err = deserializeJson(doc, payload);
            if (!err)
            {
                digitalWrite(relay1, doc["light1"] == "on" ? HIGH : LOW);
                digitalWrite(relay2, doc["light2"] == "on" ? HIGH : LOW);
                digitalWrite(relay3, doc["light3"] == "on" ? HIGH : LOW);
                digitalWrite(relay4, doc["tv"] == "on" ? HIGH : LOW);
                digitalWrite(relay5, doc["air"] == "on" ? HIGH : LOW);
            }
            else
            {
                Serial.println("JSON parse error");
            }
        }
        else
        {
            Serial.printf("HTTP request failed, code: %d\n", httpCode);
        }
        http.end();
    }
}
