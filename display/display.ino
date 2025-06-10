#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
// #include "Free_Fonts.h"
#include "SPI.h"
#include "TFT_eSPI.h"

const char *ssid = "ESP32_AP";
const char *password = "123456789";
const int port = 80;

AsyncWebServer server(port);
AsyncWebSocket ws("/ws");
TFT_eSPI tft = TFT_eSPI();

String controlStates = "000000"; // W, S, E, F, A, D

struct PlayerSlot
{
    String slot;
    String name;
};

PlayerSlot playerSlots[2] = {
    {"one", ""},
    {"two", ""}};

void setPlayerSlot(const char *slot, const char *name)
{
    for (int i = 0; i < 2; ++i)
    {
        if (playerSlots[i].slot == slot)
        {
            playerSlots[i].name = name;
            break;
        }
    }
}

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

void onWebSocketEvent(AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len)
{
    if (type == WS_EVT_CONNECT)
    {
        Serial.printf("WebSocket client connected: %u\n", client->id());

        StaticJsonDocument<256> doc;
        doc["type"] = "wsLoadPlayerSlots";
        JsonObject slots = doc.createNestedObject("slots");

        for (const PlayerSlot &slot : playerSlots)
            slots[slot.slot] = slot.name;

        // send to the newly connected client all player slots
        String response;
        serializeJson(doc, response);
        client->text(response);
    }
    else if (type == WS_EVT_DISCONNECT)
        Serial.printf("WebSocket client disconnected: %u\n", client->id());

    else if (type == WS_EVT_DATA)
    {
        data[len] = 0;
        Serial.println("WS_Received: " + String((char *)data));

        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data);
        if (error)
        {
            Serial.println(error.c_str());
            return;
        }

        // update player slot on all connected clients
        const char *type = doc["type"];
        if (strcmp(type, "setPlayerSlot") == 0)
        {
            const char *slot = doc["slot"];
            const char *name = doc["name"];

            setPlayerSlot(slot, name);

            StaticJsonDocument<256> responseDoc;
            responseDoc["type"] = "wsUpdatePlayerSlot";
            responseDoc["slot"] = slot;
            responseDoc["name"] = name;

            String response;
            serializeJson(responseDoc, response);
            server->textAll(response);
        }
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

    ws.onEvent(onWebSocketEvent);
    server.addHandler(&ws);
}

void loop()
{
}
