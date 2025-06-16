import AddFolder from "./AddFolder";
import ExplorerNode from "./ExplorerNode";

function ExplorerTree(props: any) {
  return (
    <div class="p-4 font-mono text-sm">
      <For each={props.children} fallback={<AddFolder path={'/root'} parentId={'root'} />}>
          {(child) => <ExplorerNode node={child} level={0} />}
      </For>
      <div class="mt-2">
        <AddFolder path={'/root'} parentId={'root'} level={0} nestLevel={0} />
      </div>
    </div>
  );
}

export default ExplorerTree;