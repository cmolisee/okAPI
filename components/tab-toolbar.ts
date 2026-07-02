import './tab-toolbar.module.css';

const template = `
    <div class="tab-toolbar" role="navigation" aria-label="Side panel toolbar tab navigation for extension">
      <div classs="tab-toolbar-contents">
        <div class="tab-toolbar-tabs" role="tablist">
        </div>
      </div>
    </div>
`;

export default function createTabToolbar(): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    return root.querySelector('.tab-toolbar-tabs')!;
}
