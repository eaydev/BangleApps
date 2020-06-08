require("Font8x12").add(Graphics);
const storage = require("Storage");

let state = {
  connected: false,
  theme: "#2ecc71",
  currentView: "WATCH_FACE",
  watchOptions: {
    widgets: true,
    align: "left",
    widgetList: ["CHARGE", "STEPS", "BPM", "BLUETOOTH"]
  },
  runningProcesses: {
    clock: undefined,
    heartMonitor: undefined,
    pedometer: undefined,
    notification: undefined,
    ramwatch: undefined
  },
  notifWidth: 0,
  notification: {
    author: undefined,
    source: undefined
  },
  bluetoothAllowed : true,
  currentHRM: undefined,
  charging: false
};

const VIEWS = [
  "WATCH_FACE",
  "NOTIFICATION"
];


//Helper functions or related to installed WIDGETS
//Get steps.
function getSteps(){
  return new Promise((resolve, reject)=>{
    let now = new Date();
    let month = now.getMonth() + 1;
    if (month < 10) month = "0" + month;
    let filename = "activepedom" + now.getFullYear() + month + now.getDate() + ".data";

    let csvFile = storage.open(filename, "r");
    //Adding a way to delete file.
    if(csvFile && csvFile.getLength() > 0){
      //If file exists.
      let data = csvFile.read(csvFile.getLength()).split("\n");
      let stepsCounted = 0;
      let readDates = [];

      for(let i = 0; i < data.length ; i++){
          let row = data[i].split(",");
          if (row.length === 6){
            if(!readDates.includes(row[0])){
              readDates.push(row[0]);
              stepsCounted += Number(row[1]);
            }
          }
      }
      resolve(stepsCounted);
    } else {
      //If not yet AVAILABLE
      resolve("IN COUNT");
    }
  });
}

//Checking for installed Widgets
//CURRENT WIDGET LIST AVAILABLE ARE - CHARGE / STEPS / BPM
function checkWidgets(){
  if(global.WIDGETS === undefined || state.watchOptions.widgets !== true){
    console.log("Please load widgets");
  } else {
    //Check for 'activepedom'
    if(!Object.keys(global.WIDGETS).includes("activepedom")){
      //Disable pedometer on face.
      //Create new state widgetlist without STEPS
      let oldState = state.watchOptions.widgetList;
      let newState = [];
      for(let i = 0; i < oldState.length; i++){
        if(oldState[i] !== "STEPS"){
          newState.push(oldState[i]);
        }
      }
      state.watchOptions.widgetList = newState;
    }
  }
}

// Widgets.
function drawSteps(x, y, align) {
  getSteps()
    .then(steps=>{
      g.reset();
      g.setColor('#7f8c8d');
      g.setFont("8x12",2);
      g.setFontAlign(align,0);
      g.drawString("STEPS", x, y, true);
      g.setColor('#bdc3c7');
      g.drawString(steps, x, y+25, true);
    });
}

// Drawing BPM.
function drawBPM(x, y, align) {
  //Reset to defaults.
  g.reset();
  g.setColor('#7f8c8d');
  g.setFont("8x12",2);
  g.setFontAlign(align, 0);
  var heartRate = 0;

  if(state.runningProcesses.heartMonitor){
    g.drawString("BPM", x, y, true);
    g.setColor('#e74c3c');
    g.drawString("*", x+45, y, false);
    g.setColor('#bdc3c7');
    //Showing current heartrate reading.
    heartRate = state.currentHRM.toString() + "    ";
    return g.drawString(heartRate, x, y+25, true /*clear background*/);
  } else {
    g.drawString("BPM    ", x, y, true /*clear background*/);
    g.setColor('#bdc3c7');
    return g.drawString("-     ", x, y+25, true); //Padding
  }
}

