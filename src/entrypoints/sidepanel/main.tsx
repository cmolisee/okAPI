import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import Sidepanel from './sidepanel';
import Options from './options';

import './style.css';

render(() => {
    return (
        <HashRouter>
            <Route path={'/'} component={Sidepanel} />
            <Route path={'/options'} component={Options} />
        </HashRouter>
    )
}, document.getElementById('root')!);
