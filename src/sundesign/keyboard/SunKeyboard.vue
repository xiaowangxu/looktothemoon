<template>
    <kbd class="__sun-design__ __sun-design-keyboard__">
        <slot />
    </kbd>
</template>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-keyboard__
    font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace
    font-size: font-size-small
    background-color: transparent
    color: var(--color-active-disabled)
    padding: padding-small padding-extend-small
    border-radius: border-radius-size-small
    border-width: 1px // 1px 2px 1px
    border-style: solid
    border-color: @color
    border-image: initial
    overflow: hidden
    white-space: nowrap
    text-overflow: ellipsis

</style>