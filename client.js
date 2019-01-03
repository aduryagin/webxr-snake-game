class Grid {
  static get size() {
    return 10;
  }

  static create(OBJECTS_SCALE) {
    const grid = new THREE.Object3D();
    grid.add(new THREE.GridHelper(Grid.size, Grid.size, new THREE.Color(0xffffff), new THREE.Color(0xffffff)));
    grid.scale.set(OBJECTS_SCALE, OBJECTS_SCALE, OBJECTS_SCALE);

    return grid;
  }
}

class Snake {
  constructor(grid) {
    this.grid = grid;
    this.snakeBoxSize = 1;
    this.minCoordinate = -Grid.size / 2 + this.snakeBoxSize / 2;
    this.maxCoordinate = Math.abs(this.minCoordinate);
    this.initSnakeBody = [
      {
        coordinates: new THREE.Vector3(
          this.minCoordinate,
          this.snakeBoxSize / 2,
          this.minCoordinate
        ),
        box: null,
      },
    ];
    this.walking = false;

    this.initControlEvents();
    this.newGame();
  }

  newGame() {
    this.snakeBody = [...this.initSnakeBody];
    this.boost = 10;
    this.speed = 1000;
    this.walking = false;
    this.snakeStep = {
      x: 1,
      z: 0,
    };

    this.generateBody();
    this.generateFood();
  }

  get direction() {
    if (this.snakeStep.x === 1) {
      return 'right';
    }

    if (this.snakeStep.z === 1) {
      return 'up';
    }

    if (this.snakeStep.z === -1) {
      return 'down';
    }

    if (this.snakeStep.x === -1) {
      return 'left';
    }
  }

  set direction(direction) {
    if (
      this.direction === direction ||
      this.direction === 'up' && direction === 'down' ||
      this.direction === 'down' && direction === 'up' ||
      this.direction === 'right' && direction === 'left' ||
      this.direction === 'left' && direction === 'right'
    ) return;

    if (direction === 'up') {
      return this.snakeStep = { x: 0, z: -1 }; 
    }

    if (direction === 'down') {
      return this.snakeStep = { x: 0, z: 1 }; 
    }

    if (direction === 'left') {
      return this.snakeStep = { x: -1, z: 0 }; 
    }

    if (direction === 'right') {
      return this.snakeStep = { x: 1, z: 0 }; 
    }
  }

  normalizeCoordinate(coordinate) {
    if (coordinate < this.minCoordinate) return this.maxCoordinate;
    if (coordinate > this.maxCoordinate) return this.minCoordinate;
    return coordinate;
  }

  generateFood() {
    const generateRandomCoordinates = () => {
      const randomCoordinate = () => {
        const coordinate = Math.round((Math.random() * (this.maxCoordinate - this.minCoordinate) + this.minCoordinate) * 2) / 2;

        if (coordinate % 1 === 0) return this.normalizeCoordinate(coordinate + 0.5);
        return coordinate;
      }
  
      const x = randomCoordinate();
      const z = randomCoordinate();

      const sameCoordinates = this.snakeBody.find(snakeBodyBox => {
        return snakeBodyBox.coordinates.x === x && snakeBodyBox.coordinates.z === z;
      });

      if (sameCoordinates) return generateRandomCoordinates();
      return { x, z };
    }

    this.foodCoordinates = generateRandomCoordinates();
    const foodBoxGeometry = new THREE.SphereGeometry(this.snakeBoxSize / 2);
    const foodBoxMaterial = new THREE.MeshPhongMaterial({ color: 0xf00000 });
    this.foodBox = new THREE.Mesh(foodBoxGeometry, foodBoxMaterial);
    this.foodBox.castShadow = true;

    this.foodBox.position.set(this.foodCoordinates.x, this.snakeBoxSize / 2, this.foodCoordinates.z);
    this.grid.add(this.foodBox);
  }

