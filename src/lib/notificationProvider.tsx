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

    const styles = "border-2 bg-primary-bg text-primary-text border-primary-text z-40";
    const darkStyles = "dark:bg-primary-bg dark:text-primary-text dark:border-primary-text";

    const handleExit = () => {
        notificationConfig()?.cancelCallback?.();
        setShowNotification(false);
    };

    const handleSave = () => {

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
                            <button type='button' on:click={handleExit} class="mb-6">
                                <VsClose stroke="currentColor" size={18} class="vs text-okRed-500" />
                            </button>
                        </div>
                        {notificationConfig().content}
                        <div class="flex flex-row gap-6 justify-end">
                            <div on:click={handleExit}>{notificationConfig()?.cancelText ?? 'Cancel'}</div>
                            <div on:click={handleSave}>{notificationConfig()?.continueText ?? 'Continue'}</div>
                        </div>
                    </div>
                </Portal>
            </Show>
        </notificationContext.Provider>
    )
}

export default NotificationProvider;