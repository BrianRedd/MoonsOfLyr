$(document).ready(function() {
/*--------------------------------------------------------

* Filename: Sky.js
* Description: JS for Moons of Lyr

* Author: R. Brian Redd 2013-02-03
* Version 1.1
         
--------------------------------------------------------*/
	
	/*Set up variables*/
	var StartYear = 1847;
	var StartDay = 264;
	var StartHour = 0; //absolute time;
	var StartLat = 30;
	var StartLong = 90;
	var axialtilt = 25;
	
	/*Celestial Variables*/
	var DaysPerYear = 352;
	var HoursPerDay = 20;
	var MoonData = [
		//name|size|orbit|incl|scion",
		"Gold | 35 |10.35|  17|Body",  
		"Opal | 40 |17.55|  11|Mind", 
		"Ruby | 45 |27.90|   5|Emotions"
		];
	var NextConv = 13013676;

	/*Troubleshooting variables*/
	var openOnStart = false;
	var closeOnApply = false;
		
	/*JQuery Variables*/
	var ODP$ = $("#opendcp");
	var DTP$ = $("#datepanel");
	var DF$ = $("#dateform");
	var HF$ = $("#hourform");
	var CPDS$ = $("#cpdayslider");
	var CPTS$ = $("#cptimeslider");
	
	var OLP$ = $("#openlcp");
	var CNP$ = $("#controlpanel");
	var CF$ = $("#cpform");
	var CPLT$ = $("#cplatslider");
	var CPLN$ = $("#cplongslider");
	
	var SM$ = $("#sky_master");
	var DNS$ = $("#dawnsky");
	var DYS$ = $("#daysky");
	var ECL$ = $("#ecliptic");
	var CLEQ$ = $("#celestialequator");
	var Z$ = $("#zenith");
	var CPOL$ = $("#celestialpole");
	var Clock$ = $("#clock");
	var SN$ = $("#sun");
	var MN$ = new Array();
	
	/*Calculated Variables*/
	var DegPerHour = 360 / HoursPerDay;
	var DPYxHPD = DaysPerYear * HoursPerDay;
	var StartTime = (StartYear * DaysPerYear * HoursPerDay) + (StartDay * HoursPerDay) + StartHour;
	var latitude = StartLat; //degrees from equator
	var longitude = StartLong; //offset from Prime Meridian (where convergence occurs at 0deg)	
	var Moon = new Array();
	var SkySize = 500;
	var SunSize = 50;
	var SunBase =  SkySize - (SunSize / 2);
	var SunHidden = false;
	var SunX = 0; //Sun's X coordinate
	var SunY = 0; //Sun's Y coordinate
	var TimeZone = Math.floor(HoursPerDay * longitude / 360); //angular difference between current longitude and baseline
	var TotalTime = StartTime; //number of hours since Hour 0
	var LocalTime = TotalTime + TimeZone;
	var SolarOrbit = 0; //angle of planet in orbit around sun
	var SkyAngle = 0; //offset of objects in sky dependent on position of observer on surface of planet relative to sun (time of day & longitude)
	var seasonN = ["Fall", "Winter", "Spring", "Summer"];
	var seasonS = ["Spring", "Summer", "Fall", "Winter"];
	var nth = ["th", "st", "nd", "rd"];
	
	document.cpform.cplat.value = latitude;
	document.cpform.cplong.value = longitude;
	DF$.find("#cpday").attr("max", DaysPerYear - 1);
	DF$.find("#cptime").attr("max", HoursPerDay - 1);
	
	changeAllTime(TotalTime);
	
	//clicking on clock values
	Clock$.find("span").bind("contextmenu",function(e){
		return false;
	}).mousedown(function(event) {
		var temp = $(this).attr("id");
		switch (event.which) {
			case 1: 
				incrementDT(temp, 1);
				break;
			case 3:
				incrementDT(temp, -1);
				break;
		}
	});	
	
	DF$.change(function() {
		checkDTForm();
		setCurDT();
	});
	
	HF$.change(function() {
		changeHourForm();
		setCurDT();
	});
	
	CF$.change(function() {
		setLoc();
	});
	
	/* - jQuery UI configurations*/
	ODP$.button().click(function (event) {
		DTP$.dialog("open");
		ODP$.button("disable");
	});
	OLP$.button().click(function (event) {
		CNP$.dialog("open");
		OLP$.button("disable");
	});
	DTP$.dialog({
		title: "Set Date/Time",
		autoOpen: openOnStart,
		close: function(event, ui) {
			ODP$.button("enable");			
		},
		buttons: {
			Reset: function() {
				TotalTime = StartTime;
				changeAllTime(TotalTime);
				setCurDT();
			},
			Apply: function() {
				checkDTForm();
				setCurDT();
				if (closeOnApply) $(this).dialog("close");
			}
		},
		draggable: true,
		height: 325,//290,
		width: 260,
		position: "top-left",
		open: function(event, ui) {
			$(event.target).parent().addClass("faded")
		}
	});
	CPDS$.slider({ //Day Slider
		min: 0,
		max: DaysPerYear - 1,
		value: StartDay,
		slide: function(event, ui) {
			DTP$.find("#cpday").val(ui.value);
		}
	});
	DF$.find("#cpday").change(function() {
		CPDS$.slider("value", this.value);
	});
	CPTS$.slider({ //Time Slider
		min: 0,
		max: HoursPerDay - 1,
		value: StartHour,
		slide: function(event, ui) {
			DTP$.find("#cptime").val(ui.value);
		}
	});
	DF$.find("#cptime").change(function() {
		CPTS$.slider("value", this.value);
	});
	CNP$.dialog({
		title: "Control Panel",
		autoOpen: openOnStart,
		close: function(event, ui) {
			OLP$.button("enable");			
		},
		buttons: {
			Reset: function() {
				document.cpform.cplat.value = StartLat;
				document.cpform.cplong.value = StartLong;
				setLoc();
			},
			Apply: function() {
				OLP$.button("enable");
				if (closeOnApply) $(this).dialog("close");
				setLoc();
			}
		},
		draggable: true,
		height: 290,
		width: 260,
		position: "top",
		open: function(event, ui) {
			$(event.target).parent().addClass("faded")
		}
	});
	CPLT$.slider({ //Lat Slider
		orientation: "vertical",
		value: latitude,
		min: -90,
		max: 90,
		step: 5,
		slide: function(event, ui) {
			CNP$.find("#cplat").val(ui.value);
		}
	});
	CF$.find("#cplat").change(function() {
		CPLT$.slider("value", this.value);
	});
	CPLN$.slider({ //Long Slider
		value: longitude,
		min: -175,
		max: 180,
		step: 5,
		slide: function(event, ui) {
			CNP$.find("#cplong").val(ui.value);
		}
	});
	CF$.find("#cplong").change(function() {
		CPLN$.slider("value", this.value);
	});
	
	/*Create Sun*/
	SN$.css({
		height: SunSize + "px",
		width: SunSize + "px"
	}).click(function() {
		SunInfo();
	}).append("<img src='Images/Sun.png'/>");
	SN$.find("img").css({
		height: SunSize + "px",
		width: SunSize + "px"
	});
		
	/*Star Grid*/
	var grid = [15, 30, 45, 60, 75];
	
	function buildGrid() {
		SM$.find(".grid").remove();
		for (var i = 0; i < grid.length; i++) {
			ECL$.after("<div id='grid_" + grid[i] + "' class='circle grid'><span class='skytext'>" + grid[i] + "</span></div>");
			var temp = Math.round(SkySize * Math.abs(COS(parseInt(grid[i]))));
			SM$.find("#grid_" + grid[i]).css({
				height: (temp * 2) + "px",
				width: (temp * 2) + "px",
				top: (SkySize - temp) + "px",
				left: (SkySize - temp) + "px",
			});
		};
		Z$.css({
			position: "absolute",
			top: "490px",
			left: "497px"
		});
		if (parseInt(latitude) > 0) {
			CPOL$.css({
				position: "absolute",
				top: (490 - Math.round(SkySize * COS(Math.abs(latitude)))) + "px",
				left: "497px"
			}).find("abbr").attr("title","Celestial North");
		} else {
			CPOL$.css({
				position: "absolute",
				top: (490 + Math.round(SkySize * COS(Math.abs(latitude)))) + "px",
				left: "497px"
			}).find("abbr").attr("title","Celestial South");
		};
	};
	
	function drawECL() {
		ECL$.removeClass("hidden");
		CLEQ$.removeClass("hidden");
		ECL$.css({
			left: "0px",
			width: (SkySize * 2) + "px",
			top: (SkySize - Math.round(COS(90 - Math.abs(latitude)) * SkySize) + AToffset) + "px",
			height: (Math.round(COS(90 - Math.abs(latitude)) * SkySize) * 2) + "px"
		});
		/*
			FIX: Arc for ECL$ not working.
			Need two ECL$ - one West sky, one East; if point of ascension is 0deg, then as longitude
			changes, the point of ascension changes.  Need to be able to address up and down arcs.
		*/
		CLEQ$.css({
			left: "0px",
			width: (SkySize * 2) + "px",
			top: (SkySize - Math.round(COS(90 - Math.abs(latitude)) * SkySize)) + "px",
			height: (Math.round(COS(90 - Math.abs(latitude)) * SkySize) * 2) + "px"
		});
		if (parseInt(latitude) >= 0) {
			ECL$.css({
				borderTop: "none",
				borderBottom: "1px yellow dashed"
			}).find(".skytext").css({
				top: "",
				bottom: "-7px"
			});
			CLEQ$.css({
				borderTop: "none",
				borderBottom: "1px red dashed"
			}).find(".skytext").css({
				top: "",
				bottom: "-7px"
			});
		} else {
			ECL$.css({
				borderTop: "1px yellow dashed",
				borderBottom: "none"
			}).find(".skytext").css({
				top: "-7px",
				bottom: ""
			});
			CLEQ$.css({
				borderTop: "1px red dashed",
				borderBottom: "none"
			}).find(".skytext").css({
				top: "-7px",
				bottom: ""
			});
		};
	};
	
	function setMoonObj(name, size, period, inc, scion) {
		this.name = name; //Moon's name
		this.size = size; //Moon's pixel size
		this.period = period; //Moon's orbital period (number of days to orbit planet)
		this.inclination = inc; //Moon's angular inclination
		this.scion = scion;
		this.darklevel = 1.5; //Moon's shadow depth
		this.image = "Images/" + name + "Moon.png"; //Moon's image
		this.half = this.size / 2; //Half of Moon's pixel size
		this.degPday = 360 / this.period; //degrees per day
		this.degPhour = this.degPday / HoursPerDay; //degrees per hour
		this.x = 0;
		this.y = 0; 
		this.angle = 0; //angle
		this.base = SkySize - this.half;
		this.invis = false;
		this.rotation = 0;
	};
	
	function setMoon(x) {
		var temp = MoonData[x].replace(/ /gi,"").split("|");
		Moon[x] = new setMoonObj(temp[0], temp[1], temp[2], temp[3], temp[4]);
		SM$.find("#sun").after("<div id='moon_" + x + "' class='circle dkcolor'></div>")
		MN$[x] = $("#moon_" + i);
		MN$[x].append("<div id='dark_" + x + "' class='circle'></div><div id='lflt_" + x + "' class='shadow left light'></div><div id='lfdk_" + x + "' class='shadow left dark dkcolor'></div><div id='rtlt_" + x + "' class='shadow right light'></div><div id='rtdk_" + x + "' class='shadow right dark dkcolor'></div>");
		MN$[x].css({
			position: "absolute",
			height: Moon[x].size + "px",
			width: Moon[x].size + "px"
		}).click(function() {
			MoonInfo(x);
		});
		MN$[x].find("#dark_" + x).css({
			position: "relative",
			top: "0px",
			left: "0px", 
			backgroundImage: "url(" + Moon[x].image + ")",
			backgroundSize: Moon[x].size + "px",
			height: Moon[x].size + "px",
			width: Moon[x].size + "px",
			opacity: (Moon[x].darklevel / 10)
		});
		MN$[x].find(".shadow").css({
			height: Moon[x].size + "px",
			width: Moon[x].half + "px"
		});
		MN$[x].find(".light").css({
			backgroundImage: "url(" + Moon[x].image + ")",
			backgroundSize: Moon[x].size + "px"
		});
		MN$[x].find(".dark").css({
			opacity: ((10 - Moon[x].darklevel) / 10)
		});
		MN$[x].find(".left").css({
			right: Moon[x].half + "px"
		});
		MN$[x].find(".right").css({
			left: Moon[x].half + "px"
		});
	};
	
	for (var i = 0; i < MoonData.length; i++) {
		setMoon(i);
	};
	
	setLoc();
	
	/*Keyboard Navigation*/
	$(document).keydown(function(event) {
		var key = event.keyCode || event.which;
		//console.log("Pressed Key #" + key);
		switch (key) {
			/*case 13: //"enter"
				if (event.target.type === 'text') {
					calcDate(document.dayform.dayfield.value);
					return false;
				} else {
					incrementDay(lastinc);				
				};
				break;*/
			case 27: //"esc"
				TotalTime = 0;
				changeAllTime(TotalTime);
				setCurDT();
				break;
			case 33: //"page up"
				incrementDT("clyear", 1);
				break;
			case 34: //"page down"
				incrementDT("clyear", -1);
				break;	
			case 35: //"end"
				TotalTime = NextConv;
				changeAllTime(TotalTime);
				setCurDT();
				break;
			case 36: //"home"
				TotalTime = StartTime;
				changeAllTime(TotalTime);
				setCurDT();
				break;
			case 37: //"left arrow"
				incrementDT("clhour", -1);
				break;
			case 38: //"up arrow"
				incrementDT("clday", 1);
				break;	
			case 39: //"right arrow"
				incrementDT("clhour", 1);
				break;	
			case 40: //"down arrow"
				incrementDT("clday", -1);
				break;	
			case 106: //numpad "*"
				document.cpform.cplong.value = parseInt(document.cpform.cplong.value) + 45;
				setLoc();
				break;
			case 219: //keyboard "["
				incrementDT("clhour",500526);
				break;
			case 221: //keyboard "]"
				incrementDT("clhour",-500526);
				break;
			case 111: //numpad "/"
				document.cpform.cplong.value = parseInt(document.cpform.cplong.value) - 45;
				setLoc();
				break;
			case 81: //keyboard "q"
				document.cpform.cplong.value = 90 - ((TotalTime % 20) * DegPerHour);
				setLoc();
				break;	
			case 87: //keyboard "w"
				snapToMoon(0);
				break;	
			case 69: //keyboard "e"
				snapToMoon(1);
				break;	
			case 82: //keyboard "r"
				snapToMoon(2);
				break;	
			case 18: //keyboard "t"
				snapToMoon(3);
				break;	
		}
	});
	
	/*Active Functions*/
	
	function snapToMoon(x) {
		var temp = Math.round((90 - Moon[x].angle) % 360);
		if (temp > 180) temp -= 360;
		if (temp < -180) temp += 360;
		//console.log("Longitude (form): " + document.cpform.cplong.value + "; calc'd moon position: " + temp);
		if (parseInt(document.cpform.cplong.value) == temp) {
			incrementDT("clday", 1);
		};
		//document.cpform.cplong.value = parseInt(Math.round((90 - Moon[x].angle) % 360));
		setLoc();		
		MoonInfo(x);
	};
	
	function COS(x) {//return Cosine of ANGLE x
		return Math.cos(x * Math.PI / 180);
	};
	
	function SIN(x) {//return Sine of ANGLE x
		return Math.sin(x * Math.PI / 180);
	};
	
	function retYear(tt) {
		return Math.floor(tt / DPYxHPD);
	};
	
	function retDay(tt) {
		return Math.floor((tt - (retYear(tt) * DPYxHPD)) / HoursPerDay);
	};
	
	function retHour(tt) {
		return Math.floor(tt - ((retYear(tt) * DPYxHPD) + (retDay(tt) * HoursPerDay)));
	};
	
	function setLoc() {
		longitude = parseInt(document.cpform.cplong.value);
		//console.log("longitude (pre-adjust): " + longitude);
		if (longitude > 180) longitude -= 360;
		if (longitude < -180) longitude += 360;
		document.cpform.cplong.value = longitude;
		//console.log("longitude (post-adjust): " + longitude);
		latitude = parseInt(document.cpform.cplat.value);
		if (latitude > 90) latitude -= 180;
		if (latitude < -90) latitude += 180;
		document.cpform.cplat.value = latitude;
		changeLocalTime();
		setCurDT();
		buildGrid();
	};
	
	function changeAllTime(tt) { //change absolute time + local time
		longitude = parseInt(longitude);
		curYear = retYear(tt);
		curDay = retDay(tt);
		curHour = retHour(tt);
		changeLocalTime();
	};
	
	function changeLocalTime() { //check to see if local time changes due to change in longitude
		TimeZone = Math.round(HoursPerDay * longitude / 360);
		LocalTime = TotalTime + TimeZone;
		locYear = retYear(LocalTime);
		locDay = retDay(LocalTime);
		locHour = retHour(LocalTime);
		document.dateform.cpyear.value = locYear;
		document.dateform.cpday.value = locDay;
		CPDS$.slider("value", locDay);
		document.dateform.cptime.value = locHour;
		CPTS$.slider("value", locHour);	
		document.hourform.cphour.value = TotalTime;
	};
	
	function checkDTForm() { //get DT from DT Form
		TimeZone = Math.round(HoursPerDay * longitude / 360);
		locYear = parseInt(document.dateform.cpyear.value);
		locDay = parseInt(document.dateform.cpday.value);
		locHour = parseInt(document.dateform.cptime.value);
		LocalTime = (locYear * DaysPerYear * HoursPerDay) + (locDay * HoursPerDay) + locHour;
		TotalTime = (locYear * DaysPerYear * HoursPerDay) + (locDay * HoursPerDay) + locHour - TimeZone;
		curYear = retYear(TotalTime);
		curDay = retDay(TotalTime);
		curHour = retHour(TotalTime);
		document.hourform.cphour.value = TotalTime;
	};
	
	function changeHourForm() {
		TotalTime = parseInt(document.hourform.cphour.value);
		changeAllTime(TotalTime);
	};
	
	function setCurDT() {	
		/*write time in UI*/
		Clock$.find("#cltt").text(TotalTime);
		Clock$.find("#clyear .clickable").text(curYear);
		Clock$.find("#clday .clickable").text(curDay);
		Clock$.find("#clltt").text(LocalTime);
		Clock$.find("#cllyear .clickable").text(locYear);
		Clock$.find("#cllday .clickable").text(locDay);
		var hourth = (curHour > 3) ? 0 : curHour;
		Clock$.find("#clhour .clickable").html(curHour + nth[hourth]);
		var lhourth = (locHour > 3) ? 0 : locHour;
		Clock$.find("#cllhour .clickable").html(locHour + nth[lhourth]);
		Clock$.find("#season").text((latitude >= 0) ? seasonN[Math.floor(locDay / 88)] : seasonS[Math.floor(locDay / 88)]);
		Clock$.find("#season").append("-" + (locDay % 88));
		var templat, templong;
		var deg = "&deg;";
		if (latitude > 0) {
			templat = "N";
		} else {
			templat = "S";
		}
		if (longitude > 0) {
			templong = "E";
		} else {
			templong = "W";
		}
		Clock$.find("#cllat").html(Math.abs(latitude) + deg + templat);
		Clock$.find("#cllong").html(Math.abs(longitude) + deg + templong);
		Clock$.find("#tz").text(TimeZone);
		
		/*calcuate absolute position*/
		SolarOrbit = retDay(TotalTime) / DaysPerYear * 360;
		AToffset = axialtilt * SkySize / 180 * Math.sin(retDay(TotalTime) * 2 * Math.PI / DaysPerYear);
		
		SkyAngle = (TotalTime * DegPerHour + longitude) % 360;
		for (var i = 0; i < Moon.length; i ++) {
			placeMoon(i);
		};
		drawECL();
		drawSky();
	};
	
	function incrementDT(x, y) {
		var temp;
		switch (x) {
			case "clyear":
				temp = parseInt(y) * DaysPerYear * HoursPerDay;
				break;
			case "clday":
				temp = parseInt(y) * HoursPerDay;
				break;
			case "clhour":
				temp = parseInt(y);
				break;
			case "cllyear":
				temp = parseInt(y) * DaysPerYear * HoursPerDay;
				break;
			case "cllday":
				temp = parseInt(y) * HoursPerDay;
				break;
			case "cllhour":
				temp = parseInt(y);
				break;
			case "cllat":
				latitude += parseInt(y) * 5;
				document.cpform.cplat.value = latitude;
				setLoc();
				return;
				break;
			case "cllong":
				longitude += parseInt(y) * 5;
				document.cpform.cplong.value = longitude;
				setLoc();
				return;
				break;
			default:
				return;
				break;
		}
		TotalTime = parseInt(TotalTime) + temp;
		changeAllTime(TotalTime);
		setCurDT();
	};
	
	function placeMoon(x) {
		//Place Moon "x"
		Moon[x].angle = (Moon[x].degPhour * TotalTime) % 360;
		var moonposx = (Moon[x].angle + SkyAngle) % 360; //angle of moon in sky (from baseline)
		if (moonposx < 0 || moonposx > 180) {
			Moon[x].invis = true;
		} else {
			Moon[x].invis = false; 
		}; 				
		if (!Moon[x].invis && MN$[x].hasClass("hidden") && $("input[name=gtradio]:checked").val() != "project") {
			MN$[x].removeClass("hidden");
		}
		if (Moon[x].invis && $("input[name=gtradio]:checked").val() == "project") {
			MN$[x].addClass("hidden");
		};
		Moon[x].x = SkySize * COS(moonposx);
		Moon[x].y = (SIN(moonposx) * SkySize * COS(90 - latitude)) + AToffset + ((Moon[x].inclination * SkySize / 90) * SIN(Moon[x].angle));
	};
		
	function changePhase(x) {
		var lflt, lfdk, rtlt, rtdk;
		var moonangle = Moon[x].angle % 90;
		if (Moon[x].angle < 90) {
			lflt = 0;
			lfdk = 0;
			rtlt = Moon[x].half;
			rtdk = Math.round(Moon[x].half * COS(moonangle));
		} else if (Moon[x].angle >= 90 && Moon[x].angle < 180) {
			lflt = Math.round(Moon[x].half * SIN(moonangle));
			lfdk = 0;
			rtlt = Moon[x].half;
			rtdk = 0;
		} else if (Moon[x].angle >= 180 && Moon[x].angle < 270) {
			lflt = Moon[x].half;
			lfdk = 0;
			rtlt = Math.round(Moon[x].half * COS(moonangle));
			rtdk = 0;
		} else if (Moon[x].angle >= 270) {
			lflt = Moon[x].half;
			lfdk = Math.round(Moon[x].half * SIN(moonangle));
			rtlt = 0;
			rtdk = 0;
		};
		MN$[x].find("#lflt_" + x).css({
			backgroundPosition: "-" + (Moon[x].half - lflt) + "px 0px",
			width: lflt + "px",
			borderTopLeftRadius: lflt + "px " + Moon[x].half + "px",
			borderBottomLeftRadius: lflt + "px " + Moon[x].half + "px"			
		});
		MN$[x].find("#lfdk_" + x).css({
			backgroundPosition: "-" + (Moon[x].half - lfdk) + "px 0px",
			width: lfdk + "px",
			borderTopLeftRadius: lfdk + "px " + Moon[x].half + "px",
			borderBottomLeftRadius: lfdk + "px " + Moon[x].half + "px"			
		});
		MN$[x].find("#rtlt_" + x).css({
			backgroundPosition: Moon[x].half + "px 0px",
			width: rtlt + "px",
			borderTopRightRadius: rtlt + "px " + Moon[x].half + "px",
			borderBottomRightRadius: rtlt + "px " + Moon[x].half + "px"			
		});
		MN$[x].find("#rtdk_" + x).css({
			backgroundPosition: Moon[x].half + "px 0px",
			width: rtdk + "px",
			borderTopRightRadius: rtdk + "px " + Moon[x].half + "px",
			borderBottomRightRadius: rtdk + "px " + Moon[x].half + "px"
		});
		/*Rotate moon*/
			//no - needs to be in relation to 0deg, not position of where sun is being drawn
		/*var tempx = parseInt(SunX) - parseInt(Moon[x].x);
		var tempy = parseInt(SunY) - parseInt(Moon[x].y);
		if (tempx == 0) {
			Moon[x].rotation = 0;
		} else {
			Moon[x].rotation = (Math.round(Math.atan(tempy / tempx) * 180 / Math.PI)) % 180;
		};
		if (tempx < 0 && latitude != 0) {
			Moon[x].rotation -= 180 * (latitude / Math.abs(latitude));
		};*/
		
	};
	
	function drawSky() {
		//move Sun
		var sunposy = 90 - latitude; 
		var blueshadow = false;
		//sun visible?
		if (SkyAngle < 0 || SkyAngle > 180) { //night
			SunHidden = true;
		} else { //day
			SunHidden = false;
			if (SkyAngle >= 15 && SkyAngle <= 165) {
				blueshadow = true;
			}
		};
		if (SkyAngle > 90 && SkyAngle < 270) {//sun west 
			DNS$.addClass("flipped");
		} else { //sun east
			DNS$.removeClass("flipped");
		};
		if (blueshadow) {
			SM$.find(".dkcolor").css("backgroundColor", "#00AAE4");
		} else {
			SM$.find(".dkcolor").css("backgroundColor", "#000");		
		};
		DNS$.css({//dawnsky opacity
			opacity: (((Math.cos(SkyAngle * Math.PI / 90) / 2) - .2) * 2) - .1
		}); 
		DYS$.css({//daysky opacity
			opacity: (Math.sin(SkyAngle * Math.PI / 180) * 2) + .1
		});
		SunX = SkySize * COS(SkyAngle);
		SunY = (SIN(SkyAngle) * SkySize * COS(90 - latitude)) + AToffset;
		
		if (!SunHidden && SN$.hasClass("hidden") && $("input[name=gtradio]:checked").val() != "project") {
			SN$.removeClass("hidden");
		}
		if (SunHidden && $("input[name=gtradio]:checked").val() == "project") {
			SN$.addClass("hidden");
		}
		SN$.stop().animate({
			top: (SunY + SunBase) + "px",
			left: (SunX + SunBase) + "px"
		}, {
			duration: 500,
			complete: function() {
				if (SunHidden) {
					SN$.addClass("hidden");
				} else if (!SunHidden && $("input[name=gtradio]:checked").val() == "project") {
					SN$.removeClass("hidden");
				} 
			}
		}, "linear").find("img").css({
			opacity: (0.6 + (Math.cos(SkyAngle * Math.PI / 90) / 2)) //sun "brightens" at zenith (opacity increases allowing bright background to shine through)
		});
		//shade moons
		for (var i = 0; i < Moon.length; i ++) {
			changePhase(i);
		};
		
		//move moons
		for (var i = 0; i < Moon.length; i ++) {
			MN$[i].stop().animate({
				top: (Moon[i].y + Moon[i].base) + "px",
				left: (Moon[i].x + Moon[i].base) + "px",
				rotate: Moon[i].rotation + "deg"
			}, {
			duration: 500,
				complete: function() {
					for (var ii = 0; ii < Moon.length; ii ++) {
						if (Moon[ii].invis) {
							MN$[ii].addClass("hidden");
						} else if (!Moon[ii].invis && $("input[name=gtradio]:checked").val() == "project") {
							MN$[ii].removeClass("hidden");
						}
					}
				}
			}, "linear");
		};
	};
	
	function MoonInfo(x) {
		console.log("----------------------");
		console.log("Name: " + Moon[x].name.toUpperCase() + " MOON, Scion of " + Moon[x].scion);
		//console.log("Size: " + Moon[x].size);
		console.log("Period: " + Moon[x].period + " days");
		//console.log("Darklevel: " + Moon[x].darklevel);
		console.log("Inclination: " + Moon[x].inclination + " degrees");
		/*console.log("deg/day: " + Moon[x].degPday);
		console.log("deg/hour: " + Moon[x].degPhour);
		console.log("x pos: " + Moon[x].x);
		console.log("y pox: " + Moon[x].y);
		console.log("Base: " + Moon[x].base);
		console.log("Invisible? " + Moon[x].invis);
		console.log("Rotation: " + Moon[x].rotation);
		console.log("Angle: " + Moon[x].angle);
		console.log("Hor Position: " + (parseInt(Moon[x].angle) + parseInt(SkyAngle)) % 360);*/
		console.log("Shadow Angle: " + Math.round(Moon[x].angle * 100)/100 + " degrees");
	};
	
	function SunInfo() {
		console.log("----------------------");
		console.log("Name: SUN");
		/*console.log("Size: " + SunSize);
		console.log("deg/hour: " + DegPerHour);
		console.log("x pos: " + SunX);
		console.log("y pox: " + SunY);
		console.log("Hidden? " + SunHidden);*/
		console.log("Planet Angle: " + SkyAngle + " degrees");
	};	

});