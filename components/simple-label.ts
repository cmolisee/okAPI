import './simple-label.module.css';

type Attributes = Partial<Pick<HTMLSpanElement, 'textContent'>>;

export default function createSimpleLabel({
    textContent = ''
}: Attributes) {
    const span = document.createElement('span');
    span.textContent = textContent;
    return span;
}