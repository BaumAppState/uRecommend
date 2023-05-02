var redirect_uri = "https://urecommend.up.railway.app/adminPage.html";
var cpuDeviceId = "6865a44f5e52deaa8b860e25ab6613f4d7a943f0"; 

var client_id = "b1d853e60aac443fae77ccd132b71b04"; 
var client_secret = "5f2d1466b27c4a3a966c38721e273f2e";

var access_token = null;
var refresh_token = null;
var percentTime;
var currentPlaylist = "";
var radioButtons = [];
var intervalId = "";
var currentSongProgress;
var currentSongId = "";
var oldSongId = "";
var newSongId = "";
var songOneId = "";
var songTwoId = "";
var songThreeId = "";
var songFourId = "";
var hasQueuedWinner = false;

const AUTHORIZE = "https://accounts.spotify.com/authorize"
const TOKEN = "https://accounts.spotify.com/api/token";
const PLAYLISTS = "https://api.spotify.com/v1/me/playlists";
const DEVICES = "https://api.spotify.com/v1/me/player/devices";
const PLAY = "https://api.spotify.com/v1/me/player/play";
const PAUSE = "https://api.spotify.com/v1/me/player/pause";
const NEXT = "https://api.spotify.com/v1/me/player/next";
const PREVIOUS = "https://api.spotify.com/v1/me/player/previous";
const PLAYER = "https://api.spotify.com/v1/me/player";
const QUEUE = "https://api.spotify.com/v1/me/player/queue";
const TRACKS = "https://api.spotify.com/v1/playlists/{{PlaylistId}}/tracks";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";


//=================Firebase Database Configuration============================

const firebaseConfig = {
    apiKey: "AIzaSyATpX4Cx9va_x3GOkzkmWvdVXh6bIBxyno",
    authDomain: "urecommend-database.firebaseapp.com",
    databaseURL: "https://urecommend-database-default-rtdb.firebaseio.com",
    projectId: "urecommend-database",
    storageBucket: "urecommend-database.appspot.com",
    messagingSenderId: "10648349121",
    appId: "1:10648349121:web:afdb5b19e14abd95a4e740"
};

firebase.initializeApp(firebaseConfig);

var urecDB = firebase.database();

//=================Database accessors and mutators============================
function resetVotes() {
    urecDB.ref("voteLog").set({
        blueCount: 0,
        yellowCount: 0,
        redCount: 0,
        purpleCount: 0
    });
}

function voteForBlue() {
    document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });

    sessionStorage.setItem("lastvotedId", currentSongId);
    urecDB.ref("voteLog/blueCount").transaction(function(currentCount) {
        return (currentCount || 0) + 1;
    });
    alert("Your vote for Blue has been counted.");
}

function voteForYellow() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    urecDB.ref("voteLog/yellowCount").transaction(function(currentCount) {
        return (currentCount || 0) + 1;
    });
    alert("Your vote for Yellow has been counted.");
}

function voteForRed() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    urecDB.ref("voteLog/redCount").transaction(function(currentCount) {
        return (currentCount || 0) + 1;
    });
    alert("Your vote for Red has been counted.");
}

function voteForPurple() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    urecDB.ref("voteLog/purpleCount").transaction(function(currentCount) {
        return (currentCount || 0) + 1;
    });
    alert("Your vote for Purple has been counted.");
}

function getWinningColor(callback) {
    urecDB.ref("voteLog").once("value", function(snapshot) {
        var voteCounts = snapshot.val();
        var winningColor = null;
        var highestCount = 0;
        for (var color in voteCounts) {
            if (voteCounts[color] > highestCount) {
                highestCount = voteCounts[color];
                winningColor = color;
            }
        }
        callback(winningColor);
    });
}

function winnerToQueue(winningColor) {
    switch (winningColor) {
        case "blueCount":
            songOneToQueue();
            break;
        case "yellowCount":
            songTwoToQueue();
            break;
        case "redCount":
            songThreeToQueue();
            break;
        case "purpleCount":
            songFourToQueue();
            break;
        default:
            songOneToQueue();
            break;
    }
}

//===================================================================================

function onPageLoad() {
    document.getElementById("currentPollSection").style.display = 'block';
    setInterval(buildPage, 2000);
}

function onPageLoadAdmin(){
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else{
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            //Doesn't have access token so present token section
            document.getElementById("tokenSection").style.display = 'block';  
        }
        else {
            //Has access token so present currently playing/polling section
            document.getElementById("currentPollSection").style.display = 'block';  
            refreshDevices();
			intervalId = setInterval(currentlyPlayingAdmin, 1000); //continuously updates every 1000 ms
        }
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri);
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

