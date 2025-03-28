document.addEventListener('DOMContentLoaded', async () => {
    let CLIENT_ID = '';
    let CLIENT_SECRET = '';
    let currentArtistId = null; // store last searched artist to prevent unnecessary refreshes
   
   
    // getting spotify credentials from config.json  
    async function fetchSpotifyCredentials() {
        try {
            const response = await fetch('config.json');
            const data = await response.json(); // converts response to JSON
            CLIENT_ID = data.spotifyKey.CLIENT_ID;  // storing client id
            CLIENT_SECRET = data.spotifyKey.CLIENT_SECRET; // storing client secret
            console.log("Client ID and Secret Loaded"); // debugging check
        } catch (error) {
            console.error('Error fetching Spotify credentials:', error); // if fetching fails
        }
    }

    // makes sure credentials are loaded before proceeding
    await fetchSpotifyCredentials();

    // getting access token from the API
    async function getAccessToken() {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            console.error("Spotify credentials not loaded yet.");
            return null;
        }

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET), // encoding credentials
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch access token');
            }

            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

   
async function searchArtist(query) {
    const token = await getAccessToken();

    if (!token) {
        console.log("No token available");
        return;
    }

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=1`;

    try {
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch artist");
        }

        const data = await response.json();
        const artist = data.artists.items[0];

        if (!artist) {
            console.log("Artist not found");
            document.getElementById("artistInfo").style.display = "none"; // hides if no artist
            return;
        }

        console.log(`Found artist: ${artist.name}`);

        // Display artist info
        const artistImage = document.getElementById("artistImage");
        artistImage.src = artist.images.length ? artist.images[0].url : "default.jpg"; // if no image, default.jpg
        artistImage.style.display = "block"; // Show image if found

        document.getElementById("artistName").textContent = artist.name;
        document.getElementById("artistInfo").style.display = "flex"; // shows entire section

        // fetch and displays top tracks
        await getArtistTopTracks(artist.id, token, artist.name);

    } catch (error) {
        console.error(error);
    }
}

    document.getElementById('artistForm').addEventListener('submit', async function(event) {
    event.preventDefault();
   
    const userInput = document.querySelector('.artistInput').value.trim();
    const card = document.querySelector('.card');

    if (userInput) {
        card.style.display = "block"; // card displayed after input provided
        await searchArtist(userInput); // fetches artist data
    } else {
        card.style.display = "none"; // Hide if input is empty
        console.log("Please enter an artist's name.");
    }
});
   


    async function getArtistTopTracks(artistId, token, artistName) {
        const url = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`;

        try {
            const response = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch, try again");
            }

            const data = await response.json();
            displayTopTracks(artistName, data.tracks);
        } catch (error) {
            console.error(error);
        }
    }
   
    function displayTopTracks(artistName, tracks) {
        const tableBody = document.querySelector("#artistTable tbody");

        tableBody.innerHTML = ""; // clear past results

        if (tracks.length > 0) {
            updateSpotifyPlayer(tracks[0].id); // shows the first song on player
        }

        tracks.slice(0, 5).forEach(track => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${artistName}</td>
                <td class="trackName" data-track-id="${track.id}">${track.name}</td>
                <td>${track.popularity}</td>
            `;
            tableBody.appendChild(row);
        });

        // event listeners to switch the Spotify player when u click a song
        document.querySelectorAll(".trackName").forEach(item => {
            item.addEventListener("click", function () {
                const trackId = this.getAttribute("data-track-id");
                updateSpotifyPlayer(trackId);
            });
        });
    }


    // updates spotify player
    function updateSpotifyPlayer(trackId) {
        const spotifyEmbed = document.getElementById("spotifyEmbed");
        spotifyEmbed.src = `https://open.spotify.com/embed/track/${trackId}`;
        document.querySelector(".spotifyCard").style.display = "block"; // Show card when a song is selected
    }



    // event listener for form
    document.getElementById('artistForm').addEventListener('submit', function (event) {
        event.preventDefault(); // no form refresh

        const userInput = document.querySelector('.artistInput').value; // gets user's input value
        if (userInput) {
            searchArtist(userInput); // call searchArtist with the user's input
        } else {
            console.log("Please enter an artist's name.");
        }
    });
});
