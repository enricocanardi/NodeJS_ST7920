'use strict';

var EventEmitter = require('events').EventEmitter,
	Gpio = require('onoff').Gpio,
	util = require('util'),
	Q = require('q'),
	getPixels = require("get-pixels");
var __RW = {
	WRITE: 0,
	READ:1
};
var __RS = {
	INSTRUCTIONS: 0,
	DATA:1
};
var __IBASIC = {
	DISPLAY_CLEAR: 0x01,	
	RETURN_HOME: 0x02,
	ENTRY_MODE: 0x04,
	DISPLAY_CONTROL: 0x08,
	CD_SHIFT_CONTROL: 0x10,
	FUNCTION_SET: 0x20,
	CGRAM_ADDRESS: 0x40,
	DDRAM_ADDRESS: 0x80
};

var __IEXT = {
	STANDBY: 0x01,	
	VERT_SCROLL: 0x02,
	REVERSE: 0x04,
	SCROLL_ADDRESS: 0x40,
	GDRAM_ADDRESS: 0x80
};

var __OPTIONS = {
	DIR_RIGHT: 0x02,
	BLINK_ON: 0x01,
	CURSOR_ON: 0x02,
	DISPLAY_ON: 0x04,
	MOVE_CUR_LEFT: 0x00,
	MOVE_CUR_RIGHT: 0x04,
	MOVE_DISPLAY_LEFT: 0x08,
	MOVE_DISPLAY_RIGHT: 0x0C,
	MODE_8BIT: 0x10,
	MODE_4BIT: 0x00,
	EXTENDED_INSTRUCTIONS: 0x04,
	BASIC_INSTRUCTIONS: 0x00,
	VSCROLL: 0x01,
	CGRAM: 0x00,
	REVERSE_ROW1: 0x00,
	REVERSE_ROW2: 0x01,
	REVERSE_ROW3: 0x02,
	REVERSE_ROW4: 0x03,
	GFX_ON: 0x02,
	GFX_OFF: 0x00
};

var __TEXT_ROWS = [
	0x00, // first row
	0x10, // second row
	0x08, // third row
	0x18 // forth row
];

function ST7920(config) {
	var i;
	console.log("starting LCD");

	if (!(this instanceof ST7920)) {
		return new ST7920(config);
	}

	EventEmitter.call(this);
	this.on('init', function () {
		this.emit('ready');
	});
	this._init(config);
}
util.inherits(ST7920, EventEmitter);
module.exports = ST7920;

ST7920.prototype.initText = function() {
	console.log("\t- initText");
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.FUNCTION_SET | __OPTIONS.MODE_8BIT);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.FUNCTION_SET | __OPTIONS.MODE_8BIT);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.DISPLAY_CONTROL | __OPTIONS.DISPLAY_ON);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.DISPLAY_CLEAR);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.ENTRY_MODE | __OPTIONS.DIR_RIGHT);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.RETURN_HOME);
	this.emit('initText');
	console.log("\t- initText done");
}

ST7920.prototype.initGFX = function() {
	console.log("\t- initGFX");
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.FUNCTION_SET | __OPTIONS.MODE_8BIT | __OPTIONS.GFX_ON);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.FUNCTION_SET | __OPTIONS.MODE_8BIT | __OPTIONS.EXTENDED_INSTRUCTIONS | __OPTIONS.GFX_ON);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.FUNCTION_SET | __OPTIONS.MODE_8BIT | __OPTIONS.EXTENDED_INSTRUCTIONS | __OPTIONS.GFX_ON);
	this._sendByte( __RS.INSTRUCTIONS, __RW.WRITE, __IEXT.VERT_SCROLL);
	this.emit('initGFX');
	console.log("\t- initGFX done");
}

ST7920.prototype.clearGFX = function(pattern) {
	console.log("\t- clearGfx");
	for (var vertikal = 0; vertikal < 64; vertikal++) {
		this._sendByte2( __RS.INSTRUCTIONS, __RW.WRITE, 0x80 + Math.round(vertikal % 32), 0x80 + Math.floor(vertikal / 32) * 8)  // Setting the address of the display to top macro rows
		for (var horizontal = 0; horizontal < 16; horizontal++) {
			this._sendByte( __RS.DATA, __RW.WRITE, pattern)     // after a two byte fills the entire screen with the same code
		}
	}
	console.log("\t- clearGfx done");
	this.emit('clearGfx');
}

