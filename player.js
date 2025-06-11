let audioElement = new Audio();

const controllerProgress = document.getElementById('controller-progress');
const controllerTime = document.getElementById('controller-time');
const progress = document.getElementById('controller-progress');
const likeButton = document.getElementById('controller-like-btn'); // Get the like button
const likeIcon = document.getElementById('like-icon'); // Get the like icon

function updateProgress() {
    const val = (progress.value - progress.min) / (progress.max - progress.min) * 100;
    progress.style.setProperty('--progress-value', `${val}%`);
}
progress.addEventListener('input', updateProgress);
updateProgress();

audioElement.addEventListener('play', () => {
    controller.playPauseIcon.classList.remove('bi-play-fill');
    controller.playPauseIcon.classList.add('bi-pause-fill');
    isPlaying = true;
    updateLikeButtonState(); // Update like button when song plays
});
audioElement.addEventListener('pause', () => {
    controller.playPauseIcon.classList.remove('bi-pause-fill');
    controller.playPauseIcon.classList.add('bi-play-fill');
    isPlaying = false;
});

let currentAlbum = null;
let currentSongIndex = 0;
let isPlaying = false;
let playlist = []; 
let playlistIndex = 0;
let likedSongs = JSON.parse(localStorage.getItem('likedSongs')) || []; 


function saveLikedSongs() {
    localStorage.setItem('likedSongs', JSON.stringify(likedSongs));
}


function addLikedSong(song) {
    // Check if the song is already liked to prevent duplicates
    if (!likedSongs.some(s => s.path === song.path)) {
        // Ensure song has albumArt property for consistency
        if (!song.albumArt) {
            song.albumArt = "https://placehold.co/50x50/333333/FFFFFF?text=No+Art";
        }
        likedSongs.push(song);
        saveLikedSongs();
        renderLikedSongs(); // Re-render liked songs list
        updateLikeButtonState(); // Update the like button state
    }
}

// Function to remove a song from liked songs
function removeLikedSong(songPath) {
    likedSongs = likedSongs.filter(s => s.path !== songPath);
    saveLikedSongs();
    renderLikedSongs(); // Re-render liked songs list
    updateLikeButtonState(); // Update the like button state
}

// Function to check if a song is liked
function isSongLiked(songPath) {
    return likedSongs.some(s => s.path === songPath);
}

// Function to update the like button icon and class based on current song
function updateLikeButtonState() {
    const currentSongPath = audioElement.src.replace(window.location.origin + '/', '');
    if (isSongLiked(decodeURIComponent(currentSongPath))) {
        likeIcon.classList.remove('bi-heart');
        likeIcon.classList.add('bi-heart-fill');
        likeButton.classList.add('liked');
    } else {
        likeIcon.classList.remove('bi-heart-fill');
        likeIcon.classList.add('bi-heart');
        likeButton.classList.remove('liked');
    }
}

// Event listener for the like button
if (likeButton) {
    likeButton.addEventListener('click', () => {
        const currentSongPath = audioElement.src.replace(window.location.origin + '/', '');
        let foundSong = allSongs.find(song => song.path === decodeURIComponent(currentSongPath));

        // If not found in allSongs, try to find in bhaktiSongs
        if (!foundSong) {
            foundSong = bhaktiSongs.find(song => song.path === decodeURIComponent(currentSongPath));
        }
        if (!foundSong) {
            foundSong = overseasSongs.find(song => song.path === decodeURIComponent(currentSongPath));
        }

        if (!foundSong) {
            foundSong = songs.find(song => song.path === decodeURIComponent(currentSongPath));
        }
        




        if (foundSong) {
            if (isSongLiked(foundSong.path)) {
                removeLikedSong(foundSong.path);
            } else {
                addLikedSong(foundSong);
            }
        } else {
            console.warn("No current song to like/unlike.");
        }
    });
}


// --- START: ADD THESE EVENT LISTENERS FOR PROGRESS BAR ---

// 1. Listen for time updates on the audio element to move the progress bar
audioElement.addEventListener('timeupdate', () => {
    const duration = audioElement.duration;
    const currentTime = audioElement.currentTime;

    // Check if duration is a valid number to prevent NaN issues
    if (!isNaN(duration) && duration > 0) {
        const progress = (currentTime / duration) * 100;

        controllerProgress.value = progress; // Update the actual slider value
        controllerProgress.style.setProperty('--progress-value', `${progress}%`); // Update the CSS variable for the gradient

        // Update time display
        controllerTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
    } else {
        // Fallback for when duration is not available yet (e.g., audio not loaded)
        controllerProgress.value = 0;
        controllerProgress.style.setProperty('--progress-value', '0%');
        controllerTime.textContent = '0:00 / 0:00';
    }
});

// 2. Listen for user interaction on the progress bar (seeking)
controllerProgress.addEventListener('input', () => {
    const duration = audioElement.duration;
    if (!isNaN(duration) && duration > 0) {
        const seekTime = (controllerProgress.value / 100) * duration;
        audioElement.currentTime = seekTime;
        // Immediately update the CSS variable when seeking for smooth visual feedback
        controllerProgress.style.setProperty('--progress-value', `${controllerProgress.value}%`);
    }
});

// 3. Listen for when audio metadata is loaded (to get total duration)
audioElement.addEventListener('loadedmetadata', () => {
    if (!isNaN(audioElement.duration)) {
        controllerTime.textContent = `0:00 / ${formatTime(audioElement.duration)}`;
    } else {
        controllerTime.textContent = '0:00 / 0:00';
    }
});


function loadAndPlaySong(songSrc, songTitle, songArtist, albumArtSrc) {
    audioElement.src = songSrc;
    controllerProgress.value = 0;
    controllerProgress.style.setProperty('--progress-value', '0%');
    controllerTime.textContent = '0:00 / 0:00';
    audioElement.play();
}

// New function to load a song object or path and update UI
function loadSong(song) {
    if (typeof song === 'string') {
        audioElement.src = encodeURI(song);
    } else if (song && (song.path || song.src)) {
        audioElement.src = encodeURI(song.path || song.src);
    } else {
        console.error('Invalid song parameter to loadSong:', song);
        return;
    }
    controllerProgress.value = 0;
    controllerProgress.style.setProperty('--progress-value', '0%');
    controllerTime.textContent = '0:00 / 0:00';
    updateMusicControllerUI();
    updateLikeButtonState(); // Update like button when a new song is loaded
}

// New function to play the currently loaded song
function playCurrentSong() {
    if (audioElement.src) {
        audioElement.play().then(() => {
            isPlaying = true;
            updatePlayPauseIcon();
            updateLikeButtonState(); // Update like button when song plays
        }).catch(err => {
            console.error('Playback error in playCurrentSong:', err);
        });
    } else {
        console.warn('No song loaded to play in playCurrentSong');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    controllerProgress.value = 0;
    controllerProgress.style.setProperty('--progress-value', '0%');
    controllerTime.textContent = '0:00 / 0:00';
   
});

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}


function resetAlbumProgressBars(albumView) {
    if (!albumView) return;
    const progressBars = albumView.querySelectorAll('.song-progress');
    progressBars.forEach(pb => pb.value = 0);
}

function updateSongProgressBar(albumView, songIndex) {
    if (!albumView) return;
    const progressBars = albumView.querySelectorAll('.song-progress');
    if (progressBars[songIndex]) {
        progressBars[songIndex].value = 0; // This would need to be updated dynamically with timeupdate
    }
}

function addProgressBarListeners(albumView, songIndex) {
    // This function adds input listeners to specific song progress bars within album views
    // allowing seeking.
    if (!albumView) return;
    const songItems = albumView.querySelectorAll('.song-item');
    if (songItems[songIndex]) {
        const progressBar = songItems[songIndex].querySelector('.song-progress');
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                if (audioElement.duration) {
                    const seekTime = (audioElement.duration * e.target.value) / 100;
                    audioElement.currentTime = seekTime;
                }
            });
        }
    }
}

// Music controller UI elements references
const controller = {
    playPauseBtn: null,
    prevBtn: null,
    nextBtn: null,
    progressBar: null,
    timeDisplay: null,
    albumArt: null,
    songTitle: null,
    songArtist: null,
    playPauseIcon: null,
    likeBtn: null, // Added like button reference
    likeIcon: null // Added like icon reference
};

