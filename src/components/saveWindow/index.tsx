import { useExplorer } from "@/lib/explorerStore";
import { useWorkspace } from "@/lib/workspaceStore";
import Toggle from "../toggle";

function SaveWindow(props: any) {
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    const { explorerTree, explorerTreeTransaction } = useExplorer();
    const [ mocksToSave, setMocksToSave ] = createSignal<{ checked: Boolean, mock: ApiMock }[]>([]);

    const handleSave = () => {};

    const handleCancel = () => {
        console.log('close window...');
        props.notificationCallback(false);
    };

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
                {/* show unsaved mocks with checkbox that are checked */}
                <For each={mocksToSave()}>
                    {(item) => (
                        <div class="flex gap-4 p-2">
                            <Toggle toggleSize="small" 
                                checked={item.checked} 
                                changeCallback={() => handleToggle(item)} />
                            <div class="flex gap-2">
                                <span>{item.mock.method}</span>
                                <span>{item.mock?.uri ?? 'untitled'}</span>
                            </div>
                        </div>
                    )}
                </For>
            </div>


            {/* render the explorer here. for some reason its not rendering it... */}

            
            <div class="flex flex-row justify-end ">
                <button class="mx-4 cursor-pointer" on:click={handleCancel}>Cancel</button>
                <button class="mx-4 cursor-pointer" on:click={handleSave}>Save</button>
            </div>
        </div>
    )
}

export default SaveWindow;