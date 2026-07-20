import css from './styles.css?raw';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Select web component.
 * 
 * Usage:
 *   <ok-select name="theme">
 *     <option value="system" selected>System</option>
 *     <option value="light">Light</option>
 *     <option value="dark">Dark</option>
 *   </ok-select>
 *
 *   const el = document.querySelector<OkSelect>('ok-select');
 *   el.value = 'dark';
 *   el.addEventListener('change', () => console.log(el.value));
 */
export class OkSelect extends HTMLElement {
    static readonly observedAttributes = ['disabled', 'name', 'required'] as const;
    static formAssociated = true;

    private readonly select: HTMLSelectElement;
    private readonly internals: ElementInternals;
    private fieldsetDisabled = false;

    constructor() {
        super();
        this.internals = this.attachInternals();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.select = shadow.querySelector('select') as HTMLSelectElement;
        this.syncAttrs();

        this.select.addEventListener('change', () => {
            this.internals.setFormValue(this.select.value);
            this.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    connectedCallback(): void {
        this.moveOptionsIntoSelect();
        this.internals.setFormValue(this.select.value);
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    formResetCallback(): void {
        for (const option of this.select.options) {
            option.selected = option.defaultSelected;
        }
        this.internals.setFormValue(this.select.value);
    }

    formDisabledCallback(disabled: boolean): void {
        this. fieldsetDisabled = disabled;
        this.syncAttrs();
    }

    refreshOptions(): void {
        this.moveOptionsIntoSelect();
    }

    get value(): string { return this.select.value; }
    set value(value: string) { 
        this.select.value = value;
        this.internals.setFormValue(value);
    }
    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    get name(): string { return this.getAttribute('name') ?? ''; }
    set name(value: string) { this.setAttribute('name', value); }
    get required(): boolean { return this.hasAttribute('required'); }
    set required(v: boolean) { this.toggleAttribute('required', v); }

    private moveOptionsIntoSelect(): void {
        for (const child of Array.from(this.children)) {
            if (child.tagName === 'OPTION' || child.tagName === 'OPTGROUP') {
                this.select.appendChild(child);
            }
        }
    }
    private syncAttrs(): void {
        this.select.disabled = this.disabled || this.fieldsetDisabled;
        this.select.name = this.name;
        this.select.required = this.required;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-select')) {
    customElements.define('ok-select', OkSelect);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-select': OkSelect
    }
}