import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import './style.css';
import Popup from './popup';
import Options from './options';

// TODO: this is where provider's and such will wrap the core extension app
// TODO: update /options with an options page
render(() => {
    return (
        <HashRouter>
            <Route path={'/'} component={Popup} />
            <Route path={'/options'} component={Options} />
        </HashRouter>
    )
}, document.getElementById('root')!);