  initControlEvents() {
    const controlsListener = (event) => {
      if (!this.walking) return;

      if (screen.orientation.type.indexOf('portrait') > -1) {
        if (event.touches[0].clientY / window.innerHeight <= 0.33) {
          // up
          return this.direction = 'up';
        }
  
        if (event.touches[0].clientY / window.innerHeight >= 0.67) {
          // down
          return this.direction = 'down';
        }
  
        if (event.touches[0].clientX / window.innerWidth <= 0.5) {
          // left
          return this.direction = 'left';
        }
  
        if (event.touches[0].clientX / window.innerWidth > 0.5) {
          // right
          return this.direction = 'right';
        }
      } else {
        if (event.touches[0].clientX / window.innerWidth <= 0.33) {
          // left
          return this.direction = 'left';
        }
  
        if (event.touches[0].clientX / window.innerWidth >= 0.67) {
          // right
          return this.direction = 'right';
        }
  
        if (event.touches[0].clientY / window.innerHeight <= 0.5) {
          // down
          return this.direction = 'down';
        }
  
        if (event.touches[0].clientY / window.innerHeight > 0.5) {
          // up
          return this.direction = 'up';
        }
      }
    };
    window.addEventListener('touchstart', controlsListener);
  }

  startWalking() {
    this.walking = true;

    setInterval(() => {
      const headXCoordinate = this.normalizeCoordinate(this.snakeBody[0].coordinates.x + this.snakeStep.x);
      const headZCoordinate = this.normalizeCoordinate(this.snakeBody[0].coordinates.z + this.snakeStep.z);

      this.snakeBody.unshift({
        coordinates: new THREE.Vector3(
          headXCoordinate,
          this.snakeBody[0].coordinates.y,
          headZCoordinate,
        )
      });

      if (this.snakeBody.length > 4) {
        const sameCoordinates = this.snakeBody.slice(1).find(snakeBodyBox => {
          return snakeBodyBox.coordinates.x === headXCoordinate && snakeBodyBox.coordinates.z === headZCoordinate;
        });

        if (sameCoordinates) {
          alert('Game over');
          this.newGame();
        }
      }

      if (this.foodCoordinates.x === headXCoordinate && this.foodCoordinates.z === headZCoordinate) {
        this.grid.remove(this.foodBox);
        this.generateFood();
        this.boost += 2;
      } else {
        const { box } = this.snakeBody.pop();
        this.grid.remove(box);
      }

      this.generateBody();
    }, this.speed - Math.pow(this.boost, 2));
  }

  generateBody() {
    this.snakeBody.forEach((snakeBodyBox, index) => {
      if (snakeBodyBox.box) {
        snakeBodyBox.box.position.set(snakeBodyBox.coordinates.x, snakeBodyBox.coordinates.y, snakeBodyBox.coordinates.z);
      } else {
        const snakeBoxGeometry = new THREE.SphereGeometry(this.snakeBoxSize, this.snakeBoxSize, this.snakeBoxSize);
        const snakeBoxMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const snakeBox = new THREE.Mesh(snakeBoxGeometry, snakeBoxMaterial);
        snakeBox.castShadow = true;
        snakeBox.position.set(snakeBodyBox.coordinates.x, snakeBodyBox.coordinates.y, snakeBodyBox.coordinates.z);

        this.snakeBody[index].box = snakeBox;
        this.grid.add(snakeBox);
      }
    });
  }
}

class App {
  constructor() {
    this.init();

    this.OBJECTS_SCALE = 0.07;
    this.stabilized = false;
    this.gameAdded = false;

    this.onSessionStarted = this.onSessionStarted.bind(this);
    this.onEnterAR = this.onEnterAR.bind(this);
    this.init = this.init.bind(this);
    this.onXRFrame = this.onXRFrame.bind(this);
    this.initEvents = this.initEvents.bind(this);
  }

  createLitScene() {
    const scene = new THREE.Scene();

    const light = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);

    directionalLight.castShadow = true;

    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    planeGeometry.rotateX(-Math.PI / 2);

    const shadowMesh = new THREE.Mesh(planeGeometry, new THREE.ShadowMaterial({
      color: 0x111111,
      opacity: 0.3,
    }));

    shadowMesh.name = 'shadowMesh';
    shadowMesh.receiveShadow = true;
    shadowMesh.position.y = 10000;

    scene.add(shadowMesh);
    scene.add(light);
    scene.add(directionalLight);