//Drawing Battery
function drawBattery(x, y, align) {
  let charge = E.getBattery();
  g.reset();
  g.setColor('#7f8c8d');
  g.setFont("8x12",2);
  g.setFontAlign(align,0); // align right bottom
  g.drawString("CHARGE", x, y, true /*clear background*/);
  if(state.charging || Bangle.isCharging()){
    g.setColor("#00b894");
  }
  g.drawString(`${charge}%   `, x, y+25, true /*clear background*/);
  if(state.charging || Bangle.isCharging()){
    g.drawImage(require("heatshrink").decompress(atob("jEYxH+ABXMAAgRLC8Qu/F15GcFy4bRCxAXXMNIYEC1IXbC1QXaC1YXZC0wA=")), x+40, y+15, {scale: 0.8});
  }
}

//Drawing Bluetooth
function drawConnection(x, y, align) {
  if(!state.connected){
    g.drawImage(require("heatshrink").decompress(atob("jEYxH+ABU7BhYXLDCwXBDCoXCDCgXDDCYUCDB4OEAgYYOBwgDDr4wQIgaSSOgh3TCyy+daq5eXRybvVa6oNEDY5iRd6R6HVKrXTLagXECyoXNA==")), x-7, y-5, {scale: 0.9});
  } else if(state.connected){
    g.drawImage(require("heatshrink").decompress(atob("jEYxH+ABWsBhYXLDCwXBDCoXCDCgXDDCYUCDB4OEAgYYOBwgXSB4hHSOgx3TCyy+daq5eXRybvVa6oNEDY5iRd6R6HVKrXTLagXECyoXNA==")), x-7, y-5, {scale: 0.9});
  }
}

// View watchface
const WATCH_FACE = (options) =>{
  //TIME _ DATE SEGMENT
  function drawTimeDate() {
    let time_x = 25;
    let date_x = 20;

    let hours_y = 65;
    let mins_y = 155;
    let date_y = 215;

    let font_align = -1;

    if(state.watchOptions.align === "right"){
      time_x = 240 - time_x;
      date_x = 240 - date_x;
      font_align = 1;
    } else if (!state.watchOptions.widgets || state.watchOptions.align === "center" || state.watchOptions.widgetList.length === 0){
      time_x = 120;
      date_x = 120;
      font_align = 0;
    }

    //Creating date strings to be input into template.
    let d = new Date();
    let h = d.getHours(), m = d.getMinutes(), day = d.getDate(), month = d.getMonth(), weekDay = d.getDay();
    let daysOfWeek = ["MON", "TUE","WED","THU","FRI","SAT","SUN"];
    let hours = ("0"+h).substr(-2);
    let mins= ("0"+m).substr(-2);
    let date = `${daysOfWeek[weekDay]}|${("0"+(day)).substr(-2)}|${("0"+(month+1)).substr(-2)}`;
    // Reset the state of the graphics library
    g.reset();
    // Set color --------- WILL BECOME CUSTOMISABLE.
    g.setColor(state.theme);
    // Drawing the time.
    g.setFont("8x12",9);
    g.setFontAlign(font_align,0);
    g.drawString(hours, time_x, hours_y, true);
    g.drawString(mins, time_x, mins_y, true);
    // Drawing the date.
    g.setFont("6x8",2);
    g.drawString(date, date_x, date_y, true /*clear background*/);
    console.log("Rendering clock");
  }

  // WIDGET SEGMENT
  if (options !== undefined || (state.watchOptions.widgets && state.watchOptions.align !== "center" && state.watchOptions.widgetList.length !== 0)){
    //Drawing selected Widgets section.
    let widgets = {
      CHARGE : "drawBattery",
      STEPS : "drawSteps",
      BPM : "drawBPM",
      BLUETOOTH: "drawConnection"
    };

    // These coordinates were derived from left-aligned face.
    let widget_x = 145;
    let widget_y = Uint8Array([40, 105, 170]);
    let widget_align = -1;
    if(state.watchOptions.align === "right"){
      widget_x = 240 - 145;
      widget_align = 1;
    }
    //Render overrides.
    if (options !== undefined){
      if (options.override !== undefined){
        if(state.runningProcesses.clock === undefined){
          state.runningProcesses.clock = setInterval(drawTimeDate, 15000);
        }
        //Override render to render on defined widget.
        return eval(widgets[options.override])(widget_x, widget_y[state.watchOptions.widgetList.indexOf(options.override)], widget_align);
      }
    }


    //Loop through our widget list and render with corresponding x and y.
    for(let i = 0; i < state.watchOptions.widgetList.length; i++){
      eval(widgets[state.watchOptions.widgetList[i]])(widget_x, widget_y[i],widget_align);
    }
  }

  //Call these draw functions.
  drawTimeDate();

  if(state.runningProcesses.clock === undefined){
    state.runningProcesses.clock = setInterval(drawTimeDate, 15000);
  }
  return console.log("Clock intitated");
};

