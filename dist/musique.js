// ─── Lecteur YouTube custom ─────────────────────────────────────────────────
// Ce fichier gère entièrement le lecteur de musique intégré (style SoundCloud).
// Il dépend de l'API IFrame YouTube chargée dans index.html.

var ytPlayer      = null;
var ytPlayerReady = false;
var currentTrackIndex = 0;
var localAudioPlayer = null;

var _defaultTracks = [];
var _legacyDefaultTracks = [
    'XSXEaikz0Bc',
    'blAFxjhg62k'
];
var tracks = (function() {
    try {
        var saved = localStorage.getItem('scribouillart_tracks');
        if (!saved) return _defaultTracks.slice();

        var parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return _defaultTracks.slice();
        if (parsed.length === 0) return [];

        var isLegacyDefaults = parsed.length === _legacyDefaultTracks.length && parsed.every(function(track, index) {
            return track && track.id === _legacyDefaultTracks[index];
        });

        if (isLegacyDefaults) {
            localStorage.removeItem('scribouillart_tracks');
            return _defaultTracks.slice();
        }

        return parsed;
    } catch(e) { return _defaultTracks.slice(); }
})();

function _saveTracks() {
    try { localStorage.setItem('scribouillart_tracks', JSON.stringify(tracks)); } catch(e) {}
}

