const SHEET = "[data-record-sheet]";
const OPEN_SHEET = `${SHEET}[data-open]`;
const DURATION = 620;
const EASING = "cubic-bezier(0.3, 0.75, 0.1, 1)";
const CARD_RADIUS = 24;
const TIMEOUT_MS = 800;
let morphVersion = 0;

const canMorph = () =>
  typeof Element.prototype.animate === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;

const setMorph = (state: "opening" | "closing" | "closed" | null) => {
  if (state) document.documentElement.dataset.recordMorph = state;
  else delete document.documentElement.dataset.recordMorph;
};

const waitFor = <T extends Element>(selector: string) =>
  new Promise<T | null>((resolve) => {
    const found = document.querySelector<T>(selector);
    if (found) return resolve(found);
    const observer = new MutationObserver(() => {
      const element = document.querySelector<T>(selector);
      if (!element) return;
      observer.disconnect();
      clearTimeout(timer);
      resolve(element);
    });
    const timer = setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, TIMEOUT_MS);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  });

const findCard = (recordId: string) => {
  const card = document.querySelector<HTMLElement>(`[data-record-card="${CSS.escape(recordId)}"]`);
  if (!card) return null;
  const rect = card.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight ? card : null;
};

type Parts = {
  actions: HTMLElement | null;
  body: HTMLElement | null;
  header: HTMLElement;
  overlay: HTMLElement | null;
  scroll: HTMLElement;
  sheet: HTMLElement;
};

const findParts = (sheet: HTMLElement): Parts | null => {
  const scroll = sheet.querySelector<HTMLElement>("[data-record-scroll]");
  const header = sheet.querySelector<HTMLElement>("[data-record-header]");
  if (!scroll || !header) return null;
  return {
    actions: sheet.querySelector("[data-record-actions]"),
    body: sheet.querySelector("[data-record-body]"),
    header,
    overlay: document.querySelector('[data-slot="bottom-sheet-overlay"]'),
    scroll,
    sheet,
  };
};

const cardFrames = (card: HTMLElement, { header, scroll, sheet }: Parts) => {
  const box = { left: sheet.offsetLeft, top: sheet.offsetTop, width: sheet.offsetWidth, height: sheet.offsetHeight };
  const cardBox = card.getBoundingClientRect();
  const top = cardBox.top - box.top;
  const left = cardBox.left - box.left;
  const right = box.left + box.width - cardBox.right;
  return {
    clip: `inset(${top}px ${right}px ${box.top + box.height - cardBox.bottom}px ${left}px round ${CARD_RADIUS}px)`,
    header: {
      height: `${header.offsetHeight}px`,
      marginLeft: `${left}px`,
      marginRight: `${right}px`,
    },
    // 헤더 높이를 줄이면 스크롤이 보정되어 착지 직전에 튄다. 아래쪽을 카드에 맞추고 위를 잘라낸다.
    ride: `translateY(${top + scroll.scrollTop + cardBox.height - header.offsetHeight}px)`,
  };
};

const FULL = { clip: "inset(0px 0px 0px 0px round 0px)", ride: "translateY(0px)" };

const fade = (element: HTMLElement | null, opening: boolean, delay: number, duration: number) => {
  element?.animate(
    { opacity: opening ? [0, 1] : [1, 0] },
    opening
      ? { duration, delay, easing: "ease", fill: "backwards" }
      : { duration: 80, easing: "ease-out", fill: "forwards" },
  );
};

const run = (parts: Parts, card: HTMLElement, opening: boolean) => {
  const shut = cardFrames(card, parts);
  const wide = { height: `${parts.header.offsetHeight}px`, marginLeft: "0px", marginRight: "0px" };
  const [from, to] = opening ? [shut, FULL] : [FULL, shut];
  const timing = { duration: DURATION, easing: EASING, fill: "forwards" as const };

  parts.sheet.animate({ clipPath: [from.clip, to.clip] }, timing);
  const dragged = parts.sheet.style.transform;
  if (!opening && dragged) parts.sheet.animate({ transform: [dragged, "none"] }, timing);
  parts.header.animate(opening ? [shut.header, wide] : [wide, shut.header], timing);
  parts.overlay?.animate(
    { opacity: opening ? [0, 1] : [1, 0] },
    { duration: DURATION, easing: "ease", fill: "forwards" },
  );
  fade(parts.body, opening, 120, 300);
  fade(parts.actions, opening, 250, 180);
  return parts.scroll.animate({ transform: [from.ride, to.ride] }, timing).finished;
};

const clear = ({ sheet, header, scroll, body, actions, overlay }: Parts) => {
  for (const element of [sheet, header, scroll, body, actions, overlay]) {
    for (const animation of element?.getAnimations() ?? []) animation.cancel();
  }
};

export const openRecordSheetFromCard = (card: HTMLElement, open: () => void) => {
  const version = ++morphVersion;
  if (!canMorph()) return open();

  setMorph("opening");
  open();
  void waitFor<HTMLElement>(`${OPEN_SHEET} [data-record-header]`).then(async () => {
    if (version !== morphVersion) return;
    const sheet = document.querySelector<HTMLElement>(OPEN_SHEET);
    const parts = sheet && findParts(sheet);
    if (!parts) return setMorph(null);
    await run(parts, card, true).catch(() => {});
    if (version !== morphVersion) return;
    clear(parts);
    setMorph(null);
  });
};

export const closeRecordSheetIntoCard = (recordId: string, close: () => void) => {
  const version = ++morphVersion;
  const card = findCard(recordId);
  const sheet = document.querySelector<HTMLElement>(OPEN_SHEET);
  const parts = sheet && findParts(sheet);
  if (!canMorph() || !card || !parts) {
    setMorph(null);
    if (sheet) sheet.style.transform = "";
    return close();
  }

  setMorph("closing");
  void run(parts, card, false)
    .catch(() => {})
    .then(() => {
      if (version !== morphVersion) return;
      setMorph("closed");
      close();
      void waitFor(`body:not(:has(${SHEET}))`).then(() => {
        if (version === morphVersion) setMorph(null);
      });
    });
};
