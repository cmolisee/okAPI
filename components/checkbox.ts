import './checkbox.module.css';

type Attributes = Partial<Pick<HTMLInputElement,'id'|'checked'|'onchange'> & Pick<HTMLLabelElement,'textContent'|'htmlFor'> & { labelClassList: Set<string>, classList: Set<string> }>;

const template = `
    <div class="checkbox-wrapper">
        
    </div>
`;

export default function createCheckbox({
    textContent = '',
    htmlFor = '',
    labelClassList = new Set(),
    id = '',
    classList = new Set(),
    checked = false,
    onchange = null,
}: Attributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    const label = root.querySelector('label')!;
    const input = root.querySelector('input')!;

    label.textContent = textContent;
    label.classList.add(...labelClassList);
    label.htmlFor = htmlFor;

    input.id = id;
    input.classList.add(...classList);
    input.checked = checked;
    input.onchange = onchange;

    return root;
}


const stylesheet = new CSSStyleSheet();
stylesheet.replaceSync(`
  :host {
    --ok-checkbox-size: 12px;
    --ok-checkbox-radius: 2px;
    --ok-checkbox-border: #8c8c8c;
    --ok-checkbox-border-hover: #6b6b6b;
    --ok-checkbox-bg: #ffffff;
    --ok-checkbox-bg-disabled: #eeeeee;
    --ok-checkbox-accent: #1a73e8;
    --ok-checkbox-accent-hover: #1967d2;
    --ok-checkbox-mark: #ffffff;
    --ok-checkbox-focus-ring: rgba(26,115,232,0.5);
    --ok-checkbox-label-color: #1f1f1f;
    --ok-checkbox-label-color-disabled: #5f6368;

    display: inline-flex;
    align-items: center;
    user-select: none;
    -webkit-user-select: none;
    cursor: default;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  @media (prefers-color-scheme: dark) {
    :host {
        --ok-checkbox-border: #6b6b6b;
        --ok-checkbox-border-hover: #9aa0a6;
        --ok-checkbox-bg: #3c4043;
        --ok-checkbox-bg-disabled: #2b2b2b;
        --ok-checkbox-accent: #8ab4f8;
        --ok-checkbox-accent-hover: #aecbfa;
        --ok-checkbox-mark: #202124;
        --ok-checkbox-label-color: #e8eaed;
        --ok-checkbox-label-color-disabled: #80868b;
    }
  }

  .row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  :host([disabled]) .row {
  cursor: default;
  }
`);
