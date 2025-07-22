<script lang="ts">
    import "../app.css";
    let { children } = $props();

    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    import { Toaster } from "svelte-sonner";

    import XSidebar from "$lib/components/XSidebar.svelte";
    import XWelcome from "$lib/components/XWelcome.svelte";
    import FatalErrorDialog from "$lib/components/error/FatalErrorDialog.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { type User } from "@prisma/client";

    // states
    let fatalErrorOccurred = $state(false);
    let errorDetails = $state<string | undefined>(undefined);
    let username = $state<string | undefined>(undefined);

    const isSignedIn = browser ? localStorage.getItem("isLoggedIn") === "true" : true;

    // リロードされる度に呼ばれる。時間経過での再認証を行う場合は呼び出されない。
    const setUserInformation = async (res: Response) => {
        const user: User = await res.json();
        username = user.name ?? "User";
    };

    onMount(async () => {
        if (browser && isSignedIn) {
            // fetch user data
            try {
                const res = await fetch("/api/me");
                if (res.status === 401) {
                    try {
                        localStorage.clear();
                        location.reload();
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(error);
                    }
                } else if (!res.ok) {
                    throw new Error("Failed to fetch user data: " + res.statusText);
                } else {
                    setUserInformation(res);
                }
            } catch (error) {
                console.error(error);
                fatalErrorOccurred = true;
                errorDetails = "INITIAL_FETCH_FAILED";
            }
        }
    });
</script>

<svelte:head>
    <title>Twilight Cloud</title>
</svelte:head>

{#if !isSignedIn}
    <XWelcome />
{:else}
    <Sidebar.Provider class="w-screen justify-center" id="myurion-app-sidebar">
        <XSidebar username={username ?? "Loading..."} />
        <div class="w-full relative">
            {@render children()}
        </div>
    </Sidebar.Provider>

    <FatalErrorDialog isOpen={fatalErrorOccurred} {errorDetails} />
{/if}

<Toaster />
