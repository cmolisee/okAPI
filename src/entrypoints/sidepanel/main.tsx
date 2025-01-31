import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import './style.css';
import Sidepanel from './sidepanel';
import Options from './options';

render(() => {
    return (
        <HashRouter>
            <Route path={'/'} component={Sidepanel} />
            <Route path={'/options'} component={Options} />
        </HashRouter>
    )
}, document.getElementById('root')!);
