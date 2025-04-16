import MockExplorerTree from "@/components/mockExplorer/MockExplorerTree";
import SideMenu from "@/components/sideMenu";
import ThemeSwitcher from "@/components/themeSwitcher";
import { useMockExplorer } from "@/lib/mockExplorerStore";

function Root (props: any) {
    const { mockExplorerTree } = useMockExplorer();
    
    return (
        <div class='flex flex-col w-screen h-screen p-2'>
            <div class='grid grid-cols-[1fr] grid-rows-[1fr_14fr] gap-2 w-full h-full'>
                <div>
                    <div class='flex flex-row justify-between'>
                        <SideMenu>
                            <MockExplorerTree data={mockExplorerTree} />
                        </SideMenu>
                        <h1 class='flex items-center mx-4 text-lg font-bold'>OkApi: API Mocking Tool</h1>
                        <ThemeSwitcher />
                    </div>
                </div>
                {/* extra div is necessary to avoid padding affecting the width/height */}
                <div>
                    {props.children}
                </div>
            </div>
        </div>
    )
}

export default Root;