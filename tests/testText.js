'use strict';

/**
 * Call asynchronous print twice in succession to print a total of 78
 * characters. The output from the two calls should be interlaced as print
 * is asynchronous.
 */
var ST7920 = require('../ST7920');
var lcd = new ST7920({sclk: 15, sid: 14, rst: 18});
lcd.on('ready', function () {
	lcd.on('initText',function() {
		console.log(1);
		lcd.printText(0, 0, "First Row");
		lcd.printText(1, 1, "Second Row");
		lcd.printText(2, 2, "Third Row");
		lcd.printText(3, 3, "Fourth Row");
	});
	lcd.initText();
});

