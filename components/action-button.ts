import './button.module.css';

type ActionAttributes = Partial<Pick<HTMLButtonElement,'id'|'textContent'|'ariaDisabled'|'onclick'>> & { classList?: Set<string>};

const template = `
  <button class="btn">button</button>
`;

export default function createActionButton({
  id = '',
  textContent = '',
  classList = new Set(),
  ariaDisabled = null,
  onclick = null,
}: ActionAttributes): HTMLButtonElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLButtonElement;

    root.textContent = textContent;
    root.id = id;
    root.classList.add('action-btn', ...classList);

    root.ariaDisabled = ariaDisabled;

    root.onclick = onclick;

    return root;
}