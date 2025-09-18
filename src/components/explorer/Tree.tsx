import { createTreeCollection, TreeView } from "@ark-ui/solid";
import { VsFolder, VsFile, VsChevronRight } from "solid-icons/vs";
import './styles.css';
import EditableName from "./EditableName";
import { useMockApiTree } from "@/lib/mockApiTreeProvider";
import { deepMapObject } from "@/utils/utils";

interface Node {
  id: string
  name: string
  children?: Node[]
  data?: any
}

function Tree(props: any) {
    const { tree } = useMockApiTree();
    // Add new mock file
    // add new folder
    // update folder name
    // update file name
    // delete file
    // delete folder

    // !!!!!!!!
    // change the node to reflect
    // {
    //     name,
    //     id,
    //     data: // all the data
    //     children: []
    // }
    // !!!!!!!!

    const collection = createTreeCollection<Node>({
      nodeToValue: (node: Node) => node.id,
      nodeToString: (node: Node) => node.name,
      rootNode: tree as any,
    });

    return (
        <TreeView.Root collection={collection} selectionMode={props.multiselect ? 'multiple' : 'single'}>
            <TreeView.Label>Tree</TreeView.Label>
            <TreeView.Tree>
                <For each={collection.rootNode.children as any}>{(node, index) => <TreeNode node={node} indexPath={[index()]} />}</For>
            </TreeView.Tree>
        </TreeView.Root>
    );
}

function TreeNode (props: TreeView.NodeProviderProps<Node>) {
  const FolderIcon = () => <VsFolder size={18} class="text-secondary-text dark:text-secondary-text" />;
  const FileIcon = () => <VsFile size={18} class="text-secondary-text dark:text-secondary-text" />;
  const ChevronRight = () => <VsChevronRight size={18} class="text-secondary-text dark:text-secondary-text" />;

  return (
    <TreeView.NodeProvider node={props.node} indexPath={props.indexPath}>
      <Show when={props.node.children}
        fallback={
          <TreeView.Item class={'select-none flex items-center gap-2 min-h-[32px] rounded-sm focus:-outline-offset-1'}>
            <TreeView.ItemText class={'flex gap-2 cursor-pointer select-none'}>
              <FileIcon />
              <EditableName value={props.node.name} />
            </TreeView.ItemText>
          </TreeView.Item>
        }
      >
        <TreeView.Branch>
          <TreeView.BranchControl class={'select-none flex items-center gap-2 min-h-[32px] rounded-sm focus:-outline-offset-1'}>
            <TreeView.BranchIndicator class={'flex items-center'}>
              <ChevronRight />
            </TreeView.BranchIndicator>
            <TreeView.BranchText class={'flex gap-2'}>
              <FolderIcon /> <EditableName value={props.node.name} />
            </TreeView.BranchText>
          </TreeView.BranchControl>
          <TreeView.BranchContent class={'relative isolate overflow-hidden max-w-[400px]'}>
            <TreeView.BranchIndentGuide class={'absolute content-[""] h-full z-0 border-l-[rgb(226,226,226)] border-l border-solid'}/>
            <For each={props.node.children}>
              {(child, index) => <TreeNode node={child} indexPath={[...props.indexPath, index()]} />}
            </For>
          </TreeView.BranchContent>
        </TreeView.Branch>
      </Show>
    </TreeView.NodeProvider>
  )
}

// const collection = createTreeCollection<Node>({
//   nodeToValue: (node: Node) => node.id,
//   nodeToString: (node: Node) => node.name,
//   rootNode: {
//     id: 'root',
//     name: '',
//     data: { item: true },
//     children: [
//       {
//         id: 'node_modules',
//         name: 'node_modules',
//         data: { item: true },
//         children: [
//           { id: 'node_modules/zag-js', name: 'zag-js', data: { item: true } },
//           { id: 'node_modules/pandacss', name: 'panda', data: { item: true }  },
//           {
//             id: 'node_modules/@types',
//             name: '@types',
//             children: [
//               { id: 'node_modules/@types/react', name: 'react', data: { item: true }  },
//               { id: 'node_modules/@types/react-dom', name: 'react-dom', data: { item: true }  },
//             ],
//           },
//         ],
//       },
//       {
//         id: 'src',
//         name: 'src',
//         children: [
//           { id: 'src/app.tsx', name: 'app.tsx', data: { item: true }  },
//           { id: 'src/index.ts', name: 'index.ts', data: { item: true }  },
//         ],
//       },
//       { id: 'panda.config', name: 'panda.config.ts' },
//       { id: 'package.json', name: 'package.json', data: { item: true }  },
//       { id: 'renovate.json', name: 'renovate.json', data: { item: true }  },
//       { id: 'readme.md', name: 'README.md' },
//     ],
//   },
// })

export default Tree;