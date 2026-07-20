import css from './styles.css?raw';
import html from './index.html?raw';

export type KeyValue = {
    key: string;
    value: string;
}

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Key value web component.
 * 
 * Usage:
 *   <ok-key-value-input key-placeholder="Header" value-placeholder="Value">
 *   </ok-key-value-input>
 *
 *   const el = document.querySelector<OkKeyValueInput>('ok-key-value-input');
 *   el.value = { key: 'X-Custom', value: 'true' };
 *   el.addEventListener('input', () => console.log(el.value));  // every keystroke
 *   el.addEventListener('change', () => console.log(el.value)); // on commit/blur
 */
export class OkKeyValue extends HTMLElement {
    static readonly observedAttributes = ['disabled', 'name', 'key-placeholder', 'value-placeholder'] as const;
    static formAssociated = true;

    private readonly keyPart: HTMLInputElement;
    private readonly valuePart: HTMLInputElement;
    private readonly internals: ElementInternals;
    private readonly defaultKey: string;
    private readonly defaultValue: string;
    private fieldsetDisabled = false;

    constructor() {
        super();
        this.internals = this.attachInternals();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));

        this.keyPart = shadow.querySelector('.key') as HTMLInputElement;
        this.valuePart = shadow.querySelector('.value') as HTMLInputElement;

        this.defaultKey = this.getAttribute('key') ?? '';
        this.defaultValue = this.getAttribute('value') ?? '';
        
        this.keyPart.value = this.defaultKey;
        this.valuePart.value = this.defaultValue;
        
        this.syncAttrs()
        this.updateFormValue();

        this.keyPart.addEventListener('input', () => this.updateFormValue());
        this.keyPart.addEventListener('change', () => this.dispatchEvent(new Event('change', { bubbles: true })));
        this.valuePart.addEventListener('input', () => this.updateFormValue());
        this.valuePart.addEventListener('change', () => this.dispatchEvent(new Event('change', { bubbles: true })));
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    formResetCallback(): void {
        this.keyPart.value = this.defaultKey;
        this.valuePart.value = this.defaultValue;
        this.updateFormValue();
    }

    formDisabledCallback(disabled: boolean): void {
        this.fieldsetDisabled = disabled;
        this.syncAttrs();
    }

    get value(): KeyValue { return { key: this.keyPart.value, value: this.valuePart.value }; }
    set value(value: KeyValue) { 
        this.keyPart.value = value.key ?? '';
        this.valuePart.value = value.value ?? '';
        this.updateFormValue();
     }

    get name(): string { return this.getAttribute('name') ?? ''; }
    set name(value: string) { this.setAttribute('name', value); }
    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }

    private syncAttrs(): void {
        this.keyPart.disabled = this.disabled || this.fieldsetDisabled;
        this.valuePart.disabled = this.disabled || this.fieldsetDisabled;
        this.keyPart.placeholder = this.getAttribute('key-placeholder') ?? '';
        this.valuePart.placeholder = this.getAttribute('value-placeholder') ?? '';
    }

    private updateFormValue(): void {
        const key = this.keyPart.value;
        if (!key) {
            this.internals.setFormValue(null);
            return;
        }
        const fieldName = this.name ? `${this.name}[${key}]` : key;
        const formData = new FormData();
        formData.append(fieldName, this.valuePart.value);
        this.internals.setFormValue(formData);
    }
}

// do not redefine if already defined
if (!customElements.get('ok-key-value')) {
    customElements.define('ok-key-value', OkKeyValue);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-key-value': OkKeyValue
    }
}