// Define albums and their songs with file paths
const albums = {
    animal: [
        "audio/Abrars Entry Jamal Kudu - Animal 128 Kbps.mp3",
        "audio/Saari Duniya Jalaa Denge - Animal 128 Kbps.mp3",
        "audio/Pehle Bhi Main - Animal 128 Kbps.mp3",
        "audio/Kashmir - Animal 128 Kbps.mp3",
        "audio/Haiwaan - Animal 128 Kbps.mp3",
        "audio/Arjan Vailly - Animal 128 Kbps.mp3",
        "audio/Papa Meri Jaan - Animal 128 Kbps.mp3",
        "audio/Satranga - Animal 128 Kbps.mp3",
        "audio/Hua Main - Animal 128 Kbps.mp3",
        "audio/Tabbar Brothers Unite.mp3",
        "audio/Salute The Champion.mp3",
        "audio/Roaring War Machine.mp3",
        "audio/Rifle Warning.mp3",
        "audio/Range Rover Entry.mp3",
        "audio/Nude Walk.mp3",
        "audio/Killing Jeeja.mp3",
        "audio/Heading To Scotland.mp3",
        "audio/Heading To Kill Jeeja.mp3",
        "audio/Aziz's Introduction.mp3",
        "audio/ANIMAL Meeting ANIMAL.mp3",
        "audio/Aatmanirbhar Bharat.mp3",
        "audio/ANIMAL Title Music.mp3",
        "audio/Alpha Male.mp3"
    ],
    master: [
        "audio/Chhoti Story - Vijay the Master 128 Kbps.mp3",
        "audio/Beat of Master - Vijay the Master 128 Kbps.mp3",
        "audio/Dhool Tash Baja Baja - Vijay the Master 128 Kbps.mp3",
        "audio/Master Coming - Vijay the Master 128 Kbps.mp3",
        "audio/Master Raid - Vijay the Master 128 Kbps.mp3",
        "audio/Quit Karna - Vijay the Master 128 Kbps.mp3",
        "audio/Roshini Se Bhar Utah - Vijay the Master 128 Kbps.mp3",
        "audio/Woh Muskaana Aakhon Ka - Vijay the Master 128 Kbps.mp3"
    ],
    bajrangi: [
        "audio/Chicken Kuk-Doo-Koo - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Bhar Do Jholi Meri - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Aaj Ki Party - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Zindagi Kuch Toh Bata - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Tu Jo Mila - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Tu Chahiye - Bajrangi Bhaijaan 128 Kbps.mp3",
        "audio/Selfie Le Le Re - Bajrangi Bhaijaan 128 Kbps.mp3"
    ],
    raone: [
        "audio/Bhare Naina - Ra-One 128 Kbps.mp3",
        "audio/Chammak Challo - Ra-One 128 Kbps.mp3",
        "audio/Comes The Light (Theme) - Ra-One 128 Kbps.mp3",
        "audio/Criminal - Ra-One 128 Kbps.mp3",
        "audio/Dildaara (Stand By Me) - Ra-One 128 Kbps.mp3",
        "audio/Im On (Theme) - Ra-One 128 Kbps.mp3",
        "audio/Jiya Mora Ghabraaye (The Chase) - Ra-One 128 Kbps.mp3",
        "audio/Right By Your Side - Ra-One 128 Kbps.mp3",
        "audio/Song Of The End (Theme) - Ra-One 128 Kbps.mp3"
    ],
    dabangg: [
        "audio/Tere Mast Mast Do Nain - Dabangg 128 Kbps.mp3",
        "audio/Munni Badnaam Hui Darling (Female) - Dabangg 128 Kbps.mp3",
        "audio/Humka Peeni Hai Peeni - Dabangg 128 Kbps.mp3",
        "audio/Dabangg Theme - Dabangg 128 Kbps.mp3",
        "audio/Chori Kiya Re Jiya (Male) - Dabangg 128 Kbps.mp3",
        "audio/Udd Udd Dabaang - Dabangg 128 Kbps.mp3"
    ],
    ready: [
        "audio/Character Dheela (Ishq Ke Naam) - Ready 128 Kbps.mp3",
        "audio/Meri Ada Bhi (Ishq Ne Mere) - Ready 128 Kbps.mp3",
        "audio/Humko Pyar Hua (Chal Chale) - Ready 128 Kbps.mp3",
        "audio/Dhinka Chika - Ready 128 Kbps.mp3"
    ],
    pushpaTherise: [
        "audio/Jaago Jaago Bakre - Pushpa - The Rise 128 Kbps.mp3",
        "audio/Saami Saami - Pushpa - The Rise 128 Kbps.mp3",
        "audio/Oo Bolega Ya Oo Oo Bolega - Pushpa - The Rise 128 Kbps.mp3",
        "audio/Eyy Bidda Ye Mera Adda - Pushpa - The Rise 128 Kbps.mp3",
        "audio/Srivalli - Pushpa - The Rise 128 Kbps.mp3"
    ],
    kgf2: [
        "audio/SpotiDownloader.com - Falak Tu Garaj Tu - Suchetha Basrur.mp3",
        "audio/SpotiDownloader.com - Mehabooba - Ananya Bhat.mp3",
        "audio/SpotiDownloader.com - Monster Song Clean Version (From _KGF Chapter 2 - Tamil_) - Ravi Basrur.mp3",
        "audio/SpotiDownloader.com - Toofan - Sandesh Datta Naik.mp3",
        "audio/SpotiDownloader.com - Sulthan - Brijesh Shandilya.mp3"
    ],
    pushpa2: [
        "audio/Dum Hai To Rok Ke Bata - Pushpa 2 The Rule 128 Kbps.mp3",
        "audio/Kaali Mahaa Kaali - Pushpa 2 The Rule 128 Kbps.mp3",
        "audio/Peelings - Pushpa 2 The Rule 128 Kbps.mp3",
        "audio/Angaaron - Pushpa 2 The Rule 128 Kbps.mp3",
        "audio/Pushpa Pushpa - Pushpa 2 The Rule 128 Kbps.mp3",
        "audio/KISSIK Song Pushpa 2 The Rule.mp3"
    ],
    sholay: [
        "audio/Yeh Dosti Hum Nahin (Happy Version - Sholay 128 Kbps.mp3",
        "audio/Title Music (Sholay) - Sholay 128 Kbps.mp3",
        "audio/Holi Ke Din (Dialogue - Sholay 128 Kbps (1).mp3",
        "audio/Haa Jab Tak Hai Jaan - Sholay 128 Kbps.mp3",
        "audio/Mehbooba Mehbooba Sholay 128 Kbps.mp3"
    ],
  
    leo: [
        "audio/Naa Ready.mp3",
        "audio/Leo Das Entry.mp3",
        "audio/Ratata.mp3",
        "audio/Lokiverse 2.0.mp3",
        "audio/Bloody Sweet.mp3",
        "audio/Glimpse of Harold Das.mp3",
        "audio/Glimpse of Antony Das.mp3",
        "audio/Badass.mp3"
    ],

    vikram : [
        "audio/Pathala Pathala.mp3",
        "audio/Vikram Title Track.mp3",
        "audio/Once Upon A Time.mp3",
        "audio/Rolex Theme (PenduJatt.Com.Se).mp3",
    ],

    rabnebanadijodi : [
        "audio/Dance Pe Chance.mp3",
        "audio/Tujh Mein Rab Dikhta Hai.mp3",
        "audio/Phir Milenge Chalte Chalte.mp3",
        "audio/Haule Haule.mp3",
        "audio/Dancing Jodi.mp3"
    ],

    desiboyz : [
        "audio/Allah Maaf Kare - Desi Boyz 128 Kbps.mp3",
        "audio/Make Some Noise For The Desi Boyz - Desi Boyz 128 Kbps.mp3"
    ],

    Jawan : [
        "audio/Zinda Banda.mp3",
        "audio/Not Ramaiya Vastavaiya - Jawan 128 Kbps (1).mp3",
        "audio/Jawan Title Track - Jawan 128 Kbps.mp3"
    ],

    Vaastav : [
        "audio/Vaastav Theme 2 - Vaastav The Reality 128 Kbps.mp3",
         "audio/Vaastav Theme 1 - Vaastav The Reality 128 Kbps.mp3",
          "audio/Har Taraf Hai Ye Shor - Vaastav The Reality 128 Kbps.mp3"
    ],

    yehjawanihaideewani : [
        "audio/Badtameez Dil - Yeh Jawaani Hai Deewani 128 Kbps.mp3",
        "audio/Ilahi - Yeh Jawaani Hai Deewani 128 Kbps.mp3",
         "audio/Dilliwaali Girlfriend - Yeh Jawaani Hai Deewani 128 Kbps.mp3",
          "audio/Balam Pichkari - Yeh Jawaani Hai Deewani 128 Kbps.mp3",
          "audio/Subhanallah - Yeh Jawaani Hai Deewani 128 Kbps.mp3"
    ]


};
const trendingSongs = {
    laalPari: {
        path: "audio/Laal Pari - Housefull 5 128 Kbps.mp3",
        albumId: "housefull5",
        albumArt: "https://i.ibb.co/WNxBJKCm/hq720.jpg",
        displayName: "Laal Pari", // Added displayName
        artist: "Yo Yo Honey Singh" 
    },
    ishqHai: {
        path: "audio/Ishq Hai - Mismatched Season 3 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/HTzVcvQH/maxresdefault.jpg",
        displayName: "Ishq Hai", // Added displayName
        artist: "Anurag Saikia" 
    },
    dilENadaan: {
        path: "audio/Dil E Nadaan - Housefull 5 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/r2MyM6xT/hq720-1.jpg",
        displayName: "Dil E Nadaan", // Added displayName
        artist: "Madhubanti Baghchi" 
    },
    chorBazari: {
        path: "audio/Chor Bazari Phir Se Bhool Chuk Maaf (pagalall.com).mp3",
        albumArt: "https://i.ibb.co/SDqVQPRL/Chor-Bazari-Phir-Se-Bhool-Chuk-Maaf-pagalall-com.webp",
        displayName: "Chor Bazari Phir Se Bhool Chuk Maaf", // Added displayName
        artist: "Pritam" 
    },
    uyiAmma: {
        path: "audio/SpotiDownloader.com - Uyi Amma - From _Azaad_ - Amit Trivedi.mp3",
        albumArt: "https://i.ibb.co/T9cvgcT/ab67616d0000b273ff602926eb81f594fc034034.jpg",
        displayName: "Uyi Amma", // Added displayName
        artist: "Amit Trivedi" 
    },
    namonamo: {
        path: "audio/01 - Namo Namo - SenSongsMp3.Co.mp3",
        albumArt: "https://i.ibb.co/21mLZQXw/hq720-2.jpg",
        displayName: "Namo Namo", // Added displayName
        artist: "Amit Trivedi" 
    },
    aayaReToofan: {
        path: "audio/Aaya Re Toofan - Chhaava 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/Lz1W1R8P/maxresdefault-1.jpg",
        displayName: "Aaya Re Toofan", // Added displayName
        artist: "A.R. Rehman" 
    },
    kabira: {
        path: "audio/Kabira - Yeh Jawaani Hai Deewani 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/N2R5gGW2/sddefault.jpg",
        displayName: "Kabira", // Added displayName
        artist: "Pritam" 
    },
    kaiseHua: {
        path: "audio/Kaise Hua - Kabir Singh 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/7tFTJRpP/maxresdefault-2.jpg",
        displayName: "Kaise Hua", // Added displayName
        artist: "Vishal Mishra" 
    },
    pehleBhiMain: {
        path: "audio/Pehle Bhi Main - Animal 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/VYQWszG7/sddefault-1.jpg",
        displayName: "Pehle Bhi Main", // Added displayName
        artist: "Vishal and Raj" 
    },

     huaMain: {
        path: "audio/Hua Main - Animal 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/VYQWszG7/sddefault-1.jpg",
        displayName: "Hua Main", // Added displayName
        artist: "Pritam  Chakraborty" 
    },
};

