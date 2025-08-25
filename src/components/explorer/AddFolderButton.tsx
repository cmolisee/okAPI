import { useMenuContext } from "@/lib/contextMenuProvider";
import { useExplorer } from "@/lib/explorerStore";
import { pathBuilder } from "@/utils/utils";
import { VsAdd } from "solid-icons/vs"
import { twMerge } from "tailwind-merge";

function AddFolder(props: any) {
    const { addMock, updateExpandedState } = useExplorer();
    const { handleCloseContextMenu } = useMenuContext();
    const nestedStyles = `${(props.nestLevel) * 32}px`;
    

    const handleAddFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newId = getUniqueId();
        addMock(
            props.parentId, 
            {
                name: `newFolder_${newId}`,
                description: '',
                method: 'GET',
                uri: '',
                body: '',
                params: {},
                children: {},
                metadata: {
                    id: newId,
                    type: 'folder',
                    isEditing: false,
                    isEnabled: false,
                    isExpanded: false,
                    path: pathBuilder(props.path, `newFolder_${newId}`),
                    hasEdits: false,

                }
            });
        handleCloseContextMenu();
        updateExpandedState(newId, true);
        return;
    }

    return (
        // <div class={twMerge('flex items-center italic pl-[12px] py-2 cursor-pointer text-sm font-thin', props.leftBorder ? 'border-l-2' : '')}
        //     style={{ "margin-left": nestedStyles }}
        //     on:click={handleAddFolder}>
                
            
        // </div>
        <button class={twMerge('flex items-center italic pl-[12px] py-2 cursor-pointer text-sm font-thin', props.leftBorder ? 'border-l-2' : '')} 
            on:click={handleAddFolder}>
            Add Folder <VsAdd size={16} color="currentColor" class="vs text-okPurple-500 dark:text-okGreen-500 mx-2 cursor-pointer" />
        </button>
    );
}

export default AddFolder;