//Notification watch face
const NOTIFICATION = () =>{
  function drawNotification(x, y){
    if(x >= 240){
      g.reset();
      let str = state.notification.body;
      let chunkedStr = [];

      //Splitting the str.
      if(str.length > 19){
       let newStr = "";
       for(let i = 0; i <str.length; i++){
         newStr += str[i];
         if(newStr.length === 19){
           chunkedStr.push(newStr);
           newStr = "";
         }
         if(i === str.length -1){
           chunkedStr.push(newStr);
         }
       }
      } else {
       chunkedStr.push(str);
      }
      g.clear();
      g.setFont("6x8",2);
      g.drawImage(require("heatshrink").decompress(atob("mEwxH+ACU6ABAdTFjAyiFh4yeFyoxXFrAwVFzYwSFzowQFz4wOF0IwMECterwwWEptdwIIFw/P5+rGCotLz3BAAIuHAAJhNFyNdFgOBrokEFwnPMZxdQ4OeFgK2BAAWrFofO5wzEGBwOKvXBFIJXEFQPIFYPIAYQvd4WenRYEGAfC4PCFwjDMFxs6XgM6FwwwC4PIAwfI0pgOXxeedYIvIMIQwBAYOkSJpfNAAOBFQqJEMIXBFwfP1YvKFxq+GE4KLEYQIuE5+CEhwvQ5274JhCL4PCBoi/LF7BhBMgPB5/XRoYxbF4/IRYIAC6HXGAIRErwvgeYTFC6AGBCAgvXrwdEd4IvCX4YAC5/WSQYudF4RWEMITCCYYQueLAQ4HSQSTBRqwuHRww5G4XIFz4kCcooLD4XCFxv+FyHPFxQACFwOBFxYvInWHRxCNHFw3BGBQvKGBIuOzxfMGDerCYIuQF5QwMw+HwTpCzwuMF54wKFYRcC4XBvU6rueBYgvIGCgiCwJbBLgNdSAXCF5AuEGCYhDF4N6FoJcBSBQuGF5gwEQBOe4WBXpowTFxM6BRQuJGBwAWFxQwjFxgwhFxwwfFyAwdFyQxbFyowXFq4yUFjgyPDiQA==")), 15, 15);
      g.drawString(state.notification.author, 75 , 30);
      //Loop through array
      let y = 80;
      g.setFont("6x8",2);
      if (chunkedStr.length >= 6){
       while(chunkedStr.length > 6){
         chunkedStr.pop();
       }
       chunkedStr.push("...");
      }

      for(let h = 0; h<chunkedStr.length; h++){
       g.drawString(chunkedStr[h], 0 , y);
       y += 20;
      }
      g.setFont("6x8",1.5);
      g.setFontAlign(1, 0);
      g.drawString("Dismiss", 240, 220);
    }
  }

  state.runningProcesses.notification = setInterval(()=>{
    if(state.notifWidth > 240){
      return clearInterval(state.runningProcesses.notification);
    }
    state.notifWidth += 8.6;
    drawNotification(state.notifWidth , 240);
  } , 1);
  return console.log("Rendering notification");
};

function clearProcesses(){
  //Clearing running processes
  //Resetting clock
  if(state.runningProcesses.clock != undefined){
    console.log("Clearing clock.");
    clearInterval(state.runningProcesses.clock);
    state.runningProcesses.clock = undefined;
  }
  //Resetting notif
  if(state.runningProcesses.notification != undefined){
    console.log("Clearing notification.");
    clearInterval(state.runningProcesses.notification);
    state.runningProcesses.notification = undefined;
    state.notifWidth = 0;
  }
}