function requestAuthorization(){
    adminPassword = document.getElementById("adminPassword").value;

    if ( adminPassword == "EdwardNigma") {
        let url = AUTHORIZE;
        url += "?client_id=" + client_id;
        url += "&response_type=code";
        url += "&redirect_uri=" + encodeURI(redirect_uri);
        url += "&show_dialog=true";
        url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
        window.location.href = url; // Show Spotify's authorization screen
    }
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function refreshDevices(){
    callApi( "GET", DEVICES, null, handleDevicesResponse );
}

function handleDevicesResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        data.devices.forEach(item => addDevice(item));
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function addDevice(item){
    let node = document.createElement("option");
    node.value = item.id;
    node.innerHTML = item.name;
    document.getElementById("devices").appendChild(node); 
}

function deviceId(){
    return document.getElementById("devices").value;
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

function play(){
    let playlist_id = document.getElementById("playlists").value;
    let trackindex = document.getElementById("tracks").value;
    let album = document.getElementById("album").value;
    let body = {};
    if ( album.length > 0 ){
        body.context_uri = album;
    }
    else{
        body.context_uri = "spotify:playlist:" + playlist_id;
    }
    body.offset = {};
    body.offset.position = trackindex.length > 0 ? Number(trackindex) : 0;
    body.offset.position_ms = 0;
    callApi( "PUT", PLAY + "?device_id=" + deviceId(), JSON.stringify(body), handleApiResponse );
}

function handleApiResponse(){
    if ( this.status == 200){
        console.log(this.responseText);
        setTimeout(currentlyPlayingAdmin, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlayingAdmin, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}

function currentlyPlayingAdmin() {
    callApi( "GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponseAdmin );
}

function handleCurrentlyPlayingResponseAdmin(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.item != null ){
            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
            currentSongId = data.item.id;

            var progress_ms = data.progress_ms;
		    var duration_ms = data.item.duration_ms;

            urecDB.ref("songInfo/songCurrentInfo").set({
                image: data.item.album.images[0].url,
                title: data.item.name,
                artist: data.item.artists[0].name,
                id: data.item.id,
                percentTime: (progress_ms / duration_ms) * 100,
                timeRemaining_ms: (duration_ms - progress_ms),
                progress_ms: progress_ms
            });
			updateProgressAdmin();
			nextFourSongsAdmin();

            //Ensures that if someone has already voted, the buttons won't be clickable if the user refreshes the page
            if ( sessionStorage.getItem("lastvotedId") != null && currentSongId == sessionStorage.getItem("lastvotedId") ) {
                document.querySelectorAll('.button').forEach(function(element) {
                    element.classList.add('grey');
                    //element.onclick = null;
                });
                document.getElementById("blueButt").removeEventListener("click", voteForBlue);
                document.getElementById("yellowButt").removeEventListener("click", voteForYellow);
                document.getElementById("redButt").removeEventListener("click", voteForRed);
                document.getElementById("purpleButt").removeEventListener("click", voteForPurple);
            } else {
                document.querySelectorAll('.button').forEach(function(element) {
                    element.classList.remove('grey');
                });
                document.getElementById("blueButt").addEventListener("click", voteForBlue);
                document.getElementById("yellowButt").addEventListener("click", voteForYellow);
                document.getElementById("redButt").addEventListener("click", voteForRed);
                document.getElementById("purpleButt").addEventListener("click", voteForPurple);
            }
        }


        if ( data.device != null ){
            // select device
            currentDevice = data.device.id;
            //document.getElementById('devices').value=currentDevice;
        }

        if ( data.context != null ){
            // select playlist
            //currentPlaylist = data.context.uri;
            //currentPlaylist = currentPlaylist.substring( currentPlaylist.lastIndexOf(":") + 1,  currentPlaylist.length );
            //document.getElementById('playlists').value=currentPlaylist;
        }
    }
    else if ( this.status == 204 ){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function buildPage() {
    buildSongs();
    if ( sessionStorage.getItem("lastvotedId") != null && currentSongId == sessionStorage.getItem("lastvotedId") ) {
        document.querySelectorAll('.button').forEach(function(element) {
            element.classList.add('grey');
            //element.onclick = null;
        });
        document.getElementById("blueButt").removeEventListener("click", voteForBlue);
        document.getElementById("yellowButt").removeEventListener("click", voteForYellow);
        document.getElementById("redButt").removeEventListener("click", voteForRed);
        document.getElementById("purpleButt").removeEventListener("click", voteForPurple);
    } else {
        document.querySelectorAll('.button').forEach(function(element) {
            element.classList.remove('grey');
        });
        document.getElementById("blueButt").addEventListener("click", voteForBlue);
        document.getElementById("yellowButt").addEventListener("click", voteForYellow);
        document.getElementById("redButt").addEventListener("click", voteForRed);
        document.getElementById("purpleButt").addEventListener("click", voteForPurple);
    }
}

function deactiveButtons() {

}

function activateButtons() {

}

function nextFourSongsAdmin(){
    callApi( "GET", QUEUE, null, handleNextFourSongsResponseAdmin );
}

//Puts the next four songs in the queue onto the html as options to vote for
function handleNextFourSongsResponseAdmin(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.queue[0] != null && data.queue[1] != null &&
             data.queue[2] != null && data.queue[3] != null &&
             data.queue[4] != null ) {
                
            document.getElementById("songOneImage").src = data.queue[1].album.images[0].url;
            document.getElementById("songOneTitle").innerHTML = data.queue[1].name;
            document.getElementById("songOneArtist").innerHTML = data.queue[1].artists[0].name;
			songOneId = data.queue[1].id;
            urecDB.ref("songInfo/songOneInfo").set({
                image: data.queue[1].album.images[0].url,
                title: data.queue[1].name,
                artist: data.queue[1].artists[0].name,
                id: data.queue[1].id
            });

			document.getElementById("songTwoImage").src = data.queue[2].album.images[0].url;
            document.getElementById("songTwoTitle").innerHTML = data.queue[2].name;
            document.getElementById("songTwoArtist").innerHTML = data.queue[2].artists[0].name;
			songTwoId = data.queue[2].id;
            urecDB.ref("songInfo/songTwoInfo").set({
                image: data.queue[2].album.images[0].url,
                title: data.queue[2].name,
                artist: data.queue[2].artists[0].name,
                id: data.queue[2].id
            });

			document.getElementById("songThreeImage").src = data.queue[3].album.images[0].url;
            document.getElementById("songThreeTitle").innerHTML = data.queue[3].name;
            document.getElementById("songThreeArtist").innerHTML = data.queue[3].artists[0].name;
			songThreeId = data.queue[3].id;
            urecDB.ref("songInfo/songThreeInfo").set({
                image: data.queue[3].album.images[0].url,
                title: data.queue[3].name,
                artist: data.queue[3].artists[0].name,
                id: data.queue[3].id
            });

			document.getElementById("songFourImage").src = data.queue[4].album.images[0].url;
            document.getElementById("songFourTitle").innerHTML = data.queue[4].name;
            document.getElementById("songFourArtist").innerHTML = data.queue[4].artists[0].name;
			songFourId = data.queue[4].id;
            urecDB.ref("songInfo/songFourInfo").set({
                image: data.queue[4].album.images[0].url,
                title: data.queue[4].name,
                artist: data.queue[4].artists[0].name,
                id: data.queue[4].id
            });
        }


        if ( data.device != null ){
            // select device
            currentDevice = data.device.id;
            document.getElementById('devices').value=currentDevice;
        }

        if ( data.context != null ){
            // select playlist
            currentPlaylist = data.context.uri;
            currentPlaylist = currentPlaylist.substring( currentPlaylist.lastIndexOf(":") + 1,  currentPlaylist.length );
            document.getElementById('playlists').value=currentPlaylist;
        }
    }
    else if ( this.status == 204 ){

    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function buildSongs(){
    var blueCount = 0;
    var yellowCount = 0;
    var redCount = 0;
    var purpleCount = 0;
    urecDB.ref("voteLog").on("value", function(snapshot) {
        var voteCounts = snapshot.val();
        blueCount = voteCounts.blueCount;
        yellowCount = voteCounts.yellowCount;
        redCount = voteCounts.redCount;
        purpleCount = voteCounts.purpleCount;
    });
    urecDB.ref("songInfo").on("value", function(snapshot) {
        var songCurrentInfo = snapshot.val().songCurrentInfo;
        var songOneInfo = snapshot.val().songOneInfo;
        var songTwoInfo = snapshot.val().songTwoInfo;
        var songThreeInfo = snapshot.val().songThreeInfo;
        var songFourInfo = snapshot.val().songFourInfo;

        document.getElementById("albumImage").src = songCurrentInfo.image;
        document.getElementById("trackTitle").innerHTML = songCurrentInfo.title;
        document.getElementById("trackArtist").innerHTML = songCurrentInfo.artist;
        currentSongId = songCurrentInfo.id;
        document.getElementById("progress-bar").style.width = songCurrentInfo.percentTime + "%";

        //Make the vote options go blank to avoid showing multiple different
        //songs flash by while reshuffling
        if(songCurrentInfo.timeRemaining_ms <= 5000 || songCurrentInfo.progress_ms <= 2000) {
            document.getElementById("songOneImage").src = "";
            document.getElementById("songOneTitle").innerHTML = "";
            document.getElementById("songOneArtist").innerHTML = "";

            document.getElementById("songTwoImage").src = "";
            document.getElementById("songTwoTitle").innerHTML = "";
            document.getElementById("songTwoArtist").innerHTML = "";
      
            document.getElementById("songThreeImage").src = "";
            document.getElementById("songThreeTitle").innerHTML = "";
            document.getElementById("songThreeArtist").innerHTML = "";
      
            document.getElementById("songFourImage").src = "";
            document.getElementById("songFourTitle").innerHTML = "";
            document.getElementById("songFourArtist").innerHTML = "";
        }
        else {
      
            document.getElementById("songOneImage").src = songOneInfo.image;
            document.getElementById("songOneTitle").innerHTML = songOneInfo.title;
            document.getElementById("songOneArtist").innerHTML = songOneInfo.artist;
            if (blueCount == 1)
                document.getElementById("songOneVotes").innerHTML = blueCount + " VOTE";
            else
                document.getElementById("songOneVotes").innerHTML = blueCount + " VOTES";
		    songOneId = songOneInfo.id;
        

            document.getElementById("songTwoImage").src = songTwoInfo.image;
            document.getElementById("songTwoTitle").innerHTML = songTwoInfo.title;
            document.getElementById("songTwoArtist").innerHTML = songTwoInfo.artist;
            if (yellowCount == 1)
                document.getElementById("songTwoVotes").innerHTML = yellowCount + " VOTE";
            else
                document.getElementById("songTwoVotes").innerHTML = yellowCount + " VOTES";
		    songTwoId = songTwoInfo.id;
      
            document.getElementById("songThreeImage").src = songThreeInfo.image;
            document.getElementById("songThreeTitle").innerHTML = songThreeInfo.title;
            document.getElementById("songThreeArtist").innerHTML = songThreeInfo.artist;
            if (redCount == 1)
                document.getElementById("songThreeVotes").innerHTML = redCount + " VOTE";
            else
                document.getElementById("songThreeVotes").innerHTML = redCount + " VOTES";
		    songThreeId = songThreeInfo.id;
      
            document.getElementById("songFourImage").src = songFourInfo.image;
            document.getElementById("songFourTitle").innerHTML = songFourInfo.title;
            document.getElementById("songFourArtist").innerHTML = songFourInfo.artist;
            if (purpleCount == 1)
                document.getElementById("songFourVotes").innerHTML = purpleCount + " VOTE";
            else
                document.getElementById("songFourVotes").innerHTML = purpleCount + " VOTES";
		    songFourId = songFourInfo.id;
        }
      });
}

function updateProgressAdmin() {
	callApi( "GET", PLAYER, null, handleUpdateProgressResponseAdmin );
}

function handleUpdateProgressResponseAdmin() {
	if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var progress_ms = data.progress_ms;
		var duration_ms = data.item.duration_ms;
		var percentTime = (progress_ms / duration_ms) * 100;

        newSongId = currentSongId;

        var remaining_ms = duration_ms - progress_ms;
        //once there's less than 5 seconds left, queue the winner
        //flag ensures that the function isn't called more than once
        //since the whole function is being called continuously every second
        if (remaining_ms < 5000 && hasQueuedWinner == false){
            getWinningColor(winnerToQueue);
            hasQueuedWinner = true;

            document.getElementById()
        }
        //once the next song starts, reset the votes
        if (oldSongId !== newSongId ){
            resetVotes();
            hasQueuedWinner = false;
        }
        oldSongId = newSongId;
		document.getElementById("progress-bar").style.width = percentTime + "%";    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

//Adds song one to the queue to be played next
function songOneToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songOneId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
	setTimeout(reshuffleSongs(), 2000);
}

//Adds song two to the queue to be played next
function songTwoToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songTwoId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

//Adds song three to the queue to be played next
function songThreeToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songThreeId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

//Adds song four to the queue to be played next
function songFourToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songFourId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

//Toggles shuffle setting to true
function shuffleTrue() {
	callApi( "PUT", SHUFFLE + "?state=true", null, handleApiResponse );
}

//Toggles shuffle setting to false
function shuffleFalse() {
	callApi( "PUT", SHUFFLE + "?state=false", null, handleApiResponse );
}

//Reshuffles songs that will play next by toggling shuffle off then on again
function reshuffleSongs() {
    clearInterval(intervalId); //cancel the continuous updating of currentlyPlaying()
	shuffleFalse();
	//Uses setTimeout to wait 3000ms (3 seconds) before setting shuffle back to true
	//This is to ensure spotify has enough time to recieve the request and change the setting
	setTimeout(shuffleTrue(), 3000);
    intervalId = setInterval(currentlyPlayingAdmin, 1000); //restart continuous currentlyPlaying()
}