import MockExplorerNode from "./MockExplorerNode";

function MockExplorerTree(props: any) {
  return (
    <div class="file-system p-4 font-mono text-sm">
      <MockExplorerNode item={props.data} level={0} />
    </div>
  );
}

export default MockExplorerTree;