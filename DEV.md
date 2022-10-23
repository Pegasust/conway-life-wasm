# Development

- This md keeps track of my developing lifecycle and processes.

# Bootstrapping

- This repository is bootstrapped by `cargo generate --git https://github.com/rustwasm/wasm-pack-template`
  - PREREQ: `cargo install cargo-generate`
  - This creates a child directory with git repo inside

# Repo dependency management (Deprecated thanks to [cargo#10472](https://github.com/rust-lang/cargo/pull/10472))

- [cargo#10472](https://github.com/rust-lang/cargo/pull/10472) helps, but does
not provide `cargo rm` or `cargo upgrade`
- [cargo-edit](https://github.com/killercup/cargo-edit)
- Similar to `npm install --save serde`: `cargo add serde`
  - Also supports adding as dev dependency: `cargo add --dev serde`
- INSTALL: `cargo install cargo-edit` or `cargo install cargo-edit --features vendored-openssl`
- Supports installing with features: `cargo add serde -F serde/derive serde_json`
- Supports installing using an arbitrary path: `cargo add --path /path/to/my/local/package`

# Development scripts management

- [cargo-run-script](https://github.com/JoshMcguigan/cargo-run-script)
- INSTALL: `cargo install cargo-run-script`
- Like `npm run dev|start|db:migrate`, this is a useful source for script management

```toml
# Cargo.toml
[package.metadata.scripts]
hello = "echo Hello"
goodbye = "echo Goodbye"
```

```console
$ cargo run-script hello
Running script 'hello': 'echo Hello'
Hello
Finished, status of exit code: 0
```

# Watch statements (like nodemon)

- [cargo-watch](https://crates.io/crates/cargo-watch)
- INSTALL: `cargo install cargo-watch`
- Usage: `cargo watch -w webapp/src -x 'run -p server'`
  - Runs `cargo run -p server` after changes made to `webapp/src` folder

# Todo dump

- Below are my TODO ideas ordered chronologically
  - Idea tab contains TODO that are added as I go along the development
  - Completed tab contains the chronology of which I am done with the task
- Why keep chronology in both tabs? Because idea chronology != get-it-done chronology

## Idea (most recent to least recent)

- [x] scene: rand: 1/2 per cell
- [ ] scene: spaceship
- [x] dev.md: cargo-watch
- [x] dev.md: [cargo-edit](https://github.com/killercup/cargo-edit)
- [x] dev.md: cargo-generate
- [x] dev.md: [cargo-run-script](https://github.com/JoshMcguigan/cargo-run-script)
- [x] dev.md for initial dev lifecycle

# Done (most recent to least recent)

- [x] scene: rand: 1/2 per cell
- [x] dev.md: cargo-watch
- [x] dev.md for initial dev lifecycle
- [x] dev.md: [cargo-run-script](https://github.com/JoshMcguigan/cargo-run-script)
- [x] dev.md: [cargo-edit](https://github.com/killercup/cargo-edit)
- [x] dev.md: cargo-generate