const Allsongs = {
    huaMain: {
        path: "audio/Hua Main - Animal 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/VYQWszG7/sddefault-1.jpg",
        displayName: "Hua Main", // Added displayName
        artist: "Raghav Chaitanya, Pritam" 
    },
    tharkiChokro: {
        path: "audio/Tharki Chokro - PK 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/PGr1kRjn/PK-pos ter-1.jpg",
        displayName: "Tharki Chokro", // Added displayName
        artist: "Unknown Artist" 
    },
    galatBaatHai: {
        path: "audio/Galat Baat Hai - Main Tera Hero 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
        displayName: "Galat Baat Hai (Main tera hero)", // Added displayName
        artist: "Swaroop Khan" 
    },
    palat: {
        path: "audio/Palat - Tera Hero Idhar Hai - Main Tera Hero 128 Kbps.mp3",
        albumArt: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
        displayName: "Palat - Tera Hero Idhar Hai (Main tera hero)", // Added displayName
        artist: "Arjit Singh" 
    },
    naaReady: {
        path: "audio/Naa Ready.mp3",
        albumArt: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
        displayName: "Naa Ready", // Added displayName
        artist: "Anirudh Ravichander" 
    },
    leoDasEntry: {
        path: "audio/Leo Das Entry.mp3",
        albumArt: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
        displayName: "Leo Das Entry", // Added displayName
        artist: "Anirudh Ravichander" 
    },
   shanivaarRaatiMainTeraHero: {
         path: "audio/Shanivaar Raati - Main Tera Hero 128 Kbps.mp3",
         albumArt: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
         displayName: "Shanivaar Rati (Main tera hero)",
         artist: "Arjit Singh"
         
   },
   terimerikahani : {
         path: "audio/Teri Meri Kahaani - Palak Muchhal Version - Gabbar Is Back 128 Kbps.mp3",
         albumArt: "https://upload.wikimedia.org/wikipedia/en/c/c7/Gabbar_is_back_first_look.jpg",
         displayName: "Teri Meri Kahani (Gabbar is Back)",
         artist: "Palak Mucchal"
   },
     
   shaan : {
        path: "audio/Janu Meri Jaan - Shaan 128 Kbps.mp3",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/9/94/Shaan_1980_poster.jpg",
        displayName: "Jaanu Meri Jaan (Shaan)",
         artist: "Mohammad Rafi, Kishore Kumar"
   },

   idiots :{
         path: "audio/Behti Hawa Sa Tha Woh - 3 Idiots 128 Kbps.mp3",
         albumArt: "https://cdn.prod.website-files.com/6169ea3dffbc473de935d4fc/6792ae827b25bc756d13efe2_Screenshot%202025-01-23%20at%203.03.35%E2%80%AFPM.png",
         displayName: "Behti Hawa Sa Tha Woh (3 idiots)",
         artist: "Shaan"
   },

   Taanguthake : {
         path: "audio/Taang Uthake - Housefull 3 128 Kbps.mp3",
         albumArt: "https://static.toiimg.com/thumb/msid-100727197,width-1070,height-580,imgsize-58436,resizemode-75,overlay-toi_sw,pt-32,y_pad-40/photo.jpg",
         displayName: "Taang Uthake (Housefull 3)",
         artist: "Sohali Sen, Mika Singh"
   },

   Fakeishq : {
          path: "audio/Fake Ishq - Housefull 3 128 Kbps.mp3",
         albumArt: "https://static.toiimg.com/thumb/msid-100727197,width-1070,height-580,imgsize-58436,resizemode-75,overlay-toi_sw,pt-32,y_pad-40/photo.jpg",
         displayName: "Fake Ishq (Housefull 3)",
         artist: "Kailash Kher"
   },

   chammo : {
        path: "audio/Chammo - Housefull 4 128 Kbps.mp3",
         albumArt: "https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/Housefull_4_poster.jpg/250px-Housefull_4_poster.jpg",
         displayName: "Chammo Chammo (Housefull 4)",
         artist: "Sukhwinder Singh"
   },

   housefull2 : {
         path: "audio/Anarkali Disco Chali (Remix) - Housefull 2 128 Kbps.mp3",
        albumArt: "https://m.media-amazon.com/images/I/91CAK3WbdsL._AC_UF350,350_QL50_.jpg",
        displayName: "Anarkali Disco Chali (Housefull 2)", // Added displayName
        artist: "Sajid-Wajid" 
   },
       
   veeradheera : {
         path: "audio/Veera Dheera.mp3",
        albumArt: "https://m.media-amazon.com/images/M/MV5BMTM3ZGUwYTEtZTI5NS00ZmMyLTk2YmQtMWU4YjlhZTI3NjRjXkEyXkFqcGc@._V1_.jpg",
        displayName: "Veera Dheera (Kalki)", // Added displayName
        artist: "Santosh Narayan",
   },

   orangrez : {
          path: "audio/O Rangrez - Bhaag Milkha Bhaag 128 Kbps.mp3",
        albumArt: "https://www.shazam.com/mkimage/image/thumb/Music221/v4/a0/2c/a2/a02ca25f-2d02-e296-0578-93a5b32b0adf/196872829877.jpg/1275x1275bb-60.webp",
        displayName: "O Rangrez (Bhaag Milkha Bhaag)", // Added displayName
        artist: "Shreya Ghoshal",
   },

   marco : {
        path: "audio/Marco Theme 1 - Marco (Hindi) 128 Kbps.mp3",
        albumArt: "https://m.media-amazon.com/images/M/MV5BNTVmNDVhMDEtNDMyNy00NTY0LWJkNzEtY2E5ZTVlZDRmYWY3XkEyXkFqcGc@._V1_.jpg",
        displayName: "Marco Theme 1 (Marco)", // Added displayName
        artist: "Ravi Basrur",
   },

   navrai: {
       path: "audio/Navrai Maajhi - English Vinglish 128 Kbps.mp3",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/6/6e/English_Vinglish_poster.jpg",
        displayName: "Navrai Maajhi (English Vinglish)", // Added displayName
        artist: "Sunidhi Chauhan",
   },

   Radhe: {
       path: "audio/Radhe Radhe - Dream Girl 128 Kbps.mp3",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/6/6e/Dream_Girl.png",
        displayName: "Radhe Radhe (Dream Girl)", // Added displayName
        artist: "Meet Bros",
   },

   noentry: {
       path: "audio/No Entry Ishq Di Galli Vich - No Entry 128 Kbps.mp3",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/0/01/No_Entry_poster.jpg",
        displayName: "Ishq Di Galli Vich - No Entry (No Entry)", // Added displayName
        artist: "Sonu Nigam",
   },

   Milnehaimujhseaayi: {
       path: "audio/Milne-Hai-Mujhse-Aayi-MassTamilan.io.mp3",
        albumArt: "https://upload.wikimedia.org/wikipedia/en/4/4f/Aashiqui_2.jpeg",
        displayName: "Milne-Hai-Mujhse-Aayi (Aashiqi 2)", // Added displayName
        artist: "Arjit singh",
   },

   haankehaan: {
       path: "audio/Haan Ke Haan - Maharaj 128 Kbps.mp3",
        albumArt: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmnch0mFZCSfP0JuXTgdx7P1tUTgGB-xvw3IaNPRXIXmVSXgX_AIMvLbZa8EZ3Sm6muAtcIQ",
        displayName: "Haan ke haan (Maharaj)", // Added displayName
        artist: "Shreya Ghoshal",
   },

   illumianti : {
        path: "audio/Illuminati (PenduJatt.Com.Se).mp3",
        albumArt: "https://i.ytimg.com/vi/tOM-nWPcR4U/maxresdefault.jpg",
        displayName: "Illuminati (Aavesham)", // Added displayName
        artist: "Dabzee",
   },

   seeti : {
    path: "audio/Seeti Maar-SenSongsMp3.Co.mp3",
        albumArt: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVDHX7MNS9rx3_Olnvb9raEr_AfvlLX8J_GPRQCwK1yB2YHKVB-wEH_1Oy4rukHG8Rvi7YKg",
        displayName: "Seeti Maar (DJ)", // Added displayName
        artist: "Rita",
   },

   hanuman : {
        path: "audio/Shree Hanuman Chalisa - 192Kbps-(Mr-Jat.in).mp3",
        albumArt: "https://s.saregama.tech/image/c/fh_200/8/63/46/hanuman-chalisa-1440_1721976967.jpg",
        displayName: "Hanuman Chalisa", // Added displayName
        artist: "Gulshan Kumar",
    },

      mortals : {
        path: "audio/Warriyo, Laura Brehm - Mortals (feat. Laura Brehm) [NCS Release].mp3",
        albumArt: "https://i.ytimg.com/vi/zFXl1sjTdms/maxresdefault.jpg",
        displayName: "Mortals", // 
        artist: "Warriyo, Laura Brehm",
    },

    


   
};

const trendingMashups = [
    {
        name: "vikram x jailer x leo x jawan",
        displayName: "Vikram X Jailer X Leo X Jawan Mashup",
        path: "audio/Vikram X Jailer X Leo X Jawan _ Mega Mashup _ DJ Dalal London _ Rajnikanth x SRK x Kamal H x Vijay.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/IaL_Vlvad98/maxresdefault.jpg",
        artist: "DJ Dalal London" 
    },
    {
        name: "nfshope",
        displayName: "NF's Hope Mashup",
        path: "audio/Aarambh Hai Prachand X NF s Hope I Beatzhacker Mashup I Instagram Viral Original.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/DoK2iKDCaMI/maxresdefault.jpg",
        artist: "Beatzhacker" 
    },
    {
        name: "animal x kgf",
        displayName: "Animal X KGF Mega Mashup",
        path: "audio/Animal X Kgf Mega Mashup – Bobby Deol X Yash X Ranbir Kapoor Mashup By DJ DALAL LONDON & VDJ Mahe.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/gT2dM0HEveg/maxresdefault.jpg",
        artist: "DJ Dalal London & VDJ Mahe" 
    },
    {
        name: "kgf vs rrr vs pushpa",
        displayName: "KGF vs RRR vs PUSHPA Mega Mashup",
        path: "audio/KGF vs RRR vs PUSHPA _ Mega Mashup _ DJ Dalal London _ Ram Charan Vs Allu Arjun Vs Yash Vs NTR.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/iNJLhbKWI70/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBxs3kUY6a7CJVj2nH7fs0g4ybVGg",
        artist: "DJ Dalal London" 
    },
    {
        name: "panga x arjan vailly",
        displayName: "Arjan Vailly X Panga Full Song",
        path: "audio/Arjan Vailly X Panga Full Song _ Bhupinder Babbal Yo Yo Honey Singh Diljit Dosanjh _ Raghav Malhotra.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/reMzwnJxhJE/maxresdefault.jpg",
        artist: "Various Artists" 
    },
    {
        name: "ishq hai x orangrez",
        displayName: "Ishq Hai X O Rangrez - Full Version",
        path: "audio/Ishq Hai X O Rangrez - Full Version.mp3",
        album: "Mega Mashup",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/zdsZE3bYto8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLApsa1VUkTV9HQlKvhtY4I-9NgoVw",
        artist: "Unknown Artist" 
    },
    
];

