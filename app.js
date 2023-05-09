var redirect_uri = "https://urecommend.up.railway.app/adminPage.html";
var cpuDeviceId = "6865a44f5e52deaa8b860e25ab6613f4d7a943f0"; 
var client_id = "b1d853e60aac443fae77ccd132b71b04"; 
var client_secret = "5f2d1466b27c4a3a966c38721e273f2e";
var access_token = null;
var refresh_token = null;
var percentTime;
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
const PLAYER = "https://api.spotify.com/v1/me/player";
const QUEUE = "https://api.spotify.com/v1/me/player/queue";
const CURRENTLYPLAYING = "https://api.spotify.com/v1/me/player/currently-playing";
const SHUFFLE = "https://api.spotify.com/v1/me/player/shuffle";

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

/**
 * This function resets the vote counts in the realtime database all
 * back to 0.
 * 
 * @return {void}
 */
function resetVotes() {
    urecDB.ref("voteLog").set({
        blueCount: 0,
        yellowCount: 0,
        redCount: 0,
        purpleCount: 0
    });
}

/**
 * This function incremements the blueCount database variable by one, 
 * deactivates the button, and turns it grey.
 * 
 * @return {void}
 */
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

/**
 * This function incremements the yellowCount database variable by one, 
 * deactivates the button, and turns it grey.
 * 
 * @return {void}
 */
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

/**
 * This function incremements the redCount database variable by one, 
 * deactivates the button, and turns it grey.
 * 
 * @return {void}
 */
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

/**
 * This function incremements the purpleCount database variable by one, 
 * deactivates the button, and turns it grey.
 * 
 * @return {void}
 */
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

/**
 * This function gets the winning color and passes the winning
 * color as a parameter for the callback
 * 
 * @param {function} callback - function called with winningColor as argument
 * @return {void}
 */
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

/**
 * This function calls songOneToQueue(), songTwoToQueue(), etc. depending
 * on which winningColor is passed as an argument.
 * 
 * @param {string} winningColor - color that won the vote
 * @return {void}
 */
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

/**
 * This function is called when the page is loaded. It displays the
 * currentPollSection of the html and starts a call to buildPage()
 * that repeats continuously every 2 seconds.
 * 
 * @return {void}
 */
function onPageLoad() {
    document.getElementById("currentPollSection").style.display = 'block';
    setInterval(buildPage, 2000);
}

/**
 * This function is called when the admin page is loaded. If there isn't
 * a valid access token, the function displays the token (log-in) section
 * of the HTML. If there is a valid token, displays the currentPollSection,
 * calls refreshDevices(), and sets continous call to currentlyPlayingAdmin()
 * every second.
 * 
 * @return {void}
 */
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
			intervalId = setInterval(currentlyPlayingAdmin, 1000);
        }
    }
}

/**
 * This function handles the Authorization Redirect and generates
 * an access_token.
 * 
 * @return {void}
 */
function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri);
}

/**
 * This function gets the authorization code from the current URL's query string
 * 
 * @returns {string} authorization code
 */
function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}

/**
 * This function builds the Spotify authorization URL and uses that
 * URL to redirect to the Spotify authorization screen given the
 * inputted password matches.
 * 
 * @return {void}
 */
function requestAuthorization(){
    adminPassword = document.getElementById("adminPassword").value;

    if ( adminPassword == "Edward Nigma") {
        let url = AUTHORIZE;
        url += "?client_id=" + client_id;
        url += "&response_type=code";
        url += "&redirect_uri=" + encodeURI(redirect_uri);
        url += "&show_dialog=true";
        url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
        window.location.href = url; // Show Spotify's authorization screen
    }
}

/**
 * This function fetches an access token from the Spotify API by making
 * a POST request to the authorization API with the authorization code
 * and client credentials.
 * 
 * @param {string} code - Authorization code from authorization grant
 */
function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}


/**
 * This function refreshes an expired access token by making a POST request
 * to the authorization API with the refresh token and client credentials.
 *
 * @return {void}
 */
function refreshAccessToken() {
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

/**
 * This function sends a POST request to the Spotify authorization API
 * with the provided request body, and sets the appropriate headers for
 * authentication and content type. Also sets a callback function to
 * handle the response.
 *
 * @param {string} body - The request body to send to the API.
 * @return {void}
 */
function callAuthorizationApi(body) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}

/**
 * This function handles the response from the Spotify authorization API
 * after making a POST request to it. If the response indicates success
 * (i.e. a 200 status code), parses the response body to extract the access
 * and refresh tokens and saves them to localStorage. Also calls the 
 * onPageLoad function. If the response indicates an error, logs the
 * response and displays an alert with the response text.
 *
 * @return {void}
 */
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

/**
 * This function sends an HTTP request to the specified URL using the
 * provided HTTP method and body, and calls the specified callback
 * function with the response data.
 * 
 * @param {string} method - The HTTP method to use for the request (e.g., "GET", "POST", "PUT", "DELETE").
 * @param {string} url - The URL to which the request should be sent.
 * @param {Object} body - The body of the request, as an object to be converted to JSON.
 * @param {function} callback - The function to be called with the response data when the request is complete.
 * @return {void}
 */
function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.send(body);
    xhr.onload = callback;
}

