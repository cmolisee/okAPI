import './style.css';
import { HashRouter, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import ContextMenuProvider from '@/lib/contextMenuProvider';
import Root from '@/components/layouts/root';
import Workspace from '@/components/views/workspace';
import Explorer from '@/components/views/explorer';
import Save from '@/components/views/save';
import Options from '@/components/views/options';
import NotificationProvider from '@/lib/notificationProvider';
import ExplorerStore from '@/lib/explorerStore';
import NoNavigation from '@/components/layouts/noNavigation';

render(() => {    
    return (
       
            <ExplorerStore>
                <ContextMenuProvider>
                    <NotificationProvider>
                        <HashRouter >
                            <Route component={Root}>
                                <Route path={'/'} component={Workspace} />
                                <Route path={'/options'} component={Options} />
                                <Route path={'/explorer'} component={Explorer} />
                            </Route>
                            <Route component={NoNavigation}>
                                <Route path={'/save'} component={Save} />
                            </Route>
                        </HashRouter>
                    </NotificationProvider>
                </ContextMenuProvider>
            </ExplorerStore>
    )
}, document.getElementById('root')!);