const bhaktiSongs = [
    {
        name: "Hanuman Chalisa",
        displayName: "Hanuman Chalisa",
        path: "audio/Shree Hanuman Chalisa - 192Kbps-(Mr-Jat.in).mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/DiTEqiEm_VU/hqdefault.jpg",
        artist: "Gulshan Kumar" 
    },
    {
        name: "Ram Siya Ram",
        displayName: "Ram Siya Ram",
        path: "audio/रामायण चौपाई _ Ramayan Chaupai _ सम्पूर्ण रामायण _ मंगल भवन अमंगल हारी __ Kumar Vishu __ Ram Katha.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i1.sndcdn.com/artworks-S2BgDFKwCzxZWdHi-ZqXd1Q-t500x500.jpg",
        artist: "Kumar vishnu"
    },

    {
         name: "Shree Krishna Sharanam Mamah",
        displayName: "Shree Krishna Sharanam Mamah",
        path: "audio/SpotiDownloader.com - Shree Krishna Sharanam Mamam - Anuradha Paudwal.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://c.saavncdn.com/353/Shree-Krishan-Sharanam-Mamah-1994-500x500.jpg",
        artist: "Anuradha Paudwal"
    },

     {
        
         name: "Navkar Mantra",
        displayName: "Navkar Mantra",
        path: "audio/SpotiDownloader.com - Navkar Mantra - Shailendra Bharti.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://pendujatt.com.se/uploads/album/navkar-mantra-one-hour-chanting.webp",
        artist: "Shailendra Bharti"
    },

     {
        
         name: "achyutam keshavam",
        displayName: "Achyutam keshavam",
        path: "audio/SpotiDownloader.com - Achutam Keshvam - Manisha Saini.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ibb.co/S94157n/Whats-App-Image-2025-05-30-at-02-15-39-6f20adab.jpg",
        artist: "Anuradha Paudwal"
    },

    {
        
         name: "Gayatri Manatra",
        displayName: "Gayatri Manatra",
        path: "audio/SpotiDownloader.com - Gayatri Mantra - Anuradha Paudwal.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://a10.gaanacdn.com/gn_img/albums/koMWQ7BKqL/oMWQ85d43q/size_m.jpg",
        artist: "Anuradha Paudwal"
    },

     {
        
         name: "sankat mochan naam tiharo",
        displayName: "Sankat mochan naam tiharo",
        path: "audio/Sankat Mochan Hanuman Ashtak - 192Kbps-(Mr-Jat.in).mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://s1.dmcdn.net/v/IUnAG1ZeKRDWYnlbr/x1080",
        artist: "Hariharan"
    },

     {
        
         name: "Shendur Lal Chadhayo",
        displayName: "Shendur Lal Chadhayo",
        path: "audio/SpotiDownloader.com - Shendur Laal Chadhayo (Aarti) - Ravindra Sathe.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://a10.gaanacdn.com/gn_img/albums/YoEWlwa3zX/EWlw9zwy3z/size_m.webp",
        artist: "Jatin-Lalit"
    },

     {
        
         name: "Tu mane bhagwan ek vardan aapi de",
        displayName: "Tu mane bhagwan ek vardan aapi de",
        path: "audio/Tu-Mane-Bhagwan.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ibb.co/gFSJhCdC/Whats-App-Image-2025-05-30-at-02-28-51-a27e4770.jpg",
        artist: "Unknown"
    },

     {
        
         name: "karupur gauravam",
        displayName: "Karupur gauravam",
        path: "audio/Karpur Gauram (feat. Supati Ranjan, Nirali Kartik, Vikas Parikh) 4.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/9NK7OTKEJvc/maxresdefault.jpg",
        artist: "Supati Ranjan, Nirali Kartik, Vikas Parikh"
    },

     {
        
         name: "shiv tandav stotram",
        displayName: "Shiv tandav stotram",
        path: "audio/Shiv Tandav Stotram (PenduJatt.Com.Se).mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://static.qobuz.com/images/covers/98/88/0190374418898_600.jpg",
        artist: "Shankar Mahadevan"
    },

     {
        
         name: "adharam madhuram",
        displayName: "Adharam madhuram",
        path: "audio/SpotiDownloader.com - Adharam Madhuram - Madhuraa Bhattacharya.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ibb.co/R40TNDNV/Whats-App-Image-2025-05-30-at-02-40-12-adb7750d.jpg",
        artist: "Anuradha Paudwal"
    },

     {
        
         name: "Deva Shree Ganesha",
        displayName: "Deva Shree Ganesha",
        path: "audio/Deva Shree Ganesha - Agneepath 320 Kbps.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/eGHv7mXEpHk/sddefault.jpg?v=66e50ea0",
        artist: "Ajay-Atul"
    },

     {
        
         name: "Mourya Mourya re",
        displayName: "Mourya Mourya re",
        path: "audio/Mourya Re - Don - The Chase Begins Again 320 Kbps.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/8jff2wz3Hpk/maxresdefault.jpg",
        artist: "Shankar Mahadevan"
    },

     {
        
         name: "Hum katha sunaate",
        displayName: "Hum katha sunaate",
        path: "audio/Hum-Katha-Sunate-Ram-Sakal-Gun-Dhaam-Ki.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://c.saavncdn.com/082/Hum-Katha-Sunate-Ram-Sakal-Gun-Dham-Ki-Hindi-2023-20230602142650-500x500.jpg",
        artist: "Ravindra Jain"
    },

    
     {
        
         name: "Yada-Yada-Hi-Dharmasya",
        displayName: "Yada-Yada-Hi-Dharmasya",
        path: "audio/Yada-Yada-Hi-Dharmasya.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://c.saavncdn.com/981/Yada-Yada-Hi-Dharmasya-Sanskrit-2021-20211011224715-500x500.jpg",
        artist: "Unknown"
    },

     {
        
         name: "kijo kesari ke laal",
        displayName: "Kijo kesari ke laal",
        path: "audio/Keejo Kesari Ke Laal - Lakhbir Singh Lakkha 320 Kbps.mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://i.ibb.co/kg7z6GCV/Whats-App-Image-2025-05-30-at-02-52-20-c93712c8.jpg",
        artist: "Lakhbir Singh Lakha"
    },

    {
        
         name: "mangal bhavan amangal hari",
        displayName: "Mangal bhavan amangal hari",
        path: "audio/Mangal Bhavan Amangal Hari (PenduJatt.Com.Se).mp3",
        album: "Bhakti songs",
        albumId: null,
        albumArt: "https://a10.gaanacdn.com/gn_img/albums/koMWQBbqLE/MWQ7l8DMKq/size_m.jpg",
        artist: "Ravindra Jain"
    },
];

const overseasSongs = [
    {
         name: "Unholy",
        displayName: "Unholy",
        path: "audio/SpotiDownloader.com - Unholy (feat. Kim Petras) - Sam Smith.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/DOWZ65w0rHU/sddefault.jpg",
        artist: "Kim Petras"
    },

    {
         name: "Blue",
        displayName: "Blue",
        path: "audio/Blue-Yung-Kai.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/4adZ7AguVcw/sddefault.jpg",
        artist: "Yung Kai"
    },

    {
         name: "Perfect",
        displayName: "Perfect",
        path: "audio/Perfect - 320Kbps-(Mr-Jat.in).mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/cPdAtGce54g/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCDQJaBe_53GnSv79F9oN44uJTizA",
        artist: "ED Sheeran"
    },

    {
         name: "Despactio",
        displayName: "Despactio",
        path: "audio/Despacito-(SambalpuriStar.In).mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/6Le_Q8I-MC8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBSg6lORlnluJKm1D9AWDQzbCUgng",
        artist: "Luis Fonsi"
    },

    {
         name: "1985",
        displayName: "1985",
        path: "audio/SpotiDownloader.com - 1985 - Bo Burnham.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/pm8TTOd4b88/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBLUT-R30gfiTJaisKu6WZu2rSJ3A",
        artist: "Bo Burnham"
    },

    {
         name: "Agora hills",
        displayName: "Agora Hills",
        path: "audio/SpotiDownloader.com - Agora Hills - Doja Cat.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/wjdgk9uJXwY/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCF8GlHYHhNJQRJIMZfKOCDPZqBeA",
        artist: "Doja Cat"
    },

    {
         name: "Unstoppable",
        displayName: "Unstoppable",
        path: "audio/Unstoppable-(Mr-Jat.in).mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/h3h035Eyz5A/sddefault.jpg",
        artist: "Sia"
    },

      {
         name: "Cheri Cheri Lady",
        displayName: "Cheri Cheri Lady",
        path: "audio/Cheri-Cheri-Lady.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/lrIKt5uDWZo/maxresdefault.jpg",
        artist: "Modern Talking"
    },
    

    {
         name: "Until I Found You",
        displayName: "Until I Found You",
        path: "audio/Until-I-Found-You.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.scdn.co/image/ab67616d0000b2737d8135f3a9c09b966c978860",
        artist: "Stephen Sanchez"
    },

    {
         name: "Flowers",
        displayName: "Flowers",
        path: "audio/SpotiDownloader.com - Flowers - Miley Cyrus.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/iawgB2CDCrw/maxresdefault.jpg",
        artist: "Miley Cyrus"
    },

    {
         name: "Woman",
        displayName: "Woman",
        path: "audio/SpotiDownloader.com - Woman - Doja Cat.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/g7X9X6TlrUo/maxresdefault.jpg",
        artist: "Doja Cat"
    },

    {
         name: "Closer",
        displayName: "Closer",
        path: "audio/So-Baby-Pull-Me-Closer.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/25ROFXjoaAU/maxresdefault.jpg",
        artist: "The Chainsmokers"
    },


    {
         name: "Industry Baby",
        displayName: "Industry Baby",
        path: "audio/Industry Baby Lil Nas X 128 Kbps.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/HCq1OcAEAm0/hqdefault.jpg",
        artist: "Jack Harlow"
    },

    {
         name: "I just called to say I love you",
        displayName: "I just called to say I love you",
        path: "audio/SpotiDownloader.com - I Just Called To Say I Love You - Single Version - Stevie Wonder.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://upload.wikimedia.org/wikipedia/en/b/b1/StevieWonderIJustCalledToSayILoveYou7InchFrenchSingleCover.jpg",
        artist: "Stevie Wonder"
    },

    
    {
         name: "Summertime Sadness",
        displayName: "Summertime Saadness",
        path: "audio/Lana Del Rey - Summertime Sadness (Lyrics) 4.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://i.ytimg.com/vi/a3Px9JmkPLY/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLC2PIntkiuc9gSEvOfr7k277HpBYg",
        artist: "Lana Del Rey"
    },

    {
         name: "Night Changes",
        displayName: "Night changes",
        path: "audio/One Direction - Night Changes 4.mp3",
        album: "Overseas songs",
        albumId: null,
        albumArt: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTICEUygwre-JtSVL4R17KwtABrYn0vKyoi3q6zpfBiNqxtCN0lB_TumxQHNn6DGPPvTCU&usqp=CAU",
        artist: "One Direction"
    },
];
    const albumArtMap = {
    // Add specific album arts for individual songs if needed, otherwise rely on album's default
    tharkiChokroPK: "https://i.ibb.co/PGr1kRjn/PK-poster-1.jpg",
    galatBaatHaiMainTeraHero: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
    palatTeraHeroIdharHaiMainTeraHero: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
    shanivaarRaatiMainTeraHero: "https://i.ibb.co/LdpRtWj7/Main-Tera-Hero-2014-500x500.jpg",
    naaReady: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg", 
    leoDasEntry: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    ratata: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    lokiverse: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    bloodySweet: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    glimpseOfHarold: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    glimpseOfAntony: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    badass: "https://i.ibb.co/k2S5VqzQ/leo-movie-review-vijay-film-2023-10-1e2b26eca663a1c07de3b347b2db49db-3x2.jpg",
    animal: "https://i.ibb.co/ttxyNmv/animal-rashmika-mandanna-featured.jpg",
    master: "https://i.ibb.co/Df6Q76TR/is-vijay-s-master-based-on-a-true-story-1589393898.jpg",
    bajrangi: "https://i.ibb.co/BV9tCPVM/p11934028-k-v10-aa.jpg",
    raone: "https://i.ibb.co/1YDwJTSn/ra-one.jpg",
    dabangg: "https://m.media-amazon.com/images/S/pv-target-images/f757047d0f496d88f41d46696054e053d2215567e54e252ea509721e5085b46f.jpg",
    ready: "https://friendshipforevergvr.wordpress.com/wp-content/uploads/2011/05/ready-movie2.jpg?w=584",
    pushpaTherise: "https://assets-in.bmscdn.com/iedb/movies/images/mobile/thumbnail/xlarge/pushpa--the-rise-et00129538-08-12-2021-01-21-46.jpg",
    kgf2: "https://i.ibb.co/39jxsLPM/images.jpg",
    pushpa2: "https://i.ibb.co/G37FNT07/Pushpa-2-The-Rule-Hindi-2024-20241205211002-500x500.jpg",
    sholay: "https://i.ibb.co/nNfS0GGn/sholay-remake-v0-7zv7h7pqai2d1.webp",
    leo: "https://indiaglitz-media.s3.amazonaws.com/telugu/home/leo-movie-review-3.jpg", 
    vikram : "https://anandkumarrsonfilms.com/wp-content/uploads/2022/07/vikram-poster.jpg",
    rabnebanadijodi : "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Rab_Ne_Bana_Di_Jodi.jpg/250px-Rab_Ne_Bana_Di_Jodi.jpg",
    desiboyz : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYgFgfwo3mK3E0SaxF_NNzfpQPRiKooKQKcQ&s",
    Jawan : "https://resizing.flixster.com/lej1aNFjcromN2hYS5-638hSJ-k=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2FiOWE5MWYxLTc0MzctNGNjZi1hMjE0LWNhZmZiMDU2M2RhMS5qcGc=",
    Vaastav : "https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p68252_p_v8_ad.jpg",
    yehjawanihaideewani : "https://m.media-amazon.com/images/M/MV5BODA4MjM2ODk4OF5BMl5BanBnXkFtZTcwNDgzODk1OQ@@._V1_FMjpg_UX1000_.jpg",
    

   
};