function _extractYouTubeId(url) {
    // Supporte : youtu.be/ID, ?v=ID, /embed/ID, /live/ID, playlists → list=ID
    var patterns = [
        /[?&]v=([^&#]{11})/,
        /youtu\.be\/([^?&#]{11})/,
        /\/embed\/([^?&#]{11})/,
        /\/live\/([^?&#]{11})/,
        /\/shorts\/([^?&#]{11})/
    ];
    for (var i = 0; i < patterns.length; i++) {
        var m = url.match(patterns[i]);
        if (m) return m[1];
    }
    // Si c'est déjà un ID brut de 11 caractères
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
    return null;
}

function _showManageTracksModal() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:10px;padding:24px 28px;min-width:340px;max-width:90vw;color:#f1f1f1;font-family:inherit;max-height:80vh;display:flex;flex-direction:column';

    var close = function() { document.body.removeChild(overlay); };

    function render() {
        modal.innerHTML = [
            '<p style="margin:0 0 16px;font-size:15px;font-weight:600">Pistes (' + tracks.length + ')</p>',
            '<div id="_trackListContainer" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:6px;margin-bottom:16px">',
            tracks.map(function(t, i) {
                var isCurrent = i === currentTrackIndex;
                return [
                    '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:6px;background:' + (isCurrent ? '#2a3f55' : '#2a2a2a') + ';border:1px solid ' + (isCurrent ? '#4a8ec2' : '#444') + '">',
                    '<span style="font-size:11px;color:#888;min-width:16px;text-align:right">' + (i + 1) + '</span>',
                    '<span style="flex:1;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + t.title + '">' + t.title + '</span>',
                    '<button data-idx="' + i + '" class="_playTrackBtn" title="Lire" style="background:none;border:none;color:#aaa;cursor:pointer;padding:2px 4px;font-size:14px">&#9654;</button>',
                    '<button data-idx="' + i + '" class="_delTrackBtn" title="Supprimer" style="background:none;border:none;color:#d63638;cursor:pointer;padding:2px 4px;font-size:15px">&times;</button>',
                    '</div>'
                ].join('');
            }).join(''),
            '</div>',
            '<div style="text-align:right"><button id="_manageClose" style="background:#2a2a2a;border:1px solid #555;border-radius:6px;color:#f1f1f1;cursor:pointer;font-size:13px;padding:6px 16px">Fermer</button></div>'
        ].join('');

        modal.querySelector('#_manageClose').addEventListener('click', close);

        modal.querySelectorAll('._delTrackBtn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.idx);
                tracks.splice(idx, 1);
                _saveTracks();
                if (tracks.length === 0) {
                    currentTrackIndex = 0;
                    updateTrackTitle();
                    render();
                    return;
                }
                if (currentTrackIndex >= tracks.length) currentTrackIndex = 0;
                updateTrackTitle();
                render();
            });
        });

        modal.querySelectorAll('._playTrackBtn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var idx = parseInt(btn.dataset.idx);
                currentTrackIndex = idx;
                updateTrackTitle();
                if (ytPlayer && ytPlayerReady) {
                    ytPlayer.loadVideoById({ videoId: tracks[idx].id, startSeconds: 0 });
                    ytPlayer.playVideo();
                    updateMusicUI(true);
                }
                render();
            });
        });
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    render();
}

function _showAddTrackModal() {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:flex;align-items:center;justify-content:center';

    var modal = document.createElement('div');
    modal.style.cssText = 'background:#1e1e1e;border:1px solid #444;border-radius:10px;padding:24px 28px;min-width:320px;color:#f1f1f1;font-family:inherit';
    modal.innerHTML = [
        '<p style="margin:0 0 16px;font-size:15px;font-weight:600">Ajouter une piste</p>',
        '<label style="font-size:12px;color:#aaa;display:block;margin-bottom:4px">Lien YouTube (vidéo, live, radio…) ou ID</label>',
        '<input id="_addUrl" type="text" placeholder="https://www.youtube.com/watch?v=..." style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid #555;background:#2a2a2a;color:#f1f1f1;font-size:13px;box-sizing:border-box;margin-bottom:12px">',
        '<label style="font-size:12px;color:#aaa;display:block;margin-bottom:4px">Titre affiché</label>',
        '<input id="_addTitle" type="text" placeholder="Ma radio, ma playlist…" style="width:100%;padding:8px 10px;border-radius:6px;border:1px solid #555;background:#2a2a2a;color:#f1f1f1;font-size:13px;box-sizing:border-box;margin-bottom:18px">',
        '<div style="display:flex;gap:10px;justify-content:flex-end">',
        '<button id="_addCancel" style="background:none;border:none;color:#888;cursor:pointer;font-size:13px;padding:6px 12px">Annuler</button>',
        '<button id="_addConfirm" style="background:#4a8ec2;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:13px;padding:6px 16px">Ajouter</button>',
        '</div>'
    ].join('');

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var urlInput   = modal.querySelector('#_addUrl');
    var titleInput = modal.querySelector('#_addTitle');
    var close = function() { document.body.removeChild(overlay); };

    setTimeout(function() { urlInput.focus(); }, 50);

    modal.querySelector('#_addCancel').addEventListener('click', close);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

    modal.querySelector('#_addConfirm').addEventListener('click', function() {
        var url   = urlInput.value.trim();
        var title = titleInput.value.trim() || url;
        var id    = _extractYouTubeId(url);

        if (!id) {
            urlInput.style.borderColor = '#d63638';
            urlInput.placeholder = 'Lien YouTube non reconnu…';
            return;
        }

        tracks.push({ id: id, title: title });
        _saveTracks();
        close();

        // Aller directement sur la piste ajoutée
        currentTrackIndex = tracks.length - 1;
        updateTrackTitle();
        if (ytPlayer && ytPlayerReady) {
            ytPlayer.loadVideoById({ videoId: id, startSeconds: 0 });
            ytPlayer.playVideo();
            updateMusicUI(true);
        }
    });
}

function formatTrackTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    var totalSeconds = Math.floor(seconds);
    var minutes = Math.floor(totalSeconds / 60);
    var secs = totalSeconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function updateLocalProgress() {
    var audio = ensureLocalAudioPlayer();
    var currentTimeEl = document.querySelector('.music-current-time');
    var progressEl = document.querySelector('.music-progress-bar span');
    var duration = audio && audio.duration && isFinite(audio.duration) ? audio.duration : 0;
    var current = audio && audio.currentTime && isFinite(audio.currentTime) ? audio.currentTime : 0;

    if (currentTimeEl) {
        currentTimeEl.textContent = formatTrackTime(current);
    }

    if (progressEl) {
        if (!duration) {
            progressEl.style.width = '0%';
        } else {
            progressEl.style.width = ((current / duration) * 100).toFixed(2) + '%';
        }
    }
}

function ensureLocalAudioPlayer() {
    if (localAudioPlayer) return localAudioPlayer;
    localAudioPlayer = document.getElementById('localAudioPlayer');
    if (!localAudioPlayer) {
        localAudioPlayer = document.createElement('audio');
        localAudioPlayer.id = 'localAudioPlayer';
        localAudioPlayer.preload = 'metadata';
        localAudioPlayer.style.display = 'none';
        document.body.appendChild(localAudioPlayer);
    }

    localAudioPlayer.onplay = function() { updateMusicUI(true); updateLocalProgress(); };
    localAudioPlayer.onpause = function() { updateMusicUI(false); updateLocalProgress(); };
    localAudioPlayer.onended = function() {
        if (!tracks.length) return;
        changeTrack(1);
    };
    localAudioPlayer.ontimeupdate = updateLocalProgress;
    localAudioPlayer.onloadedmetadata = updateLocalProgress;

    return localAudioPlayer;
}

function isLocalTrack(track) {
    return !!(track && track.type === 'local');
}

function updateMusicUI(playing) {
    var iconPlay  = document.querySelector('.sc-icon-play');
    var iconPause = document.querySelector('.sc-icon-pause');
    var bars      = document.getElementById('scBars');
    if (iconPlay && iconPause) {
        iconPlay.style.display  = playing ? 'none'  : 'block';
        iconPause.style.display = playing ? 'block' : 'none';
    }
    if (bars) bars.classList.toggle('playing', playing);
}

function updateTrackTitle() {
    var track = tracks[currentTrackIndex] || null;
    var scPlayer = document.getElementById('scPlayer');
    var titleEl = document.querySelector('.sc-title');
    var thumb = document.getElementById('scThumb');
    var thumbLink = document.getElementById('scThumbLink');
    var currentTimeEl = document.querySelector('.music-current-time');
    var totalTimeEl = document.querySelector('.music-total-time');
    var progressEl = document.querySelector('.music-progress-bar span');

    if (scPlayer) {
        scPlayer.classList.toggle('music-empty', !track);
    }

    if (!track) {
        if (titleEl) {
            titleEl.textContent = '';
            titleEl.title = '';
        }
        if (thumb) {
            thumb.removeAttribute('src');
            thumb.alt = '';
        }
        if (thumbLink) {
            thumbLink.style.display = 'none';
            thumbLink.href = '#';
            thumbLink.title = '';
        }
        if (currentTimeEl) currentTimeEl.textContent = '00:00';
        if (totalTimeEl) totalTimeEl.textContent = '00:00';
        if (progressEl) progressEl.style.width = '0%';
        return;
    }

    if (titleEl) {
        titleEl.textContent = track.title;
        titleEl.title = track.title;
    }

    if (thumb) {
        thumb.alt = track.title;
        if (isLocalTrack(track)) {
            thumb.src = 'assets/icons/disquevinyle.png';
            thumb.style.objectFit = 'contain';
        } else {
            thumb.style.objectFit = 'cover';
            var candidates = ['maxresdefault.jpg', 'sddefault.jpg', 'hqdefault.jpg', 'default.jpg'];
            var currentIndex = 0;
            function setThumbCandidate() {
                if (currentIndex >= candidates.length) return;
                thumb.src = 'https://img.youtube.com/vi/' + track.id + '/' + candidates[currentIndex];
                currentIndex += 1;
            }
            thumb.onerror = function() {
                setThumbCandidate();
            };
            setThumbCandidate();
        }
    }

    if (thumbLink) {
        if (isLocalTrack(track)) {
            thumbLink.style.display = 'none';
            thumbLink.href = '#';
            thumbLink.title = '';
        } else {
            thumbLink.href = 'https://www.youtube.com/watch?v=' + track.id;
            thumbLink.title = 'Ouvrir sur YouTube';
            thumbLink.style.display = '';
        }
    }

    if (currentTimeEl) currentTimeEl.textContent = '00:00';
    if (totalTimeEl) totalTimeEl.textContent = '00:00';
    if (progressEl) progressEl.style.width = '0%';
}

// Appelée automatiquement par l'API YouTube quand elle est prête
function openLocalMusicPicker() {
    var input = document.getElementById('localMusicInput');
    if (!input) return;
    input.value = '';
    input.click();
}

function handleLocalAudioSelection(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;

    var url = URL.createObjectURL(file);
    tracks.push({
        id: 'local-' + Date.now(),
        title: file.name.replace(/\.[^/.]+$/, '') || 'Musique locale',
        type: 'local',
        url: url
    });

    currentTrackIndex = tracks.length - 1;
    updateTrackTitle();

    var audio = ensureLocalAudioPlayer();
    audio.src = url;
    audio.play().catch(function() {});
    updateMusicUI(true);
    event.target.value = '';
}

function onYouTubeIframeAPIReady() {
    var initialTrack = tracks[currentTrackIndex] || null;
    ytPlayer = new YT.Player('ytApiContainer', {
        height: '1',
        width: '1',
        videoId: initialTrack && !isLocalTrack(initialTrack) ? initialTrack.id : '',
        playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
        events: {
            onReady: function (e) {
                ytPlayerReady = true;
                var vol = document.getElementById('scVolume');
                if (vol) e.target.setVolume(parseInt(vol.value, 10) || 80);
            },
            onStateChange: function (e) {
                var playing = (e.data === YT.PlayerState.PLAYING);
                updateMusicUI(playing);
            }
        }
    });
}

function playCurrentTrack() {
    if (!tracks.length) return;

    var track = tracks[currentTrackIndex];
    if (isLocalTrack(track)) {
        var audio = ensureLocalAudioPlayer();
        if (audio.src !== track.url) {
            audio.src = track.url;
        }

        if (audio.paused) {
            audio.play().catch(function() {});
            updateMusicUI(true);
        } else {
            audio.pause();
            updateMusicUI(false);
        }
        return;
    }

    if (!ytPlayerReady || !ytPlayer) return;

    var state = ytPlayer.getPlayerState();
    if (state === YT.PlayerState.PLAYING || state === YT.PlayerState.BUFFERING) {
        ytPlayer.pauseVideo();
    } else {
        if (state === YT.PlayerState.UNSTARTED || state === -1) {
            ytPlayer.loadVideoById({ videoId: track.id, startSeconds: 0 });
        }
        ytPlayer.playVideo();
    }
}

function changeTrack(direction) {
    if (!tracks.length) return;
    currentTrackIndex = (currentTrackIndex + direction + tracks.length) % tracks.length;
    updateTrackTitle();

    var track = tracks[currentTrackIndex];
    if (isLocalTrack(track)) {
        var audio = ensureLocalAudioPlayer();
        if (track.url) {
            audio.src = track.url;
            audio.play().catch(function() {});
        }
        updateMusicUI(true);
        return;
    }

    if (!ytPlayerReady || !ytPlayer) return;
    ytPlayer.loadVideoById({ videoId: track.id, startSeconds: 0 });
    ytPlayer.playVideo();
    updateMusicUI(true);
}

(function initCustomMusicControls() {
    var playBtn     = document.getElementById('scPlayBtn');
    var prevBtn     = document.getElementById('scPrevBtn');
    var nextBtn     = document.getElementById('scNextBtn');
    var volumeInput = document.getElementById('scVolume');
    var addBtn      = document.getElementById('youtubeAddBtn');
    var localBtn    = document.getElementById('localMusicBtn');
    var localInput  = document.getElementById('localMusicInput');
    var manageBtn   = document.getElementById('youtubeManageBtn');

    if (!playBtn) return;

    if (addBtn) addBtn.addEventListener('click', _showAddTrackModal);
    if (localBtn) localBtn.addEventListener('click', openLocalMusicPicker);
    if (localInput) localInput.addEventListener('change', handleLocalAudioSelection);
    if (manageBtn) manageBtn.addEventListener('click', _showManageTracksModal);

    updateTrackTitle();

    playBtn.addEventListener('click', playCurrentTrack);

    if (volumeInput) {
        volumeInput.addEventListener('input', function () {
            var audio = ensureLocalAudioPlayer();
            if (tracks[currentTrackIndex] && isLocalTrack(tracks[currentTrackIndex])) {
                audio.volume = parseInt(this.value, 10) / 100;
                return;
            }
            if (ytPlayer && ytPlayerReady) {
                ytPlayer.setVolume(parseInt(this.value, 10) || 0);
            }
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { changeTrack(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { changeTrack(1);  });
})();
