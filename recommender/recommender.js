const METHOD_DESCRIPTIONS = {
  cosine: "Find the songs that sound the most similar based on their audio characteristics. This method compares features such as tempo, energy, danceability, acousticness, and more to recommend the closest overall matches.",
  unique: "We first find the songs that are most musically similar, then recommend the one that stands out the most within that group to give you something familiar with a twist.",
  trajectory: "Songs whose musical journey changes most similarly over time. We split each song into 30-second segments, analyze each segment individually, and recommend songs that evolve in the most similar way from beginning to end."
}

let songs = []
let recommendations = {}
let selectedSongId = null
let activeMethod = "cosine"
let searchMode = "all"

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

    refreshSongSearch(true)
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
  const searchModeButtons = document.querySelectorAll(".search-mode")

  searchInput.addEventListener("input", () => refreshSongSearch(false))

  songSelect.addEventListener("change", event => {
    if (event.target.value !== "") {
      selectSong(event.target.value)
    }
  })

  searchModeButtons.forEach(button => {
    button.addEventListener("click", () => {
      searchMode = button.dataset.searchMode
      searchModeButtons.forEach(item => item.classList.remove("active"))
      button.classList.add("active")
      searchInput.value = ""
      refreshSongSearch(true)
    })
  })

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      if (tab.disabled) return

      activeMethod = tab.dataset.method
      tabs.forEach(item => item.classList.remove("active"))
      tab.classList.add("active")
      renderRecommendations()
    })
  })
}

function isUsableNumber(value) {
  if (value === null || value === undefined || value === "") return false
  return Number.isFinite(Number(value))
}

function hasTrajectory(song) {
  return isUsableNumber(song?.trajectory?.traj_score) ||
    isUsableNumber(song?.traj_score)
}

function hasTrajectoryRecommendations(song) {
  const songId = String(song?.id ?? "")
  return hasTrajectory(song) &&
    Array.isArray(recommendations[songId]?.trajectory) &&
    recommendations[songId].trajectory.length > 0
}

function getTrajectoryScore(song) {
  if (isUsableNumber(song?.trajectory?.traj_score)) {
    return Number(song.trajectory.traj_score)
  }

  if (isUsableNumber(song?.traj_score)) {
    return Number(song.traj_score)
  }

  return null
}

function getSearchPool() {
  return searchMode === "trajectory"
    ? songs.filter(hasTrajectoryRecommendations)
    : songs
}

function refreshSongSearch(selectFirst) {
  const query = document.getElementById("song-search").value.trim().toLowerCase()
  const pool = getSearchPool()

  const filteredSongs = pool.filter(song => {
    const songName = String(song.song || "").toLowerCase()
    const artistName = String(song.artist || "").toLowerCase()
    return songName.includes(query) || artistName.includes(query)
  })

  populateSongSelect(filteredSongs)
  updateSearchModeNote(pool.length)

  if (filteredSongs.length === 0) {
    setStatus(
      searchMode === "trajectory"
        ? "No matching songs with musical journey recommendations were found."
        : "No matching songs found."
    )
    return
  }

  setStatus(`${filteredSongs.length.toLocaleString()} songs available in this search.`)

  const selectedStillVisible = filteredSongs.some(song => String(song.id) === selectedSongId)
  if (selectFirst || !selectedStillVisible) {
    selectSong(String(filteredSongs[0].id))
  }
}

function updateSearchModeNote(poolSize) {
  const note = document.getElementById("search-mode-note")

  note.textContent = searchMode === "trajectory"
    ? `Showing ${poolSize.toLocaleString()} songs with musical journey analysis and recommendations.`
    : `Showing the full catalog of ${songs.length.toLocaleString()} songs. Songs without musical journey data display Journey unavailable.`
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
  updateTrajectoryMethod(song)
  renderRecommendations()
}

function renderSelectedSong(song) {
  document.getElementById("selected-song").classList.remove("hidden")
  document.getElementById("recommendation-section").classList.remove("hidden")

  document.getElementById("selected-title").textContent = song.song || "Unknown song"
  document.getElementById("selected-artist").textContent = song.artist || "Unknown artist"
  document.getElementById("trajectory-score").textContent = formatNumber(getTrajectoryScore(song), 3)
  document.getElementById("tempo-value").textContent = formatNumber(song.features?.tempo, 1)
  document.getElementById("energy-value").textContent = formatNumber(song.features?.energy, 3)
  document.getElementById("danceability-value").textContent = formatNumber(song.features?.danceability, 3)

  const badge = document.getElementById("trajectory-badge")
  const available = hasTrajectory(song)
  const level = String(song.traj_level || song.trajectory?.traj_level || "unavailable").toLowerCase()

  badge.textContent = available && ["low", "medium", "high"].includes(level)
    ? `${level} journey change`
    : available
      ? "Journey available"
      : "Journey unavailable"

  badge.className = "trajectory-badge"
  if (available && ["low", "medium", "high"].includes(level)) {
    badge.classList.add(level)
  }

  renderFeatureGrid(song.features || {})
}

function updateTrajectoryMethod(song) {
  const trajectoryTab = document.querySelector('[data-method="trajectory"]')
  const note = document.getElementById("trajectory-method-note")
  const available = hasTrajectoryRecommendations(song)

  trajectoryTab.disabled = !available
  trajectoryTab.setAttribute("aria-disabled", String(!available))

  if (!available) {
    trajectoryTab.title = "Musical journey recommendations are unavailable for this song"
    note.textContent = "Similar Musical Journey recommendations are unavailable for this song. Choose Musical journey songs only above to find compatible songs."
    note.classList.remove("hidden")

    if (activeMethod === "trajectory") {
      activeMethod = "cosine"
      document.querySelectorAll(".method-tab").forEach(item => item.classList.remove("active"))
      document.querySelector('[data-method="cosine"]').classList.add("active")
    }
  } else {
    trajectoryTab.title = ""
    note.textContent = ""
    note.classList.add("hidden")
  }
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

  const selectedRecommendations = recommendations[selectedSongId]?.[activeMethod] || []
  list.innerHTML = ""

  if (selectedRecommendations.length === 0) {
    const empty = document.createElement("div")
    empty.className = "empty-state"
    empty.textContent = activeMethod === "trajectory"
      ? "Similar Musical Journey recommendations are unavailable for this song."
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
      if (searchMode === "trajectory" && !hasTrajectoryRecommendations(song)) {
        searchMode = "all"
        document.querySelectorAll(".search-mode").forEach(item => item.classList.remove("active"))
        document.querySelector('[data-search-mode="all"]').classList.add("active")
        refreshSongSearch(false)
      }

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
  if (!isUsableNumber(value)) return "Unavailable"
  return Number(value).toFixed(digits)
}

function setStatus(message, isError = false) {
  const status = document.getElementById("load-status")
  status.textContent = message
  status.style.color = isError ? "#ff9fbd" : ""
}