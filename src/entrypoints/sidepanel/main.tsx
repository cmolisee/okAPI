import './style.css';
import { HashRouter, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import MockExplorerStore, { useMockExplorer } from '@/lib/mockExplorerStore';
import ContextMenuProvider from '@/lib/contextMenuProvider';
import Root from '@/components/layouts/root';
import Workspace from '@/components/views/workspace';
import Explorer from '@/components/views/explorer';
import Save from '@/components/views/save';
import Options from '@/components/views/options';
import NotificationProvider from '@/lib/notificationProvider';
import { useWorkspace } from '@/lib/workspaceStore';
import { trackDeep } from '@solid-primitives/deep';

render(() => {
    const { workspaceData } = useWorkspace();
    const { mockExplorerTree } = useMockExplorer();

    // const workspaceCleanup = () => {
    //     if (Object.keys(workspaceData)) {
    //         const workspace = trackStore(workspaceData);
    //         workspaceDataStorage.setValue(deepCopyAndUnproxy(workspace))
    //             .catch((e: any) => console.debug("Error saving workspace: ", e));
    //     }
    // };

    // const ExplorerCleanup = () => {
        
    //     if (Object.keys(mockExplorerTree)) {
    //         const explorer = trackStore(mockExplorerTree);
    //         mockExplorerDataStorage.setValue(deepCopyAndUnproxy(explorer))
    //             .catch((e: any) => console.debug("Error saving explorer: ", e));
    //     }
    // }

    // const handleCleanup = () => {
    //     const data = trackDeep({
    //         workspace: workspaceData,
    //         explorer: mockExplorerTree,
    //     });

    //     if (Object.keys(data.explorer).length) {
    //         console.log('cleanup explorer', data.explorer);
    //         mockExplorerDataStorage.setValue(deepCopyAndUnproxy(data.explorer));
    //     }

    //     if (Object.keys(data.workspace).length) {
    //         console.log('cleanup workspace', data.workspace);
    //         mockExplorerDataStorage.setValue(deepCopyAndUnproxy(data.workspace));
    //     }
    // }

    // onMount(() => {
    //     window.addEventListener('beforeunload', handleCleanup);
    //     document.addEventListener('visibilitychange', handleCleanup);

    //     onCleanup(() => {
    //         window.removeEventListener('beforeunload', handleCleanup);
    //         document.removeEventListener('visibilitychange', handleCleanup);
    //     })
    // });
    
    return (
        <MockExplorerStore>
            <ContextMenuProvider>
                <NotificationProvider>
                    <HashRouter root={Root}>
                        <Route path={'/'} component={Workspace} />
                        <Route path={'/options'} component={Options} />
                        <Route path={'/save'} component={Save} />
                        <Route path={'/explorer'} component={Explorer} />
                    </HashRouter>
                </NotificationProvider>
            </ContextMenuProvider>
            <button on:click={() => mockExplorerDataStorage.removeValue()}>removeValue</button>
        </MockExplorerStore>
    )
}, document.getElementById('root')!);
