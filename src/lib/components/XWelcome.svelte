<script lang="ts">
    import { IconBrandGoogleFilled } from "@tabler/icons-svelte";
    import { LoaderCircle } from "lucide-svelte";
    import { toast } from "svelte-sonner";

    import { signIn } from "$lib/browser/auth";
    import SignUpDialog from "$lib/components/auth/SignUpDialog.svelte";
    import { Button } from "$lib/components/ui/button/index.js";
    import { cn } from "$lib/utils.js";


    let className: string | undefined | null = undefined;
    export { className as class };

    let isLoading = false;
    const signInWithPasskey = async () => {
        isLoading = true;
        try {
            await signIn();
            toast.success("Successfully signed in", {
                description: "You have successfully signed in.",
            });

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error(error);
            toast.error("Failed to sign in", {
                description: `An error occurred while signing in. Please try again later: ${error}`,
            });

            isLoading = false;
        }
    };

    const signInWithGoogle = async () => {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("oAuth", "google");

        document.cookie = "auth=oAuthGoogle; SameSite=Strict; Secure";

        // 15分後に再認証
        // 実際のトークンの有効期限は60分だが、編集中にトークンが切れて保存できなくなることを防止するために15分おきに再認証させる
        localStorage.setItem(
            "nextAuthenticationTime",
            (Date.now() + 15 * 60 * 1000).toString(),
        );

        location.href = "/auth/google";
    };  

    let signUpDialogIsOpen = false;
    async function onSignUp() {
        signUpDialogIsOpen = true;
    }
</script>


<div
        class="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
>
    <Button
            onclick={() => onSignUp()}
            variant="ghost"
            class="absolute right-4 top-4 md:right-8 md:top-8"
            id="sign-up-button"
    >
        Create Account
    </Button>
    <div class="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div
                class="absolute inset-0 bg-cover"
                style="
				background-image:
					url(/bg0.webp);"
        ></div>
        <div class="relative z-20 flex items-center text-lg font-medium">
           Twilight Cloud
        </div>
        <div class="relative z-20 mt-auto">
            <blockquote class="space-y-2">
                <footer class="text-sm">Photos by <a href="https://unsplash.com/ja/@fruit_basket?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Fruit Basket</a> </footer>
            </blockquote>
        </div>
    </div>
    <div class="lg:p-8">
        <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div class="flex flex-col space-y-2 text-center">
                <h1 class="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p class="text-muted-foreground text-sm">
                    Sign in to continue to Twilight Cloud.
                </p>
            </div>
            <div class={cn("grid gap-6", className)} {...$$restProps}>
                <div class="grid gap-2">
                    <Button disabled={isLoading} id="button-sign-in-with-passkey" onclick={signInWithPasskey}>
                        {#if isLoading}
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                        {/if}
                        Sign In with Passkey
                    </Button>
                    <Button disabled={isLoading} variant="outline" onclick={signInWithGoogle} id="button-sign-in-with-google">
                        {#if isLoading} 
                            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
                        {:else}
                            <IconBrandGoogleFilled />
                        {/if}
                        Sign In with Google
                    </Button>
                </div>
            </div>
            <p class="text-muted-foreground px-8 text-center text-sm">
                This software uses other open-source software.
                For more information, please read the
                <a href="/terms" class="hover:text-primary underline underline-offset-4">
                    Legal Notice
                </a>
                .
            </p>
        </div>
        <!-- footer -->
        <div class="absolute right-4 bottom-4 md:right-8 md:bottom-8 text-right">
            <p class="text-sm text-gray-500">
                ©2024-2025 nexryai All rights reserved.<br>
                <span class="text-xs">THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.</span>
            </p>
        </div>
    </div>
</div>

<SignUpDialog bind:isOpen={signUpDialogIsOpen} />
