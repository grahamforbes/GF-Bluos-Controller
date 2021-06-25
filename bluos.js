//******** Jave Script for Bluos controller: copyright 2021 g-forbes digital services ******** 
//
//******** Check state of local configuration ******** 
// Default value for GF var bluosIP = '.1.207';
if ((localStorage.getItem("yourBluosIP") == "") || (localStorage.getItem("yourBluosIP") === null)) {
    initialise()
} else {
    bluosIP = localStorage.getItem("yourBluosIP");
    var bluosURL = 'http://192.168' + bluosIP + ':11000/'
    var serviceURL = 'http://192.168' + bluosIP + ':11000'
}

function initialise() {
    document.querySelector('.setup').style.display = "flex";
    document.querySelector('.jukebox').style.display = "none";
    document.querySelector('.parameters').style.display = "none";
}

function setup() {
    setupCancel()
    localStorage.setItem('yourBluosIP', document.getElementById('getIP').value);
    window.location.reload();
}

function setupCancel() {
    document.querySelector('.setup').style.display = "none";
    document.querySelector('.jukebox').style.display = "flex";
    document.querySelector('.parameters').style.display = "flex";
}

//******** Begin main script ******** 
//Set up rest of items for srcipt
const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const playlistName = document.getElementById('playlistName');
const playlistArray = new Array;
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const title = document.getElementById('track');
const shuffle = document.getElementById('shuffle');
const repeat = document.getElementById('repeat');
const cover = document.getElementById('cover');
const volumeDisplay = document.getElementById('volume')
const volumeContainer = document.getElementById('volume-container');
const emptyPlaylistText = 'No Tracks'
var playListArrayCurrent = 0;
var playlistCount = 0;
var currentTrackLength = 0;
var t = (setInterval(getStatus, 2000))

//Instantiate player
reload();

//******** Main Player Functions ******** 
// Get the basic State of player
function getStatus() {
    getVolume()
    fetch(bluosURL + 'Status')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlMaster = parser.parseFromString(data, 'text/xml');
            if (!(xmlMaster.getElementsByTagName('streamFormat')[0])) { localPlayer(xmlMaster) } else { streamPlayer(xmlMaster) }
        })
}

// For playing from local library
function localPlayer(xmlDoc) {
    document.querySelector('.playlist').style.display = "flex";
    checkPlaylist();
    if (!xmlDoc.getElementsByTagName('title2')[0]) { return; }
    let art = (xmlDoc.getElementsByTagName('title2')[0].innerHTML);
    let alb = (xmlDoc.getElementsByTagName('title3')[0].innerHTML);
    let trk = (xmlDoc.getElementsByTagName('title1')[0].innerHTML);
    let img = (xmlDoc.getElementsByTagName('image')[0].innerHTML);
    let sec = (xmlDoc.getElementsByTagName('secs')[0].innerHTML);
    let shf = (xmlDoc.getElementsByTagName('shuffle')[0].innerHTML);
    let rpt = (xmlDoc.getElementsByTagName('repeat')[0].innerHTML);
    let stt = (xmlDoc.getElementsByTagName('state')[0].innerHTML);
    currentTrackLength = (xmlDoc.getElementsByTagName('totlen')[0].innerHTML);
    //If currently playing set in playing mode else reset
    if (stt == "play") { playSongControls() } else { resetPlayer() };
    let buttonText = 'no playlist'
    if (document.getElementById('track-' + playListArrayCurrent)) { buttonText = document.getElementById('track-' + playListArrayCurrent).firstChild.nodeValue; }
    if ((title.innerHTML != trk) || (trk != buttonText)) {
        cover.src = serviceURL + img;
        if (have = 'no playlist') { getPlaylist() }
        if (trk != '') { displayPlaylist(trk) } else {
            clearPlaylist()
        }
    }

    checkPlaylistControls(shf, rpt)

    // set up music player content
    document.getElementById('artist').innerHTML = art;
    document.getElementById('album').innerHTML = alb;
    title.innerHTML = trk;
    if (stt == "play") { updateProgress(currentTrackLength, sec); }
}