/**
 * Handles the response of an API call by checking the response status
 * and taking appropriate action. If the status is 200, it logs the
 * response text and waits for 2 seconds before calling the 
 * currentlyPlayingAdmin function. If the status is 204, it waits 
 * for 2 seconds before calling the currentlyPlayingAdmin function.
 * If the status is 401, it calls the refreshAccessToken function.
 * Otherwise, it logs the response text and shows an alert with the response text.
 * 
 * @return {void}
 */
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

/**
 * This function is only called from the admin page and sends a GET request
 * to the Spotify API to get the current playback status and track
 * information for the authenticated user's Spotify account, specifically
 * for the US market. It then calls the handleCurrentlyPlayingResponseAdmin()
 * function to handle the API's response.
 * 
 * @return {void}
 */
function currentlyPlayingAdmin() {
    callApi( "GET", PLAYER + "?market=US", null, handleCurrentlyPlayingResponseAdmin );
}

/**
 * This function is only called from the admin page. This function updates
 * the currently playing song image, title, and artist on the admin page
 * and also updates the Firebase realtime database with this information
 * as well as the song id and timestamp info. The function also checks if
 * a vote has already been cast. If a vote has been cast, it deactivates
 * the buttons. If a ne song has started, it reactivates the buttons'
 * functionalities.
 * 
 * @return {void}
 */
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

/**
 * This function builds the general user page. It calls buildSongs() to 
 * build each of the songs on the UI while checking if the user has already
 * voted or not. If they have, it deactivates the buttons. If they haven't
 * voted or if it's a new song, it reactivates the buttons.
 * 
 * @return {void}
 */
function buildPage() {
    buildSongs();
    if ( sessionStorage.getItem("lastvotedId") != null && currentSongId == sessionStorage.getItem("lastvotedId") ) {
        document.querySelectorAll('.button').forEach(function(element) {
            element.classList.add('grey');
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

/**
 * This function gets the song information from the Firebase realtime database
 * and updates the songs on the general user HTML page with the song details 
 * and vote counts. If the song has 5 or less seconds left, of if the next
 * song has been playing for 2 seconds or less, make the songs appear blank.
 * 
 * @return {void}
 */
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

/**
 * This function is only called from the admin page and makes an API
 * call to retrieve the next four songs in the queue. If the API call
 * is successful, calls the handleNextFourSongsResponseAdmin function.
 * 
 * @return {void}
 */
function nextFourSongsAdmin(){
    callApi( "GET", QUEUE, null, handleNextFourSongsResponseAdmin );
}

/**
 * This function updates the admin page HTML with the song details of
 * the next songs in the queue. (It skips the first song at index 0 
 * since Spotify's shuffle will occassionally keep the same song
 * at index 0 after reshuffling)
 * 
 * @return {void}
 */
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

/**
 * This function is only called on the admin page.
 * This function makes a call to the current playback state API to retrieve
 * information used in building the timestamp progress bar on the admin page
 * by calling handleUpdateProgressResponseAdmin() which also handles the
 * winning song.
 * 
 * @return {void}
 */
function updateProgressAdmin() {
	callApi( "GET", PLAYER, null, handleUpdateProgressResponseAdmin );
}

/**
 * This function builds the progress bar and calls 
 * getWinningColor(winnerToQueue) to queue the winner once the song's
 * progress reaches less than 5 seconds left.
 */
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

/**
 * This function makes a POST request to the Queue API to queue the
 * first song so it will be played next.
 * 
 * @return {void}
 */
function songOneToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songOneId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
	setTimeout(reshuffleSongs(), 2000);
}

/**
 * This function makes a POST request to the Queue API to queue the
 * second song so it will be played next.
 * 
 * @return {void}
 */
function songTwoToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songTwoId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

/**
 * This function makes a POST request to the Queue API to queue the
 * third song so it will be played next.
 * 
 * @return {void}
 */
function songThreeToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songThreeId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

/**
 * This function makes a POST request to the Queue API to queue the
 * fourth song so it will be played next.
 * 
 * @return {void}
 */
function songFourToQueue() {
    callApi( "POST", QUEUE + "?uri=spotify:track:" + songFourId, null, handleApiResponse );
    //waits 2 seconds to make sure queue api call goes through first
    setTimeout(reshuffleSongs(), 2000);
}

/**
 * This function makes a PUT request to the Shuffle API endpoint to set
 * the state of shuffle to True.
 * 
 * @return {void}
 */
function shuffleTrue() {
	callApi( "PUT", SHUFFLE + "?state=true", null, handleApiResponse );
}

/**
 * This function makes a PUT request to the Shuffle API endpoint to set
 * the state of shuffle to False.
 * 
 * @return {void}
 */
function shuffleFalse() {
	callApi( "PUT", SHUFFLE + "?state=false", null, handleApiResponse );
}

/**
 * This function clears the continous calling of currentlyPlayingAdmin()
 * first to avoid interferring functions/API requests. Then, this function
 * sets shuffle to false and back to true (after 1 second to ensure Spotify
 * has time to recieve the request to set to false first). Then, sets
 * currentlyPlayingAdmin() to continuously call every 1 second again.
 * 
 * @return {void}
 */
function reshuffleSongs() {
    clearInterval(intervalId); //cancel the continuous updating of currentlyPlaying()
	shuffleFalse();
	//Uses setTimeout to wait 1000ms (1 second) before setting shuffle back to true
	//This is to ensure spotify has enough time to recieve the request and change the setting
	setTimeout(shuffleTrue, 1000);

    //restart continuous currentlyPlaying()
    intervalId = setInterval(currentlyPlayingAdmin, 1000);
}