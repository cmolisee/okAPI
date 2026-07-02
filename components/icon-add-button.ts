import './button.module.css';

type IconAddAttributes = Partial<Pick<HTMLButtonElement,'onclick'|'type'>>;

const template = `
  <button class="btn icon">
      <svg fill="currentColor" viewBox="0 0 16 16" color="currentColor" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;"><path d="M8 1.5a.5.5 0 0 0-1 0V7H1.5a.5.5 0 0 0 0 1H7v5.5a.5.5 0 0 0 1 0V8h5.5a.5.5 0 0 0 0-1H8V1.5Z"></path></svg>
  </button>
`;

export default function createIconAddButton({
  onclick = null,
  type = 'button',
}: IconAddAttributes): HTMLButtonElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(template, 'text/html');
  const root = doc.body.firstElementChild as HTMLButtonElement;

  root.onclick = onclick;
  root.type = type;
  
  return root;
}