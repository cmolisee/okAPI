import css from './styles.css?inline';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Text input web component.
 * 
 * Usage:
 *   <ok-text-input placeholder="Filter"></ok-text-input>
 *
 *   const el = document.querySelector<OkTextInput>('ok-text-input');
 *   el.value = 'hello';
 *   el.addEventListener('input', () => console.log(el.value));   // every keystroke
 *   el.addEventListener('change', () => console.log(el.value));  // on commit/blur
 */
export class OkTextInput extends HTMLElement {
    static readonly observedAttributes = [
        'placeholder',
        'disabled',
        'readonly',
        'name',
        'required'
    ] as const;

    private readonly input: HTMLInputElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input') as HTMLInputElement;
        
        if (this.hasAttribute('value')) {
            this.input.value = this.getAttribute('value')!;
        }
        this.syncInput();

        this.input.addEventListener('change', () => {
            this.dispatchEvent(new Event('change', { bubbles: true }));
        })
    }

    attributeChangedCallback(): void {
        this.syncInput();
    }

    get value(): string {
        return this.getAttribute('value') ?? 'on';
    }

    set value(value: string) {
        this.setAttribute('value', value);
    }

    get placeholder(): string {
        return this.getAttribute('placeholder') ?? '';
    }

    set placeholder(value: boolean) {
        this.toggleAttribute('placeholder', value);
    }

    get disabled(): boolean {
        return this.hasAttribute('disabled');
    }

    set disabled(value: boolean) {
        this.toggleAttribute('disabled', value);
    }

    get readOnly(): boolean {
        return this.hasAttribute('readOnly');
    }

    set readOnly(value: boolean) {
        this.toggleAttribute('readOnly', value);
    }

    get name(): string {
        return this.getAttribute('name') ?? '';
    }

    set name(value: string) {
        this.setAttribute('name', value);
    }

    get required(): boolean {
        return this.hasAttribute('required');
    }
    set required(v: boolean) {
        this.toggleAttribute('required', v);
    }

    private syncInput(): void {
        this.input.placeholder = this.placeholder;
        this.input.disabled = this.disabled;
        this.input.readOnly = this.readOnly;
        this.input.name = this.name;
        this.input.required = this.required;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-checkbox')) {
    customElements.define('ok-checkbox', OkTextInput);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-input': OkTextInput
    }
}