browser.devtools.panels.create(
    'okAPI: API Mocking',
    '', // icon (optional)
    '/devtools-panel.html',
    (newPanel) => {
        newPanel.onShown.addListener((window) => {
            console.debug('[devtools] pane mounted');
             
        });

        // Optional: clean up resources when the pane is hidden
        newPanel.onHidden.addListener(() => {
        console.log('Devtools pane hidden.');
        });
    }
)