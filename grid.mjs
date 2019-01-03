export default class Grid {
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