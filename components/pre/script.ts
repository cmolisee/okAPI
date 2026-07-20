import css from './styles.css?raw';
import html from './index.html?raw';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Pre web component.
 * 
 * Usage (static content, authored directly):
 *   <ok-pre>{"ok": true}</ok-pre>
 *
 * Usage (dynamic content):
 *   const el = document.querySelector<OkPre>('ok-pre');
 *   el.value = JSON.stringify(result, null, 2);
 */
export class OkPre extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));
    }

    get value(): string {
        return this.textContent ?? ''
    }

    set value(value: string) {
        this.textContent = value
    }

    get wrap(): boolean {
        return this.hasAttribute('wrap');
    }

    set wrap(value: boolean) {
        this.toggleAttribute('wrap');
    }
}

// do not redefine if already defined
if (!customElements.get('ok-pre')) {
    customElements.define('ok-pre', OkPre);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-pre': OkPre
    }
}