import './button.module.css';

type ToggleAttributes = Partial<Pick<HTMLButtonElement,'id'|'textContent'|'ariaDisabled'|'ariaPressed'|'onclick'>> & { classList?: Set<string>};

const template = `
  <button class="btn">button</button>
`;

export default function createToggleButton({
  id = '',
  textContent = '',
  classList = new Set(),
  ariaDisabled = null,
  ariaPressed = null,
  onclick = null,
}: ToggleAttributes): HTMLButtonElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLButtonElement;

    root.textContent = textContent;
    root.id = id;
    root.classList.add('toggle-btn', ...classList);

    root.ariaDisabled = ariaDisabled;
    root.ariaPressed = ariaPressed;

    root.onclick = onclick;

    return root;
}