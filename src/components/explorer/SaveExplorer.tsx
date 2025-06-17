import { useExplorer } from "@/lib/explorerStore";
import ExplorerTree from "./ExplorerTree";
import { twMerge } from "tailwind-merge";
import { trackStore } from "@solid-primitives/deep";
import Text from '@/components/inputs/text';
import { bfsFrom } from "@/utils/utils";
import { Accessor } from "solid-js";

function SaveExplorer(props: any) {
    const { explorerTree, updateExpandedState, findMockById } = useExplorer();
    const [ showAutocomplete, setShowAutocomplete ] = createSignal(false);
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    let autocompleteRef: any;

    const sortByPathPredicate = (a: AutofillData, b: AutofillData) => {
        const x = a.path.split('/');
        const y = b.path.split('/');
    
        return x.pop()! < y.pop()! ? -1 : 1;
    };

    const autofillData: Accessor<AutofillData[]> = createMemo(() => {
        const root = trackStore(explorerTree);
        const flatMappedNodes = bfsFrom(root as OkMock);
        return flatMappedNodes.map((n) => ({ id: n.metadata.id, path: n.metadata.path })).sort(sortByPathPredicate);
    });

    const generateAutocompleteOptions = (id: string) => {
        if (!autocompleteRef) {
            return;
        }

        const autocompleteEle = (autocompleteRef as HTMLDivElement);
        const targetNode = findMockById(explorerTree, id);
        clearOptions();
        autofillData()
            .filter((i) => (new RegExp(targetNode?.metadata.path ?? '')).test(i.path)) // get all children of current path
            .forEach((i) => createOption(i)); // clean path for UI
        
        autocompleteEle.firstElementChild?.classList.add('active');
        return;
    };

    const clearOptions = () => {
        if (!autocompleteRef) {
            return;
        }

        const autocompleteEle = (autocompleteRef as HTMLDivElement);
        autocompleteEle.innerHTML = '';
        return;
    };

    const createOption = (opt: AutofillData) => {
        if (!autocompleteRef) {
            return;
        }

        const autocompleteEle = (autocompleteRef as HTMLDivElement);
        const el = document.createElement('div');

        el.classList = 'cursor-pointer hover:bg-secondary-bg dark:hover:bg-secondary-bg [&.active]:bg-secondary-bg dark:[&.active]:bg-secondary-bg px-2 rounded-sm';
        el.innerText = opt.path;
        el.id = opt.id;
        el.setAttribute('data-id', opt.id);
        el.setAttribute('data-path', opt.path);
        el.addEventListener('mousedown', () => {
            const targetNode = findMockById(explorerTree, opt.id);
            props.setSaveToNode(targetNode);
            updateExpandedState(targetNode?.metadata.id as string, true);
            setShowAutocomplete(false);
        });
        autocompleteEle.appendChild(el);
        return;
    };

    const handleFocusAndEdit = (e: Event) => {
        if (!explorerTree || !autocompleteRef) {
            return;
        }

        const inputEle = e.currentTarget as HTMLInputElement
        const targetId = inputEle.getAttribute('data-id') ?? 'root';
        const mock = findMockById(explorerTree, targetId ?? 'root');

        if (targetId !== 'root') {
            props.setSaveToNode({ id: mock?.metadata.id, path: mock?.metadata.path });
            updateExpandedState(mock?.metadata.id as string, true);
        }

        generateAutocompleteOptions(mock?.metadata.id as string);
        setShowAutocomplete(autocompleteRef.children?.length > 0);
        return; 
    };

    const handleBlur = (e: Event) => {
        const inputEle = (e.currentTarget as HTMLInputElement);
        const targetId = inputEle.getAttribute('data-id');

        if (targetId) {
            const targetNode = findMockById(explorerTree, targetId);
            props.setSaveToNode(targetNode);
        }

        setShowAutocomplete(false)
        return;
    };

    let keyStack: string[] = [];
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!e.repeat) {
            keyStack.push(e.key);
        }
        
        return;
    }

    const handleKeyUp = (e: KeyboardEvent) => {
        if (!autocompleteRef) {
            return;
        }

        const autocompleteEle = autocompleteRef as HTMLDivElement;
        const currentOption = autocompleteEle?.querySelector('.active');
        const firstOption = autocompleteEle?.firstElementChild;
        const lastOption = autocompleteEle?.lastElementChild;

        const isEnter = e.key === 'Enter' || keyStack.slice(-1)[0] === 'Enter';
        const isArrowDown = e.key === 'ArrowDown' || keyStack.slice(-1)[0] === 'ArrowDown';
        const isArrowUp = e.key === 'ArrowUp' || keyStack.slice(-1)[0] === 'ArrowUp';

        

        if (!currentOption) {  // set the active element if not yet set
            firstOption!.classList.add('active');
        } else if (isEnter) { // if Enter key is pressed (active element is garunteed to exist)
            const targetNode = findMockById(explorerTree, currentOption.getAttribute('data-id') as string);

            props.setSaveToNode(targetNode);
            updateExpandedState(targetNode?.metadata.id as string, true);
            setShowAutocomplete(false);
        } else if (isArrowDown && lastOption?.classList.contains('active')) { // if arrowDown on last element, loop to top
            lastOption!.classList.remove('active');
            firstOption!.classList.add('active');
            firstOption!.scrollIntoView({ behavior: 'smooth', block: 'end'});
        } else if (isArrowUp && firstOption?.classList.contains('active')) { // if arrowUp on last element, loop to end
            firstOption!.classList.remove('active');
            lastOption!.classList.add('active');
            lastOption!.scrollIntoView({ behavior: 'smooth', block: 'end'});
        } else if (isArrowDown || isArrowUp) { // if arrowDown or arrowUp, no loop
            const children = autocompleteEle.children;
            for (let i = 0; i < children.length; ++i) {
                if (children[i] === currentOption) {
                    const delta = e.key === 'ArrowDown' ? 1 : -1;
                    const newActiveEle = children[i + delta];

                    currentOption.classList.remove('active');
                    newActiveEle.classList.add('active');
                    newActiveEle.scrollIntoView({ behavior: 'smooth', block: 'end'});
                    return;
                }
            }
        } else { // default update autocomplete
            const targetEle = e.currentTarget as HTMLInputElement;
            const targetNode = findMockById(explorerTree, targetEle.getAttribute('data-id') as string);
            generateAutocompleteOptions(targetNode?.metadata.id as string);
        }

        keyStack = [];
        return;
    };

    onMount(() => {
        updateExpandedState('root', false);
    });

    return (
        <div>
            <div class="relative flex">
                <Text value={props.saveToNode()?.metadata?.path ?? ''}
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
                    {Object.values(explorerTree?.children ?? {})}
                </ExplorerTree>
            </div>
        </div>
    )
}

export default SaveExplorer;