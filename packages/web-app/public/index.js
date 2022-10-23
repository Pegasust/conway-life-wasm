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
  let width = universe.width();
  let height = universe.height();

  // Give the canvas room for all of our cells and a 1px border
  // around each of them.
  const canvas = document.getElementById("canvas");

  // context to interact with our 2D canvas
  const ctx = canvas.getContext('2d');

  const clearGrid = () => {
    ctx.clearRect(0, 0, canvas.height, canvas.width);
    canvas.height = (CELL_SIZE + 1) * height + 1;
    canvas.width = (CELL_SIZE + 1) * width + 1;
  }
  clearGrid();
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
  let lastFrame = Date.now();
  let frameDelayMs = 0;
  const setFrameDelay = (newFrameDelay) => {
    frameDelayMs = newFrameDelay;
  }
  const renderLoop = () => {
    let now = Date.now();
    if (now - lastFrame >= frameDelayMs) {
      universe.tick_self();

      drawGrid();
      drawCells();

      lastFrame = now;
    }
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

    const cellY = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
    const cellX = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

    if (event.ctrlKey) {
      universe.add_glider(cellX, cellY);
    } else if (event.shiftKey) {
      universe.add_pulsar(cellX, cellY);
    } else {
      universe.toggle_cell(cellX, cellY);
    }
    drawGrid();
    drawCells();
  })

  // Reset the universe
  document.getElementById("reset").textContent = '↻';
  const universeSelect = document.getElementById("universe-choice");
  const universeSelectElem = () => {
    return universeSelect.options[universeSelect.selectedIndex];
  };
  const universeChoiceDropdown = document.getElementById("universe-choice");

  const aliveProbability = document.getElementById("alive-probability");
  universeChoiceDropdown.addEventListener("change", _event => {
    const selection = universeSelectElem().value;
    console.log(`universeChoiceDropdown changed: ${selection}`);
    switch (selection) {
      case 'random':
        aliveProbability.style.display = "block";
        break;
      default:
        aliveProbability.style.display = "none";
        break;
    }
  })
  document.getElementById("reset").addEventListener("click", _event => {
    const selection = universeSelectElem().value;
    switch (selection) {
      case 'random':
        const prob = parseFloat(document.getElementById("alive-prob").value);
        universe.set_random_universe(prob);
        break;
      case 'mod-27':
        universe.set_27_universe();
        break;
      case 'empty':
        universe.set_empty_universe();
        break;
      case 'stable':
        universe.set_stable_universe();
        break;
    }
  });

  // Speed slider
  const frametimeSlider = document.getElementById("frametime-pct");
  const frametimeDisplay = document.getElementById("frametime-ms");
  frametimeSlider.addEventListener("change", _event => {
    const max_millis = 1000;
    const percent = parseFloat(frametimeSlider.value);
    const per10 = percent / 10;
    const base = 2;
    const max = Math.pow(base, 10);
    const actualMs = (Math.pow(base, per10) / max) * max_millis;
    setFrameDelay(actualMs);
    frametimeDisplay.textContent = Math.abs(percent) <= 1e-5 ? "ASAP" : `${actualMs.toFixed(3)} ms`;
  })

  // Set grid width/height (this also restarts the grid)
  const gridWidth = document.getElementById("grid-width");
  const gridHeight = document.getElementById("grid-height");
  const gridDim = [[gridWidth, (w) => {
    universe.set_width(w);
    width = w;
    clearGrid();
  }, ()=>width], [gridHeight, (w) => {
    universe.set_height(w)
    height = w;
    clearGrid();
  }, ()=>height]];
  gridDim.map(([dim, setter, getter]) => {
    dim.addEventListener("change", _event => {
      setter(parseInt(dim.value));
    });
    dim.value = getter();
  })

}
main();
