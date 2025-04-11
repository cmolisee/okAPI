import './style.css';
import { HashRouter, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import Options from './options';
import Sidepanel from './sidepanel';
import MockExplorerStore from '@/lib/mockExplorerStore';
import Save from './save';
import SaveAll from './saveAll';
import ContextMenuProvider from '@/lib/contextMenuProvider';

render(() => {
    return (
        <MockExplorerStore>
            <ContextMenuProvider>
                <HashRouter >
                    <Route path={'/'} component={Sidepanel} />
                    <Route path={'/options'} component={Options} />
                    <Route path={'/save'} component={Save} />
                    <Route path={'/saveAll'} component={SaveAll} />
                </HashRouter>
            </ContextMenuProvider>
        </MockExplorerStore>
    )
}, document.getElementById('root')!);
