#include <WiFi.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
// #include "Free_Fonts.h"
#include "SPI.h"
#include "TFT_eSPI.h"

const char *ssid = "ESP32_AP";
const char *password = "123456789";
const int port = 80;

AsyncWebServer server(port);
TFT_eSPI tft = TFT_eSPI();

String controlStates = "000000"; // W, S, E, F, A, D

void initAP()
{
    WiFi.softAP(ssid, password);
    Serial.println("Access Point started at: " + WiFi.softAPIP().toString());
}

String getContentType(const String &path)
{
    if (path.endsWith(".html"))
        return "text/html";
    if (path.endsWith(".css"))
        return "text/css";
    if (path.endsWith(".js"))
        return "application/javascript";
    if (path.endsWith(".json"))
        return "application/json";
    if (path.endsWith(".svg"))
        return "image/svg+xml";
    return "text/plain";
}

bool validControlStates(const String &states)
{
    if (states.length() != 6)
        return false;

    for (char c : states)
    {
        if (c != '0' && c != '1')
            return false;
    }
    return true;
}

void sendResponse(AsyncWebServerRequest *request, const String &contentType, const String &content)
{
    AsyncWebServerResponse *response = request->beginResponse(200, contentType, content);
    response->addHeader("Access-Control-Allow-Origin", "*");
    request->send(response);
}

void handleRequest(AsyncWebServerRequest *request)
{
    String requestPath = request->url();
    String filePath;
    Serial.println("Request: " + requestPath);

    if (requestPath == "/")
        filePath = "/static/html/index.html";
    else
        filePath = "/static" + requestPath;

    if (LittleFS.exists(filePath))
    {
        File file = LittleFS.open(filePath, "r");
        String contentType = getContentType(filePath);
        String content = file.readString();
        file.close();
        sendResponse(request, contentType, content);
        return;
    }
    else
    {
        sendResponse(request, "text/plain", "404 Not Found");
        return;
    }
}

void setup(void)
{
    Serial.begin(115200);
    delay(1000);

    if (!LittleFS.begin())
    {
        Serial.println("LittleFS Mount Failed");
        return;
    }
    Serial.println("LittleFS Mounted");

    tft.begin();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);

    initAP();

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request)
              {
        File file = LittleFS.open("/static/html/index.html", "r");
        request->send(file, "index.html", "text/html"); });

    server.on("/control", HTTP_GET, [](AsyncWebServerRequest *request)
              {
        String states = request->url().substring(String("/control/").length());
        if (validControlStates(states))
        {
            tft.setTextFont(6); // FF18
            tft.drawString(states, 160, 120);

            controlStates = states;
            sendResponse(request, "text/plain", "200 OK");
        } else {
            sendResponse(request, "text/plain", "400 Bad Request");
        } });

    server.onNotFound(handleRequest);
    server.begin();
}

void loop()
{
}
