const fps = 15;
let cursorX = 0;
let cursorY = 0;
let grid = [];
let gridLocked = [];

let tips = [];
let strongTips = [];
let tipRowMap = [];
let tipColMap = [];
let tipSquMap = [];

let gridSide;
let gridLeftPad;
let gridTopPad;
let cellSide;

let valid = true;

let puzzle_facil   = JSON.parse('[[3,9,2,null,6,null,null,null,1],[4,null,null,null,null,null,null,7,null],[1,null,5,null,null,null,null,3,null],[2,5,null,3,null,null,6,null,null],[null,null,3,null,9,null,7,null,5],[6,null,9,4,5,null,8,null,null],[null,null,6,null,null,8,1,null,null],[null,null,1,9,null,null,null,null,null],[null,2,4,null,null,3,9,6,null]]');
let puzzle_medio   = JSON.parse('[[2,null,null,null,1,null,null,null,9],[null,5,null,3,null,null,null,1,null],[null,null,null,null,4,null,null,null,null],[null,null,null,4,null,6,null,7,null],[9,null,4,null,null,null,2,null,6],[null,8,null,9,null,3,null,null,null],[null,null,null,null,7,null,null,null,null],[null,7,null,null,null,4,null,5,null],[5,null,null,null,9,null,null,null,null]]');
let puzzle_dificil = JSON.parse('[[null,3,null,null,6,1,null,null,null],[1,4,null,5,null,null,null,null,null],[null,null,2,null,8,null,null,null,null],[null,1,null,null,null,null,null,null,3],[6,null,5,null,3,null,8,null,7],[9,null,null,null,null,null,null,4,null],[null,null,null,null,1,null,6,null,null],[null,null,null,null,null,5,null,9,4],[null,null,null,9,4,null,null,5,null]]');

function test() {
  for (let i = 0; i < 9; i++) {
    let x = floor(i/3)*3;
    let y = (i%3)*3;
    console.log(x*3, y*3);
  }
}

function uniqueByValue(a) {
  var seen = {};
  return a.filter(function(item) {
    var k = JSON.stringify(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  })
}

function resizeGrid() {
  gridSide = min(width, height) - 20;
  gridLeftPad = (width - gridSide)/2;
  gridTopPad = (height - gridSide)/2;
  cellSide = gridSide / 9;
}

function cap(val) {
  return min(max(val, 0), 8);
}

function retrieveCol(i) {
  let col = grid[i];
  let out = [];
  for (let j = 0; j < 9; j++) {
    if (col[j] != null) {
      out.push(col[j]);
    }
  }
  return out;
}

function retrieveRow(j) {
  let out = [];
  for (let i = 0; i < 9; i++) {
    if (grid[i][j] != null) {
      out.push(grid[i][j]);
    }
  }
  return out;
}

function retrieveSquare(x, y) {
  let out = [];
  let firstX = x - x%3;
  let firstY = y - y%3;
  for (let i = firstX; i < firstX+3; i++) {
    for (let j = firstY; j < firstY+3; j++) {
      if (grid[i][j] != null) {
        out.push(grid[i][j]);
      }
    }
  }
  return out;
}

function hasDuplicates(list) {
  let seen = [false, false, false, false, false, false, false, false, false, false];
  for (let i = 0; i < list.length; i++) {
    let n = list[i];
    if (seen[n]) {
      return true;
    }
    seen[n] = true;
  }
  return false;
}

function isValidSudoku() {
  for (let i = 0; i < 9; i++) {
    let row = retrieveRow(i);
    if (hasDuplicates(row)) {
      return false;
    }

    let column = retrieveCol(i);
    if (hasDuplicates(column)) {
      return false;
    }
    let x = floor(i/3);
    let y = i%3;
    let square = retrieveSquare(x, y);
    if (hasDuplicates(square)) {
      return false;
    }
  }

  // checks if an empty space can't be filled by any number
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] == null) {
        let count = 0;
        for (let n = 0; n < 9; n++) {
          if (tips[i][j][n] != null) {
            count++;
          }
        }

        if (count == 0) {
          return false;
        }
      }
    }
  }

  return true;
}

function updateTipsAtPos(x, y, n) {
  let num = n-1;
  for (let i = 0; i < 9; i++) {
    tips[x][i][num] = null;
    tips[i][y][num] = null;
  }
  let firstX = x - x%3;
  let firstY = y - y%3;
  for (let i = firstX; i < firstX+3; i++) {
    for (let j = firstY; j < firstY+3; j++) {
      tips[i][j][num] = null;
    }
  }
}

