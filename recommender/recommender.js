const METHOD_DESCRIPTIONS = {
  cosine: "Closest songs using standardized audio features and cosine similarity.",
  unique: "Familiar neighbors that stand out most strongly in the asymmetry space.",
  directional: "Songs that follow the dominant asymmetry direction within the selected song's neighborhood.",
  trajectory: "Songs with the most similar trajectory complexity score."
}

let songs = []
let recommendations = {}
let selectedSongId = null
let activeMethod = "cosine"

document.addEventListener("DOMContentLoaded", init)

async function init() {
  bindControls()

  try {
    const [songsResponse, recommendationsResponse] = await Promise.all([
      fetch("songs.json"),
      fetch("recommendations.json")
    ])

    if (!songsResponse.ok || !recommendationsResponse.ok) {
      throw new Error("Could not load one or both JSON files.")
    }

    songs = await songsResponse.json()
    recommendations = await recommendationsResponse.json()

    if (!Array.isArray(songs) || songs.length === 0) {
      throw new Error("songs.json is empty.")
    }

    populateSongSelect(songs)
    setStatus(`${songs.length.toLocaleString()} songs loaded.`)

    selectSong(String(songs[0].id))
  } catch (error) {
    console.error(error)
    setStatus(
      "The recommender data could not be loaded. Put songs.json and recommendations.json in this recommender folder.",
      true
    )
  }
}

function bindControls() {
  const searchInput = document.getElementById("song-search")
  const songSelect = document.getElementById("song-select")
  const tabs = document.querySelectorAll(".method-tab")

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase()

    const filteredSongs = songs.filter(song => {
      const songName = String(song.song || "").toLowerCase()
      const artistName = String(song.artist || "").toLowerCase()

      return songName.includes(query) || artistName.includes(query)
    })

    populateSongSelect(filteredSongs)

    if (filteredSongs.length > 0) {
      selectSong(String(filteredSongs[0].id))
    } else {
      setStatus("No matching songs found.")
    }
  })

  songSelect.addEventListener("change", event => {
    if (event.target.value !== "") {
      selectSong(event.target.value)
    }
  })

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      activeMethod = tab.dataset.method

      tabs.forEach(item => item.classList.remove("active"))
      tab.classList.add("active")

      renderRecommendations()
    })
  })
}

function populateSongSelect(songList) {
  const songSelect = document.getElementById("song-select")
  const currentValue = songSelect.value

  songSelect.innerHTML = ""

  if (songList.length === 0) {
    const option = document.createElement("option")
    option.value = ""
    option.textContent = "No matching songs"
    songSelect.appendChild(option)
    return
  }

  const fragment = document.createDocumentFragment()

  songList.forEach(song => {
    const option = document.createElement("option")
    option.value = String(song.id)
    option.textContent = song.artist
      ? `${song.song} — ${song.artist}`
      : song.song

    fragment.appendChild(option)
  })

  songSelect.appendChild(fragment)

  if ([...songSelect.options].some(option => option.value === currentValue)) {
    songSelect.value = currentValue
  }
}

function selectSong(songId) {
  const song = songs.find(item => String(item.id) === String(songId))
  if (!song) return

  selectedSongId = String(song.id)

  const songSelect = document.getElementById("song-select")
  if ([...songSelect.options].some(option => option.value === selectedSongId)) {
    songSelect.value = selectedSongId
  }

  renderSelectedSong(song)
  renderRecommendations()
}

function renderSelectedSong(song) {
  document.getElementById("selected-song").classList.remove("hidden")
  document.getElementById("recommendation-section").classList.remove("hidden")

  document.getElementById("selected-title").textContent = song.song || "Unknown song"
  document.getElementById("selected-artist").textContent = song.artist || "Unknown artist"

  const trajectoryScore = song.trajectory?.traj_score
  document.getElementById("trajectory-score").textContent =
    formatNumber(trajectoryScore, 3)

  document.getElementById("tempo-value").textContent =
    formatNumber(song.features?.tempo, 1)

  document.getElementById("energy-value").textContent =
    formatNumber(song.features?.energy, 3)

  document.getElementById("danceability-value").textContent =
    formatNumber(song.features?.danceability, 3)

  const badge = document.getElementById("trajectory-badge")
  const level = String(song.traj_level || "unavailable").toLowerCase()

  badge.textContent = level === "unavailable"
    ? "Trajectory unavailable"
    : `${level} trajectory`

  badge.className = "trajectory-badge"
  if (["low", "medium", "high"].includes(level)) {
    badge.classList.add(level)
  }

  renderFeatureGrid(song.features || {})
}

function renderFeatureGrid(features) {
  const grid = document.getElementById("feature-grid")
  grid.innerHTML = ""

  Object.entries(features).forEach(([name, value]) => {
    const item = document.createElement("div")
    item.className = "feature-item"

    const label = document.createElement("span")
    label.textContent = name.replaceAll("_", " ")

    const number = document.createElement("strong")
    number.textContent = formatNumber(value, 3)

    item.append(label, number)
    grid.appendChild(item)
  })
}

function renderRecommendations() {
  const list = document.getElementById("recommendation-list")
  const description = document.getElementById("method-description")

  description.textContent = METHOD_DESCRIPTIONS[activeMethod]

  const selectedRecommendations =
    recommendations[selectedSongId]?.[activeMethod] || []

  list.innerHTML = ""

  if (selectedRecommendations.length === 0) {
    const empty = document.createElement("div")
    empty.className = "empty-state"

    empty.textContent = activeMethod === "trajectory"
      ? "No trajectory recommendations are available for this song."
      : "No recommendations are available for this method."

    list.appendChild(empty)
    return
  }

  selectedRecommendations.forEach((recommendation, rank) => {
    const song = songs[recommendation.index]
    if (!song) return

    const card = document.createElement("article")
    card.className = "recommendation-card"
    card.tabIndex = 0
    card.setAttribute("role", "button")

    const textWrap = document.createElement("div")

    const title = document.createElement("h3")
    title.textContent = `${rank + 1}. ${song.song || "Unknown song"}`

    const artist = document.createElement("p")
    artist.textContent = song.artist || "Unknown artist"

    const score = document.createElement("div")
    score.className = "score"
    score.textContent = formatNumber(recommendation.score, 3)

    textWrap.append(title, artist)
    card.append(textWrap, score)

    const openSong = () => {
      selectSong(String(song.id))
      document.getElementById("selected-song").scrollIntoView({
        behavior: "smooth",
        block: "start"
      })
    }

    card.addEventListener("click", openSong)
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        openSong()
      }
    })

    list.appendChild(card)
  })
}

function formatNumber(value, digits) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return "Unavailable"
  }

  return number.toFixed(digits)
}

function setStatus(message, isError = false) {
  const status = document.getElementById("load-status")
  status.textContent = message
  status.style.color = isError ? "#ff9fbd" : ""
}
