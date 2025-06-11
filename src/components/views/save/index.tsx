import { useExplorer } from "@/lib/explorerStore";
import { useWorkspace } from "@/lib/workspaceStore";
import { useNotifications } from "@/lib/notificationProvider";
import { useNavigate } from "@solidjs/router";
import Checkbox from "@/components/inputs/checkbox";
import SaveExplorer from "@/components/explorer/SaveExplorer";

function Save (props:any) {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    const { explorerTree, explorerTreeTransaction, findMockById } = useExplorer();
    const [ savePath, setSavePath ] = createSignal('');
    const { setShowNotification, setNotificationConfig} = useNotifications();
    const [ mocksToSave, setMocksToSave ] = createSignal<{ checked: Boolean, mock: OkMock }[]>([]);

    const saveNotification = () => {
        setNotificationConfig({
            continueCallback: handleSave,
            content: (
                <div>
                    Are you sure you want to save these mocks?
                    <ul class="list-disc list-inside">
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
        // get all mocks that are checked for save
        const mocks = mocksToSave()
            .filter((m) => m.checked)
            .map((m) => m.mock);
        
        // update the workspace
        workspaceDataTransaction(
            produce((draft: ObjectArray<OkMock>) => {
                for (const mock of Object.values(draft)) {
                    if (mocks.some((m) => m.metadata.id === mock.metadata.id)) {
                        mock.metadata.path = `${savePath()}/${mock.metadata.id}`;
                    }
                }
            })
        );

        // update explorer tree
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));

        explorerTreeTransaction(
            produce((draft: ObjectArray<OkMock>) => {
                const targetNode = findMockById(treeCopy, savePath().slice(savePath().lastIndexOf('/') + 1));

                mocks.forEach((m) => {
                    targetNode.children[m.metadata.id] = JSON.parse(JSON.stringify(m));
                });
            })
        );
    }

    const handleToggle = (item: { checked: Boolean, mock: OkMock }) => {
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
        setMocksToSave(
            Object.values(workspaceData)
                .filter((d) => !d.metadata.path)
                .map((f)  => ({ checked: true, mock: f}))
        )
    });

    return (
        <div class="flex flex-col p-2">
            <div>
                <For each={mocksToSave()}>
                    {(item) => (
                        <div class="flex gap-4 p-2">
                            {/* create a checkbox component here instead of toggle slider */}
                            <Checkbox checked={item.checked} color={'#aaa'} changeCallback={() => handleToggle(item)} />
                            <Show when={item.mock?.name}>
                                <div class="flex gap-2">
                                    <span>{item.mock.name}</span>
                                </div>
                            </Show>
                            <Show when={!item.mock?.name}>
                                <div class="flex gap-2">
                                    <span>{item.mock.method}</span>
                                    <span>{item.mock?.uri ?? 'untitled'}</span>
                                </div>
                            </Show>
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