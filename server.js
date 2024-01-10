const express = require('express');
const { createServer } = require('node:http');
const { Server } = require('socket.io');

const port = 3000; // You can choose any available port
const app = express();
const server = createServer(app)
const io = new Server(server);

app.use(express.static('public')); // Serve static files from a directory named 'public'

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Replace with your HTML file path
});

var link = "https://www.youtube.com/watch?v=vjXNvLDkDTA"
var time = 0;
var playing = false;

io.on("connection", (socket) => {
    io.emit("link", link)
    io.emit("updateTime", time);
    socket.on("video", (msg)=>{
        link=msg;
        io.emit("link", link);
    })
    socket.on("LOG", (msg) => {
        console.log(msg);
    })
    socket.on("seek", (sec) => {
        time = sec;
        //io.emit("updateTime", time);
    })

    socket.on("play", (arg) =>{
        playing = true;
        //io.emit("play", arg);
    })

    socket.on("pause", (arg) => {
        playing = false;
        //io.emit("pause", arg)
    })
})

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

setInterval(function() {
    if (playing) {
        time += 1;
        console.log(time);
    }
}, 1000); 