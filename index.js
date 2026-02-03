const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

const loadingScreen = document.getElementById("loading");

const images = {
  player: "./assets/jet.png",
  invader: "./assets/chicken.png",
};

const loadedImages = {};
let loadedCount = 0;
const totalImages = Object.keys(images).length;

function loadImages(callback) {
  Object.entries(images).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      loadedImages[key] = img;
      loadedCount++;

      if (loadedCount === totalImages) {
        callback();
      }
    };
  });
}

class Player {
  constructor() {
    this.width = 128;
    this.height = 128;

    this.position = {
      x: canvas.width / 2 - this.width / 2,
      y: canvas.height - this.height - 20,
    };

    this.velocity = {
      x: 0,
      y: 0,
    };

    this.speed = 15;

    this.img = loadedImages.player;
  }

  update() {
    this.draw();

    player.position.x += player.velocity.x;
    player.position.y += player.velocity.y;

    // clamp X
    player.position.x = Math.max(
      0,
      Math.min(canvas.width - player.width, player.position.x),
    );

    // clamp Y
    player.position.y = Math.max(
      canvas.height / 2,
      Math.min(canvas.height - player.height, player.position.y),
    );
  }

  draw() {
      c.drawImage(
        this.img,
        this.position.x,
        this.position.y,
        this.width,
        this.height,
      );
  }
}

class Eggs {
  constructor({ position }) {
    this.position = position;
    this.velocity = {
      x: 0,
      y: 15,
    };
    this.radius = 5;
    this.speed = 10;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "green";
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Bullets {
  constructor(position) {
    this.position = position;
    this.velocity = {
      x: 0,
      y: -15,
    };
    this.radius = 5;
    this.speed = 10;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = "black";
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Invader {
  constructor({ position }) {
    this.position = { ...position };
    this.velocity = { x: 0, y: 0 };

    this.img = loadedImages.invader; 
    this.width = this.img.width * 0.1;
    this.height = this.img.height * 0.1;
  }

  update({ velocity }) {
    this.draw();
    this.position.x += velocity.x;
    this.position.y += velocity.y;
  }

  draw() {
    c.drawImage(
      this.img,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }
}

class Grid {
  constructor() {
    this.position = {
      x: 10,
      y: 10,
    };
    this.velocity = {
      x: 8,
      y: 0,
    };
    this.invaders = [];

    this.columns = Math.floor(Math.random() * 5) + 3; // 3–7
    this.rows = Math.floor(Math.random() * 3) + 2; // 2–4

    const spacingX = 105;
    const spacingY = 80;

    this.width = this.columns * spacingX;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.columns; col++) {
        this.invaders.push(
          new Invader({
            position: {
              x: this.position.x + col * spacingX,
              y: this.position.y + row * spacingY,
            },
          }),
        );
      }
    }
  }
  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.x + this.width >= canvas.width || this.position.x < 0) {
      this.velocity.x = -this.velocity.x;
    }
  }
}

// collision detection both axis ========================================

function bulletHitsInvader(bullet, invader) {
  return (
    bullet.position.x + bullet.radius >= invader.position.x &&
    bullet.position.x - bullet.radius <= invader.position.x + invader.width &&
    bullet.position.y + bullet.radius >= invader.position.y &&
    bullet.position.y - bullet.radius <= invader.position.y + invader.height
  );
}
let player; // declare only

// const player = new Player();
const gridsArray = [];
const BulletArray = [];
const EggsArray = [];

//keys ====================================================================

const keys = {
  ArrowLeft: {
    pressed: false,
  },
  ArrowRight: {
    pressed: false,
  },
  ArrowUp: {
    pressed: false,
  },
  ArrowDown: {
    pressed: false,
  },
};
let frames = 0;
let randomInterval = Math.floor(Math.random() * 500 + 50);

//game loop ====================================================================

function animate() {
  requestAnimationFrame(animate);

  // clear
  c.clearRect(0, 0, canvas.width, canvas.height);

  // update logic

  // reseting velocity of player every frame
  player.velocity.x = 0;
  player.velocity.y = 0;

  // horizontal movement
  if (keys.ArrowLeft.pressed) {
    player.velocity.x = -player.speed;
  }
  if (keys.ArrowRight.pressed) {
    player.velocity.x = player.speed;
  }
  // vertical movement
  if (keys.ArrowUp.pressed) {
    player.velocity.y = -player.speed;
  }
  if (keys.ArrowDown.pressed) {
    player.velocity.y = player.speed;
  }

  if (gridsArray.length <= 0) {
    gridsArray.push(new Grid());
  }

  //Spawning grid and moving grid
  gridsArray.forEach((grid, gridIdx) => {
    grid.update();
    for (i = grid.invaders.length - 1; i >= 0; i--) {
      const invader = grid.invaders[i];
      invader.update({ velocity: grid.velocity });

      for (j = BulletArray.length - 1; j >= 0; j--) {
        const bullet = BulletArray[j];

        //removing bullets and invaders
        if (bulletHitsInvader(bullet, invader)) {
          grid.invaders.splice(i, 1);
          BulletArray.splice(j, 1);

          //changing grid width if far invaders are removed
          if (grid.invaders.length == 0) {
            gridsArray.splice(gridIdx, 1);
          }
        }
      }
    }
  });

  BulletArray.forEach((bullet, index) => {
    // removing bullets
    if (bullet.position.y + bullet.radius < 0) {
      BulletArray.splice(index, 1);
    } else {
      bullet.update();
    }
  });

  // render
  player.update();
}

//starting =====================================================================
loadImages(() => {
  loadingScreen.style.display = "none";
  player = new Player();   // ✅ SAFE now
  animate();
});


//listners =======================================================================
window.addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "ArrowLeft":
      keys.ArrowLeft.pressed = true;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = true;
      break;
    case "ArrowUp":
      keys.ArrowUp.pressed = true;
      break;
    case "ArrowDown":
      keys.ArrowDown.pressed = true;
      break;
    case " ":
      break;
  }
});

window.addEventListener("keyup", ({ key }) => {
  switch (key) {
    case "ArrowLeft":
      keys.ArrowLeft.pressed = false;
      break;
    case "ArrowRight":
      keys.ArrowRight.pressed = false;
      break;
    case "ArrowUp":
      keys.ArrowUp.pressed = false;
      break;
    case "ArrowDown":
      keys.ArrowDown.pressed = false;
      break;
    case " ":
      BulletArray.push(
        new Bullets({
          x: player.position.x + player.width / 2,
          y: player.position.y + 20,
        }),
      );
      break;
  }
});
