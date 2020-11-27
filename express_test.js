const fetch = require('node-fetch')
const urllib = require('url')
const express = require('express');
const app = express();
const redirectURI = 'http://localhost:5000/test-form.html';
const port = 5000;
const bodyParser = require("body-parser");
const { stringify } = require('querystring');
var options = { root: __dirname };

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname))

// app.post('/login', (req, res) => {
//     var scopes = 'playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative';
//     var redirectResponse = 'https://accounts.spotify.com/authorize?response_type=code&client_id=' + 'b817214b1ce74e28844cd890f5a050a3' +
//         (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent(redirectURI);
//     axios.get(redirectResponse)
//         .then(function (response) {
//             console.log(response);
//             res.redirect(redirectResponse);
//         });
// }); 

app.get('/', (req, res) => {
    res.sendFile('/index.html', options)
})

// this is the one that I'm using to test, the above one is the one that actually works
app.get('/login', (req, res) => {
    var redirectURI = 'http://localhost:5000/test-form.html';
    let scopes = 'playlist-modify-private playlist-modify-public playlist-read-private playlist-read-collaborative';
    let redirectResponse = 'https://accounts.spotify.com/authorize?response_type=code&client_id=' + 'b817214b1ce74e28844cd890f5a050a3' +
                (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent(redirectURI);
    fetch(redirectResponse)
    res.redirect(redirectResponse);
});

app.get('/test-form*', (req, res) => {
    console.log('app.get testform')
    var code = (req.query.code != null) ? req.query.code: null; // if req.query.code is not null, code = req.query.code else null
    var state = (req.query.state != null) ? req.query.state: null;

    console.log(req);
    console.log('state: ' + String(state));
    console.log('code: ' + String(code));
    res.sendFile('/test-form.html');
});

app.listen(port, () => {
    console.log(`Server listening at ${port}...`)
})
