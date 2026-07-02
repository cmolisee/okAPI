import './read-only-textarea.module.css';

type Attributes = Partial<Pick<HTMLPreElement, 'textContent'>> & { classList: Set<string> };

export default function createReadOnlyTextArea({
    classList = new Set(),
    textContent = '',
}: Attributes): HTMLPreElement {
    const pre = document.createElement('pre');

    pre.classList.add(...classList);
    pre.textContent = textContent;

    return pre;
}