import css from './styles.css?inline';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Row web component.
 * 
 * Usage:
 *   <ok-row>
 *     ...
 *   </ok-row>
 * 
 *  const e = document.querySelector('ok-row');
 *  e.addEventListener('select', (e: Event) => ...);
 */
export class OkRow extends HTMLElement {
    static readonly observedAttributes = ['ok'] as const;

    private readonly row: HTMLElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));

        this.row = document.querySelector('div') as HTMLElement;
        this.addEventListener('click', this.handleClick);
    }

    attributeChangedCallback() {
        this.syncAttrs();
    }

    handleClick(event: Event) {
        this.classList.toggle('selected');

        const selectEvent = new CustomEvent('select', {
            bubbles: true,
            composed: true, // escape the shadow DOM
            detail: {
                isSelected: this.classList.contains('selected'),
                element: this,
            }
        });

        this.dispatchEvent(selectEvent);
    }

    disconnectedCallback() {
        this.removeEventListener('click', this.handleClick);
    }

    private syncAttrs(): void {
        this.row.id = this.id;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-row')) {
    customElements.define('ok-row', OkRow);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-row': OkRow
    }
}