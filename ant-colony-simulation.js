// Ant Colony Optimization Simulation
let ants = [];
let foods = [];
let nest;
let pheromoneMap = [];
let config = {
  antCount: 100,
  foodCount: 3,
  pheromoneEvaporationRate: 0.995,
  pheromoneDepositAmount: 10,
  antSpeed: 1.5,
  randomMovementFactor: 0.3,
  sensorAngle: Math.PI / 4,
  sensorDistance: 20,
  foodSize: 20,
  nestSize: 30,
  maxPheromone: 255
};

function setup() {
  createCanvas(800, 600);
  
  // Create sliders for adjustable parameters
  createP('Simulation Controls:');
  
  createP('Ant Count:');
  antCountSlider = createSlider(10, 300, config.antCount, 5);
  
  createP('Pheromone Evaporation Rate:');
  evaporationSlider = createSlider(980, 999, config.pheromoneEvaporationRate * 1000, 1);
  
  createP('Random Movement Factor:');
  randomFactorSlider = createSlider(0, 100, config.randomMovementFactor * 100, 5);
  
  createP('Ant Speed:');
  speedSlider = createSlider(5, 30, config.antSpeed * 10, 1);
  
  resetButton = createButton('Reset Simulation');
  resetButton.mousePressed(resetSimulation);
  
  // Initialize the simulation
  initializeSimulation();
}

function initializeSimulation() {
  // Clear existing entities
  ants = [];
  foods = [];
  
  // Create pheromone map
  pheromoneMap = new Array(width);
  for (let i = 0; i < width; i++) {
    pheromoneMap[i] = new Array(height).fill(0);
  }
  
  // Create nest in the center
  nest = {
    x: width / 2,
    y: height / 2,
    size: config.nestSize
  };
  
  // Create food sources
  for (let i = 0; i < config.foodCount; i++) {
    let foodX, foodY;
    let tooClose = true;
    
    // Make sure food isn't placed too close to nest or other food
    while (tooClose) {
      foodX = random(50, width - 50);
      foodY = random(50, height - 50);
      
      // Check distance to nest
      let distToNest = dist(foodX, foodY, nest.x, nest.y);
      if (distToNest < 150) continue;
      
      // Check distance to other food sources
      tooClose = false;
      for (let food of foods) {
        let distToFood = dist(foodX, foodY, food.x, food.y);
        if (distToFood < 100) {
          tooClose = true;
          break;
        }
      }
    }
    
    foods.push({
      x: foodX,
      y: foodY,
      size: config.foodSize,
      amount: 100
    });
  }
  
  // Create ants
  for (let i = 0; i < config.antCount; i++) {
    ants.push(new Ant(nest.x, nest.y));
  }
}

function draw() {
  background(240);
  
  // Update configuration based on slider values
  config.antCount = antCountSlider.value();
  config.pheromoneEvaporationRate = evaporationSlider.value() / 1000;
  config.randomMovementFactor = randomFactorSlider.value() / 100;
  config.antSpeed = speedSlider.value() / 10;
  
  // Adjust ant count if needed
  if (ants.length < config.antCount) {
    for (let i = ants.length; i < config.antCount; i++) {
      ants.push(new Ant(nest.x, nest.y));
    }
  } else if (ants.length > config.antCount) {
    ants = ants.slice(0, config.antCount);
  }
  
  // Draw pheromone trails
  drawPheromones();
  
  // Evaporate pheromones
  evaporatePheromones();
  
  // Draw food sources
  for (let food of foods) {
    if (food.amount > 0) {
      fill(0, 200, 0);
      noStroke();
      ellipse(food.x, food.y, food.size, food.size);
      
      // Draw food amount
      fill(0);
      textAlign(CENTER, CENTER);
      text(int(food.amount), food.x, food.y);
    }
  }
  
  // Draw nest
  fill(139, 69, 19);
  ellipse(nest.x, nest.y, nest.size, nest.size);
  
  // Update and draw ants
  for (let ant of ants) {
    ant.update();
    ant.draw();
  }
  
  // Display stats
  fill(0);
  noStroke();
  textAlign(LEFT, TOP);
  text(`Ants: ${ants.length}`, 10, 10);
  text(`Evaporation Rate: ${(1 - config.pheromoneEvaporationRate).toFixed(3)}`, 10, 30);
  text(`Random Factor: ${config.randomMovementFactor.toFixed(2)}`, 10, 50);
  text(`Speed: ${config.antSpeed.toFixed(1)}`, 10, 70);
}

function drawPheromones() {
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (pheromoneMap[x][y] > 0) {
        let pheromoneLevel = pheromoneMap[x][y];
        let idx = (x + y * width) * 4;
        
        // Blue for returning to nest (with food)
        // Red for going to food
        if (pheromoneLevel > 0) {
          pixels[idx] = 0;  // R
          pixels[idx + 1] = 0;  // G
          pixels[idx + 2] = min(255, pheromoneLevel);  // B
          pixels[idx + 3] = 255;  // Alpha
        }
      }
    }
  }
  updatePixels();
}

function evaporatePheromones() {
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      if (pheromoneMap[x][y] > 0) {
        pheromoneMap[x][y] *= config.pheromoneEvaporationRate;
        if (pheromoneMap[x][y] < 0.1) {
          pheromoneMap[x][y] = 0;
        }
      }
    }
  }
}

function resetSimulation() {
  initializeSimulation();
}