function createTips() {
  tips = [];
  for (let i = 0; i < 9; i++) {
    tips.push([]);
    for (let j = 0; j < 9; j++) {
      tips[i].push([]);
      for (let n = 1; n <= 9; n++) {
        tips[i][j].push(n);
      }
    }
  }
}

function resetTips() {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      for (let n = 1; n <= 9; n++) {
        tips[i][j][n] = n;
      }
    }
  }
}

function updateTips() {
  resetTips();
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] != null) {
        updateTipsAtPos(i, j, grid[i][j]);
      }
    }
  }
}

class Cell {
  constructor (i, j, number) {
    this.i = i;
    this.j = j;
    this.number = number;
  }
}

function getRowCellMap(i) {
  let map = [];
  for (let j = 0; j < 9; j++) {
    if (grid[i][j] == null) {
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null) {
          let c = new Cell(i, j, n);
          if (map[n] === undefined) {
            map[n] = [c];
          } else {
            map[n].push(c);
          }
        }
      }
    }
  }
  return map;
}

function getColCellMap(j) {
  let map = [];
  for (let i = 0; i < 9; i++) {
    if (grid[i][j] == null) {
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null) {
          let c = new Cell(i, j, n);
          if (map[n] === undefined) {
            map[n] = [c];
          } else {
            map[n].push(c);
          }
        }
      }
    }
  }
  return map
}

function getSquCellMap(squ) {
  let firstX = floor(squ/3)*3;
  let firstY = (squ%3)*3;

  let map = [];
  for (let i = firstX; i < firstX+3; i++) {
    for (let j = firstY; j < firstY+3; j++) {
      if (grid[i][j] == null) {
        for (let n = 0; n < 9; n++) {
          if (tips[i][j][n] != null) {
            let c = new Cell(i, j, n);
            if (map[n] === undefined) {
              map[n] = [c];
            } else {
              map[n].push(c);
            }
          }
        }
      }
    }
  }
  return map;
}

function updateTipMap() {
  tipRowMap = [];
  tipColMap = [];
  tipSquMap = [];

  for (let i = 0; i < 9; i++) {
    let row = getRowCellMap(i);
    let column = getColCellMap(i);
    let square = getSquCellMap(i);

    tipRowMap.push(row);
    tipColMap.push(column);
    tipSquMap.push(square);
  }
}

function update() {
  valid = isValidSudoku();
  if (valid) {
    updateTips();
    updateTipMap();
    updateStrongTips();
  }
}

function strategyUniqueFind(map) {
  out = [];
  for (let n = 0; n < 9; n++) {
    if (map[n] != undefined && map[n].length === 1) {
      out.push(map[n][0]);
    }
  }
  return out;
}

function strategyUnique() {
  let out = [];
  for (let i = 0; i < 9; i++) {
    let row = strategyUniqueFind(tipRowMap[i]);
    let col = strategyUniqueFind(tipColMap[i]);
    let squ = strategyUniqueFind(tipSquMap[i]);
    out = out.concat(row).concat(col).concat(squ);
  }
  return out;
}

function strategyLoneNumber() {
  let out = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      let count = 0;
      let number = null;
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null) {
          count++;
          number = n;
        }
      }

      if (count == 1) {
        out.push(new Cell(i, j, number));
      }
    }
  }
  return out;
}

function strategy2NumsIn2CellsRow(i) {
}

function strategy2NumsIn2Cells() {
}

function updateStrongTips() {
  let out = [];
  out = out.concat(strategyUnique());
  out = out.concat(strategyLoneNumber());
  strongTips = uniqueByValue(out);
}

function hasStrongTip(x, y, n) {
  for (let i = 0; i < strongTips.length; i++) {
    let tip = strongTips[i];
    if (tip.i == x && tip.j == y && tip.number == n) {
      return true;
    }
  }
  return false;
}

function autofill() {
  for (let i = 0; i < strongTips.length; i++) {
    let tip = strongTips[i];
    if (grid[tip.i][tip.j] == null) {
      grid[tip.i][tip.j] = tip.number + 1;
    }
  }
  update();
}

function lockNumbers() {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] != null) {
        gridLocked[i][j] = true;
      }
    }
  }
}

function placeAtCursor(number) {
  if (gridLocked[cursorX][cursorY] == false) {
    grid[cursorX][cursorY] = number;
    update();
  }
}

function debug() {
  console.log("tipColMap", tipColMap);
  console.log("tipRowMap", tipRowMap);
  console.log("tipSquMap", tipSquMap);
}

