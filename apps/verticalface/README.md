# Vertical UI

The aim of this project is to create an minimalistic but aesthetic style watch face / interface for the [Bangle.js watch by Espruino.](https://banglejs.com/).

## Most stable release
Though the app is currently deployed on Bangle's official app loader, you can get the most recent stable release here:
https://eaydev.github.io/BangleApps/

## Current Features
* Watch w/ time and date
* Battery display
* Notification display from Gadgetbridge
* Real-time heart rate monitor, no storage option for readings yet. No filtering just displaying raw data with confidence > 80
* Active pedometer support, for step reading (\*)


## Features we are trying to implement

```
* Battery charge icon with support for different alignments.
* Stop watch Screen
* Custom customisation screen android app
* Heart rate monitor storage option for readings.

```

## (\*) Note:
### Pedometer
The pedometer is reliant on the ['activepedom' app by Purple-tentacle](https://github.com/espruino/BangleApps/tree/master/apps/activepedom), without which the pedometer will be deactivated by default and won't be drawn. At the moment we are working out some bugs found with this.
