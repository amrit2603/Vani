const $ = (id) => document.getElementById(id);
const card = $("feature-card"),
  nav = document.querySelector("nav");
let dismissed = false;
const indicator = document.createElement("span");
indicator.className = "nav-indicator";
indicator.setAttribute("aria-hidden", "true");
nav.prepend(indicator);
function position() {
  const active = nav.querySelector('[aria-current="page"]');
  indicator.hidden = !active;
  if (active) {
    indicator.style.width = `${active.offsetWidth}px`;
    indicator.style.transform = `translateX(${active.offsetLeft}px)`;
  }
}
function render(page) {
  position();
  const available = ["home", "dictate", "practice"].includes(page);
  document.body.classList.toggle("is-home", page === "home");
  if (page === "home") $("home-view").after(card);
  else $("main").before(card);
  card.hidden = !available || dismissed;
  document.body.classList.toggle(
    "has-feature-card",
    available && !dismissed && page !== "home",
  );
  $("card-open").hidden = !available || !dismissed;
  $("card-open").setAttribute("aria-expanded", String(!card.hidden));
  if (!card.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    card.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 280, easing: "ease-out" },
    );
}
document.addEventListener("vani:route", (event) => render(event.detail));
window.addEventListener("resize", position);
document.fonts.ready.then(position);
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
$("card-close").onclick = async () => {
  dismissed = true;
  const animation = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? null
    : card.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translateY(12px)" }],
        { duration: 160 },
      );
  await animation?.finished;
  render(location.hash.slice(1) || "home");
  $("card-open").focus();
};
$("card-open").onclick = () => {
  dismissed = false;
  render(location.hash.slice(1) || "home");
  $("card-flip").focus();
};
card.querySelector(".card-back").setAttribute("aria-hidden", "true");
render(location.hash.slice(1) || "home");
