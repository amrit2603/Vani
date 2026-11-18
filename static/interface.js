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
let pageName = null,
  revision = 0;
function render(page) {
  revision++;
  if (page !== pageName) dismissed = false;
  pageName = page;
  position();
  const room = ["dictate", "practice"].includes(page);
  document.body.classList.toggle("is-home", page === "home");
  document.body.classList.remove("has-feature-card");
  $("main").before(card);
  if (page === "home") $("home-view").append($("card-open"));
  else card.after($("card-open"));
  card.hidden = !room || dismissed;
  $("card-open").hidden = page !== "home" && (!room || !dismissed);
  $("card-open").setAttribute("aria-expanded", String(!card.hidden));
  if (!card.hidden && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    card.animate(
      [
        { opacity: 0, transform: "translateX(calc(100% + 24px))" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" },
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
  const version = revision;
  const animation = matchMedia("(prefers-reduced-motion: reduce)").matches
    ? null
    : card.animate(
        [
          { opacity: 1, transform: "translateX(0)" },
          { opacity: 0, transform: "translateX(calc(100% + 24px))" },
        ],
        { duration: 180, easing: "ease-in" },
      );
  await animation?.finished;
  if (version !== revision) return;
  render(pageName);
  $("card-open").focus();
};
$("card-open").onclick = () => {
  if (pageName === "home") {
    location.hash = "dictate";
    return;
  }
  dismissed = false;
  render(pageName);
  $("card-flip").focus();
};
card.querySelector(".card-back").setAttribute("aria-hidden", "true");
render(location.hash.slice(1) || "home");
