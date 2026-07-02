import './tab-toolbar.module.css';
type Attributes = Partial<Pick<HTMLDivElement,'id'|'ariaSelected'|'onclick'>> & { title: string; };
const template = `
  <div class="toolbar-tab">
    <span class="tab-title" role="tab"
  </div>
`;

export default function createToolbarTab({
  id = '',
  title,
  ariaSelected = 'false',
  onclick = null,
}: Attributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    root.id = id;
    root.ariaLabel = title;
    root.ariaSelected = ariaSelected;
    root.onclick = onclick

    const span = root.querySelector('span');
    span!.textContent = title;

    return root;
}