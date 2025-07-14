<script lang="ts">
    import { IconKey, IconBrandGoogleFilled } from "@tabler/icons-svelte";

    import type { User } from "@prisma/client";

    import { Button } from "@/lib/components/ui/button";

    const linkGoogleAccount = async () => {
        const res = await fetch("/api/me");
        const user: User = await res.json();
        document.cookie = `linkAccountId=${user.id}; SameSite=Strict; Secure`;

        location.href = "/auth/google";
    };
</script>
<div class="m-12">
    <h2 class="text-2xl">Settings</h2>
    <div class="m-6">
        <h3 class="text-xl flex items-center"><IconKey class="mr-3" />Authenticate with External Accounts</h3>
        <Button class="h-6" variant="outline" onclick={() => linkGoogleAccount()}>
            <IconBrandGoogleFilled />
            Google
        </Button>
    </div>
</div>
