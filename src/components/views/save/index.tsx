import { useMockApiTree } from "@/lib/mockApiTreeProvider";
import { useWorkspace } from "@/lib/workspaceStore";
import { useNotifications } from "@/lib/notificationProvider";
import { useNavigate } from "@solidjs/router";
import Checkbox from "@/components/inputs/checkbox";
import SaveExplorer from "@/components/explorer/SaveExplorer";
import { pathBuilder } from "@/utils/utils";

function Save (props:any) {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    const { forEach } = useMockApiTree();
    const [ saveToNode, setSaveToNode ] = createSignal<MockApiNode|EmptyObject>({});
    const { setShowNotification, setNotificationConfig} = useNotifications();
    const [ mocks, setMocks ] = createSignal<{ checked: Boolean, mock: MockApiNode }[]>([]);

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
            produce((draft: ObjectArray<MockApiNode>) => {
                // workspace is a 1D-array of mocks
                for (const mock of Object.values(draft)) {
                    if (mocksToSave.some((m) => m.id === mock.id)) {
                        mock.data.path = pathBuilder(saveToNode().data.path, mock.name);
                    }
                }
            })
        );

        // update explorer tree
        // const treeCopy = JSON.parse(JSON.stringify(tree));

        // if node === saveToNode().id
            // append the children

        forEach((node) => {
            if (node.id !== saveToNode().id) {
                return true; // continue until it is found
            }

            mocksToSave.forEach((m) => {
                node.children[m.id] = JSON.parse(JSON.stringify(m));
            });
            return false; // stop after found
        });

        // treeTransaction(
        //     produce((draft: MockApiNode) => {
        //         // figure out how to use draft here so it actually updates
        //         // /root needs to be removed from the autocomplete paths elements
        //         // autocoplete needs to update based on current value
        //         const parentNode = find(saveToNode().id);

        //         if (!parentNode) {
        //             return;
        //         }

        //         mocksToSave.forEach((m) => {
        //             parentNode.children[m.id] = JSON.parse(JSON.stringify(m));
        //         });
        //     })
        // );

        setShowNotification(false);
        navigate('/', { replace: true });
    }

    const handleToggle = (item: { checked: Boolean, mock: MockApiNode }) => {
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
                .filter((m) => !m?.data?.path)
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