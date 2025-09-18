import { useMockApiTree } from "@/lib/mockApiTreeProvider";
import ExplorerTree from "./ExplorerTree";
import { twMerge } from "tailwind-merge";
import { trackStore } from "@solid-primitives/deep";
import Text from '@/components/inputs/text';
import { bfsFrom } from "@/utils/utils";
import Tree from "./Tree";

function sortByPathPredicate(a: AutofillData, b: AutofillData) {
    const x = a.path.split('/');
    const y = b.path.split('/');

    return x.pop()! < y.pop()! ? -1 : 1;
};

function SaveExplorer(props: any) {
    const { tree, forEach, find } = useMockApiTree();
    const [value, setValue] = createSignal(props.saveToNode()?.metadata?.path.replace('/root', '') ?? '');
    const [optionIndex, setOptionIndex] = createSignal(-1);
    const [ isOpen, setIsOpen ] = createSignal(false);
    const scrollbarStyles = '[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:transparent [&::-webkit-scrollbar-thumb]:bg-secondary-text dark:[&::-webkit-scrollbar-thumb]:bg-secondary-text';

    let inputRef: HTMLElement | undefined;
    let dropdownRef: HTMLDivElement | undefined;
    let optionRefList: HTMLElement[] | undefined[] = [];

    const filteredOptions = createMemo(() => {
        const inputValue = value().trim().toLowerCase();
        const rootNode = trackStore(tree);
        const flatMappedNodes = bfsFrom(rootNode as MockApiNode);
        return flatMappedNodes.map((n) => ({ id: n.id, path: n.data.path }))
            .filter((opt) => opt.path.toLowerCase().includes(inputValue))
            .sort(sortByPathPredicate);
    });

    const handleFocus = () => {
        setOptionIndex(0);
        setIsOpen(true);
    };

    const handleInput = (e: Event) => {
        const eventTarget = (e?.target as HTMLInputElement);
        setValue(eventTarget?.value ?? '');
        setIsOpen(true);

        if (eventTarget.id) {
            props.setSaveToNode(find(eventTarget.id));
            forEach((node) => {
                if (node.id !== eventTarget.id) {
                    return true;
                }
                node.data.isExpanded = true;
                return false;
            });
        }
    };

    const handleBlur = (e: Event) => {
        setTimeout(() => {
            const inputValueId = filteredOptions().find((opt) => opt.path.includes(value()))?.id;
            const targetNode = find(inputValueId ?? '');
            props.setSaveToNode(targetNode);
            setIsOpen(false);
            optionRefList = [];
        }, 150);
    };

    const optionClickHandler = (e: Event) => {
        const eventTarget = (e?.target as HTMLInputElement);

        if (eventTarget) {
            const targetNode = find(eventTarget.getAttribute('data-id') as string);
            props.setSaveToNode(targetNode);
            forEach((node) => {
                if (node.id !== targetNode?.id) {
                    return true;
                }
                node.data.isExpanded = true;
                return false;
            });
            setIsOpen(false);
        }
    };

    const scrollToSelected = () => {
        const index = optionIndex();
        if (index >= 0 && optionRefList[index]) {
            optionRefList[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
        }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
        const options = filteredOptions();
        const isEnter = e.key === 'Enter';
        const isArrowDown = e.key === 'ArrowDown';
        const isArrowUp = e.key === 'ArrowUp';
        const isEscape = e.key === 'Escape';
        const isTab = e.key === 'Tab';
        
        if (isArrowDown) {
            e.preventDefault();
            setOptionIndex(prev => {
                const newIndex = prev < options.length - 1 ? prev + 1 : 0;
                setTimeout(scrollToSelected, 0);
                return newIndex;
            });
        } else if (isTab) {
            if (isOpen() && options.length > 0) {
                e.preventDefault();
                setOptionIndex(prev => {
                    const newIndex = prev < options.length - 1 ? prev + 1 : 0;
                    setTimeout(scrollToSelected, 0);
                    return newIndex;
                });
            }
        } else if (isArrowUp) {
            e.preventDefault();
            setOptionIndex(prev => {
                const newIndex = prev > 0 ? prev - 1 : options.length - 1;
                setTimeout(scrollToSelected, 0);
                return newIndex;
            });
        } else if (isEnter) {
            if (optionIndex() >= 0) {
                e.preventDefault();
                setValue(options[optionIndex()]);
                setIsOpen(false);
                setOptionIndex(-1);
                optionRefList = [];
                inputRef?.focus();
            }
        } else if (isEscape) {
            e.preventDefault();
            setIsOpen(false);
            setOptionIndex(-1);
            inputRef?.focus();
        }
    };

    onMount(() => {
        forEach((node) => {
            node.data.isExpanded = false;
            return true;
        });
    });

    return (
        <div>
            <div class="relative flex">
                <Text ref={inputRef} 
                    id={'autocompleteInput'}
                    value={value()}
                    class={'border border-solid leading-[2em]'}
                    handleFocus={handleFocus}
                    handleBlur={handleBlur}
                    handleInput={handleInput}
                    handleKeyDown={handleKeyDown}
                    autocomplete={'off'} />
                <div ref={dropdownRef} class={twMerge('absolute z-20 top-full left-[0] right-[0] max-h-[8em] bg-primary-bg shadow-lg overflow-scroll mt-2 p-2', scrollbarStyles, isOpen() ? '' : 'invisible')}>
                    <Show when={isOpen()}>
                        <For each={filteredOptions()}>
                            {(opt, index) => (
                                <div ref={(el) => optionRefList[index()] = el} 
                                    id={opt.id} 
                                    class={twMerge(index() === optionIndex() ? 'active' : '' ,'cursor-pointer hover:bg-secondary-bg dark:hover:bg-secondary-bg [&.active]:bg-secondary-bg dark:[&.active]:bg-secondary-bg px-2 rounded-sm')}
                                    data-id={opt.id}
                                    data-path={opt.path}
                                    on:click={optionClickHandler}>
                                    {opt.path.replace('/root', '')}
                                </div>
                            )}
                        </For>
                    </Show>
                </div>
            </div>
            <div class={twMerge('h-full', scrollbarStyles)}>
                {/* <ExplorerTree>
                    {Object.values(tree?.children ?? {})}
                </ExplorerTree> */}
                <Tree />
            </div>
        </div>
    )
}

export default SaveExplorer;