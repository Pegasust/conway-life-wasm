mod utils;

use std::fmt;

use itertools::Itertools;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// It seems every wasm-bindgen will subsequently generates an export function
/// to the JS front-end
#[wasm_bindgen]
extern "C" {
    /// This is basically a binding to JS's window.alert function
    fn alert(s: &str);
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}
// Next let's define a macro that's like `println!`, only it works for
// `console.log`. Note that `println!` doesn't actually work on the wasm target
// because the standard library currently just eats all output. To get
// `println!`-like behavior in your app you'll likely want a macro like this.

macro_rules! console_log {
    // Note that this is using the `log` function imported above during
    // `bare_bones`
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    let alert_str = format!("Hello, {}!", name);
    alert(&alert_str);
}

// Implementation of finite game of life universe
#[wasm_bindgen]
#[repr(u8)]
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Cell {
    Dead,
    Alive,
}

impl fmt::Display for Cell {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Cell: {}",
            if *self == Cell::Dead { "Dead" } else { "Alive" }
        )
    }
}

#[wasm_bindgen]
pub struct Universe {
    width: u32,
    height: u32,
    cells: Vec<Cell>,
    stable: bool,
}

impl Universe {
    fn cell_idx(&self, x: u32, y: u32) -> usize {
        (y * self.width + x) as usize
    }
    fn cell_idx_safe(&self, x: u32, y: u32) -> usize {
        self.cell_idx(x % self.width, y % self.height)
    }

    /// Counts the number of neighboring cells that are alive
    /// This is helpful to determine the next state of our given `(x, y)`
    /// This implementation implements a wrapping on the boundaries
    fn neighbor_lives(&self, x: u32, y: u32) -> u8 {
        [self.height - 1, 0, 1]
            .iter()
            .cartesian_product([self.width - 1, 0, 1].iter())
            .filter(|(&x, &y)| (x, y) != (0, 0))
            .map(|(y_offset, x_offset)| self.cells[self.cell_idx_safe(x + x_offset, y + y_offset)])
            .fold(0u8, |sum_cum, cell| {
                sum_cum + if cell == Cell::Alive { 1u8 } else { 0u8 }
            })
    }
}

// Exported interface
#[wasm_bindgen]
impl Universe {
    pub fn width(&self) -> u32 {
        return self.width;
    }
    pub fn height(&self) -> u32 {
        return self.height;
    }
    pub fn cells(&self) -> *const Cell {
        // TODO: Is this even safe?
        return self.cells.as_ptr();
    }
    pub fn tick_self(&mut self) {
        if self.stable {
            console_log!("Stable update");
            return;
        }
        let next = (0..self.height)
            .cartesian_product(0..self.width)
            .map(|(y, x)| (x, y, self.neighbor_lives(x, y), self.cells[self.cell_idx(x, y)]))
            .map(|(x, y, live_neighbors, cell)| {
                if live_neighbors != 0 {console_log!("({}, {}): ({}, {})", x, y, live_neighbors, cell);}
                match (live_neighbors, cell) {
                    // 1) Any live cell with fewer than 2 live neighbors dies
                    (count, Cell::Alive) if count < 2 => Cell::Dead,
                    // 2) Any live cell with 2 or 3 live neighbors remain
                    (2, Cell::Alive) | (3, Cell::Alive) => Cell::Alive,
                    // 3) Any live cell with more than 3 live neighbors dies
                    (count, Cell::Alive) if count > 3 => Cell::Dead,
                    // 4) Any dead cell with exactly 3 live neighbors becomes alive
                    (3, Cell::Dead) => Cell::Alive,
                    (_, last_status) => last_status,
                }
            })
            .collect_vec();
        self.stable = next == self.cells;
        self.cells = next;
        console_log!("Universe:\n{}", self);
    }
}

impl fmt::Display for Universe {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let cells_str = self
            .cells
            .iter()
            .map(|&cell| if cell == Cell::Dead { '◻' } else { '◼' })
            .chunks(self.width as usize)
            .into_iter()
            .map(|chunk| chunk.collect::<String>())
            .collect_vec()
            .join("\n");
        write!(f, "{}", cells_str)
    }
}

