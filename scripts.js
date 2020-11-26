const axios = require('axios');


function getUserId() {
    axios.get('https://api.spotify.com/v1/me')
        .then(function (response) {
            console.log(response);
        });
};