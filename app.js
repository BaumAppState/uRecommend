var redirect_uri = "https://urecommend.up.railway.app";
var cpuDeviceId = "6865a44f5e52deaa8b860e25ab6613f4d7a943f0"; 

var client_id = "b1d853e60aac443fae77ccd132b71b04"; 
var client_secret = "5f2d1466b27c4a3a966c38721e273f2e";

var access_token = null;
var refresh_token = null;
var currentPlaylist = "";
var radioButtons = [];
var intervalId = "";
var currentSongProgress;
var currentSongId = "";
var songOneId = "";
var songTwoId = "";
var songThreeId = "";
var songFourId = "";

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

/**
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'test'
})

connection.connect(function(err) {
    if (err) {
        console.error("Error connecting: " + err.stack);
        return;
    }
    console.log("Connected as id " + connection.threadId);
})
*/

function onPageLoad(){
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
            refreshPlaylists();
            //currentlyPlaying();
			intervalId = setInterval(currentlyPlaying, 1000); //continuously updates every 2000 ms
			//nextFourSongs();
        }
    }
    refreshRadioButtons();
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
    //client_id = document.getElementById("clientId").value;
    //client_secret = document.getElementById("clientSecret").value;
    //localStorage.setItem("client_id", client_id);
    //localStorage.setItem("client_secret", client_secret); // In a real app you should not expose your client_secret to the user
	//client_id = client_id;
	//client_secret = client_secret;


    let url = AUTHORIZE;
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url; // Show Spotify's authorization screen
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
        removeAllItems( "devices" );
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

function refreshPlaylists(){
    callApi( "GET", PLAYLISTS, null, handlePlaylistsResponse );
}

function handlePlaylistsResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        removeAllItems( "playlists" );
        data.items.forEach(item => addPlaylist(item));
        document.getElementById('playlists').value=currentPlaylist;
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
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
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 204 ){
        setTimeout(currentlyPlaying, 2000);
    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }    
}

function currentlyPlaying() {
    callApi( "GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponse );
}

function handleCurrentlyPlayingResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        if ( data.item != null ){
            document.getElementById("albumImage").src = data.item.album.images[0].url;
            document.getElementById("trackTitle").innerHTML = data.item.name;
            document.getElementById("trackArtist").innerHTML = data.item.artists[0].name;
            currentSongId = data.item.id;
			updateProgressBar();
			nextFourSongs();

            //Ensures that if someone has already voted, the buttons won't be clickable if the user refreshes the page
            if ( sessionStorage.getItem("lastvotedId") != null && currentSongId == sessionStorage.getItem("lastvotedId") ) {
                document.querySelectorAll('.button').forEach(function(element) {
                    element.classList.add('grey');
                    element.onclick = null;
                });
            } else {
                document.querySelectorAll('.button').forEach(function(element) {
                    element.classList.remove('grey');
                });
                //document.getElementById("blueButt").addEventListener("click", voteForBlue());
                //document.getElementById("yellowButt").addEventListener("click", voteForYellow());
                //document.getElementById("redButt").addEventListener("click", voteForRed());
                //document.getElementById("purpleButt").addEventListener("click", voteForPurple());
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

function deactiveButtons() {

}

function activateButtons() {

}

function nextFourSongs(){
    callApi( "GET", QUEUE, null, handleNextFourSongsResponse );
}

//Puts the next four songs in the queue onto the html as options to vote for
function handleNextFourSongsResponse(){
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

			document.getElementById("songTwoImage").src = data.queue[2].album.images[0].url;
            document.getElementById("songTwoTitle").innerHTML = data.queue[2].name;
            document.getElementById("songTwoArtist").innerHTML = data.queue[2].artists[0].name;
			songTwoId = data.queue[2].id;

			document.getElementById("songThreeImage").src = data.queue[3].album.images[0].url;
            document.getElementById("songThreeTitle").innerHTML = data.queue[3].name;
            document.getElementById("songThreeArtist").innerHTML = data.queue[3].artists[0].name;
			songThreeId = data.queue[3].id;

			document.getElementById("songFourImage").src = data.queue[4].album.images[0].url;
            document.getElementById("songFourTitle").innerHTML = data.queue[4].name;
            document.getElementById("songFourArtist").innerHTML = data.queue[4].artists[0].name;
			songFourId = data.queue[4].id;
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

function updateProgressBar() {
	callApi( "GET", PLAYER, null, handleUpdateProgressBarResponse );
}

function handleUpdateProgressBarResponse() {
	if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        console.log(data);
        var progress_ms = data.progress_ms;
		var duration_ms = data.item.duration_ms;
		var percentTime = (progress_ms / duration_ms) * 100;
		document.getElementById("progress-bar").style.width = percentTime + "%";    }
    else if ( this.status == 401 ){
        refreshAccessToken()
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function continuouslyUpdateCurrent() {
	setInterval(currentlyPlaying(), 2000);
}

//Adds song one to the queue to be played next
function songOneToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songOneId, null, handleApiResponse );
	reshuffleSongs();
}

//Adds song two to the queue to be played next
function songTwoToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songTwoId, null, handleApiResponse );
}

//Adds song three to the queue to be played next
function songThreeToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songThreeId, null, handleApiResponse );
}

//Adds song four to the queue to be played next
function songFourToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songFourId, null, handleApiResponse );
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
	//Uses setTimeout to wait 1000ms (1 second) before setting shuffle back to true
	//This is to ensure spotify has enough time to recieve the request and change the setting
	setTimeout(shuffleTrue(), 1000);
    intervalId = setInterval(currentlyPlaying, 1000); //restart continuous currentlyPlaying()
}

function voteForBlue() {
    document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });

    sessionStorage.setItem("lastvotedId", currentSongId);
    alert("Your vote for Blue has been counted.");
}

function voteForYellow() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    alert("Your vote for Yellow has been counted.");
}

function voteForRed() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    alert("Your vote for Red has been counted.");
}

function voteForPurple() {
	document.querySelectorAll('.button').forEach(function(element) {
        element.classList.add('grey');
        element.onclick = null;
    });
    
    sessionStorage.setItem("lastvotedId", currentSongId);
    alert("Your vote for Purple has been counted.");
}
