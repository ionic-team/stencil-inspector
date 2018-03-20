import { Component, State } from '@stencil/core';

import autobind from '~decorators/autobind';
import { Injector } from '~helpers/injector';
import { ParsedGroupData } from '~helpers/declarations';

@Component({
  tag: 'sti-main',
  styleUrl: 'main.pcss',
  shadow: true
})
export class Main {

  @State() component: ParsedGroupData = {
    status: {
      success: false,
      message: 'Loading...'
    },
    categories: []
  };

  @State() dark = false;

  @State() loading = true;

  protected componentWillLoad() {
    this.dark = chrome && chrome.devtools && chrome.devtools.panels && (chrome.devtools.panels as any).themeName === 'dark';

    Injector.Instance.register(this);
  }

  @autobind
  changeComponent(component: ParsedGroupData) {
    this.component = component;
    this.loading = false;
  }

  @autobind
  startLoading() {
    this.loading = true;
  }

  protected hostData() {
    return {
      class: {
        dark: this.dark
      }
    };
  }

  @autobind
  private renderChild(category) {
    return (
      <sti-category category={category} class="category" dark={this.dark} />
    );
  }

  protected render() {
    const {
      success,
      message
    } = this.component.status;

    let actualMessage = '';
    const itemsKeys = this.component.categories || [];

    if (!success) {
      actualMessage = message || 'Unknown Error';
    } else if (itemsKeys.length === 0) {
      actualMessage = `Component has no items.`;
    }

    return [
      <sti-logo class="logo" dark={this.dark} />,
      <h2 class="menu">
        <sti-refresh />
      </h2>,
      actualMessage ?
        <sti-message message={actualMessage} class="message" dark={this.dark} /> :
        itemsKeys.map(this.renderChild)
    ];
  }
}
