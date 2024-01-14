const socket = io("ws://localhost:3000")

var player = null;
var flag = false;
var lastTime = -1;
var interval = 1000;
var playing = false;
var vid = null;
var currentTime = 0;
var apiReady = false;

// Function called when the YouTube API is ready
function onYouTubeIframeAPIReady() {
    console.log("api ready");
    console.log("socketid: "+ socket.id);
    createNewPlayer()
    apiReady=true;
}

function createNewPlayer() {
    if (currentTime == -1 || !vid) {
        setTimeout(createNewPlayer, interval/2);
    } else {
        newPlayer(vid, currentTime);
    }
}

socket.on('connect', () => {
    console.log(socket.id);
    //startVoiceChat();
});

// recieves the link of the video playing and displays it for the client
socket.on("link", (arg) => {
    console.log("in link");
    if (vid != getVideoId(arg)){
        vid=getVideoId(arg);
        if(document.getElementById("videoUrl").value != arg) {
            document.getElementById("videoUrl").value = arg;
            //console.log(arg)
        }
        if (apiReady) {
            newPlayer(vid, currentTime);
        }
    }
})

// recieves the current time for the video being played and sets it for the client
socket.on("updateTime", (time, id) => {
    if (socket == null || id != socket.id) {
        console.log("in updatetime: ", time);
        currentTime = time;
        lastTime = -1;
        if (apiReady) {
            player.seekTo(time, true);
        }
    }
})

// updates isPlaying?
socket.on("isPlaying?", (arg) => {
    playing = arg;
})

// plays video
socket.on("play", (arg)=> {
    if (!playing){ 
        playing=true;
        if (apiReady) player.playVideo();
    }
})

// pauses video
socket.on("pause", (arg)=> {
    if (playing){
        playing=false;
        if (apiReady) player.pauseVideo();
    }
})

function startVoiceChat() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            console.log("Microphone access granted");
            
            // Initialize MediaRecorder without specifying MIME type
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    console.log("Sending audio data");
                    socket.emit('voice', e.data);
                }
            };

            mediaRecorder.onerror = (error) => {
                console.error("MediaRecorder error:", error);
            };

            mediaRecorder.start(1000); // Trigger data event every 1000ms

            // Use the default MIME type for playback as well
            socket.on('voice', (data) => {
                console.log("Receiving audio data");
                const audioBlob = new Blob([data]);
                const audioURL = window.URL.createObjectURL(audioBlob);
                const audioElement = new Audio(audioURL);
                audioElement.play().catch(e => console.error("Error playing audio:", e));
            });
        })
        .catch(err => {
            console.error('Error accessing audio stream', err);
        });
}

// creates a new youtube player
function newPlayer(vid, playtime) {
    //console.log(playtime);
    flag=false;
    document.getElementById('videoContainer').remove();
    var div = document.createElement('div');
    div.id='videoContainer';
    div.className="video-container";
    //div.setAttribute("class", "video-container");
    document.getElementById("container").appendChild(div);
    player = new YT.Player('videoContainer', {
        videoId: vid,
        playerVars: {
        'playsinline': 1,
        'origin': 'http://localhost:3000',
        'start' : playtime.toFixed(), // only recognizes playtime by adding toFixed
        },
        events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    if (playing) {
        event.target.playVideo();
    } else {
        event.target.pauseVideo();
    }

    /// Time tracking starting here  
    var checkPlayerTime = function () {
        if (lastTime != -1) {
            if(player.getPlayerState() == YT.PlayerState.PLAYING ) {
                var t = player.getCurrentTime();
                
                console.log("dif: "+Math.abs(t - lastTime -1));

                ///expecting 1 second interval , with 500 ms margin
                if (Math.abs(t - lastTime -1) > 0.5) {
                    // there was a seek occuring
                    console.log("seek");
                    socket.emit("seek", player.getCurrentTime(), socket.id);
                }
            }
        }
        if(player.getPlayerState() == YT.PlayerState.PLAYING) lastTime = player.getCurrentTime();
        setTimeout(checkPlayerTime, interval); /// repeat function call in 1 second
    }
    setTimeout(checkPlayerTime, interval); /// initial call delayed 
}

  // Function called when the player state changes
function onPlayerStateChange(event) {
   //console.log(event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        socket.emit("LOG", "begin");
        socket.emit("LOG", player.getPlayerState());
        socket.emit("play", null);
        console.log("play");
        playing = true;
    } else if (event.data == YT.PlayerState.PAUSED) {
        socket.emit("LOG", "pause");
        socket.emit("pause", null);
        socket.emit("LOG", player.getPlayerState());
        console.log("pause");
        playing=false;
    } else if (event.data == YT.PlayerState.ENDED) {
        socket.emit("LOG", "end");
    }
}



function handleEnterKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the form submission (if within a form)
        embedVideo(); // Call the function associated with the button
    }
}

function embedVideo() {
    const videoUrl = document.getElementById("videoUrl").value;
    socket.emit("video", videoUrl);
    playVideo();
}

function playVideo(playtime=0) {
    const videoUrl = document.getElementById("videoUrl").value;
    const videoContainer = document.getElementById("videoContainer");
    // Extract the video ID from the URL
    const videoId = getVideoId(videoUrl);
    if (videoId) {
        // Embed the YouTube video using the iframe API
        const iframe = document.getElementById("videoContainer");
        //iframe.width = "700";
        //iframe.height = "400" ; // Calculate the height to maintain aspect ratio
        iframe.src = `https://www.youtube.com/embed/${videoId}?start=`+playtime.toString();
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        videoContainer.innerHTML = ""; // Clear any previous content
        //videoContainer.appendChild(iframe);
        iframe.addEventListener('click', function(event) {
            socket.emit("LOG", "test");
        });
       
        //newPlayer(videoId);
        //player.start(playtime);
        socket.emit("LOG", videoId);
    } else {
        alert("Invalid YouTube video URL. Please provide a valid link.");
    }
}

function getVideoId(url) {
    const regExp = /(?:https:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}
