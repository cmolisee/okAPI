import { VsClose } from "solid-icons/vs";
import { twMerge } from "tailwind-merge";

export const notificationContext = createContext<NotificationContext>({
    setShowNotification: () => {},
    setNotificationConfig: () => {},
});

export const useNotifications = () => {
    const context = useContext(notificationContext);
    if (!context) {
        throw Error("notificationContext does not exist.");
    }
    return context;
};

function NotificationProvider(props: any) {
    const [showNotification, setShowNotification] = createSignal(false);
    const [notificationConfig, setNotificationConfig] = createSignal<NotificationConfiguration>({});

    const styles = "flex flex-col gap-4 p-4 border-2 bg-primary-bg text-primary-text border-primary-text z-40";
    const darkStyles = "dark:bg-primary-bg dark:text-primary-text dark:border-primary-text";

    const handleExit = () => {
        notificationConfig()?.cancelCallback?.();
        setShowNotification(false);
    };

    const handleSave = () => {
        notificationConfig()?.continueCallback?.();
        setShowNotification(false);
    }

    return (
        <notificationContext.Provider value={{
            setShowNotification,
            setNotificationConfig,
        }}>
            {props.children}
            <Show when={showNotification()}>
                <Portal mount={document.getElementById('root')!} ref={(el) => { 
                        el.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 55vw;';
                    }}> 
                    <div class={twMerge(styles, darkStyles)}>
                        <div class="flex justify-end">
                            <button type='button' on:click={handleExit}>
                                <VsClose stroke="currentColor" size={18} class="vs text-okRed-500" />
                            </button>
                        </div>
                        {notificationConfig().content}
                        <div class="flex flex-row gap-4 justify-end mx-4">
                            <div class="cursor-pointer hover:font-bold focus:font-bold" on:click={handleExit}>{notificationConfig()?.cancelText ?? 'Cancel'}</div>
                            <div class="cursor-pointer hover:font-bold focus:font-bold" on:click={handleSave}>{notificationConfig()?.continueText ?? 'Continue'}</div>
                        </div>
                    </div>
                </Portal>
            </Show>
        </notificationContext.Provider>
    )
}

export default NotificationProvider;