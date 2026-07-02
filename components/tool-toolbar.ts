import './tool-toolbar.module.css';

const template = `
  <div class="tool-toolbar" role="toolbar">
    <div class="tool-toolbar-contents">
      <div class="tool-toolbar-tools" role="presentation">
      </div>
    </div>
  </div>
`;

export default function createToolsToolbar(): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    return root.querySelector('.tool-toolbar-tools')!;
}