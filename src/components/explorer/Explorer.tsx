import { useExplorer } from "@/lib/explorerStore";
import ExplorerTree from "./ExplorerTree";
import { twMerge } from "tailwind-merge";
import { trackDeep } from "@solid-primitives/deep";

function Explorer(props: any) {
    const { explorerTree } = useExplorer();
    const [ showAutocomplete, setShowAutocomplete ] = createSignal(false);
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';
    const options: HTMLDivElement[] = [];

    // todo: don't show the root node...
    let autocompleteRef: any;

    const comparePaths = (a: string, b: string) => {
        const x = a.split('/');
        const y = b.split('/');
    
        if (x.length === y.length) {
            return x.pop()! < y.pop()! ? -1 : 1;
        } else {
            return x.length - y.length;
        }
    };

    const getPaths = (directory: ApiMockNode, paths: string[] = []) => {
        if (!directory.path) {
            return paths;
        }

        paths.push(directory.path);

        directory?.children?.forEach((c) => {
            return getPaths(c, paths);
        });

        return paths;
    };
    const paths = createMemo(() => {
        const trackedTree = trackDeep(explorerTree);
        return getPaths(trackedTree);
    });

    const createOption = (opt: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === opt) {
                return;
            }
        }

        const el = document.createElement('div');
        el.classList = '';
        el.innerText = opt;
        el.id = opt;
        parent.appendChild(el);
    };

    const removeOption = (opt: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === opt) {
                parent.removeChild(node);
            }
        }
    };

    const handleInput = (e: Event) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        // get the target value
            // assume pre-pended forward-slash
        let txt = (e.target as HTMLInputElement).value;

        if (!txt.startsWith('/')) {
            txt = '/' + txt;
        }

        paths().forEach((opt: string) => {
            if (opt.startsWith(txt)) {
                createOption(opt, autocompleteRef)
            } else {
                removeOption(opt, autocompleteRef);
            }
        });
    };

    const handleKeyDown = (e: Event) => {
        // if arrow key down
            // if last element
                // shift focus to first
            // else
                // shift focus to next
        // if arrow key up
            // if first element
                // shift focus to last
            // else
                // shift focus previous
        // if enter
            // replace input field value with focused value
            // (TBD) close/update the dropdown list 
    };

    return (
        <div>
            <div class="relative">
                <input type="text" 
                    on:focus={() => setShowAutocomplete(true)}
                    on:blur={() => setShowAutocomplete(false)}
                    on:input={handleInput} 
                    on:keydown={handleKeyDown} />
                <Show when={showAutocomplete()} fallback={<></>}>
                    <div ref={autocompleteRef} class={twMerge('absolute z-20 top-full left-[0] right-[0] max-h-[4em]', scrollbarStyles)}>
                        {/* autocomplete options */}
                    </div>
                </Show>
            </div>
            <div class={twMerge('h-full', scrollbarStyles)}>
                <ExplorerTree data={explorerTree} />
            </div>
        </div>
    )
}

export default Explorer;