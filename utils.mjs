export const createLitScene = () => {
  const scene = new THREE.Scene();

  const light = new THREE.AmbientLight(0xffffff, 0.3);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);

  directionalLight.castShadow = true;

  const planeGeometry = new THREE.PlaneGeometry(10, 10);
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
};

export const lookAtOnY = (looker, target) => {
  const targetPos = new THREE.Vector3().setFromMatrixPosition(target.matrixWorld);

  const angle = Math.atan2(targetPos.x - looker.position.x, targetPos.z - looker.position.z);
  looker.rotation.set(0, angle, 0);
};