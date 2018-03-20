import { Component, Prop, State } from '@stencil/core';

import autobind from '~decorators/autobind';
import { ItemData, ParsedCategoryData } from '~helpers/declarations';

@Component({
  tag: 'sti-category',
  styleUrl: 'category.pcss',
  shadow: true
})
export class Category {

  @Prop() category: ParsedCategoryData = null;

  @Prop() dark = false;

  @State() expanded = true;

  protected hostData() {
    return {
      class: {
        expanded: this.expanded,
        dark: this.dark
      }
    };
  }

  @autobind
  private headerClickHandler() {
    this.expanded = !this.expanded;
  }

  @autobind
  private renderChild(item: ItemData) {
    return (
      <sti-item item={item} class="item" dark={this.dark} />
    );
  }

  private renderChildList() {
    if (!this.expanded) {
      return null;
    }

    const actualMessage: string = this.category.items.length === 0 ?
      `${this.category.label} has no entries.` :
      '';

    return actualMessage ?
      <sti-message message={actualMessage} dark={this.dark} /> :
      this.category.items.map(this.renderChild);
  }

  protected render() {
    return (
      <div>
        <h3 class="header" onClick={this.headerClickHandler}>
          <sti-arrow class="arrow" direction={this.expanded} />
          <div class="label">
            {this.category.label}
          </div>
        </h3>
        {this.renderChildList()}
      </div>
    );
  }
}
