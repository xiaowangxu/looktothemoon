<template>
    <div class="__sun-design__ __sun-design-controlgroup-row__">
        <slot />
    </div>
</template>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-controlgroup-row__
    // background-color: red
    display: flex
    flex-wrap: nowrap

    .__sun-design__.__sun-design-controlgroup__ > &

        &:first-child:last-child
            // background-color: blue
            > .__sun-design__.border-masked
                &:first-child:not(:last-child)
                    // background-color: blue
                    border-top-right-radius: 0
                    border-bottom-right-radius: 0
                    margin-right: - border-width
                &:last-child:not(:first-child)
                    // background-color: green
                    border-top-left-radius: 0
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child)
                    // background-color: yellow
                    border-radius: 0
                    margin-right: - border-width

        &:first-child:not(:last-child)
            // background-color: blue
            > .__sun-design__.border-masked
                border-bottom-left-radius: 0
                border-bottom-right-radius: 0
                margin-bottom: - border-width
                &:first-child:not(:last-child)
                    // background-color: blue
                    border-top-right-radius: 0
                    margin-right: - border-width
                &:last-child:not(:first-child)
                    // background-color: green
                    border-top-left-radius: 0
                &:not(:first-child):not(:last-child)
                    // background-color: yellow
                    border-top-left-radius: 0
                    border-top-right-radius: 0
                    margin-right: - border-width

        &:last-child:not(:first-child)
            // background-color: green
            > .__sun-design__.border-masked
                border-top-left-radius: 0
                border-top-right-radius: 0
                margin-bottom: unset
                &:first-child:not(:last-child)
                    // background-color: blue
                    border-bottom-right-radius: 0
                    margin-right: - border-width
                &:last-child:not(:first-child)
                    // background-color: green
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child)
                    // background-color: yellow
                    border-bottom-left-radius: 0
                    border-bottom-right-radius: 0
                    margin-right: - border-width

        &:not(:first-child):not(:last-child)
            // background-color: yellow
            > .__sun-design__.border-masked
                border-radius: 0
                margin-bottom: - border-width
                &:first-child:not(:last-child), &:not(:first-child):not(:last-child)
                    margin-right: - border-width
    
</style>