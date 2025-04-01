import { createSignal, For, Show } from "solid-js";

// Define the type for a file system item
type FileSystemItem = {
  name: string;
  type: "file" | "folder";
  children?: FileSystemItem[];
};

// The FileSystemTree component that renders the entire tree
export default function FileSystemTree(props: { data: FileSystemItem }) {
  return (
    <div class="file-system p-4 font-mono text-sm">
      <FileSystemNode item={props.data} level={0} />
    </div>
  );
}

// The FileSystemNode component that recursively renders nodes
function FileSystemNode(props: { item: FileSystemItem; level: number }) {
  const [expanded, setExpanded] = createSignal(false);
  
  // Toggle expanded state
  const toggleExpand = () => {
    setExpanded(!expanded());
  };

  // Calculate padding based on nesting level
  const paddingLeft = `${props.level * 16}px`;
  
  return (
    <div class="file-system-node">
      <div 
        class="flex items-center py-1 hover:bg-gray-100 rounded cursor-pointer" 
        style={{ "padding-left": paddingLeft }}
        onClick={props.item.type === "folder" ? toggleExpand : undefined}
      >
        {/* Icon for folder or file */}
        <span class="mr-2">
          {props.item.type === "folder" ? (
            expanded() ? "//" : "*"
          ) : (
            "*"
          )}
        </span>
        
        {/* File/folder name */}
        <span class={props.item.type === "folder" ? "font-semibold" : ""}>
          {props.item.name}
        </span>
      </div>
      
      {/* Render children if this is a folder and it's expanded */}
      <Show when={props.item.type === "folder" && expanded()}>
        <div class="children">
          <For each={props.item.children}>
            {(child) => (
              <FileSystemNode 
                item={child} 
                level={props.level + 1} 
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

// Usage example:
// <FileSystemTree data={fileSystemData} />
// 
// Where fileSystemData looks like:
// {
//   name: "Root",
//   type: "folder",
//   children: [
//     { name: "file1.txt", type: "file" },
//     { 
//       name: "Folder1", 
//       type: "folder",
//       children: [
//         { name: "file2.txt", type: "file" }
//       ]
//     }
//   ]
// }