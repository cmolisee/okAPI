import { twMerge } from "tailwind-merge";

export const notificationContext = createContext<NotificationContext>({
    setShowNotification: () => {},
    setNotificationContent: () => {},
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
    const [notificationContent, setNotificationContent] = createSignal<NotificationContent>(null);

    const styles = "border-2 bg-primary-bg text-primary-text border-primary-text z-40";
    const positionStyles = "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    const darkStyles = "dark:bg-primary-bg dark:text-primary-text dark:border-primary-text";

    return (
        <notificationContext.Provider value={{
            setShowNotification,
            setNotificationContent,
        }}>
            {props.children}
            <Show when={showNotification()}>
                <Portal>
                    <div class={twMerge(styles, positionStyles, darkStyles)}>
                        {notificationContent()}
                    </div>
                </Portal>
            </Show>
        </notificationContext.Provider>
    )
}

export default NotificationProvider;