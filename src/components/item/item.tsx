import { Component, Prop, State, Watch } from '@stencil/core';

import autobind from '~decorators/autobind';
import { ItemData } from '~helpers/declarations';

enum ExpandedValues {
  NONE = -1,
  ITEM = 0,
  SUBVALUE = 1
}

@Component({
  tag: 'sti-item',
  styleUrl: 'item.pcss',
  shadow: true
})
export class Item {

  @Prop() item: ItemData = null;

  @Prop() print = false;

  @Prop() dark = false;

  @State() expanded = ExpandedValues.NONE;

  @Watch('item')
  protected itemChangeHandler(newValue: ItemData, oldValue: ItemData) {
    const oldLabel = oldValue ? oldValue.label : undefined;

    if (!newValue || newValue.label !== oldLabel) {
      this.expanded = ExpandedValues.NONE;
    }
  }

  protected hostData() {
    return {
      class: {
        dark: this.dark
      }
    };
  }

  @autobind
  private arrowClickHandlerBinder(expandedValueType) {
    return () => {
      this.expanded = this.expanded === expandedValueType ? ExpandedValues.NONE : expandedValueType;
    };
  }

  private renderChildList() {
    const item = this.expanded === ExpandedValues.ITEM ? this.item : this.item.subvalue;
    const items = item.expand.value;

    return (
      <div class="children">
        {
          items && items.length > 0 ?
            items.map(currentItem => (
              <sti-item item={currentItem} print={item.type === 'function'} dark={this.dark} />
            )) :
            <sti-message
              message="Object has no properties."
              dark={this.dark}
            />
        }
      </div>
    );
  }

  protected render() {
    return [
      (
        <div class="item">
          {
            this.item.expand.enable ?
              <sti-arrow
                direction={this.expanded === ExpandedValues.ITEM}
                onClick={this.arrowClickHandlerBinder(ExpandedValues.ITEM)}
                class="arrow"
              /> :
              null
          }
          <div class={{
            name: true,
            print: this.print
          }}>
            {this.item.label}
          </div>
          <sti-item-value
            class={{
              print: this.print
            }}
            canExpand={!!this.item.subvalue}
            expanded={this.expanded === ExpandedValues.SUBVALUE}
            onExpand={this.arrowClickHandlerBinder(ExpandedValues.SUBVALUE)}
            item={this.item.subvalue || this.item}
            dark={this.dark}
          />
        </div>
      ),
      this.expanded === ExpandedValues.NONE ? null : this.renderChildList()
    ];
  }
}
