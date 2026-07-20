import css from './styles.css?raw';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Tab Button web component.
 * 
 * Usage:
 *   <ok-toolbar>
 *     <ok-tab-button tab toggled>Elements</ok-tab-button>
 *     <ok-tab-button tab>Console</ok-tab-button>
 *     <ok-tab-button tab>Sources</ok-tab-button>
 *   </ok-toolbar>
 */
export class OkTabButton extends HTMLElement {
    static readonly observedAttributes = ['disabled','type'] as const;
    
    private readonly button: HTMLButtonElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        this.button = shadow.querySelector('button')!;
        this.syncAttrs();
    }

    attributeChangedCallback(): void {
        this.syncAttrs();
    }

    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    get toggled(): boolean { return this.hasAttribute('toggled'); }
    set variant(value: boolean) { this.toggleAttribute('toggled', value); }

    private syncAttrs(): void {
        this.button.disabled = this.disabled;
        if (this.hasAttribute('toggled') || this.button.hasAttribute('aria-pressed')) {
            this.button.setAttribute('aria-pressed', String(this.toggled));
        }
    }
}

// do not redefine if already defined
if (!customElements.get('ok-tab-button')) {
    customElements.define('ok-tab-button', OkTabButton);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-tab-button': OkTabButton
    }
}