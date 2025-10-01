document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll("#tab-nav .tabnav");
  const panels = document.querySelectorAll("#tab-contents .tabtxt");

  function activate(targetSel) {
    tabs.forEach(t => t.classList.remove("active"));
    panels.forEach(p => p.classList.remove("active"));
    const tab = [...tabs].find(t => t.dataset.target === targetSel);
    const panel = document.querySelector(targetSel);
    if (tab && panel) { tab.classList.add("active"); panel.classList.add("active"); }
  }

  tabs.forEach(t => t.addEventListener("click", () => activate(t.dataset.target)));
  // default
  if (tabs[0]) activate(tabs[0].dataset.target);
});