function keyHandler(e) {
  if (e.key === "ArrowUp") {
    cursorY = cap(cursorY-1);
  }
  if (e.key === "ArrowRight") {
    cursorX = cap(cursorX+1);
  }
  if (e.key === "ArrowLeft") {
    cursorX = cap(cursorX-1);
  }
  if (e.key === "ArrowDown") {
    cursorY = cap(cursorY+1);
  }
  if (e.key === "l") {
    lockNumbers();
  }
  if (e.key === "f") {
    autofill();
  }
  if (e.key === "p") {
    grid = puzzle_medio;
    update();
    lockNumbers();
  }

  // Javascript is not a serious language.
  switch(e.key) {
    case "1":
      placeAtCursor(1);
      break;
    case "2":
      placeAtCursor(2);
      break;
    case "3":
      placeAtCursor(3);
      break;

    case "4":
      placeAtCursor(4);
      break;
    case "5":
      placeAtCursor(5);
      break;
    case "6":
      placeAtCursor(6);
      break;

    case "7":
      placeAtCursor(7);
      break;
    case "8":
      placeAtCursor(8);
      break;
    case "9":
      placeAtCursor(9);
      break;

    case "Backspace":
      placeAtCursor(null);
      break;
  }

  if (e.key === "d") {
    debug();
  }

  if (e.key.toLowerCase() === "h") {
    const overlay = document.getElementById("help-overlay");
    overlay.style.display = (overlay.style.display === "flex") ? "none" : "flex";
  }
}

function setup() {
  p5Canvas = createCanvas(windowWidth, windowHeight);
  p5Canvas.parent("canvas-container");

  p5Canvas.position(0, 0);
  p5Canvas.style('z-index', '-1');
  p5Canvas.style('position', 'fixed');

  document.addEventListener("keydown", keyHandler);

  document.getElementById("help-close").addEventListener("click", () => {
    document.getElementById("help-overlay").style.display = "none";
  });

  background(220);
  frameRate(fps);

  for (let i = 0; i < 9; i++) {
    grid.push([]);
    gridLocked.push([]);
    for (let j = 0; j < 9; j++) {
      grid[i].push(null);
      gridLocked[i].push(false);
    }
  }

  createTips();
  resizeGrid();
  textAlign(CENTER, CENTER);
}

function drawNumber(i, j, number) {
  let x = gridLeftPad + cellSide*i;
  let y = gridTopPad + cellSide*j;
  if (gridLocked[i][j]) {
    fill(0);
    stroke(0);
  } else {
    fill(100);
    stroke(100);
  }
  textSize(32);
  text(str(number), x+cellSide/2, y+cellSide/2);
}

function drawTips(i, j) {
  let x = gridLeftPad + cellSide*i;
  let y = gridTopPad + cellSide*j;
  let miniSide = cellSide/3;
  fill(128);
  stroke(128);
  for (let n = 0; n < 9; n++) {
    let col = floor(n/3);
    let row = n%3;
    if (tips[i][j][n] != null) {
      let lilX = x + row * miniSide;
      let lilY = y + col * miniSide;
      if (hasStrongTip(i, j, n)) {
        noFill();
        circle(lilX+miniSide/2, lilY+miniSide/2, miniSide*0.8)
        fill(128);
      }
      textSize(10);
      text(str(n+1), lilX+miniSide/2, lilY+miniSide/2);
    }
  }
}

function draw() {
  if (valid == false) {
    background(128, 64, 64);
  } else {
    background(220);
  }
  noFill();
  stroke(0);
  strokeWeight(5);
  rect(gridLeftPad, gridTopPad, gridSide, gridSide);

  strokeWeight(1);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      let x = gridLeftPad + cellSide*i;
      let y = gridTopPad + cellSide*j;
      rect(x, y, cellSide, cellSide);
    }
  }

  strokeWeight(3);
  for (let i = 0; i < 9; i+=3) {
    for (let j = 0; j < 9; j+=3) {
      let x = gridLeftPad + cellSide*i;
      let y = gridTopPad + cellSide*j;
      rect(x, y, cellSide*3, cellSide*3);
    }
  }

  // draw numbers and tips
  strokeWeight(1);
  fill(0);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      let number = grid[i][j];
      if (number != null) {
        drawNumber(i, j, number);
      } else {
        drawTips(i, j);
      }
    }
  }

  let x = gridLeftPad + cellSide*cursorX;
  let y = gridTopPad + cellSide*cursorY;
  fill(32, 192, 32, 64);
  rect(x, y, cellSide, cellSide);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeGrid();
}
