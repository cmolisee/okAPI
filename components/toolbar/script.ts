import css from './styles.css?raw';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Toolbar web component.
 * 
 * Usage:
 *   <ok-toolbar>
 *     <ok-icon-button label="Clear" tab><svg>...</svg></ok-icon-button>
 *     <ok-icon-button label="Filter" tab><svg>...</svg></ok-icon-button>
 *     <hr />
 *     <span>Showing 12 items</span>
 *     <hr />
 *     <ok-text-input placeholder="Filter"></ok-text-input>
 *   </ok-toolbar>
 */
export class OkToolbar extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
        
        this.addEventListener('click', (event: Event) => {
            const target = (event.target as Element | null)?.closest?.('[tab]');
            if (!target || !this.contains(target)) return;
            for (const elem of this.querySelectorAll('[tab]')) {
                if ('toggled' in elem) {
                    (elem as Element & { toggled: boolean }).toggled = elem === target;
                }
            }

            this.dispatchEvent(new CustomEvent('tabchange', {
                detail: { tab: target },
                bubbles: true,
            }));
        });
    }
}

// do not redefine if already defined
if (!customElements.get('ok-toolbar')) {
    customElements.define('ok-toolbar', OkToolbar);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-toolbar': OkToolbar
    }
}