    return scene;
  }

  async init() {
    this.device = await navigator.xr.requestDevice();

    const startButton = document.querySelector('#start');

    startButton.addEventListener('click', () => {
      document.body.removeChild(startButton);
      document.body.classList.add('stabilization');
      this.onEnterAR();
    });
  }

  async onEnterAR() {
    // create canvas
    this.outputCanvas = document.createElement('canvas');
    const ctx = this.outputCanvas.getContext('xrpresent');

    // request session from device
    const session = await this.device.requestSession({
      outputContext: ctx,
      environmentIntegration: true,
    });

    // append canvas to the dom
    document.body.appendChild(this.outputCanvas);
    this.onSessionStarted(session)
  }

  async onSessionStarted(session) {
    this.session = session;

    // threejs renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.autoClear = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.gl = this.renderer.getContext();
    await this.gl.setCompatibleXRDevice(this.session.device);

    this.session.baseLayer = new XRWebGLLayer(this.session, this.gl);

    const framebuffer = this.session.baseLayer.framebuffer;
    this.renderer.setFramebuffer(framebuffer);

    // scene
    this.scene = this.createLitScene();

    // camera
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;

    // create grid
    this.grid = Grid.create(this.OBJECTS_SCALE);
    this.snake = new Snake(this.grid);

    this.initEvents();

    this.frameOfRef = await this.session.requestFrameOfReference('eye-level');
    this.session.requestAnimationFrame(this.onXRFrame);
  }

  initEvents() {
    const addGameListener = () => {
      if (!this.gameAdded && this.stabilized) {
        window.removeEventListener('touchend', addGameListener);
  
        this.gameAdded = true;
        // this.grid.children.forEach(gridChild => gridChild.material.opacity = 1);
        this.snake.startWalking();
      }
    };
    window.addEventListener('touchend', addGameListener);
  }

  lookAtOnY(looker, target) {
    const targetPos = new THREE.Vector3().setFromMatrixPosition(target.matrixWorld);

    const angle = Math.atan2(targetPos.x - looker.position.x,
                             targetPos.z - looker.position.z);
    looker.rotation.set(0, angle, 0);
  }

  onXRFrame(time, frame) {
    let session = frame.session;
    let pose = frame.getViewerPose(this.frameOfRef);

    session.requestAnimationFrame(this.onXRFrame);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.session.baseLayer.framebuffer);

    this.raycaster = this.raycaster || new THREE.Raycaster();
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);

    const rayOrigin = new Float32Array(this.raycaster.ray.origin.toArray());
    const rayDirection = new Float32Array(this.raycaster.ray.direction.toArray());

    session.requestHitTest(rayOrigin, rayDirection, this.frameOfRef).then((results) => {
      // When the hit test returns use it to place our proxy object.
      if (results.length) {
        let hitResult = results[0];
        let selectListener = null;

        if (!this.stabilized) {
          this.stabilized = true;

          document.body.classList.remove('stabilization');
          document.body.classList.add('stabilized');

          // this.grid.children.forEach(gridChild => gridChild.material.opacity = 0.5);
          this.scene.add(this.grid);
        }

        if (!this.gameAdded) {
          this.lookAtOnY(this.grid, this.camera);
          this.grid.position.setFromMatrixPosition(new THREE.Matrix4().fromArray(hitResult.hitMatrix));
        }

        const shadowMesh = this.scene.children.find(c => c.name === 'shadowMesh');
        shadowMesh.position.y = this.grid.position.y;
      }
    });

    if (pose) {
      for (let view of frame.views) {
        const viewport = session.baseLayer.getViewport(view);
        this.renderer.setSize(viewport.width, viewport.height);

        // Set the view matrix and projection matrix from XRDevicePose
        // and XRView onto our THREE.Camera.
        this.camera.projectionMatrix.fromArray(view.projectionMatrix);
        const viewMatrix = new THREE.Matrix4().fromArray(pose.getViewMatrix(view));
        this.camera.matrix.getInverse(viewMatrix);
        this.camera.updateMatrixWorld(true);

        // Render our scene with our THREE.WebGLRenderer
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}

new App();