//For playing from a streamed service [note: album, track and artist details are unreliable]
function streamPlayer(xmlDoc) {
    let alb = ""
    let art = ""
    let check = ""
    if (playlistCount == 0) {
        document.querySelector('.playlist').style.display = "none";
    } else {
        document.querySelector('.playlist').style.display = "flex";
        //Check if there is any playlist content if so display it HERE
        checkPlaylist();
    }
    let img = (xmlDoc.getElementsByTagName('image')[0].innerHTML);
    let trk = (xmlDoc.getElementsByTagName('title1')[0].innerHTML);

    try { alb = (xmlDoc.getElementsByTagName('album')[0].innerHTML); } catch (e) {
        try { alb = (xmlDoc.getElementsByTagName('title3')[0].innerHTML); } catch (e) { alb = "Paused" }
    }
    try { art = (xmlDoc.getElementsByTagName('artist')[0].innerHTML); } catch (e) {
        try { art = (xmlDoc.getElementsByTagName('title2')[0].innerHTML); } catch (e) { art = "paused" }
    }
    try { check = (xmlDoc.getElementsByTagName('title3')[0].innerHTML); } catch (e) { check = "" }

    if ((check.includes(alb)) && (check.includes(art))) { trk = xmlDoc.getElementsByTagName('title2')[0].innerHTML; }
    // console.log(check, alb, art)
    let sec = (xmlDoc.getElementsByTagName('secs')[0].innerHTML);
    let stt = (xmlDoc.getElementsByTagName('state')[0].innerHTML);
    let shf = (xmlDoc.getElementsByTagName('shuffle')[0].innerHTML);
    let rpt = (xmlDoc.getElementsByTagName('repeat')[0].innerHTML);
    if (xmlDoc.getElementsByTagName('totlen')[0]) {
        currentTrackLength = (xmlDoc.getElementsByTagName('totlen')[0].innerHTML);
    } else {
        currentTrackLength = 0
    }
    if ((stt == "play") || (stt == "stream")) { playSongControls() } else { resetPlayer() };
    if (img.startsWith('http')) { cover.src = img; } else {
        cover.src = serviceURL + img;
    }

    checkPlaylistControls(shf, rpt)

    // set up music player content
    document.getElementById('album').innerHTML = alb;
    if (xmlDoc.getElementsByTagName('album')[0]) {
        document.getElementById('artist').innerHTML = art;
        title.innerHTML = trk;
    } else {
        title.innerHTML = art;
        document.getElementById('artist').innerHTML = trk;
    }
    updateProgress(currentTrackLength, sec);
}

//Check Shuffle and Repeat status
function checkPlaylistControls(shf, rpt) {
    if (shf == 1) {
        shuffle.classList.add('shuffleon');
        shuffle.innerHTML = "Shuffle On"
    } else {
        shuffle.classList.remove('shuffleon');
        shuffle.innerHTML = "Shuffle Off"
    };
    if (rpt == 0) {
        repeat.classList.add('repeaton');
        repeat.innerHTML = "Repeat Queue";
    } else if (rpt == 1) {
        repeat.classList.add('repeaton');
        repeat.innerHTML = "Repeat Track";
    } else {
        repeat.classList.remove('repeaton');
        repeat.innerHTML = "Repeat off"
    };

}

