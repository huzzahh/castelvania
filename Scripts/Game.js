(function () {
  let playerId;
  let playerRef;
  let players = {};
  let playerElements = {};

  const gameContainer = document.querySelector(".gameContainer");

  function handleArrowPress(xChange = 0, yChange = 0) {
    const newX = players[playerId].x + xChange;
    const newY = players[playerId].y + yChange;
    players[playerId].x = newX;
    players[playerId].y = newY;
    if (xChange === 1) {
      players[playerId].direction = "right";
    }
    if (xChange === -1) {
      players[playerId].direction = "left";
    }
    if (yChange === 1) {
      players[playerId].direction = "down";
    }
    if (yChange === -1) {
      players[playerId].direction = "up";
    }
    playerRef.set(players[playerId]);
  }

  function randomFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function createName() {
    const prefix = randomFromArray([
      "BOB",
      "PIKACHU",
      "HOMER",
      "BUGS",
      "BART",
      "TOM",
      "YING",
      "YANG",
    ]);
    const animal = randomFromArray(["ESPONJA", "MOUSE", "DOO", "MOSBY"]);
    return `${prefix} ${animal}`;
  }

  function initGame() {
    const allPlayersRef = firebase.database().ref(`players`);

    new KeyPressListener("ArrowUp", () => handleArrowPress(0, -1));
    new KeyPressListener("ArrowDown", () => handleArrowPress(0, 1));
    new KeyPressListener("ArrowLeft", () => handleArrowPress(-1, 0));
    new KeyPressListener("ArrowRight", () => handleArrowPress(1, 0));

    allPlayersRef.on("value", (snapshot) => {
      players = snapshot.val() || {};
      Object.keys(players).forEach((key) => {
        const characterState = players[key];
        let el = playerElements[key];
        el.querySelector(".Character_name").innerText = characterState.name;
        el.setAttribute("data-direction", characterState.direction);

        const left = 16 * characterState.x + "px";
        const top = 16 * characterState.y - 4 + "px";
        el.style.transform = `translate3d(${left}, ${top}, 0)`;
      });
    });

    allPlayersRef.on("child_added", (snapshot) => {
      const addedPlayer = snapshot.val();
      const characterElement = document.createElement("div");
      characterElement.classList.add("Character", "grid-cell");

      if (addedPlayer.id === playerId) {
        characterElement.classList.add("you");
      }
      characterElement.innerHTML = `
                 <div class="Character_shadow grid-cell"></div>
                 <div class="Character_sprite grid-cell"></div>
                 <div class="Character_name-container">
                   <span class="Character_name"></span>
                 </div>
                 <div class="Character_you-arrow"></div>
               `;
      playerElements[addedPlayer.id] = characterElement;

      characterElement.querySelector(".Character_name").innerText =
        addedPlayer.name;
      characterElement.setAttribute("data-direction", addedPlayer.direction);

      const left = 16 * addedPlayer.x + "px";
      const top = 16 * addedPlayer.y - 4 + "px";

      characterElement.style.transform = `translate3d(${left}, ${top}, 0)`;
      gameContainer.appendChild(characterElement);
    });

    allPlayersRef.on("child_removed", (snapshot) => {
      const removedKey = snapshot.val().id;
      gameContainer.removeChild(playerElements[removedKey]);
      delete playerElements[removedKey];
    });
  }

  firebase
    .auth()
    .signInAnonymously()
    .catch((error) => {
      var errorCode = error.core;
      var errorMessage = error.message;
      console.log(errorCode, errorMessage);
    });

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      playerId = user.uid;
      playerRef = firebase.database().ref(`players/${playerId}`);
      playerRef.set({
        id: playerId,
        name: createName(),
        direction: "none",
        color: "blue",
        x: 3,
        y: 3,
      });

      playerRef.onDisconnect().remove();
      initGame();
    }
  });
})();