// Create a flat list of all songs with metadata for search, including album art image path
const allSongs = [];

// Helper to extract song title from file path
function extractSongTitleFromPath(path) {
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    let title = decodeURIComponent(filename).replace(/\.mp3.*$/, ''); // Remove .mp3 and anything after it
    title = title.replace(/\s*-\s*\b(Animal|PK|Vijay the Master|Bajrangi Bhaijaan|Ra-One|Dabangg|Ready|Pushpa - The Rise|Pushpa 2 The Rule|Sholay|Main Tera Hero)\b\s*(128 Kbps)?/i, ""); // Remove common album/movie names and bitrates
    title = title.replace(/\s*\b\d{2,3}\s*Kbps\b/i, ""); // Remove bitrates like 128 Kbps
    title = title.replace(/\s*\(pagalall\.com\)/i, ""); // Remove (pagalall.com)
    title = title.replace(/SpotiDownloader\.com\s*-\s*/i, ""); // Remove SpotiDownloader.com - 
    title = title.replace(/\(From _KGF Chapter 2 - Tamil_\)\s*-\s*/i, "").trim(); // Remove specific KGF2 text and trailing hyphen if any
    title = title.replace(/_\s*/g, " ").trim(); // Replace underscores with spaces
    title = title.replace(/-/g, " ").trim(); // Replace hyphens with spaces
    title = title.replace(/\s*\(1\)/, "").trim(); // Remove (1) for duplicates
    return title.trim();
}

// Helper to extract artist from common patterns in file names
function getArtistFromPath(path) {
    let artist = ""; // Default to empty string
    // Try to find " - Artist Name" or "Artist - Song Name" patterns
    const filename = decodeURIComponent(path.split("/").pop());

    // Pattern: Song Name - Artist Name (Album Name)
    let match = filename.match(/-\s*([A-Za-z0-9\s.&]+?)\s*(?:-\s*\b(Animal|PK|Vijay the Master|Bajrangi Bhaijaan|Ra-One|Dabangg|Ready|Pushpa - The Rise|Pushpa 2 The Rule|Sholay|Main Tera Hero)\b)?\s*(?:\d{2,3}\s*Kbps)?\.mp3$/i);
    if (match && match[1]) {
        let potentialArtist = match[1].trim();
        if (!potentialArtist.toLowerCase().includes("theme") && !potentialArtist.toLowerCase().includes("dialogue")) {
             // Exclude common words that are part of title/album but might be mistaken for artist
            if (!potentialArtist.toLowerCase().includes("animal") && !potentialArtist.toLowerCase().includes("master") && 
                !potentialArtist.toLowerCase().includes("dabangg") && !potentialArtist.toLowerCase().includes("ready")) {
                artist = potentialArtist;
            }
        }
    }

    // Fallback for Specific patterns like "SpotiDownloader.com - Artist - Song.mp3"
    if (!artist) {
        match = filename.match(/SpotiDownloader\.com\s*-\s*([A-Za-z0-9\s.&]+?)\s*-\s*.+\.mp3$/i);
        if (match && match[1]) {
            artist = match[1].trim();
        }
    }

    // Specific cases
    if (filename.includes("Amit Trivedi")) artist = "Amit Trivedi";
    if (filename.includes("Ananya Bhat")) artist = "Ananya Bhat";
    if (filename.includes("Ravi Basrur")) artist = "Ravi Basrur";
    if (filename.includes("Sandesh Datta Naik")) artist = "Sandesh Datta Naik";
    if (filename.includes("Brijesh Shandilya")) artist = "Brijesh Shandilya";
    if (filename.includes("Suchetha Basrur")) artist = "Suchetha Basrur";

    // Clean up if artist ends up being just "128 Kbps" or similar noise
    artist = artist.replace(/128 Kbps/i, '').trim();
    artist = artist.replace(/SenSongsMp3\.Co/i, '').trim();
    artist = artist.replace(/\(pagalall\.com\)/i, '').trim();
    artist = artist.replace(/\(From _KGF Chapter 2 - Tamil_\)/i, '').trim();
    artist = artist.replace(/_/, ' ').trim();

    return artist;
}

// Populate allSongs from albums
for (const albumId in albums) {
    const albumSongs = albums[albumId];
    albumSongs.forEach((path) => {
        const displayName = extractSongTitleFromPath(path);
        const artist = getArtistFromPath(path); 
        let albumName = albumId.charAt(0).toUpperCase() + albumId.slice(1);

        // Specific album name adjustments for display
        if (albumId === 'pushpaTherise') albumName = "Pushpa: The Rise";
        if (albumId === 'pushpa2') albumName = "Pushpa 2: The Rule";
        if (albumId === 'pk') albumName = "PK";
        if (albumId === 'leo') albumName = "Leo";
        if (albumId === 'newSongs') albumName = "New Songs Collection";

        allSongs.push({
            name: displayName.toLowerCase(),
            displayName: displayName,
            path: path,
            album: albumName,
            albumId: albumId,
            albumArt: albumArtMap[albumId] || 'https://placehold.co/50x50/333333/FFFFFF?text=No+Art',
            artist: artist
        });
    });
}

// Populate allSongs from trendingSongs
for (const songId in trendingSongs) {
    const song = trendingSongs[songId];
    allSongs.push({
        name: song.displayName.toLowerCase(),
        displayName: song.displayName,
        path: song.path,
        album: song.album || "Trending Songs",
        albumId: song.albumId || null,
        albumArt: song.albumArt || 'https://placehold.co/50x50/333333/FFFFFF?text=No+Art',
        artist: song.artist || "" // Default to empty string
    });
}

// Populate allSongs from trendingMashups
trendingMashups.forEach(mashup => {
    allSongs.push({
        name: mashup.displayName.toLowerCase(),
        displayName: mashup.displayName,
        path: mashup.path,
        album: mashup.album,
        albumId: mashup.albumId,
        albumArt: mashup.albumArt,
        artist: mashup.artist || "" // Default to empty string
    });
});


function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const updateMusicControllerUI = debounce(function() {
    console.log("updateMusicControllerUI called");
    let songInfo = {
        title: "No song playing",
        artist: "", // D5efault to empty string
        albumArt: "https://placehold.co/50x50/333333/FFFFFF?text=No+Art" // A default image
    };

    let currentSongPath = audioElement.src;
    console.log("Current Audio Element SRC:", currentSongPath);

    if (currentSongPath) {
        // Normalize the path by removing the origin
        const normalizedPath = currentSongPath.replace(window.location.origin + '/', ''); 
        console.log("Raw Normalized Path (from src):", normalizedPath);

        // --- CRUCIAL CHANGE HERE ---
        // Decode the normalized path to match the actual file name strings you have in your song data
        const decodedPathForLookup = decodeURIComponent(normalizedPath);
        console.log("Decoded Path for Lookup:", decodedPathForLookup);
        // --- END CRUCIAL CHANGE ---

        // Find the song in `allSongs` using the decoded path
        let foundSong = allSongs.find(song => song.path === decodedPathForLookup);
        console.log("Found Song Object (if matched):", foundSong); 

        // If not found in allSongs, try to find in bhaktiSongs
        if (!foundSong) {
            foundSong = bhaktiSongs.find(song => song.path === decodedPathForLookup);
            console.log("Found Song Object in bhaktiSongs (if matched):", foundSong);
        }
        if (!foundSong) {
            foundSong = overseasSongs.find(song => song.path === decodedPathForLookup);
            console.log("Found Song Object in overseasSongs (if matched):", foundSong);
        }

        if (foundSong) {
            songInfo.title = foundSong.displayName || extractSongTitleFromPath(foundSong.path);
            songInfo.artist = foundSong.artist || ""; // Use empty string if no artist found
            
            // Log the albumArt found before fallbacks
            console.log("foundSong.albumArt:", foundSong.albumArt);
            console.log("albumArtMap[foundSong.albumId]:", albumArtMap[foundSong.albumId]);
            
            songInfo.albumArt = foundSong.albumArt || albumArtMap[foundSong.albumId] || "https://placehold.co/50x50/333333/FFFFFF?text=No+Art";
            console.log("Determined songInfo.albumArt after fallbacks:", songInfo.albumArt); // What's the URL after fallbacks?

        } else {
            // Fallback for songs not found in `allSongs` or `bhaktiSongs`
            console.warn("Song NOT FOUND in allSongs or bhaktiSongs for path:", decodedPathForLookup); // Use decoded path in warning
            songInfo.title = extractSongTitleFromPath(currentSongPath);
            songInfo.artist = "";
            songInfo.albumArt = "https://placehold.co/50x50/333333/FFFFFF?text=No+Art"; 
        }
    }

updateControllerSongTitle("Vikram X Jailer X Leo X Jawan X Pushpa X Bahubali X Salaar");

    if (controller.songArtist) { 
        controller.songArtist.textContent = songInfo.artist;
    }

    if (controller.albumArt) {
        let albumArtSrc = songInfo.albumArt; 
        console.log("Initial albumArtSrc before path check:", albumArtSrc); // Added for debugging

       
        if (!albumArtSrc.startsWith('http://') && !albumArtSrc.startsWith('https://') && !albumArtSrc.startsWith('data:')) {
            albumArtSrc = window.location.origin + '/' + albumArtSrc; 
            console.log("Modified albumArtSrc (relative path handled):", albumArtSrc); 
        }
        
        controller.albumArt.src = albumArtSrc; 
        
         
    }

    updateLikeButtonState();
}, 100);


audioElement.addEventListener('loadedmetadata', () => {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        controller.timeDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
        controller.progressBar.max = 100; // Max value for range is 100 (percentage)
    }
});

// Update time display during playback
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration && !isNaN(audioElement.duration)) {
        const progressPercent = (audioElement.currentTime / audioElement.duration) * 100;
        controller.progressBar.value = progressPercent; // Update progress bar value
        controller.timeDisplay.textContent = `${formatTime(audioElement.currentTime)} / ${formatTime(audioElement.duration)}`;
    }
});
function playSong(albumId, songIndex) {
    if (!albums[albumId] || albums[albumId].length <= songIndex) {
        console.error("Song not found:", albumId, songIndex);
        return;
    }
    currentAlbum = albumId;
    currentSongIndex = songIndex;
    const src = albums[albumId][songIndex];
    console.log("Attempting to play song from album:", src);
    audioElement.src = encodeURI(src);
    audioElement.play().then(() => {
        console.log("Playback started successfully for album song.");
        updateMusicControllerUI();
    }).catch(err => {
        console.error("Playback error for album song:", err);
    });
    isPlaying = true;
    // When playing from an album, set the playlist to the entire album
    playlist = albums[albumId].map(path => {
        const foundSong = allSongs.find(s => s.path === path);
        return foundSong || { path: path, displayName: extractSongTitleFromPath(path), album: albumId, artist: "" };
    });
    playlistIndex = songIndex;

    const albumView = document.getElementById(albumId + '-album-view');
    resetAlbumProgressBars(albumView);
    updateSongProgressBar(albumView, songIndex);
    addProgressBarListeners(albumView, songIndex);
}