//Fetch music list from current playlist and build it an array
function getPlaylist() {
    fetch(bluosURL + 'Playlist')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc2 = parser.parseFromString(data, 'text/xml');
            let playlistDetails = (xmlDoc2.getElementsByTagName('song'))
            if (!(xmlDoc2.getElementsByTagName('playlist')[0].hasAttribute('name'))) {
                playlist = 'Unsaved Playlist'
                if (playlistDetails.length = 0) {
                    playlist = emptyPlaylistText
                }
            } else {
                playlist = xmlDoc2.getElementsByTagName('playlist')[0].getAttribute('name');
            }
            playlistName.innerHTML = playlist;
            playlistArray.splice(0, playlistArray.length)
                //  Build Playlist Array
            playlistCount = playlistDetails.length;
            for (i = 0; i < playlistCount; i++) {
                let plAlbum = playlistDetails[i].getElementsByTagName('alb')[0].innerHTML
                let plArtist = playlistDetails[i].getElementsByTagName('art')[0].innerHTML
                let plTrack = playlistDetails[i].getElementsByTagName('title')[0].innerHTML
                playlistArray[i] = { place: i, artist: plArtist, track: plTrack, album: plAlbum };
            }
        })
        .catch(err => console.log('No Playlist'));
}

//Make sure the playlist has not changed or is empty (It could be from Bluos App!)
function checkPlaylist() {
    fetch(bluosURL + 'Playlist')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc2 = parser.parseFromString(data, 'text/xml')
            let songCount = xmlDoc2.getElementsByTagName('song').length
            let plSongs = document.getElementById("currentPlaylist").childElementCount;

            if ((songCount == 0)) { clearPlaylist(); } // No playlist
            else {
                let playlistNow = xmlDoc2.getElementsByTagName('playlist')[0].getAttribute('name');
                let thisPlaylist = playlistName.innerHTM;
                if (((playlistNow !== thisPlaylist) | (plSongs !== songCount)) && (!((playlistNow = null) & (thisPlaylist == emptyPlaylistText)))) {
                    getPlaylist();
                    displayPlaylist(title.innerHTML)
                } //New Playlist
            }
        });
}

//Empty the playlist display as the Bluos Device has nothing selected
function clearPlaylist() {
    document.getElementById('currentPlaylist').innerHTML = "";
    document.getElementById('artist').innerHTML = "";
    document.getElementById('album').innerHTML = "";
    title.innerHTML = "";
    playlistName.innerHTML = emptyPlaylistText
    cover.src = "";
    playlistCount = 0;
    resetPlayer()
}

//Display Playlist with current track at the top in the DOM
function displayPlaylist(currentTrack) {
    // console.log(currentTrack)
    const foundTrack = playlistArray.some((item) => { return item.track == currentTrack })
    if (foundTrack) {
        var foundItem = playlistArray.filter((item) => { return item.track == currentTrack })
        var pstart = foundItem[0].place;
        var plast = playlistCount;
        output = `  <div class="playlist-container">
                    <div class="playlist-title">Artist</div>
                    <div class="playlist-title">Track</div>
                    <div class="playlist-title">Album</div>
                    </div>`
            // Start with previous track
        if (pstart == 0) {
            plast = plast - 1
            var previous = plast;
        } else { previous = pstart - 1 }
        createPlaylistEntry(previous)

        for (index = pstart; index < plast; index++) { createPlaylistEntry(index) }

        if (pstart != 0) {
            output += `<div class="playlist-line"></div><div class="playlist-line"></div>`
            for (index = 0; index < pstart - 1; index++) { createPlaylistEntry(index) }
        }
        document.getElementById('currentPlaylist').innerHTML = output;
        playListArrayCurrent = pstart;
        document.getElementById('container-' + pstart).classList.add("playing-now");

        function createPlaylistEntry(i) {
            let plAlbum = playlistArray[i].album
            let plArtist = playlistArray[i].artist
            let plTrack = playlistArray[i].track
            output += ` <div id="container-${i}" class="playlist-container">
                        <div class="playlist-line"></div>
                        <div class="playlist-description">${plArtist}</div> 
                        <div class="playlist-song">
                        <button id="track-${i}" class="playlist-song-btn " onclick="playMe( ${i}) ">${plTrack}</button>
                        </div>
                        <div class="playlist-description">${plAlbum}</div>
                        </div>`

        }
    } else {
        if (playlistName.innerHTML != emptyPlaylistText) {
            getPlaylist()
        }
    }
}

