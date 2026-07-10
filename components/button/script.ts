import css from './styles.css?inline';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

type ButtonType = 'button' | 'submit' | 'reset';

/**
 * Button web component.
 * 
 * Usage:
 *   <devtools-button>Cancel</devtools-button>
 *   <devtools-button variant="primary">Done</devtools-button>
 *
 *   const el = document.querySelector<DevToolsButton>('devtools-button');
 *   el.addEventListener('click', () => ...);
 */
export class OkButton extends HTMLElement {
    static readonly observedAttributes = ['disabled','type'] as const;
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
    get variant(): 'default'|'primary' { return this.getAttribute('variant') === 'primary' ? 'primary' : 'default'; }
    set variant(value: 'default'|'primary') { this.setAttribute('variant', value); }

    private syncAttrs(): void {
        this.button.disabled = this.disabled || this.fieldsetDisabled;
        this.button.type = this.type;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-button')) {
    customElements.define('ok-button', OkButton);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-button': OkButton
    }
}