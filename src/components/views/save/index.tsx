import { useExplorer } from "@/lib/explorerStore";
import { useWorkspace } from "@/lib/workspaceStore";
import { useNotifications } from "@/lib/notificationProvider";
import { useNavigate } from "@solidjs/router";
import Explorer from "@/components/explorer/Explorer";
import Checkbox from "@/components/inputs/checkbox";
import Toggle from "@/components/inputs/toggle";

function Save (props:any) {
    const navigate = useNavigate();
    const { workspaceData, workspaceDataTransaction } = useWorkspace();
    const { explorerTree, explorerTreeTransaction } = useExplorer();
    const {} = useNotifications();
    const [ mocksToSave, setMocksToSave ] = createSignal<{ checked: Boolean, mock: ApiMock }[]>([]);

    const saveNotification = () => {

    };

    const handleCancel = () => {
        navigate('/', { replace: true });
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
            <Toggle />
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
            <Explorer />
            <div class="flex flex-row justify-end ">
                <button class="mx-4 cursor-pointer" on:click={handleCancel}>Cancel</button>
                <button class="mx-4 cursor-pointer" on:click={saveNotification}>Save</button>
            </div>
        </div>
    )
}

export default Save;