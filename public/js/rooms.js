// This file loads rooms and redraws the list when search filters change.
const roomList = document.querySelector("#room-list");
const filterForm = document.querySelector("#room-filters");
const resultCount = document.querySelector("#results-count");
const emptyState = document.querySelector("#empty-state");
const clearButton = document.querySelector("#clear-filters");
let allRooms = [];

function createRoomCard(room) {
  const card = document.createElement("article");
  card.className = "room-card";

  const artwork = document.createElement("div");
  artwork.className = "room-art room-art-" + (room.id % 4);
  artwork.setAttribute("aria-hidden", "true");

  const roomNumber = document.createElement("span");
  roomNumber.className = "room-art-number";
  roomNumber.textContent = "ROOM " + String(room.id).padStart(2, "0");
  artwork.appendChild(roomNumber);

  const content = document.createElement("div");
  content.className = "room-content";

  const tag = document.createElement("p");
  tag.className = "room-tag";
  tag.textContent = room.theme;

  const title = document.createElement("h3");
  title.textContent = room.name;

  const venue = document.createElement("p");
  venue.className = "room-venue";
  venue.textContent = room.venue + " · " + room.location;

  const description = document.createElement("p");
  description.className = "room-description";
  description.textContent = room.description;

  const details = document.createElement("ul");
  details.className = "room-details";

  const roomDetails = [
    room.minPlayers + "–" + room.maxPlayers + " players",
    room.duration + " min",
    room.difficulty + " · " + room.scareLevel + " scares"
  ];

  for (let i = 0; i < roomDetails.length; i++) {
    const item = document.createElement("li");
    item.textContent = roomDetails[i];
    details.appendChild(item);
  }

  const cardFooter = document.createElement("div");
  cardFooter.className = "room-card-footer";

  const experience = document.createElement("span");
  experience.textContent = room.experience;

  const price = document.createElement("strong");
  price.textContent = "$" + room.pricePerPerson + " / person";

  cardFooter.appendChild(experience);
  cardFooter.appendChild(price);

  content.appendChild(tag);
  content.appendChild(title);
  content.appendChild(venue);
  content.appendChild(description);
  content.appendChild(details);
  content.appendChild(cardFooter);

  card.appendChild(artwork);
  card.appendChild(content);
  return card;
}

function getMatchingRooms() {
  const search = filterForm.elements.search.value.trim().toLowerCase();
  const groupSize = Number(filterForm.elements.groupSize.value);
  const difficulty = filterForm.elements.difficulty.value;
  const experience = filterForm.elements.experience.value;
  const scareLevel = filterForm.elements.scareLevel.value;
  const theme = filterForm.elements.theme.value;
  const maxPrice = Number(filterForm.elements.budget.value);
  const matchingRooms = [];

  for (let i = 0; i < allRooms.length; i++) {
    const room = allRooms[i];
    const searchableText = (
      room.name + " " + room.venue + " " + room.location + " " +
      room.theme + " " + room.description
    ).toLowerCase();

    if (search && searchableText.indexOf(search) === -1) {
      continue;
    }

    if (groupSize && (room.minPlayers > groupSize || room.maxPlayers < groupSize)) {
      continue;
    }

    if (difficulty && room.difficulty !== difficulty) {
      continue;
    }

    if (experience && room.experience !== experience) {
      continue;
    }

    if (scareLevel && room.scareLevel !== scareLevel) {
      continue;
    }

    if (theme && room.theme !== theme) {
      continue;
    }

    if (maxPrice && room.pricePerPerson > maxPrice) {
      continue;
    }

    matchingRooms.push(room);
  }

  return matchingRooms;
}

function renderRooms() {
  const matchingRooms = getMatchingRooms();

  while (roomList.firstChild) {
    roomList.removeChild(roomList.firstChild);
  }

  for (let i = 0; i < matchingRooms.length; i++) {
    roomList.appendChild(createRoomCard(matchingRooms[i]));
  }

  if (matchingRooms.length === 1) {
    resultCount.textContent = "1 room to explore";
  } else {
    resultCount.textContent = matchingRooms.length + " rooms to explore";
  }

  emptyState.hidden = matchingRooms.length !== 0;
}

function updateRooms() {
  renderRooms();
}

function stopFilterFormSubmit(event) {
  event.preventDefault();
}

function clearFilters() {
  filterForm.reset();
  renderRooms();
}

async function loadRooms() {
  try {
    const response = await fetch("/api/rooms");

    if (!response.ok) {
      throw new Error("The room list could not be loaded.");
    }

    allRooms = await response.json();
    renderRooms();

    filterForm.addEventListener("submit", stopFilterFormSubmit);
    filterForm.addEventListener("input", updateRooms);
    filterForm.addEventListener("change", updateRooms);
    clearButton.addEventListener("click", clearFilters);
  } catch (error) {
    resultCount.textContent = "Room listings are unavailable right now.";
    console.error(error);
  }
}

loadRooms();