function setCurrentView(view, options){
  clearProcesses();
  //Render if valid view.
  if (VIEWS.includes(view)){
    state.currentView = view;
    return render(options);
  } else {
    console.log("Invalid view.");
  }
}

function sendBattery() {
    gbSend({ t: "status", bat: E.getBattery() });
}

function gbSend(message) {
    Bluetooth.println("");
    Bluetooth.println(JSON.stringify(message));
}

function render(options){
  if(options === undefined){
    g.clear();
  } else if(options.clear === false){
    //Skip clear
  }
  return eval(state.currentView)(options);
}

function getMem(){
  console.log(Math.round(process.memory().usage*100/process.memory().total));
}

function setConnectionState(){
  state.connected = !state.connected;
  if(state.connected){
    setTimeout(sendBattery, 2000);
  }
  render({clear : false, override: "BLUETOOTH"});
}

//Initialise
Bangle.loadWidgets();
checkWidgets();
state.charging = Bangle.isCharging();
setCurrentView("WATCH_FACE");
setWatch(Bangle.showLauncher, BTN2, { repeat: false, edge: "falling" });
//state.runningProcesses.ramwatch = setInterval(getMem ,1000);

Bangle.on('touch', function(button) {
  if(Bangle.isLCDOn()){
    if(state.runningProcesses.notification === undefined){
      console.log("Not running");
    } else {
      setCurrentView("WATCH_FACE");
    }
  }
});

setWatch(function(button) {
  if(Bangle.isLCDOn()){
    if(state.runningProcesses.notification === undefined){
      console.log("Not running");
    } else {
      setCurrentView("WATCH_FACE");
    }
  }
}, BTN3, { repeat: true, edge: "falling" });

Bangle.on('lcdPower',on=>{
  if (on) {
    render({clear:false});
  } else {
    clearProcesses();
  }
});

//Bluetooth connect and d/c
if(state.bluetoothAllowed === true){
  NRF.on("connect", setConnectionState);
  NRF.on("disconnect", setConnectionState);
}


//Gadgetbridge test.
global.GB = (event) => {
  switch (event.t) {
      case "notify":
        Bangle.setLCDPower(true);
        Bangle.buzz()
          .then(()=>{
            let file = require("Storage").open("notif", "a");
            file.write(`${JSON.stringify(event)}\n`);
            state.notification = {
              author: event.title,
              body: event.body
            };
            setCurrentView("NOTIFICATION", {clear : false});
          });
        break;
    }
};

//Charge state controller.
Bangle.on('charging', (charging) => {
  if(charging){
    Bangle.buzz().then(()=>{
      state.charging = true;
      if(Bangle.isLCDOn()){
      render({clear : false, override: "CHARGE"});
      } else {
        Bangle.setLCDPower(true);
      }
    });
  } else {
    if(state.charging){
      Bangle.buzz().then(()=>{
        state.charging = false;
        if(Bangle.isLCDOn()){
        render({clear : false, override: "CHARGE"});
        } else {
          Bangle.setLCDPower(true);
        }
      });
    }
  }
});


//HRM Controller added to button 1
setWatch(function(){
  if(!state.runningProcesses.heartMonitor){
      console.log("Toggled HRM");
      //Turn on.
      Bangle.buzz();
      Bangle.setHRMPower(1);
      //Render calc on render function.
      state.currentHRM = "CALC";
      state.runningProcesses.heartMonitor = true;
      render({clear : false, override: "BPM"});
    } else if(state.runningProcesses.heartMonitor){
      console.log("Toggled HRM");
      //Turn off.
      Bangle.buzz();
      Bangle.setHRMPower(0);
      state.runningProcesses.heartMonitor = false;
      state.currentHRM = undefined;
      render({clear : false, override: "BPM"});
    }
}, BTN1, { repeat: true, edge: "falling" });

Bangle.on('HRM', function(hrm) {
  console.log(hrm);
  if(hrm.confidence > 80){
   /*Do more research to determine effect algorithm for heartrate average.*/
   //re render from this.
   state.currentHRM = hrm.bpm;
   render({clear : false, override: "BPM"});
   //drawBPM(state.runningProcesses.heartMonitor);
  }
});