function clearPlaylistOnPlayer() {
    var result = confirm("CLear Playlist on the Vault?");
    if (result) {
        fetch(bluosURL + 'Clear')
        getStatus()
    }
}

//Setup presets that are songs from library
function getPresets() {
    fetch(bluosURL + 'Presets')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc3 = parser.parseFromString(data, 'text/xml');
            let presetDetails = (xmlDoc3.getElementsByTagName('preset'));
            output = ''
            for (i = 0; i < presetDetails.length; i++) {
                let prPRID = presetDetails[i].getAttribute('prid')
                let prName = presetDetails[i].getAttribute('name')
                let prID = presetDetails[i].getAttribute('id')
                let prURL = presetDetails[i].getAttribute('url')
                    // if (!(prURL.includes('http'))) {
                    //     output += `<button onclick="loadPreset('${prID}')">${prName}</button>`
                    // }
                output += `<button onclick="loadPreset('${prID}')">${prName}</button>`
            }
            document.getElementById('presetList').innerHTML = output;
        });
}

async function getAllPlaylists() {
    await fetch(bluosURL + 'Browse?key=/Playlists')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDocx = parser.parseFromString(data, 'text/xml')
            bigList = xmlDocx.getElementsByTagName('item')
            len = bigList.length
            output = ''
            for (i = 0; i < len; i++) {
                let loadLink = bigList[i].getAttribute('playURL');
                let loadName = bigList[i].getAttribute('text');
                let loadImage = bigList[i].getAttribute('image');
                output += `<button  onclick="loadPlaylist('${loadLink}')">${loadName}</button>`
            }
            document.getElementById('playlists').innerHTML = output;
        });

}

//Initaie a new preset in player
function loadPreset(preID) {
    fetch(bluosURL + 'Preset?id=' + preID);
    getPlaylist()
    getStatus()
}

//Initiate a new playlist in player
function loadPlaylist(plcode) {
    fetch(serviceURL + plcode);
    getPlaylist()
    getStatus()
}

//Get current volume as a percentage
function getVolume() {
    fetch(bluosURL + 'Volume')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDocx = parser.parseFromString(data, 'text/xml')
            volume = xmlDocx.getElementsByTagName('volume')[0].firstChild.nodeValue;
            volumeDisplay.style.width = `${volume}%`;
        });

}

//Set up selected song from click event on playlist - no API to call yet
function playMe(song) {
    playSongControls();
    fetch(bluosURL + 'Play?id=' + song)
    getStatus()
}

// Play song
function playSong() {
    playSongControls();
    fetch(bluosURL + 'Play')
    getStatus()
}

//Show the player as playing by displaying pause button
function playSongControls() {
    musicContainer.classList.add('play');
    playBtn.querySelector('i.fas').classList.remove('fa-play');
    playBtn.querySelector('i.fas').classList.add('fa-pause');
}

// Pause song - 
async function pauseSong() {
    await fetch(bluosURL + 'Pause')
    resetPlayer();
}

//Display player pause state - show play button
function resetPlayer() {
    musicContainer.classList.remove('play');
    playBtn.querySelector('i.fas').classList.add('fa-play');
    playBtn.querySelector('i.fas').classList.remove('fa-pause');
}

// Previous song
function prevSong() {
    fetch(bluosURL + 'Back')
}

// Next song
function nextSong() {
    fetch(bluosURL + 'Skip')
}

// Update progress bar
function updateProgress() {
    fetch(bluosURL + 'Status')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc = parser.parseFromString(data, 'text/xml');
            let sec = (xmlDoc.getElementsByTagName('secs')[0].innerHTML);
            // let len = (xmlDoc.getElementsByTagName('totlen')[0].innerHTML);
            let progressPercent = (sec / currentTrackLength) * 100;
            progress.style.width = `${progressPercent}%`;

        })
}

