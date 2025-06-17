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
    const [ saveToNode, setSaveToNode ] = createSignal<OkMock|EmptyObject>({});
    const { setShowNotification, setNotificationConfig} = useNotifications();
    const [ mocks, setMocks ] = createSignal<{ checked: Boolean, mock: OkMock }[]>([]);

    const saveNotification = () => {
        setNotificationConfig({
            continueCallback: handleSave,
            content: (
                <div>
                    Are you sure you want to save these mocks?
                    <ul class="list-disc list-inside">
                        <For each={mocks().filter((m) => m.checked)}>
                            {(item) => (
                                <li>{item.mock.name}</li>
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
        const mocksToSave = mocks()
            .filter((m) => m.checked)
            .map((m) => m.mock);
        
        // update the workspace
        workspaceDataTransaction(
            produce((draft: ObjectArray<OkMock>) => {
                // workspace is a 1D-array of mocks
                for (const mock of Object.values(draft)) {
                    if (mocksToSave.some((m) => m.metadata.id === mock.metadata.id)) {
                        mock.metadata.path = `${saveToNode().metadata.path}/${mock.name}`;
                    }
                }
            })
        );

        // update explorer tree
        const treeCopy = JSON.parse(JSON.stringify(explorerTree));

        explorerTreeTransaction(
            produce((draft: ObjectArray<OkMock>) => {
                const parentNode = findMockById(treeCopy, saveToNode().metadata.id);

                if (!parentNode) {
                    return;
                }

                mocksToSave.forEach((m) => {
                    parentNode.children[m.metadata.id] = JSON.parse(JSON.stringify(m));
                });
            })
        );
    }

    const handleToggle = (item: { checked: Boolean, mock: OkMock }) => {
        setMocks((prev) => {
            return prev.map((m) => {
                if (JSON.stringify(m.mock).replace(/\s+/g, '') === JSON.stringify(item.mock).replace(/\s+/g, '')) {
                    m.checked = !m.checked;
                }
                return m;
            });
        });
    };

    onMount(() => {
        setMocks(
            Object.values(workspaceData)
                .filter((m) => !m?.metadata?.path)
                .map((m)  => ({ checked: true, mock: m}))
        )
    });

    return (
        <div class="flex flex-col p-2">
            <div>
                <For each={mocks()}>
                    {(item) => (
                        <div class="flex gap-4 p-2">
                            {/* create a checkbox component here instead of toggle slider */}
                            <Checkbox checked={item.checked} color={'#aaa'} changeCallback={() => handleToggle(item)} />
                            <Show when={item.mock?.name}>
                                <div class="flex gap-2">
                                    <span class='text-ellipsis'>{item.mock.name}</span>
                                </div>
                            </Show>
                        </div>
                    )}
                </For>
            </div>
            <SaveExplorer saveToNode={saveToNode} setSaveToNode={setSaveToNode} />
            <div class="flex flex-row justify-end ">
                <button class="mx-4 cursor-pointer" on:click={handleCancel}>Cancel</button>
                <button class="mx-4 cursor-pointer" on:click={saveNotification}>Save</button>
            </div>
        </div>
    )
}

export default Save;