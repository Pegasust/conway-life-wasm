import init, {greet} from "../pkg/web-app";

async function main() {
    await init();
    greet();
}
main();
