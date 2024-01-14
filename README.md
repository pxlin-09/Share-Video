# Share-Video

## Description:

Short description: 
* Website for users to watch the same video together

Long description: 
* Website currently hosted on localhost (to be hosted on a server in the near future), main focus is to allow a group of people to watch a youtube video together as if everyone was in the same room. The website allows any client to change the video playing, and modify the time the video to be played. The changes from that client will be broadcasted to all other clients watching so everyone will be watching the same time frame of the same video at the same time. New clients to the website will automatically be shown the same video at the same time frame as well.

*Currently only support youtube videos!*

## Check out the project:
* clone the repository to your local machine
* run npm start
  * To install node.js and npm, visit here [download](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* project will be running on http://localhost:3000
  * Create multiple instances of this page on your browser
  * Make modifications on one instance, all the other instances will automatically change to follow your modifications!
  * Current supported synchronized modifications are: video (changing link and hit play), video time, play, and pause
![](/screenshots/screenshot1/png)

  
## TODO:
1. Fix Minor Bug: client sometimes randomly enter a infinite seek where time difference is approx. 1 second
2. Audio streaming Bug: Audio capture and send to server is working correctly but after client recieves audio from server, the audio cannot be played
3. Host on a server
4. Make UI more visually appealing

