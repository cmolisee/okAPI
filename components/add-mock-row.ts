import './add-mock-row.module.css';
import createIconAddButton from './icon-add-button';
import createTextInput from './text-input';

const template = `
    <div class="row">
        <form id="add-mock"></form>
    </div>
`;

export default function createAddMockRow(): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    const form = root.querySelector('form') as HTMLElement;

    form.append(createIconAddButton({ type: 'submit' }));
    form.append(createTextInput({
        htmlFor: 'pattern',
        textContent: 'Add mock via URL or pattern.',
        id: 'add-mock-url-pattern',
        name: 'pattern',
        placeholder: 'URL or Pattern',
    }));

    return root;
}