import { InterceptedRequest } from '@/lib/interceptor/types';
import './request-row.module.css';

type RequestRowAttributes = InterceptedRequest & Partial<Pick<HTMLDivElement, 'id'|'onclick'>>;

const template = `
    <div class="row"</div>
`;

export default function createRequestRow({
    id = '', // this should match the intercepted request requestId
    onclick = null,
    ...interceptedRequestData
}: RequestRowAttributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    root.dataset.id = id;
    root.onclick = onclick;

    const method = document.createElement('span');
    method.classList.add('method');
    method.textContent = interceptedRequestData.method;

    const status = document.createElement('span');
    status.classList.add('status');
    status.textContent = interceptedRequestData.statusCode.toString();

    const url = document.createElement('span');
    url.classList.add('url');
    url.textContent = interceptedRequestData.url;

    root.append(method, status, url);

    return root;
}