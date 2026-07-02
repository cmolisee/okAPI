import './text-input.module.css';

type Attributes = Partial<Pick<HTMLLabelElement, 'htmlFor'|'textContent'>> & Partial<Pick<HTMLInputElement,'id'|'name'|'placeholder'|'value'>> & { classList?: Set<string>};

const template = `
    <div class="input-container">
        <label></label>
        <input type="text">
        <span class="error-message"></span>
    </div>
`;

export default function createTextInput({
    htmlFor = '',
    textContent = '',
    id = '',
    name = '',
    placeholder = '',
    value = '',
}: Attributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    const label = root.querySelector('label') as HTMLLabelElement;
    const input = root.querySelector('input') as HTMLInputElement;

    label.htmlFor = htmlFor;
    label.textContent = textContent;

    input.id = id;
    input.name = name;
    input.placeholder = placeholder;
    input.value = value;
    
    return root;
}