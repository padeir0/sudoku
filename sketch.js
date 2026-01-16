const fps = 15;
let cursorX = 0;
let cursorY = 0;
let grid = [];
let gridLocked = [];

let tips = [];
let tipRowMap = [];
let tipColMap = [];
let tipSquMap = [];
let strongTips = new Map();
let discardedTips = new Map();

let gridSide;
let gridLeftPad;
let gridTopPad;
let cellSide;

let valid = true;

let puzzle_facil     = JSON.parse('[[3,9,2,null,6,null,null,null,1],[4,null,null,null,null,null,null,7,null],[1,null,5,null,null,null,null,3,null],[2,5,null,3,null,null,6,null,null],[null,null,3,null,9,null,7,null,5],[6,null,9,4,5,null,8,null,null],[null,null,6,null,null,8,1,null,null],[null,null,1,9,null,null,null,null,null],[null,2,4,null,null,3,9,6,null]]');
let puzzle_medio     = JSON.parse('[[2,null,null,null,1,null,null,null,9],[null,5,null,3,null,null,null,1,null],[null,null,null,null,4,null,null,null,null],[null,null,null,4,null,6,null,7,null],[9,null,4,null,null,null,2,null,6],[null,8,null,9,null,3,null,null,null],[null,null,null,null,7,null,null,null,null],[null,7,null,null,null,4,null,5,null],[5,null,null,null,9,null,null,null,null]]');
// não sei resolver :(
let puzzle_dificil1  = JSON.parse('[[null,3,null,null,6,1,null,null,null],[1,4,null,5,null,null,null,null,null],[null,null,2,null,8,null,null,null,null],[null,1,null,null,null,null,null,null,3],[6,null,5,null,3,null,8,null,7],[9,null,null,null,null,null,null,4,null],[null,null,null,null,1,null,6,null,null],[null,null,null,null,null,5,null,9,4],[null,null,null,9,4,null,null,5,null]]');
let puzzle_dificil2  = JSON.parse('[[null,4,null,null,2,5,null,8,null],[3,null,null,null,null,null,null,null,6],[null,null,null,1,null,6,null,null,null],[8,null,3,null,null,null,1,null,null],[1,null,null,null,null,null,null,null,2],[null,null,4,null,null,null,3,null,7],[null,null,null,6,null,7,null,null,null],[9,null,null,null,null,null,null,null,3],[null,7,null,8,4,null,null,5,null]]');
// precisa de naked-pairs e aligned-pairs
let puzzle_dificil3  = JSON.parse('[[null,1,6,8,null,null,9,null,5],[null,5,2,6,null,null,null,3,null],[null,null,9,5,null,null,null,null,null],[null,null,null,4,9,null,7,5,null],[null,null,null,2,null,null,null,null,null],[null,9,null,null,null,3,null,null,null],[1,null,5,3,7,null,8,2,null],[null,null,null,null,8,null,null,null,7],[null,null,null,null,null,null,5,null,4]]');
let puzzle_backtrack = JSON.parse('[[null,null,null,null,null,null,5,null,null],[null,null,null,null,null,9,null,null,null],[null,null,1,null,4,null,null,2,null],[null,null,null,5,null,null,null,null,null],[null,null,2,null,null,null,null,1,4],[null,3,null,7,null,null,null,null,null],[null,null,null,null,1,null,null,null,null],[null,8,null,null,null,null,7,null,null],[null,5,null,null,null,null,3,null,9]]');

let puzzle_master = JSON.parse('[[4,2,5,9,3,1,6,7,8],[9,1,6,8,7,4,5,3,2],[7,8,3,2,5,6,9,1,4],[6,null,null,null,null,5,2,4,3],[2,5,null,null,null,3,null,null,9],[3,null,null,null,2,9,null,null,null],[5,null,null,null,9,8,null,null,7],[1,null,null,null,null,7,8,null,null],[8,6,7,null,null,2,null,9,null]]');

function cellID(i, j, n) {
  return 100*i + 10*j + n;
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
      console.log(`row ${i} has duplicates`);
      return false;
    }

    let column = retrieveCol(i);
    if (hasDuplicates(column)) {
      console.log(`column ${i} has duplicates`);
      return false;
    }
    let x = floor(i/3);
    let y = i%3;
    let square = retrieveSquare(x, y);
    if (hasDuplicates(square)) {
      console.log(`square at (${x}, %{y}) has duplicates`);
      return false;
    }
  }

  // checks if an empty space can't be filled by any number
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] == null) {
        let count = 0;
        for (let n = 0; n < 9; n++) {
          if (tips[i][j][n] != null &&
              isDiscarded(i, j, n) === false) {
            count++;
          }
        }

        if (count == 0) {
          console.log(`cell (${i}, ${j}) can't contain any number`);
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

function createGrid() {
  grid = [];
  gridLocked = [];
  for (let i = 0; i < 9; i++) {
    grid.push([]);
    gridLocked.push([]);
    for (let j = 0; j < 9; j++) {
      grid[i].push(null);
      gridLocked[i].push(false);
    }
  }
}

function createTips() {
  tips = [];
  for (let i = 0; i < 9; i++) {
    tips.push([]);
    for (let j = 0; j < 9; j++) {
      tips[i].push([]);
      for (let n = 0; n < 9; n++) {
        tips[i][j].push(n);
      }
    }
  }
}

function resetTips() {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      for (let n = 0; n < 9; n++) {
        tips[i][j][n] = n + 1;
      }
    }
  }
}

