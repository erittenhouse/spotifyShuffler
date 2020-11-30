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
    let redirectResponse = 'https://accounts.spotify.com/authorize?response_type=code&client_id=' + 'b817214b1ce74e28844cd890f5a050a3' +
                (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent(redirectURI) + '&state=' + state;
    
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
    var code = (req.query.code != null) ? req.query.code : null;  // if req.query.code is not null, code = req.query.code else null
    var state = (req.query.state != null) ? req.query.state : null;  // if req.query.state is not null, state = req.query.state else null

    console.log('Code: ' + code);
    console.log('State: ' + state);

    async function getAuthToken() { 
        const request = fetch('https://accounts.spotify.com/api/token', {
            method: 'POST', 
            headers: { 
                'Authorization': 'Basic ' + (new Buffer.from(clientId + ':' + clientSecret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stringify({
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirectURI
            })
        });
        let response = await request;
        let token = await response.json();
        console.log('Access_Token: ' + token.access_token);
        console.log('Expires in: ' + token.expires_in);
        return token;
    };

    getAuthToken();
    res.send('test');
});

app.listen(port, () => {
    console.log(`Server listening at ${port}...`)
})
