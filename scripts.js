async function getPlaylistList() {
    // TODO: require() not working
    const creds = require('./credentials.js');
    const clientId = creds.clientId;
    const clientSecret = creds.clientSecret;

    async function getPlaylistData(tokens, offset) { 
        accessToken = tokens.access_token

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

    playlists = []  // list for containing user playlists
    // var code = (req.query.code != null) ? req.query.code : null;  // if req.query.code is not null, code = req.query.code else null
    // var state = (req.query.state != null) ? req.query.state : null;  // if req.query.state is not null, state = req.query.state else null

    // accessing authorization tokens
    var accessReq = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST', 
        headers: { 
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: stringify({
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