function clearGrid() {
  valid = true;
  strongTips = new Map();
  discardedTips = new Map();
  tipRowMap = [];
  tipColMap = [];
  tipSquMap = [];

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      grid[i][j] = null;
      gridLocked[i][j] = false;
      for (let n = 0; n < 9; n++) {
        tips[i][j][n] = n + 1;
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

  id() {
    return cellID(this.i, this.j, this.number);
  }

  samePlace(other) {
    return this.i == other.i && this.j == other.j;
  }
}

function getRowCellMap(i) {
  let map = new Map();
  for (let j = 0; j < 9; j++) {
    if (grid[i][j] == null) {
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null) {
          let c = new Cell(i, j, n);
          if (map.has(n)) {
            map.get(n).push(c);
          } else {
            map.set(n, [c]);
          }
        }
      }
    }
  }
  return map;
}

function getColCellMap(j) {
  let map = new Map();
  for (let i = 0; i < 9; i++) {
    if (grid[i][j] == null) {
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null) {
          let c = new Cell(i, j, n);
          if (map.has(n)) {
            map.get(n).push(c);
          } else {
            map.set(n, [c]);
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

  let map = new Map();
  for (let i = firstX; i < firstX+3; i++) {
    for (let j = firstY; j < firstY+3; j++) {
      if (grid[i][j] == null) {
        for (let n = 0; n < 9; n++) {
          if (tips[i][j][n] != null) {
            let c = new Cell(i, j, n);
            if (map.has(n)) {
              map.get(n).push(c);
            } else {
              map.set(n, [c]);
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

function discardNumber(i, j, n) {
  let id = cellID(i,j,n);
  discardedTips.set(id, true);
}

function discardAllBut(cells, numList) {
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    for (let n = 0; n < 9; n++) {
      if (tips[cell.i][cell.j][n] != null &&
         numList.includes(n) == false) {
         discardNumber(cell.i, cell.j, n);
      }
    }
  }
}

function discardOnly(cells, numList) {
  for (let i = 0; i < cells.length; i++) {
    let cell = cells[i];
    for (let n = 0; n < 9; n++) {
      if (tips[cell.i][cell.j][n] != null &&
         numList.includes(n) == false) {
         discardNumber(i, j, n);
      }
    }
  }
}

function cellOrder(a, b) {
  return a.id() - b.id();
}

function sameCells(list_A, list_B) {
  if (list_A.length != list_B.length) {
    return false;
  }
  let len = list_A.length
  list_A.sort(cellOrder);
  list_B.sort(cellOrder);
  for (let i = 0; i < len; i++) {
    if (list_A[i].samePlace(list_B[i]) == false) {
      return false;
    }
  }
  return true;
}

function _strategyHiddenPairs(map) {
  let eligible = [];
  for (let n = 0; n < 9; n++) {
    if (map.has(n)) {
      let tipList = map.get(n);
      if (tipList.length == 2) {
        eligible.push([n, tipList]);
      }
    }
  }

  if (eligible.length <= 1) {
    return;
  }

  for (let i = 0; i < eligible.length; i++) {
    for (let j = i+1; j < eligible.length; j++) {
      let list_A = eligible[i][1];
      let list_B = eligible[j][1];
      if (sameCells(list_A, list_B)) {
        let n1 = eligible[i][0];
        let n2 = eligible[j][0];
        discardAllBut(list_A, [n1, n2]);
      }
    }
  }
}

function strategyHiddenPairs() {
  for (let i = 0; i < 9; i++) {
    _strategyHiddenPairs(tipRowMap[i]);
    _strategyHiddenPairs(tipColMap[i]);
    _strategyHiddenPairs(tipSquMap[i]);
  }
}

function updateDiscardedTips() {
  discardedTips = new Map();
  strategyHiddenPairs();
}

function update() {
  updateTips();
  updateTipMap();
  updateDiscardedTips();
  updateStrongTips();
  valid = isValidSudoku();
}

function _strategyLastRemainingCell(map) {
  for (let n = 0; n < 9; n++) {
    if (map.has(n) ) {
      let n_tips = map.get(n);
      let count = 0;
      let out = null;
      for (let i = 0; i < n_tips.length; i++) {
        let tip = n_tips[i];
        if (isDiscarded(tip.i, tip.j, tip.number) === false) {
          count++;
          out = tip;
        }
      }
      if (count === 1) {
        strongTips.set(out.id(), out);
      }
    }
  }
}

function strategyLastRemainingCell() {
  for (let i = 0; i < 9; i++) {
    _strategyLastRemainingCell(tipRowMap[i]);
    _strategyLastRemainingCell(tipColMap[i]);
    _strategyLastRemainingCell(tipSquMap[i]);
  }
}

function strategyLastPossibleNumber(out) {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      let count = 0;
      let number = null;
      for (let n = 0; n < 9; n++) {
        if (tips[i][j][n] != null &&
            isDiscarded(i, j, n) === false) {
          count++;
          number = n;
        }
      }

      if (count == 1) {
        let c = new Cell(i, j, number);
        strongTips.set(c.id(), c);
      }
    }
  }
}

function updateStrongTips() {
  strongTips = new Map();
  strategyLastRemainingCell();
  strategyLastPossibleNumber();
}

function isDiscarded(x, y, n) {
  let id = cellID(x, y, n);
  return discardedTips.has(id);
}

function hasStrongTip(x, y, n) {
  let id = cellID(x, y, n);
  return strongTips.has(id);
}

function autofill() {
  for (const tip of strongTips.values()) {
    if (grid[tip.i][tip.j] === null) {
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
    clearGrid();
    grid = structuredClone(puzzle_master);
    update();
    lockNumbers();
  }
  if (e.key === "c") {
    clearGrid();
    update();
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

  createTips();
  createGrid();
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
      if (isDiscarded(i, j, n)) {
        let pad_top = miniSide*0.2;
        let pad_bottom = miniSide*0.8;
        line(lilX+pad_top, lilY+pad_top, lilX+pad_bottom, lilY+pad_bottom);
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
