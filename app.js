const byId = id => document.getElementById(id);

function showJournal(open) {
  byId('control').hidden = open;
  byId('journal').hidden = !open;
  byId('show-control').setAttribute('aria-pressed', !open);
  byId('show-journal').setAttribute('aria-pressed', open);
}

byId('show-control').onclick = () => showJournal(false);
byId('show-journal').onclick = () => showJournal(true);
