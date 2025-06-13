import { useExplorer } from "@/lib/explorerStore";
import ExplorerTree from "./ExplorerTree";
import { twMerge } from "tailwind-merge";
import { trackStore } from "@solid-primitives/deep";
import Text from '@/components/inputs/text';
import ExplorerNode from "./ExplorerNode";

function SaveExplorer(props: any) {
    const { explorerTree, updateExpandedState } = useExplorer();
    const [ showAutocomplete, setShowAutocomplete ] = createSignal(false);
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    let autocompleteRef: any;

    const comparePaths = (a: string, b: string) => {
        const x = a.split('/');
        const y = b.split('/');
    
        return x.pop()! < y.pop()! ? -1 : 1;
    };

    const getPaths = (node: OkMock|EmptyObject, paths: string[] = []) => {
        if (!node?.metadata?.path || Object.keys(node).length < 1) {
            return paths;
        }

        if (node.metadata.path !== '/root') {
            paths.push(node.metadata.path);
        }

        for (const child of Object.values(node.children)) {
            return getPaths(child, paths);
        }

        return paths;
    };

    const paths = createMemo(() => {
        const trackedTree = trackStore(explorerTree);
        return getPaths(trackedTree).sort(comparePaths);
    });

    const generateAutocompletePathsForOption = (optPath: string) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        if (!optPath.startsWith('/')) {
            optPath = '/' + optPath;
        }

        const parent = (autocompleteRef as HTMLDivElement);
        paths().forEach((path: string) => {
            const parsedOption = path.replace('/root', '');
            if (parsedOption.startsWith(optPath)) {
                createOption(parsedOption, parent)
            } else {
                removeOption(parsedOption, parent);
            }
        });

        if (!parent.querySelector('.active')) {
            parent.firstElementChild?.classList.add('active');
        }
    };

    const createOption = (path: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === path) {
                return;
            }
        }

        const el = document.createElement('div');
        el.classList = 'cursor-pointer hover:bg-secondary-bg dark:hover:bg-secondary-bg [&.active]:bg-secondary-bg dark:[&.active]:bg-secondary-bg px-2 rounded-sm';
        el.innerText = path;
        el.id = path;
        el.addEventListener('mousedown', () => {
            props.setSavePath(() => path);
            updateExpandedState(path.substring(path.lastIndexOf('/') + 1), true);
            setShowAutocomplete(false);
        });
        parent.appendChild(el);
    };

    const removeOption = (path: string, parent: HTMLDivElement) => {
        for (const node of parent.childNodes) {
            if ((node as HTMLDivElement).id === path) {
                parent.removeChild(node);
            }
        }
    };

    const handleFocusAndEdit = (e: Event) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        const path = (e.currentTarget as HTMLInputElement).value;
        if (path) {
            generateAutocompletePathsForOption(path);
            props.setSavePath(() => path);
            updateExpandedState('/root' + path, true);
            setShowAutocomplete(autocompleteRef.children?.length > 0);
        } else {
            generateAutocompletePathsForOption('');
            setShowAutocomplete(autocompleteRef.children?.length > 0);
        }    
    };

    const handleBlur = (e: Event) => {
        props.setSavePath((e.currentTarget as HTMLInputElement).value);
        setShowAutocomplete(false)
    };

    let keyStack: string[] = [];
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.repeat) {
            keyStack.push(e.key);
        }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
        const parent = autocompleteRef as HTMLDivElement;
        const currentEle = parent?.querySelector('.active');
        const firstEle = parent?.firstElementChild;
        const lastEle = parent?.lastElementChild;

        const isEnter = e.key === 'Enter' || keyStack.slice(-1)[0] === 'Enter';
        const isArrowDown = e.key === 'ArrowDown' || keyStack.slice(-1)[0] === 'ArrowDown';
        const isArrowUp = e.key === 'ArrowUp' || keyStack.slice(-1)[0] === 'ArrowUp';

        if (!parent) {
            return;
        }

        if (!currentEle) {  // set the active element if not yet set
            parent.firstElementChild?.classList.add('active');
            return;
        } else if (isEnter) { // if Enter key is pressed (active element is garunteed to exist)
            props.setSavePath(() => currentEle.id);
            updateExpandedState('/root' + currentEle.id, true);
            setShowAutocomplete(false);
        } else if (isArrowDown && lastEle?.classList.contains('active')) { // if arrowDown on last element, loop to top
            lastEle?.classList.remove('active');
            firstEle?.classList.add('active');
            firstEle?.scrollIntoView({ behavior: 'smooth', block: 'end'});
        } else if (isArrowUp && firstEle?.classList.contains('active')) { // if arrowUp on last element, loop to end
            firstEle?.classList.remove('active');
            lastEle?.classList.add('active');
            lastEle?.scrollIntoView({ behavior: 'smooth', block: 'end'});
        } else if (isArrowDown || isArrowUp) { // if arrowDown or arrowUp, no loop
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
        } else { // default update autocomplete
            const path = (e.currentTarget as HTMLInputElement).value;
            generateAutocompletePathsForOption(path);
        }

        keyStack = [];
    };

    onMount(() => {
        updateExpandedState('root', false);
    });

    return (
        <div>
            <div class="relative flex">
                <Text value={props.savePath()}
                    class={'border border-solid leading-[2em]'}
                    handleFocus={handleFocusAndEdit}
                    handleBlur={handleBlur}
                    handleChange={handleFocusAndEdit}
                    handleKeyDown={handleKeyDown}
                    handleKeyUp={handleKeyUp} />
                <div ref={autocompleteRef} 
                    class={twMerge(
                        'absolute z-20 top-full left-[0] right-[0] max-h-[8em] bg-primary-bg shadow-lg overflow-scroll mt-2 p-2', 
                        scrollbarStyles,
                        showAutocomplete() ? '' : 'invisible'
                    )}>
                    {/* autocomplete options dynamically generated and injected into the DOM */}
                </div>
            </div>
            <div class={twMerge('h-full', scrollbarStyles)}>
                <ExplorerTree>
                    <ExplorerNode node={explorerTree} level={props.level ?? -1} />
                </ExplorerTree>
            </div>
        </div>
    )
}

export default SaveExplorer;