import type { Meta, StoryObj } from '@storybook/vue3';

import SunInspectorGrid from '../../src/sundesign/inspectorgrid/SunInspectorGrid.vue';
import SunInspectorRow from '../../src/sundesign/inspectorgrid/SunInspectorRow.vue';

import SunNumberEdit from '../../src/sundesign/numberedit/SunNumberEdit.vue';
import SunAngleSlider from '../../src/sundesign/slider/SunAngleSlider.vue';
import SunCheckbox from '../../src/sundesign/checkbox/SunCheckbox.vue';
import SunRadiobox from '../../src/sundesign/checkbox/SunRadiobox.vue';
import SunSwitch from '../../src/sundesign/checkbox/SunSwitch.vue';
import SunRadioGroup from '../../src/sundesign/checkbox/SunRadioGroup.vue';
import SunLabel from '../../src/sundesign/label/SunLabel.vue';
import SunColorPicker from '../../src/sundesign/colorpicker/SunColorPicker.vue';
import SunLineEdit from '../../src/sundesign/lineedit/SunLineEdit.vue';
import SunTextarea from '../../src/sundesign/textarea/SunTextarea.vue';
import SunSelect from '../../src/sundesign/select/SunSelect.vue';

import SunControlGroup from '../../src/sundesign/controlgroup/SunControlGroup.vue';
import SunControlGroupRow from '../../src/sundesign/controlgroup/SunControlGroupRow.vue';

import { RefreshCcwDot } from 'lucide-vue-next';

import SunButton from '../../src/sundesign/button/SunButton.vue';
import SunPanel from '../../src/sundesign/panel/SunPanel.vue';
import SunPanelContainer from '../../src/sundesign/panel/SunPanelContainer.vue';
import SunPanelSeparator from '../../src/sundesign/panel/SunPanelSeparator.vue';
import { Args, ArgsTypes, Decorators } from './SunDesignArgs';
import { ref } from 'vue';

const meta: Meta<typeof SunInspectorGrid> = {
    component: SunInspectorGrid,
};

export default meta;
type Story = StoryObj<typeof SunInspectorGrid>;

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const ScrollContainer: Story = {
    decorators: Decorators,
    tags: ['autodocs'],
    render: (args) => ({
        components: {
            SunInspectorGrid, SunPanel, SunPanelContainer, SunInspectorRow,
            SunControlGroup, SunControlGroupRow,
            SunNumberEdit, SunAngleSlider, SunButton, SunCheckbox,
            SunRadiobox, SunSwitch, SunRadioGroup, SunLabel,
            SunColorPicker, SunLineEdit, SunTextarea, SunSelect,

            RefreshCcwDot,
        },
        setup() {
            return { args };
        },
        template: `
			  <SunPanel vertical style="width: 300px;">
            <SunPanelContainer vertical gap>
			  	      <SunInspectorGrid v-bind="args" content-style="width: 100px;">

                    <SunInspectorRow label="SunNumberEdit">
                        <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1"/>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunControlGroup">
                        <SunControlGroup style="flex: 1;">
		                    		<SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;"/>
                            </SunControlGroupRow>
		                    		<SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;"/>
                            </SunControlGroupRow>
                            <SunControlGroupRow style="flex: 1;">
                                <SunNumberEdit :model-value="123" :min="0" :max="200" :step="1" style="flex: 1;"/>
                            </SunControlGroupRow>
                        </SunControlGroup>
                    </SunInspectorRow>
                
                    <SunInspectorRow label="SunAngleSlider">
                        <SunAngleSlider :model-value="123"/>
                    </SunInspectorRow>
                    
                    <SunInspectorRow label="SunControlGroup">
                        <SunControlGroup>
		                    		<SunControlGroupRow>
		                    		    <SunButton squared>1</SunButton>
		                    		    <SunButton squared>2</SunButton>
		                    		    <SunButton squared>3</SunButton>
		                    		</SunControlGroupRow>
		                    		<SunControlGroupRow>
		                    		    <SunButton squared>5</SunButton>
		                    		    <SunButton squared>6</SunButton>
		                    		    <SunButton squared>7</SunButton>
		                    		</SunControlGroupRow>
		                    		<SunControlGroupRow>
		                    		    <SunButton squared>9</SunButton>
		                    		    <SunButton squared>10</SunButton>
		                    		    <SunButton squared>11</SunButton>
		                    		</SunControlGroupRow>
			                  </SunControlGroup>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunControlGroup">
                        <SunControlGroup style="flex: 1;">
                            <SunControlGroupRow style="flex: 1;">
                                <SunColorPicker :model-value="[1, 1, 0, 0.75]" style="flex: 1;"/>
                                <SunSelect style="max-width: 100px; min-width: 50px;" :model-value="0" :options="[
                                    [
                                      {
                                        label: '循环',
                                        icon: 'Repeat',
                                        uid: 0,
                                      },
                                      {
                                        label: '单曲循环',
                                        icon: 'Repeat1',
                                        uid: 1,
                                      },
                                      {
                                        label: '随机',
                                        icon: 'Shuffle',
                                        uid: 2,
                                      }
                                    ]
                              ]" :preferedDirection="1"/>
                            </SunControlGroupRow>
                        </SunControlGroup>
                  </SunInspectorRow>


                    <SunInspectorRow label="SunButton">
                        <SunButton><RefreshCcwDot/>更新</SunButton>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunCheckbox">
                        <SunCheckbox :model-value="false"/>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunSwitch">
                        <SunSwitch :model-value="false"/>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunControlGroup">
                        <SunControlGroup>
                            <SunRadioGroup>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                   <SunRadiobox v-bind="args" uid="Option A"/>
                                   <SunLabel :size="args.size">选项 A</SunLabel>
                                </label>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                   <SunRadiobox v-bind="args" uid="Option B"/>
                                   <SunLabel :size="args.size">选项 B</SunLabel>
                                </label>
                                <label style="display: flex; flex-wrap: nowrap; gap: 6px;">
                                   <SunRadiobox v-bind="args" uid="Option C" :disabled="checked === 'Option B'"/>
                                   <SunLabel :size="args.size">选项 C</SunLabel>
                                </label>
                            </SunRadioGroup>
                        </SunControlGroup>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunColorPicker">
                        <SunColorPicker :model-value="[1.0, 0.0, 0.0, 1.0]"/>
                    </SunInspectorRow>

                    <SunInspectorRow label="SunLineEdit">
                        <SunLineEdit />
                    </SunInspectorRow>

                    <SunInspectorRow label="SunTextarea">
                        <SunTextarea style="resize: vertical;"/>
                    </SunInspectorRow>

                </SunInspectorGrid>
			  		</SunPanelContainer>
			  </SunPanel>
			
		`,
    }),
    argTypes: {

    },
    args: {

    },
};