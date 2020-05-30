// TO IMPLEMENT:
// ON SCREEN OFF STOP CLOCK
// ON SCREEN ON START CLOCK AGAIN
// HRM ON ALL VIEWS - BACKGROUND PROCESS AVAILABLE TOO?
// IMPLEMENT CHARGE ICON


//CURRENT WIDGET LIST AVAILABLE ARE - CHARGE / STEPS / BPM
require("Font8x12").add(Graphics);

let state = {
  theme: "#fbc531",
  currentView: "WATCH_FACE",
  watchOptions: {
    widgets: true,
    align: "left",
    widgetList: ["CHARGE", "STEPS", "BPM"]
  },
  runningProcesses: {
    clock: undefined,
    heartMonitor: undefined,
    pedometer: undefined,
    notification: undefined,
    ramwatch: undefined
  },
  notifWidth: 0
};

const VIEWS = [
  "WATCH_FACE",
  "NOTIFICATION"
];


// Widgets.
function drawSteps(x, y, align) {
  g.reset();
  g.setColor('#7f8c8d');
  g.setFont("8x12",2);
  g.setFontAlign(align,0);
  g.drawString("STEPS", x, y, true);
  g.setColor('#bdc3c7');
  g.drawString("-", x, y+25, true);
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
    heartRate = currentHRM.toString() + "    ";
    return g.drawString(heartRate, x, y+25, true /*clear background*/);
  } else {
    g.drawString("BPM", x, y, true /*clear background*/);
    g.setColor('#bdc3c7');
    return g.drawString("-", x, y+25, true); //Padding
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
  g.setColor('#bdc3c7');
  g.drawString(`${charge}%`, x, y+25, true /*clear background*/);
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
    let date = `${daysOfWeek[weekDay]}|${day}|${("0"+(month+1)).substr(-2)}`;
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
  }

  // WIDGET SEGMENT
  if (options !== undefined || (state.watchOptions.widgets && state.watchOptions.align !== "center" && state.watchOptions.widgetList.length !== 0)){
    //Drawing selected Widgets section.
    let widgets = {
      CHARGE : "drawBattery",
      STEPS : "drawSteps",
      BPM : "drawBPM"
    };

    // These coordinates were derived from left-aligned face.
    let widget_x = 145;
    let widget_y = Uint8Array([40, 105, 170]);
    let widget_align = -1;
    if(state.watchOptions.align === "right"){
      widget_x = 240 - 145;
      widget_align = 1;
    }

    if (options !== undefined){
      return console.log("Override render.");
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

const NOTIFICATION = () =>{
  function drawNotification(x, y){
    g.setColor("#000000");
    g.fillRect(0, 0, x, 240);
    if(x >= 240){
       g.drawImage(require("heatshrink").decompress(atob("mEwxH+AH4A/AH4ATnYAGFdYzlFp4xeFyYwZFqoxYFzIwUFzYwTF9wudGCAufGB4vuF0IwNF/2JxIMKr9fF6AuP6/XGBFf1utMCIuNr4uBGBA6BFxAvXFwgwFNAWzRowvYFwwwCr+zFxgvVFxAAFFxQvUKYqHCFyIvU1q4IFyAvTFwK1BBAgwEFxovKGA+t1oiIGARoDFyovGr5QLxIuOF6QAdF5YwiFxgvwGEAuOGD4uQF+AwcFyQwbFygvYFqovYFy4vVFrAvJBBIAdEkgvOFtIvEF1YvBFtgA/AH4A2A==")), x-166, y-220 ,{scale : 2});
       g.setColor("#ffffff");
       g.setFont("6x8",3);
       g.setFontAlign(0,0);
       g.drawString("MESSENGER", x-120, y-105, false);

       g.reset();
       g.setColor("#b2bec3");
       g.setFont("6x8",2);
       g.setFontAlign(0,0);
       g.drawString("Adrian", x-120, y-70, false);
       g.fillCircle(120, 220, 5);
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


function setCurrentView(view, options){
  //Clearing running processes
  //Resetting clock
  if(state.runningProcesses.clock != undefined){
    clearInterval(state.runningProcesses.clock);
  }
  //Resetting notif
  if(state.runningProcesses.notification != undefined){
    clearInterval(state.runningProcesses.notification);
    state.runningProcesses.notification = undefined;
    state.notifWidth = 0;
  }

  //Render if valid view.
  if (VIEWS.includes(view)){
    state.currentView = view;
    return render(options);
  } else {
    console.log("Invalid view.");
  }
}

function render(options){
  if(options === undefined){
    g.clear();
  } else if(options.clear === false){
    console.log("Skip clear");
  }
  return eval(state.currentView)(options);
}

function getMem(){
  console.log(Math.round(process.memory().usage*100/process.memory().total));
}

//Initialise
setCurrentView("WATCH_FACE");
//state.runningProcesses.ramwatch = setInterval(getMem ,1000);

Bangle.on('touch', function(button) {
  if(state.runningProcesses.notification === undefined){
    Bangle.buzz();
    setCurrentView("NOTIFICATION", {clear: false});
  } else {
    setCurrentView("WATCH_FACE");
  }
});
