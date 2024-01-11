const socket = io("ws://localhost:3000")

var player = null;
var flag = false;
var lastTime = -1;
var interval = 1000;
var playing = false;

// Function called when the YouTube API is ready
function onYouTubeIframeAPIReady() {
    newPlayer('M7lc1UVf-VE');
}

// recieves the link of the video playing and displays it for the client
socket.on("link", (arg) => {
    if(document.getElementById("videoUrl").value != arg) {
        document.getElementById("videoUrl").value = arg;
        playVideo();
        console.log(arg)
    }
})

socket.on("updateTime", (time) => {
    playVideo(time);
})

socket.on("isPlaying?", (arg) => {
    playing = arg;
})

socket.on("play", (arg)=> {
    player.playVideo();
})

socket.on("pause", (arg)=> {
    player.pauseVideo();
})

function newPlayer(vid) {
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
        'origin': 'http://localhost:3000' 
        },
        events: {
        'onReady': onPlayerReady,
        'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    event.target.playVideo();

    /// Time tracking starting here  
    var checkPlayerTime = function () {
        if (lastTime != -1) {
            if(player.getPlayerState() == YT.PlayerState.PLAYING ) {
                var t = player.getCurrentTime();
                
                //console.log(Math.abs(t - lastTime -1));

                ///expecting 1 second interval , with 500 ms margin
                if (Math.abs(t - lastTime - 1) > 0.5) {
                    // there was a seek occuring
                    console.log("seek"); /// fire your event here !
                    socket.emit("seek", player.getCurrentTime());
                }
            }
        }
        lastTime = player.getCurrentTime();
        setTimeout(checkPlayerTime, interval); /// repeat function call in 1 second
    }
    setTimeout(checkPlayerTime, interval); /// initial call delayed 
}

  // Function called when the player state changes
function onPlayerStateChange(event) {
    console.log(event.data);
    if (event.data == YT.PlayerState.PLAYING) {
        socket.emit("LOG", "begin");
        socket.emit("LOG", player.getPlayerState());
        socket.emit("play", null);
    } else if (event.data == YT.PlayerState.PAUSED) {
        socket.emit("LOG", "pause");
        socket.emit("pause", null);
        socket.emit("LOG", player.getPlayerState());
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