//Turn shuffle os or off depending on current state of Bluos device
function toggleShuffle() {
    fetch(bluosURL + 'Status')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc = parser.parseFromString(data, 'text/xml');
            let shf = (xmlDoc.getElementsByTagName('shuffle')[0].innerHTML);
            if (shf == 1) { fetch(bluosURL + 'Shuffle?state=0') } else { fetch(bluosURL + 'Shuffle?state=1') }
        });

}

//Cycle through repeat optiond depending on current state of Bluos device
function toggleRepeat() {
    fetch(bluosURL + 'Status')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDoc = parser.parseFromString(data, 'text/xml');
            let rpt = (xmlDoc.getElementsByTagName('repeat')[0].innerHTML);
            if (rpt == 0) { fetch(bluosURL + 'Repeat?state=1') } else if (rpt == 1) { fetch(bluosURL + 'Repeat?state=2') } else { fetch(bluosURL + 'Repeat?state=0') }
        });
    getStatus();
}

// Position track at point where progress bar is clicked 
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = currentTrackLength;
    fetch(bluosURL + 'Play?seek=' + ((clickX / width) * duration))
    updateProgress()
}

//Update volume to point where volume bar clicked
async function setVolume(e) {
    const width = this.clientWidth;
    const clickVol = e.offsetX;
    const newVol = (clickVol / width) * 100;
    await fetch(bluosURL + 'Volume?level=' + newVol)
    getVolume;
}

//Toggle volume between Mute nad 100%
function toggleVolume() {
    fetch(bluosURL + 'Volume')
        .then((res) => res.text())
        .then((data) => {
            let parser = new DOMParser(),
                xmlDocx = parser.parseFromString(data, 'text/xml')
            volume = xmlDocx.getElementsByTagName('volume')[0].firstChild.nodeValue;
            if (volume == 0) {
                fetch(bluosURL + 'Volume?level=100');
            } else {
                fetch(bluosURL + 'Volume?level=0');
            }
            getVolume;
        });
}

//Perform inmital or requested synchronisation with Vault
function reload() {
    playListArrayCurrent = 0;
    playlistCount = 0;
    currentTrackLength = 0;
    title.innerHTML = "unset"

    //Instantiate player
    playlistName.innerHTML = "Not Set"
    clearPlaylist()
    getPlaylist()
    getPresets()
    getAllPlaylists()
    getStatus()
    getVolume()
}

//******** Event listeners ******** 
//Play/Pause button pressed
playBtn.addEventListener('click', () => {
    const isPlaying = musicContainer.classList.contains('play');

    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// Change song from forward or next buttons
prevBtn.addEventListener('click', prevSong);
nextBtn.addEventListener('click', nextSong);

// Time/song update
// audio.addEventListener('timeupdate', updateProgress);

// Click on progress bar to move track position 
progressContainer.addEventListener('click', setProgress);

// Click on progress bar to move track position 
volumeContainer.addEventListener('click', setVolume);

//******** END ********

async function doStuff() {
    console.log('Doing Stuff')
    await fetch(bluosURL + 'Browse?key=LocalMusic:bySection/%2FArtists%3Fservice%3DLocalMusic')

    .then((res) => res.text())
        .then((data) => {
            console.log('reponded')
            let parser = new DOMParser(),
                xmlDocx = parser.parseFromString(data, 'text/xml')
            bigList = xmlDocx.getElementsByTagName('item')
            len = bigList.length
            for (i = 0; i < len; i++) { console.log(bigList[i].getAttribute('playURL')) }
            console.log(len)
            console.log(bigList)
            console.log(xmlDocx)
        });

}



// }<item text="Songs" browseKey="LocalMusic:bySection/%2FSongs%3Fservice%3DLocalMusic" type="link"/>

// fetch(bluosURL + 'Browse?key=%2FSongs%3Fservice%3DLocalMusic')