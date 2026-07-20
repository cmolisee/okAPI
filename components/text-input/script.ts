import css from './styles.css?raw';
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
    static readonly observedAttributes = ['placeholder', 'disabled', 'readonly', 'name', 'required'] as const;
    static formAssociated = true;

    private readonly input: HTMLInputElement;
    private readonly internals: ElementInternals;
    private readonly defaultValue: string;
    private fieldsetDisabled = false;

    constructor() {
        super();
        this.internals = this.attachInternals();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.input = shadow.querySelector('input') as HTMLInputElement;

        this.defaultValue = this.getAttribute('value') ?? '';
        this.value = this.defaultValue;
        this.syncAttrs()

        this.input.addEventListener('input', () => {
            this.internals.setFormValue(this.input.value);
        });
        this.input.addEventListener('change', () => {
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.internals.form?.requestSubmit();
        });
    }

    formResetCallback(): void {
        this.value = this.defaultValue;
    }

    formDisabledCallback(disabled: boolean): void {
        this.fieldsetDisabled = disabled;
        this.syncAttrs();
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    get value(): string { return this.getAttribute('value') ?? ''; }
    set value(value: string) { 
        this.setAttribute('value', value); 
    }
    get placeholder(): string { return this.getAttribute('placeholder') ?? ''; }
    set placeholder(value: string) { this.setAttribute('placeholder', value); }
    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    get readOnly(): boolean { return this.hasAttribute('readOnly'); }
    set readOnly(value: boolean) { this.toggleAttribute('readOnly', value); }
    get name(): string { return this.getAttribute('name') ?? ''; }
    set name(value: string) { this.setAttribute('name', value); }
    get required(): boolean { return this.hasAttribute('required'); }
    set required(v: boolean) { this.toggleAttribute('required', v); }

    private syncAttrs(): void {
        this.input.placeholder = this.placeholder;
        this.input.disabled = this.disabled || this.fieldsetDisabled;
        this.input.readOnly = this.readOnly;
        this.input.name = this.name;
        this.input.required = this.required;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-text-input')) {
    customElements.define('ok-text-input', OkTextInput);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-text-input': OkTextInput
    }
}