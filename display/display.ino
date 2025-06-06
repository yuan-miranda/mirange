#include "Free_Fonts.h"
#include "SPI.h"
#include "TFT_eSPI.h"

TFT_eSPI tft = TFT_eSPI();
String text = "";
String prevText = "";

void setup(void)
{
    tft.begin();
    tft.setRotation(1);
    tft.fillScreen(TFT_BLACK);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(TFT_WHITE, TFT_BLACK);

    Serial.begin(115200);
    Serial2.begin(115200, SERIAL_8N1, 16, 17);
}

void loop()
{
    if (Serial2.available())
    {
        text = Serial2.readStringUntil('\n');
        if (text != prevText)
        {
            prevText = text;
            tft.setFreeFont(FF18);
            tft.drawString(text, 160, 120, GFXFF);
        }
    }
}

#ifndef LOAD_GLCD
// ERROR_Please_enable_LOAD_GLCD_in_User_Setup
#endif

#ifndef LOAD_GFXFF
ERROR_Please_enable_LOAD_GFXFF_in_User_Setup !
#endif
