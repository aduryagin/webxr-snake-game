import Snake from './snake.mjs';
import Grid from './grid.mjs';
import { createLitScene, lookAtOnY } from './utils.mjs';

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
    
    if ('setCompatibleXRDevice' in this.gl) {
      await this.gl.setCompatibleXRDevice(this.session.device);
    } else {
      await this.gl.makeXRCompatible();
    }

    this.session.baseLayer = new XRWebGLLayer(this.session, this.gl);

    const framebuffer = this.session.baseLayer.framebuffer;
    this.renderer.setFramebuffer(framebuffer);

    // scene
    this.scene = createLitScene();

    // camera
    this.camera = new THREE.PerspectiveCamera();
    this.camera.matrixAutoUpdate = false;
    
    // create grid
    this.grid = Grid.create(this.OBJECTS_SCALE);
    this.snake = new Snake(this.grid);

    this.initEvents();

    this.frameOfRef = await (
      'requestFrameOfReference' in this.session ?
      this.session.requestFrameOfReference('eye-level') :
      this.session.requestReferenceSpace({
        type: 'stationary',
        subtype: 'eye-level',
      })
    );
    this.session.requestAnimationFrame(this.onXRFrame);
  }

  initEvents() {
    const addGameListener = () => {
      if (!this.gameAdded && this.stabilized) {
        window.removeEventListener('touchend', addGameListener);
  
        this.gameAdded = true;
        this.snake.startWalking();
      }
    };
    window.addEventListener('touchend', addGameListener);
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

          this.scene.add(this.grid);
        }

        if (!this.gameAdded) {
          lookAtOnY(this.grid, this.camera);
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

