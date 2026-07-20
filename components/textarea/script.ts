import css from './styles.css?raw';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Textarea web component.
 * 
 * Usage:
 *   <ok-textarea placeholder="Paste JSON" rows="6"></ok-textarea>
 *
 *   const el = document.querySelector<OkTextarea>('ok-textarea');
 *   el.value = '{}';
 *   el.addEventListener('input', () => console.log(el.value));
 *   el.addEventListener('change', () => console.log(el.value));
 */
export class OkTextarea extends HTMLElement {
    static readonly observedAttributes = ['placeholder', 'disabled', 'readonly', 'name', 'required', 'rows'] as const;
    static formAssociated = true;

    private readonly textarea: HTMLTextAreaElement;
    private readonly internals: ElementInternals;
    private readonly defaultValue: string;
    private fieldsetDisabled = false;

    constructor() {
        super();
        this.internals = this.attachInternals();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.textarea = shadow.querySelector('textarea') as HTMLTextAreaElement;
        
        this.defaultValue = this.getAttribute('value') ?? '';
        this.value = this.defaultValue;
        this.syncAttrs();

        this.textarea.addEventListener('input', () => {
            this.internals.setFormValue(this.textarea.value);
        });
        this.textarea.addEventListener('change', () => {
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.internals.form?.requestSubmit();
        });
    }

    formResetCallback(): void {
        this.value = this.defaultValue;
    }

    formDisabledCallback(disabled:  boolean): void {
        this.fieldsetDisabled = disabled;
        this.syncAttrs();
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    get value(): string { return this.textarea.value }
    set value(value: string) { this.textarea.value = value }
    get placeholder(): string { return this.getAttribute('placeholder') ?? ''; }
    set placeholder(value: string) { this.setAttribute('placeholder', value); }
    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    get readOnly(): boolean { return this.hasAttribute('readOnly'); }
    set readOnly(value: boolean) { this.toggleAttribute('readOnly', value); }
    get name(): string { return this.getAttribute('name') ?? ''; }
    set name(value: string) { this.setAttribute('name', value); }
    get required(): boolean { return this.hasAttribute('required'); }
    set required(value: boolean) { this.toggleAttribute('required', value); }
    get rows(): number {
        const r = Number(this.getAttribute('rows'));
        return Number.isFinite(r) && r > 0 ? r : 4;
    }
    set rows(value: number) { this.setAttribute('rows', String(value)); }

    private syncAttrs(): void {
        this.textarea.placeholder = this.placeholder;
        this.textarea.disabled = this.disabled || this.fieldsetDisabled;
        this.textarea.readOnly = this.readOnly;
        this.textarea.name = this.name;
        this.textarea.required = this.required;
        this.textarea.rows = this.rows;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-textarea')) {
    customElements.define('ok-textarea', OkTextarea);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-textarea': OkTextarea
    }
}