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
 *   <ok-form>
 *     <label>Name</label>
 *     <ok-text-input name="name" required></ok-text-input>
 *
 *     <ok-checkbox name="enabled">Enable feature</ok-checkbox>
 *
 *     <ok-button slot="actions">Cancel</ok-button>
 *     <ok-button slot="actions" type="submit" variant="primary">Save</ok-button>
 *   </ok-form>
 *
 *   const form = document.querySelector<OkForm>('ok-form');
 *   form.addEventListener('submit', (e) => console.log(e.detail.data));
 */
export class OkForm extends HTMLElement {
    static readonly observedAttributes = ['disabled'] as const;
    static formAssociated = true;

    private readonly form: HTMLFormElement;
    private readonly fieldset: HTMLFieldSetElement;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.adoptedStyleSheets = [styleSheet];
        shadow.appendChild(template.content.cloneNode(true));

        this.form = shadow.querySelector('form') as HTMLFormElement;
        this.fieldset = shadow.querySelector('fieldset') as HTMLFieldSetElement;

        this.form.addEventListener('submit', (event: Event) => {
            event.preventDefault();
            this.dispatchEvent(
                new CustomEvent('submit', {
                    detail: { data: Object.fromEntries(new FormData(this.form)) },
                    bubbles: true,
                    cancelable: true,
                })
            );
        });

        const actionsRow = shadow.querySelector('.actions') as HTMLElement;
        const actionsSlot = shadow.querySelector('slot[name="actions"]') as HTMLSlotElement;
        const syncActionsVisibility = (): void => {
            actionsRow.hidden = actionsSlot.assignedNodes({ flatten: true }).length === 0;
        };
        actionsSlot.addEventListener('slotchange', syncActionsVisibility);
        syncActionsVisibility();

        this.syncDisabled();
    }

    attributeChangedCallback(): void {
        this.syncDisabled();
    }

    get disabled(): boolean { return this.hasAttribute('disabled'); }
    set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
    
    requestSubmit(): void {
        this.form.requestSubmit();
    }

    reset(): void {
        this.form.reset();
    }

    private syncDisabled(): void {
        this.fieldset.disabled = this.disabled;
    }
}

// do not redefine if already defined
if (!customElements.get('ok-form')) {
    customElements.define('ok-form', OkForm);
}

declare global {
    interface HTMLElementTagNameMap {
        'ok-form': OkForm
    }
}