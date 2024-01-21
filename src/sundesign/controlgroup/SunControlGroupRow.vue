<template>
    <div class="__sun-design__ __sun-design-controlgroup-row__">
        <slot />
    </div>
</template>

<style lang="stylus">
@import '../SunDesignStyleConstants.styl';

.__sun-design__.__sun-design-controlgroup-row__
    display: flex
    flex-wrap: nowrap

    .__sun-design__.__sun-design-controlgroup__ > &

        &:first-child:last-child
            > .__sun-design__.bordered
                &:first-child:not(:last-child), &:not(:first-child):not(:last-child)
                    border-right: none
            > form:first-child:not(:last-child), > form:not(:first-child):not(:last-child)
                > .__sun-design__.bordered
                    border-right: none
            > .__sun-design__.border-masked
                &:first-child:not(:last-child)
                    border-top-right-radius: 0
                    border-bottom-right-radius: 0
                &:last-child:not(:first-child)
                    border-top-left-radius: 0
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child)
                    border-radius: 0
            > form
                &:first-child:not(:last-child) > .__sun-design__.border-masked
                    border-top-right-radius: 0
                    border-bottom-right-radius: 0
                &:last-child:not(:first-child) > .__sun-design__.border-masked
                    border-top-left-radius: 0
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child) > .__sun-design__.border-masked
                    border-radius: 0

        &:first-child:not(:last-child)
            > .__sun-design__.bordered
                border-bottom: none
                &:first-child:not(:last-child), &:not(:first-child):not(:last-child)
                    border-right: none
            > form > .__sun-design__.bordered
                border-bottom: none
            > form:first-child:not(:last-child), > form:not(:first-child):not(:last-child)
                > .__sun-design__.bordered
                    border-right: none
            > .__sun-design__.border-masked
                border-bottom-left-radius: 0
                border-bottom-right-radius: 0
                &:first-child:not(:last-child)
                    border-top-right-radius: 0
                &:last-child:not(:first-child)
                    border-top-left-radius: 0
                &:not(:first-child):not(:last-child)
                    border-top-left-radius: 0
                    border-top-right-radius: 0
            > form > .__sun-design__.border-masked
                border-bottom-left-radius: 0
                border-bottom-right-radius: 0
            > form
                &:first-child:not(:last-child) > .__sun-design__.border-masked
                    border-top-right-radius: 0
                &:last-child:not(:first-child) > .__sun-design__.border-masked
                    border-top-left-radius: 0
                &:not(:first-child):not(:last-child) > .__sun-design__.border-masked
                    border-top-left-radius: 0
                    border-top-right-radius: 0

        &:last-child:not(:first-child)
            > .__sun-design__.bordered
                &:first-child:not(:last-child), &:not(:first-child):not(:last-child)
                    border-right: none
            > form:first-child:not(:last-child), > form:not(:first-child):not(:last-child)
                > .__sun-design__.bordered
                    border-right: none
            > .__sun-design__.border-masked
                border-top-left-radius: 0
                border-top-right-radius: 0
                &:first-child:not(:last-child)
                    border-bottom-right-radius: 0
                &:last-child:not(:first-child)
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child)
                    border-bottom-left-radius: 0
                    border-bottom-right-radius: 0
            > form > .__sun-design__.border-masked
                border-top-left-radius: 0
                border-top-right-radius: 0
            > form
                &:first-child:not(:last-child) > .__sun-design__.border-masked
                    border-bottom-right-radius: 0
                &:last-child:not(:first-child) > .__sun-design__.border-masked
                    border-bottom-left-radius: 0
                &:not(:first-child):not(:last-child) > .__sun-design__.border-masked
                    border-bottom-left-radius: 0
                    border-bottom-right-radius: 0

        &:not(:first-child):not(:last-child)
            > .__sun-design__.bordered
                border-bottom: none
                &:first-child:not(:last-child), &:not(:first-child):not(:last-child)
                    border-right: none
            > form > .__sun-design__.bordered
                border-bottom: none
            > form:first-child:not(:last-child), > form:not(:first-child):not(:last-child)
                > .__sun-design__.bordered
                    border-right: none
            > .__sun-design__.border-masked, > form > .__sun-design__.border-masked
                border-radius: 0
                
</style>