fn rand_u64() -> Result<u64, getrandom::Error> {
    let mut buf = [0u8; 8];
    getrandom::getrandom(&mut buf)?;
    Ok(u64::from_be_bytes(buf))
}

fn cell_from_plaintext<T, E>(plain_text: T) -> Vec<Vec<Cell>>
where
    T: Iterator<Item = E>,
    E: Iterator<Item = u8>,
{
    plain_text
        .map(|line| {
            line.map(|c| match c {
                b'.' => Cell::Dead,
                b'O' => Cell::Alive,
                _ => panic!("Unknown plaintext character"),
            })
            .collect::<Vec<Cell>>()
        })
        .collect::<Vec<Vec<Cell>>>()
}

#[wasm_bindgen]
impl Universe {
    fn empty_cell(width: u32, height: u32) -> Vec<Cell> {
        (0..width * height).map(|_| Cell::Dead).collect()
    }
    fn example_cell(width: u32, height: u32) -> Vec<Cell> {
        (0..width * height)
            .map(|i| {
                if i % 2 == 0 || i % 7 == 0 {
                    Cell::Alive
                } else {
                    Cell::Dead
                }
            })
            .collect()
    }
    fn rand_cell(width: u32, height: u32, alive_prob: f64) -> Vec<Cell> {
        let lower_bound: u64 = ((u64::MAX as f64) * alive_prob) as u64;
        (0..width * height)
            .map(|_| rand_u64())
            .map(|v| {
                if v.unwrap() >= lower_bound {
                    Cell::Dead
                } else {
                    Cell::Alive
                }
            })
            .collect()
    }
    /// A simple spaceship placement on a given cell. It will modify a given bound
    /// for the loafer, starting from the proper bot-left (x,y).
    fn loafer(&mut self, top_left_x: u32, top_left_y: u32) {
        let loafer = cell_from_plaintext(
            r#"
            .OO..O.OO
            O..O..OO.
            .O.O.....
            ..O......
            ........O
            ......OOO
            .....O...
            ......O..
            .......OO
            "#
            .split("\n")
            .map(|s| s.trim().bytes())
            .filter(|s| s.len() > 0),
        );
        // let loafer = vec![
        //     vec![Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead],
        //     vec![Cell::Dead, Cell::Dead, Cell::Alive, Cell::Dead, Cell::Dead, Cell::Alive, Cell::Dead],
        //     vec![Cell::Dead, Cell::Alive, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead],
        //     vec![Cell::Dead, Cell::Alive, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Alive, Cell::Dead],
        //     vec![Cell::Dead, Cell::Alive, Cell::Alive, Cell::Alive, Cell::Alive, Cell::Dead, Cell::Dead],
        //     vec![Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead, Cell::Dead],
        // ];

        for y_offset in 0..loafer.len() as u32 {
            for x_offset in 0..loafer[0].len() as u32 {
                let v = loafer[y_offset as usize][x_offset as usize];
                let x = top_left_x + x_offset;
                let y = top_left_y + y_offset;
                let idx_safe = self.cell_idx_safe(x, y);
                self.cells[idx_safe] = v;
                console_log!("{}, {}: {}", y, x, v);
            }
        }
    }
    fn stable(&mut self, top_left_x: u32, top_left_y: u32) {
        for x_offset in 0..3 {
            let idx = self.cell_idx_safe(top_left_x + x_offset, top_left_y);
            self.cells[idx] = Cell::Alive
        }
    }
    pub fn new() -> Universe {
        utils::set_panic_hook();
        const DEFAULT_WIDTH: u32 = 16;
        const DEFAULT_HEIGHT: u32 = 16;
        // let mut cells: Vec<Cell> = Self::example_cell(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        // let cells: Vec<Cell> = Self::rand_cell(DEFAULT_WIDTH, DEFAULT_HEIGHT, 0.3);
        let cells: Vec<Cell> = Self::empty_cell(DEFAULT_WIDTH, DEFAULT_HEIGHT);
        let mut uni = Universe {
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
            cells,
            stable: false,
        };
        // uni.loafer(1, 1);
        uni.stable(3, 3);
        console_log!("Universe: \n{}", uni);
        uni
    }

    pub fn render(&self) -> String {
        self.to_string()
    }
}
