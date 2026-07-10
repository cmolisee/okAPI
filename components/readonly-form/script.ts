import css from './styles.css?inline';
import html from './index.html?raw';
import { OkButton } from '../button/script';

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Textarea web component.
 * 
 * Usage:
 *   <ok-readonly-form id="lookup">
 *     <label>Request URL</label>
 *     <ok-pre>https://example.com/api/user</ok-pre>
 *
 *     <label>Response</label>
 *     <ok-pre id="response">—</ok-pre>
 *
 *     <span slot="submit-label">Refresh</span>
 *   </ok-readonly-form>
 *
 *   const el = document.getElementById('lookup') as OkReadonlyForm;
 *   el.onSubmit = async () => {
 *     el.disabled = true;
 *     const res = await fetch(...);
 *     el.querySelector('#response').value = await res.text();
 *     el.disabled = false;
 *   };
 */
export class OkReadonlyForm extends HTMLElement {
    static readonly observedAttributes = ['disabled'] as const;
    
    onSubmit: (() => void) | null = null;

    private readonly button: OkButton;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));

        this.button = shadow.querySelector('ok-button') as OkButton;
        this.button.addEventListener('click', () => this.onSubmit?.());
        this.syncDisabled();
    }

    attributeChangedCallback(): void {
        this.syncDisabled();
    }

    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }

    private syncDisabled(): void {
        this.button.disabled = this.disabled;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-readonly-form')) {
    customElements.define('ok-readonly-form', OkReadonlyForm);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-readonly-form': OkReadonlyForm
    }
}