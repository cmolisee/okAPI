import FileSystemNode from "./MockExplorerNode";

function MockExplorerTree(props: { data: ApiMockNode }) {
  return (
    <div class="file-system p-4 font-mono text-sm">
      <FileSystemNode item={props.data} level={0} />
    </div>
  );
}

export default MockExplorerTree;