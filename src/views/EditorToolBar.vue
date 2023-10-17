<template>
    <SPanel style="pointer-events: all;">
        <SFlow vertical>
            <SButton icon-only icon-size="medium" flat>
                <PanelLeftInactive />
            </SButton>
        </SFlow>
    </SPanel>
    <SPanel style="pointer-events: all;">
        <SFlow vertical>
            <SButton icon-only icon-size="medium" flat>
                <Search />
            </SButton>
        </SFlow>
    </SPanel>
    <SPanel style="overflow: hidden; padding: 0; pointer-events: all;">
        <SScrollContainer scroll-bar-state-h="hidden" scroll-bar-state-v="hidden">
            <SFlow padding="var(--GapAndMargin)" vertical>
                <SButton icon-only icon-size="medium">
                    <Globe />
                </SButton>
                <SVSeparator />
                <SButton icon-only icon-size="medium">
                    <Workflow />
                </SButton>
                <SButton icon-only icon-size="medium">
                    <Globe />
                </SButton>
                <SButton icon-only icon-size="medium">
                    <Search />
                </SButton>
                <SButton icon-only icon-size="medium">
                    <Trash />
                </SButton>
                <SButton icon-only icon-size="medium">
                    <Globe />
                </SButton>
                <SButton icon-only icon-size="medium">
                    <Check />
                </SButton>
            </SFlow>
        </SScrollContainer>
    </SPanel>
</template>

<script setup lang="ts">

import SFlow from '@/components/SFlow.vue';
import SPanel from '@/components/SPanel.vue';
import SButton from '@/components/SButton.vue';
import SScrollContainer from '@/components/SScrollContainer.vue';
import SVSeparator from '@/components/SVSeparator.vue';
import { Check, Workflow, Globe, Search, Trash, PanelLeftInactive } from 'lucide-vue-next';

</script>