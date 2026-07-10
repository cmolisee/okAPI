import css from './styles.css?inline';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

type ButtonType = 'button' | 'submit' | 'reset';

/**
 * Icon button web component.
 * 
 * Usage:
 *   <devtools-icon-button type="button" label="Settings">
 *     <svg viewBox="0 0 16 16" fill="currentColor">...</svg>
 *   </devtools-icon-button>
 *
 *   const el = document.querySelector<DevToolsIconButton>('devtools-icon-button');
 *   el.addEventListener('click', () => (el.toggled = !el.toggled));
 */
export class OkIconButton extends HTMLElement {
    static readonly observedAttributes = [
        'disabled',
        'label',
        'toggled',
        'type',
    ] as const;
    static formAssociated = true;

    private readonly button: HTMLButtonElement;
    private readonly internals: ElementInternals;
    private fieldsetDisabled = false;

    constructor() {
        super();
        this.internals = this.attachInternals();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('button')!;
        this.syncAttrs();

        this.button.addEventListener('click', () => {
            if (this.type === 'submit') this.internals.form?.requestSubmit();
            else if (this.type === 'reset') this.internals.form?.reset();
        });
    }

    formDisabledCallback(disabled: boolean): void {
        this.fieldsetDisabled = disabled;
        this.syncAttrs();
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    get type(): ButtonType { 
        const t = this.getAttribute('type');
        return t === 'submit' || t === 'reset' ? t : 'button';
    }
    set type(value: ButtonType) { this.setAttribute('type', value); }
    get label(): string { return this.getAttribute('label') ?? ''; }
    set label(value: string) { this.setAttribute('label', value); }
    get toggled(): boolean { return this.hasAttribute('toggled'); }
    set toggled(value: boolean) { this.toggleAttribute('toggled', value); }

    private syncAttrs(): void {
        this.button.disabled = this.disabled || this.fieldsetDisabled;
        this.button.type = this.type;

        if (this.hasAttribute('label')) {
            this.button.setAttribute('aria-label', this.label);
        } else {
            this.button.removeAttribute('aria-label');
        }

        if (this.hasAttribute('toggled') || this.button.hasAttribute('aria-pressed')) {
            this.button.setAttribute('aria-pressed', String(this.toggled));
        }
    }
}

// do not redefine if already defined
if (!customElements.get('ok-icon-button')) {
    customElements.define('ok-icon-button', OkIconButton);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-icon-button': OkIconButton
    }
}