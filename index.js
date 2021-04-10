const fetch = require('node-fetch');
const express = require('express');
const { stringify } = require('querystring');

const creds = require('./js/credentials.js')
const clientId = creds.clientId;
const clientSecret = creds.clientSecret;
const redirectURI = 'http://localhost:5000/shuffle/';
var options = { root: __dirname };

const app = express();
const port = 5000;
const bodyParser = require("body-parser");
const { response } = require('express');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname))


var playlists = [];  // array of playlists 


// helper function to generate random string.
var generateRandomString = function(length) { 
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    };

    return text;
};


// main page
app.get('/', (req, res) => {
    res.sendFile('/html/index.html', options)
});


// login page - triggered on click of button, redirects to spotify then goes to /shuffle (b/c /shuffle is the redirect URI)
app.get('/login', (req, res) => {
    var state = generateRandomString(16);
    console.log(state);
    var stateKey = 'spotify_auth_state';
    console.log(stateKey);
    res.cookie(stateKey, state);

    let scopes = 'playlist-modify-private playlist-modify-public playlist-read-private playlist-read-collaborative';
    
    res.redirect('https://accounts.spotify.com/authorize?' + 
        stringify({
            response_type: 'code',
            client_id: clientId, 
            client_secret: clientSecret,
            scope: scopes,
            redirect_uri: redirectURI,
            state: state
        }));
});


// main page. Has the shuffle button and sends the access token, etc. to spotify backend
app.get('/shuffle', (req, res) => {
    res.sendFile('/html/shuffle.html', options)

    // this used to go in the get endpoint
    playlists = []  // list for containing user playlists
    var code = (req.query.code != null) ? req.query.code : null;  // if req.query.code is not null, code = req.query.code else null
    var state = (req.query.state != null) ? req.query.state : null;  // if req.query.state is not null, state = req.query.state else null

    async function getAuthData () {   // function that returns spotify API authorization JSON data
        var accessReq = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST', 
            headers: { 
                'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectURI
            })
        });
        var accessJson = await accessReq.json();
        return accessJson;
    };

    async function getUserData(accessData) { 
        tokens = {
            'access_token': accessData.access_token,
            'refresh_token': accessData.refresh_token,
            'expires_in': accessData.expires_in
        };

        var userReq = await fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        var userJson = await userReq.json();
        return [userJson, tokens];
    };

    // recursive function used to get playlists until the end of the user's list of playlists
    async function getPlaylistData(userDataAndTokenList, offset) { 
        userId = userDataAndTokenList[0].id
        accessToken = userDataAndTokenList[1].access_token

        url = `https://api.spotify.com/v1/me/playlists?offset=${offset}`
        console.log(`offset: ${offset}`);
        console.log(url);
        var playlistReq = await fetch(url, {
            method: 'GET', 
            headers: { 
                'Authorization': `Bearer ${accessToken}`
            },
        });
        
        playlistJson = await playlistReq.json();
        return playlistJson;
    };

    async function addToList(userDataAndTokenList, numPlaylistsSoFar) { 
        var playlistJson = await getPlaylistData(userDataAndTokenList, numPlaylistsSoFar);
        playlistItems = playlistJson.items;
        for (i = 0; i < playlistItems.length; i++) {
            playlists.push(playlistItems[i]);
        };
    };

    async function main() { 
        var accessData = await getAuthData();
        var userDataAndTokenList = await getUserData(accessData);
        var playlistJson = await getPlaylistData(userDataAndTokenList, 0);
        console.log(playlistJson)

        numPlaylists = playlistJson.total;
        while (playlists.length < numPlaylists) {
            console.log('Playlists length before add: ', playlists.length)
            await addToList(userDataAndTokenList, playlists.length);
            console.log('Playlists length after add: ', playlists.length)
        };

        playlists.forEach(playlist => console.log(playlist.name));

        console.log('playlists length: ', playlists.length);
    };

    main();

});



app.listen(port, () => {
    console.log(`Server listening at ${port}...`)
})



async function getPlaylistData(tokens, offset) { 
    accessToken = tokens.access_token;

    url = `https://api.spotify.com/v1/me/playlists?offset=${offset}`
    console.log(`offset: ${offset}`);
    console.log(url);
    var playlistReq = await fetch(url, {
        method: 'GET', 
        headers: { 
            'Authorization': `Bearer ${accessToken}`
        },
    });
    
    playlistJson = await playlistReq.json();
    return playlistJson;
};


async function addToList(userDataAndTokenList, numPlaylistsSoFar) { 
    var playlistJson = await getPlaylistData(userDataAndTokenList, numPlaylistsSoFar);
    playlistItems = playlistJson.items;
    for (i = 0; i < playlistItems.length; i++) {
        playlists.push(playlistItems[i]);
    };
};


async function getPlaylistList(clientId, clientSecret) {
    console.log('getPlaylistList() called...');

    playlists = []  // list for containing user playlists
    var code = (req.query.code != null) ? req.query.code : null;  // if req.query.code is not null, code = req.query.code else null
    var state = (req.query.state != null) ? req.query.state : null;  // if req.query.state is not null, state = req.query.state else null

    // accessing authorization tokens
    var accessReq = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST', 
        headers: { 
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectURI
        })
    });
    var accessJson = await accessReq.json();

    // accessing user data
    tokens = {
        'access_token': accessJson.access_token,
        'refresh_token': accessJson.refresh_token,
        'expires_in': accessJson.expires_in
    };
    var userReq = await fetch('https://api.spotify.com/v1/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokens.access_token}`
        }
    });
    var userJson = await userReq.json();

    var playlistJson = await getPlaylistData(tokens, 0);
    numPlaylists = playlistJson.total;
    while (playlists.length < numPlaylists) {
        await addToList(tokens, playlists.length);
    };

    for (i=0; i<playlists.length; i++) {
        console.log(playlists[i].name);
    };
};