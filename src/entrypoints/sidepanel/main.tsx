import './style.css';
import { HashRouter, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import Options from './options';
import Sidepanel from './sidepanel';
import MockExplorerStore from '@/lib/mockExplorerStore';

render(() => {
    return (
        <MockExplorerStore>
            <HashRouter>
                <Route path={'/'} component={Sidepanel} />
                <Route path={'/options'} component={Options} />
            </HashRouter>
        </MockExplorerStore>
    )
}, document.getElementById('root')!);