// Play next song in the current album or playlist
function nextSong() {
    console.log("nextSong called");
    if (playlist.length > 0) {
        playlistIndex++;
        if (playlistIndex >= playlist.length) {
            playlistIndex = 0; // Loop playlist
        }
        playPlaylistSong(playlistIndex);
    } else { // Fallback if no specific playlist is active, try to play next in current album
        if (currentAlbum) {
            currentSongIndex++;
            if (currentSongIndex >= albums[currentAlbum].length) {
                currentSongIndex = 0; // Loop album
            }
            playSong(currentAlbum, currentSongIndex);
        } else { 
            console.log("No next song to play from active album or playlist.");
        }
    }
}

// Play previous song in the current album or playlist
function previousSong() {
    console.log("previousSong called");
    if (playlist.length > 0) {
        playlistIndex--;
        if (playlistIndex < 0) {
            playlistIndex = playlist.length - 1; // Loop playlist
        }
        playPlaylistSong(playlistIndex);
    } else { // Fallback if no specific playlist is active, try to play previous in current album
        if (currentAlbum) {
            currentSongIndex--;
            if (currentSongIndex < 0) {
                currentSongIndex = albums[currentAlbum].length - 1; // Loop album
            }
            playSong(currentAlbum, currentSongIndex);
        } else { 
            console.log("No previous song to play from active album or playlist.");
        }
    }
}

function playPlaylistSong(index) {
    if (index < 0 || index >= playlist.length) {
        console.error("Playlist index out of bounds:", index);
        return;
    }
    const song = playlist[index];
    console.log("Playing playlist song:", song.path);
    audioElement.src = song.path; // Use song.path from the playlist item
    audioElement.play().then(() => {
        updateMusicControllerUI();
    }).catch(err => {
        console.error("Playback error for playlist song:", err);
    });
    isPlaying = true;
}

// Event listener to play next song when current ends
audioElement.addEventListener('ended', () => {
    console.log("Song ended.");
    if (playlist.length > 0) {
        nextSong();
    } else if (currentAlbum && albums[currentAlbum].length > 0) {
        nextSong(); // Use nextSong to handle album looping
    } else {
        
        isPlaying = false;
        updatePlayPauseIcon();
   
        updateMusicControllerUI(); 
        console.log("Single song playback ended and no next song available.");
    }
});

function playMashup(mashupName) {
    console.log("playMashup called with name:", mashupName);
    const mashup = trendingMashups.find(m => m.name === mashupName || m.displayName.toLowerCase() === mashupName.toLowerCase());
    if (!mashup || !mashup.path) {
        console.error("Trending mashup not found:", mashupName);
        return;
    }
    audioElement.src = mashup.path;
    currentAlbum = null; // Reset currentAlbum as we are playing from trending/mashups
    currentSongIndex = -1; // Reset currentSongIndex
    
    // Set the playlist to all trending mashups and find the index of the current one
    playlist = trendingMashups;
    playlistIndex = trendingMashups.indexOf(mashup);

    audioElement.play().then(() => {
        console.log("Playback started for mashup.");
        updateMusicControllerUI(); 
    }).catch(err => {
        console.error("Playback error for mashup:", err);
    });
    isPlaying = true;
}

function playTrendingSong(songId) {
    console.log("playTrendingSong called with ID:", songId);
    const songObj = trendingSongs[songId];
    if (!songObj || !songObj.path) {
        console.error("Trending song not found or missing path:", songId);
        return;
    }
    console.log("Playing trending song:", songObj.path);
    audioElement.src = songObj.path;
    currentAlbum = null; // Reset currentAlbum as we are playing from trending/mashups
    currentSongIndex = -1; // Reset currentSongIndex

    // Set the playlist for trending songs to all trending songs.
    // Convert trendingSongs object to an array for playlist usage.
    playlist = Object.values(trendingSongs);
    playlistIndex = playlist.findIndex(s => s.path === songObj.path);

    audioElement.play().then(() => {
        console.log("Playback started for trending song.");
        updateMusicControllerUI(); 
    }).catch(err => {
        console.error("Playback error for trending song:", err);
    });
    isPlaying = true;
}



function playbhakti(songName) {
    const song = bhaktiSongs.find(s => s.name.toLowerCase() === songName.toLowerCase());
    if (!song) {
        console.error("Bhakti song not found:", songName);
        return;
    }
    audioElement.src = song.path;
    audioElement.play().then(() => {
        updateMusicControllerUI();
    }).catch(err => {
        console.error("Playback error for bhakti song:", err);
    });
    isPlaying = true;
}



