<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

	import { cn } from "$lib/utils.js";

	let {
	    ref = $bindable(null),
	    sideOffset = 4,
	    class: className,
	    ...restProps
	}: DropdownMenuPrimitive.ContentProps = $props();
</script>

<DropdownMenuPrimitive.Content
	bind:ref
	{sideOffset}
	class={cn(
	    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 p-1 shadow-md outline-hidden",
	    className
	)}
	{...restProps}
/>
