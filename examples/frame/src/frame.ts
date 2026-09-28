const output = document.querySelector<HTMLOutputElement>("#count");
const button = document.querySelector<HTMLButtonElement>("#increment");
const mark = document.querySelector<HTMLImageElement>("#starter-mark");
if (mark !== null) mark.src = orbPluginAssetUrl("ui/assets/starter-mark.png");
let count = 0;
button?.addEventListener("click", () => {
  count += 1;
  if (output !== null) output.textContent = String(count);
});
