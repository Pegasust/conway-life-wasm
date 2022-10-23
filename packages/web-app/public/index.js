// import init , {Unive rse} from "../pkg/web-app";
import init, { Universe, Cell } from "../pkg/web-app";

const CELL_SIZE = 7; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";


async function main() {
  const wasm = await init();
  const memory = wasm.memory;
  // Construct the universe, and get its width and height.
  const universe = Universe.new();
  const width = universe.width();
  const height = universe.height();

  // Give the canvas room for all of our cells and a 1px border
  // around each of them.
  const canvas = document.getElementById("canvas");
  canvas.height = (CELL_SIZE + 1) * height + 1;
  canvas.width = (CELL_SIZE + 1) * width + 1;

  // context to interact with our 2D canvas
  const ctx = canvas.getContext('2d');

  const drawGrid = () => {
    ctx.beginPath();
    ctx.strokeStyle = GRID_COLOR;

    // Vertical lines.
    for (let i = 0; i <= width; i++) {
      ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
      ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
    }

    // Horizontal lines.
    for (let j = 0; j <= height; j++) {
      ctx.moveTo(0, j * (CELL_SIZE + 1) + 1);
      ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
    }

    ctx.stroke();
  };

  // simple helper to get index based on our model
  const getIndex = (row, column) => {
    return row * width + column;
  };

  // fill the cells that are alive
  const drawCells = () => {
    const cellsPtr = universe.cells();
    const cells = new Uint8Array(memory.buffer, cellsPtr, width * height);

    ctx.beginPath();

    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const idx = getIndex(row, col);

        ctx.fillStyle = cells[idx] === Cell.Dead
          ? DEAD_COLOR
          : ALIVE_COLOR;

        ctx.fillRect(
          col * (CELL_SIZE + 1) + 1,
          row * (CELL_SIZE + 1) + 1,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    ctx.stroke();
  };

  // Handle the animation: control whether to request for another animation frame
  let animation_id = null;
  const renderLoop = () => {
    universe.tick_self();

    drawGrid();
    drawCells();

    animation_id = requestAnimationFrame(renderLoop);
  };

  // Handle to whether play or pause game
  const playPauseButton = document.getElementById("play-pause");

  const play = () => {
    playPauseButton.textContent = "⏸";
    renderLoop();
  };

  const isPaused = () => {
    return animation_id == null;
  }
  const pause = () => {
    playPauseButton.textContent = "▶";
    cancelAnimationFrame(animation_id);
    animation_id = null;
  };

  playPauseButton.addEventListener("click", _event => {
    if (isPaused()) {
      play();
    } else {
      pause();
    }
  });

  // Bootstarp & begin the rendering loop
  drawGrid();
  drawCells();
  // requestAnimationFrame(renderLoop);
  play();

  // On click on canvas, calculate which cell is clicked and toggle dead/alive status
  canvas.addEventListener("click", event => {
    const boundingRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / boundingRect.width;
    const scaleY = canvas.height / boundingRect.height;

    const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
    const canvasTop = (event.clientY - boundingRect.top) * scaleY;

    const cellY = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height -1);
    const cellX = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);
    universe.toggle_cell(cellX, cellY);
    drawGrid();
    drawCells();
  })

}
main();
