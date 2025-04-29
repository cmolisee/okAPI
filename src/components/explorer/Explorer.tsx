import { useExplorer } from "@/lib/explorerStore";
import ExplorerTree from "./ExplorerTree";
import { twMerge } from "tailwind-merge";
import { trackDeep } from "@solid-primitives/deep";

function Explorer(props: any) {
    const { explorerTree, updateExpandedState, toggleAllExpandedState } = useExplorer();
    const [ showAutocomplete, setShowAutocomplete ] = createSignal(false);
    const [ savePath, setSavePath ] = createSignal('');
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    let autocompleteRef: any;

    const comparePaths = (a: string, b: string) => {
        const x = a.split('/');
        const y = b.split('/');
    
        return x.pop()! < y.pop()! ? -1 : 1;
    };

    const getPaths = (directory: ApiMockNode, paths: string[] = []) => {
        if (!directory.path) {
            return paths;
        }

        if (directory.path !== '/root') {
            paths.push(directory.path);
        }

        directory?.children?.forEach((c) => {
            return getPaths(c, paths);
        });

        return paths;
    };

    const paths = createMemo(() => {
        const trackedTree = trackDeep(explorerTree);
        return getPaths(trackedTree).sort(comparePaths);
    });

    const generateAutocopletePaths = (text: string) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        if (!text.startsWith('/')) {
            text = '/' + text;
        }

        const parent = (autocompleteRef as HTMLDivElement);
        paths().forEach((opt: string) => {
            const parsedOption = opt.replace('/root', '');
            if (parsedOption.startsWith(text)) {
                createOption(parsedOption, parent)
            } else {
                removeOption(parsedOption, parent);
            }
        });

        if (!parent.querySelector('.active')) {
            parent.firstElementChild?.classList.add('active');
        }
    };

    const createOption = (opt: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === opt) {
                return;
            }
        }

        const el = document.createElement('div');
        el.classList = 'cursor-pointer hover:bg-secondary-bg dark:hover:bg-secondary-bg [&.active]:bg-secondary-bg dark:[&.active]:bg-secondary-bg px-2 rounded-sm';
        el.innerText = opt;
        el.id = opt;
        el.addEventListener('mousedown', () => {
            setSavePath(() => opt);
            generateAutocopletePaths(opt);
            updateExpandedState('/root' + opt, true);
        });
        parent.appendChild(el);
    };

    const removeOption = (opt: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === opt) {
                parent.removeChild(node);
            }
        }
    };

    const handleFocusAndEdit = (e: Event) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        const v = (e.currentTarget as HTMLInputElement).value;
        if (v) {
            generateAutocopletePaths(v);
            setSavePath(() => v);
            updateExpandedState('/root' + v, true);
            setShowAutocomplete(autocompleteRef.children?.length > 0);
        } else {
            generateAutocopletePaths('');
            setShowAutocomplete(autocompleteRef.children?.length > 0);
        }    
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        const parent = autocompleteRef as HTMLDivElement;
        const targetKeys = ['Enter', 'ArrowDown', 'ArrowUp'];

        if (!parent) {
            return;
        }

        if (!targetKeys.includes(e.key)) {
            const v = (e.currentTarget as HTMLInputElement).value;
            if (v) {
                generateAutocopletePaths(v);
            }
            return;
        }

        const currentEle = parent.querySelector('.active');
        const firstEle = parent.firstElementChild;
        const lastEle = parent.lastElementChild;

        if (!currentEle) {
            parent.firstElementChild?.classList.add('active');
            return;
        }

        if (e.key === 'Enter') {
            setSavePath(() => currentEle.id);
            updateExpandedState('/root' + currentEle.id, true);
            generateAutocopletePaths(currentEle.id);
            return;
        }

        if (e.key === 'ArrowDown' && lastEle?.classList.contains('active')) {
            lastEle?.classList.remove('active');
            firstEle?.classList.add('active');
            firstEle?.scrollIntoView({ behavior: 'smooth', block: 'end'});
            return;
        }

        if (e.key === 'ArrowUp' && firstEle?.classList.contains('active')) {
            firstEle?.classList.remove('active');
            lastEle?.classList.add('active');
            lastEle?.scrollIntoView({ behavior: 'smooth', block: 'end'});
            return;
        }

        const children = parent.children;
        for (let i = 0; i < children.length; ++i) {
            if (children[i] === currentEle) {
                currentEle.classList.remove('active');
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                const newActiveEle = children[i + delta];
                newActiveEle.classList.add('active');
                newActiveEle.scrollIntoView({ behavior: 'smooth', block: 'end'});
                return;
            }
        }
    };

    onMount(() => {
        toggleAllExpandedState(false);
    });

    return (
        <div>
            <div class="relative flex">
                <input type="text" 
                    class="bg-primary-bg dark:bg-primary-bg text-primary-text dark:text-primary-text border w-full"
                    value={savePath()}
                    on:focus={handleFocusAndEdit}
                    on:blur={() => setShowAutocomplete(false)}
                    on:change={handleFocusAndEdit}
                    on:keyup={handleKeyUp} />
                <div ref={autocompleteRef} 
                    class={twMerge(
                        'absolute z-20 top-full left-[0] right-[0] max-h-[8em] bg-primary-bg shadow-lg overflow-scroll mt-2 p-2', 
                        scrollbarStyles,
                        showAutocomplete() ? '' : 'invisible'
                    )}>
                    {/* autocomplete options */}
                </div>
            </div>
            <div class={twMerge('h-full', scrollbarStyles)}>
                <ExplorerTree data={explorerTree} />
            </div>
        </div>
    )
}

export default Explorer;