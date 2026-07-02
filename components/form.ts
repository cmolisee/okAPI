import { MockEndpoint } from '@/utils/db';
import createTextInput from './text-input';
import createTextarea from './textarea';
import './form.module.css';
import createActionButton from './action-button';

type FormAttributes = MockEndpoint & { submit: (event: SubmitEvent) => Promise<void> };

const template = `
    <form novalidate></form>
`;

export default function createForm({
    submit,
    ...mockEndpointData
}: FormAttributes): HTMLFormElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(template, 'text/html');
    const root = doc.body.firstElementChild as HTMLFormElement;

    root.dataset.id = mockEndpointData.id!.toString();

    root.append(createTextInput({
        htmlFor: 'url',
        textContent: 'URL Pattern',
        id: 'url',
        name: 'url',
        value: mockEndpointData.url,
    }));

    // --- request section ---
    const requestDetails = document.createElement('details');
    const requestSummary = document.createElement('summary');
    requestSummary.ariaExpanded = 'false';
    requestSummary.textContent = 'Request';

    requestDetails.appendChild(requestSummary);
    requestDetails.append(createTextarea({
        htmlFor: 'request-headers',
        labelContent: 'Request Headers',
        textareaContent: tryPrettyPrint(JSON.stringify(mockEndpointData.request?.headers)),
        id: 'request-headers',
        name: 'request-headers',
    }))

    requestDetails.append(createTextarea({
        htmlFor: 'request-params',
        labelContent: 'Request Params',
        textareaContent: tryPrettyPrint(JSON.stringify(mockEndpointData.request?.queryParams)),
        id: 'request-params',
        name: 'request-params',
    }))

    requestDetails.append(createTextarea({
        htmlFor: 'request-body',
        labelContent: 'Request Body',
        textareaContent: tryPrettyPrint(JSON.stringify(mockEndpointData.request?.body)),
        id: 'request-body',
        name: 'request-body',
    }))

    // --- response section ---
    const responseDetails = document.createElement('details');
    responseDetails.open = true;

    const responseSummary = document.createElement('summary');
    responseSummary.ariaExpanded = 'true';
    responseSummary.textContent = 'Response';

    responseDetails.appendChild(responseSummary);
    responseDetails.append(createTextInput({
        htmlFor: 'response-status',
        textContent: 'Response Status',
        id: 'response-status',
        name: 'response-status',
        value: mockEndpointData.response.status.toString(),
    }));

    responseDetails.append(createTextarea({
        htmlFor: 'response-headers',
        labelContent: 'response Headers',
        textareaContent: tryPrettyPrint(JSON.stringify(mockEndpointData.response?.headers)),
        id: 'response-headers',
        name: 'response-headers',
    }));

    responseDetails.append(createTextarea({
        htmlFor: 'response-body',
        labelContent: 'response Body',
        textareaContent: tryPrettyPrint(JSON.stringify(mockEndpointData.response?.body)),
        id: 'response-body',
        name: 'response-body',
    }));

    responseDetails.append(createActionButton({
        id: 'submit',
        textContent: 'Save',
        onclick: () => submit
    }));

    return root;
}