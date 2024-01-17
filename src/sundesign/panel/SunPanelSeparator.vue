<template>
    <div class="__sun-design__ __sun-design-panel-separator__">
    </div>
</template>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-panel-separator__
    background-color: border-color-normal

    .__sun-design__.__sun-design-panel__ > &
        border-left: solid-border
        width: 0px
        min-height: 100%
        min-width: unset

    .__sun-design__.__sun-design-panel__.vertical > &
        border-top: solid-border
        height: 0px
        min-width: 100%
        min-height: unset

</style>