import { useExplorer } from "@/lib/explorerStore";
import { useWorkspace } from "@/lib/workspaceStore";
import { notificationContext, useNotifications } from "@/lib/notificationProvider";
import { useNavigate } from "@solidjs/router";
import Checkbox from "@/components/inputs/checkbox";
import SaveExplorer from "@/components/explorer/SaveExplorer";
import { cancelCallback } from "solid-js";

function Save (props:any) {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    const { explorerTree, explorerTreeTransaction, findNodeByPath } = useExplorer();
    const [ savePath, setSavePath ] = createSignal('');
    const { setShowNotification, setNotificationConfig} = useNotifications();
    const [ mocksToSave, setMocksToSave ] = createSignal<{ checked: Boolean, mock: ApiMock }[]>([]);

    const saveNotification = () => {
        setNotificationConfig({
            cancelText: 'No',
            continueText: 'Yes',
            cancelCallback: () => setShowNotification(false),
            continueCallback: handleSave,
            notificationContext: (
                <div>
                    Are you sure you want to save these mocks?
                    <ul>
                        <For each={mocksToSave().filter((m) => m.checked)}>
                            {(item) => (
                                <li>{`${item.mock.method} ${item.mock.uri}`}</li>
                            )}
                        </For>
                    </ul>
                </div>
            ),
        });

        setShowNotification(true);
    };

    const handleCancel = () => {
        navigate('/', { replace: true });
    };

    const handleSave = () => {
        const mocks = mocksToSave()
            .filter((m) => m.checked)
            .map((m) => m.mock);
        
        const updatedWorkspaceData = workspaceData.data.map((wsMock) => {
            if (mocks.some((m) => m.id === wsMock.id)) {
                wsMock.dataPath = `${savePath()}/${wsMock.id}`;
            }

            return wsMock;
        });

        const treeCopy = JSON.parse(JSON.stringify(explorerTree));
        const node = findNodeByPath(treeCopy, savePath());

        if (node) {
            if (!node?.children) {
                node.children = [];
            }

            node.children.push(...mocks.map((m) => ({
                name: `${m.method}_${m.uri}`,
                path: `${savePath()}/${m.id}`,
                type: 'mock',
                mock: m,
            } as ApiMockNode)));
        }

        workspaceDataTransaction({ data: updatedWorkspaceData });
        explorerTreeTransaction(treeCopy);
    }

    const handleToggle = (item: { checked: Boolean, mock: ApiMock }) => {
        setMocksToSave((prev) => {
            return prev.map((m) => {
                if (JSON.stringify(m.mock).replace(/\s+/g, '') === JSON.stringify(item.mock).replace(/\s+/g, '')) {
                    m.checked = !m.checked;
                }
                return m;
            });
        });
    };

    onMount(() => {
        setMocksToSave(workspaceData.data.filter((d) => !d.dataPath).map((f) => ({ checked: true, mock: f})))
    });

    return (
        <div class="flex flex-col p-2">
            <div>
                <For each={mocksToSave()}>
                    {(item) => (
                        <div class="flex gap-4 p-2">
                            {/* create a checkbox component here instead of toggle slider */}
                            <Checkbox checked={item.checked} color={'#aaa'} changeCallback={() => handleToggle(item)} />
                            <div class="flex gap-2">
                                <span>{item.mock.method}</span>
                                <span>{item.mock?.uri ?? 'untitled'}</span>
                            </div>
                        </div>
                    )}
                </For>
            </div>
            <SaveExplorer savePath={savePath} setSavePath={setSavePath} />
            <div class="flex flex-row justify-end ">
                <button class="mx-4 cursor-pointer" on:click={handleCancel}>Cancel</button>
                <button class="mx-4 cursor-pointer" on:click={saveNotification}>Save</button>
            </div>
        </div>
    )
}

export default Save;