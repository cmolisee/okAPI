import ExplorerNode from "./ExplorerNode";

function ExplorerTree(props: any) {
  return (
    <div class="file-system p-4 font-mono text-sm">
      <ExplorerNode item={props.data} level={0} />
    </div>
  );
}

export default ExplorerTree;