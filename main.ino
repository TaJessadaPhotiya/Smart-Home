#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "Guest-wynnsoft";
const char* password = "1@3456&*";
const char* server = "https://qrcodebackend.tagifood.com/device"; 

// กำหนดขารีเลย์
const int relay1 = 25;
const int relay2 = 26;
const int relay3 = 27;
const int relay4 = 28;
const int relay5 = 29;

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
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

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(server);
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<512> doc;
      deserializeJson(doc, payload);

      // อัปเดตรีเลย์ตามสถานะ
      digitalWrite(relay1, doc["light1"] == "on" ? HIGH : LOW);
      digitalWrite(relay2, doc["light2"] == "on" ? HIGH : LOW);
      digitalWrite(relay3, doc["light3"] == "on" ? HIGH : LOW);
      digitalWrite(relay4, doc["tv"] == "on" ? HIGH : LOW);
      digitalWrite(relay5, doc["air"] == "on" ? HIGH : LOW);

    } else {
      Serial.println("Error on HTTP request");
    }
    http.end();
  }
  delay(1000); // ดึงข้อมูลทุก 1 วินาที
}
