import Grid from './grid.mjs'

export default class Snake {
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
      this.walking = setInterval(() => {
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
  
          // speedup
          clearInterval(this.walking);
          this.startWalking();
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
          const snakeBoxGeometry = new THREE.BoxGeometry(this.snakeBoxSize, this.snakeBoxSize, this.snakeBoxSize);
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