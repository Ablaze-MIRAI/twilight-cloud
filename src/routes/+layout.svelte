<script lang="ts">
    import "../app.css";
    let { children } = $props();

    import { browser } from "$app/environment";
    import { onMount } from "svelte";

    import { toast, Toaster } from "svelte-sonner";

    import { signIn } from "$lib/browser/auth";
    import XSidebar from "$lib/components/XSidebar.svelte";
    import XWelcome from "$lib/components/XWelcome.svelte";
    import AuthDialog from "$lib/components/auth/AuthDialog.svelte";
    import FatalErrorDialog from "$lib/components/error/FatalErrorDialog.svelte";
    import * as Sidebar from "$lib/components/ui/sidebar/index.js";
    import { type User } from "@prisma/client";

    // states
    let tokenExpired = $state(false);
    let fatalErrorOccurred = $state(false);
    let errorDetails = $state<string | undefined>(undefined);
    let username = $state<string | undefined>(undefined);
    let userId: string | undefined;

    const isSignedIn = browser ? localStorage.getItem("isLoggedIn") === "true" : true;

    const tryAuthenticate = async (disableReload?: boolean) => {
        try {
            await signIn(userId);
            toast.success("Authentication successful", {
                description: "You have successfully authenticated.",
            });

            !disableReload ? location.reload() : tokenExpired = false;
        } catch (error) {
            console.error(error);
            toast.error("Failed to sign in", {
                description: "An error occurred while signing in. Please try again later.",
            });
        }
    };

    // リロードされる度に呼ばれる。時間経過での再認証を行う場合は呼び出されない。
    const setUserInformation = async (res: Response) => {
        const user: User = await res.json();
        username = user.name ?? "User";
        userId = user.id;
    };

    onMount(async () => {
        if (browser && isSignedIn) {
            /*
                トークンの有効時間は1時間のみ。編集中にトークンの有効期限が切れて保存できなくなることを避けるため、以下の動作を行う。
                  - リロード時、前回の認証から15分経過していた場合再認証を要求する。
                  - ロード後40分経過した場合、再認証を要求する。
            */
            const nextAuthenticationTime = localStorage.getItem("nextAuthenticationTime");
            
            if (nextAuthenticationTime && Date.now() > parseInt(nextAuthenticationTime)) {
                // nextAuthenticationTimeが過ぎている場合は再認証
                tokenExpired = true;
                await tryAuthenticate();
            } else {
                // fetch user data
                try {
                    const res = await fetch("/api/me");
                    if (res.status === 401) {
                        tokenExpired = true;
                        try {
                            await tryAuthenticate();
                        } catch (error) {
                            console.error(error);
                        }
                    } else if (!res.ok) {
                        throw new Error("Failed to fetch user data: " + res.statusText);
                    } else {
                        setUserInformation(res);

                        setTimeout(async () => {
                            // 40分後に再認証
                            tokenExpired = true;
                            await tryAuthenticate(true);
                        }, 40 * 60 * 1000);
                    }
                } catch (error) {
                    console.error(error);
                    fatalErrorOccurred = true;
                    errorDetails = "INITIAL_FETCH_FAILED";
                }
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

    <AuthDialog isOpen={tokenExpired} />
    <FatalErrorDialog isOpen={fatalErrorOccurred} {errorDetails} />
{/if}

<Toaster />
