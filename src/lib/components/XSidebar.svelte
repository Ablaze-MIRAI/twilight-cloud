<script lang="ts">
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";

    import {
        ChevronUp,
        LoaderCircle,
        LogOut,
        Plus,
        Search,
        Undo2,
        Zap,
    } from "lucide-svelte";

    import { callApi } from "$lib/browser/api";
    import AddCategoryDialog from "$lib/components/AddCategoryDialog.svelte";
    import SidebarNoteTree from "$lib/components/sidebar/SidebarNoteTree.svelte";
    import { Button } from "$lib/components/ui/button";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import type { NoteTree } from "$lib/schema/note";

    // props
    let {
        username,
    }: {
        username: string;
    } = $props();

    // states
    let searchDialogIsOpen = $state(false);
    let addCategoryDialogIsOpen = $state(false);
    let signOutConfirmDialogIsOpen = $state(false);

    const fetchNoteTree = async (): Promise<NoteTree[]> => {
        return callApi<NoteTree[]>("/api/note/tree", "GET");
    };

    const signOut = async () => {
        // Remove cookies
        document.cookie.split(";").forEach((cookie) => {
            const cookieName = cookie.split("=")[0].trim();
            document.cookie = `${cookieName}=; max-age=0; path=/`;
        });

        await callApi("/auth/logout", "GET");
        localStorage.removeItem("isLoggedIn");

        location.reload();
    };

    let currentPath = $state($page.url.pathname);
    $effect(() => {
        if (currentPath !== $page.url.pathname) {
            searchDialogIsOpen = false;
            addCategoryDialogIsOpen = false;
            currentPath = $page.url.pathname;
        }
    });
</script>

<Sidebar.Root class="z-20">
    <Sidebar.Header />
    <Sidebar.Content>
        <Sidebar.Group>
            <Sidebar.GroupContent>
                <Sidebar.Menu>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton isActive={currentPath === "/"}>
                            {#snippet child({ props })}
                                <a tabindex={0} href="/" {...props}>
                                    <Zap />
                                    <span>Quick Note</span>
                                </a>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                    <Sidebar.MenuItem>
                        <Sidebar.MenuButton>
                            {#snippet child({ props })}
                                <div
                                    role="button"
                                    tabindex={1}
                                    {...props}
                                    onclick={() => {
                                        searchDialogIsOpen =
                                            !searchDialogIsOpen;
                                    }}
                                >
                                    <Search />
                                    <span>Search</span>
                                </div>
                            {/snippet}
                        </Sidebar.MenuButton>
                    </Sidebar.MenuItem>
                </Sidebar.Menu>
            </Sidebar.GroupContent>
        </Sidebar.Group>

        <Sidebar.Group>
            <Sidebar.GroupLabel>Notes</Sidebar.GroupLabel>
            <Sidebar.GroupAction
                title="Add Project"
                onclick={() => {
                    addCategoryDialogIsOpen = true;
                }}
            >
                <Plus /> <span class="sr-only">Add Project</span>
            </Sidebar.GroupAction>
            <Sidebar.GroupContent>
                {#await browser ? fetchNoteTree() : Promise.resolve()}
                    <div class="w-full">
                        <LoaderCircle class="animate-spin mt-32 mx-auto" />
                    </div>
                {:then tree}
                    {#if tree}
                        <SidebarNoteTree {tree} bind:currentPath />
                    {/if}
                {:catch error}
                    <p class="text-red-500">{error.message}</p>
                {/await}
            </Sidebar.GroupContent>
        </Sidebar.Group>
    </Sidebar.Content>
    <Sidebar.Footer>
        <Sidebar.Menu>
            <Sidebar.MenuItem>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                        {#snippet child({ props })}
                            <Sidebar.MenuButton
                                {...props}
                                class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <span>{username}</span>
                                <ChevronUp class="ml-auto" />
                            </Sidebar.MenuButton>
                        {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content
                        side="top"
                        class="w-(--bits-dropdown-menu-anchor-width)"
                    >
                        <DropdownMenu.Item
                            class="hover:cursor-pointer"
                            onclick={() => {
                                goto("/settings");
                            }}
                        >
                            <span>Settings</span>
                        </DropdownMenu.Item>

                        <Dialog.Root bind:open={signOutConfirmDialogIsOpen}>
                            <Dialog.Trigger class="w-full text-right">
                                <DropdownMenu.Item
                                    class="hover:cursor-pointer"
                                    onclick={() => {
                                        signOutConfirmDialogIsOpen = true;
                                    }}
                                >
                                    <span>Sign out</span>
                                </DropdownMenu.Item>
                            </Dialog.Trigger>
                            <Dialog.Content>
                                <Dialog.Header>
                                    <Dialog.Title>Are you sure?</Dialog.Title>
                                    <Dialog.Description>
                                        Do you really want to sign out? All
                                        unsaved changes will be lost.
                                    </Dialog.Description>
                                </Dialog.Header>
                                <Dialog.Footer>
                                    <Button
                                        variant="destructive"
                                        onclick={() => {
                                            signOut();
                                        }}
                                    >
                                        <LogOut />Sign out
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onclick={() => {
                                            signOutConfirmDialogIsOpen = false;
                                        }}
                                    >
                                        <Undo2 />Cancel
                                    </Button>
                                </Dialog.Footer>
                            </Dialog.Content>
                        </Dialog.Root>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>
            </Sidebar.MenuItem>
        </Sidebar.Menu>
    </Sidebar.Footer>
</Sidebar.Root>

<AddCategoryDialog bind:isOpen={addCategoryDialogIsOpen} />

<Command.Dialog bind:open={searchDialogIsOpen}>
    <Command.Input placeholder="Type a command or search..." />
    <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        <Command.Group heading="Suggestions">
            <Command.Item>Calendar</Command.Item>
            <Command.Item>Search Emoji</Command.Item>
            <Command.Item>Calculator</Command.Item>
        </Command.Group>
    </Command.List>
</Command.Dialog>

<style>
    :global {
        .bg-sidebar {
            position: relative;
            background-color: rgba(255, 255, 255, 0.74);
        }

        .bg-sidebar:before {
            content: "";
            background-image: url("/photo-1660491630578-4299a3c09db0-navbar.webp");
            background-blend-mode: multiply, screen, overlay;
            background-size: cover;
            background-position: 50%;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            /*filter: blur(4px);*/
            z-index: -1;
        }
    }
</style>
