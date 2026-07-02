import { MockEndpoint } from '@/utils/db';
import './mock-row.module.css';

type MockRowAttributes = Omit<MockEndpoint, 'id'> & Partial<Pick<HTMLDivElement, 'id'|'onclick'>>;

const template = `
    <div class="row">
        <form id="add-mock"></form>
    </div>
`;

export default function createMockRow({
    id = '',
    onclick = null,
    ...mockEndpointData
}: MockRowAttributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    root.dataset.id = id;
    root.dataset.listOrder = mockEndpointData.listOrder;
    root.onclick = onclick;

    const method = document.createElement('span');
    method.classList.add('method');
    method.textContent = mockEndpointData.method;

    const status = document.createElement('span');
    status.classList.add('status');
    status.textContent = mockEndpointData.response.status.toString();

    const url = document.createElement('span');
    url.classList.add('pattern');
    url.textContent = mockEndpointData.url;

    root.append(method, status, url);

    return root;
}