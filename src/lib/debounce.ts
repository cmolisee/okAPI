function createDebounce(callback: any, delay = 300) {
    let timeout: ReturnType<typeof setTimeout>;

    const debounced = (...args: any) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    };

    debounced.cancel = () => clearTimeout(timeout);

    onCleanup(() => clearTimeout(timeout));

    return debounced
}

export default createDebounce;