class Ant {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = random(TWO_PI);
    this.hasFood = false;
    this.memory = {
      pathToFood: [],
      pathToNest: []
    };
  }
  
  update() {
    // Move ant based on current angle
    this.x += cos(this.angle) * config.antSpeed;
    this.y += sin(this.angle) * config.antSpeed;
    
    // Keep ant within canvas bounds
    if (this.x < 0) { this.x = 0; this.angle = random(PI/2, 3*PI/2); }
    if (this.x > width) { this.x = width; this.angle = random(3*PI/2, 5*PI/2); }
    if (this.y < 0) { this.y = 0; this.angle = random(0, PI); }
    if (this.y > height) { this.y = height; this.angle = random(PI, TWO_PI); }
    
    // Check if ant found food
    if (!this.hasFood) {
      for (let food of foods) {
        if (food.amount > 0 && dist(this.x, this.y, food.x, food.y) < food.size / 2) {
          this.hasFood = true;
          food.amount -= 0.5;
          this.angle += PI;  // Turn around
          
          // Deposit stronger pheromone for first ants to find the food
          let depositAmount = config.pheromoneDepositAmount * (1 + (100 / (0.1 + this.getAveragePheromoneLevel())));
          
          // Store position to memory
          this.memory.pathToFood = [{x: this.x, y: this.y, strength: depositAmount}];
          break;
        }
      }
    }
    
    // Check if ant returned to nest
    if (this.hasFood && dist(this.x, this.y, nest.x, nest.y) < nest.size / 2) {
      this.hasFood = false;
      this.angle += PI;  // Turn around
      
      // Store position to memory
      this.memory.pathToNest = [{x: this.x, y: this.y, strength: config.pheromoneDepositAmount}];
    }
    
    // Deposit pheromones
    if (this.hasFood) {
      let x = Math.floor(this.x);
      let y = Math.floor(this.y);
      
      if (x >= 0 && x < width && y >= 0 && y < height) {
        pheromoneMap[x][y] = min(config.maxPheromone, pheromoneMap[x][y] + config.pheromoneDepositAmount);
        
        // Store position in memory with decreasing strength
        if (this.memory.pathToNest.length < 100) {
          this.memory.pathToNest.push({
            x: this.x,
            y: this.y,
            strength: config.pheromoneDepositAmount * (1 - this.memory.pathToNest.length / 100)
          });
        }
      }
    }
    
    // Ants without food search for food or follow pheromones
    if (!this.hasFood) {
      // Random movement with bias towards pheromones
      if (random() < config.randomMovementFactor) {
        this.angle += random(-PI/4, PI/4);
      } else {
        this.followPheromones();
      }
    } 
    // Ants with food head back to nest
    else {
      let dx = nest.x - this.x;
      let dy = nest.y - this.y;
      let angleToNest = atan2(dy, dx);
      
      // Mix direct path to nest with some randomness
      this.angle = lerp(this.angle, angleToNest, 0.3) + random(-0.1, 0.1);
    }
  }
  
  followPheromones() {
    // Check pheromone levels at three sensors (forward, left, right)
    let forwardX = this.x + cos(this.angle) * config.sensorDistance;
    let forwardY = this.y + sin(this.angle) * config.sensorDistance;
    
    let leftX = this.x + cos(this.angle - config.sensorAngle) * config.sensorDistance;
    let leftY = this.y + sin(this.angle - config.sensorAngle) * config.sensorDistance;
    
    let rightX = this.x + cos(this.angle + config.sensorAngle) * config.sensorDistance;
    let rightY = this.y + sin(this.angle + config.sensorAngle) * config.sensorDistance;
    
    let forwardPheromone = this.getPheromoneAt(forwardX, forwardY);
    let leftPheromone = this.getPheromoneAt(leftX, leftY);
    let rightPheromone = this.getPheromoneAt(rightX, rightY);
    
    // Follow the strongest pheromone trail
    if (forwardPheromone > leftPheromone && forwardPheromone > rightPheromone) {
      // Keep going forward
    } else if (leftPheromone > rightPheromone) {
      this.angle -= random(0.1, 0.5);
    } else if (rightPheromone > leftPheromone) {
      this.angle += random(0.1, 0.5);
    }
  }
  
  getPheromoneAt(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    
    if (x >= 0 && x < width && y >= 0 && y < height) {
      return pheromoneMap[x][y];
    }
    return 0;
  }
  
  getAveragePheromoneLevel() {
    let sum = 0;
    let count = 0;
    
    for (let dx = -5; dx <= 5; dx++) {
      for (let dy = -5; dy <= 5; dy++) {
        let x = Math.floor(this.x + dx);
        let y = Math.floor(this.y + dy);
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          sum += pheromoneMap[x][y];
          count++;
        }
      }
    }
    
    return count > 0 ? sum / count : 0;
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    
    if (this.hasFood) {
      fill(0, 200, 0);  // Green if carrying food
    } else {
      fill(0, 0, 0);    // Black otherwise
    }
    
    // Draw ant body
    noStroke();
    ellipse(0, 0, 6, 4);
    
    // Draw ant head
    ellipse(3, 0, 3, 3);
    
    // Draw legs
    stroke(0);
    strokeWeight(0.5);
    
    // Left legs
    line(0, 0, -2, -3);
    line(0, 0, 0, -4);
    line(0, 0, 2, -3);
    
    // Right legs
    line(0, 0, -2, 3);
    line(0, 0, 0, 4);
    line(0, 0, 2, 3);
    
    pop();
  }
}
