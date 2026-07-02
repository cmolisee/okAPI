import { InterceptedRequest } from '@/lib/interceptor/types';
import createReadOnlyTextArea from './read-only-textarea';
import createActionButton from './action-button';
import './read-only-form.module.css';

type ReadOnlyAttributes = Partial<Pick<HTMLButtonElement, 'onclick'>> & InterceptedRequest;

const template = `
    <div class="form read-only">
        <div id="meta"></div>
    </div>
`;

export default function createReadOnlyForm({
    onclick = null,
    ...interceptedRequestData
}: ReadOnlyAttributes): HTMLDivElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLDivElement;

    const meta = root.querySelector('#meta') as HTMLDivElement;
    meta.dataset.meta = JSON.stringify(interceptedRequestData);

    root.append(createReadOnlyTextArea({
        classList: new Set('status'),
        textContent: interceptedRequestData.statusCode.toString(),
    }));
    root.append(createReadOnlyTextArea({
        classList: new Set('url'),
        textContent: interceptedRequestData.url,
    }));
    root.append(createReadOnlyTextArea({
        classList: new Set('request-headers'),
        textContent: JSON.stringify(interceptedRequestData.requestHeaders, null, 2)
    }));
    root.append(createReadOnlyTextArea({
        classList: new Set('request-body'),
        textContent: JSON.stringify(interceptedRequestData.requestBody, null, 2)
    }));
    root.append(createReadOnlyTextArea({
        classList: new Set('response-headers'),
        textContent: JSON.stringify(interceptedRequestData.responseHeaders, null, 2)
    }));
    root.append(createReadOnlyTextArea({
        classList: new Set('response-body'),
        textContent: JSON.stringify(interceptedRequestData.responseBody, null, 2)
    }));
    root.append(createActionButton({
        id: 'create-mock',
        textContent: 'Create Mock',
        onclick: onclick
    }));

    return root;
}