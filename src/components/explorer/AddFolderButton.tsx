import { useMenuContext } from "@/lib/contextMenuProvider";
import { useMockApiTree } from "@/lib/mockApiTreeProvider";
import { pathBuilder } from "@/utils/utils";
import { VsAdd } from "solid-icons/vs"
import { twMerge } from "tailwind-merge";

function AddFolder(props: any) {
    const { insert, forEach } = useMockApiTree();
    const { handleCloseContextMenu } = useMenuContext();
    const nestedStyles = `${(props.nestLevel) * 32}px`;
    

    const handleAddFolder = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newId = getUniqueId();
        insert(
            props.parentId, 
            {
                name: `newFolder_${newId}`,
                id: newId,
                children: {},
                data: {
                    body: '',
                    description: '',
                    hasEdits: false,
                    isEditing: false,
                    isEnabled: false,
                    isExpanded: true,
                    method: 'GET',
                    params: {},
                    path: pathBuilder(props.path, `newFolder_${newId}`),
                    type: 'folder',
                    uri: '',
                }
            });
        handleCloseContextMenu();
        forEach((node) => {
            node.data.isExpanded = node.id !== newId;
            return true;
        });
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