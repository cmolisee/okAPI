import css from './styles.css?inline';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Checkbox web component.
 * 
 * Usage:
 *   <ok-checkbox>Preserve log</ok-checkbox>
 *
 *   const cb = document.querySelector<OkCheckbox>('ok-checkbox');
 *   cb.checked = true;
 *   cb.addEventListener('change', (e) => console.log(e.detail.checked));
 */
export class OkCheckbox extends HTMLElement {
    static readonly observedAttributes = [
        'checkd',
        'disabled',
        'indeterminate',
        'name',
        'value'
    ] as const;

    private readonly input: HTMLInputElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input') as HTMLInputElement;
        this.input?.addEventListener('click', this.onInputClick);
        this.syncInput();
    }

    attributeChangedCallback(): void {
        this.syncInput();
    }

    get checked(): boolean {
        return this.hasAttribute('checked');
    }

    set checked(value: boolean) {
        this.toggleAttribute('checked', value);
    }

    get indeterminate(): boolean {
        return this.hasAttribute('indeterminate');
    }

    set indeterminate(value: boolean) {
        this.toggleAttribute('indetermineate', value);
    }

    get disabled(): boolean {
        return this.hasAttribute('disabled');
    }

    set disabled(value: boolean) {
        this.toggleAttribute('disabled', value);
    }

    get name(): string {
        return this.getAttribute('name') ?? '';
    }

    set name(value: string) {
        this.setAttribute('name', value);
    }

    get value(): string {
        return this.getAttribute('value') ?? 'on';
    }

    set value(value: string) {
        this.setAttribute('value', value);
    }

    private syncInput(): void {
        this.input.checked = this.checked;
        this.input.indeterminate = this.indeterminate;
        this.input.disabled = this.disabled;
        this.input.name = this.name;
        this.input.value = this.value;
    }

    private readonly onInputClick = (): void => {
        this.indeterminate = false;
        this.checked = this.input.checked;
        this.dispatchEvent(
            new CustomEvent('change', {
                detail: { checked: this.checked },
                bubbles: true,
                composed: true,
            })
        );
    };
}

// do not redefine if already defined
if (!customElements.get('ok-checkbox')) {
    customElements.define('ok-checkbox', OkCheckbox);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-checkbox': OkCheckbox
    }
}