import ThemeSwitcher from "@/components/themeSwitcher";

function NoNavigation (props: any) {    
    return (
        <div class='relative flex flex-col w-screen h-screen p-2'>
            <div class='grid grid-cols-[1fr] grid-rows-[1fr_14fr] gap-2 w-full h-full'>
                <div class="overflow-y-hidden">
                    <div class='flex flex-row justify-between items-center'>
                        <div /> {/* empty div to maintain position of title and theme button without menu */}
                        <h1 class='flex items-center mx-4 text-lg font-bold'>OkApi: API Mocking Tool</h1>
                        <ThemeSwitcher />
                    </div>
                </div>
                {/* extra div is necessary to avoid padding affecting the width/height */}
                <div class="overflow-y-auto">
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default NoNavigation;