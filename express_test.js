const axios = require('axios')
const urllib = require('url')
const express = require('express');
const app = express();

const port = 5000;
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(__dirname))

var options = { root: __dirname };
const redirectURI = 'http://localhost:5000/test-form.html';

function getFormattedUrl(req) {
    return urllib.format({
        protocol: req.protocol,
        host: req.hostname
    });
};

app.post('/login', (req, res) => {
    var scopes = 'user-read-private user-read-email';
    var redirectResponse = 'https://accounts.spotify.com/authorize?response_type=code&client_id=' + 'b817214b1ce74e28844cd890f5a050a3' +
        (scopes ? '&scope=' + encodeURIComponent(scopes) : '') + '&redirect_uri=' + encodeURIComponent(redirectURI)
    
    axios.get(redirectResponse)
        .then(function (response) {
            console.log(response);
        })
    res.redirect(redirectResponse)

    
    /* var url = getFormattedUrl(res)
    console.log(url)
    var accessCode = new URLSearchParams(url.search).get('code');
    console.log(accessCode)

    const data = {
        grant_type: 'authorization_code', 
        code: accessCode,
        redirect_uri: redirectURI
    };
    axios.post('https://accounts.spotify.com/api/token', data);
    console.log('axios request sent') */

});

app.use('/test-form?code=*', (req, res) => {
    console.log('accessed');
});

app.get('/test-form', (req, res) => {
    res.sendFile('/test-form.html', options)
});

app.get('/', (req, res) => {
    res.sendFile('/test.html', options)
})

app.listen(port, () => {
    console.log(`Server listening at ${port}...`)
})
