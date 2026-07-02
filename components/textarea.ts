import './textarea.module.css';

type Attributes =
  & { textareaContent?: string }
  & Partial<HTMLTextAreaElement>
  & { labelContent?: string }
  & Pick<HTMLLabelElement, 'htmlFor'>;

const template = `
  <div class="input-container">
    <label></label>
    <textarea aria-required="false" aria-invalid="false"></textarea>
  </div>
`;

export default function createTextarea(attributes: Attributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    const label = root.querySelector('label') as HTMLLabelElement;
    const textarea = root.querySelector('textarea') as HTMLTextAreaElement;

    label.htmlFor = attributes.htmlFor;
    label.textContent = attributes.labelContent ?? '';

    textarea.id = attributes.id!;
    textarea.name = attributes.name!;
    textarea.rows = attributes?.rows ?? 5;
    textarea.value = attributes.textareaContent ?? '';
    
    return root;
}