ST7920.prototype.printText = function(x, y, text) {
	console.log("\t- Printing Text '" + text + "'@" + x + "," + y);
	this._sendByte(__RS.INSTRUCTIONS, __RW.WRITE, __IBASIC.DDRAM_ADDRESS | __TEXT_ROWS[y] + x);
	for(var i=0; i < text.length; i++) {
		this._sendByte( __RS.DATA, __RW.WRITE, text.charCodeAt(i));
	}
	return this.emit('printed', text);
}

ST7920.prototype.loadBMP = function(fileName) {
	var _this = this;
	getPixels(fileName, function(err, pixels) {
		if(err) {
			console.log("Bad image path");
			return
		}
//		console.log("got pixels ", pixels.shape, pixels.data);
		var image = pixels.data;
		var width = pixels.shape[1];
		var height = pixels.shape[2];
		var bits = pixels.shape[3];
		var xBuff = 0;
		var xCounter = 0;
		var bit = 0;
		var eRow = 0;
		var xDelta = 0;

		for (var y = 0; y < height; y++) {
			_this._sendByte2( __RS.INSTRUCTIONS, __RW.WRITE, 0x80 + Math.round(y % 32), 0x80 + Math.floor(y / 32) * 8);  // Setting the address of the display to top macro rows
			for (var x = 0; x < width; x++) {
				bit = Math.round(image[(y * width + x) * bits] / 255);
				//console.log(bit);
				xBuff += (bit * Math.pow(2,7-xCounter));
				xCounter++;
				if (xCounter == 8) {
					_this._sendByte( __RS.DATA, __RW.WRITE, xBuff);     // after a two byte fills the entire screen with the same code
					xBuff = 0;
					xCounter = 0;
				}
			}
		}
	});
}

// private
ST7920.prototype._init = function (config) {
	console.log("\t- Init");
	Q.delay(16)                                               // wait > 15ms
	.then(
		function () {
			this.sclk = new Gpio(config.sclk, 'low'); // slck, output, initially low
			this.sid = new Gpio(config.sid, 'low'); // sid, output, initially low
			this.rst = new Gpio(config.rst, 'low'); // reset, output, initially low
		}.bind(this)
	) // 1st wake up
	.delay(100).then(
		function () {
			this.rst = new Gpio(config.rst, 'high'); // rise reset
		}.bind(this)
	)
	.delay(10).then(
		function () {
			console.log("\t- Init done");
			this.emit('init');
		}.bind(this)
	);
};

ST7920.prototype._dec2bin = function (dec) {
	var bin = (dec >>> 0).toString(2);
	while (bin.length < 8) {
		bin = "0" + bin;
	}
	return bin;
}

ST7920.prototype._strobe = function () {
	this.sclk.writeSync(1);
	this.sclk.writeSync(0);
}

ST7920.prototype._sendBit = function(value, clocks) {
	this.sid.writeSync(value); 
	for (var i = 0; i < clocks; i++) {
		//process.stdout.write(value + "");
		this._strobe();
	}
}

ST7920.prototype._synk = function (rs, rw) {
	this._sendBit(1, 5);				// Comm syncronization
	this._sendBit(rw, 1);			// Then he went two-RW (on writing is set to "0")
	this._sendBit(rs, 1);			// pak se posle RS bit (prikazy = "0" ; data = "1")            
	this._sendBit(0, 1);				// nasleduje nulovy bit                                                        
}

ST7920.prototype._subSendByte = function (byte) {
	for (var i = 7; i > 3; i--) {
		var bit = (byte & (Math.pow(2,i))) >> i;
		this._sendBit(bit, 1);
	}

	this._sendBit(0, 4);				// potom se odesle oddelovaci sekvence 4x "0"

	for (var i = 3; i > -1; i--) {
		var bit = (byte & (Math.pow(2,i))) >> i;
		this._sendBit(bit, 1);
	}

	this._sendBit(0, 4);				// na zaver opet oddelovaci sekvence 4x "0"
}

ST7920.prototype._sendByte = function (rs, rw, byte) {
//	console.log("\t\t sending " + this._dec2bin(byte) + " (" + byte.toString(16).toUpperCase() + ")");
//	process.stdout.write("\t\t\t");
	this._synk(rs, rw);
	this._subSendByte(byte);
//	console.log();
}

ST7920.prototype._sendByte2 = function (rs, rw, byte1, byte2) {
//	console.log("\t\t sending2 " + this._dec2bin(byte1) + " (" + byte1.toString(16).toUpperCase() + "), " + this._dec2bin(byte2) + " (" + byte2.toString(16).toUpperCase() + ")");
//	process.stdout.write("\t\t\t");
	this._synk(rs, rw);
	this._subSendByte(byte1);
	this._subSendByte(byte2);
//	console.log();
}

