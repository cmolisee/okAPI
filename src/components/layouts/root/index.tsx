import SideMenu from "@/components/sideMenu";
import ThemeSwitcher from "@/components/themeSwitcher";
import { useNavigate } from "@solidjs/router";
import { BsPersonWorkspace } from "solid-icons/bs";
import { FaSolidFolderOpen } from "solid-icons/fa";
import { HiSolidCog6Tooth } from "solid-icons/hi";

function Root (props: any) {
    const navigate = useNavigate();

    const customMenuCloseEvent = new CustomEvent('customCloseMenu');
    const dispatchCloseMenu = () => document.dispatchEvent(customMenuCloseEvent);
    
    return (
        <div class='relative flex flex-col w-screen h-screen p-2'>
            <div class='grid grid-cols-[1fr] grid-rows-[1fr_14fr] gap-2 w-full h-full'>
                <div class="overflow-y-hidden">
                    <div class='flex flex-row justify-between items-center'>
                        <SideMenu>
                            {/* workspace */}
                            <div class="group relative flex justify-center cursor-pointer" on:click={() => {
                                dispatchCloseMenu();
                                navigate('/', { replace: true });
                            }}>
                                <BsPersonWorkspace stroke="currentColor" size={32} class="vs text-[#fff] my-4" />
                                <div class="absolute top-1/2 -translate-x-full -translate-y-1/2 w-full opacity-0 transform transition-all duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100">
                                    <span class="text-3xl font-extrabold text-[#fff] bold">Workspace</span>
                                </div>
                            </div>
                            <div class="w-[90%] border border-[#fff]" />
                            {/* options */}
                            <div class="group relative flex justify-center cursor-pointer" on:click={() => {
                                dispatchCloseMenu();
                                navigate('/options', { replace: true });
                            }}>
                                <HiSolidCog6Tooth stroke="currentColor" size={32} class="vs text-[#fff] my-4" />
                                <div class="absolute top-1/2 -translate-x-full -translate-y-1/2 w-full opacity-0 transform transition-all duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100">
                                    <span class="text-3xl font-extrabold text-[#fff] bold">Options</span>
                                </div>
                            </div>
                            <div class="w-[90%] border border-[#fff]" />
                            {/* save all */}
                            {/* <div class="group relative flex justify-center cursor-pointer" on:click={() => {
                                dispatchCloseMenu();
                                navigate('/save', { replace: true });
                            }}>
                                <VsSaveAll stroke="currentColor" size={32} class="vs text-[#fff] my-4" />
                                <div class="absolute top-1/2 -translate-x-full -translate-y-1/2 w-full opacity-0 transform transition-all duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100">
                                    <span class="text-3xl font-extrabold text-[#fff] bold">Save Workspace</span>
                                </div>
                            </div>
                            <div class="w-[90%] border border-[#fff]" /> */}
                            {/* explorer */}
                            <div class="group relative flex justify-center cursor-pointer" on:click={() => {
                                dispatchCloseMenu();
                                navigate('/explorer', { replace: true });
                            }}>
                                <FaSolidFolderOpen stroke="currentColor" size={32} class="vs text-[#fff] my-4" />
                                <div class="absolute top-1/2 -translate-x-full -translate-y-1/2 w-full opacity-0 transform transition-all duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100">
                                    <span class="text-3xl font-extrabold text-[#fff] bold">Explore Mocks</span>
                                </div>
                            </div>
                        </SideMenu>
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

export default Root;