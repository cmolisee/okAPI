import ExplorerNode from "./ExplorerNode";

function ExplorerTree(props: any) {
  return (
    <div class="file-system p-4 font-mono text-sm">
      {/* root starts at -1 since we don't display the root */}
      <ExplorerNode item={props.data} level={props.level ?? -1} />
    </div>
  );
}

export default ExplorerTree;