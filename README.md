# NodeJS_ST7920
A NodeJS library for ST7920 based 128x64 display

# Features
* Support serial communication
* print text
* display images (GIF)

# Based on
Astronomik [ST7920](http://www.astromik.org/raspi/42.htm)

# External resources
* Digole 12864ZW [datasheet](http://www.digole.com/images/file/Digole_12864_LCD.pdf)
* [wiki](https://github.com/enricocanardi/NodeJS_ST7920/wiki)

# Hardware setup
### Basic setup for Raspberry PI 2
| Controller side | LCD side     |
|-----------------|--------------|
| Pin 4  (5v)     | Pin 2  (VDD) |
| Pin 4  (5v)     | Pin 4  (RS)  |
| Pin 4  (5v)     | Pin 19 (BLA) |
| Pin 6  (GND)    | Pin 1  (VSS) |
| Pin 6  (GND)    | Pin 15 (PSB) |
| Pin 6  (GND)    | Pin 20 (BLK) |
| Pin 8  (GPIO14) | Pin 5  (R/W) |
| Pin 10 (GPIO15) | Pin 6  (E)   |
| Pin 12 (GPIO18) | Pin 17 (RST) |

# Hardware
### Controllers
* Raspberry PI 2

### LCD
* Digole 12864ZW

# Installation

```sh
npm install st7920
```
