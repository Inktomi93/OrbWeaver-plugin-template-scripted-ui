const output = document.querySelector<HTMLDivElement>("#count");
const button = document.querySelector<HTMLButtonElement>("#increment");
let count = 0;
button?.addEventListener("click", () => {
  count += 1;
  if (output !== null) output.textContent = String(count);
});
