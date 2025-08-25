import { Menu } from '@ark-ui/solid';
import './styles.css';

function CustomContextMenu(props: any) {
    return (
        <Menu.Root>
            <Menu.ContextTrigger>{props.text}</Menu.ContextTrigger>
            <Menu.Positioner>
            <Menu.Content>
                <For each={props.menuItems}>
                    {(item) => <Menu.Item value={item.text} on:click={item.callback}>{item.text}</Menu.Item>}
                </For>
            </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
}

export default CustomContextMenu