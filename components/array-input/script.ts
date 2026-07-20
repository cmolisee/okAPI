import css from './styles.css?raw';
import html from './index.html?raw';

export type KeyValue = {
	key: string;
	value: string;
};

const styleSheet = new CSSStyleSheet();
styleSheet.replaceSync(css);

const template = document.createElement('template');
template.innerHTML = html;

/**
 * Array web component.
 *
 * Usage (dynamic — rows created on demand):
 *   <ok-array-input field="ok-text-input" name="origins">
 *   </ok-array-input>
 *
 * Usage (declared initial rows, same reparenting idea as ok-select
 *  moving in <option> elements — write real field elements as children
 *  and they become the starting rows):
 *   <ok-array-input field="ok-key-value-input" name="headers">
 *     <ok-key-value-input key="X-Foo" value="bar"></ok-key-value-input>
 *   </ok-array-input>
 *
 *   const el = document.querySelector<OkArrayInput>('ok-array-input');
 *   el.value = ['https://a.com', 'https://b.com'];
 *   el.addEventListener('change', () => console.log(el.value));
 */
export class OkArrayInput extends HTMLElement {
	static readonly observedAttributes = ['disabled', 'name', 'field'] as const;
	static formAssociated = true;

	private readonly rowsContainer: HTMLElement;
	private readonly addButton: HTMLButtonElement;

	constructor() {
		super();
		const shadow = this.attachShadow({ mode: 'open' });
		shadow.adoptedStyleSheets = [styleSheet];
		shadow.appendChild(template.content.cloneNode(true));

		this.rowsContainer = shadow.querySelector('.rows') as HTMLElement;
		this.addButton = shadow.querySelector('.add') as HTMLButtonElement;
		this.addButton.addEventListener('click', () => this.addRow());
	}

	connectedCallback(): void {
		for (const child of Array.from(this.children)) {
			this.wrapAsRow(child);
		}
		this.syncDisabled();
	}

	attributeChangeCallback(name: string): void {
		if (name === 'name') this.syncRowNames();
		if (name === 'disabled') this.syncDisabled();
	}

	get field(): string { return this.getAttribute('field') ?? ''; }
	set field(value: string) { this.setAttribute('field', value); }
	get name(): string { return this.getAttribute('name') ?? ''; }
	set name(value: string) { this.setAttribute('name', value); }
	get disabled(): boolean { return this.hasAttribute('disabled'); }
	set disabled(value: boolean) { this.toggleAttribute('disabled', value); }
	get rows(): Array<Element> {
		return Array.from(
			this.rowsContainer.children,
			(row) => row.firstElementChild,
		).filter((field): field is Element => field !== null);
	}
	get value(): Array<unknown> {
		return this.rows.map(
			(field) => (field as unknown as { value?: unknown }).value,
		);
	}
	set value(values: Array<unknown>) {
		this.rowsContainer.replaceChildren();
		for (const item of values) {
			const field = this.createRow();
			if (field) (field as unknown as { value?: unknown }).value = item;
		}
		this.dispatchEvent(new Event('change', { bubbles: true }));
	}

	addRow(): Element | null {
		const field = this.createRow();
		if (field) {
			this.dispatchEvent(
				new CustomEvent('rowadd', {
					detail: { row: field },
					bubbles: true,
				}),
			);
			this.dispatchEvent(new Event('change', { bubbles: true }));
		}
		return field;
	}

	private createRow(): Element | null {
		if (!this.field) return null;
		const field = document.createElement(this.field);
		this.wrapAsRow(field);
		return field;
	}

	private wrapAsRow(field: Element): void {
		if (this.name) field.setAttribute('name', this.name);

		const row = document.createElement('div');
		row.className = 'row';

		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.className = 'remove';
		removeButton.textContent = '\u00d7';
		removeButton.setAttribute('aria-label', 'Remove');
		removeButton.disabled = this.disabled;
		removeButton.addEventListener('click', () => {
			row.remove();
			this.dispatchEvent(
				new CustomEvent('rowremove', {
					detail: { row: field },
					bubbles: true,
				}),
			);
			this.dispatchEvent(new Event('change', { bubbles: true }));
		});

		if ('disabled' in field) {
			(field as unknown as { disabled: boolean }).disabled =
				this.disabled;
		}

		row.append(field, removeButton);
		this.rowsContainer.appendChild(row);
	}

	private syncRowNames(): void {
		if (!this.name) return;
		for (const field of this.rows) {
			field.setAttribute('name', this.name);
		}
	}

	private syncDisabled(): void {
		this.addButton.disabled = this.disabled;
		for (const row of Array.from(this.rowsContainer.children)) {
			const field = row.firstElementChild as
				| (Element & { disabled?: boolean })
				| null;
			if (field && 'disabled' in field) field.disabled = this.disabled;
			const removeButton =
				row.lastElementChild as HTMLButtonElement | null;
			if (removeButton) removeButton.disabled = this.disabled;
		}
	}
}

// do not redefine if already defined
if (!customElements.get('ok-array-input')) {
	customElements.define('ok-array-input', OkArrayInput);
}

declare global {
	interface HTMLElementTagNameMap {
		'ok-array-input': OkArrayInput;
	}
}