function openAlbumView(albumId) {
    // Hide all album views first
    document.querySelectorAll('.album-view').forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });

    const albumView = document.getElementById(albumId + '-album-view');
    if (albumView) {
        albumView.style.display = 'block'; // Or 'flex', depending on its CSS
        albumView.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAlbumView(albumId) {
    const albumView = document.getElementById(albumId + '-album-view');
    if (albumView) {
        albumView.classList.remove('active');
        albumView.style.display = 'none';
        document.body.style.overflow = ''; // Restore scroll
    }
}


function initializeMusicController() {
    controller.playPauseBtn = document.getElementById("controller-play-pause");
    controller.prevBtn = document.getElementById("controller-prev");
    controller.nextBtn = document.getElementById("controller-next");
    controller.progressBar = document.getElementById("controller-progress");
    controller.timeDisplay = document.getElementById("controller-time");
    controller.albumArt = document.getElementById("controller-album-art");
    controller.songTitle = document.getElementById("controller-song-title");
    controller.songArtist = document.getElementById("controller-song-artist");
    controller.playPauseIcon = document.getElementById("play-pause-icon");
    controller.likeBtn = document.getElementById("controller-like-btn"); // Initialize like button
    controller.likeIcon = document.getElementById("like-icon"); // Initialize like icon

    // Add checks for null elements if they might not exist in HTML
    if (!controller.playPauseBtn || !controller.prevBtn || !controller.nextBtn ||
        !controller.progressBar || !controller.timeDisplay || !controller.albumArt ||
        !controller.songTitle || !controller.songArtist || !controller.playPauseIcon ||
        !controller.likeBtn || !controller.likeIcon) { // Include new elements in check
        console.error("One or more music controller UI elements not found. Please check your HTML IDs.");
        return;
    }


    controller.playPauseBtn.addEventListener("click", () => {
        console.log("Play/Pause button clicked");
        togglePlay();
    });

    controller.prevBtn.addEventListener("click", () => {
        console.log("Previous button clicked");
        previousSong();
    });

    controller.nextBtn.addEventListener("click", () => {
        console.log("Next button clicked");
        nextSong();
    });

    controller.progressBar.addEventListener("input", (e) => {
        if (audioElement.duration && !isNaN(audioElement.duration)) { 
            const seekTime = (audioElement.duration * e.target.value) / 100;
            audioElement.currentTime = seekTime;
        } else {
            console.warn("Audio duration not available for seeking.");
        }
    });

    // Initial UI update
    updateMusicControllerUI();
}

function updatePlayPauseIcon() {
    if (isPlaying) {
        controller.playPauseIcon.classList.remove("bi-play-fill");
        controller.playPauseIcon.classList.add("bi-pause-fill");
    } else {
        controller.playPauseIcon.classList.remove("bi-pause-fill");
        controller.playPauseIcon.classList.add("bi-play-fill");
    }
}

function playSongByPath(path) {
    console.log("playSongByPath called for:", path);
    currentAlbum = null; // Clear album context
    currentSongIndex = -1; // Clear song index
    
    audioElement.src = encodeURI(path);
    audioElement.play().then(() => {
        console.log("Playback started for song by path.");
        updateMusicControllerUI();
    }).catch(err => {
        console.error("Playback error for song by path:", err);
    });
    isPlaying = true;
    
    // Set the playlist to just this song for next/prev to loop it
    const foundSong = allSongs.find(song => song.path === path);
    if (foundSong) {
        playlist = [foundSong]; 
        playlistIndex = 0;
    } else {
        // Fallback if song not found in allSongs (should ideally not happen with current logic)
        playlist = [{ path: path, displayName: extractSongTitleFromPath(path), album: "Unknown", artist: "" }];
        playlistIndex = 0;
    }
}


function togglePlay() {
    console.log("togglePlay called. isPlaying:", isPlaying, "audioElement.src:", audioElement.src);
    if (isPlaying) {
        audioElement.pause();
    } else {
        // If no song is currently loaded in the audio element, try to play the first song in the general playlist
        // or the first song in allSongs if no other context.
        if (!audioElement.src && allSongs.length > 0) {
            console.log("No song loaded, attempting to play first song from allSongs.");
            playSongByPath(allSongs[0].path);
        } else if (audioElement.src) { // If a song is loaded but paused, play it
            console.log("Song loaded, resuming playback.");
            audioElement.play();
        } else {
            console.log("No song available to play.");
        }
    }
}

// Function to render liked songs in the 'liked-songs-list' div
function renderLikedSongs() {
    console.log("renderLikedSongs called, likedSongs length:", likedSongs.length);
    const likedSongsListDiv = document.getElementById('liked-songs-list');
    if (!likedSongsListDiv) {
        console.warn("Liked songs list container not found in DOM.");
        return;
    }

    likedSongsListDiv.innerHTML = ''; // Clear existing content

    if (likedSongs.length === 0) {
        likedSongsListDiv.innerHTML = '<p style="text-align: center; color: #b0b0b0;" id="no-liked-songs-message">No songs liked yet. Start liking some music!</p>';
        return;
    }

    // Remove the "No songs liked yet" message if it exists
    const noLikedSongsMessage = document.getElementById('no-liked-songs-message');
    if (noLikedSongsMessage) {
        noLikedSongsMessage.remove();
    }

    // Render liked songs list properly
    likedSongs.forEach((song, index) => {
        const songItem = document.createElement('div');
        songItem.className = 'liked-song-item';
        songItem.style.cursor = 'pointer';
        songItem.onclick = () => {
            // Set the playlist to liked songs and play the selected one
            playlist = likedSongs;
            playPlaylistSong(index);
        };

        const albumArt = document.createElement('img');
        albumArt.src = song.albumArt || 'https://placehold.co/60x60/333333/FFFFFF?text=No+Art';
        albumArt.alt = "Album Art";
        albumArt.style.width = '45px';
        albumArt.style.height = '45px';
        albumArt.style.borderRadius = '8px';
        albumArt.style.marginRight = '12px';
        albumArt.style.objectFit = 'cover';
        albumArt.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';

        const songInfo = document.createElement('div');
        songInfo.className = 'liked-song-info';

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = song.displayName;
        title.style.fontWeight = '600';
        title.style.fontSize = '0.95em';
        title.style.color = '#f0f0f0';
        title.style.marginBottom = '3px';
        title.style.overflow = 'hidden';
        title.style.whiteSpace = 'nowrap';
        title.style.textOverflow = 'ellipsis';

        const artistAlbum = document.createElement('div');
        artistAlbum.className = 'artist-album';
        artistAlbum.textContent = `${song.artist || 'Unknown Artist'} • ${song.album || 'Unknown Album'}`;
        artistAlbum.style.fontSize = '0.75em';
        artistAlbum.style.color = '#b0b0b0';
        artistAlbum.style.overflow = 'hidden';
        artistAlbum.style.whiteSpace = 'nowrap';
        artistAlbum.style.textOverflow = 'ellipsis';

        const duration = document.createElement('div');
        duration.className = 'liked-song-duration';
        duration.style.fontSize = '0.8em';
        duration.style.color = '#909090';
        duration.style.marginLeft = '10px';
        // You might need to get the duration dynamically or store it with the liked song
        // For now, a placeholder or a default value
        duration.textContent = "0:00"; // This will be updated when the song plays

        songInfo.appendChild(title);
        songInfo.appendChild(artistAlbum);
        songItem.appendChild(albumArt);
        songItem.appendChild(songInfo);
        songItem.appendChild(duration); // Add duration element

        likedSongsListDiv.appendChild(songItem);

        // Update duration when the song is loaded and played
        const tempAudio = new Audio();
        tempAudio.src = song.path;
        tempAudio.addEventListener('loadedmetadata', () => {
            duration.textContent = formatTime(tempAudio.duration);
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    initializeMusicController();
    updateMusicControllerUI(); 
    renderLikedSongs(); // Added call to render liked songs on page load

    const savedState = sessionStorage.getItem('currentSong');
    if (savedState) {
        try {
            const song = JSON.parse(savedState);
            console.log("Loaded saved currentSong from sessionStorage:", song);
            // Normalize path for matching
            const normalizedPath = decodeURIComponent(song.path).replace(/^\/+/, '');
            console.log("Normalized path for lookup:", normalizedPath);

            // Try to find song in allSongs, bhaktiSongs, overseasSongs
            let foundSong = allSongs.find(s => s.path === normalizedPath);
            if (!foundSong) {
                foundSong = bhaktiSongs.find(s => s.path === normalizedPath);
            }
            if (!foundSong) {
                foundSong = overseasSongs.find(s => s.path === normalizedPath);
            }
            console.log("Found song object for resume playback:", foundSong);

            if (foundSong) {
                audioElement.src = foundSong.path;
                audioElement.load(); // Ensure metadata loads

                const resumePlayback = () => {
                    if (!isNaN(song.currentTime)) {
                        audioElement.currentTime = song.currentTime;
                    }

                    if (song.isPlaying) {
                        audioElement.play().catch(err => console.warn("Autoplay blocked:", err));
                        isPlaying = true;
                    } else {
                        isPlaying = false;
                    }

                    updatePlayPauseIcon();
                    updateMusicControllerUI();

                    audioElement.removeEventListener('loadedmetadata', resumePlayback);
                };

                audioElement.addEventListener('loadedmetadata', resumePlayback);
            } else {
                console.warn("Could not find saved song in song lists for resume playback:", normalizedPath);
            }
        } catch (e) {
            console.error("Error resuming session song:", e);
        }
    }
});



const broadcastChannel = new BroadcastChannel('music-player-channel');

// Listen for messages from other tabs to sync playback state
broadcastChannel.addEventListener('message', (event) => {
    const songState = event.data;
    if (!songState || !songState.path) return;

    // If the current tab is already playing the same song and time is close, ignore
    if (audioElement.src.endsWith(songState.path) && Math.abs(audioElement.currentTime - songState.currentTime) < 2) {
        return;
    }

    // Update audio element and UI to reflect the new state
    audioElement.src = songState.path;
    audioElement.currentTime = songState.currentTime || 0;

    if (songState.isPlaying) {
        audioElement.play().catch(err => console.warn("Autoplay failed on broadcast:", err));
        isPlaying = true;
    } else {
        audioElement.pause();
        isPlaying = false;
    }

    updatePlayPauseIcon();
    updateMusicControllerUI();
});


// Search input event listener and display results with album art image in small round shape
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('main-search');
    const searchResults = document.getElementById('search-results');

    if (!searchInput || !searchResults) {
        console.warn("Search input or search results element not found. Search functionality may not work.");
        // This is okay if we are on like.html, as search might not be present there.
        // The rest of the DOMContentLoaded logic should still run.
    }

    initializeMusicController();


function savePlaybackState() {
    if (audioElement.src) {
        const currentSongPath = audioElement.src.replace(window.location.origin + '/', '');
        const foundSong = allSongs.find(song => song.path === decodeURIComponent(currentSongPath));
        const songState = {
            path: currentSongPath,
            currentTime: audioElement.currentTime,
            isPlaying: isPlaying,
            title: foundSong?.displayName || "Unknown",
            artist: foundSong?.artist || "",
            albumArt: foundSong?.albumArt || ""
        };
        sessionStorage.setItem('currentSong', JSON.stringify(songState));
        // Broadcast the updated playback state to other tabs
        if (broadcastChannel) {
            broadcastChannel.postMessage(songState);
        }
    }
}


    // Define top albums from albums and albumArtMap
    const topAlbums = Object.keys(albums).map(albumId => ({
        albumId,
        name: albumId.charAt(0).toUpperCase() + albumId.slice(1), 
        albumArt: albumArtMap[albumId] || 'https://placehold.co/40x40/333333/FFFFFF?text=No+Art'
    }));

    // Only add search functionality if searchInput and searchResults exist
    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            searchResults.innerHTML = ''; 
            if (query.length === 0) {
                searchResults.style.display = 'none';
                return;
            }
            // Split query into terms by spaces
            const terms = query.split(/\s+/);

            // Filter songs based on all terms matching displayName, name, album, or artist
            const filteredSongs = allSongs.filter(song =>
                terms.every(term =>
                    song.name.includes(term) ||
                    song.displayName.toLowerCase().includes(term) ||
                    (song.album && song.album.toLowerCase().includes(term)) ||
                    (song.artist && song.artist.toLowerCase().includes(term))
                )
            );

            // Filter bhakti songs based on all terms matching name or displayName or artist or album
            const filteredBhaktiSongs = bhaktiSongs.filter(song =>
                terms.every(term =>
                    song.name.toLowerCase().includes(term) ||
                    song.displayName.toLowerCase().includes(term) ||
                    (song.album && song.album.toLowerCase().includes(term)) ||
                    (song.artist && song.artist.toLowerCase().includes(term))
                )
            );

            // Filter trending mashups based on all terms matching name or displayName or artist
            const filteredMashups = trendingMashups.filter(mashup =>
                terms.every(term =>
                    mashup.name.includes(term) ||
                    mashup.displayName.toLowerCase().includes(term) ||
                    (mashup.artist && mashup.artist.toLowerCase().includes(term))
                )
            );

            // Filter albums based on all terms matching name
            const filteredAlbums = topAlbums.filter(album =>
                terms.every(term =>
                    album.name.toLowerCase().includes(term)
                )
            );

            // Filter overseas songs based on all terms matching name or displayName or artist or album
            const filteredOverseasSongs = overseasSongs.filter(song =>
                terms.every(term =>
                    song.name.toLowerCase().includes(term) ||
                    song.displayName.toLowerCase().includes(term) ||
                    (song.album && song.album.toLowerCase().includes(term)) ||
                    (song.artist && song.artist.toLowerCase().includes(term))
                )
            );

            if (filteredSongs.length === 0 && filteredAlbums.length === 0 && filteredMashups.length === 0 && filteredBhaktiSongs.length === 0 && filteredOverseasSongs.length === 0) {
                searchResults.style.display = 'none';
                return;
            }

            searchResults.style.display = 'block';

            // Display albums first
            filteredAlbums.forEach(album => {
                const div = document.createElement('div');
                div.className = 'search-result-item album-result';
                div.style.cursor = 'pointer';
                div.style.display = 'flex'; 
                div.style.alignItems = 'center'; 
                div.style.borderBottom = '1px solid #333'; 
                div.style.padding = '8px 12px'; 
                div.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; 
                div.style.borderRadius = '4px';
                div.style.marginBottom = '5px';

                const img = document.createElement('img');
                img.src = album.albumArt || 'https://placehold.co/40x40/333333/FFFFFF?text=No+Art';
                img.alt = album.name + " cover";
                img.style.width = '40px';
                img.style.height = '40px';
                img.style.borderRadius = '8px'; 
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover';

                const textSpan = document.createElement('span');
                textSpan.textContent = album.name;
                textSpan.style.color = 'white'; 
                textSpan.style.fontWeight = '600';

                div.appendChild(img);
                div.appendChild(textSpan);
                div.addEventListener('click', () => {
                    openAlbumView(album.albumId);
                    searchResults.style.display = 'none';
                    searchInput.value = '';
                });
                searchResults.appendChild(div);
            });

            // Display songs below albums
            filteredSongs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.style.cursor = 'pointer';
                div.style.display = 'flex'; 
                div.style.alignItems = 'center'; 
                div.style.padding = '8px 12px';
                div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                div.style.borderRadius = '4px';
                div.style.marginBottom = '5px';

                const img = document.createElement('img');
                img.src = song.albumArt || 'https://placehold.co/30x30/333333/FFFFFF?text=No+Art'; 
                img.alt = (song.album || "Unknown") + " cover";
                img.style.width = '30px';
                img.style.height = '30px';
                img.style.borderRadius = '50%'; 
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover'; 

                const textSpan = document.createElement('span');
                textSpan.innerHTML = `<div style="color: white; font-weight: 500;">${song.displayName}</div><div style="font-size: 0.8em; color: #b3b3b3;">${song.artist || ''} - ${song.album || 'Unknown Album'}</div>`;

                div.appendChild(img);
                div.appendChild(textSpan);
                div.addEventListener('click', () => {
                    playSongByPath(song.path);
                    // Keep search results open after clicking a song
                    // searchResults.style.display = 'none';
                    // searchInput.value = '';
                });
                searchResults.appendChild(div);
            });

            // Display bhakti songs below songs
            filteredBhaktiSongs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'search-result-item bhakti-result';
                div.style.cursor = 'pointer';
                div.style.display = 'flex'; 
                div.style.alignItems = 'center'; 
                div.style.padding = '8px 12px';
                div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                div.style.borderRadius = '4px';
                div.style.marginBottom = '5px';

                const img = document.createElement('img');
                img.src = song.albumArt || 'https://placehold.co/30x30/333333/FFFFFF?text=No+Art'; 
                img.alt = (song.album || "Unknown") + " cover";
                img.style.width = '30px';
                img.style.height = '30px';
                img.style.borderRadius = '50%'; 
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover'; 

                const textSpan = document.createElement('span');
                textSpan.innerHTML = `<div style="color: white; font-weight: 500;">${song.displayName}</div><div style="font-size: 0.8em; color: #b3b3b3;">${song.artist || ''} - ${song.album || 'Unknown Album'}</div>`;

                div.appendChild(img);
                div.appendChild(textSpan);
                div.addEventListener('click', () => {
                    playSongByPath(song.path);
                    searchResults.style.display = 'none';
                    searchInput.value = '';
                });
                searchResults.appendChild(div);
            });

            // Display trending mashups below songs
            filteredMashups.forEach(mashup => {
                const div = document.createElement('div');
                div.className = 'search-result-item mashup-result';
                div.style.cursor = 'pointer';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.padding = '8px 8px'; // Reduced padding to ensure compact view
                div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                div.style.borderRadius = '4px';
                div.style.marginBottom = '5px';

                const img = document.createElement('img');
                img.src = mashup.albumArt || 'https://placehold.co/30x30/333333/FFFFFF?text=No+Art';
                img.alt = mashup.displayName + " cover";
                img.style.width = '30px';
                img.style.height = '30px';
                img.style.borderRadius = '50%';
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover';

                const textSpan = document.createElement('span');
                textSpan.innerHTML = `<div style="color: white; font-weight: 500;">${mashup.displayName}</div><div style="font-size: 0.8em; color: #b3b3b3;">${mashup.artist || ''} - ${mashup.album || 'Mashup'}</div>`;

                div.appendChild(img);
                div.appendChild(textSpan);
                div.addEventListener('click', () => {
                    playSongByPath(mashup.path);
                    searchResults.style.display = 'none';
                    searchInput.value = '';
                });
                searchResults.appendChild(div);
            });

            

            // Display overseas songs below mashups
            filteredOverseasSongs.forEach(song => {
                const div = document.createElement('div');
                div.className = 'search-result-item overseas-result';
                div.style.cursor = 'pointer';
                div.style.display = 'flex'; 
                div.style.alignItems = 'center'; 
                div.style.padding = '8px 12px';
                div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                div.style.borderRadius = '4px';
                div.style.marginBottom = '5px';

                const img = document.createElement('img');
                img.src = song.albumArt || 'https://placehold.co/30x30/333333/FFFFFF?text=No+Art'; 
                img.alt = (song.album || "Unknown") + " cover";
                img.style.width = '30px';
                img.style.height = '30px';
                img.style.borderRadius = '50%'; 
                img.style.marginRight = '10px';
                img.style.objectFit = 'cover'; 

                const textSpan = document.createElement('span');
                textSpan.innerHTML = `<div style="color: white; font-weight: 500;">${song.displayName}</div><div style="font-size: 0.8em; color: #b3b3b3;">${song.artist || ''} - ${song.album || 'Unknown Album'}</div>`;

                div.appendChild(img);
                div.appendChild(textSpan);
                div.addEventListener('click', () => {
                    playSongByPath(song.path);
                    searchResults.style.display = 'none';
                    searchInput.value = '';
                });
                searchResults.appendChild(div);
            });
        });

        


        
        // Close search results when clicking outside
        document.addEventListener('click', (event) => {
            if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
                searchResults.style.display = 'none';
            }
        });
    } // End of searchInput and searchResults check
});

