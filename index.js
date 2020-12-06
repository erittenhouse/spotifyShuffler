const fetch = require('node-fetch');
const express = require('express');
const { stringify } = require('querystring');

const creds = require('./credentials.js')
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
    res.sendFile('/html_css/index.html', options)
})

// login page - triggered on click of button, redirects to spotify then goes to /shuffle (b/c /shuffle is the redirect URI)
app.get('/login', (req, res) => {
    var state = generateRandomString(16);
    var stateKey = 'spotify_auth_state';
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
    playlists = []
    var code = (req.query.code != null) ? req.query.code : null;  // if req.query.code is not null, code = req.query.code else null
    var state = (req.query.state != null) ? req.query.state : null;  // if req.query.state is not null, state = req.query.state else null

    const getAuthToken = async () => { 
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
        var accessJson = accessReq.json();
        return accessJson;
    };

    var access = getAuthToken();  // returns Promise object
    access.then( async (accessJson) => {
        tokens = {
            'access_token': accessJson.access_token,
            'refresh_token': accessJson.refresh_token,
            'expires_in': accessJson.expires_in
        }
        console.log(tokens);

        var userIdReq = await fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        })
        var userIdJson = userIdReq.json();
        return [tokens, userIdJson]
    } ).then ( async (tokensAndId) => {
        access = tokensAndId[0].access_token
        userId = tokensAndId[1] 

        var playlistReq = await fetch('https://api.spotify.com/v1/me/playlists', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${access}`
            }
        }).then( playlistReq => playlistReq.json() )
        .then( playlistJson => console.log(playlistJson) )  // playlists contained in playlistJson.items

    } )
    // token.then( (response) => console.log(response) )  // when Promise is resolved, return the JSON
        /* .then( (responseJson) => [responseJson.access_token, responseJson.refresh_token, responseJson.expires_in] )
        .then( async (responseTokens) => { 
            console.log('Access Token: ' + responseTokens[0])
            console.log('Refresh Token: ' + responseTokens[1])

            var idReq = await fetch('https://api.spotify.com/v1/me', {
                method: 'GET', 
                headers: {
                    'Authorization': 'Bearer ' + responseTokens[0]
                }
            })
         } );
        .then( async (responseJson) => { 
            console.log(responseJson);
            const userData = await fetch('https://api.spotify.com/v1/me', {
                method: 'GET', 
                headers: {
                    'Authorization': 'Bearer ' + responseJson.access_token
                }
            });
            return userData;
        }) 
        .then( userData => console.log(userData.json()))*/
});

app.listen(port, () => {
    console.log(`Server listening at ${port}...`)
})
