import init, {Universe} from "../pkg/web-app";

async function main() {
    await init();
    const pre = document.getElementById("canvas");
    const universe = Universe.new();
    const renderLoop = ()=>{
        pre.textContent = universe.render();
        universe.tick_self();
        requestAnimationFrame(renderLoop);
    };
    requestAnimationFrame(renderLoop);
}
main();
