const $ = (id) => document.getElementById(id);
const card = $("feature-card");
let dismissed = false;
const nav = document.querySelector("nav");
const dot = document.createElement("span");
dot.className = "nav-indicator";
dot.setAttribute("aria-hidden", "true");
nav.prepend(dot);
function position() {
  const active = nav.querySelector('[aria-current="page"]');
  dot.hidden = !active;
  if (active) {
    dot.style.width = `${active.offsetWidth}px`;
    dot.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}
document.addEventListener("vani:route", (event) => {
  position();
  const room = ["dictate", "practice"].includes(event.detail);
  card.hidden = !room || dismissed;
  document.body.classList.toggle("has-feature-card", room && !dismissed);
  $("card-open").hidden = !room || !dismissed;
  if (
    room &&
    !dismissed &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    card.animate(
      [
        { opacity: 0, transform: "translateY(16px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 350, easing: "ease-out" },
    );
});
window.addEventListener("resize", position);
position();
$("card-flip").onclick = () => {
  const flipped = card.classList.toggle("flipped");
  $("card-flip").setAttribute("aria-pressed", String(flipped));
  card
    .querySelector(".card-front")
    .setAttribute("aria-hidden", String(flipped));
  card
    .querySelector(".card-back")
    .setAttribute("aria-hidden", String(!flipped));
};
$("card-expand").onclick = () => {
  const expanded = card.classList.toggle("expanded");
  document.body.classList.toggle("card-expanded", expanded);
  $("card-expand").setAttribute("aria-expanded", String(expanded));
  $("card-expand").textContent = expanded ? "Shrink" : "Expand";
};
$("card-close").onclick = async () => {
  dismissed = true;
  const anim = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? null
    : card.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(24px)" },
        ],
        { duration: 180 },
      );
  await anim?.finished;
  card.hidden = true;
  document.body.classList.remove("has-feature-card");
  $("card-open").hidden = false;
  $("card-open").focus();
};
$("card-open").onclick = () => {
  dismissed = false;
  card.hidden = false;
  document.body.classList.add("has-feature-card");
  $("card-open").hidden = true;
  $("card-flip").focus();
};
const initial = location.hash.slice(1);
card.hidden = !["practice", "dictate"].includes(initial);
document.body.classList.toggle("has-feature-card", !card.hidden);
card.querySelector(".card-back").setAttribute("aria-hidden", "true");
