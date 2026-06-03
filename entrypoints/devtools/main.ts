import { logging } from "@/utils/shared";

browser.devtools.panels.create(
    'okAPI: API Mocking',
    '', // icon (optional)
    '/devtools-panel.html',
    (newPanel) => {
        newPanel.onShown.addListener((window) => {
            logging('devtools', 'pane mounted');
            globalThis.window.dispatchEvent(new Event('PANEL_MOUNTED'));
        });
    }
)