// Liked songs search functionality
document.addEventListener('DOMContentLoaded', () => {
    const likedSearchInput = document.getElementById('liked-search');
    const likedSearchResults = document.getElementById('liked-search-results');

    if (!likedSearchInput || !likedSearchResults) {
        return;
    }

    likedSearchInput.addEventListener('input', () => {
        const query = likedSearchInput.value.toLowerCase().trim();
        likedSearchResults.innerHTML = '';
        if (query.length === 0) {
            likedSearchResults.style.display = 'none';
            return;
        }

        const terms = query.split(/\s+/);

        // Filter likedSongs based on all terms matching displayName, artist, or album
        const filteredLikedSongs = likedSongs.filter(song =>
            terms.every(term =>
                song.displayName.toLowerCase().includes(term) ||
                (song.artist && song.artist.toLowerCase().includes(term)) ||
                (song.album && song.album.toLowerCase().includes(term))
            )
        );

        if (filteredLikedSongs.length === 0) {
            likedSearchResults.style.display = 'none';
            return;
        }

        likedSearchResults.style.display = 'block';

        filteredLikedSongs.forEach(song => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.style.cursor = 'pointer';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.padding = '8px 12px';
            div.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            div.style.borderRadius = '4px';
            div.style.marginBottom = '5px';

            const img = document.createElement('img');
            img.src = song.albumArt || 'https://placehold.co/30x30/333333/FFFFFF?text=No+Art';
            img.alt = (song.album || "Unknown") + " cover";
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.borderRadius = '50%';
            img.style.marginRight = '10px';
            img.style.objectFit = 'cover';

            const textSpan = document.createElement('span');
            textSpan.innerHTML = `<div style="color: white; font-weight: 500;">${song.displayName}</div><div style="font-size: 0.8em; color: #b3b3b3;">${song.artist || ''} - ${song.album || 'Unknown Album'}</div>`;

            div.appendChild(img);
            div.appendChild(textSpan);
            div.addEventListener('click', () => {
                playSongByPath(song.path);
                // likedSearchResults.style.display = 'none';
                // likedSearchInput.value = '';
            });
            likedSearchResults.appendChild(div);
        });
    });

    // Close liked search results when clicking outside
    document.addEventListener('click', (event) => {
        if (!likedSearchInput.contains(event.target) && !likedSearchResults.contains(event.target)) {
            likedSearchResults.style.display = 'none';
        }
    });
});

document.addEventListener('keydown', (event) => {
    // Prevent default spacebar behavior (scrolling) only if not focused on input or textarea
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.isContentEditable);

    if (event.code === 'Space' && !isInputFocused) {
        event.preventDefault(); 
        togglePlay();
    }
    // Left arrow key for previous song
    else if (event.code === 'ArrowLeft') {
        previousSong();
    }
    // Right arrow key for next song
    else if (event.code === 'ArrowRight') {
        nextSong();
    }
});

// Add event listeners to save playback state on play, pause, and timeupdate
audioElement.addEventListener('play', () => {
    isPlaying = true;
    updatePlayPauseIcon();
    savePlaybackState();
});

audioElement.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayPauseIcon();
    savePlaybackState();
});

audioElement.addEventListener('timeupdate', () => {
    savePlaybackState();
});

window.loadSong = loadSong;
window.playCurrentSong = playCurrentSong;
window.playSong = playSong; // Expose playSong to global scope for onclick in HTML
window.playTrendingSong = playTrendingSong; // Expose to global scope
window.playMashup = playMashup; // Expose to global scope
window.openAlbumView = openAlbumView; // Expose to global scope
window.closeAlbumView = closeAlbumView; // Expose to global scope

function playover(songName) {
    const song = overseasSongs.find(s => s.name.toLowerCase() === songName.toLowerCase());
    if (!song) {
        console.error("Overseas song not found:", songName);
        return;
    }
    audioElement.src = song.path;
    audioElement.play().then(() => {
        updateMusicControllerUI();
    }).catch(err => {
        console.error("Playback error for overseas song:", err);
    });
    isPlaying = true;
}

window.playover = playover; 


// Add Allsongs entries to allSongs for search
for (const key in Allsongs) {
    if (Allsongs.hasOwnProperty(key)) {
        const song = Allsongs[key];
        allSongs.push({
            name: song.displayName.toLowerCase(),
            displayName: song.displayName,
            path: song.path,
            album: song.album || "Single",
            albumId: null,
            albumArt: song.albumArt || 'https://placehold.co/50x50/333333/FFFFFF?text=No+Art',
            artist: song.artist || ""
        });
    }
}


window.addEventListener('message', function(event) {
  if (event.data && event.data.album && typeof event.data.index === 'number') {
    playSong(event.data.album, event.data.index);
  }
});

// Save current song state before navigating away
window.addEventListener('beforeunload', () => {
    if (!audioElement.src) return;

    const currentSong = {
        path: decodeURIComponent(audioElement.src.replace(window.location.origin + '/', '')),
        currentTime: audioElement.currentTime,
        isPlaying: !audioElement.paused
    };
    

    sessionStorage.setItem('currentSong', JSON.stringify(currentSong));
});

// --- Update playTrendingSong to set playlist and index in correct visual sequence ---
// --- Helper: Set playlist and play song at index ---
function setPlaylistAndPlay(songsArray, index) {
    playlist = songsArray;
    playlistIndex = index;
    playPlaylistSong(playlistIndex);
}

// --- Update playTrendingSong to set playlist and index in correct visual sequence ---
function playTrendingSong(songId) {
    const trendingOrder = [
        "laalPari", "ishqHai", "dilENadaan", "chorBazari", "uyiAmma", "namonamo",
        "aayaReToofan", "kabira", "kaiseHua", "pehleBhiMain", "huaMain"
    ];
    const trendingArr = trendingOrder.map(id => trendingSongs[id]).filter(Boolean);
    const idx = trendingOrder.indexOf(songId);
    if (idx === -1) {
        console.error("Trending song not found in order array:", songId);
        return;
    }
    setPlaylistAndPlay(trendingArr, idx);
}

// --- Update playMashup to set playlist and index in correct visual sequence ---
function playMashup(mashupName) {
    const mashupOrder = [
        "vikram x jailer x leo x jawan",
        "nfshope",
        "animal x kgf",
        "kgf vs rrr vs pushpa",
        "panga x arjan vailly",
        "ishq hai x orangrez"
    ];
    const mashupArr = mashupOrder.map(name =>
        trendingMashups.find(m => m.name === name)
    ).filter(Boolean);
    const idx = mashupOrder.findIndex(name =>
        name === mashupName.toLowerCase()
    );
    if (idx === -1) {
        console.error("Trending mashup not found in order array:", mashupName);
        return;
    }
    setPlaylistAndPlay(mashupArr, idx);
}

// --- Update playbhakti to set playlist and index in correct visual sequence ---
function playbhakti(songName) {
    const bhaktiOrder = [
        "Hanuman Chalisa",
        "Ram Siya Ram",
        "Shree Krishna Sharanam Mamah",
        "Navkar Mantra",
        "achyutam keshavam",
        "Gayatri Manatra",
        "sankat mochan naam tiharo",
        "Shendur Lal Chadhayo",
        "Tu mane bhagwan ek vardan aapi de",
        "karupur gauravam",
        "shiv tandav stotram",
        "adharam madhuram",
        "Deva Shree Ganesha",
        "Mourya Mourya re",
        "Hum katha sunaate",
        "Yada-Yada-Hi-Dharmasya",
        "kijo kesari ke laal",
        "mangal bhavan amangal hari"
    ];
    const bhaktiArr = bhaktiOrder.map(name =>
        bhaktiSongs.find(s => s.name.toLowerCase() === name.toLowerCase())
    ).filter(Boolean);
    const idx = bhaktiOrder.findIndex(name =>
        name.toLowerCase() === songName.toLowerCase()
    );
    if (idx === -1) {
        console.error("Bhakti song not found in order array:", songName);
        return;
    }
    setPlaylistAndPlay(bhaktiArr, idx);
}

// --- Update playover to set playlist and index in correct visual sequence ---
function playover(songName) {
    const overOrder = [
        "Unholy",
        "Blue",
        "Perfect",
        "Despactio",
        "1985",
        "Agora hills",
        "Unstoppable",
        "Cheri Cheri Lady",
        "Until I Found You",
        "Flowers",
        "Woman",
        "Closer",
        "Industry Baby",
        "I just called to say I love you"
    ];
    const overArr = overOrder.map(name =>
        overseasSongs.find(s => s.name.toLowerCase() === name.toLowerCase())
    ).filter(Boolean);
    const idx = overOrder.findIndex(name =>
        name.toLowerCase() === songName.toLowerCase()
    );
    if (idx === -1) {
        console.error("Overseas song not found in order array:", songName);
        return;
    }
    setPlaylistAndPlay(overArr, idx);
}

// Make sure these are the only global assignments for these functions:
window.playSong = playSong;
window.playTrendingSong = playTrendingSong;
window.playMashup = playMashup;
window.playbhakti = playbhakti;
window.playover = playover;

// Add this logic after updating the song title in the controller
function updateControllerSongTitle(title, artist) {
  const titleElem = document.getElementById('controller-song-title');
  const artistElem = document.getElementById('controller-song-artist');

  titleElem.textContent = title;
  if (artistElem) artistElem.textContent = artist || '';
}




// Call updateControllerSongTitle(songName) whenever a new song is played.
